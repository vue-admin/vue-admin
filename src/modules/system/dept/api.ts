// dept 领域 API。
import { api } from '@/lib/http/client'

export interface DeptInfo {
  id: string
  name: string
  parentId: string
  leader: string
  phone: string
  email: string
  sort: number
  status: 'active' | 'inactive'
  children?: DeptInfo[]
  createTime: string
  updateTime: string
}

export interface DeptSearchRequest {
  keyword: string
  status: string
}

export interface DeptCreateRequest {
  name: string
  parentId: string
  leader: string
  phone: string
  email: string
  sort: number
  status: 'active' | 'inactive'
}

// 获取部门列表（树形）
export const fetchDeptTree = (params?: DeptSearchRequest) =>
  api.get<DeptInfo[]>('/api/system/dept', { params })

// 获取部门详情
export const fetchDeptDetail = (id: string) =>
  api.get<DeptInfo>(`/api/system/dept/${id}`)

// 新增部门
export const createDept = (data: DeptCreateRequest) =>
  api.post<DeptInfo>('/api/system/dept', data)

// 更新部门
export const updateDept = (id: string, data: Partial<DeptCreateRequest>) =>
  api.put<DeptInfo>(`/api/system/dept/${id}`, data)

// 删除部门
export const deleteDept = (id: string) =>
  api.del<boolean>(`/api/system/dept/${id}`)

// 批量删除部门
export const batchDeleteDepts = (ids: string[]) =>
  api.del<boolean>('/api/system/dept', { data: { ids } })

// 导出部门
export const exportDepts = () =>
  api.get<string>('/api/system/dept/export')
