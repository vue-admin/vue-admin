<template>
  <ErrorBoundary>
    <router-view />
  </ErrorBoundary>
</template>

<script lang="ts" setup>
import ErrorBoundary from '@/lib/error/ErrorBoundary.vue'
</script>

<style lang="scss"></style>
