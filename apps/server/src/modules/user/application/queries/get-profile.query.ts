import { UnauthorizedError } from '../../../../shared/kernel/errors.js'
import type { UserPort } from '../../ports/user.port.js'

export class GetUserProfileQuery {
  constructor(private readonly users: UserPort) {}

  async execute(userId: string) {
    const user = await this.users.findProfileById(userId)
    if (!user) {
      throw new UnauthorizedError('User not found')
    }
    return user
  }
}
