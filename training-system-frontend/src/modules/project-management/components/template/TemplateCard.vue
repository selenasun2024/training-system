<template>
  <el-card class="template-card" :body-style="{ padding: '10px' }" shadow="hover" @click="emitSelect">
    <div class="thumb"> <el-icon><document /></el-icon> </div>
    <div class="info">
      <div class="name">{{ template.name }}</div>
      <div class="meta">{{ template.typeLabel }} · v{{ template.version }}</div>
      <div class="meta">使用 {{ template.usageCount }}</div>
    </div>
  </el-card>
</template>

<script setup lang="ts">
import { Document } from '@element-plus/icons-vue'
const props = defineProps<{ template: any }>()
const emits = defineEmits(['select','navigate'])
function emitSelect() { emits('select', props.template); emits('navigate', props.template) }
</script>

<style scoped>
.template-card { cursor: pointer; width: 160px; display: flex; flex-direction: column; }
.thumb { font-size: 32px; text-align:center; color:#409eff; }
.info { margin-top: 6px; }
.name { font-weight: 600; }
.meta { font-size: 12px; color:#909399; }
</style> 