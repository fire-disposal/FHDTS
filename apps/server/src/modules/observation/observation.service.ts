import { prisma } from '../../shared/infra/prisma.js'
import { Service } from '../../shared/kernel/base.js'
import { ObservationRepository } from './observation.repository.js'

export interface ObservationSummary {
  id: string
  patientId: string
  code: string
  value: number
  unit: string
  timestamp: Date
  note: string | null
}

export class ObservationService extends Service {
  private repository: ObservationRepository

  constructor() {
    super(prisma)
    this.repository = new ObservationRepository()
  }

  async getLatestObservations(userId: string, userRole: string, limit = 10) {
    const patients = await this.getAccessiblePatients(userId, userRole)
    const patientIds = patients.map(p => p.id)

    if (patientIds.length === 0) return []

    const observations = await prisma.observation.findMany({
      where: { patientId: { in: patientIds } },
      orderBy: { timestamp: 'desc' },
      take: limit,
      include: {
        patient: {
          select: { name: true },
        },
      },
    })

    return observations.map(o => ({
      ...o,
      patientName: o.patient.name,
    }))
  }

  async getByPatientId(userId: string, userRole: string, patientId: string, limit = 20) {
    await this.verifyPatientAccess(userId, userRole, patientId)
    return this.repository.findByPatientId(patientId, limit)
  }

  async create(
    userId: string,
    input: {
      patientId: string
      code: string
      value: number
      unit: string
      note?: string
    }
  ) {
    await this.verifyPatientAccess(userId, 'ANY', input.patientId)
    return this.repository.create(input)
  }

  async getStats(userId: string, userRole: string, patientId: string, code: string, days = 7) {
    await this.verifyPatientAccess(userId, userRole, patientId)
    return this.repository.getStats(patientId, code, days)
  }

  async getCountByPatient(userId: string, userRole: string, patientId: string) {
    await this.verifyPatientAccess(userId, userRole, patientId)
    return this.repository.countByPatient(patientId)
  }

  private async getAccessiblePatients(userId: string, userRole: string) {
    if (userRole === 'ADMIN') {
      return prisma.patient.findMany({ select: { id: true, name: true } })
    }

    return prisma.patient.findMany({
      where: {
        caregivers: { some: { id: userId } },
      },
      select: { id: true, name: true },
    })
  }
}
