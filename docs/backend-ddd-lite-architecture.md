# 后端架构优化方案（DDD Lite + 复杂业务友好）

> 目标：保留 DDD 的核心价值（边界、语言、模型演进能力），避免 Repository 模板化负担，并为 IoT / 数据流 / 数据适配管线预留扩展位。

## 0. 本轮已落地改造（代码）

- 后端共享技术层已从 `shared/infra` 调整为 `shared/platform`。
- `auth` / `user` 模块已按 `application + ports + adapters` 重组。
- `application/services` 已拆分为 `commands` 与 `queries`，降低单类职责复杂度。
- tRPC 路由已迁移到模块 `adapters/trpc`，Prisma 访问下沉到 `adapters/prisma`。
- 新增 `app/bootstrap.ts` 与 `app/router.ts`，将进程装配与入口逻辑解耦。
- `packages/config` 已调整为 `packages/tsconfig`，避免配置语义歧义。

## 1. 现状与问题

### 1.1 当前结构的积极点

- 已按业务分模块（`auth`、`user`），并有 `application/services` 与 `interfaces/trpc` 分层。
- 有 `shared/kernel`（错误模型）与 `shared/infra`（DB、Auth、Env）基础能力。

### 1.2 当前结构中的关键风险

1. **`shared/infra` 语义过重，容易成为“超级杂物间”**
   - 当前 `trpc/context`、业务 service 都直接依赖 `shared/infra/database`，跨模块耦合会逐步升高。

2. **模块内“应用服务=直接 Prisma CRUD”**
   - `auth.service` / `user.service` 目前承担编排、权限、持久化细节、DTO 组装等多重职责。
   - 当进入 IoT、告警规则、流式处理后，service 会快速膨胀。

3. **`packages/config` 与 `apps/server/src/shared/infra/env.ts` 职责重叠隐患**
   - `packages/config` 当前仅提供 tsconfig 导出，名字像“全局配置中心”，但实际不是运行时配置。
   - 运行时配置逻辑在 server 内部，后续若多后端进程（API / ingestion / worker）会重复。

4. **缺少“管线化能力”抽象**
   - 未来 IoT 数据会经历：接入 → 解析 → 校验 → 标准化 → 路由 → 持久化/事件发布。
   - 若无统一 pipeline 约束，代码会碎片化散落在 router/service。

## 2. 设计原则（DDD Lite）

1. **以模块边界代替重型分层**：先做“模块自治”，再做“技术分层”。
2. **不强制 Repository**：允许在模块内部通过 `ports` 声明最小持久化接口，并提供 Prisma adapter。
3. **把复杂性放到 Domain Policy / Pipeline，而不是 Controller/Router。**
4. **显式区分三类共享代码**：
   - `kernel`：纯领域通用（错误、Result、标识）
   - `platform`：技术能力（db、mq、cache、logger）
   - `contracts`：跨模块/跨进程协议（事件、DTO schema）

## 3. 推荐目标结构

```txt
apps/server/src/
  app/                       # 进程装配层（Fastify/TRPC 注册、DI 装配）
    bootstrap.ts
    router.ts

  modules/
    auth/
      domain/
        entities/
        policies/
        events/
      application/
        commands/
        queries/
        services/
      ports/
        auth-user.port.ts
      adapters/
        prisma/
          auth-user.prisma.ts
        trpc/
          auth.router.ts

    iot/
      domain/
        value-objects/
        policies/
        events/
      application/
        pipelines/
          ingest.pipeline.ts
      ports/
        device-registry.port.ts
        observation-write.port.ts
        event-bus.port.ts
      adapters/
        tcp/
        mqtt/
        prisma/

  shared/
    kernel/                  # 纯业务无框架依赖
    platform/                # 数据库、认证、日志、消息等技术实现
    contracts/               # zod schema、event payload、跨模块 DTO
```

## 4. `shared` 与 `packages/config` 的优化建议

### 4.1 `shared/infra` 重命名与拆分

