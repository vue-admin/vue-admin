import { http } from 'msw'
import { ok, fail, toCsv } from './_utils'

// 定义字典分类类型
interface DictCategoryInfo {
  id: string
  name: string
  code: string
  description: string
  status: 'active' | 'inactive'
  createTime: string
  updateTime: string
}

// 定义字典类型
interface DictInfo {
  id: string
  categoryId: string
  name: string
  code: string
  description: string
  status: 'active' | 'inactive'
  createTime: string
  updateTime: string
}

// 定义字典项类型
interface DictItemInfo {
  id: string
  dictId: string
  name: string
  code: string
  value: string
  sort: number
  status: 'active' | 'inactive'
  createTime: string
  updateTime: string
}

// 生成随机字典分类数据
const generateDictCategories = (count: number): DictCategoryInfo[] => {
  const categories: DictCategoryInfo[] = []
  const names = [
    '用户类型',
    '状态类型',
    '性别类型',
    '民族类型',
    '学历类型',
    '婚姻状况'
  ]
  const codes = [
    'user_type',
    'status_type',
    'gender_type',
    'nation_type',
    'education_type',
    'marital_status'
  ]
  const statuses = ['active', 'inactive'] as const
  const descriptions = [
    '用户类型字典分类',
    '状态类型字典分类',
    '性别类型字典分类',
    '民族类型字典分类',
    '学历类型字典分类',
    '婚姻状况字典分类'
  ]

  for (let i = 0; i < count; i++) {
    categories.push({
      id: (i + 1).toString(),
      name: names[i % names.length],
      code: codes[i % codes.length],
      description: descriptions[i % descriptions.length],
      status: statuses[Math.floor(Math.random() * statuses.length)],
      createTime: new Date(
        Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000
      ).toISOString(),
      updateTime: new Date(
        Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000
      ).toISOString()
    })
  }

  return categories
}

// 生成随机字典数据
const generateDicts = (
  count: number,
  categories: DictCategoryInfo[]
): DictInfo[] => {
  const dicts: DictInfo[] = []
  const names = [
    '用户状态',
    '订单状态',
    '支付状态',
    '物流状态',
    '审核状态',
    '会员等级'
  ]
  const codes = [
    'user_status',
    'order_status',
    'pay_status',
    'logistics_status',
    'audit_status',
    'member_level'
  ]
  const statuses = ['active', 'inactive'] as const
  const descriptions = [
    '用户状态字典',
    '订单状态字典',
    '支付状态字典',
    '物流状态字典',
    '审核状态字典',
    '会员等级字典'
  ]

  for (let i = 0; i < count; i++) {
    const category = categories[Math.floor(Math.random() * categories.length)]
    dicts.push({
      id: (i + 1).toString(),
      categoryId: category.id,
      name: names[i % names.length],
      code: codes[i % codes.length],
      description: descriptions[i % descriptions.length],
      status: statuses[Math.floor(Math.random() * statuses.length)],
      createTime: new Date(
        Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000
      ).toISOString(),
      updateTime: new Date(
        Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000
      ).toISOString()
    })
  }

  return dicts
}

