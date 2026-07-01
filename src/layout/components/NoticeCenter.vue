<template>
  <el-dropdown
    trigger="click"
    @visible-change="onDropdownVisible"
  >
    <div class="notice-bell">
      <el-badge
        :value="noticeStore.unreadCount"
        :hidden="noticeStore.unreadCount === 0"
        class="item"
      >
        <el-icon><Bell /></el-icon>
      </el-badge>
    </div>
    <template #dropdown>
      <el-dropdown-menu class="notice-dropdown">
        <div class="notice-header">
          <span>通知中心</span>
          <el-button
            type="primary"
            link
            size="small"
            @click.stop="markAllAsRead"
          >
            全部已读
          </el-button>
        </div>
        <el-tabs
          v-model="activeTab"
          class="notice-tabs"
        >
          <el-tab-pane
            label="公告"
            name="announcement"
          >
            <div
              v-loading="noticeStore.loading"
              class="notice-list"
            >
              <div
                v-for="item in noticeStore.announcements"
                :key="item.id"
                class="notice-item"
                :class="{ unread: !noticeStore.readIds.has(item.id) }"
                @click="viewNotice(item)"
              >
                <div class="notice-title">
                  <el-tag
                    :type="priorityType(item.priority)"
                    size="small"
                  >
                    {{ priorityLabel(item.priority) }}
                  </el-tag>
                  <span>{{ item.title }}</span>
                </div>
                <div class="notice-meta">
                  <span>{{ item.publishTime }}</span>
                  <span>{{ item.publisher }}</span>
                </div>
              </div>
              <el-empty
                v-if="noticeStore.announcements.length === 0"
                description="暂无公告"
                :image-size="80"
              />
            </div>
          </el-tab-pane>
          <el-tab-pane
            label="通知"
            name="notice"
          >
            <div
              v-loading="noticeStore.loading"
              class="notice-list"
            >
              <div
                v-for="item in noticeStore.notifications"
                :key="item.id"
                class="notice-item"
                :class="{ unread: !noticeStore.readIds.has(item.id) }"
                @click="viewNotice(item)"
              >
                <div class="notice-title">
                  <el-tag
                    :type="priorityType(item.priority)"
                    size="small"
                  >
                    {{ priorityLabel(item.priority) }}
                  </el-tag>
                  <span>{{ item.title }}</span>
                </div>
                <div class="notice-meta">
                  <span>{{ item.publishTime }}</span>
                  <span>{{ item.publisher }}</span>
                </div>
              </div>
              <el-empty
                v-if="noticeStore.notifications.length === 0"
                description="暂无通知"
                :image-size="80"
              />
            </div>
          </el-tab-pane>
          <el-tab-pane
            label="待办"
            name="todo"
          >
            <div
              v-loading="noticeStore.loading"
              class="notice-list"
            >
              <div
                v-for="item in noticeStore.todos"
                :key="item.id"
                class="notice-item"
                :class="{ unread: !noticeStore.readIds.has(item.id) }"
                @click="viewNotice(item)"
              >
                <div class="notice-title">
                  <el-tag
                    :type="priorityType(item.priority)"
                    size="small"
                  >
                    {{ priorityLabel(item.priority) }}
                  </el-tag>
                  <span>{{ item.title }}</span>
                </div>
                <div class="notice-meta">
                  <span>{{ item.publishTime }}</span>
                  <span>{{ item.publisher }}</span>
                </div>
              </div>
              <el-empty
                v-if="noticeStore.todos.length === 0"
                description="暂无待办"
                :image-size="80"
              />
            </div>
          </el-tab-pane>
        </el-tabs>
        <div class="notice-footer">
          <el-button
            type="primary"
            link
            @click="goToManage"
          >
            查看全部
          </el-button>
        </div>
      </el-dropdown-menu>
    </template>

    <!-- 公告详情弹窗 -->
    <el-dialog
      v-model="detailVisible"
      :title="currentNotice?.title"
      width="500px"
      top="10vh"
    >
      <div class="notice-detail">
        <div class="detail-meta">
          <el-tag>{{ typeLabel(currentNotice?.type) }}</el-tag>
          <el-tag :type="priorityType(currentNotice?.priority)">
            {{ priorityLabel(currentNotice?.priority) }}
          </el-tag>
          <span>发布人：{{ currentNotice?.publisher }}</span>
          <span>发布时间：{{ currentNotice?.publishTime }}</span>
        </div>
        <div class="detail-content">
          {{ currentNotice?.content }}
        </div>
      </div>
      <template #footer>
        <el-button @click="detailVisible = false">
          关闭
        </el-button>
      </template>
    </el-dialog>
  </el-dropdown>
</template>

<script lang="ts" setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { Bell } from '@element-plus/icons-vue'
import { useNoticeStore } from '@/app/stores/notice'
import {
  priorityLabel,
  priorityTagType,
  noticeTypeLabel as typeLabel,
} from '@/app/constants/enums'
import type { NoticeInfo } from '@/modules/system/notice/api'

const router = useRouter()
const noticeStore = useNoticeStore()

const activeTab = ref('announcement')
const detailVisible = ref(false)
const currentNotice = ref<NoticeInfo | null>(null)

const priorityType = priorityTagType

function onDropdownVisible(visible: boolean) {
  if (visible && noticeStore.notices.length === 0) {
    noticeStore.loadNotices()
  }
}

function viewNotice(item: NoticeInfo) {
  currentNotice.value = item
  detailVisible.value = true
  noticeStore.markAsRead(item.id)
}

function markAllAsRead() {
  noticeStore.markAllAsRead()
}

function goToManage() {
  router.push('/system/notice')
}

onMounted(() => {
  noticeStore.loadNotices()
})
</script>

<style scoped>
.notice-bell {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  cursor: pointer;
  font-size: 18px;
  transition: background-color 0.2s;
}

.notice-bell:hover {
  background-color: var(--el-fill-color-light);
}

.notice-dropdown {
  width: 400px;
  max-height: 500px;
  padding: 0;
}

.notice-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  border-bottom: 1px solid var(--el-border-color-lighter);
  font-weight: 500;
}

.notice-tabs {
  padding: 0 16px;
}

.notice-tabs :deep(.el-tabs__nav) {
  width: 100%;
}

.notice-list {
  max-height: 300px;
  overflow-y: auto;
  margin: 0 -16px;
  padding: 0 16px;
}

.notice-item {
  padding: 12px 0;
  border-bottom: 1px solid var(--el-border-color-extra-light);
  cursor: pointer;
  transition: background-color 0.2s;
}

.notice-item:hover {
  background-color: var(--el-fill-color-light);
  margin: 0 -16px;
  padding: 12px 16px;
}

.notice-item.unread {
  background-color: var(--el-bg-color-page);
  margin: 0 -16px;
  padding: 12px 16px;
}

.notice-title {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 6px;
  font-size: 14px;
  color: var(--el-text-color-primary);
}

.notice-meta {
  display: flex;
  gap: 16px;
  font-size: 12px;
  color: var(--el-text-color-regular);
}

.notice-footer {
  padding: 12px 16px;
  border-top: 1px solid var(--el-border-color-lighter);
  text-align: center;
}

.notice-detail {
  padding: 8px 0;
}

.detail-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid var(--el-border-color-lighter);
  font-size: 13px;
  color: var(--el-text-color-regular);
}

.detail-content {
  font-size: 14px;
  line-height: 1.8;
  color: var(--el-text-color-primary);
  white-space: pre-wrap;
}
</style>
