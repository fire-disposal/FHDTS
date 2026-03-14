import { generateToken, hashPassword, verifyPassword } from '../../../shared/infra/auth'
import type { prisma } from '../../../shared/infra/database'
import { Service } from '../../../shared/kernel/base'
import { UnauthorizedError } from '../../../shared/kernel/errors'

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
  role: string
}

export class AuthService extends Service {
  async login(input: LoginInput): Promise<{ token: string; user: UserResponse }> {
    const { email, password } = input

    const user = await this.db.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        passwordHash: true,
        status: true,
      },
    })

    if (!user || !(await verifyPassword(password, user.passwordHash))) {
      throw new UnauthorizedError('Invalid email or password')
    }

    if (user.status !== 'ACTIVE') {
      throw new UnauthorizedError('Account is not active')
    }

    // 更新最后登录时间
    await this.db.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    })

    const token = generateToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    })

    return {
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    }
  }

  async register(input: RegisterInput): Promise<{ token: string; user: UserResponse }> {
    const { email, password, name } = input

    const existingUser = await this.db.user.findUnique({
      where: { email },
    })

    if (existingUser) {
      throw new Error('Email already exists')
    }

    const passwordHash = await hashPassword(password)

    const user = await this.db.user.create({
      data: {
        email,
        passwordHash,
        name,
        role: 'USER', // 默认角色
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
      },
    })

    const token = generateToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    })

    return {
      token,
      user,
    }
  }

  async getProfile(userId: string): Promise<UserResponse> {
    const user = await this.db.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
      },
    })

    if (!user) {
      throw new UnauthorizedError('User not found')
    }

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    }
  }
}

export function createAuthService(db: typeof prisma) {
  return new AuthService(db)
}
