import request from '@/utils/request'

/**
 * 评价管理相关接口
 * 用于教务工作台的评价管理功能
 */

export interface EvaluationOverview {
  id: string
  projectId: string
  projectName: string
  phaseName?: string
  evaluationType: 'student_to_mentor' | 'mentor_to_student' | 'mutual'
  mentorId: string
  mentorName: string
  studentId: string
  studentName: string
  totalScore?: number
  status: 'pending' | 'completed' | 'expired'
  followupStatus: 'pending_followup' | 'completed_followup' | 'no_followup'
  completedAt?: string
  createdAt: string
  dueDate?: string
}

export interface EvaluationStats {
  totalEvaluations: number
  pendingEvaluations: number
  completedEvaluations: number
  pendingFollowups: number
  averageScore?: number
}

export interface FollowupData {
  evaluationId: string
  followupBy: string
  followupDate: string
  followupContent: string
  followupScore?: number
  suggestions?: string
  followupType: 'phone' | 'visit' | 'online'
}

/**
 * 获取所有评价数据
 * GET /api/mentorship/evaluations
 */
export const getAllEvaluations = async (params?: {
  page?: number
  pageSize?: number
  projectId?: string
  evaluationType?: string
  status?: string
  followupStatus?: string
  search?: string
  sortField?: string
  sortOrder?: string
}) => {
  try {
    const response = await request.get('/api/mentorship/evaluations', { params })
    return response
  } catch (error) {
    console.error('获取评价数据失败:', error)
    throw error
  }
}

/**
 * 获取评价统计数据
 * GET /api/mentorship/evaluations/stats
 */
export const getEvaluationStats = async () => {
  try {
    const response = await request.get('/api/mentorship/evaluations/stats')
    return response
  } catch (error) {
    console.error('获取评价统计失败:', error)
    throw error
  }
}

/**
 * 获取评价详情
 * GET /api/mentorship/evaluations/{id}
 */
export const getEvaluationDetail = async (evaluationId: string) => {
  try {
    const response = await request.get(`/api/mentorship/evaluations/${evaluationId}`)
    return response
  } catch (error) {
    console.error('获取评价详情失败:', error)
    throw error
  }
}

/**
 * 提交教务回访
 * POST /api/mentorship/evaluations/{id}/followup
 */
export const submitFollowup = async (evaluationId: string, followupData: FollowupData) => {
  try {
    const response = await request.post(`/api/mentorship/evaluations/${evaluationId}/followup`, followupData)
    return response
  } catch (error) {
    console.error('提交教务回访失败:', error)
    throw error
  }
}

/**
 * 获取回访记录
 * GET /api/mentorship/evaluations/{id}/followup
 */
export const getFollowupRecord = async (evaluationId: string) => {
  try {
    const response = await request.get(`/api/mentorship/evaluations/${evaluationId}/followup`)
    return response
  } catch (error) {
    console.error('获取回访记录失败:', error)
    throw error
  }
}

/**
 * 获取项目列表（用于筛选）
 * GET /api/projects
 */
export const getProjectsForFilter = async () => {
  try {
    const response = await request.get('/api/projects', {
      params: { pageSize: 999 }
    })
    return response
  } catch (error) {
    console.error('获取项目列表失败:', error)
    throw error
  }
} 