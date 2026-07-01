import { http } from 'msw'
import { ok, fail } from './_utils'

interface CrudRecord {
  id: string
  date: string
  name: string
  province: string
  city: string
  address: string
  zip: number
}

let crudList: CrudRecord[] = [
  {
    id: '1',
    date: '2016-05-02',
    name: '王小虎',
    province: '上海',
    city: '普陀区',
    address: '上海市普陀区金沙江路 1518 弄',
    zip: 200333
  },
  {
    id: '2',
    date: '2016-05-04',
    name: '王小虎',
    province: '上海',
    city: '普陀区',
    address: '上海市普陀区金沙江路 1517 弄',
    zip: 200333
  },
  {
    id: '3',
    date: '2016-05-01',
    name: '王小虎',
    province: '上海',
    city: '普陀区',
    address: '上海市普陀区金沙江路 1519 弄',
    zip: 200333
  },
  {
    id: '4',
    date: '2016-05-03',
    name: '王小虎',
    province: '上海',
    city: '普陀区',
    address: '上海市普陀区金沙江路 1516 弄',
    zip: 200333
  }
]

export const crudHandlers = [
  // GET /api/crud?current=1&size=10 - 列表（也兼容 ?id= 查询单条）
  http.get('/api/crud', ({ request }) => {
    const searchParams = new URL(request.url).searchParams
    const id = searchParams.get('id')

    // GET /api/crud?id=xxx 查询单条
    if (id) {
      const record = crudList.find((item) => item.id === id)
      return record ? ok(record) : fail(404, '记录不存在')
    }

    // 列表：支持 name 过滤 + current/size 分页
    const current = Number(searchParams.get('current') || '1')
    const size = Number(searchParams.get('size') || '10')
    const name = searchParams.get('name') || ''

    let filtered = crudList
    if (name) {
      const kw = String(name).toLowerCase()
      filtered = filtered.filter((item) => item.name.toLowerCase().includes(kw))
    }

    const start = (current - 1) * size
    const end = start + size

    return ok({
      records: filtered.slice(start, end),
      total: filtered.length,
      current,
      size
    })
  }),

  // GET /api/crud/:id - 详情（path param）
  http.get('/api/crud/:id', ({ params }) => {
    const id = params.id as string
    const record = crudList.find((item) => item.id === id)
    return record ? ok(record) : fail(404, '记录不存在')
  }),

  // POST /api/crud - 创建
  http.post('/api/crud', async ({ request }) => {
    const body = (await request.json()) as Omit<CrudRecord, 'id'>
    const id = `${Date.now()}`
    const record = {
      ...body,
      id
    } as CrudRecord
    crudList = [record, ...crudList]
    return ok(record)
  }),

  // PUT /api/crud/:id - 更新
  http.put('/api/crud/:id', async ({ request, params }) => {
    const id = params.id as string
    if (!id) return fail(404, '缺少记录ID')

    const index = crudList.findIndex((item) => item.id === id)
    if (index === -1) {
      return fail(404, '记录不存在')
    }

    const body = (await request.json()) as Partial<CrudRecord>
    crudList[index] = {
      ...crudList[index],
      ...body
    }
    return ok(crudList[index])
  }),

  // DELETE /api/crud/:id - 单条删除
  http.delete('/api/crud/:id', ({ params }) => {
    const id = params.id as string
    if (!id) return fail(404, '缺少记录ID')

    const before = crudList.length
    crudList = crudList.filter((item) => item.id !== id)
    return crudList.length < before ? ok(true) : fail(404, '记录不存在')
  }),

  // DELETE /api/crud + body.ids - 批量删除
  http.delete('/api/crud', async ({ request }) => {
    const body = (await request.json()) as { ids?: string[] }
    const { ids } = body || {}

    if (!Array.isArray(ids) || ids.length === 0) {
      return fail(404, 'ids 不能为空')
    }

    const idSet = new Set(ids)
    const before = crudList.length
    crudList = crudList.filter((item) => !idSet.has(item.id))
    return ok(before - crudList.length)
  })
]
