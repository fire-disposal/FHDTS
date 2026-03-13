import type { Role, Status } from '@prisma/client'
import { hashPassword } from '../../shared/infra/auth.js'
import { prisma } from '../../shared/infra/database.js'
import { Service } from '../../shared/kernel/base.js'
import { UserRepository } from './user.repository.js'

export interface UserSummary {
  id: string
  email: string
  name: string | null
  role: string
  status: string
  createdAt: Date
  lastLoginAt: Date | null
  patientCount: number
}

export class UserService extends Service {
  private repository: UserRepository

  constructor() {
    super(prisma)
    this.repository = new UserRepository()
  }

  async getProfile(userId: string): Promise<{
    id: string
    email: string
    name: string | null
    role: string
    status: string
    patientCount: number
  }> {
    await this.verifyUserStatus(userId)

    const user = await this.repository.findById(userId)
    if (!user) throw new Error('User not found')

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      status: user.status,
      patientCount: user.patients.length,
    }
  }

  async getAllUsers(userId: string, skip = 0, take = 20) {
    await this.verifyAdminRole(userId)
    const result = await this.repository.findAll(skip, take)

    return {
      users: result.users.map(u => ({
        ...u,
        patientCount: u._count.patients,
      })) as UserSummary[],
      total: result.total,
    }
  }

  async getUserById(adminUserId: string, targetUserId: string) {
    await this.verifyAdminRole(adminUserId)

    const user = await this.repository.findById(targetUserId)
    if (!user) throw new Error('User not found')

    interface PatientWithId {
      id: string
    }

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      status: user.status,
      createdAt: user.createdAt,
      lastLoginAt: user.lastLoginAt,
      patientIds: user.patients.map((p: PatientWithId) => p.id),
    }
  }

  async createUser(
    adminUserId: string,
    input: {
      email: string
      password: string
      name?: string
      role: Role
    }
  ) {
    await this.verifyAdminRole(adminUserId)

    const existing = await this.repository.findByEmail(input.email)
    if (existing) throw new Error('Email already registered')

    const passwordHash = await hashPassword(input.password)
    const user = await this.repository.create({ ...input, password: passwordHash })

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    }
  }

  async updateUser(
    adminUserId: string,
    targetUserId: string,
    input: {
      name?: string
      role?: Role
      status?: Status
    }
  ) {
    await this.verifyAdminRole(adminUserId)

    if (adminUserId === targetUserId && input.role && input.role !== 'ADMIN') {
      throw new Error('Cannot downgrade your own admin role')
    }

    const user = await this.repository.update(targetUserId, input)

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      status: user.status,
    }
  }

  async deleteUser(adminUserId: string, targetUserId: string) {
    await this.verifyAdminRole(adminUserId)

    if (adminUserId === targetUserId) {
      throw new Error('Cannot delete your own account')
    }

    await this.repository.delete(targetUserId)
    return { success: true }
  }

  async changePassword(userId: string, oldPassword: string, newPassword: string) {
    await this.verifyUserStatus(userId)

    const user = await this.repository.findById(userId)
    if (!user) throw new Error('User not found')

    const bcrypt = await import('bcryptjs')
    const isValid = await bcrypt.compare(oldPassword, user.passwordHash)
    if (!isValid) throw new Error('Current password is incorrect')

    const passwordHash = await hashPassword(newPassword)
    await this.repository.updatePassword(userId, passwordHash)

    return { success: true }
  }

  async resetPassword(adminUserId: string, targetUserId: string, newPassword: string) {
    await this.verifyAdminRole(adminUserId)

    const passwordHash = await hashPassword(newPassword)
    await this.repository.updatePassword(targetUserId, passwordHash)

    return { success: true }
  }
}
