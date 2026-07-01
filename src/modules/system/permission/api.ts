// system/permission 领域 API。
// 迁移自 src/apis/permission/index.ts。
// 统一走 @/lib/http/client 的 api 辅助函数（已解包 data）。
import { api } from '@/lib/http/client'

// 定义权限类型
export interface PermissionInfo {
  id: string
  name: string
  code: string
  description: string
  module: string
  status: 'active' | 'inactive'
  createTime: string
  updateTime: string
}

// 搜索参数类型
export interface PermissionSearchRequest {
  keyword: string
  module: string
  status: string
  page: number
  size: number
}

// 创建权限参数类型
export interface PermissionCreateRequest {
  name: string
  code: string
  description?: string
  module: string
  status: 'active' | 'inactive'
}

// 权限列表响应
export interface PermissionSearchResponse {
  records: PermissionInfo[]
  total: number
  current: number
  size: number
}

// 获取权限列表
export const fetchPermissionList = (params: PermissionSearchRequest) =>
  api.get<PermissionSearchResponse>('/api/permission', { params })

// 获取权限详情
export const fetchPermissionDetail = (id: string) =>
  api.get<PermissionInfo>(`/api/permission/${id}`)

// 创建权限
export const createPermission = (data: PermissionCreateRequest) =>
  api.post<PermissionInfo>('/api/permission', data)

// 更新权限
export const updatePermission = (id: string, data: Partial<PermissionCreateRequest>) =>
  api.put<PermissionInfo>(`/api/permission/${id}`, data)

// 删除权限
export const deletePermission = (id: string) =>
  api.del<boolean>(`/api/permission/${id}`)

// 批量删除权限
export const batchDeletePermissions = (ids: string[]) =>
  api.del<boolean>('/api/permission', { data: { ids } })

// 导出权限列表
export const exportPermissions = () =>
  api.get<string>('/api/permission/export')

// 获取所有权限（用于角色权限配置）
export const fetchAllPermissions = () =>
  api.get<PermissionInfo[]>('/api/permission?all=true')
