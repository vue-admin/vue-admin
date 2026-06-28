<template>
  <ul class="context-menu-container">
    <li @click="onRefreshClick">
      刷新
    </li>
    <li @click="onCloseCurrentClick">
      关闭当前
    </li>
    <li @click="onCloseRightClick">
      关闭右侧
    </li>
    <li @click="onCloseOtherClick">
      关闭其他
    </li>
    <li @click="onCloseAllClick">
      关闭全部
    </li>
  </ul>
</template>

<script lang="ts" setup>
import { useRouter } from 'vue-router'
import { useTagsViewStore } from '@/app/stores/tagsView'
import { useTagsViewClose } from './useTagsViewClose'

const props = defineProps({
  index: {
    type: Number,
    required: true
  }
})

const router = useRouter()
const tagsViewStore = useTagsViewStore()
const { removeTagsView } = tagsViewStore

const { closeCurrent } = useTagsViewClose()

const onRefreshClick = () => {
  router.go(0)
}

const onCloseCurrentClick = () => {
  // 关闭当前 + 必要时跳转相邻 tag（与 Index.vue 的关闭按钮共享逻辑）
  closeCurrent(props.index)
}

const onCloseRightClick = () => {
  removeTagsView({
    type: 'right',
    index: props.index
  })
}

const onCloseOtherClick = () => {
  removeTagsView({
    type: 'other',
    index: props.index
  })
}

const onCloseAllClick = () => {
  removeTagsView({
    type: 'all',
    index: props.index
  })
  router.push('/')
}
</script>

<style lang="scss" scoped>
.context-menu-container {
  position: fixed;
  background: #fff;
  z-index: 3000;
  list-style-type: none;
  padding: 5px 0;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 400;
  color: #333;
  box-shadow: 2px 2px 3px 0 rgba(0, 0, 0, 0.3);

  li {
    margin: 0;
    padding: 7px 16px;
    cursor: pointer;

    &:hover {
      background: #eee;
    }
  }
}
</style>
