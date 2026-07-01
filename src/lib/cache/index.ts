// 内存级请求缓存与去重。
// withCache：相同 key 在 TTL 内复用结果，避免短时间重复请求。
// dedupe：相同 fetcher 在并发期共享 promise，避免同一 URL 同时发多次。

interface CacheEntry<T> {
  value: T
  expireAt: number
}

// LRU 实现：超出 maxSize 时淘汰最久未访问的项。
export class MemoryCache {
  private store = new Map<string, CacheEntry<unknown>>()
  private ttl: number

  constructor(
    ttl: number = 30_000,
    private maxSize: number = 100
  ) {
    this.ttl = ttl
  }

  has(key: string): boolean {
    const entry = this.store.get(key)
    if (!entry) return false
    if (Date.now() > entry.expireAt) {
      this.store.delete(key)
      return false
    }
    // LRU：访问时移到末尾（Map 保留插入顺序）
    this.store.delete(key)
    this.store.set(key, entry)
    return true
  }

  get<T>(key: string): T | undefined {
    const entry = this.store.get(key)
    if (!entry || Date.now() > entry.expireAt) {
      this.store.delete(key)
      return undefined
    }
    this.store.delete(key)
    this.store.set(key, entry)
    return entry.value as T
  }

  set<T>(key: string, value: T, ttl: number = this.ttl): void {
    if (this.store.size >= this.maxSize) {
      const firstKey = this.store.keys().next().value
      if (firstKey) this.store.delete(firstKey)
    }
    this.store.set(key, { value, expireAt: Date.now() + ttl })
  }

  delete(key: string): void {
    this.store.delete(key)
  }

  clear(): void {
    this.store.clear()
  }
}

// 全局默认缓存实例（30s TTL）
const defaultCache = new MemoryCache(30_000)

// 包装 fetcher：相同 key 在 TTL 内只调用一次。
export async function withCache<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttl: number = 30_000,
  cache: MemoryCache = defaultCache
): Promise<T> {
  if (cache.has(key)) {
    return cache.get<T>(key) as T
  }
  const value = await fetcher()
  cache.set(key, value, ttl)
  return value
}

// 去重：相同 key 在并发期共享同一个 Promise。
// 适用场景：同一秒内多个组件触发同一请求，实际只发一次。
// 注意：key 必须由调用方显式提供稳定字符串（如 URL + 序列化参数），
// 不再依赖 Error.stack（非标准、不稳定）。
const inflight = new Map<string, Promise<unknown>>()

export function dedupe<T>(
  fetcher: () => Promise<T>,
  key: string
): Promise<T> {
  const existing = inflight.get(key)
  if (existing) return existing as Promise<T>

  const p = fetcher().finally(() => {
    inflight.delete(key)
  })
  inflight.set(key, p)
  return p
}

export { defaultCache }
