import { test, expect } from '@playwright/test'

test('未登录访问根路径 → 跳转 /login', async ({ page }) => {
  await page.goto('/')
  await expect(page).toHaveURL(/\/login/)
  // Login.vue 用 el-form-item label="用户名" 包裹 el-input，而非 placeholder
  await expect(page.getByText('用户名', { exact: true })).toBeVisible()
})

test.describe.serial('登录态流程', () => {
  test('admin 登录 → 进入首页 + 侧边栏可见', async ({ page }) => {
    // dev 模式 vite base 为 ''，baseURL = http://localhost:5173/，直接用相对路径
    await page.goto('login')
    // Login.vue 用 el-form-item label 文字作为 input 的 accessible name（aria-labelledby），
    // 不存在原生 <label for>，getByLabel 无效；但 getByRole('textbox', { name }) 可识别
    await page.getByRole('textbox', { name: '用户名' }).fill('admin')
    await page.getByRole('textbox', { name: '密码' }).fill('123456')
    await page.getByRole('button', { name: '登录' }).click()
    // 登录成功后 router.push('/')，URL 为根路径
    await expect(page).toHaveURL(/\/(\?.*)?$/)
    // 侧边栏菜单渲染（layout 中 el-menu 组件）
    await expect(page.locator('.el-menu').first()).toBeVisible()
  })

  test('登录后访问 user 列表 → 表格渲染', async ({ page }) => {
    // 复用登录态：serial 模式下顺序执行；每个 test 重新登录保证隔离
    await page.goto('login')
    await page.getByRole('textbox', { name: '用户名' }).fill('admin')
    await page.getByRole('textbox', { name: '密码' }).fill('123456')
    await page.getByRole('button', { name: '登录' }).click()
    await expect(page).toHaveURL(/\/(\?.*)?$/)
    // 路由现状：/system/user（Task 7 完成 user 模块合并入 system/user，遵循 system 子项无 /list 后缀风格）
    await page.goto('system/user')
    await expect(page.locator('.el-table').first()).toBeVisible()
  })
})
