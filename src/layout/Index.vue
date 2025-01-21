<template>
  <el-watermark :font="font" :content="['wang', 'vue-admin']">
    <el-container>
      <Sidebar />
      <el-container>
        <el-header>
          <Header />
        </el-header>
        <TagView />
        <el-main>
          <RouterView />
        </el-main>
        <Footer />
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
import { isDark } from '@/stores/dark'

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
