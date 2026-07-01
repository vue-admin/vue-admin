// dept mock API
import Mock from 'mockjs'
import type { MockMethod } from 'vite-plugin-mock'

// 将对象数组转为 CSV 文本（含表头）。
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

// 锚定当前时间的格式化，避免 mockjs @datetime 生成过老日期
const DAY = 24 * 60 * 60 * 1000
function recentDate(maxDaysAgo: number): string {
  const ts = Date.now() - Math.floor(Math.random() * maxDaysAgo) * DAY
  const d = new Date(ts)
  const p = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`
}

const deptList: any[] = []

const rootDepts = ['总公司', '技术部', '市场部', '运营部', '财务部', '人事部']
const subDepts = ['研发一组', '研发二组', '测试组', '前端组', '后端组', '产品组']

rootDepts.forEach((name, index) => {
  const createTime = recentDate(180)
  deptList.push(
    Mock.mock({
      id: `dept-${index + 1}`,
      name,
      parentId: '',
      leader: '@cname',
      phone: /^1[3-9]\d{9}$/,
      email: '@email',
      sort: index + 1,
      status: 'active',
      createTime,
      updateTime: recentDate(30),
    }),
  )
})

subDepts.forEach((name, index) => {
  deptList.push(
    Mock.mock({
      id: `dept-sub-${index + 1}`,
      name,
      parentId: 'dept-2',
      leader: '@cname',
      phone: /^1[3-9]\d{9}$/,
      email: '@email',
      sort: index + 1,
      status: 'active',
      createTime: recentDate(90),
      updateTime: recentDate(30),
    }),
  )
})

function buildTree(list: any[], parentId = ''): any[] {
  return list
    .filter((item) => item.parentId === parentId)
    .map((item) => ({
      ...item,
      children: buildTree(list, item.id),
    }))
}

export default [
  {
    url: '/api/system/dept',
    method: 'GET',
    response: ({ query }: { query: Record<string, string> }) => {
      const { keyword = '', status = '' } = query

      let filtered = [...deptList]

      if (keyword) {
        const kw = keyword.toLowerCase()
        filtered = filtered.filter(
          (item) =>
            item.name.toLowerCase().includes(kw) ||
            item.leader.toLowerCase().includes(kw),
        )
      }

      if (status) {
        filtered = filtered.filter((item) => item.status === status)
      }

      // Return tree structure
      return {
        code: 0,
        data: buildTree(filtered),
        msg: 'success',
      }
    },
  },
  {
    url: '/api/system/dept/:id',
    method: 'GET',
    response: ({ params }: { params: Record<string, string> }) => {
      const item = deptList.find((d) => d.id === params.id)
      if (!item) {
        return { code: -1, data: null, msg: '数据不存在' }
      }
      return { code: 0, data: item, msg: 'success' }
    },
  },
  {
    url: '/api/system/dept',
    method: 'POST',
    response: ({ body }: { body: Record<string, unknown> }) => {
      const newItem = {
        id: Mock.Random.guid(),
        ...body,
        createTime: new Date().toISOString().slice(0, 19).replace('T', ' '),
        updateTime: new Date().toISOString().slice(0, 19).replace('T', ' '),
      }
      deptList.unshift(newItem)
      return { code: 0, data: newItem, msg: 'success' }
    },
  },
  {
    url: '/api/system/dept/:id',
    method: 'PUT',
    response: ({ params, body }: { params: Record<string, string>; body: Record<string, unknown> }) => {
      const index = deptList.findIndex((d) => d.id === params.id)
      if (index === -1) {
        return { code: -1, data: null, msg: '数据不存在' }
      }
      deptList[index] = {
        ...deptList[index],
        ...body,
        updateTime: new Date().toISOString().slice(0, 19).replace('T', ' '),
      }
      return { code: 0, data: deptList[index], msg: 'success' }
    },
  },
  {
    url: '/api/system/dept/:id',
    method: 'DELETE',
    response: ({ params }: { params: Record<string, string> }) => {
      const index = deptList.findIndex((d) => d.id === params.id)
      if (index === -1) {
        return { code: -1, data: false, msg: '数据不存在' }
      }
      // Also delete children
      const childrenToDelete = deptList.filter((d) => d.parentId === params.id)
      childrenToDelete.forEach((child) => {
        const childIndex = deptList.findIndex((d) => d.id === child.id)
        if (childIndex !== -1) {
          deptList.splice(childIndex, 1)
        }
      })
      deptList.splice(index, 1)
      return { code: 0, data: true, msg: 'success' }
    },
  },
  {
    url: '/api/system/dept',
    method: 'DELETE',
    response: ({ body }: { body: { ids: string[] } }) => {
      const { ids } = body
      ids.forEach((id) => {
        const index = deptList.findIndex((d) => d.id === id)
        if (index !== -1) {
          deptList.splice(index, 1)
        }
      })
      return { code: 0, data: true, msg: 'success' }
    },
  },
  {
    url: '/api/system/dept/export',
    method: 'GET',
    response: () => {
      const csv = toCsv(deptList, [
        'name', 'leader', 'phone', 'email', 'sort', 'status', 'createTime', 'updateTime'
      ])
      return { code: 0, data: csv, msg: 'success' }
    },
  },
]
