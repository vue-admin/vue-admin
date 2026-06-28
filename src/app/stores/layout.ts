import { defineStore } from 'pinia'
import { useStorage } from '@vueuse/core'

export const useLayoutStore = defineStore('layout', () => {
  const showTagsView = useStorage('layout:showTagsView', true)
  const showBreadcrumb = useStorage('layout:showBreadcrumb', true)
  const showLogo = useStorage('layout:showLogo', true)
  const showFooter = useStorage('layout:showFooter', false)
  const primaryColor = useStorage('layout:primaryColor', '#409EFF')
  const componentSize = useStorage<'large' | 'default' | 'small'>('layout:componentSize', 'default')

  const setShowTagsView = (v: boolean) => { showTagsView.value = v }
  const setShowBreadcrumb = (v: boolean) => { showBreadcrumb.value = v }
  const setShowLogo = (v: boolean) => { showLogo.value = v }
  const setShowFooter = (v: boolean) => { showFooter.value = v }
  const setPrimaryColor = (v: string) => { primaryColor.value = v }
  const setComponentSize = (v: 'large' | 'default' | 'small') => { componentSize.value = v }

  return {
    showTagsView, showBreadcrumb, showLogo, showFooter,
    primaryColor, componentSize,
    setShowTagsView, setShowBreadcrumb, setShowLogo, setShowFooter,
    setPrimaryColor, setComponentSize
  }
})
