# M7-C 业务页面闭环验证 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将 admin/role/permission/dict 4 个 List.vue 重构为通用组件库模式，实现 system/menu 树形 CRUD，补齐 user/List.vue 简化项，使所有业务页面标准化。

**Architecture:** 以 M7-B 已建立的通用组件库（SearchTable / FormDrawer / PageContainer / useCrud）为基础。Task 1-2 先增强 FormDrawer（mode + dependencies + field-level validator + password/treeSelect 字段类型），向 vben 标准靠拢；Task 3 在 user 上验证增强；Task 4-6 重构 admin/role/permission 3 个同构模块；Task 7 dict 仅包裹 PageContainer；Task 8-9 实现 menu 树形 CRUD（零新依赖，用 EP 原生 el-tree draggable）；Task 10-11 smoke 扩展与文档同步；Task 12 最终验证 + push。

**Tech Stack:** Vue 3.5 + Vite 7 + TypeScript 5.9 + Element Plus 2.11 + Pinia 2.2 + Vitest 3 + Playwright 1.61

## Global Constraints

- **路径别名**：`@/` → `src/`（已在 vite.config.ts 与 tsconfig.json 配置）
- **Node 版本**：v22.22.0 LTS，所有 pnpm/git 命令前置 `PATH="/Users/wangtao/.nvm/versions/node/v22.22.0/bin:$PATH"`（husky lint-staged 需要 Node 22）
- **四层架构**：lib/ → app/ → modules/ → shared/，由 ESLint `no-restricted-imports` 强制
- **零新依赖**：如无必要不加依赖。menu 树形 CRUD 用 EP 原生 el-tree draggable，不引入 vue-draggable-next
- **不向现有设计妥协**：FormDrawer 增强向 vben 路线靠拢（schema 驱动 + dependencies + field-level validator），不全量改 Grid
- **Store 必须用 setup 风格**：`defineStore('<domain>', () => { ... })`
- **单 .vue 文件不超过 500 行**：重构后 List.vue 目标 < 250 行（dict 除外）
- **测试账号**：admin/123456（super_admin，全权限）；user/123456（user 角色，user:read）
- **ESLint 严格类型**：禁止 `any`，用 `unknown` 或具体类型；`as unknown as` 双重断言仅在第三方类型联合体时用且加注释
- **提交信息**：`type(scope): subject` 格式，type 用 feat/refactor/test/docs/chore/fix
- **dev server smoke**：用 `pnpm dev --host 127.0.0.1 --strictPort`，vite-plugin-mock 仅在 dev 工作
- **作者信息**：如水 <rushui@qq.com>，GitHub 所有者 vue-admin/vue-admin

---

### Task 1: FormDrawer types 扩展 + 新字段类型

**Files:**
- Modify: `src/app/components/FormDrawer/types.ts`

**Interfaces:**
- Produces: `FormDrawerMode` 类型、`FormFieldDependency` 接口、`FormField` 增加 `dependencies`/`rules` 字段、`FormDrawerProps` 增加 `mode` 字段、`FormFieldType` 增加 `password`/`treeSelect`/`cascader`

- [x] **Step 1: 写完整新 types.ts**

替换 `src/app/components/FormDrawer/types.ts` 全部内容：

```ts
export type FormFieldType =
  | 'input' | 'textarea' | 'number' | 'select' | 'radio' | 'checkbox'
  | 'switch' | 'date' | 'password' | 'treeSelect' | 'cascader'

export type FormDrawerMode = 'add' | 'edit' | 'view'

export interface FormFieldOption {
  label: string
  value: string | number | boolean
}

export interface FormFieldDependency {
  /** 触发字段名 */
  trigger: string
  /** 显示条件，返回 true 时字段可见 */
  show: (values: Record<string, unknown>, ctx: { mode: FormDrawerMode }) => boolean
}

/** Element Plus FormItemRule 的子集，避免导入 element-plus 类型造成循环依赖 */
export interface FormFieldRule {
  required?: boolean
  message?: string
  trigger?: string | string[]
  min?: number
  max?: number
  type?: string
  pattern?: RegExp
  validator?: (rule: unknown, value: unknown, callback: (error?: Error) => void) => void
}

export interface FormField {
  prop: string
  label: string
  type: FormFieldType
  options?: FormFieldOption[]
  /** treeSelect 字段的树形数据 */
  treeData?: TreeNodeData[]
  /** treeSelect 字段的 props 配置 */
  treeProps?: { label: string; children: string; disabled?: string }
  placeholder?: string
  default?: unknown
  span?: number
  disabled?: boolean
  /** 声明式联动：所有 dependency 的 show 都返回 true 时字段才可见 */
  dependencies?: FormFieldDependency[]
  /** field-level 校验规则，透传到 el-form-item */
  rules?: FormFieldRule[]
}

export interface TreeNodeData {
  id: string | number
  label?: string
  children?: TreeNodeData[]
  [key: string]: unknown
}

export interface FormDrawerProps {
  modelValue: boolean
  title: string
  formData: Record<string, unknown>
  fields: FormField[]
  rules?: Record<string, FormFieldRule[]>
  loading?: boolean
  width?: string
  /** 抽屉模式，view 时全字段 disabled 且 footer 仅显示关闭按钮。默认 'add' */
  mode?: FormDrawerMode
}
```

- [x] **Step 2: 验证 type-check**

```bash
PATH="/Users/wangtao/.nvm/versions/node/v22.22.0/bin:$PATH" pnpm type-check
```

Expected: 0 error（types 改动是纯增量，旧用法 `FormField` 不带 `dependencies`/`rules` 仍兼容）

- [x] **Step 3: 验证现有 FormDrawer 测试仍绿**

```bash
PATH="/Users/wangtao/.nvm/versions/node/v22.22.0/bin:$PATH" pnpm test FormDrawer
```

Expected: 3 passed（types 扩展不影响运行时）

- [x] **Step 4: Commit**

```bash
PATH="/Users/wangtao/.nvm/versions/node/v22.22.0/bin:$PATH" git add src/app/components/FormDrawer/types.ts
PATH="/Users/wangtao/.nvm/versions/node/v22.22.0/bin:$PATH" git commit -m "feat(form-drawer): extend types with mode/dependencies/rules/treeSelect"
```

---

### Task 2: FormDrawer 组件实现 mode + dependencies + 新字段类型 + 4 测试

**Files:**
- Modify: `src/app/components/FormDrawer/index.vue`
- Modify: `test/app/components/FormDrawer.spec.ts`

**Interfaces:**
- Consumes: Task 1 的 `FormDrawerMode` / `FormFieldDependency` / `FormFieldRule` / 新 `FormFieldType`
- Produces: `<FormDrawer>` 支持 `mode` prop（view 全字段 disabled + footer 关闭按钮）、字段 `dependencies` 显隐联动、字段 `rules` field-level 校验、`password`/`treeSelect` 字段类型

- [x] **Step 1: 写 4 个失败测试**

在 `test/app/components/FormDrawer.spec.ts` 文件末尾（现有 3 个测试后）追加：

```ts
  it('view 模式所有字段 disabled', async () => {
    const wrapper = mount(FormDrawer, {
      props: {
        modelValue: true,
        title: '查看',
        mode: 'view',
        formData: { name: 'a' },
        fields: [{ prop: 'name', label: '名称', type: 'input' as const }]
      },
      global
    })
    await flushPromises()
    const input = wrapper.find('input')
    expect(input.attributes('disabled')).toBeDefined()
  })

  it('view 模式 footer 仅显示关闭按钮', async () => {
    const wrapper = mount(FormDrawer, {
      props: {
        modelValue: true,
        title: '查看',
        mode: 'view',
        formData: {},
        fields: []
      },
      global
    })
    await flushPromises()
    const footerButtons = wrapper.findAll('.el-drawer__footer .el-button, .el-drawer footer .el-button')
    const footerText = wrapper.find('footer').text() + wrapper.find('.el-drawer__footer').text()
    expect(footerText).toContain('关闭')
    expect(footerText).not.toContain('确认')
  })

  it('dependencies 联动隐藏字段', async () => {
    const wrapper = mount(FormDrawer, {
      props: {
        modelValue: true,
        title: '测试',
        mode: 'edit',
        formData: { showExtra: false, extra: '' },
        fields: [
          { prop: 'showExtra', label: '显示扩展', type: 'switch' as const },
          {
            prop: 'extra',
            label: '扩展字段',
            type: 'input' as const,
            dependencies: [
              {
                trigger: 'showExtra',
                show: (values) => values.showExtra === true
              }
            ]
          }
        ]
      },
      global
    })
    await flushPromises()
    // 初始 showExtra=false，extra 字段应不显示
    expect(wrapper.text()).not.toContain('扩展字段')
    // 切换 showExtra=true
    await wrapper.find('.el-switch').trigger('click')
    await flushPromises()
    expect(wrapper.text()).toContain('扩展字段')
  })

  it('field-level rules 透传到 el-form-item', async () => {
    const wrapper = mount(FormDrawer, {
      props: {
        modelValue: true,
        title: '测试',
        mode: 'add',
        formData: { name: '' },
        fields: [
          {
            prop: 'name',
            label: '名称',
            type: 'input' as const,
            rules: [{ required: true, message: '名称必填', trigger: 'blur' }]
          }
        ]
      },
      global
    })
    await flushPromises()
    // el-form-item 的 required 属性应反映 rules 中的 required
    const formItem = wrapper.find('.el-form-item')
    expect(formItem.classes()).toContain('is-required')
  })
```

注意：测试文件顶部需补 import：

```ts
import { flushPromises } from '@vue/test-utils'
```

- [x] **Step 2: 运行测试确认失败**

```bash
PATH="/Users/wangtao/.nvm/versions/node/v22.22.0/bin:$PATH" pnpm test FormDrawer
```

Expected: 4 个新测试 FAIL（mode 默认未生效、dependencies 未实现、footer 未按 mode 切换）

- [x] **Step 3: 实现 FormDrawer/index.vue 完整版**

替换 `src/app/components/FormDrawer/index.vue` 全部内容：

