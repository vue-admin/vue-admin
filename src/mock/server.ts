import { setupServer } from 'msw/node'
import { handlers } from './index'

export const server = setupServer(...handlers)
