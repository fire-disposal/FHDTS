import { ConflictError, UnauthorizedError } from '../../../../shared/kernel/errors.js'
import { generateToken, hashPassword, verifyPassword } from '../../../../shared/infra/auth.js'
import type { prisma } from '../../../../shared/infra/database.js'

interface LoginInput {
  email: string
  password: string
}

interface RegisterInput {
  email: string
  password: string
  name?: string
}

interface UserResponse {
  id: string
  email: string
  name: string | null
  role: 'ADMIN' | 'USER'
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED'
}

export class AuthService {
  constructor(private readonly db: typeof prisma) {}

  async login(input: LoginInput): Promise<{ token: string; user: UserResponse }> {
    const user = await this.db.user.findUnique({
      where: { email: input.email },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        status: true,
        passwordHash: true,
      },
    })

    if (!user || !(await verifyPassword(input.password, user.passwordHash))) {
      throw new UnauthorizedError('Invalid email or password')
    }

    if (user.status !== 'ACTIVE') {
      throw new UnauthorizedError('Account is not active')
    }

    await this.db.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    })

    const token = generateToken({ userId: user.id, email: user.email })

    return {
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        status: user.status,
      },
    }
  }

  async register(input: RegisterInput): Promise<{ token: string; user: UserResponse }> {
    const exists = await this.db.user.findUnique({ where: { email: input.email } })
    if (exists) {
      throw new ConflictError('Email already exists')
    }

    const passwordHash = await hashPassword(input.password)

    const user = await this.db.user.create({
      data: {
        email: input.email,
        passwordHash,
        name: input.name,
        role: 'USER',
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        status: true,
      },
    })

    const token = generateToken({ userId: user.id, email: user.email })

    return { token, user }
  }

  async getProfile(userId: string): Promise<UserResponse> {
    const user = await this.db.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        status: true,
      },
    })

    if (!user) {
      throw new UnauthorizedError('User not found')
    }

    return user
  }
}

export function createAuthService(db: typeof prisma) {
  return new AuthService(db)
}
