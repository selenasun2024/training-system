<template>
  <div class="project-assignment-dialog">
    <el-form :model="form" label-width="100px">
      <el-form-item label="选择学员">
        <el-select v-model="form.studentId" placeholder="请选择学员" style="width: 100%">
          <el-option
            v-for="student in availableStudents"
            :key="student.id"
            :label="student.name"
            :value="student.id"
          />
        </el-select>
      </el-form-item>
      
      <el-form-item label="选择导师">
        <el-select v-model="form.mentorId" placeholder="请选择导师" style="width: 100%">
          <el-option
            v-for="mentor in availableMentors"
            :key="mentor.id"
            :label="mentor.name"
            :value="mentor.id"
          />
        </el-select>
      </el-form-item>
      
      <el-form-item label="备注">
        <el-input v-model="form.remarks" type="textarea" :rows="3" />
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
  availableStudents: any[]
  availableMentors: any[]
}

const props = defineProps<Props>()

const emit = defineEmits<{
  submit: [data: any]
  cancel: []
}>()

const form = ref({
  studentId: '',
  mentorId: '',
  remarks: ''
})

const handleSubmit = () => {
  emit('submit', {
    projectId: props.projectId,
    ...form.value
  })
}
</script>

<style scoped>
.project-assignment-dialog {
  padding: 20px;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 20px;
}
</style> 