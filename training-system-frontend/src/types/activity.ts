/**
 * 活动相关的类型定义
 */

// 活动类型枚举
export enum ActivityType {
  KNOWLEDGE_SHARING = 'knowledge_sharing',    // 知识分享
  TECHNICAL_SEMINAR = 'technical_seminar',    // 技术研讨
  WORKSHOP = 'workshop',                      // 工作坊
  BOOK_CLUB = 'book_club',                    // 读书会
  PROJECT_REVIEW = 'project_review',          // 项目复盘
  TRAINING_SESSION = 'training_session',      // 培训课程
  HACKATHON = 'hackathon',                    // 黑客马拉松
  MENTORING = 'mentoring',                    // 导师指导
  COMMUNITY_EVENT = 'community_event'         // 社区活动
}

// 活动状态枚举
export enum ActivityStatus {
  DRAFT = 'draft',                // 草稿
  PUBLISHED = 'published',        // 已发布
  REGISTRATION_OPEN = 'registration_open',  // 报名中
  REGISTRATION_CLOSED = 'registration_closed', // 报名截止
  IN_PROGRESS = 'in_progress',    // 进行中
  COMPLETED = 'completed',        // 已完成
  CANCELLED = 'cancelled',        // 已取消
  POSTPONED = 'postponed'         // 已延期
}

// 参与状态枚举
export enum ParticipationStatus {
  REGISTERED = 'registered',      // 已报名
  CONFIRMED = 'confirmed',        // 已确认
  ATTENDED = 'attended',          // 已参加
  ABSENT = 'absent',              // 缺席
  CANCELLED = 'cancelled'         // 已取消
}

// 活动形式枚举
export enum ActivityFormat {
  ONLINE = 'online',              // 线上
  OFFLINE = 'offline',            // 线下
  HYBRID = 'hybrid'               // 混合
}

// 活动难度等级
export enum ActivityLevel {
  BEGINNER = 'beginner',          // 初级
  INTERMEDIATE = 'intermediate',   // 中级
  ADVANCED = 'advanced',          // 高级
  EXPERT = 'expert'               // 专家级
}

// 活动参与者信息
export interface ActivityParticipant {
  id: string
  userId: string
  userName: string
  userAvatar?: string
  userDepartment?: string
  userTitle?: string
  registrationTime: Date
  confirmationTime?: Date
  participationStatus: ParticipationStatus
  attendanceTime?: Date
  feedback?: string
  rating?: number
  notes?: string
}

// 活动讲师信息
export interface ActivitySpeaker {
  id: string
  userId: string
  name: string
  avatar?: string
  title: string
  department: string
  bio: string
  expertise: string[]
  experience: string
  contact?: {
    email?: string
    phone?: string
    wechat?: string
  }
}

// 活动议程项
export interface ActivityAgendaItem {
  id: string
  title: string
  description?: string
  startTime: Date
  endTime: Date
  duration: number // 分钟
  speakerId?: string
  speakerName?: string
  type: 'presentation' | 'discussion' | 'workshop' | 'break' | 'qa' | 'networking'
  materials?: string[]
  notes?: string
}

// 活动地点信息
export interface ActivityLocation {
  type: 'online' | 'offline' | 'hybrid'
  venue?: string
  address?: string
  room?: string
  capacity?: number
  facilities?: string[]
  onlineLink?: string
  onlinePlatform?: string
  accessInstructions?: string
}

// 活动资源
export interface ActivityResource {
  id: string
  name: string
  type: 'document' | 'video' | 'audio' | 'image' | 'link' | 'code'
  url: string
  description?: string
  size?: number
  downloadCount?: number
  uploadTime: Date
  uploaderId: string
  uploaderName: string
}

// 活动反馈
export interface ActivityFeedback {
  id: string
  participantId: string
  participantName: string
  rating: number // 1-5分
  content: string
  aspects: {
    content: number        // 内容质量
    speaker: number        // 讲师表现
    organization: number   // 组织安排
    interaction: number    // 互动效果
    venue: number         // 场地设施
  }
  suggestions?: string
  wouldRecommend: boolean
  createdTime: Date
  isAnonymous: boolean
}

// 活动统计信息
export interface ActivityStats {
  totalParticipants: number
  confirmedParticipants: number
  actualAttendees: number
  attendanceRate: number
  averageRating: number
  feedbackCount: number
  resourceDownloads: number
  knowledgeContributions: number
  followUpActions: number
}

// 主要活动数据模型
export interface KnowledgeActivity {
  id: string
  title: string
  description: string
  summary?: string
  type: ActivityType
  format: ActivityFormat
  level: ActivityLevel
  status: ActivityStatus
  
  // 基本信息
  organizerId: string
  organizerName: string
  organizerAvatar?: string
  organizerDepartment?: string
  
  // 时间信息
  startTime: Date
  endTime: Date
  duration: number // 分钟
  registrationStartTime?: Date
  registrationEndTime?: Date
  
  // 地点信息
  location: ActivityLocation
  
  // 参与信息
  maxParticipants?: number
  currentParticipants: number
  participants: ActivityParticipant[]
  speakers: ActivitySpeaker[]
  
  // 内容信息
  objectives: string[]
  agenda: ActivityAgendaItem[]
  prerequisites?: string[]
  targetAudience?: string[]
  
