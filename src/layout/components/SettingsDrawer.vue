<template>
  <el-drawer
    :model-value="modelValue"
    :title="t('layout.settings')"
    size="320px"
    @update:model-value="$emit('update:modelValue', $event)"
  >
    <el-divider>{{ t('layout.settings') }}</el-divider>
    <div class="setting-item">
      <span>{{ t('layout.showTagsView') }}</span>
      <el-switch
        :model-value="layoutStore.showTagsView"
        @update:model-value="(v) => layoutStore.setShowTagsView(Boolean(v))"
      />
    </div>
    <div class="setting-item">
      <span>{{ t('layout.showBreadcrumb') }}</span>
      <el-switch
        :model-value="layoutStore.showBreadcrumb"
        @update:model-value="(v) => layoutStore.setShowBreadcrumb(Boolean(v))"
      />
    </div>
    <div class="setting-item">
      <span>{{ t('layout.showLogo') }}</span>
      <el-switch
        :model-value="layoutStore.showLogo"
        @update:model-value="(v) => layoutStore.setShowLogo(Boolean(v))"
      />
    </div>
    <div class="setting-item">
      <span>{{ t('layout.showFooter') }}</span>
      <el-switch
        :model-value="layoutStore.showFooter"
        @update:model-value="(v) => layoutStore.setShowFooter(Boolean(v))"
      />
    </div>

    <el-divider>{{ t('layout.theme') }}</el-divider>
    <div class="setting-item">
      <span>{{ t('layout.primaryColor') }}</span>
      <el-color-picker
        :model-value="layoutStore.primaryColor"
        @update:model-value="(v) => layoutStore.setPrimaryColor(v ?? '')"
      />
    </div>
    <div class="setting-item">
      <span>{{ t('layout.componentSize') }}</span>
      <el-radio-group
        :model-value="layoutStore.componentSize"
        size="small"
        @update:model-value="(v) => layoutStore.setComponentSize(v as 'large' | 'default' | 'small')"
      >
        <el-radio-button value="large">
          {{ t('size.large') }}
        </el-radio-button>
        <el-radio-button value="default">
          {{ t('size.default') }}
        </el-radio-button>
        <el-radio-button value="small">
          {{ t('size.small') }}
        </el-radio-button>
      </el-radio-group>
    </div>
    <div class="setting-item">
      <span>{{ t('layout.locale') }}</span>
      <el-select
        :model-value="layoutStore.locale"
        size="small"
        style="width: 120px"
        @update:model-value="(v) => layoutStore.setLocale(v as 'zh-CN' | 'en-US')"
      >
        <el-option
          label="简体中文"
          value="zh-CN"
        />
        <el-option
          label="English"
          value="en-US"
        />
      </el-select>
    </div>
  </el-drawer>
</template>

<script lang="ts" setup>
import { useI18n } from 'vue-i18n'
import { useLayoutStore } from '@/app/stores/layout'

defineProps<{ modelValue: boolean }>()
defineEmits<{ 'update:modelValue': [v: boolean] }>()

const { t } = useI18n()
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
