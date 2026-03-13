import { beforeEach, describe, expect, it, vi } from 'vitest'
import * as auth from '../../shared/infra/auth.js'
import { AuthService } from './auth.service.js'

// Mock auth utilities
vi.mock('../../shared/infra/auth.js', () => ({
  generateToken: vi.fn().mockReturnValue('mock-jwt-token'),
  hashPassword: vi.fn().mockResolvedValue('hashed-password'),
  verifyPassword: vi.fn(),
}))

// Mock repository
vi.mock('./auth.repository.js', () => ({
  AuthRepository: vi.fn().mockImplementation(() => ({
    findByEmail: vi.fn(),
    create: vi.fn(),
    updateLastLogin: vi.fn(),
  })),
}))

describe('AuthService', () => {
  let service: AuthService
  let mockRepository: {
    findByEmail: ReturnType<typeof vi.fn>
    create: ReturnType<typeof vi.fn>
    updateLastLogin: ReturnType<typeof vi.fn>
  }

  beforeEach(() => {
    vi.clearAllMocks()
    service = new AuthService()
    // Access the mocked repository
    mockRepository = (service as unknown as { repository: typeof mockRepository }).repository
  })

  describe('login', () => {
    it('should successfully login with valid credentials', async () => {
      const mockUser = {
        id: 'user-1',
        email: 'test@example.com',
        name: 'Test User',
        role: 'FAMILY' as const,
        passwordHash: 'hashed-password',
      }

      mockRepository.findByEmail.mockResolvedValue(mockUser)
      vi.mocked(auth.verifyPassword).mockResolvedValue(true)

      const result = await service.login('test@example.com', 'password123')

      expect(result.token).toBe('mock-jwt-token')
      expect(result.user).toEqual({
        id: mockUser.id,
        email: mockUser.email,
        name: mockUser.name,
        role: mockUser.role,
      })
      expect(mockRepository.updateLastLogin).toHaveBeenCalledWith(mockUser.id)
      expect(auth.generateToken).toHaveBeenCalledWith({
        userId: mockUser.id,
        email: mockUser.email,
      })
    })

    it('should throw error when user not found', async () => {
      mockRepository.findByEmail.mockResolvedValue(null)

      await expect(service.login('nonexistent@example.com', 'password123')).rejects.toThrow(
        'Invalid email or password'
      )
      expect(mockRepository.updateLastLogin).not.toHaveBeenCalled()
    })

    it('should throw error when password is incorrect', async () => {
      const mockUser = {
        id: 'user-1',
        email: 'test@example.com',
        name: 'Test User',
        role: 'FAMILY' as const,
        passwordHash: 'hashed-password',
      }

      mockRepository.findByEmail.mockResolvedValue(mockUser)
      vi.mocked(auth.verifyPassword).mockResolvedValue(false)

      await expect(service.login('test@example.com', 'wrong-password')).rejects.toThrow(
        'Invalid email or password'
      )
      expect(mockRepository.updateLastLogin).not.toHaveBeenCalled()
    })

    it('should handle inactive user login attempt', async () => {
      const mockUser = {
        id: 'user-1',
        email: 'test@example.com',
        name: 'Test User',
        role: 'FAMILY' as const,
        passwordHash: 'hashed-password',
        status: 'INACTIVE',
      }

      mockRepository.findByEmail.mockResolvedValue(mockUser)
      vi.mocked(auth.verifyPassword).mockResolvedValue(true)

      // Note: Currently login doesn't check status, but it might be a good addition
      const result = await service.login('test@example.com', 'password123')
      expect(result.token).toBe('mock-jwt-token')
    })
  })

  describe('register', () => {
    it('should successfully register a new user', async () => {
      const mockUser = {
        id: 'new-user-1',
        email: 'newuser@example.com',
        name: 'New User',
        role: 'FAMILY' as const,
      }

      mockRepository.findByEmail.mockResolvedValue(null)
      mockRepository.create.mockResolvedValue(mockUser)

      const result = await service.register('newuser@example.com', 'password123', 'New User')

      expect(result.token).toBe('mock-jwt-token')
      expect(result.user).toEqual({
        id: mockUser.id,
        email: mockUser.email,
        name: mockUser.name,
        role: mockUser.role,
      })
      expect(mockRepository.create).toHaveBeenCalledWith({
        email: 'newuser@example.com',
        password: 'hashed-password',
        name: 'New User',
      })
      expect(auth.hashPassword).toHaveBeenCalledWith('password123')
    })

    it('should throw error when email already exists', async () => {
      const existingUser = {
        id: 'existing-user',
        email: 'existing@example.com',
        name: 'Existing User',
        role: 'FAMILY' as const,
      }

      mockRepository.findByEmail.mockResolvedValue(existingUser)

      await expect(
        service.register('existing@example.com', 'password123', 'New User')
      ).rejects.toThrow('Email already registered')

      expect(mockRepository.create).not.toHaveBeenCalled()
    })

    it('should register user without name (optional)', async () => {
      const mockUser = {
        id: 'new-user-1',
        email: 'noname@example.com',
        name: null,
        role: 'FAMILY' as const,
      }

      mockRepository.findByEmail.mockResolvedValue(null)
      mockRepository.create.mockResolvedValue(mockUser)

      const result = await service.register('noname@example.com', 'password123')

      expect(result.user.name).toBeNull()
      expect(mockRepository.create).toHaveBeenCalledWith({
        email: 'noname@example.com',
        password: 'hashed-password',
        name: undefined,
      })
    })
  })

  describe('getProfile', () => {
    it('should return user profile successfully', async () => {
      const mockUser = {
        id: 'user-1',
        email: 'test@example.com',
        name: 'Test User',
        role: 'ADMIN' as const,
      }

      mockRepository.findByEmail.mockResolvedValue(mockUser)

      const result = await service.getProfile('user-1')

      expect(result).toEqual({
        id: mockUser.id,
        email: mockUser.email,
        name: mockUser.name,
        role: mockUser.role,
      })
    })

    it('should throw error when user not found', async () => {
      mockRepository.findByEmail.mockResolvedValue(null)

      await expect(service.getProfile('nonexistent-id')).rejects.toThrow('User not found')
    })
  })

  describe('security considerations', () => {
    it('should not expose password hash in login response', async () => {
      const mockUser = {
        id: 'user-1',
        email: 'test@example.com',
        name: 'Test User',
        role: 'FAMILY' as const,
        passwordHash: 'super-secret-hash',
      }

      mockRepository.findByEmail.mockResolvedValue(mockUser)
      vi.mocked(auth.verifyPassword).mockResolvedValue(true)

      const result = await service.login('test@example.com', 'password123')

      expect(result.user).not.toHaveProperty('passwordHash')
      expect(result.user).not.toHaveProperty('password')
    })

    it('should not expose password hash in register response', async () => {
      const mockUser = {
        id: 'user-1',
        email: 'test@example.com',
        name: 'Test User',
        role: 'FAMILY' as const,
        passwordHash: 'super-secret-hash',
      }

      mockRepository.findByEmail.mockResolvedValue(null)
      mockRepository.create.mockResolvedValue(mockUser)

      const result = await service.register('test@example.com', 'password123', 'Test User')

      expect(result.user).not.toHaveProperty('passwordHash')
      expect(result.user).not.toHaveProperty('password')
    })

    it('should use consistent error messages to prevent user enumeration', async () => {
      // Both cases should use the same error message
      mockRepository.findByEmail.mockResolvedValue(null)
      await expect(service.login('any@example.com', 'any')).rejects.toThrow(
        'Invalid email or password'
      )

      const mockUser = {
        id: 'user-1',
        email: 'exists@example.com',
        name: 'Test',
        role: 'FAMILY' as const,
        passwordHash: 'hash',
      }
      mockRepository.findByEmail.mockResolvedValue(mockUser)
      vi.mocked(auth.verifyPassword).mockResolvedValue(false)

      await expect(service.login('exists@example.com', 'wrong')).rejects.toThrow(
        'Invalid email or password'
      )
    })
  })
})
