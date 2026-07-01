import { authHandlers } from './handlers/auth'
import { menuHandlers } from './handlers/menu'

export const handlers = [...authHandlers, ...menuHandlers]
