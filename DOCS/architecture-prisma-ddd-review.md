# Prisma + DDD 骨架审阅（针对当前代码库）

> 目标：在**不过度模板化**（避免无意义 repo 层）的前提下，建立类型安全、可演进、可承载多 IoT 协议与设备计算逻辑的后端骨架。

## TL;DR（先看结论）

当前代码中最危险的问题不是“Prisma 用法细节”，而是：

1. **领域模型与 Prisma schema 严重漂移**：应用层代码依赖的字段/关系（`caregivers`、`patients`、`phone`、`address`、`note`、`number value` 等）在 schema 中并不存在。结果是类型系统失效、接口语义漂移、后续扩展会反复返工。
2. **“设备接入协议”和“设备业务语义”未解耦**：TCP+msgpack server 直接 decode 后 `console.log`，没有统一 Ingestion Contract、没有幂等键、没有“原始事件层”与“规范化指标层”分层。
3. **认证与用户上下文链条不完整**：TRPC context 未返回 role，后续又在 middleware 中补查；多处服务同时做权限判断，策略分散。
4. **工程基础存在阻断级问题**：Node 类型缺失导致大量 TS 错误；数据库模块存在重复导入；这些会让你“以为在设计”，其实“连稳定编译都不可持续”。

---

## 一、Prisma / 数据模型层的关键问题

### 1) 应用代码与 Schema 不一致（最严重）

多个 service/router 正在查询或写入 schema 中不存在的字段与关系：

- `PatientService` 使用了 `phone`、`address`、`caregivers`，并在 `observations` 中读取 `note`。但 schema 的 `Patient`、`Observation` 没有这些字段，且没有 caregiver 关系表。
- `UserService` 查询 `user.patients`，但 schema 的 `User` 没有 `patients` relation。
- `ObservationService` 把 `value` 当 `number` 写入，schema 中 `Observation.value` 是 `String`。

这意味着当前“类型安全”仅停留在表面（甚至因为生成/依赖问题，类型约束未真正落地）。

**建议：**

- 先做一轮 **Model Reconciliation**：
  - 从“你真正需要的业务语义”倒推出 `schema.prisma`（而不是反过来凑字段）。
  - 通过一次迁移把服务层正在使用的核心关系补齐（例如 Caregiver 绑定关系、Observation 的 typed value 结构）。
- 在 CI 增加硬门禁：`prisma validate` + `prisma generate` + `tsc --noEmit`，防止再次漂移。

### 2) Observation 建模不适合 IoT 多设备扩展

你计划接入床垫、枕头、手表等设备，并做跨设备时序计算（血压映射）。当前 Observation 结构过于扁平：

- 单一 `code/value/unit` 难以承载复杂算法输入与中间态。
- 缺失“事件来源、设备时间、接收时间、协议、去重键、质量标记、算法版本”等关键审计信息。

**建议分层建模：**

- **RawEvent（原始事件层）**：保存原始 payload（json/msgpack 解包后）、协议元数据、source id、幂等键。
- **SignalSample（标准化信号层）**：统一 timestamp、subject、signal type、numeric value、unit、quality。
- **DerivedMetric（派生指标层）**：记录算法产物（如血压映射值）、算法版本、输入窗口引用。

这样你以后新增设备只需新增“协议适配器 + 映射规则”，而不是侵入核心业务表。

### 3) 用户-患者关系缺失

你代码已经体现“护理人员访问患者”的需求，但 schema 没有表达。建议明确设计：

- `PatientCareTeam`（多对多）
  - `patientId`
  - `userId`
  - `roleInCareTeam`（PRIMARY_CAREGIVER / FAMILY / DOCTOR 等）
  - `grantedAt`, `revokedAt`

这是权限与审计的关键锚点，也能支撑以后更细的 ABAC/RBAC。

### 4) `Device` 过于弱类型

目前 `deviceType/manufacturer` 都是 string，后期容易失控。建议：

- `DeviceType` enum（WATCH, PILLOW, MATTRESS, GATEWAY...）
- `ProtocolType` enum（HTTP, TCP_MSGPACK, MQTT...）
- `DeviceCapability` / `DeviceProfile` 子表：声明设备可上报哪些信号、采样率、时钟精度。

这样能把“是否可参与某算法”前置到类型/配置层。

---

## 二、DDD 落地问题（你当前骨架与目标不匹配）

### 1) 现在是“Service 直连 Prisma”，并非 DDD

当前 `Service` 基类持有 `db`，应用服务直接写 Prisma 查询。优点是快；缺点是：

- 聚合边界不清楚。
- 领域规则散落在 router/service 条件分支里。
- 难以测试复杂算法（因为与持久化耦合）。

**但你又不希望写大量 repo 样板。**

