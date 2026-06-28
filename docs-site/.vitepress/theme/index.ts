import DefaultTheme from 'vitepress/theme'
import ElementPlus from 'element-plus'
import { applyPrimaryColor } from '../../../src/lib/theme/colors'

import 'element-plus/dist/index.css'
import 'element-plus/theme-chalk/dark/css-vars.css'
import './styles.css'

export default {
  extends: DefaultTheme,
  enhanceApp(ctx) {
    ctx.app.use(ElementPlus)
    if (typeof document !== 'undefined') {
      applyPrimaryColor('#409EFF')
    }
  },
}
