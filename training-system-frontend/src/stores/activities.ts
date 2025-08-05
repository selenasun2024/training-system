import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { 
  KnowledgeActivity, 
  ActivitySearchParams, 
  ActivityFilterOptions,
  ActivityRegistration,
  ActivityFeedback,
  ActivityCalendarEvent,
  ActivityRecommendation,
  ActivityNotification,
  ActivityAnalytics,
  ActivityType,
  ActivityFormat,
  ActivityStatus,
  ParticipationStatus
} from '@/types/activity'
import * as activityApi from '@/api/modules/activity'

// 模拟数据
const mockActivities: KnowledgeActivity[] = [
  {
    id: '1',
    title: 'Vue 3 新特性深度解析',
    description: '本次分享将深入探讨Vue 3的新特性，包括Composition API、Teleport、Fragment等，并结合实际项目经验分享最佳实践。',
    summary: '深入解析Vue 3新特性，分享实战经验和最佳实践',
    type: 'knowledge_sharing' as ActivityType,
    format: 'online' as ActivityFormat,
    level: 'intermediate' as any,
    status: 'registration_open' as ActivityStatus,
    
    organizerId: 'user1',
    organizerName: '张三',
    organizerAvatar: 'https://cube.elemecdn.com/0/88/03b0d39583f48206768a7534e55bcpng.png',
    organizerDepartment: '技术部',
    
    startTime: new Date('2024-02-15T14:00:00'),
    endTime: new Date('2024-02-15T16:00:00'),
    duration: 120,
    registrationStartTime: new Date('2024-02-01T00:00:00'),
    registrationEndTime: new Date('2024-02-14T23:59:59'),
    
    location: {
      type: 'online',
      onlineLink: 'https://meeting.tencent.com/dm/123456789',
      onlinePlatform: '腾讯会议',
      accessInstructions: '会议号：123456789，密码：vue123'
    },
    
    maxParticipants: 100,
    currentParticipants: 67,
    participants: [],
    speakers: [
      {
        id: 'speaker1',
        userId: 'user1',
        name: '张三',
        avatar: 'https://cube.elemecdn.com/0/88/03b0d39583f48206768a7534e55bcpng.png',
        title: '高级前端工程师',
        department: '技术部',
        bio: '5年前端开发经验，Vue.js核心贡献者',
        expertise: ['Vue.js', 'TypeScript', '前端架构'],
        experience: '曾在多个大型项目中担任前端架构师'
      }
    ],
    
    objectives: [
      '理解Vue 3核心概念和设计理念',
      '掌握Composition API的使用方法',
      '学习Vue 3性能优化技巧',
      '了解Vue 3生态系统的发展'
    ],
    
    agenda: [
      {
        id: 'agenda1',
        title: '开场介绍',
        startTime: new Date('2024-02-15T14:00:00'),
        endTime: new Date('2024-02-15T14:10:00'),
        duration: 10,
        type: 'presentation',
        speakerId: 'speaker1',
        speakerName: '张三'
      },
      {
        id: 'agenda2',
        title: 'Vue 3核心特性介绍',
        startTime: new Date('2024-02-15T14:10:00'),
        endTime: new Date('2024-02-15T14:50:00'),
        duration: 40,
        type: 'presentation',
        speakerId: 'speaker1',
        speakerName: '张三'
      },
      {
        id: 'agenda3',
        title: '中场休息',
        startTime: new Date('2024-02-15T14:50:00'),
        endTime: new Date('2024-02-15T15:00:00'),
        duration: 10,
        type: 'break'
      },
      {
        id: 'agenda4',
        title: '实战演示',
        startTime: new Date('2024-02-15T15:00:00'),
        endTime: new Date('2024-02-15T15:40:00'),
        duration: 40,
        type: 'workshop',
        speakerId: 'speaker1',
        speakerName: '张三'
      },
      {
        id: 'agenda5',
        title: 'Q&A环节',
        startTime: new Date('2024-02-15T15:40:00'),
        endTime: new Date('2024-02-15T16:00:00'),
        duration: 20,
        type: 'qa',
        speakerId: 'speaker1',
        speakerName: '张三'
      }
    ],
    
    prerequisites: ['基础的Vue.js知识', 'JavaScript ES6+语法'],
    targetAudience: ['前端开发工程师', '全栈开发工程师', '技术团队负责人'],
    
    resources: [],
    knowledgeAssets: ['1', '2'],
    
    tags: ['Vue3', 'Composition API', '前端开发', '技术分享'],
    categories: ['前端技术', '框架学习'],
    
    createdAt: new Date('2024-01-20T10:00:00'),
    updatedAt: new Date('2024-01-25T15:30:00'),
    publishedAt: new Date('2024-01-22T09:00:00'),
    
    viewCount: 234,
    likeCount: 45,
    shareCount: 12,
    commentCount: 8,
    
    feedback: [],
    stats: {
      totalParticipants: 67,
      confirmedParticipants: 58,
      actualAttendees: 0,
      attendanceRate: 0,
      averageRating: 0,
      feedbackCount: 0,
      resourceDownloads: 0,
      knowledgeContributions: 0,
      followUpActions: 0
    },
    
    isPublic: true,
    requiresApproval: false,
    allowWaitlist: true,
    sendReminders: true,
    recordSession: true,
    
    relatedActivities: [],
    followUpActivities: [],
    series: 'Vue技术系列'
  },
  {
    id: '2',
    title: '微服务架构设计工作坊',
    description: '通过实际案例学习微服务架构设计，包括服务拆分、API设计、数据一致性、服务治理等核心内容。',
    summary: '实战学习微服务架构设计，掌握核心技术和最佳实践',
    type: 'workshop' as ActivityType,
    format: 'offline' as ActivityFormat,
    level: 'advanced' as any,
    status: 'registration_open' as ActivityStatus,
    
    organizerId: 'user2',
    organizerName: '李四',
    organizerAvatar: 'https://cube.elemecdn.com/0/88/03b0d39583f48206768a7534e55bcpng.png',
    organizerDepartment: '架构部',
    
    startTime: new Date('2024-02-20T09:00:00'),
    endTime: new Date('2024-02-20T17:00:00'),
    duration: 480,
    registrationStartTime: new Date('2024-02-05T00:00:00'),
    registrationEndTime: new Date('2024-02-18T23:59:59'),
    
    location: {
      type: 'offline',
      venue: '公司总部',
      address: '北京市朝阳区xxx路xxx号',
      room: '大会议室A',
      capacity: 30,
      facilities: ['投影仪', '白板', '音响设备', '茶水']
    },
    
    maxParticipants: 30,
    currentParticipants: 22,
    participants: [],
    speakers: [
      {
        id: 'speaker2',
        userId: 'user2',
        name: '李四',
        avatar: 'https://cube.elemecdn.com/0/88/03b0d39583f48206768a7534e55bcpng.png',
        title: '架构师',
        department: '架构部',
        bio: '10年软件架构经验，微服务架构专家',
        expertise: ['微服务架构', '分布式系统', '容器化'],
        experience: '主导过多个大型分布式系统的架构设计'
      }
    ],
    
    objectives: [
      '理解微服务架构的核心概念',
      '掌握服务拆分的方法和原则',
      '学习微服务间的通信和协调',
      '了解微服务的部署和监控'
    ],
    
    agenda: [
      {
        id: 'agenda1',
        title: '微服务架构概述',
        startTime: new Date('2024-02-20T09:00:00'),
        endTime: new Date('2024-02-20T10:30:00'),
        duration: 90,
        type: 'presentation',
        speakerId: 'speaker2',
        speakerName: '李四'
      },
      {
        id: 'agenda2',
        title: '服务拆分实战',
        startTime: new Date('2024-02-20T10:45:00'),
        endTime: new Date('2024-02-20T12:00:00'),
        duration: 75,
        type: 'workshop',
        speakerId: 'speaker2',
        speakerName: '李四'
      },
      {
        id: 'agenda3',
        title: '午餐休息',
        startTime: new Date('2024-02-20T12:00:00'),
        endTime: new Date('2024-02-20T13:00:00'),
        duration: 60,
        type: 'break'
      },
      {
        id: 'agenda4',
        title: 'API设计与服务治理',
        startTime: new Date('2024-02-20T13:00:00'),
        endTime: new Date('2024-02-20T15:00:00'),
        duration: 120,
        type: 'workshop',
        speakerId: 'speaker2',
        speakerName: '李四'
      },
      {
        id: 'agenda5',
        title: '案例分析与讨论',
        startTime: new Date('2024-02-20T15:15:00'),
        endTime: new Date('2024-02-20T16:30:00'),
        duration: 75,
        type: 'discussion',
        speakerId: 'speaker2',
        speakerName: '李四'
      },
      {
        id: 'agenda6',
        title: '总结与答疑',
        startTime: new Date('2024-02-20T16:30:00'),
        endTime: new Date('2024-02-20T17:00:00'),
        duration: 30,
        type: 'qa',
        speakerId: 'speaker2',
        speakerName: '李四'
      }
    ],
    
    prerequisites: ['分布式系统基础知识', 'Docker容器技术', 'RESTful API设计'],
    targetAudience: ['架构师', '高级开发工程师', '技术负责人'],
    
    resources: [],
    knowledgeAssets: ['2', '4'],
    
    tags: ['微服务', '架构设计', '分布式系统', '工作坊'],
    categories: ['系统架构', '技术培训'],
    
    createdAt: new Date('2024-01-25T14:00:00'),
    updatedAt: new Date('2024-01-30T10:15:00'),
    publishedAt: new Date('2024-01-26T16:00:00'),
    
    viewCount: 189,
    likeCount: 32,
    shareCount: 8,
    commentCount: 5,
    
    feedback: [],
    stats: {
      totalParticipants: 22,
      confirmedParticipants: 18,
      actualAttendees: 0,
      attendanceRate: 0,
      averageRating: 0,
      feedbackCount: 0,
      resourceDownloads: 0,
      knowledgeContributions: 0,
      followUpActions: 0
    },
    
    isPublic: true,
    requiresApproval: true,
    allowWaitlist: false,
    sendReminders: true,
    recordSession: false,
    
    relatedActivities: [],
    followUpActivities: [],
    series: '架构师成长系列'
  },
  {
    id: '3',
    title: '技术读书会：《代码大全》',
    description: '一起阅读和讨论《代码大全》这本经典的软件开发书籍，分享编程实践和经验。',
    summary: '共读《代码大全》，分享编程经验和最佳实践',
    type: 'book_club' as ActivityType,
    format: 'hybrid' as ActivityFormat,
    level: 'beginner' as any,
    status: 'registration_open' as ActivityStatus,
    
    organizerId: 'user3',
    organizerName: '王五',
    organizerAvatar: 'https://cube.elemecdn.com/0/88/03b0d39583f48206768a7534e55bcpng.png',
    organizerDepartment: '技术部',
    
    startTime: new Date('2024-02-25T15:00:00'),
    endTime: new Date('2024-02-25T16:30:00'),
    duration: 90,
    registrationStartTime: new Date('2024-02-10T00:00:00'),
    registrationEndTime: new Date('2024-02-24T23:59:59'),
    
    location: {
      type: 'hybrid',
      venue: '公司总部',
      address: '北京市朝阳区xxx路xxx号',
      room: '小会议室B',
      capacity: 15,
      onlineLink: 'https://meeting.tencent.com/dm/987654321',
      onlinePlatform: '腾讯会议',
      accessInstructions: '现场参与或在线参与，会议号：987654321'
    },
    
    maxParticipants: 25,
    currentParticipants: 18,
    participants: [],
    speakers: [
      {
        id: 'speaker3',
        userId: 'user3',
        name: '王五',
        avatar: 'https://cube.elemecdn.com/0/88/03b0d39583f48206768a7534e55bcpng.png',
        title: '技术专家',
        department: '技术部',
        bio: '资深开发者，热爱分享技术知识',
        expertise: ['软件工程', '代码质量', '团队管理'],
        experience: '15年软件开发经验，团队技术负责人'
      }
    ],
    
    objectives: [
      '深入理解软件开发的最佳实践',
      '提升代码质量和可维护性',
      '学习团队协作和沟通技巧',
      '建立良好的编程习惯'
    ],
    
    agenda: [
      {
        id: 'agenda1',
        title: '开场和介绍',
        startTime: new Date('2024-02-25T15:00:00'),
        endTime: new Date('2024-02-25T15:10:00'),
        duration: 10,
        type: 'presentation',
        speakerId: 'speaker3',
        speakerName: '王五'
      },
      {
        id: 'agenda2',
        title: '章节讨论：构建高质量代码',
        startTime: new Date('2024-02-25T15:10:00'),
        endTime: new Date('2024-02-25T15:50:00'),
        duration: 40,
        type: 'discussion',
        speakerId: 'speaker3',
        speakerName: '王五'
      },
      {
        id: 'agenda3',
        title: '实践分享',
        startTime: new Date('2024-02-25T15:50:00'),
        endTime: new Date('2024-02-25T16:20:00'),
        duration: 30,
        type: 'discussion'
      },
      {
        id: 'agenda4',
        title: '下次安排',
        startTime: new Date('2024-02-25T16:20:00'),
        endTime: new Date('2024-02-25T16:30:00'),
        duration: 10,
        type: 'presentation',
        speakerId: 'speaker3',
        speakerName: '王五'
      }
    ],
    
    prerequisites: ['基础的编程经验'],
    targetAudience: ['开发工程师', '技术爱好者', '团队负责人'],
    
    resources: [],
    knowledgeAssets: ['5'],
    
    tags: ['读书会', '代码质量', '软件工程', '最佳实践'],
    categories: ['学习成长', '技术分享'],
    
    createdAt: new Date('2024-01-28T11:00:00'),
    updatedAt: new Date('2024-02-02T16:45:00'),
    publishedAt: new Date('2024-01-29T10:00:00'),
    
    viewCount: 156,
    likeCount: 28,
    shareCount: 6,
    commentCount: 12,
    
    feedback: [],
    stats: {
      totalParticipants: 18,
      confirmedParticipants: 15,
      actualAttendees: 0,
      attendanceRate: 0,
      averageRating: 0,
      feedbackCount: 0,
      resourceDownloads: 0,
      knowledgeContributions: 0,
      followUpActions: 0
    },
    
    isPublic: true,
    requiresApproval: false,
    allowWaitlist: true,
    sendReminders: true,
    recordSession: true,
    
    relatedActivities: [],
    followUpActivities: [],
    series: '技术读书会系列'
  }
]

