import { beforeEach, describe, expect, it, vi } from 'vitest'
import { prisma } from '../../shared/infra/database.js'
import { PatientService } from './patient.service.js'

// Mock prisma
vi.mock('../../shared/infra/database.js', () => ({
  prisma: {
    patient: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
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

describe('PatientService', () => {
  let service: PatientService

  beforeEach(() => {
    service = new PatientService()
    vi.clearAllMocks()
  })

  describe('getAllPatients', () => {
    it('should return all patients for admin user', async () => {
      const mockPatients = [
        {
          id: 'patient-1',
          name: 'John Doe',
          dateOfBirth: new Date('1990-01-01'),
          gender: 'Male',
          phone: '+1234567890',
          status: 'ACTIVE',
          createdAt: new Date(),
          caregivers: [{ id: 'user-1', email: 'admin@example.com', name: 'Admin' }],
          _count: { observations: 5, devices: 2 },
        },
      ]

      vi.mocked(prisma.patient.findMany).mockResolvedValue(mockPatients as never)
      vi.mocked(prisma.patient.count).mockResolvedValue(1)

      const result = await service.getAllPatients('user-1', 'ADMIN')

      expect(result.patients).toHaveLength(1)
      expect(result.patients[0].name).toBe('John Doe')
      expect(prisma.patient.findMany).toHaveBeenCalled()
    })

    it('should return only accessible patients for family user', async () => {
      const mockPatients = [
        {
          id: 'patient-1',
          name: 'John Doe',
          dateOfBirth: new Date('1990-01-01'),
          gender: 'Male',
          phone: '+1234567890',
          status: 'ACTIVE',
          createdAt: new Date(),
          caregivers: [{ id: 'family-user-1', email: 'family@example.com', name: 'Family Member' }],
          _count: { observations: 5, devices: 2 },
        },
        {
          id: 'patient-2',
          name: 'Jane Doe',
          dateOfBirth: new Date('1992-01-01'),
          gender: 'Female',
          phone: '+1234567891',
          status: 'ACTIVE',
          createdAt: new Date(),
          caregivers: [{ id: 'other-user-1', email: 'other@example.com', name: 'Other Family' }],
          _count: { observations: 3, devices: 1 },
        },
      ]

      vi.mocked(prisma.patient.findMany).mockResolvedValue(mockPatients as never)
      vi.mocked(prisma.patient.count).mockResolvedValue(2)

      const result = await service.getAllPatients('family-user-1', 'FAMILY')

      expect(result.patients).toHaveLength(1)
      expect(result.patients[0].name).toBe('John Doe')
    })
  })

  describe('getPatientById', () => {
    it('should return patient details when user has access', async () => {
      const mockPatient = {
        id: 'patient-1',
        name: 'John Doe',
        dateOfBirth: new Date('1990-01-01'),
        gender: 'Male',
        phone: '+1234567890',
        status: 'ACTIVE',
        createdAt: new Date(),
        address: '123 Main St',
        caregivers: [{ id: 'user-1', email: 'admin@example.com', name: 'Admin', role: 'ADMIN' }],
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
        _count: { observations: 1, devices: 1 },
      }

      vi.mocked(prisma.patient.findUnique).mockResolvedValue(mockPatient as never)

      const result = await service.getPatientById('user-1', 'ADMIN', 'patient-1')

      expect(result.name).toBe('John Doe')
      expect(result.observations).toHaveLength(1)
      expect(result.devices).toHaveLength(1)
    })

    it('should throw error when patient not found', async () => {
      vi.mocked(prisma.patient.findUnique).mockResolvedValue(null)

      await expect(service.getPatientById('user-1', 'ADMIN', 'non-existent')).rejects.toThrow(
        'Patient not found'
      )
    })
  })

  describe('createPatient', () => {
    it('should create a patient with provided details', async () => {
      const mockInput = {
        name: 'New Patient',
        dateOfBirth: new Date('2000-01-01'),
        gender: 'Female',
        phone: '+1234567890',
        address: '456 New St',
        caregiverIds: ['caregiver-1'],
      }

      const mockResult = {
        id: 'patient-new',
        name: 'New Patient',
        caregivers: [{ id: 'caregiver-1' }],
      }

      vi.mocked(prisma.patient.create).mockResolvedValue(mockResult as never)

      const result = await service.createPatient('admin-user', 'ADMIN', mockInput)

      expect(result.name).toBe('New Patient')
      expect(result.caregiverIds).toContain('caregiver-1')
      expect(prisma.patient.create).toHaveBeenCalledWith({
        data: {
          name: 'New Patient',
          dateOfBirth: mockInput.dateOfBirth,
          gender: 'Female',
          phone: '+1234567890',
          address: '456 New St',
          caregivers: {
            connect: mockInput.caregiverIds?.map(id => ({ id })),
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

    it('should assign family user as caregiver when creating patient as family', async () => {
      const mockInput = {
        name: 'Family Patient',
        dateOfBirth: new Date('2000-01-01'),
      }

      const mockResult = {
        id: 'patient-family',
        name: 'Family Patient',
        caregivers: [{ id: 'family-user-1' }],
      }

      vi.mocked(prisma.patient.create).mockResolvedValue(mockResult as never)

      const result = await service.createPatient('family-user-1', 'FAMILY', mockInput)

      expect(result.caregiverIds).toContain('family-user-1')
    })
  })

  describe('updatePatient', () => {
    it('should update patient details', async () => {
      const mockInput = {
        name: 'Updated Patient Name',
        status: 'INACTIVE' as const,
      }

      const mockResult = {
        id: 'patient-1',
        name: 'Updated Patient Name',
        status: 'INACTIVE',
        caregivers: [{ id: 'caregiver-1' }],
      }

      vi.mocked(prisma.patient.update).mockResolvedValue(mockResult as never)

      const result = await service.updatePatient('admin-user', 'ADMIN', 'patient-1', mockInput)

      expect(result.name).toBe('Updated Patient Name')
      expect(result.status).toBe('INACTIVE')
    })

    it('should not update status or caregivers when user is family', async () => {
      const mockPatient = {
        id: 'patient-1',
        name: 'Original Patient Name',
        status: 'ACTIVE',
        caregivers: [
          { id: 'family-user', email: 'family@example.com', name: 'Family User' },
          { id: 'existing-caregiver', email: 'exist@example.com', name: 'Existing' },
        ],
      }

      const mockInput = {
        name: 'Updated Patient Name',
        status: 'INACTIVE' as const,
        caregiverIds: ['new-caregiver'],
      }

      const mockResult = {
        id: 'patient-1',
        name: 'Updated Patient Name',
        status: 'ACTIVE', // Should remain unchanged
        caregivers: [{ id: 'existing-caregiver' }],
      }

      vi.mocked(prisma.patient.findUnique).mockResolvedValue(mockPatient as never)
      vi.mocked(prisma.patient.update).mockResolvedValue(mockResult as never)

      const _result = await service.updatePatient('family-user', 'FAMILY', 'patient-1', mockInput)

      // Verify that the update call didn't include status or caregiverIds for family users
      const updateCall = vi.mocked(prisma.patient.update).mock.calls[0][0]
      expect(updateCall.where.id).toBe('patient-1')
      expect(updateCall.data.name).toBe('Updated Patient Name')
      expect(updateCall.data.status).toBeUndefined()
      expect(updateCall.data.caregiverIds).toBeUndefined()
    })
  })

  describe('deletePatient', () => {
    it('should delete patient when user is admin', async () => {
      vi.mocked(prisma.patient.delete).mockResolvedValue({ id: 'patient-1' } as never)

      const result = await service.deletePatient('admin-user', 'ADMIN', 'patient-1')

      expect(result.success).toBe(true)
      expect(prisma.patient.delete).toHaveBeenCalledWith({
        where: { id: 'patient-1' },
      })
    })

    it('should throw unauthorized error when user is not admin', async () => {
      await expect(service.deletePatient('family-user', 'FAMILY', 'patient-1')).rejects.toThrow(
        'Unauthorized: Only admins can delete patients'
      )
    })
  })

  describe('assignCaregiver', () => {
    it('should assign caregiver to patient when user is authorized', async () => {
      vi.mocked(prisma.patient.update).mockResolvedValue({} as never)

      const result = await service.assignCaregiver(
        'admin-user',
        'ADMIN',
        'patient-1',
        'caregiver-1'
      )

      expect(result.success).toBe(true)
      expect(prisma.patient.update).toHaveBeenCalledWith({
        where: { id: 'patient-1' },
        data: {
          caregivers: {
            connect: { id: 'caregiver-1' },
          },
        },
      })
    })

    it('should throw unauthorized error when user is not admin or caregiver', async () => {
      await expect(
        service.assignCaregiver('family-user', 'FAMILY', 'patient-1', 'caregiver-1')
      ).rejects.toThrow('Unauthorized')
    })
  })
})
