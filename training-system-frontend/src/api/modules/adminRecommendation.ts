import request from '@/utils/request'
import type { AdminRecommendation, ReviewPayload } from '@/types/recommendation'

// 获取推荐列表
export const getAdminRecommendations = (projectId: string, params?: any) => {
  const url = `/api/recommendations/admin/projects/${projectId}`
  return request.get<any>(params ? `${url}?${new URLSearchParams(params)}` : url)
}

// 审核推荐
export const reviewRecommendation = (projectId: string, payload: ReviewPayload) => {
  return request.post(`/api/recommendations/admin/projects/${projectId}/recommendations/${payload.id}/review`, {
    status: payload.type === 'approve' ? 'APPROVED' : 'REJECTED',
    comment: payload.comment
  })
}

// 获取推荐统计
export const getRecommendationStats = (projectId: string) => {
  return request.get(`/api/recommendations/admin/projects/${projectId}/stats`)
}

// 提交最终名单 (保持向后兼容)
export const submitFinalList = (projectId: string) => {
  return request.post(`/api/recommendations/admin/projects/${projectId}/submit-final`)
} 