#!/usr/bin/env node
/* eslint-disable */
import { readFile, writeFile, mkdir } from 'node:fs/promises'
import { createInterface } from 'node:readline/promises'
import { fileURLToPath } from 'node:url'
import process from 'node:process'

const __dirname = dirname(fileURLToPath(import.meta.url))
const SRC_DIR = join(__dirname, '..', 'src')

const rl = createInterface({
  input: process.stdin,
  output: process.stdout
})

async function question(q) {
  const answer = await rl.question(q)
  return answer.trim()
}

async function main() {
  console.log('\n🚀 Vue Admin 模块生成器\n')

  // 收集用户输入
  const domain = await question('模块英文标识（如：log、dept、notice）：')
  if (!domain) {
    console.error('❌ 模块标识不能为空')
    process.exit(1)
  }

  const nameZh =
    (await question('模块中文名称（如：日志管理）：')) || `${domain}管理`
  const parent =
    (await question('父模块（留空表示顶级模块，如：system）：')) || ''

  const basePath = parent
    ? join(SRC_DIR, 'modules', parent, domain)
    : join(SRC_DIR, 'modules', domain)

  if (await exists(basePath)) {
    console.error(`❌ 模块已存在: ${basePath}`)
    process.exit(1)
  }

  const PascalName = domain.charAt(0).toUpperCase() + domain.slice(1)

  console.log(`\n📁 将在以下路径生成模块:`)
  console.log(`   ${basePath}\n`)

  const confirm = await question('确认生成？(y/N) ')
  if (confirm.toLowerCase() !== 'y') {
    console.log('已取消')
    process.exit(0)
  }

  // 创建目录
  await mkdir(join(basePath, 'views'), { recursive: true })

  // 生成 API 文件
  const apiTemplate = generateApiTemplate(domain, PascalName)
  await writeFile(join(basePath, 'api.ts'), apiTemplate)
  console.log(`✅ 生成 api.ts`)

  // 生成 List.vue
  const listTemplate = generateListTemplate(domain, PascalName, nameZh)
  await writeFile(join(basePath, 'views', 'List.vue'), listTemplate)
  console.log(`✅ 生成 views/List.vue`)

  // 生成 FormDrawer.vue
  const formDrawerTemplate = generateFormDrawerTemplate(
    domain,
    PascalName,
    nameZh
  )
  await writeFile(
    join(basePath, 'views', `${PascalName}FormDrawer.vue`),
    formDrawerTemplate
  )
  console.log(`✅ 生成 views/${PascalName}FormDrawer.vue`)

  // 生成 mock API
  const mockPath = join(SRC_DIR, 'mock', 'apis', `${domain}.ts`)
  const mockTemplate = generateMockTemplate(domain, PascalName)
  await writeFile(mockPath, mockTemplate)
  console.log(`✅ 生成 mock/apis/${domain}.ts`)

  // 更新路由菜单
  await updateMenusRouter(domain, PascalName, nameZh, parent)
  console.log(`✅ 更新路由配置`)

  console.log('\n🎉 模块生成完成！')
  console.log(`\n📝 下一步：`)
  console.log(`   1. 在 src/mock/index.ts 中导入 mock/apis/${domain}.ts`)
  console.log(`   2. 根据实际需求修改字段配置`)
  console.log(`   3. 运行 pnpm dev 查看效果\n`)

  rl.close()
}

function generateApiTemplate(domain, PascalName) {
  return `// ${domain} 领域 API。
import { api } from '@/lib/http/client'

export interface ${PascalName}Info {
  id: string
  name: string
  description?: string
  status: 'active' | 'inactive'
  createTime: string
  updateTime: string
}

export interface ${PascalName}SearchRequest {
  keyword: string
  status: string
  page: number
  size: number
}

export interface ${PascalName}CreateRequest {
  name: string
  description?: string
  status: 'active' | 'inactive'
}

export interface ${PascalName}SearchResponse {
  records: ${PascalName}Info[]
  total: number
  current: number
  size: number
}

export const fetch${PascalName}List = (params: ${PascalName}SearchRequest) =>
  api.get<${PascalName}SearchResponse>('/api/${domain}', { params })

export const fetch${PascalName}Detail = (id: string) =>
  api.get<${PascalName}Info>(\`/api/${domain}/\${id}\`)

export const create${PascalName} = (data: ${PascalName}CreateRequest) =>
  api.post<${PascalName}Info>('/api/${domain}', data)

export const update${PascalName} = (id: string, data: Partial<${PascalName}CreateRequest>) =>
  api.put<${PascalName}Info>(\`/api/${domain}/\${id}\`, data)

export const delete${PascalName} = (id: string) =>
  api.del<boolean>(\`/api/${domain}/\${id}\`)

export const batchDelete${PascalName}s = (ids: string[]) =>
  api.del<boolean>('/api/${domain}', { data: { ids } })

export const export${PascalName}s = () =>
  api.get<string>('/api/${domain}/export')
`
}

