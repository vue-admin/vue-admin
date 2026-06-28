import { describe, it, expect } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import FormDrawer from '@/app/components/FormDrawer/index.vue'
import ElementPlus from 'element-plus'

const global = { plugins: [ElementPlus] }

describe('FormDrawer', () => {
  it('关闭时不渲染表单', async () => {
    const wrapper = mount(FormDrawer, {
      props: {
        modelValue: false, title: '测试',
        formData: {}, fields: []
      },
      global
    })
    await flushPromises()
    // el-drawer 关闭时容器存在但 body 被销毁（v-if）
    expect(wrapper.find('.el-drawer').exists()).toBe(true)
    expect(wrapper.find('.el-drawer__body').exists()).toBe(false)
    expect(wrapper.find('form').exists()).toBe(false)
  })

  it('渲染 fields 定义的字段', async () => {
    const wrapper = mount(FormDrawer, {
      props: {
        modelValue: true, title: '测试',
        formData: { name: '' },
        fields: [
          { prop: 'name', label: '名称', type: 'input' as const }
        ]
      },
      global
    })
    // el-drawer 内部有异步渲染，需 flush 后表单字段才出现
    await flushPromises()
    expect(wrapper.text()).toContain('名称')
  })

  it('点取消 emit update:modelValue false', async () => {
    const wrapper = mount(FormDrawer, {
      props: {
        modelValue: true, title: '测试',
        formData: {}, fields: []
      },
      global
    })
    // 通过组件名定位 ElButton，规避原生 button 渲染差异
    const buttons = wrapper.findAllComponents({ name: 'ElButton' })
    const cancelBtn = buttons.find((b) => b.text().includes('取消'))
    await cancelBtn?.trigger('click')
    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([false])
  })
})
