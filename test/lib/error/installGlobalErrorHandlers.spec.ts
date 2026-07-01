import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { createApp, h } from 'vue'
import { installGlobalErrorHandlers } from '@/lib/error/installGlobalErrorHandlers'
import type { Monitor } from '@/lib/error/types'

const createMonitor = (): Monitor => ({
  captureException: vi.fn(),
  captureMessage: vi.fn(),
  setUser: vi.fn()
})

describe('installGlobalErrorHandlers', () => {
  let originalOnerror: typeof window.onerror
  let app: ReturnType<typeof createApp>

  beforeEach(() => {
    originalOnerror = window.onerror
    app = createApp(h('div'))
  })

  afterEach(() => {
    window.onerror = originalOnerror
  })

  it('捕获 Vue runtime 错误', () => {
    const monitor = createMonitor()
    installGlobalErrorHandlers(app, monitor)

    const error = new Error('vue error')
    app.config.errorHandler?.(error, null, 'test info')

    expect(monitor.captureException).toHaveBeenCalledTimes(1)
    expect(monitor.captureException).toHaveBeenCalledWith(
      error,
      expect.objectContaining({ vueErrorInfo: 'test info' })
    )
  })

  it('捕获 window.onerror 错误', () => {
    const monitor = createMonitor()
    installGlobalErrorHandlers(app, monitor)

    const error = new Error('window error')
    window.onerror?.('window error', '', 0, 0, error)

    expect(monitor.captureException).toHaveBeenCalledTimes(1)
    expect(monitor.captureException).toHaveBeenCalledWith(
      error,
      expect.objectContaining({ source: 'window.onerror' })
    )
  })

  it('捕获未捕获的 Promise 拒绝', async () => {
    const monitor = createMonitor()
    installGlobalErrorHandlers(app, monitor)

    const error = new Error('unhandled rejection')

    // jsdom 无 PromiseRejectionEvent 构造器；处理器仅读取 event.reason，
    // 用普通 Event 自定义载体即可触发同一监听路径
    const event = new Event('unhandledrejection')
    Object.defineProperty(event, 'reason', { value: error })
    window.dispatchEvent(event)

    expect(monitor.captureException).toHaveBeenCalledTimes(1)
    expect(monitor.captureException).toHaveBeenCalledWith(
      error,
      expect.objectContaining({ unhandledRejection: true })
    )
  })

  it('非 Error 对象被包装成 Error', () => {
    const monitor = createMonitor()
    installGlobalErrorHandlers(app, monitor)

    app.config.errorHandler?.('string error', null, 'test')

    expect(monitor.captureException).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'string error' }),
      expect.anything()
    )
  })
})
