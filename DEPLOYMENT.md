# FHDTS CICD优化总结文档

## 📋 概述

本文档总结了FHDTS项目的CICD和部署优化工作。通过本次优化，我们实现了：

1. **统一的环境变量管理** - 开发/生产环境自动适配
2. **简化的部署流程** - 单一服务器部署机制
3. **安全的数据库配置** - 生产环境固定PostgreSQL，不对外暴露端口
4. **完整的CICD流水线** - GitHub Actions自动化部署
5. **优化的Docker配置** - Node.js 24 + 多阶段构建

## 🏗️ 架构设计

### 环境模式

#### 开发环境 (NODE_ENV=development)
- **数据库**: SQLite (`file:./dev.db`)
- **配置**: 自动使用默认值，无需`.env`文件
- **启动**: `pnpm dev` 直接运行
- **特点**: 零配置启动，适合快速开发

#### 生产环境 (NODE_ENV=production)
- **数据库**: PostgreSQL (Docker Compose内部固定连接)
- **连接**: `postgresql://digitaltwin:digitaltwin_prod_password@postgres:5432/digitaltwin`
- **安全**: 数据库端口不对外暴露，仅内部网络访问
- **维护**: 通过SSH隧道连接

### 数据库策略

```
开发环境: SQLite (文件数据库)
    ↓
生产环境: PostgreSQL (容器化)
    ├── 固定连接凭证
    ├── 内部网络访问
    ├── 不暴露外部端口
    └── SSH隧道维护访问
```

## 🔧 技术栈更新

### 版本升级
- **Node.js**: 20 → 24 (LTS版本)
- **Docker**: 多阶段构建优化
- **PNPM**: 9.x 包管理器

### 关键配置
```dockerfile
# Dockerfile - 多阶段构建
FROM node:24-alpine AS builder    # 构建阶段
FROM node:24-alpine               # 生产阶段
```

## 🚀 CICD流水线

### GitHub Actions 工作流

**触发条件**:
- 推送到 `main` 分支
- 创建 `v*` 标签
- 手动触发

**工作流程**:
1. **测试阶段** (`setup-and-test`)
   - 代码检查 (lint, typecheck)
   - 单元测试
   - 构建验证

2. **构建阶段** (`build-and-push`)
   - Docker镜像构建
   - 推送到GitHub Container Registry
   - 多架构支持 (linux/amd64, linux/arm64)

3. **部署阶段** (`deploy`)
   - SSH连接到服务器
   - 更新docker-compose配置
   - 拉取最新镜像
   - 重启服务
   - 健康检查验证

### 环境变量配置 (GitHub Secrets)

| 变量名 | 必需 | 说明 |
|--------|------|------|
| `DEPLOY_HOST` | ✅ | 服务器地址 |
| `DEPLOY_USER` | ✅ | SSH用户名 |
| `DEPLOY_KEY` | ✅ | SSH私钥 |
| `JWT_SECRET` | ✅ | JWT签名密钥 (≥32字符) |
| `CORS_ORIGIN` | ⚠️ | CORS允许的源 (默认: `*`) |
| `JWT_EXPIRES_IN` | ⚠️ | JWT过期时间 (默认: `7d`) |

## 📁 文件结构更新

### 新增文件
```
FHDTS/
├── scripts/
│   ├── deploy.sh              # 服务器部署脚本
│   ├── check-env.js           # 环境检查工具
│   └── init-production-db.js  # 生产数据库初始化
├── .github/workflows/
│   └── deploy.yml             # GitHub Actions配置
├── docker/
│   └── Dockerfile             # 优化的Docker配置
├── docker-compose.yml         # 简化的Compose配置
└── .env.example               # 更新的环境变量模板
```

### 修改文件
```
FHDTS/
├── apps/server/src/shared/infra/env.ts    # 环境变量管理系统
├── apps/server/src/main.ts                # 增强的健康检查
├── apps/web/src/lib/env.ts                # 客户端环境配置
├── package.json                           # 新增脚本命令
└── README.md                             # 更新部署文档
```

## 🛠️ 使用指南

### 开发环境
```bash
# 1. 克隆项目
git clone git@github.com:fire-disposal/FHDTS.git
cd FHDTS

# 2. 安装依赖
pnpm install

# 3. 启动开发服务器
pnpm dev

# 4. 环境检查
pnpm check:env
```

### 生产部署

#### 自动部署 (推荐)
1. 配置GitHub Secrets
2. 推送代码到 `main` 分支
3. GitHub Actions自动部署

