<template>
  <el-tag :type="type" size="small">{{ label }}</el-tag>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{ status: 'draft'|'pending'|'approved'|'published' }>()

const map = {
  draft: { label: '草稿', type: 'info' },
  pending: { label: '待审批', type: 'warning' },
  approved: { label: '已审批', type: 'success' },
  published: { label: '已发布', type: '' },
}

const label = computed(()=> map[props.status].label)
const type = computed(()=> map[props.status].type)
</script> 