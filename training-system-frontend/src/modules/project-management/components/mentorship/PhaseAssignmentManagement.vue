<template>
  <div class="phase-assignment-management">
    <!-- 工具栏 -->
    <div class="toolbar">
      <div class="toolbar-left">
        <!-- 移除了批量指派带教老师和刷新按钮 -->
      </div>
      <div class="toolbar-right">
        <el-select v-model="phaseFilter" placeholder="筛选阶段" clearable style="width: 160px">
          <el-option label="全部阶段" value="" />
          <el-option
            v-for="phase in phasesWithAssignments"
            :key="phase.id"
            :label="phase.name"
            :value="phase.id"
          />
        </el-select>
        <el-input
          v-model="searchKeyword"
          placeholder="搜索带教老师或学员"
          style="width: 200px"
          clearable
        >
          <template #prefix>
            <el-icon><Search /></el-icon>
          </template>
        </el-input>
      </div>
    </div>

    <!-- 移除了阶段信息来源说明 -->

    <!-- 阶段配置卡片 -->
    <div class="phases-container">
      <div 
        v-for="(phase, index) in filteredPhases" 
        :key="phase.id" 
        class="phase-card"
        :class="{ 'active': phase.status === 'active' }"
      >
        <!-- 阶段头部 -->
        <div class="phase-header">
          <div class="phase-title-section">
            <div class="phase-title">
              <div class="phase-name">{{ phase.name }}</div>
              <el-tag 
                :type="getPhaseStatusType(phase.status)"
                size="small"
              >
                {{ getPhaseStatusText(phase.status) }}
              </el-tag>
            </div>
            
            <!-- 阶段信息 - 集成到头部 -->
            <div class="phase-info-inline">
              <div class="info-description">
                <span class="label">培养目标：</span>
                <span class="value">{{ phase.description || phase.objectives || '暂无描述' }}</span>
              </div>
              <div class="info-meta">
                <span class="meta-item">
                  <span class="label">时长：</span>
                  <span class="value">{{ phase.duration || '待定' }}周</span>
                </span>
                <span class="meta-separator">|</span>
                <span class="meta-item">
                  <span class="label">开始：</span>
                  <span class="value">{{ formatDate(phase.startDate) }}</span>
                </span>
              </div>
            </div>
          </div>
          
          <div class="phase-actions">
            <el-button 
              size="small" 
              type="primary"
              @click="handleShowAssignMentorDialog(phase)"
              :disabled="phase.status === 'completed'"
            >
              指派带教老师
            </el-button>
          </div>
        </div>

        <!-- 带教老师指派状态 -->
        <div class="mentor-assignment">
          <div class="assignment-header">
            <h4>带教老师指派情况</h4>
            <div class="assignment-stats">
              已指派 {{ phase.assignments?.length || 0 }} 名带教老师，
              覆盖 {{ getAssignedStudentsCount(phase) }} 名学员
            </div>
          </div>
          
            <!-- 🔧 优化：统一显示表格，空状态使用紧凑提示 -->
            <div class="assignments-list">
              <el-table :data="phase.assignments || []" style="width: 100%">
                <el-table-column label="带教老师信息" width="250">
                  <template #default="{ row }">
                    <div class="mentor-info">
                      <div class="name">{{ row.mentorName }}</div>
                      <div class="department">{{ row.mentorDepartment }}</div>
                    </div>
                  </template>
                </el-table-column>
                
                <el-table-column label="学员信息" width="250">
                  <template #default="{ row }">
                    <div class="student-info">
                      <div class="name">{{ row.studentName }}</div>
                      <div class="department">{{ row.studentDepartment }}</div>
                    </div>
                  </template>
                </el-table-column>
                
                <el-table-column label="建立时间" width="120">
                  <template #default="{ row }">
                    <span>{{ formatDate(row.establishedDate) }}</span>
                  </template>
                </el-table-column>
                
                <el-table-column label="状态" width="100">
                  <template #default="{ row }">
                    <el-tag :type="getStatusType(row.status)">
                      {{ getStatusText(row.status) }}
                    </el-tag>
                  </template>
                </el-table-column>
                
                <el-table-column label="操作" width="300">
                  <template #default="{ row }">
                    <div class="assignment-actions">
                      <el-button 
                        size="small"
                        type="warning"
                        @click="handleChangeMentor(row, phase)"
                        :disabled="phase.status === 'completed' || row.status === 'graduated' || row.status === 'terminated'"
                      >
                        更换带教老师
                      </el-button>
                      <el-button 
                        size="small"
                        type="primary"
                        @click="handleViewDetails(row)"
                      >
                        详情
                      </el-button>
                      <el-dropdown @command="(command) => handleDropdownCommand(command, row, phase)" trigger="click">
                        <el-button 
                          size="small" 
                          class="more-btn"
                          :disabled="row.status === 'graduated' || row.status === 'terminated'"
                        >
                          更多
                          <el-icon><arrow-down /></el-icon>
                        </el-button>
                        <template #dropdown>
                          <el-dropdown-menu>
                            <el-dropdown-item 
                              command="graduate"
                              :disabled="row.status === 'graduated' || row.status === 'terminated'"
                            >
                              出师
                            </el-dropdown-item>
                            <el-dropdown-item 
                              command="terminate"
                              :disabled="row.status === 'graduated' || row.status === 'terminated'"
                            >
                              解除关系
                            </el-dropdown-item>
                          </el-dropdown-menu>
                        </template>
                      </el-dropdown>
                    </div>
                  </template>
                </el-table-column>
                
                <!-- 移除多余的空状态提示 -->
                <template v-if="!phase.assignments || phase.assignments.length === 0" #empty>
                  <div class="empty-assignments-compact">
                    <span class="empty-text">暂无指派关系</span>
                  </div>
                </template>
              </el-table>
            </div>
        </div>
      </div>
    </div>



    <!-- 指派带教老师对话框 -->
    <el-dialog
      v-model="showAssignMentorDialog"
      title="指派阶段带教老师"
      width="800px"
      :close-on-click-modal="false"
    >
      <PhaseAssignmentDialog
        v-if="selectedPhase"
        :phase="selectedPhase"
        :students="students"
        :mentors="mentors"
        @submit="handleAssignmentSubmit"
        @cancel="showAssignMentorDialog = false"
      />
    </el-dialog>

    <!-- 更换带教老师对话框 -->
    <el-dialog
      v-model="showChangeMentorDialog"
      title="更换带教老师"
      width="500px"
      :close-on-click-modal="false"
    >
      <el-form :model="changeMentorForm" label-width="100px">
        <el-form-item label="当前带教老师">
          <el-input :value="currentMentorName" disabled />
        </el-form-item>
        <el-form-item label="新带教老师" required>
          <el-select v-model="changeMentorForm.newMentorId" placeholder="请选择新带教老师" style="width: 100%">
            <el-option
              v-for="mentor in availableMentors"
              :key="mentor.id"
              :label="`${mentor.name} (${mentor.department})`"
              :value="mentor.id"
              :disabled="mentor.id === selectedAssignment?.mentorId"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="更换原因">
          <el-input
            v-model="changeMentorForm.reason"
            type="textarea"
            placeholder="请说明更换带教老师的理由"
            :rows="3"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showChangeMentorDialog = false">取消</el-button>
        <el-button 
          type="primary" 
          @click="handleConfirmChangeMentor"
          :loading="changingMentor"
          :disabled="!changeMentorForm.newMentorId"
        >
          确定更换
        </el-button>
      </template>
    </el-dialog>

    <!-- 批量指派对话框 -->
    <el-dialog
      v-model="showBatchAssignDialog"
      title="批量指派带教老师"
      width="1000px"
      :close-on-click-modal="false"
    >
      <BatchAssignmentDialog
        :phases="unassignedPhases"
        :students="students"
        :mentors="mentors"
        @submit="handleBatchAssignSubmit"
        @cancel="showBatchAssignDialog = false"
      />
    </el-dialog>

    <!-- 师徒关系详情对话框 -->
    <el-dialog
      v-model="showDetailsDialog"
      title="师徒关系详情"
      width="600px"
      :close-on-click-modal="false"
    >
      <div v-if="selectedAssignment" class="assignment-details">
        <div class="detail-row">
          <span class="label">师徒关系ID：</span>
          <span class="value">{{ selectedAssignment.relationshipId }}</span>
        </div>
        <div class="detail-row">
          <span class="label">学员：</span>
          <span class="value">{{ selectedAssignment.studentName }}</span>
        </div>
        <div class="detail-row">
          <span class="label">带教老师：</span>
          <span class="value">{{ selectedAssignment.mentorName }}</span>
        </div>
        <div class="detail-row">
          <span class="label">建立时间：</span>
          <span class="value">{{ formatDate(selectedAssignment.establishedDate) }}</span>
        </div>
        <div class="detail-row">
          <span class="label">当前状态：</span>
          <el-tag :type="getStatusType(selectedAssignment.status)">
            {{ getStatusText(selectedAssignment.status) }}
          </el-tag>
        </div>
        <div class="detail-row">
          <span class="label">备注：</span>
          <span class="value">{{ selectedAssignment.remarks || '暂无备注' }}</span>
        </div>
      </div>
      <template #footer>
        <el-button @click="showDetailsDialog = false">关闭</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Connection, Refresh, Search, ArrowDown } from '@element-plus/icons-vue'
