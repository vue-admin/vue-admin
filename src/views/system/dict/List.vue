<template>
  <!-- 搜索和工具栏区域 -->
  <el-card shadow="never" class="search-card">
    <div class="search-toolbar">
      <!-- 搜索区域 -->
      <div class="search-area">
        <el-input
          v-model="searchForm.keyword"
          placeholder="请输入字典分类、字典或字典项的名称、代码"
          clearable
          style="width: 300px"
          @keyup.enter="handleSearch"
        >
          <template #prefix>
            <el-icon><Search /></el-icon>
          </template>
        </el-input>
        <el-button type="primary" :icon="Search" @click="handleSearch">搜索</el-button>
        <el-button :icon="Refresh" @click="handleReset">重置</el-button>
      </div>

      <!-- 操作按钮栏 -->
      <div class="action-buttons">
        <el-dropdown @command="handleDropdownCommand">
          <el-button type="primary" :icon="Plus">
            新增<el-icon class="el-icon--right"><ArrowDown /></el-icon>
          </el-button>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item command="addCategory">新增分类</el-dropdown-item>
              <el-dropdown-item command="addDict" :disabled="!selectedNode || selectedNode.level !== 1">
                新增字典
              </el-dropdown-item>
              <el-dropdown-item command="addItem" :disabled="!selectedNode || selectedNode.level !== 2">
                新增字典项
              </el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
        <el-button
          type="primary"
          :icon="Edit"
          :disabled="!selectedNode"
          @click="handleEdit"
        >编辑</el-button>
        <el-button
          type="danger"
          :icon="Delete"
          :disabled="!selectedNode"
          @click="handleDelete"
        >删除</el-button>
        <el-button :icon="Download" @click="handleExport">导出</el-button>
        <el-button :icon="RefreshRight" @click="handleRefresh">刷新</el-button>
      </div>
    </div>
  </el-card>

  <!-- 字典树和详情区域 -->
  <el-card shadow="never" class="main-card">
    <el-row :gutter="20">
      <!-- 字典树 -->
      <el-col :span="6">
        <el-card shadow="never" class="tree-card">
          <template #header>
            <div class="card-header">
              <span>字典树</span>
            </div>
          </template>
          <el-tree
            ref="dictTreeRef"
            :data="dictTreeData"
            :props="treeProps"
            node-key="id"
            default-expand-all
            @node-click="handleNodeClick"
            @node-contextmenu="handleNodeContextMenu"
            class="dict-tree"
          >
            <template #default="{ node, data }">
              <div class="tree-node">
                <el-tag
                  v-if="data.level === 1"
                  type="primary"
                  size="small"
                  style="margin-right: 8px"
                >分类</el-tag>
                <el-tag
                  v-if="data.level === 2"
                  type="success"
                  size="small"
                  style="margin-right: 8px"
                >字典</el-tag>
                <el-tag
                  v-if="data.level === 3"
                  type="warning"
                  size="small"
                  style="margin-right: 8px"
                >字典项</el-tag>
                {{ node.label }}
              </div>
            </template>
          </el-tree>
        </el-card>
      </el-col>

      <!-- 详情和操作区域 -->
      <el-col :span="18">
        <el-card shadow="never" class="detail-card">
          <template #header>
            <div class="card-header">
              <span>{{ selectedNode ? getNodeTitle(selectedNode) : '请选择一个节点' }}</span>
              <el-button
                v-if="selectedNode"
                type="primary"
                size="small"
                :icon="Edit"
                @click="handleEdit"
              >编辑</el-button>
            </div>
          </template>

          <!-- 分类详情 -->
          <div v-if="selectedNode && selectedNode.level === 1" class="detail-content">
            <el-descriptions :column="2" border>
              <el-descriptions-item label="分类名称">{{ selectedNode.name }}</el-descriptions-item>
              <el-descriptions-item label="分类代码">{{ selectedNode.code }}</el-descriptions-item>
              <el-descriptions-item label="描述">{{ selectedNode.description }}</el-descriptions-item>
              <el-descriptions-item label="状态">
                <el-tag :type="selectedNode.status === 'active' ? 'success' : 'danger'">
                  {{ selectedNode.status === 'active' ? '启用' : '禁用' }}
                </el-tag>
              </el-descriptions-item>
              <el-descriptions-item label="创建时间">{{ formatDate(selectedNode.createTime) }}</el-descriptions-item>
              <el-descriptions-item label="更新时间">{{ formatDate(selectedNode.updateTime) }}</el-descriptions-item>
            </el-descriptions>
          </div>

          <!-- 字典详情 -->
          <div v-if="selectedNode && selectedNode.level === 2" class="detail-content">
            <el-descriptions :column="2" border>
              <el-descriptions-item label="字典名称">{{ selectedNode.name }}</el-descriptions-item>
              <el-descriptions-item label="字典代码">{{ selectedNode.code }}</el-descriptions-item>
              <el-descriptions-item label="所属分类">{{ getCategoryName(selectedNode.categoryId) }}</el-descriptions-item>
              <el-descriptions-item label="描述">{{ selectedNode.description }}</el-descriptions-item>
              <el-descriptions-item label="状态">
                <el-tag :type="selectedNode.status === 'active' ? 'success' : 'danger'">
                  {{ selectedNode.status === 'active' ? '启用' : '禁用' }}
                </el-tag>
              </el-descriptions-item>
              <el-descriptions-item label="创建时间">{{ formatDate(selectedNode.createTime) }}</el-descriptions-item>
              <el-descriptions-item label="更新时间">{{ formatDate(selectedNode.updateTime) }}</el-descriptions-item>
            </el-descriptions>
          </div>

          <!-- 字典项详情 -->
          <div v-if="selectedNode && selectedNode.level === 3" class="detail-content">
            <el-descriptions :column="2" border>
              <el-descriptions-item label="字典项名称">{{ selectedNode.name }}</el-descriptions-item>
              <el-descriptions-item label="字典项代码">{{ selectedNode.code }}</el-descriptions-item>
              <el-descriptions-item label="所属字典">{{ getDictName(selectedNode.dictId) }}</el-descriptions-item>
              <el-descriptions-item label="字典值">{{ selectedNode.value }}</el-descriptions-item>
              <el-descriptions-item label="排序">{{ selectedNode.sort }}</el-descriptions-item>
              <el-descriptions-item label="状态">
                <el-tag :type="selectedNode.status === 'active' ? 'success' : 'danger'">
                  {{ selectedNode.status === 'active' ? '启用' : '禁用' }}
                </el-tag>
              </el-descriptions-item>
              <el-descriptions-item label="创建时间">{{ formatDate(selectedNode.createTime) }}</el-descriptions-item>
              <el-descriptions-item label="更新时间">{{ formatDate(selectedNode.updateTime) }}</el-descriptions-item>
            </el-descriptions>
          </div>

          <!-- 无选择时的提示 -->
          <div v-if="!selectedNode" class="no-selection">
            <el-empty description="请在左侧选择一个节点查看详情" />
          </div>
        </el-card>
      </el-col>
    </el-row>
  </el-card>

  <!-- 右键菜单 -->
  <el-popover
    v-model:visible="contextMenuVisible"
    :width="150"
    trigger="manual"
    :position="contextMenuPosition"
  >
    <el-menu
      :default-active="contextMenuActive"
      class="context-menu"
      @select="handleContextMenuSelect"
    >
      <el-menu-item v-if="selectedNode && selectedNode.level < 3" index="add">
        <el-icon><Plus /></el-icon>
        新增子节点
      </el-menu-item>
      <el-menu-item index="edit">
        <el-icon><Edit /></el-icon>
        编辑
      </el-menu-item>
      <el-menu-item index="delete">
        <el-icon><Delete /></el-icon>
        删除
      </el-menu-item>
    </el-menu>
  </el-popover>
  <el-drawer
    v-model="drawerVisible"
    :title="drawerMode === 'add' ? '新增' + getNodeTypeTitle(selectedParentNode) : '编辑'"
    size="50%"
    :close-on-click-modal="false"
  >
    <el-form
      ref="dictFormRef"
      :model="dictForm"
      :rules="formRules"
      label-width="100px"
      class="dict-form"
    >
      <!-- 分类表单 -->
      <div v-if="drawerMode === 'add' && selectedParentNode && selectedParentNode.level === 0">
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="分类名称" prop="name">
              <el-input v-model="dictForm.name" placeholder="请输入分类名称" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="分类代码" prop="code">
              <el-input v-model="dictForm.code" placeholder="请输入分类代码" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="24">
            <el-form-item label="描述" prop="description">
              <el-input v-model="dictForm.description" placeholder="请输入描述" type="textarea" :rows="3" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="状态" prop="status">
              <el-select v-model="dictForm.status" placeholder="请选择状态">
                <el-option label="启用" value="active" />
                <el-option label="禁用" value="inactive" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
      </div>

      <!-- 字典表单 -->
      <div v-if="(drawerMode === 'add' && selectedParentNode && selectedParentNode.level === 1) || (drawerMode === 'edit' && selectedNode.level === 2)">
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="字典名称" prop="name">
              <el-input v-model="dictForm.name" placeholder="请输入字典名称" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="字典代码" prop="code">
              <el-input v-model="dictForm.code" placeholder="请输入字典代码" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="24">
            <el-form-item label="描述" prop="description">
              <el-input v-model="dictForm.description" placeholder="请输入描述" type="textarea" :rows="3" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="状态" prop="status">
              <el-select v-model="dictForm.status" placeholder="请选择状态">
                <el-option label="启用" value="active" />
                <el-option label="禁用" value="inactive" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
      </div>

      <!-- 字典项表单 -->
      <div v-if="(drawerMode === 'add' && selectedParentNode && selectedParentNode.level === 2) || (drawerMode === 'edit' && selectedNode.level === 3)">
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="字典项名称" prop="name">
              <el-input v-model="dictForm.name" placeholder="请输入字典项名称" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="字典项代码" prop="code">
              <el-input v-model="dictForm.code" placeholder="请输入字典项代码" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="字典值" prop="value">
              <el-input v-model="dictForm.value" placeholder="请输入字典值" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="排序" prop="sort">
              <el-input-number v-model="dictForm.sort" :min="0" :max="999" placeholder="请输入排序" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="状态" prop="status">
              <el-select v-model="dictForm.status" placeholder="请选择状态">
                <el-option label="启用" value="active" />
                <el-option label="禁用" value="inactive" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
      </div>

      <el-form-item>
        <el-button type="primary" @click="handleFormSubmit">{{ drawerMode === 'add' ? '创建' : '保存' }}</el-button>
        <el-button @click="drawerVisible = false">取消</el-button>
      </el-form-item>
    </el-form>
  </el-drawer>
