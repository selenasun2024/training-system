<template>
  <div class="personal-center">
    <div class="layout-container">
      <!-- 左侧菜单 -->
      <div class="sidebar">
        <div class="user-info">
          <el-avatar :size="60" :src="userAvatar" />
          <div class="user-details">
            <h3 class="username">{{ displayUserName }}</h3>
            <p class="user-role">{{ displayUserRole }}</p>
          </div>
        </div>
        <el-menu
          :default-active="activeMenu"
          router
          class="personal-menu"
        >
          <el-menu-item index="/training-management/personal-center/tasks">
            <el-icon><Document /></el-icon>
            <span>我的作业</span>
          </el-menu-item>
          <el-menu-item index="/training-management/personal-center/schedule">
            <el-icon><Clock /></el-icon>
            <span>我的课表</span>
          </el-menu-item>
          <el-menu-item index="/training-management/personal-center/achievements">
            <el-icon><Trophy /></el-icon>
            <span>我的成绩</span>
          </el-menu-item>
        </el-menu>
      </div>

      <!-- 主内容区 -->
      <div class="main-content">
        <router-view />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, provide } from 'vue'
import { useRoute } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { Document, Clock, Trophy } from '@element-plus/icons-vue'

const route = useRoute()
const userStore = useUserStore()

// 开发环境用户配置 - 设置为学员吴静，用于测试学习中心功能
const DEV_USER_CONFIG = {
  currentTestUser: 'wujing', // 当前测试用户：吴静（学员）
  users: {
    wujing: {
      id: 'user-market-001',  // 吴静的正确用户ID
      username: 'wu-jing',    // 吴静的正确用户名
      name: '吴静',
      role: 'student',         // 学员角色
      department: '市场部',
      position: '市场专员'
    },
    fengqin: {
      id: 'user-hr-001',       // 冯芹的用户ID（如需切换到辅导员视角）
      username: 'feng-qin',
      name: '冯芹',
      role: 'counselor',       // 辅导员角色
      department: '人力资源部',
      position: '培训师'
    }
  }
}

// 用户头像
const userAvatar = ref('https://cube.elemecdn.com/0/88/03b0d39583f48206768a7534e55bcpng.png')

// 显示的用户名称（学习中心优先使用DEV_USER_CONFIG配置）
const displayUserName = computed(() => {
  // 学习中心开发阶段：优先使用配置的测试用户，确保显示正确
  const testUser = DEV_USER_CONFIG.users[DEV_USER_CONFIG.currentTestUser]
  if (testUser) {
    return testUser.name
  }
  
  // 生产环境fallback：从用户store获取
  if (userStore.isLoggedIn && userStore.userName) {
    return userStore.userName
  }
  
  return '未知用户'
})

// 显示的用户角色（学习中心优先使用DEV_USER_CONFIG配置）
const displayUserRole = computed(() => {
  // 学习中心开发阶段：优先使用配置的测试用户
  const testUser = DEV_USER_CONFIG.users[DEV_USER_CONFIG.currentTestUser]
  if (testUser) {
    const roleMap = {
      student: '学员',
      counselor: '辅导员',
      teacher: '教师',
      admin: '管理员'
    }
    return roleMap[testUser.role] || testUser.role
  }
  
  // 生产环境fallback：从用户store获取，并转换为中文
  if (userStore.isLoggedIn && userStore.userRole) {
    const roleMap = {
      student: '学员',
      counselor: '辅导员',
      teacher: '教师',
      admin: '管理员'
    }
    return roleMap[userStore.userRole] || userStore.userRole
  }
  
  return '学员'
})

// 当前激活的菜单项
const activeMenu = computed(() => route.path)

// 导出当前用户ID供子组件使用
const getCurrentUserId = () => {
  // 学习中心开发阶段：优先使用配置的测试用户ID
  const testUser = DEV_USER_CONFIG.users[DEV_USER_CONFIG.currentTestUser]
  if (testUser) {
    return testUser.id
  }
  
  // 生产环境fallback：从用户store获取
  if (userStore.isLoggedIn && userStore.userId) {
    return userStore.userId
  }
  
  return 'user-market-001' // 默认使用吴静的ID
}

// 将getCurrentUserId方法提供给所有子组件
provide('getCurrentUserId', getCurrentUserId)
</script>

<style scoped>
.personal-center {
  height: 100vh;
  background-color: #f5f7fa;
}

.layout-container {
  display: flex;
  height: 100%;
}

.sidebar {
  width: 260px;
  background: #fff;
  border-right: 1px solid #e4e7ed;
  padding: 20px 0;
}

.user-info {
  padding: 0 20px 20px 20px;
  text-align: center;
  border-bottom: 1px solid #e4e7ed;
  margin-bottom: 20px;
}

.user-details {
  margin-top: 12px;
}

.username {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}

.user-role {
  margin: 4px 0 0 0;
  font-size: 14px;
  color: #909399;
}

.personal-menu {
  border: none;
  padding: 0 10px;
}

.personal-menu .el-menu-item {
  border-radius: 6px;
  margin-bottom: 4px;
}

.main-content {
  flex: 1;
  padding: 20px;
  overflow-y: auto;
}
</style> 