import PhaseAssignmentDialog from './dialogs/PhaseAssignmentDialog.vue'
import StudentsDetailsList from './dialogs/StudentsDetailsList.vue'
import BatchAssignmentDialog from './dialogs/BatchAssignmentDialog.vue'
import { formatDate } from '@/utils/dateUtils'
import { useTrainingStageStore } from '../../stores/trainingStage'
import { 
  getProjectMentorshipPhases,
  createPhaseAssignment,
  getPhaseAssignments,
  removePhaseAssignment,
  getAvailableMentors,
  getAllUsers,
  getProjectParticipants,
  updateMentorshipRelationshipStatus
} from '@/api/modules/project-mentorship'
import { searchUsers } from '@/api/modules/user'

// Props
interface Props {
  projectId: string
  students: any[]
  mentors: any[]
  phases: any[]
  config: any
}

const props = defineProps<Props>()

// Emits
const emit = defineEmits<{
  assignmentCreated: [data: any]
  relationshipRemoved: [id: string]
}>()

// 🔧 使用trainingStage store获取阶段数据
const trainingStageStore = useTrainingStageStore()
const { stages } = storeToRefs(trainingStageStore)

// 响应式变量
const phases = ref<any[]>([])  // 保留用于存储师徒阶段的额外数据
const students = ref<any[]>([])
const mentors = ref<any[]>([])
const selectedPhase = ref<any>(null)
const selectedAssignment = ref<any>(null)
const currentMentorName = ref('')

