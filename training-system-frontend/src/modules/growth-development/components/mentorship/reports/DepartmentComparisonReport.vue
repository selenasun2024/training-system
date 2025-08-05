<template>
  <div class="department-comparison-report">
    <h3>部门效果对比报告</h3>
    <p>部门效果对比报告组件开发中...</p>
  </div>
</template>

<script setup lang="ts">
interface Props {
  timeRange: string;
  userRole: string;
}

defineProps<Props>();
</script>

<style scoped>
.department-comparison-report {
  padding: 20px;
}
</style> 