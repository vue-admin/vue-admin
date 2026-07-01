/**
 * API 一致性检测脚本
 * 检查前端 API 调用和 mock API 端点是否匹配
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// 扫描目录获取所有文件
function scanDir(dir, pattern) {
  const results = []
  function scan(current) {
    const files = fs.readdirSync(current)
    files.forEach(file => {
      const fullPath = path.join(current, file)
      const stat = fs.statSync(fullPath)
      if (stat.isDirectory()) {
        scan(fullPath)
      } else if (pattern.test(file)) {
        results.push(fullPath)
      }
    })
  }
  scan(dir)
  return results
}

// 提取前端 API 调用路径
function extractFrontendApis(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8')
  const apis = []
  
  // 匹配 api.get/post/put/del 调用
  const patterns = [
    /api\.(get|post|put|del)\s*<[^>]+>\s*\(\s*['"]([^'"]+)['"]/g,
    /api\.(get|post|put|del)\s*\(\s*['"]([^'"]+)['"]/g
  ]
  
  patterns.forEach(pattern => {
    let match
    while ((match = pattern.exec(content)) !== null) {
      const method = match[1] === 'del' ? 'delete' : match[1]
      const path = match[2]
        .replace(/\/\$\{[^}]+\}/g, '/:id')
        .replace(/\?.*$/, '')
      
      apis.push({ method, path, file: filePath })
    }
  })
  
  return apis
}

// 提取 MSW handler 端点
function extractMockApis(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8')
  const apis = []

  // 匹配 MSW 的 http.get/post/put/patch/delete('/api/...', ...) 调用
  const handlerPattern = /http\.(get|post|put|patch|delete)\s*\(\s*['"]([^'"]+)['"]/g

  let match
  while ((match = handlerPattern.exec(content)) !== null) {
    const method = match[1].toLowerCase()
    const url = match[2]
    apis.push({ method, path: url, file: filePath })
  }

  return apis
}

// 规范化路径用于比较
function normalizePath(path) {
  return path
    .replace(/\/:\w+/g, '/*')
    .replace(/\/\d+/g, '/*')
    .toLowerCase()
}

console.log('🔍 开始 API 一致性检测...\n')

// 1. 收集所有前端 API 调用
const modulesPath = path.join(__dirname, '..', 'src', 'modules')
const apiFiles = scanDir(modulesPath, /\.ts$/)
  .filter(f => f.endsWith('/api.ts'))

let frontendApis = []
apiFiles.forEach(file => {
  frontendApis = frontendApis.concat(extractFrontendApis(file))
})

console.log(`📊 前端 API 文件: ${apiFiles.length} 个`)
console.log(`📊 前端 API 调用: ${frontendApis.length} 个\n`)

// 2. 收集所有 MSW handler 端点
const mockPath = path.join(__dirname, '..', 'src', 'mock', 'handlers')
const mockFiles = scanDir(mockPath, /\.ts$/)

let mockApis = []
mockFiles.forEach(file => {
  mockApis = mockApis.concat(extractMockApis(file))
})

console.log(`📊 Mock API 文件: ${mockFiles.length} 个`)
console.log(`📊 Mock API 端点: ${mockApis.length} 个\n`)

// 3. 检查不匹配的 API
const missingApis = []

frontendApis.forEach(frontend => {
  const normalizedFrontend = normalizePath(frontend.path)
  
  const found = mockApis.some(mock => {
    const normalizedMock = normalizePath(mock.path)
    
    // 检查方法匹配
    const methodMatch = 
      // 精确匹配
      mock.method === frontend.method ||
      // 通配符匹配
      mock.method.includes('pick') ||
      mock.method.includes('|')
    
    return methodMatch && normalizedFrontend === normalizedMock
  })
  
  if (!found) {
    missingApis.push(frontend)
  }
})

// 4. 输出结果
if (missingApis.length === 0) {
  console.log('✅ 所有 API 端点匹配成功！')
  process.exit(0)
} else {
  console.log('❌ 发现不一致的 API 端点：\n')
  
  const byFile = {}
  missingApis.forEach(api => {
    const shortFile = api.file.replace(/^.*src\/modules\//, '')
    if (!byFile[shortFile]) byFile[shortFile] = []
    byFile[shortFile].push(api)
  })
  
  Object.entries(byFile).forEach(([file, apis]) => {
    console.log(`📁 ${file}`)
    apis.forEach(api => {
      console.log(`   ${api.method.toUpperCase().padEnd(7)} ${api.path}`)
    })
    console.log('')
  })
  
  console.log(`总计: ${missingApis.length} 个 API 端点需要检查`)
  process.exit(1)
}