// 筛选和搜索
const searchKeyword = ref('')
const phaseFilter = ref('')

// 对话框控制
const showAssignMentorDialog = ref(false)
const showChangeMentorDialog = ref(false)
const showBatchAssignDialog = ref(false)
const showDetailsDialog = ref(false)

// 表单数据
const changeMentorForm = ref({
  newMentorId: '',
  reason: ''
})

// 加载状态
const loading = ref(false)
const changingMentor = ref(false)

// 🔧 修改：响应式的阶段数据，使用trainingStage store的数据
const phasesWithAssignments = computed(() => {
  console.log('🔍 计算 phasesWithAssignments:')
  console.log('  - stages.value:', stages.value.length, '个阶段')
  console.log('  - phases.value:', phases.value.length, '个师徒阶段')
  
  // 将trainingStage store的数据与师徒关系数据合并
  const result = stages.value.map(stage => {
    // 查找对应的师徒阶段数据
    const mentorshipPhase = phases.value.find(p => 
      p.sourceStageId === stage.id || 
      p.name === stage.name ||
      p.id === stage.id
    )
    
    const merged = {
      // 使用trainingStage store中的最新数据
      id: mentorshipPhase?.id || stage.id,
      sourceStageId: stage.id,
      name: stage.name,  // 🔧 使用最新的阶段名称
      description: stage.description,  // 🔧 使用最新的阶段描述
      type: mentorshipPhase?.type || 'mentorship',
      status: mentorshipPhase?.status || 'pending',
      duration: mentorshipPhase?.duration || stage.estimatedDuration,
      startDate: mentorshipPhase?.startDate,
      endDate: mentorshipPhase?.endDate,
      assignments: mentorshipPhase?.assignments || [],
      // 保留其他师徒相关数据
      ...(mentorshipPhase ? { ...mentorshipPhase } : {})
    }
    
    console.log(`  - 阶段 "${stage.name}":`, {
      原始名称: stage.name,
      师徒阶段: mentorshipPhase?.name,
      最终名称: merged.name
    })
    
    return merged
  })
  
  console.log('🔍 最终结果:', result.map(r => ({ id: r.id, name: r.name, description: r.description })))
  return result
})

