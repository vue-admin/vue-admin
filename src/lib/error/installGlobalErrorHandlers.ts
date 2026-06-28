import type { App } from 'vue'
import type { Monitor } from './types'

export function installGlobalErrorHandlers(app: App, monitor: Monitor): void {
  app.config.errorHandler = (err, _instance, info) => {
    const error = err instanceof Error ? err : new Error(String(err))
    monitor.captureException(error, { vueErrorInfo: info })
  }

  window.onerror = (message, _source, _lineno, _colno, err) => {
    const error = err instanceof Error ? err : new Error(String(message))
    monitor.captureException(error, { source: 'window.onerror' })
  }

  window.addEventListener('unhandledrejection', (event) => {
    const reason = event.reason
    const error = reason instanceof Error ? reason : new Error(String(reason))
    monitor.captureException(error, { unhandledRejection: true })
  })
}
