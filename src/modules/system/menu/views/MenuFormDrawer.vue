<template>
  <FormDrawer
    v-model="visible"
    :title="drawerTitle"
    :mode="mode"
    :form-data="formData"
    :fields="fields"
    :rules="rules"
    :loading="submitting"
    width="600px"
    @submit="handleSubmit"
  />
</template>

<script lang="ts" setup>
import { ref, watch, reactive, computed } from 'vue'
import { FormDrawer } from '@/app/components'
import type { FormField, FormDrawerMode, TreeNodeData } from '@/app/components/FormDrawer/types'
import { ElMessage } from 'element-plus'
import {
  createMenu,
  updateMenu,
  type MenuInfo,
  type MenuCreateRequest,
} from '../api'
import { COMMON_STATUS_OPTIONS } from '@/app/constants/enums'

const props = defineProps<{
  modelValue: boolean
  mode: FormDrawerMode
  data: MenuInfo | null
  /** 父菜单预设（点击"新增子菜单"时传入） */
  parent: MenuInfo | null
  /** 完整菜单树，用于 treeSelect 选择父节点 */
  treeData: MenuInfo[]
}>()

const emit = defineEmits<{
  'update:modelValue': [v: boolean]
  success: []
}>()

const visible = ref(props.modelValue)
const submitting = ref(false)

watch(() => props.modelValue, (v) => {
  visible.value = v
  if (v) initForm()
})
watch(visible, (v) => emit('update:modelValue', v))

const formData = reactive<MenuCreateRequest>({
  parentId: null,
  name: '',
  path: '',
  component: '',
  icon: '',
  sort: 0,
  status: 'active',
})

const drawerTitle = computed(() => {
  if (props.mode === 'add') return props.parent ? `新增子菜单 - ${props.parent.name}` : '新增顶级菜单'
  if (props.mode === 'edit') return '编辑菜单'
  return '查看菜单'
})

// treeSelect 数据需要 {id, label, children} 结构
const treeSelectData = computed<TreeNodeData[]>(() => {
  const transform = (nodes: MenuInfo[]): TreeNodeData[] =>
    nodes.map((n) => ({
      id: n.id,
      label: n.name,
      children: n.children && n.children.length > 0 ? transform(n.children) : undefined,
    }))
  return transform(props.treeData)
})

const fields = computed<FormField[]>(() => [
  {
    prop: 'parentId',
    label: '父菜单',
    type: 'treeSelect',
    span: 24,
    treeData: treeSelectData.value,
    treeProps: { label: 'label', children: 'children' },
    placeholder: '不选则为顶级菜单',
    dependencies: [
      { trigger: 'mode', show: (_, ctx) => ctx.mode === 'add' && !props.parent }
    ],
  },
  { prop: 'name', label: '菜单名称', type: 'input', span: 12 },
  { prop: 'path', label: '路由路径', type: 'input', span: 12 },
  { prop: 'component', label: '组件路径', type: 'input', span: 12, placeholder: '如 dashboard/views/Home' },
  { prop: 'icon', label: '图标', type: 'input', span: 12, placeholder: 'Element Plus 图标名' },
  { prop: 'sort', label: '排序', type: 'number', span: 12, default: 0 },
  {
    prop: 'status',
    label: '状态',
    type: 'radio',
    span: 12,
    options: [...COMMON_STATUS_OPTIONS],
  },
])

const rules = {
  name: [{ required: true, message: '请输入菜单名称', trigger: 'blur' }],
  path: [{ required: true, message: '请输入路由路径', trigger: 'blur' }],
  status: [{ required: true, message: '请选择状态', trigger: 'change' }],
}

const initForm = () => {
  if ((props.mode === 'edit' || props.mode === 'view') && props.data) {
    Object.assign(formData, {
      parentId: props.data.parentId,
      name: props.data.name,
      path: props.data.path,
      component: props.data.component || '',
      icon: props.data.icon || '',
      sort: props.data.sort,
      status: props.data.status,
    })
  } else if (props.mode === 'add' && props.parent) {
    Object.assign(formData, {
      parentId: props.parent.id,
      name: '',
      path: '',
      component: '',
      icon: '',
      sort: 0,
      status: 'active',
    })
  } else {
    Object.assign(formData, {
      parentId: null,
      name: '',
      path: '',
      component: '',
      icon: '',
      sort: 0,
      status: 'active',
    })
  }
}

const handleSubmit = async (data: Record<string, unknown>) => {
  submitting.value = true
  try {
    const payload = { ...formData, ...data } as MenuCreateRequest
    if (props.mode === 'add') {
      await createMenu(payload)
      ElMessage.success('新增成功')
    } else {
      await updateMenu(props.data!.id, payload)
      ElMessage.success('更新成功')
    }
    emit('success')
    emit('update:modelValue', false)
  } finally {
    submitting.value = false
  }
}
</script>
