// crud 领域 API。
// 迁移自 src/apis/crud/index.ts。
// 统一走 @/lib/http/client 的 api 辅助函数（已解包 data）。
import { api } from '@/lib/http/client'

export interface CrudListRequest {
  name: string
  current: number
  size: number
}

export interface CrudListResponse {
  records: item[]
  total: number
  current: number
  size: number
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
export type CrudUpdatePayload = Partial<item>

// 获取 crud 列表
export const fetchCrud = (req: CrudListRequest) =>
  api.get<CrudListResponse>('/api/crud', { params: req })

// 获取 crud 详情
export const fetchCrudDetail = (id: string) =>
  api.get<item>(`/api/crud/${id}`)

// 创建 crud 项
export const createCrudItem = (payload: CrudCreatePayload) =>
  api.post<item>('/api/crud', payload)

// 更新 crud 项
export const updateCrudItem = (id: string, payload: CrudUpdatePayload) =>
  api.put<item>(`/api/crud/${id}`, payload)

// 删除 crud 项
export const deleteCrudItem = (id: string) =>
  api.del<boolean>(`/api/crud/${id}`)

// 批量删除 crud 项
export const batchDeleteCrudItems = (ids: string[]) =>
  api.del<boolean>('/api/crud', { data: { ids } })
