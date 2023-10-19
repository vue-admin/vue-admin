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
    <context-menu
      v-show="visible"
      :style="menuStyle"
      :index="selectIndex"
    ></context-menu>
  </div>
</template>

<script lang="ts" setup>
import ContextMenu from './ContextMenu.vue'
import { ref, reactive, watch, onMounted } from 'vue'
import { RouteLocationNormalizedLoaded, useRoute, useRouter } from 'vue-router'
import {
  tagsViewList,
  addTagsViewList,
  removeTagsView
} from '@/stores/tagsView'

const router = useRouter()
const route = useRoute()

interface tagsViewItem {
  title: string
  fullPath: string
  path?: string
  meta?: tagsViewItemMeta
}

interface tagsViewItemMeta {
  affix: boolean
}

/**
 * 是否被选中
 */
const isActive = (tag: tagsViewItem) => {
  return tag.path === route.path
}
const isAffiix = (tag: tagsViewItem) => {
  return tag.meta && tag.meta.affix
}

// contextMenu 相关
const selectIndex = ref(0)
const visible = ref(false)
const menuStyle = reactive({
  left: '0',
  top: '0'
})

/**
 * 展示 menu
 */
const openMenu = (e: any, index: number) => {
  const { x, y } = e
  menuStyle.left = x + 'px'
  menuStyle.top = y + 'px'
  selectIndex.value = index
  visible.value = true
}

/**
 * 关闭 tag 的点击事件
 */

const onCloseClick = (index: number, tag: tagsViewItem) => {
  removeTagsView({
    type: 'index',
    index: index
  })
  //如果删除的是当前页面，自动定位到上一个页面
  if (isActive(tag)) {
    if (index == 0 && tagsViewList.value.length >= 1) {
      let pre_index = 0
      let pre_page = tagsViewList.value[pre_index]
      router.push(pre_page.fullPath)
    } else if (tagsViewList.value.length == 0) {
      //如果是最后一个，定位到首页
      router.push('/')
    } else {
      let pre_index = index - 1
      let pre_page = tagsViewList.value[pre_index]
      router.push(pre_page.fullPath)
    }
  }
}

/**
 * 关闭 menu
 */
const closeMenu = () => {
  visible.value = false
}

/**
 * 监听变化
 */
watch(
  visible,
  (val) => {
    if (val) {
      document.body.addEventListener('click', closeMenu)
    } else {
      document.body.removeEventListener('click', closeMenu)
    }
  },
  {
    immediate: true
  }
)
/**
 * 生成 title
 */
const getTitle = (route: RouteLocationNormalizedLoaded) => {
  let title = ''
  if (!route.meta) {
    // 处理无 meta 的路由
    const pathArr = route.path.split('/')
    title = pathArr[pathArr.length - 1]
  } else {
    title = route.meta?.title as string
  }
  return title
}

/**
 * 监听路由变化
 */
watch(
  route,
  (to, from) => {
    const { fullPath, meta, name, params, path, query } = to
    let affix = false
    if (path === '/') {
      affix = true
    }
    let title = getTitle(to)
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
  {
    immediate: true
  }
)
</script>

<style lang="scss" scoped>
.tags-view-container {
  height: 34px;
  width: 100%;
  border-bottom: 1px solid var(--el-menu-border-color);
  //box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.12), 0 0 3px 0 rgba(0, 0, 0, 0.04);

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

    // close 按钮
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
