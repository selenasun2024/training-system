<template>
  <el-input type="textarea" :rows="10" v-model="localValue" placeholder="请输入消息内容，支持 {{变量}}" />
</template>
<script setup lang="ts">
import { computed } from 'vue'
const props = defineProps<{ modelValue: string }>()
const emits = defineEmits(['update:modelValue'])
const localValue = computed({ get:()=>props.modelValue, set:v=>emits('update:modelValue',v) })
</script> 