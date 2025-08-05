<template>
  <div class="template-details">
    <h3>模板详情</h3>
    <p>模板详情组件开发中...</p>
  </div>
</template>

<script setup lang="ts">
interface Props {
  template: any;
  userRole: string;
}

defineProps<Props>();
defineEmits<{
  'edit-template': [id: string];
  'close': [];
}>();
</script>

<style scoped>
.template-details {
  padding: 20px;
}
</style> 