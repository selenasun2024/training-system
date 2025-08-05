import request from '@/utils/request'

/**
 * 获取问卷模板列表
 * GET /api/assessment-center/templates
 */
export const getTemplateList = async (params?: {
  type?: 'evaluation' | 'survey'
  status?: 'draft' | 'published' | 'archived'
  keyword?: string
}) => {
  console.log('📡 API: 调用获取问卷模板列表 - 参数:', params)
  try {
    const response = await request.get('/api/assessment-center/templates', { params })
    console.log('✅ API: 获取问卷模板列表成功，数据:', response)
    return response
  } catch (error) {
    console.error('❌ API: 获取问卷模板列表失败:', error)
    throw error
  }
}

/**
 * 获取问卷模板详情
 * GET /api/assessment-center/templates/{id}
 */
export const getTemplateDetail = async (templateId: string) => {
  console.log('📡 API: 调用获取问卷模板详情 - 模板ID:', templateId)
  try {
    const response = await request.get(`/api/assessment-center/templates/${templateId}`)
    console.log('✅ API: 获取问卷模板详情成功，数据:', response)
    return response
  } catch (error) {
    console.error('❌ API: 获取问卷模板详情失败:', error)
    throw error
  }
}

/**
 * 创建问卷模板
 * POST /api/assessment-center/templates
 */
export const createTemplate = async (templateData: any) => {
  console.log('📡 API: 调用创建问卷模板 - 数据:', templateData)
  try {
    const response = await request.post('/api/assessment-center/templates', templateData)
    console.log('✅ API: 创建问卷模板成功，结果:', response)
    return response
  } catch (error) {
    console.error('❌ API: 创建问卷模板失败:', error)
    throw error
  }
}

/**
 * 更新问卷模板
 * PUT /api/assessment-center/templates/{id}
 */
export const updateTemplate = async (templateId: string, templateData: any) => {
  console.log('📡 API: 调用更新问卷模板 - 模板ID:', templateId, '数据:', templateData)
  try {
    const response = await request.put(`/api/assessment-center/templates/${templateId}`, templateData)
    console.log('✅ API: 更新问卷模板成功，结果:', response)
    return response
  } catch (error) {
    console.error('❌ API: 更新问卷模板失败:', error)
    throw error
  }
}

/**
 * 删除问卷模板
 * DELETE /api/assessment-center/templates/{id}
 */
export const deleteTemplate = async (templateId: string) => {
  console.log('📡 API: 调用删除问卷模板 - 模板ID:', templateId)
  try {
    const response = await request.delete(`/api/assessment-center/templates/${templateId}`)
    console.log('✅ API: 删除问卷模板成功，结果:', response)
    return response
  } catch (error) {
    console.error('❌ API: 删除问卷模板失败:', error)
    throw error
  }
} 