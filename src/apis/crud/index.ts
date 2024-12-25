import service from '@/apis/client/service'

export interface crudListRequest {
  name: string
}

export interface crudListResponse {
  records: item[]
  total: number
  current: number
  size: number
}

export interface item {
  date: string
  name: string
  province: string
  city: string
  address: string
  zip: number
}

export const fetchCrud = (req: crudListRequest) => {
  return service.get<crudListResponse>('/api/crud', req, {
    silent: false
  })
}
