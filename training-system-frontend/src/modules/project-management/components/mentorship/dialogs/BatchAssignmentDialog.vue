<template>
  <div class="batch-assignment-dialog">
    <div class="dialog-header">
      <h3>批量指派导师</h3>
      <p>为以下{{ phases.length }}个阶段批量指派导师</p>
    </div>
    
    <div class="phases-list">
      <div v-for="phase in phases" :key="phase.id" class="phase-item">
        <div class="phase-info">
          <h4>{{ phase.name }}</h4>
          <p>{{ phase.objectives }}</p>
        </div>
        <div class="assignment-form">
          <el-select 
            v-model="assignments[phase.id]" 
            placeholder="选择导师"
            style="width: 200px"
          >
            <el-option
              v-for="mentor in mentors"
              :key="mentor.id"
              :label="mentor.name"
              :value="mentor.id"
            />
          </el-select>
        </div>
      </div>
    </div>
    
    <div class="dialog-footer">
      <el-button @click="$emit('cancel')">取消</el-button>
      <el-button type="primary" @click="handleSubmit">批量指派</el-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

interface Props {
  phases: any[]
  students: any[]
  mentors: any[]
}

const props = defineProps<Props>()

const emit = defineEmits<{
  submit: [data: any]
  cancel: []
}>()

const assignments = ref<Record<string, string>>({})

const handleSubmit = () => {
  emit('submit', {
    assignments: assignments.value
  })
}
</script>

<style scoped>
.batch-assignment-dialog {
  padding: 20px;
}

.dialog-header {
  margin-bottom: 20px;
}

.dialog-header h3 {
  margin: 0 0 8px 0;
  color: #303133;
}

.dialog-header p {
  margin: 0;
  color: #606266;
}

.phases-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin-bottom: 20px;
}

.phase-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px;
  background: #f8f9fa;
  border-radius: 8px;
  border: 1px solid #e4e7ed;
}

.phase-info {
  flex: 1;
}

.phase-info h4 {
  margin: 0 0 4px 0;
  color: #303133;
  font-size: 16px;
}

.phase-info p {
  margin: 0;
  color: #606266;
  font-size: 14px;
}

.assignment-form {
  margin-left: 20px;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}
</style> 