# M7-C 业务页面闭环验证 设计文档

> **目标**：将 admin/role/permission/dict 4 个 List.vue 重构为通用组件库模式，实现 system/menu 树形 CRUD，补齐 user/List.vue 简化项，使所有业务页面标准化、零样板。

## 一、背景与范围

### 1.1 现状

M7-B 完成通用组件库（SearchTable / FormDrawer / PageContainer / useCrud）与 layout 配置中心，并在 user/List.vue 试点重构（801 → 231 行）。但其余 4 个 List.vue 仍是旧版手写模板：

| 文件 | 行数 | 特殊功能 |
|---|---|---|
| `system/views/admin/List.vue` | 795 | view 模式 + 密码跨字段校验 + lastLoginTime 列 |
| `system/views/role/List.vue` | 791 | 权限分配独立 drawer（el-tree） |
| `system/views/permission/List.vue` | 736 | 标准 CRUD |
| `system/views/dict/List.vue` | 395 | 三层级联（DictTree/DictDetail/DictFormDrawer/useDictTree 子组件） |
| `system/menu/views/List.vue` | 9 | 占位 `<el-empty>` |

M7-B Task 5 重构 user/List.vue 时简化了 3 项功能：view 只读模式、lastLoginTime 列、密码跨字段校验。

### 1.2 范围

**全量推进（用户确认）：**
1. 增强 FormDrawer：支持 view 模式 + dependencies 声明式联动 + field-level validator（向 vben 标准靠拢）
2. 补齐 user/List.vue 简化项（view 模式 / lastLoginTime 列 / 密码跨字段校验）
3. 重构 admin/role/permission 3 个 List.vue（同构模式）
4. dict/List.vue 仅包裹 PageContainer（保留层级子组件）
5. 实现 system/menu 树形 CRUD（el-tree + FormDrawer treeSelect，零新依赖）
6. smoke 扩展至 9 测试 + 文档同步 + push

### 1.3 非目标

- 不全量照搬 vben schema 驱动 + CSS Grid（大重构，超出范围）
- 不引入新依赖（el-tree draggable 是 EP 原生能力）
- 不实现 i18n、Storybook（留 L3）
- 不改 4 个模块的 api.ts（已存在，直接复用）

## 二、设计规范（用户确认）

1. **不向现有设计妥协**：采用优秀标准化设计。FormDrawer 增强向 vben 路线靠拢（schema 驱动 + dependencies + field-level validator），不全量改 Grid。
2. **尽可能少的依赖**：如无必要不加依赖。menu 树形 CRUD 用 EP 原生 el-tree draggable，不引入 vue-draggable-next。
3. **执行顺序方案 A**：FormDrawer 增强 + user 补齐 → admin/role/permission 重构 → dict 包裹 → menu 实现 → smoke + 文档。

## 三、FormDrawer 增强（Task 1-2）

### 3.1 类型扩展

`src/app/components/FormDrawer/types.ts`：

```ts
export type FormDrawerMode = 'add' | 'edit' | 'view'

export interface FormFieldDependency {
  /** 触发字段名 */
  trigger: string
  /** 显示条件，返回 true 时字段可见 */
  show: (values: Record<string, unknown>, ctx: { mode: FormDrawerMode }) => boolean
}

export interface FormField {
  prop: string
  label: string
  type: FormFieldType
  options?: FormFieldOption[]
  placeholder?: string
  default?: unknown
  span?: number
  disabled?: boolean
  /** 声明式联动：trigger 字段值变化时按 show 函数决定显隐 */
  dependencies?: FormFieldDependency[]
  /** field-level 校验规则（Element Plus FormItemRules） */
  rules?: Array<Record<string, unknown>>
}

export interface FormDrawerProps {
  modelValue: boolean
  title: string
  formData: Record<string, unknown>
  fields: FormField[]
  rules?: Record<string, Array<Record<string, unknown>>>
  loading?: boolean
  width?: string
  mode?: FormDrawerMode  // 默认 'add'
}
```

### 3.2 组件实现

`src/app/components/FormDrawer/index.vue` 关键改动：

1. **view 模式全字段 disabled**：
   ```vue
   <component
     :is="resolveComponent(field.type)"
     v-model="formData[field.prop]"
     :disabled="field.disabled || loading || mode === 'view'"
   >
   ```

2. **dependencies 声明式显隐**：
   ```vue
   <el-col
     v-for="field in visibleFields"
     :key="field.prop"
     :span="field.span || 24"
   >
   ```
   ```ts
   const visibleFields = computed(() => {
     return props.fields.filter((field) => {
       if (!field.dependencies) return true
       return field.dependencies.every((dep) =>
         dep.show(props.formData, { mode: props.mode })
       )
     })
   })
   ```

