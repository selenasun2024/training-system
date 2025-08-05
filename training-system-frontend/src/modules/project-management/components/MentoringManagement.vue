<template>
  <div class="mentoring-management">
    <!-- 数据加载中 -->
    <div v-if="loading" class="loading-container">
      <el-skeleton :rows="5" animated />
    </div>

    <!-- Tab布局和编辑按钮 -->
    <div v-else class="tabs-container">
      <!-- Tab导航 -->
      <el-tabs v-model="activeTab" class="task-tabs">
        <!-- Tab1: 指派关系 -->
        <el-tab-pane label="指派关系" name="assignments">
          <AssignmentRelationTab
            :key="`assignment-${componentKey}`"
            :project-id="projectId"
            :students="students"
            :mentors="mentors"
            :relationships="relationships"
            :project-phases="projectPhases"
            @assignment-created="handleAssignmentCreated"
            @relationship-removed="handleRelationshipDeleted"
            @mentor-changed="handleMentorChanged"
          />
        </el-tab-pane>

        <!-- Tab2: 任务状态 -->
        <el-tab-pane label="任务状态" name="progress">
          <StudentTaskProgressTab
            :project-id="projectId"
            :mentors="mentors"
            :relationships="relationships"
          />
        </el-tab-pane>

        <!-- Tab3: 带教评价 -->
        <el-tab-pane label="带教评价" name="evaluations">
          <ProjectEvaluationTab
            :project-id="projectId"
            :relationships="relationships"
            :students="students"
            :mentors="mentors"
            @switch-tab="handleTabSwitch"
          />
        </el-tab-pane>

        <!-- Tab4: 带教标准 -->
        <el-tab-pane label="带教标准" name="standards">
          <ProjectStandardsTab
            :project-id="projectId"
          />
        </el-tab-pane>
      </el-tabs>
      
      <!-- Tab行编辑按钮 -->
      <div class="tab-edit-button">
        <!-- 根据需要可以在这里添加编辑按钮 -->
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, provide, nextTick } from 'vue'
import { ElMessage } from 'element-plus'
import AssignmentRelationTab from './mentorship/AssignmentRelationTab.vue'
import StudentTaskProgressTab from './mentorship/StudentTaskProgressTab.vue'
import ProjectEvaluationTab from './mentorship/ProjectEvaluationTab.vue'
import ProjectStandardsTab from './mentorship/ProjectStandardsTab.vue'
import type { 
  Student, 
  Mentor, 
  ProjectMentorRelationship, 
  MentorWorkload,
  ProjectPhase
} from './mentorship/types/mentorship'
import { 
  getProjectRelationships,
  getMentorshipProgress,
  getProjectEvaluations,
  getMentorshipStandards,
  createMentorshipRelationship,
  submitMentorshipEvaluation,
  getProjectParticipants,
  getAllUsers,
  getAvailableMentors
} from '@/api/modules/project-mentorship'
import { getProject } from '@/api/modules/project'

// Props
const props = defineProps<{
  projectId?: string
}>()

// 响应式数据
const activeTab = ref('assignments')
const students = ref<Student[]>([])
const mentors = ref<Mentor[]>([])
const relationships = ref<ProjectMentorRelationship[]>([])
const projectPhases = ref<ProjectPhase[]>([])
const projectInfo = ref<any>(null)
const loading = ref(false)

// 强制更新key
const componentKey = ref(0)

// 方法
const loadData = async () => {
  loading.value = true
  try {
    console.log('🔄 开始加载项目带教数据 - 项目ID:', props.projectId)
    
    if (!props.projectId) {
      console.warn('⚠️ 项目ID为空，无法加载数据')
      return
    }

    // 获取项目基本信息
    try {
      projectInfo.value = await getProject(props.projectId)
      console.log('✅ 项目信息加载成功:', projectInfo.value)
    } catch (error) {
      console.error('❌ 获取项目信息失败:', error)
    }
    
    // 并行加载其他数据
    await Promise.all([
      loadRelationships(),
      loadStudentsAndMentors()
    ])
    
    console.log('✅ 项目带教数据加载完成')
  } catch (error) {
    console.error('❌ 加载项目带教数据失败:', error)
    ElMessage.error('加载数据失败，请稍后重试')
  } finally {
    loading.value = false
  }
}

