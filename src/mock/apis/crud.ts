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

export default [
  {
    url: '/api/crud',
    method: 'get',
    response: (req) => {
      const { current = 1, size = 10 } = req.query || {}
      return success({
        records: crudList,
        total: crudList.length,
        current: Number(current),
        size: Number(size)
      })
    }
  },
  {
    url: '/api/crud/detail',
    method: 'get',
    response: (req) => {
      const { id } = req.query || {}
      const record = crudList.find((item) => item.id === id)
      if (!record) {
        return notFound()
      }
      return success(record)
    }
  },
  {
    url: '/api/crud',
    method: 'post',
    response: (req) => {
      const id = `${Date.now()}`
      const record = {
        ...req.body,
        id
      } as CrudRecord
      crudList = [record, ...crudList]
      return success(record)
    }
  },
  {
    url: '/api/crud',
    method: 'put',
    response: (req) => {
      const { body } = req
      if (!body?.id) {
        return notFound('缺少记录ID')
      }
      const index = crudList.findIndex((item) => item.id === body.id)
      if (index === -1) {
        return notFound()
      }
      crudList[index] = {
        ...crudList[index],
        ...body
      }
      return success(crudList[index])
    }
  }
] as MockMethod[]