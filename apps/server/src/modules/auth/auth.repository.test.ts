import { beforeEach, describe, expect, it, vi } from 'vitest'
import { prisma } from '../../shared/infra/database.js'
import { AuthRepository } from './auth.repository.js'

// Mock prisma
vi.mock('../../shared/infra/database.js', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(),
    },
  },
}))

describe('AuthRepository', () => {
  let repository: AuthRepository

  beforeEach(() => {
    repository = new AuthRepository()
    vi.clearAllMocks()
  })

  describe('findByEmail', () => {
    it('should return user when found by email', async () => {
      const mockUser = {
        id: 'user-1',
        email: 'test@example.com',
        passwordHash: 'hashed-password',
        name: 'Test User',
        role: 'ADMIN',
        status: 'ACTIVE',
        createdAt: new Date(),
        updatedAt: new Date(),
        lastLoginAt: new Date(),
      }

      vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser)

      const result = await repository.findByEmail('test@example.com')

      expect(result).toEqual(mockUser)
      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: 'test@example.com' },
      })
    })

    it('should return null when user not found by email', async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue(null)

      const result = await repository.findByEmail('nonexistent@example.com')

      expect(result).toBeNull()
    })

    it('should handle special characters in email', async () => {
      const mockUser = {
        id: 'user-1',
        email: 'test+tag@example-domain.com',
        passwordHash: 'hashed-password',
        name: 'Test User',
        role: 'FAMILY',
        status: 'ACTIVE',
        createdAt: new Date(),
        updatedAt: new Date(),
        lastLoginAt: null,
      }

      vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser)

      const result = await repository.findByEmail('test+tag@example-domain.com')

      expect(result).toEqual(mockUser)
    })
  })

  describe('create', () => {
    it('should create a new user with provided data', async () => {
      const mockInput = {
        email: 'newuser@example.com',
        password: 'hashed-password',
        name: 'New User',
      }

      const mockCreatedUser = {
        id: 'user-new',
        email: 'newuser@example.com',
        passwordHash: 'hashed-password',
        name: 'New User',
        role: 'FAMILY',
        status: 'ACTIVE',
        createdAt: new Date(),
        updatedAt: new Date(),
        lastLoginAt: null,
      }

      vi.mocked(prisma.user.create).mockResolvedValue(mockCreatedUser)

      const result = await repository.create(mockInput)

      expect(result).toEqual(mockCreatedUser)
      expect(prisma.user.create).toHaveBeenCalledWith({
        data: {
          email: 'newuser@example.com',
          passwordHash: 'hashed-password',
          name: 'New User',
          role: 'FAMILY',
        },
      })
    })

    it('should create user with minimal data (only required fields)', async () => {
      const mockInput = {
        email: 'minimal@example.com',
        password: 'hashed-password',
        name: undefined,
      }

      const mockCreatedUser = {
        id: 'user-minimal',
        email: 'minimal@example.com',
        passwordHash: 'hashed-password',
        name: null,
        role: 'FAMILY',
        status: 'ACTIVE',
        createdAt: new Date(),
        updatedAt: new Date(),
        lastLoginAt: null,
      }

      vi.mocked(prisma.user.create).mockResolvedValue(mockCreatedUser)

      const result = await repository.create(mockInput)

      expect(result.name).toBeNull()
      expect(result.email).toBe('minimal@example.com')
      expect(prisma.user.create).toHaveBeenCalledWith({
        data: {
          email: 'minimal@example.com',
          passwordHash: 'hashed-password',
          name: undefined,
          role: 'FAMILY',
        },
      })
    })

    it('should create user with default role and status values', async () => {
      const mockInput = {
        email: 'default@example.com',
        password: 'hashed-password',
        name: 'Default User',
      }

      const mockCreatedUser = {
        id: 'user-default',
        email: 'default@example.com',
        passwordHash: 'hashed-password',
        name: 'Default User',
        role: 'FAMILY', // Default role
        status: 'ACTIVE', // Default status
        createdAt: new Date(),
        updatedAt: new Date(),
        lastLoginAt: null,
      }

      vi.mocked(prisma.user.create).mockResolvedValue(mockCreatedUser)

      const result = await repository.create(mockInput)

      expect(result.role).toBe('FAMILY')
      expect(result.status).toBe('ACTIVE')
      expect(prisma.user.create).toHaveBeenCalledWith({
        data: {
          email: 'default@example.com',
          passwordHash: 'hashed-password',
          name: 'Default User',
          role: 'FAMILY',
        },
      })
    })
  })

  describe('updateLastLogin', () => {
    it('should update last login timestamp for user', async () => {
      const userId = 'user-1'
      const mockUpdatedUser = {
        id: 'user-1',
        email: 'test@example.com',
        passwordHash: 'hashed-password',
        name: 'Test User',
        role: 'ADMIN',
        status: 'ACTIVE',
        createdAt: new Date(),
        updatedAt: new Date(),
        lastLoginAt: new Date(),
      }

      vi.mocked(prisma.user.update).mockResolvedValue(mockUpdatedUser)

      const result = await repository.updateLastLogin(userId)

      expect(result).toEqual(mockUpdatedUser)
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: userId },
        data: {
          lastLoginAt: expect.any(Date),
        },
      })
    })

    it('should handle user not found during last login update', async () => {
      const userId = 'nonexistent-user'

      vi.mocked(prisma.user.update).mockRejectedValue(new Error('User not found'))

      await expect(repository.updateLastLogin(userId)).rejects.toThrow('User not found')
    })

    it('should update lastLoginAt to current time', async () => {
      const userId = 'user-1'
      const currentTime = new Date()
      vi.setSystemTime(currentTime)

      const mockUpdatedUser = {
        id: 'user-1',
        email: 'test@example.com',
        passwordHash: 'hashed-password',
        name: 'Test User',
        role: 'ADMIN',
        status: 'ACTIVE',
        createdAt: new Date(),
        updatedAt: currentTime,
        lastLoginAt: currentTime,
      }

      vi.mocked(prisma.user.update).mockResolvedValue(mockUpdatedUser)

      const result = await repository.updateLastLogin(userId)

      expect(result.lastLoginAt).toEqual(currentTime)
    })
  })
})
