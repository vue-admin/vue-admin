import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { nextTick } from 'vue'
import { i18n, setLocale, LOCALES, type Locale } from '@/lib/i18n'

describe('lib/i18n', () => {
  beforeEach(() => {
    i18n.global.locale.value = 'zh-CN'
  })

  afterEach(() => {
    i18n.global.locale.value = 'zh-CN'
  })

  it('导出支持的语言列表', () => {
    expect(LOCALES).toContain('zh-CN')
    expect(LOCALES).toContain('en-US')
  })

  it('中文 locale 翻译 layout.settings', () => {
    expect(i18n.global.t('layout.settings')).toBe('布局设置')
  })

  it('英文 locale 翻译 layout.settings', () => {
    i18n.global.locale.value = 'en-US'
    expect(i18n.global.t('layout.settings')).toBe('Layout Settings')
  })

  it('setLocale 切换并同步翻译', async () => {
    setLocale('en-US' as Locale)
    await nextTick()
    expect(i18n.global.locale.value).toBe('en-US')
    expect(i18n.global.t('layout.theme')).toBe('Theme')
  })

  it('缺失 key 回退到 key 本身', () => {
    expect(i18n.global.t('not.exist.key')).toBe('not.exist.key')
  })

  it('支持插值参数', () => {
    expect(i18n.global.t('common.welcome', { name: 'Admin' })).toBe(
      '欢迎, Admin'
    )
  })
})
