import type { Role } from '@prisma/client'
import { prisma } from '../../shared/infra/database.js'
import { Repository } from '../../shared/kernel/base.js'

export interface CreateUserInput {
  email: string
  password: string
  name?: string
  role?: Role
}

export class AuthRepository extends Repository {
  constructor() {
    super(prisma)
  }

  async findByEmail(email: string) {
    return this.db.user.findUnique({
      where: { email },
    })
  }

  async create(input: CreateUserInput) {
    return this.db.user.create({
      data: {
        email: input.email,
        passwordHash: input.password,
        name: input.name,
        role: input.role ?? 'FAMILY',
      },
    })
  }

  async updateLastLogin(userId: string) {
    return this.db.user.update({
      where: { id: userId },
      data: { lastLoginAt: new Date() },
    })
  }
}
