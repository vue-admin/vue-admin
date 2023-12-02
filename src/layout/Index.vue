<template>
  <el-container>
    <Sicecar />
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
</template>

<script setup lang="ts">
import Sicecar from './components/SideBar/Index.vue'
import Header from './components/Header/Index.vue'
import TagView from './components/TagsView/Index.vue'
import Footer from './components/Footer.vue'
</script>
