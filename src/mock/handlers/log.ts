import Mock from 'mockjs'
import { http } from 'msw'
import { ok, fail, toCsv } from './_utils'

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

export const logHandlers = [
  // 登录日志
  http.get('/api/system/login-log', ({ request }) => {
    const searchParams = new URL(request.url).searchParams
    const page = Number(searchParams.get('page') || '1')
    const size = Number(searchParams.get('size') || '20')
    const keyword = searchParams.get('keyword') || ''
    const status = searchParams.get('status') || ''
    const startTime = searchParams.get('startTime') || ''
    const endTime = searchParams.get('endTime') || ''

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

    const start = (page - 1) * size
    const end = start + size
    const records = filtered.slice(start, end)

    return ok({
      records,
      total: filtered.length,
      current: page,
      size,
    })
  }),

  // 导出必须在 /:id 之前注册
  http.get('/api/system/login-log/export', () => {
    const csv = toCsv(loginLogs, [
      'username', 'ip', 'location', 'browser', 'os', 'status', 'message', 'loginTime',
    ])
    return ok(csv)
  }),

  // 清空必须在 /:id 之前注册
  http.delete('/api/system/login-log/clear', () => {
    loginLogs.length = 0
    return ok(true)
  }),

  http.get('/api/system/login-log/:id', ({ params }) => {
    const item = loginLogs.find((d) => d.id === params.id)
    if (!item) {
      return fail(-1, '数据不存在')
    }
    return ok(item)
  }),

  http.delete('/api/system/login-log/:id', ({ params }) => {
    const index = loginLogs.findIndex((d) => d.id === params.id)
    if (index === -1) {
      return fail(-1, '数据不存在')
    }
    loginLogs.splice(index, 1)
    return ok(true)
  }),

  http.delete('/api/system/login-log', async ({ request }) => {
    const body = (await request.json()) as { ids: string[] }
    const { ids } = body
    ids.forEach((id: string) => {
      const index = loginLogs.findIndex((d) => d.id === id)
      if (index !== -1) {
        loginLogs.splice(index, 1)
      }
    })
    return ok(true)
  }),

  // 操作日志
  http.get('/api/system/operation-log', ({ request }) => {
    const searchParams = new URL(request.url).searchParams
    const page = Number(searchParams.get('page') || '1')
    const size = Number(searchParams.get('size') || '20')
    const keyword = searchParams.get('keyword') || ''
    const status = searchParams.get('status') || ''
    const startTime = searchParams.get('startTime') || ''
    const endTime = searchParams.get('endTime') || ''

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

    const start = (page - 1) * size
    const end = start + size
    const records = filtered.slice(start, end)

    return ok({
      records,
      total: filtered.length,
      current: page,
      size,
    })
  }),

  // 导出必须在 /:id 之前注册
  http.get('/api/system/operation-log/export', () => {
    const csv = toCsv(operationLogs, [
      'username', 'module', 'operation', 'method', 'ip', 'location', 'time', 'status', 'errorMsg', 'operationTime',
    ])
    return ok(csv)
  }),

  // 清空必须在 /:id 之前注册
  http.delete('/api/system/operation-log/clear', () => {
    operationLogs.length = 0
    return ok(true)
  }),

  http.get('/api/system/operation-log/:id', ({ params }) => {
    const item = operationLogs.find((d) => d.id === params.id)
    if (!item) {
      return fail(-1, '数据不存在')
    }
    return ok(item)
  }),

  http.delete('/api/system/operation-log/:id', ({ params }) => {
    const index = operationLogs.findIndex((d) => d.id === params.id)
    if (index === -1) {
      return fail(-1, '数据不存在')
    }
    operationLogs.splice(index, 1)
    return ok(true)
  }),

  http.delete('/api/system/operation-log', async ({ request }) => {
    const body = (await request.json()) as { ids: string[] }
    const { ids } = body
    ids.forEach((id: string) => {
      const index = operationLogs.findIndex((d) => d.id === id)
      if (index !== -1) {
        operationLogs.splice(index, 1)
      }
    })
    return ok(true)
  }),
]
