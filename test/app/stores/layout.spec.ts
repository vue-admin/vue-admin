import { describe, it, expect, beforeEach } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useLayoutStore } from '@/app/stores/layout'

describe('layout store', () => {
  beforeEach(() => {
    localStorage.clear()
    setActivePinia(createPinia())
  })

  it('默认值正确', () => {
    const s = useLayoutStore()
    expect(s.showTagsView).toBe(true)
    expect(s.showBreadcrumb).toBe(true)
    expect(s.showLogo).toBe(true)
    expect(s.showFooter).toBe(false)
    expect(s.primaryColor).toBe('#409EFF')
    expect(s.componentSize).toBe('default')
  })

  it('setter 修改字段', () => {
    const s = useLayoutStore()
    s.setShowTagsView(false)
    expect(s.showTagsView).toBe(false)
    s.setPrimaryColor('#13C2C2')
    expect(s.primaryColor).toBe('#13C2C2')
  })
})
