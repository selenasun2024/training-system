<template>
  <el-select v-model="innerValue" :multiple="multiple" placeholder="小组" size="small" style="width:140px">
    <el-option v-for="g in finalOptions" :key="g.id" :label="g.name" :value="g.id" />
  </el-select>
</template>
<script setup lang="ts">
import { ref, watch, computed } from 'vue'
interface Option { id:string; name:string }
interface Props { modelValue?: string[] | string; multiple?:boolean; options?:Option[] }
const props = withDefaults(defineProps<Props>(), {
  multiple:true,
})

const finalOptions = computed(() => {
  if (props.options && props.options.length > 0) {
    return props.options;
  }
  // 如果外部没有提供 options，则使用带提示的模拟数据
  return [
    { id: 'mock1', name: 'A组 (模拟)' },
    { id: 'mock2', name: 'B组 (模拟)' },
  ];
});

const emit = defineEmits(['update:modelValue'])
const innerValue = ref(props.modelValue)
watch(innerValue,(v)=>emit('update:modelValue',v))
watch(()=>props.modelValue,(v)=>innerValue.value=v)
</script> 