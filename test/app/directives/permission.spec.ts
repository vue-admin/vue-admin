import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'
import { defineComponent, type PropType } from 'vue'
import { vPermission, type BindingValue } from '@/app/directives/permission'
import { useUserStore } from '@/app/stores/user'
import type { UserProfile } from '@/lib/auth/types'

// 用模板组件包装指令——比 withDirectives/render 函数更可靠
const TestComponent = defineComponent({
  directives: { permission: vPermission },
  props: {
    perm: {
      type: [String, Array, Object] as unknown as PropType<BindingValue>,
      required: true
    }
  },
  // 嵌套一层包裹：避免 v-permission 直接挂组件根节点时
  // removeChild 在 jsdom + vue-test-utils 下对 find() 不可见
  template: `<div><div v-permission="perm" data-test="t">hi</div></div>`
})

describe('v-permission', () => {
  beforeEach(() => setActivePinia(createPinia()))

  // 强类型 seed：直接通过 Pinia setup store 写入
  function seed(roles: string[], perms: string[]): void {
    const u = useUserStore()
    const profile: UserProfile = {
      id: '1',
      username: 'x',
      roles,
      permissions: perms
    }
    u.profile = profile
    u.isLoaded = true
  }

  it('无权限：DOM 移除', () => {
    seed(['user'], [])
    const w = mount(TestComponent, { props: { perm: 'user:create' } })
    expect(w.find('[data-test="t"]').exists()).toBe(false)
  })

  it('有权限：保留 DOM', () => {
    seed(['user'], ['user:create'])
    const w = mount(TestComponent, { props: { perm: 'user:create' } })
    expect(w.find('[data-test="t"]').exists()).toBe(true)
  })

  it('super_admin 短路：保留 DOM', () => {
    seed(['super_admin'], [])
    const w = mount(TestComponent, { props: { perm: 'user:create' } })
    expect(w.find('[data-test="t"]').exists()).toBe(true)
  })

  it('数组语法：任一命中保留', () => {
    seed(['user'], ['user:read'])
    const w = mount(TestComponent, {
      props: { perm: ['user:read', 'user:write'] }
    })
    expect(w.find('[data-test="t"]').exists()).toBe(true)
  })

  it('对象语法 { all }: 全部命中保留', () => {
    seed(['user'], ['user:read', 'user:write'])
    const w = mount(TestComponent, {
      props: { perm: { all: ['user:read', 'user:write'] } }
    })
    expect(w.find('[data-test="t"]').exists()).toBe(true)
  })

  it('对象语法 { all }: 部分命中移除', () => {
    seed(['user'], ['user:read'])
    const w = mount(TestComponent, {
      props: { perm: { all: ['user:read', 'user:write'] } }
    })
    expect(w.find('[data-test="t"]').exists()).toBe(false)
  })

  it('对象语法 { any }: 任一命中保留', () => {
    seed(['user'], ['user:read'])
    const w = mount(TestComponent, {
      props: { perm: { any: ['user:read', 'user:write'] } }
    })
    expect(w.find('[data-test="t"]').exists()).toBe(true)
  })
})
