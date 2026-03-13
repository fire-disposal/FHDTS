import { beforeEach, describe, expect, it, vi } from 'vitest'
import { prisma } from '../../shared/infra/database.js'
import { UserRepository } from './user.repository.js'

// Mock prisma
vi.mock('../../shared/infra/database.js', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(),
    },
  },
}))

describe('UserRepository', () => {
  let repository: UserRepository

  beforeEach(() => {
    repository = new UserRepository()
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
  })

  describe('findById', () => {
    it('should return user when found by id', async () => {
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

      const result = await repository.findById('user-1')

      expect(result).toEqual(mockUser)
      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        include: { patients: true },
      })
    })

    it('should return null when user not found by id', async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue(null)

      const result = await repository.findById('nonexistent-id')

      expect(result).toBeNull()
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

    it('should create user without name (optional)', async () => {
      const mockInput = {
        email: 'noname@example.com',
        password: 'hashed-password',
        name: undefined,
      }

      const mockCreatedUser = {
        id: 'user-noname',
        email: 'noname@example.com',
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
      expect(prisma.user.create).toHaveBeenCalledWith({
        data: {
          email: 'noname@example.com',
          passwordHash: 'hashed-password',
          name: undefined,
          role: 'FAMILY',
        },
      })
    })
  })

  describe('update', () => {
    it('should update user fields when provided', async () => {
      const mockUpdateData = {
        name: 'Updated Name',
        status: 'INACTIVE',
      }

      const mockUpdatedUser = {
        id: 'user-1',
        email: 'test@example.com',
        passwordHash: 'hashed-password',
        name: 'Updated Name',
        role: 'FAMILY',
        status: 'INACTIVE',
        createdAt: new Date(),
        updatedAt: new Date(),
        lastLoginAt: new Date(),
      }

      vi.mocked(prisma.user.update).mockResolvedValue(mockUpdatedUser)

      const result = await repository.update('user-1', mockUpdateData)

      expect(result).toEqual(mockUpdatedUser)
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        data: {
          name: 'Updated Name',
          status: 'INACTIVE',
        },
      })
    })

    it('should partially update user fields', async () => {
      const mockUpdateData = {
        name: 'Another Updated Name',
        // Not updating status
      }

      const mockUpdatedUser = {
        id: 'user-1',
        email: 'test@example.com',
        passwordHash: 'hashed-password',
        name: 'Another Updated Name',
        role: 'FAMILY',
        status: 'ACTIVE', // Should remain unchanged
        createdAt: new Date(),
        updatedAt: new Date(),
        lastLoginAt: new Date(),
      }

      vi.mocked(prisma.user.update).mockResolvedValue(mockUpdatedUser)

      const result = await repository.update('user-1', mockUpdateData)

      expect(result.name).toBe('Another Updated Name')
      expect(result.status).toBe('ACTIVE') // Should remain unchanged
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        data: {
          name: 'Another Updated Name',
        },
      })
    })
  })

  describe('updateLastLogin', () => {
    it('should update last login timestamp', async () => {
      const userId = 'user-1'
      const mockUpdatedUser = {
        id: 'user-1',
        email: 'test@example.com',
        passwordHash: 'hashed-password',
        name: 'Test User',
        role: 'FAMILY',
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
  })

  describe('findAll', () => {
    it('should return all users with pagination', async () => {
      const mockUsers = [
        {
          id: 'user-1',
          email: 'user1@example.com',
          passwordHash: 'hashed-password',
          name: 'User 1',
          role: 'ADMIN',
          status: 'ACTIVE',
          createdAt: new Date(),
          updatedAt: new Date(),
          lastLoginAt: new Date(),
        },
        {
          id: 'user-2',
          email: 'user2@example.com',
          passwordHash: 'hashed-password',
          name: 'User 2',
          role: 'FAMILY',
          status: 'INACTIVE',
          createdAt: new Date(),
          updatedAt: new Date(),
          lastLoginAt: null,
        },
      ]

      vi.mocked(prisma.user.findMany).mockResolvedValue(mockUsers)
      vi.mocked(prisma.user.count).mockResolvedValue(2)

      const result = await repository.findAll(0, 10)

      expect(result.users).toEqual(mockUsers)
      expect(result.total).toBe(2)
      expect(prisma.user.findMany).toHaveBeenCalledWith({
        skip: 0,
        take: 10,
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          status: true,
          createdAt: true,
          lastLoginAt: true,
          _count: { select: { patients: true } },
        },
        orderBy: { createdAt: 'desc' },
      })
      expect(prisma.user.count).toHaveBeenCalledWith()
    })

    it('should return users with pagination when called without filters', async () => {
      const mockUsers = [
        {
          id: 'user-1',
          email: 'admin@example.com',
          name: 'Admin User',
          role: 'ADMIN',
          status: 'ACTIVE',
          createdAt: new Date(),
          lastLoginAt: new Date(),
          _count: { patients: 2 },
        },
      ]

      vi.mocked(prisma.user.findMany).mockResolvedValue(mockUsers)
      vi.mocked(prisma.user.count).mockResolvedValue(1)

      const result = await repository.findAll(0, 10)

      expect(result.users).toEqual(mockUsers)
      expect(result.total).toBe(1)
      expect(prisma.user.findMany).toHaveBeenCalledWith({
        skip: 0,
        take: 10,
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          status: true,
          createdAt: true,
          lastLoginAt: true,
          _count: { select: { patients: true } },
        },
        orderBy: { createdAt: 'desc' },
      })
    })
  })

  describe('delete', () => {
    it('should delete user by id', async () => {
      const mockDeletedUser = {
        id: 'user-1',
        email: 'todelete@example.com',
        passwordHash: 'hashed-password',
        name: 'To Delete',
        role: 'FAMILY',
        status: 'INACTIVE',
        createdAt: new Date(),
        updatedAt: new Date(),
        lastLoginAt: new Date(),
      }

      vi.mocked(prisma.user.delete).mockResolvedValue(mockDeletedUser)

      const result = await repository.delete('user-1')

      expect(result).toEqual(mockDeletedUser)
      expect(prisma.user.delete).toHaveBeenCalledWith({
        where: { id: 'user-1' },
      })
    })

    it('should throw error when trying to delete non-existent user', async () => {
      vi.mocked(prisma.user.delete).mockRejectedValue(new Error('User not found'))

      await expect(repository.delete('nonexistent-id')).rejects.toThrow('User not found')
    })
  })
})