```vue
<template>
  <el-drawer
    :model-value="modelValue"
    :title="title"
    :size="width"
    @update:model-value="$emit('update:modelValue', $event)"
  >
    <div
      v-loading="loading"
      class="form-drawer-body"
    >
      <el-form
        ref="formRef"
        :model="formData"
        :rules="rules"
        label-width="100px"
      >
        <el-row :gutter="16">
          <el-col
            v-for="field in visibleFields"
            :key="field.prop"
            :span="field.span || 24"
          >
            <el-form-item
              :label="field.label"
              :prop="field.prop"
              :rules="field.rules"
            >
              <slot
                :name="`field-${field.prop}`"
                :field="field"
              >
                <component
                  :is="resolveComponent(field.type)"
                  v-model="formData[field.prop]"
                  :placeholder="field.placeholder || `请输入${field.label}`"
                  :disabled="field.disabled || loading || mode === 'view'"
                  v-bind="resolveExtraProps(field)"
                >
                  <template v-if="field.type === 'select'">
                    <el-option
                      v-for="opt in field.options"
                      :key="String(opt.value)"
                      :label="opt.label"
                      :value="opt.value"
                    />
                  </template>
                  <template v-if="field.type === 'radio'">
                    <el-radio
                      v-for="opt in field.options"
                      :key="String(opt.value)"
                      :value="opt.value"
                    >
                      {{ opt.label }}
                    </el-radio>
                  </template>
                  <template v-if="field.type === 'treeSelect'">
                    <el-tree-select
                      v-model="formData[field.prop]"
                      :data="field.treeData"
                      :props="field.treeProps || { label: 'label', children: 'children' }"
                      node-key="id"
                      check-strictly
                      :placeholder="field.placeholder || `请选择${field.label}`"
                      :disabled="field.disabled || loading || mode === 'view'"
                    />
                  </template>
                </component>
              </slot>
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
    </div>

    <template #footer>
      <el-button v-if="mode === 'view'" @click="handleCancel">
        关闭
      </el-button>
      <template v-else>
        <el-button @click="handleCancel">
          取消
        </el-button>
        <el-button
          type="primary"
          :loading="loading"
          @click="handleConfirm"
        >
          确认
        </el-button>
      </template>
    </template>
  </el-drawer>
</template>

<script lang="ts" setup>
import { ref, computed } from 'vue'
import type { FormInstance } from 'element-plus'
import type { FormDrawerProps, FormField, FormFieldType } from './types'

const props = withDefaults(defineProps<FormDrawerProps>(), {
  loading: false,
  width: '500px',
  mode: 'add'
})

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  submit: [data: Record<string, unknown>]
}>()

const formRef = ref<FormInstance>()

const componentMap: Record<FormFieldType, string> = {
  input: 'el-input',
  textarea: 'el-input',
  number: 'el-input-number',
  select: 'el-select',
  radio: 'el-radio-group',
  checkbox: 'el-checkbox-group',
  switch: 'el-switch',
  date: 'el-date-picker',
  password: 'el-input',
  treeSelect: 'el-tree-select',
  cascader: 'el-cascader'
}

const resolveComponent = (type: FormField['type']): string => componentMap[type] || 'el-input'

const resolveExtraProps = (field: FormField): Record<string, unknown> => {
  if (field.type === 'textarea') return { type: 'textarea', rows: 3 }
  if (field.type === 'password') return { type: 'password', showPassword: true }
  return {}
}

/** 声明式显隐：字段的 dependencies 全部 show 返回 true 时才可见 */
const visibleFields = computed(() => {
  return props.fields.filter((field) => {
    if (!field.dependencies || field.dependencies.length === 0) return true
    return field.dependencies.every((dep) =>
      dep.show(props.formData, { mode: props.mode })
    )
  })
})

const handleCancel = (): void => emit('update:modelValue', false)

const handleConfirm = async (): Promise<void> => {
  if (!formRef.value) return
  try {
    await formRef.value.validate()
    emit('submit', { ...props.formData })
  } catch {
    // 校验失败，element-plus 会显示错误
  }
}

defineExpose({
  /** 暴露 formRef 供调用方手动触发关联字段重校验 */
  validateField: (prop: string) => formRef.value?.validateField(prop)
})
</script>

<style lang="scss" scoped>
.form-drawer-body {
  min-height: 100%;
}
</style>
```

- [x] **Step 4: 运行测试确认通过**

```bash
PATH="/Users/wangtao/.nvm/versions/node/v22.22.0/bin:$PATH" pnpm test FormDrawer
```

Expected: 7 passed（原 3 + 新 4）

- [x] **Step 5: 验证全套**

```bash
PATH="/Users/wangtao/.nvm/versions/node/v22.22.0/bin:$PATH" pnpm type-check
PATH="/Users/wangtao/.nvm/versions/node/v22.22.0/bin:$PATH" pnpm lint
PATH="/Users/wangtao/.nvm/versions/node/v22.22.0/bin:$PATH" pnpm test
```

Expected: type-check 0 error / lint 0 error / 全套测试绿

- [x] **Step 6: Commit**

```bash
PATH="/Users/wangtao/.nvm/versions/node/v22.22.0/bin:$PATH" git add src/app/components/FormDrawer/index.vue test/app/components/FormDrawer.spec.ts
PATH="/Users/wangtao/.nvm/versions/node/v22.22.0/bin:$PATH" git commit -m "feat(form-drawer): implement mode/dependencies/field-rules and password/treeSelect types"
```

---

### Task 3: user/List.vue 补齐 view 模式 + lastLoginTime + 密码跨字段校验

**Files:**
- Modify: `src/modules/system/user/views/UserFormDrawer.vue`
- Modify: `src/modules/system/user/views/List.vue`

**Interfaces:**
- Consumes: Task 2 的 FormDrawer `mode` prop、`dependencies`、`rules` field-level、`validateField` expose、`password` 字段类型
- Produces: UserFormDrawer 支持 view 模式 + confirmPassword 跨字段校验；List.vue 有查看按钮 + lastLoginTime 列

- [x] **Step 1: 重写 UserFormDrawer.vue**

替换 `src/modules/system/user/views/UserFormDrawer.vue` 全部内容：

```vue
<template>
  <FormDrawer
    ref="formDrawerRef"
    v-model="visible"
    :title="drawerTitle"
    :mode="mode"
    :form-data="formData"
    :fields="fields"
    :loading="submitting"
    width="600px"
    @submit="handleSubmit"
  />
</template>

<script lang="ts" setup>
import { ref, watch, reactive, computed } from 'vue'
import { FormDrawer } from '@/app/components'
import type { FormField, FormDrawerMode } from '@/app/components/FormDrawer/types'
import { ElMessage } from 'element-plus'
import {
  createUser,
  updateUser,
  type UserInfo,
  type UserCreateRequest,
} from '../api'

const props = defineProps<{
  modelValue: boolean
  mode: FormDrawerMode
  data: UserInfo | null
}>()

const emit = defineEmits<{
  'update:modelValue': [v: boolean]
  success: []
}>()

const visible = ref(props.modelValue)
const submitting = ref(false)
const formDrawerRef = ref<InstanceType<typeof FormDrawer>>()

watch(() => props.modelValue, (v) => {
  visible.value = v
  if (v) initForm()
})
watch(visible, (v) => emit('update:modelValue', v))

const formData = reactive<UserCreateRequest & { confirmPassword: string }>({
  username: '',
  realName: '',
  email: '',
  phone: '',
  role: 'user',
  status: 'active',
  password: '',
  confirmPassword: '',
})

const drawerTitle = computed(() => {
  if (props.mode === 'add') return '新增用户'
  if (props.mode === 'edit') return '编辑用户'
  return '查看用户'
})

const fields = computed<FormField[]>(() => [
  { prop: 'username', label: '用户名', type: 'input', span: 12 },
  { prop: 'realName', label: '姓名', type: 'input', span: 12 },
  { prop: 'email', label: '邮箱', type: 'input', span: 12 },
  { prop: 'phone', label: '电话', type: 'input', span: 12 },
  {
    prop: 'role',
    label: '角色',
    type: 'select',
    span: 12,
    options: [
      { label: '管理员', value: 'admin' },
      { label: '普通用户', value: 'user' },
      { label: 'VIP用户', value: 'vip' },
    ],
  },
  {
    prop: 'status',
    label: '状态',
    type: 'select',
    span: 12,
    options: [
      { label: '启用', value: 'active' },
      { label: '禁用', value: 'inactive' },
    ],
  },
  {
    prop: 'password',
    label: '密码',
    type: 'password',
    span: 12,
    placeholder: props.mode === 'edit' ? '编辑时留空表示不修改' : '请输入密码',
    dependencies: [
      { trigger: 'mode', show: (_, ctx) => ctx.mode !== 'view' }
    ],
    rules: [
      { required: props.mode === 'add', message: '请输入密码', trigger: 'blur' },
      { min: 6, message: '密码长度至少6个字符', trigger: 'blur' },
    ],
  },
  {
    prop: 'confirmPassword',
    label: '确认密码',
    type: 'password',
    span: 12,
    dependencies: [
      { trigger: 'mode', show: (_, ctx) => ctx.mode !== 'view' }
    ],
    rules: [
      {
        required: props.mode === 'add',
        message: '请再次输入密码',
        trigger: 'blur',
      },
      {
        validator: (_rule, value, cb) => {
          if (value !== formData.password) {
            cb(new Error('两次输入的密码不一致'))
          } else {
            cb()
          }
        },
        trigger: ['blur', 'change'],
      },
    ],
  },
])

// password 字段变化时手动触发 confirmPassword 重校验（EP 2.11 不支持 relations prop）
watch(() => formData.password, () => {
  if (formData.confirmPassword) {
    formDrawerRef.value?.validateField('confirmPassword')
  }
})

const rules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 3, max: 20, message: '用户名长度应在3-20个字符之间', trigger: 'blur' },
  ],
  realName: [
    { required: true, message: '请输入姓名', trigger: 'blur' },
    { min: 2, max: 20, message: '姓名长度应在2-20个字符之间', trigger: 'blur' },
  ],
  email: [
    { required: true, message: '请输入邮箱', trigger: 'blur' },
    { type: 'email', message: '请输入有效的邮箱地址', trigger: ['blur', 'change'] },
  ],
  phone: [
    { required: true, message: '请输入电话', trigger: 'blur' },
    { pattern: /^1[3-9]\d{9}$/, message: '请输入有效的手机号', trigger: ['blur', 'change'] },
  ],
  role: [{ required: true, message: '请选择角色', trigger: 'change' }],
  status: [{ required: true, message: '请选择状态', trigger: 'change' }],
}

const initForm = () => {
  const empty = {
    username: '',
    realName: '',
    email: '',
    phone: '',
    role: 'user' as const,
    status: 'active' as const,
    password: '',
    confirmPassword: '',
  }
  if (props.mode === 'edit' && props.data) {
    const u = props.data
    Object.assign(formData, {
      username: u.username,
      realName: u.realName,
      email: u.email,
      phone: u.phone,
      role: u.role,
      status: u.status,
      password: '',
      confirmPassword: '',
    })
  } else {
    Object.assign(formData, empty)
  }
}

const handleSubmit = async (data: Record<string, unknown>) => {
  submitting.value = true
  try {
    const { confirmPassword: _omit, ...rest } = formData
    const payload = { ...rest, ...data } as UserCreateRequest
    // 编辑模式下若密码留空，则不修改密码
    if (props.mode === 'edit' && !payload.password) {
      delete payload.password
    }
    if (props.mode === 'add') {
      await createUser(payload)
      ElMessage.success('新增成功')
    } else {
      await updateUser(props.data!.id, payload)
      ElMessage.success('更新成功')
    }
    emit('success')
    emit('update:modelValue', false)
  } finally {
    submitting.value = false
  }
}
</script>
```

注意：`const { confirmPassword: _omit, ...rest } = formData` 解构会触发 ESLint `no-unused-vars`，需在变量前加 `_` 前缀（项目 ESLint 配置已忽略 `_` 开头的未用变量）。

- [x] **Step 2: 修改 List.vue**

修改 `src/modules/system/user/views/List.vue` 两处：

a) columns 数组增加 lastLoginTime 列（在 createTime 之后、actions 之前）：

找到：
```ts
  { prop: 'createTime', label: '创建时间', minWidth: 170, slot: 'createTime' },
  { prop: 'actions', label: '操作', width: 140, fixed: 'right', slot: 'actions' },
```

替换为：
```ts
  { prop: 'createTime', label: '创建时间', minWidth: 170, slot: 'createTime' },
  { prop: 'lastLoginTime', label: '最后登录', minWidth: 170, slot: 'lastLoginTime' },
  { prop: 'actions', label: '操作', width: 200, fixed: 'right', slot: 'actions' },
```

b) 模板中增加 lastLoginTime slot 和 查看 按钮：

找到 `<template #col-createTime>` 块后追加：
```vue
      <template #col-lastLoginTime="{ row }">
        {{ formatDate(row.lastLoginTime) }}
      </template>
```

找到 `<template #col-actions="{ row }">` 块内，在"编辑"按钮前加"查看"按钮：
```vue
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
```

c) `drawerMode` 类型扩展支持 view：

找到：
```ts
const drawerMode = ref<'add' | 'edit'>('add')
```
替换为：
```ts
const drawerMode = ref<'add' | 'edit' | 'view'>('add')
```

d) `openDrawer` 函数签名扩展支持 view：

找到：
```ts
const openDrawer = (mode: 'add' | 'edit', user?: UserInfo) => {
```
替换为：
```ts
const openDrawer = (mode: 'add' | 'edit' | 'view', user?: UserInfo) => {
```

- [x] **Step 3: 验证全套**

