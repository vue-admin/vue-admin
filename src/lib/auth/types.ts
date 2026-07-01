// 认证相关类型

export interface LoginRequest {
  username: string
  password: string
}

export interface AuthResult {
  accessToken: string
  refreshToken?: string
  expiresIn?: number // 秒
}

export interface UserProfile {
  id: string | number
  username: string
  nickname?: string
  avatar?: string
  roles: string[]
  permissions: string[]
}
