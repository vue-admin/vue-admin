<template>
  <el-container>
    <Sicecar />
    <el-container>
      <el-header>
        <Header />
      </el-header>
      <el-main>
        <RouterView></RouterView>
      </el-main>
      <Footer />
    </el-container>
  </el-container>
</template>

<script setup lang="ts">
import Sicecar from "./layouts/Sidecar.vue"
import Header from "./layouts/Header.vue"
import Footer from "./layouts/Footer.vue"
</script>