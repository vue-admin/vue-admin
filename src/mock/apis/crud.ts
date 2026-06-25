import type { MockMethod } from 'vite-plugin-mock'
import { success, sendProblem } from '../_helpers'

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
    response: (req, res) => {
      const { id } = req.query || {}
      const record = crudList.find((item) => item.id === id)
      if (!record) {
        sendProblem(res, { status: 404, title: 'Not Found', detail: '记录不存在' })
        return
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
    response: (req, res) => {
      const { body } = req
      if (!body?.id) {
        sendProblem(res, { status: 404, title: 'Not Found', detail: '缺少记录ID' })
        return
      }
      const index = crudList.findIndex((item) => item.id === body.id)
      if (index === -1) {
        sendProblem(res, { status: 404, title: 'Not Found', detail: '记录不存在' })
        return
      }
      crudList[index] = {
        ...crudList[index],
        ...body
      }
      return success(crudList[index])
    }
  },
  {
    url: '/api/crud/delete',
    method: 'post',
    response: (req, res) => {
      const { id } = req.body || {}
      if (!id) {
        sendProblem(res, { status: 404, title: 'Not Found', detail: '缺少记录ID' })
        return
      }
      const before = crudList.length
      crudList = crudList.filter((item) => item.id !== id)
      if (crudList.length === before) {
        sendProblem(res, { status: 404, title: 'Not Found', detail: '记录不存在' })
        return
      }
      return success(true)
    }
  },
  {
    url: '/api/crud/batch-delete',
    method: 'post',
    response: (req, res) => {
      const { ids } = req.body || {}
      if (!Array.isArray(ids) || ids.length === 0) {
        sendProblem(res, { status: 404, title: 'Not Found', detail: 'ids 不能为空' })
        return
      }
      const idSet = new Set(ids)
      const before = crudList.length
      crudList = crudList.filter((item) => !idSet.has(item.id))
      return success(before - crudList.length)
    }
  }
] as MockMethod[]
