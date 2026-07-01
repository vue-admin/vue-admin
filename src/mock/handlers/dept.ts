import Mock from 'mockjs'
import { http } from 'msw'
import { ok, fail, toCsv } from './_utils'

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

export const deptHandlers = [
  // 获取部门列表（树结构）
  http.get('/api/system/dept', ({ request }) => {
    const searchParams = new URL(request.url).searchParams
    const keyword = searchParams.get('keyword') || ''
    const status = searchParams.get('status') || ''

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

    return ok(buildTree(filtered))
  }),

  // 导出部门列表，必须在 /:id 之前注册
  http.get('/api/system/dept/export', () => {
    const csv = toCsv(deptList, [
      'name', 'leader', 'phone', 'email', 'sort', 'status', 'createTime', 'updateTime'
    ])
    return ok(csv, '导出成功')
  }),

  // 获取部门详情
  http.get('/api/system/dept/:id', ({ params }) => {
    const item = deptList.find((d) => d.id === params.id)
    if (!item) {
      return fail(-1, '数据不存在')
    }
    return ok(item)
  }),

  // 创建部门
  http.post('/api/system/dept', async ({ request }) => {
    const body = (await request.json()) as Record<string, unknown>
    const newItem = {
      id: Mock.Random.guid(),
      ...body,
      createTime: new Date().toISOString().slice(0, 19).replace('T', ' '),
      updateTime: new Date().toISOString().slice(0, 19).replace('T', ' '),
    }
    deptList.unshift(newItem)
    return ok(newItem, '创建成功')
  }),

  // 更新部门
  http.put('/api/system/dept/:id', async ({ request, params }) => {
    const index = deptList.findIndex((d) => d.id === params.id)
    if (index === -1) {
      return fail(-1, '数据不存在')
    }
    const body = (await request.json()) as Record<string, unknown>
    deptList[index] = {
      ...deptList[index],
      ...body,
      updateTime: new Date().toISOString().slice(0, 19).replace('T', ' '),
    }
    return ok(deptList[index], '更新成功')
  }),

  // 删除部门
  http.delete('/api/system/dept/:id', ({ params }) => {
    const index = deptList.findIndex((d) => d.id === params.id)
    if (index === -1) {
      return fail(-1, '数据不存在')
    }
    // 同时删除子部门
    const childrenToDelete = deptList.filter((d) => d.parentId === params.id)
    childrenToDelete.forEach((child) => {
      const childIndex = deptList.findIndex((d) => d.id === child.id)
      if (childIndex !== -1) {
        deptList.splice(childIndex, 1)
      }
    })
    deptList.splice(index, 1)
    return ok(true, '删除成功')
  }),

  // 批量删除部门
  http.delete('/api/system/dept', async ({ request }) => {
    const body = (await request.json()) as { ids: string[] }
    const { ids } = body
    ids.forEach((id) => {
      const index = deptList.findIndex((d) => d.id === id)
      if (index !== -1) {
        deptList.splice(index, 1)
      }
    })
    return ok(true, '删除成功')
  })
]