// 计算属性
const filteredPhases = computed(() => {
  let filtered = phasesWithAssignments.value
  
  if (phaseFilter.value) {
    filtered = filtered.filter(phase => phase.id === phaseFilter.value)
  }
  
  if (searchKeyword.value) {
    const keyword = searchKeyword.value.toLowerCase()
    filtered = filtered.filter(phase => {
      return phase.name.toLowerCase().includes(keyword) ||
             (phase.description || '').toLowerCase().includes(keyword) ||
             phase.assignments?.some((assignment: any) => {
               return assignment.mentorName?.toLowerCase().includes(keyword) ||
                      assignment.studentName?.toLowerCase().includes(keyword)
             })
    })
  }
  
  return filtered
})

const unassignedPhases = computed(() => {
  return phasesWithAssignments.value.filter(phase => 
    !phase.assignments || phase.assignments.length === 0
  )
})

const hasUnassignedPhases = computed(() => {
  return unassignedPhases.value.length > 0
})

const availableMentors = computed(() => {
  return mentors.value.filter(m => m.id !== selectedAssignment.value?.mentorId)
})

// 方法
const getMentorInfo = (mentorId: string) => {
  return props.mentors.find(m => m.id === mentorId) || {
    id: mentorId,
    name: '李老师',
    department: '技术部',
    avatar: ''
  }
}

const getAssignedStudentsCount = (phase: any) => {
  if (!phase.assignments) return 0
  // 新的一对一数据结构：每个assignment代表一个师徒关系，有一个studentId
  const studentIds = new Set()
  phase.assignments.forEach((assignment: any) => {
    if (assignment.studentId) {
      studentIds.add(assignment.studentId)
    }
  })
  return studentIds.size
}

const getPhaseStatusType = (status: string) => {
  const typeMap: Record<string, string> = {
    active: 'success',
    pending: 'warning',
    planned: 'info',
    completed: 'info'
  }
  return typeMap[status] || 'info'
}

const getPhaseStatusText = (status: string) => {
  const textMap: Record<string, string> = {
    active: '进行中',
    pending: '待开始',
    planned: '已计划',
    completed: '已完成'
  }
  return textMap[status] || status
}

// 阶段指派相关操作
const handleShowAssignMentorDialog = (phase: any) => {
  selectedPhase.value = phase
  showAssignMentorDialog.value = true
}



