import type { MockMethod } from 'vite-plugin-mock'

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
  const names = ['用户类型', '状态类型', '性别类型', '民族类型', '学历类型', '婚姻状况']
  const codes = ['user_type', 'status_type', 'gender_type', 'nation_type', 'education_type', 'marital_status']
  const statuses = ['active', 'inactive'] as const
  const descriptions = [
    '用户类型字典分类',
    '状态类型字典分类',
    '性别类型字典分类',
    '民族类型字典分类',
    '学历类型字典分类',
    '婚姻状况字典分类',
  ]

  for (let i = 0; i < count; i++) {
    categories.push({
      id: (i + 1).toString(),
      name: names[i % names.length],
      code: codes[i % codes.length],
      description: descriptions[i % descriptions.length],
      status: statuses[Math.floor(Math.random() * statuses.length)],
      createTime: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString(),
      updateTime: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
    })
  }

  return categories
}

// 生成随机字典数据
const generateDicts = (count: number, categories: DictCategoryInfo[]): DictInfo[] => {
  const dicts: DictInfo[] = []
  const names = ['用户状态', '订单状态', '支付状态', '物流状态', '审核状态', '会员等级']
  const codes = ['user_status', 'order_status', 'pay_status', 'logistics_status', 'audit_status', 'member_level']
  const statuses = ['active', 'inactive'] as const
  const descriptions = [
    '用户状态字典',
    '订单状态字典',
    '支付状态字典',
    '物流状态字典',
    '审核状态字典',
    '会员等级字典',
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
      createTime: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString(),
      updateTime: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
    })
  }

  return dicts
}

