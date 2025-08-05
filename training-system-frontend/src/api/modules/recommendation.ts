import request from '@/utils/request'
import type { StudentPerformance, RecommendationForm } from '@/types/recommendation'

// 获取学员表现数据
export const getStudentPerformance = async (projectId: string): Promise<StudentPerformance[]> => {
  try {
    console.log('🔍 API: 请求学员表现数据, projectId:', projectId)
    
    // 获取当前用户ID作为辅导员ID
    const currentUserId = localStorage.getItem('userId')
    console.log('🔍 API: 使用辅导员ID:', currentUserId)
    
    const response = await request.get(`/api/recommendations/projects/${projectId}/students`, {
      params: {
        counselorId: currentUserId
      }
    })
    console.log('🔍 API: 获取学员表现数据响应:', response)
    
    // 处理响应数据
    if (response && typeof response === 'object') {
      // 如果响应有success字段，检查是否成功
      if ('success' in response) {
        if (response.success && response.data) {
          return Array.isArray(response.data) ? response.data : []
        } else {
          console.warn('🔍 API: 后端返回失败状态:', response)
          return []
        }
      } else if ('data' in response) {
        // 如果响应有data字段，使用data字段
        return Array.isArray(response.data) ? response.data : []
      } else if (Array.isArray(response)) {
        // 如果响应直接是数组
        return response
      }
    }
    
    console.warn('🔍 API: 响应数据格式不正确:', response)
    return []
  } catch (error) {
    console.error('🔍 API: 获取学员表现数据失败:', error)
    throw error
  }
}

// 提交推荐
export const submitRecommendation = async (projectId: string, form: RecommendationForm): Promise<void> => {
  try {
    console.log('🔍 API: 提交推荐, projectId:', projectId, 'form:', form)
    const response = await request.post(`/api/recommendations/projects/${projectId}`, form)
    console.log('🔍 API: 提交推荐响应:', response)
  } catch (error) {
    console.error('🔍 API: 提交推荐失败:', error)
    throw error
  }
}

// 获取辅导员的推荐记录
export const getCounselorRecommendations = async (projectId: string): Promise<any[]> => {
  try {
    console.log('🔍 API: 获取推荐记录, projectId:', projectId)
    
    // 获取当前用户ID作为辅导员ID
    const currentUserId = localStorage.getItem('userId')
    console.log('🔍 API: 使用辅导员ID:', currentUserId)
    
    const response = await request.get(`/api/recommendations/projects/${projectId}/my-recommendations`, {
      params: {
        counselorId: currentUserId
      }
    })
    console.log('🔍 API: 获取推荐记录响应:', response)
    
    // 处理响应数据
    if (response && typeof response === 'object') {
      if ('success' in response && response.success && response.data) {
        return Array.isArray(response.data) ? response.data : []
      } else if ('data' in response) {
        return Array.isArray(response.data) ? response.data : []
      } else if (Array.isArray(response)) {
        return response
      }
    }
    
    console.warn('🔍 API: 推荐记录响应数据格式不正确:', response)
    return []
  } catch (error) {
    console.error('🔍 API: 获取推荐记录失败:', error)
    throw error
  }
}

// 更新学员表现
export const updateStudentPerformance = async (projectId: string, studentId: string, performance: Partial<StudentPerformance>): Promise<void> => {
  try {
    console.log('🔍 API: 更新学员表现, projectId:', projectId, 'studentId:', studentId, 'performance:', performance)
    const response = await request.put(`/api/recommendations/projects/${projectId}/students/${studentId}/performance`, performance)
    console.log('🔍 API: 更新学员表现响应:', response)
  } catch (error) {
    console.error('🔍 API: 更新学员表现失败:', error)
    throw error
  }
} 

// 获取有推荐记录的项目列表（管理员专用）
export function getProjectsWithRecommendations() {
  return request.get('/api/recommendations/admin/projects-with-recommendations');
} 