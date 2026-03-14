# FHDTS - 居家健康数字孪生系统

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18.2-blue)](https://react.dev/)
[![Ant Design](https://img.shields.io/badge/Ant_Design-5.15-blue)](https://ant.design/)

**Family Health Digital Twin System** - 基于数字孪生技术的居家健康管理平台，实现患者健康数据实时采集、分析与可视化展示。

## 🌟 功能特性

### 已实现

- ✅ **认证授权系统**
  - JWT 令牌认证 + Refresh Token
  - 三种角色（Admin/Caregiver/Family）
  - 基于角色的权限控制（RBAC）

- ✅ **用户管理**
  - 用户 CRUD 操作
  - 密码重置功能
  - 账号状态管理（激活/停用）

- ✅ **患者管理**
  - 患者档案 CRUD
  - 护理人员关联
  - 搜索与筛选
  - 分页展示

- ✅ **健康数据观察**
  - 生命体征数据采集（血压/心率/血糖/血氧/体温）
  - 异常值自动告警
  - 历史数据查询
  - 统计数据展示

- ✅ **管理后台 UI**
  - Ant Design 5 组件库
  - 响应式布局
  - 加载/空状态处理
  - ProTable 高级表格

- ✅ **数字孪生场景**
  - Three.js 3D 渲染
  - React Three Fiber 集成
  - 相机轨道控制

### 开发中

- ⏳ 设备管理后端
- ⏳ IoT 数据入库
- ⏳ 健康数据趋势图表
- ⏳ 实时告警推送

## 🛠️ 技术栈

### 后端

| 技术 | 版本 | 说明 |
|------|------|------|
| **Runtime** | Node.js 20+ | JavaScript 运行时 |
| **Framework** | Fastify | 高性能 Web 框架 |
| **API** | tRPC | 端到端类型安全 |
| **ORM** | Prisma | 类型安全数据库访问 |
| **Database** | PostgreSQL | 关系型数据库 |
| **Auth** | JWT + bcrypt | 认证与加密 |
| **IoT** | TCP Server + MsgPack | 设备通信协议 |

### 前端

| 技术 | 版本 | 说明 |
|------|------|------|
| **Framework** | React 18 | UI 框架 |
| **Language** | TypeScript 5.3 | 类型安全 |
| **UI Library** | Ant Design 5 | 企业级组件库 |
| **Pro Components** | 2.8 | 高级组件（ProTable/ProForm） |
| **State** | Zustand | 轻量状态管理 |
| **Server State** | React Query 5 | 服务端状态管理 |
| **Router** | React Router 6 | 路由管理 |
| **3D** | Three.js + R3F | 3D 渲染引擎 |

### 开发工具

| 工具 | 说明 |
|------|------|
| **Turborepo** | Monorepo 构建系统 |
| **Biome** | 代码质量工具（替代 ESLint/Prettier） |
| **pnpm** | 快速包管理器 |
| **Vitest** | 单元测试框架 |

## 📦 项目结构

```
novadt/
├── apps/
│   ├── server/           # 后端应用
│   │   ├── src/
│   │   │   ├── modules/  # 业务模块 (DDD)
│   │   │   │   ├── auth/
│   │   │   │   ├── user/
│   │   │   │   ├── patient/
│   │   │   │   └── observation/
│   │   │   ├── shared/   # 共享基础设施
│   │   │   │   ├── infra/  # 数据库、认证
│   │   │   │   └── kernel/ # 基类抽象
│   │   │   ├── trpc/     # tRPC 配置
│   │   │   └── main.ts   # 入口文件
│   │   └── package.json
│   │
│   └── web/              # 前端应用
│       ├── src/
│       │   ├── components/ # UI 组件
│       │   ├── hooks/      # 自定义 Hooks
│       │   ├── lib/        # 核心库 (trpc, env)
│       │   ├── pages/      # 页面组件
│       │   ├── stores/     # Zustand 状态
│       │   └── types/      # 类型定义
│       └── package.json
│
├── packages/
│   ├── config/           # 共享配置 (TypeScript)
│   └── shared/           # 共享类型和工具
│
├── docker/               # Docker 配置
├── scripts/              # 脚本工具
└── turbo.json            # Turborepo 配置
```

## 🚀 快速开始

### 环境要求

- Node.js 20+
- PostgreSQL 14+
- pnpm 8+

### 安装依赖

```bash
# 克隆仓库
git clone git@github.com:fire-disposal/FHDTS.git
cd FHDTS

# 安装依赖
pnpm install
```

### 配置环境变量

```bash
# 开发环境：无需配置，直接运行即可
# 生产环境：根据部署方式配置

# 开发环境（默认）：
# - 自动使用SQLite数据库 (file:./dev.db)
# - JWT使用开发默认密钥
# - 无需创建 .env 文件

# Docker Compose生产部署：
# - 数据库自动配置为固定PostgreSQL实例
# - 连接：postgresql://digitaltwin:digitaltwin_prod_password@postgres:5432/digitaltwin
# - 数据库不对外暴露端口，仅内部访问
# - 必须设置 JWT_SECRET 环境变量

# 必需变量（生产环境）：
# JWT_SECRET=your-32-characters-minimum-secret-key

# 可选变量：
# PORT=3000
# CORS_ORIGIN=http://localhost:5173
# VITE_API_URL=http://localhost:3000
# NODE_ENV=production
```

### 初始化数据库

```bash
# 开发环境（SQLite）：
pnpm --filter server db:generate
pnpm --filter server db:push
pnpm --filter server seed

# 生产环境（Docker Compose PostgreSQL）：
# 1. 启动Docker Compose服务
docker compose up -d

# 2. 进入应用容器执行数据库迁移
docker compose exec app node -e "
  const { execSync } = require('child_process');
  console.log('正在初始化生产数据库...');
  execSync('npx prisma db push', { stdio: 'inherit' });
  execSync('node dist/seed.js', { stdio: 'inherit' });
  console.log('数据库初始化完成');
"

# 3. 通过SSH隧道连接数据库（维护用）：
# ssh -L 5432:localhost:5432 user@server -N
# 然后使用数据库客户端连接 localhost:5432
# 用户名：digitaltwin
# 密码：digitaltwin_prod_password
# 数据库：digitaltwin
```

### 启动开发服务

```bash
# 启动所有服务（前端 + 后端）
pnpm dev

# 或分别启动
pnpm --filter server dev    # 后端 (http://localhost:3000)
pnpm --filter web dev       # 前端 (http://localhost:5173)
```

### 默认账号

| 角色 | 邮箱 | 密码 |
|------|------|------|
| 管理员 | admin@example.com | admin123 |
| 护理人员 | caregiver@example.com | user123 |
| 家属 | family@example.com | user123 |

## 🚀 生产部署

### 自动部署 (GitHub Actions)

项目配置了简化的CI/CD流水线，专注于Docker化部署：

1. **触发条件**：
   - 推送到 `main` 分支
   - 创建 `v*` 标签（如 `v1.0.0`）
   - 手动触发 workflow

2. **部署流程**：
   - ✅ 代码检查和类型检查
   - ✅ 单元测试
   - ✅ 构建应用
   - ✅ 构建Docker镜像（多阶段构建）
   - ✅ 推送到GitHub Container Registry
   - ✅ SSH自动部署到服务器

3. **GitHub Secrets配置**：
   ```yaml
   DEPLOY_HOST: "服务器IP地址"
   DEPLOY_USER: "ssh用户名"
   DEPLOY_KEY: "ssh私钥"
   JWT_SECRET: "JWT签名密钥（至少32字符）"
   # 可选：
   CORS_ORIGIN: "*"
   JWT_EXPIRES_IN: "7d"
   ```

### 服务器设置

#### 1. 初始设置（一次性）
```bash
# 在服务器上运行
cd /opt
git clone https://github.com/fire-disposal/FHDTS.git digital-twin
cd digital-twin

# 创建环境配置文件
cp .env.example .env
# 编辑 .env 文件，设置 JWT_SECRET 等变量

# 启动服务
docker compose up -d
```

#### 2. 后续部署
```bash
# 方法1：使用GitHub Actions自动部署（推荐）
# 推送代码到main分支即可

# 方法2：手动在服务器上部署
cd /opt/digital-twin
./scripts/deploy-server.sh
```

#### 3. 部署验证
```bash
# 检查服务状态
curl http://localhost:3000/api/health

# 查看容器日志
docker compose logs -f app

# 查看服务状态
docker compose ps
```

### 生产环境架构

```
┌─────────────────────────────────────────────┐
│             生产服务器                      │
│  ┌─────────────┐  ┌─────────────┐        │
│  │  应用容器   │  │ PostgreSQL  │        │
│  │  (Node.js)  │  │  容器       │        │
│  │             │  │             │        │
│  │ 端口: 3000  │  │ 端口: 内部  │        │
│  └──────┬──────┘  └──────┬──────┘        │
│         │                │               │
│         └────────────────┘               │
│                内部网络                   │
└─────────────────────────────────────────────┘
```

### 数据库访问

生产环境数据库**不对外暴露端口**，仅通过SSH隧道访问：

```bash
# 建立SSH隧道
ssh -L 5432:localhost:5432 user@your-server -N

# 连接数据库
# 主机: localhost
# 端口: 5432
# 用户: digitaltwin
# 密码: digitaltwin_prod_password
# 数据库: digitaltwin
```

### 健康检查

部署完成后验证服务状态：

```bash
# 检查服务状态
curl http://your-server:3000/api/health

# 查看部署信息
curl http://your-server:3000/api/info

# 查看容器日志
docker compose logs -f
```

### 监控和维护

1. **日志查看**：
   ```bash
   docker compose logs -f app          # 实时应用日志
   docker compose logs -f postgres     # 数据库日志
   ```

2. **服务管理**：
   ```bash
   docker compose ps                   # 查看服务状态
   docker compose restart app          # 重启应用
   docker compose down                 # 停止所有服务
   docker compose up -d                # 启动所有服务
   ```

3. **数据库维护**：
   ```bash
   # 执行数据库迁移
   docker compose exec app npx prisma db push

   # 查看数据库大小
   docker compose exec postgres psql -U digitaltwin -d digitaltwin \
     -c "SELECT pg_size_pretty(pg_database_size('digitaltwin'));"
   ```

### CICD环境检查

项目提供了CICD环境检查工具：

```bash
# 检查CICD环境配置
pnpm check:ci

# 生产环境检查
NODE_ENV=production pnpm check:ci
```

## 📡 API 文档

### 认证模块

| 端点 | 方法 | 权限 | 说明 |
|------|------|------|------|
| `/trpc/auth.login` | POST | 公开 | 用户登录 |
| `/trpc/auth.register` | POST | 公开 | 用户注册 |
| `/trpc/auth.getProfile` | GET | 已登录 | 获取个人信息 |
| `/trpc/auth.logout` | POST | 已登录 | 退出登录 |

### 用户模块

| 端点 | 方法 | 权限 | 说明 |
|------|------|------|------|
| `/trpc/user.getAll` | GET | Admin | 获取所有用户 |
| `/trpc/user.getById` | GET | Admin | 获取用户详情 |
| `/trpc/user.create` | POST | Admin | 创建用户 |
| `/trpc/user.update` | PUT | Admin | 更新用户 |
| `/trpc/user.delete` | DELETE | Admin | 删除用户 |
| `/trpc/user.resetPassword` | POST | Admin | 重置密码 |

### 患者模块

| 端点 | 方法 | 权限 | 说明 |
|------|------|------|------|
| `/trpc/patient.getAll` | GET | 已登录 | 获取患者列表 |
| `/trpc/patient.getById` | GET | 已登录 | 获取患者详情 |
| `/trpc/patient.create` | POST | 已登录 | 创建患者 |
| `/trpc/patient.update` | PUT | 已登录 | 更新患者 |
| `/trpc/patient.delete` | DELETE | Admin | 删除患者 |
| `/trpc/patient.assignCaregiver` | POST | 已登录 | 分配护理人员 |

### 健康数据模块

| 端点 | 方法 | 权限 | 说明 |
|------|------|------|------|
| `/trpc/observation.getLatest` | GET | 已登录 | 获取最新数据 |
| `/trpc/observation.getByPatientId` | GET | 已登录 | 获取患者历史数据 |
| `/trpc/observation.create` | POST | 已登录 | 添加观察数据 |
| `/trpc/observation.getStats` | GET | 已登录 | 获取统计数据 |

## 🐳 Docker 部署

### 构建镜像

```bash
docker build -t fhdts -f docker/Dockerfile .
```

### 启动服务

```bash
docker-compose up -d
```

### 查看日志

```bash
docker-compose logs -f
```

## 🧪 测试

```bash
# 运行所有测试
pnpm test

# 运行后端测试
pnpm --filter server test

# 生成测试覆盖率报告
pnpm --filter server test:coverage
```

## 📊 开发进度

| 模块 | 后端 | 前端 | 数据库 | 完整度 |
|------|------|------|--------|--------|
| 认证授权 | ✅ | ✅ | ✅ | 100% |
| 用户管理 | ✅ | ✅ | ✅ | 100% |
| 患者管理 | ✅ | ✅ | ✅ | 100% |
| 健康数据 | ✅ | ✅ | ✅ | 80% |
| 设备管理 | ❌ | ⚠️ | ✅ | 20% |
| IoT 接入 | ⚠️ | ❌ | - | 10% |
| 数字孪生 | ❌ | ⚠️ | - | 5% |

## 📝 待办事项

### P0 - 高优先级

- [ ] 设备管理后端实现
- [ ] IoT 数据入库（TCP → Database）
- [ ] 设备绑定/解绑功能

### P1 - 中优先级

- [ ] 健康数据趋势图表（ECharts/G2Plot）
- [ ] 实时告警推送（WebSocket）
- [ ] 数据导出（Excel/PDF）

### P2 - 低优先级

- [ ] 数字孪生真实数据驱动
- [ ] 移动端适配
- [ ] 多语言支持

## 🤝 贡献指南

1. Fork 本仓库
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启 Pull Request

## 📄 开源协议

MIT License - 详见 [LICENSE](LICENSE) 文件

## 📞 联系方式

- 项目仓库：https://github.com/fire-disposal/FHDTS
- 问题反馈：https://github.com/fire-disposal/FHDTS/issues

---

**最后更新**: 2026-03-13  
**当前版本**: v1.0.0
