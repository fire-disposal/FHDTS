import { NotFoundError } from '../../../../shared/kernel/errors.js'
import type { UserPort } from '../../ports/user.port.js'

export class GetUserByIdQuery {
  constructor(private readonly users: UserPort) {}

  async execute(userId: string) {
    const user = await this.users.findById(userId)
    if (!user) {
      throw new NotFoundError('User')
    }
    return user
  }
}
