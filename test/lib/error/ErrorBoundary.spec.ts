/* eslint-disable vue/one-component-per-file */
import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { h, defineComponent, nextTick } from 'vue'
import ErrorBoundary from '@/lib/error/ErrorBoundary.vue'
import type { Monitor } from '@/lib/error/types'

const createMonitor = (): Monitor => ({
  captureException: vi.fn(),
  captureMessage: vi.fn(),
  setUser: vi.fn(),
})

const BoomChild = defineComponent({
  setup() {
    throw new Error('child boom')
  },
  render: () => h('div'),
})


describe('ErrorBoundary', () => {
  it('正常子树正常渲染', () => {
    const wrapper = mount(ErrorBoundary, {
      global: { provide: { monitor: createMonitor() } },
      slots: { default: () => h('div', { class: 'ok' }, 'hi') },
    })
    expect(wrapper.html()).toContain('hi')
  })

  it('子组件抛错时显示错误兜底', async () => {
    const wrapper = mount(ErrorBoundary, {
      global: { provide: { monitor: createMonitor() } },
      slots: { default: () => h(BoomChild) },
    })
    await nextTick()
    expect(wrapper.text()).toContain('页面出错了')
    expect(wrapper.text()).toContain('child boom')
  })

  it('自定义 title 和 message', async () => {
    const wrapper = mount(ErrorBoundary, {
      global: { provide: { monitor: createMonitor() } },
      props: { title: '自定义标题', message: '自定义提示' },
      slots: { default: () => h(BoomChild) },
    })
    await nextTick()
    expect(wrapper.text()).toContain('自定义标题')
    expect(wrapper.text()).toContain('自定义提示')
  })

  it('错误捕获时上报 monitor', async () => {
    const monitor = createMonitor()
    mount(ErrorBoundary, {
      global: { provide: { monitor } },
      slots: { default: () => h(BoomChild) },
    })
    await nextTick()
    expect(monitor.captureException).toHaveBeenCalledTimes(1)
    expect(monitor.captureException).toHaveBeenCalledWith(expect.objectContaining({ message: 'child boom' }))
  })

  it('点击重试后恢复渲染', async () => {
    const monitor = createMonitor()
    const ToggleChild = defineComponent({
      props: { fail: Boolean },
      render() {
        if (this.fail) throw new Error('child boom')
        return h('div', { class: 'ok' }, 'recovered')
      },
    })

    const Parent = defineComponent({
      data() {
        return { fail: true }
      },
      render() {
        return h(
          ErrorBoundary,
          {},
          { default: () => h(ToggleChild, { fail: this.fail }) }
        )
      },
    })

    const wrapper = mount(Parent, {
      global: { provide: { monitor } },
    })
    await nextTick()
    expect(wrapper.text()).toContain('页面出错了')

    // 修复子组件后点击重试
    wrapper.vm.fail = false
    await wrapper.find('button').trigger('click')
    await nextTick()
    expect(wrapper.text()).toContain('recovered')
  })

  it('maxRetries 后禁用重试并保留兜底', async () => {
    const monitor = createMonitor()
    const wrapper = mount(ErrorBoundary, {
      global: { provide: { monitor } },
      props: { maxRetries: 2 },
      slots: { default: () => h(BoomChild) },
    })
    await nextTick()
    expect(wrapper.text()).toContain('页面出错了')

    const button = wrapper.find('button')
    expect(button.attributes('disabled')).toBeUndefined()

    // 连续重试，直到超过 maxRetries
    await button.trigger('click')
    await nextTick()
    await wrapper.find('button').trigger('click')
    await nextTick()
    await wrapper.find('button').trigger('click')
    await nextTick()

    expect(wrapper.text()).toContain('页面出错了')
    expect(wrapper.text()).toContain('错误反复发生，请刷新页面或联系管理员')
    expect(wrapper.find('button').attributes('disabled')).toBeDefined()
  })
})