可以采用折中方案（推荐）：

- 对 **CRUD 型模块**（用户基础信息）保留“应用服务 + Prisma 直查”。
- 对 **高规则模块**（设备数据接入、时序映射算法）使用“最小仓储接口”。

即：只在真正有复杂不变量的聚合上引入 repository port，不全局强推。

### 2) 缺少“用例层”与“策略/算法层”分离

你未来会有很多设备特有计算逻辑，建议把逻辑拆成：

- `application/use-cases/*`：编排（鉴权、事务、事件发布）
- `domain/services/*`：纯业务规则（如“手表脉搏+枕头脉搏时间戳对齐算法”）
- `infrastructure/ingestion/*`：协议适配（HTTP/TCP/MQTT）

这样协议变化不会污染算法，算法迭代也不会影响接入通道。

---

## 三、协议接入与事件处理的系统性风险

### 1) TCP server 只有解包日志，没有可运营的 ingestion pipeline

目前 TCP server 只 decode msgpack 并回包 `ok`。缺失：

- 鉴权（设备级签名/密钥）
- 幂等去重（messageId + deviceId）
- 背压与重试策略
- 持久化与死信
- 解析失败分类

**建议最小闭环：**

1. 协议适配器统一输出 `IngestEnvelope`。
2. 写入 `RawEvent`（必须成功才 ack）。
3. 异步 worker 执行 normalize + derive。
4. 失败写 `IngestError` 并可重放。

### 2) 时间语义不完整（你的血压映射需求会踩雷）

你提到了“脉搏时间戳对比”，这要求明确至少三种时间：

- `deviceTimestamp`（设备本地）
- `gatewayReceivedAt`（网关收到）
- `serverIngestedAt`（服务写库）

并记录时钟偏移估计与同步质量。否则跨设备对齐计算会出现系统性偏差。

---

## 四、工程层阻断问题（应立即修复）

1. `database.ts` 存在重复导入 `createClient`。
2. `tsconfig` 未包含 Node 类型，导致大量 Node/依赖类型错误，开发反馈失真。
3. 存在 `.ts`/`.js` import 风格混用与路径不一致迹象，增加构建脆弱性。

这些问题不解决，后续“架构设计优化”很难稳定推进。

---

## 五、一个“简洁但可扩展”的推荐骨架（不引入无聊模板）

建议从现在结构平滑演进到：

```text
apps/server/src
  modules/
    iot-ingestion/
      application/
        use-cases/
          ingest-event.usecase.ts
      domain/
        entities/
          raw-event.ts
          signal-sample.ts
        services/
          signal-alignment.service.ts
      infrastructure/
        adapters/
          tcp-msgpack.adapter.ts
          http.adapter.ts
          mqtt.adapter.ts
        persistence/
          prisma-raw-event.store.ts   # 不是通用 repo，只做该聚合最小接口
      interfaces/
        trpc/
        tcp/
        http/

    patient/
    user/
    auth/
```

核心原则：

- **不做全局 Repository 模板化**。
- **只对复杂聚合定义最小 port**（例如 `RawEventStore.saveIfNotExists()`）。
- Prisma 仍是主力持久化工具，但不直接承载所有业务规则。

---

## 六、建议的 4 周落地节奏（可执行）

### Week 1：对齐模型与编译链

- 修正 Node types / import 问题，恢复可靠 typecheck。
- 完成 schema 与 service 的字段关系对齐。
- 建立 CI 最小门禁。

### Week 2：搭建 ingestion 最小闭环

- 定义 `IngestEnvelope`、`RawEvent`、`IngestError`。
- TCP+msgpack 先接入 RawEvent 持久化与幂等。

### Week 3：标准化信号与权限模型

- 引入 `SignalSample`、`PatientCareTeam`。
- 把患者访问控制从散落 service 收敛到统一策略模块。

### Week 4：第一条派生算法链路

- 选一个真实场景（如手表+枕头脉搏对齐）做 `DerivedMetric`。
- 增加算法版本化与可重放机制。

---

## 七、你现在最该优先做的 3 件事

1. **先统一 schema 与 service 的事实模型**（这是类型安全的地基）。
2. **为 IoT 建 RawEvent 层**（否则协议越多，技术债指数级增长）。
3. **把复杂规则放进 domain service，而不是 Prisma 查询里堆 if/else**。

如果你愿意，我下一步可以直接给你：

- 一版可直接迁移的 `schema.prisma v2`（含 RawEvent/SignalSample/DerivedMetric/PatientCareTeam）；
- 一版“最小 DDD + Prisma”目录与代码示例（不加无意义 repo 层）；
- 一个 TCP+msgpack 到 RawEvent 的端到端样例（含幂等与失败重放骨架）。
