import { ref, reactive } from 'vue'
import { ElMessage } from 'element-plus'
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
} from '../../../dict/api'

export type DictTreeNodeLevel = 1 | 2 | 3

export interface DictTreeNode {
  id: string
  name: string
  code: string
  description?: string
  status: 'active' | 'inactive'
  createTime?: string
  updateTime?: string
  level: DictTreeNodeLevel
  categoryId?: string
  dictId?: string
  value?: string
  sort?: number
  children?: DictTreeNode[]
}

export interface DictFormState {
  name: string
  code: string
  description: string
  status: 'active' | 'inactive'
  value: string
  sort: number
}

const EMPTY_FORM: DictFormState = {
  name: '',
  code: '',
  description: '',
  status: 'active',
  value: '',
  sort: 0,
}

export function useDictTree() {
  const keyword = ref('')
  const treeData = ref<DictTreeNode[]>([])
  const loading = ref(false)
  const selectedNode = ref<DictTreeNode | null>(null)
  const selectedParentNode = ref<DictTreeNode | null>(null)
  const drawerVisible = ref(false)
  const drawerMode = ref<'add' | 'edit'>('add')
  const form = reactive<DictFormState>({ ...EMPTY_FORM })

  const buildTree = (
    categories: DictCategoryInfo[],
    dicts: DictInfo[],
    items: DictItemInfo[]
  ): DictTreeNode[] => {
    return categories.map((category) => {
      const categoryNode: DictTreeNode = {
        ...category,
        level: 1,
        children: [],
      }
      const categoryDicts = dicts.filter((d) => d.categoryId === category.id)
      categoryNode.children = categoryDicts.map((dict) => {
        const dictNode: DictTreeNode = {
          ...dict,
          level: 2,
          children: [],
        }
        const dictItems = items
          .filter((i) => i.dictId === dict.id)
          .sort((a, b) => a.sort - b.sort)
        dictNode.children = dictItems.map((item) => ({
          ...item,
          level: 3,
        }))
        return dictNode
      })
      return categoryNode
    })
  }

  const load = async () => {
    loading.value = true
    try {
      const [categoryRes, dictRes, itemRes] = await Promise.all([
        fetchDictCategoryList({
          keyword: keyword.value,
          status: '',
          page: 1,
          size: 1000,
        }),
        fetchDictList({
          keyword: keyword.value,
          categoryId: '',
          status: '',
          page: 1,
          size: 1000,
        }),
        fetchDictItemList({
          keyword: keyword.value,
          dictId: '',
          status: '',
          page: 1,
          size: 1000,
        }),
      ])
      treeData.value = buildTree(
        categoryRes.records,
        dictRes.records,
        itemRes.records
      )
    } catch (e) {
      console.error(e)
      ElMessage.error('获取数据失败')
    } finally {
      loading.value = false
    }
  }

  const resetForm = () => {
    Object.assign(form, EMPTY_FORM)
  }

  const startAdd = (parent: DictTreeNode | { level: 0 } | null) => {
    drawerMode.value = 'add'
    selectedParentNode.value = parent as DictTreeNode
    resetForm()
    drawerVisible.value = true
  }

  const isVirtualRoot = (n: DictTreeNode | { level: 0 } | null): boolean =>
    !!n && (n as { level?: number }).level === 0

  const startEdit = (node: DictTreeNode) => {
    drawerMode.value = 'edit'
    selectedParentNode.value = node
    selectedNode.value = node
    resetForm()
    Object.assign(form, {
      name: node.name,
      code: node.code,
      description: node.description || '',
      status: node.status,
      value: node.value || '',
      sort: node.sort ?? 0,
    })
    drawerVisible.value = true
  }

  const submit = async (): Promise<boolean> => {
    try {
      if (drawerMode.value === 'add') {
        const parent = selectedParentNode.value
        if (!parent || isVirtualRoot(parent)) {
          await createDictCategory(form)
          ElMessage.success('分类创建成功')
        } else if (parent.level === 1) {
          await createDict({ ...form, categoryId: parent.id })
          ElMessage.success('字典创建成功')
        } else if (parent.level === 2) {
          await createDictItem({ ...form, dictId: parent.id })
          ElMessage.success('字典项创建成功')
        }
      } else {
        const node = selectedNode.value!
        if (node.level === 1) {
          await updateDictCategory(node.id, form)
          ElMessage.success('分类更新成功')
        } else if (node.level === 2) {
          await updateDict(node.id, form)
          ElMessage.success('字典更新成功')
        } else if (node.level === 3) {
          await updateDictItem(node.id, form)
          ElMessage.success('字典项更新成功')
        }
      }
      drawerVisible.value = false
      await load()
      return true
    } catch (e) {
      console.error(e)
      return false
    }
  }

  const remove = async (node: DictTreeNode): Promise<boolean> => {
    try {
      if (node.level === 1) {
        await deleteDictCategory(node.id)
      } else if (node.level === 2) {
        await deleteDict(node.id)
      } else if (node.level === 3) {
        await deleteDictItem(node.id)
      }
      ElMessage.success('删除成功')
      if (selectedNode.value?.id === node.id) {
        selectedNode.value = null
      }
      await load()
      return true
    } catch {
      ElMessage.info('已取消删除')
      return false
    }
  }

  const findNode = (
    nodes: DictTreeNode[],
    id: string,
    level: DictTreeNodeLevel
  ): DictTreeNode | null => {
    for (const node of nodes) {
      if (node.id === id && node.level === level) return node
      if (node.children) {
        const found = findNode(node.children, id, level)
        if (found) return found
      }
    }
    return null
  }

  return {
    keyword,
    treeData,
    loading,
    selectedNode,
    selectedParentNode,
    drawerVisible,
    drawerMode,
    form,
    load,
    startAdd,
    startEdit,
    submit,
    remove,
    resetForm,
    findNode,
  }
}
