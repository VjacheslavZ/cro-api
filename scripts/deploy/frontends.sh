#!/usr/bin/env bash
# Builds the web app and the admin panel against the production API and
# publishes each one to its S3 bucket behind CloudFront:
#   1. hashed files from dist/assets, cached for a year;
#   2. index.html and the other root files, revalidated on every visit;
#   3. a CloudFront invalidation, so the edge caches pick up the new index.html.
# Old hashed files are kept: tabs still running the previous build load their
# chunks lazily, and a deleted chunk would come back as index.html.
#
# CodeBuild runs it from buildspec.yml after the API deploy. For a manual run,
# install dependencies first and set the two distribution IDs.
set -euo pipefail

API_URL=https://api.cor-learn.site
: "${WEB_DISTRIBUTION_ID:?Set WEB_DISTRIBUTION_ID to the CloudFront distribution of the web app}"
: "${ADMIN_DISTRIBUTION_ID:?Set ADMIN_DISTRIBUTION_ID to the CloudFront distribution of the admin panel}"

export AWS_REGION=${AWS_REGION:-eu-north-1}
export AWS_PAGER=''

cd "$(dirname "$0")/../.."

publish() {
  local workspace=$1 dist=$2 bucket=$3 distribution=$4

  echo "==> $workspace"
  VITE_API_URL=$API_URL npm run build -w "$workspace"
  aws s3 sync "$dist/assets" "s3://$bucket/assets" --no-progress \
    --cache-control 'public, max-age=31536000, immutable'
  aws s3 sync "$dist" "s3://$bucket" --no-progress --exclude 'assets/*' --delete \
    --cache-control 'no-cache'
  aws cloudfront create-invalidation --distribution-id "$distribution" --paths '/*' \
    --query 'Invalidation.[Id, Status]' --output text
}

publish cro-web apps/web/dist cor-learn-web "$WEB_DISTRIBUTION_ID"
publish cro-admin apps/admin/dist cor-learn-admin "$ADMIN_DISTRIBUTION_ID"
