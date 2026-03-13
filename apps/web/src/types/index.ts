export type { Patient, PatientStatus, Role, User, UserStatus } from '../lib/trpc'

export interface PatientFilters {
  skip?: number
  take?: number
  status?: PatientStatus
  search?: string
}

export interface UserFilters {
  skip?: number
  take?: number
  role?: Role
  status?: UserStatus
}
