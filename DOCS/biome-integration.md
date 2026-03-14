# Biome 集成指南

## ✅ 已完成配置

### 1. 安装包

```bash
pnpm add -Dw @biomejs/biome
```

### 2. 项目结构

```
digital-twin/
├── biome.json           # Biome 配置
├── .vscode/
│   ├── settings.json    # VSCode 集成
│   └── extensions.json  # 推荐插件
└── package.json         # 脚本命令
```

### 3. 可用命令

```bash
# 检查 (不修复)
pnpm lint:check

# 检查并自动修复
pnpm lint

# 仅格式化
pnpm format

# 格式化检查
pnpm format:check
```

### 4. VSCode 配置

安装推荐插件: `biomejs.biome`

保存时自动:
- ✅ 格式化代码
- ✅ 整理 Imports
- ✅ 应用快速修复

### 5. 配置亮点

| 功能 | 配置 |
|------|------|
| **格式化** | 2 空格，单引号，100 字符行宽 |
| **Lint 规则** | 推荐规则 + 自定义 |
| **类型检查** | 启用 TypeScript 类型检查 |
| **Import 排序** | 自动组织 |
| **Node.js 协议** | 推荐 `node:` 前缀 |
| **VCS 集成** | 使用 `.gitignore` |

### 6. 规则说明

```json
{
  "linter": {
    "rules": {
      "complexity": {
        "noUselessTypeConstraint": "error",
        "useArrowFunction": "error"
      },
      "suspicious": {
        "noExplicitAny": "warn",  // 禁止 any 类型
        "noArrayIndexKey": "warn" // 警告数组索引作为 key
      },
      "style": {
        "noNonNullAssertion": "warn", // 警告 !.断言
        "useTemplate": "error"        // 使用模板字符串
      }
    }
  }
}
```

### 7. 与 ESLint+Prettier 对比

| 特性 | Biome | ESLint + Prettier |
|------|-------|-------------------|
| **安装大小** | ~5MB | ~50MB |
| **启动速度** | <50ms | ~500ms |
| **配置复杂度** | 单文件 | 多文件 |
| **功能** | Lint + Format | 需分别配置 |
| **TypeScript** | 原生支持 | 需插件 |

### 8. 最佳实践

#### 忽略文件

在 `.gitignore` 中添加:

```
node_modules
dist
.turbo
coverage
```

#### 覆盖配置

针对特定目录自定义规则:

```json
{
  "overrides": [
    {
      "includes": ["apps/web/**"],
      "javascript": {
        "globals": ["React", "JSX"]
      }
    }
  ]
}
```

#### CI 检查

```yaml
- name: Biome Check
  run: pnpm lint:check

- name: Biome Format
  run: pnpm format:check
```

### 9. 迁移步骤

如果从 ESLint 迁移:

```bash
# 自动迁移 ESLint 配置
npx @biomejs/biome migrate eslint

# 自动迁移 Prettier 配置
npx @biomejs/biome migrate prettier
```

### 10. 常见问题

**Q: 如何禁用某个规则？**
```json
{
  "linter": {
    "rules": {
      "suspicious": {
        "noExplicitAny": "off"
      }
    }
  }
}
```

**Q: 如何忽略单个文件？**
在文件顶部添加:
```typescript
// biome-ignore-all
```

**Q: 如何忽略单行？**
```typescript
// biome-ignore lint/suspicious/noExplicitAny: <explain>
const data: any = {}
```

---

**文档版本**: 1.0
**Biome 版本**: 2.4.6
**更新时间**: 2025-03-13