```bash
PATH="/Users/wangtao/.nvm/versions/node/v22.22.0/bin:$PATH" pnpm type-check
PATH="/Users/wangtao/.nvm/versions/node/v22.22.0/bin:$PATH" pnpm lint
PATH="/Users/wangtao/.nvm/versions/node/v22.22.0/bin:$PATH" pnpm test
PATH="/Users/wangtao/.nvm/versions/node/v22.22.0/bin:$PATH" pnpm build
```

Expected: 4 件套全绿

- [x] **Step 4: smoke 验证**

```bash
PATH="/Users/wangtao/.nvm/versions/node/v22.22.0/bin:$PATH" nohup pnpm dev --host 127.0.0.1 --strictPort > /tmp/vite-dev.log 2>&1 &
for i in $(seq 1 30); do curl -sf http://127.0.0.1:5173/ > /dev/null && break; sleep 1; done
PATH="/Users/wangtao/.nvm/versions/node/v22.22.0/bin:$PATH" pnpm smoke
lsof -ti:5173 | xargs kill 2>/dev/null || true
```

Expected: 5 passed（现有 smoke 不受影响）

- [x] **Step 5: Commit**

```bash
PATH="/Users/wangtao/.nvm/versions/node/v22.22.0/bin:$PATH" git add src/modules/system/user/views/UserFormDrawer.vue src/modules/system/user/views/List.vue
PATH="/Users/wangtao/.nvm/versions/node/v22.22.0/bin:$PATH" git commit -m "feat(user): restore view mode, lastLoginTime column and password cross-field validation"
```

---

### Task 4: admin/List.vue 重构 + AdminFormDrawer 抽离

**Files:**
- Create: `src/modules/system/views/admin/AdminFormDrawer.vue`
- Modify: `src/modules/system/views/admin/List.vue`

**Interfaces:**
- Consumes: Task 2 的 FormDrawer（mode + dependencies + password + rules）、SearchTable、useCrud、PageContainer
- Consumes: `src/modules/system/admin/api.ts` 的 `fetchAdminList` / `deleteAdmin` / `batchDeleteAdmins` / `createAdmin` / `updateAdmin` / `AdminInfo` / `AdminSearchRequest` / `AdminCreateRequest`
- Produces: admin/List.vue < 250 行，功能含 view/edit/add + 密码跨字段校验 + lastLoginTime 列

- [x] **Step 1: 创建 AdminFormDrawer.vue**

`src/modules/system/views/admin/AdminFormDrawer.vue`:

```vue
<template>
  <FormDrawer
    ref="formDrawerRef"
    v-model="visible"
    :title="drawerTitle"
    :mode="mode"
    :form-data="formData"
    :fields="fields"
    :loading="submitting"
    width="600px"
    @submit="handleSubmit"
  />
</template>

<script lang="ts" setup>
import { ref, watch, reactive, computed } from 'vue'
import { FormDrawer } from '@/app/components'
import type { FormField, FormDrawerMode } from '@/app/components/FormDrawer/types'
import { ElMessage } from 'element-plus'
import {
  createAdmin,
  updateAdmin,
  type AdminInfo,
  type AdminCreateRequest,
} from '../../admin/api'

const props = defineProps<{
  modelValue: boolean
  mode: FormDrawerMode
  data: AdminInfo | null
}>()

const emit = defineEmits<{
  'update:modelValue': [v: boolean]
  success: []
}>()

const visible = ref(props.modelValue)
const submitting = ref(false)
const formDrawerRef = ref<InstanceType<typeof FormDrawer>>()

watch(() => props.modelValue, (v) => {
  visible.value = v
  if (v) initForm()
})
watch(visible, (v) => emit('update:modelValue', v))

const formData = reactive<AdminCreateRequest & { confirmPassword: string }>({
  username: '',
  realName: '',
  email: '',
  phone: '',
  role: 'admin',
  status: 'active',
  password: '',
  confirmPassword: '',
})

const drawerTitle = computed(() => {
  if (props.mode === 'add') return '新增管理员'
  if (props.mode === 'edit') return '编辑管理员'
  return '查看管理员'
})

const fields = computed<FormField[]>(() => [
  { prop: 'username', label: '用户名', type: 'input', span: 12 },
  { prop: 'realName', label: '姓名', type: 'input', span: 12 },
  { prop: 'email', label: '邮箱', type: 'input', span: 12 },
  { prop: 'phone', label: '电话', type: 'input', span: 12 },
  {
    prop: 'role',
    label: '角色',
    type: 'select',
    span: 12,
    options: [
      { label: '超级管理员', value: 'super' },
      { label: '普通管理员', value: 'admin' },
    ],
  },
  {
    prop: 'status',
    label: '状态',
    type: 'select',
    span: 12,
    options: [
      { label: '启用', value: 'active' },
      { label: '禁用', value: 'inactive' },
    ],
  },
  {
    prop: 'password',
    label: '密码',
    type: 'password',
    span: 12,
    placeholder: props.mode === 'edit' ? '编辑时留空表示不修改' : '请输入密码',
    dependencies: [{ trigger: 'mode', show: (_, ctx) => ctx.mode !== 'view' }],
    rules: [
      { required: props.mode === 'add', message: '请输入密码', trigger: 'blur' },
      { min: 6, message: '密码长度至少6个字符', trigger: 'blur' },
    ],
  },
  {
    prop: 'confirmPassword',
    label: '确认密码',
    type: 'password',
    span: 12,
    dependencies: [{ trigger: 'mode', show: (_, ctx) => ctx.mode !== 'view' }],
    rules: [
      { required: props.mode === 'add', message: '请再次输入密码', trigger: 'blur' },
      {
        validator: (_rule, value, cb) => {
          if (value !== formData.password) cb(new Error('两次输入的密码不一致'))
          else cb()
        },
        trigger: ['blur', 'change'],
      },
    ],
  },
])

watch(() => formData.password, () => {
  if (formData.confirmPassword) {
    formDrawerRef.value?.validateField('confirmPassword')
  }
})

const rules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 3, max: 20, message: '用户名长度应在3-20个字符之间', trigger: 'blur' },
  ],
  realName: [{ required: true, message: '请输入姓名', trigger: 'blur' }],
  email: [
    { required: true, message: '请输入邮箱', trigger: 'blur' },
    { type: 'email', message: '请输入有效的邮箱地址', trigger: ['blur', 'change'] },
  ],
  phone: [
    { required: true, message: '请输入电话', trigger: 'blur' },
    { pattern: /^1[3-9]\d{9}$/, message: '请输入有效的手机号', trigger: ['blur', 'change'] },
  ],
  role: [{ required: true, message: '请选择角色', trigger: 'change' }],
  status: [{ required: true, message: '请选择状态', trigger: 'change' }],
}

const initForm = () => {
  const empty = {
    username: '',
    realName: '',
    email: '',
    phone: '',
    role: 'admin' as const,
    status: 'active' as const,
    password: '',
    confirmPassword: '',
  }
  if (props.mode === 'edit' && props.data) {
    Object.assign(formData, {
      username: props.data.username,
      realName: props.data.realName,
      email: props.data.email,
      phone: props.data.phone,
      role: props.data.role,
      status: props.data.status,
      password: '',
      confirmPassword: '',
    })
  } else {
    Object.assign(formData, empty)
  }
}

const handleSubmit = async (data: Record<string, unknown>) => {
  submitting.value = true
  try {
    const { confirmPassword: _omit, ...rest } = formData
    const payload = { ...rest, ...data } as AdminCreateRequest
    if (props.mode === 'edit' && !payload.password) delete payload.password
    if (props.mode === 'add') {
      await createAdmin(payload)
      ElMessage.success('新增成功')
    } else {
      await updateAdmin(props.data!.id, payload)
      ElMessage.success('更新成功')
    }
    emit('success')
    emit('update:modelValue', false)
  } finally {
    submitting.value = false
  }
}
</script>
```

- [x] **Step 2: 重写 List.vue**

替换 `src/modules/system/views/admin/List.vue` 全部内容：

```vue
<template>
  <PageContainer title="管理员管理">
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
          placeholder="用户名、姓名、邮箱或电话"
          clearable
          style="width: 220px"
          @keyup.enter="handleSearch"
        />
        <el-select
          v-model="searchForm.role"
          clearable
          placeholder="角色"
          style="width: 140px"
        >
          <el-option label="超级管理员" value="super" />
          <el-option label="普通管理员" value="admin" />
        </el-select>
        <el-select
          v-model="searchForm.status"
          clearable
          placeholder="状态"
          style="width: 120px"
        >
          <el-option label="启用" value="active" />
          <el-option label="禁用" value="inactive" />
        </el-select>
      </template>

      <template #actions>
        <el-button type="primary" :icon="Plus" @click="openDrawer('add')">
          新增管理员
        </el-button>
        <el-button
          type="danger"
          :icon="Delete"
          :disabled="selectedRows.length === 0"
          @click="handleBatchDelete"
        >
          批量删除
        </el-button>
        <el-button :icon="Refresh" @click="fetchList">
          刷新
        </el-button>
      </template>

      <template #col-role="{ row }">
        <el-tag :type="row.role === 'super' ? 'danger' : 'warning'" size="small">
          {{ row.role === 'super' ? '超级管理员' : '普通管理员' }}
        </el-tag>
      </template>

      <template #col-status="{ row }">
        <el-tag :type="row.status === 'active' ? 'success' : 'danger'" size="small">
          {{ row.status === 'active' ? '启用' : '禁用' }}
        </el-tag>
      </template>

      <template #col-createTime="{ row }">
        {{ formatDate(row.createTime) }}
      </template>

      <template #col-lastLoginTime="{ row }">
        {{ formatDate(row.lastLoginTime) }}
      </template>

      <template #col-actions="{ row }">
        <el-button link type="primary" size="small" @click="openDrawer('view', row)">
          查看
        </el-button>
        <el-button link type="primary" size="small" @click="openDrawer('edit', row)">
          编辑
        </el-button>
        <el-button link type="danger" size="small" @click="handleDelete(row.id)">
          删除
        </el-button>
      </template>
    </SearchTable>

    <AdminFormDrawer
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
import type { ColumnDef } from '@/app/components/SearchTable/types'
import {
  fetchAdminList,
  deleteAdmin,
  batchDeleteAdmins,
  type AdminInfo,
  type AdminSearchRequest,
} from '../../admin/api'
import AdminFormDrawer from './AdminFormDrawer.vue'

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
} = useCrud<AdminInfo>({
  fetch: (params) => fetchAdminList(params as unknown as AdminSearchRequest),
  remove: deleteAdmin,
  batchRemove: batchDeleteAdmins,
  defaultSearchForm: { keyword: '', role: '', status: '' },
  pageSize: 10,
})

const onSelectionChange = (rows: Record<string, unknown>[]) => {
  handleSelectionChange(rows as unknown as AdminInfo[])
}

const tableData = computed(() => listData.value as unknown as Record<string, unknown>[])
const tableSelectedRows = computed(() => selectedRows.value as unknown as Record<string, unknown>[])

const columns: ColumnDef[] = [
  { prop: 'username', label: '用户名', minWidth: 120 },
  { prop: 'realName', label: '姓名', minWidth: 100 },
  { prop: 'email', label: '邮箱', minWidth: 180 },
  { prop: 'phone', label: '电话', minWidth: 130 },
  { prop: 'role', label: '角色', minWidth: 110, slot: 'role' },
  { prop: 'status', label: '状态', minWidth: 90, slot: 'status' },
  { prop: 'createTime', label: '创建时间', minWidth: 170, slot: 'createTime' },
  { prop: 'lastLoginTime', label: '最后登录', minWidth: 170, slot: 'lastLoginTime' },
  { prop: 'actions', label: '操作', width: 200, fixed: 'right', slot: 'actions' },
]

const drawerVisible = ref(false)
const drawerMode = ref<'add' | 'edit' | 'view'>('add')
const editingRow = ref<AdminInfo | null>(null)

const openDrawer = (mode: 'add' | 'edit' | 'view', row?: AdminInfo) => {
  drawerMode.value = mode
  editingRow.value = row ?? null
  drawerVisible.value = true
}

const onFormSuccess = () => {
  drawerVisible.value = false
  fetchList()
}

const formatDate = (date: string): string => {
  if (!date) return '-'
  return new Date(date).toLocaleString('zh-CN')
}

onMounted(fetchList)
</script>
```

