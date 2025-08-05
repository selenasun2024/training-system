<template>
  <div class="template-form">
    <h3>模板表单</h3>
    <p>模板表单组件开发中...</p>
  </div>
</template>

<script setup lang="ts">
interface Props {
  template?: any;
  mode: 'create' | 'edit';
}

defineProps<Props>();
defineEmits<{
  'success': [];
  'cancel': [];
}>();
</script>

<style scoped>
.template-form {
  padding: 20px;
}
</style> 