import { defineStore } from 'pinia'
import { useStorage } from '@vueuse/core'
import { DEFAULT_LOCALE, type Locale } from '@/lib/i18n'

export const useLayoutStore = defineStore('layout', () => {
  const showTagsView = useStorage('layout:showTagsView', true)
  const showBreadcrumb = useStorage('layout:showBreadcrumb', true)
  const showLogo = useStorage('layout:showLogo', true)
  const showFooter = useStorage('layout:showFooter', false)
  const primaryColor = useStorage('layout:primaryColor', '#409EFF')
  const componentSize = useStorage<'large' | 'default' | 'small'>(
    'layout:componentSize',
    'default'
  )
  const locale = useStorage<Locale>('layout:locale', DEFAULT_LOCALE)

  const setShowTagsView = (v: boolean) => {
    showTagsView.value = v
  }
  const setShowBreadcrumb = (v: boolean) => {
    showBreadcrumb.value = v
  }
  const setShowLogo = (v: boolean) => {
    showLogo.value = v
  }
  const setShowFooter = (v: boolean) => {
    showFooter.value = v
  }
  const setPrimaryColor = (v: string) => {
    primaryColor.value = v
  }
  const setComponentSize = (v: 'large' | 'default' | 'small') => {
    componentSize.value = v
  }
  const setLocale = (v: Locale) => {
    locale.value = v
  }

  return {
    showTagsView,
    showBreadcrumb,
    showLogo,
    showFooter,
    primaryColor,
    componentSize,
    locale,
    setShowTagsView,
    setShowBreadcrumb,
    setShowLogo,
    setShowFooter,
    setPrimaryColor,
    setComponentSize,
    setLocale
  }
})
