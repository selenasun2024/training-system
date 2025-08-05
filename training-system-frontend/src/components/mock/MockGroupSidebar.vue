<template>
  <!-- 
    [MOCK COMPONENT]
    这个组件是一个模拟的集团系统侧边栏，仅用于开发阶段，以提供更真实的上下文环境。
    它不属于"培训管理"模块本身的功能。
    v2: 根据用户反馈调整了颜色方案和菜单项。
    v3: 添加展开/收缩功能
  -->
  <div class="sidebar-wrapper">
    <!-- 展开按钮在外部，始终可见 -->
    <div v-if="collapsed" class="expand-trigger" @click="toggleCollapse">
      <el-icon><ArrowRight /></el-icon>
    </div>
    
    <el-aside :width="collapsed ? '0px' : '220px'" class="mock-sidebar" :class="{ 'collapsed': collapsed }">
    
    <div v-show="!collapsed" class="sidebar-content">
      <!-- 收缩按钮，位置与展开按钮一致 -->
      <div class="collapse-trigger" @click="toggleCollapse">
        <el-icon><ArrowLeft /></el-icon>
      </div>
      
      <div class="mock-header">
        <img src="@/assets/images/qr-code-mock.png" alt="Logo" class="mock-logo" />
        <span class="mock-title">集团一体化平台</span>
      </div>
    <el-menu
      default-active="training-management"
      class="el-menu-vertical-demo"
      active-text-color="#ffd04b"
      background-color="#02112a"
      text-color="#fff"
      router
    >
      <el-sub-menu index="training-growth">
        <template #title>
          <el-icon><School /></el-icon>
          <span>培训成长</span>
        </template>
        <el-menu-item index="/training-management/dashboard">
          <el-icon><Reading /></el-icon>
          <span>培训管理</span>
        </el-menu-item>
        <el-menu-item index="/training-management/growth-development">
          <el-icon><User /></el-icon>
          <span>成长发展</span>
        </el-menu-item>
        <el-menu-item index="knowledge-sharing">
          <el-icon><Share /></el-icon>
          <span>知识分享</span>
        </el-menu-item>
        <el-menu-item index="career-training">
          <el-icon><Suitcase /></el-icon>
          <span>职业培训</span>
        </el-menu-item>
      </el-sub-menu>
    </el-menu>
      <div class="mock-footer">
        <el-icon><SwitchButton /></el-icon>
        <span>退出登录</span>
      </div>
    </div>
    </el-aside>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
// 导入Element Plus图标
import {
  School,
  Reading,
  User,
  Share,
  Suitcase,
  SwitchButton,
  ArrowLeft,
  ArrowRight,
} from '@element-plus/icons-vue';

// 侧边栏收缩状态
const collapsed = ref(true) // 默认收缩状态

// 切换展开/收缩状态
function toggleCollapse() {
  collapsed.value = !collapsed.value
}
</script>

<style scoped>
.sidebar-wrapper {
  position: relative;
  height: 100vh;
}

.mock-sidebar {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background-color: #02112a; /* 更深邃的背景色 */
  color: #a7b1be; /* 调整基础文字颜色 */
  border-right: 1px solid #1d2b3c;
  transition: width 0.3s ease;
  position: relative;
}

.mock-sidebar.collapsed {
  width: 0 !important;
  min-width: 0;
  overflow: hidden;
}

.sidebar-content {
  display: flex;
  flex-direction: column;
  height: 100%;
  position: relative;
}

.expand-trigger {
  position: fixed;
  left: 0;
  top: 50%;
  transform: translateY(-50%);
  width: 24px;
  height: 48px;
  background-color: #02112a;
  border: 1px solid #1d2b3c;
  border-left: none;
  border-radius: 0 12px 12px 0;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: #a7b1be;
  transition: all 0.3s ease;
  z-index: 1000;
  box-shadow: 2px 0 8px rgba(0, 0, 0, 0.3);
}

.expand-trigger:hover {
  background-color: #011835;
  color: #fff;
}

.collapse-trigger {
  position: fixed;
  left: 196px; /* 220px - 24px = 196px */
  top: 50%;
  transform: translateY(-50%);
  width: 24px;
  height: 48px;
  background-color: #02112a;
  border: 1px solid #1d2b3c;
  border-left: none;
  border-radius: 0 12px 12px 0;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: #a7b1be;
  transition: all 0.3s ease;
  z-index: 1001;
  box-shadow: 2px 0 8px rgba(0, 0, 0, 0.3);
}

.collapse-trigger:hover {
  background-color: #011835;
  color: #fff;
}
.mock-header {
  display: flex;
  align-items: center;
  padding: 15px 20px;
  box-sizing: border-box;
}
.mock-logo {
  width: 32px;
  height: 32px;
  margin-right: 10px;
}
.mock-title {
  font-size: 18px;
  font-weight: bold;
  color: #fff;
}
.el-menu {
  flex-grow: 1;
  border-right: none;
}

/* Element Plus 菜单样式覆盖 */
.el-menu--vertical:not(.el-menu--collapse) {
  width: 220px;
}

:deep(.el-sub-menu__title) {
  color: #a7b1be !important;
}
:deep(.el-sub-menu__title:hover) {
  background-color: #011835 !important;
}
:deep(.el-menu-item) {
  color: #a7b1be !important;
}
:deep(.el-menu-item:hover) {
  background-color: #011835 !important;
}
:deep(.el-menu-item.is-active) {
  background-color: #409eff !important;
  color: #fff !important;
}
:deep(.el-menu-item.is-active .el-icon) {
  color: #fff !important;
}
:deep(.el-icon) {
  color: #a7b1be;
}

.mock-footer {
  padding: 20px;
  text-align: center;
  cursor: pointer;
  color: #a7b1be;
}
.mock-footer:hover {
  color: #fff;
}
.mock-footer .el-icon {
  vertical-align: middle;
  margin-right: 8px;
}
</style> 