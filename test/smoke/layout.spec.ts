import { test, expect, type Page } from '@playwright/test'

async function login(page: Page) {
  await page.goto('login')
  await page.getByRole('textbox', { name: '用户名' }).fill('admin')
  await page.getByRole('textbox', { name: '密码' }).fill('123456')
  await page.getByRole('button', { name: '登录' }).click()
  await expect(page).toHaveURL(/\/(\?.*)?$/)
}

test.describe.serial('layout 配置', () => {
  test('SettingsDrawer 开关 TagsView', async ({ page }) => {
    await login(page)
    // 默认 TagsView 可见
    await expect(page.locator('.tags-view-container')).toBeVisible()

    // 点齿轮设置按钮打开 drawer
    await page.locator('.settings-icon').click()
    await expect(page.getByRole('heading', { name: '布局设置' })).toBeVisible()

    // 关闭 TagsView 开关
    const switchItem = page.locator('.setting-item', { hasText: '显示 TagsView' }).locator('.el-switch')
    await switchItem.click()

    // TagsView 应消失
    await expect(page.locator('.tags-view-container')).toHaveCount(0)
  })

  test('user 列表用 SearchTable 渲染', async ({ page }) => {
    await login(page)
    await page.goto('system/user')

    await expect(page.locator('.el-table').first()).toBeVisible()
    await expect(page.locator('.el-pagination').first()).toBeVisible()
    await expect(page.locator('.search-toolbar')).toBeVisible()
  })
})
