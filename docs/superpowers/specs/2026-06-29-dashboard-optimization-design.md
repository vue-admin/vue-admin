# 首页优化 - 达到优秀开源标准

## 背景

当前 `src/modules/dashboard/views/Home.vue` 存在以下问题：

- **607 行**（超 500 行红线 107 行），未拆分
- 图表是 `el-empty` 占位，无真实可视化
- 全部为组件内硬编码假数据，无 API 集成
- 快速操作路径错误（`/system/admin` 已合并、`/crud/list` 路径错）
- 视觉普通：圆形彩色图标 + 蓝色卡片，无差异化设计
- 无角色个性化：所有用户看到相同的"您好，管理员！"

通过对比业界标杆（vben-admin、soybean-admin、ant-design-pro、naive-ui-admin），本 spec 定义首页优化为优秀开源标准。

## 目标

1. **Home.vue 拆分为 6 个子组件 + 1 个布局容器**，主文件 ≤ 100 行
2. **接入 ECharts**（按需引入）实现真实图表
3. **Mock API 驱动数据**，符合生产架构
4. **极简数据风**视觉：白底 / 轻边框 / 强调数字 / 克制配色
5. **角色个性化**：管理员看完整工作台，普通用户看简洁门户

## 范围边界（YAGNI）

**纳入**：
- Home.vue 拆分（6 子组件）
- ECharts 按需引入与封装
- 3 个 dashboard Mock 端点
- 角色差异化布局

**不纳入**：
- 实时数据推送（WebSocket）
- 自定义拖拽布局
- 多主题切换（仅保留深浅色联动）
- 国际化（i18n 渐进迁移，不在本次范围）
- 自定义指标配置

---

## 架构设计

### 角色差异化布局

```
┌─ 管理员视角（完整工作台）──────────────────────────┐
│  [NoticeBanner 公告横幅]                            │
│  [WelcomeCard 欢迎卡 - 个性化问候 + 角色 + 时间]    │
│  [StatsCards 4 统计卡 - 用户/订单/营收/活跃 + 趋势] │
│  [ChartCards 2 图表 - 趋势折线 + 角色分布饼图]      │
│  ┌─ActivityTimeline─┐ ┌─QuickActions──┐           │
│  │ 最新动态（timeline)│ │ 快捷入口（grid) │           │
│  └──────────────────┘ └──────────────┘           │
└────────────────────────────────────────────────────┘

┌─ 普通用户视角（简洁门户）──────────────────────────┐
│  [NoticeBanner 公告横幅]                            │
│  [WelcomeCard 欢迎卡 - 简化版]                      │
│  [QuickActions 快捷入口 - 基于权限过滤]             │
│  [ActivityTimeline 最新动态 - 公告类]              │
└────────────────────────────────────────────────────┘
```

**判定逻辑**：复用 `permissionStore.isSuperAdmin`，无需新增字段。

**普通用户 WelcomeCard 差异**：隐藏"上次登录时间/IP"字段，仅显示问候语 + 当前时间 + 主要 CTA（个人中心/修改密码）。

### 组件文件结构

```
src/modules/dashboard/
├── views/
│   └── Home.vue                  # ~80 行 布局组合
├── components/
│   ├── NoticeBanner.vue          # 已存在（保留）
│   ├── WelcomeCard.vue           # ~60 行 新建
│   ├── StatsCards.vue            # ~80 行 新建
│   ├── ChartCards.vue            # ~100 行 新建（含 echarts）
│   ├── ActivityTimeline.vue      # ~70 行 新建
│   └── QuickActions.vue          # ~80 行 新建
└── api.ts                        # 新建：dashboard 数据接口
```

### 组件接口

| 组件 | Props | Emits |
|------|-------|-------|
| `WelcomeCard` | `{ username: string, role: string, lastLogin?: string }` | `action-click(action)` |
| `StatsCards` | `{ items: StatItem[] }` 其中 `StatItem = { key, label, value, unit?, trendPct?, icon? }` | - |
| `ChartCards` | `{ trendData: TrendPoint[], distributionData: DistItem[], loading: boolean }` | `range-change(range)` |
| `ActivityTimeline` | `{ activities: Activity[] }` 其中 `Activity = { title, desc, time, type }` | - |
| `QuickActions` | `{ actions: QAction[] }` 其中 `QAction = { key, label, icon, path, perm? }` | `select(action)` |

### ECharts 按需引入

`src/modules/dashboard/components/ChartCards.vue`：

```ts
import * as echarts from 'echarts/core'
import { LineChart, PieChart } from 'echarts/charts'
import { GridComponent, TooltipComponent, LegendComponent } from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'

echarts.use([LineChart, PieChart, GridComponent, TooltipComponent, LegendComponent, CanvasRenderer])
```

**预期包体积**：~150KB gzipped（仅含 line + pie + 必要 component）

### 主题联动

```ts
// 监听 themeStore.isDark，销毁后重建图表实例
watch(() => themeStore.isDark, (dark) => {
  chartInstance?.dispose()
  renderChart(dark)
})
```

