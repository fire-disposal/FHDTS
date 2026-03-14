import type { prisma } from '../../../../shared/platform/database.js'
import type { AuthUserPort } from '../../ports/auth-user.port.js'

export class PrismaAuthUserAdapter implements AuthUserPort {
  constructor(private readonly db: typeof prisma) {}

  findByEmail(email: string) {
    return this.db.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        status: true,
        passwordHash: true,
      },
    })
  }

  findProfileById(userId: string) {
    return this.db.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        status: true,
      },
    })
  }

  create(input: { email: string; passwordHash: string; name?: string }) {
    return this.db.user.create({
      data: {
        email: input.email,
        passwordHash: input.passwordHash,
        name: input.name,
        role: 'USER',
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        status: true,
      },
    })
  }

  async updateLastLogin(userId: string) {
    await this.db.user.update({
      where: { id: userId },
      data: { lastLoginAt: new Date() },
    })
  }
}
