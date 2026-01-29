import type { MockMethod } from 'vite-plugin-mock'

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
  const roleNames = ['超级管理员', '系统管理员', '用户管理员', '内容管理员', '财务管理员', '数据分析师']
  const roleCodes = ['super_admin', 'system_admin', 'user_admin', 'content_admin', 'finance_admin', 'data_analyst']
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
      createTime: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString(),
      updateTime: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
    })
  }

  return roles
}

const roles: RoleInfo[] = generateRoles(10)

// 角色权限映射
const rolePermissions: Record<string, string[]> = {
  '1': ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12', '13', '14', '15', '16', '17', '18', '19', '20'], // 超级管理员
  '2': ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10'], // 系统管理员
  '3': ['11', '12', '13', '14'], // 用户管理员
  '4': ['15', '16', '17'], // 内容管理员
  '5': ['18', '19', '20'], // 财务管理员
  '6': ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12', '13', '14', '15', '16', '17', '18', '19', '20'], // 数据分析师
}

export default [
  // 获取角色列表
  {
    url: '/api/role/list',
    method: 'get',
    response: (req: any) => {
      const { keyword = '', status = '', page = 1, size = 10 } = req.query

      // 筛选
      let filteredRoles = roles.filter(role => {
        const matchKeyword = keyword === '' ||
          role.name.includes(keyword) ||
          role.code.includes(keyword) ||
          role.description.includes(keyword)
        const matchStatus = status === '' || role.status === status

        return matchKeyword && matchStatus
      })

      // 分页
      const startIndex = (page - 1) * size
      const endIndex = startIndex + parseInt(size)
      const paginatedRoles = filteredRoles.slice(startIndex, endIndex)

      return {
        code: 0,
        data: {
          records: paginatedRoles,
          total: filteredRoles.length,
          current: parseInt(page),
          size: parseInt(size),
        },
        msg: 'success',
      }
    },
  },

  // 获取角色详情
  {
    url: '/api/role/detail/:id',
    method: 'get',
    response: (req: any) => {
      const id = req.query?.id || req.params?.id
      const role = roles.find(r => r.id === id)

      if (role) {
        return {
          code: 0,
          data: role,
          msg: 'success',
        }
      }

      return {
        code: 404,
        msg: '角色不存在',
      }
    },
  },

  // 创建角色
  {
    url: '/api/role/create',
    method: 'post',
    response: (req: any) => {
      const newRole = {
        id: (roles.length + 1).toString(),
        ...req.body,
        createTime: new Date().toISOString(),
        updateTime: new Date().toISOString(),
      }

      roles.push(newRole)
      rolePermissions[newRole.id] = []

      return {
        code: 0,
        data: newRole,
        msg: '创建成功',
      }
    },
  },

  // 更新角色
  {
    url: '/api/role/update/:id',
    method: 'put',
    response: (req: any) => {
      const id = req.query?.id || req.params?.id
      const roleIndex = roles.findIndex(r => r.id === id)

      if (roleIndex !== -1) {
        roles[roleIndex] = {
          ...roles[roleIndex],
          ...req.body,
          updateTime: new Date().toISOString(),
        }

        return {
          code: 0,
          data: roles[roleIndex],
          msg: '更新成功',
        }
      }

      return {
        code: 404,
        msg: '角色不存在',
      }
    },
  },

  // 删除角色
  {
    url: '/api/role/delete/:id',
    method: 'delete',
    response: (req: any) => {
      const id = req.query?.id || req.params?.id
      const roleIndex = roles.findIndex(r => r.id === id)

      if (roleIndex !== -1) {
        roles.splice(roleIndex, 1)
        delete rolePermissions[id]

        return {
          code: 0,
          data: true,
          msg: '删除成功',
        }
      }

      return {
        code: 404,
        msg: '角色不存在',
      }
    },
  },

  // 批量删除角色
  {
    url: '/api/role/batch-delete',
    method: 'post',
    response: (req: any) => {
      const { ids } = req.body

      ids.forEach((id: string) => {
        const roleIndex = roles.findIndex(r => r.id === id)
        if (roleIndex !== -1) {
          roles.splice(roleIndex, 1)
          delete rolePermissions[id]
        }
      })

      return {
        code: 0,
        data: true,
        msg: '删除成功',
      }
    },
  },

  // 导出角色列表
  {
    url: '/api/role/export',
    method: 'get',
    response: () => {
      return {
        code: 0,
        data: 'export success',
        msg: '导出成功',
      }
    },
  },

  // 获取角色权限
  {
    url: '/api/role/permissions/:roleId',
    method: 'get',
    response: (req: any) => {
      const roleId = req.query?.roleId || req.params?.roleId
      const permissions = rolePermissions[roleId] || []

      return {
        code: 0,
        data: permissions,
        msg: 'success',
      }
    },
  },

  // 设置角色权限
  {
    url: '/api/role/permissions/:roleId',
    method: 'post',
    response: (req: any) => {
      const roleId = req.query?.roleId || req.params?.roleId
      const { permissions } = req.body

      rolePermissions[roleId] = permissions

      return {
        code: 0,
        data: true,
        msg: '设置成功',
      }
    },
  },
] as MockMethod[]