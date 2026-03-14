# 使用多阶段构建优化Docker镜像
# 第一阶段：构建阶段
FROM node:24-alpine AS builder
WORKDIR /app

# 启用corepack和pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"

# 复制依赖文件（优化缓存层）
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json ./
COPY apps/server/package.json ./apps/server/
COPY apps/web/package.json ./apps/web/

# 安装所有依赖（包括开发依赖）
RUN pnpm install --frozen-lockfile

# 复制源代码
COPY . .

# 设置构建环境变量
ARG NODE_ENV=production
ENV NODE_ENV=${NODE_ENV}

# 构建应用
RUN pnpm build

# 第二阶段：生产阶段
FROM node:24-alpine
WORKDIR /app
ENV NODE_ENV=production

# 创建非root用户（安全最佳实践）
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# 复制必要的运行时文件
COPY --from=builder --chown=nodejs:nodejs /app/apps/server/dist ./dist
COPY --from=builder --chown=nodejs:nodejs /app/apps/web/dist ./public
COPY --from=builder --chown=nodejs:nodejs /app/apps/server/prisma ./prisma
COPY --from=builder --chown=nodejs:nodejs /app/apps/server/package.json ./package.json

# 安装生产依赖
RUN npm install --production

# 健康检查
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/api/health || exit 1

# 切换到非root用户
USER nodejs

# 暴露端口
EXPOSE 3000

# 启动命令
CMD ["node", "dist/main.js"]
