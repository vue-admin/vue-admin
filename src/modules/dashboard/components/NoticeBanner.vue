<template>
  <!--
    首页公告通知器：不在首屏堆叠 alert，而是登录后用右上角 toast 推送
    未读的高优先级公告（点击可跳详情）。持久列表由 Header 铃铛承载。
  -->
  <span class="notice-notifier" />
</template>

<script lang="ts" setup>
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElNotification } from 'element-plus'
import { useNoticeStore } from '@/app/stores/notice'
import { priorityLabel } from '@/app/constants/enums'
import type { NoticeInfo } from '@/modules/system/notice/api'

const noticeStore = useNoticeStore()
const router = useRouter()

// 单条 toast 展示时长（ms）
const DURATION = 6000

function openOne(notice: NoticeInfo): void {
  ElNotification({
    title: `${priorityLabel(notice.priority)}公告：${notice.title}`,
    message: notice.content,
    type: 'warning',
    position: 'top-right',
    duration: DURATION,
    onClick: () => {
      router.push('/system/notice')
      noticeStore.markAsRead(notice.id)
    },
  })
  noticeStore.markAsRead(notice.id)
}

onMounted(async () => {
  await noticeStore.loadNotices()
  // 仅对未读的高优先级公告弹 toast，避免首屏被打扰
  const unreadHigh = noticeStore.announcements.filter(
    (n) => n.priority === 'high' && !noticeStore.readIds.has(n.id)
  )
  // 最多弹 2 条，过多反而打扰
  unreadHigh.slice(0, 2).forEach(openOne)
})
</script>

<style scoped>
.notice-notifier {
  display: none;
}
</style>
