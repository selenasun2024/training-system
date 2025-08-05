import request from '@/utils/request'
import axios from 'axios'

// =====================================================
// 🏢 项目详情-带教 API 调用函数
// =====================================================

/**
 * 获取项目师徒关系
 * GET /api/projects/{projectId}/mentorship/relationships
 */
export const getProjectRelationships = async (projectId: string, status?: string) => {
  console.log('🔍 API: 调用获取项目师徒关系 - 项目ID:', projectId, '状态:', status)
  try {
    const params: any = {}
    if (status) params.status = status
    
    const response = await request.get(`/api/projects/${projectId}/mentorship/relationships`, { params })
    console.log('✅ API: 获取项目师徒关系成功，数据:', response)
    return response
  } catch (error) {
    console.error('❌ API: 获取项目师徒关系失败:', error)
    throw error
  }
}

/**
 * 创建师徒关系
 * POST /api/projects/{projectId}/mentorship/relationships
 */
export const createMentorshipRelationship = async (projectId: string, data: any) => {
  console.log('📝 API: 调用创建师徒关系 - 项目ID:', projectId, '数据:', data)
  try {
    const response = await request.post(`/api/projects/${projectId}/mentorship/relationships`, data)
    console.log('✅ API: 创建师徒关系成功，结果:', response)
    return response
  } catch (error) {
    console.error('❌ API: 创建师徒关系失败:', error)
    throw error
  }
}

/**
 * 获取带教进度数据
 * GET /api/projects/{projectId}/mentorship/progress
 */
export const getMentorshipProgress = async (projectId: string, params?: any) => {
  console.log('🔍 API: 调用获取带教进度 - 项目ID:', projectId, '参数:', params)
  try {
    const config = params ? { params } : {}
    const response = await request.get(`/api/projects/${projectId}/mentorship/progress`, config)
    console.log('✅ API: 获取带教进度成功，数据:', response)
    return response
  } catch (error) {
    console.error('❌ API: 获取带教进度失败:', error)
    throw error
  }
}

/**
 * 获取带教评价
 * GET /api/projects/{projectId}/mentorship/evaluations
 */
export const getProjectEvaluations = async (projectId: string, params?: any) => {
  console.log('🔍 API: 调用获取带教评价 - 项目ID:', projectId, '参数:', params)
  try {
    const response = await request.get(`/api/projects/${projectId}/mentorship/evaluations`, { params })
    console.log('✅ API: 获取带教评价成功，数据:', response)
    return response
  } catch (error) {
    console.error('❌ API: 获取带教评价失败:', error)
    throw error
  }
}

/**
 * 提交带教评价
 * POST /api/projects/{projectId}/mentorship/evaluations
 */
export const submitMentorshipEvaluation = async (projectId: string, data: any) => {
  console.log('📝 API: 调用提交带教评价 - 项目ID:', projectId, '数据:', data)
  try {
    const response = await request.post(`/api/projects/${projectId}/mentorship/evaluations`, data)
    console.log('✅ API: 提交带教评价成功，结果:', response)
    return response
  } catch (error) {
    console.error('❌ API: 提交带教评价失败:', error)
    throw error
  }
}

/**
 * 删除带教评价
 * DELETE /api/projects/{projectId}/mentorship/evaluations/{evaluationId}
 */
export const deleteProjectEvaluation = async (projectId: string, evaluationId: string) => {
  console.log('🗑️ API: 调用删除带教评价 - 项目ID:', projectId, '评价ID:', evaluationId)
  try {
    const response = await request.delete(`/api/projects/${projectId}/mentorship/evaluations/${evaluationId}`)
    console.log('✅ API: 删除带教评价成功，结果:', response)
    return response
  } catch (error) {
    console.error('❌ API: 删除带教评价失败:', error)
    throw error
  }
}

/**
 * 更新师徒关系状态
 * PUT /api/projects/{projectId}/mentorship/relationships/{relationshipId}/status
 */
