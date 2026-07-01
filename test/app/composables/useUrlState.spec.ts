import { describe, expect, it, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createRouter, createMemoryHistory } from 'vue-router'
import { defineComponent } from 'vue'
import { useUrlState } from '@/app/composables/useUrlState'

// 测试用组件：mount 时调用 useUrlState 并暴露 ref
function createTestComponent(key: string, defaultValue: string) {
  return defineComponent({
    setup() {
      const state = useUrlState(key, defaultValue)
      return { state }
    },
    template: '<div>{{ state }}</div>'
  })
}

async function makeRouter(initialPath: string = '/') {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [{ path: '/', component: { template: '<div/>' } }]
  })
  await router.push(initialPath)
  await router.isReady()
  return router
}

describe('app/composables/useUrlState', () => {
  beforeEach(() => {
    vi.useRealTimers()
  })

  it('从 URL query 读取初始值', async () => {
    const router = await makeRouter('/?keyword=hello')
    const wrapper = mount(createTestComponent('keyword', ''), {
      global: { plugins: [router] }
    })
    expect(wrapper.vm.state).toBe('hello')
  })

  it('query 为空时使用 defaultValue', async () => {
    const router = await makeRouter('/')
    const wrapper = mount(createTestComponent('missing', 'default'), {
      global: { plugins: [router] }
    })
    expect(wrapper.vm.state).toBe('default')
  })

  it('修改 ref 同步到 URL（默认 replace）', async () => {
    const router = await makeRouter('/')
    const wrapper = mount(createTestComponent('keyword', ''), {
      global: { plugins: [router] }
    })
    wrapper.vm.state = 'updated'
    await flushPromises()
    expect(router.currentRoute.value.query.keyword).toBe('updated')
  })

  it('ref 改为默认值时移除 URL 中的 key', async () => {
    const router = await makeRouter('/?keyword=hello')
    const wrapper = mount(createTestComponent('keyword', ''), {
      global: { plugins: [router] }
    })
    wrapper.vm.state = ''
    await flushPromises()
    expect(router.currentRoute.value.query.keyword).toBeUndefined()
  })

  it('外部 URL 变化时同步到 ref', async () => {
    const router = await makeRouter('/')
    const wrapper = mount(createTestComponent('keyword', ''), {
      global: { plugins: [router] }
    })
    await router.push({ query: { keyword: 'external' } })
    await flushPromises()
    expect(wrapper.vm.state).toBe('external')
  })
})
