import service from '@/apis/client/service'

// 用户信息接口
export interface UserInfo {
  id: string
  username: string
  realName: string
  email: string
  phone: string
  role: 'admin' | 'user' | 'vip'
  status: 'active' | 'inactive'
  avatar: string
  createTime: string
  lastLoginTime: string
  loginCount: number
}

// 用户搜索请求接口
export interface UserSearchRequest {
  keyword?: string
  role?: string
  status?: string
  page: number
  size: number
}

// 用户搜索响应接口
export interface UserSearchResponse {
  records: UserInfo[]
  total: number
  current: number
  size: number
}

// 用户创建/更新请求接口
export interface UserCreateRequest {
  username: string
  realName: string
  email: string
  phone: string
  role: 'admin' | 'user' | 'vip'
  status: 'active' | 'inactive'
  password?: string
}

// 获取用户列表
export const fetchUserList = (params: UserSearchRequest) => {
  return service.get<UserSearchResponse>('/api/user/list', params)
}

// 获取用户详情
export const fetchUserDetail = (id: string) => {
  return service.get<UserInfo>(`/api/user/detail/${id}`)
}

// 创建用户
export const createUser = (data: UserCreateRequest) => {
  return service.post<UserInfo>('/api/user/create', data)
}

// 更新用户
export const updateUser = (id: string, data: UserCreateRequest) => {
  return service.put<UserInfo>(`/api/user/update/${id}`, data)
}

// 删除用户
export const deleteUser = (id: string) => {
  return service.delete<boolean>(`/api/user/delete/${id}`)
}

// 批量删除用户
export const batchDeleteUsers = (ids: string[]) => {
  return service.post<boolean>('/api/user/batch-delete', { ids })
}

// 导出用户列表
export const exportUsers = (params: UserSearchRequest) => {
  return service.get<Blob>('/api/user/export', params, {
    responseType: 'blob',
  })
}