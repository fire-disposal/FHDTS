import { ConflictError, NotFoundError, UnauthorizedError } from '../../../../shared/kernel/errors.js'
import { hashPassword, verifyPassword } from '../../../../shared/infra/auth.js'
import type { prisma } from '../../../../shared/infra/database.js'

interface UserSummary {
  id: string
  email: string
  name: string | null
  role: 'ADMIN' | 'USER'
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED'
  createdAt: Date
  lastLoginAt: Date | null
}

interface CreateUserInput {
  email: string
  role: 'ADMIN' | 'USER'
  password: string
  name?: string
}

interface UpdateUserInput {
  status?: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED'
  name?: string
  role?: 'ADMIN' | 'USER'
}

export class UserService {
  constructor(private readonly db: typeof prisma) {}

  async getProfile(userId: string): Promise<UserSummary> {
    const user = await this.db.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        status: true,
        createdAt: true,
        lastLoginAt: true,
      },
    })

    if (!user) {
      throw new UnauthorizedError('User not found')
    }

    return user
  }

  async getAll(): Promise<{ users: UserSummary[]; total: number }> {
    const [users, total] = await Promise.all([
      this.db.user.findMany({
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          status: true,
          createdAt: true,
          lastLoginAt: true,
        },
      }),
      this.db.user.count(),
    ])

    return { users, total }
  }

  async getById(userId: string): Promise<UserSummary> {
    const user = await this.db.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        status: true,
        createdAt: true,
        lastLoginAt: true,
      },
    })

    if (!user) {
      throw new NotFoundError('User')
    }

    return user
  }

  async create(input: CreateUserInput): Promise<UserSummary> {
    const existing = await this.db.user.findUnique({ where: { email: input.email } })
    if (existing) {
      throw new ConflictError('Email already exists')
    }

    const passwordHash = await hashPassword(input.password)

    return this.db.user.create({
      data: {
        email: input.email,
        passwordHash,
        name: input.name,
        role: input.role,
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        status: true,
        createdAt: true,
        lastLoginAt: true,
      },
    })
  }

  async update(userId: string, input: UpdateUserInput): Promise<UserSummary> {
    return this.db.user.update({
      where: { id: userId },
      data: {
        status: input.status,
        name: input.name,
        role: input.role,
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        status: true,
        createdAt: true,
        lastLoginAt: true,
      },
    })
  }

  async delete(userId: string): Promise<{ success: boolean }> {
    await this.db.user.delete({ where: { id: userId } })
    return { success: true }
  }

  async changePassword(
    userId: string,
    oldPassword: string,
    newPassword: string
  ): Promise<{ success: boolean }> {
    const user = await this.db.user.findUnique({
      where: { id: userId },
      select: { passwordHash: true },
    })

    if (!user) {
      throw new UnauthorizedError('User not found')
    }

    if (!(await verifyPassword(oldPassword, user.passwordHash))) {
      throw new UnauthorizedError('Invalid password')
    }

    await this.db.user.update({
      where: { id: userId },
      data: { passwordHash: await hashPassword(newPassword) },
    })

    return { success: true }
  }

  async resetPassword(userId: string, newPassword: string): Promise<{ success: boolean }> {
    await this.db.user.update({
      where: { id: userId },
      data: { passwordHash: await hashPassword(newPassword) },
    })

    return { success: true }
  }
}

export function createUserService(db: typeof prisma) {
  return new UserService(db)
}
