import { http } from 'msw'
import { ok, fail, toCsv } from './_utils'

// 定义权限类型
interface PermissionInfo {
  id: string
  name: string
  code: string
  description: string
  module: string
  status: 'active' | 'inactive'
  createTime: string
  updateTime: string
}

// 生成随机权限数据
const generatePermissions = (count: number): PermissionInfo[] => {
  const permissions: PermissionInfo[] = []
  const modules = [
    'system',
    'user',
    'role',
    'permission',
    'dict',
    'config'
  ] as const
  const statuses = ['active', 'inactive'] as const

  const permissionNames: Record<string, string[]> = {
    system: ['系统设置', '日志管理', '操作记录'],
    user: ['用户列表', '用户创建', '用户编辑', '用户删除'],
    role: ['角色列表', '角色创建', '角色编辑', '角色删除', '角色权限配置'],
    permission: ['权限列表', '权限创建', '权限编辑', '权限删除'],
    dict: ['字典列表', '字典创建', '字典编辑', '字典删除'],
    config: ['系统配置', '参数设置', '邮箱配置']
  }

  const permissionCodes: Record<string, string[]> = {
    system: ['system:setting', 'system:log', 'system:operation'],
    user: ['user:list', 'user:create', 'user:edit', 'user:delete'],
    role: [
      'role:list',
      'role:create',
      'role:edit',
      'role:delete',
      'role:permission'
    ],
    permission: [
      'permission:list',
      'permission:create',
      'permission:edit',
      'permission:delete'
    ],
    dict: ['dict:list', 'dict:create', 'dict:edit', 'dict:delete'],
    config: ['config:system', 'config:parameter', 'config:email']
  }

  const descriptions: Record<string, string[]> = {
    system: ['系统基本设置', '系统日志管理', '用户操作记录'],
    user: ['查看用户列表', '创建新用户', '编辑用户信息', '删除用户'],
    role: [
      '查看角色列表',
      '创建新角色',
      '编辑角色信息',
      '删除角色',
      '配置角色权限'
    ],
    permission: ['查看权限列表', '创建新权限', '编辑权限信息', '删除权限'],
    dict: ['查看字典列表', '创建新字典', '编辑字典信息', '删除字典'],
    config: ['系统基本配置', '系统参数设置', '邮箱服务配置']
  }

  let id = 1
  for (const module of modules) {
    const names = permissionNames[module]
    const codes = permissionCodes[module]
    const descs = descriptions[module]

    for (let i = 0; i < names.length; i++) {
      permissions.push({
        id: id.toString(),
        name: names[i],
        code: codes[i],
        description: descs[i],
        module: module,
        status: statuses[Math.floor(Math.random() * statuses.length)],
        createTime: new Date(
          Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000
        ).toISOString(),
        updateTime: new Date(
          Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000
        ).toISOString()
      })
      id++
    }
  }

  return permissions
}

const permissions: PermissionInfo[] = generatePermissions(20)

export const permissionHandlers = [
  // 获取权限列表 / 所有权限（?all=true 跳过分页）
  http.get('/api/permission', ({ request }) => {
    const searchParams = new URL(request.url).searchParams
    const keyword = searchParams.get('keyword') || ''
    const module = searchParams.get('module') || ''
    const status = searchParams.get('status') || ''
    const page = parseInt(searchParams.get('page') || '1')
    const size = parseInt(searchParams.get('size') || '10')
    const all = searchParams.get('all') || ''

    // 筛选
    const filteredPermissions = permissions.filter((permission) => {
      const matchKeyword =
        keyword === '' ||
        permission.name.includes(keyword) ||
        permission.code.includes(keyword) ||
        permission.description.includes(keyword)
      const matchModule = module === '' || permission.module === module
      const matchStatus = status === '' || permission.status === status

      return matchKeyword && matchModule && matchStatus
    })

    // all=true 直接返回完整列表（不分页），用于角色权限配置
    if (all === 'true' || all === '1') {
      return ok(filteredPermissions)
    }

    // 分页
    const startIndex = (page - 1) * size
    const paginatedPermissions = filteredPermissions.slice(
      startIndex,
      startIndex + size
    )

    return ok({
      records: paginatedPermissions,
      total: filteredPermissions.length,
      current: page,
      size
    })
  }),

  // 导出权限列表，必须在 /:id 之前注册
  http.get('/api/permission/export', () => {
    const csv = toCsv(permissions, [
      'id',
      'name',
      'code',
      'module',
      'description',
      'status',
      'createTime',
      'updateTime'
    ])
    return ok(csv, '导出成功')
  }),

  // 获取权限详情
  http.get('/api/permission/:id', ({ params }) => {
    const id = params.id as string
    const permission = permissions.find((p) => p.id === id)

    if (permission) {
      return ok(permission)
    }

    return fail(404, '权限不存在')
  }),

  // 创建权限
  http.post('/api/permission', async ({ request }) => {
    const body = (await request.json()) as Partial<PermissionInfo>
    const newPermission: PermissionInfo = {
      id: (permissions.length + 1).toString(),
      name: body.name || '',
      code: body.code || '',
      description: body.description || '',
      module: body.module || 'system',
      status: body.status || 'active',
      createTime: new Date().toISOString(),
      updateTime: new Date().toISOString(),
      ...body
    }

    permissions.push(newPermission)

    return ok(newPermission, '创建成功')
  }),

  // 更新权限
  http.put('/api/permission/:id', async ({ request, params }) => {
    const id = params.id as string
    const permissionIndex = permissions.findIndex((p) => p.id === id)

    if (permissionIndex !== -1) {
      const body = (await request.json()) as Partial<PermissionInfo>
      permissions[permissionIndex] = {
        ...permissions[permissionIndex],
        ...body,
        updateTime: new Date().toISOString()
      }

      return ok(permissions[permissionIndex], '更新成功')
    }

    return fail(404, '权限不存在')
  }),

  // 删除权限
  http.delete('/api/permission/:id', ({ params }) => {
    const id = params.id as string
    const permissionIndex = permissions.findIndex((p) => p.id === id)

    if (permissionIndex !== -1) {
      permissions.splice(permissionIndex, 1)

      return ok(true, '删除成功')
    }

    return fail(404, '权限不存在')
  }),

  // 批量删除权限（DELETE 集合 + body.ids）
  http.delete('/api/permission', async ({ request }) => {
    const body = (await request.json()) as { ids: string[] }

    body.ids.forEach((id: string) => {
      const permissionIndex = permissions.findIndex((p) => p.id === id)
      if (permissionIndex !== -1) {
        permissions.splice(permissionIndex, 1)
      }
    })

    return ok(true, '删除成功')
  })
]
