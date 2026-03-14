import { hashPassword } from '../../../../shared/platform/auth.js'
import { ConflictError } from '../../../../shared/kernel/errors.js'
import type { UserPort } from '../../ports/user.port.js'

export interface CreateUserInput {
  email: string
  role: 'ADMIN' | 'USER'
  password: string
  name?: string
}

export class CreateUserCommand {
  constructor(private readonly users: UserPort) {}

  async execute(input: CreateUserInput) {
    const existing = await this.users.findByEmail(input.email)
    if (existing) {
      throw new ConflictError('Email already exists')
    }

    return this.users.create({
      email: input.email,
      role: input.role,
      name: input.name,
      passwordHash: await hashPassword(input.password),
    })
  }
}