3. **footer 按钮按 mode 切换**：
   ```vue
   <template #footer>
     <el-button v-if="mode === 'view'" @click="handleCancel">关闭</el-button>
     <template v-else>
       <el-button @click="handleCancel">取消</el-button>
       <el-button type="primary" :loading="loading" @click="handleConfirm">确认</el-button>
     </template>
   </template>
   ```

4. **field-level validator + 关联重校验**：
   - 字段 `rules` 透传到 `<el-form-item :rules="field.rules">`
   - password 字段 change 时手动 `formRef.value?.validateField('confirmPassword')` 触发重校验
   - 调用方在 UserFormDrawer 等组件中通过 `@update:formData` 或 watch 实现

### 3.3 新增字段类型

`FormFieldType` 增加：
- `password`：el-input type=password show-password
- `treeSelect`：el-tree-select（menu 父节点选择用）
- `cascader`：el-cascader（预留，本里程碑不用）

### 3.4 测试

新增 4 个测试（`test/app/components/FormDrawer.spec.ts`）：
1. view 模式所有字段 disabled
2. dependencies 隐藏字段（trigger 字段值变化时字段消失）
3. view 模式 footer 仅"关闭"按钮
4. field-level rules 透传到 el-form-item

现有 3 个测试保持绿（mode 默认 'add'，dependencies 可选）。

## 四、user/List.vue 补齐简化项（Task 3）

### 4.1 UserFormDrawer.vue 改动

1. props 增加 `mode: 'add' | 'edit' | 'view'`
2. 密码字段加 dependencies：
   ```ts
   {
     prop: 'password',
     label: '密码',
     type: 'password',
     dependencies: [{ trigger: 'mode', show: (_, ctx) => ctx.mode !== 'view' }],
     placeholder: '编辑时留空表示不修改',
     rules: [{ required: true, message: '请输入密码', trigger: 'blur' }]
   }
   ```
3. confirmPassword 字段：
   - dependencies 同 password
   - field-level validator：`validator: (rule, value, cb) => value === formData.password ? cb() : cb(new Error('两次密码不一致'))`
   - watch password 变化时 `formRef.validateField('confirmPassword')`

### 4.2 List.vue 改动

1. columns 恢复 lastLoginTime 列（formatter formatDate）
2. 操作列增加"查看"按钮（openDrawer 'view'）
3. openDrawer 函数支持 'view' mode

### 4.3 测试

UserFormDrawer 不单测（UI 组件，smoke 覆盖）。smoke 扩展含 view 模式断言（Task 7）。

## 五、admin/role/permission 重构（Task 4-6）

### 5.1 同构模式

3 个模块各执行：
1. 抽离 `<Domain>FormDrawer.vue`（用增强后 FormDrawer + dependencies + field-level validator）
2. 重写 `List.vue`：
   - `<PageContainer>` 包裹
   - `<SearchTable>` + columns 数组 + search slot + actions slot
   - `useCrud` 接管列表状态
   - 操作列：查看（admin 有）/ 编辑 / 删除
   - 批量删除

### 5.2 admin 特殊处理

- role 选项 super|admin（与 user 的 admin|user|vip 不同）
- password 字段同 user 用 dependencies + confirmPassword 跨字段校验
- view 模式（admin 原版有，保留）

### 5.3 role 特殊处理

额外抽离 `RolePermissionDrawer.vue`：
- el-tree 展示所有权限（fetchRolePermissions + fetchAllPermissions）
- 默认勾选当前角色权限
- 保存调 setRolePermissions
- **不进 FormDrawer**（el-tree 不适合配置驱动），独立 drawer
- List.vue 操作列增加"权限"按钮打开此 drawer

### 5.4 permission 特殊处理

- module 字段是 select（system/user/role/permission/dict/config 6 选项）
- 无特殊功能，标准 CRUD

### 5.5 API 复用

3 个模块的 api.ts 已存在（admin/role/permission），直接 import 使用，不改 API。

### 5.6 行数目标

每个 List.vue < 250 行（dict 除外）。

## 六、dict/List.vue 仅包裹 PageContainer（Task 7）

### 6.1 改动

- 外层用 `<PageContainer title="字典管理">` 包裹现有内容
- 保留 DictTree/DictDetail/DictFormDrawer/useDictTree 不动
- 保留现有 context-menu（右键菜单）逻辑
- 仅搜索/工具栏区域可选用 SearchTable 的 search slot 风格，但不强制（YAGNI）

### 6.2 影响范围

仅 dict/List.vue 1 文件，约 10 行改动。

## 七、system/menu 树形 CRUD（Task 8-9）

### 7.1 API（新建 `src/modules/system/menu/api.ts`）

