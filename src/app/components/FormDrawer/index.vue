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
            v-for="field in fields"
            :key="field.prop"
            :span="field.span || 24"
          >
            <el-form-item
              :label="field.label"
              :prop="field.prop"
            >
              <slot
                :name="`field-${field.prop}`"
                :field="field"
              >
                <component
                  :is="resolveComponent(field.type)"
                  v-model="formData[field.prop]"
                  :placeholder="field.placeholder || `请输入${field.label}`"
                  :disabled="field.disabled || loading"
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
                </component>
              </slot>
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
    </div>

    <template #footer>
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
  </el-drawer>
</template>

<script lang="ts" setup>
import { ref } from 'vue'
import type { FormInstance } from 'element-plus'
import type { FormDrawerProps, FormField, FormFieldType } from './types'

const props = withDefaults(defineProps<FormDrawerProps>(), {
  loading: false,
  width: '500px'
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
  date: 'el-date-picker'
}

const resolveComponent = (type: FormField['type']): string => componentMap[type] || 'el-input'

const resolveExtraProps = (field: FormField): Record<string, unknown> => {
  if (field.type === 'textarea') return { type: 'textarea', rows: 3 }
  return {}
}

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
</script>

<style lang="scss" scoped>
.form-drawer-body {
  // 让 v-loading 遮罩能正确覆盖表单区域
  min-height: 100%;
}
</style>