function generateListTemplate(domain, PascalName, nameZh) {
  return `<template>
  <PageContainer title="${nameZh}">
    <SearchTable
      :loading="loading"
      :data="tableData"
      :columns="columns"
      :pagination="pagination"
      :selected-rows="tableSelectedRows"
      selectable
      row-key="id"
      @search="handleSearch"
      @reset="handleReset"
      @page-change="handlePageChange"
      @selection-change="onSelectionChange"
    >
      <template #search>
        <el-input
          v-model="searchForm.keyword"
          placeholder="名称或描述"
          clearable
          style="width: 220px"
          @keyup.enter="handleSearch"
        />
        <el-select
          v-model="searchForm.status"
          clearable
          placeholder="状态"
          style="width: 120px"
        >
          <el-option
            label="启用"
            value="active"
          />
          <el-option
            label="禁用"
            value="inactive"
          />
        </el-select>
      </template>

      <template #actions>
        <el-button
          type="primary"
          :icon="Plus"
          @click="openDrawer('add')"
        >
          新增
        </el-button>
        <el-button
          type="danger"
          :icon="Delete"
          :disabled="selectedRows.length === 0"
          @click="handleBatchDelete"
        >
          批量删除
        </el-button>
        <el-button
          :icon="Refresh"
          @click="fetchList"
        >
          刷新
        </el-button>
      </template>

      <template #col-status="{ row }">
        <el-tag
          :type="row.status === 'active' ? 'success' : 'danger'"
          size="small"
        >
          {{ row.status === 'active' ? '启用' : '禁用' }}
        </el-tag>
      </template>

      <template #col-createTime="{ row }">
        {{ formatDate(row.createTime) }}
      </template>

      <template #col-updateTime="{ row }">
        {{ formatDate(row.updateTime) }}
      </template>

      <template #col-actions="{ row }">
        <el-button
          link
          type="primary"
          size="small"
          @click="openDrawer('view', row)"
        >
          查看
        </el-button>
        <el-button
          link
          type="primary"
          size="small"
          @click="openDrawer('edit', row)"
        >
          编辑
        </el-button>
        <el-button
          link
          type="danger"
          size="small"
          @click="handleDelete(row.id)"
        >
          删除
        </el-button>
      </template>
    </SearchTable>

    <${PascalName}FormDrawer
      v-model="drawerVisible"
      :mode="drawerMode"
      :data="editingRow"
      @success="onFormSuccess"
    />
  </PageContainer>
</template>

<script lang="ts" setup>
import { ref, computed, onMounted } from 'vue'
import { Plus, Delete, Refresh } from '@element-plus/icons-vue'
import { SearchTable, PageContainer } from '@/app/components'
import { useCrud } from '@/app/composables/useCrud'
import { formatDate } from '@/lib/format'
import type { ColumnDef } from '@/app/components/SearchTable/types'
import {
  fetch${PascalName}List,
  delete${PascalName},
  batchDelete${PascalName}s,
  type ${PascalName}Info,
  type ${PascalName}SearchRequest,
} from '../api'
import ${PascalName}FormDrawer from './${PascalName}FormDrawer.vue'

const {
  listData,
  loading,
  pagination,
  searchForm,
  selectedRows,
  fetchList,
  handleSearch,
  handleReset,
  handlePageChange,
  handleSelectionChange,
  handleDelete,
  handleBatchDelete,
} = useCrud<${PascalName}Info>({
  fetch: (params) => fetch${PascalName}List(params as unknown as ${PascalName}SearchRequest),
  remove: delete${PascalName},
  batchRemove: batchDelete${PascalName}s,
  defaultSearchForm: { keyword: '', status: '' },
  pageSize: 10,
})

const onSelectionChange = (rows: Record<string, unknown>[]) => {
  handleSelectionChange(rows as unknown as ${PascalName}Info[])
}

const tableData = computed(() => listData.value as unknown as Record<string, unknown>[])
const tableSelectedRows = computed(() => selectedRows.value as unknown as Record<string, unknown>[])

const columns: ColumnDef[] = [
  { prop: 'name', label: '名称', minWidth: 140 },
  { prop: 'description', label: '描述', minWidth: 200 },
  { prop: 'status', label: '状态', minWidth: 90, slot: 'status' },
  { prop: 'createTime', label: '创建时间', minWidth: 170, slot: 'createTime' },
  { prop: 'updateTime', label: '更新时间', minWidth: 170, slot: 'updateTime' },
  { prop: 'actions', label: '操作', width: 200, fixed: 'right', slot: 'actions' },
]

const drawerVisible = ref(false)
const drawerMode = ref<'add' | 'edit' | 'view'>('add')
const editingRow = ref<${PascalName}Info | null>(null)

const openDrawer = (mode: 'add' | 'edit' | 'view', row?: ${PascalName}Info) => {
  drawerMode.value = mode
  editingRow.value = row ?? null
  drawerVisible.value = true
}

const onFormSuccess = () => {
  drawerVisible.value = false
  fetchList()
}

onMounted(fetchList)
</script>
`
}

