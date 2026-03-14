import type { UserPort } from '../../ports/user.port.js'

export class GetAllUsersQuery {
  constructor(private readonly users: UserPort) {}

  execute() {
    return this.users.listAll()
  }
}