**深色主题**：背景透明，文本白色，网格线 `rgba(255,255,255,0.1)`
**浅色主题**：背景透明，文本黑色，网格线 `rgba(0,0,0,0.1)`

### 统计卡趋势计算

```
trendPct > 0  →  绿色 ↑
trendPct < 0  →  红色 ↓
trendPct === 0 → 灰色 -
```

不使用 el-icon，纯 Unicode 字符（↑↓→），避免布局抖动。

### 快捷入口权限过滤

```ts
const visibleActions = computed(() =>
  props.actions.filter(a =>
    !a.perm || permissionStore.hasAnyPermission(a.perm)
  )
)
```

---

## 数据流

```
Home.vue (onMounted)
  ├── useDashboardStats()   ─→ GET /api/dashboard/stats
  ├── useDashboardCharts()  ─→ GET /api/dashboard/charts?range=7d
  │                          ← range-change 事件触发重新加载
  └── useDashboardActivities() ─→ GET /api/dashboard/activities
```

复用 `@/lib/http/client` 的 `api`，错误处理三层：
- 拦截器（全局提示）
- api 函数透传
- Home.vue 用 try/catch + ref 默认值，UI 不崩

---

## Mock API 设计

新增 `src/mock/apis/dashboard.ts`：

### `GET /api/dashboard/stats`

```ts
// 管理员
{
  code: 0,
  data: {
    users:    { value: 12345, trendPct: 12.5 },
    orders:   { value: 5678,  trendPct: 8.3 },
    revenue:  { value: 987654.32, trendPct: 15.2 },
    active:   { value: 234, trendPct: -3.1 }
  }
}

// 普通用户（仅返回个人相关，量级小）
{
  code: 0,
  data: {
    users: { value: 1, trendPct: 0 }
  }
}
```

### `GET /api/dashboard/charts?range=7d|30d|90d`

```ts
{
  code: 0,
  data: {
    trend: [
      { date: '2026-06-23', value: 120 },
      // ... 7 或 30 或 90 天
    ],
    distribution: [
      { name: '管理员', value: 5 },
      { name: '普通用户', value: 320 },
      { name: 'VIP', value: 45 }
    ]
  }
}
```

### `GET /api/dashboard/activities`

```ts
{
  code: 0,
  data: [
    {
      title: '系统更新',
      desc: 'v1.2.0 发布，新增 12 项功能',
      time: '2026-06-29 10:30',
      type: 'primary' | 'success' | 'warning' | 'danger'
    }
    // ... 5 条
  ]
}
```

---

## 视觉规范（极简数据风）

| 元素 | 规格 |
|------|------|
| 卡片背景 | `#fff`（深色：`var(--el-bg-color)`） |
| 卡片边框 | `1px solid var(--el-border-color-lighter)` |
| 卡片阴影 | `none`（hover 时 `0 2px 8px rgba(0,0,0,0.06)`） |
| 主数字 | `font-size: 28px; font-weight: 600` |
| 副文本 | `font-size: 13px; color: var(--el-text-color-regular)` |
| 趋势绿 | `#52c41a`（el success） |
| 趋势红 | `#f5222d`（el danger） |
| 趋势灰 | `var(--el-text-color-secondary)` |
| 主色调 | 仅 accent 用，不滥用 |

---

## 错误处理

| 层 | 行为 |
|----|------|
| Mock 端点失败 | 返回 `code: -1`，UI 显示"数据加载失败，请刷新" |
| api 函数异常 | 透传 `HttpError`，Home.vue 捕获 |
| 单卡片失败 | 不影响其他卡片，各自显示错误状态 |
| 图表渲染失败 | fallback 到 `<el-empty>` + 错误提示 |

---

## 测试

| 类型 | 覆盖点 |
|------|--------|
| 单元 | `StatsCards` 趋势百分比颜色判定（正/负/零） |
| 单元 | `QuickActions` 权限过滤（含/不含 perm 字段） |
| 单元 | `useDashboardStats` 失败 fallback |
| 集成 | Mock `/api/dashboard/*` 返回结构正确 |
| 视觉 | 管理员 vs 普通用户布局截图比对（手动） |

---

## 验收

```bash
pnpm type-check
pnpm lint
pnpm test
pnpm build
```

- Home.vue 行数 ≤ 100
- 6 子组件均 < 150 行
- 管理员页面：4 统计卡 + 2 图表 + 动态 + 快捷
- 普通用户页面：简化版（无统计/图表）
- ECharts 按需引入，包体积增量 < 200KB gzipped
- 深浅色主题切换图表联动

---

## 不做的事（YAGNI）

- ❌ 自定义指标配置（YAGNI）
- ❌ 拖拽布局（YAGNI）
- ❌ 实时数据（无场景）
- ❌ 多套主题预设（仅保留深浅）
- ❌ 业务页面 i18n 迁移（独立任务）

---

## 实施顺序

1. 新增 `dashboard/api.ts` + Mock 端点
2. 拆分 6 子组件（自下而上：先叶子，后 Home.vue）
3. 引入 ECharts 封装到 ChartCards
4. Home.vue 接入数据 + 角色判断
5. 单元测试 + 视觉验证
6. 删除原 Home.vue 中的旧代码
