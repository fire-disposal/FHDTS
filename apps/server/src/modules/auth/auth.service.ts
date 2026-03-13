import { generateToken, hashPassword, verifyPassword } from '../../shared/infra/auth.js'
import { prisma } from '../../shared/infra/database.js'
import { Service } from '../../shared/kernel/base.js'
import { AuthRepository } from './auth.repository.js'

export class AuthService extends Service {
  private repository: AuthRepository

  constructor() {
    super(prisma)
    this.repository = new AuthRepository()
  }

  async login(email: string, password: string) {
    const user = await this.repository.findByEmail(email)

    if (!user) {
      throw new Error('Invalid email or password')
    }

    const isValid = await verifyPassword(password, user.passwordHash)

    if (!isValid) {
      throw new Error('Invalid email or password')
    }

    const token = generateToken({
      userId: user.id,
      email: user.email,
    })

    await this.repository.updateLastLogin(user.id)

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

  async register(email: string, password: string, name?: string) {
    const existingUser = await this.repository.findByEmail(email)

    if (existingUser) {
      throw new Error('Email already registered')
    }

    const passwordHash = await hashPassword(password)
    const user = await this.repository.create({
      email,
      password: passwordHash,
      name,
    })

    const token = generateToken({
      userId: user.id,
      email: user.email,
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

  async getProfile(userId: string) {
    const user = await this.repository.findByEmail(userId)

    if (!user) {
      throw new Error('User not found')
    }

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    }
  }
}
