# syntax=docker/dockerfile:1

# Build from the repository root:
#   docker build -f apps/api/Dockerfile --platform linux/amd64 -t cro-api .

FROM node:24-alpine AS base
# Prisma's engines need OpenSSL. tini is used as the init process in the final image.
RUN apk add --no-cache openssl tini
WORKDIR /app

# Keep only cro-api and the workspaces it depends on. out/json holds just the
# package manifests, so the install layers stay cached until dependencies change.
FROM base AS prune
RUN npm install -g turbo@2.10.13
COPY . .
RUN turbo prune cro-api --docker

# The root prepare script runs husky, a dev tool that is not needed in an image.
FROM base AS deps
COPY --from=prune /app/out/json/ .
RUN npm pkg delete scripts.prepare && npm ci

FROM deps AS builder
COPY --from=prune /app/out/full/ .
RUN npm run prisma:generate && npx turbo run build --filter=cro-api

FROM base AS prod-deps
COPY --from=prune /app/out/json/ .
RUN npm pkg delete scripts.prepare && npm ci --omit=dev
COPY --from=prune /app/out/full/apps/api/src/prisma/schema.prisma apps/api/src/prisma/schema.prisma
RUN npm run prisma:generate

FROM base AS runner
ENV NODE_ENV=production
COPY --from=prod-deps /app/ .
COPY --from=builder /app/packages/shared/dist packages/shared/dist
COPY --from=builder /app/apps/api/dist apps/api/dist
# Migrations ship with the image so a deploy can run prisma migrate deploy from it.
COPY --from=prune /app/out/full/apps/api/src/prisma/migrations apps/api/src/prisma/migrations

WORKDIR /app/apps/api
USER node
EXPOSE 3000
# The kernel ignores signals sent to PID 1 unless a handler is set, and Nest re-sends
# SIGTERM to itself after closing. As PID 1, node would hang until it was killed.
ENTRYPOINT ["/sbin/tini", "--"]
CMD ["node", "dist/apps/api/src/main.js"]