</template>

<style scoped>
.search-card {
  margin-bottom: 16px;
}

.search-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
}

.search-area {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.action-buttons {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.search-area .el-input,
.search-area .el-select {
  flex-shrink: 0;
}

.main-card {
  margin-bottom: 16px;
}

.tree-card {
  height: 100%;
}

.tree-card >>> .el-card__body {
  height: calc(100% - 60px);
  overflow: hidden;
}

.dict-tree {
  height: 100%;
  overflow-y: auto;
}

.tree-node {
  display: flex;
  align-items: center;
}

.detail-card {
  height: 100%;
}

.detail-content {
  padding: 16px 0;
}

.no-selection {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 300px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: 600;
}

/* 右键菜单样式 */
.context-menu {
  min-width: 120px;
}

.context-menu :deep(.el-menu-item) {
  font-size: 14px;
  padding: 8px 16px;
}

.context-menu :deep(.el-menu-item:hover) {
  background-color: #f5f7fa;
}

/* 响应式布局 */
@media (max-width: 768px) {
  .search-toolbar {
    flex-direction: column;
    align-items: stretch;
  }

  .search-area {
    flex-direction: column;
    align-items: stretch;
  }

  .search-area .el-input,
  .search-area .el-select {
    width: 100% !important;
  }

  .action-buttons {
    justify-content: space-between;
  }
}
</style>

<script lang="ts" setup>
import { ref, reactive, onMounted, computed } from 'vue'
import {
  Search,
  Refresh,
  Plus,
  Delete,
  Download,
  RefreshRight,
  Edit,
  ArrowDown,
} from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox, ElTree } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'
import {
  fetchDictCategoryList,
  fetchDictList,
  fetchDictItemList,
  createDictCategory,
  createDict,
  createDictItem,
  updateDictCategory,
  updateDict,
  updateDictItem,
  deleteDictCategory,
  deleteDict,
  deleteDictItem,
  type DictCategoryInfo,
  type DictInfo,
  type DictItemInfo,
  type DictCategorySearchRequest,
  type DictSearchRequest,
  type DictItemSearchRequest,
  type DictCategoryCreateRequest,
  type DictCreateRequest,
  type DictItemCreateRequest,
} from '@/apis/dict'

// 右键菜单状态
const contextMenuVisible = ref(false)
const contextMenuPosition = ref({ top: 0, left: 0 })
const contextMenuActive = ref('')

// 搜索表单
const searchForm = reactive({
  keyword: '',
})

// 字典树数据
const dictTreeData = ref<any[]>([])

// 树组件引用
const dictTreeRef = ref<InstanceType<typeof ElTree>>()

// 选中的节点
const selectedNode = ref<any>(null)
const selectedParentNode = ref<any>(null)

// 抽屉状态
const drawerVisible = ref(false)
const drawerMode = ref<'add' | 'edit'>('add')

// 表单数据
const dictForm = reactive<any>({
  name: '',
  code: '',
  description: '',
  status: 'active',
  value: '',
  sort: 0,
})

// 表单验证规则
const formRules = reactive<FormRules>({
  name: [
    { required: true, message: '请输入名称', trigger: 'blur' },
    { min: 2, max: 20, message: '名称长度应在2-20个字符之间', trigger: 'blur' },
  ],
  code: [
    { required: true, message: '请输入代码', trigger: 'blur' },
    { min: 2, max: 20, message: '代码长度应在2-20个字符之间', trigger: 'blur' },
  ],
  description: [
    { max: 200, message: '描述长度不能超过200个字符', trigger: 'blur' },
  ],
  status: [
    { required: true, message: '请选择状态', trigger: 'change' },
  ],
  value: [
    { required: true, message: '请输入字典值', trigger: 'blur' },
    { min: 1, max: 50, message: '字典值长度应在1-50个字符之间', trigger: 'blur' },
  ],
  sort: [
    { required: true, message: '请输入排序', trigger: 'blur' },
  ],
})

// 表单引用
const dictFormRef = ref<FormInstance>()

// 树属性
const treeProps = {
  label: 'name',
  children: 'children',
}

// 加载字典树数据
const loadDictTreeData = async () => {
  try {
    // 获取字典分类
    const categoryRes = await fetchDictCategoryList({
      keyword: searchForm.keyword,
      status: '',
      page: 1,
      size: 1000,
    })
    const categories = categoryRes.data.records

    // 获取字典
    const dictRes = await fetchDictList({
      keyword: searchForm.keyword,
      categoryId: '',
      status: '',
      page: 1,
      size: 1000,
    })
    const dicts = dictRes.data.records

    // 获取字典项
    const itemRes = await fetchDictItemList({
      keyword: searchForm.keyword,
      dictId: '',
      status: '',
      page: 1,
      size: 1000,
    })
    const items = itemRes.data.records

    // 构建树形结构
    const treeData: any[] = []

    categories.forEach(category => {
      const categoryNode: any = {
        ...category,
        level: 1,
        children: [],
      }

      // 查找该分类下的字典
      const categoryDicts = dicts.filter(dict => dict.categoryId === category.id)
      categoryDicts.forEach(dict => {
        const dictNode: any = {
          ...dict,
          level: 2,
          children: [],
        }

        // 查找该字典下的字典项
        const dictItems = items.filter(item => item.dictId === dict.id).sort((a, b) => a.sort - b.sort)
        dictItems.forEach(item => {
          const itemNode: any = {
            ...item,
            level: 3,
          }
          dictNode.children.push(itemNode)
        })

        categoryNode.children.push(dictNode)
      })

      treeData.push(categoryNode)
    })

    dictTreeData.value = treeData
  } catch (error) {
    console.error(error)
    ElMessage.error('获取数据失败')
  }
}

onMounted(() => {
  loadDictTreeData()
})

// 搜索
const handleSearch = async () => {
  await loadDictTreeData()
}

// 重置搜索
const handleReset = () => {
  searchForm.keyword = ''
  loadDictTreeData()
}

// 刷新
const handleRefresh = () => {
  loadDictTreeData()
}

// 节点右键菜单事件
const handleNodeContextMenu = (event: Event, data: any) => {
  const mouseEvent = event as MouseEvent
  mouseEvent.preventDefault()
  selectedNode.value = data
  contextMenuPosition.value = {
    top: mouseEvent.clientY,
    left: mouseEvent.clientX,
  }
  contextMenuVisible.value = true
}

// 处理右键菜单选择
const handleContextMenuSelect = (index: string) => {
  contextMenuActive.value = index
  contextMenuVisible.value = false

  switch (index) {
    case 'add':
      handleAdd()
      break
    case 'edit':
      handleEdit()
      break
    case 'delete':
      handleDelete()
      break
  }
}

// 节点点击事件
const handleNodeClick = (data: any) => {
  selectedNode.value = data
}

// 获取节点类型标题
const getNodeTypeTitle = (node: any) => {
  if (!node) return '分类'
  if (node.level === 0) return '分类'
  if (node.level === 1) return '字典'
  if (node.level === 2) return '字典项'
  return ''
}

// 获取节点标题
const getNodeTitle = (node: any) => {
  if (!node) return ''
  if (node.level === 1) return '字典分类详情'
  if (node.level === 2) return '字典详情'
  if (node.level === 3) return '字典项详情'
  return ''
}

// 获取分类名称
const getCategoryName = (categoryId: string) => {
  const category = findNode(dictTreeData.value, categoryId, 1)
  return category ? category.name : '-'
}

// 获取字典名称
const getDictName = (dictId: string) => {
  const dict = findNode(dictTreeData.value, dictId, 2)
  return dict ? dict.name : '-'
}

// 查找节点
const findNode = (nodes: any[], id: string, level: number): any => {
  for (const node of nodes) {
    if (node.id === id && node.level === level) {
      return node
    }
    if (node.children) {
      const found = findNode(node.children, id, level)
      if (found) {
        return found
      }
    }
  }
  return null
}

// 格式化日期
const formatDate = (date: string) => {
  if (!date) return '-'
  return new Date(date).toLocaleString('zh-CN')
}

// 新增分类
const handleAddCategory = () => {
  drawerMode.value = 'add'
  selectedParentNode.value = { level: 0 }
  resetForm()
  drawerVisible.value = true
}

// 新增字典
const handleAddDict = () => {
  if (!selectedNode.value || selectedNode.value.level !== 1) {
    ElMessage.warning('请先选择一个字典分类')
    return
  }
  drawerMode.value = 'add'
  selectedParentNode.value = selectedNode.value
  resetForm()
  drawerVisible.value = true
}

// 新增字典项
const handleAddItem = () => {
  if (!selectedNode.value || selectedNode.value.level !== 2) {
    ElMessage.warning('请先选择一个字典')
    return
  }
  drawerMode.value = 'add'
  selectedParentNode.value = selectedNode.value
  resetForm()
  drawerVisible.value = true
}

// 新增（根据选中节点自动判断类型）
const handleAdd = () => {
  if (!selectedNode.value) {
    handleAddCategory()
  } else if (selectedNode.value.level === 1) {
    handleAddDict()
  } else if (selectedNode.value.level === 2) {
    handleAddItem()
  } else {
    ElMessage.warning('当前节点不能添加子节点')
  }
}

// 编辑
const handleEdit = () => {
  if (!selectedNode.value) {
    ElMessage.warning('请先选择一个节点')
    return
  }
  drawerMode.value = 'edit'
  selectedParentNode.value = selectedNode.value
  resetForm()
  Object.assign(dictForm, selectedNode.value)
  drawerVisible.value = true
}

// 处理下拉菜单命令
const handleDropdownCommand = (command: string) => {
  switch (command) {
    case 'addCategory':
      handleAddCategory()
      break
    case 'addDict':
      handleAddDict()
      break
    case 'addItem':
      handleAddItem()
      break
  }
}

// 重置表单
const resetForm = () => {
  dictForm.name = ''
  dictForm.code = ''
  dictForm.description = ''
  dictForm.status = 'active'
  dictForm.value = ''
  dictForm.sort = 0
  if (dictFormRef.value) {
    dictFormRef.value.clearValidate()
  }
}

// 表单提交
const handleFormSubmit = async () => {
  if (!dictFormRef.value) return

  try {
    await dictFormRef.value.validate()

    if (drawerMode.value === 'add') {
      if (selectedParentNode.value.level === 0) {
        // 新增分类
        await createDictCategory(dictForm)
        ElMessage.success('分类创建成功')
      } else if (selectedParentNode.value.level === 1) {
        // 新增字典
        await createDict({
          ...dictForm,
          categoryId: selectedParentNode.value.id,
        })
        ElMessage.success('字典创建成功')
      } else if (selectedParentNode.value.level === 2) {
        // 新增字典项
        await createDictItem({
          ...dictForm,
          dictId: selectedParentNode.value.id,
        })
        ElMessage.success('字典项创建成功')
      }
    } else {
      if (selectedNode.value.level === 1) {
        // 编辑分类
        await updateDictCategory(selectedNode.value.id, dictForm)
        ElMessage.success('分类更新成功')
      } else if (selectedNode.value.level === 2) {
        // 编辑字典
        await updateDict(selectedNode.value.id, dictForm)
        ElMessage.success('字典更新成功')
      } else if (selectedNode.value.level === 3) {
        // 编辑字典项
        await updateDictItem(selectedNode.value.id, dictForm)
        ElMessage.success('字典项更新成功')
      }
    }

    drawerVisible.value = false
    loadDictTreeData()
  } catch (error) {
    console.error(error)
  }
}

// 删除
const handleDelete = async () => {
  if (!selectedNode.value) return

  const nodeType = getNodeTypeTitle(selectedNode.value)
  try {
    await ElMessageBox.confirm(`确定要删除该${nodeType}吗？`, '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    })

    if (selectedNode.value.level === 1) {
      await deleteDictCategory(selectedNode.value.id)
    } else if (selectedNode.value.level === 2) {
      await deleteDict(selectedNode.value.id)
    } else if (selectedNode.value.level === 3) {
      await deleteDictItem(selectedNode.value.id)
    }

    ElMessage.success(`${nodeType}删除成功`)
    selectedNode.value = null
    loadDictTreeData()
  } catch {
    ElMessage.info('已取消删除')
  }
}

// 导出
const handleExport = () => {
  ElMessage.info('导出功能开发中...')
}
</script>