- `shared/infra` → `shared/platform`（更准确表达“技术平台能力”）
- 从 day-1 开始约束：
  - `modules/*/domain` **禁止**依赖 `shared/platform`
  - `modules/*/application` 仅依赖 `ports` + `kernel`
  - `adapters` 才能依赖 `shared/platform`

### 4.2 `packages/config` 重新定位

当前建议二选一：

1. **如果只做 TS 配置**：改名为 `packages/tsconfig`（避免误导）。
2. **如果希望做“真正共享配置”**：升级为 `packages/config-runtime`，输出：
   - `createEnvSchema(serviceName)`
   - 环境变量默认策略与校验工具
   - 统一日志格式/启动配置 contract

> 推荐短期：先改名 `tsconfig`；中期再新增 `config-runtime`，避免一步到位过重。

## 5. 无 Repository 的落地模式（关键）

### 5.1 采用 `Port + Adapter`，不引入通用 Repository 基类

示例思路：

- `modules/user/ports/user-read.port.ts`
- `modules/user/ports/user-write.port.ts`
- `modules/user/adapters/prisma/user-read.prisma.ts`
- `modules/user/adapters/prisma/user-write.prisma.ts`

应用服务只接收“最小能力接口”，而不是直接拿 Prisma Client。

收益：
- 避免“Repository 大全接口”模板代码
- 能精准表达业务场景所需数据访问
- 后续可为 IoT 热路径单独换存储实现（时序库、缓存）

### 5.2 Query 与 Command 分离（轻量 CQRS）

- 读模型（列表、聚合统计）可直接在 Query handler 中走 Prisma projection。
- 写模型保留领域规则与 invariants（状态机、阈值规则、幂等键）。

## 6. 面向 IoT 与数据流的预埋方案

### 6.1 建立统一 Ingest Pipeline 抽象

建议定义：

- `PipelineContext`：deviceId、traceId、receivedAt、rawPayload
- `Stage`：`parse -> validate -> normalize -> enrich -> route -> persist -> publish`
- `StageResult`：`ok | drop | retry | dead-letter`

每个 stage 可插拔，实现“协议适配（TCP/MQTT）”与“业务适配（不同设备型号）”分离。

### 6.2 事件优先而非表优先

模块内先定义领域事件（例如 `ObservationIngested`、`VitalSignAbnormalDetected`），
再决定是否落库、推送告警、触发规则引擎。

### 6.3 幂等与重放

对 IoT 必须预置：
- `idempotencyKey`（设备ID + 采集时间 + 序号）
- 原始报文归档（用于审计与重放）
- dead-letter 队列与补偿任务

## 7. 渐进式改造路线（4阶段）

1. **阶段A（1周）- 结构校正**
   - `shared/infra` => `shared/platform`
   - 在 `modules/auth|user` 增加 `ports` 目录，应用服务改为依赖端口

2. **阶段B（1~2周）- 应用层收敛**
   - 拆分 command/query
   - 把 zod DTO 与 router 输入输出协议转移到 `contracts`

3. **阶段C（2周）- IoT 管线骨架**
   - 创建 `modules/iot/application/pipelines` + stage 接口
   - 先接一条“模拟设备数据”通路端到端

4. **阶段D（持续）- 复杂业务增强**
   - 规则引擎（阈值、趋势、组合告警）
   - 异步事件总线 / 作业系统（告警、通知、统计）

## 8. 决策建议（可直接执行）

- 立即执行：
  - 统一命名：`shared/platform`
  - `packages/config` 改名为 `packages/tsconfig`
  - 新增模块内 `ports + adapters` 约束（无需引入 Repository）

- 本月执行：
  - 建立 IoT ingest pipeline 最小实现
  - 事件与幂等机制先行

- 避免事项：
  - 不要创建通用 `BaseRepository<T>`
  - 不要把规则写进 router 或 Prisma 查询拼装中

---

如果你愿意，我下一步可以按这个方案给出一版**可直接落地的目录重构 PR 草案**（包含文件迁移映射和最小代码改造顺序）。
