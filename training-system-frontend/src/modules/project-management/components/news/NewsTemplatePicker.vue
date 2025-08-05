<template>
  <el-dialog v-model="visible" title="选择新闻模板" width="600px">
    <el-radio-group v-model="selectedId">
      <el-radio v-for="tpl in templates" :key="tpl.id" :label="tpl.id">{{ tpl.name }}</el-radio>
    </el-radio-group>
    <template #footer>
      <el-button @click="visible=false">取 消</el-button>
      <el-button type="primary" @click="apply">应 用</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'

const props = defineProps<{ modelValue: boolean }>()
const emits = defineEmits(['update:modelValue','apply'])

const visible = ref(props.modelValue)
watch(()=>props.modelValue, v=> visible.value = v)
watch(visible, v=> emits('update:modelValue', v))

const templates = [
  { id: 'tpl1', name: '开班报道模板', html: '<h1>开班报道</h1><p>...</p>' },
  { id: 'tpl2', name: '结业典礼模板', html: '<h1>结业典礼</h1><p>...</p>' },
]

const selectedId = ref('tpl1')

function apply(){
  const tpl = templates.find(t=>t.id===selectedId.value)
  if(tpl){
    emits('apply', tpl.html)
  }
  visible.value=false
}
</script> 