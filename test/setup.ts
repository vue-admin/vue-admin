import { config } from '@vue/test-utils'
import ElementPlus from 'element-plus'
import { i18n } from '@/lib/i18n'
import { afterAll, afterEach, beforeAll } from 'vitest'
import { server } from '@/mock/server'

// 全局注册 Element Plus + i18n，让所有测试中 EP 组件与 useI18n() 可解析
config.global.plugins = [
  [ElementPlus, {}],
  i18n
]

// 注册 MSW server：测试期间所有真实 HTTP 请求由 mock handlers 处理
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))
afterEach(() => server.resetHandlers())
afterAll(() => server.close())
