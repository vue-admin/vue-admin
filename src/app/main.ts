import { createApp, watch } from 'vue'
import { createPinia } from 'pinia'
import ElementPlus from 'element-plus'
import App from './App.vue'
import router from '@/router'
import * as ElementPlusIconsVue from '@element-plus/icons-vue'
import locale from 'element-plus/es/locale/lang/zh-cn'
import { defaultMonitor } from '@/lib/error/monitor'
import { installGlobalErrorHandlers } from '@/lib/error/installGlobalErrorHandlers'
import { vPermission } from '@/app/directives/permission'
import { installGuards } from '@/lib/router/guards'
import { useLayoutStore } from '@/app/stores/layout'
import { applyPrimaryColor } from '@/lib/theme/colors'
import { i18n, setLocale } from '@/lib/i18n'

import 'element-plus/dist/index.css'
import 'element-plus/theme-chalk/dark/css-vars.css'
import '@/assets/main.scss'

const app = createApp(App)
for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
  app.component(key, component)
}
app.use(ElementPlus, { locale: locale })
const pinia = createPinia()
app.use(pinia)

// 注册权限指令（v-permission）
app.directive('permission', vPermission)

// 安装 4 步全局守卫（必须在 app.use(router) 之前）
installGuards(router)

app.use(router)

// 全局 provide monitor（依赖注入，便于替换 Sentry 等）
app.provide('monitor', defaultMonitor)

// 全局错误处理器：Vue 运行时 / window.onerror / 未捕获 Promise 拒绝
installGlobalErrorHandlers(app, defaultMonitor)

// 主题色：监听 layout store.primaryColor，写入主色 + 6 阶派生色（light-3/5/7/8/9, dark-2）
// 派生色由 lib/theme/colors 按 Element Plus 官方 SCSS mix 语义在运行时生成
const layoutStore = useLayoutStore()
watch(
  () => layoutStore.primaryColor,
  (color) => {
    applyPrimaryColor(color)
  },
  { immediate: true }
)

// 国际化：注册 vue-i18n + 同步 layout store.locale
app.use(i18n)
watch(
  () => layoutStore.locale,
  (l) => {
    setLocale(l)
  },
  { immediate: true }
)

async function bootstrap() {
  const enableMock = import.meta.env.DEV || import.meta.env.VITE_ENABLE_MOCK === 'true'
  if (enableMock) {
    const { worker } = await import('@/mock/browser')
    await worker.start({
      onUnhandledRequest: 'bypass',
      serviceWorker: { url: `${import.meta.env.BASE_URL}mockServiceWorker.js` }
    })
  }
  app.mount('#app')
}
bootstrap()
