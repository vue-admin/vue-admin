<template>
  <main>
    home
    <router-link to="/login">登录</router-link>
  </main>
</template>

<script lang="ts" setup>
import { useRouter } from 'vue-router';
const router = useRouter()
</script>