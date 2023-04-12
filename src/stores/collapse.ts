import { useToggle,useStorage } from '@vueuse/core'

export const isCollapse = useStorage('collapse', true)
export const toggleCollapse = useToggle(isCollapse)
