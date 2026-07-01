import type { MockMethod } from 'vite-plugin-mock'

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

const success = <T>(data: T) => ({ code: 0, data })
const notFound = (msg = '记录不存在') => ({ code: 404, msg })

// 从 URL path 中提取最后一段作为 id（vite-plugin-mock 不支持 params 但 URL 会含 full path）
function extractId(url: string): string | null {
  const parts = url.split('/')
  const id = parts.pop() || parts.pop()
  return id === 'crud' || id === '' || !id ? null : id
}

export default [
  // GET /api/crud?current=1&size=10 - 列表
  {
    url: '/api/crud',
    method: 'get',
    response: (req: {
      url: string
      query?: { id?: string; current?: number; size?: number; name?: string }
    }) => {
      // GET /api/crud/:id? 参数 id 形式（URL 路由约束不强）
      if (req.query?.id) {
        const record = crudList.find((item) => item.id === req.query!.id)
        return record ? success(record) : notFound()
      }
      // 列表：支持 name 过滤 + current/size 分页
      const { current = 1, size = 10, name = '' } = req.query || {}
      let filtered = crudList
      if (name) {
        const kw = String(name).toLowerCase()
        filtered = filtered.filter((item) => item.name.toLowerCase().includes(kw))
      }
      const start = (Number(current) - 1) * Number(size)
      const end = start + Number(size)
      return success({
        records: filtered.slice(start, end),
        total: filtered.length,
        current: Number(current),
        size: Number(size)
      })
    }
  },
  // GET /api/crud/:id - 详情（path param）
  {
    url: '/api/crud/:id',
    method: 'get',
    response: (req: { params?: { id: string } }) => {
      const id = req.params?.id
      const record = crudList.find((item) => item.id === id)
      return record ? success(record) : notFound()
    }
  },
  // POST /api/crud - 创建
  {
    url: '/api/crud',
    method: 'post',
    response: (req: { body: Omit<CrudRecord, 'id'> }) => {
      const id = `${Date.now()}`
      const record = {
        ...req.body,
        id
      } as CrudRecord
      crudList = [record, ...crudList]
      return success(record)
    }
  },
  // PUT /api/crud/:id - 更新
  {
    url: '/api/crud/:id',
    method: 'put',
    response: (req: { params?: { id: string }; body: Partial<CrudRecord> }) => {
      const id = req.params?.id
      if (!id) return notFound('缺少记录ID')
      const index = crudList.findIndex((item) => item.id === id)
      if (index === -1) {
        return notFound()
      }
      crudList[index] = {
        ...crudList[index],
        ...req.body
      }
      return success(crudList[index])
    }
  },
  // DELETE /api/crud/:id - 单条删除
  {
    url: '/api/crud/:id',
    method: 'delete',
    response: (req: { params?: { id: string } }) => {
      const id = req.params?.id
      if (!id) return notFound('缺少记录ID')
      const before = crudList.length
      crudList = crudList.filter((item) => item.id !== id)
      return crudList.length < before ? success(true) : notFound()
    }
  },
  // DELETE /api/crud + body.ids - 批量删除
  {
    url: '/api/crud',
    method: 'delete',
    response: (req: { body?: { ids?: string[] } }) => {
      const { ids } = req.body || {}
      if (!Array.isArray(ids) || ids.length === 0) {
        return notFound('ids 不能为空')
      }
      const idSet = new Set(ids)
      const before = crudList.length
      crudList = crudList.filter((item) => !idSet.has(item.id))
      return success(before - crudList.length)
    }
  }
] as MockMethod[]
