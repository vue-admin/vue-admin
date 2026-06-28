import { describe, it, expect } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import SearchTable from '@/app/components/SearchTable/index.vue'
import ElementPlus from 'element-plus'

const global = { plugins: [ElementPlus] }

describe('SearchTable', () => {
  it('渲染搜索/重置按钮', () => {
    const wrapper = mount(SearchTable, {
      props: { loading: false, data: [], columns: [], pagination: { page: 1, size: 10, total: 0 } },
      global
    })
    expect(wrapper.text()).toContain('搜索')
    expect(wrapper.text()).toContain('重置')
  })

  it('点击搜索按钮 emit search', async () => {
    const wrapper = mount(SearchTable, {
      props: { loading: false, data: [], columns: [], pagination: { page: 1, size: 10, total: 0 } },
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
})
