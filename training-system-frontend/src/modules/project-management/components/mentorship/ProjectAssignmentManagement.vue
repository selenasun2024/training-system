<template>
  <div class="project-assignment-management">
    <!-- 工具栏 -->
    <div class="toolbar">
      <div class="toolbar-left">
        <el-button type="primary" @click="showAssignmentDialog = true">
          <el-icon><Plus /></el-icon>
          添加师徒关系
        </el-button>
        <el-button @click="handleBatchAssignment" :disabled="selectedStudents.length === 0">
          <el-icon><Connection /></el-icon>
          批量指派
        </el-button>
        <el-button @click="refreshData">
          <el-icon><Refresh /></el-icon>
          刷新
        </el-button>
      </div>
      <div class="toolbar-right">
        <el-input
          v-model="searchKeyword"
          placeholder="搜索学员或导师"
          style="width: 200px"
          clearable
        >
          <template #prefix>
            <el-icon><Search /></el-icon>
          </template>
        </el-input>
      </div>
    </div>

    <!-- 师徒关系表格 -->
    <el-table
      :data="filteredRelationships"
      v-loading="loading"
      @selection-change="handleSelectionChange"
      row-key="id"
      border
    >
      <el-table-column type="selection" width="55" />
      
      <el-table-column label="学员信息" min-width="200">
        <template #default="{ row }">
          <div class="student-info">
            <el-avatar 
              :src="getStudentInfo(row.studentId)?.avatar" 
              :size="32"
              class="avatar"
            >
              {{ getStudentInfo(row.studentId)?.name?.charAt(0) }}
            </el-avatar>
            <div class="info">
              <div class="name">{{ getStudentInfo(row.studentId)?.name }}</div>
              <div class="department">{{ getStudentInfo(row.studentId)?.department }}</div>
            </div>
          </div>
        </template>
      </el-table-column>

      <el-table-column label="带教导师" min-width="200">
        <template #default="{ row }">
          <div class="mentor-info">
            <el-avatar 
              :src="getMentorInfo(row.mentorId)?.avatar" 
              :size="32"
              class="avatar"
            >
              {{ getMentorInfo(row.mentorId)?.name?.charAt(0) }}
            </el-avatar>
            <div class="info">
              <div class="name">{{ getMentorInfo(row.mentorId)?.name }}</div>
              <div class="certification">
                <el-tag
                  :type="row.type === 'academy_certified' ? 'success' : 'info'"
                  size="small"
                >
                  {{ row.type === 'academy_certified' ? '书院认证' : '部门指定' }}
                </el-tag>
              </div>
            </div>
          </div>
        </template>
      </el-table-column>

      <el-table-column label="匹配方式" width="120">
        <template #default="{ row }">
          <el-tag
            :type="row.matchingType === 'smart_assisted' ? 'warning' : 'info'"
            size="small"
          >
            {{ row.matchingType === 'smart_assisted' ? '智能辅助' : '手动匹配' }}
          </el-tag>
        </template>
      </el-table-column>

      <el-table-column label="匹配评分" width="100">
        <template #default="{ row }">
          <div v-if="row.matchingScore" class="matching-score">
            <el-progress
              :percentage="row.matchingScore"
              :stroke-width="6"
              :format="() => `${row.matchingScore}分`"
              :color="getScoreColor(row.matchingScore)"
            />
          </div>
          <span v-else class="no-score">-</span>
        </template>
      </el-table-column>

      <el-table-column label="建立时间" width="120">
        <template #default="{ row }">
          {{ formatDate(row.establishedDate) }}
        </template>
      </el-table-column>

      <el-table-column label="状态" width="100">
        <template #default="{ row }">
          <el-tag
            :type="getStatusType(row.status)"
            size="small"
          >
            {{ getStatusText(row.status) }}
          </el-tag>
        </template>
      </el-table-column>

      <el-table-column label="操作" width="220" fixed="right">
        <template #default="{ row }">
          <el-button 
            type="warning" 
            size="small"
            @click="handleChangeMentor(row)"
            :disabled="row.status === 'completed' || row.status === 'graduated'"
          >
            更换带教老师
          </el-button>
          <el-button 
            type="primary" 
            size="small"
            @click="handleViewDetails(row)"
          >
            详情
          </el-button>
          <el-dropdown @command="(command) => handleDropdownCommand(command, row)" trigger="click">
            <el-button size="small" class="more-btn">
              更多 <el-icon class="el-icon--right"><ArrowDown /></el-icon>
            </el-button>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item 
                  command="graduate"
                  :disabled="row.status === 'completed' || row.status === 'graduated'"
                >
                  出师
                </el-dropdown-item>
                <el-dropdown-item 
                  command="terminate"
                  :disabled="row.status === 'completed' || row.status === 'graduated'"
                >
                  解除关系
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </template>
      </el-table-column>
    </el-table>

    <!-- 分页器 -->
    <div class="pagination-wrapper">
      <el-pagination
        v-model:current-page="pagination.page"
        v-model:page-size="pagination.pageSize"
        :total="pagination.total"
        :page-sizes="[10, 20, 50, 100]"
        layout="total, sizes, prev, pager, next, jumper"
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
      />
    </div>

    <!-- 添加师徒关系对话框 -->
    <el-dialog
      v-model="showAssignmentDialog"
      title="添加师徒关系"
      width="800px"
      :close-on-click-modal="false"
    >
      <ProjectAssignmentDialog
        :project-id="projectId"
        :available-students="availableStudents"
        :available-mentors="availableMentors"
        @submit="handleAssignmentSubmit"
        @cancel="showAssignmentDialog = false"
      />
    </el-dialog>

    <!-- 关系详情对话框 -->
    <el-dialog
      v-model="showDetailsDialog"
      title="师徒关系详情"
      width="1000px"
      :close-on-click-modal="false"
    >
      <RelationshipDetails
        v-if="selectedRelationship"
        :relationship="selectedRelationship"
        :mentor="getMentorInfo(selectedRelationship.mentorId)"
        :student="getStudentInfo(selectedRelationship.studentId)"
        @close="showDetailsDialog = false"
      />
    </el-dialog>

    <!-- 更换带教老师对话框 -->
    <el-dialog
      v-model="showChangeMentorDialog"
      title="更换带教老师"
      width="600px"
      :close-on-click-modal="false"
    >
      <div v-if="selectedRelationship" class="change-mentor-content">
        <div class="current-info">
          <h4>当前师徒关系</h4>
          <div class="info-item">
            <span class="label">学员：</span>
            <span class="value">{{ getStudentInfo(selectedRelationship.studentId)?.name }}</span>
          </div>
          <div class="info-item">
            <span class="label">当前导师：</span>
            <span class="value">{{ getMentorInfo(selectedRelationship.mentorId)?.name }}</span>
          </div>
          <div class="info-item">
            <span class="label">建立时间：</span>
            <span class="value">{{ formatDate(selectedRelationship.establishedDate) }}</span>
          </div>
        </div>

        <el-divider />

        <el-form :model="changeMentorForm" label-width="100px">
          <el-form-item label="新导师" required>
            <el-select 
              v-model="changeMentorForm.newMentorId" 
              placeholder="请选择新的带教老师"
              style="width: 100%"
              filterable
            >
              <el-option
                v-for="mentor in availableMentors"
                :key="mentor.id"
                :label="`${mentor.name} (${mentor.department})`"
                :value="mentor.id"
                :disabled="mentor.id === selectedRelationship.mentorId"
              >
                <div class="mentor-option">
                  <div class="mentor-name">{{ mentor.name }}</div>
                  <div class="mentor-info">
                    {{ mentor.department }} - 当前负责: {{ mentor.currentLoad || 0 }}/{{ mentor.maxLoad || 5 }}名学员
                  </div>
                </div>
              </el-option>
            </el-select>
          </el-form-item>
        </el-form>
      </div>

      <template #footer>
        <div class="dialog-footer">
          <el-button @click="showChangeMentorDialog = false">取消</el-button>
          <el-button 
            type="primary" 
            @click="handleConfirmChangeMentor"
            :disabled="!changeMentorForm.newMentorId"
            :loading="changingMentor"
          >
            确认更换
          </el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Connection, Refresh, Search, ArrowDown } from '@element-plus/icons-vue'
