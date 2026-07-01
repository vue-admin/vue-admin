import DefaultTheme from 'vitepress/theme'
import { h } from 'vue'
import ElementPlus, { ElConfigProvider } from 'element-plus'
import { applyPrimaryColor } from '../../../src/lib/theme/colors'
// 仅 import 触发 lib/i18n 单例创建即可；组件用全局 t（import），无需 app.use(i18n)
import '../../../src/lib/i18n'

import 'element-plus/dist/index.css'
import 'element-plus/theme-chalk/dark/css-vars.css'
import './styles.css'

export default {
  extends: DefaultTheme,
  // 用 ElConfigProvider 包裹 Layout，为 EP 在 SSR 下提供 z-index/id 注入上下文
  Layout: () => h(ElConfigProvider, null, () => h(DefaultTheme.Layout)),
  enhanceApp(ctx) {
    ctx.app.use(ElementPlus)
    if (typeof document !== 'undefined') {
      applyPrimaryColor('#409EFF')
    }
  }
}
