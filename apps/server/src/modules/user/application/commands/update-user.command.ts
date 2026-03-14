import type { UserPort } from '../../ports/user.port.js'

export interface UpdateUserInput {
  status?: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED'
  name?: string
  role?: 'ADMIN' | 'USER'
}

export class UpdateUserCommand {
  constructor(private readonly users: UserPort) {}

  execute(userId: string, data: UpdateUserInput) {
    return this.users.update({ userId, data })
  }
}