// 生成随机字典项数据
const generateDictItems = (
  count: number,
  dicts: DictInfo[]
): DictItemInfo[] => {
  const items: DictItemInfo[] = []
  const userStatusItems = [
    { code: 'active', name: '启用', value: '1' },
    { code: 'inactive', name: '禁用', value: '0' },
    { code: 'pending', name: '待审核', value: '2' }
  ]
  const orderStatusItems = [
    { code: 'pending', name: '待支付', value: '1' },
    { code: 'paid', name: '已支付', value: '2' },
    { code: 'shipped', name: '已发货', value: '3' },
    { code: 'received', name: '已收货', value: '4' },
    { code: 'cancelled', name: '已取消', value: '5' }
  ]
  const payStatusItems = [
    { code: 'unpaid', name: '未支付', value: '1' },
    { code: 'paid', name: '已支付', value: '2' },
    { code: 'refunded', name: '已退款', value: '3' }
  ]
  const logisticsStatusItems = [
    { code: 'pending', name: '待发货', value: '1' },
    { code: 'shipped', name: '运输中', value: '2' },
    { code: 'delivered', name: '已送达', value: '3' }
  ]
  const auditStatusItems = [
    { code: 'pending', name: '待审核', value: '1' },
    { code: 'approved', name: '已通过', value: '2' },
    { code: 'rejected', name: '已拒绝', value: '3' }
  ]
  const memberLevelItems = [
    { code: 'level1', name: '青铜会员', value: '1' },
    { code: 'level2', name: '白银会员', value: '2' },
    { code: 'level3', name: '黄金会员', value: '3' },
    { code: 'level4', name: '钻石会员', value: '4' }
  ]

  const dictItemMap: Record<string, typeof userStatusItems> = {
    user_status: userStatusItems,
    order_status: orderStatusItems,
    pay_status: payStatusItems,
    logistics_status: logisticsStatusItems,
    audit_status: auditStatusItems,
    member_level: memberLevelItems
  }

  let id = 1
  for (const dict of dicts) {
    const itemsForDict = dictItemMap[dict.code] || userStatusItems
    for (const item of itemsForDict) {
      items.push({
        id: id.toString(),
        dictId: dict.id,
        name: item.name,
        code: item.code,
        value: item.value,
        sort: id,
        status: Math.random() > 0.1 ? 'active' : 'inactive',
        createTime: new Date(
          Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000
        ).toISOString(),
        updateTime: new Date(
          Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000
        ).toISOString()
      })
      id++
    }
  }

  return items
}

// 生成数据
const dictCategories: DictCategoryInfo[] = generateDictCategories(6)
const dicts: DictInfo[] = generateDicts(6, dictCategories)
const dictItems: DictItemInfo[] = generateDictItems(30, dicts)

