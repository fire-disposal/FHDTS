import { message } from 'antd'
import { trpc } from '../lib/trpc'
import type { PatientFilters } from '../types'

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

export function usePatients(options?: PatientFilters) {
  return trpc.patient.getAll.useQuery(options || {})
}

export function useCreatePatient(options?: { onSuccess?: () => void }) {
  const utils = trpc.useUtils()
  return trpc.patient.create.useMutation({
    onSuccess: () => {
      utils.patient.getAll.invalidate()
      options?.onSuccess?.()
      message.success('患者已添加')
    },
  })
}

export function useUpdatePatient(options?: { onSuccess?: () => void }) {
  const utils = trpc.useUtils()
  return trpc.patient.update.useMutation({
    onSuccess: () => {
      utils.patient.getAll.invalidate()
      options?.onSuccess?.()
      message.success('患者已更新')
    },
  })
}

export function useDeletePatient(options?: { onSuccess?: () => void }) {
  const utils = trpc.useUtils()
  return trpc.patient.delete.useMutation({
    onSuccess: () => {
      utils.patient.getAll.invalidate()
      options?.onSuccess?.()
      message.success('患者已删除')
    },
  })
}

export function useLatestObservations(limit = 10) {
  return trpc.observation.getLatest.useQuery({ limit })
}

export function useObservationsByPatient(patientId: string, limit = 20) {
  return trpc.observation.getByPatientId.useQuery({ patientId, limit }, { enabled: !!patientId })
}

export function useCreateObservation(options?: { onSuccess?: () => void }) {
  const utils = trpc.useUtils()
  return trpc.observation.create.useMutation({
    onSuccess: () => {
      utils.observation.getLatest.invalidate()
      utils.observation.getByPatientId.invalidate()
      options?.onSuccess?.()
      message.success('数据已添加')
    },
  })
}

export function useObservationStats(patientId: string, code: string, days = 7) {
  return trpc.observation.getStats.useQuery(
    { patientId, code, days },
    { enabled: !!patientId && !!code }
  )
}
