import service from '@/apis/client/service'

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

export const fetchCrud = (req: CrudListRequest) => {
  return service.get<CrudListResponse>('/api/crud', req, {
    silent: false
  })
}

export const fetchCrudDetail = (req: CrudDetailRequest) => {
  return service.get<item>('/api/crud/detail', req, {
    silent: false
  })
}

export const createCrudItem = (payload: CrudCreatePayload) => {
  return service.post<item>('/api/crud', payload, {
    silent: false
  })
}

export const updateCrudItem = (payload: CrudUpdatePayload) => {
  return service.put<item>('/api/crud', payload, {
    silent: false
  })
}
