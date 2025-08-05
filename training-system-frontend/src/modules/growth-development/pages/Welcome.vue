<template>
  <div class="welcome-page">
    <div class="welcome-content">
      <h1>欢迎来到成长发展模块</h1>
      <p>请通过下方快捷入口或顶部导航栏的成长发展菜单进入相应功能：</p>
      <div class="menu-cards">
        <div class="menu-card" @click="navigateTo('my-growth')">
          <el-icon class="card-icon"><User /></el-icon>
          <h3>我的成长</h3>
          <p>查看和管理个人成长路径</p>
        </div>
        <div class="menu-card" @click="navigateTo('talent-map')">
          <el-icon class="card-icon"><LocationFilled /></el-icon>
          <h3>人力地图</h3>
          <p>查看组织人才分布和发展</p>
        </div>
        <div class="menu-card" @click="navigateTo('mentorship')">
          <el-icon class="card-icon"><Avatar /></el-icon>
          <h3>带教管理</h3>
          <p>管理师徒关系和带教项目</p>
        </div>
        <div class="menu-card" @click="navigateTo('growth-profile')">
          <el-icon class="card-icon"><Document /></el-icon>
          <h3>成长档案</h3>
          <p>查看详细的个人成长记录</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import { User, LocationFilled, Avatar, Document } from '@element-plus/icons-vue'

const router = useRouter()

const navigateTo = (path: string) => {
  const basePath = '/training-management/growth-development'
  switch (path) {
    case 'my-growth':
      router.push(`${basePath}/my-growth`)
      break
    case 'talent-map':
      router.push(`${basePath}/talent-map`)
      break
    case 'mentorship':
      router.push(`${basePath}/mentorship`)
      break
    case 'growth-profile':
      router.push('/training-management/growth-profile')
      break
  }
}
</script>

<style scoped>
.welcome-page {
  padding: 40px;
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 500px;
}

.welcome-content {
  text-align: center;
  max-width: 800px;
}

.welcome-content h1 {
  font-size: 32px;
  color: #333;
  margin-bottom: 16px;
}

.welcome-content p {
  font-size: 16px;
  color: #666;
  margin-bottom: 40px;
}

.menu-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
  margin-top: 20px;
}

.menu-card {
  background: #fff;
  border: 1px solid #e4e7ed;
  border-radius: 8px;
  padding: 30px 20px;
  cursor: pointer;
  transition: all 0.3s ease;
  text-align: center;
}

.menu-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
  border-color: #409eff;
}

.card-icon {
  font-size: 48px;
  color: #409eff;
  margin-bottom: 16px;
}

.menu-card h3 {
  font-size: 18px;
  color: #333;
  margin-bottom: 8px;
}

.menu-card p {
  font-size: 14px;
  color: #666;
  margin: 0;
}
</style> 