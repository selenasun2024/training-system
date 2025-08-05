import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

// 类型定义
export interface TaskInfo {
  id: string
  title: string
  description: string
  projectName: string
  projectId: string
  dueDate: string
  status: 'pending' | 'completed' | 'overdue'
  priority: 'low' | 'medium' | 'high'
  score?: number
  submittedAt?: string
  isUrgent: boolean
}

export interface ScheduleInfo {
  id: string
  title: string
  type: 'course' | 'meeting' | 'exam' | 'training'
  startTime: string
  endTime: string
  location: string
  instructor?: string
  description?: string
  status: 'scheduled' | 'ongoing' | 'completed' | 'cancelled'
}

export interface AchievementInfo {
  id: string
  type: 'score' | 'certificate' | 'award' | 'milestone'
  title: string
  projectName: string
  score?: number
  maxScore?: number
  level?: string
  achievedAt: string
  description: string
  rank?: number
}

export interface TrainingProgress {
  projectId: string
  projectName: string
  currentPhase: string
  progress: number
  startDate: string
  expectedEndDate: string
  milestones: {
    name: string
    status: 'completed' | 'in_progress' | 'pending'
    dueDate: string
  }[]
}

export interface MentorshipStatus {
  hasMentor: boolean
  mentor?: {
    id: string
    name: string
    avatar: string
    department: string
  }
  hasStudents: boolean
  students?: {
    id: string
    name: string
    avatar: string
    progress: number
  }[]
  relationshipStatus: 'active' | 'completed' | 'paused'
}

export interface Goal {
  id: string
  title: string
  description: string
  type: 'learning' | 'skill' | 'career' | 'personal'
  targetDate: string
  progress: number
  status: 'active' | 'completed' | 'paused'
  milestones: {
    name: string
    completed: boolean
    completedAt?: string
  }[]
}

export interface TodoItem {
  id: string
  title: string
  description?: string
  type: 'task' | 'reminder' | 'deadline' | 'meeting'
  dueDate: string
  priority: 'low' | 'medium' | 'high'
  isUrgent: boolean
  completed: boolean
  projectId?: string
}

export interface NavigationPreferences {
  frequentlyUsed: string[]
  pinnedItems: string[]
  recentlyVisited: string[]
  customOrder: string[]
}

export interface UserProfile {
  id: string
  name: string
  avatar: string
  employeeId: string
  role: string
  department: string
  position: string
  entryDate: string
}

