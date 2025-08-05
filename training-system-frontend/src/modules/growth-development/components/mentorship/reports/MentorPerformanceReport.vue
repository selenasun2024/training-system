<template>
  <div class="mentor-performance-report">
    <h3>导师绩效报告</h3>
    <p>导师绩效报告组件开发中...</p>
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
.mentor-performance-report {
  padding: 20px;
}
</style> 