<template>
  <div class="question-bank">
    <div class="page-header">
      <h3>题库管理</h3>
      <p class="subtitle">管理考试题目，支持多种题型</p>
    </div>
    
    <div class="coming-soon">
      <el-empty description="题库管理功能开发中...">
        <el-button type="primary" @click="$router.push('/assessment-center/survey/questionnaire-template')">
          去管理问卷模板
        </el-button>
      </el-empty>
    </div>
  </div>
</template>

<script setup lang="ts">
// 题库管理功能开发中
</script>

<style scoped>
.question-bank {
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