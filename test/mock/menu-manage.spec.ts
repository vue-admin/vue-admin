import { describe, it, expect } from 'vitest'
// 验证菜单重构（3 级嵌套：系统管理 → 访问控制/系统配置/日志管理 → 叶子）
// 不破坏 menu-manage 的扁平化/建树逻辑
import { ALL_MENUS } from '@/mock/apis/menu'

// 复刻 menu-manage.ts 的 walk 扁平化逻辑（避免依赖其未导出实现）
interface RouteMenuNode {
  path?: string
  name?: string
  component?: string
  meta?: { title?: string; icon?: string }
  children?: RouteMenuNode[]
}
interface MenuRecord {
  id: string
  parentId: string | null
  name: string
  path: string
  component?: string
}

function flatten(list: RouteMenuNode[]): MenuRecord[] {
  const records: MenuRecord[] = []
  const walk = (nodes: RouteMenuNode[], parentId: string | null) => {
    nodes.forEach((node, idx) => {
      const id = node.name || `node-${idx}`
      const rec: MenuRecord = {
        id,
        parentId,
        name: node.meta?.title || node.name || '',
        path: node.path || '',
        component: node.component,
      }
      records.push(rec)
      if (node.children?.length) walk(node.children, rec.id)
    })
  }
  walk(list, null)
  return records
}

describe('菜单结构（3 级嵌套）', () => {
  const records = flatten(ALL_MENUS as unknown as RouteMenuNode[])

  it('所有叶子节点（component 非空）均被扁平化收集', () => {
    const leaves = records.filter((r) => r.component)
    // 预期叶子：home/crud/user/role/dept/permission/menu/dict/notice/loginLog/operationLog
    expect(leaves.length).toBeGreaterThanOrEqual(11)
  })

  it('中间分组节点（访问控制/系统配置）建立正确的父子链', () => {
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

  it('系统管理下属分组数 = 3（访问控制/系统配置/日志管理）', () => {
    const systemChildren = records.filter((r) => r.parentId === 'system')
    expect(systemChildren.length).toBe(3)
    const ids = systemChildren.map((r) => r.id).sort()
    expect(ids).toEqual(['systemAccess', 'systemConfig', 'systemLog'])
  })

  it('图标全部 PascalCase（无小写不渲染问题）', () => {
    const walk = (nodes: RouteMenuNode[], acc: string[]) => {
      for (const n of nodes) {
        const icon = n.meta?.icon
        if (icon) acc.push(icon)
        if (n.children) walk(n.children, acc)
      }
      return acc
    }
    const icons = walk(ALL_MENUS as unknown as RouteMenuNode[], [])
    // 图标首字母大写（PascalCase），且全局唯一
    for (const ic of icons) {
      expect(ic[0] === ic[0].toUpperCase()).toBe(true)
    }
    expect(new Set(icons).size).toBe(icons.length)
  })
})
