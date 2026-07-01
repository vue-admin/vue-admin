// 路由元信息契约（对象语法消除 any/all 歧义）
export {}

declare module 'vue-router' {
  interface RouteMeta {
    title?: string
    icon?: string
    showMenu?: boolean
    showInBreadcrumb?: boolean
    public?: boolean // 免登录（白名单）
    cache?: boolean // 参与 KeepAlive
    permissions?: {
      any?: string[]
      all?: string[]
    }
    roles?: {
      any?: string[]
      all?: string[]
    }
  }
}