import ProjectAssignmentDialog from './dialogs/ProjectAssignmentDialog.vue'
import RelationshipDetails from './dialogs/RelationshipDetails.vue'
import { formatDate } from '@/utils/dateUtils'
import { 
  updateMentorshipRelationshipStatus,
  changeMentorshipMentor,
  deleteMentorshipRelationship 
} from '@/api/modules/project-mentorship'

// Props
interface Props {
  projectId: string
  students: any[]
  mentors: any[]
  relationships: any[]
  config: any
}

const props = defineProps<Props>()

// Emits
const emit = defineEmits<{
  assignmentCreated: [data: any]
  relationshipRemoved: [id: string]
  mentorChanged: [data: any]
}>()

// 响应式数据
const loading = ref(false)
const searchKeyword = ref('')
const selectedStudents = ref<string[]>([])
const showAssignmentDialog = ref(false)
const showDetailsDialog = ref(false)
const showChangeMentorDialog = ref(false)
const selectedRelationship = ref<any>(null)
const changingMentor = ref(false)

// 更换导师表单
const changeMentorForm = ref({
  newMentorId: ''
})

// 分页数据
const pagination = ref({
  page: 1,
  pageSize: 20,
  total: 0
})

// 使用传入的relationships数据，不再需要本地Mock数据

