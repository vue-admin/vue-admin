import { authHandlers } from './handlers/auth'
import { menuHandlers } from './handlers/menu'
import { userHandlers } from './handlers/user'
import { roleHandlers } from './handlers/role'
import { permissionHandlers } from './handlers/permission'

export const handlers = [
  ...authHandlers,
  ...menuHandlers,
  ...userHandlers,
  ...roleHandlers,
  ...permissionHandlers
]
