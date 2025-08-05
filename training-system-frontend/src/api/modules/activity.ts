/**
 * 活动相关的API接口
 */

import type { 
  KnowledgeActivity, 
  ActivitySearchParams, 
  ActivityFilterOptions,
  ActivityRequest,
  ActivityRegistration,
  ActivityFeedback,
  ActivityCalendarEvent,
  ActivitySeries,
  ActivityRecommendation,
  ActivityNotification,
  ActivityAnalytics,
  ParticipationStatus
} from '@/types/activity'
import request from '@/utils/request'

// 活动基础CRUD操作
export const getActivities = (params?: ActivitySearchParams) => {
  return request.get<{
    data: KnowledgeActivity[]
    total: number
    page: number
    limit: number
  }>('/api/activities', params ? { params } as any : undefined)
}

export const getActivityDetail = (id: string) => {
  return request.get<KnowledgeActivity>(`/api/activities/${id}`)
}

export const createActivity = (data: ActivityRequest) => {
  return request.post<KnowledgeActivity>('/api/activities', data)
}

export const updateActivity = (id: string, data: Partial<ActivityRequest>) => {
  return request.put<KnowledgeActivity>(`/api/activities/${id}`, data)
}

export const deleteActivity = (id: string) => {
  return request.delete<void>(`/api/activities/${id}`)
}

// 活动发布和状态管理
export const publishActivity = (id: string) => {
  return request.post<KnowledgeActivity>(`/api/activities/${id}/publish`)
}

export const cancelActivity = (id: string, reason?: string) => {
  return request.post<KnowledgeActivity>(`/api/activities/${id}/cancel`, { reason })
}

export const postponeActivity = (id: string, newStartTime: Date, newEndTime: Date, reason?: string) => {
  return request.post<KnowledgeActivity>(`/api/activities/${id}/postpone`, { newStartTime, newEndTime, reason })
}

// 活动搜索和筛选
export const searchActivities = (query: string, filters?: ActivitySearchParams) => {
  return request.get<{
    data: KnowledgeActivity[]
    total: number
    suggestions?: string[]
    facets?: Record<string, any>
  }>('/api/activities/search', { params: { query, ...filters } } as any)
}

export const getActivityFilterOptions = () => {
  return request.get<ActivityFilterOptions>('/api/activities/filter-options')
}

// 活动报名相关
export const registerActivity = (activityId: string, data?: {
  notes?: string
  questionnaire?: Record<string, any>
  emergencyContact?: {
    name: string
    phone: string
    relationship: string
  }
}) => {
  return request.post<ActivityRegistration>(`/api/activities/${activityId}/register`, data)
}

export const cancelRegistration = (activityId: string, reason?: string) => {
  return request.post<void>(`/api/activities/${activityId}/cancel-registration`, { reason })
}

export const confirmAttendance = (activityId: string) => {
  return request.post<ActivityRegistration>(`/api/activities/${activityId}/confirm`)
}

export const checkIn = (activityId: string) => {
  return request.post<ActivityRegistration>(`/api/activities/${activityId}/checkin`)
}

// 获取用户的活动报名信息
export const getUserRegistrations = (params?: {
  status?: ParticipationStatus[]
  startDate?: Date
  endDate?: Date
  page?: number
  limit?: number
}) => {
  return request.get<{
    data: (ActivityRegistration & { activity: KnowledgeActivity })[]
    total: number
  }>('/api/activities/my-registrations', params ? { params } as any : undefined)
}

// 获取活动参与者列表
export const getActivityParticipants = (activityId: string, params?: {
  status?: ParticipationStatus[]
  search?: string
  page?: number
  limit?: number
}) => {
  return request.get<{
    data: any[]
    total: number
  }>(`/api/activities/${activityId}/participants`, params ? { params } as any : undefined)
}

// 活动反馈相关
export const submitFeedback = (activityId: string, feedback: Omit<ActivityFeedback, 'id' | 'participantId' | 'participantName' | 'createdTime'>) => {
  return request.post<ActivityFeedback>(`/api/activities/${activityId}/feedback`, feedback)
}

export const getActivityFeedback = (activityId: string, params?: {
  page?: number
  limit?: number
  sortBy?: 'rating' | 'date'
  sortOrder?: 'asc' | 'desc'
}) => {
  return request.get<{
    data: ActivityFeedback[]
    total: number
    averageRating: number
    ratingDistribution: Record<number, number>
  }>(`/api/activities/${activityId}/feedback`, params ? { params } as any : undefined)
}

// 活动互动功能
export const likeActivity = (id: string) => {
  return request.post<void>(`/api/activities/${id}/like`)
}

export const unlikeActivity = (id: string) => {
  return request.delete<void>(`/api/activities/${id}/like`)
}

export const shareActivity = (id: string, platform?: string) => {
  return request.post<void>(`/api/activities/${id}/share`, { platform })
}

// 活动日历
export const getActivityCalendar = (params?: {
  startDate?: Date
  endDate?: Date
  types?: string[]
  formats?: string[]
  userId?: string
  departmentId?: string
}) => {
  return request.get<ActivityCalendarEvent[]>('/api/activities/calendar', params ? { params } as any : undefined)
}