export const usePersonalCenterStore = defineStore('personalCenter', () => {
  // 基础信息
  const userProfile = ref<UserProfile | null>(null)
  
  // 快捷功能数据
  const tasks = ref<TaskInfo[]>([])
  const schedule = ref<ScheduleInfo[]>([])
  const achievements = ref<AchievementInfo[]>([])
  
  // 成长概览数据
  const trainingProgress = ref<TrainingProgress | null>(null)
  const mentorshipStatus = ref<MentorshipStatus | null>(null)
  const currentGoals = ref<Goal[]>([])
  const todos = ref<TodoItem[]>([])
  
  // 导航和偏好
  const navigationPreferences = ref<NavigationPreferences | null>(null)
  const frequentlyUsed = ref<string[]>([])
  
  // 加载状态
  const isLoading = ref(false)
  const lastRefreshTime = ref<Date | null>(null)

  // 计算属性
  const urgentItems = computed(() => {
    const urgentTasks = tasks.value.filter(t => t.isUrgent && t.status === 'pending')
    const urgentTodos = todos.value.filter(t => t.isUrgent && !t.completed)
    return [...urgentTasks, ...urgentTodos].sort((a, b) => {
      const aDate = new Date(a.dueDate)
      const bDate = new Date(b.dueDate)
      return aDate.getTime() - bDate.getTime()
    })
  })

  const todaySchedule = computed(() => {
    const today = new Date().toISOString().split('T')[0]
    return schedule.value.filter(s => s.startTime.startsWith(today))
  })

  const thisWeekTodos = computed(() => {
    const weekFromNow = new Date()
    weekFromNow.setDate(weekFromNow.getDate() + 7)
    
    return todos.value.filter(todo => {
      const dueDate = new Date(todo.dueDate)
      return dueDate <= weekFromNow && !todo.completed
    })
  })

  const activeGoalsCount = computed(() => 
    currentGoals.value.filter(g => g.status === 'active').length
  )

  const completionRate = computed(() => {
    if (achievements.value.length === 0) return 0
    const completedCount = achievements.value.filter(a => a.type === 'score' && (a.score || 0) >= (a.maxScore || 100) * 0.6).length
    return Math.round((completedCount / achievements.value.length) * 100)
  })

  const personalizedNavigation = computed(() => {
    const { role } = userProfile.value || {}
    const baseNavigation = [
      {
        id: 'growth-profile',
        key: 'growth-profile',
        title: '完整成长档案',
        description: '查看详细的个人成长记录和分析',
        icon: 'TrendCharts',
        route: '/training-management/growth-development/profile',
        color: '#409EFF',
        badge: null,
        highlight: true
      },
      {
        id: 'goal-management',
        key: 'goal-management',
        title: '目标管理',
        description: '设定和跟踪个人发展目标',
        icon: 'Aim',
        route: '/training-management/growth-development/my-growth#goals',
        color: '#67C23A',
        badge: null
      },
      {
        id: 'learning-resources',
        key: 'learning-resources',
        title: '学习资源',
        description: '访问知识分享和学习材料',
        icon: 'Reading',
        route: '/training-management/knowledge-sharing',
        color: '#E6A23C',
        badge: null
      }
    ]

    // 根据角色添加特定导航
    if (role === 'mentor' || role === 'teacher') {
      baseNavigation.push({
        id: 'mentor-workbench',
        key: 'mentor-workbench',
        title: '带教工作台',
        description: '管理学员和带教活动',
        icon: 'User',
        route: '/training-management/workbench/mentor',
        color: '#F56C6C',
        badge: null
      })
    }

    // 根据使用频率排序
    return baseNavigation.sort((a, b) => {
      const aFreq = frequentlyUsed.value.indexOf(a.key)
      const bFreq = frequentlyUsed.value.indexOf(b.key)
      if (aFreq === -1 && bFreq === -1) return 0
      if (aFreq === -1) return 1
      if (bFreq === -1) return -1
      return aFreq - bFreq
    })
  })

  // Actions
  const initializePersonalCenter = async (userId: string) => {
    isLoading.value = true
    try {
      await Promise.all([
        loadUserProfile(userId),
        loadTasks(userId),
        loadSchedule(userId), 
        loadAchievements(userId),
        loadTrainingProgress(userId),
        loadMentorshipStatus(userId),
        loadCurrentGoals(userId),
        loadTodos(userId),
        loadNavigationPreferences(userId)
      ])
      
      lastRefreshTime.value = new Date()
      console.log('🏠 学习中心数据初始化完成')
    } catch (error) {
      console.error('❌ 学习中心初始化失败:', error)
      throw error
    } finally {
      isLoading.value = false
    }
  }

  const loadUserProfile = async (userId: string) => {
    // TODO: 替换为真实API调用
    userProfile.value = {
      id: userId,
      name: '吴静',
      avatar: '/avatars/user-001.jpg',
      employeeId: 'EMP2024001',
      role: 'student',
      department: '市场部',
      position: '市场专员',
      entryDate: '2024-01-15'
    }
  }

  const loadTasks = async (userId: string) => {
    // TODO: 替换为真实API调用
    const mockTasks: TaskInfo[] = [
      {
        id: 'task-001',
        title: '市场调研报告',
        description: '完成Q1市场调研分析报告',
        projectName: '市场专员培养计划',
        projectId: 'project-001',
        dueDate: '2024-01-25',
        status: 'pending',
        priority: 'high',
        isUrgent: true
      },
      {
        id: 'task-002',
        title: 'Excel数据分析练习',
        description: '完成Excel高级函数练习',
        projectName: '市场专员培养计划',
        projectId: 'project-001',
        dueDate: '2024-01-30',
        status: 'pending',
        priority: 'medium',
        isUrgent: false
      }
    ]
    
    tasks.value = mockTasks
  }

  const loadSchedule = async (userId: string) => {
    // TODO: 替换为真实API调用
    const mockSchedule: ScheduleInfo[] = [
      {
        id: 'schedule-001',
        title: '市场营销基础课程',
        type: 'course',
        startTime: '2024-01-25T09:00:00',
        endTime: '2024-01-25T11:00:00',
        location: '培训室A',
        instructor: '李老师',
        description: '市场营销基础理论与实践',
        status: 'scheduled'
      },
      {
        id: 'schedule-002',
        title: '月度学习总结会议',
        type: 'meeting',
        startTime: '2024-01-25T14:00:00',
        endTime: '2024-01-25T15:00:00',
        location: '会议室B',
        status: 'scheduled'
      }
    ]
    
    schedule.value = mockSchedule
  }

  const loadAchievements = async (userId: string) => {
    // TODO: 替换为真实API调用
    const mockAchievements: AchievementInfo[] = [
      {
        id: 'achievement-001',
        type: 'score',
        title: '市场营销基础考试',
        projectName: '市场专员培养计划',
        score: 85,
        maxScore: 100,
        achievedAt: '2024-01-20',
        description: '市场营销基础理论考试',
        rank: 3
      },
      {
        id: 'achievement-002',
        type: 'certificate',
        title: 'Excel数据分析认证',
        projectName: '市场专员培养计划',
        level: '中级',
        achievedAt: '2024-01-18',
        description: 'Excel数据分析中级认证'
      }
    ]
    
    achievements.value = mockAchievements
  }

  const loadTrainingProgress = async (userId: string) => {
    // TODO: 替换为真实API调用
    trainingProgress.value = {
      projectId: 'project-001',
      projectName: '市场专员培养计划',
      currentPhase: '第二阶段 - 技能提升',
      progress: 65,
      startDate: '2024-01-15',
      expectedEndDate: '2024-04-15',
      milestones: [
        {
          name: '30天基础学习',
          status: 'completed',
          dueDate: '2024-02-15'
        },
        {
          name: '60天技能提升',
          status: 'in_progress',
          dueDate: '2024-03-15'
        },
        {
          name: '90天实战项目',
          status: 'pending',
          dueDate: '2024-04-15'
        }
      ]
    }
  }

  const loadMentorshipStatus = async (userId: string) => {
    // TODO: 替换为真实API调用
    mentorshipStatus.value = {
      hasMentor: true,
      mentor: {
        id: 'mentor-001',
        name: '张导师',
        avatar: '/avatars/mentor-001.jpg',
        department: '市场部'
      },
      hasStudents: false,
      relationshipStatus: 'active'
    }
  }

  const loadCurrentGoals = async (userId: string) => {
    // TODO: 替换为真实API调用
    const mockGoals: Goal[] = [
      {
        id: 'goal-001',
        title: '掌握Excel高级数据分析',
        description: '学会使用透视表、高级函数等',
        type: 'skill',
        targetDate: '2024-02-28',
        progress: 70,
        status: 'active',
        milestones: [
          { name: '基础函数学习', completed: true, completedAt: '2024-01-20' },
          { name: '透视表制作', completed: true, completedAt: '2024-01-22' },
          { name: '高级分析技巧', completed: false }
        ]
      }
    ]
    
    currentGoals.value = mockGoals
  }

  const loadTodos = async (userId: string) => {
    // TODO: 替换为真实API调用
    const mockTodos: TodoItem[] = [
      {
        id: 'todo-001',
        title: '提交市场调研报告',
        description: '截止日期临近，需要尽快完成',
        type: 'deadline',
        dueDate: '2024-01-25',
        priority: 'high',
        isUrgent: true,
        completed: false,
        projectId: 'project-001'
      }
    ]
    
    todos.value = mockTodos
  }

  const loadNavigationPreferences = async (userId: string) => {
    // TODO: 替换为真实API调用
    navigationPreferences.value = {
      frequentlyUsed: ['growth-profile', 'goal-management'],
      pinnedItems: ['learning-resources'],
      recentlyVisited: ['growth-profile', 'mentor-workbench'],
      customOrder: []
    }
    
    frequentlyUsed.value = navigationPreferences.value.frequentlyUsed
  }

  // 数据同步方法 (跨模块数据打通)
  const syncFromGrowthModule = async () => {
    // 从成长发展模块同步数据
    console.log('🔄 从成长发展模块同步数据')
    // TODO: 实现与成长发展模块的数据同步
  }

  const syncFromProjectModule = async () => {
    // 从项目管理模块同步数据
    console.log('🔄 从项目管理模块同步数据')
    // TODO: 实现与项目管理模块的数据同步
  }

  const syncFromWorkbenchModule = async () => {
    // 从工作台模块同步数据
    console.log('🔄 从工作台模块同步数据')
    // TODO: 实现与工作台模块的数据同步
  }

  // 行为记录
  const recordNavigation = (target: string) => {
    // 记录导航行为，用于个性化推荐
    if (!frequentlyUsed.value.includes(target)) {
      frequentlyUsed.value.unshift(target)
      frequentlyUsed.value = frequentlyUsed.value.slice(0, 5) // 只保留前5个
    }
  }

  const updatePreferences = (preferences: NavigationPreferences) => {
    navigationPreferences.value = preferences
    frequentlyUsed.value = preferences.frequentlyUsed
  }

  // 数据操作方法
  const updateTodoStatus = (todoId: string, completed: boolean) => {
    const todo = todos.value.find(t => t.id === todoId)
    if (todo) {
      todo.completed = completed
    }
  }

  const updateTaskStatus = (taskId: string, status: TaskInfo['status']) => {
    const task = tasks.value.find(t => t.id === taskId)
    if (task) {
      task.status = status
    }
  }

  const addNewGoal = (goal: Omit<Goal, 'id'>) => {
    const newGoal: Goal = {
      ...goal,
      id: `goal-${Date.now()}`
    }
    currentGoals.value.push(newGoal)
  }

  const updateGoalProgress = (goalId: string, progress: number) => {
    const goal = currentGoals.value.find(g => g.id === goalId)
    if (goal) {
      goal.progress = progress
      if (progress >= 100) {
        goal.status = 'completed'
      }
    }
  }

  return {
    // 状态
    userProfile,
    tasks,
    schedule,
    achievements,
    trainingProgress,
    mentorshipStatus,
    currentGoals,
    todos,
    navigationPreferences,
    frequentlyUsed,
    isLoading,
    lastRefreshTime,
    
    // 计算属性
    urgentItems,
    todaySchedule,
    thisWeekTodos,
    activeGoalsCount,
    completionRate,
    personalizedNavigation,
    
    // 方法
    initializePersonalCenter,
    syncFromGrowthModule,
    syncFromProjectModule,
    syncFromWorkbenchModule,
    recordNavigation,
    updatePreferences,
    updateTodoStatus,
    updateTaskStatus,
    addNewGoal,
    updateGoalProgress
  }
}) 