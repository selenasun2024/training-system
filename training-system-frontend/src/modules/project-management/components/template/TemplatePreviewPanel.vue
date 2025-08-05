<template>
  <div class="preview-panel" v-if="template">
    <h3>{{ template.name }}</h3>
    <div class="content" v-html="template.content"></div>
  </div>
  <el-empty v-else description="请选择模板" />
</template>

<script setup lang="ts">
const props = defineProps<{ template: any | null }>()
</script>

<style scoped>
.preview-panel {
  padding: 12px;
}
.content { border:1px solid #ebeef5; min-height:200px; padding:8px; }
</style> 