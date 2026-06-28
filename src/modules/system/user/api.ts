// system/user 领域 API。
// 迁移自 src/apis/user/index.ts + src/apis/user/info.ts。
// 统一走 @/lib/http/client 的 api 辅助函数（已解包 data）。
import { api } from '@/lib/http/client'

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
export const fetchUserList = (params: UserSearchRequest) =>
  api.get<UserSearchResponse>('/api/user/list', { params })

// 获取用户详情
export const fetchUserDetail = (id: string) =>
  api.get<UserInfo>(`/api/user/detail/${id}`)

// 创建用户
export const createUser = (data: UserCreateRequest) =>
  api.post<UserInfo>('/api/user/create', data)

// 更新用户
export const updateUser = (id: string, data: UserCreateRequest) =>
  api.put<UserInfo>(`/api/user/update/${id}`, data)

// 删除用户
export const deleteUser = (id: string) =>
  api.del<boolean>(`/api/user/delete/${id}`)

// 批量删除用户
export const batchDeleteUsers = (ids: string[]) =>
  api.post<boolean>('/api/user/batch-delete', { ids })

// 导出用户列表
export const exportUsers = (params: UserSearchRequest) =>
  api.get<Blob>('/api/user/export', { params, responseType: 'blob' })

// 合并自 src/apis/user/info.ts：菜单接口
export interface MenusRequest {
  userId: string
}

export interface menuItemData {
  name: string
  path: string
  component?: string
  meta?: Map<string, string> | undefined
  children?: menuItemData[]
}

// 获取当前用户菜单
export const fetchMenus = (req: MenusRequest) =>
  api.get<menuItemData[]>('/api/system/menus', { params: req })
