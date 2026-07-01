import DefaultTheme from 'vitepress/theme'
import { h, provide, getCurrentInstance } from 'vue'
import ElementPlus, {
  ElConfigProvider,
  ID_INJECTION_KEY,
  ZINDEX_INJECTION_KEY
} from 'element-plus'
import { applyPrimaryColor } from '../../../src/lib/theme/colors'
// 仅 import 触发 lib/i18n 单例创建即可；组件用全局 t（import），无需 app.use(i18n)
import '../../../src/lib/i18n'

import 'element-plus/dist/index.css'
import 'element-plus/theme-chalk/dark/css-vars.css'
import './styles.css'

// SSR 下 EP 组件（el-select/el-dropdown 等）会消费 ID_INJECTION_KEY / ZINDEX_INJECTION_KEY
// 生成唯一 id 与 z-index；未注入会触发 [IdInjection]/[ZIndexInjection] 警告。
// enhanceApp 阶段 app.provide 来不及（Layout SSR 渲染更早），故在 Layout 包装组件
// 的 setup 中直接 provide，确保 SSR 与客户端都有上下文。
const EPLayout = {
  setup() {
    if (getCurrentInstance()) {
      provide(ID_INJECTION_KEY, { prefix: 1024, current: 0 })
      provide(ZINDEX_INJECTION_KEY, { current: 0 })
    }
    return () => h(ElConfigProvider, null, () => h(DefaultTheme.Layout))
  }
}

export default {
  extends: DefaultTheme,
  Layout: EPLayout,
  enhanceApp(ctx) {
    ctx.app.use(ElementPlus)
    if (typeof document !== 'undefined') {
      applyPrimaryColor('#409EFF')
    }
  }
}
