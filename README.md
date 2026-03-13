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
│   ├── db/               # 数据库包 (Prisma)
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
# 复制环境模板
cp .env.example .env

# 编辑 .env 文件
DATABASE_URL=postgresql://postgres:password@localhost:5432/digitaltwin
JWT_SECRET=your-secret-key-here
PORT=3000
TCP_PORT=5858
```

### 初始化数据库

```bash
# 生成 Prisma 客户端
pnpm --filter db db:generate

# 推送表结构到数据库
pnpm --filter db db:push

# 插入种子数据
pnpm --filter server seed
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