// 加载师徒关系数据
const loadRelationships = async () => {
  if (!props.projectId) {
    console.warn('⚠️ 项目ID为空，无法加载师徒关系')
    return
  }
  
  try {
    console.log('🔍 加载项目师徒关系...')
    const response = await getProjectRelationships(props.projectId)
    relationships.value = response || []
    console.log(`✅ 加载师徒关系成功，共${relationships.value.length}条记录`)
  } catch (error) {
    console.error('❌ 加载师徒关系失败:', error)
    relationships.value = []
  }
}

// 加载进度数据
const loadProgressData = async () => {
  if (!props.projectId) {
    console.warn('⚠️ 项目ID为空，无法加载进度数据')
    return
  }
  
  try {
    console.log('🔍 加载带教进度数据...')
    const response = await getMentorshipProgress(props.projectId)
    // 可以存储到合适的响应式变量中
    console.log('✅ 加载进度数据成功:', response)
  } catch (error) {
    console.error('❌ 加载进度数据失败:', error)
  }
}

// 加载评价数据
const loadEvaluationData = async () => {
  if (!props.projectId) {
    console.warn('⚠️ 项目ID为空，无法加载评价数据')
    return
  }
  
  try {
    console.log('🔍 加载带教评价数据...')
    const response = await getProjectEvaluations(props.projectId)
    // 可以存储到合适的响应式变量中
    console.log('✅ 加载评价数据成功:', response)
  } catch (error) {
    console.error('❌ 加载评价数据失败:', error)
  }
}

// 加载标准数据
const loadStandardsData = async () => {
  if (!props.projectId) {
    console.warn('⚠️ 项目ID为空，无法加载标准数据')
    return
  }
  
  try {
    console.log('🔍 加载带教标准数据...')
    const response = await getMentorshipStandards(props.projectId)
    // 可以存储到合适的响应式变量中
    console.log('✅ 加载标准数据成功:', response)
  } catch (error) {
    console.error('❌ 加载标准数据失败:', error)
  }
}

// 加载真实的学员和导师数据
const loadStudentsAndMentors = async () => {
  if (!props.projectId) {
    console.warn('⚠️ 项目ID为空，无法加载学员和导师数据')
    return
  }

  try {
    console.log('🔍 加载项目学员和导师数据...')
    
    // 并行加载学员和导师数据
    const [studentsResponse, mentorsResponse] = await Promise.all([
      // 获取项目参与者（学员）
      getProjectParticipants(props.projectId).catch(error => {
        console.warn('⚠️ 获取项目参与者失败，使用Mock数据:', error)
        return null
      }),
      // 获取所有用户作为可选导师
      getAllUsers().catch(error => {
        console.warn('⚠️ 获取所有用户失败，使用Mock数据:', error)
        return null
      })
    ])

    // 处理学员数据 - 只显示角色为STUDENT的项目参与者
    if (studentsResponse && Array.isArray(studentsResponse)) {
      console.log('🔍 原始参与者数据:', studentsResponse)
      
      // 筛选出学员角色的参与者
      const studentParticipants = studentsResponse.filter(participant => 
        participant.role === 'STUDENT' && participant.status === 'ACTIVE'
      )
      
      console.log('🔍 筛选出的学员参与者:', studentParticipants)
      
      students.value = studentParticipants.map((participant: any) => ({
        id: participant.userId || participant.id,
        name: participant.user?.name || participant.name || '未知学员',
        email: participant.user?.email || participant.email || '',
        avatar: participant.user?.avatar || participant.avatar || '',
        department: participant.user?.department || participant.department || '未知部门',
        position: participant.user?.position || participant.position || '学员',
        entryDate: participant.user?.entryDate || participant.entryDate ? new Date(participant.user?.entryDate || participant.entryDate) : new Date(),
        status: participant.status || 'active',
        studentId: participant.userId || participant.id,
        level: participant.user?.level || 'junior',
        skills: participant.user?.skills || [],
        learningGoals: [],
        trainingProjects: [],
        mentorshipProjects: [],
        growthProfileId: `growth-${participant.userId || participant.id}`
      }))
      console.log(`✅ 加载项目学员成功，共${students.value.length}名`)
    } else {
      console.warn('⚠️ 学员数据格式异常或为空，使用Mock数据')
      loadMockStudents()
    }

    // 处理导师数据 - 显示所有可选用户，但排除当前项目的学员
    console.log('🔍 导师数据原始响应:', mentorsResponse)
    
    // 处理API返回的数据格式：可能是数组或包含users字段的对象
    let usersArray = []
    if (Array.isArray(mentorsResponse)) {
      usersArray = mentorsResponse
    } else if (mentorsResponse && mentorsResponse.users && Array.isArray(mentorsResponse.users)) {
      usersArray = mentorsResponse.users
      console.log('🔍 从response.users提取用户数组:', usersArray.length, '个用户')
    } else {
      console.warn('⚠️ 无法从响应中提取导师数据:', mentorsResponse)
    }
    
    if (usersArray.length > 0) {
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
        avatar: user.avatar || '',
        department: user.department || '未知部门',
        position: user.position || '用户',
        entryDate: user.entryDate ? new Date(user.entryDate) : new Date(),
        status: user.status || 'active',
        mentorId: user.id,
        expertise: user.skills || [],
        certifications: [],
        currentLoad: 0,
        maxLoad: 5,
        rating: 0,
        trainingMentorships: [],
        mentorshipProjects: [],
        mentorStyle: 'balanced',
        availability: {
          weekdays: ['周一', '周二', '周三', '周四', '周五'],
          timeSlots: ['上午 9:00-12:00', '下午 14:00-17:00']
        }
      }))
      console.log(`✅ 加载可选导师成功，共${mentors.value.length}名（已排除${studentIds.length}名学员）`)
    } else {
      console.warn('⚠️ 导师数据格式异常或为空，使用Mock数据')
      loadMockMentors()
    }

  } catch (error) {
    console.error('❌ 加载学员和导师数据失败:', error)
    loadMockStudents()
    loadMockMentors()
  }
}

