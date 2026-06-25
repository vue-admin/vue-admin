# Vue Admin 规范文档集

> 本目录是项目的"宪法"。所有架构选型、代码组织、API 设计、命名必须可在本目录找到依据。

## 文档分层

```
导航层   → README.md（本文件）
战略层   → 00-OVERVIEW.md     战略定位与演进路线
架构层   → 01-ARCHITECTURE.md 目录结构、组件分层、依赖方向
模块层   → 02-API.md          HTTP 客户端与 API 设计
         → 03-STATE.md        状态管理
细节层   → 04-NAMING.md       命名约定
```

## 强制度分层

| 层级 | 强制方式 | 文档 |
|------|---------|------|
| **工具强制** | ESLint + Prettier + commitlint + husky 自动拦截 | 见对应配置文件 |
| **评审强制** | Code Review 把关 | 01 / 02 / 03 / 04 |
| **决策参考** | 战略对齐用 | 00 |

工具能强制的规则（代码风格、提交格式）**不在文档中重复定义**，文档只说原则，细节看配置。

## 使用方式

| 场景 | 查阅 |
|------|------|
| 写代码前 | 01-ARCHITECTURE / 04-NAMING |
| 新增 API | 02-API |
| 新增全局状态 | 03-STATE |
| 战略/选型分歧 | 00-OVERVIEW |
| 起 commit message | 见 `commitlint.config.js` |
| 起文件名 | 04-NAMING |

## 反馈

规范不是教条，遇到不合理处：
1. 不私自违反
2. 提 issue 标记 `type: spec`
3. 在 issue 中给出场景与改进建议
4. 通过后修订本目录
