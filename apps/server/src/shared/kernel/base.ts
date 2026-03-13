import type { prisma } from '../infra/database.js'

export abstract class Repository {
  constructor(protected db: typeof prisma) {}
}

export abstract class Service {
  constructor(protected db: typeof prisma) {}

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

  protected async verifyPatientAccess(
    userId: string,
    userRole: string,
    patientId: string
  ): Promise<void> {
    if (userRole === 'ADMIN') return

    const patient = await this.db.patient.findUnique({
      where: { id: patientId },
      select: { caregivers: { select: { id: true } } },
    })

    if (!patient) throw new Error('Patient not found')

    if (userRole === 'FAMILY') {
      const isCaregiver = patient.caregivers.some(c => c.id === userId)
      if (!isCaregiver) throw new Error('Unauthorized: You are not assigned to this patient')
    }
  }
}
