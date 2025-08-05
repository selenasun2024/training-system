<template>
  <div class="survey-management">
    <div class="page-header">
      <h3>调查管理</h3>
      <p class="subtitle">管理和监控正在进行的调查活动</p>
    </div>
    
    <div class="coming-soon">
      <el-empty description="调查管理功能开发中...">
        <el-button type="primary" @click="$router.push('/assessment-center/survey/questionnaire-template')">
          去管理问卷模板
        </el-button>
      </el-empty>
    </div>
  </div>
</template>

<script setup lang="ts">
// 调查管理功能开发中
</script>

<style scoped>
.survey-management {
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