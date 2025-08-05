<template>
  <div class="project-assignment-tab">
    <!-- 师徒关系列表 -->
    <div class="assignment-list">
      <!-- 已指派的师徒关系 -->
      <div v-if="assignedRelationships.length > 0" class="assigned-section">
        <div class="section-header">
          <h4>已建立的师徒关系</h4>
          <el-button 
            type="primary" 
            size="small"
            @click="showAssignDialog = true"
            :disabled="unassignedStudents.length === 0"
          >
            指派导师
          </el-button>
        </div>
        <el-table :data="assignedRelationships" style="width: 100%" border>
          <el-table-column label="导师" min-width="150">
            <template #default="{ row }">
              <div class="user-cell">
                <el-avatar :size="32">{{ getMentorName(row.mentorId).charAt(0) }}</el-avatar>
                <div class="user-info">
                  <div class="name">{{ getMentorName(row.mentorId) }}</div>
                  <el-tag :type="row.type === 'academy_certified' ? 'success' : 'info'" size="small">
                    {{ row.type === 'academy_certified' ? '书院认证' : '部门指定' }}
                  </el-tag>
                </div>
              </div>
            </template>
          </el-table-column>

          <el-table-column label="学员" min-width="150">
            <template #default="{ row }">
              <div class="user-cell">
                <el-avatar :size="32">{{ getStudentName(row.studentId).charAt(0) }}</el-avatar>
                <div class="user-info">
                  <div class="name">{{ getStudentName(row.studentId) }}</div>
                  <div class="department">{{ getStudentDepartment(row.studentId) }}</div>
                </div>
              </div>
            </template>
          </el-table-column>

          <el-table-column label="建立时间" width="120">
            <template #default="{ row }">
              {{ formatDate(row.establishedDate) }}
            </template>
          </el-table-column>

          <el-table-column label="带教范围" width="100">
            <template #default="{ row }">
              {{ row.scope === 'full_project' ? '全项目' : '特定阶段' }}
            </template>
          </el-table-column>

          <el-table-column label="预期时长" width="100">
            <template #default="{ row }">
              {{ row.expectedDuration }}个月
            </template>
          </el-table-column>

          <el-table-column label="状态" width="80">
            <template #default="{ row }">
              <el-tag :type="getRelationshipStatusType(row.status)" size="small">
                {{ getRelationshipStatusText(row.status) }}
              </el-tag>
            </template>
          </el-table-column>

          <el-table-column label="操作" width="200" fixed="right">
            <template #default="{ row }">
              <el-button 
                type="primary" 
                size="small"
                @click="viewRelationshipDetails(row)"
              >
                详情
              </el-button>
              <el-button 
                type="warning" 
                size="small"
                @click="editRelationship(row)"
              >
                编辑
              </el-button>
              <el-button 
                type="danger" 
                size="small"
                @click="removeRelationship(row)"
              >
                解除
              </el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>

      <!-- 待指派的学员 -->
      <div v-if="unassignedStudents.length > 0" class="unassigned-section">
        <h4>待指派导师的学员</h4>
        <el-table :data="unassignedStudents" style="width: 100%" border>
          <el-table-column label="学员" min-width="200">
            <template #default="{ row }">
              <div class="user-cell">
                <el-avatar :size="32">{{ row.name.charAt(0) }}</el-avatar>
                <div class="user-info">
                  <div class="name">{{ row.name }}</div>
                  <div class="meta">{{ row.department }} - {{ row.position }}</div>
                </div>
              </div>
            </template>
          </el-table-column>

          <el-table-column label="入职时间" width="120">
            <template #default="{ row }">
              {{ formatDate(row.entryDate) }}
            </template>
          </el-table-column>

          <el-table-column label="学员等级" width="100">
            <template #default="{ row }">
              <el-tag :type="getLevelType(row.level)" size="small">
                {{ getLevelText(row.level) }}
              </el-tag>
            </template>
          </el-table-column>

          <el-table-column label="技能" min-width="200">
            <template #default="{ row }">
              <div class="skills-cell">
                <el-tag
                  v-for="skill in row.skills.slice(0, 3)"
                  :key="skill"
                  size="small"
                  type="info"
                  style="margin-right: 4px; margin-bottom: 4px;"
                >
                  {{ skill }}
                </el-tag>
                <span v-if="row.skills.length > 3" class="more-text">
                  +{{ row.skills.length - 3 }}
                </span>
              </div>
            </template>
          </el-table-column>

          <el-table-column label="操作" width="120" fixed="right">
            <template #default="{ row }">
              <el-button 
                type="primary" 
                size="small"
                @click="assignMentor(row)"
              >
                指派导师
              </el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>

      <!-- 空状态 -->
      <div v-if="projectStudents.length === 0" class="empty-state">
        <el-empty description="当前项目暂无学员">
          <el-button type="primary" @click="$emit('add-students')">
            添加学员
          </el-button>
        </el-empty>
      </div>
    </div>

    <!-- 指派导师对话框 - 临时占位 -->
    <el-dialog
      v-model="showAssignDialog"
      title="指派导师"
      width="600px"
      :close-on-click-modal="false"
    >
      <div style="padding: 20px; text-align: center;">
        <p>指派导师功能开发中...</p>
        <el-button @click="closeAssignDialog">关闭</el-button>
      </div>
    </el-dialog>

    <!-- 关系详情对话框 - 临时占位 -->
    <el-dialog
      v-model="showDetailsDialog"
      title="师徒关系详情"
      width="500px"
    >
      <div style="padding: 20px; text-align: center;">
        <p>关系详情功能开发中...</p>
        <el-button @click="showDetailsDialog = false">关闭</el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Right } from '@element-plus/icons-vue'