const handleAssignmentSubmit = async (assignmentData: any) => {
  try {
    console.log('🔍 创建阶段指派:', assignmentData)
    
    if (!selectedPhase.value) {
      ElMessage.error('请选择阶段')
      return
    }
    
    // 直接使用前端传来的数据，不要重新构造
    const createData = {
      assignmentMode: assignmentData.mode || 'batch',
      assignments: assignmentData.assignments || [],
      remarks: assignmentData.remarks || ''
    }
    
    // 验证数据
    if (!createData.assignments || createData.assignments.length === 0) {
      ElMessage.error('请完成师徒配对')
      return
    }
    
    await createPhaseAssignment(props.projectId, selectedPhase.value.id, createData)
    
    showAssignMentorDialog.value = false
    ElMessage.success('阶段指派创建成功！')
    
    // 重新加载数据
    await loadProjectMentorshipPhases()
  } catch (error) {
    console.error('创建阶段指派失败:', error)
    ElMessage.error('创建指派失败')
  }
}

// 操作处理函数
const handleChangeMentor = (assignment: any, phase: any) => {
  selectedAssignment.value = assignment
  selectedPhase.value = phase
  // 设置当前带教老师信息
  currentMentorName.value = assignment.mentorName
  showChangeMentorDialog.value = true
}

const handleViewDetails = (assignment: any) => {
  selectedAssignment.value = assignment
  showDetailsDialog.value = true
}

const handleDropdownCommand = async (command: string, assignment: any, phase: any) => {
  if (command === 'graduate') {
    // 出师操作 - 参考项目指派的实现
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
      
      console.log('🎓 开始执行出师操作...')
      console.log('🎓 学员:', assignment.studentName)
      console.log('🎓 带教老师:', assignment.mentorName)
      console.log('🎓 师徒关系ID:', assignment.relationshipId)
      
      // 调用出师API更新状态
      const result = await updateMentorshipRelationshipStatus(
        props.projectId,
        assignment.relationshipId,
        'graduated',
        '学员完成培训，办理出师手续'
      )
      console.log('🎓 出师API调用成功，返回结果:', result)
      
      ElMessage.success('学员出师手续已办理完成')
      
      // 重新加载数据
      console.log('🎓 开始重新加载阶段数据...')
      await loadProjectMentorshipPhases()
      console.log('🎓 阶段数据重新加载完成')
      
    } catch (error) {
      console.error('❌ 出师操作失败:', error)
      if (error && typeof error === 'object' && 'message' in error) {
        ElMessage.error('出师操作失败，请稍后重试')
      } else if (error !== 'cancel') {
        ElMessage.error(`出师操作失败: ${error.message || error}`)
      } else {
        ElMessage.info('已取消出师操作')
      }
    }
  } else if (command === 'terminate') {
    // 解除关系操作
    try {
      await ElMessageBox.confirm(
        `确认解除${assignment.mentorName}与${assignment.studentName}的师徒关系吗？`,
        '解除师徒关系',
        {
          type: 'warning',
          confirmButtonText: '确认解除',
          cancelButtonText: '取消'
        }
      )
      
      console.log('🔚 开始执行解除关系操作...')
      console.log('🔚 师徒关系ID:', assignment.relationshipId)
      
      // 调用解除关系API更新状态
      const result = await updateMentorshipRelationshipStatus(
        props.projectId,
        assignment.relationshipId,
        'terminated',
        '用户手动解除'
      )
      console.log('🔚 解除关系API调用成功，返回结果:', result)
      
      ElMessage.success('师徒关系已解除')
      
      // 🔧 修复：通知父组件师徒关系已删除
      emit('relationshipRemoved', assignment.relationshipId)
      
      // 重新加载数据
      console.log('🔚 开始重新加载阶段数据...')
      await loadProjectMentorshipPhases()
      console.log('🔚 阶段数据重新加载完成')
      
    } catch (error) {
      console.error('❌ 解除关系失败:', error)
      if (error && typeof error === 'object' && 'message' in error) {
        ElMessage.error('解除关系失败，请稍后重试')
      } else if (error !== 'cancel') {
        ElMessage.error(`解除关系失败: ${error.message || error}`)
      } else {
        ElMessage.info('已取消解除操作')
      }
    }
  }
}