// 活动推荐
export const getRecommendedActivities = (params?: {
  limit?: number
  userId?: string
  excludeRegistered?: boolean
}) => {
  return request.get<{
    data: ActivityRecommendation[]
    total: number
  }>('/api/activities/recommended', params ? { params } as any : undefined)
}

// 热门活动
export const getPopularActivities = (params?: {
  timeRange?: 'week' | 'month' | 'quarter' | 'year'
  limit?: number
  type?: string
}) => {
  return request.get<{
    data: KnowledgeActivity[]
    total: number
  }>('/api/activities/popular', params ? { params } as any : undefined)
}

// 即将开始的活动
export const getUpcomingActivities = (params?: {
  limit?: number
  days?: number
  userId?: string
}) => {
  return request.get<{
    data: KnowledgeActivity[]
    total: number
  }>('/api/activities/upcoming', params ? { params } as any : undefined)
}

// 活动系列
export const getActivitySeries = (params?: {
  page?: number
  limit?: number
  active?: boolean
}) => {
  return request.get<{
    data: ActivitySeries[]
    total: number
  }>('/api/activities/series', params ? { params } as any : undefined)
}

export const getSeriesDetail = (id: string) => {
  return request.get<ActivitySeries>(`/api/activities/series/${id}`)
}

export const createSeries = (data: Omit<ActivitySeries, 'id' | 'createdAt' | 'updatedAt'>) => {
  return request.post<ActivitySeries>('/api/activities/series', data)
}

// 活动通知
export const getActivityNotifications = (params?: {
  read?: boolean
  type?: string
  page?: number
  limit?: number
}) => {
  return request.get<{
    data: ActivityNotification[]
    total: number
    unreadCount: number
  }>('/api/activities/notifications', params ? { params } as any : undefined)
}

export const markNotificationRead = (id: string) => {
  return request.post<void>(`/api/activities/notifications/${id}/read`)
}

export const markAllNotificationsRead = () => {
  return request.post<void>('/api/activities/notifications/read-all')
}

// 活动资源
export const uploadActivityResource = (activityId: string, file: File, description?: string) => {
  const formData = new FormData()
  formData.append('file', file)
  if (description) {
    formData.append('description', description)
  }
  
  return request.post<{
    id: string
    name: string
    url: string
    size: number
    type: string
  }>(`/api/activities/${activityId}/resources`, formData)
}

export const deleteActivityResource = (activityId: string, resourceId: string) => {
  return request.delete<void>(`/api/activities/${activityId}/resources/${resourceId}`)
}

export const downloadActivityResource = (activityId: string, resourceId: string) => {
  return request.get<Blob>(`/api/activities/${activityId}/resources/${resourceId}/download`)
}

// 活动统计和分析
export const getActivityStats = (activityId: string) => {
  return request.get<ActivityAnalytics>(`/api/activities/${activityId}/stats`)
}

export const getActivityAnalytics = (params?: {
  startDate?: Date
  endDate?: Date
  organizerId?: string
  departmentId?: string
  type?: string
}) => {
  return request.get<{
    totalActivities: number
    totalParticipants: number
    averageRating: number
    completionRate: number
    trends: any[]
    topCategories: any[]
  }>('/api/activities/analytics', params ? { params } as any : undefined)
}

// 活动导出
export const exportActivities = (params?: ActivitySearchParams & {
  format?: 'excel' | 'csv' | 'pdf'
  fields?: string[]
}) => {
  return request.get<Blob>('/api/activities/export', params ? { params } as any : undefined)
}

export const exportActivityParticipants = (activityId: string, params?: {
  format?: 'excel' | 'csv'
  fields?: string[]
}) => {
  return request.get<Blob>(`/api/activities/${activityId}/participants/export`, params ? { params } as any : undefined)
}

// 活动模板
export const getActivityTemplates = (params?: {
  type?: string
  category?: string
  page?: number
  limit?: number
}) => {
  return request.get<{
    data: any[]
    total: number
  }>('/api/activities/templates', params ? { params } as any : undefined)
}

export const createActivityFromTemplate = (templateId: string, data: Partial<ActivityRequest>) => {
  return request.post<KnowledgeActivity>(`/api/activities/templates/${templateId}/create`, data)
}

// 活动标签
export const getActivityTags = (params?: {
  query?: string
  limit?: number
  popular?: boolean
}) => {
  return request.get<{
    id: string
    name: string
    usageCount: number
  }[]>('/api/activities/tags', params ? { params } as any : undefined)
}

// 活动评论
export const getActivityComments = (activityId: string, params?: {
  page?: number
  limit?: number
  sortBy?: 'date' | 'likes'
  sortOrder?: 'asc' | 'desc'
}) => {
  return request.get<{
    data: any[]
    total: number
  }>(`/api/activities/${activityId}/comments`, params ? { params } as any : undefined)
}

export const addActivityComment = (activityId: string, content: string, parentId?: string) => {
  return request.post<any>(`/api/activities/${activityId}/comments`, { content, parentId })
}

export const deleteActivityComment = (activityId: string, commentId: string) => {
  return request.delete<void>(`/api/activities/${activityId}/comments/${commentId}`)
}

export const likeActivityComment = (activityId: string, commentId: string) => {
  return request.post<void>(`/api/activities/${activityId}/comments/${commentId}/like`)
} 