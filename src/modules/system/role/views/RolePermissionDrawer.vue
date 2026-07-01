<template>
  <el-drawer
    :model-value="modelValue"
    title="权限配置"
    size="50%"
    :close-on-click-modal="false"
    @update:model-value="$emit('update:modelValue', $event)"
  >
    <div
      v-loading="loading"
      class="permission-config"
    >
      <el-tree
        ref="treeRef"
        :data="treeData"
        :props="{ label: 'name', children: 'children' }"
        :default-checked-keys="checkedKeys"
        show-checkbox
        node-key="id"
        check-strictly
        class="permission-tree"
      />
    </div>
    <template #footer>
      <el-button @click="$emit('update:modelValue', false)">
        取消
      </el-button>
      <el-button
        type="primary"
        :loading="saving"
        @click="handleSave"
      >
        保存
      </el-button>
    </template>
  </el-drawer>
</template>

<script lang="ts" setup>
import { ref, watch, onMounted } from 'vue'
import type { ElTree } from 'element-plus'
import { ElMessage } from 'element-plus'
import {
  fetchRolePermissions,
  setRolePermissions,
} from '../../role/api'
import {
  fetchAllPermissions,
  type PermissionInfo,
} from '../../permission/api'

interface PermissionTreeNode {
  id: string
  name: string
  children?: PermissionTreeNode[]
}

const MODULE_LABELS: Record<string, string> = {
  system: '系统管理',
  user: '用户管理',
  role: '角色管理',
  permission: '权限管理',
  dict: '字典管理',
  config: '系统配置',
}

const props = defineProps<{
  modelValue: boolean
  roleId: string | null
}>()

const emit = defineEmits<{
  'update:modelValue': [v: boolean]
}>()

const loading = ref(false)
const saving = ref(false)
const treeRef = ref<InstanceType<typeof ElTree>>()
const treeData = ref<PermissionTreeNode[]>([])
const checkedKeys = ref<string[]>([])

const buildTree = (permissions: PermissionInfo[]): PermissionTreeNode[] => {
  const moduleMap = new Map<string, PermissionInfo[]>()
  permissions.forEach((p) => {
    if (!moduleMap.has(p.module)) moduleMap.set(p.module, [])
    moduleMap.get(p.module)!.push(p)
  })
  const tree: PermissionTreeNode[] = []
  for (const [module, items] of moduleMap.entries()) {
    tree.push({
      id: module,
      name: MODULE_LABELS[module] || module,
      children: items.map((p) => ({ id: p.id, name: p.name })),
    })
  }
  return tree
}

const loadData = async () => {
  if (!props.roleId) return
  loading.value = true
  try {
    const [allPermissions, rolePermissions] = await Promise.all([
      fetchAllPermissions(),
      fetchRolePermissions(props.roleId),
    ])
    treeData.value = buildTree(allPermissions)
    checkedKeys.value = rolePermissions
  } catch {
    ElMessage.error('加载权限数据失败')
  } finally {
    loading.value = false
  }
}

watch(() => props.modelValue, (v) => {
  if (v) loadData()
})

onMounted(() => {
  if (props.modelValue) loadData()
})

const handleSave = async () => {
  if (!props.roleId || !treeRef.value) return
  saving.value = true
  try {
    const keys = treeRef.value.getCheckedKeys() as string[]
    // 过滤掉模块节点（id 是 module 名）
    const permissionIds = keys.filter((k) => !Object.prototype.hasOwnProperty.call(MODULE_LABELS, k))
    await setRolePermissions(props.roleId, permissionIds)
    ElMessage.success('权限保存成功')
    emit('update:modelValue', false)
  } catch {
    ElMessage.error('权限保存失败')
  } finally {
    saving.value = false
  }
}
</script>

<style lang="scss" scoped>
.permission-config {
  min-height: 100%;
}
</style>
