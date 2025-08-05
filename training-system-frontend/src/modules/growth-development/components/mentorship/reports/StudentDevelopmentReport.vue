<template>
  <div class="student-development-report">
    <h3>学员发展报告</h3>
    <p>学员发展报告组件开发中...</p>
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
.student-development-report {
  padding: 20px;
}
</style> 