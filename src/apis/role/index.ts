import service from '@/apis/client/service'

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

// 获取角色列表
export const fetchRoleList = (params: RoleSearchRequest) => {
  return service.get<{
    records: RoleInfo[]
    total: number
    current: number
    size: number
  }>('/api/role/list', params)
}

// 获取角色详情
export const fetchRoleDetail = (id: string) => {
  return service.get<RoleInfo>(`/api/role/detail/${id}`)
}

// 创建角色
export const createRole = (data: RoleCreateRequest) => {
  return service.post<RoleInfo>('/api/role/create', data)
}

// 更新角色
export const updateRole = (id: string, data: Partial<RoleCreateRequest>) => {
  return service.put<RoleInfo>(`/api/role/update/${id}`, data)
}

// 删除角色
export const deleteRole = (id: string) => {
  return service.delete<boolean>(`/api/role/delete/${id}`)
}

// 批量删除角色
export const batchDeleteRoles = (ids: string[]) => {
  return service.post<boolean>('/api/role/batch-delete', { ids })
}

// 导出角色列表
export const exportRoles = () => {
  return service.get<string>('/api/role/export')
}

// 获取角色权限
export const fetchRolePermissions = (roleId: string) => {
  return service.get<string[]>(`/api/role/permissions/${roleId}`)
}

// 设置角色权限
export const setRolePermissions = (roleId: string, permissions: string[]) => {
  return service.post<boolean>(`/api/role/permissions/${roleId}`, { permissions })
}