// log mock API
import Mock from 'mockjs'
import type { MockMethod } from 'vite-plugin-mock'

// 将对象数组转为 CSV 文本（含表头）。字段含逗号/引号时用双引号包裹并转义。
function toCsv(rows: object[], headers: string[]): string {
  const escape = (v: unknown) => {
    const s = v == null ? '' : String(v)
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
  }
  const lines = [headers.join(',')]
  for (const row of rows) {
    const r = row as Record<string, unknown>
    lines.push(headers.map((h) => escape(r[h])).join(','))
  }
  return lines.join('\n')
}

const loginLogs: any[] = []
const operationLogs: any[] = []

// 锚定当前时间的格式化（日志为近期事件，限制在最近 7 天内）
const DAY = 24 * 60 * 60 * 1000
function recentDateTime(maxDaysAgo: number): string {
  const ts = Date.now() - Math.floor(Math.random() * maxDaysAgo) * DAY
  const d = new Date(ts)
  const p = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`
}

for (let i = 1; i <= 100; i++) {
  loginLogs.push(
    Mock.mock({
      id: '@guid',
      username: '@pick(["admin", "user", "manager", "operator"])',
      ip: '@ip',
      location: '@pick(["北京市", "上海市", "广州市", "深圳市", "杭州市", "成都市", "武汉市"])',
      browser: '@pick(["Chrome", "Firefox", "Safari", "Edge", "IE 11"])',
      os: '@pick(["Windows 10", "Windows 11", "macOS", "Ubuntu", "iOS", "Android"])',
      'status|1': ['success', 'failed'],
      message: function () {
        return this.status === 'failed' ? '@pick(["密码错误", "账号不存在", "验证码错误", "账号已锁定"])' : ''
      },
      loginTime: recentDateTime(7),
    }),
  )
}

for (let i = 1; i <= 100; i++) {
  operationLogs.push(
    Mock.mock({
      id: '@guid',
      username: '@pick(["admin", "user", "manager", "operator"])',
      module: '@pick(["用户管理", "角色管理", "权限管理", "菜单管理", "字典管理", "系统配置"])',
      operation: '@pick(["新增用户", "编辑用户", "删除用户", "查询列表", "导出数据", "更新配置"])',
      method: '@pick(["GET", "POST", "PUT", "DELETE"])',
      params: JSON.stringify({ page: 1, size: 20, keyword: '' }),
      time: '@integer(10, 500)',
      ip: '@ip',
      location: '@pick(["北京市", "上海市", "广州市", "深圳市", "杭州市", "成都市", "武汉市"])',
      'status|1': ['success', 'failed'],
      errorMsg: function () {
        return this.status === 'failed' ? '@pick(["参数错误", "权限不足", "数据不存在", "系统异常"])' : ''
      },
      operationTime: recentDateTime(7),
    }),
  )
}

export default [
  // 登录日志
  {
    url: '/api/system/login-log',
    method: 'GET',
    response: ({ query }: { query: Record<string, string> }) => {
      const { page = 1, size = 20, keyword = '', status = '', startTime, endTime } = query

      let filtered = [...loginLogs]

      if (keyword) {
        const kw = keyword.toLowerCase()
        filtered = filtered.filter(
          (item) => item.username.toLowerCase().includes(kw) || item.ip.includes(kw),
        )
      }

      if (status) {
        filtered = filtered.filter((item) => item.status === status)
      }

      // 时间范围过滤（startTime/endTime 为 'yyyy-MM-dd HH:mm:ss' 字符串，可直接比较）
      if (startTime) {
        filtered = filtered.filter((item) => item.loginTime >= startTime)
      }
      if (endTime) {
        filtered = filtered.filter((item) => item.loginTime <= endTime)
      }

      const start = (Number(page) - 1) * Number(size)
      const end = start + Number(size)
      const records = filtered.slice(start, end)

      return {
        code: 0,
        data: {
          records,
          total: filtered.length,
          current: Number(page),
          size: Number(size),
        },
        msg: 'success',
      }
    },
  },
  {
    url: '/api/system/login-log/export',
    method: 'GET',
    response: () => {
      const csv = toCsv(loginLogs, [
        'username', 'ip', 'location', 'browser', 'os', 'status', 'message', 'loginTime',
      ])
      return { code: 0, data: csv, msg: 'success' }
    },
  },
  {
    url: '/api/system/login-log/clear',
    method: 'DELETE',
    response: () => {
      loginLogs.length = 0
      return { code: 0, data: true, msg: 'success' }
    },
  },
  {
    url: '/api/system/login-log/:id',
    method: 'GET',
    response: ({ params }) => {
      const item = loginLogs.find((d) => d.id === params.id)
      if (!item) {
        return { code: -1, data: null, msg: '数据不存在' }
      }
      return { code: 0, data: item, msg: 'success' }
    },
  },
  {
    url: '/api/system/login-log/:id',
    method: 'DELETE',
    response: ({ params }) => {
      const index = loginLogs.findIndex((d) => d.id === params.id)
      if (index === -1) {
        return { code: -1, data: false, msg: '数据不存在' }
      }
      loginLogs.splice(index, 1)
      return { code: 0, data: true, msg: 'success' }
    },
  },
  {
    url: '/api/system/login-log',
    method: 'DELETE',
    response: ({ body }) => {
      const { ids } = body
      ids.forEach((id: string) => {
        const index = loginLogs.findIndex((d) => d.id === id)
        if (index !== -1) {
          loginLogs.splice(index, 1)
        }
      })
      return { code: 0, data: true, msg: 'success' }
    },
  },

  // 操作日志
  {
    url: '/api/system/operation-log',
    method: 'GET',
    response: ({ query }) => {
      const { page = 1, size = 20, keyword = '', status = '', startTime, endTime } = query

      let filtered = [...operationLogs]

      if (keyword) {
        const kw = keyword.toLowerCase()
        filtered = filtered.filter(
          (item) =>
            item.username.toLowerCase().includes(kw) || item.module.toLowerCase().includes(kw),
        )
      }

      if (status) {
        filtered = filtered.filter((item) => item.status === status)
      }

      // 时间范围过滤
      if (startTime) {
        filtered = filtered.filter((item) => item.operationTime >= startTime)
      }
      if (endTime) {
        filtered = filtered.filter((item) => item.operationTime <= endTime)
      }

      const start = (Number(page) - 1) * Number(size)
      const end = start + Number(size)
      const records = filtered.slice(start, end)

      return {
        code: 0,
        data: {
          records,
          total: filtered.length,
          current: Number(page),
          size: Number(size),
        },
        msg: 'success',
      }
    },
  },
  {
    url: '/api/system/operation-log/export',
    method: 'GET',
    response: () => {
      const csv = toCsv(operationLogs, [
        'username', 'module', 'operation', 'method', 'ip', 'location', 'time', 'status', 'errorMsg', 'operationTime',
      ])
      return { code: 0, data: csv, msg: 'success' }
    },
  },
  {
    url: '/api/system/operation-log/clear',
    method: 'DELETE',
    response: () => {
      operationLogs.length = 0
      return { code: 0, data: true, msg: 'success' }
    },
  },
  {
    url: '/api/system/operation-log/:id',
    method: 'GET',
    response: ({ params }) => {
      const item = operationLogs.find((d) => d.id === params.id)
      if (!item) {
        return { code: -1, data: null, msg: '数据不存在' }
      }
      return { code: 0, data: item, msg: 'success' }
    },
  },
  {
    url: '/api/system/operation-log/:id',
    method: 'DELETE',
    response: ({ params }) => {
      const index = operationLogs.findIndex((d) => d.id === params.id)
      if (index === -1) {
        return { code: -1, data: false, msg: '数据不存在' }
      }
      operationLogs.splice(index, 1)
      return { code: 0, data: true, msg: 'success' }
    },
  },
  {
    url: '/api/system/operation-log',
    method: 'DELETE',
    response: ({ body }) => {
      const { ids } = body
      ids.forEach((id: string) => {
        const index = operationLogs.findIndex((d) => d.id === id)
        if (index !== -1) {
          operationLogs.splice(index, 1)
        }
      })
      return { code: 0, data: true, msg: 'success' }
    },
  },
]
