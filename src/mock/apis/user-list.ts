import type { MockMethod } from 'vite-plugin-mock'

// 定义用户类型
interface UserInfo {
  id: string
  username: string
  realName: string
  email: string
  phone: string
  role: 'admin' | 'user' | 'vip'
  status: 'active' | 'inactive'
  avatar: string
  createTime: string
  lastLoginTime: string
  loginCount: number
}

// 生成随机用户数据
const generateUsers = (count: number): UserInfo[] => {
  const users: UserInfo[] = []
  const roles = ['admin', 'user', 'vip'] as const
  const statuses = ['active', 'inactive'] as const
  const realNames = ['张三', '李四', '王五', '赵六', '钱七', '孙八', '周九', '吴十']

  for (let i = 1; i <= count; i++) {
    users.push({
      id: i.toString(),
      username: `user${i}`,
      realName: realNames[Math.floor(Math.random() * realNames.length)],
      email: `user${i}@example.com`,
      phone: `138${Math.floor(Math.random() * 100000000).toString().padStart(8, '0')}`,
      role: roles[Math.floor(Math.random() * roles.length)],
      status: statuses[Math.floor(Math.random() * statuses.length)],
      avatar: `https://cube.elemecdn.com/3/7c/3ea6beec64369c2642b92c6726f1epng.png`,
      createTime: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString(),
      lastLoginTime: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
      loginCount: Math.floor(Math.random() * 1000),
    })
  }

  return users
}

const users: UserInfo[] = generateUsers(50)

export default [
  // 获取用户列表
  {
    url: '/api/user/list',
    method: 'get',
    response: (req: any) => {
      const { keyword = '', role = '', status = '', page = 1, size = 10 } = req.query

      // 筛选
      let filteredUsers = users.filter(user => {
        const matchKeyword = keyword === '' ||
          user.username.includes(keyword) ||
          user.realName.includes(keyword) ||
          user.email.includes(keyword) ||
          user.phone.includes(keyword)
        const matchRole = role === '' || user.role === role
        const matchStatus = status === '' || user.status === status

        return matchKeyword && matchRole && matchStatus
      })

      // 分页
      const startIndex = (page - 1) * size
      const endIndex = startIndex + parseInt(size)
      const paginatedUsers = filteredUsers.slice(startIndex, endIndex)

      return {
        code: 0,
        data: {
          records: paginatedUsers,
          total: filteredUsers.length,
          current: parseInt(page),
          size: parseInt(size),
        },
        msg: 'success',
      }
    },
  },

  // 获取用户详情
  {
    url: '/api/user/detail/:id',
    method: 'get',
    response: (req: any) => {
      const id = req.query?.id || req.params?.id
      const user = users.find(u => u.id === id)

      if (user) {
        return {
          code: 0,
          data: user,
          msg: 'success',
        }
      }

      return {
        code: 404,
        msg: '用户不存在',
      }
    },
  },

  // 创建用户
  {
    url: '/api/user/create',
    method: 'post',
    response: (req: any) => {
      const newUser = {
        id: (users.length + 1).toString(),
        ...req.body,
        avatar: `https://cube.elemecdn.com/3/7c/3ea6beec64369c2642b92c6726f1epng.png`,
        createTime: new Date().toISOString(),
        lastLoginTime: new Date().toISOString(),
        loginCount: 0,
      }

      users.push(newUser)

      return {
        code: 0,
        data: newUser,
        msg: '创建成功',
      }
    },
  },

  // 更新用户
  {
    url: '/api/user/update/:id',
    method: 'put',
    response: (req: any) => {
      const id = req.query?.id || req.params?.id
      const userIndex = users.findIndex(u => u.id === id)

      if (userIndex !== -1) {
        users[userIndex] = {
          ...users[userIndex],
          ...req.body,
        }

        return {
          code: 0,
          data: users[userIndex],
          msg: '更新成功',
        }
      }

      return {
        code: 404,
        msg: '用户不存在',
      }
    },
  },

  // 删除用户
  {
    url: '/api/user/delete/:id',
    method: 'delete',
    response: (req: any) => {
      const id = req.query?.id || req.params?.id
      const userIndex = users.findIndex(u => u.id === id)

      if (userIndex !== -1) {
        users.splice(userIndex, 1)

        return {
          code: 0,
          data: true,
          msg: '删除成功',
        }
      }

      return {
        code: 404,
        msg: '用户不存在',
      }
    },
  },

  // 批量删除用户
  {
    url: '/api/user/batch-delete',
    method: 'post',
    response: (req: any) => {
      const { ids } = req.body

      ids.forEach((id: string) => {
        const userIndex = users.findIndex(u => u.id === id)
        if (userIndex !== -1) {
          users.splice(userIndex, 1)
        }
      })

      return {
        code: 0,
        data: true,
        msg: '删除成功',
      }
    },
  },

  // 导出用户列表
  {
    url: '/api/user/export',
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