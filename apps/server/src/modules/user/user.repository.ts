import type { Role, Status } from '@prisma/client'
import { prisma } from '../../shared/infra/database.js'
import { Repository } from '../../shared/kernel/base.js'

export interface CreateUserInput {
  email: string
  password: string
  name?: string
  role?: Role
}

export interface UpdateUserInput {
  name?: string
  role?: Role
  status?: Status
}

export class UserRepository extends Repository {
  constructor() {
    super(prisma)
  }

  async findById(id: string) {
    return this.db.user.findUnique({
      where: { id },
      include: { patients: true },
    })
  }

  async findByEmail(email: string) {
    return this.db.user.findUnique({
      where: { email },
    })
  }

  async findAll(skip = 0, take = 20) {
    const [users, total] = await Promise.all([
      this.db.user.findMany({
        skip,
        take,
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          status: true,
          createdAt: true,
          lastLoginAt: true,
          _count: { select: { patients: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.db.user.count(),
    ])

    return { users, total }
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

  async update(id: string, input: UpdateUserInput) {
    return this.db.user.update({
      where: { id },
      data: input,
    })
  }

  async delete(id: string) {
    return this.db.user.delete({
      where: { id },
    })
  }

  async updateLastLogin(id: string) {
    return this.db.user.update({
      where: { id },
      data: { lastLoginAt: new Date() },
    })
  }

  async updatePassword(id: string, passwordHash: string) {
    return this.db.user.update({
      where: { id },
      data: { passwordHash },
    })
  }
}
