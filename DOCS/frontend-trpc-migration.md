# 前端 tRPC 客户端迁移指南

## 当前问题

`apps/web/src/lib/AuthContext.tsx` 手动封装了 tRPC 客户端，导致：
- ❌ 失去 tRPC 的类型推导优势
- ❌ 需要手动维护 API 类型定义
- ❌ 错误处理不统一

## 目标架构

使用标准 `@trpc/react-query`:

```typescript
// apps/web/src/lib/trpc.ts
import { createTRPCReact, httpBatchLink } from '@trpc/react-query'
import type { AppRouter } from 'server/router'

export const trpc = createTRPCReact<AppRouter>()

export function createTRPCClient() {
  return trpc.createClient({
    links: [
      httpBatchLink({
        url: 'http://localhost:3000/trpc',
        headers: () => ({
          Authorization: useAuthStore.getState().token 
            ? `Bearer ${useAuthStore.getState().token}` 
            : undefined
        })
      })
    ]
  })
}
```

## 迁移步骤

### 1. 安装类型导出包

```bash
pnpm add -D @trpc/server
```

### 2. 共享 AppRouter 类型

创建 `packages/shared/types.ts`:

```typescript
export type { AppRouter } from '../apps/server/src/router/index'
```

### 3. 更新 App.tsx

```typescript
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { trpc, createTRPCClient } from './lib/trpc'

function App() {
  const [queryClient] = useState(() => new QueryClient())
  const [trpcClient] = useState(() => createTRPCClient())

  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        <Router />
      </QueryClientProvider>
    </trpc.Provider>
  )
}
```

### 4. 更新登录组件

```typescript
function Login() {
  const login = useAuthStore(state => state.login)
  const navigate = useNavigate()
  
  const mutation = trpc.auth.login.useMutation({
    onSuccess: (data) => {
      login(data.user, data.token)
      navigate('/')
    },
    onError: (error) => {
      message.error(error.message)
    }
  })

  const handleSubmit = (values) => {
    mutation.mutate(values)
  }
  
  // ...
}
```

### 5. 更新用户管理页面

```typescript
function UserManagement() {
  const { data: userData } = trpc.user.getAll.useQuery()
  const createMutation = trpc.user.create.useMutation({
    onSuccess: () => {
      utils.user.getAll.invalidate()
    }
  })
  
  // ...
}
```

## 优势对比

| 特性 | 当前实现 | 标准 tRPC |
|------|----------|-----------|
| 类型推导 | 手动定义 | 自动生成 ✅ |
| 错误处理 | try-catch | 统一处理 ✅ |
| 缓存失效 | 手动刷新 | invalidateQueries ✅ |
| 加载状态 | 手动管理 | isLoading ✅ |
| 代码量 | ~230 行 | ~50 行 ✅ |

## 迁移检查清单

- [ ] 删除 `AuthContext.tsx`
- [ ] 创建 `lib/trpc.ts`
- [ ] 更新 `App.tsx`
- [ ] 更新 `Login.tsx`
- [ ] 更新 `UserManagement.tsx`
- [ ] 更新 `PatientManagement.tsx`
- [ ] 验证类型推导
- [ ] 测试所有功能
