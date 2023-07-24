import { defineConfig } from 'vite'
import path from 'path'
import vue from '@vitejs/plugin-vue'
import vueJsx from '@vitejs/plugin-vue-jsx'
import AutoImport from 'unplugin-auto-import/vite'
import Components from 'unplugin-vue-components/vite'
import { ElementPlusResolver } from 'unplugin-vue-components/resolvers'
import { viteMockServe } from 'vite-plugin-mock'

// https://vitejs.dev/config/
export default defineConfig({
  base: process.env.NODE_ENV === 'production' ? '/vue-admin/' : '',
  server: {
    watch: { usePolling: true },
    hmr: true
  },
  plugins: [
    vue(),
    vueJsx(),
    AutoImport({
      //imports: ['vue'],
      //dts: 'src/auto-import.d.ts',
      resolvers: [ElementPlusResolver()]
    }),
    Components({
      //dts: 'src/commponents.d.ts',
      resolvers: [ElementPlusResolver()]
    }),
    viteMockServe({
      // supportTs:false,
      // logger:false,
      mockPath: './src/mock/apis', //解析路径
      enable: true,
      watchFiles: true
    })
  ],
  css: {
    // css预处理器
    preprocessorOptions: {
      scss: {
        // 引入 mixin.scss 这样就可以在全局中使用 mixin.scss中预定义的变量了
        // 给导入的路径最后加上 ;
        //additionalData: '@import "@/assets/main.scss";'
      }
    }
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src')
    },
    extensions: ['.mjs', '.js', '.ts', '.jsx', '.tsx', '.json', '.vue']
  }
})