function generateFormDrawerTemplate(domain, PascalName, nameZh) {
  return `<template>
  <FormDrawer
    v-model="visible"
    :title="drawerTitle"
    :mode="mode"
    :form-data="formData"
    :fields="fields"
    :rules="rules"
    :loading="submitting"
    width="500px"
    @submit="handleSubmit"
  />
</template>

<script lang="ts" setup>
import { ref, watch, reactive, computed } from 'vue'
import { FormDrawer } from '@/app/components'
import type { FormField, FormDrawerMode } from '@/app/components/FormDrawer/types'
import { ElMessage } from 'element-plus'
import {
  create${PascalName},
  update${PascalName},
  type ${PascalName}Info,
  type ${PascalName}CreateRequest,
} from '../api'

const props = defineProps<{
  modelValue: boolean
  mode: FormDrawerMode
  data: ${PascalName}Info | null
}>()

const emit = defineEmits<{
  'update:modelValue': [v: boolean]
  success: []
}>()

const visible = ref(props.modelValue)
const submitting = ref(false)

watch(() => props.modelValue, (v) => {
  visible.value = v
  if (v) initForm()
})
watch(visible, (v) => emit('update:modelValue', v))

const formData = reactive<${PascalName}CreateRequest>({
  name: '',
  description: '',
  status: 'active',
})

const drawerTitle = computed(() => {
  if (props.mode === 'add') return '新增${nameZh.slice(0, -2)}'
  if (props.mode === 'edit') return '编辑${nameZh.slice(0, -2)}'
  return '查看${nameZh.slice(0, -2)}'
})

const fields: FormField[] = [
  { prop: 'name', label: '名称', type: 'input', span: 24 },
  {
    prop: 'status',
    label: '状态',
    type: 'radio',
    span: 24,
    options: [
      { label: '启用', value: 'active' },
      { label: '禁用', value: 'inactive' },
    ],
  },
  { prop: 'description', label: '描述', type: 'textarea', span: 24 },
]

const rules = {
  name: [{ required: true, message: '请输入名称', trigger: 'blur' }],
  status: [{ required: true, message: '请选择状态', trigger: 'change' }],
  description: [{ max: 500, message: '描述长度不能超过500个字符', trigger: 'blur' }],
}

const initForm = () => {
  if (props.mode === 'edit' && props.data) {
    Object.assign(formData, {
      name: props.data.name,
      description: props.data.description,
      status: props.data.status,
    })
  } else {
    Object.assign(formData, {
      name: '',
      description: '',
      status: 'active',
    })
  }
}

const handleSubmit = async () => {
  submitting.value = true
  try {
    if (props.mode === 'add') {
      await create${PascalName}(formData)
      ElMessage.success('新增成功')
    } else {
      await update${PascalName}(props.data!.id, formData)
      ElMessage.success('更新成功')
    }
    emit('success')
    emit('update:modelValue', false)
  } finally {
    submitting.value = false
  }
}
</script>
`
}

