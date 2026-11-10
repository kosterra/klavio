# syntax=docker/dockerfile:1

# The base image, pinned by digest so every build – and every scanner pass – uses
# the exact same Node, not whatever a floating tag resolves to. This is
# node:24-alpine (Node 24.22.2) as of 2026-11-08. Bump tag and digest together
# when a High/Critical advisory hits Node or Alpine;
# `docker buildx imagetools inspect node:24-alpine` prints the current digest.
ARG NODE_IMAGE=node:24-alpine@sha256:a34ab6d7f6f4813f4d0c5469d74685604b962fbdbf5793a7bc7b4998ecb867c8

# ---------------------------------------------------------------- dependencies
FROM ${NODE_IMAGE} AS deps
WORKDIR /app
COPY package.json package-lock.json ./
COPY shared/package.json shared/
COPY server/package.json server/
COPY client/package.json client/
# no install scripts of dependencies (none is needed for the build)
RUN npm ci --ignore-scripts --no-audit --no-fund

# ----------------------------------------------------------------------- build
FROM deps AS build
COPY . .
# true only for the release build of main (.github/workflows/release.yml): any
# other build shows the changes of «Next release» as coming soon
ARG APP_RELEASED=false
ENV APP_RELEASED=$APP_RELEASED
RUN npm run build --workspace server && npm run build --workspace client

# ------------------------------------------------------------------ production
# One image for app and API (kosterra/klavio): the server answers /api and
# serves the built client from STATIC_DIR. TLS comes from a reverse proxy in
# front (Caddy in docker-compose.yml, or any other).
FROM ${NODE_IMAGE} AS production
WORKDIR /app
ENV NODE_ENV=production \
    STATIC_DIR=/app/public \
    HOST=0.0.0.0 \
    PORT=3100
# the security fixes of the base image's packages, also on a rebuild without a new version
RUN apk upgrade --no-cache
COPY package.json package-lock.json ./
COPY shared/package.json shared/
COPY server/package.json server/
COPY client/package.json client/
RUN npm ci --ignore-scripts --omit=dev --workspace server --include-workspace-root=false --no-audit --no-fund \
    && npm cache clean --force
COPY --from=build /app/server/dist server/dist
COPY --from=build /app/client/dist public
USER node
EXPOSE 3100
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD wget -qO- http://127.0.0.1:3100/api/health >/dev/null || exit 1
CMD ["node", "--enable-source-maps", "server/dist/server.js"]
