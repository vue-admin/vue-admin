<template>
  <div class="page-container">
    <el-card
      v-if="title || $slots.header"
      shadow="never"
      class="page-header"
    >
      <div class="page-header__inner">
        <h3
          v-if="title"
          class="page-title"
        >
          {{ title }}
        </h3>
        <div class="page-header__extra">
          <slot name="header" />
        </div>
      </div>
    </el-card>
    <el-card
      shadow="never"
      class="page-body"
    >
      <slot />
    </el-card>
  </div>
</template>

<script lang="ts" setup>
defineProps<{
  title?: string
}>()
</script>

<style lang="scss" scoped>
.page-container {
  .page-header {
    margin-bottom: 12px;
    .page-title { margin: 0; font-size: 16px; font-weight: 600; }
    .page-header__inner {
      display: flex; justify-content: space-between; align-items: center;
    }
  }
}
</style>
