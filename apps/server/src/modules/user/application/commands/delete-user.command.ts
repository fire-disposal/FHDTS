import type { UserPort } from '../../ports/user.port.js'

export class DeleteUserCommand {
  constructor(private readonly users: UserPort) {}

  async execute(userId: string) {
    await this.users.delete(userId)
    return { success: true }
  }
}
