import type { Role, Status } from '@prisma/client'
import { prisma } from '../../shared/infra/database.js'
import { Service } from '../../shared/kernel/base.js'
import { PatientRepository } from './patient.repository.js'

export interface PatientSummary {
  id: string
  name: string
  dateOfBirth: Date | null
  gender: string | null
  phone: string | null
  status: string
  createdAt: Date
  caregivers: Array<{ id: string; email: string; name: string | null }>
  observationCount: number
  deviceCount: number
}

export interface PatientDetail extends PatientSummary {
  address: string | null
  observations: Array<{
    id: string
    code: string
    value: number
    unit: string
    timestamp: Date
    note: string | null
  }>
  devices: Array<{
    id: string
    name: string
    type: string
    serialNumber: string
    status: string
  }>
}

// Prisma return types based on repository queries
type PatientFromFindAll = {
  id: string
  name: string
  dateOfBirth: Date | null
  gender: string | null
  phone: string | null
  status: string
  createdAt: Date
  caregivers: Array<{ id: string; email: string; name: string | null }>
  _count: {
    observations: number
    devices: number
  }
}

type PatientFromFindById = {
  id: string
  name: string
  dateOfBirth: Date | null
  gender: string | null
  phone: string | null
  status: string
  createdAt: Date
  address: string | null
  caregivers: Array<{ id: string; email: string; name: string | null; role: string }>
  observations: Array<{
    id: string
    code: string
    value: number
    unit: string
    timestamp: Date
    note: string | null
  }>
  devices: Array<{
    id: string
    name: string
    type: string
    serialNumber: string
    status: string
  }>
  _count: {
    observations: number
    devices: number
  }
}

type PatientFromCreate = {
  id: string
  name: string
  caregivers: Array<{ id: string }>
}

type PatientFromUpdate = {
  id: string
  name: string
  status: string
  caregivers: Array<{ id: string }>
}

export class PatientService extends Service {
  private repository: PatientRepository

  constructor() {
    super(prisma)
    this.repository = new PatientRepository()
  }

  async getAllPatients(
    userId: string,
    userRole: Role,
    skip = 0,
    take = 20,
    filters?: { status?: Status; search?: string }
  ) {
    if (userRole === 'FAMILY') {
      const result = await this.repository.findAll(skip, take, filters)
      const userPatients = result.patients.filter(p => p.caregivers.some(c => c.id === userId))

      return {
        patients: userPatients.map(this.toSummary),
        total: userPatients.length,
      }
    }

    const result = await this.repository.findAll(skip, take, filters)
    return {
      patients: result.patients.map(this.toSummary),
      total: result.total,
    }
  }

  async getPatientById(userId: string, userRole: Role, patientId: string): Promise<PatientDetail> {
    await this.verifyPatientAccess(userId, userRole, patientId)

    const patient = (await this.repository.findById(patientId)) as PatientFromFindById | null
    if (!patient) throw new Error('Patient not found')

    return {
      id: patient.id,
      name: patient.name,
      dateOfBirth: patient.dateOfBirth,
      gender: patient.gender,
      phone: patient.phone,
      status: patient.status,
      createdAt: patient.createdAt,
      address: patient.address,
      caregivers: patient.caregivers,
      observationCount: patient._count.observations,
      deviceCount: patient._count.devices,
      observations: patient.observations.map(o => ({
        id: o.id,
        code: o.code,
        value: o.value,
        unit: o.unit,
        timestamp: o.timestamp,
        note: o.note,
      })),
      devices: patient.devices.map(d => ({
        id: d.id,
        name: d.name,
        type: d.type,
        serialNumber: d.serialNumber,
        status: d.status,
      })),
    }
  }

  async createPatient(
    userId: string,
    userRole: Role,
    input: {
      name: string
      dateOfBirth?: Date
      gender?: string
      phone?: string
      address?: string
      caregiverIds?: string[]
    }
  ) {
    if (userRole === 'FAMILY') {
      input.caregiverIds = [userId]
    }

    const patient = (await this.repository.create(input)) as PatientFromCreate

    return {
      id: patient.id,
      name: patient.name,
      caregiverIds: patient.caregivers.map(c => c.id),
    }
  }

  async updatePatient(
    userId: string,
    userRole: Role,
    patientId: string,
    input: {
      name?: string
      dateOfBirth?: Date
      gender?: string
      phone?: string
      address?: string
      status?: Status
      caregiverIds?: string[]
    }
  ) {
    await this.verifyPatientAccess(userId, userRole, patientId)

    if (userRole === 'FAMILY') {
      delete input.caregiverIds
      delete input.status
    }

    const updated = (await this.repository.update(patientId, input)) as PatientFromUpdate

    return {
      id: updated.id,
      name: updated.name,
      status: updated.status,
      caregiverIds: updated.caregivers.map(c => c.id),
    }
  }

  async deletePatient(_userId: string, userRole: Role, patientId: string) {
    if (userRole !== 'ADMIN') {
      throw new Error('Unauthorized: Only admins can delete patients')
    }

    await this.repository.delete(patientId)
    return { success: true }
  }

  async assignCaregiver(_userId: string, userRole: Role, patientId: string, caregiverId: string) {
    if (userRole !== 'ADMIN' && userRole !== 'CAREGIVER') {
      throw new Error('Unauthorized')
    }

    await this.repository.assignCaregiver(patientId, caregiverId)
    return { success: true }
  }

  async removeCaregiver(userId: string, userRole: Role, patientId: string, caregiverId: string) {
    if (userRole !== 'ADMIN' && userRole !== 'CAREGIVER') {
      throw new Error('Unauthorized')
    }

    if (userId === caregiverId) {
      throw new Error('Cannot remove yourself as a caregiver')
    }

    await this.repository.removeCaregiver(patientId, caregiverId)
    return { success: true }
  }

  private toSummary(patient: PatientFromFindAll): PatientSummary {
    return {
      id: patient.id,
      name: patient.name,
      dateOfBirth: patient.dateOfBirth,
      gender: patient.gender,
      phone: patient.phone,
      status: patient.status,
      createdAt: patient.createdAt,
      caregivers: patient.caregivers,
      observationCount: patient._count.observations,
      deviceCount: patient._count.devices,
    }
  }
}
