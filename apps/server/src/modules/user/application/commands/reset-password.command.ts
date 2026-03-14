import { hashPassword } from '../../../../shared/platform/auth.js'
import type { UserPort } from '../../ports/user.port.js'

export class ResetPasswordCommand {
  constructor(private readonly users: UserPort) {}

  async execute(userId: string, newPassword: string) {
    await this.users.updatePassword(userId, await hashPassword(newPassword))
    return { success: true }
  }
}
