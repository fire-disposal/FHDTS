import { createTRPCReact, httpBatchLink } from '@trpc/react-query'
import { useAuthStore } from '../stores/authStore'
import { API_URL } from './env'

export type Role = 'ADMIN' | 'CAREGIVER' | 'FAMILY'
export type UserStatus = 'ACTIVE' | 'INACTIVE' | 'SUSPENDED'
export type PatientStatus = 'ACTIVE' | 'INACTIVE' | 'SUSPENDED'

export interface User {
  id: string
  email: string
  name: string | null
  role: Role
  status: UserStatus
  patientCount: number
  createdAt: Date
  lastLoginAt: Date | null
}

export interface Patient {
  id: string
  name: string
  dateOfBirth: Date | string | null
  gender: string | null
  phone: string | null
  status: PatientStatus
  caregivers: Array<{ id: string; email: string; name: string | null }>
  observationCount: number
  deviceCount: number
  createdAt: Date
  address?: string | null
}

export const trpc = createTRPCReact()

export function createTRPCClient() {
  return trpc.createClient({
    links: [
      httpBatchLink({
        url: `${API_URL}/trpc`,
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