export const useActivitiesStore = defineStore('activities', () => {
  // 状态
  const activities = ref<KnowledgeActivity[]>(mockActivities)
  const currentActivity = ref<KnowledgeActivity | null>(null)
  const searchResults = ref<KnowledgeActivity[]>([])
  const filteredActivities = ref<KnowledgeActivity[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  // 搜索和筛选状态
  const searchQuery = ref('')
  const searchFilters = ref<ActivitySearchParams>({})
  const filterOptions = ref<ActivityFilterOptions | null>(null)

  // 用户相关状态
  const userRegistrations = ref<ActivityRegistration[]>([])
  const userNotifications = ref<ActivityNotification[]>([])
  const calendarEvents = ref<ActivityCalendarEvent[]>([])
  const recommendations = ref<ActivityRecommendation[]>([])

  // 计算属性
  const upcomingActivities = computed(() => {
    const now = new Date()
    return activities.value
      .filter(activity => 
        activity.status === 'registration_open' && 
        new Date(activity.startTime) > now
      )
      .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())
      .slice(0, 6)
  })

  const popularActivities = computed(() => {
    return activities.value
      .slice()
      .sort((a, b) => (b.viewCount + b.likeCount * 2 + b.currentParticipants) - (a.viewCount + a.likeCount * 2 + a.currentParticipants))
      .slice(0, 6)
  })

  const myActivities = computed(() => {
    return activities.value
      .filter(activity => activity.organizerId === 'current-user-id') // 替换为实际用户ID
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  })

  const registeredActivities = computed(() => {
    const registeredIds = userRegistrations.value.map(reg => reg.activityId)
    return activities.value
      .filter(activity => registeredIds.includes(activity.id))
      .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())
  })

  const totalResults = computed(() => {
    return searchQuery.value ? searchResults.value.length : activities.value.length
  })

  // Actions
  const fetchActivities = async (params?: ActivitySearchParams) => {
    loading.value = true
    error.value = null
    
    try {
      await new Promise(resolve => setTimeout(resolve, 500))
      
      // 这里将来会调用真实API
      // const response = await activityApi.getActivities(params)
      // activities.value = response.data
      
      // 目前使用模拟数据
      if (params?.query) {
        searchResults.value = activities.value.filter(activity => 
          activity.title.toLowerCase().includes(params.query!.toLowerCase()) ||
          activity.description.toLowerCase().includes(params.query!.toLowerCase()) ||
          activity.tags.some(tag => tag.toLowerCase().includes(params.query!.toLowerCase()))
        )
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : '获取活动失败'
    } finally {
      loading.value = false
    }
  }

  const fetchActivityDetail = async (id: string) => {
    loading.value = true
    error.value = null
    
    try {
      await new Promise(resolve => setTimeout(resolve, 300))
      
      const activity = activities.value.find(a => a.id === id)
      if (activity) {
        currentActivity.value = activity
        // 增加浏览量
        activity.viewCount++
      } else {
        throw new Error('活动不存在')
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : '获取活动详情失败'
    } finally {
      loading.value = false
    }
  }

  const searchActivities = async (query: string, filters?: ActivitySearchParams) => {
    searchQuery.value = query
    searchFilters.value = { ...filters, query }
    
    loading.value = true
    error.value = null
    
    try {
      await new Promise(resolve => setTimeout(resolve, 400))
      
      let results = activities.value
      
      if (query) {
        results = results.filter(activity => 
          activity.title.toLowerCase().includes(query.toLowerCase()) ||
          activity.description.toLowerCase().includes(query.toLowerCase()) ||
          activity.tags.some(tag => tag.toLowerCase().includes(query.toLowerCase())) ||
          activity.organizerName.toLowerCase().includes(query.toLowerCase())
        )
      }
      
      if (filters?.type && filters.type.length > 0) {
        results = results.filter(activity => filters.type!.includes(activity.type))
      }
      
      if (filters?.format && filters.format.length > 0) {
        results = results.filter(activity => filters.format!.includes(activity.format))
      }
      
      if (filters?.status && filters.status.length > 0) {
        results = results.filter(activity => filters.status!.includes(activity.status))
      }
      
      if (filters?.startDate && filters?.endDate) {
        results = results.filter(activity => {
          const activityDate = new Date(activity.startTime)
          return activityDate >= filters.startDate! && activityDate <= filters.endDate!
        })
      }
      
      searchResults.value = results
    } catch (err) {
      error.value = err instanceof Error ? err.message : '搜索失败'
    } finally {
      loading.value = false
    }
  }

  const registerActivity = async (activityId: string, data?: any) => {
    try {
      await new Promise(resolve => setTimeout(resolve, 500))
      
      const activity = activities.value.find(a => a.id === activityId)
      if (activity) {
        if (activity.currentParticipants >= (activity.maxParticipants || Infinity)) {
          throw new Error('活动已满员')
        }
        
        activity.currentParticipants++
        
        // 添加到用户报名记录
        const registration: ActivityRegistration = {
          activityId,
          participantId: 'current-user-id',
          registrationTime: new Date(),
          status: 'registered' as ParticipationStatus,
          ...data
        }
        userRegistrations.value.push(registration)
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : '报名失败'
      throw err
    }
  }

  const cancelRegistration = async (activityId: string) => {
    try {
      await new Promise(resolve => setTimeout(resolve, 300))
      
      const activity = activities.value.find(a => a.id === activityId)
      if (activity && activity.currentParticipants > 0) {
        activity.currentParticipants--
      }
      
      // 从用户报名记录中移除
      const index = userRegistrations.value.findIndex(reg => reg.activityId === activityId)
      if (index > -1) {
        userRegistrations.value.splice(index, 1)
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : '取消报名失败'
      throw err
    }
  }

  const likeActivity = async (id: string) => {
    try {
      const activity = activities.value.find(a => a.id === id)
      if (activity) {
        activity.likeCount++
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : '点赞失败'
    }
  }

  const unlikeActivity = async (id: string) => {
    try {
      const activity = activities.value.find(a => a.id === id)
      if (activity && activity.likeCount > 0) {
        activity.likeCount--
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : '取消点赞失败'
    }
  }

  const shareActivity = async (id: string) => {
    try {
      const activity = activities.value.find(a => a.id === id)
      if (activity) {
        activity.shareCount++
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : '分享失败'
    }
  }

  const fetchFilterOptions = async () => {
    try {
      const types = [...new Set(activities.value.map(activity => activity.type))]
      const formats = [...new Set(activities.value.map(activity => activity.format))]
      const statuses = [...new Set(activities.value.map(activity => activity.status))]
      const categories = [...new Set(activities.value.flatMap(activity => activity.categories))]
      const tags = [...new Set(activities.value.flatMap(activity => activity.tags))]
      const organizers = [...new Set(activities.value.map(activity => activity.organizerName))]
      
      filterOptions.value = {
        types: types.map(type => ({ id: type, name: type, count: activities.value.filter(a => a.type === type).length })),
        formats: formats.map(format => ({ id: format, name: format, count: activities.value.filter(a => a.format === format).length })),
        statuses: statuses.map(status => ({ id: status, name: status, count: activities.value.filter(a => a.status === status).length })),
        categories: categories.map(name => ({ id: name, name, count: activities.value.filter(a => a.categories.includes(name)).length })),
        tags: tags.map(name => ({ id: name, name, count: activities.value.filter(a => a.tags.includes(name)).length })),
        organizers: organizers.map(name => ({ id: name, name, count: activities.value.filter(a => a.organizerName === name).length })),
        speakers: [],
        locations: [],
        dateRanges: []
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : '获取筛选选项失败'
    }
  }

  const fetchCalendarEvents = async (params?: any) => {
    try {
      calendarEvents.value = activities.value.map(activity => ({
        id: activity.id,
        title: activity.title,
        start: activity.startTime,
        end: activity.endTime,
        type: activity.type,
        format: activity.format,
        status: activity.status,
        participants: activity.currentParticipants,
        maxParticipants: activity.maxParticipants,
        location: activity.location.type === 'online' ? '线上' : activity.location.venue || ''
      }))
    } catch (err) {
      error.value = err instanceof Error ? err.message : '获取日历数据失败'
    }
  }

  const fetchRecommendations = async () => {
    try {
      // 基于用户兴趣推荐活动
      recommendations.value = activities.value
        .filter(activity => activity.status === 'registration_open')
        .slice(0, 4)
        .map(activity => ({
          activityId: activity.id,
          activity,
          score: Math.random() * 100,
          reasons: ['基于您的兴趣', '同事推荐', '热门活动'],
          recommendationType: 'interest' as const
        }))
    } catch (err) {
      error.value = err instanceof Error ? err.message : '获取推荐失败'
    }
  }

  const clearSearch = () => {
    searchQuery.value = ''
    searchResults.value = []
    searchFilters.value = {}
  }

  const isUserRegistered = (activityId: string) => {
    return userRegistrations.value.some(reg => reg.activityId === activityId)
  }

  const getUserRegistrationStatus = (activityId: string) => {
    const registration = userRegistrations.value.find(reg => reg.activityId === activityId)
    return registration?.status || null
  }

  const getActivityTypeLabel = (type: ActivityType) => {
    const labels: Record<ActivityType, string> = {
      knowledge_sharing: '知识分享',
      technical_seminar: '技术研讨',
      workshop: '工作坊',
      book_club: '读书会',
      project_review: '项目复盘',
      training_session: '培训课程',
      hackathon: '黑客马拉松',
      mentoring: '导师指导',
      community_event: '社区活动'
    }
    return labels[type] || type
  }

  const getActivityFormatLabel = (format: ActivityFormat) => {
    const labels: Record<ActivityFormat, string> = {
      online: '线上',
      offline: '线下',
      hybrid: '混合'
    }
    return labels[format] || format
  }

  const getActivityStatusLabel = (status: ActivityStatus) => {
    const labels: Record<ActivityStatus, string> = {
      draft: '草稿',
      published: '已发布',
      registration_open: '报名中',
      registration_closed: '报名截止',
      in_progress: '进行中',
      completed: '已完成',
      cancelled: '已取消',
      postponed: '已延期'
    }
    return labels[status] || status
  }

  return {
    // 状态
    activities,
    currentActivity,
    searchResults,
    filteredActivities,
    loading,
    error,
    searchQuery,
    searchFilters,
    filterOptions,
    userRegistrations,
    userNotifications,
    calendarEvents,
    recommendations,
    
    // 计算属性
    upcomingActivities,
    popularActivities,
    myActivities,
    registeredActivities,
    totalResults,
    
    // 方法
    fetchActivities,
    fetchActivityDetail,
    searchActivities,
    registerActivity,
    cancelRegistration,
    likeActivity,
    unlikeActivity,
    shareActivity,
    fetchFilterOptions,
    fetchCalendarEvents,
    fetchRecommendations,
    clearSearch,
    isUserRegistered,
    getUserRegistrationStatus,
    getActivityTypeLabel,
    getActivityFormatLabel,
    getActivityStatusLabel
  }
}) 