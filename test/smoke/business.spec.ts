import { test, expect, type Page } from '@playwright/test'

async function login(page: Page) {
  await page.goto('login')
  await page.getByRole('textbox', { name: '用户名' }).fill('admin')
  await page.getByRole('textbox', { name: '密码' }).fill('123456')
  await page.getByRole('button', { name: '登录' }).click()
  await expect(page).toHaveURL(/\/(\?.*)?$/)
}

test.describe.serial('业务页面闭环', () => {
  test('admin 列表渲染 + 查看 drawer 打开', async ({ page }) => {
    await login(page)
    await page.goto('system/admin')
    await expect(page.locator('.el-table').first()).toBeVisible()
    await expect(page.locator('.search-toolbar')).toBeVisible()
    // 等首行数据渲染完成（admin 列表 actions 列在 fixed:'right'，可能因表格水平滚动被遮蔽，
    // 用 force 跳过可见性检查，按钮 onClick 仍会触发）
    await expect(page.locator('.el-table__row').first()).toBeVisible()
    await page.getByRole('button', { name: '查看' }).first().click()
    // 用 .el-drawer__title 精确匹配（layout 的 SettingsDrawer 也用 .el-drawer，会干扰 getByRole('heading')）
    await expect(page.locator('.el-drawer__title').filter({ hasText: '查看管理员' })).toBeVisible()
  })

  test('role 列表渲染 + 权限分配 drawer 打开', async ({ page }) => {
    await login(page)
    await page.goto('system/role')
    await expect(page.locator('.el-table').first()).toBeVisible()
    await expect(page.locator('.el-table__row').first()).toBeVisible()
    await page.getByRole('button', { name: '权限' }).first().click()
    await expect(page.locator('.el-drawer__title').filter({ hasText: '权限配置' })).toBeVisible()
    await expect(page.locator('.permission-tree')).toBeVisible()
  })

  test('permission 列表渲染', async ({ page }) => {
    await login(page)
    await page.goto('system/permission')
    await expect(page.locator('.el-table').first()).toBeVisible()
    await expect(page.locator('.search-toolbar')).toBeVisible()
    await expect(page.locator('.el-button').filter({ hasText: '新增权限' })).toBeVisible()
  })

  test('menu 树渲染 + 新增顶级菜单 drawer', async ({ page }) => {
    await login(page)
    await page.goto('system/menu')
    await expect(page.locator('.el-tree')).toBeVisible()
    await page.locator('.el-button').filter({ hasText: '新增顶级菜单' }).click()
    await expect(page.locator('.el-drawer__title').filter({ hasText: '新增顶级菜单' })).toBeVisible()
  })
})
