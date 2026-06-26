import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { authService } from '@/lib/auth/authService'
import type { UserProfile } from '@/lib/auth/types'

export const useUserStore = defineStore('user', () => {
  const profile = ref<UserProfile | null>(null)
  const isLoaded = ref(false)
  const loading = ref(false)

  const roles = computed(() => profile.value?.roles ?? [])
  const permissions = computed(() => profile.value?.permissions ?? [])

  async function loadProfile(): Promise<UserProfile> {
    if (isLoaded.value) return profile.value!
    loading.value = true
    try {
      profile.value = await authService.me()
      isLoaded.value = true
      return profile.value
    } finally {
      loading.value = false
    }
  }

  function reset(): void {
    profile.value = null
    isLoaded.value = false
  }

  return { profile, isLoaded, loading, roles, permissions, loadProfile, reset }
})