// 计算属性
const filteredRelationships = computed(() => {
  if (!searchKeyword.value) {
    return props.relationships
  }
  
  const keyword = searchKeyword.value.toLowerCase()
  return props.relationships.filter(rel => {
    const student = getStudentInfo(rel.studentId)
    const mentor = getMentorInfo(rel.mentorId)
    return (
      student?.name.toLowerCase().includes(keyword) ||
      mentor?.name.toLowerCase().includes(keyword) ||
      student?.department.toLowerCase().includes(keyword)
    )
  })
})

const availableStudents = computed(() => {
  const assignedStudentIds = props.relationships.map(rel => rel.studentId)
  return props.students.filter(student => !assignedStudentIds.includes(student.id))
})

const availableMentors = computed(() => {
  return props.mentors
})

// 方法
const getStudentInfo = (studentId: string) => {
  return props.students.find(s => s.id === studentId) || {
    id: studentId,
    name: '张三',
    department: '技术部',
    avatar: ''
  }
}

const getMentorInfo = (mentorId: string) => {
  return props.mentors.find(m => m.id === mentorId) || {
    id: mentorId,
    name: '李老师',
    department: '技术部',
    avatar: ''
  }
}

const getScoreColor = (score: number) => {
  if (score >= 90) return '#67c23a'
  if (score >= 80) return '#e6a23c'
  if (score >= 70) return '#f56c6c'
  return '#909399'
}

const getStatusText = (status: string) => {
  // 简化状态：只有未出师和已出师
  if (status === 'graduated') {
    return '已出师'
  }
  return '未出师'  // 所有其他状态都显示为未出师
}

const getStatusType = (status: string) => {
  // 简化状态类型：只有两种颜色
  if (status === 'graduated') {
    return 'success'  // 已出师 - 绿色
  }
  return 'warning'    // 未出师 - 橙色
}

// 事件处理
const handleSelectionChange = (selection: any[]) => {
  selectedStudents.value = selection.map(rel => rel.studentId)
}

const handleBatchAssignment = () => {
  ElMessage.info('批量指派功能开发中...')
}

const refreshData = () => {
  loading.value = true
  setTimeout(() => {
    loading.value = false
  }, 1000)
}

const handleAssignmentSubmit = (assignmentData: any) => {
  // 处理师徒关系添加
  console.log('添加师徒关系:', assignmentData)
  showAssignmentDialog.value = false
  emit('assignmentCreated', assignmentData)
  ElMessage.success('师徒关系添加成功！')
}

const handleViewDetails = (relationship: any) => {
  selectedRelationship.value = relationship
  showDetailsDialog.value = true
}

const handleChangeMentor = (relationship: any) => {
  selectedRelationship.value = relationship
  showChangeMentorDialog.value = true
}

const handleConfirmChangeMentor = async () => {
  if (!selectedRelationship.value || !props.projectId) return

  changingMentor.value = true
  try {
    await ElMessageBox.confirm(
      `确定要将学员 ${getStudentInfo(selectedRelationship.value.studentId)?.name} 的带教老师从 ${getMentorInfo(selectedRelationship.value.mentorId)?.name} 更换为 ${getMentorInfo(changeMentorForm.value.newMentorId)?.name} 吗？`,
      '确认更换',
      {
        confirmButtonText: '确定更换',
        cancelButtonText: '取消',
        type: 'warning',
      }
    )

    // 调用更换导师的API
    const updateResult = await changeMentorshipMentor(
      props.projectId,
      selectedRelationship.value.id,
      changeMentorForm.value.newMentorId,
      '' // 移除reason字段
    )

    ElMessage.success('带教老师更换成功！')
    showChangeMentorDialog.value = false
    changeMentorForm.value = { newMentorId: '' } // 清空表单
    
    // 通过emit触发父组件更新，传递更新后的数据
    const newMentor = getMentorInfo(changeMentorForm.value.newMentorId)
    emit('mentorChanged', { 
      action: 'change_mentor', 
      relationshipId: selectedRelationship.value.id,
      newMentorId: changeMentorForm.value.newMentorId,
      newMentorName: newMentor?.name || '未知导师',
      updateResult: updateResult
    })
  } catch (error) {
    console.error('❌ 更换带教老师失败:', error)
    if (error && typeof error === 'object' && 'message' in error) {
      ElMessage.error('更换带教老师失败，请稍后重试')
    } else {
      ElMessage.info('已取消更换带教老师')
    }
  } finally {
    changingMentor.value = false
  }
}

