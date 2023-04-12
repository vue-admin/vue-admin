import { useStorage } from '@vueuse/core'
export const user = useStorage('user', { id: '1', name: 'wang', role: 'admin' })
