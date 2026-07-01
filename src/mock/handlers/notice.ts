import Mock from 'mockjs'
import { http } from 'msw'
import { ok, fail, toCsv } from './_utils'

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

export const noticeHandlers = [
  // 获取公告列表
  http.get('/api/system/notice', ({ request }) => {
    const searchParams = new URL(request.url).searchParams
    const page = parseInt(searchParams.get('page') || '1')
    const size = parseInt(searchParams.get('size') || '20')
    const keyword = searchParams.get('keyword') || ''
    const type = searchParams.get('type') || ''
    const status = searchParams.get('status') || ''

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

  // 导出公告列表，必须在 /:id 之前注册
  http.get('/api/system/notice/export', () => {
    const csv = toCsv(noticeList, [
      'title', 'type', 'priority', 'status', 'publisher', 'publishTime', 'createTime',
    ])
    return ok(csv, '导出成功')
  }),

  // 获取公告详情
  http.get('/api/system/notice/:id', ({ params }) => {
    const item = noticeList.find((d) => d.id === params.id)
    if (!item) {
      return fail(-1, '数据不存在')
    }
    return ok(item)
  }),

  // 创建公告
  http.post('/api/system/notice', async ({ request }) => {
    const body = (await request.json()) as Record<string, unknown>
    const newItem = {
      id: Mock.Random.guid(),
      ...body,
      publisher: '当前用户',
      createTime: new Date().toISOString().slice(0, 19).replace('T', ' '),
      updateTime: new Date().toISOString().slice(0, 19).replace('T', ' '),
    }
    noticeList.unshift(newItem)
    return ok(newItem, '创建成功')
  }),

  // 更新公告
  http.put('/api/system/notice/:id', async ({ request, params }) => {
    const index = noticeList.findIndex((d) => d.id === params.id)
    if (index === -1) {
      return fail(-1, '数据不存在')
    }
    const body = (await request.json()) as Record<string, unknown>
    noticeList[index] = {
      ...noticeList[index],
      ...body,
      updateTime: new Date().toISOString().slice(0, 19).replace('T', ' '),
    }
    return ok(noticeList[index], '更新成功')
  }),

  // 删除公告
  http.delete('/api/system/notice/:id', ({ params }) => {
    const index = noticeList.findIndex((d) => d.id === params.id)
    if (index === -1) {
      return fail(-1, '数据不存在')
    }
    noticeList.splice(index, 1)
    return ok(true, '删除成功')
  }),

  // 批量删除公告
  http.delete('/api/system/notice', async ({ request }) => {
    const body = (await request.json()) as { ids: string[] }
    const { ids } = body
    ids.forEach((id) => {
      const index = noticeList.findIndex((d) => d.id === id)
      if (index !== -1) {
        noticeList.splice(index, 1)
      }
    })
    return ok(true, '删除成功')
  }),

  // 发布公告
  http.post('/api/system/notice/:id/publish', ({ params }) => {
    const index = noticeList.findIndex((d) => d.id === params.id)
    if (index === -1) {
      return fail(-1, '数据不存在')
    }
    noticeList[index].status = 'published'
    noticeList[index].publishTime = new Date().toISOString().slice(0, 19).replace('T', ' ')
    return ok(noticeList[index], '发布成功')
  }),

  // 撤回公告
  http.post('/api/system/notice/:id/revoke', ({ params }) => {
    const index = noticeList.findIndex((d) => d.id === params.id)
    if (index === -1) {
      return fail(-1, '数据不存在')
    }
    noticeList[index].status = 'draft'
    return ok(noticeList[index], '撤回成功')
  })
]
