<template>
  <el-tree :data="treeData" node-key="key" :default-expand-all="true" :highlight-current="true" :current-node-key="modelValue" @node-click="handleClick" />
</template>

<script setup lang="ts">
const props = defineProps<{ modelValue: string }>()
const emits = defineEmits(['update:modelValue'])

function handleClick(node:any){ emits('update:modelValue', node.key) }

const treeData=[
  { label:'培训前', key:'pre', children:[
    { label:'开班通知', key:'pre.opening'},
    { label:'参训确认', key:'pre.confirm'},
    { label:'分组通知', key:'pre.group'}
  ]},
  { label:'培训中', key:'mid', children:[
    { label:'任务下发', key:'mid.task'},
    { label:'进度提醒', key:'mid.progress'},
    { label:'成绩发布', key:'mid.score'}
  ]},
  { label:'培训后', key:'post', children:[
    { label:'问卷调研', key:'post.survey'},
    { label:'结业通知', key:'post.finish'}
  ]},
]
</script>

<style scoped>
</style> 