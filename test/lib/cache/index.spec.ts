import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { MemoryCache, dedupe, withCache } from '@/lib/cache'

describe('lib/cache', () => {
  describe('MemoryCache', () => {
    let cache: MemoryCache
    beforeEach(() => {
      cache = new MemoryCache(100)
    })

    it('set/get 基本读写', () => {
      cache.set('k1', 'v1')
      expect(cache.get('k1')).toBe('v1')
      expect(cache.has('k1')).toBe(true)
    })

    it('TTL 过期后读取返回 undefined', async () => {
      cache.set('k1', 'v1', 10)
      await new Promise((r) => setTimeout(r, 20))
      expect(cache.get('k1')).toBeUndefined()
      expect(cache.has('k1')).toBe(false)
    })

    it('LRU 淘汰：超过 maxSize 删除最久未访问', () => {
      const small = new MemoryCache(60_000, 2)
      small.set('a', 1)
      small.set('b', 2)
      // 访问 a，使 b 成为最旧
      small.get('a')
      small.set('c', 3) // 触发淘汰
      expect(small.has('b')).toBe(false)
      expect(small.has('a')).toBe(true)
      expect(small.has('c')).toBe(true)
    })

    it('delete 和 clear', () => {
      cache.set('k1', 'v1')
      cache.set('k2', 'v2')
      cache.delete('k1')
      expect(cache.has('k1')).toBe(false)
      expect(cache.has('k2')).toBe(true)
      cache.clear()
      expect(cache.has('k2')).toBe(false)
    })
  })

  describe('withCache', () => {
    it('相同 key 在 TTL 内只调用 fetcher 一次', async () => {
      const fetcher = vi.fn().mockResolvedValue('value')
      await withCache('k', fetcher)
      await withCache('k', fetcher)
      await withCache('k', fetcher)
      expect(fetcher).toHaveBeenCalledTimes(1)
    })

    it('不同 key 调用各自 fetcher', async () => {
      const f1 = vi.fn().mockResolvedValue('v1')
      const f2 = vi.fn().mockResolvedValue('v2')
      await withCache('k1', f1)
      await withCache('k2', f2)
      expect(f1).toHaveBeenCalledTimes(1)
      expect(f2).toHaveBeenCalledTimes(1)
    })

    it('TTL 过期后重新调用', async () => {
      const cache = new MemoryCache(100)
      const fetcher = vi.fn().mockResolvedValue('v')
      await withCache('k', fetcher, 10, cache)
      await new Promise((r) => setTimeout(r, 20))
      await withCache('k', fetcher, 10, cache)
      expect(fetcher).toHaveBeenCalledTimes(2)
    })
  })

  describe('dedupe', () => {
    afterEach(() => {
      vi.restoreAllMocks()
    })

    it('并发期共享同一 promise', async () => {
      let resolve!: (v: string) => void
      const slow = new Promise<string>((r) => (resolve = r))
      const fetcher = vi.fn(() => slow)
      const p1 = dedupe(fetcher, 'same-key')
      const p2 = dedupe(fetcher, 'same-key')
      expect(fetcher).toHaveBeenCalledTimes(1)
      resolve('done')
      expect(await p1).toBe('done')
      expect(await p2).toBe('done')
    })

    it('前一个完成后，下次调用重新发起', async () => {
      const fetcher = vi.fn().mockResolvedValue('v')
      await dedupe(fetcher, 'k')
      await dedupe(fetcher, 'k')
      expect(fetcher).toHaveBeenCalledTimes(2)
    })
  })
})
