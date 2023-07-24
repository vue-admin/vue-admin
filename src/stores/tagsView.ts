import { ref } from 'vue'
//import { useStorage } from '@vueuse/core'

const defaultTagsViewItem = {
  fullPath: '/',
  meta: { title: '首页', affix: true },
  name: 'home',
  params: {},
  path: '/',
  query: {},
  title: '首页'
}

export let tagsViewList = ref<tagsViewItem[]>([defaultTagsViewItem])
//const tagsViewStore = useStorage('tagsViewStore', tagsViewList)

interface tagsViewItem {
  title: string
  name?: string
  fullPath: string
  path?: string
  meta?: tagsViewItemMeta
  params?: object
  query?: object
}

interface tagsViewItemMeta {
  title: string
  affix: boolean
}

interface tagsViewItemType {
  index: number
  type: string
}
// 定义计算属性
export function addTagsViewList(tag: tagsViewItem) {
  const isFind = tagsViewList.value.find((item: tagsViewItem) => {
    return item.path === tag.path
  })
  // 处理重复
  if (!isFind) {
    tagsViewList.value.push(tag)
    //tagsViewStore.value = tagsViewList.value
  }
}

/**
 * 删除 tag
 * @param {type: 'other'||'right'||'index', index: index} payload
 */
export function removeTagsView(payload: tagsViewItemType) {
  if (payload.type === 'index') {
    tagsViewList.value.splice(payload.index, 1)
  } else if (payload.type === 'other') {
    tagsViewList.value.splice(
      payload.index + 1,
      tagsViewList.value.length - payload.index + 1
    )
    tagsViewList.value.splice(0, payload.index)
    if (payload.index != 0) {
      //list第一位加入删除了的首页tag
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
  //tagsViewStore.value = tagsViewList.value
}