const handleDropdownCommand = async (command: string, relationship: any) => {
  if (!props.projectId) return

  if (command === 'graduate') {
    try {
      await ElMessageBox.confirm(
        '确定要为该学员办理出师手续吗？出师后该带教关系将标记为完成状态。',
        '确认出师',
        {
          confirmButtonText: '确定出师',
          cancelButtonText: '取消',
          type: 'success',
        }
      )
      
      // 调用后端API更新关系状态
      await updateMentorshipRelationshipStatus(
        props.projectId,
        relationship.id,
        'graduated',
        '学员完成培训，办理出师手续'
      )
      
      ElMessage.success('学员出师手续已办理完成')
      
      // 通过emit触发父组件更新状态
      emit('mentorChanged', { 
        action: 'graduate', 
        relationshipId: relationship.id,
        newStatus: 'graduated',
        statusText: '已出师'
      })
    } catch (error) {
      console.error('❌ 出师操作失败:', error)
      if (error && typeof error === 'object' && 'message' in error) {
        ElMessage.error('出师操作失败，请稍后重试')
      } else {
        ElMessage.info('已取消出师操作')
      }
    }
  } else if (command === 'terminate') {
    try {
      await ElMessageBox.confirm(
        '确定要解除这个师徒关系吗？此操作不可恢复。',
        '确认解除',
        {
          confirmButtonText: '确定解除',
          cancelButtonText: '取消',
          type: 'warning',
        }
      )
      
      // 调用删除师徒关系API
      await deleteMentorshipRelationship(props.projectId, relationship.id)
      
      ElMessage.success('师徒关系已解除')
      
      // 通过emit触发父组件重新加载数据
      emit('relationshipRemoved', relationship.id)
    } catch (error) {
      console.error('❌ 解除关系失败:', error)
      if (error && typeof error === 'object' && 'message' in error) {
        ElMessage.error('解除关系失败，请稍后重试')
      } else {
        ElMessage.info('已取消解除操作')
      }
    }
  }
}

const handleSizeChange = (size: number) => {
  pagination.value.pageSize = size
  pagination.value.page = 1
}

const handleCurrentChange = (page: number) => {
  pagination.value.page = page
}

// 生命周期
onMounted(() => {
  pagination.value.total = props.relationships.length
})
</script>

<style scoped>
.project-assignment-management {
  padding: 20px;
}

.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding: 16px;
  background: #f8f9fa;
  border-radius: 8px;
}

.toolbar-left {
  display: flex;
  gap: 12px;
}

.toolbar-right {
  display: flex;
  align-items: center;
  gap: 12px;
}

.student-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.avatar {
  flex-shrink: 0;
}

.info .name {
  font-weight: 500;
  color: #303133;
}

.info .department {
  font-size: 12px;
  color: #909399;
  margin-top: 2px;
}

.score-cell {
  display: flex;
  align-items: center;
  gap: 8px;
}

.no-score {
  color: #c0c4cc;
  font-style: italic;
}

.more-btn {
  margin-left: 8px;
}

.pagination-wrapper {
  display: flex;
  justify-content: center;
  margin-top: 20px;
}

/* 更换导师对话框样式 */
.change-mentor-content {
  padding: 10px 0;
}

.current-info {
  background: #f8f9fa;
  padding: 16px;
  border-radius: 8px;
  margin-bottom: 16px;
}

.current-info h4 {
  margin: 0 0 12px 0;
  color: #303133;
  font-size: 16px;
}

.info-item {
  display: flex;
  margin-bottom: 8px;
}

.info-item .label {
  min-width: 80px;
  color: #606266;
  font-weight: 500;
}

.info-item .value {
  color: #303133;
  font-weight: 600;
}

.mentor-option {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.mentor-name {
  font-weight: 500;
  color: #303133;
}

.mentor-info {
  font-size: 12px;
  color: #909399;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}
</style> 