// Mock数据降级方案
const loadMockStudents = () => {
  console.log('🔄 使用Mock学员数据')
  students.value = [
    {
      id: 'user-hr-001',
      name: '冯芹',
      email: 'fengqin@company.com',
      avatar: '',
      department: '人事部',
      position: '人事专员',
      entryDate: new Date('2023-01-15'),
      status: 'active',
      studentId: 'user-hr-001',
      level: 'junior',
      skills: ['人力资源管理', '绩效考核'],
      learningGoals: [],
      trainingProjects: [],
      mentorshipProjects: [],
      growthProfileId: 'growth-user-hr-001'
    },
    {
      id: 'user-market-001',
      name: '吴静',
      email: 'wujing@company.com',
      avatar: '',
      department: '市场部',
      position: '市场专员',
      entryDate: new Date('2023-02-01'),
      status: 'active',
      studentId: 'user-market-001',
      level: 'junior',
      skills: ['市场分析', '品牌推广'],
      learningGoals: [],
      trainingProjects: [],
      mentorshipProjects: [],
      growthProfileId: 'growth-user-market-001'
    },
    {
      id: 'user-prod-001',
      name: '赵敏',
      email: 'zhaomin@company.com',
      avatar: '',
      department: '产品部',
      position: '产品经理',
      entryDate: new Date('2023-03-01'),
      status: 'active',
      studentId: 'user-prod-001',
      level: 'intermediate',
      skills: ['产品设计', '需求分析'],
      learningGoals: [],
      trainingProjects: [],
      mentorshipProjects: [],
      growthProfileId: 'growth-user-prod-001'
    }
  ]
}

