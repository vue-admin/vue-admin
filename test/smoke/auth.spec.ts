import { test, expect } from '@playwright/test'

test('未登录访问根路径 → 跳转 /login', async ({ page }) => {
  await page.goto('/')
  await expect(page).toHaveURL(/\/login/)
  // Login.vue 用 el-form-item label="用户名" 包裹 el-input，而非 placeholder
  await expect(page.getByText('用户名', { exact: true })).toBeVisible()
})
