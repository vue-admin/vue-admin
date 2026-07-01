import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { downloadBlob, downloadUrl } from '@/lib/file/downloadService'

// jsdom 无 URL.createObjectURL，统一 stub
function stubUrl() {
  const create = vi.fn(() => 'blob:fake')
  const revoke = vi.fn(() => {})
  Object.defineProperty(URL, 'createObjectURL', {
    value: create,
    configurable: true,
    writable: true
  })
  Object.defineProperty(URL, 'revokeObjectURL', {
    value: revoke,
    configurable: true,
    writable: true
  })
  return { create, revoke }
}

function stubAnchor() {
  const real = document.createElement('a')
  const clickSpy = vi.spyOn(real, 'click').mockImplementation(() => {})
  vi.spyOn(document, 'createElement').mockImplementation((tag: string) =>
    tag === 'a' ? real : document.createElement(tag)
  )
  return { clickSpy }
}

describe('lib/file/downloadService', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.restoreAllMocks()
  })

  describe('downloadBlob', () => {
    it('创建 <a> 并触发 click', () => {
      const urlCreate = stubUrl()
      const { clickSpy } = stubAnchor()
      const blob = new Blob(['content'], { type: 'text/plain' })
      const result = downloadBlob(blob, 'test.txt')
      expect(urlCreate.create).toHaveBeenCalledTimes(1)
      expect(clickSpy).toHaveBeenCalledTimes(1)
      expect(result.filename).toBe('test.txt')
      expect(result.size).toBe(blob.size)
    })

    it('1 秒后回收 blob URL', () => {
      const urlCreate = stubUrl()
      stubAnchor()
      downloadBlob(new Blob(['x']), 'a.txt')
      expect(urlCreate.revoke).not.toHaveBeenCalled()
      vi.advanceTimersByTime(1000)
      expect(urlCreate.revoke).toHaveBeenCalledTimes(1)
      vi.advanceTimersByTime(5000)
      expect(urlCreate.revoke).toHaveBeenCalledTimes(1)
    })
  })

  describe('downloadUrl', () => {
    it('从 Content-Disposition 提取 filename*', async () => {
      stubUrl()
      stubAnchor()
      const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue({
        ok: true,
        status: 200,
        headers: {
          get: (name: string) =>
            name === 'Content-Disposition'
              ? "attachment; filename*=UTF-8''%E4%B8%AD%E6%96%87.txt"
              : null
        },
        blob: async () => new Blob(['x'])
      } as unknown as Response)
      const result = await downloadUrl('http://example.com/x', 'fallback.txt')
      expect(result.filename).toBe('中文.txt')
      expect(fetchMock).toHaveBeenCalledTimes(1)
    })

    it('HTTP 错误抛异常', async () => {
      vi.spyOn(globalThis, 'fetch').mockResolvedValue({
        ok: false,
        status: 404,
        statusText: 'Not Found',
        headers: { get: () => null },
        blob: async () => new Blob()
      } as unknown as Response)
      await expect(
        downloadUrl('http://example.com/x', 'a.txt')
      ).rejects.toThrow(/404/)
    })

    it('无 Content-Disposition 时用 fallback', async () => {
      stubUrl()
      stubAnchor()
      vi.spyOn(globalThis, 'fetch').mockResolvedValue({
        ok: true,
        status: 200,
        headers: { get: () => null },
        blob: async () => new Blob()
      } as unknown as Response)
      const result = await downloadUrl('http://example.com/x', 'fallback.csv')
      expect(result.filename).toBe('fallback.csv')
    })
  })
})
