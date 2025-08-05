<template>
  <div class="students-details-list">
    <div class="assignment-info">
      <h4>导师：{{ getMentorName() }}</h4>
      <p>负责学员数量：{{ assignment?.studentIds?.length || 0 }}名</p>
    </div>
    
    <div class="students-list">
      <div 
        v-for="studentId in assignment?.studentIds" 
        :key="studentId"
        class="student-item"
      >
        <el-avatar :size="40">{{ getStudentInfo(studentId)?.name?.charAt(0) }}</el-avatar>
        <div class="student-info">
          <div class="name">{{ getStudentInfo(studentId)?.name }}</div>
          <div class="department">{{ getStudentInfo(studentId)?.department }}</div>
        </div>
        <div class="student-status">
          <el-tag type="success" size="small">进行中</el-tag>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  assignment: any
  students: any[]
}

const props = defineProps<Props>()

const getStudentInfo = (studentId: string) => {
  return props.students.find(s => s.id === studentId) || {
    id: studentId,
    name: '学员',
    department: '未知部门'
  }
}

const getMentorName = () => {
  return '李老师' // 占位
}
</script>

<style scoped>
.students-details-list {
  padding: 20px;
}

.assignment-info {
  margin-bottom: 20px;
}

.assignment-info h4 {
  margin: 0 0 8px 0;
  color: #303133;
}

.assignment-info p {
  margin: 0;
  color: #606266;
}

.students-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.student-item {
  display: flex;
  align-items: center;
  padding: 16px;
  background: #f8f9fa;
  border-radius: 8px;
  border: 1px solid #e4e7ed;
}

.student-info {
  flex: 1;
  margin-left: 12px;
}

.student-info .name {
  font-weight: 500;
  color: #303133;
  margin-bottom: 4px;
}

.student-info .department {
  font-size: 14px;
  color: #606266;
}

.student-status {
  margin-left: auto;
}
</style> 