const loadMockMentors = () => {
  console.log('🔄 使用Mock导师数据')
  mentors.value = [
    {
      id: 'counselor-001',
      name: '李辅导员',
      email: 'lilaoshi@company.com',
      avatar: '',
      department: '教务部',
      position: '高级辅导员',
      entryDate: new Date('2020-01-01'),
      status: 'active',
      mentorId: 'counselor-001',
      expertise: ['项目管理', '团队建设', '职业规划'],
      certifications: ['PMP项目管理认证'],
      currentLoad: 2,
      maxLoad: 5,
      rating: 4.8,
      trainingMentorships: [],
      mentorshipProjects: [],
      mentorStyle: 'balanced',
      availability: {
        weekdays: ['周一', '周二', '周三', '周四', '周五'],
        timeSlots: ['上午 9:00-12:00', '下午 14:00-17:00']
      }
    },
    {
      id: 'counselor-002',
      name: '张辅导员',
      email: 'zhanglaoshi@company.com',
      avatar: '',
      department: '教务部',
      position: '资深辅导员',
      entryDate: new Date('2019-06-01'),
      status: 'active',
      mentorId: 'counselor-002',
      expertise: ['技术指导', '能力培养', '绩效提升'],
      certifications: ['高级培训师'],
      currentLoad: 3,
      maxLoad: 6,
      rating: 4.6,
      trainingMentorships: [],
      mentorshipProjects: [],
      mentorStyle: 'structured',
      availability: {
        weekdays: ['周一', '周二', '周三', '周四', '周五'],
        timeSlots: ['上午 8:30-12:00', '下午 13:30-17:30']
      }
    },
    {
      id: 'user-admin-001',
      name: '系统管理员',
      email: 'admin@company.com',
      avatar: '',
      department: '系统管理部',
      position: '技术总监',
      entryDate: new Date('2018-01-01'),
      status: 'active',
      mentorId: 'user-admin-001',
      expertise: ['系统架构', '技术管理', '团队领导'],
      certifications: ['系统架构师'],
      currentLoad: 1,
      maxLoad: 3,
      rating: 4.9,
      trainingMentorships: [],
      mentorshipProjects: [],
      mentorStyle: 'technical',
      availability: {
        weekdays: ['周一', '周二', '周三', '周四', '周五'],
        timeSlots: ['上午 9:00-12:00', '下午 14:00-18:00']
      }
    }
  ]
}

// 模拟项目阶段数据
const loadMockProjectPhases = () => {
  projectPhases.value = [
    {
      id: 'phase1',
      name: '入门阶段',
      description: '基础技能学习和环境熟悉',
      order: 1,
      duration: 4,
      status: 'completed'
    },
    {
      id: 'phase2',
      name: '提升阶段',
      description: '进阶技能和实践项目',
      order: 2,
      duration: 6,
      status: 'active'
    },
    {
      id: 'phase3',
      name: '独立阶段',
      description: '独立完成复杂任务',
      order: 3,
      duration: 2,
      status: 'pending'
    }
  ]
}

// 模拟工作负载数据
const loadMockWorkloadData = () => {
  // This function is no longer used as workloadData is removed.
  // Keeping it for now as it might be re-introduced or removed later.
  // workloadData.value = [
  //   {
  //     mentorId: 'mentor1',
  //     mentorName: '王老师',
  //     currentStudents: 3,
  //     maxCapacity: 5,
  //     utilizationRate: 60,
  //     avgStudentRating: 4.8,
  //     workloadTrend: 'stable'
  //   },
  //   {
  //     mentorId: 'mentor2',
  //     mentorName: '李老师',
  //     currentStudents: 2,
  //     maxCapacity: 4,
  //     utilizationRate: 50,
  //     avgStudentRating: 4.6,
  //     workloadTrend: 'decreasing'
  //   }
  // ]
}

// 事件处理函数
const handleAssignmentCreated = async (assignmentData: any) => {
  console.log('📝 处理师徒关系创建:', assignmentData)
  
  if (!props.projectId) {
    ElMessage.error('项目ID不存在，无法创建师徒关系')
    return
  }
  
  try {
    // 调用API创建师徒关系
    const response = await createMentorshipRelationship(props.projectId, {
      mentorId: assignmentData.mentorId,
      studentId: assignmentData.studentId,
      type: assignmentData.type || 'PROJECT_BASED',
      matchingType: assignmentData.matchingType || 'MANUAL',
      matchingScore: assignmentData.matchingScore,
      matchingReasons: assignmentData.matchingReasons || []
    })
    
    console.log('✅ 师徒关系创建成功:', response)
    ElMessage.success('师徒关系创建成功！')
    
    // 重新加载关系数据
    await loadRelationships()
  } catch (error) {
    console.error('❌ 创建师徒关系失败:', error)
    ElMessage.error('创建师徒关系失败，请稍后重试')
  }
}

