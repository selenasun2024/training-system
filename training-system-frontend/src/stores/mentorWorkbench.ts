import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

// 类型定义
export interface StudentInfo {
  id: string
  name: string
  avatar: string
  employeeId: string
  department: string
  position: string
  entryDate: string
  projectId: string
  projectName: string
  status: 'active' | 'completed' | 'paused' | 'terminated'
  progress: number
  currentPhase: string
  lastCommunication: string
  nextMilestone: string
  mentorshipStartDate: string
}

export interface CommunicationRecord {
  id: string
  studentId: string
  studentName: string
  type: 'meeting' | 'call' | 'email' | 'chat' | 'feedback'
  title: string
  content: string
  date: string
  duration?: number
  outcome: string
  nextActions: string[]
  attachments?: string[]
}

export interface Evaluation {
  id: string
  studentId: string
  studentName: string
  type: 'probation' | 'monthly' | 'quarterly' | 'annual'
  dueDate: string
  status: 'pending' | 'in_progress' | 'completed' | 'overdue'
  score?: number
  feedback?: string
  dimensions: {
    recognition: number
    skills: number
    culture: number
  }
}

export interface MentorshipPlan {
  id: string
  studentId: string
  title: string
  type: 'standard' | 'customized'
  phases: PlanPhase[]
  totalDuration: number
  status: 'draft' | 'active' | 'completed'
  createdDate: string
  lastUpdated: string
}

export interface PlanPhase {
  id: string
  name: string
  duration: number
  objectives: string[]
  tasks: PlanTask[]
  milestones: string[]
  status: 'pending' | 'active' | 'completed'
}

export interface PlanTask {
  id: string
  title: string
  description: string
  type: 'learning' | 'practice' | 'assessment'
  estimatedHours: number
  dueDate: string
  status: 'not_started' | 'in_progress' | 'completed' | 'overdue'
  priority: 'low' | 'medium' | 'high'
}

export interface HomeworkSubmission {
  id: string
  studentId: string
  title: string
  description: string
  subject: 'professional' | 'theory' | 'practice'
  submittedAt: string
  dueDate: string
  status: 'pending' | 'reviewed' | 'needs-revision'
  score: number | null
  maxScore: number
  comment?: string
  attachments: string[]
}

export interface ExamSubmission {
  id: string
  studentId: string
  title: string
  type: 'stage' | 'midterm' | 'final' | 'skill'
  examTime: string
  duration: number
  status: 'pending' | 'reviewed' | 'abnormal'
  score: number | null
  maxScore: number
  comment?: string
  reviewedAt?: string
}

export interface MentorStats {
  activeStudents: number
  totalStudents: number
  averageProgress: number
  completedEvaluations: number
  pendingEvaluations: number
  thisWeekCommunications: number
  totalCommunications: number
  successRate: number
}

