<template>
  <el-drawer
    :model-value="modelValue"
    title="布局设置"
    size="320px"
    @update:model-value="$emit('update:modelValue', $event)"
  >
    <el-divider>界面显示</el-divider>
    <div class="setting-item">
      <span>显示 TagsView</span>
      <el-switch
        :model-value="layoutStore.showTagsView"
        @update:model-value="(v) => layoutStore.setShowTagsView(Boolean(v))"
      />
    </div>
    <div class="setting-item">
      <span>显示面包屑</span>
      <el-switch
        :model-value="layoutStore.showBreadcrumb"
        @update:model-value="(v) => layoutStore.setShowBreadcrumb(Boolean(v))"
      />
    </div>
    <div class="setting-item">
      <span>显示 Logo</span>
      <el-switch
        :model-value="layoutStore.showLogo"
        @update:model-value="(v) => layoutStore.setShowLogo(Boolean(v))"
      />
    </div>
    <div class="setting-item">
      <span>显示页脚</span>
      <el-switch
        :model-value="layoutStore.showFooter"
        @update:model-value="(v) => layoutStore.setShowFooter(Boolean(v))"
      />
    </div>

    <el-divider>主题</el-divider>
    <div class="setting-item">
      <span>主题色</span>
      <el-color-picker
        :model-value="layoutStore.primaryColor"
        @update:model-value="(v) => layoutStore.setPrimaryColor(v ?? '')"
      />
    </div>
    <div class="setting-item">
      <span>组件大小</span>
      <el-radio-group
        :model-value="layoutStore.componentSize"
        size="small"
        @update:model-value="(v) => layoutStore.setComponentSize(v as 'large' | 'default' | 'small')"
      >
        <el-radio-button value="large">
          大
        </el-radio-button>
        <el-radio-button value="default">
          默认
        </el-radio-button>
        <el-radio-button value="small">
          小
        </el-radio-button>
      </el-radio-group>
    </div>
  </el-drawer>
</template>

<script lang="ts" setup>
import { useLayoutStore } from '@/app/stores/layout'

defineProps<{ modelValue: boolean }>()
defineEmits<{ 'update:modelValue': [v: boolean] }>()

const layoutStore = useLayoutStore()
</script>

<style lang="scss" scoped>
.setting-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 0;
  font-size: 14px;
}
</style>
