import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { authService } from '@/lib/auth/authService'
import type { UserProfile } from '@/lib/auth/types'

export const useUserStore = defineStore('user', () => {
  const profile = ref<UserProfile | null>(null)
  const isLoaded = ref(false)
  const loading = ref(false)

  // 并发保护：复用 in-flight promise，避免重复 /api/auth/me 请求
  let profilePromise: Promise<UserProfile> | null = null

  const roles = computed(() => profile.value?.roles ?? [])
  const permissions = computed(() => profile.value?.permissions ?? [])

  async function loadProfile(): Promise<UserProfile> {
    if (isLoaded.value) return profile.value!
    if (profilePromise) return profilePromise
    profilePromise = (async () => {
      loading.value = true
      try {
        profile.value = await authService.me()
        isLoaded.value = true
        return profile.value
      } finally {
        loading.value = false
        profilePromise = null
      }
    })()
    return profilePromise
  }

  function reset(): void {
    profile.value = null
    isLoaded.value = false
    profilePromise = null
  }

  return { profile, isLoaded, loading, roles, permissions, loadProfile, reset }
})
