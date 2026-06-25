import type { Monitor } from './types'

// 控制台实现：默认 monitor，开发期使用
export const consoleMonitor: Monitor = {
  captureException(err, ctx) {
    console.error('[monitor]', err, ctx ?? '')
  },
  captureMessage(msg, level = 'info') {
    const fn = level === 'error' ? console.error
      : level === 'warn' ? console.warn
      : console.info
    fn('[monitor]', msg)
  },
  setUser(user) {
    console.debug('[monitor] user=', user)
  },
}

// 默认导出：未来在 app/main.ts 中可替换为 SentryMonitor 等
export const defaultMonitor: Monitor = consoleMonitor
