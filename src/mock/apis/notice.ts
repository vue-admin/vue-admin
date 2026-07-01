// notice mock API
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

// 格式化为 yyyy-MM-dd HH:mm:ss
function fmt(ts: number): string {
  const d = new Date(ts)
  const p = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`
}

const DAY = 24 * 60 * 60 * 1000
const NOW = Date.now()

const noticeList: any[] = []

// 按类型分设标题池，使 type 与标题语义一致（避免"...通知"被分到公告/待办）
const titlesByType: Record<string, string[]> = {
  announcement: [
    '关于系统升级维护的公告',
    '安全漏洞修复公告',
    '服务器迁移公告',
    '考勤制度调整公告',
    '年度信息安全合规公告',
  ],
  notice: [
    '季度绩效考核通知',
    '月度例会通知',
    '财务报销流程更新通知',
    '安全生产培训通知',
    '节假日值班安排通知',
  ],
  todo: [
    '新员工入职培训安排',
    '年度团建活动安排',
    '合同审批待办',
    '季度报表填写待办',
    '权限申请待审核',
  ],
}
const typeKeys = Object.keys(titlesByType)

for (let i = 1; i <= 30; i++) {
  const base = Mock.mock({
    content: '@cparagraph(3, 5)',
    publisher: '@cname',
  })
  // 创建时间锚定最近 60 天内，update/publish/expire 依此推导，保证逻辑自洽
  const createTime = NOW - Math.floor(Math.random() * 60) * DAY - Math.floor(Math.random() * DAY)
  const updateTime = createTime + Math.floor(Math.random() * (NOW - createTime || DAY))
  // type 按 i%3 轮询保证三类均衡（每类约 10 条），status/priority 独立随机（不与 type 耦合）
  const type = typeKeys[i % typeKeys.length]
  const title = titlesByType[type][Math.floor(Math.random() * titlesByType[type].length)]
  const status = ['published', 'draft', 'expired'][Math.floor(Math.random() * 3)]
  const priority = ['high', 'medium', 'low'][Math.floor(Math.random() * 3)]

  // 发布时间介于创建时间与现在之间；过期时间在发布时间之后
  const publishTime =
    status === 'published' || status === 'expired'
      ? createTime + Math.floor(Math.random() * (NOW - createTime || DAY))
      : null
  const expireTime =
    status === 'expired' && publishTime != null
      ? publishTime + Math.floor(Math.random() * 30 + 1) * DAY
      : null

  noticeList.push({
    id: `notice-${i}`,
    title: title,
    content: base.content,
    type,
    status,
    priority,
    publishTime: publishTime != null ? fmt(publishTime) : null,
    expireTime: expireTime != null ? fmt(expireTime) : null,
    publisher: base.publisher,
    createTime: fmt(createTime),
    updateTime: fmt(updateTime),
  })
}

export default [
  {
    url: '/api/system/notice',
    method: 'GET',
    response: ({ query }: { query: Record<string, string> }) => {
      const { page = 1, size = 20, keyword = '', type = '', status = '' } = query

      let filtered = [...noticeList]

      if (keyword) {
        const kw = keyword.toLowerCase()
        filtered = filtered.filter(
          (item) =>
            item.title.toLowerCase().includes(kw) ||
            item.content.toLowerCase().includes(kw),
        )
      }

      if (type) {
        filtered = filtered.filter((item) => item.type === type)
      }

      if (status) {
        filtered = filtered.filter((item) => item.status === status)
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
    url: '/api/system/notice/:id',
    method: 'GET',
    response: ({ params }: { params: Record<string, string> }) => {
      const item = noticeList.find((d) => d.id === params.id)
      if (!item) {
        return { code: -1, data: null, msg: '数据不存在' }
      }
      return { code: 0, data: item, msg: 'success' }
    },
  },
  {
    url: '/api/system/notice',
    method: 'POST',
    response: ({ body }: { body: Record<string, unknown> }) => {
      const newItem = {
        id: Mock.Random.guid(),
        ...body,
        publisher: '当前用户',
        createTime: new Date().toISOString().slice(0, 19).replace('T', ' '),
        updateTime: new Date().toISOString().slice(0, 19).replace('T', ' '),
      }
      noticeList.unshift(newItem)
      return { code: 0, data: newItem, msg: 'success' }
    },
  },
  {
    url: '/api/system/notice/:id',
    method: 'PUT',
    response: ({ params, body }: { params: Record<string, string>; body: Record<string, unknown> }) => {
      const index = noticeList.findIndex((d) => d.id === params.id)
      if (index === -1) {
        return { code: -1, data: null, msg: '数据不存在' }
      }
      noticeList[index] = {
        ...noticeList[index],
        ...body,
        updateTime: new Date().toISOString().slice(0, 19).replace('T', ' '),
      }
      return { code: 0, data: noticeList[index], msg: 'success' }
    },
  },
  {
    url: '/api/system/notice/:id',
    method: 'DELETE',
    response: ({ params }: { params: Record<string, string> }) => {
      const index = noticeList.findIndex((d) => d.id === params.id)
      if (index === -1) {
        return { code: -1, data: false, msg: '数据不存在' }
      }
      noticeList.splice(index, 1)
      return { code: 0, data: true, msg: 'success' }
    },
  },
  {
    url: '/api/system/notice',
    method: 'DELETE',
    response: ({ body }: { body: { ids: string[] } }) => {
      const { ids } = body
      ids.forEach((id) => {
        const index = noticeList.findIndex((d) => d.id === id)
        if (index !== -1) {
          noticeList.splice(index, 1)
        }
      })
      return { code: 0, data: true, msg: 'success' }
    },
  },
  {
    url: '/api/system/notice/:id/publish',
    method: 'POST',
    response: ({ params }: { params: Record<string, string> }) => {
      const index = noticeList.findIndex((d) => d.id === params.id)
      if (index === -1) {
        return { code: -1, data: false, msg: '数据不存在' }
      }
      noticeList[index].status = 'published'
      noticeList[index].publishTime = new Date().toISOString().slice(0, 19).replace('T', ' ')
      return { code: 0, data: noticeList[index], msg: 'success' }
    },
  },
  {
    url: '/api/system/notice/:id/revoke',
    method: 'POST',
    response: ({ params }: { params: Record<string, string> }) => {
      const index = noticeList.findIndex((d) => d.id === params.id)
      if (index === -1) {
        return { code: -1, data: false, msg: '数据不存在' }
      }
      noticeList[index].status = 'draft'
      return { code: 0, data: noticeList[index], msg: 'success' }
    },
  },
  {
    url: '/api/system/notice/export',
    method: 'GET',
    response: () => {
      const csv = toCsv(noticeList, [
        'title', 'type', 'priority', 'status', 'publisher', 'publishTime', 'createTime',
      ])
      return { code: 0, data: csv, msg: 'success' }
    },
  },
]
