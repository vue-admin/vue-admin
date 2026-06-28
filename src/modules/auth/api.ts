// auth 领域 API 入口。
//
// 迁移自 src/apis/user/login.ts（Task 10）。该文件原本定义 fetchUsers 函数
// 调用 /api/login 返回单 token，但 M3 引入 lib/auth/authService + JwtAuthProvider
// 后，登录 / token 刷新 / 登出 / 当前用户 四端点已由 authService 完整接管
// （JwtAuthProvider 直接调用 /api/auth/login | /api/auth/refresh | /api/auth/logout
// | /api/auth/me），返回 AuthResult（accessToken + refreshToken + expiresIn）。
//
// 因此 src/apis/user/login.ts 全文为废弃代码：无任何调用点，类型签名
// （User / UserRequest / UserResponse）也与现行 AuthResult / LoginRequest 不一致。
// 本文件不保留任何业务函数，仅作为模块边界标记；登录态相关代码请直接使用：
//
//   import { authService } from '@/lib/auth/authService'
//   await authService.login(req)
//   await authService.refresh()
//   await authService.logout()
//   await authService.me()
//
// 旧 src/apis/user/login.ts 由 Task 13 统一删除。
export {}
