import service from '@/apis/client/service'

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

// 获取权限列表
export const fetchPermissionList = (params: PermissionSearchRequest) => {
  return service.get<{
    records: PermissionInfo[]
    total: number
    current: number
    size: number
  }>('/api/permission/list', params)
}

// 获取权限详情
export const fetchPermissionDetail = (id: string) => {
  return service.get<PermissionInfo>(`/api/permission/detail/${id}`)
}

// 创建权限
export const createPermission = (data: PermissionCreateRequest) => {
  return service.post<PermissionInfo>('/api/permission/create', data)
}

// 更新权限
export const updatePermission = (id: string, data: Partial<PermissionCreateRequest>) => {
  return service.put<PermissionInfo>(`/api/permission/update/${id}`, data)
}

// 删除权限
export const deletePermission = (id: string) => {
  return service.delete<boolean>(`/api/permission/delete/${id}`)
}

// 批量删除权限
export const batchDeletePermissions = (ids: string[]) => {
  return service.post<boolean>('/api/permission/batch-delete', { ids })
}

// 导出权限列表
export const exportPermissions = () => {
  return service.get<string>('/api/permission/export')
}

// 获取所有权限（用于角色权限配置）
export const fetchAllPermissions = () => {
  return service.get<PermissionInfo[]>('/api/permission/all')
}

// 获取角色权限
export const fetchRolePermissions = (roleId: string) => {
  return service.get<string[]>(`/api/role/permissions/${roleId}`)
}

// 设置角色权限
export const setRolePermissions = (roleId: string, permissions: string[]) => {
  return service.post<boolean>(`/api/role/permissions/${roleId}`, { permissions })
}