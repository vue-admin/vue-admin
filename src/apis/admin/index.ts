import service from '@/apis/client/service'

// 定义管理员类型
export interface AdminInfo {
  id: string
  username: string
  realName: string
  email: string
  phone: string
  role: 'super' | 'admin'
  status: 'active' | 'inactive'
  avatar: string
  createTime: string
  lastLoginTime: string
  loginCount: number
}

// 搜索参数类型
export interface AdminSearchRequest {
  keyword: string
  role: string
  status: string
  page: number
  size: number
}

// 创建管理员参数类型
export interface AdminCreateRequest {
  username: string
  realName: string
  email: string
  phone: string
  role: 'super' | 'admin'
  status: 'active' | 'inactive'
  password?: string
  confirmPassword?: string
}

// 获取管理员列表
export const fetchAdminList = (params: AdminSearchRequest) => {
  return service.get<{
    records: AdminInfo[]
    total: number
    current: number
    size: number
  }>('/api/admin/list', params)
}

// 获取管理员详情
export const fetchAdminDetail = (id: string) => {
  return service.get<AdminInfo>(`/api/admin/detail/${id}`)
}

// 创建管理员
export const createAdmin = (data: AdminCreateRequest) => {
  return service.post<AdminInfo>('/api/admin/create', data)
}

// 更新管理员
export const updateAdmin = (id: string, data: Partial<AdminCreateRequest>) => {
  return service.put<AdminInfo>(`/api/admin/update/${id}`, data)
}

// 删除管理员
export const deleteAdmin = (id: string) => {
  return service.delete<boolean>(`/api/admin/delete/${id}`)
}

// 批量删除管理员
export const batchDeleteAdmins = (ids: string[]) => {
  return service.post<boolean>('/api/admin/batch-delete', { ids })
}

// 导出管理员列表
export const exportAdmins = () => {
  return service.get<string>('/api/admin/export')
}
