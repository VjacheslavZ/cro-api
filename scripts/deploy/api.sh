#!/usr/bin/env bash
# Deploys the API at the current commit to ECS Fargate:
#   1. builds the image and pushes it to ECR, unless that tag is already there;
#   2. registers a task definition revision that differs from the running one
#      only in the image;
#   3. runs `prisma migrate deploy` as a one-off task of that revision, and stops
#      if it fails, before the service is touched;
#   4. rolls the service out to the new revision and fails unless the rollout
#      completes, including when the circuit breaker rolls it back.
#
# CodeBuild runs it from buildspec.yml on every push to main. It also works
# from a laptop after `aws login`, for a manual deploy of a clean checkout.
set -euo pipefail

CLUSTER=cro-cluster
SERVICE=cro-api
CONTAINER=api
REPOSITORY=cro-api
MIGRATE_COMMAND='["npx", "prisma", "migrate", "deploy", "--schema=src/prisma/schema.prisma"]'
ROLLOUT_TIMEOUT_SECONDS=1200

export AWS_REGION=${AWS_REGION:-eu-north-1}
export AWS_PAGER=''

cd "$(dirname "$0")/../.."

# Prints the service's five latest events, which explain a failed rollout.
print_service_events() {
  aws ecs describe-services --cluster "$CLUSTER" --services "$SERVICE" \
    --query 'services[0].events[:5].[createdAt, message]' --output text >&2
}

if [ -n "${CODEBUILD_RESOLVED_SOURCE_VERSION:-}" ]; then
  TAG=$CODEBUILD_RESOLVED_SOURCE_VERSION
else
  # The tag names a commit, so the image must not contain uncommitted changes.
  if [ -n "$(git status --porcelain)" ]; then
    echo "The working tree has uncommitted changes. Commit or stash them first." >&2
    exit 1
  fi
  TAG=$(git rev-parse HEAD)
fi

ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
REGISTRY=$ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com
IMAGE=$REGISTRY/$REPOSITORY:$TAG

WORKDIR=$(mktemp -d)
trap 'rm -rf "$WORKDIR"' EXIT

echo "==> Image $REPOSITORY:$TAG"
# Tags are immutable, so a rerun after a later step failed reuses the image.
if aws ecr describe-images --repository-name "$REPOSITORY" --image-ids "imageTag=$TAG" >/dev/null 2>&1; then
  echo "Already in ECR, skipping the build."
else
  aws ecr get-login-password | docker login --username AWS --password-stdin "$REGISTRY"
  # --provenance=false pushes a single image manifest without an attestation.
  # The base image comes from ECR Public, which serves AWS compute without the
  # per-IP limits that Docker Hub applies to CodeBuild's shared addresses.
  docker buildx build --platform linux/amd64 --provenance=false \
    --build-arg NODE_IMAGE=public.ecr.aws/docker/library/node:24-alpine \
    -f apps/api/Dockerfile -t "$IMAGE" --push .
fi

echo "==> Task definition"
# The running revision is the base, so settings changed by hand carry over.
CURRENT_TASK_DEFINITION=$(aws ecs describe-services --cluster "$CLUSTER" --services "$SERVICE" \
  --query 'services[0].taskDefinition' --output text)
aws ecs describe-task-definition --task-definition "$CURRENT_TASK_DEFINITION" \
  --query taskDefinition >"$WORKDIR/current.json"
# Keeps only the fields RegisterTaskDefinition accepts and swaps the image.
jq --arg image "$IMAGE" --arg container "$CONTAINER" '
  if ([.containerDefinitions[] | select(.name == $container)] | length) != 1
  then error("expected exactly one container named \($container)") else . end
  | {family, taskRoleArn, executionRoleArn, networkMode, containerDefinitions, volumes,
     placementConstraints, requiresCompatibilities, cpu, memory, runtimePlatform,
     ephemeralStorage, pidMode, ipcMode, proxyConfiguration}
  | with_entries(select(.value != null))
  | .containerDefinitions |= map(if .name == $container then .image = $image else . end)
' "$WORKDIR/current.json" >"$WORKDIR/next.json"
NEW_TASK_DEFINITION=$(aws ecs register-task-definition --cli-input-json "file://$WORKDIR/next.json" \
  --query taskDefinition.taskDefinitionArn --output text)
