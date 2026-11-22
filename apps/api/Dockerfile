# Build from the repository root: docker build -f apps/api/Dockerfile .
FROM node:26-alpine
ENV NODE_ENV=production
RUN corepack enable
WORKDIR /repo
COPY . .
RUN pnpm install --frozen-lockfile --prod --filter @the-manager/api...
WORKDIR /repo/apps/api
USER node
EXPOSE 3000
CMD ["node", "src/server.ts"]
