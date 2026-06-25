import { describe, it, expect, vi, beforeEach } from 'vitest'
import { consoleMonitor } from '@/lib/error/monitor'

describe('consoleMonitor', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('captureException 调用 console.error', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
    const err = new Error('boom')
    consoleMonitor.captureException(err, { extra: 1 })
    expect(spy).toHaveBeenCalledOnce()
    expect(spy.mock.calls[0][1]).toBe(err)
  })

  it('captureMessage 默认 info 级别', () => {
    const spy = vi.spyOn(console, 'info').mockImplementation(() => {})
    consoleMonitor.captureMessage('hello')
    expect(spy).toHaveBeenCalledOnce()
  })

  it('captureMessage 支持 warn / error 级别', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    consoleMonitor.captureMessage('w', 'warn')
    consoleMonitor.captureMessage('e', 'error')
    expect(warnSpy).toHaveBeenCalledOnce()
    expect(errSpy).toHaveBeenCalledOnce()
  })

  it('setUser 调用 console.debug', () => {
    const spy = vi.spyOn(console, 'debug').mockImplementation(() => {})
    consoleMonitor.setUser({ id: '1', username: 'a' })
    expect(spy).toHaveBeenCalledOnce()
  })
})
