FROM node:20-alpine AS builder
WORKDIR /app
RUN corepack enable && corepack prepare pnpm@9 --activate
ENV PNPM_HOME="/pnpm"
COPY . .
RUN pnpm install --frozen-lockfile
RUN pnpm build

FROM node:20-alpine
WORKDIR /app
ENV NODE_ENV=production

RUN corepack enable && corepack prepare pnpm@9 --activate
ENV PNPM_HOME="/pnpm"

COPY --from=builder /app/apps/server/dist ./dist
COPY --from=builder /app/apps/web/dist ./public
COPY --from=builder /app/packages/db/prisma ./prisma
COPY --from=builder /app/node_modules/.pnpm/prisma@5.22.0/node_modules/prisma ./node_modules/prisma
COPY --from=builder /app/node_modules/.pnpm/@prisma+client@5.22.0_prisma@5.22.0/node_modules/@prisma/client ./node_modules/@prisma/client

EXPOSE 3000 5858
CMD ["node", "dist/main.js"]
