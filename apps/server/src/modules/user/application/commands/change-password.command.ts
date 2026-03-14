import { hashPassword, verifyPassword } from '../../../../shared/platform/auth.js'
import { UnauthorizedError } from '../../../../shared/kernel/errors.js'
import type { UserPort } from '../../ports/user.port.js'

export class ChangePasswordCommand {
  constructor(private readonly users: UserPort) {}

  async execute(userId: string, oldPassword: string, newPassword: string) {
    const user = await this.users.findPasswordHash(userId)
    if (!user) {
      throw new UnauthorizedError('User not found')
    }

    if (!(await verifyPassword(oldPassword, user.passwordHash))) {
      throw new UnauthorizedError('Invalid password')
    }

    await this.users.updatePassword(userId, await hashPassword(newPassword))
    return { success: true }
  }
}