import type { ProjectMentorRelationship, Student, Mentor } from '../types/mentorship'
// import SimpleAssignmentForm from './dialogs/SimpleAssignmentForm.vue'
// import RelationshipSimpleDetails from './dialogs/RelationshipSimpleDetails.vue'
import { formatDate } from '@/utils/dateUtils'

// Props
interface Props {
  projectId: string
  students: Student[]
  mentors: Mentor[]
  relationships: ProjectMentorRelationship[]
}

const props = defineProps<Props>()

// 响应式数据
const showAssignDialog = ref(false)
const showDetailsDialog = ref(false)
const selectedStudent = ref<Student | null>(null)
const selectedRelationship = ref<ProjectMentorRelationship | null>(null)

// 计算属性
const projectStudents = computed(() => props.students)

const assignedRelationships = computed(() => 
  props.relationships.filter(rel => rel.status === 'active')
)

const assignedStudents = computed(() => {
  const assignedIds = assignedRelationships.value.map(rel => rel.studentId)
  return props.students.filter(student => assignedIds.includes(student.id))
})

const unassignedStudents = computed(() => {
  const assignedIds = assignedRelationships.value.map(rel => rel.studentId)
  return props.students.filter(student => !assignedIds.includes(student.id))
})

const availableMentors = computed(() => props.mentors)

// 方法
const getMentorName = (mentorId: string): string => {
  const mentor = props.mentors.find(m => m.id === mentorId)
  return mentor?.name || `导师${mentorId}`
}

const getStudentName = (studentId: string): string => {
  const student = props.students.find(s => s.id === studentId)
  return student?.name || `学员${studentId}`
}

const getStudentDepartment = (studentId: string): string => {
  const student = props.students.find(s => s.id === studentId)
  return student?.department || '未知部门'
}

const getRelationshipStatusType = (status: string): string => {
  const typeMap: Record<string, string> = {
    active: 'success',
    paused: 'warning',
    completed: 'info',
    terminated: 'danger'
  }
  return typeMap[status] || 'info'
}

const getRelationshipStatusText = (status: string): string => {
  const textMap: Record<string, string> = {
    active: '进行中',
    paused: '暂停',
    completed: '已完成',
    terminated: '已终止'
  }
  return textMap[status] || status
}

const getLevelType = (level: string): string => {
  const typeMap: Record<string, string> = {
    junior: 'info',
    intermediate: 'warning',
    senior: 'success'
  }
  return typeMap[level] || 'info'
}

const getLevelText = (level: string): string => {
  const textMap: Record<string, string> = {
    junior: '初级',
    intermediate: '中级',
    senior: '高级'
  }
  return textMap[level] || level
}

// 事件处理
const assignMentor = (student: Student) => {
  selectedStudent.value = student
  showAssignDialog.value = true
}

const handleAssignmentSubmit = (assignmentData: any) => {
  console.log('指派导师:', assignmentData)
  closeAssignDialog()
  emits('assignment-created', assignmentData)
  ElMessage.success('导师指派成功！')
}

const closeAssignDialog = () => {
  showAssignDialog.value = false
  selectedStudent.value = null
}

const viewRelationshipDetails = (relationship: ProjectMentorRelationship) => {
  selectedRelationship.value = relationship
  showDetailsDialog.value = true
}

const editRelationship = (relationship: ProjectMentorRelationship) => {
  ElMessage.info(`编辑师徒关系: ${relationship.id}`)
  // 可以打开编辑对话框
}

const removeRelationship = async (relationship: ProjectMentorRelationship) => {
  try {
    await ElMessageBox.confirm(
      '确定要解除这个师徒关系吗？',
      '确认解除',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning',
      }
    )
    emits('relationship-removed', relationship.id)
    ElMessage.success('师徒关系已解除')
  } catch {
    ElMessage.info('已取消操作')
  }
}

// 事件定义
const emits = defineEmits<{
  'assignment-created': [data: any]
  'relationship-removed': [id: string]
  'add-students': []
}>()
</script>

<style scoped>
.project-assignment-tab {
  padding: 20px;
}



.assigned-section,
.unassigned-section {
  margin-bottom: 24px;
}

.assigned-section h4,
.unassigned-section h4 {
  margin: 0 0 16px 0;
  color: #303133;
  font-size: 16px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.user-cell {
  display: flex;
  align-items: center;
  gap: 8px;
}

.user-info .name {
  font-weight: 500;
  color: #303133;
  margin-bottom: 2px;
}

.user-info .department,
.user-info .meta {
  font-size: 12px;
  color: #909399;
}

.skills-cell {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 4px;
}

.more-text {
  font-size: 12px;
  color: #909399;
}

.empty-state {
  padding: 40px;
  text-align: center;
}

:deep(.el-card) {
  border-radius: 8px;
}

:deep(.el-card):hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}
</style> 