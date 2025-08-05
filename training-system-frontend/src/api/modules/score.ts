import request from '@/utils/request'

/**
 * 获取项目成绩数据
 */
export async function getProjectScores(projectId: string, groupId?: string) {
  console.log('📡 调用真实API: 获取项目成绩 - 项目ID:', projectId)
  
  try {
    const params = new URLSearchParams()
    if (groupId) params.append('groupId', groupId)
    
    const url = `/api/scores/projects/${projectId}${params.toString() ? '?' + params.toString() : ''}`
    const response = await request.get(url)
    console.log('✅ 获取项目成绩成功:', response)
    return response
  } catch (error) {
    console.error('❌ 获取项目成绩失败:', error)
    throw error
  }
}

/**
 * 获取学员个人成绩详情
 */
export async function getStudentScore(projectId: string, studentId: string) {
  console.log('📡 调用真实API: 获取学员成绩 - 项目ID:', projectId, '学员ID:', studentId)
  
  try {
    const response = await request.get(`/api/scores/projects/${projectId}/students/${studentId}`)
    console.log('✅ 获取学员成绩成功:', response)
    return response
  } catch (error) {
    console.error('❌ 获取学员成绩失败:', error)
    throw error
  }
} 