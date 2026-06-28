// crud 领域 API。
// 迁移自 src/apis/crud/index.ts。
// 统一走 @/lib/http/client 的 api 辅助函数（已解包 data）。
import { api } from '@/lib/http/client'

export interface CrudListRequest {
  name: string
}

export interface CrudListResponse {
  records: item[]
  total: number
  current: number
  size: number
}

export interface CrudDetailRequest {
  id: string | number
}

export interface item {
  id: string
  date: string
  name: string
  province?: string
  city: string
  address: string
  zip: number
}

export type CrudCreatePayload = Omit<item, 'id'>
export type CrudUpdatePayload = item

// 获取 crud 列表
export const fetchCrud = (req: CrudListRequest) =>
  api.get<CrudListResponse>('/api/crud', { params: req })

// 获取 crud 详情
export const fetchCrudDetail = (req: CrudDetailRequest) =>
  api.get<item>('/api/crud/detail', { params: req })

// 创建 crud 项
export const createCrudItem = (payload: CrudCreatePayload) =>
  api.post<item>('/api/crud', payload)

// 更新 crud 项
export const updateCrudItem = (payload: CrudUpdatePayload) =>
  api.put<item>('/api/crud', payload)

// 删除 crud 项
export const deleteCrudItem = (id: string) =>
  api.post<boolean>('/api/crud/delete', { id })

// 批量删除 crud 项
export const batchDeleteCrudItems = (ids: string[]) =>
  api.post<boolean>('/api/crud/batch-delete', { ids })
