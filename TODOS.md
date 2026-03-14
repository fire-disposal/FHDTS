# 项目待办事项清单

## ✅ 已完成 (v1.0)

- [x] DDD 架构设计 (Repository/Service/Router 分层)
- [x] 用户认证系统 (JWT + bcrypt)
- [x] 权限中间件 (protectedProcedure/adminProcedure)
- [x] 用户管理 CRUD (Admin)
- [x] 患者管理 CRUD (全角色)
- [x] 前端 Ant Design 管理后台
- [x] 数字孪生 3D 场景集成
- [x] 优雅关闭处理
- [x] 种子数据脚本
- [x] 基础设施重构 (Prisma + JWT 类型安全)
- [x] **Biome 代码质量工具集成** (ESLint/Prettier 替代)
- [x] **环境变量模板** (`.env.example` + JWT_SECRET 说明)
- [x] **类型安全修复** (移除所有 `any` 类型)
- [x] **单元测试框架** (Vitest + 示例测试)

---

## 📋 待开始

### P1 - 中优先级

- [x] **测试覆盖** (基础框架已搭建)
  - [x] Auth Service 单元测试 (100% 覆盖率)
  - [ ] User Service 完善测试
  - [ ] Patient Service 单元测试
  - [ ] tRPC 路由测试

- [ ] **API 文档**
  - [ ] JSDoc 注释
  - [ ] README API 表格

### P2 - 低优先级

- [ ] **性能优化**
  - [ ] 前端代码分割
  - [ ] 查询缓存优化

- [ ] **安全增强**
  - [ ] 速率限制
  - [ ] 密码强度校验

- [ ] **监控**
  - [ ] 请求日志
  - [ ] 错误追踪

---

## 🚀 快速启动

```bash
# 1. 安装依赖
pnpm install

# 2. 数据库初始化
pnpm --filter server db:generate
pnpm --filter server db:push
pnpm --filter server seed

# 3. 启动开发
pnpm dev

# 4. 访问
# http://localhost:3000
```

---

## 📁 重要文档

| 文档 | 说明 |
|------|------|
| `README.md` | 项目总览 + 快速开始 |
| `DEPLOY.md` | 部署指南 |
| `REFACTOR_SUMMARY.md` | 架构重构报告 |
| `docs/biome-integration.md` | Biome 配置详情 |
| `docs/frontend-trpc-migration.md` | 前端 tRPC 迁移指南 |

---

**最后更新**: 2025-03-13
**当前版本**: v1.0