export const updateMentorshipRelationshipStatus = async (projectId: string, relationshipId: string, status: string, reason?: string) => {
  console.log('📝 API: 调用更新师徒关系状态 - 项目ID:', projectId, '关系ID:', relationshipId, '状态:', status)
  try {
    const response = await request.put(`/api/projects/${projectId}/mentorship/relationships/${relationshipId}/status`, {
      status,
      reason,
      updatedAt: new Date().toISOString()
    })
    console.log('✅ API: 更新师徒关系状态成功，结果:', response)
    return response
  } catch (error) {
    console.error('❌ API: 更新师徒关系状态失败:', error)
    throw error
  }
}

/**
 * 更换师徒关系中的导师
 * PUT /api/projects/{projectId}/mentorship/relationships/{relationshipId}/mentor
 */
export const changeMentorshipMentor = async (projectId: string, relationshipId: string, newMentorId: string, reason: string) => {
  console.log('📝 API: 调用更换师徒关系导师 - 项目ID:', projectId, '关系ID:', relationshipId, '新导师ID:', newMentorId)
  try {
    const response = await request.put(`/api/projects/${projectId}/mentorship/relationships/${relationshipId}/mentor`, {
      newMentorId,
      reason,
      updatedAt: new Date().toISOString()
    })
    console.log('✅ API: 更换师徒关系导师成功，结果:', response)
    return response
  } catch (error) {
    console.error('❌ API: 更换师徒关系导师失败:', error)
    throw error
  }
}

/**
 * 删除师徒关系
 * DELETE /api/projects/{projectId}/mentorship/relationships/{relationshipId}
 */
export const deleteMentorshipRelationship = async (projectId: string, relationshipId: string, reason?: string) => {
  console.log('📝 API: 调用删除师徒关系 - 项目ID:', projectId, '关系ID:', relationshipId)
  try {
    const response = await request.delete(`/api/projects/${projectId}/mentorship/relationships/${relationshipId}`, {
      data: { reason }
    })
    console.log('✅ API: 删除师徒关系成功，结果:', response)
    return response
  } catch (error) {
    console.error('❌ API: 删除师徒关系失败:', error)
    throw error
  }
}

/**
 * 获取带教标准
 * GET /api/projects/{projectId}/mentorship/standards
 */
export const getMentorshipStandards = async (projectId: string, category?: string) => {
  console.log('🔍 API: 调用获取带教标准 - 项目ID:', projectId, '分类:', category)
  try {
    const params: any = {}
    if (category) params.category = category
    
    const response = await request.get(`/api/projects/${projectId}/mentorship/standards`, { params })
    console.log('✅ API: 获取带教标准成功，数据:', response)
    return response
  } catch (error) {
    console.error('❌ API: 获取带教标准失败:', error)
    throw error
  }
}

/**
 * 获取项目参与者（学员）
 * GET /api/projects/{projectId}/participants
 */
export const getProjectParticipants = async (projectId: string, role?: string) => {
  console.log('🔍 API: 调用获取项目参与者 - 项目ID:', projectId, '角色:', role)
  try {
    const params: any = {}
    if (role) params.role = role
    
    const response = await request.get(`/api/projects/${projectId}/participants`, { params })
    console.log('✅ API: 获取项目参与者成功，数据:', response)
    return response
  } catch (error) {
    console.error('❌ API: 获取项目参与者失败:', error)
    throw error
  }
}

/**
 * 获取所有用户（潜在导师）
 * GET /api/users
 */
export const getAllUsers = async (params?: any) => {
  console.log('🔍 API: 调用获取所有用户 - 参数:', params)
  try {
    const response = await request.get('/api/users', { params })
    console.log('✅ API: 获取所有用户成功，数据:', response)
    return response
  } catch (error) {
    console.error('❌ API: 获取所有用户失败:', error)
    throw error
  }
}

/**
 * 获取可用的导师列表
 * GET /api/users/mentors
 */
export const getAvailableMentors = async (params?: any) => {
  console.log('🔍 API: 调用获取可用导师 - 参数:', params)
  try {
    const response = await request.get('/api/users/mentors', { params })
    console.log('✅ API: 获取可用导师成功，数据:', response)
    return response
  } catch (error) {
    console.error('❌ API: 获取可用导师失败:', error)
    throw error
  }
}

// =====================================================
// 类型定义
// =====================================================

