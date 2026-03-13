export type { AppRouter } from '../apps/server/src/router/index.js'
export type { AuthenticatedContext, TRPCContext } from '../apps/server/src/trpc/context.js'

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

export interface PatientSummary {
  id: string
  name: string
  dateOfBirth: Date | null
  gender: string | null
  phone: string | null
  status: PatientStatus
  createdAt: Date
  caregivers: Array<{ id: string; email: string; name: string | null }>
  observationCount: number
  deviceCount: number
}

export interface PatientDetail extends PatientSummary {
  address: string | null
  observations: Array<{
    id: string
    code: string
    value: number
    unit: string
    timestamp: Date
    note: string | null
  }>
  devices: Array<{
    id: string
    name: string
    type: string
    serialNumber: string
    status: string
  }>
}

export interface Observation {
  id: string
  patientId: string
  code: string
  value: number
  unit: string
  timestamp: Date
  note: string | null
}

export interface Device {
  id: string
  patientId: string
  name: string
  type: string
  serialNumber: string
  status: string
}
