<template>
  <div class="growth-development-layout">
    <!-- 内容区域 -->
    <div class="content-area">
      <router-view />
    </div>
  </div>
</template>

<script setup lang="ts">
// 现在布局组件只负责展示内容，菜单已移至顶部导航栏
</script>

<style scoped>
.growth-development-layout {
  height: 100%;
}

.content-area {
  height: 100%;
  overflow: auto;
}
</style> 