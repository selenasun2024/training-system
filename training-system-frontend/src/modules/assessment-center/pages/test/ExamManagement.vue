<template>
  <div class="exam-management">
    <div class="page-header">
      <h3>考试管理</h3>
      <p class="subtitle">组织和管理考试活动</p>
    </div>
    
    <div class="coming-soon">
      <el-empty description="考试管理功能开发中..." />
    </div>
  </div>
</template>

<script setup lang="ts">
// 考试管理功能开发中
</script>

<style scoped>
.exam-management {
  padding: 20px;
}

.page-header {
  margin-bottom: 40px;
}

.page-header h3 {
  margin: 0 0 8px 0;
  color: #303133;
  font-size: 20px;
}

.subtitle {
  font-size: 14px;
  color: #909399;
  margin: 0;
}

.coming-soon {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 400px;
}
</style> 