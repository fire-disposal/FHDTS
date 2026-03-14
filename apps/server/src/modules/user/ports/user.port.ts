export interface UserSummary {
  id: string
  email: string
  name: string | null
  role: 'ADMIN' | 'USER'
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED'
  createdAt: Date
  lastLoginAt: Date | null
}

export interface UserListResult {
  users: UserSummary[]
  total: number
}

export interface UserPort {
  findProfileById(userId: string): Promise<UserSummary | null>
  findById(userId: string): Promise<UserSummary | null>
  listAll(): Promise<UserListResult>
  findByEmail(email: string): Promise<{ id: string } | null>
  create(input: { email: string; passwordHash: string; role: 'ADMIN' | 'USER'; name?: string }): Promise<UserSummary>
  update(input: {
    userId: string
    data: {
      status?: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED'
      name?: string
      role?: 'ADMIN' | 'USER'
    }
  }): Promise<UserSummary>
  delete(userId: string): Promise<void>
  findPasswordHash(userId: string): Promise<{ passwordHash: string } | null>
  updatePassword(userId: string, passwordHash: string): Promise<void>
}
