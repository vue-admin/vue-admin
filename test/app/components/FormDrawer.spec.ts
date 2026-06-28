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

  it('view 模式所有字段 disabled', async () => {
    const wrapper = mount(FormDrawer, {
      props: {
        modelValue: true,
        title: '查看',
        mode: 'view',
        formData: { name: 'a' },
        fields: [{ prop: 'name', label: '名称', type: 'input' as const }]
      },
      global
    })
    await flushPromises()
    const input = wrapper.find('input')
    expect(input.attributes('disabled')).toBeDefined()
  })

  it('view 模式 footer 仅显示关闭按钮', async () => {
    const wrapper = mount(FormDrawer, {
      props: {
        modelValue: true,
        title: '查看',
        mode: 'view',
        formData: {},
        fields: []
      },
      global
    })
    await flushPromises()
    const footerButtons = wrapper.findAll('.el-drawer__footer .el-button')
    const footerText = wrapper.find('.el-drawer__footer').text()
    expect(footerButtons.length).toBe(1)
    expect(footerText).toContain('关闭')
    expect(footerText).not.toContain('确认')
  })

  it('dependencies 联动隐藏字段', async () => {
    const wrapper = mount(FormDrawer, {
      props: {
        modelValue: true,
        title: '测试',
        mode: 'edit',
        formData: { showExtra: false, extra: '' },
        fields: [
          { prop: 'showExtra', label: '显示扩展', type: 'switch' as const },
          {
            prop: 'extra',
            label: '扩展字段',
            type: 'input' as const,
            dependencies: [
              {
                trigger: 'showExtra',
                show: (values) => values.showExtra === true
              }
            ]
          }
        ]
      },
      global
    })
    await flushPromises()
    // 初始 showExtra=false，extra 字段应不显示
    expect(wrapper.text()).not.toContain('扩展字段')
    // 切换 showExtra=true
    await wrapper.find('.el-switch').trigger('click')
    await flushPromises()
    expect(wrapper.text()).toContain('扩展字段')
  })

  it('field-level rules 透传到 el-form-item', async () => {
    const wrapper = mount(FormDrawer, {
      props: {
        modelValue: true,
        title: '测试',
        mode: 'add',
        formData: { name: '' },
        fields: [
          {
            prop: 'name',
            label: '名称',
            type: 'input' as const,
            rules: [{ required: true, message: '名称必填', trigger: 'blur' }]
          }
        ]
      },
      global
    })
    await flushPromises()
    // el-form-item 的 required 属性应反映 rules 中的 required
    const formItem = wrapper.find('.el-form-item')
    expect(formItem.classes()).toContain('is-required')
  })
})
