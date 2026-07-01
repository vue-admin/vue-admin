import { http } from 'msw'
import { ok, fail } from './_utils'
import { ALL_MENUS } from '../apis/menu'

// 菜单管理 CRUD 内存数据源
// 从 ALL_MENUS（路由格式）转换为 MenuRecord 格式（带 id/parentId/sort/status）
interface MenuRecord {
  id: string
  parentId: string | null
  name: string
  path: string
  component?: string
  icon?: string
  sort: number
  status: 'active' | 'inactive'
}

// ALL_MENUS 的路由节点形状（仅取本文件用到的字段）
interface RouteMenuNode {
  path?: string
  name?: string
  component?: string
  meta?: { title?: string; icon?: string }
  children?: RouteMenuNode[]
}

// MenuRecord 树节点（mock 响应输出）
interface MenuTreeNode extends MenuRecord {
  children?: MenuTreeNode[]
}

let menuIdCounter = 100
const genId = () => `menu_${menuIdCounter++}`

// 把 ALL_MENUS（路由格式）转成扁平 MenuRecord[]，便于 CRUD
function seedMenus(): MenuRecord[] {
  const records: MenuRecord[] = []
  const walk = (nodes: RouteMenuNode[], parentId: string | null) => {
    nodes.forEach((node, idx) => {
      const rec: MenuRecord = {
        id: node.name || genId(),
        parentId,
        name: node.meta?.title || node.name || '',
        path: node.path || '',
        component: node.component,
        icon: node.meta?.icon,
        sort: idx,
        status: 'active'
      }
      records.push(rec)
      if (node.children && node.children.length > 0) {
        walk(node.children, rec.id)
      }
    })
  }
  walk(ALL_MENUS as unknown as RouteMenuNode[], null)
  return records
}

let menuRecords: MenuRecord[] = seedMenus()

// 把扁平 records 构建成树
function buildTree(records: MenuRecord[]): MenuTreeNode[] {
  const map = new Map<string, MenuTreeNode>()
  const roots: MenuTreeNode[] = []
  records.forEach((r) => {
    map.set(r.id, { ...r, children: [] })
  })
  records.forEach((r) => {
    const node = map.get(r.id)!
    if (r.parentId && map.has(r.parentId)) {
      map.get(r.parentId)!.children!.push(node)
    } else {
      roots.push(node)
    }
  })
  // 空子节点移除
  const trim = (nodes: MenuTreeNode[]) => {
    nodes.forEach((n) => {
      if (n.children && n.children.length === 0) {
        delete n.children
      } else if (n.children) {
        trim(n.children)
      }
    })
  }
  trim(roots)
  return roots
}

function findRecord(id: string): MenuRecord | undefined {
  return menuRecords.find((r) => r.id === id)
}

function removeRecordAndChildren(id: string): void {
  const children = menuRecords.filter((r) => r.parentId === id)
  children.forEach((c) => removeRecordAndChildren(c.id))
  menuRecords = menuRecords.filter((r) => r.id !== id)
}

interface CreateMenuBody {
  parentId?: string | null
  name?: string
  path?: string
  component?: string
  icon?: string
  sort?: number
  status?: 'active' | 'inactive'
}

interface UpdateMenuBody extends Partial<CreateMenuBody> {}

interface SortMenuBody {
  draggingId: string
  targetId: string
  position: 'before' | 'after' | 'inner'
}

export const menuManageHandlers = [
  http.get('/api/system/menu', () => {
    return ok(buildTree(menuRecords))
  }),

  http.post('/api/system/menu', async ({ request }) => {
    const body = (await request.json()) as CreateMenuBody
    const newMenu: MenuRecord = {
      id: genId(),
      parentId: body.parentId || null,
      name: body.name || '',
      path: body.path || '',
      component: body.component,
      icon: body.icon,
      sort: body.sort ?? 0,
      status: body.status || 'active'
    }
    menuRecords.push(newMenu)
    return ok(newMenu)
  }),

  http.put('/api/system/menu/:id', async ({ request, params }) => {
    const id = params.id as string
    const rec = findRecord(id)
    if (!rec) return fail(404, '菜单不存在')
    const body = (await request.json()) as UpdateMenuBody
    Object.assign(rec, {
      name: body.name ?? rec.name,
      path: body.path ?? rec.path,
      component: body.component ?? rec.component,
      icon: body.icon ?? rec.icon,
      sort: body.sort ?? rec.sort,
      status: body.status ?? rec.status,
      parentId: body.parentId ?? rec.parentId
    })
    return ok(rec)
  }),

  http.delete('/api/system/menu/:id', ({ params }) => {
    const id = params.id as string
    removeRecordAndChildren(id)
    return ok(true)
  }),

  http.patch('/api/system/menu/sort', async ({ request }) => {
    const body = (await request.json()) as SortMenuBody
    const { draggingId, targetId, position } = body
    const dragging = findRecord(draggingId)
    const target = findRecord(targetId)
    if (!dragging || !target)
      return fail(400, '节点不存在')
    if (position === 'inner') {
      dragging.parentId = target.id
    } else {
      dragging.parentId = target.parentId
      dragging.sort =
        position === 'before' ? target.sort - 0.5 : target.sort + 0.5
    }
    const siblings = menuRecords
      .filter((r) => r.parentId === dragging.parentId)
      .sort((a, b) => a.sort - b.sort)
    siblings.forEach((r, idx) => {
      r.sort = idx
    })
    return ok(true)
  }),
]
