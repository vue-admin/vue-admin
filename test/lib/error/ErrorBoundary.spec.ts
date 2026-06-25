import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { h, defineComponent, nextTick } from 'vue'
import ErrorBoundary from '@/lib/error/ErrorBoundary.vue'
import type { Monitor } from '@/lib/error/types'

const stubMonitor: Monitor = {
  captureException: () => {},
  captureMessage: () => {},
  setUser: () => {},
}

const BoomChild = defineComponent({
  setup() {
    throw new Error('child boom')
  },
  render: () => h('div'),
})

describe('ErrorBoundary', () => {
  it('正常子树正常渲染', () => {
    const wrapper = mount(ErrorBoundary, {
      global: { provide: { monitor: stubMonitor } },
      slots: { default: () => h('div', { class: 'ok' }, 'hi') },
    })
    expect(wrapper.html()).toContain('hi')
  })

  it('子组件抛错时显示错误兜底', async () => {
    const wrapper = mount(ErrorBoundary, {
      global: { provide: { monitor: stubMonitor } },
      slots: { default: () => h(BoomChild) },
    })
    // onErrorCaptured 在 slot 渲染时同步触发，但响应式重渲染需等一拍
    await nextTick()
    expect(wrapper.text()).toContain('页面出错了')
    expect(wrapper.text()).toContain('child boom')
  })
})
