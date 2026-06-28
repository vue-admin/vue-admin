// system/role 领域 API。
// 迁移自 src/apis/role/index.ts。
// 统一走 @/lib/http/client 的 api 辅助函数（已解包 data）。
import { api } from '@/lib/http/client'

// 定义角色类型
export interface RoleInfo {
  id: string
  name: string
  code: string
  description: string
  status: 'active' | 'inactive'
  createTime: string
  updateTime: string
}

// 搜索参数类型
export interface RoleSearchRequest {
  keyword: string
  status: string
  page: number
  size: number
}

// 创建角色参数类型
export interface RoleCreateRequest {
  name: string
  code: string
  description?: string
  status: 'active' | 'inactive'
}

// 角色列表响应
export interface RoleSearchResponse {
  records: RoleInfo[]
  total: number
  current: number
  size: number
}

// 获取角色列表
export const fetchRoleList = (params: RoleSearchRequest) =>
  api.get<RoleSearchResponse>('/api/role/list', { params })

// 获取角色详情
export const fetchRoleDetail = (id: string) =>
  api.get<RoleInfo>(`/api/role/detail/${id}`)

// 创建角色
export const createRole = (data: RoleCreateRequest) =>
  api.post<RoleInfo>('/api/role/create', data)

// 更新角色
export const updateRole = (id: string, data: Partial<RoleCreateRequest>) =>
  api.put<RoleInfo>(`/api/role/update/${id}`, data)

// 删除角色
export const deleteRole = (id: string) =>
  api.del<boolean>(`/api/role/delete/${id}`)

// 批量删除角色
export const batchDeleteRoles = (ids: string[]) =>
  api.post<boolean>('/api/role/batch-delete', { ids })

// 导出角色列表
export const exportRoles = () =>
  api.get<string>('/api/role/export')

// 获取角色权限
export const fetchRolePermissions = (roleId: string) =>
  api.get<string[]>(`/api/role/permissions/${roleId}`)

// 设置角色权限
export const setRolePermissions = (roleId: string, permissions: string[]) =>
  api.post<boolean>(`/api/role/permissions/${roleId}`, { permissions })
