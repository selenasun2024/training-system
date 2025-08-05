<template>
  <div class="common-layout">
    <el-container>
      <!-- 
        [MOCK COMPONENT INTEGRATION]
        此处集成了模拟的集团系统侧边栏，仅用于开发阶段，以提供更真实的上下文环境。
        它不属于"培训管理"模块本身的功能。
      -->
      <MockGroupSidebar />

      <el-container class="content-wrapper">
      <el-header class="top-nav">
          <div class="header-left">
        <div class="logo">演寂书院培训系统</div>
          </div>
        <el-menu
          :default-active="activeTopNav"
          mode="horizontal"
          router
          class="top-nav-menu"
        >
            <template v-for="nav in topNavMenu" :key="nav.key">
              <!-- 如果有子菜单，渲染为 el-sub-menu -->
              <el-sub-menu v-if="nav.children && nav.children.length > 0" :index="nav.path">
                <template #title>
                  <el-icon v-if="nav.icon"><component :is="nav.icon" /></el-icon>
                  <span>{{ nav.title }}</span>
                </template>
                <template v-for="child in nav.children" :key="child.key">
                  <el-menu-item :index="child.path">
                    <el-icon v-if="child.icon"><component :is="child.icon" /></el-icon>
                    <span>{{ child.title }}</span>
                  </el-menu-item>
                </template>
              </el-sub-menu>

              <!-- 如果没有子菜单，渲染为 el-menu-item -->
              <el-menu-item v-else :index="nav.path">
                <el-icon v-if="nav.icon"><component :is="nav.icon" /></el-icon>
                <span>{{ nav.title }}</span>
              </el-menu-item>
            </template>
          </el-menu>
        </el-header>
        <el-main>
          <router-view />
        </el-main>
      </el-container>
    </el-container>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { topNavMenu } from '@/menu/top-nav-menu'
import MockGroupSidebar from '@/components/mock/MockGroupSidebar.vue'

const route = useRoute()

const activeTopNav = computed(() => {
  const currentPath = route.path
  // 优先匹配最精确的子菜单路径
  for (const nav of topNavMenu) {
    if (nav.children) {
      for (const child of nav.children) {
        if (child.path === currentPath) {
          return child.path
        }
      }
    }
  }
  // 如果没有匹配到子菜单，则匹配一级菜单
  const currentModulePath = currentPath.split('/')[2]
  const activeNav = topNavMenu.find(nav => nav.key === currentModulePath)
  return activeNav ? activeNav.path : ''
})
</script>

<style scoped>
.common-layout,
.el-container {
  height: 100vh;
  margin: 0;
  padding: 0;
}

.content-wrapper {
  flex-direction: column;
}

.top-nav {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background-color: #fff;
  border-bottom: 1px solid #e6e6e6;
  padding: 0 20px;
}

.header-left {
  display: flex;
  align-items: center;
}

.logo {
  font-size: 20px;
  font-weight: bold;
}

.top-nav-menu {
  flex-grow: 1;
  border-bottom: none;
  justify-content: flex-end; /* 菜单项右对齐 */
}

.el-main {
  background-color: #eef0f3;
  padding: 20px;
}
</style> 