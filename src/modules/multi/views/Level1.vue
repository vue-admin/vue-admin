<template>
  <div class="multi-level">
    <el-card shadow="never" class="level-card">
      <template #header>
        <div class="card-header">
          <span>多级菜单演示</span>
        </div>
      </template>

      <el-alert
        title="这是一个多级菜单演示页面"
        type="info"
        :closable="false"
        class="demo-alert"
      />

      <el-table :data="menuData" style="width: 100%" border stripe>
        <el-table-column prop="name" label="菜单名称" min-width="150" />
        <el-table-column prop="path" label="路由路径" min-width="200" />
        <el-table-column prop="level" label="菜单级别" width="100">
          <template #default="scope">
            <el-tag :type="getLevelType(scope.row.level)">{{ getLevelLabel(scope.row.level) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="description" label="菜单描述" min-width="250" show-overflow-tooltip />
        <el-table-column label="操作" width="150">
          <template #default="scope">
            <el-button type="primary" size="small" link @click="navigateTo(scope.row.path)">
              查看
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="demo-tips">
        <h3>菜单结构说明：</h3>
        <ul>
          <li><strong>一级菜单：</strong>多级菜单 (multi)</li>
          <li><strong>二级菜单：</strong>二级菜单 (multi/two)</li>
          <li><strong>三级菜单：</strong>三级菜单 (multi/two/list)</li>
        </ul>
        <p>每个级别的菜单都有对应的页面，点击"查看"按钮可以导航到相应的页面。</p>
      </div>
    </el-card>
  </div>
</template>

<style lang="scss" scoped>
.multi-level {
}

.level-card {
  margin-bottom: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: 600;
  font-size: 16px;
}

.demo-alert {
  margin-bottom: 20px;
}

.demo-tips {
  margin-top: 20px;
  padding: 15px;
  background-color: var(--el-bg-color);
  border-radius: 4px;

  h3 {
    margin: 0 0 10px 0;
    font-size: 16px;
    font-weight: 600;
    color: var(--el-text-color-primary);
  }

  ul {
    margin: 0 0 10px 0;
    padding-left: 20px;
  }

  li {
    margin-bottom: 5px;
    color: var(--el-text-color-regular);
  }

  p {
    margin: 0;
    color: var(--el-text-color-regular);
    font-size: 14px;
  }
}
</style>

<script lang="ts" setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

// 菜单数据
const menuData = ref([
  {
    name: '多级菜单',
    path: '/multi',
    level: 1,
    description: '一级菜单，包含多个二级菜单'
  },
  {
    name: '二级菜单',
    path: '/multi/two',
    level: 2,
    description: '二级菜单，包含多个三级菜单'
  },
  {
    name: '三级菜单',
    path: '/multi/two/list',
    level: 3,
    description: '三级菜单，展示具体内容'
  }
])

// 获取菜单级别类型
const getLevelType = (level: number) => {
  const types = ['', 'primary', 'success', 'warning']
  return types[level] || 'info'
}

// 获取菜单级别标签
const getLevelLabel = (level: number) => {
  return `${level}级菜单`
}

// 导航到指定页面
const navigateTo = (path: string) => {
  router.push(path)
}
</script>