const handleConfirmChangeMentor = async () => {
  if (!selectedAssignment.value || !selectedPhase.value) return

  try {
    changingMentor.value = true
    const reason = changeMentorForm.value.reason || '带教老师更换'
    
    // 删除当前师徒关系
    await removePhaseAssignment(
      props.projectId, 
      selectedPhase.value.id, 
      selectedAssignment.value.relationshipId
    )
    
    // 创建新的师徒关系
    await createPhaseAssignment(props.projectId, selectedPhase.value.id, {
      assignments: [{
        mentorId: changeMentorForm.value.newMentorId,
        studentIds: [selectedAssignment.value.studentId] // 使用单个学员ID
      }],
      assignmentMode: 'individual',
      remarks: reason
    })
    
    ElMessage.success('带教老师更换成功')
    showChangeMentorDialog.value = false
    
    // 重新加载数据
    await loadProjectMentorshipPhases()
  } catch (error) {
    console.error('更换带教老师失败:', error)
    ElMessage.error('更换带教老师失败')
  } finally {
    changingMentor.value = false
  }
}

const handleBatchAssignSubmit = async (assignmentData: any) => {
  try {
    console.log('🔍 批量指派:', assignmentData)
    
    // 为每个阶段创建指派
    for (const phaseAssignment of assignmentData.assignments || []) {
      if (phaseAssignment.mentorId && phaseAssignment.studentIds?.length > 0) {
        const createData = {
          mentorId: phaseAssignment.mentorId,
          studentIds: phaseAssignment.studentIds,
          assignmentMode: 'batch',
          remarks: assignmentData.remarks || ''
        }
        
        await createPhaseAssignment(props.projectId, phaseAssignment.phaseId, createData)
      }
    }
    
    showBatchAssignDialog.value = false
    ElMessage.success('批量指派成功！')
    
    // 重新加载数据
    await refreshData()
    
  } catch (error) {
    console.error('❌ 批量指派失败:', error)
    ElMessage.error('批量指派失败')
  }
}

