<template>
  <el-input
    type="textarea"
    :rows="10"
    v-model="localValue"
    placeholder="请输入总结内容..."
  />
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{ modelValue: string }>()
const emits = defineEmits(['update:modelValue'])

const localValue = computed({
  get: () => props.modelValue,
  set: val => emits('update:modelValue', val),
})
</script> 