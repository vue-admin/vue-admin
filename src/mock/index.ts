import { authHandlers } from './handlers/auth'
import { menuHandlers } from './handlers/menu'
import { userHandlers } from './handlers/user'
import { roleHandlers } from './handlers/role'
import { permissionHandlers } from './handlers/permission'
import { deptHandlers } from './handlers/dept'
import { dictHandlers } from './handlers/dict'
import { noticeHandlers } from './handlers/notice'

export const handlers = [
  ...authHandlers,
  ...menuHandlers,
  ...userHandlers,
  ...roleHandlers,
  ...permissionHandlers,
  ...deptHandlers,
  ...dictHandlers,
  ...noticeHandlers
]