// 数据加载
const loadProjectMentorshipPhases = async () => {
  try {
    loading.value = true
    console.log('🔍 加载项目师徒阶段数据 - 项目ID:', props.projectId)
    
    // 🔧 修复：只加载师徒关系数据，不覆盖阶段基本信息
    try {
      const phasesResult = await getProjectMentorshipPhases(props.projectId)
      // 只存储师徒关系相关的数据，不覆盖阶段基本信息
      phases.value = phasesResult || []
      console.log('✅ 师徒阶段数据加载成功:', phases.value.length, '个师徒阶段')
      console.log('🔍 师徒阶段数据内容:', phases.value)
    } catch (error) {
      console.error('❌ 加载师徒阶段数据失败:', error)
      // 不抛出错误，允许组件继续工作，只是没有师徒关系数据
      phases.value = []
    }
    
    // 加载学员数据（项目参与者中的学员）
    try {
      const studentsResponse = await getProjectParticipants(props.projectId)
      if (studentsResponse && Array.isArray(studentsResponse)) {
        // 筛选出学员角色的参与者
        const studentParticipants = studentsResponse.filter(participant => 
          participant.role === 'STUDENT' && participant.status === 'ACTIVE'
        )
        
        students.value = studentParticipants.map((participant: any) => ({
          id: participant.userId || participant.id,
          name: participant.user?.name || participant.name || '未知学员',
          email: participant.user?.email || participant.email || '',
          department: participant.user?.department || participant.department || '未知部门',
          position: participant.user?.position || participant.position || '学员',
          status: participant.status || 'active'
        }))
        console.log('✅ 学员数据加载成功:', students.value.length, '名学员')
      } else {
        students.value = []
        console.warn('⚠️ 项目参与者数据为空')
      }
    } catch (error) {
      console.error('⚠️ 加载学员数据失败:', error)
      students.value = []
    }
    
    // 加载带教老师数据（所有用户，排除项目学员）
    try {
      console.log('🔍 开始获取所有用户作为带教老师候选...')
      const mentorsResponse = await getAllUsers()
      console.log('🔍 getAllUsers返回的原始数据:', mentorsResponse)
      
      // 处理API返回的数据格式：可能是数组或包含users字段的对象
      let usersArray = []
      if (Array.isArray(mentorsResponse)) {
        usersArray = mentorsResponse
      } else if (mentorsResponse && mentorsResponse.users && Array.isArray(mentorsResponse.users)) {
        usersArray = mentorsResponse.users
        console.log('🔍 从response.users提取用户数组:', usersArray.length, '个用户')
      } else {
        console.warn('⚠️ 无法从响应中提取用户数据:', mentorsResponse)
      }
      
      if (usersArray.length > 0) {
        console.log('🔍 原始用户数据数量:', usersArray.length)
        
        // 获取当前项目学员的ID列表，用于排除
        const studentIds = students.value.map(student => student.id)
        console.log('🔍 项目学员ID列表:', studentIds)
        
        // 过滤掉当前项目的学员
        const availableUsers = usersArray.filter(user => !studentIds.includes(user.id))
        console.log('🔍 排除学员后的用户数据:', availableUsers.length, '个用户')
        
        mentors.value = availableUsers.map((user: any) => ({
          id: user.id,
          name: user.name || user.username || '未知用户',
          email: user.email || '',
          department: user.department || '未知部门',
          position: user.position || '用户',
          status: user.status || 'active'
        }))
        console.log('✅ 带教老师数据加载成功:', mentors.value.length, '名带教老师')
        console.log('🔍 最终带教老师列表:', mentors.value)
      } else {
        mentors.value = []
        console.warn('⚠️ 用户数据为空或格式不正确:', mentorsResponse)
      }
    } catch (error) {
      console.error('⚠️ 加载带教老师数据失败:', error)
      // 如果getAllUsers失败，尝试使用searchUsers作为备选
      try {
        console.log('🔍 尝试使用searchUsers作为备选...')
        const backupUsers = await searchUsers({ limit: 200 })
        const studentIds = students.value.map(student => student.id)
        const availableUsers = backupUsers.filter(user => !studentIds.includes(user.id))
        
        mentors.value = availableUsers.map((user: any) => ({
          id: user.id,
          name: user.name || user.username || '未知用户',
          email: user.email || '',
          department: user.department || '未知部门',
          position: user.position || '用户',
          status: user.status || 'active'
        }))
        console.log('✅ 使用备选方案加载带教老师数据成功:', mentors.value.length, '名带教老师')
      } catch (backupError) {
        console.error('⚠️ 备选方案也失败了:', backupError)
        mentors.value = []
      }
    }
    
  } catch (error) {
    console.error('❌ 加载师徒阶段数据失败:', error)
    ElMessage.error('加载阶段数据失败')
  } finally {
    loading.value = false
  }
}

// 组件挂载时加载数据
onMounted(async () => {
  // 🔧 确保加载项目任务数据（包含阶段信息）
  if (props.projectId && props.projectId !== 'new') {
    await trainingStageStore.loadProjectTasks(props.projectId)
  }
  
  await loadProjectMentorshipPhases()
})

// 工具函数
const formatDate = (date: string | Date) => {
  if (!date) return '-'
  const d = new Date(date)
  return d.toLocaleDateString('zh-CN')
}

