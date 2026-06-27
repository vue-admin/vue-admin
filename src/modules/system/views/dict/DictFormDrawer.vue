<template>
  <el-drawer
    v-model="visible"
    :title="title"
    size="50%"
    :close-on-click-modal="false"
    @closed="handleClosed"
  >
    <el-form
      ref="formRef"
      :model="form"
      :rules="rules"
      label-width="100px"
      class="dict-form"
    >
      <!-- 分类表单 -->
      <template v-if="formType === 'category'">
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="分类名称" prop="name">
              <el-input v-model="form.name" placeholder="请输入分类名称" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="分类代码" prop="code">
              <el-input v-model="form.code" placeholder="请输入分类代码" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="24">
            <el-form-item label="描述" prop="description">
              <el-input
                v-model="form.description"
                placeholder="请输入描述"
                type="textarea"
                :rows="3"
              />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="状态" prop="status">
              <el-select v-model="form.status" placeholder="请选择状态">
                <el-option label="启用" value="active" />
                <el-option label="禁用" value="inactive" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
      </template>

      <!-- 字典表单 -->
      <template v-else-if="formType === 'dict'">
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="字典名称" prop="name">
              <el-input v-model="form.name" placeholder="请输入字典名称" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="字典代码" prop="code">
              <el-input v-model="form.code" placeholder="请输入字典代码" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="24">
            <el-form-item label="描述" prop="description">
              <el-input
                v-model="form.description"
                placeholder="请输入描述"
                type="textarea"
                :rows="3"
              />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="状态" prop="status">
              <el-select v-model="form.status" placeholder="请选择状态">
                <el-option label="启用" value="active" />
                <el-option label="禁用" value="inactive" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
      </template>

      <!-- 字典项表单 -->
      <template v-else>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="字典项名称" prop="name">
              <el-input v-model="form.name" placeholder="请输入字典项名称" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="字典项代码" prop="code">
              <el-input v-model="form.code" placeholder="请输入字典项代码" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="字典值" prop="value">
              <el-input v-model="form.value" placeholder="请输入字典值" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="排序" prop="sort">
              <el-input-number v-model="form.sort" :min="0" :max="999" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="状态" prop="status">
              <el-select v-model="form.status" placeholder="请选择状态">
                <el-option label="启用" value="active" />
                <el-option label="禁用" value="inactive" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
      </template>

      <el-form-item>
        <el-button type="primary" :loading="submitting" @click="handleSubmit">
          {{ mode === 'add' ? '创建' : '保存' }}
        </el-button>
        <el-button @click="visible = false">取消</el-button>
      </el-form-item>
    </el-form>
  </el-drawer>
</template>

<script lang="ts" setup>
import { ref, computed, watch } from 'vue'
import type { FormInstance, FormRules } from 'element-plus'
import type { DictFormState, DictTreeNode } from './hooks/useDictTree'

const props = defineProps<{
  modelValue: boolean
  mode: 'add' | 'edit'
  form: DictFormState
  /**
   * 新增模式下：父节点（level 0=虚拟根 / 1=分类 / 2=字典）
   * 编辑模式下：被编辑节点（level 1/2/3）
   */
  parentNode: DictTreeNode | { level: 0 } | null
  selectedNode: DictTreeNode | null
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'submit'): void
}>()

const formRef = ref<FormInstance>()
const submitting = ref(false)

const visible = computed({
  get: () => props.modelValue,
  set: (v) => emit('update:modelValue', v),
})

const formType = computed<'category' | 'dict' | 'item'>(() => {
  if (props.mode === 'add') {
    const lvl = props.parentNode?.level ?? 0
    if (lvl === 0) return 'category'
    if (lvl === 1) return 'dict'
    return 'item'
  }
  const lvl = props.selectedNode?.level ?? 1
  if (lvl === 1) return 'category'
  if (lvl === 2) return 'dict'
  return 'item'
})

const title = computed(() => {
  const action = props.mode === 'add' ? '新增' : '编辑'
  const typeMap = { category: '分类', dict: '字典', item: '字典项' }
  return `${action}${typeMap[formType.value]}`
})

const rules: FormRules = {
  name: [
    { required: true, message: '请输入名称', trigger: 'blur' },
    { min: 2, max: 20, message: '名称长度应在 2-20 个字符之间', trigger: 'blur' },
  ],
  code: [
    { required: true, message: '请输入代码', trigger: 'blur' },
    { min: 2, max: 20, message: '代码长度应在 2-20 个字符之间', trigger: 'blur' },
  ],
  description: [
    { max: 200, message: '描述长度不能超过 200 个字符', trigger: 'blur' },
  ],
  status: [{ required: true, message: '请选择状态', trigger: 'change' }],
  value: [
    { required: true, message: '请输入字典值', trigger: 'blur' },
    { min: 1, max: 50, message: '字典值长度应在 1-50 个字符之间', trigger: 'blur' },
  ],
  sort: [{ required: true, message: '请输入排序', trigger: 'blur' }],
}

// 切换为不同节点时，清理上一次的校验状态
watch(
  () => props.modelValue,
  (v) => {
    if (v) {
      formRef.value?.clearValidate()
    }
  }
)

const handleSubmit = async () => {
  if (!formRef.value) return
  try {
    await formRef.value.validate()
  } catch {
    return
  }
  submitting.value = true
  emit('submit')
  submitting.value = false
}

const handleClosed = () => {
  formRef.value?.clearValidate()
}
</script>

<style scoped>
.dict-form {
  padding: 0 20px;
}
</style>
