<template>
  <div class="workbench-page">
    <el-page-header content="工作台">
      <template #breadcrumb>
        <el-breadcrumb separator="/">
          <el-breadcrumb-item :to="{ path: '/training-management/dashboard' }">培训首页</el-breadcrumb-item>
          <el-breadcrumb-item>工作台</el-breadcrumb-item>
        </el-breadcrumb>
      </template>
    </el-page-header>

    <el-empty description="工作台功能待建设" style="margin-top: 120px;" />
  </div>
</template>

<script setup lang="ts">
// 暂无特定逻辑
</script>

<style scoped>
.workbench-page {
  padding: 24px;
}
</style> 