import type { prisma } from '../infra/database.js'

export abstract class Repository {
  protected db: typeof prisma

  constructor(db: typeof prisma) {
    this.db = db
  }
}

export abstract class Service {
  protected db: typeof prisma

  constructor(db: typeof prisma) {
    this.db = db
  }

  protected async verifyAdminRole(userId: string): Promise<void> {
    const user = await this.db.user.findUnique({
      where: { id: userId },
      select: { role: true, status: true },
    })

    if (!user) throw new Error('User not found')
    if (user.status !== 'ACTIVE') throw new Error('Account is not active')
    if (user.role !== 'ADMIN') throw new Error('Admin access required')
  }

  protected async verifyUserStatus(userId: string): Promise<void> {
    const user = await this.db.user.findUnique({
      where: { id: userId },
      select: { status: true },
    })

    if (!user) throw new Error('User not found')
    if (user.status !== 'ACTIVE') throw new Error('Account is not active')
  }
}
