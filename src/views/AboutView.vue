<template>
  <div class="about">
    <el-card shadow="never" class="about-card">
      <template #header>
        <div class="card-header">
          <span>关于 Vue Admin</span>
          <el-tag type="success">v1.0.0</el-tag>
        </div>
      </template>

      <div class="about-content">
        <!-- 项目介绍 -->
        <el-divider content-position="left">项目介绍</el-divider>
        <div class="intro-section">
          <el-empty description="Vue Admin 管理系统" :image-size="120" />
          <p>
            Vue Admin 是一个基于 Vue 3 和 Element Plus 的现代化管理系统，
            提供了用户管理、CRUD 操作、系统配置等功能，帮助您高效管理业务数据。
          </p>
        </div>

        <!-- 功能特色 -->
        <el-divider content-position="left">功能特色</el-divider>
        <el-row :gutter="16" class="features-row">
          <el-col :xs="12" :sm="6">
            <el-card shadow="hover" class="feature-card">
              <div class="feature-icon">
                <el-icon><User /></el-icon>
              </div>
              <div class="feature-title">用户管理</div>
              <div class="feature-desc">
                提供完整的用户管理功能，包括用户列表、新增用户、编辑用户和删除用户
              </div>
            </el-card>
          </el-col>

          <el-col :xs="12" :sm="6">
            <el-card shadow="hover" class="feature-card">
              <div class="feature-icon">
                <el-icon><Document /></el-icon>
              </div>
              <div class="feature-title">CRUD 操作</div>
              <div class="feature-desc">
                提供通用的 CRUD 操作组件，支持快速开发数据管理页面
              </div>
            </el-card>
          </el-col>

          <el-col :xs="12" :sm="6">
            <el-card shadow="hover" class="feature-card">
              <div class="feature-icon">
                <el-icon><Setting /></el-icon>
              </div>
              <div class="feature-title">系统配置</div>
              <div class="feature-desc">
                提供系统配置功能，包括管理员管理和系统设置
              </div>
            </el-card>
          </el-col>

          <el-col :xs="12" :sm="6">
            <el-card shadow="hover" class="feature-card">
              <div class="feature-icon">
                <el-icon><DataBoard /></el-icon>
              </div>
              <div class="feature-title">数据统计</div>
              <div class="feature-desc">
                提供数据统计功能，包括用户增长趋势和用户角色分布
              </div>
            </el-card>
          </el-col>
        </el-row>

        <!-- 技术栈 -->
        <el-divider content-position="left">技术栈</el-divider>
        <div class="tech-stack">
          <el-tag type="primary">Vue 3</el-tag>
          <el-tag type="success">Element Plus</el-tag>
          <el-tag type="warning">TypeScript</el-tag>
          <el-tag type="danger">Vite</el-tag>
          <el-tag type="info">Pinia</el-tag>
          <el-tag type="primary">Vue Router</el-tag>
          <el-tag type="success">Axios</el-tag>
          <el-tag type="warning">SCSS</el-tag>
        </div>

        <!-- 版本信息 -->
        <el-divider content-position="left">版本信息</el-divider>
        <el-descriptions :column="1" border>
          <el-descriptions-item label="版本号">v1.0.0</el-descriptions-item>
          <el-descriptions-item label="发布日期">2023-10-01</el-descriptions-item>
          <el-descriptions-item label="更新日志">
            <el-timeline>
              <el-timeline-item timestamp="2023-10-01" type="primary" color="blue">
                <h4>v1.0.0</h4>
                <p>
                  - 初始版本发布<br />
                  - 新增用户管理功能<br />
                  - 新增 CRUD 操作组件<br />
                  - 新增系统配置功能<br />
                  - 新增数据统计功能
                </p>
              </el-timeline-item>
            </el-timeline>
          </el-descriptions-item>
        </el-descriptions>
      </div>
    </el-card>
  </div>
</template>

<script lang="ts" setup>
import { User, Document, Setting, DataBoard } from '@element-plus/icons-vue'
</script>

<style lang="scss" scoped>
.about-card {
  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-weight: 600;
    font-size: 16px;
  }

  .about-content {
    .intro-section {
      display: flex;
      flex-direction: column;
      align-items: center;
      margin-bottom: 30px;

      p {
        margin-top: 20px;
        text-align: center;
        color: #606266;
        font-size: 14px;
        line-height: 1.5;
      }
    }

    .features-row {
      margin-bottom: 30px;

      .feature-card {
        height: 100%;
        text-align: center;

        .feature-icon {
          font-size: 48px;
          color: #409eff;
          margin-bottom: 10px;
        }

        .feature-title {
          font-size: 16px;
          font-weight: 600;
          color: #303133;
          margin-bottom: 10px;
        }

        .feature-desc {
          font-size: 12px;
          color: #606266;
          line-height: 1.5;
        }
      }
    }

    .tech-stack {
      margin-bottom: 30px;

      .el-tag {
        margin-right: 10px;
        margin-bottom: 10px;
      }
    }
  }
}

// 响应式设计
@media (max-width: 768px) {
  .features-row .feature-card {
    margin-bottom: 15px;
  }

  .tech-stack .el-tag {
    margin-right: 5px;
    margin-bottom: 5px;
    font-size: 12px;
  }
}
</style>