const handleRelationshipDeleted = async (relationshipId: string) => {
  console.log('🗑️ 处理师徒关系删除:', relationshipId)
  
  try {
    // 重新加载关系数据以获取最新状态
    await loadRelationships()
    console.log('✅ 师徒关系数据已重新加载')
  } catch (error) {
    console.error('❌ 重新加载师徒关系数据失败:', error)
    ElMessage.error('更新数据失败，请刷新页面')
  }
}

const handleEvaluationSubmitted = async (evaluationData: any) => {
  console.log('📝 处理评价提交:', evaluationData)
  
  if (!props.projectId) {
    ElMessage.error('项目ID不存在，无法提交评价')
    return
  }
  
  try {
    // 调用API提交评价
    const response = await submitMentorshipEvaluation(props.projectId, evaluationData)
    
    console.log('✅ 评价提交成功:', response)
    ElMessage.success('评价提交成功！')
    
    // 重新加载评价数据
    await loadEvaluationData()
  } catch (error) {
    console.error('❌ 提交评价失败:', error)
    ElMessage.error('提交评价失败，请稍后重试')
  }
}

const handleProgressUpdate = async () => {
  console.log('🔄 处理进度更新')
  
  try {
    // 重新加载进度数据
    await loadProgressData()
    ElMessage.success('进度数据已更新')
  } catch (error) {
    console.error('❌ 更新进度失败:', error)
    ElMessage.error('更新进度失败，请稍后重试')
  }
}

const handleAddStudents = () => {
  ElMessage.info('添加学员功能：应该跳转到学员管理页面')
  // 实际开发中可以跳转到学员管理或打开学员选择对话框
}

const handleTabSwitch = (tabName: string) => {
  activeTab.value = tabName
}

const handleMentorChanged = async (data: any) => {
  console.log('🔄 处理导师变更:', data)
  
  try {
    // 先立即更新本地数据以改善用户体验
    if (data.relationshipId) {
      const relationshipIndex = relationships.value.findIndex(rel => rel.id === data.relationshipId)
      if (relationshipIndex !== -1) {
        // 创建新的关系对象以触发响应性更新
        const updatedRelationship = { ...relationships.value[relationshipIndex] }
        
        // 根据操作类型更新不同字段
        if (data.action === 'change_mentor' && data.newMentorId && data.newMentorName) {
          updatedRelationship.mentorId = data.newMentorId
          updatedRelationship.mentorName = data.newMentorName
          console.log('✅ 导师信息已立即更新')
        } else if (data.action === 'graduate' && data.newStatus) {
          updatedRelationship.status = data.newStatus
          console.log('✅ 出师状态已立即更新')
        }
        
        // 更新数组中的关系
        relationships.value[relationshipIndex] = updatedRelationship
        console.log('✅ 本地数据已立即更新')
      }
    }
    
    // 强制重新渲染组件
    componentKey.value++
    await nextTick()
    
    // 然后重新加载最新数据以确保同步
    await loadRelationships()
    console.log('✅ 导师变更后数据已重新加载')
    
    // 根据操作类型显示不同的成功消息
    if (data.action === 'change_mentor') {
      ElMessage.success('带教老师更换成功！列表已更新')
    } else if (data.action === 'graduate') {
      ElMessage.success('学员出师成功！状态已更新')
    }
  } catch (error) {
    console.error('❌ 重新加载师徒关系数据失败:', error)
    ElMessage.error('更新数据失败，请刷新页面')
  }
}

// 对外暴露的刷新方法
const refreshData = async () => {
  console.log('🔄 刷新项目带教数据')
  await loadData()
}

// 为子组件提供项目ID
provide('projectId', props.projectId)

// 生命周期
onMounted(() => {
  loadData()
})

// 为了便于调试，暴露数据到控制台
if (import.meta.env.DEV) {
  ;(window as any).mentorshipDebug = {
    projectId: props.projectId,
    relationships,
    students,
    mentors,
    refreshData
  }
}
</script>

<style scoped>
.mentoring-management {
  padding: 20px;
  background: #fff;
}

.tabs-container {
  position: relative;
}

.tab-edit-button {
  position: absolute;
  top: 8px;
  right: 15px;
  z-index: 10;
}

.tab-content {
  padding: 20px;
  min-height: 400px;
}

.loading-container {
  padding: 40px;
}

:deep(.el-tabs__content) {
  overflow: visible;
}

:deep(.el-tab-pane) {
  padding: 0;
}
</style> 