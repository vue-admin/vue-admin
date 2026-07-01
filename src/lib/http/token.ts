// Token 读取接口（避免 http ↔ auth 循环依赖）
// M3 阶段 authService 会注入真正的实现
export interface TokenReader {
  getAccessToken(): string | null
}

// 占位实现：M3 阶段被替换
export const noopTokenReader: TokenReader = {
  getAccessToken: () => null
}

// 运行时持有的 TokenReader（由 auth 模块在启动时设置）
let activeTokenReader: TokenReader = noopTokenReader

export function setTokenReader(r: TokenReader): void {
  activeTokenReader = r
}

export function getAccessToken(): string | null {
  return activeTokenReader.getAccessToken()
}
