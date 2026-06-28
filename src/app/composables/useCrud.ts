import { ref, reactive, type Ref } from 'vue'
import { ElMessageBox, ElMessage } from 'element-plus'

export interface UseCrudOptions<T> {
  fetch: (params: Record<string, unknown>) => Promise<{ records: T[]; total: number; current: number; size: number }>
  remove?: (id: string) => Promise<unknown>
  batchRemove?: (ids: string[]) => Promise<unknown>
  defaultSearchForm?: Record<string, unknown>
  pageSize?: number
}

export function useCrud<T extends { id: string }>(options: UseCrudOptions<T>) {
  const { fetch, remove, batchRemove, defaultSearchForm = {}, pageSize = 10 } = options

  const listData = ref<T[]>([]) as Ref<T[]>
  const loading = ref(false)
  const pagination = reactive({
    page: 1,
    size: pageSize,
    total: 0
  })
  // 默认 searchForm 包含 keyword/role/status 三个字段，使 fetchList 调用参数结构稳定
  // defaultSearchForm 可覆盖或扩展这些字段
  const searchForm = reactive<Record<string, unknown>>({
    keyword: undefined,
    role: undefined,
    status: undefined,
    ...defaultSearchForm
  })
  const selectedRows = ref<T[]>([]) as Ref<T[]>

  const fetchList = async () => {
    loading.value = true
    try {
      const params = { page: pagination.page, size: pagination.size, ...searchForm }
      const res = await fetch(params)
      listData.value = res.records
      pagination.total = res.total
    } catch {
      // 错误由 http 拦截器提示，这里不重复处理
    } finally {
      loading.value = false
    }
  }

  const handleSearch = () => {
    pagination.page = 1
    return fetchList()
  }

  const handleReset = () => {
    Object.keys(searchForm).forEach((key) => {
      searchForm[key] = defaultSearchForm[key] ?? ''
    })
    pagination.page = 1
    return fetchList()
  }

  const handlePageChange = (page: number, size: number) => {
    pagination.page = page
    pagination.size = size
    return fetchList()
  }

  const handleSelectionChange = (rows: T[]) => {
    selectedRows.value = rows
  }

  const handleDelete = async (id: string) => {
    if (!remove) throw new Error('useCrud: remove not provided')
    try {
      await ElMessageBox.confirm('确认删除该记录？', '提示', {
        confirmButtonText: '确认',
        cancelButtonText: '取消',
        type: 'warning'
      })
    } catch {
      return // 用户取消
    }
    await remove(id)
    ElMessage.success('删除成功')
    await fetchList()
  }

  const handleBatchDelete = async () => {
    if (!batchRemove) throw new Error('useCrud: batchRemove not provided')
    if (selectedRows.value.length === 0) {
      ElMessage.warning('请先选择记录')
      return
    }
    try {
      await ElMessageBox.confirm(
        `确认删除选中的 ${selectedRows.value.length} 条记录？`,
        '提示',
        { confirmButtonText: '确认', cancelButtonText: '取消', type: 'warning' }
      )
    } catch {
      return
    }
    const ids = selectedRows.value.map((r) => r.id)
    await batchRemove(ids)
    ElMessage.success('批量删除成功')
    selectedRows.value = []
    await fetchList()
  }

  return {
    listData,
    loading,
    pagination,
    searchForm,
    selectedRows,
    fetchList,
    handleSearch,
    handleReset,
    handlePageChange,
    handleSelectionChange,
    handleDelete,
    handleBatchDelete
  }
}
