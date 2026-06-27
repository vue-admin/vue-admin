// ESLint 9 flat config —— 强制四层架构目录边界
// 详见 .superpowers/sdd/briefs/task-M5.1-brief.md
import js from '@eslint/js'
import vue from 'eslint-plugin-vue'
import tseslint from '@typescript-eslint/eslint-plugin'
import tsparser from '@typescript-eslint/parser'
import importPlugin from 'eslint-plugin-import'
import globals from 'globals'

export default [
  // 全局忽略：产物、依赖、文档、mock（mock 为 M5.3 MSW 迁移前的过渡）
  {
    ignores: ['dist/**', 'node_modules/**', 'docs/**', 'src/mock/**', 'coverage/**'],
  },
  js.configs.recommended,
  ...vue.configs['flat/recommended'],
  {
    files: ['**/*.{ts,tsx,vue}'],
    languageOptions: {
      // 对 .vue 文件保留 vue-eslint-parser（来自 flat/recommended），
      // 通过 parserOptions.parser 把 tsparser 喂给 <script> 块；
      // 对 .ts/.tsx 文件，直接用 tsparser 作为顶层 parser。
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
        parser: tsparser,
      },
    },
    plugins: {
      '@typescript-eslint': tseslint,
      import: importPlugin,
    },
    rules: {
      ...tseslint.configs.recommended.rules,
      'vue/multi-word-component-names': 'off',
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
    },
  },
  // .ts/.tsx 文件没有 vue-eslint-parser 包装，必须显式设置顶层 parser
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      parser: tsparser,
    },
  },
  // 根目录配置文件（vite/vitest/eslint 等）运行在 Node 环境，需要 Node globals
  // 避免 process / __dirname / Buffer 等触发 no-undef
  {
    files: ['*.config.ts', '*.config.js', 'vite.config.ts', 'vitest.config.ts'],
    languageOptions: {
      globals: {
        ...globals.node,
      },
    },
  },
  // 目录边界强制：lib 不得依赖业务层
  {
    files: ['src/lib/**/*.{ts,vue}'],
    rules: {
      'no-restricted-imports': ['error', {
        patterns: [
          {
            group: ['@/app/*', '@/modules/*', '@/views/*', '@/apis/*', '@/router/*', '@/stores/*', '@/layout/*', '@/components/*'],
            message: 'lib/ 不得依赖业务层（app/modules/views/apis/router/stores/layout/components）',
          },
        ],
      }],
    },
  },
  // shared 不得依赖业务层与基础设施层
  {
    files: ['src/shared/**/*'],
    rules: {
      'no-restricted-imports': ['error', {
        patterns: [
          {
            group: ['@/app/*', '@/modules/*', '@/views/*', '@/apis/*', '@/router/*', '@/stores/*', '@/layout/*', '@/components/*', '@/lib/*'],
            message: 'shared/ 不得依赖任何业务层或基础设施层',
          },
        ],
      }],
    },
  },
  // 例外：路由守卫需要拉取 user/permission store 做权限检查
  // 项目 plan M4.4 全局约束明确允许此反向依赖（lib→app/stores）
  // 禁止的是 lib→modules/* 业务模块依赖
  {
    files: ['src/lib/router/guards.ts'],
    rules: {
      'no-restricted-imports': 'off',
    },
  },
]