export interface MentorshipRelationship {
  id: string
  projectId: string
  mentorId: string
  mentorName: string
  studentId: string
  studentName: string
  type: string
  status: string
  matchingScore?: number
  matchingType: string
  establishedDate: string
  expectedDuration: number
  progress: number
}

export interface MentorshipProgress {
  projectId: string
  relationships: {
    id: string
    mentorName: string
    studentName: string
    progress: number
    currentPhase: string
    completedTasks: number
    totalTasks: number
    lastUpdateDate: string
  }[]
  summary: {
    totalStudents: number
    averageProgress: number
    completedRelationships: number
    inProgressRelationships: number
  }
}

export interface MentorshipEvaluation {
  id: string
  projectId: string
  relationshipId: string
  evaluatorId: string
  evaluatorName: string
  evaluateeId: string
  evaluateeName: string
  type: 'mentor_to_student' | 'student_to_mentor' | 'phase_evaluation'
  phase: string
  score: number
  feedback: string
  strengths: string[]
  improvements: string[]
  recommendations: string[]
  evaluationDate: string
}

export interface MentorshipStandard {
  id: string
  category: string
  title: string
  description: string
  criteria: {
    name: string
    description: string
    weight: number
    scoreRange: { min: number; max: number }
  }[]
  evaluationMethods: string[]
  passingScore: number
}

/**
 * 获取学员在项目中的任务详情
 * GET /api/projects/{projectId}/mentorship/students/{studentId}/tasks
 */
