import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { ElMessageBox, ElMessage } from 'element-plus'
import { useCrud } from '@/app/composables/useCrud'

// 修复 brief bug #1：vi.mock 必须在文件顶部，不能写在 it() 块内
// vitest 会把 vi.mock 提升到文件顶部，写在 it 块内不生效且会污染整个文件
vi.mock('element-plus', () => ({
  ElMessageBox: { confirm: vi.fn().mockResolvedValue('confirm') },
  ElMessage: { success: vi.fn(), warning: vi.fn() }
}))

interface TestItem {
  id: string
  name: string
}

describe('useCrud', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    // 每个测试重置 mock 状态，避免跨用例污染
    vi.mocked(ElMessageBox.confirm).mockResolvedValue('confirm')
    vi.mocked(ElMessage.success).mockClear()
    vi.mocked(ElMessage.warning).mockClear()
  })

  it('fetchList 加载数据并更新 pagination.total', async () => {
    const fetch = vi.fn().mockResolvedValue({
      records: [{ id: '1', name: 'a' }],
      total: 1,
      current: 1,
      size: 10
    })
    const { listData, loading, pagination, fetchList } = useCrud<TestItem>({
      fetch
    })

    expect(loading.value).toBe(false)
    const promise = fetchList()
    expect(loading.value).toBe(true)
    await promise

    expect(loading.value).toBe(false)
    expect(listData.value).toHaveLength(1)
    expect(listData.value[0].name).toBe('a')
    expect(pagination.total).toBe(1)
    expect(fetch).toHaveBeenCalledWith({
      page: 1,
      size: 10,
      keyword: undefined,
      role: undefined,
      status: undefined
    })
  })

  it('handleSearch 重置 page 到 1 后 fetchList', async () => {
    const fetch = vi
      .fn()
      .mockResolvedValue({ records: [], total: 0, current: 1, size: 10 })
    const { pagination, handleSearch } = useCrud<TestItem>({ fetch })

    pagination.page = 3
    await handleSearch()
    expect(pagination.page).toBe(1)
    expect(fetch).toHaveBeenCalled()
  })

  it('handleReset 清空 searchForm 并重置 page', async () => {
    const fetch = vi
      .fn()
      .mockResolvedValue({ records: [], total: 0, current: 1, size: 10 })
    const { searchForm, pagination, handleReset } = useCrud<TestItem>({
      fetch,
      defaultSearchForm: { keyword: '', role: '' }
    })

    searchForm.keyword = 'abc'
    pagination.page = 3
    await handleReset()

    expect(searchForm.keyword).toBe('')
    expect(pagination.page).toBe(1)
  })

  it('handleDelete 调 remove 并刷新列表', async () => {
    const fetch = vi
      .fn()
      .mockResolvedValue({ records: [], total: 0, current: 1, size: 10 })
    const remove = vi.fn().mockResolvedValue(undefined)
    // 修复 brief bug #2：删除 `vi.spyOn({ fetchList }, 'fetchList')` 死代码（spy 临时对象无意义）
    // 修复 brief bug #3：handleDelete 内部调用闭包 fetchList，spyOn 返回对象的方法无法捕获
    //   改为断言 fetch（fetchList 内部调用）被再次调用，直接体现"删除后刷新列表"语义
    const crud = useCrud<TestItem>({ fetch, remove })

    await crud.handleDelete('1')

    expect(remove).toHaveBeenCalledWith('1')
    expect(fetch).toHaveBeenCalledTimes(1)
  })

  it('handleBatchDelete 调 batchRemove with selectedRows ids', async () => {
    const fetch = vi
      .fn()
      .mockResolvedValue({ records: [], total: 0, current: 1, size: 10 })
    const batchRemove = vi.fn().mockResolvedValue(undefined)
    const { selectedRows, handleBatchDelete } = useCrud<TestItem>({
      fetch,
      batchRemove
    })

    selectedRows.value = [
      { id: '1', name: 'a' },
      { id: '2', name: 'b' }
    ]

    // 修复 brief bug #1：vi.mock 已提升到文件顶部，这里直接使用 mock 引用
    await handleBatchDelete()
    expect(batchRemove).toHaveBeenCalledWith(['1', '2'])
  })
})