- [x] **Step 3: 验证全套 + smoke**

```bash
PATH="/Users/wangtao/.nvm/versions/node/v22.22.0/bin:$PATH" pnpm type-check
PATH="/Users/wangtao/.nvm/versions/node/v22.22.0/bin:$PATH" pnpm lint
PATH="/Users/wangtao/.nvm/versions/node/v22.22.0/bin:$PATH" pnpm test
PATH="/Users/wangtao/.nvm/versions/node/v22.22.0/bin:$PATH" pnpm build
PATH="/Users/wangtao/.nvm/versions/node/v22.22.0/bin:$PATH" nohup pnpm dev --host 127.0.0.1 --strictPort > /tmp/vite-dev.log 2>&1 &
for i in $(seq 1 30); do curl -sf http://127.0.0.1:5173/ > /dev/null && break; sleep 1; done
PATH="/Users/wangtao/.nvm/versions/node/v22.22.0/bin:$PATH" pnpm smoke
lsof -ti:5173 | xargs kill 2>/dev/null || true
```

Expected: 4 件套全绿 + 5 smoke 全绿 + `wc -l src/modules/system/views/admin/List.vue` < 250

- [x] **Step 4: Commit**

```bash
PATH="/Users/wangtao/.nvm/versions/node/v22.22.0/bin:$PATH" git add src/modules/system/views/admin/List.vue src/modules/system/views/admin/AdminFormDrawer.vue
PATH="/Users/wangtao/.nvm/versions/node/v22.22.0/bin:$PATH" git commit -m "refactor(admin): rewrite List.vue with SearchTable and useCrud (795 -> ~190 lines)"
```

---

### Task 5: role/List.vue 重构 + RoleFormDrawer + RolePermissionDrawer 抽离

**Files:**
- Create: `src/modules/system/views/role/RoleFormDrawer.vue`
- Create: `src/modules/system/views/role/RolePermissionDrawer.vue`
- Modify: `src/modules/system/views/role/List.vue`

**Interfaces:**
- Consumes: Task 2 的 FormDrawer、SearchTable、useCrud、PageContainer
- Consumes: `src/modules/system/role/api.ts` 的 `fetchRoleList` / `deleteRole` / `batchDeleteRoles` / `createRole` / `updateRole` / `fetchRolePermissions` / `setRolePermissions` / `RoleInfo` / `RoleSearchRequest` / `RoleCreateRequest`
- Consumes: `src/modules/system/permission/api.ts` 的 `fetchAllPermissions` / `PermissionInfo`
- Produces: role/List.vue < 250 行，含权限分配独立 drawer

- [x] **Step 1: 创建 RoleFormDrawer.vue**

`src/modules/system/views/role/RoleFormDrawer.vue`:

```vue
<template>
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
  createRole,
  updateRole,
  type RoleInfo,
  type RoleCreateRequest,
} from '../../role/api'

const props = defineProps<{
  modelValue: boolean
  mode: FormDrawerMode
  data: RoleInfo | null
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

const formData = reactive<RoleCreateRequest>({
  name: '',
  code: '',
  description: '',
  status: 'active',
})

const drawerTitle = computed(() => {
  if (props.mode === 'add') return '新增角色'
  if (props.mode === 'edit') return '编辑角色'
  return '查看角色'
})

const fields: FormField[] = [
  { prop: 'name', label: '角色名称', type: 'input', span: 24 },
  { prop: 'code', label: '角色代码', type: 'input', span: 24 },
  { prop: 'description', label: '描述', type: 'textarea', span: 24 },
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
]

const rules = {
  name: [
    { required: true, message: '请输入角色名称', trigger: 'blur' },
    { min: 2, max: 20, message: '角色名称长度应在2-20个字符之间', trigger: 'blur' },
  ],
  code: [
    { required: true, message: '请输入角色代码', trigger: 'blur' },
    { min: 2, max: 20, message: '角色代码长度应在2-20个字符之间', trigger: 'blur' },
  ],
  description: [{ max: 200, message: '描述长度不能超过200个字符', trigger: 'blur' }],
  status: [{ required: true, message: '请选择状态', trigger: 'change' }],
}

const initForm = () => {
  if (props.mode === 'edit' && props.data) {
    Object.assign(formData, {
      name: props.data.name,
      code: props.data.code,
      description: props.data.description,
      status: props.data.status,
    })
  } else {
    Object.assign(formData, {
      name: '',
      code: '',
      description: '',
      status: 'active',
    })
  }
}

const handleSubmit = async (data: Record<string, unknown>) => {
  submitting.value = true
  try {
    const payload = { ...formData, ...data } as RoleCreateRequest
    if (props.mode === 'add') {
      await createRole(payload)
      ElMessage.success('新增成功')
    } else {
      await updateRole(props.data!.id, payload)
      ElMessage.success('更新成功')
    }
    emit('success')
    emit('update:modelValue', false)
  } finally {
    submitting.value = false
  }
}
</script>
```

- [x] **Step 2: 创建 RolePermissionDrawer.vue**

`src/modules/system/views/role/RolePermissionDrawer.vue`:

```vue
<template>
  <el-drawer
    :model-value="modelValue"
    title="权限配置"
    size="50%"
    :close-on-click-modal="false"
    @update:model-value="$emit('update:modelValue', $event)"
  >
    <div v-loading="loading" class="permission-config">
      <el-tree
        ref="treeRef"
        :data="treeData"
        :props="{ label: 'name', children: 'children' }"
        :default-checked-keys="checkedKeys"
        show-checkbox
        node-key="id"
        check-strictly
        class="permission-tree"
      />
    </div>
    <template #footer>
      <el-button @click="$emit('update:modelValue', false)">
        取消
      </el-button>
      <el-button type="primary" :loading="saving" @click="handleSave">
        保存
      </el-button>
    </template>
  </el-drawer>
</template>

<script lang="ts" setup>
import { ref, watch, onMounted } from 'vue'
import type { ElTree } from 'element-plus'
import { ElMessage } from 'element-plus'
import {
  fetchRolePermissions,
  setRolePermissions,
} from '../../role/api'
import {
  fetchAllPermissions,
  type PermissionInfo,
} from '../../permission/api'

interface PermissionTreeNode {
  id: string
  name: string
  children?: PermissionTreeNode[]
}

const MODULE_LABELS: Record<string, string> = {
  system: '系统管理',
  user: '用户管理',
  role: '角色管理',
  permission: '权限管理',
  dict: '字典管理',
  config: '系统配置',
}

const props = defineProps<{
  modelValue: boolean
  roleId: string | null
}>()

const emit = defineEmits<{
  'update:modelValue': [v: boolean]
}>()

const loading = ref(false)
const saving = ref(false)
const treeRef = ref<InstanceType<typeof ElTree>>()
const treeData = ref<PermissionTreeNode[]>([])
const checkedKeys = ref<string[]>([])

const buildTree = (permissions: PermissionInfo[]): PermissionTreeNode[] => {
  const moduleMap = new Map<string, PermissionInfo[]>()
  permissions.forEach((p) => {
    if (!moduleMap.has(p.module)) moduleMap.set(p.module, [])
    moduleMap.get(p.module)!.push(p)
  })
  const tree: PermissionTreeNode[] = []
  for (const [module, items] of moduleMap.entries()) {
    tree.push({
      id: module,
      name: MODULE_LABELS[module] || module,
      children: items.map((p) => ({ id: p.id, name: p.name })),
    })
  }
  return tree
}

const loadData = async () => {
  if (!props.roleId) return
  loading.value = true
  try {
    const [allPermissions, rolePermissions] = await Promise.all([
      fetchAllPermissions(),
      fetchRolePermissions(props.roleId),
    ])
    treeData.value = buildTree(allPermissions)
    checkedKeys.value = rolePermissions
  } catch {
    ElMessage.error('加载权限数据失败')
  } finally {
    loading.value = false
  }
}

watch(() => props.modelValue, (v) => {
  if (v) loadData()
})

onMounted(() => {
  if (props.modelValue) loadData()
})

const handleSave = async () => {
  if (!props.roleId || !treeRef.value) return
  saving.value = true
  try {
    const keys = treeRef.value.getCheckedKeys() as string[]
    // 过滤掉模块节点（id 是 module 名）
    const permissionIds = keys.filter((k) => !MODULE_LABELS[k] && !Object.prototype.hasOwnProperty.call(MODULE_LABELS, k))
    await setRolePermissions(props.roleId, permissionIds)
    ElMessage.success('权限保存成功')
    emit('update:modelValue', false)
  } catch {
    ElMessage.error('权限保存失败')
  } finally {
    saving.value = false
  }
}
</script>

<style lang="scss" scoped>
.permission-config {
  min-height: 100%;
}
</style>
```

- [x] **Step 3: 重写 role/List.vue**

替换 `src/modules/system/views/role/List.vue` 全部内容：

```vue
<template>
  <PageContainer title="角色管理">
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
          placeholder="角色名称、代码或描述"
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
          <el-option label="启用" value="active" />
          <el-option label="禁用" value="inactive" />
        </el-select>
      </template>

      <template #actions>
        <el-button type="primary" :icon="Plus" @click="openDrawer('add')">
          新增角色
        </el-button>
        <el-button
          type="danger"
          :icon="Delete"
          :disabled="selectedRows.length === 0"
          @click="handleBatchDelete"
        >
          批量删除
        </el-button>
        <el-button :icon="Refresh" @click="fetchList">
          刷新
        </el-button>
      </template>

      <template #col-status="{ row }">
        <el-tag :type="row.status === 'active' ? 'success' : 'danger'" size="small">
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
        <el-button link type="primary" size="small" @click="openDrawer('view', row)">
          查看
        </el-button>
        <el-button link type="primary" size="small" @click="openDrawer('edit', row)">
          编辑
        </el-button>
        <el-button link type="success" size="small" @click="openPermissionDrawer(row)">
          权限
        </el-button>
        <el-button link type="danger" size="small" @click="handleDelete(row.id)">
          删除
        </el-button>
      </template>
    </SearchTable>

    <RoleFormDrawer
      v-model="drawerVisible"
      :mode="drawerMode"
      :data="editingRow"
      @success="onFormSuccess"
    />

    <RolePermissionDrawer
      v-model="permissionDrawerVisible"
      :role-id="currentRoleId"
    />
  </PageContainer>
</template>

<script lang="ts" setup>
import { ref, computed, onMounted } from 'vue'
import { Plus, Delete, Refresh } from '@element-plus/icons-vue'
import { SearchTable, PageContainer } from '@/app/components'
import { useCrud } from '@/app/composables/useCrud'
import type { ColumnDef } from '@/app/components/SearchTable/types'
import {
  fetchRoleList,
  deleteRole,
  batchDeleteRoles,
  type RoleInfo,
  type RoleSearchRequest,
} from '../../role/api'
import RoleFormDrawer from './RoleFormDrawer.vue'
import RolePermissionDrawer from './RolePermissionDrawer.vue'

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
} = useCrud<RoleInfo>({
  fetch: (params) => fetchRoleList(params as unknown as RoleSearchRequest),
  remove: deleteRole,
  batchRemove: batchDeleteRoles,
  defaultSearchForm: { keyword: '', status: '' },
  pageSize: 10,
})

const onSelectionChange = (rows: Record<string, unknown>[]) => {
  handleSelectionChange(rows as unknown as RoleInfo[])
}

const tableData = computed(() => listData.value as unknown as Record<string, unknown>[])
const tableSelectedRows = computed(() => selectedRows.value as unknown as Record<string, unknown>[])

const columns: ColumnDef[] = [
  { prop: 'name', label: '角色名称', minWidth: 140 },
  { prop: 'code', label: '角色代码', minWidth: 140 },
  { prop: 'description', label: '描述', minWidth: 200 },
  { prop: 'status', label: '状态', minWidth: 90, slot: 'status' },
  { prop: 'createTime', label: '创建时间', minWidth: 170, slot: 'createTime' },
  { prop: 'updateTime', label: '更新时间', minWidth: 170, slot: 'updateTime' },
  { prop: 'actions', label: '操作', width: 240, fixed: 'right', slot: 'actions' },
]

const drawerVisible = ref(false)
const drawerMode = ref<'add' | 'edit' | 'view'>('add')
const editingRow = ref<RoleInfo | null>(null)
const permissionDrawerVisible = ref(false)
const currentRoleId = ref<string | null>(null)

const openDrawer = (mode: 'add' | 'edit' | 'view', row?: RoleInfo) => {
  drawerMode.value = mode
  editingRow.value = row ?? null
  drawerVisible.value = true
}

const openPermissionDrawer = (row: RoleInfo) => {
  currentRoleId.value = row.id
  permissionDrawerVisible.value = true
}

const onFormSuccess = () => {
  drawerVisible.value = false
  fetchList()
}

const formatDate = (date: string): string => {
  if (!date) return '-'
  return new Date(date).toLocaleString('zh-CN')
}

onMounted(fetchList)
</script>
```

