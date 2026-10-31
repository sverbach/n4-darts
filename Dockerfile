# One image: Node server + built web app (docs/architecture/07-deployment-view.md).
FROM node:24-alpine AS build
WORKDIR /app
ENV CI=true
RUN npm install -g pnpm@12.14.0

# Install dependencies first so source edits don't invalidate this layer.
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/engine/package.json packages/engine/
COPY packages/server/package.json packages/server/
COPY packages/web/package.json packages/web/
COPY packages/e2e/package.json packages/e2e/
COPY tools/board-sim/package.json tools/board-sim/
RUN pnpm install --frozen-lockfile

COPY . .
RUN pnpm build && pnpm install --prod --frozen-lockfile

FROM node:24-alpine
WORKDIR /app
ENV NODE_ENV=production PORT=3000 DATA_DIR=/data
COPY --from=build /app /app
RUN mkdir -p /data && chown node:node /data
USER node
VOLUME /data
EXPOSE 3000
CMD ["node", "packages/server/dist/main.js"]