export const getStudentTaskDetails = async (projectId: string, studentId: string) => {
  console.log('📡 API: 获取学员任务详情 - 项目ID:', projectId, '学员ID:', studentId)
  
  try {
    // 直接使用axios，绕过响应拦截器
    const response = await axios.get(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'}/api/projects/${projectId}/mentorship/students/${studentId}/tasks`)
    console.log('✅ API: 获取学员任务详情成功:', response.data)
    
    // 直接返回完整的响应数据
    return response.data
  } catch (error) {
    console.error('❌ API: 获取学员任务详情失败:', error)
    throw error
  }
}

/**
 * 提交师徒反馈
 * POST /api/projects/{projectId}/mentorship/students/{studentId}/feedback
 */
export const submitMentorshipFeedback = async (projectId: string, studentId: string, feedbackData: any) => {
  console.log('📡 API: 提交师徒反馈 - 项目ID:', projectId, '学员ID:', studentId)
  
  try {
    const response = await request.post(`/api/projects/${projectId}/mentorship/students/${studentId}/feedback`, feedbackData)
    console.log('✅ API: 提交师徒反馈成功:', response.data)
    return response.data
  } catch (error) {
    console.error('❌ API: 提交师徒反馈失败:', error)
    throw error
  }
}

/**
 * 获取学员反馈记录
 * GET /api/projects/{projectId}/mentorship/students/{studentId}/feedback
 */
export const getStudentFeedback = async (projectId: string, studentId: string) => {
  return request.get(`/api/projects/${projectId}/mentorship/students/${studentId}/feedback`)
}

// ===============================
// 阶段指派模式相关API
// ===============================

/**
 * 获取项目的师徒阶段列表
 * GET /api/projects/{projectId}/mentorship/phases
 */
export const getProjectMentorshipPhases = async (projectId: string) => {
  console.log('📡 API: 获取项目师徒阶段 - 项目ID:', projectId)
  
  try {
    const response = await request.get(`/api/projects/${projectId}/mentorship/phases`)
    console.log('✅ API: 获取师徒阶段成功:', response)
    return response
  } catch (error) {
    console.error('❌ API: 获取师徒阶段失败:', error)
    throw error
  }
}

/**
 * 创建阶段师徒关系
 * POST /api/projects/{projectId}/mentorship/phases/{phaseId}/relationships
 */
export const createPhaseAssignment = async (
  projectId: string, 
  phaseId: string, 
  assignmentData: {
    mentorId: string
    studentIds: string[]
    assignmentMode?: 'batch' | 'individual'
    remarks?: string
  }
) => {
  console.log('📡 API: 创建阶段指派', { projectId, phaseId, assignmentData })
  
  try {
    const response = await request.post(
      `/api/projects/${projectId}/mentorship/phases/${phaseId}/relationships`,
      assignmentData
    )
    console.log('✅ API: 阶段指派创建成功:', response)
    return response
  } catch (error) {
    console.error('❌ API: 阶段指派创建失败:', error)
    throw error
  }
}

/**
 * 获取阶段的师徒关系
 * GET /api/projects/{projectId}/mentorship/phases/{phaseId}/relationships
 */
export const getPhaseAssignments = async (projectId: string, phaseId: string) => {
  console.log('📡 API: 获取阶段指派', { projectId, phaseId })
  
  try {
    const response = await request.get(
      `/api/projects/${projectId}/mentorship/phases/${phaseId}/relationships`
    )
    console.log('✅ API: 获取阶段指派成功:', response)
    return response
  } catch (error) {
    console.error('❌ API: 获取阶段指派失败:', error)
    throw error
  }
}

/**
 * 删除阶段师徒关系
 * DELETE /api/projects/{projectId}/mentorship/phases/{phaseId}/relationships/{relationshipId}
 */
export const removePhaseAssignment = async (
  projectId: string, 
  phaseId: string, 
  relationshipId: string
) => {
  console.log('📡 API: 删除阶段指派', { projectId, phaseId, relationshipId })
  
  try {
    const response = await request.delete(
      `/api/projects/${projectId}/mentorship/phases/${phaseId}/relationships/${relationshipId}`
    )
    console.log('✅ API: 阶段指派删除成功:', response)
    return response
  } catch (error) {
    console.error('❌ API: 阶段指派删除失败:', error)
    throw error
  }
} 

// =====================================================
// 🏢 教务工作台师徒关系汇总 API 调用函数
// =====================================================

/**
 * 获取所有项目的师徒关系汇总
 * GET /api/mentorship/relationships
 */
export const getAllMentorshipRelationships = async (params?: {
  page?: number;
  pageSize?: number;
  search?: string;
  department?: string;
  status?: string;
  trainingType?: string;
  projectId?: string;
}) => {
  console.log('🔍 API: 调用获取师徒关系汇总', params);
  try {
    const response = await request.get('/api/mentorship/relationships', { params });
    console.log('✅ API: 获取师徒关系汇总成功，数据:', response);
    return response;
  } catch (error) {
    console.error('❌ API: 获取师徒关系汇总失败:', error);
    throw error;
  }
};

/**
 * 获取师徒关系详情
 * GET /api/mentorship/relationships/{relationshipId}
 */
export const getMentorshipRelationshipDetail = async (relationshipId: string) => {
  console.log('🔍 API: 调用获取师徒关系详情', relationshipId);
  try {
    const response = await request.get(`/api/mentorship/relationships/${relationshipId}`);
    console.log('✅ API: 获取师徒关系详情成功，数据:', response);
    return response;
  } catch (error) {
    console.error('❌ API: 获取师徒关系详情失败:', error);
    throw error;
  }
};

/**
 * 获取所有培训项目（用于筛选）
 * GET /api/projects
 */
export const getAllTrainingProjects = async () => {
  console.log('🔍 API: 调用获取所有培训项目');
  try {
    const response = await request.get('/api/projects');
    console.log('✅ API: 获取培训项目成功，数据:', response);
    return response;
  } catch (error) {
    console.error('❌ API: 获取培训项目失败:', error);
    throw error;
  }
};

// =====================================================
// 师徒关系汇总数据类型定义
// =====================================================

export interface MentorshipRelationshipOverview {
  id: string;
  mentorInfo: {
    id: string;
    name: string;
    department: string;
    position: string;
  };
  studentInfo: {
    id: string;
    name: string;
    department: string;
    position: string;
  };
  project: {
    id: string;
    name: string;
    type: string;
  };
  relationType: string;
  establishedDate: string;
  status: string;
  statusText: string;
  statusType: string;
  progress: number;
  phase?: string;
  phaseId?: string;
}

export interface MentorshipRelationshipStats {
  total: number;
  active: number;
  completed: number;
  paused: number;
  terminated: number;
  graduationRate: number;
} 