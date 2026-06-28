// system/admin 领域 API。
// 迁移自 src/apis/admin/index.ts。
// 统一走 @/lib/http/client 的 api 辅助函数（已解包 data）。
import { api } from '@/lib/http/client'

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

// 管理员列表响应
export interface AdminSearchResponse {
  records: AdminInfo[]
  total: number
  current: number
  size: number
}

// 获取管理员列表
export const fetchAdminList = (params: AdminSearchRequest) =>
  api.get<AdminSearchResponse>('/api/admin/list', { params })

// 获取管理员详情
export const fetchAdminDetail = (id: string) =>
  api.get<AdminInfo>(`/api/admin/detail/${id}`)

// 创建管理员
export const createAdmin = (data: AdminCreateRequest) =>
  api.post<AdminInfo>('/api/admin/create', data)

// 更新管理员
export const updateAdmin = (id: string, data: Partial<AdminCreateRequest>) =>
  api.put<AdminInfo>(`/api/admin/update/${id}`, data)

// 删除管理员
export const deleteAdmin = (id: string) =>
  api.del<boolean>(`/api/admin/delete/${id}`)

// 批量删除管理员
export const batchDeleteAdmins = (ids: string[]) =>
  api.post<boolean>('/api/admin/batch-delete', { ids })

// 导出管理员列表
export const exportAdmins = () =>
  api.get<string>('/api/admin/export')
