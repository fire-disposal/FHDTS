import type { Status } from '@prisma/client'
import { prisma } from '../../shared/infra/database.js'
import { Repository } from '../../shared/kernel/base.js'

export interface CreatePatientInput {
  name: string
  dateOfBirth?: Date
  gender?: string
  phone?: string
  address?: string
  caregiverIds?: string[]
}

export interface UpdatePatientInput {
  name?: string
  dateOfBirth?: Date
  gender?: string
  phone?: string
  address?: string
  status?: Status
  caregiverIds?: string[]
}

export class PatientRepository extends Repository {
  constructor() {
    super(prisma)
  }

  async findById(id: string) {
    return this.db.patient.findUnique({
      where: { id },
      include: {
        caregivers: { select: { id: true, email: true, name: true, role: true } },
        observations: { take: 10, orderBy: { timestamp: 'desc' } },
        devices: true,
        _count: { select: { observations: true, devices: true } },
      },
    })
  }

  async findAll(skip = 0, take = 20, filters?: { status?: Status; search?: string }) {
    const where: Record<string, unknown> = {}

    if (filters?.status) where.status = filters.status
    if (filters?.search) {
      where.OR = [{ name: { contains: filters.search } }, { phone: { contains: filters.search } }]
    }

    const [patients, total] = await Promise.all([
      this.db.patient.findMany({
        skip,
        take,
        where,
        select: {
          id: true,
          name: true,
          dateOfBirth: true,
          gender: true,
          phone: true,
          status: true,
          createdAt: true,
          caregivers: { select: { id: true, email: true, name: true } },
          _count: { select: { observations: true, devices: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.db.patient.count({ where }),
    ])

    return { patients, total }
  }

  async create(input: CreatePatientInput) {
    return this.db.patient.create({
      data: {
        name: input.name,
        dateOfBirth: input.dateOfBirth,
        gender: input.gender,
        phone: input.phone,
        address: input.address,
        caregivers: input.caregiverIds?.length
          ? { connect: input.caregiverIds.map(id => ({ id })) }
          : undefined,
      },
      include: { caregivers: { select: { id: true, email: true, name: true } } },
    })
  }

  async update(id: string, input: UpdatePatientInput) {
    const { caregiverIds, ...data } = input

    return this.db.patient.update({
      where: { id },
      data: {
        ...data,
        caregivers: caregiverIds ? { set: caregiverIds.map(id => ({ id })) } : undefined,
      },
      include: { caregivers: { select: { id: true, email: true, name: true } } },
    })
  }

  async delete(id: string) {
    return this.db.patient.delete({ where: { id } })
  }

  async assignCaregiver(patientId: string, caregiverId: string) {
    return this.db.patient.update({
      where: { id: patientId },
      data: { caregivers: { connect: { id: caregiverId } } },
    })
  }

  async removeCaregiver(patientId: string, caregiverId: string) {
    return this.db.patient.update({
      where: { id: patientId },
      data: { caregivers: { disconnect: { id: caregiverId } } },
    })
  }
}