#### 手动部署
```bash
# 1. 初始服务器设置
./scripts/deploy.sh --setup

# 2. 配置环境变量
cd /opt/digital-twin
cp .env.example .env
# 编辑 .env 文件，设置 JWT_SECRET

# 3. 部署应用
./scripts/deploy.sh

# 4. 验证部署
curl http://localhost:3000/api/health
```

### 数据库维护
```bash
# 建立SSH隧道
ssh -L 5432:localhost:5432 user@your-server -N

# 连接信息
# 主机: localhost
# 端口: 5432
# 用户: digitaltwin
# 密码: digitaltwin_prod_password
# 数据库: digitaltwin

# 备份数据库
./scripts/deploy.sh --backup
```

## 🔒 安全特性

### 数据库安全
- ✅ 固定连接凭证
- ✅ 内部网络访问
- ✅ 不暴露外部端口
- ✅ SSH隧道访问控制

### 应用安全
- ✅ JWT密钥长度验证 (≥32字符)
- ✅ 生产环境强制配置检查
- ✅ 非root用户运行容器
- ✅ 健康检查端点

### 部署安全
- ✅ GitHub Secrets管理敏感信息
- ✅ SSH密钥认证
- ✅ 镜像签名验证
- ✅ 回滚机制

## 📊 监控和维护

### 健康检查
```bash
# 应用健康
curl http://your-server:3000/api/health

# 部署信息
curl http://your-server:3000/api/info

# 容器状态
docker compose -f /opt/digital-twin/docker-compose.yml ps
```

### 日志查看
```bash
# 实时应用日志
docker compose logs -f app

# 数据库日志
docker compose logs -f postgres

# 查看特定时间日志
docker compose logs --since 1h app
```

### 性能监控
```bash
# 容器资源使用
docker stats

# 数据库大小
docker compose exec postgres psql -U digitaltwin -d digitaltwin \
  -c "SELECT pg_size_pretty(pg_database_size('digitaltwin'));"

# 连接数监控
docker compose exec postgres psql -U digitaltwin -d digitaltwin \
  -c "SELECT count(*) FROM pg_stat_activity;"
```

## 🔄 故障排除

### 常见问题

#### 1. 部署失败
```bash
# 查看部署日志
docker compose logs app

# 检查服务状态
docker compose ps

# 手动重启服务
docker compose restart app
```

#### 2. 数据库连接问题
```bash
# 检查数据库容器
docker compose ps postgres

# 查看数据库日志
docker compose logs postgres

# 测试数据库连接
docker compose exec postgres pg_isready -U digitaltwin
```

#### 3. 环境变量问题
```bash
# 检查环境变量
docker compose exec app env | grep -E "(NODE_ENV|JWT_SECRET)"

# 重新加载配置
docker compose down
docker compose up -d
```

### 回滚操作
```bash
# 回滚到上一个版本
./scripts/deploy.sh --rollback

# 或指定版本
./scripts/deploy.sh -v v1.0.0
```

## 🎯 优化成果

### 开发体验提升
- ✅ 零配置启动开发环境
- ✅ 自动数据库选择 (SQLite/PostgreSQL)
- ✅ 友好的错误提示
- ✅ 环境检查工具

### 部署效率提升
- ✅ 单命令部署
- ✅ 自动化CICD流水线
- ✅ 快速回滚机制
- ✅ 健康检查自动化

### 安全性提升
- ✅ 生产数据库隔离
- ✅ 敏感信息加密存储
- ✅ 最小权限原则
- ✅ 安全审计日志

### 可维护性提升
- ✅ 统一配置管理
- ✅ 清晰的文档
- ✅ 自动化测试
- ✅ 监控和告警

## 📈 后续优化建议

### 短期 (1-2个月)
1. **日志聚合** - 集成ELK栈或类似方案
2. **监控告警** - 添加Prometheus + Grafana
3. **备份自动化** - 定时数据库备份到云存储

### 中期 (3-6个月)
1. **蓝绿部署** - 实现零停机部署
2. **多环境支持** - 如果需要测试/预发布环境
3. **容器编排** - 迁移到Kubernetes

### 长期 (6个月以上)
1. **多云部署** - 支持多个云提供商
2. **自动伸缩** - 基于负载自动扩展
3. **服务网格** - 实现微服务架构

## 📞 支持与联系

### 问题反馈
- GitHub Issues: https://github.com/fire-disposal/FHDTS/issues
- 文档更新: 提交PR到 `DEPLOYMENT.md`

### 紧急支持
1. 查看部署日志: `docker compose logs -f`
2. 回滚到稳定版本: `./scripts/deploy.sh --rollback`
3. 联系维护团队

---

**文档版本**: 1.0.0  
**最后更新**: 2024年3月  
**维护团队**: FHDTS开发团队  
**状态**: ✅ 生产就绪