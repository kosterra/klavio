# syntax=docker/dockerfile:1

# ---------------------------------------------------------------- dependencies
FROM node:24-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
COPY shared/package.json shared/
COPY server/package.json server/
COPY client/package.json client/
RUN npm ci

# ----------------------------------------------------------------------- build
FROM deps AS build
COPY . .
RUN npm run build --workspace server && npm run build --workspace client

# ---------------------------------------------------------------------- server
FROM node:24-alpine AS server
WORKDIR /app
ENV NODE_ENV=production
COPY package.json package-lock.json ./
COPY shared/package.json shared/
COPY server/package.json server/
COPY client/package.json client/
RUN npm ci --omit=dev --workspace server --include-workspace-root=false && npm cache clean --force
COPY --from=build /app/server/dist server/dist
USER node
EXPOSE 3100
CMD ["node", "--enable-source-maps", "server/dist/server.js"]

# ------------------------------------------------- web (static client + proxy)
FROM caddy:2-alpine AS web
COPY Caddyfile /etc/caddy/Caddyfile
COPY --from=build /app/client/dist /srv
