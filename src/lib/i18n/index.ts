import { createI18n } from 'vue-i18n'
import zhCN from './locales/zh-CN'
import enUS from './locales/en-US'

export const LOCALES = ['zh-CN', 'en-US'] as const
export type Locale = (typeof LOCALES)[number]

export const DEFAULT_LOCALE: Locale = 'zh-CN'

const messages = {
  'zh-CN': zhCN,
  'en-US': enUS
}

export const i18n = createI18n({
  legacy: false,
  locale: DEFAULT_LOCALE,
  fallbackLocale: DEFAULT_LOCALE,
  messages
})

export function setLocale(locale: Locale): void {
  i18n.global.locale.value = locale
}

export function getLocale(): Locale {
  return i18n.global.locale.value as Locale
}

/**
 * 全局翻译函数（SSR 安全）。
 * 共享组件直接用此 t，避免 useI18n() 依赖组件 inject 上下文
 * （VitePress SSR 渲染文档 demo 时上下文不可靠）。
 */
export const t = i18n.global.t
