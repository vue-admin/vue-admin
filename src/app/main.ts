import { createApp } from 'vue'
import { createPinia } from 'pinia'
import ElementPlus from 'element-plus'
import App from './App.vue'
import router from '@/router'
import * as ElementPlusIconsVue from '@element-plus/icons-vue'
import locale from 'element-plus/es/locale/lang/zh-cn'
import { defaultMonitor } from '@/lib/error/monitor'
import { vPermission } from '@/app/directives/permission'
import { installGuards } from '@/lib/router/guards'

import 'element-plus/dist/index.css'
import 'element-plus/theme-chalk/dark/css-vars.css'
import '@/assets/main.scss'

const app = createApp(App)
for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
  app.component(key, component)
}
app.use(ElementPlus, { locale: locale })
app.use(createPinia())

// 注册权限指令（v-permission）
app.directive('permission', vPermission)

// 安装 4 步全局守卫（必须在 app.use(router) 之前）
installGuards(router)

app.use(router)

// 全局 provide monitor（依赖注入，便于替换 Sentry 等）
app.provide('monitor', defaultMonitor)

app.mount('#app')
