<template>
  <div class="multi-level">
    <el-card shadow="never" class="level-card">
      <template #header>
        <div class="card-header">
          <span>三级菜单页面</span>
        </div>
      </template>

      <el-alert
        title="这是一个三级菜单页面"
        type="warning"
        :closable="false"
        class="demo-alert"
      />

      <el-empty description="三级菜单页面内容" />

      <div class="demo-tips">
        <h3>导航说明：</h3>
        <ul>
          <li><strong>返回上级：</strong>点击左侧菜单的"二级菜单"返回二级菜单</li>
          <li><strong>返回首页：</strong>点击左侧菜单的"首页"返回首页</li>
        </ul>
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
</script>
