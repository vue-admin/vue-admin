import { describe, it, expect, vi } from 'vitest'
import { createLoadingService } from '@/lib/loading/loadingService'

const createMockLoader = () => {
  const close = vi.fn()
  return {
    service: vi.fn(() => ({ close })),
    close
  }
}

describe('loadingService', () => {
  it('首次 show 打开 loading', () => {
    const loader = createMockLoader()
    const service = createLoadingService(loader)

    service.show()

    expect(loader.service).toHaveBeenCalledTimes(1)
  })

  it('嵌套 show/close 按栈计数', () => {
    const loader = createMockLoader()
    const service = createLoadingService(loader)

    service.show()
    service.show()
    service.show()
    expect(loader.service).toHaveBeenCalledTimes(1)

    service.close()
    service.close()
    expect(loader.close).not.toHaveBeenCalled()

    service.close()
    expect(loader.close).toHaveBeenCalledTimes(1)
  })

  it('close 超过栈深不报错', () => {
    const loader = createMockLoader()
    const service = createLoadingService(loader)

    service.close()
    service.close()

    expect(loader.service).not.toHaveBeenCalled()
    expect(loader.close).not.toHaveBeenCalled()
  })

  it('withLoading 成功时关闭', async () => {
    const loader = createMockLoader()
    const service = createLoadingService(loader)

    const result = await service.withLoading(async () => 'ok')

    expect(result).toBe('ok')
    expect(loader.service).toHaveBeenCalledTimes(1)
    expect(loader.close).toHaveBeenCalledTimes(1)
  })

  it('withLoading 失败时也关闭', async () => {
    const loader = createMockLoader()
    const service = createLoadingService(loader)

    await expect(
      service.withLoading(async () => {
        throw new Error('boom')
      })
    ).rejects.toThrow('boom')

    expect(loader.service).toHaveBeenCalledTimes(1)
    expect(loader.close).toHaveBeenCalledTimes(1)
  })

  it('options 透传给 loader.service', () => {
    const loader = createMockLoader()
    const service = createLoadingService(loader)

    service.show({ text: '保存中...', background: 'rgba(255, 0, 0, 0.5)' })

    expect(loader.service).toHaveBeenCalledWith(
      expect.objectContaining({
        lock: true,
        text: '保存中...',
        background: 'rgba(255, 0, 0, 0.5)'
      })
    )
  })
})
