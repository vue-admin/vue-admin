<template>
  <el-watermark
    :font="font"
    :content="['wang', 'vue-admin']"
  >
    <el-container>
      <Sidebar />
      <el-container>
        <el-header>
          <Header />
        </el-header>
        <TagView v-if="layoutStore.showTagsView" />
        <el-main>
          <RouterView />
        </el-main>
        <Footer v-if="layoutStore.showFooter" />
      </el-container>
    </el-container>
  </el-watermark>
</template>

<script setup lang="ts">
import Sidebar from './components/Sidebar/Index.vue'
import Header from './components/Header/Index.vue'
import TagView from './components/TagsView/Index.vue'
import Footer from './components/Footer.vue'
import { reactive, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { useThemeStore } from '@/app/stores/theme'
import { useLayoutStore } from '@/app/stores/layout'

const themeStore = useThemeStore()
const { isDark } = storeToRefs(themeStore)
const layoutStore = useLayoutStore()

const font = reactive({
  color: 'rgba(0, 0, 0, .05)'
})

watch(
  isDark,
  () => {
    font.color = isDark.value
      ? 'rgba(255, 255, 255, .05)'
      : 'rgba(0, 0, 0, .05)'
  },
  {
    immediate: true
  }
)
</script>