echo "Registered ${NEW_TASK_DEFINITION##*/}, based on ${CURRENT_TASK_DEFINITION##*/}."

echo "==> Migrations"
# Same subnets, security group and public IP setting as the service's tasks.
NETWORK=$(aws ecs describe-services --cluster "$CLUSTER" --services "$SERVICE" \
  --query 'services[0].networkConfiguration' --output json)
OVERRIDES=$(jq -n --arg container "$CONTAINER" --argjson command "$MIGRATE_COMMAND" \
  '{containerOverrides: [{name: $container, command: $command}]}')
aws ecs run-task --cluster "$CLUSTER" --task-definition "$NEW_TASK_DEFINITION" \
  --launch-type FARGATE --network-configuration "$NETWORK" --overrides "$OVERRIDES" \
  --started-by deploy-migrations --output json >"$WORKDIR/run-task.json"
TASK_ARN=$(jq -r '.tasks[0].taskArn // empty' "$WORKDIR/run-task.json")
if [ -z "$TASK_ARN" ]; then
  echo "The migration task did not start:" >&2
  jq '.failures' "$WORKDIR/run-task.json" >&2
  exit 1
fi
echo "Started task ${TASK_ARN##*/}, waiting for it to finish..."
aws ecs wait tasks-stopped --cluster "$CLUSTER" --tasks "$TASK_ARN"

aws ecs describe-tasks --cluster "$CLUSTER" --tasks "$TASK_ARN" \
  --query 'tasks[0].[containers[0].exitCode, stoppedReason]' --output text >"$WORKDIR/task-result.txt"
read -r EXIT_CODE STOPPED_REASON <"$WORKDIR/task-result.txt"
LOG_GROUP=$(jq -r --arg container "$CONTAINER" \
  '.containerDefinitions[] | select(.name == $container) | .logConfiguration.options["awslogs-group"]' "$WORKDIR/next.json")
LOG_PREFIX=$(jq -r --arg container "$CONTAINER" \
  '.containerDefinitions[] | select(.name == $container) | .logConfiguration.options["awslogs-stream-prefix"]' "$WORKDIR/next.json")
aws logs get-log-events --log-group-name "$LOG_GROUP" \
  --log-stream-name "$LOG_PREFIX/$CONTAINER/${TASK_ARN##*/}" \
  --query 'events[].message' --output text 2>/dev/null | tr '\t' '\n' || true
if [ "$EXIT_CODE" != "0" ]; then
  echo "Migrations failed (exit code $EXIT_CODE: $STOPPED_REASON). The service was not changed." >&2
  exit 1
fi

echo "==> Rollout"
aws ecs update-service --cluster "$CLUSTER" --service "$SERVICE" \
  --task-definition "$NEW_TASK_DEFINITION" >/dev/null
# Waits on the deployment of the new revision rather than on `services-stable`:
# after a circuit breaker rollback the service is stable again, on the old revision.
DEADLINE=$((SECONDS + ROLLOUT_TIMEOUT_SECONDS))
while true; do
  aws ecs describe-services --cluster "$CLUSTER" --services "$SERVICE" \
    --query "services[0].deployments[?taskDefinition=='$NEW_TASK_DEFINITION'] | [0].[rolloutState, rolloutStateReason]" \
    --output text >"$WORKDIR/rollout.txt"
  read -r ROLLOUT_STATE ROLLOUT_REASON <"$WORKDIR/rollout.txt"
  case $ROLLOUT_STATE in
    COMPLETED)
      echo "Rollout of ${NEW_TASK_DEFINITION##*/} completed."
      break
      ;;
    FAILED | None)
      echo "Rollout of ${NEW_TASK_DEFINITION##*/} failed: ${ROLLOUT_REASON:-the deployment was replaced}." >&2
      print_service_events
      exit 1
      ;;
  esac
  if [ "$SECONDS" -ge "$DEADLINE" ]; then
    echo "Rollout did not finish in $ROLLOUT_TIMEOUT_SECONDS seconds (state $ROLLOUT_STATE)." >&2
    print_service_events
    exit 1
  fi
  sleep 15
done
