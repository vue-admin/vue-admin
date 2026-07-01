import { http } from 'msw'
import { ok, fail, toCsv } from './_utils'

// 定义角色类型
interface RoleInfo {
  id: string
  name: string
  code: string
  description: string
  status: 'active' | 'inactive'
  createTime: string
  updateTime: string
}

// 生成随机角色数据
const generateRoles = (count: number): RoleInfo[] => {
  const roles: RoleInfo[] = []
  const statuses = ['active', 'inactive'] as const
  const roleNames = [
    '超级管理员',
    '系统管理员',
    '用户管理员',
    '内容管理员',
    '财务管理员',
    '数据分析师'
  ]
  const roleCodes = [
    'super_admin',
    'system_admin',
    'user_admin',
    'content_admin',
    'finance_admin',
    'data_analyst'
  ]
  const descriptions = [
    '拥有系统所有权限',
    '负责系统配置和维护',
    '负责用户管理和权限分配',
    '负责内容管理和发布',
    '负责财务管理和报表',
    '负责数据分析和报表'
  ]

  for (let i = 1; i <= count; i++) {
    const index = i % roleNames.length
    roles.push({
      id: i.toString(),
      name: roleNames[index],
      code: roleCodes[index],
      description: descriptions[index],
      status: statuses[Math.floor(Math.random() * statuses.length)],
      createTime: new Date(
        Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000
      ).toISOString(),
      updateTime: new Date(
        Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000
      ).toISOString()
    })
  }

  return roles
}

const roles: RoleInfo[] = generateRoles(10)

// 角色权限映射
const rolePermissions: Record<string, string[]> = {
  '1': [
    '1',
    '2',
    '3',
    '4',
    '5',
    '6',
    '7',
    '8',
    '9',
    '10',
    '11',
    '12',
    '13',
    '14',
    '15',
    '16',
    '17',
    '18',
    '19',
    '20'
  ], // 超级管理员
  '2': ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10'], // 系统管理员
  '3': ['11', '12', '13', '14'], // 用户管理员
  '4': ['15', '16', '17'], // 内容管理员
  '5': ['18', '19', '20'], // 财务管理员
  '6': [
    '1',
    '2',
    '3',
    '4',
    '5',
    '6',
    '7',
    '8',
    '9',
    '10',
    '11',
    '12',
    '13',
    '14',
    '15',
    '16',
    '17',
    '18',
    '19',
    '20'
  ] // 数据分析师
}

export const roleHandlers = [
  // 获取角色列表
  http.get('/api/role', ({ request }) => {
    const searchParams = new URL(request.url).searchParams
    const keyword = searchParams.get('keyword') || ''
    const status = searchParams.get('status') || ''
    const page = parseInt(searchParams.get('page') || '1')
    const size = parseInt(searchParams.get('size') || '10')

    // 筛选
    const filteredRoles = roles.filter((role) => {
      const matchKeyword =
        keyword === '' ||
        role.name.includes(keyword) ||
        role.code.includes(keyword) ||
        role.description.includes(keyword)
      const matchStatus = status === '' || role.status === status

      return matchKeyword && matchStatus
    })

    // 分页
    const startIndex = (page - 1) * size
    const paginatedRoles = filteredRoles.slice(startIndex, startIndex + size)

    return ok({
      records: paginatedRoles,
      total: filteredRoles.length,
      current: page,
      size
    })
  }),

  // 导出角色列表，必须在 /:id 之前注册
  http.get('/api/role/export', () => {
    const csv = toCsv(roles, [
      'id',
      'name',
      'code',
      'description',
      'status',
      'createTime',
      'updateTime'
    ])
    return ok(csv, '导出成功')
  }),

  // 获取角色详情
  http.get('/api/role/:id', ({ params }) => {
    const id = params.id as string
    const role = roles.find((r) => r.id === id)

    if (role) {
      return ok(role)
    }

    return fail(404, '角色不存在')
  }),

  // 创建角色
  http.post('/api/role', async ({ request }) => {
    const body = (await request.json()) as Partial<RoleInfo>
    const newRole: RoleInfo = {
      id: (roles.length + 1).toString(),
      name: body.name || '',
      code: body.code || '',
      description: body.description || '',
      status: body.status || 'active',
      createTime: new Date().toISOString(),
      updateTime: new Date().toISOString(),
      ...body
    }

    roles.push(newRole)
    rolePermissions[newRole.id] = []

    return ok(newRole, '创建成功')
  }),

  // 更新角色
  http.put('/api/role/:id', async ({ request, params }) => {
    const id = params.id as string
    const roleIndex = roles.findIndex((r) => r.id === id)

    if (roleIndex !== -1) {
      const body = (await request.json()) as Partial<RoleInfo>
      roles[roleIndex] = {
        ...roles[roleIndex],
        ...body,
        updateTime: new Date().toISOString()
      }

      return ok(roles[roleIndex], '更新成功')
    }

    return fail(404, '角色不存在')
  }),

  // 删除角色
  http.delete('/api/role/:id', ({ params }) => {
    const id = params.id as string
    const roleIndex = roles.findIndex((r) => r.id === id)

    if (roleIndex !== -1) {
      roles.splice(roleIndex, 1)
      delete rolePermissions[id]

      return ok(true, '删除成功')
    }

    return fail(404, '角色不存在')
  }),

  // 批量删除角色
  http.delete('/api/role', async ({ request }) => {
    const body = (await request.json()) as { ids: string[] }

    body.ids.forEach((id: string) => {
      const roleIndex = roles.findIndex((r) => r.id === id)
      if (roleIndex !== -1) {
        roles.splice(roleIndex, 1)
        delete rolePermissions[id]
      }
    })

    return ok(true, '删除成功')
  }),

  // 获取角色权限（子资源）
  http.get('/api/role/:roleId/permissions', ({ params }) => {
    const roleId = params.roleId as string
    const permissions = rolePermissions[roleId] || []

    return ok(permissions)
  }),

  // 设置角色权限（子资源）
  http.put('/api/role/:roleId/permissions', async ({ request, params }) => {
    const roleId = params.roleId as string
    const body = (await request.json()) as { permissions: string[] }

    rolePermissions[roleId] = body.permissions

    return ok(true, '设置成功')
  })
]
