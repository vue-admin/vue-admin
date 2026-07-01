import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import ElementPlus from 'element-plus'
import RoleSelector from '@/app/components/Selectors/RoleSelector.vue'
import UserSelector from '@/app/components/Selectors/UserSelector.vue'
import DeptSelector from '@/app/components/Selectors/DeptSelector.vue'

vi.mock('@/modules/system/role/api', () => ({
  fetchRoleList: vi.fn(async () => ({
    records: [
      { id: 'r1', name: '管理员', code: 'admin', status: 'active' },
      { id: 'r2', name: '游客', code: 'guest', status: 'inactive' }
    ]
  }))
}))

vi.mock('@/modules/system/user/api', () => ({
  fetchUserList: vi.fn(async (params: { keyword?: string }) => ({
    records: [
      {
        id: 'u1',
        username: 'admin',
        realName: '管理员',
        status: 'active'
      },
      {
        id: 'u2',
        username: 'guest',
        realName: '游客',
        status: 'active'
      }
    ].filter((u) =>
      params.keyword ? u.username.includes(params.keyword) : true
    )
  }))
}))

vi.mock('@/modules/system/dept/api', () => ({
  fetchDeptTree: vi.fn(async () => [
    {
      id: 'd1',
      name: '总办',
      status: 'active',
      children: [{ id: 'd2', name: '研发', status: 'active' }]
    }
  ])
}))

const global = { plugins: [ElementPlus] }

describe('RoleSelector', () => {
  beforeEach(() => vi.clearAllMocks())

  it('挂载后加载角色并渲染选项', async () => {
    const wrapper = mount(RoleSelector, { global })
    await flushPromises()
    // el-option 在 select 内部渲染
    const options = wrapper.findAllComponents({ name: 'ElOption' })
    expect(options.length).toBe(2)
  })

  it('inactive 角色选项禁用', async () => {
    const wrapper = mount(RoleSelector, { global })
    await flushPromises()
    const options = wrapper.findAllComponents({ name: 'ElOption' })
    const guest = options[1]
    expect((guest.props('disabled') as boolean)).toBe(true)
  })

  it('onlyActive=true 时仅加载 active 角色', async () => {
    const { fetchRoleList } = await import('@/modules/system/role/api')
    mount(RoleSelector, {
      props: { onlyActive: true },
      global
    })
    await flushPromises()
    expect(fetchRoleList).toHaveBeenCalledWith(
      expect.objectContaining({ status: 'active' })
    )
  })

  it('v-model 更新触发 update:modelValue', async () => {
    const wrapper = mount(RoleSelector, {
      props: { modelValue: undefined },
      global
    })
    await flushPromises()
    await wrapper.find('input').setValue('r1')
    // el-select 内部 input 仅作为触发器；通过 vm 直接 emit
    ;(wrapper.vm as unknown as { onChange: (v: string) => void }).onChange('r1')
    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual(['r1'])
  })
})

describe('UserSelector', () => {
  beforeEach(() => vi.clearAllMocks())

  it('挂载后默认加载用户列表', async () => {
    const { fetchUserList } = await import('@/modules/system/user/api')
    mount(UserSelector, { global })
    await flushPromises()
    expect(fetchUserList).toHaveBeenCalled()
    expect(fetchUserList.mock.calls[0][0]).toMatchObject({ keyword: '' })
  })

  it('onlyActive=true 时 status=active', async () => {
    const { fetchUserList } = await import('@/modules/system/user/api')
    mount(UserSelector, {
      props: { onlyActive: true },
      global
    })
    await flushPromises()
    expect(fetchUserList.mock.calls[0][0]).toMatchObject({ status: 'active' })
  })
})

describe('DeptSelector', () => {
  beforeEach(() => vi.clearAllMocks())

  it('挂载后加载部门树', async () => {
    const { fetchDeptTree } = await import('@/modules/system/dept/api')
    mount(DeptSelector, { global })
    await flushPromises()
    expect(fetchDeptTree).toHaveBeenCalled()
  })
})
