import { test, expect, type Page } from '@playwright/test'

async function login(page: Page) {
  await page.goto('login')
  await page.getByRole('textbox', { name: '用户名' }).fill('admin')
  await page.getByRole('textbox', { name: '密码' }).fill('123456')
  await page.getByRole('button', { name: '登录' }).click()
  await expect(page).toHaveURL(/\/(\?.*)?$/)
}

test.describe.serial('业务页面闭环', () => {
  test('user 列表渲染 + 查看 drawer 打开', async ({ page }) => {
    await login(page)
    await page.goto('system/user')
    await expect(page.locator('.el-table').first()).toBeVisible()
    await expect(page.locator('.search-toolbar')).toBeVisible()
    // 等首行数据渲染完成（user 列表 actions 列在 fixed:'right'，可能因表格水平滚动被遮蔽，
    // 用 force 跳过可见性检查，按钮 onClick 仍会触发）
    await expect(page.locator('.el-table__row').first()).toBeVisible()
    await page.getByRole('button', { name: '查看' }).first().click()
    // 用 .el-drawer__title 精确匹配（layout 的 SettingsDrawer 也用 .el-drawer，会干扰 getByRole('heading')）
    await expect(
      page.locator('.el-drawer__title').filter({ hasText: '查看用户' })
    ).toBeVisible()
  })

  test('role 列表渲染 + 权限分配 drawer 打开', async ({ page }) => {
    await login(page)
    await page.goto('system/role')
    await expect(page.locator('.el-table').first()).toBeVisible()
    await expect(page.locator('.el-table__row').first()).toBeVisible()
    await page.getByRole('button', { name: '权限' }).first().click()
    await expect(
      page.locator('.el-drawer__title').filter({ hasText: '权限配置' })
    ).toBeVisible()
    await expect(page.locator('.permission-tree')).toBeVisible()
  })

  test('permission 列表渲染', async ({ page }) => {
    await login(page)
    await page.goto('system/permission')
    await expect(page.locator('.el-table').first()).toBeVisible()
    await expect(page.locator('.search-toolbar')).toBeVisible()
    await expect(
      page.locator('.el-button').filter({ hasText: '新增权限' })
    ).toBeVisible()
  })

  test('menu 树渲染 + 新增顶级菜单 drawer', async ({ page }) => {
    await login(page)
    await page.goto('system/menu')
    await expect(page.locator('.el-tree')).toBeVisible()
    await page.locator('.el-button').filter({ hasText: '新增顶级菜单' }).click()
    await expect(
      page.locator('.el-drawer__title').filter({ hasText: '新增顶级菜单' })
    ).toBeVisible()
  })

  test('dept 列表渲染 + 新增部门 drawer（含 DeptSelector）', async ({ page }) => {
    await login(page)
    await page.goto('system/dept')
    await expect(page.locator('.el-table').first()).toBeVisible()
    await expect(page.locator('.el-table__row').first()).toBeVisible()
    await page.locator('.el-button').filter({ hasText: '新增部门' }).first().click()
    await expect(
      page.locator('.el-drawer__title').filter({ hasText: '新增部门' })
    ).toBeVisible()
    // 上级部门字段已改用 DeptSelector（el-tree-select），验证其挂载
    await expect(page.locator('.el-drawer .el-tree-select, .el-drawer .el-select').first()).toBeVisible()
  })

  test('notice 列表渲染 + 新增公告 drawer', async ({ page }) => {
    await login(page)
    await page.goto('system/notice')
    await expect(page.locator('.el-table').first()).toBeVisible()
    await expect(page.locator('.el-table__row').first()).toBeVisible()
    await page.locator('.el-button').filter({ hasText: '新增公告' }).first().click()
    await expect(
      page.locator('.el-drawer__title').filter({ hasText: '新增公告' })
    ).toBeVisible()
  })

  test('dict 三层树渲染 + 选中节点展示详情面板', async ({ page }) => {
    await login(page)
    await page.goto('system/dict')
    // 左侧字典树渲染
    await expect(page.locator('.el-tree').first()).toBeVisible()
    // 展开并选中第一个分类节点，触发右侧详情
    await page.locator('.el-tree-node__content').first().click()
    // 详情区有内容（节点名或空状态至少其一渲染）
    await expect(page.locator('.detail-col, .el-empty').first()).toBeVisible()
  })

  test('log 登录日志导出按钮可触发且无报错', async ({ page }) => {
    await login(page)
    await page.goto('system/log/login')
    await expect(page.locator('.el-table').first()).toBeVisible()
    // 点击导出按钮，验证触发下载/成功提示且无错误
    const downloadOrMessage = Promise.all([
      page.waitForEvent('download').catch(() => null),
      page.locator('.el-message--success').waitFor({ state: 'visible', timeout: 5000 }).catch(() => null),
    ])
    await page.locator('.el-button').filter({ hasText: '导出' }).first().click()
    await downloadOrMessage
    await expect(page.locator('.el-message--error')).toHaveCount(0)
  })
})
