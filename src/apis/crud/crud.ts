import service from '@/apis/client/service'

export interface CrudListRequest {
  userId: string
}

export interface CrudListResponse {
  name: string
  path: string
  component?: string
  meta?: Map<string, string> | undefined
}

export const lists = (req: CrudListRequest) => {
  return service.get<CrudListResponse[]>('/api/crud/lists', req, {
    silent: false
  })
}