const getStatusType = (status: string) => {
  const typeMap: Record<string, string> = {
    active: 'success',
    pending: 'warning',
    planned: 'info',
    completed: 'info'
  }
  return typeMap[status] || 'info'
}

const getStatusText = (status: string) => {
  const textMap: Record<string, string> = {
    active: '未出师',
    pending: '未出师',
    planned: '未出师',
    completed: '出师',
    graduated: '出师',
    terminated: '已终止'
  }
  return textMap[status] || '未出师'
}

// 监听对话框关闭，重置表单
watch(showChangeMentorDialog, (newVal) => {
  if (!newVal) {
    // 对话框关闭时重置表单
    changeMentorForm.value = {
      newMentorId: '',
      reason: ''
    }
  }
})

// 监听详情对话框关闭，重置选中的师徒关系
watch(showDetailsDialog, (newVal) => {
  if (!newVal) {
    selectedAssignment.value = null
  }
})

// 刷新数据的包装函数
const refreshData = async () => {
  await loadProjectMentorshipPhases()
}
</script>

<style scoped>
.phase-assignment-management {
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
  gap: 12px;
}

.phase-info-tip {
  margin-bottom: 20px;
}

.phases-container {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.phase-card {
  background: white;
  border-radius: 8px;
  border: 1px solid #e4e7ed;
  overflow: hidden;
}

.phase-header {
  padding: 16px 20px;
  background: #f8f9fa;
  border-bottom: 1px solid #e4e7ed;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

.phase-title-section {
  display: flex;
  flex-direction: column;
  gap: 12px;
  flex: 1;
}

.phase-title {
  display: flex;
  align-items: center;
  gap: 12px;
}

.phase-name {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}

.phase-meta {
  display: flex;
  gap: 16px;
  font-size: 14px;
  color: #606266;
}

.phase-content {
  padding: 20px;
}

/* 阶段信息内联样式 */
.phase-info-inline {
  display: flex;
  flex-direction: column;
  gap: 8px;
  
  .info-description {
    display: flex;
    margin-bottom: 0;
    
    .label {
      color: #606266;
      font-size: 14px;
      min-width: 80px;
      font-weight: 500;
    }
    
    .value {
      flex: 1;
      color: #303133;
      font-size: 14px;
      line-height: 1.4;
    }
  }
  
  .info-meta {
    display: flex;
    align-items: center;
    gap: 12px;
    font-size: 13px;
    color: #909399;
    
    .meta-item {
      display: flex;
      align-items: center;
      
      .label {
        font-weight: 500;
        margin-right: 4px;
      }
      
      .value {
        color: #606266;
      }
    }
    
    .meta-separator {
      color: #dcdfe6;
      font-weight: normal;
    }
  }
}

.assignments-list {
  margin-top: 16px;
}

.mentor-info, .student-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.mentor-info .name, .student-info .name {
  font-weight: 500;
  color: #303133;
}

.mentor-info .department, .student-info .department {
  font-size: 12px;
  color: #909399;
}

.assignment-actions {
  display: flex;
  gap: 8px;
  align-items: center;
}

.more-btn {
  color: #606266;
}

/* 保留原有样式作为备用 */
.no-assignments {
  padding: 40px 20px;
  text-align: center;
}

/* 🔧 新增：紧凑的空状态显示 */
.empty-assignments-compact {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  color: #909399;
  background-color: #fafafa;
  border-radius: 4px;
  min-height: 80px;
}

.empty-text {
  font-size: 14px;
  line-height: 1.5;
}

:deep(.el-button + .el-button) {
  margin-left: 8px;
}

.assignment-details {
  .detail-row {
    display: flex;
    margin-bottom: 16px;
    
    .label {
      font-weight: bold;
      min-width: 120px;
      color: #606266;
    }
    
    .value {
      flex: 1;
      color: #303133;
    }
  }
}
</style> 