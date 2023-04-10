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
import Sicecar from "./components/Sidecar.vue"
import Header from "./components/Header.vue"
import Footer from "./components/Footer.vue"
</script>