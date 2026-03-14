export interface AuthUserRecord {
  id: string
  email: string
  name: string | null
  role: 'ADMIN' | 'USER'
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED'
  passwordHash: string
}

export interface AuthUserProfile {
  id: string
  email: string
  name: string | null
  role: 'ADMIN' | 'USER'
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED'
}

export interface AuthUserPort {
  findByEmail(email: string): Promise<AuthUserRecord | null>
  findProfileById(userId: string): Promise<AuthUserProfile | null>
  create(input: { email: string; passwordHash: string; name?: string }): Promise<AuthUserProfile>
  updateLastLogin(userId: string): Promise<void>
}
