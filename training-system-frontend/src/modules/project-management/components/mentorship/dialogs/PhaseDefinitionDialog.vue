<template>
  <div class="phase-definition-dialog">
    <el-form :model="form" label-width="120px">
      <el-form-item label="阶段名称">
        <el-input v-model="form.name" placeholder="请输入阶段名称" />
      </el-form-item>
      
      <el-form-item label="培养目标">
        <el-input v-model="form.objectives" type="textarea" rows="3" placeholder="请描述该阶段的培养目标" />
      </el-form-item>
      
      <el-form-item label="阶段时长">
        <el-input-number v-model="form.duration" :min="1" :max="52" />
        <span style="margin-left: 8px;">周</span>
      </el-form-item>
      
      <el-form-item label="开始时间">
        <el-date-picker v-model="form.startDate" type="date" placeholder="选择开始时间" />
      </el-form-item>
    </el-form>
    
    <div class="dialog-footer">
      <el-button @click="$emit('cancel')">取消</el-button>
      <el-button type="primary" @click="handleSubmit">确定</el-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

interface Props {
  projectId: string
  existingPhases: any[]
}

const props = defineProps<Props>()

const emit = defineEmits<{
  submit: [data: any]
  cancel: []
}>()

const form = ref({
  name: '',
  objectives: '',
  duration: 12,
  startDate: new Date()
})

const handleSubmit = () => {
  emit('submit', {
    projectId: props.projectId,
    ...form.value
  })
}
</script>

<style scoped>
.phase-definition-dialog {
  padding: 20px;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 20px;
}
</style> 