  // 资源信息
  resources: ActivityResource[]
  knowledgeAssets: string[] // 关联的知识资产ID
  
  // 元数据
  tags: string[]
  categories: string[]
  createdAt: Date
  updatedAt: Date
  publishedAt?: Date
  
  // 互动信息
  viewCount: number
  likeCount: number
  shareCount: number
  commentCount: number
  
  // 反馈信息
  feedback: ActivityFeedback[]
  stats: ActivityStats
  
  // 设置信息
  isPublic: boolean
  requiresApproval: boolean
  allowWaitlist: boolean
  sendReminders: boolean
  recordSession: boolean
  
  // 关联信息
  relatedActivities: string[]
  followUpActivities: string[]
  parentActivityId?: string
  series?: string
}

// 活动搜索参数
export interface ActivitySearchParams {
  query?: string
  type?: ActivityType[]
  format?: ActivityFormat[]
  level?: ActivityLevel[]
  status?: ActivityStatus[]
  startDate?: Date
  endDate?: Date
  organizerId?: string
  speakerId?: string
  tags?: string[]
  categories?: string[]
  location?: string
  hasSpots?: boolean
  sortBy?: 'date' | 'popularity' | 'rating' | 'participants'
  sortOrder?: 'asc' | 'desc'
  page?: number
  limit?: number
}

// 活动筛选选项
export interface ActivityFilterOptions {
  types: Array<{ id: ActivityType; name: string; count: number }>
  formats: Array<{ id: ActivityFormat; name: string; count: number }>
  levels: Array<{ id: ActivityLevel; name: string; count: number }>
  statuses: Array<{ id: ActivityStatus; name: string; count: number }>
  categories: Array<{ id: string; name: string; count: number }>
  tags: Array<{ id: string; name: string; count: number }>
  organizers: Array<{ id: string; name: string; count: number }>
  speakers: Array<{ id: string; name: string; count: number }>
  locations: Array<{ id: string; name: string; count: number }>
  dateRanges: Array<{ id: string; name: string; startDate: Date; endDate: Date }>
}

// 活动报名信息
export interface ActivityRegistration {
  activityId: string
  participantId: string
  registrationTime: Date
  status: ParticipationStatus
  notes?: string
  questionnaire?: Record<string, any>
  emergencyContact?: {
    name: string
    phone: string
    relationship: string
  }
}

// 活动创建/更新请求
export interface ActivityRequest {
  title: string
  description: string
  summary?: string
  type: ActivityType
  format: ActivityFormat
  level: ActivityLevel
  startTime: Date
  endTime: Date
  location: ActivityLocation
  maxParticipants?: number
  objectives: string[]
  agenda: Omit<ActivityAgendaItem, 'id'>[]
  prerequisites?: string[]
  targetAudience?: string[]
  tags: string[]
  categories: string[]
  speakers: Omit<ActivitySpeaker, 'id'>[]
  isPublic: boolean
  requiresApproval: boolean
  allowWaitlist: boolean
  sendReminders: boolean
  recordSession: boolean
  registrationStartTime?: Date
  registrationEndTime?: Date
}

// 活动日历数据
export interface ActivityCalendarEvent {
  id: string
  title: string
  start: Date
  end: Date
  type: ActivityType
  format: ActivityFormat
  status: ActivityStatus
  color?: string
  participants: number
  maxParticipants?: number
  location: string
}

// 活动系列
export interface ActivitySeries {
  id: string
  name: string
  description: string
  organizerId: string
  organizerName: string
  activities: string[]
  tags: string[]
  categories: string[]
  startDate: Date
  endDate: Date
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

// 活动推荐
export interface ActivityRecommendation {
  activityId: string
  activity: KnowledgeActivity
  score: number
  reasons: string[]
  recommendationType: 'interest' | 'skill' | 'department' | 'history' | 'trending'
}

// 活动通知
export interface ActivityNotification {
  id: string
  activityId: string
  activityTitle: string
  participantId: string
  type: 'registration_confirmation' | 'reminder' | 'cancellation' | 'update' | 'feedback_request'
  title: string
  message: string
  scheduledTime: Date
  sentTime?: Date
  isRead: boolean
  createdAt: Date
}

// 活动分析数据
export interface ActivityAnalytics {
  totalActivities: number
  activeActivities: number
  totalParticipants: number
  averageAttendance: number
  popularTypes: Array<{ type: ActivityType; count: number }>
  popularFormats: Array<{ format: ActivityFormat; count: number }>
  monthlyTrends: Array<{ month: string; activities: number; participants: number }>
  departmentStats: Array<{ department: string; organized: number; participated: number }>
  topOrganizers: Array<{ id: string; name: string; activities: number; rating: number }>
  topSpeakers: Array<{ id: string; name: string; sessions: number; rating: number }>
  satisfactionTrends: Array<{ month: string; rating: number; feedback: number }>
}

// 导出所有类型
export type {
  ActivityParticipant,
  ActivitySpeaker,
  ActivityAgendaItem,
  ActivityLocation,
  ActivityResource,
  ActivityFeedback,
  ActivityStats,
  KnowledgeActivity,
  ActivitySearchParams,
  ActivityFilterOptions,
  ActivityRegistration,
  ActivityRequest,
  ActivityCalendarEvent,
  ActivitySeries,
  ActivityRecommendation,
  ActivityNotification,
  ActivityAnalytics
} 