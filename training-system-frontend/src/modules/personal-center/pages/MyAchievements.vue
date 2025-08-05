<template>
  <div class="my-achievements">
    <div class="page-header">
      <h2>我的成绩</h2>
      <p>查看您的培训成绩和学习进度</p>
    </div>
    
    <el-card>
      <el-empty description="成绩查询功能开发中，敬请期待..." />
    </el-card>
  </div>
</template>

<script setup lang="ts">
// 成绩页面占位符
</script>

<style scoped>
.my-achievements {
  max-width: 1200px;
  margin: 0 auto;
}

.page-header {
  margin-bottom: 24px;
  padding: 20px;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.page-header h2 {
  margin: 0 0 8px 0;
  color: #303133;
}

.page-header p {
  margin: 0;
  color: #606266;
  font-size: 14px;
}
</style> 