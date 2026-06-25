import { defineStore } from 'pinia'
import { ref } from 'vue'

export interface TagsViewItem {
  title: string
  name?: string
  fullPath: string
  path?: string
  meta?: TagsViewItemMeta
  params?: object
  query?: object
}

export interface TagsViewItemMeta {
  title: string
  affix: boolean
}

export interface TagsViewPayload {
  index: number
  type: 'index' | 'other' | 'right' | 'all'
}

const defaultTagsViewItem: TagsViewItem = {
  fullPath: '/',
  meta: { title: '首页', affix: true },
  name: 'home',
  params: {},
  path: '/',
  query: {},
  title: '首页'
}

export const useTagsViewStore = defineStore('tagsView', () => {
  const tagsViewList = ref<TagsViewItem[]>([defaultTagsViewItem])

  const addTagsViewList = (tag: TagsViewItem) => {
    const exists = tagsViewList.value.some((item) => item.path === tag.path)
    if (!exists) {
      tagsViewList.value.push(tag)
    }
  }

  const removeTagsView = (payload: TagsViewPayload) => {
    if (payload.type === 'index') {
      tagsViewList.value.splice(payload.index, 1)
    } else if (payload.type === 'other') {
      tagsViewList.value.splice(
        payload.index + 1,
        tagsViewList.value.length - payload.index + 1
      )
      tagsViewList.value.splice(0, payload.index)
      if (payload.index !== 0) {
        tagsViewList.value.unshift(defaultTagsViewItem)
      }
    } else if (payload.type === 'right') {
      tagsViewList.value.splice(
        payload.index + 1,
        tagsViewList.value.length - payload.index + 1
      )
    } else if (payload.type === 'all') {
      tagsViewList.value = []
    }
  }

  return {
    tagsViewList,
    addTagsViewList,
    removeTagsView
  }
})
