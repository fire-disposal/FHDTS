import { beforeEach, describe, expect, it, vi } from 'vitest'
import { prisma } from '../../shared/infra/database.js'
import { PatientRepository } from './patient.repository.js'

// Mock prisma
vi.mock('../../shared/infra/database.js', () => ({
  prisma: {
    patient: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(),
    },
    observation: {
      count: vi.fn(),
    },
    device: {
      count: vi.fn(),
    },
  },
}))

describe('PatientRepository', () => {
  let repository: PatientRepository

  beforeEach(() => {
    repository = new PatientRepository()
    vi.clearAllMocks()
  })

  describe('findById', () => {
    it('should return patient with all related data when found by id', async () => {
      const mockPatient = {
        id: 'patient-1',
        name: 'John Doe',
        dateOfBirth: new Date('1990-01-01'),
        gender: 'Male',
        phone: '+1234567890',
        address: '123 Main St',
        status: 'ACTIVE',
        createdAt: new Date(),
        updatedAt: new Date(),
        caregivers: [
          {
            id: 'user-1',
            email: 'admin@example.com',
            name: 'Admin',
            role: 'ADMIN',
          },
          {
            id: 'user-2',
            email: 'caregiver@example.com',
            name: 'Caregiver',
            role: 'CAREGIVER',
          },
        ],
        observations: [
          {
            id: 'obs-1',
            code: 'weight',
            value: 70,
            unit: 'kg',
            timestamp: new Date(),
            note: 'Normal weight',
          },
        ],
        devices: [
          {
            id: 'dev-1',
            name: 'Blood Pressure Monitor',
            type: 'BP',
            serialNumber: 'BP-001',
            status: 'ACTIVE',
          },
        ],
        _count: {
          observations: 1,
          devices: 1,
        },
      }

      vi.mocked(prisma.patient.findUnique).mockResolvedValue(mockPatient)

      const result = await repository.findById('patient-1')

      expect(result).toEqual(mockPatient)
      expect(prisma.patient.findUnique).toHaveBeenCalledWith({
        where: { id: 'patient-1' },
        include: {
          caregivers: {
            select: {
              id: true,
              email: true,
              name: true,
              role: true,
            },
          },
          observations: {
            take: 10,
            orderBy: { timestamp: 'desc' },
          },
          devices: true,
          _count: {
            select: {
              observations: true,
              devices: true,
            },
          },
        },
      })
    })

    it('should return null when patient not found by id', async () => {
      vi.mocked(prisma.patient.findUnique).mockResolvedValue(null)

      const result = await repository.findById('nonexistent-patient')

      expect(result).toBeNull()
    })
  })

  describe('findAll', () => {
    it('should return all patients with pagination and counts', async () => {
      const mockPatients = [
        {
          id: 'patient-1',
          name: 'John Doe',
          dateOfBirth: new Date('1990-01-01'),
          gender: 'Male',
          phone: '+1234567890',
          status: 'ACTIVE',
          createdAt: new Date(),
          updatedAt: new Date(),
          caregivers: [{ id: 'user-1', email: 'admin@example.com', name: 'Admin' }],
          _count: {
            observations: 5,
            devices: 2,
          },
        },
        {
          id: 'patient-2',
          name: 'Jane Smith',
          dateOfBirth: new Date('1985-05-15'),
          gender: 'Female',
          phone: '+1234567891',
          status: 'INACTIVE',
          createdAt: new Date(),
          updatedAt: new Date(),
          caregivers: [{ id: 'user-2', email: 'caregiver@example.com', name: 'Caregiver' }],
          _count: {
            observations: 3,
            devices: 1,
          },
        },
      ]

      vi.mocked(prisma.patient.findMany).mockResolvedValue(mockPatients)
      vi.mocked(prisma.patient.count).mockResolvedValue(2)

      const result = await repository.findAll(0, 10)

      expect(result.patients).toEqual(mockPatients)
      expect(result.total).toBe(2)
      expect(prisma.patient.findMany).toHaveBeenCalledWith({
        skip: 0,
        take: 10,
        where: {},
        select: {
          id: true,
          name: true,
          dateOfBirth: true,
          gender: true,
          phone: true,
          status: true,
          createdAt: true,
          caregivers: {
            select: {
              id: true,
              email: true,
              name: true,
            },
          },
          _count: {
            select: {
              observations: true,
              devices: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      })
      expect(prisma.patient.count).toHaveBeenCalledWith({ where: {} })
    })

    it('should apply filters when provided', async () => {
      const mockPatients = [
        {
          id: 'patient-1',
          name: 'John Doe',
          dateOfBirth: new Date('1990-01-01'),
          gender: 'Male',
          phone: '+1234567890',
          status: 'ACTIVE',
          createdAt: new Date(),
          updatedAt: new Date(),
          caregivers: [{ id: 'user-1', email: 'admin@example.com', name: 'Admin' }],
          _count: {
            observations: 5,
            devices: 2,
          },
        },
      ]

      vi.mocked(prisma.patient.findMany).mockResolvedValue(mockPatients)
      vi.mocked(prisma.patient.count).mockResolvedValue(1)

      const result = await repository.findAll(0, 10, { status: 'ACTIVE', search: 'John' })

      expect(result.patients).toEqual(mockPatients)
      expect(prisma.patient.findMany).toHaveBeenCalledWith({
        skip: 0,
        take: 10,
        where: {
          status: 'ACTIVE',
          OR: [{ name: { contains: 'John' } }, { phone: { contains: 'John' } }],
        },
        select: {
          id: true,
          name: true,
          dateOfBirth: true,
          gender: true,
          phone: true,
          status: true,
          createdAt: true,
          caregivers: {
            select: {
              id: true,
              email: true,
              name: true,
            },
          },
          _count: {
            select: {
              observations: true,
              devices: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      })
    })

    it('should handle empty search results', async () => {
      vi.mocked(prisma.patient.findMany).mockResolvedValue([])
      vi.mocked(prisma.patient.count).mockResolvedValue(0)

      const result = await repository.findAll(0, 10, { search: 'nonexistent' })

      expect(result.patients).toEqual([])
      expect(result.total).toBe(0)
    })
  })

  describe('create', () => {
    it('should create a new patient with provided data', async () => {
      const mockInput = {
        name: 'New Patient',
        dateOfBirth: new Date('2000-01-01'),
        gender: 'Female',
        phone: '+1234567890',
        address: '456 New St',
        caregiverIds: ['caregiver-1', 'caregiver-2'],
      }

      const mockCreatedPatient = {
        id: 'patient-new',
        name: 'New Patient',
        dateOfBirth: new Date('2000-01-01'),
        gender: 'Female',
        phone: '+1234567890',
        address: '456 New St',
        status: 'ACTIVE',
        createdAt: new Date(),
        updatedAt: new Date(),
        caregivers: [
          { id: 'caregiver-1', email: 'caregiver1@example.com', name: 'Caregiver 1' },
          { id: 'caregiver-2', email: 'caregiver2@example.com', name: 'Caregiver 2' },
        ],
      }

      vi.mocked(prisma.patient.create).mockResolvedValue(mockCreatedPatient)

      const result = await repository.create(mockInput)

      expect(result).toEqual(mockCreatedPatient)
      expect(prisma.patient.create).toHaveBeenCalledWith({
        data: {
          name: 'New Patient',
          dateOfBirth: new Date('2000-01-01'),
          gender: 'Female',
          phone: '+1234567890',
          address: '456 New St',
          caregivers: {
            connect: [{ id: 'caregiver-1' }, { id: 'caregiver-2' }],
          },
        },
        include: {
          caregivers: {
            select: {
              id: true,
              email: true,
              name: true,
            },
          },
        },
      })
    })

    it('should create patient without optional fields', async () => {
      const mockInput = {
        name: 'Minimal Patient',
        caregiverIds: [], // No caregivers initially
      }

      const mockCreatedPatient = {
        id: 'patient-minimal',
        name: 'Minimal Patient',
        dateOfBirth: null,
        gender: null,
        phone: null,
        address: null,
        status: 'ACTIVE',
        createdAt: new Date(),
        updatedAt: new Date(),
        caregivers: [],
      }

      vi.mocked(prisma.patient.create).mockResolvedValue(mockCreatedPatient)

      const result = await repository.create(mockInput)

      expect(result.name).toBe('Minimal Patient')
      expect(result.dateOfBirth).toBeNull()
      expect(result.caregivers).toEqual([])
      expect(prisma.patient.create).toHaveBeenCalledWith({
        data: {
          name: 'Minimal Patient',
          dateOfBirth: undefined,
          gender: undefined,
          phone: undefined,
          address: undefined,
          caregivers: undefined,
        },
        include: {
          caregivers: {
            select: {
              id: true,
              email: true,
              name: true,
            },
          },
        },
      })
    })
  })

  describe('update', () => {
    it('should update patient fields when provided', async () => {
      const mockUpdateData = {
        name: 'Updated Patient Name',
        status: 'INACTIVE',
        phone: '+9876543210',
      }

      const mockUpdatedPatient = {
        id: 'patient-1',
        name: 'Updated Patient Name',
        dateOfBirth: new Date('1990-01-01'),
        gender: 'Male',
        phone: '+9876543210',
        address: '123 Main St',
        status: 'INACTIVE',
        createdAt: new Date(),
        updatedAt: new Date(),
        caregivers: [{ id: 'caregiver-1', email: 'caregiver@example.com', name: 'Caregiver' }],
      }

      vi.mocked(prisma.patient.update).mockResolvedValue(mockUpdatedPatient)

      const result = await repository.update('patient-1', mockUpdateData)

      expect(result).toEqual(mockUpdatedPatient)
      expect(prisma.patient.update).toHaveBeenCalledWith({
        where: { id: 'patient-1' },
        data: {
          name: 'Updated Patient Name',
          status: 'INACTIVE',
          phone: '+9876543210',
          caregivers: undefined,
        },
        include: {
          caregivers: {
            select: {
              id: true,
              email: true,
              name: true,
            },
          },
        },
      })
    })

    it('should update caregivers when provided', async () => {
      const mockUpdateData = {
        name: 'Patient with New Caregivers',
        caregiverIds: ['new-caregiver-1', 'new-caregiver-2'],
      }

      const mockUpdatedPatient = {
        id: 'patient-1',
        name: 'Patient with New Caregivers',
        dateOfBirth: new Date('1990-01-01'),
        gender: 'Male',
        phone: '+1234567890',
        address: '123 Main St',
        status: 'ACTIVE',
        createdAt: new Date(),
        updatedAt: new Date(),
        caregivers: [
          { id: 'new-caregiver-1', email: 'new1@example.com', name: 'New Caregiver 1' },
          { id: 'new-caregiver-2', email: 'new2@example.com', name: 'New Caregiver 2' },
        ],
      }

      vi.mocked(prisma.patient.update).mockResolvedValue(mockUpdatedPatient)

      const result = await repository.update('patient-1', mockUpdateData)

      expect(result.caregivers).toHaveLength(2)
      expect(result.caregivers.map(c => c.id)).toContain('new-caregiver-1')
      expect(result.caregivers.map(c => c.id)).toContain('new-caregiver-2')
      expect(prisma.patient.update).toHaveBeenCalledWith({
        where: { id: 'patient-1' },
        data: {
          name: 'Patient with New Caregivers',
          caregivers: {
            set: [{ id: 'new-caregiver-1' }, { id: 'new-caregiver-2' }],
          },
        },
        include: {
          caregivers: {
            select: {
              id: true,
              email: true,
              name: true,
            },
          },
        },
      })
    })
  })

  describe('delete', () => {
    it('should delete patient by id', async () => {
      const mockDeletedPatient = {
        id: 'patient-1',
        name: 'To Delete',
        dateOfBirth: new Date('1990-01-01'),
        gender: 'Male',
        phone: '+1234567890',
        address: '123 Main St',
        status: 'ACTIVE',
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      vi.mocked(prisma.patient.delete).mockResolvedValue(mockDeletedPatient)

      const result = await repository.delete('patient-1')

      expect(result).toEqual(mockDeletedPatient)
      expect(prisma.patient.delete).toHaveBeenCalledWith({
        where: { id: 'patient-1' },
      })
    })

    it('should throw error when trying to delete non-existent patient', async () => {
      vi.mocked(prisma.patient.delete).mockRejectedValue(new Error('Patient not found'))

      await expect(repository.delete('nonexistent-patient')).rejects.toThrow('Patient not found')
    })
  })

  describe('assignCaregiver', () => {
    it('should assign caregiver to patient', async () => {
      const mockPatient = {
        id: 'patient-1',
        name: 'Test Patient',
        caregivers: [
          { id: 'existing-caregiver', email: 'exist@example.com', name: 'Existing' },
          { id: 'new-caregiver', email: 'new@example.com', name: 'New' },
        ],
      }

      vi.mocked(prisma.patient.update).mockResolvedValue(mockPatient)

      const result = await repository.assignCaregiver('patient-1', 'new-caregiver')

      expect(result).toEqual(mockPatient)
      expect(prisma.patient.update).toHaveBeenCalledWith({
        where: { id: 'patient-1' },
        data: {
          caregivers: {
            connect: { id: 'new-caregiver' },
          },
        },
      })
    })

    it('should handle case where caregiver already assigned', async () => {
      const mockPatient = {
        id: 'patient-1',
        name: 'Test Patient',
        caregivers: [{ id: 'existing-caregiver', email: 'exist@example.com', name: 'Existing' }],
      }

      vi.mocked(prisma.patient.update).mockResolvedValue(mockPatient)

      const result = await repository.assignCaregiver('patient-1', 'existing-caregiver')

      expect(result).toEqual(mockPatient)
    })
  })

  describe('removeCaregiver', () => {
    it('should remove caregiver from patient', async () => {
      const mockPatient = {
        id: 'patient-1',
        name: 'Test Patient',
        caregivers: [{ id: 'remaining-caregiver', email: 'remain@example.com', name: 'Remaining' }],
      }

      vi.mocked(prisma.patient.update).mockResolvedValue(mockPatient)

      const result = await repository.removeCaregiver('patient-1', 'to-remove-caregiver')

      expect(result).toEqual(mockPatient)
      expect(prisma.patient.update).toHaveBeenCalledWith({
        where: { id: 'patient-1' },
        data: {
          caregivers: {
            disconnect: { id: 'to-remove-caregiver' },
          },
        },
      })
    })

    it('should handle case where caregiver not assigned', async () => {
      const mockPatient = {
        id: 'patient-1',
        name: 'Test Patient',
        caregivers: [{ id: 'existing-caregiver', email: 'exist@example.com', name: 'Existing' }],
      }

      vi.mocked(prisma.patient.update).mockResolvedValue(mockPatient)

      const result = await repository.removeCaregiver('patient-1', 'non-assigned-caregiver')

      expect(result).toEqual(mockPatient)
    })
  })
})
