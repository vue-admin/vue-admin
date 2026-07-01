import { describe, it, expect, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import SearchTable from '@/app/components/SearchTable/index.vue'
import ElementPlus from 'element-plus'

const global = { plugins: [ElementPlus] }

// 搜索/重置按钮仅在提供 #search slot 时渲染（模板 v-if="$slots.search"）
const searchSlot = { search: '<span class="kw" />' }

describe('SearchTable', () => {
  it('渲染搜索/重置按钮', () => {
    const wrapper = mount(SearchTable, {
      props: {
        loading: false,
        data: [],
        columns: [],
        pagination: { page: 1, size: 10, total: 0 }
      },
      slots: searchSlot,
      global
    })
    expect(wrapper.text()).toContain('搜索')
    expect(wrapper.text()).toContain('重置')
  })

  it('点击搜索按钮 emit search', async () => {
    const wrapper = mount(SearchTable, {
      props: {
        loading: false,
        data: [],
        columns: [],
        pagination: { page: 1, size: 10, total: 0 }
      },
      slots: searchSlot,
      global
    })
    await wrapper.find('button.el-button--primary').trigger('click')
    expect(wrapper.emitted('search')).toBeTruthy()
  })

  it('columns 渲染 el-table-column', async () => {
    const wrapper = mount(SearchTable, {
      props: {
        loading: false,
        data: [{ id: '1', name: 'a' }],
        columns: [
          { prop: 'name', label: '名称' },
          { prop: 'actions', label: '操作', slot: 'actions' }
        ],
        pagination: { page: 1, size: 10, total: 1 }
      },
      slots: {
        'col-actions': '<button class="edit-btn">编辑</button>'
      },
      global
    })
    // EP 2.11 el-table 通过微任务异步注册 columns，需 flush 后 header/cell 才渲染
    await flushPromises()
    expect(wrapper.text()).toContain('名称')
    expect(wrapper.find('.edit-btn').exists()).toBe(true)
  })

  describe('列设置', () => {
    beforeEach(() => {
      localStorage.clear()
    })

    // 通过表头断言列显隐（el-popover 内容懒渲染，不便在 jsdom 中直接断言其内部 DOM）
    const headersOf = (wrapper: ReturnType<typeof mount>) =>
      wrapper.findAll('.el-table__header .cell').map((c) => c.text())

    it('hideable=false 的列始终显示', async () => {
      const wrapper = mount(SearchTable, {
        props: {
          loading: false,
          data: [{ id: '1', name: 'a', desc: 'x' }],
          columns: [
            { prop: 'name', label: '名称', hideable: false },
            { prop: 'desc', label: '描述', defaultHidden: true }
          ],
          pagination: { page: 1, size: 10, total: 1 }
        },
        global
      })
      await flushPromises()
      const headers = headersOf(wrapper)
      // 强制显示列始终在表头
      expect(headers.some((h) => h.includes('名称'))).toBe(true)
      // defaultHidden 列默认不在表头
      expect(headers.some((h) => h.includes('描述'))).toBe(false)
    })

    it('defaultHidden=true 的列默认隐藏', async () => {
      const wrapper = mount(SearchTable, {
        props: {
          loading: false,
          data: [{ id: '1', name: 'a', desc: 'x' }],
          columns: [
            { prop: 'name', label: '名称' },
            { prop: 'desc', label: '描述', defaultHidden: true }
          ],
          pagination: { page: 1, size: 10, total: 1 }
        },
        global
      })
      await flushPromises()
      const headers = headersOf(wrapper)
      expect(headers.some((h) => h.includes('描述'))).toBe(false)
      expect(headers.some((h) => h.includes('名称'))).toBe(true)
    })

    it('columnSettingsKey 读取 localStorage 记忆的列显隐', async () => {
      // 预置：仅显示 name，隐藏 desc
      localStorage.setItem(
        'search-table:cols:test-list',
        JSON.stringify(['name'])
      )
      const wrapper = mount(SearchTable, {
        props: {
          loading: false,
          data: [{ id: '1', name: 'a', desc: 'x' }],
          columns: [
            { prop: 'name', label: '名称' },
            { prop: 'desc', label: '描述' }
          ],
          pagination: { page: 1, size: 10, total: 1 },
          columnSettingsKey: 'test-list'
        },
        global
      })
      await flushPromises()
      const headers = headersOf(wrapper)
      expect(headers.some((h) => h.includes('名称'))).toBe(true)
      expect(headers.some((h) => h.includes('描述'))).toBe(false)
    })

    it('columnSettingsKey 过滤掉已删除的无效 prop', async () => {
      // localStorage 含一个已不存在的列 prop，挂载后应被忽略、不报错
      localStorage.setItem(
        'search-table:cols:test-list',
        JSON.stringify(['name', 'ghost'])
      )
      const wrapper = mount(SearchTable, {
        props: {
          loading: false,
          data: [{ id: '1', name: 'a' }],
          columns: [{ prop: 'name', label: '名称' }],
          pagination: { page: 1, size: 10, total: 1 },
          columnSettingsKey: 'test-list'
        },
        global
      })
      await flushPromises()
      // name 仍正常显示（ghost 被忽略）
      expect(headersOf(wrapper).some((h) => h.includes('名称'))).toBe(true)
    })

    it('showColumnSettings=false 时不显示列设置按钮', () => {
      const wrapper = mount(SearchTable, {
        props: {
          loading: false,
          data: [],
          columns: [{ prop: 'name', label: '名称' }],
          pagination: { page: 1, size: 10, total: 0 },
          showColumnSettings: false
        },
        global
      })
      expect(wrapper.text()).not.toContain('列设置')
    })
  })
})
