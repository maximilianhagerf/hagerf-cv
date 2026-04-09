# syntax=docker/dockerfile:1

# ─── deps: install all dependencies ──────────────────────────────────────────
FROM node:22-alpine AS deps

RUN corepack enable && corepack prepare pnpm@9.15.0 --activate

WORKDIR /app

COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY apps/web/package.json ./apps/web/package.json
COPY packages/cv-renderer/package.json ./packages/cv-renderer/package.json
COPY packages/hagerf-cv/package.json ./packages/hagerf-cv/package.json

RUN pnpm install --frozen-lockfile

# ─── build: compile the full monorepo ────────────────────────────────────────
FROM deps AS build

COPY . .

RUN pnpm turbo build

# ─── runtime: minimal production image ───────────────────────────────────────
FROM node:22-alpine AS runtime

WORKDIR /app

# Copy the Nitro server output from the web app
COPY --from=build /app/apps/web/.output ./

ENV NODE_ENV=production
ENV PORT=3000

EXPOSE 3000

CMD ["node", "server/index.mjs"]
