import { ElLoading } from 'element-plus'
import type { LoadingOptionsResolved } from 'element-plus'

export type LoadingServiceOptions = Partial<LoadingOptionsResolved>

export interface LoadingService {
  show(options?: LoadingServiceOptions): void
  close(): void
  withLoading<T>(
    fn: () => Promise<T>,
    options?: LoadingServiceOptions
  ): Promise<T>
}

export function createLoadingService(
  loader: Pick<typeof ElLoading, 'service'> = ElLoading
): LoadingService {
  let instance: ReturnType<typeof loader.service> | null = null
  let stack = 0

  const show = (options?: LoadingServiceOptions) => {
    if (stack === 0) {
      instance = loader.service({
        lock: true,
        text: '加载中...',
        background: 'rgba(0, 0, 0, 0.7)',
        ...options
      })
    }
    stack += 1
  }

  const close = () => {
    if (stack <= 0) return
    stack -= 1
    if (stack === 0 && instance) {
      instance.close()
      instance = null
    }
  }

  const withLoading = async <T>(
    fn: () => Promise<T>,
    options?: LoadingServiceOptions
  ): Promise<T> => {
    show(options)
    try {
      return await fn()
    } finally {
      close()
    }
  }

  return { show, close, withLoading }
}

export const loadingService = createLoadingService()