```ts
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

export const fetchMenuTree = () => api.get<MenuInfo[]>('/api/system/menu/tree')
export const createMenu = (data: Omit<MenuInfo, 'id' | 'children'>) => api.post<MenuInfo>('/api/system/menu/create', data)
export const updateMenu = (id: string, data: Partial<MenuInfo>) => api.put<MenuInfo>(`/api/system/menu/update/${id}`, data)
export const deleteMenu = (id: string) => api.del<boolean>(`/api/system/menu/delete/${id}`)
export const updateMenuSort = (draggingId: string, targetId: string, position: 'before' | 'after' | 'inner') =>
  api.post<boolean>('/api/system/menu/sort', { draggingId, targetId, position })
```

### 7.2 Mock（新建 `src/mock/apis/menu-manage.ts`）

区别于现有 `menu.ts`（用户菜单端点 `/api/system/menus`），新建 `/api/system/menu/*` 端点：
- GET `/api/system/menu/tree` 返回完整菜单树
- POST `/api/system/menu/create` / `/update/:id` / `/delete/:id` / `/sort`

数据源：从现有 `src/mock/apis/menu.ts` 的 `ALL_MENUS` 抽取共享，避免重复维护。

### 7.3 List.vue

- el-tree（draggable + node-key + default-expand-all）
- 右上角"新增顶级菜单"按钮
- 节点 hover 显示操作按钮（新增子菜单/编辑/删除）
- 拖拽排序调 updateMenuSort（el-tree `node-drop` 事件）
- 用 PageContainer 包裹

### 7.4 MenuFormDrawer.vue

用增强后 FormDrawer，字段：
- parentId（treeSelect，可选，数据来自 fetchMenuTree）
- name（input，必填）
- path（input，必填）
- component（input，可选）
- icon（input，可选）
- sort（number，默认 0）
- status（radio，active/inactive）

### 7.5 零新依赖

el-tree draggable 是 Element Plus 原生能力，无需 vue-draggable-next 或 sortablejs。

## 八、smoke 扩展（Task 10）

新建 `test/smoke/business.spec.ts`，4 个新测试：
1. admin 列表渲染 + 新增 drawer 打开 + view drawer 打开
2. role 列表渲染 + 权限分配 drawer 打开
3. permission 列表渲染
4. menu 树渲染 + 节点操作（新增顶级菜单 drawer 打开）

总 smoke：5（现有）+ 4（新）= 9 个。

## 九、文档同步（Task 11）

- `CLAUDE.md`：第 10 条「业务页面标准」—— 所有 List 用 SearchTable+useCrud+PageContainer+FormDrawer；FormDrawer 支持 mode + dependencies + field-level validator
- `docs/standards/01-ARCHITECTURE.md`：modules/system/menu 补 api.ts；app/components/FormDrawer types 补 mode/dependencies/rules
- `README.md`：特性列表更新（9 smoke、menu 树形 CRUD）

## 十、DoD

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

## 十一、任务估算

| Task | 内容 | 时长 |
|---|---|---|
| 1 | FormDrawer types 扩展 + mode + dependencies + field-level rules | 1.5h |
| 2 | FormDrawer 组件实现 + 4 新测试 | 1.5h |
| 3 | user/List.vue 补齐简化项 + UserFormDrawer view mode | 1h |
| 4 | admin 重构（AdminFormDrawer + List） | 1.5h |
| 5 | role 重构（RoleFormDrawer + RolePermissionDrawer + List） | 2h |
| 6 | permission 重构（PermissionFormDrawer + List） | 1h |
| 7 | dict/List.vue 包裹 PageContainer | 0.5h |
| 8 | menu api.ts + mock menu-manage.ts | 1h |
| 9 | menu List.vue + MenuFormDrawer.vue | 2h |
| 10 | smoke 扩展 4 测试 | 1h |
| 11 | 文档同步 | 0.5h |
| 12 | 最终验证 + push | 0.5h |
| **合计** | | **~14h** |

## 十二、风险

1. **FormDrawer dependencies 联动**：trigger 字段值变化时需响应式重算 visibleFields。用 computed 包裹 fields.filter，依赖 props.formData 的响应式即可。
2. **field-level validator 关联重校验**：EP 2.11 不支持 `relations` prop（2.13+ 才有），需在 password 字段 change 时手动 `formRef.validateField('confirmPassword')`。FormDrawer 需暴露 formRef 或在组件内 watch password 变化。
3. **menu mock 数据共享**：从现有 menu.ts 抽取 ALL_MENUS 时需保持引用一致，避免两份数据。可导出 ALL_MENUS 并在 menu-manage.ts import。
4. **role 权限分配 drawer 独立性**：不进 FormDrawer，独立组件，避免 FormDrawer 过度复杂。
5. **dict 重构风险最低**：仅包裹 PageContainer，不动子组件，风险隔离。
