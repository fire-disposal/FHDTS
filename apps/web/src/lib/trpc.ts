import type { AppRouter } from '@server/router/index.ts'
import { createTRPCReact, httpBatchLink } from '@trpc/react-query'
import type { inferRouterInputs, inferRouterOutputs } from '@trpc/server'
import SuperJSON from 'superjson'
import { useAuthStore } from '../stores/authStore'
import { API_URL } from './env'

export type RouterInputs = inferRouterInputs<AppRouter>
export type RouterOutputs = inferRouterOutputs<AppRouter>

// 直接从后端路由推断类型，避免重复定义
export type User = RouterOutputs['user']['getProfile']
export type GetAllUsersResponse = RouterOutputs['user']['getAll']
export type UserSummary = GetAllUsersResponse extends { users: (infer U)[] } ? U : never
export type Patient = RouterOutputs['patient']['getById']
export type GetAllPatientsResponse = RouterOutputs['patient']['getAll']
export type PatientSummary = GetAllPatientsResponse extends { patients: (infer P)[] } ? P : never
export type LoginResponse = RouterOutputs['auth']['login']

export const trpc = createTRPCReact<AppRouter>()

export function createTRPCClient() {
  return trpc.createClient({
    links: [
      httpBatchLink({
        url: `${API_URL}/trpc`,
        transformer: SuperJSON,
        headers: () => {
          const token = useAuthStore.getState().token
          return {
            Authorization: token ? `Bearer ${token}` : undefined,
          }
        },
      }),
    ],
  })
}
