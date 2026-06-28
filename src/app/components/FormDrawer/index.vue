<template>
  <el-drawer
    :model-value="modelValue"
    :title="title"
    :size="width"
    @update:model-value="$emit('update:modelValue', $event)"
  >
    <div
      v-loading="loading"
      class="form-drawer-body"
    >
      <el-form
        ref="formRef"
        :model="formData"
        :rules="rules"
        label-width="100px"
      >
        <el-row :gutter="16">
          <el-col
            v-for="field in visibleFields"
            :key="field.prop"
            :span="field.span || 24"
          >
            <el-form-item
              :label="field.label"
              :prop="field.prop"
              :rules="field.rules"
            >
              <slot
                :name="`field-${field.prop}`"
                :field="field"
              >
                <component
                  :is="resolveComponent(field.type)"
                  v-model="formData[field.prop]"
                  :placeholder="field.placeholder || `请输入${field.label}`"
                  :disabled="field.disabled || loading || mode === 'view'"
                  v-bind="resolveExtraProps(field)"
                >
                  <template v-if="field.type === 'select'">
                    <el-option
                      v-for="opt in field.options"
                      :key="String(opt.value)"
                      :label="opt.label"
                      :value="opt.value"
                    />
                  </template>
                  <template v-if="field.type === 'radio'">
                    <el-radio
                      v-for="opt in field.options"
                      :key="String(opt.value)"
                      :value="opt.value"
                    >
                      {{ opt.label }}
                    </el-radio>
                  </template>
                  <template v-if="field.type === 'treeSelect'">
                    <el-tree-select
                      v-model="formData[field.prop]"
                      :data="field.treeData"
                      :props="field.treeProps || { label: 'label', children: 'children' }"
                      node-key="id"
                      check-strictly
                      :placeholder="field.placeholder || `请选择${field.label}`"
                      :disabled="field.disabled || loading || mode === 'view'"
                    />
                  </template>
                </component>
              </slot>
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
    </div>

    <template #footer>
      <el-button
        v-if="mode === 'view'"
        @click="handleCancel"
      >
        关闭
      </el-button>
      <template v-else>
        <el-button @click="handleCancel">
          取消
        </el-button>
        <el-button
          type="primary"
          :loading="loading"
          @click="handleConfirm"
        >
          确认
        </el-button>
      </template>
    </template>
  </el-drawer>
</template>

<script lang="ts" setup>
import { ref, computed } from 'vue'
import type { FormInstance } from 'element-plus'
import type { FormDrawerProps, FormField, FormFieldType } from './types'

const props = withDefaults(defineProps<FormDrawerProps>(), {
  loading: false,
  width: '500px',
  mode: 'add'
})

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  submit: [data: Record<string, unknown>]
}>()

const formRef = ref<FormInstance>()

const componentMap: Record<FormFieldType, string> = {
  input: 'el-input',
  textarea: 'el-input',
  number: 'el-input-number',
  select: 'el-select',
  radio: 'el-radio-group',
  checkbox: 'el-checkbox-group',
  switch: 'el-switch',
  date: 'el-date-picker',
  password: 'el-input',
  treeSelect: 'el-tree-select',
  cascader: 'el-cascader'
}

const resolveComponent = (type: FormField['type']): string => componentMap[type] || 'el-input'

const resolveExtraProps = (field: FormField): Record<string, unknown> => {
  if (field.type === 'textarea') return { type: 'textarea', rows: 3 }
  if (field.type === 'password') return { type: 'password', showPassword: true }
  return {}
}

/** 声明式显隐：字段的 dependencies 全部 show 返回 true 时才可见 */
const visibleFields = computed(() => {
  return props.fields.filter((field) => {
    if (!field.dependencies || field.dependencies.length === 0) return true
    return field.dependencies.every((dep) =>
      dep.show(props.formData, { mode: props.mode })
    )
  })
})

const handleCancel = (): void => emit('update:modelValue', false)

const handleConfirm = async (): Promise<void> => {
  if (!formRef.value) return
  try {
    await formRef.value.validate()
    emit('submit', { ...props.formData })
  } catch {
    // 校验失败，element-plus 会显示错误
  }
}

defineExpose({
  /** 暴露 formRef 供调用方手动触发关联字段重校验 */
  validateField: (prop: string) => formRef.value?.validateField(prop)
})
</script>

<style lang="scss" scoped>
.form-drawer-body {
  min-height: 100%;
}
</style>
