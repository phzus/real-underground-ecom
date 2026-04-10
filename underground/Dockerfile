FROM node:22-alpine AS base

RUN corepack enable && corepack prepare pnpm@10.28.2 --activate
WORKDIR /app

# ------- deps -------
FROM base AS deps
COPY package.json pnpm-lock.yaml .npmrc ./
RUN pnpm install --frozen-lockfile

# ------- build -------
FROM base AS build
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN pnpm run build

# ------- production -------
FROM base AS production
ENV NODE_ENV=production

COPY --from=build /app/.medusa/server ./server

WORKDIR /app/server
RUN pnpm install --prod

EXPOSE 9000
ENTRYPOINT ["sh", "-c", "npx medusa db:migrate && npx medusa start"]
