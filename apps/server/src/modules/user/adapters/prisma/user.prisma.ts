import type { prisma } from '../../../../shared/platform/database.js'
import type { UserPort } from '../../ports/user.port.js'

const userSummarySelect = {
  id: true,
  email: true,
  name: true,
  role: true,
  status: true,
  createdAt: true,
  lastLoginAt: true,
} as const

export class PrismaUserAdapter implements UserPort {
  constructor(private readonly db: typeof prisma) {}

  findProfileById(userId: string) {
    return this.db.user.findUnique({ where: { id: userId }, select: userSummarySelect })
  }

  findById(userId: string) {
    return this.db.user.findUnique({ where: { id: userId }, select: userSummarySelect })
  }

  async listAll() {
    const [users, total] = await Promise.all([
      this.db.user.findMany({
        orderBy: { createdAt: 'desc' },
        select: userSummarySelect,
      }),
      this.db.user.count(),
    ])

    return { users, total }
  }

  findByEmail(email: string) {
    return this.db.user.findUnique({ where: { email }, select: { id: true } })
  }

  create(input: { email: string; passwordHash: string; role: 'ADMIN' | 'USER'; name?: string }) {
    return this.db.user.create({
      data: {
        email: input.email,
        passwordHash: input.passwordHash,
        name: input.name,
        role: input.role,
      },
      select: userSummarySelect,
    })
  }

  update(input: {
    userId: string
    data: {
      status?: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED'
      name?: string
      role?: 'ADMIN' | 'USER'
    }
  }) {
    return this.db.user.update({
      where: { id: input.userId },
      data: input.data,
      select: userSummarySelect,
    })
  }

  async delete(userId: string) {
    await this.db.user.delete({ where: { id: userId } })
  }

  findPasswordHash(userId: string) {
    return this.db.user.findUnique({ where: { id: userId }, select: { passwordHash: true } })
  }

  async updatePassword(userId: string, passwordHash: string) {
    await this.db.user.update({
      where: { id: userId },
      data: { passwordHash },
    })
  }
}
