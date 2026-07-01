// dashboard mock API
import type { MockMethod } from 'vite-plugin-mock'

const now = new Date()
const fmt = (d: Date) => d.toISOString().slice(0, 10)

// 生成最近 N 天的趋势数据
function genTrend(days: number): { date: string; value: number }[] {
  const result: { date: string; value: number }[] = []
  let base = 100
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now)
    d.setDate(d.getDate() - i)
    base += Math.floor((Math.random() - 0.4) * 20)
    result.push({ date: fmt(d), value: Math.max(50, base) })
  }
  return result
}

export default [
  {
    url: '/api/dashboard/stats',
    method: 'get',
    response: ({ headers }: { headers: { authorization?: string } }) => {
      const auth = headers.authorization || ''
      const isAdmin = auth.includes('_admin_')

      if (isAdmin) {
        return {
          code: 0,
          data: {
            users: { value: 12345, trendPct: 12.5 },
            orders: { value: 5678, trendPct: 8.3 },
            revenue: { value: 987654.32, trendPct: 15.2 },
            active: { value: 234, trendPct: -3.1 }
          },
          msg: 'ok'
        }
      }

      // 普通用户：仅返回个人维度
      return {
        code: 0,
        data: {
          users: { value: 1, trendPct: 0 },
          orders: { value: 0, trendPct: 0 },
          revenue: { value: 0, trendPct: 0 },
          active: { value: 1, trendPct: 0 }
        },
        msg: 'ok'
      }
    }
  },
  {
    url: '/api/dashboard/charts',
    method: 'get',
    response: ({ query }: { query: { range?: string } }) => {
      const range = query.range || '7d'
      const days = range === '7d' ? 7 : range === '30d' ? 30 : 90
      return {
        code: 0,
        data: {
          trend: genTrend(days),
          distribution: [
            { name: '管理员', value: 5 },
            { name: '普通用户', value: 320 },
            { name: 'VIP用户', value: 45 }
          ]
        },
        msg: 'ok'
      }
    }
  },
  {
    url: '/api/dashboard/activities',
    method: 'get',
    response: () => {
      return {
        code: 0,
        data: [
          {
            id: 'act-system-update',
            title: '系统更新',
            desc: 'v1.2.0 发布，新增 12 项功能，修复 8 个问题',
            time: '2026-06-29 10:30',
            type: 'primary'
          },
          {
            id: 'act-data-stats',
            title: '数据统计',
            desc: '本月用户注册量突破 5000，订单量增长 20%',
            time: '2026-06-28 14:20',
            type: 'success'
          },
          {
            id: 'act-security-alert',
            title: '安全提醒',
            desc: '检测到 2 次异常登录尝试，已自动拦截',
            time: '2026-06-25 09:15',
            type: 'warning'
          },
          {
            id: 'act-maintenance',
            title: '系统维护',
            desc: '将于本周六 02:00 进行例行维护，预计 1 小时',
            time: '2026-06-20 16:45',
            type: 'danger'
          }
        ],
        msg: 'ok'
      }
    }
  }
] as unknown as MockMethod[]
