<template>
  <div class="stats-card">
    <span>阅读 {{ read }}</span>
    <span class="ml">分享 {{ share }}</span>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{ read: number; share: number }>()
</script>

<style scoped>
.stats-card {
  font-size: 12px;
  color: #606266;
  border: 1px solid #ebeef5;
  border-radius: 4px;
  padding: 4px 8px;
}
.ml { margin-left: 8px; }
</style> 