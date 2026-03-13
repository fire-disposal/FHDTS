import { prisma } from '../../shared/infra/prisma.js'

export class ObservationRepository {
  async findByPatientId(patientId: string, limit = 10) {
    return prisma.observation.findMany({
      where: { patientId },
      orderBy: { timestamp: 'desc' },
      take: limit,
    })
  }

  async findLatestByPatient(patientId: string) {
    return prisma.observation.findFirst({
      where: { patientId },
      orderBy: { timestamp: 'desc' },
    })
  }

  async create(input: {
    patientId: string
    code: string
    value: number
    unit: string
    note?: string
  }) {
    return prisma.observation.create({ data: input })
  }

  async countByPatient(patientId: string) {
    return prisma.observation.count({ where: { patientId } })
  }

  async getStats(patientId: string, code: string, days = 7) {
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

    const observations = await prisma.observation.findMany({
      where: {
        patientId,
        code,
        timestamp: { gte: startDate },
      },
      orderBy: { timestamp: 'asc' },
    })

    if (observations.length === 0) return null

    const values = observations.map(o => o.value)
    return {
      min: Math.min(...values),
      max: Math.max(...values),
      avg: values.reduce((a, b) => a + b, 0) / values.length,
      count: values.length,
      latest: observations[observations.length - 1],
    }
  }
}
