import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { fetchNoticeList } from '@/modules/system/notice/api'
import type { NoticeInfo } from '@/modules/system/notice/api'

export const useNoticeStore = defineStore('notice', () => {
  // 公告列表
  const notices = ref<NoticeInfo[]>([])
  const loading = ref(false)
  // 已读公告 ID
  const readIds = ref<Set<string>>(new Set())

  // 未读数量
  const unreadCount = computed(() => {
    return notices.value.filter(n => !readIds.value.has(n.id) && n.status === 'published').length
  })

  // 公告类型过滤
  const announcements = computed(() => notices.value.filter(n => n.type === 'announcement' && n.status === 'published'))
  const notifications = computed(() => notices.value.filter(n => n.type === 'notice' && n.status === 'published'))
  const todos = computed(() => notices.value.filter(n => n.type === 'todo' && n.status === 'published'))

  // 加载公告列表
  async function loadNotices() {
    if (loading.value) return
    loading.value = true
    try {
      const res = await fetchNoticeList({
        keyword: '',
        type: '',
        status: 'published',
        page: 1,
        size: 50,
      })
      notices.value = res.records
    } catch (e) {
      console.error('加载公告失败', e)
    } finally {
      loading.value = false
    }
  }

  // 标记已读
  function markAsRead(id: string) {
    readIds.value.add(id)
  }

  // 标记全部已读
  function markAllAsRead() {
    notices.value.forEach(n => readIds.value.add(n.id))
  }

  return {
    notices,
    loading,
    readIds,
    unreadCount,
    announcements,
    notifications,
    todos,
    loadNotices,
    markAsRead,
    markAllAsRead,
  }
})
