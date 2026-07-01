# 变更日志


所有显著变更均记录在此文件中。

本格式基于 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.1.0/)，
版本号遵循 [Semantic Versioning](https://semver.org/lang/zh-CN/)。

## [未发布]

### Bug Fixes

- Align data contracts, real CSV export, notice classification
- Resolve intermittent 404 on dynamic routes
- Replace legacy --ep-color-primary with --el-color-primary
- Correct MessageBoxOptions import and resolve lint warnings
- Mark login route public and bind dev server dual-stack
- Rename SideBar → Sidebar to match import path (CI case-sensitive)
- Address M3 review findings (loadProfile race, submitting binding, side-effect doc)
- Address M2 review findings (mock revert, grouping, status, view cleanup)

### Build

- Configurable base, echarts split, tooling and root cleanup
- Upgrade Vitest 3 and coverage-v8
- Upgrade Vite 7, plugins, lint-staged 17
- Upgrade Vue 3.5, Pinia, Vue Router, Element Plus, VueUse
- Upgrade TypeScript 5, vue-tsc 2, @types/node 22

### CI/CD

- Drop explicit pnpm version to fix action-setup failure
- Add GitHub Pages deploy workflow
- Add smoke job and sync docs after architecture migration
- Mark rc/alpha/beta tags as prerelease
- Checkout main branch to allow CHANGELOG push
- Use bundled git-cliff instead of third-party action
- Add release.yml for tag-triggered CHANGELOG and GitHub Release
- Add lint/type-check/test/build jobs with Codecov upload

### Documentation

- Add quick-start and cloud deploy guides, fix docs SSR build
- Note GitHub Pages setup prerequisite
- Document VitePress site and ignore docs-site in eslint
- Mark dependency upgrade L1 item complete
- Document i18n skeleton and locale field
- Sync theme derivative architecture
- Mark DoD checklist complete after CI green
- Mark error boundary, loading, and confirm dialog complete
- Document global loading and confirm services
- Mark completed L1/L2 roadmap items
- Sync business pages standard and menu CRUD to docs
- Add business pages implementation plan
- Add business pages closure design spec
- Sync component library and layout settings to docs
- Write implementation plan for component library and layout settings
- Add component library and layout settings design spec
- Switch smoke to dev server since vite-plugin-mock only runs in configureServer hook
- Finalize spec with module standardization and write implementation plan
- Add M7-A architecture migration and smoke test design
- Update for v0.1.0-rc.1
- Align repository URL to vue-admin/vue-admin
- Enrich with full feature list, tech stack table, and governance links
- Refresh unreleased section
- Add CONTRIBUTING, CODE_OF_CONDUCT, SECURITY
- Add MIT LICENSE and README badges
- Add M6 open-source readiness spec and implementation plan
- Upgrade README with architecture, mock accounts, and full command list
- Align standards with four-layer architecture and new conventions
- Add foundation implementation plan (M1-M5)
- Add foundation design spec for HTTP/Auth/RBAC/Router infrastructure
- Add engineering standards index and module specifications

### Features

- Wire exports, notice toast UX, dashboard split, module suite
- Restructure system menu into 3-level groups, fix icons
- Add Selector family, column settings, DictTag/StatusTag
- Add format/file/cache business services and harden infra
- Add common vocabulary and SSR-safe global t
- Add Vercel and Netlify one-click deploy templates
- Add live component demos for SearchTable/FormDrawer/PageContainer
- Bootstrap VitePress documentation site
- Persist locale in layout store
- Add vue-i18n skeleton with zh-CN/en-US locales
- Add primary color derivative generator
- Add confirmService wrapper with app defaults
- Add loadingService singleton with nested-call stack
- Wire global Vue/JS/Promise error handlers to monitor
- Enhance ErrorBoundary with retry guard and custom fallback props
- Implement tree CRUD with draggable sort and MenuFormDrawer
- Add menu CRUD api and mock endpoints
- Restore view mode, lastLoginTime column and password cross-field validation
- Implement mode/dependencies/field-rules and password/treeSelect types
- Extend types with mode/dependencies/rules/treeSelect
- Wire primaryColor and componentSize to layout store
- Wire layout components to settings store for visibility toggle
- Add settingsDrawer and wire to Header gear button
- Add layout settings store with persistence
- Implement FormDrawer with config-driven fields and tests
- Implement PageContainer and SearchTable with tests
- Add useCrud composable with CRUD lifecycle and tests
- Scaffold app/components and app/composables directories
- Add system/menu placeholder for OSS standard coverage
- Bootstrap dynamic routes inside guard after profile load
- Menus endpoint returns permission-aware structure
- Register v-permission directive and install guards
- Add 4-step global guard (whitelist/auth/bootstrap/permission)
- Add dynamic route registration with module glob
- Add v-permission directive with DOM removal
- Add permission store with super_admin short-circuit
- Add auth endpoints (login/refresh/logout/me)
- Migrate Login.vue to modules/auth and use authService
- Add user store with loadProfile bootstrap
- Add authService with concurrent refresh protection
- Add AuthProvider interface with JWT default
- Add TokenStorage interface with MemorySession default
- Export unified 'http' instance with typed api helpers
- Install interceptors (token injection + ProblemDetail parse)
- Add TokenReader interface to break circular dependency
- Add notifyProblem helper for global error toast
- Add RFC 7807 problem parser with edge-case handling
- Provide monitor and wrap RouterView with ErrorBoundary
- Add ErrorBoundary component with retry and monitor capture
- Add console-based monitor implementation with tests
- Define foundation types (ApiResult, ProblemDetail, Monitor, RouteMeta)
- Scaffold four-layer directory structure (lib/app/modules/shared)

### Miscellaneous

- Add gen-module scaffold and api-consistency check
- Patch/minor bumps for vue, axios, element-plus, sass
- Align repo URLs and unify CI pnpm action
- Remove legacy apis/stores/utils/components and enforce via eslint
- Ignore coverage directory in eslint config
- Add Issue and PR templates
- Add git-cliff config and initial CHANGELOG
- Add commitlint and husky commit-msg hook
- Add open-source metadata and bump version to 0.1.0
- Clear all eslint errors via auto-fix and type refinements
- Remove lint-staged verification file
- Add husky + lint-staged pre-commit hook
- Add ESLint flat config with layer boundary rules

### Refactor

- I18n-ize SettingsDrawer and add language switcher
- Wire i18n plugin and locale sync in main.ts
- Wire applyPrimaryColor for 6-step derivative colors
- Replace inline ElMessageBox.confirm with confirmService
- Wrap List.vue with PageContainer for visual consistency
- Rewrite List.vue with SearchTable and useCrud
- Rewrite List.vue with SearchTable/useCrud, extract RolePermissionDrawer
- Rewrite List.vue with SearchTable and useCrud (795 -> ~190 lines)
- Rewrite List.vue with SearchTable and useCrud (801 -> ~150 lines)
- Relocate IconLogo, NotFound, nprogress to canonical paths
- Migrate stores to app/stores and close tagsview menu loop
- Migrate crud api and merge login api into auth module
- Migrate system domain apis to modules/system/<x>/api.ts
- Merge user module into system/user
- Rename home to dashboard to match OSS conventions
- Promote portrait to top-level profile module
- Remove demo multi-menu and empty system/config
- Migrate src/views/* to src/modules/<domain>/views/
- Remove dead useMonitor code from dynamic.ts
- Return RFC 7807 ProblemDetail for error responses
- Replace legacy Service with thin shell over unified http client
- Normalize naming to align with industry standards
- 清理冗余 HTTP 客户端，模块化字典页与标签页 store

### Tests

- Cover admin/role/permission/menu business pages
- Cover layout settings drawer and SearchTable rendering
- Cover login and list rendering
- Add unauthenticated redirect to /login
- Install playwright and configure base setup
- Add v8 coverage provider for CI reporting
- Verify lint-staged fires
- Add interceptor integration tests covering edge cases
<!-- generated by git-cliff -->