- [x] **Step 4: 验证全套 + smoke + 行数**

```bash
PATH="/Users/wangtao/.nvm/versions/node/v22.22.0/bin:$PATH" pnpm type-check
PATH="/Users/wangtao/.nvm/versions/node/v22.22.0/bin:$PATH" pnpm lint
PATH="/Users/wangtao/.nvm/versions/node/v22.22.0/bin:$PATH" pnpm test
PATH="/Users/wangtao/.nvm/versions/node/v22.22.0/bin:$PATH" pnpm build
PATH="/Users/wangtao/.nvm/versions/node/v22.22.0/bin:$PATH" nohup pnpm dev --host 127.0.0.1 --strictPort > /tmp/vite-dev.log 2>&1 &
for i in $(seq 1 30); do curl -sf http://127.0.0.1:5173/ > /dev/null && break; sleep 1; done
PATH="/Users/wangtao/.nvm/versions/node/v22.22.0/bin:$PATH" pnpm smoke
lsof -ti:5173 | xargs kill 2>/dev/null || true
wc -l src/modules/system/views/role/List.vue
```

Expected: 4 件套全绿 + 5 smoke 全绿 + List.vue < 250 行

- [x] **Step 5: Commit**

```bash
PATH="/Users/wangtao/.nvm/versions/node/v22.22.0/bin:$PATH" git add src/modules/system/views/role/List.vue src/modules/system/views/role/RoleFormDrawer.vue src/modules/system/views/role/RolePermissionDrawer.vue
PATH="/Users/wangtao/.nvm/versions/node/v22.22.0/bin:$PATH" git commit -m "refactor(role): rewrite List.vue with SearchTable/useCrud and extract RolePermissionDrawer (791 -> ~180 lines)"
```

---

### Task 6: permission/List.vue 重构 + PermissionFormDrawer 抽离

**Files:**
- Create: `src/modules/system/views/permission/PermissionFormDrawer.vue`
- Modify: `src/modules/system/views/permission/List.vue`

**Interfaces:**
- Consumes: Task 2 的 FormDrawer、SearchTable、useCrud、PageContainer
- Consumes: `src/modules/system/permission/api.ts` 的 `fetchPermissionList` / `deletePermission` / `batchDeletePermissions` / `createPermission` / `updatePermission` / `PermissionInfo` / `PermissionSearchRequest` / `PermissionCreateRequest`
- Produces: permission/List.vue < 250 行

- [x] **Step 1: 创建 PermissionFormDrawer.vue**

`src/modules/system/views/permission/PermissionFormDrawer.vue`:

```vue
<template>
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
  createPermission,
  updatePermission,
  type PermissionInfo,
  type PermissionCreateRequest,
} from '../../permission/api'

const props = defineProps<{
  modelValue: boolean
  mode: FormDrawerMode
  data: PermissionInfo | null
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

const formData = reactive<PermissionCreateRequest>({
  name: '',
  code: '',
  description: '',
  module: '',
  status: 'active',
})

const drawerTitle = computed(() => {
  if (props.mode === 'add') return '新增权限'
  if (props.mode === 'edit') return '编辑权限'
  return '查看权限'
})

const fields: FormField[] = [
  { prop: 'name', label: '权限名称', type: 'input', span: 12 },
  { prop: 'code', label: '权限代码', type: 'input', span: 12 },
  {
    prop: 'module',
    label: '模块',
    type: 'select',
    span: 12,
    options: [
      { label: '系统管理', value: 'system' },
      { label: '用户管理', value: 'user' },
      { label: '角色管理', value: 'role' },
      { label: '权限管理', value: 'permission' },
      { label: '字典管理', value: 'dict' },
      { label: '系统配置', value: 'config' },
    ],
  },
  {
    prop: 'status',
    label: '状态',
    type: 'radio',
    span: 12,
    options: [
      { label: '启用', value: 'active' },
      { label: '禁用', value: 'inactive' },
    ],
  },
  { prop: 'description', label: '描述', type: 'textarea', span: 24 },
]

const rules = {
  name: [{ required: true, message: '请输入权限名称', trigger: 'blur' }],
  code: [{ required: true, message: '请输入权限代码', trigger: 'blur' }],
  module: [{ required: true, message: '请选择模块', trigger: 'change' }],
  status: [{ required: true, message: '请选择状态', trigger: 'change' }],
  description: [{ max: 200, message: '描述长度不能超过200个字符', trigger: 'blur' }],
}

const initForm = () => {
  if (props.mode === 'edit' && props.data) {
    Object.assign(formData, {
      name: props.data.name,
      code: props.data.code,
      description: props.data.description,
      module: props.data.module,
      status: props.data.status,
    })
  } else {
    Object.assign(formData, {
      name: '',
      code: '',
      description: '',
      module: '',
      status: 'active',
    })
  }
}

const handleSubmit = async (data: Record<string, unknown>) => {
  submitting.value = true
  try {
    const payload = { ...formData, ...data } as PermissionCreateRequest
    if (props.mode === 'add') {
      await createPermission(payload)
      ElMessage.success('新增成功')
    } else {
      await updatePermission(props.data!.id, payload)
      ElMessage.success('更新成功')
    }
    emit('success')
    emit('update:modelValue', false)
  } finally {
    submitting.value = false
  }
}
</script>
```

- [x] **Step 2: 重写 permission/List.vue**

替换 `src/modules/system/views/permission/List.vue` 全部内容：

```vue
<template>
  <PageContainer title="权限管理">
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
          placeholder="权限名称、代码或描述"
          clearable
          style="width: 220px"
          @keyup.enter="handleSearch"
        />
        <el-select
          v-model="searchForm.module"
          clearable
          placeholder="模块"
          style="width: 140px"
        >
          <el-option label="系统管理" value="system" />
          <el-option label="用户管理" value="user" />
          <el-option label="角色管理" value="role" />
          <el-option label="权限管理" value="permission" />
          <el-option label="字典管理" value="dict" />
          <el-option label="系统配置" value="config" />
        </el-select>
        <el-select
          v-model="searchForm.status"
          clearable
          placeholder="状态"
          style="width: 120px"
        >
          <el-option label="启用" value="active" />
          <el-option label="禁用" value="inactive" />
        </el-select>
      </template>

      <template #actions>
        <el-button type="primary" :icon="Plus" @click="openDrawer('add')">
          新增权限
        </el-button>
        <el-button
          type="danger"
          :icon="Delete"
          :disabled="selectedRows.length === 0"
          @click="handleBatchDelete"
        >
          批量删除
        </el-button>
        <el-button :icon="Refresh" @click="fetchList">
          刷新
        </el-button>
      </template>

      <template #col-module="{ row }">
        <el-tag size="small">{{ MODULE_LABELS[row.module] || row.module }}</el-tag>
      </template>

      <template #col-status="{ row }">
        <el-tag :type="row.status === 'active' ? 'success' : 'danger'" size="small">
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
        <el-button link type="primary" size="small" @click="openDrawer('view', row)">
          查看
        </el-button>
        <el-button link type="primary" size="small" @click="openDrawer('edit', row)">
          编辑
        </el-button>
        <el-button link type="danger" size="small" @click="handleDelete(row.id)">
          删除
        </el-button>
      </template>
    </SearchTable>

    <PermissionFormDrawer
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
import type { ColumnDef } from '@/app/components/SearchTable/types'
import {
  fetchPermissionList,
  deletePermission,
  batchDeletePermissions,
  type PermissionInfo,
  type PermissionSearchRequest,
} from '../../permission/api'
import PermissionFormDrawer from './PermissionFormDrawer.vue'

const MODULE_LABELS: Record<string, string> = {
  system: '系统管理',
  user: '用户管理',
  role: '角色管理',
  permission: '权限管理',
  dict: '字典管理',
  config: '系统配置',
}

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
} = useCrud<PermissionInfo>({
  fetch: (params) => fetchPermissionList(params as unknown as PermissionSearchRequest),
  remove: deletePermission,
  batchRemove: batchDeletePermissions,
  defaultSearchForm: { keyword: '', module: '', status: '' },
  pageSize: 10,
})

const onSelectionChange = (rows: Record<string, unknown>[]) => {
  handleSelectionChange(rows as unknown as PermissionInfo[])
}

const tableData = computed(() => listData.value as unknown as Record<string, unknown>[])
const tableSelectedRows = computed(() => selectedRows.value as unknown as Record<string, unknown>[])

const columns: ColumnDef[] = [
  { prop: 'name', label: '权限名称', minWidth: 140 },
  { prop: 'code', label: '权限代码', minWidth: 140 },
  { prop: 'module', label: '模块', minWidth: 110, slot: 'module' },
  { prop: 'description', label: '描述', minWidth: 200 },
  { prop: 'status', label: '状态', minWidth: 90, slot: 'status' },
  { prop: 'createTime', label: '创建时间', minWidth: 170, slot: 'createTime' },
  { prop: 'updateTime', label: '更新时间', minWidth: 170, slot: 'updateTime' },
  { prop: 'actions', label: '操作', width: 200, fixed: 'right', slot: 'actions' },
]

const drawerVisible = ref(false)
const drawerMode = ref<'add' | 'edit' | 'view'>('add')
const editingRow = ref<PermissionInfo | null>(null)

const openDrawer = (mode: 'add' | 'edit' | 'view', row?: PermissionInfo) => {
  drawerMode.value = mode
  editingRow.value = row ?? null
  drawerVisible.value = true
}

const onFormSuccess = () => {
  drawerVisible.value = false
  fetchList()
}

const formatDate = (date: string): string => {
  if (!date) return '-'
  return new Date(date).toLocaleString('zh-CN')
}

onMounted(fetchList)
</script>
```

- [x] **Step 3: 验证全套 + smoke + 行数**

```bash
PATH="/Users/wangtao/.nvm/versions/node/v22.22.0/bin:$PATH" pnpm type-check
PATH="/Users/wangtao/.nvm/versions/node/v22.22.0/bin:$PATH" pnpm lint
PATH="/Users/wangtao/.nvm/versions/node/v22.22.0/bin:$PATH" pnpm test
PATH="/Users/wangtao/.nvm/versions/node/v22.22.0/bin:$PATH" pnpm build
PATH="/Users/wangtao/.nvm/versions/node/v22.22.0/bin:$PATH" nohup pnpm dev --host 127.0.0.1 --strictPort > /tmp/vite-dev.log 2>&1 &
for i in $(seq 1 30); do curl -sf http://127.0.0.1:5173/ > /dev/null && break; sleep 1; done
PATH="/Users/wangtao/.nvm/versions/node/v22.22.0/bin:$PATH" pnpm smoke
lsof -ti:5173 | xargs kill 2>/dev/null || true
wc -l src/modules/system/views/permission/List.vue
```

