import type { prisma } from '../../../shared/infra/database'
import { Service } from '../../../shared/kernel/base'

interface PatientSummary {
  id: string
  name: string
  dateOfBirth: Date
  gender: string
  mrn?: string
  status: string
  createdAt: Date
  updatedAt: Date
  caregiverIds: string[]
}

interface PatientDetail {
  id: string
  name: string
  dateOfBirth: Date
  gender: string
  mrn?: string
  status: string
  phone?: string
  address?: string
  createdAt: Date
  updatedAt: Date
  caregiverIds: string[]
  observations: object[] // 根据需要可以定义具体的类型
}

interface CreatePatientInput {
  name: string
  dateOfBirth?: Date
  gender?: string
  phone?: string
  address?: string
  caregiverIds?: string[]
}

interface UpdatePatientInput {
  status?: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED'
  name?: string
  dateOfBirth?: Date
  gender?: string
  phone?: string
  address?: string
  caregiverIds?: string[]
}

export class PatientService extends Service {
  async getAll(
    take?: number,
    skip?: number,
    search?: string,
    status?: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED'
  ): Promise<{ patients: PatientSummary[]; total: number }> {
    const whereClause: {
      AND?: Array<{
        OR?: Array<{ name?: { contains: string } }>
        name?: { contains: string }
      }>
      status?: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED'
    } = {}

    if (search) {
      whereClause.name = { contains: search, mode: 'insensitive' }
    }

    if (status) {
      whereClause.status = status
    }

    const [patients, total] = await Promise.all([
      this.db.patient.findMany({
        where: whereClause,
        take,
        skip,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          name: true,
          dateOfBirth: true,
          gender: true,
          mrn: true,
          status: true,
          createdAt: true,
          updatedAt: true,
          caregivers: {
            select: {
              id: true,
            },
          },
        },
      }),
      this.db.patient.count({ where: whereClause }),
    ])

    const transformedPatients = patients.map(patient => ({
      id: patient.id,
      name: patient.name,
      dateOfBirth: patient.dateOfBirth,
      gender: patient.gender,
      mrn: patient.mrn,
      status: patient.status,
      createdAt: patient.createdAt,
      updatedAt: patient.updatedAt,
      caregiverIds: patient.caregivers.map(c => c.id),
    }))

    return { patients: transformedPatients, total }
  }

  async getById(patientId: string): Promise<PatientDetail> {
    const patient = await this.db.patient.findUnique({
      where: { id: patientId },
      select: {
        id: true,
        name: true,
        dateOfBirth: true,
        gender: true,
        mrn: true,
        status: true,
        phone: true,
        address: true,
        createdAt: true,
        updatedAt: true,
        caregivers: {
          select: {
            id: true,
          },
        },
        observations: {
          select: {
            id: true,
            code: true,
            value: true,
            unit: true,
            effectiveAt: true,
            note: true,
          },
        },
      },
    })

    if (!patient) {
      throw new Error('Patient not found')
    }

    return {
      id: patient.id,
      name: patient.name,
      dateOfBirth: patient.dateOfBirth,
      gender: patient.gender,
      mrn: patient.mrn,
      status: patient.status,
      phone: patient.phone || undefined,
      address: patient.address || undefined,
      createdAt: patient.createdAt,
      updatedAt: patient.updatedAt,
      caregiverIds: patient.caregivers.map(c => c.id),
      observations: patient.observations,
    }
  }

  async create(input: CreatePatientInput): Promise<PatientSummary> {
    const patient = await this.db.patient.create({
      data: {
        name: input.name,
        dateOfBirth: input.dateOfBirth || new Date(),
        gender: input.gender || 'Unknown',
        phone: input.phone,
        address: input.address,
        ...(input.caregiverIds &&
          input.caregiverIds.length > 0 && {
            caregivers: {
              connect: input.caregiverIds.map(id => ({ id })),
            },
          }),
      },
      select: {
        id: true,
        name: true,
        dateOfBirth: true,
        gender: true,
        mrn: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        caregivers: {
          select: {
            id: true,
          },
        },
      },
    })

    return {
      id: patient.id,
      name: patient.name,
      dateOfBirth: patient.dateOfBirth,
      gender: patient.gender,
      mrn: patient.mrn,
      status: patient.status,
      createdAt: patient.createdAt,
      updatedAt: patient.updatedAt,
      caregiverIds: patient.caregivers.map(c => c.id),
    }
  }

  async update(patientId: string, input: UpdatePatientInput): Promise<PatientSummary> {
    // 分离caregiverIds以便特殊处理
    const { caregiverIds, ...updateData } = input

    const updatePayload: {
      name?: string
      dateOfBirth?: Date
      gender?: string
      phone?: string
      address?: string
      status?: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED'
      caregivers?: {
        set: { id: string }[]
      }
    } = { ...updateData }

    if (caregiverIds) {
      updatePayload.caregivers = {
        set: caregiverIds.map(id => ({ id })),
      }
    }

    const patient = await this.db.patient.update({
      where: { id: patientId },
      data: updatePayload,
      select: {
        id: true,
        name: true,
        dateOfBirth: true,
        gender: true,
        mrn: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        caregivers: {
          select: {
            id: true,
          },
        },
      },
    })

    return {
      id: patient.id,
      name: patient.name,
      dateOfBirth: patient.dateOfBirth,
      gender: patient.gender,
      mrn: patient.mrn,
      status: patient.status,
      createdAt: patient.createdAt,
      updatedAt: patient.updatedAt,
      caregiverIds: patient.caregivers.map(c => c.id),
    }
  }

  async delete(patientId: string): Promise<{ success: boolean }> {
    await this.db.patient.delete({
      where: { id: patientId },
    })

    return { success: true }
  }

  async assignCaregiver(patientId: string, caregiverId: string): Promise<{ success: boolean }> {
    await this.db.patient.update({
      where: { id: patientId },
      data: {
        caregivers: {
          connect: { id: caregiverId },
        },
      },
    })

    return { success: true }
  }

  async removeCaregiver(patientId: string, caregiverId: string): Promise<{ success: boolean }> {
    await this.db.patient.update({
      where: { id: patientId },
      data: {
        caregivers: {
          disconnect: { id: caregiverId },
        },
      },
    })

    return { success: true }
  }

  async verifyPatientAccess(patientId: string, userId: string, userRole: string): Promise<boolean> {
    if (userRole === 'ADMIN') {
      return true
    }

    // 检查用户是否是患者的护理人员
    const connection = await this.db.patient.findFirst({
      where: {
        id: patientId,
        caregivers: {
          some: {
            id: userId,
          },
        },
      },
    })

    return !!connection
  }
}

export function createPatientService(db: typeof prisma) {
  return new PatientService(db)
}
