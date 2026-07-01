import { defineConfig } from 'vitest/config'
import vue from '@vitejs/plugin-vue'
import path from 'node:path'

export default defineConfig({
  plugins: [vue()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./test/setup.ts'],
    // 覆盖 vitest 默认 exclude（默认还含 cypress/.{idea,git}/** 等）
    // 关键：显式排除 test/smoke/**，避免 pnpm test 误抓 smoke 用例
    // （smoke 用例依赖 dev server，应在 pnpm smoke 中通过 playwright 跑）
    exclude: ['**/node_modules/**', '**/dist/**', 'test/smoke/**'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov', 'html'],
      reportsDirectory: './coverage'
    }
  },
  resolve: {
    alias: { '@': path.resolve(__dirname, './src') }
  }
})