Expected: 4 件套全绿 + 5 smoke 全绿 + List.vue < 250 行

- [x] **Step 4: Commit**

```bash
PATH="/Users/wangtao/.nvm/versions/node/v22.22.0/bin:$PATH" git add src/modules/system/views/permission/List.vue src/modules/system/views/permission/PermissionFormDrawer.vue
PATH="/Users/wangtao/.nvm/versions/node/v22.22.0/bin:$PATH" git commit -m "refactor(permission): rewrite List.vue with SearchTable and useCrud (736 -> ~190 lines)"
```

---

### Task 7: dict/List.vue 包裹 PageContainer

**Files:**
- Modify: `src/modules/system/views/dict/List.vue`

**Interfaces:**
- Consumes: PageContainer
- Produces: dict/List.vue 视觉与其他模块统一

- [x] **Step 1: 读现有 dict/List.vue 完整内容**

```bash
cat src/modules/system/views/dict/List.vue
```

记录现有结构：搜索 el-card + 主 el-card（DictTree + DictDetail）+ context-menu + DictFormDrawer。

- [x] **Step 2: 包裹 PageContainer**

修改 `src/modules/system/views/dict/List.vue`，在最外层（`<template>` 第一个子节点）包裹 `<PageContainer>`：

a) script 加 import：
找到现有 import 块，加：
```ts
import { PageContainer } from '@/app/components'
```

b) 模板最外层包裹。原来 `<template>` 内第一个子节点是 `<el-card class="search-card">`，改为：

找到原模板开头：
```vue
<template>
  <!-- 搜索和工具栏区域 -->
  <el-card
    shadow="never"
    class="search-card"
  >
```

替换为：
```vue
<template>
  <PageContainer title="字典管理">
    <!-- 搜索和工具栏区域 -->
    <el-card
      shadow="never"
      class="search-card"
    >
```

c) 模板末尾闭合 PageContainer。找到 `</template>` 前最后一个节点（`<DictFormDrawer ... />` 后），加 `</PageContainer>`：

找到：
```vue
  <DictFormDrawer
    v-model="drawerVisible"
    v-model:form="form"
    :mode="drawerMode"
    :parent-node="selectedParentNode"
    :selected-node="selectedNode"
    @submit="handleSubmit"
  />
</template>
```

替换为：
```vue
    <DictFormDrawer
      v-model="drawerVisible"
      v-model:form="form"
      :mode="drawerMode"
      :parent-node="selectedParentNode"
      :selected-node="selectedNode"
      @submit="handleSubmit"
    />
  </PageContainer>
</template>
```

注意：包裹后内部所有子节点需相应增加 2 空格缩进。如 lint 报 indent 警告，运行 `pnpm lint:fix` 自动修复。

- [x] **Step 3: 验证全套 + smoke**

```bash
PATH="/Users/wangtao/.nvm/versions/node/v22.22.0/bin:$PATH" pnpm type-check
PATH="/Users/wangtao/.nvm/versions/node/v22.22.0/bin:$PATH" pnpm lint:fix
PATH="/Users/wangtao/.nvm/versions/node/v22.22.0/bin:$PATH" pnpm lint
PATH="/Users/wangtao/.nvm/versions/node/v22.22.0/bin:$PATH" pnpm test
PATH="/Users/wangtao/.nvm/versions/node/v22.22.0/bin:$PATH" pnpm build
PATH="/Users/wangtao/.nvm/versions/node/v22.22.0/bin:$PATH" nohup pnpm dev --host 127.0.0.1 --strictPort > /tmp/vite-dev.log 2>&1 &
for i in $(seq 1 30); do curl -sf http://127.0.0.1:5173/ > /dev/null && break; sleep 1; done
PATH="/Users/wangtao/.nvm/versions/node/v22.22.0/bin:$PATH" pnpm smoke
lsof -ti:5173 | xargs kill 2>/dev/null || true
```

Expected: 4 件套全绿 + 5 smoke 全绿

- [x] **Step 4: Commit**

```bash
PATH="/Users/wangtao/.nvm/versions/node/v22.22.0/bin:$PATH" git add src/modules/system/views/dict/List.vue
PATH="/Users/wangtao/.nvm/versions/node/v22.22.0/bin:$PATH" git commit -m "refactor(dict): wrap List.vue with PageContainer for visual consistency"
```

---

### Task 8: menu api.ts + mock menu-manage.ts

**Files:**
- Create: `src/modules/system/menu/api.ts`
- Create: `src/mock/apis/menu-manage.ts`
- Modify: `src/mock/apis/menu.ts`（导出 ALL_MENUS 供 menu-manage 共享）

**Interfaces:**
- Produces: `MenuInfo` 接口、`fetchMenuTree` / `createMenu` / `updateMenu` / `deleteMenu` / `updateMenuSort` 函数；mock 端点 `/api/system/menu/tree|create|update|delete|sort`

- [x] **Step 1: 修改 mock/apis/menu.ts 导出 ALL_MENUS**

修改 `src/mock/apis/menu.ts`，将 `const ALL_MENUS` 改为 `export const ALL_MENUS`：

找到：
```ts
// 全部菜单（带权限元信息）
const ALL_MENUS = [
```

替换为：
```ts
// 全部菜单（带权限元信息）
// 导出供 menu-manage.ts 共享数据源，避免两份维护
export const ALL_MENUS = [
```

- [x] **Step 2: 创建 menu api.ts**

`src/modules/system/menu/api.ts`:

```ts
// system/menu 领域 API —— 菜单管理 CRUD。
// 与 src/mock/apis/menu.ts（用户菜单端点 /api/system/menus）不同，
// 这里是菜单管理页面的 CRUD 端点 /api/system/menu/*。
import { api } from '@/lib/http/client'

export interface MenuInfo {
  id: string
  parentId: string | null
  name: string
  path: string
  component?: string
  icon?: string
  sort: number
  status: 'active' | 'inactive'
  children?: MenuInfo[]
}

export interface MenuCreateRequest {
  parentId: string | null
  name: string
  path: string
  component?: string
  icon?: string
  sort: number
  status: 'active' | 'inactive'
}

export interface MenuSortRequest {
  draggingId: string
  targetId: string
  position: 'before' | 'after' | 'inner'
}

// 获取完整菜单树
export const fetchMenuTree = () =>
  api.get<MenuInfo[]>('/api/system/menu/tree')

// 创建菜单
export const createMenu = (data: MenuCreateRequest) =>
  api.post<MenuInfo>('/api/system/menu/create', data)

// 更新菜单
export const updateMenu = (id: string, data: Partial<MenuCreateRequest>) =>
  api.put<MenuInfo>(`/api/system/menu/update/${id}`, data)

// 删除菜单
export const deleteMenu = (id: string) =>
  api.del<boolean>(`/api/system/menu/delete/${id}`)

// 拖拽排序
export const updateMenuSort = (data: MenuSortRequest) =>
  api.post<boolean>('/api/system/menu/sort', data)
```

- [x] **Step 3: 创建 mock menu-manage.ts**

`src/mock/apis/menu-manage.ts`:

```ts
import type { MockMethod } from 'vite-plugin-mock'
import { ALL_MENUS } from './menu'

// 菜单管理 CRUD 内存数据源
// 从 ALL_MENUS 转换为 MenuInfo 格式（带 id/parentId/sort/status）
interface MenuRecord {
  id: string
  parentId: string | null
  name: string
  path: string
  component?: string
  icon?: string
  sort: number
  status: 'active' | 'inactive'
}

let menuIdCounter = 100
const genId = () => `menu_${menuIdCounter++}`

// 把 ALL_MENUS（路由格式）转成扁平 MenuRecord[]，便于 CRUD
function seedMenus(): MenuRecord[] {
  const records: MenuRecord[] = []
  let sortCounter = 0
  const walk = (nodes: any[], parentId: string | null) => {
    nodes.forEach((node, idx) => {
      const rec: MenuRecord = {
        id: node.name || genId(),
        parentId,
        name: node.meta?.title || node.name || '',
        path: node.path || '',
        component: node.component,
        icon: node.meta?.icon,
        sort: idx,
        status: 'active',
      }
      records.push(rec)
      if (node.children && node.children.length > 0) {
        walk(node.children, rec.id)
      }
    })
  }
  walk(ALL_MENUS, null)
  return records
}

let menuRecords: MenuRecord[] = seedMenus()

// 把扁平 records 构建成树
function buildTree(records: MenuRecord[]): any[] {
  const map = new Map<string, any>()
  const roots: any[] = []
  records.forEach((r) => {
    map.set(r.id, { ...r, children: [] })
  })
  records.forEach((r) => {
    const node = map.get(r.id)!
    if (r.parentId && map.has(r.parentId)) {
      map.get(r.parentId)!.children.push(node)
    } else {
      roots.push(node)
    }
  })
  // 空子节点移除
  const trim = (nodes: any[]) => {
    nodes.forEach((n) => {
      if (n.children.length === 0) delete n.children
      else trim(n.children)
    })
  }
  trim(roots)
  return roots
}

function findRecord(id: string): MenuRecord | undefined {
  return menuRecords.find((r) => r.id === id)
}

function removeRecordAndChildren(id: string): void {
  const children = menuRecords.filter((r) => r.parentId === id)
  children.forEach((c) => removeRecordAndChildren(c.id))
  menuRecords = menuRecords.filter((r) => r.id !== id)
}

export default [
  {
    url: '/api/system/menu/tree',
    method: 'get',
    response: () => ({
      code: 0,
      data: buildTree(menuRecords),
      msg: 'ok',
    }),
  },
  {
    url: '/api/system/menu/create',
    method: 'post',
    response: ({ body }: { body: any }) => {
      const newMenu: MenuRecord = {
        id: genId(),
        parentId: body.parentId || null,
        name: body.name,
        path: body.path,
        component: body.component,
        icon: body.icon,
        sort: body.sort ?? 0,
        status: body.status || 'active',
      }
      menuRecords.push(newMenu)
      return { code: 0, data: newMenu, msg: 'ok' }
    },
  },
  {
    url: '/api/system/menu/update/:id',
    method: 'put',
    response: ({ url, body }: { url: string; body: any }) => {
      const id = url.split('/').pop()!
      const rec = findRecord(id)
      if (!rec) return { code: 404, data: null, msg: '菜单不存在' }
      Object.assign(rec, {
        name: body.name ?? rec.name,
        path: body.path ?? rec.path,
        component: body.component ?? rec.component,
        icon: body.icon ?? rec.icon,
        sort: body.sort ?? rec.sort,
        status: body.status ?? rec.status,
        parentId: body.parentId ?? rec.parentId,
      })
      return { code: 0, data: rec, msg: 'ok' }
    },
  },
  {
    url: '/api/system/menu/delete/:id',
    method: 'delete',
    response: ({ url }: { url: string }) => {
      const id = url.split('/').pop()!
      removeRecordAndChildren(id)
      return { code: 0, data: true, msg: 'ok' }
    },
  },
  {
    url: '/api/system/menu/sort',
    method: 'post',
    response: ({ body }: { body: { draggingId: string; targetId: string; position: string } }) => {
      const { draggingId, targetId, position } = body
      const dragging = findRecord(draggingId)
      const target = findRecord(targetId)
      if (!dragging || !target) return { code: 400, data: null, msg: '节点不存在' }
      // 简化：调整 parentId + sort
      if (position === 'inner') {
        dragging.parentId = target.id
      } else {
        dragging.parentId = target.parentId
        dragging.sort = position === 'before' ? target.sort - 0.5 : target.sort + 0.5
      }
      // 重新归一化 sort
      const siblings = menuRecords
        .filter((r) => r.parentId === dragging.parentId)
        .sort((a, b) => a.sort - b.sort)
      siblings.forEach((r, idx) => { r.sort = idx })
      return { code: 0, data: true, msg: 'ok' }
    },
  },
] as MockMethod[]
```

