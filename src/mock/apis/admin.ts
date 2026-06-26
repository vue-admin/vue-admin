import type { MockMethod } from 'vite-plugin-mock'

// 定义管理员类型
interface AdminInfo {
  id: string
  username: string
  realName: string
  email: string
  phone: string
  role: 'super' | 'admin'
  status: 'active' | 'inactive'
  avatar: string
  createTime: string
  lastLoginTime: string
  loginCount: number
}

// 生成随机管理员数据
const generateAdmins = (count: number): AdminInfo[] => {
  const admins: AdminInfo[] = []
  const roles = ['super', 'admin'] as const
  const statuses = ['active', 'inactive'] as const
  const realNames = ['张三', '李四', '王五', '赵六', '钱七', '孙八', '周九', '吴十']

  for (let i = 1; i <= count; i++) {
    admins.push({
      id: i.toString(),
      username: `admin${i}`,
      realName: realNames[Math.floor(Math.random() * realNames.length)],
      email: `admin${i}@example.com`,
      phone: `138${Math.floor(Math.random() * 100000000).toString().padStart(8, '0')}`,
      role: roles[Math.floor(Math.random() * roles.length)],
      status: statuses[Math.floor(Math.random() * statuses.length)],
      avatar: `https://cube.elemecdn.com/3/7c/3ea6beec64369c2642b92c6726f1epng.png`,
      createTime: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString(),
      lastLoginTime: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
      loginCount: Math.floor(Math.random() * 1000),
    })
  }

  return admins
}

const admins: AdminInfo[] = generateAdmins(20)

export default [
  // 获取管理员列表
  {
    url: '/api/admin/list',
    method: 'get',
    response: (req: any) => {
      const { keyword = '', role = '', status = '', page = 1, size = 10 } = req.query

      // 筛选
      let filteredAdmins = admins.filter(admin => {
        const matchKeyword = keyword === '' ||
          admin.username.includes(keyword) ||
          admin.realName.includes(keyword) ||
          admin.email.includes(keyword) ||
          admin.phone.includes(keyword)
        const matchRole = role === '' || admin.role === role
        const matchStatus = status === '' || admin.status === status

        return matchKeyword && matchRole && matchStatus
      })

      // 分页
      const startIndex = (page - 1) * size
      const endIndex = startIndex + parseInt(size)
      const paginatedAdmins = filteredAdmins.slice(startIndex, endIndex)

      return {
        code: 0,
        data: {
          records: paginatedAdmins,
          total: filteredAdmins.length,
          current: parseInt(page),
          size: parseInt(size),
        },
        msg: 'success',
      }
    },
  },

  // 获取管理员详情
  {
    url: '/api/admin/detail/:id',
    method: 'get',
    response: (req: any) => {
      const id = req.query?.id || req.params?.id
      const admin = admins.find(u => u.id === id)

      if (admin) {
        return {
          code: 0,
          data: admin,
          msg: 'success',
        }
      }

      return {
        code: 404,
        msg: '管理员不存在',
      }
    },
  },

  // 创建管理员
  {
    url: '/api/admin/create',
    method: 'post',
    response: (req: any) => {
      const newAdmin = {
        id: (admins.length + 1).toString(),
        ...req.body,
        avatar: `https://cube.elemecdn.com/3/7c/3ea6beec64369c2642b92c6726f1epng.png`,
        createTime: new Date().toISOString(),
        lastLoginTime: new Date().toISOString(),
        loginCount: 0,
      }

      admins.push(newAdmin)

      return {
        code: 0,
        data: newAdmin,
        msg: '创建成功',
      }
    },
  },

  // 更新管理员
  {
    url: '/api/admin/update/:id',
    method: 'put',
    response: (req: any) => {
      const id = req.query?.id || req.params?.id
      const adminIndex = admins.findIndex(u => u.id === id)

      if (adminIndex !== -1) {
        admins[adminIndex] = {
          ...admins[adminIndex],
          ...req.body,
        }

        return {
          code: 0,
          data: admins[adminIndex],
          msg: '更新成功',
        }
      }

      return {
        code: 404,
        msg: '管理员不存在',
      }
    },
  },

  // 删除管理员
  {
    url: '/api/admin/delete/:id',
    method: 'delete',
    response: (req: any) => {
      const id = req.query?.id || req.params?.id
      const adminIndex = admins.findIndex(u => u.id === id)

      if (adminIndex !== -1) {
        admins.splice(adminIndex, 1)

        return {
          code: 0,
          data: true,
          msg: '删除成功',
        }
      }

      return {
        code: 404,
        msg: '管理员不存在',
      }
    },
  },

  // 批量删除管理员
  {
    url: '/api/admin/batch-delete',
    method: 'post',
    response: (req: any) => {
      const { ids } = req.body

      ids.forEach((id: string) => {
        const adminIndex = admins.findIndex(u => u.id === id)
        if (adminIndex !== -1) {
          admins.splice(adminIndex, 1)
        }
      })

      return {
        code: 0,
        data: true,
        msg: '删除成功',
      }
    },
  },

  // 导出管理员列表
  {
    url: '/api/admin/export',
    method: 'get',
    response: () => {
      return {
        code: 0,
        data: 'export success',
        msg: '导出成功',
      }
    },
  },
] as MockMethod[]
