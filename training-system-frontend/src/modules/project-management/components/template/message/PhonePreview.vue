<template>
  <div class="phone">
    <div class="screen">
      <div class="msg-title">{{ title }}</div>
      <div class="msg-content" v-html="content"></div>
    </div>
  </div>
</template>
<script setup lang="ts">
const props = defineProps<{ styleType:string; title:string; content:string }>()
</script>
<style scoped>
.phone{ width:230px; border:1px solid #909399; border-radius:16px; padding:8px; }
.screen{ background:#f5f7fa; height:400px; overflow:auto; padding:8px; border-radius:12px; }
.msg-title{ font-weight:600; margin-bottom:4px; }
.msg-content{ font-size:14px; white-space:pre-wrap; }
</style> 