- [x] **Step 4: 验证 type-check + dev server 启动**

```bash
PATH="/Users/wangtao/.nvm/versions/node/v22.22.0/bin:$PATH" pnpm type-check
PATH="/Users/wangtao/.nvm/versions/node/v22.22.0/bin:$PATH" pnpm lint
PATH="/Users/wangtao/.nvm/versions/node/v22.22.0/bin:$PATH" nohup pnpm dev --host 127.0.0.1 --strictPort > /tmp/vite-dev.log 2>&1 &
for i in $(seq 1 30); do curl -sf http://127.0.0.1:5173/ > /dev/null && break; sleep 1; done
# 验证 mock 端点
curl -sf -H "Authorization: Bearer a_admin_$(date +%s)_test" http://127.0.0.1:5173/api/system/menu/tree | head -c 200
lsof -ti:5173 | xargs kill 2>/dev/null || true
```

Expected: type-check 0 error / lint 0 error / curl 返回 `{code:0, data:[...], msg:"ok"}`

- [x] **Step 5: Commit**

```bash
PATH="/Users/wangtao/.nvm/versions/node/v22.22.0/bin:$PATH" git add src/modules/system/menu/api.ts src/mock/apis/menu-manage.ts src/mock/apis/menu.ts
PATH="/Users/wangtao/.nvm/versions/node/v22.22.0/bin:$PATH" git commit -m "feat(menu): add menu CRUD api and mock endpoints"
```

---

### Task 9: menu List.vue + MenuFormDrawer.vue 树形 CRUD

**Files:**
- Create: `src/modules/system/menu/views/MenuFormDrawer.vue`
- Modify: `src/modules/system/menu/views/List.vue`

**Interfaces:**
- Consumes: Task 2 的 FormDrawer（含 treeSelect 字段）、PageContainer；Task 8 的 `fetchMenuTree` / `createMenu` / `updateMenu` / `deleteMenu` / `updateMenuSort` / `MenuInfo`
- Produces: menu/List.vue 树形 CRUD，含拖拽排序、节点操作（新增子菜单/编辑/删除）、顶级新增

- [x] **Step 1: 创建 MenuFormDrawer.vue**

`src/modules/system/menu/views/MenuFormDrawer.vue`:

```vue
<template>
  <FormDrawer
    v-model="visible"
    :title="drawerTitle"
    :mode="mode"
    :form-data="formData"
    :fields="fields"
    :rules="rules"
    :loading="submitting"
    width="600px"
    @submit="handleSubmit"
  />
</template>

<script lang="ts" setup>
import { ref, watch, reactive, computed } from 'vue'
import { FormDrawer } from '@/app/components'
import type { FormField, FormDrawerMode } from '@/app/components/FormDrawer/types'
import { ElMessage } from 'element-plus'
import {
  createMenu,
  updateMenu,
  type MenuInfo,
  type MenuCreateRequest,
} from '../api'

const props = defineProps<{
  modelValue: boolean
  mode: FormDrawerMode
  data: MenuInfo | null
  /** 父菜单预设（点击"新增子菜单"时传入） */
  parent: MenuInfo | null
  /** 完整菜单树，用于 treeSelect 选择父节点 */
  treeData: MenuInfo[]
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

const formData = reactive<MenuCreateRequest>({
  parentId: null,
  name: '',
  path: '',
  component: '',
  icon: '',
  sort: 0,
  status: 'active',
})

const drawerTitle = computed(() => {
  if (props.mode === 'add') return props.parent ? `新增子菜单 - ${props.parent.name}` : '新增顶级菜单'
  if (props.mode === 'edit') return '编辑菜单'
  return '查看菜单'
})

// treeSelect 数据需要 {id, label, children} 结构
const treeSelectData = computed(() => {
  const transform = (nodes: MenuInfo[]): any[] =>
    nodes.map((n) => ({
      id: n.id,
      label: n.name,
      children: n.children && n.children.length > 0 ? transform(n.children) : undefined,
    }))
  return transform(props.treeData)
})

const fields = computed<FormField[]>(() => [
  {
    prop: 'parentId',
    label: '父菜单',
    type: 'treeSelect',
    span: 24,
    treeData: treeSelectData.value,
    treeProps: { label: 'label', children: 'children' },
    placeholder: '不选则为顶级菜单',
    dependencies: [
      { trigger: 'mode', show: (_, ctx) => ctx.mode === 'add' && !props.parent }
    ],
  },
  { prop: 'name', label: '菜单名称', type: 'input', span: 12 },
  { prop: 'path', label: '路由路径', type: 'input', span: 12 },
  { prop: 'component', label: '组件路径', type: 'input', span: 12, placeholder: '如 dashboard/views/Home' },
  { prop: 'icon', label: '图标', type: 'input', span: 12, placeholder: 'Element Plus 图标名' },
  { prop: 'sort', label: '排序', type: 'number', span: 12, default: 0 },
  {
    prop: 'status',
    label: '状态',
    type: 'radio',
    span: 12,
    options: [
      { label: '启用', value: 'active' },
      { label: '禁用', value: 'inactive' },
    ],
  },
])

const rules = {
  name: [{ required: true, message: '请输入菜单名称', trigger: 'blur' }],
  path: [{ required: true, message: '请输入路由路径', trigger: 'blur' }],
  status: [{ required: true, message: '请选择状态', trigger: 'change' }],
}

const initForm = () => {
  if (props.mode === 'edit' && props.data) {
    Object.assign(formData, {
      parentId: props.data.parentId,
      name: props.data.name,
      path: props.data.path,
      component: props.data.component || '',
      icon: props.data.icon || '',
      sort: props.data.sort,
      status: props.data.status,
    })
  } else if (props.mode === 'add' && props.parent) {
    // 新增子菜单：预填 parentId
    Object.assign(formData, {
      parentId: props.parent.id,
      name: '',
      path: '',
      component: '',
      icon: '',
      sort: 0,
      status: 'active',
    })
  } else {
    Object.assign(formData, {
      parentId: null,
      name: '',
      path: '',
      component: '',
      icon: '',
      sort: 0,
      status: 'active',
    })
  }
}

const handleSubmit = async (data: Record<string, unknown>) => {
  submitting.value = true
  try {
    const payload = { ...formData, ...data } as MenuCreateRequest
    if (props.mode === 'add') {
      await createMenu(payload)
      ElMessage.success('新增成功')
    } else {
      await updateMenu(props.data!.id, payload)
      ElMessage.success('更新成功')
    }
    emit('success')
    emit('update:modelValue', false)
  } finally {
    submitting.value = false
  }
}
</script>
```

- [x] **Step 2: 重写 menu List.vue**

替换 `src/modules/system/menu/views/List.vue` 全部内容：

```vue
<template>
  <PageContainer title="菜单管理">
    <template #header>
      <el-button type="primary" :icon="Plus" @click="openDrawer('add', null, null)">
        新增顶级菜单
      </el-button>
      <el-button :icon="Refresh" @click="loadTree">
        刷新
      </el-button>
    </template>

    <el-card v-loading="loading" shadow="never">
      <el-tree
        ref="treeRef"
        :data="treeData"
        :props="{ label: 'name', children: 'children' }"
        node-key="id"
        default-expand-all
        draggable
        @node-drop="handleDrop"
      >
        <template #default="{ node, data }">
          <div class="tree-node">
            <span class="tree-node__label">
              <el-icon v-if="data.icon"><component :is="resolveIcon(data.icon)" /></el-icon>
              {{ data.name }}
              <el-tag size="small" :type="data.status === 'active' ? 'success' : 'info'">
                {{ data.status === 'active' ? '启用' : '禁用' }}
              </el-tag>
              <span class="tree-node__path">{{ data.path }}</span>
            </span>
            <span class="tree-node__actions">
              <el-button link type="primary" size="small" @click.stop="openDrawer('add', data, data)">
                新增子菜单
              </el-button>
              <el-button link type="primary" size="small" @click.stop="openDrawer('edit', data, data)">
                编辑
              </el-button>
              <el-button link type="danger" size="small" @click.stop="handleDelete(node, data)">
                删除
              </el-button>
            </span>
          </div>
        </template>
      </el-tree>
    </el-card>

    <MenuFormDrawer
      v-model="drawerVisible"
      :mode="drawerMode"
      :data="editingNode"
      :parent="parentForAdd"
      :tree-data="treeData"
      @success="onFormSuccess"
    />
  </PageContainer>
</template>

<script lang="ts" setup>
import { ref, onMounted } from 'vue'
import { Plus, Refresh } from '@element-plus/icons-vue'
import * as ElementPlusIconsVue from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import type { ElTree } from 'element-plus'
import { PageContainer } from '@/app/components'
import MenuFormDrawer from './MenuFormDrawer.vue'
import {
  fetchMenuTree,
  deleteMenu,
  updateMenuSort,
  type MenuInfo,
} from '../api'

const treeRef = ref<InstanceType<typeof ElTree>>()
const treeData = ref<MenuInfo[]>([])
const loading = ref(false)

const drawerVisible = ref(false)
const drawerMode = ref<'add' | 'edit' | 'view'>('add')
const editingNode = ref<MenuInfo | null>(null)
const parentForAdd = ref<MenuInfo | null>(null)

// 解析图标组件名（Element Plus 图标全局注册）
const resolveIcon = (name: string) => {
  const icons = ElementPlusIconsVue as Record<string, any>
  return icons[name] || null
}

const loadTree = async () => {
  loading.value = true
  try {
    treeData.value = await fetchMenuTree()
  } catch {
    ElMessage.error('加载菜单树失败')
  } finally {
    loading.value = false
  }
}

const openDrawer = (
  mode: 'add' | 'edit',
  _node: unknown,
  data: MenuInfo | null
) => {
  drawerMode.value = mode
  if (mode === 'add') {
    // data 是父节点（点击"新增子菜单"时）或 null（顶级新增）
    parentForAdd.value = data
    editingNode.value = null
  } else {
    // edit
    editingNode.value = data
    parentForAdd.value = null
  }
  drawerVisible.value = true
}

const onFormSuccess = () => {
  drawerVisible.value = false
  loadTree()
}

const handleDelete = async (node: any, data: MenuInfo) => {
  try {
    await ElMessageBox.confirm(
      `确认删除菜单「${data.name}」？子菜单将一并删除。`,
      '提示',
      { confirmButtonText: '确认', cancelButtonText: '取消', type: 'warning' }
    )
  } catch {
    return
  }
  try {
    await deleteMenu(data.id)
    ElMessage.success('删除成功')
    loadTree()
  } catch {
    ElMessage.error('删除失败')
  }
}

// el-tree node-drop 事件：拖拽完成后回调
const handleDrop = async (
  draggingNode: any,
  targetNode: any,
  position: 'before' | 'after' | 'inner'
) => {
  try {
    await updateMenuSort({
      draggingId: draggingNode.data.id,
      targetId: targetNode.data.id,
      position,
    })
    ElMessage.success('排序已更新')
    loadTree()
  } catch {
    ElMessage.error('排序失败')
    loadTree()
  }
}

onMounted(loadTree)
</script>

<style lang="scss" scoped>
.tree-node {
  flex: 1;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-right: 8px;

  &__label {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  &__path {
    color: var(--el-text-color-secondary);
    font-size: 12px;
    margin-left: 8px;
  }

  &__actions {
    display: none;
  }
}

// hover 时显示操作按钮
:deep(.el-tree-node__content:hover) .tree-node__actions {
  display: inline-flex;
}
</style>
```

- [x] **Step 3: 验证全套 + smoke**

