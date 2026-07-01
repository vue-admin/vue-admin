import { describe, it, expect, beforeAll } from 'vitest'
// 验证菜单重构（3 级嵌套：系统管理 → 访问控制/系统配置/日志管理 → 叶子）
// 通过 MSW server 的真实请求获取菜单树，避免依赖已删除的 src/mock/apis/menu.ts
import { api, http } from '@/lib/http/client'
import httpAdapter from 'axios/unsafe/adapters/http.js'

// jsdom 下 axios 默认走 XHR adapter，MSW node 无法拦截；
// 强制使用 Node http adapter，使测试中的真实 HTTP 请求能被 MSW server 处理
beforeAll(() => {
  http.defaults.adapter = httpAdapter as never
})

interface MenuTreeNode {
  id: string
  parentId: string | null
  name: string
  path: string
  component?: string
  icon?: string
  children?: MenuTreeNode[]
}

// 复刻 menu-manage.ts 的扁平化逻辑，用于断言层级关系
function flatten(list: MenuTreeNode[]): MenuTreeNode[] {
  const records: MenuTreeNode[] = []
  const walk = (nodes: MenuTreeNode[], parentId: string | null) => {
    nodes.forEach((node) => {
      const rec: MenuTreeNode = { ...node, parentId }
      records.push(rec)
      if (node.children?.length) walk(node.children, rec.id)
    })
  }
  walk(list, null)
  return records
}

describe('菜单结构（3 级嵌套）', () => {
  it('所有叶子节点（component 非空）均被扁平化收集', async () => {
    const tree = await api.get<MenuTreeNode[]>('/api/system/menu')
    const records = flatten(tree)
    const leaves = records.filter((r) => r.component)
    // 预期叶子：home/crud/user/role/dept/permission/menu/dict/notice/loginLog/operationLog
    expect(leaves.length).toBeGreaterThanOrEqual(11)
  })

  it('中间分组节点（访问控制/系统配置）建立正确的父子链', async () => {
    const tree = await api.get<MenuTreeNode[]>('/api/system/menu')
    const records = flatten(tree)
    const access = records.find((r) => r.id === 'systemAccess')
    const config = records.find((r) => r.id === 'systemConfig')
    expect(access).toBeTruthy()
    expect(config).toBeTruthy()
    // 两个分组的父级都是 system
    expect(access!.parentId).toBe('system')
    expect(config!.parentId).toBe('system')
    // 用户管理挂在访问控制下
    const user = records.find((r) => r.id === 'systemUser')
    expect(user!.parentId).toBe('systemAccess')
  })

  it('系统管理下属分组数 = 3（访问控制/系统配置/日志管理）', async () => {
    const tree = await api.get<MenuTreeNode[]>('/api/system/menu')
    const records = flatten(tree)
    const systemChildren = records.filter((r) => r.parentId === 'system')
    expect(systemChildren.length).toBe(3)
    const ids = systemChildren.map((r) => r.id).sort()
    expect(ids).toEqual(['systemAccess', 'systemConfig', 'systemLog'])
  })

  it('图标全部 PascalCase（无小写不渲染问题）', async () => {
    const tree = await api.get<MenuTreeNode[]>('/api/system/menu')

    const walk = (nodes: MenuTreeNode[], acc: string[]) => {
      for (const n of nodes) {
        const icon = n.icon
        if (icon) acc.push(icon)
        if (n.children) walk(n.children, acc)
      }
      return acc
    }
    const icons = walk(tree, [])
    // 图标首字母大写（PascalCase），且全局唯一
    for (const ic of icons) {
      expect(ic[0] === ic[0].toUpperCase()).toBe(true)
    }
    expect(new Set(icons).size).toBe(icons.length)
  })
})
