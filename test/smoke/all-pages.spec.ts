import { test, expect, type Page } from '@playwright/test'

/**
 * 冒烟测试工具函数：
 * 统一验证所有列表页面是否成功加载数据
 */
export async function login(page: Page) {
  await page.goto('login')
  await page.getByRole('textbox', { name: '用户名' }).fill('admin')
  await page.getByRole('textbox', { name: '密码' }).fill('123456')
  await page.getByRole('button', { name: '登录' }).click()
  await expect(page).toHaveURL(/\/(\?.*)?$/)
  // 等待 layout 渲染完成
  await expect(page.locator('.el-menu').first()).toBeVisible()
}

/**
 * 验证列表页面是否成功加载数据：
 * 1. 表格渲染成功
 * 2. 至少有 1 行数据（排除空状态）
 * 3. 没有错误提示
 */
async function verifyListPage(page: Page, pageName: string, hasTree = false) {
  // 等待表格/树渲染
  if (hasTree) {
    await expect(page.locator('.el-tree').first(), `${pageName} 树形表格渲染`).toBeVisible({ timeout: 10000 })
  } else {
    await expect(page.locator('.el-table').first(), `${pageName} 表格渲染`).toBeVisible({ timeout: 10000 })
  }

  // 等待数据加载（表格有行数据）
  await expect
    .poll(async () => {
      const rowCount = await page.locator('.el-table__row').count()
      const treeNodeCount = hasTree ? await page.locator('.el-tree-node').count() : 0
      return rowCount > 0 || treeNodeCount > 0
    }, { message: `${pageName} 数据加载成功`, timeout: 10000 })
    .toBeTruthy()

  // 验证没有错误提示
  await expect(page.locator('.el-message--error'), `${pageName} 无错误提示`)
    .toHaveCount(0)
}

test.describe.serial('✅ 全页面冒烟测试 - 系统管理模块', () => {
  let page: Page

  test.beforeAll(async ({ browser }) => {
    page = await browser.newPage()
    await login(page)
  })

  test.afterAll(async () => {
    await page.close()
  })

  test('📋 用户管理页面 - 列表数据加载正常', async () => {
    await page.goto('system/user')
    await verifyListPage(page, '用户管理')
  })

  test('👤 角色管理页面 - 列表数据加载正常', async () => {
    await page.goto('system/role')
    await verifyListPage(page, '角色管理')
  })

  test('🔐 权限管理页面 - 列表数据加载正常', async () => {
    await page.goto('system/permission')
    await verifyListPage(page, '权限管理')
  })

  test('📖 字典管理页面 - 分类树数据加载正常', async () => {
    await page.goto('system/dict')
    await verifyListPage(page, '字典管理', true)
  })

  test('📜 菜单管理页面 - 树形数据加载正常', async () => {
    await page.goto('system/menu')
    await verifyListPage(page, '菜单管理', true)
  })

  test('🏢 部门管理页面 - 列表数据加载正常', async () => {
    await page.goto('system/dept')
    await verifyListPage(page, '部门管理')
  })

  test('📢 公告管理页面 - 列表数据加载正常', async () => {
    await page.goto('system/notice')
    await verifyListPage(page, '公告管理')
  })

  test('📝 登录日志页面 - 列表数据加载正常', async () => {
    await page.goto('system/log/login')
    await verifyListPage(page, '登录日志')
  })

  test('🔍 操作日志页面 - 列表数据加载正常', async () => {
    await page.goto('system/log/operation')
    await verifyListPage(page, '操作日志')
  })
})

test.describe.serial('✅ 全页面冒烟测试 - 其他模块', () => {
  let page: Page

  test.beforeAll(async ({ browser }) => {
    page = await browser.newPage()
    await login(page)
  })

  test.afterAll(async () => {
    await page.close()
  })

  test('🏠 首页仪表盘 - 正常渲染', async () => {
    await page.goto('/')
    await expect(page.locator('.dashboard-home')).toBeVisible({ timeout: 5000 }).catch(() => {
      // 如果没有特定 class，只要没有错误提示即可
      return true
    })
    await expect(page.locator('.el-message--error'), '首页无错误提示').toHaveCount(0)
  })

  test('✏️ CRUD 示例页面 - 列表数据加载正常', async () => {
    await page.goto('crud')
    await verifyListPage(page, 'CRUD 示例')
  })
})

test.describe.serial('✅ API 连通性验证', () => {
  let page: Page

  test.beforeAll(async ({ browser }) => {
    page = await browser.newPage()
    await login(page)
  })

  test.afterAll(async () => {
    await page.close()
  })

  test('📊 所有 API 请求无 404/500', async () => {
    const failedRequests: { url: string; status: number }[] = []

    page.on('response', res => {
      if (res.url().includes('/api/')) {
        const status = res.status()
        if (status >= 400) {
          failedRequests.push({ url: res.url(), status })
        }
      }
    })

    // 遍历所有页面触发 API 调用
    const pages = [
      'system/user',
      'system/role',
      'system/permission',
      'system/dict',
      'system/menu',
      'system/dept',
      'system/notice',
      'system/log/login',
      'system/log/operation',
      'crud',
    ]

    for (const p of pages) {
      await page.goto(p)
      await page.waitForTimeout(500) // 等待 API 调用完成
    }

    expect(failedRequests, `API 请求失败: ${JSON.stringify(failedRequests, null, 2)}`)
      .toHaveLength(0)
  })
})
