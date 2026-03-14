import { hashPassword, verifyPassword } from '../../../shared/infra/auth'
// biome-ignore lint/correctness/noUnusedImports: Used for type inheritance in the Service base class
import type { prisma } from '../../../shared/infra/database'
import { Service } from '../../../shared/kernel/base'
import { UnauthorizedError } from '../../../shared/kernel/errors'

interface UserSummary {
  id: string
  email: string
  name: string | null
  role: string
  status: string
  createdAt: Date
  lastLoginAt: Date | null
  patientIds: string[]
}

interface UserProfile {
  id: string
  email: string
  name: string | null
  role: string
  status: string
  patientCount: number
}

interface CreateUserInput {
  email: string
  role: 'ADMIN' | 'CAREGIVER' | 'FAMILY'
  password: string
  name?: string
}

interface UpdateUserInput {
  status?: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED'
  name?: string
  role?: 'ADMIN' | 'CAREGIVER' | 'FAMILY'
}

export class UserService extends Service {
  async getProfile(userId: string): Promise<UserProfile> {
    const user = await this.db.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        status: true,
      },
    })

    if (!user) {
      throw new UnauthorizedError('User not found')
    }

    // 获取用户的患者数量
    const patientCount = await this.db.patient.count({
      where: {
        OR: [
          { id: { in: [] } }, // 这里可能需要根据实际关系调整
        ],
      },
    })

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      status: user.status,
      patientCount,
    }
  }

  async getAll(): Promise<{ users: UserSummary[]; total: number }> {
    const [users, total] = await Promise.all([
      this.db.user.findMany({
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          status: true,
          createdAt: true,
          lastLoginAt: true,
          // 获取关联的患者ID
          patients: {
            select: {
              id: true,
            },
          },
        },
      }),
      this.db.user.count(),
    ])

    const transformedUsers = users.map(user => ({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      status: user.status,
      createdAt: user.createdAt,
      lastLoginAt: user.lastLoginAt,
      patientIds: user.patients.map(p => p.id),
    }))

    return { users: transformedUsers, total }
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
        // 获取关联的患者ID
        patients: {
          select: {
            id: true,
          },
        },
      },
    })

    if (!user) {
      throw new Error('User not found')
    }

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      status: user.status,
      createdAt: user.createdAt,
      lastLoginAt: user.lastLoginAt,
      patientIds: user.patients.map(p => p.id),
    }
  }

  async create(input: CreateUserInput): Promise<UserSummary> {
    const existingUser = await this.db.user.findUnique({
      where: { email: input.email },
    })

    if (existingUser) {
      throw new Error('Email already exists')
    }

    const passwordHash = await hashPassword(input.password)

    const user = await this.db.user.create({
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
        patients: {
          select: {
            id: true,
          },
        },
      },
    })

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      status: user.status,
      createdAt: user.createdAt,
      lastLoginAt: user.lastLoginAt,
      patientIds: user.patients.map(p => p.id),
    }
  }

  async update(userId: string, input: UpdateUserInput): Promise<UserSummary> {
    const user = await this.db.user.update({
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
        patients: {
          select: {
            id: true,
          },
        },
      },
    })

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      status: user.status,
      createdAt: user.createdAt,
      lastLoginAt: user.lastLoginAt,
      patientIds: user.patients.map(p => p.id),
    }
  }

  async delete(userId: string): Promise<{ success: boolean }> {
    await this.db.user.delete({
      where: { id: userId },
    })

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

    const newPasswordHash = await hashPassword(newPassword)

    await this.db.user.update({
      where: { id: userId },
      data: { passwordHash: newPasswordHash },
    })

    return { success: true }
  }

  async resetPassword(userId: string, newPassword: string): Promise<{ success: boolean }> {
    const newPasswordHash = await hashPassword(newPassword)

    await this.db.user.update({
      where: { id: userId },
      data: { passwordHash: newPasswordHash },
    })

    return { success: true }
  }
}
