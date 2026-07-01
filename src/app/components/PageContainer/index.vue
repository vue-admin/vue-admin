<template>
  <div class="page-container">
    <div
      v-if="title || $slots.header"
      class="page-header"
    >
      <div class="page-header__left">
        <h3
          v-if="title"
          class="page-title"
        >
          {{ title }}
        </h3>
      </div>
      <div class="page-header__right">
        <slot name="header" />
      </div>
    </div>
    <div class="page-body">
      <slot />
    </div>
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
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding-bottom: 12px;
    margin-bottom: 16px;
    border-bottom: 1px solid var(--el-border-color-lighter);

    &__left {
      min-width: 0;
      flex-shrink: 1;
    }

    &__right {
      display: flex;
      gap: 8px;
      align-items: center;
      flex-shrink: 0;
    }
  }

  .page-title {
    margin: 0;
    font-size: 16px;
    font-weight: 600;
    color: var(--el-text-color-primary);
  }
}
</style>