function generateMockTemplate(domain, PascalName) {
  return `// ${domain} mock API
import Mock from 'mockjs'
import { defineMock } from 'vite-plugin-mock-dev-server'

const dataList: any[] = []

for (let i = 1; i <= 50; i++) {
  dataList.push(Mock.mock({
    id: '@guid',
    name: '@ctitle(5, 10)',
    description: '@ctitle(20, 50)',
    'status|1': ['active', 'inactive'],
    createTime: '@datetime("yyyy-MM-dd HH:mm:ss")',
    updateTime: '@datetime("yyyy-MM-dd HH:mm:ss")',
  }))
}

export default defineMock([
  {
    url: '/api/${domain}',
    method: 'GET',
    response: ({ query }) => {
      const { page = 1, size = 10, keyword = '', status = '', all } = query

      if (all === 'true') {
        return {
          code: 0,
          data: dataList,
          msg: 'success',
        }
      }

      let filtered = [...dataList]

      if (keyword) {
        const kw = keyword.toLowerCase()
        filtered = filtered.filter(
          (item) =>
            item.name.toLowerCase().includes(kw) ||
            item.description?.toLowerCase().includes(kw),
        )
      }

      if (status) {
        filtered = filtered.filter((item) => item.status === status)
      }

      const start = (Number(page) - 1) * Number(size)
      const end = start + Number(size)
      const records = filtered.slice(start, end)

      return {
        code: 0,
        data: {
          records,
          total: filtered.length,
          current: Number(page),
          size: Number(size),
        },
        msg: 'success',
      }
    },
  },
  {
    url: '/api/${domain}/:id',
    method: 'GET',
    response: ({ params }) => {
      const item = dataList.find((d) => d.id === params.id)
      if (!item) {
        return { code: -1, data: null, msg: '数据不存在' }
      }
      return { code: 0, data: item, msg: 'success' }
    },
  },
  {
    url: '/api/${domain}',
    method: 'POST',
    response: ({ body }) => {
      const newItem = {
        id: Mock.Random.guid(),
        ...body,
        createTime: new Date().toISOString().slice(0, 19).replace('T', ' '),
        updateTime: new Date().toISOString().slice(0, 19).replace('T', ' '),
      }
      dataList.unshift(newItem)
      return { code: 0, data: newItem, msg: 'success' }
    },
  },
  {
    url: '/api/${domain}/:id',
    method: 'PUT',
    response: ({ params, body }) => {
      const index = dataList.findIndex((d) => d.id === params.id)
      if (index === -1) {
        return { code: -1, data: null, msg: '数据不存在' }
      }
      dataList[index] = {
        ...dataList[index],
        ...body,
        updateTime: new Date().toISOString().slice(0, 19).replace('T', ' '),
      }
      return { code: 0, data: dataList[index], msg: 'success' }
    },
  },
  {
    url: '/api/${domain}/:id',
    method: 'DELETE',
    response: ({ params }) => {
      const index = dataList.findIndex((d) => d.id === params.id)
      if (index === -1) {
        return { code: -1, data: false, msg: '数据不存在' }
      }
      dataList.splice(index, 1)
      return { code: 0, data: true, msg: 'success' }
    },
  },
  {
    url: '/api/${domain}',
    method: 'DELETE',
    response: ({ body }) => {
      const { ids } = body
      ids.forEach((id: string) => {
        const index = dataList.findIndex((d) => d.id === id)
        if (index !== -1) {
          dataList.splice(index, 1)
        }
      })
      return { code: 0, data: true, msg: 'success' }
    },
  },
  {
    url: '/api/${domain}/export',
    method: 'GET',
    response: () => {
      return {
        code: 0,
        data: 'data:text/csv;charset=utf-8,名称,状态,创建时间\n测试,active,2024-01-01 00:00:00',
        msg: 'success',
      }
    },
  },
])
`
}

async function updateMenusRouter(domain, PascalName, nameZh, parent) {
  const menusPath = join(SRC_DIR, 'router', 'menus.ts')
  let content = await readFile(menusPath, 'utf8')

  // 找到要插入的位置
  const componentPath = parent
    ? `../modules/${parent}/${domain}/views/List.vue`
    : `../modules/${domain}/views/List.vue`

  const menuPath = parent ? `/${parent}/${domain}` : `/${domain}`

  const newRoute = `    {
      path: '${domain}',
      name: '${PascalName}Management',
      component: () => import('${componentPath}'),
      meta: {
        title: '${nameZh}',
        icon: 'Document',
      },
    },`

  if (parent) {
    // 在父模块的 children 中插入
    const parentPattern = new RegExp(
      `path:\\s*['"]${parent}['"][\\s\\S]*?children:\\s*\\[`
    )
    const match = content.match(parentPattern)
    if (match) {
      const insertPos = match.index + match[0].length
      content =
        content.slice(0, insertPos) + '\n' + newRoute + content.slice(insertPos)
    } else {
      console.warn(`⚠️ 未找到父模块 ${parent}，请手动添加路由`)
      return
    }
  } else {
    // 在 Layout children 的末尾添加
    const insertPattern = /path:\s*['"]profile['"][\s\S]*?\},\s*\n/
    const match = content.match(insertPattern)
    if (match) {
      const insertPos = match.index + match[0].length
      content =
        content.slice(0, insertPos) + newRoute + '\n' + content.slice(insertPos)
    } else {
      console.warn(`⚠️ 未找到合适的位置插入路由，请手动添加`)
      return
    }
  }

  await writeFile(menusPath, content)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
