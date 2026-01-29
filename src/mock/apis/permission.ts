import type { MockMethod } from 'vite-plugin-mock'

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
  const modules = ['system', 'user', 'role', 'permission', 'dict', 'config'] as const
  const statuses = ['active', 'inactive'] as const
  const moduleNames: Record<string, string> = {
    system: '系统管理',
    user: '用户管理',
    role: '角色管理',
    permission: '权限管理',
    dict: '字典管理',
    config: '系统配置',
  }

  const permissionNames: Record<string, string[]> = {
    system: ['系统设置', '日志管理', '操作记录'],
    user: ['用户列表', '用户创建', '用户编辑', '用户删除'],
    role: ['角色列表', '角色创建', '角色编辑', '角色删除', '角色权限配置'],
    permission: ['权限列表', '权限创建', '权限编辑', '权限删除'],
    dict: ['字典列表', '字典创建', '字典编辑', '字典删除'],
    config: ['系统配置', '参数设置', '邮箱配置'],
  }

  const permissionCodes: Record<string, string[]> = {
    system: ['system:setting', 'system:log', 'system:operation'],
    user: ['user:list', 'user:create', 'user:edit', 'user:delete'],
    role: ['role:list', 'role:create', 'role:edit', 'role:delete', 'role:permission'],
    permission: ['permission:list', 'permission:create', 'permission:edit', 'permission:delete'],
    dict: ['dict:list', 'dict:create', 'dict:edit', 'dict:delete'],
    config: ['config:system', 'config:parameter', 'config:email'],
  }

  const descriptions: Record<string, string[]> = {
    system: ['系统基本设置', '系统日志管理', '用户操作记录'],
    user: ['查看用户列表', '创建新用户', '编辑用户信息', '删除用户'],
    role: ['查看角色列表', '创建新角色', '编辑角色信息', '删除角色', '配置角色权限'],
    permission: ['查看权限列表', '创建新权限', '编辑权限信息', '删除权限'],
    dict: ['查看字典列表', '创建新字典', '编辑字典信息', '删除字典'],
    config: ['系统基本配置', '系统参数设置', '邮箱服务配置'],
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
        createTime: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString(),
        updateTime: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
      })
      id++
    }
  }

  return permissions
}

const permissions: PermissionInfo[] = generatePermissions(20)

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
  // 获取权限列表
  {
    url: '/api/permission/list',
    method: 'get',
    response: (req: any) => {
      const { keyword = '', module = '', status = '', page = 1, size = 10 } = req.query

      // 筛选
      let filteredPermissions = permissions.filter(permission => {
        const matchKeyword = keyword === '' ||
          permission.name.includes(keyword) ||
          permission.code.includes(keyword) ||
          permission.description.includes(keyword)
        const matchModule = module === '' || permission.module === module
        const matchStatus = status === '' || permission.status === status

        return matchKeyword && matchModule && matchStatus
      })

      // 分页
      const startIndex = (page - 1) * size
      const endIndex = startIndex + parseInt(size)
      const paginatedPermissions = filteredPermissions.slice(startIndex, endIndex)

      return {
        code: 0,
        data: {
          records: paginatedPermissions,
          total: filteredPermissions.length,
          current: parseInt(page),
          size: parseInt(size),
        },
        msg: 'success',
      }
    },
  },

  // 获取所有权限（用于角色权限配置）
  {
    url: '/api/permission/all',
    method: 'get',
    response: () => {
      return {
        code: 0,
        data: permissions,
        msg: 'success',
      }
    },
  },

  // 获取权限详情
  {
    url: '/api/permission/detail/:id',
    method: 'get',
    response: (req: any) => {
      const id = req.query?.id || req.params?.id
      const permission = permissions.find(p => p.id === id)

      if (permission) {
        return {
          code: 0,
          data: permission,
          msg: 'success',
        }
      }

      return {
        code: 404,
        msg: '权限不存在',
      }
    },
  },

  // 创建权限
  {
    url: '/api/permission/create',
    method: 'post',
    response: (req: any) => {
      const newPermission = {
        id: (permissions.length + 1).toString(),
        ...req.body,
        createTime: new Date().toISOString(),
        updateTime: new Date().toISOString(),
      }

      permissions.push(newPermission)

      return {
        code: 0,
        data: newPermission,
        msg: '创建成功',
      }
    },
  },

  // 更新权限
  {
    url: '/api/permission/update/:id',
    method: 'put',
    response: (req: any) => {
      const id = req.query?.id || req.params?.id
      const permissionIndex = permissions.findIndex(p => p.id === id)

      if (permissionIndex !== -1) {
        permissions[permissionIndex] = {
          ...permissions[permissionIndex],
          ...req.body,
          updateTime: new Date().toISOString(),
        }

        return {
          code: 0,
          data: permissions[permissionIndex],
          msg: '更新成功',
        }
      }

      return {
        code: 404,
        msg: '权限不存在',
      }
    },
  },

  // 删除权限
  {
    url: '/api/permission/delete/:id',
    method: 'delete',
    response: (req: any) => {
      const id = req.query?.id || req.params?.id
      const permissionIndex = permissions.findIndex(p => p.id === id)

      if (permissionIndex !== -1) {
        permissions.splice(permissionIndex, 1)

        return {
          code: 0,
          data: true,
          msg: '删除成功',
        }
      }

      return {
        code: 404,
        msg: '权限不存在',
      }
    },
  },

  // 批量删除权限
  {
    url: '/api/permission/batch-delete',
    method: 'post',
    response: (req: any) => {
      const { ids } = req.body

      ids.forEach((id: string) => {
        const permissionIndex = permissions.findIndex(p => p.id === id)
        if (permissionIndex !== -1) {
          permissions.splice(permissionIndex, 1)
        }
      })

      return {
        code: 0,
        data: true,
        msg: '删除成功',
      }
    },
  },

  // 导出权限列表
  {
    url: '/api/permission/export',
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