<template>
  <div class="task-item">
    <span>{{ task.name }}</span>
    <el-tag size="small" style="margin-left:8px;">{{ getTypeLabel(task.type) }}</el-tag>
    <el-tag size="small" type="info" style="margin-left:8px;">{{ task.status }}</el-tag>
  </div>
</template>

<script setup lang="ts">
import { defineProps } from 'vue';
const props = defineProps<{ task: any, getTypeLabel: (type: string) => string }>();
</script>

<style scoped>
.task-item {
  display: flex;
  align-items: center;
  padding: 6px 0;
}
</style> 