export const dictHandlers = [
  // ================= 字典分类 =================
  // 获取字典分类列表
  http.get('/api/dict/categories', ({ request }) => {
    const searchParams = new URL(request.url).searchParams
    const keyword = searchParams.get('keyword') || ''
    const status = searchParams.get('status') || ''
    const page = parseInt(searchParams.get('page') || '1')
    const size = parseInt(searchParams.get('size') || '10')

    // 筛选
    const filteredCategories = dictCategories.filter((category) => {
      const matchKeyword =
        keyword === '' ||
        category.name.includes(keyword) ||
        category.code.includes(keyword) ||
        category.description.includes(keyword)
      const matchStatus = status === '' || category.status === status

      return matchKeyword && matchStatus
    })

    // 分页
    const startIndex = (page - 1) * size
    const endIndex = startIndex + size
    const paginatedCategories = filteredCategories.slice(startIndex, endIndex)

    return ok({
      records: paginatedCategories,
      total: filteredCategories.length,
      current: page,
      size
    })
  }),

  // 批量删除字典分类（DELETE 集合 + body.ids）
  http.delete('/api/dict/categories', async ({ request }) => {
    const body = (await request.json()) as { ids: string[] }

    body.ids.forEach((id: string) => {
      const categoryIndex = dictCategories.findIndex((c) => c.id === id)
      if (categoryIndex !== -1) {
        dictCategories.splice(categoryIndex, 1)
      }
    })

    return ok(true, '删除成功')
  }),

  // 导出字典分类列表，必须在 /:id 之前注册
  http.get('/api/dict/categories/export', () => {
    const csv = toCsv(dictCategories, [
      'id', 'name', 'code', 'description', 'status', 'createTime', 'updateTime'
    ])
    return ok(csv, '导出成功')
  }),

  // 获取字典分类详情
  http.get('/api/dict/categories/:id', ({ params }) => {
    const id = params.id as string
    const category = dictCategories.find((c) => c.id === id)

    if (category) {
      return ok(category)
    }

    return fail(404, '字典分类不存在')
  }),

  // 创建字典分类
  http.post('/api/dict/categories', async ({ request }) => {
    const body = (await request.json()) as Record<string, unknown>
    const newCategory = {
      id: (dictCategories.length + 1).toString(),
      ...body,
      createTime: new Date().toISOString(),
      updateTime: new Date().toISOString()
    }

    dictCategories.push(newCategory as DictCategoryInfo)

    return ok(newCategory, '创建成功')
  }),

  // 更新字典分类
  http.put('/api/dict/categories/:id', async ({ request, params }) => {
    const id = params.id as string
    const categoryIndex = dictCategories.findIndex((c) => c.id === id)

    if (categoryIndex !== -1) {
      const body = (await request.json()) as Record<string, unknown>
      dictCategories[categoryIndex] = {
        ...dictCategories[categoryIndex],
        ...body,
        updateTime: new Date().toISOString()
      } as DictCategoryInfo

      return ok(dictCategories[categoryIndex], '更新成功')
    }

    return fail(404, '字典分类不存在')
  }),

  // 删除字典分类
  http.delete('/api/dict/categories/:id', ({ params }) => {
    const id = params.id as string
    const categoryIndex = dictCategories.findIndex((c) => c.id === id)

    if (categoryIndex !== -1) {
      dictCategories.splice(categoryIndex, 1)

      return ok(true, '删除成功')
    }

    return fail(404, '字典分类不存在')
  }),

  // ================= 字典 =================
  // 获取字典列表
  http.get('/api/dict/dicts', ({ request }) => {
    const searchParams = new URL(request.url).searchParams
    const keyword = searchParams.get('keyword') || ''
    const categoryId = searchParams.get('categoryId') || ''
    const status = searchParams.get('status') || ''
    const page = parseInt(searchParams.get('page') || '1')
    const size = parseInt(searchParams.get('size') || '10')

    // 筛选
    const filteredDicts = dicts.filter((dict) => {
      const matchKeyword =
        keyword === '' ||
        dict.name.includes(keyword) ||
        dict.code.includes(keyword) ||
        dict.description.includes(keyword)
      const matchCategory =
        categoryId === '' || dict.categoryId === categoryId
      const matchStatus = status === '' || dict.status === status

      return matchKeyword && matchCategory && matchStatus
    })

    // 分页
    const startIndex = (page - 1) * size
    const endIndex = startIndex + size
    const paginatedDicts = filteredDicts.slice(startIndex, endIndex)

    return ok({
      records: paginatedDicts,
      total: filteredDicts.length,
      current: page,
      size
    })
  }),

  // 批量删除字典（DELETE 集合 + body.ids）
  http.delete('/api/dict/dicts', async ({ request }) => {
    const body = (await request.json()) as { ids: string[] }

    body.ids.forEach((id: string) => {
      const dictIndex = dicts.findIndex((d) => d.id === id)
      if (dictIndex !== -1) {
        dicts.splice(dictIndex, 1)
      }
    })

    return ok(true, '删除成功')
  }),

  // 导出字典列表，必须在 /:id 之前注册
  http.get('/api/dict/dicts/export', () => {
    const csv = toCsv(dicts, [
      'id', 'categoryId', 'name', 'code', 'description', 'status', 'createTime', 'updateTime'
    ])
    return ok(csv, '导出成功')
  }),

  // 获取字典详情
  http.get('/api/dict/dicts/:id', ({ params }) => {
    const id = params.id as string
    const dict = dicts.find((d) => d.id === id)

    if (dict) {
      return ok(dict)
    }

    return fail(404, '字典不存在')
  }),

  // 创建字典
  http.post('/api/dict/dicts', async ({ request }) => {
    const body = (await request.json()) as Record<string, unknown>
    const newDict = {
      id: (dicts.length + 1).toString(),
      ...body,
      createTime: new Date().toISOString(),
      updateTime: new Date().toISOString()
    }

    dicts.push(newDict as DictInfo)

    return ok(newDict, '创建成功')
  }),

  // 更新字典
  http.put('/api/dict/dicts/:id', async ({ request, params }) => {
    const id = params.id as string
    const dictIndex = dicts.findIndex((d) => d.id === id)

    if (dictIndex !== -1) {
      const body = (await request.json()) as Record<string, unknown>
      dicts[dictIndex] = {
        ...dicts[dictIndex],
        ...body,
        updateTime: new Date().toISOString()
      } as DictInfo

      return ok(dicts[dictIndex], '更新成功')
    }

    return fail(404, '字典不存在')
  }),

  // 删除字典
  http.delete('/api/dict/dicts/:id', ({ params }) => {
    const id = params.id as string
    const dictIndex = dicts.findIndex((d) => d.id === id)

    if (dictIndex !== -1) {
      dicts.splice(dictIndex, 1)

      return ok(true, '删除成功')
    }

    return fail(404, '字典不存在')
  }),

  // ================= 字典项 =================
  // 获取字典项列表
  http.get('/api/dict/items', ({ request }) => {
    const searchParams = new URL(request.url).searchParams
    const keyword = searchParams.get('keyword') || ''
    const dictId = searchParams.get('dictId') || ''
    const status = searchParams.get('status') || ''
    const page = parseInt(searchParams.get('page') || '1')
    const size = parseInt(searchParams.get('size') || '10')

    // 筛选
    const filteredItems = dictItems.filter((item) => {
      const matchKeyword =
        keyword === '' ||
        item.name.includes(keyword) ||
        item.code.includes(keyword) ||
        item.value.includes(keyword)
      const matchDict = dictId === '' || item.dictId === dictId
      const matchStatus = status === '' || item.status === status

      return matchKeyword && matchDict && matchStatus
    })

    // 分页
    const startIndex = (page - 1) * size
    const endIndex = startIndex + size
    const paginatedItems = filteredItems.slice(startIndex, endIndex)

    return ok({
      records: paginatedItems,
      total: filteredItems.length,
      current: page,
      size
    })
  }),

  // 批量删除字典项（DELETE 集合 + body.ids）
  http.delete('/api/dict/items', async ({ request }) => {
    const body = (await request.json()) as { ids: string[] }

    body.ids.forEach((id: string) => {
      const itemIndex = dictItems.findIndex((i) => i.id === id)
      if (itemIndex !== -1) {
        dictItems.splice(itemIndex, 1)
      }
    })

    return ok(true, '删除成功')
  }),

  // 导出字典项列表，必须在 /:id 之前注册
  http.get('/api/dict/items/export', () => {
    const csv = toCsv(dictItems, [
      'id', 'dictId', 'name', 'code', 'value', 'sort', 'status', 'createTime', 'updateTime'
    ])
    return ok(csv, '导出成功')
  }),

  // 获取字典项详情
  http.get('/api/dict/items/:id', ({ params }) => {
    const id = params.id as string
    const item = dictItems.find((i) => i.id === id)

    if (item) {
      return ok(item)
    }

    return fail(404, '字典项不存在')
  }),

  // 创建字典项
  http.post('/api/dict/items', async ({ request }) => {
    const body = (await request.json()) as Record<string, unknown>
    const newItem = {
      id: (dictItems.length + 1).toString(),
      ...body,
      createTime: new Date().toISOString(),
      updateTime: new Date().toISOString()
    }

    dictItems.push(newItem as DictItemInfo)

    return ok(newItem, '创建成功')
  }),

  // 更新字典项
  http.put('/api/dict/items/:id', async ({ request, params }) => {
    const id = params.id as string
    const itemIndex = dictItems.findIndex((i) => i.id === id)

    if (itemIndex !== -1) {
      const body = (await request.json()) as Record<string, unknown>
      dictItems[itemIndex] = {
        ...dictItems[itemIndex],
        ...body,
        updateTime: new Date().toISOString()
      } as DictItemInfo

      return ok(dictItems[itemIndex], '更新成功')
    }

    return fail(404, '字典项不存在')
  }),

  // 删除字典项
  http.delete('/api/dict/items/:id', ({ params }) => {
    const id = params.id as string
    const itemIndex = dictItems.findIndex((i) => i.id === id)

    if (itemIndex !== -1) {
      dictItems.splice(itemIndex, 1)

      return ok(true, '删除成功')
    }

    return fail(404, '字典项不存在')
  })
]
