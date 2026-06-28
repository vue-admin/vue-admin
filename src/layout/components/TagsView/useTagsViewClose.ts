import { storeToRefs } from 'pinia'
import { useRoute, useRouter } from 'vue-router'
import { useTagsViewStore } from '@/app/stores/tagsView'
import type { TagsViewItem } from '@/app/stores/tagsView'

/**
 * 关闭 TagsView 中指定 index 的 tag，并在该 tag 为当前激活路由时
 * 跳转到相邻 tag（或首页）。
 *
 * 抽取自 `Index.vue` 的 `onCloseClick` 逻辑，供
 * `Index.vue`（关闭按钮）与 `ContextMenu.vue`（「关闭当前」菜单项）共享，
 * 避免双份实现。
 */
export function useTagsViewClose() {
  const router = useRouter()
  const route = useRoute()
  const tagsViewStore = useTagsViewStore()
  const { tagsViewList } = storeToRefs(tagsViewStore)

  const closeCurrent = (index: number) => {
    const tag: TagsViewItem | undefined = tagsViewList.value[index]
    const wasActive = !!tag && tag.path === route.path
    tagsViewStore.removeTagsView({ type: 'index', index })
    if (!wasActive) return
    if (index === 0 && tagsViewList.value.length >= 1) {
      router.push(tagsViewList.value[0].fullPath)
    } else if (tagsViewList.value.length === 0) {
      router.push('/')
    } else {
      router.push(tagsViewList.value[index - 1].fullPath)
    }
  }

  return { closeCurrent }
}
