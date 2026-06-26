import type { LoginRequest, AuthResult, UserProfile } from './types'

// 认证提供方抽象。默认 JwtAuthProvider；未来可替换为 OAuthAuthProvider
export interface AuthProvider {
  login(credentials: LoginRequest): Promise<AuthResult>
  refresh(refreshToken: string): Promise<AuthResult>
  logout(): Promise<void>
  me(): Promise<UserProfile>
}
