import { UnauthorizedError } from '../../../../shared/kernel/errors.js'
import type { AuthUserPort } from '../../ports/auth-user.port.js'

export class GetAuthProfileQuery {
  constructor(private readonly users: AuthUserPort) {}

  async execute(userId: string) {
    const user = await this.users.findProfileById(userId)
    if (!user) {
      throw new UnauthorizedError('User not found')
    }
    return user
  }
}