```bash
PATH="/Users/wangtao/.nvm/versions/node/v22.22.0/bin:$PATH" pnpm type-check
PATH="/Users/wangtao/.nvm/versions/node/v22.22.0/bin:$PATH" pnpm lint:fix
PATH="/Users/wangtao/.nvm/versions/node/v22.22.0/bin:$PATH" pnpm lint
PATH="/Users/wangtao/.nvm/versions/node/v22.22.0/bin:$PATH" pnpm test
PATH="/Users/wangtao/.nvm/versions/node/v22.22.0/bin:$PATH" pnpm build
PATH="/Users/wangtao/.nvm/versions/node/v22.22.0/bin:$PATH" nohup pnpm dev --host 127.0.0.1 --strictPort > /tmp/vite-dev.log 2>&1 &
for i in $(seq 1 30); do curl -sf http://127.0.0.1:5173/ > /dev/null && break; sleep 1; done
PATH="/Users/wangtao/.nvm/versions/node/v22.22.0/bin:$PATH" pnpm smoke
lsof -ti:5173 | xargs kill 2>/dev/null || true
```

Expected: 4 件套全绿 + 5 smoke 全绿

- [x] **Step 4: 手动冒烟（Playwright MCP，登录后访问 /system/menu）**

```bash
PATH="/Users/wangtao/.nvm/versions/node/v22.22.0/bin:$PATH" nohup pnpm dev --host 127.0.0.1 --strictPort > /tmp/vite-dev.log 2>&1 &
for i in $(seq 1 30); do curl -sf http://127.0.0.1:5173/ > /dev/null && break; sleep 1; done
```

用 Playwright MCP：
1. 访问 `/`，admin/123456 登录
2. 访问 `/system/menu`，确认 el-tree 渲染（节点含菜单名称 + 状态 tag + 路径）
3. 点击"新增顶级菜单"按钮，drawer 打开，填表提交成功，树刷新
4. hover 节点显示操作按钮，点击"新增子菜单"，drawer 打开 parentId 已预填
5. 点击"编辑"，drawer 打开带数据
6. 点击"删除"，confirm 后节点消失
7. 拖拽节点排序（可选，验证不报错）

清理：
```bash
lsof -ti:5173 | xargs kill 2>/dev/null || true
```

- [x] **Step 5: Commit**

```bash
PATH="/Users/wangtao/.nvm/versions/node/v22.22.0/bin:$PATH" git add src/modules/system/menu/views/List.vue src/modules/system/menu/views/MenuFormDrawer.vue
PATH="/Users/wangtao/.nvm/versions/node/v22.22.0/bin:$PATH" git commit -m "feat(menu): implement tree CRUD with draggable sort and MenuFormDrawer"
```

---

### Task 10: smoke 扩展 4 测试（business.spec.ts）

**Files:**
- Create: `test/smoke/business.spec.ts`

**Interfaces:**
- Consumes: Task 4-9 的页面
- Produces: 9 smoke 总数（原 5 + 新 4）

- [x] **Step 1: 创建 business.spec.ts**

`test/smoke/business.spec.ts`:

```ts
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
    // 点击第一行"查看"按钮
    const viewBtn = page.locator('.el-table .el-button').filter({ hasText: '查看' }).first()
    await viewBtn.click()
    await expect(page.getByRole('heading', { name: '查看管理员' })).toBeVisible()
  })

  test('role 列表渲染 + 权限分配 drawer 打开', async ({ page }) => {
    await login(page)
    await page.goto('system/role')
    await expect(page.locator('.el-table').first()).toBeVisible()
    // 点击第一行"权限"按钮
    const permBtn = page.locator('.el-table .el-button').filter({ hasText: '权限' }).first()
    await permBtn.click()
    await expect(page.getByRole('heading', { name: '权限配置' })).toBeVisible()
    // 权限树渲染
    await expect(page.locator('.permission-tree')).toBeVisible()
  })

  test('permission 列表渲染', async ({ page }) => {
    await login(page)
    await page.goto('system/permission')
    await expect(page.locator('.el-table').first()).toBeVisible()
    await expect(page.locator('.search-toolbar')).toBeVisible()
    // 新增按钮可见
    await expect(page.locator('.el-button').filter({ hasText: '新增权限' })).toBeVisible()
  })

  test('menu 树渲染 + 新增顶级菜单 drawer', async ({ page }) => {
    await login(page)
    await page.goto('system/menu')
    await expect(page.locator('.el-tree')).toBeVisible()
    // 点击"新增顶级菜单"按钮
    await page.locator('.el-button').filter({ hasText: '新增顶级菜单' }).click()
    await expect(page.getByRole('heading', { name: '新增顶级菜单' })).toBeVisible()
  })
})
```

- [x] **Step 2: 运行全部 smoke**

```bash
PATH="/Users/wangtao/.nvm/versions/node/v22.22.0/bin:$PATH" nohup pnpm dev --host 127.0.0.1 --strictPort > /tmp/vite-dev.log 2>&1 &
for i in $(seq 1 30); do curl -sf http://127.0.0.1:5173/ > /dev/null && break; sleep 1; done
PATH="/Users/wangtao/.nvm/versions/node/v22.22.0/bin:$PATH" pnpm smoke
lsof -ti:5173 | xargs kill 2>/dev/null || true
```

Expected: 9 passed（原 5 + 新 4）

- [x] **Step 3: Commit**

```bash
PATH="/Users/wangtao/.nvm/versions/node/v22.22.0/bin:$PATH" git add test/smoke/business.spec.ts
PATH="/Users/wangtao/.nvm/versions/node/v22.22.0/bin:$PATH" git commit -m "test(smoke): cover admin/role/permission/menu business pages"
```

---

### Task 11: 文档同步

**Files:**
- Modify: `CLAUDE.md`
- Modify: `docs/standards/01-ARCHITECTURE.md`
- Modify: `README.md`

- [x] **Step 1: CLAUDE.md 增加第 10 条「业务页面标准」**

在 `CLAUDE.md` 现有第 9 条「Layout 配置中心」后追加：

找到：
```markdown
9. **Layout 配置中心（M7-B）**：...
```

在其后追加：
```markdown
10. **业务页面标准（M7-C）**：所有 List 页面必须用 `SearchTable` + `useCrud` + `PageContainer` + `FormDrawer` 四件套。FormDrawer 支持 `mode`（add/edit/view）+ `dependencies`（声明式显隐联动）+ `rules`（field-level 校验）+ `password`/`treeSelect` 字段类型。复杂联动（如权限分配 el-tree）用独立 drawer，不塞进 FormDrawer。
```

- [x] **Step 2: docs/standards/01-ARCHITECTURE.md 补 menu api.ts**

在「三、src/modules/ 业务领域」的 system/menu 行补充 api.ts：

找到：
```
│   ├── menu/                # 菜单
│   │   └── views/
│   │       └── List.vue
```

替换为：
```
│   ├── menu/                # 菜单
│   │   ├── api.ts
│   │   └── views/
│   │       ├── List.vue
│   │       └── MenuFormDrawer.vue
```

- [x] **Step 3: README.md 更新 smoke 数量与特性**

找到：
```markdown
- 🌫️ **Playwright smoke 测试自动化**：CI 中跑登录重定向 + 登录 + 列表渲染 + 布局配置 5 个端到端用例
```

替换为：
```markdown
- 🌫️ **Playwright smoke 测试自动化**：CI 中跑登录重定向 + 列表渲染 + 布局配置 + 业务页面闭环 9 个端到端用例
```

并在「架构与工程化」或「UI 与体验」特性列表加：
```markdown
- 🌳 **菜单树形 CRUD**：el-tree draggable 拖拽排序 + 增删改查 + 零新依赖
```

- [x] **Step 4: 验证全套**

```bash
PATH="/Users/wangtao/.nvm/versions/node/v22.22.0/bin:$PATH" pnpm lint
PATH="/Users/wangtao/.nvm/versions/node/v22.22.0/bin:$PATH" pnpm type-check
PATH="/Users/wangtao/.nvm/versions/node/v22.22.0/bin:$PATH" pnpm test
PATH="/Users/wangtao/.nvm/versions/node/v22.22.0/bin:$PATH" pnpm build
```

Expected: 4 件套全绿

- [x] **Step 5: Commit**

```bash
PATH="/Users/wangtao/.nvm/versions/node/v22.22.0/bin:$PATH" git add CLAUDE.md docs/standards/01-ARCHITECTURE.md README.md
PATH="/Users/wangtao/.nvm/versions/node/v22.22.0/bin:$PATH" git commit -m "docs(m7c): sync business pages standard and menu CRUD to docs"
```

---

### Task 12: 最终验证 + push

**Files:** 无（仅验证）

- [x] **Step 1: 本地全量验证**

```bash
PATH="/Users/wangtao/.nvm/versions/node/v22.22.0/bin:$PATH" pnpm lint
PATH="/Users/wangtao/.nvm/versions/node/v22.22.0/bin:$PATH" pnpm type-check
PATH="/Users/wangtao/.nvm/versions/node/v22.22.0/bin:$PATH" pnpm test
PATH="/Users/wangtao/.nvm/versions/node/v22.22.0/bin:$PATH" pnpm build
PATH="/Users/wangtao/.nvm/versions/node/v22.22.0/bin:$PATH" nohup pnpm dev --host 127.0.0.1 --strictPort > /tmp/vite-dev.log 2>&1 &
for i in $(seq 1 30); do curl -sf http://127.0.0.1:5173/ > /dev/null && break; sleep 1; done
PATH="/Users/wangtao/.nvm/versions/node/v22.22.0/bin:$PATH" pnpm smoke
lsof -ti:5173 | xargs kill 2>/dev/null || true
```

Expected: 4 件套全绿 + 9 smoke 全绿

- [x] **Step 2: 行数检查**

```bash
wc -l src/modules/system/views/admin/List.vue \
      src/modules/system/views/role/List.vue \
      src/modules/system/views/permission/List.vue \
      src/modules/system/user/views/List.vue \
      src/modules/system/menu/views/List.vue
```

Expected: 4 个业务 List.vue 均 < 250 行（dict/List.vue 除外，因含层级逻辑）

- [x] **Step 3: 手动冒烟全清单（Playwright MCP，admin 登录后）**

- [x] 登录 → 跳转 → 退出
- [x] user 列表：SearchTable 渲染 + 查看/编辑/删除 + view 模式 drawer 只读
- [x] admin 列表：同 user，含 super/admin 角色
- [x] role 列表：CRUD + 权限分配独立 drawer（el-tree 勾选 + 保存）
- [x] permission 列表：CRUD + module 过滤
- [x] dict 列表：PageContainer 包裹 + 三层级联正常
- [x] menu 列表：el-tree 渲染 + 新增顶级/子菜单 + 编辑 + 删除 + 拖拽排序
- [x] SettingsDrawer 6 项配置响应 + 持久化
- [x] 暗黑模式切换
- [x] TagsView 右键 5 项菜单
- [x] 刷新页面配置持久化

- [x] **Step 4: git log 确认 commit 序列**

```bash
git log --oneline 1efe112..HEAD
```

Expected: 12 个 commit（Task 1-11 各一个 + 可能的修正）

- [x] **Step 5: push**

```bash
PATH="/Users/wangtao/.nvm/versions/node/v22.22.0/bin:$PATH" git push origin main
```

- [x] **Step 6: CI 验证**

到 GitHub Actions 看 5 个 job（lint / type-check / test / build / smoke）全绿。

---

## DoD 自检清单

完成所有任务后对照 spec §十 DoD：

- [x] 4 件套全绿（lint / type-check / test / build）
- [x] 9 smoke 全绿
- [x] admin/role/permission List.vue 重构后 < 250 行
- [x] dict/List.vue 仅包裹 PageContainer，子组件不动
- [x] FormDrawer 增强：mode + dependencies + field-level validator + 新增 password/treeSelect 字段类型
- [x] user/List.vue 补齐 view 模式 + lastLoginTime 列 + 密码跨字段校验
- [x] system/menu 树形 CRUD 可用（el-tree draggable + MenuFormDrawer）
- [x] 零新依赖
- [x] 文档同步（CLAUDE.md / 01-ARCHITECTURE.md / README.md）
- [x] push 到 origin/main，CI 5 作业全绿
