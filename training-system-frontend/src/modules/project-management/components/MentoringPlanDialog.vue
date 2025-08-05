<template>
  <el-dialog :model-value="visible" @update:model-value="$emit('update:visible', $event)" title="带教计划" width="700px">
    <div v-if="mentoringPair">
      <h4>{{ mentoringPair.mentor?.name }} → {{ mentoringPair.mentee?.name }}</h4>
      <el-form label-width="100px">
        <el-form-item label="计划名称">
          <el-input v-model="planTitle" placeholder="请输入计划名称" />
        </el-form-item>
        <el-form-item label="目标描述">
          <el-input v-model="planGoals" type="textarea" :rows="3" placeholder="请输入计划目标" />
        </el-form-item>
        <el-form-item label="时间安排">
          <el-date-picker v-model="planDates" type="daterange" />
        </el-form-item>
      </el-form>
    </div>
    
    <template #footer>
      <el-button @click="$emit('update:visible', false)">取消</el-button>
      <el-button type="primary" @click="handleSave">保存</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const props = defineProps<{
  visible: boolean
  mentoringPair: any
}>()

const emit = defineEmits<{
  (e: 'update:visible', value: boolean): void
  (e: 'save', data: any): void
}>()

const planTitle = ref('')
const planGoals = ref('')
const planDates = ref([])

const handleSave = () => {
  emit('save', {
    title: planTitle.value,
    goals: planGoals.value,
    dates: planDates.value
  })
  emit('update:visible', false)
}
</script> 