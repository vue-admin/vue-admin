import type { MockMethod } from 'vite-plugin-mock'
import { success, sendProblem } from '../_helpers'

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
    response: (req) => {
      const { keyword = '', role = '', status = '', page = 1, size = 10 } = req.query || {}

      // 筛选
      const filteredAdmins = admins.filter(admin => {
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
      const page_num = Number(page)
      const size_num = Number(size)
      const startIndex = (page_num - 1) * size_num
      const endIndex = startIndex + size_num
      const paginatedAdmins = filteredAdmins.slice(startIndex, endIndex)

      return success({
        records: paginatedAdmins,
        total: filteredAdmins.length,
        current: page_num,
        size: size_num,
      })
    },
  },

  // 获取管理员详情
  {
    url: '/api/admin/detail/:id',
    method: 'get',
    response: (req, res) => {
      const id = req.query?.id || req.params?.id
      const admin = admins.find(u => u.id === id)

      if (admin) {
        return success(admin)
      }

      sendProblem(res, { status: 404, title: 'Not Found', detail: '管理员不存在' })
      return
    },
  },

  // 创建管理员
  {
    url: '/api/admin/create',
    method: 'post',
    response: (req) => {
      const newAdmin = {
        id: (admins.length + 1).toString(),
        ...req.body,
        avatar: `https://cube.elemecdn.com/3/7c/3ea6beec64369c2642b92c6726f1epng.png`,
        createTime: new Date().toISOString(),
        lastLoginTime: new Date().toISOString(),
        loginCount: 0,
      }

      admins.push(newAdmin)

      return success(newAdmin, '创建成功')
    },
  },

  // 更新管理员
  {
    url: '/api/admin/update/:id',
    method: 'put',
    response: (req, res) => {
      const id = req.query?.id || req.params?.id
      const adminIndex = admins.findIndex(u => u.id === id)

      if (adminIndex !== -1) {
        admins[adminIndex] = {
          ...admins[adminIndex],
          ...req.body,
        }

        return success(admins[adminIndex], '更新成功')
      }

      sendProblem(res, { status: 404, title: 'Not Found', detail: '管理员不存在' })
      return
    },
  },

  // 删除管理员
  {
    url: '/api/admin/delete/:id',
    method: 'delete',
    response: (req, res) => {
      const id = req.query?.id || req.params?.id
      const adminIndex = admins.findIndex(u => u.id === id)

      if (adminIndex !== -1) {
        admins.splice(adminIndex, 1)

        return success(true, '删除成功')
      }

      sendProblem(res, { status: 404, title: 'Not Found', detail: '管理员不存在' })
      return
    },
  },

  // 批量删除管理员
  {
    url: '/api/admin/batch-delete',
    method: 'post',
    response: (req) => {
      const { ids } = req.body || {}

      ids.forEach((id: string) => {
        const adminIndex = admins.findIndex(u => u.id === id)
        if (adminIndex !== -1) {
          admins.splice(adminIndex, 1)
        }
      })

      return success(true, '删除成功')
    },
  },

  // 导出管理员列表
  {
    url: '/api/admin/export',
    method: 'get',
    response: () => {
      return success('export success', '导出成功')
    },
  },
] as MockMethod[]
