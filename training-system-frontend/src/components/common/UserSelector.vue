<template>
  <el-select
    v-model="innerValue"
    :multiple="multiple"
    filterable
    clearable
    placeholder="请选择"
    size="small"
    style="width:180px"
  >
    <el-option
      v-for="u in options"
      :key="u.id"
      :label="u.name"
      :value="u.id"
    />
  </el-select>
</template>

<script setup lang="ts">
import { computed, watch, ref } from 'vue'

interface UserOption { id:string; name:string }
interface Props {
  modelValue?: string[] | string
  multiple?: boolean
  options?: UserOption[]
}
const props = withDefaults(defineProps<Props>(), {
  multiple: true,
  options: () => [
    { id: 'U1', name: '张三' },
    { id: 'U2', name: '李四' },
    { id: 'U3', name: '王五' },
  ],
})

const emit = defineEmits(['update:modelValue'])
const innerValue = ref(props.modelValue)

watch(innerValue, (val)=> emit('update:modelValue', val))
watch(()=>props.modelValue,(v)=>{ innerValue.value = v })
</script> 