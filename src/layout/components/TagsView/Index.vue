<template>
  <div class="tags-view-container">
    <el-scrollbar class="tags-view-wrapper">
      <router-link
        class="tags-view-item"
        :style="{
          backgroundColor: isActive(tag) ? 'var(--el-menu-hover-bg-color)' : '',
          color: isActive(tag) ? 'var(--el-menu-active-color)' : '',
          borderColor: isActive(tag) ? '' : ''
        }"
        v-for="(tag, index) in tagsViewList"
        :key="tag.fullPath"
        :to="{ path: tag.fullPath }"
        @contextmenu.prevent="openMenu($event, index)"
      >
        {{ tag.title }}
        <template v-if="!isAffiix(tag)">
          <Close
            @click.prevent.stop="onCloseClick(index, tag)"
            class="el-icon-close"
          />
        </template>
      </router-link>
    </el-scrollbar>
    <context-menu v-show="visible" :style="menuStyle" :index="selectIndex" />
  </div>
</template>

<script lang="ts" setup>
import ContextMenu from './ContextMenu.vue'
import { ref, reactive, watch } from 'vue'
import { RouteLocationNormalizedLoaded, useRoute, useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import { useTagsViewStore, type TagsViewItem } from '@/stores/tagsView'

const router = useRouter()
const route = useRoute()

const tagsViewStore = useTagsViewStore()
const { tagsViewList } = storeToRefs(tagsViewStore)
const { addTagsViewList, removeTagsView } = tagsViewStore

const isActive = (tag: TagsViewItem) => {
  return tag.path === route.path
}
const isAffiix = (tag: TagsViewItem) => {
  return tag.meta && tag.meta.affix
}

// contextMenu 相关
const selectIndex = ref(0)
const visible = ref(false)
const menuStyle = reactive({
  left: '0',
  top: '0'
})

const openMenu = (e: any, index: number) => {
  const { x, y } = e
  menuStyle.left = x + 'px'
  menuStyle.top = y + 'px'
  selectIndex.value = index
  visible.value = true
}

const onCloseClick = (index: number, tag: TagsViewItem) => {
  removeTagsView({
    type: 'index',
    index: index
  })
  if (isActive(tag)) {
    if (index == 0 && tagsViewList.value.length >= 1) {
      router.push(tagsViewList.value[0].fullPath)
    } else if (tagsViewList.value.length == 0) {
      router.push('/')
    } else {
      router.push(tagsViewList.value[index - 1].fullPath)
    }
  }
}

const closeMenu = () => {
  visible.value = false
}

watch(
  visible,
  (val) => {
    if (val) {
      document.body.addEventListener('click', closeMenu)
    } else {
      document.body.removeEventListener('click', closeMenu)
    }
  },
  { immediate: true }
)

const getTitle = (route: RouteLocationNormalizedLoaded) => {
  if (!route.meta) {
    const pathArr = route.path.split('/')
    return pathArr[pathArr.length - 1]
  }
  return route.meta?.title as string
}

watch(
  route,
  (to) => {
    const { fullPath, meta, name, params, path, query } = to
    let affix = false
    if (path === '/') {
      affix = true
    }
    const title = getTitle(to)
    if (title === undefined || title === '') {
      return
    }
    addTagsViewList({
      fullPath,
      params,
      path,
      query,
      title: title,
      name: title,
      meta: { title: title, affix: affix }
    })
  },
  { immediate: true }
)
</script>

<style lang="scss" scoped>
.tags-view-container {
  height: 34px;
  width: 100%;
  border-bottom: 1px solid var(--el-menu-border-color);

  .tags-view-item {
    display: inline-block;
    position: relative;
    cursor: pointer;
    height: 26px;
    line-height: 26px;
    border: 1px solid var(--el-menu-border-color);
    color: var(--el-menu-text-color);
    padding: 0 8px;
    font-size: 12px;
    margin-left: 5px;
    margin-top: 4px;

    &:first-of-type {
      margin-left: 15px;
    }

    &:last-of-type {
      margin-right: 15px;
    }

    &.active {
      color: #fff;

      &::before {
        content: '';
        background: #fff;
        display: inline-block;
        width: 8px;
        height: 8px;
        border-radius: 50%;
        position: relative;
        margin-right: 4px;
      }
    }

    .el-icon-close {
      height: 1em;
      width: 1em;
      line-height: 10px;
      vertical-align: -2px;
      border-radius: 50%;
      text-align: center;
      transition: all 0.3s cubic-bezier(0.645, 0.045, 0.355, 1);
      transform-origin: 100% 50%;

      &:before {
        transform: scale(0.6);
        display: inline-block;
        vertical-align: -3px;
      }

      &:hover {
        background-color: var(--el-menu-hover-bg-color);
        color: var(--el-menu-hover-text-color);
      }
    }
  }
}
</style>
