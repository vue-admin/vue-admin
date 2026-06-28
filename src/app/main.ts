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

// 主题色 CSS 变量：监听 layout store.primaryColor，设置 --el-color-primary
// 派生色（light-3/5/7/9, dark-2）由 Element Plus 内部使用，简化版仅设主色
// 如需完整派生色，可引入 element-plus/es/utils/color 的 mixColor 工具
const layoutStore = useLayoutStore()
watch(
  () => layoutStore.primaryColor,
  (color) => {
    document.documentElement.style.setProperty('--el-color-primary', color)
  },
  { immediate: true }
)

app.mount('#app')
