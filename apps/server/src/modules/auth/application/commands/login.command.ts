import { generateToken, verifyPassword } from '../../../../shared/platform/auth.js'
import { UnauthorizedError } from '../../../../shared/kernel/errors.js'
import type { AuthUserPort } from '../../ports/auth-user.port.js'

export interface LoginInput {
  email: string
  password: string
}

export class LoginCommand {
  constructor(private readonly users: AuthUserPort) {}

  async execute(input: LoginInput) {
    const user = await this.users.findByEmail(input.email)
    if (!user || !(await verifyPassword(input.password, user.passwordHash))) {
      throw new UnauthorizedError('Invalid email or password')
    }

    if (user.status !== 'ACTIVE') {
      throw new UnauthorizedError('Account is not active')
    }

    await this.users.updateLastLogin(user.id)

    return {
      token: generateToken({ userId: user.id, email: user.email }),
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        status: user.status,
      },
    }
  }
}
