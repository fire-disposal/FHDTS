import { generateToken, hashPassword } from '../../../../shared/platform/auth.js'
import { ConflictError } from '../../../../shared/kernel/errors.js'
import type { AuthUserPort } from '../../ports/auth-user.port.js'

export interface RegisterInput {
  email: string
  password: string
  name?: string
}

export class RegisterCommand {
  constructor(private readonly users: AuthUserPort) {}

  async execute(input: RegisterInput) {
    const existing = await this.users.findByEmail(input.email)
    if (existing) {
      throw new ConflictError('Email already exists')
    }

    const user = await this.users.create({
      email: input.email,
      passwordHash: await hashPassword(input.password),
      name: input.name,
    })

    return {
      token: generateToken({ userId: user.id, email: user.email }),
      user,
    }
  }
}
