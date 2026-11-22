# Build from the repository root: docker build -f apps/worker/Dockerfile .
FROM node:26-alpine
ENV NODE_ENV=production
RUN corepack enable
WORKDIR /repo
COPY . .
RUN pnpm install --frozen-lockfile --prod --filter @the-manager/worker...
WORKDIR /repo/apps/worker
USER node
CMD ["node", "src/index.ts"]
