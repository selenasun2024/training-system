<template>
  <el-dialog v-model="visible" title="变量插入" width="400px">
    <el-space direction="vertical" style="width:100%">
      <el-button type="text" v-for="v in vars" :key="v" @click="insert(v)" style="justify-content:flex-start">{{ v }}</el-button>
    </el-space>
  </el-dialog>
</template>
<script setup lang="ts">
import { ref, watch } from 'vue'
const props = defineProps<{ modelValue: boolean }>()
const emits = defineEmits(['update:modelValue','insert'])
const visible = ref(props.modelValue)
watch(()=>props.modelValue,v=>visible.value=v)
watch(visible,v=>emits('update:modelValue',v))
const vars=['项目名称','学员姓名','截止时间']
function insert(v:string){ emits('insert',v); visible.value=false }
</script> 