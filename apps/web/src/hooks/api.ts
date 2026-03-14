import { message } from 'antd'
import { trpc } from '../lib/trpc'

export function useAuthLogin(options?: { onSuccess?: () => void }) {
  const utils = trpc.useUtils()
  return trpc.auth.login.useMutation({
    onSuccess: () => {
      utils.auth.getProfile.invalidate()
      options?.onSuccess?.()
    },
  })
}

export function useAuthLogout(options?: { onSuccess?: () => void }) {
  const utils = trpc.useUtils()
  return trpc.auth.logout.useMutation({
    onSuccess: () => {
      utils.invalidate()
      options?.onSuccess?.()
    },
  })
}

export function useAuthProfile() {
  return trpc.auth.getProfile.useQuery(undefined, { retry: false })
}

export function useUsers() {
  return trpc.user.getAll.useQuery()
}

export function useCreateUser(options?: { onSuccess?: () => void }) {
  const utils = trpc.useUtils()
  return trpc.user.create.useMutation({
    onSuccess: () => {
      utils.user.getAll.invalidate()
      options?.onSuccess?.()
      message.success('用户已创建')
    },
  })
}

export function useUpdateUser(options?: { onSuccess?: () => void }) {
  const utils = trpc.useUtils()
  return trpc.user.update.useMutation({
    onSuccess: () => {
      utils.user.getAll.invalidate()
      options?.onSuccess?.()
      message.success('用户已更新')
    },
  })
}

export function useDeleteUser(options?: { onSuccess?: () => void }) {
  const utils = trpc.useUtils()
  return trpc.user.delete.useMutation({
    onSuccess: () => {
      utils.user.getAll.invalidate()
      options?.onSuccess?.()
      message.success('用户已删除')
    },
  })
}

export function useResetPassword() {
  return trpc.user.resetPassword.useMutation({
    onSuccess: () => {
      message.success('密码已重置')
    },
  })
}