export const useMentorWorkbenchStore = defineStore('mentorWorkbench', () => {
  // 状态
  const currentMentor = ref<{ id: string; name: string; avatar: string } | null>(null)
  const myStudents = ref<StudentInfo[]>([])
  const activePlans = ref<MentorshipPlan[]>([])
  const pendingEvaluations = ref<Evaluation[]>([])
  const pendingHomeworks = ref<HomeworkSubmission[]>([])
  const pendingExams = ref<ExamSubmission[]>([])
  const pendingTasks = ref<any[]>([])
  const communicationRecords = ref<CommunicationRecord[]>([])
  const isLoading = ref(false)
  const lastRefreshTime = ref<Date | null>(null)

  // 计算属性
  const activeStudentCount = computed(() => 
    myStudents.value.filter(s => s.status === 'active').length
  )

  const averageProgress = computed(() => {
    const activeStudents = myStudents.value.filter(s => s.status === 'active')
    if (activeStudents.length === 0) return 0
    const totalProgress = activeStudents.reduce((sum, student) => sum + student.progress, 0)
    return Math.round(totalProgress / activeStudents.length)
  })

  const overdueEvaluations = computed(() => 
    pendingEvaluations.value.filter(e => {
      const dueDate = new Date(e.dueDate)
      return dueDate < new Date() && e.status === 'pending'
    })
  )

  const recentCommunications = computed(() => 
    communicationRecords.value
      .filter(record => {
        const recordDate = new Date(record.date)
        const weekAgo = new Date()
        weekAgo.setDate(weekAgo.getDate() - 7)
        return recordDate >= weekAgo
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 5)
  )

  const mentorStats = computed<MentorStats>(() => ({
    activeStudents: activeStudentCount.value,
    totalStudents: myStudents.value.length,
    averageProgress: averageProgress.value,
    completedEvaluations: pendingEvaluations.value.filter(e => e.status === 'completed').length,
    pendingEvaluations: pendingEvaluations.value.filter(e => e.status === 'pending').length,
    thisWeekCommunications: recentCommunications.value.length,
    totalCommunications: communicationRecords.value.length,
    successRate: calculateSuccessRate()
  }))

  // 辅助函数
  const calculateSuccessRate = (): number => {
    const completedStudents = myStudents.value.filter(s => s.status === 'completed')
    if (myStudents.value.length === 0) return 0
    return Math.round((completedStudents.length / myStudents.value.length) * 100)
  }

  // Actions
  const initializeMentorData = async (mentorId: string) => {
    isLoading.value = true
    try {
      // 并行加载所有数据
      await Promise.all([
        loadMentorInfo(mentorId),
        loadMyStudents(mentorId),
        loadMentorshipPlans(mentorId),
        loadPendingEvaluations(mentorId),
        loadPendingHomeworks(mentorId),
        loadPendingExams(mentorId),
        loadPendingTasks(mentorId),
        loadCommunicationRecords(mentorId)
      ])
      
      lastRefreshTime.value = new Date()
      console.log('🎯 导师工作台数据初始化完成')
    } catch (error) {
      console.error('❌ 初始化导师数据失败:', error)
      throw error
    } finally {
      isLoading.value = false
    }
  }

  const loadMentorInfo = async (mentorId: string) => {
    // TODO: 替换为真实API调用
    currentMentor.value = {
      id: mentorId,
      name: '张老师',
      avatar: '/avatars/mentor-001.jpg'
    }
  }

  const loadMyStudents = async (mentorId: string) => {
    // TODO: 替换为真实API调用
    const mockStudents: StudentInfo[] = [
      {
        id: 'student-001',
        name: '李小明',
        avatar: '/avatars/student-001.jpg',
        employeeId: 'EMP2024001',
        department: '技术部',
        position: 'Java开发工程师',
        entryDate: '2024-01-15',
        projectId: 'project-001',
        projectName: 'Java开发工程师培养',
        status: 'active',
        progress: 75,
        currentPhase: '第三阶段 - 实战项目',
        lastCommunication: '2024-01-20',
        nextMilestone: '90天评价',
        mentorshipStartDate: '2024-01-15'
      },
      {
        id: 'student-002',
        name: '王小红',
        avatar: '/avatars/student-002.jpg',
        employeeId: 'EMP2024002',
        department: '技术部',
        position: 'Vue开发工程师',
        entryDate: '2024-02-01',
        projectId: 'project-002',
        projectName: '前端开发工程师培养',
        status: 'active',
        progress: 45,
        currentPhase: '第二阶段 - 基础学习',
        lastCommunication: '2024-01-18',
        nextMilestone: '60天评价',
        mentorshipStartDate: '2024-02-01'
      },
      {
        id: 'student-003',
        name: '陈小华',
        avatar: '/avaters/student-003.jpg',
        employeeId: 'EMP2023015',
        department: '技术部',
        position: 'Python开发工程师',
        entryDate: '2023-12-01',
        projectId: 'project-003',
        projectName: 'Python开发工程师培养',
        status: 'completed',
        progress: 100,
        currentPhase: '已完成',
        lastCommunication: '2024-01-10',
        nextMilestone: '年度总结',
        mentorshipStartDate: '2023-12-01'
      }
    ]
    
    myStudents.value = mockStudents
  }

  const loadMentorshipPlans = async (mentorId: string) => {
    // TODO: 替换为真实API调用
    const mockPlans: MentorshipPlan[] = [
      {
        id: 'plan-001',
        studentId: 'student-001',
        title: 'Java开发工程师带教计划',
        type: 'standard',
        totalDuration: 90,
        status: 'active',
        createdDate: '2024-01-15',
        lastUpdated: '2024-01-20',
        phases: [
          {
            id: 'phase-001',
            name: '基础认知阶段',
            duration: 30,
            objectives: ['了解公司文化', '掌握开发规范', '熟悉工作环境'],
            tasks: [],
            milestones: ['30天评价'],
            status: 'completed'
          },
          {
            id: 'phase-002',
            name: '技能培养阶段',
            duration: 30,
            objectives: ['掌握核心技术栈', '完成基础项目', '培养团队协作'],
            tasks: [],
            milestones: ['60天评价'],
            status: 'completed'
          },
          {
            id: 'phase-003',
            name: '实战提升阶段',
            duration: 30,
            objectives: ['独立承担模块', '代码质量优化', '技术分享'],
            tasks: [],
            milestones: ['90天评价', '转正评估'],
            status: 'active'
          }
        ]
      }
    ]
    
    activePlans.value = mockPlans
  }

  const loadPendingEvaluations = async (mentorId: string) => {
    // TODO: 替换为真实API调用
    const mockEvaluations: Evaluation[] = [
      {
        id: 'eval-001',
        studentId: 'student-001',
        studentName: '李小明',
        type: 'quarterly',
        dueDate: '2024-01-25',
        status: 'pending',
        dimensions: {
          recognition: 0,
          skills: 0,
          culture: 0
        }
      },
      {
        id: 'eval-002',
        studentId: 'student-002',
        studentName: '王小红',
        type: 'monthly',
        dueDate: '2024-01-30',
        status: 'pending',
        dimensions: {
          recognition: 0,
          skills: 0,
          culture: 0
        }
      }
    ]
    
    pendingEvaluations.value = mockEvaluations
  }

  const loadCommunicationRecords = async (mentorId: string) => {
    // TODO: 替换为真实API调用
    const mockRecords: CommunicationRecord[] = [
      {
        id: 'comm-001',
        studentId: 'student-001',
        studentName: '李小明',
        type: 'meeting',
        title: '项目进度讨论',
        content: '讨论了当前项目进度，学员在Spring Boot方面还需要加强学习...',
        date: '2024-01-20',
        duration: 30,
        outcome: '明确了学习重点和下阶段目标',
        nextActions: ['完成Spring Boot练习项目', '准备技术分享'],
        attachments: []
      },
      {
        id: 'comm-002',
        studentId: 'student-002',
        studentName: '王小红',
        type: 'feedback',
        title: '代码评审反馈',
        content: '对学员提交的Vue组件进行了详细评审...',
        date: '2024-01-18',
        outcome: '指出了代码优化方向',
        nextActions: ['重构组件代码', '学习Vue3 Composition API'],
        attachments: ['code-review.md']
      }
    ]
    
    communicationRecords.value = mockRecords
  }

  // 刷新方法
  const refreshMentorStats = async () => {
    if (currentMentor.value) {
      await loadMyStudents(currentMentor.value.id)
      await loadPendingEvaluations(currentMentor.value.id)
      await loadCommunicationRecords(currentMentor.value.id)
    }
  }

  const refreshPendingEvaluations = async () => {
    if (currentMentor.value) {
      await loadPendingEvaluations(currentMentor.value.id)
    }
  }

  const refreshCommunicationRecords = async () => {
    if (currentMentor.value) {
      await loadCommunicationRecords(currentMentor.value.id)
    }
  }

  // 数据操作方法
  const addCommunicationRecord = async (record: Omit<CommunicationRecord, 'id'>) => {
    // TODO: 替换为真实API调用
    const newRecord: CommunicationRecord = {
      ...record,
      id: `comm-${Date.now()}`
    }
    
    communicationRecords.value.unshift(newRecord)
    console.log('✅ 沟通记录添加成功:', newRecord.title)
  }

  const updateEvaluationStatus = async (evaluationId: string, status: Evaluation['status']) => {
    // TODO: 替换为真实API调用
    const evaluation = pendingEvaluations.value.find(e => e.id === evaluationId)
    if (evaluation) {
      evaluation.status = status
      console.log('✅ 评价状态更新成功:', evaluationId)
    }
  }

  const updateStudentProgress = async (studentId: string, progress: number) => {
    // TODO: 替换为真实API调用
    const student = myStudents.value.find(s => s.id === studentId)
    if (student) {
      student.progress = progress
      console.log('✅ 学员进度更新成功:', studentId, progress)
    }
  }

  // 数据同步方法 (用于跨模块数据打通)
  const syncFromProject = async (projectId: string) => {
    // 从项目模块同步带教相关数据
    console.log('🔄 从项目模块同步数据:', projectId)
    // TODO: 实现与项目管理模块的数据同步
  }

  const syncToPersonalCenter = async (studentId: string) => {
    // 同步数据到学员学习中心
    console.log('🔄 同步数据到学习中心:', studentId)
    // TODO: 实现与学习中心模块的数据同步
  }

  const syncToAdminWorkbench = async () => {
    // 同步数据到教务工作台
    console.log('🔄 同步数据到教务工作台')
    // TODO: 实现与教务工作台的数据同步
  }

  const loadPendingHomeworks = async (mentorId: string) => {
    // TODO: 替换为真实API调用
    const mockHomeworks: HomeworkSubmission[] = [
      {
        id: 'homework-001',
        studentId: 'student-001',
        title: 'Java基础编程练习',
        description: '完成基础语法和面向对象编程练习题',
        subject: 'professional',
        submittedAt: '2024-01-19T10:30:00',
        dueDate: '2024-01-20T23:59:59',
        status: 'pending',
        score: null,
        maxScore: 100,
        attachments: ['java-homework-001.zip']
      },
      {
        id: 'homework-002',
        studentId: 'student-002',
        title: 'Vue组件开发实践',
        description: '开发一个可复用的表格组件',
        subject: 'professional',
        submittedAt: '2024-01-18T15:20:00',
        dueDate: '2024-01-22T23:59:59',
        status: 'reviewed',
        score: 85,
        maxScore: 100,
        comment: '功能实现良好，代码规范需要改进',
        attachments: ['vue-component.zip', 'demo.html']
      },
      {
        id: 'homework-003',
        studentId: 'student-001',
        title: '数据库设计作业',
        description: '设计电商系统的数据库表结构',
        subject: 'theory',
        submittedAt: '2024-01-17T09:15:00',
        dueDate: '2024-01-18T23:59:59',
        status: 'needs-revision',
        score: 60,
        maxScore: 100,
        comment: '表关系设计不够合理，需要重新考虑外键约束',
        attachments: ['database-design.sql']
      }
    ]
    
    pendingHomeworks.value = mockHomeworks
  }

  const loadPendingExams = async (mentorId: string) => {
    // TODO: 替换为真实API调用
    const mockExams: ExamSubmission[] = [
      {
        id: 'exam-001',
        studentId: 'student-001',
        title: 'Java开发30天阶段考试',
        type: 'stage',
        examTime: '2024-01-20T14:00:00',
        duration: 120,
        status: 'pending',
        score: null,
        maxScore: 100
      },
      {
        id: 'exam-002',
        studentId: 'student-002',
        title: '前端基础技能考核',
        type: 'skill',
        examTime: '2024-01-19T10:00:00',
        duration: 90,
        status: 'reviewed',
        score: 78,
        maxScore: 100,
        comment: 'HTML/CSS掌握良好，JavaScript部分需要加强',
        reviewedAt: '2024-01-19T14:30:00'
      },
      {
        id: 'exam-003',
        studentId: 'student-003',
        title: 'Python开发期末考试',
        type: 'final',
        examTime: '2024-01-15T09:00:00',
        duration: 180,
        status: 'reviewed',
        score: 92,
        maxScore: 100,
        comment: '表现优秀，各项技能掌握扎实',
        reviewedAt: '2024-01-15T15:00:00'
      }
    ]
    
    pendingExams.value = mockExams
  }

  const loadPendingTasks = async (mentorId: string) => {
    // TODO: 替换为真实API调用
    const mockTasks = [
      {
        id: 'task-001',
        studentId: 'student-001',
        title: '完成Java项目第一版',
        description: '实现用户管理模块的基本功能',
        dueDate: '2024-01-25T23:59:59',
        status: 'in-progress',
        priority: 'high'
      },
      {
        id: 'task-002',
        studentId: 'student-002',
        title: '学习Vue3 Composition API',
        description: '通过官方文档和实例代码学习新语法',
        dueDate: '2024-01-22T23:59:59',
        status: 'pending',
        priority: 'medium'
      }
    ]
    
    pendingTasks.value = mockTasks
  }

  return {
    // 状态
    currentMentor,
    myStudents,
    activePlans,
    pendingEvaluations,
    pendingHomeworks,
    pendingExams,
    pendingTasks,
    communicationRecords,
    isLoading,
    lastRefreshTime,
    
    // 计算属性
    activeStudentCount,
    averageProgress,
    overdueEvaluations,
    recentCommunications,
    mentorStats,
    
    // 方法
    initializeMentorData,
    refreshMentorStats,
    refreshPendingEvaluations,
    refreshCommunicationRecords,
    addCommunicationRecord,
    updateEvaluationStatus,
    updateStudentProgress,
    syncFromProject,
    syncToPersonalCenter,
    syncToAdminWorkbench
  }
}) 