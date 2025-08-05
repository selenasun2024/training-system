<template>
  <div>
    <el-input v-model="keyword" placeholder="搜索课程" class="mb-2" />
    <el-table :data="filteredCourses" height="300" @selection-change="handleSelect" style="width:100%" :row-key="row=>row.id" >
      <el-table-column type="selection" width="40" />
      <el-table-column prop="name" label="课程名" />
      <el-table-column prop="duration" label="时长" width="100" />
    </el-table>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watchEffect } from 'vue'

interface Course { id: string; name: string; duration: string }

const props = defineProps<{ modelValue: Course[] }>()
const emits = defineEmits(['update:modelValue'])

const keyword = ref('')
const courses = ref<Course[]>([
  { id: 'c1', name: '高效沟通技巧', duration: '15:30' },
  { id: 'c2', name: '领导力提升', duration: '25:00' },
])

const filteredCourses = computed(() => {
  if (!keyword.value) return courses.value
  return courses.value.filter(c => c.name.includes(keyword.value))
})

function handleSelect(selection: Course[]) {
  emits('update:modelValue', selection)
}
</script> 