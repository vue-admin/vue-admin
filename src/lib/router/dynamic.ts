import type { Router, RouteRecordRaw } from 'vue-router'
import type { MenuDTO } from './types-menu'
import type { Monitor } from '@/lib/error/types'

// 收集所有业务页面模块（懒加载）；生产环境通过 import.meta.glob 注入
const modules = import.meta.glob('@/modules/**/*.vue')

// glob 类型：path -> 异步 loader
export type ModuleGlob = Record<string, () => Promise<unknown>>

export function registerDynamicRoutes(
  router: Router,
  menus: MenuDTO[],
  monitor: Monitor,
  glob: ModuleGlob = modules as ModuleGlob,
): void {
  const walk = (list: MenuDTO[]): void => {
    for (const m of list) {
      if (m.children?.length) {
        walk(m.children)
        continue
      }
      if (!m.component) continue
      const key = `/src/modules/${m.component}.vue`
      const loader = glob[key]
      if (!loader) {
        monitor.captureMessage(`[router] 路由组件缺失: ${key}`, 'error')
        continue
      }
      // vue-router 4.6 RouteRecordRaw 联合体中 RouteRecordSingleViewWithChildren 要求 children，
      // 此处仅注册叶子节点，断言为整个 RouteRecordRaw 以避开联合成员推断歧义。
      const route = {
        path: m.path,
        name: m.name,
        component: loader,
        meta: { ...(m.meta ?? {}) },
      } as unknown as RouteRecordRaw
      router.addRoute('layout', route)
    }
  }
  walk(menus)
}