// 生成随机字典项数据
const generateDictItems = (count: number, dicts: DictInfo[]): DictItemInfo[] => {
  const items: DictItemInfo[] = []
  const userStatusItems = [
    { code: 'active', name: '启用', value: '1' },
    { code: 'inactive', name: '禁用', value: '0' },
    { code: 'pending', name: '待审核', value: '2' },
  ]
  const orderStatusItems = [
    { code: 'pending', name: '待支付', value: '1' },
    { code: 'paid', name: '已支付', value: '2' },
    { code: 'shipped', name: '已发货', value: '3' },
    { code: 'received', name: '已收货', value: '4' },
    { code: 'cancelled', name: '已取消', value: '5' },
  ]
  const payStatusItems = [
    { code: 'unpaid', name: '未支付', value: '1' },
    { code: 'paid', name: '已支付', value: '2' },
    { code: 'refunded', name: '已退款', value: '3' },
  ]
  const logisticsStatusItems = [
    { code: 'pending', name: '待发货', value: '1' },
    { code: 'shipped', name: '运输中', value: '2' },
    { code: 'delivered', name: '已送达', value: '3' },
  ]
  const auditStatusItems = [
    { code: 'pending', name: '待审核', value: '1' },
    { code: 'approved', name: '已通过', value: '2' },
    { code: 'rejected', name: '已拒绝', value: '3' },
  ]
  const memberLevelItems = [
    { code: 'level1', name: '青铜会员', value: '1' },
    { code: 'level2', name: '白银会员', value: '2' },
    { code: 'level3', name: '黄金会员', value: '3' },
    { code: 'level4', name: '钻石会员', value: '4' },
  ]

  const dictItemMap: Record<string, typeof userStatusItems> = {
    'user_status': userStatusItems,
    'order_status': orderStatusItems,
    'pay_status': payStatusItems,
    'logistics_status': logisticsStatusItems,
    'audit_status': auditStatusItems,
    'member_level': memberLevelItems,
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
        createTime: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString(),
        updateTime: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
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

export default [
  // 获取字典分类列表
  {
    url: '/api/dict/category/list',
    method: 'get',
    response: (req: any) => {
      const { keyword = '', status = '', page = 1, size = 10 } = req.query

      // 筛选
      let filteredCategories = dictCategories.filter(category => {
        const matchKeyword = keyword === '' ||
          category.name.includes(keyword) ||
          category.code.includes(keyword) ||
          category.description.includes(keyword)
        const matchStatus = status === '' || category.status === status

        return matchKeyword && matchStatus
      })

      // 分页
      const startIndex = (page - 1) * size
      const endIndex = startIndex + parseInt(size)
      const paginatedCategories = filteredCategories.slice(startIndex, endIndex)

      return {
        code: 0,
        data: {
          records: paginatedCategories,
          total: filteredCategories.length,
          current: parseInt(page),
          size: parseInt(size),
        },
        msg: 'success',
      }
    },
  },

  // 获取字典分类详情
  {
    url: '/api/dict/category/detail/:id',
    method: 'get',
    response: (req: any) => {
      const id = req.query?.id || req.params?.id
      const category = dictCategories.find(c => c.id === id)

      if (category) {
        return {
          code: 0,
          data: category,
          msg: 'success',
        }
      }

      return {
        code: 404,
        msg: '字典分类不存在',
      }
    },
  },

  // 创建字典分类
  {
    url: '/api/dict/category/create',
    method: 'post',
    response: (req: any) => {
      const newCategory = {
        id: (dictCategories.length + 1).toString(),
        ...req.body,
        createTime: new Date().toISOString(),
        updateTime: new Date().toISOString(),
      }

      dictCategories.push(newCategory)

      return {
        code: 0,
        data: newCategory,
        msg: '创建成功',
      }
    },
  },

  // 更新字典分类
  {
    url: '/api/dict/category/update/:id',
    method: 'put',
    response: (req: any) => {
      const id = req.query?.id || req.params?.id
      const categoryIndex = dictCategories.findIndex(c => c.id === id)

      if (categoryIndex !== -1) {
        dictCategories[categoryIndex] = {
          ...dictCategories[categoryIndex],
          ...req.body,
          updateTime: new Date().toISOString(),
        }

        return {
          code: 0,
          data: dictCategories[categoryIndex],
          msg: '更新成功',
        }
      }

      return {
        code: 404,
        msg: '字典分类不存在',
      }
    },
  },

  // 删除字典分类
  {
    url: '/api/dict/category/delete/:id',
    method: 'delete',
    response: (req: any) => {
      const id = req.query?.id || req.params?.id
      const categoryIndex = dictCategories.findIndex(c => c.id === id)

      if (categoryIndex !== -1) {
        dictCategories.splice(categoryIndex, 1)

        return {
          code: 0,
          data: true,
          msg: '删除成功',
        }
      }

      return {
        code: 404,
        msg: '字典分类不存在',
      }
    },
  },

  // 批量删除字典分类
  {
    url: '/api/dict/category/batch-delete',
    method: 'post',
    response: (req: any) => {
      const { ids } = req.body

      ids.forEach((id: string) => {
        const categoryIndex = dictCategories.findIndex(c => c.id === id)
        if (categoryIndex !== -1) {
          dictCategories.splice(categoryIndex, 1)
        }
      })

      return {
        code: 0,
        data: true,
        msg: '删除成功',
      }
    },
  },

  // 导出字典分类列表
  {
    url: '/api/dict/category/export',
    method: 'get',
    response: () => {
      return {
        code: 0,
        data: 'export success',
        msg: '导出成功',
      }
    },
  },

  // 获取字典列表
  {
    url: '/api/dict/list',
    method: 'get',
    response: (req: any) => {
      const { keyword = '', categoryId = '', status = '', page = 1, size = 10 } = req.query

      // 筛选
      let filteredDicts = dicts.filter(dict => {
        const matchKeyword = keyword === '' ||
          dict.name.includes(keyword) ||
          dict.code.includes(keyword) ||
          dict.description.includes(keyword)
        const matchCategory = categoryId === '' || dict.categoryId === categoryId
        const matchStatus = status === '' || dict.status === status

        return matchKeyword && matchCategory && matchStatus
      })

      // 分页
      const startIndex = (page - 1) * size
      const endIndex = startIndex + parseInt(size)
      const paginatedDicts = filteredDicts.slice(startIndex, endIndex)

      return {
        code: 0,
        data: {
          records: paginatedDicts,
          total: filteredDicts.length,
          current: parseInt(page),
          size: parseInt(size),
        },
        msg: 'success',
      }
    },
  },

  // 获取字典详情
  {
    url: '/api/dict/detail/:id',
    method: 'get',
    response: (req: any) => {
      const id = req.query?.id || req.params?.id
      const dict = dicts.find(d => d.id === id)

      if (dict) {
        return {
          code: 0,
          data: dict,
          msg: 'success',
        }
      }

      return {
        code: 404,
        msg: '字典不存在',
      }
    },
  },

  // 创建字典
  {
    url: '/api/dict/create',
    method: 'post',
    response: (req: any) => {
      const newDict = {
        id: (dicts.length + 1).toString(),
        ...req.body,
        createTime: new Date().toISOString(),
        updateTime: new Date().toISOString(),
      }

      dicts.push(newDict)

      return {
        code: 0,
        data: newDict,
        msg: '创建成功',
      }
    },
  },

  // 更新字典
  {
    url: '/api/dict/update/:id',
    method: 'put',
    response: (req: any) => {
      const id = req.query?.id || req.params?.id
      const dictIndex = dicts.findIndex(d => d.id === id)

      if (dictIndex !== -1) {
        dicts[dictIndex] = {
          ...dicts[dictIndex],
          ...req.body,
          updateTime: new Date().toISOString(),
        }

        return {
          code: 0,
          data: dicts[dictIndex],
          msg: '更新成功',
        }
      }

      return {
        code: 404,
        msg: '字典不存在',
      }
    },
  },

  // 删除字典
  {
    url: '/api/dict/delete/:id',
    method: 'delete',
    response: (req: any) => {
      const id = req.query?.id || req.params?.id
      const dictIndex = dicts.findIndex(d => d.id === id)

      if (dictIndex !== -1) {
        dicts.splice(dictIndex, 1)

        return {
          code: 0,
          data: true,
          msg: '删除成功',
        }
      }

      return {
        code: 404,
        msg: '字典不存在',
      }
    },
  },

  // 批量删除字典
  {
    url: '/api/dict/batch-delete',
    method: 'post',
    response: (req: any) => {
      const { ids } = req.body

      ids.forEach((id: string) => {
        const dictIndex = dicts.findIndex(d => d.id === id)
        if (dictIndex !== -1) {
          dicts.splice(dictIndex, 1)
        }
      })

      return {
        code: 0,
        data: true,
        msg: '删除成功',
      }
    },
  },

  // 导出字典列表
  {
    url: '/api/dict/export',
    method: 'get',
    response: () => {
      return {
        code: 0,
        data: 'export success',
        msg: '导出成功',
      }
    },
  },

  // 获取字典项列表
  {
    url: '/api/dict/item/list',
    method: 'get',
    response: (req: any) => {
      const { keyword = '', dictId = '', status = '', page = 1, size = 10 } = req.query

      // 筛选
      let filteredItems = dictItems.filter(item => {
        const matchKeyword = keyword === '' ||
          item.name.includes(keyword) ||
          item.code.includes(keyword) ||
          item.value.includes(keyword)
        const matchDict = dictId === '' || item.dictId === dictId
        const matchStatus = status === '' || item.status === status

        return matchKeyword && matchDict && matchStatus
      })

      // 分页
      const startIndex = (page - 1) * size
      const endIndex = startIndex + parseInt(size)
      const paginatedItems = filteredItems.slice(startIndex, endIndex)

      return {
        code: 0,
        data: {
          records: paginatedItems,
          total: filteredItems.length,
          current: parseInt(page),
          size: parseInt(size),
        },
        msg: 'success',
      }
    },
  },

  // 获取字典项详情
  {
    url: '/api/dict/item/detail/:id',
    method: 'get',
    response: (req: any) => {
      const id = req.query?.id || req.params?.id
      const item = dictItems.find(i => i.id === id)

      if (item) {
        return {
          code: 0,
          data: item,
          msg: 'success',
        }
      }

      return {
        code: 404,
        msg: '字典项不存在',
      }
    },
  },

  // 创建字典项
  {
    url: '/api/dict/item/create',
    method: 'post',
    response: (req: any) => {
      const newItem = {
        id: (dictItems.length + 1).toString(),
        ...req.body,
        createTime: new Date().toISOString(),
        updateTime: new Date().toISOString(),
      }

      dictItems.push(newItem)

      return {
        code: 0,
        data: newItem,
        msg: '创建成功',
      }
    },
  },

  // 更新字典项
  {
    url: '/api/dict/item/update/:id',
    method: 'put',
    response: (req: any) => {
      const id = req.query?.id || req.params?.id
      const itemIndex = dictItems.findIndex(i => i.id === id)

      if (itemIndex !== -1) {
        dictItems[itemIndex] = {
          ...dictItems[itemIndex],
          ...req.body,
          updateTime: new Date().toISOString(),
        }

        return {
          code: 0,
          data: dictItems[itemIndex],
          msg: '更新成功',
        }
      }

      return {
        code: 404,
        msg: '字典项不存在',
      }
    },
  },

  // 删除字典项
  {
    url: '/api/dict/item/delete/:id',
    method: 'delete',
    response: (req: any) => {
      const id = req.query?.id || req.params?.id
      const itemIndex = dictItems.findIndex(i => i.id === id)

      if (itemIndex !== -1) {
        dictItems.splice(itemIndex, 1)

        return {
          code: 0,
          data: true,
          msg: '删除成功',
        }
      }

      return {
        code: 404,
        msg: '字典项不存在',
      }
    },
  },

  // 批量删除字典项
  {
    url: '/api/dict/item/batch-delete',
    method: 'post',
    response: (req: any) => {
      const { ids } = req.body

      ids.forEach((id: string) => {
        const itemIndex = dictItems.findIndex(i => i.id === id)
        if (itemIndex !== -1) {
          dictItems.splice(itemIndex, 1)
        }
      })

      return {
        code: 0,
        data: true,
        msg: '删除成功',
      }
    },
  },

  // 导出字典项列表
  {
    url: '/api/dict/item/export',
    method: 'get',
    response: () => {
      return {
        code: 0,
        data: 'export success',
        msg: '导出成功',
      }
    },
  },
] as MockMethod[]
