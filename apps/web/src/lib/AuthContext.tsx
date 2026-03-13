import type { ReactNode } from 'react'

interface AuthProviderProps {
  children: ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  return <>{children}</>
}

export type { Patient, PatientStatus, Role, User, UserStatus } from '../lib/trpc'
