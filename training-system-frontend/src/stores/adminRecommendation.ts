import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { AdminRecommendation, RecommendationStats, ReviewPayload } from '@/types/recommendation'
import { getAdminRecommendations, reviewRecommendation, submitFinalList, getRecommendationStats } from '@/api/modules/adminRecommendation'

export const useAdminRecommendationStore = defineStore('adminRecommendation', () => {
  const loading = ref(false)
  const recommendations = ref<AdminRecommendation[]>([])
  const statsData = ref<any>(null)

  // 统计数据 - 优先使用API数据，如果没有则计算
  const stats = computed<RecommendationStats>(() => {
    if (statsData.value) {
      // 使用API返回的统计数据
      return {
        yulin: {
          total: recommendations.value.filter(r => r.type === 'yulin').length,
          pending: recommendations.value.filter(r => r.type === 'yulin' && r.status === 'pending').length,
          approved: recommendations.value.filter(r => r.type === 'yulin' && r.status === 'approved').length,
          rejected: recommendations.value.filter(r => r.type === 'yulin' && r.status === 'rejected').length
        },
        jinyi: {
          total: recommendations.value.filter(r => r.type === 'jinyi').length,
          pending: recommendations.value.filter(r => r.type === 'jinyi' && r.status === 'pending').length,
          approved: recommendations.value.filter(r => r.type === 'jinyi' && r.status === 'approved').length,
          rejected: recommendations.value.filter(r => r.type === 'jinyi' && r.status === 'rejected').length
        },
        counselors: {
          total: new Set(recommendations.value.map(r => r.counselor)).size,
          submitted: new Set(recommendations.value.map(r => r.counselor)).size,
          pending: 0
        },
        progress: Math.round((recommendations.value.filter(r => r.status === 'approved' || r.status === 'rejected').length / recommendations.value.length) * 100) || 0
      }
    }
    
    // 如果没有API数据，计算本地数据
    const result = {
      yulin: {
        total: 0,
        pending: 0,
        approved: 0,
        rejected: 0
      },
      jinyi: {
        total: 0,
        pending: 0,
        approved: 0,
        rejected: 0
      },
      counselors: {
        total: new Set(recommendations.value.map(r => r.counselor)).size,
        submitted: 0,
        pending: 0
      },
      progress: 0
    }

    // 计算各状态数量
    recommendations.value.forEach(item => {
      const type = item.type
      result[type].total++
      result[type][item.status]++
    })

    // 计算辅导员提交情况
    const counselorStats = new Map()
    recommendations.value.forEach(item => {
      if (!counselorStats.has(item.counselor)) {
        counselorStats.set(item.counselor, true)
      }
    })
    result.counselors.submitted = counselorStats.size
    result.counselors.pending = result.counselors.total - result.counselors.submitted

    // 计算总进度
    const totalReviewed = recommendations.value.filter(
      item => item.status === 'approved' || item.status === 'rejected'
    ).length
    result.progress = Math.round((totalReviewed / recommendations.value.length) * 100) || 0

    return result
  })

  // 当前项目
  const currentProjectId = ref<string>('')

  // 获取推荐列表
  const fetchRecommendations = async (projectId: string) => {
    if (!projectId) return
    currentProjectId.value = projectId
    loading.value = true
    try {
      // 并行获取推荐列表和统计数据
      const [recommendationsResponse, stats] = await Promise.all([
        getAdminRecommendations(projectId),
        getRecommendationStats(projectId)
      ])
      
      // 处理后端响应格式 {success: true, data: {recommendations: [...]}}
      console.log('🔍 API响应数据:', recommendationsResponse)
      
      let rawRecommendations = []
      
      if (recommendationsResponse?.data?.recommendations) {
        rawRecommendations = recommendationsResponse.data.recommendations
      } else if (Array.isArray(recommendationsResponse)) {
        // 如果直接是数组（兼容性处理）
        rawRecommendations = recommendationsResponse
      } else {
        console.warn('未知的推荐数据格式:', recommendationsResponse)
        rawRecommendations = []
      }
      
      // 转换数据格式以匹配前端组件期望
      const transformedRecommendations = rawRecommendations.map((item: any) => {
        // 详细的类型转换逻辑和调试
        const originalType = item.type
        let convertedType = 'jinyi' // 默认值
        
        if (originalType) {
          const lowerType = originalType.toLowerCase()
          if (lowerType === 'yulin') {
            convertedType = 'yulin'
          } else if (lowerType === 'jinyi') {
            convertedType = 'jinyi'
          } else {
            console.warn('🔍 未知的推荐类型:', originalType, '默认使用jinyi')
            convertedType = 'jinyi'
          }
        }
        
        console.log(`🔍 类型转换: ${originalType} -> ${convertedType}`)
        
        return {
          id: item.id,
          studentId: item.student_id || item.studentId || '未知ID',
          studentName: item.student_name || item.studentName || '未知学员',
          counselor: item.counselor_name || item.counselorName || '未知推荐人',
          department: item.student_department || item.department || '未知部门',
          position: item.student_position || item.position || '未知职位',
          projectId: item.project_id || item.projectId || '',
          type: convertedType,
          status: item.status?.toLowerCase() || 'pending',
          scores: {
            leadership: item.leadership || 0,
            innovation: item.innovation || 0,
            execution: item.execution || 0,
            teamwork: item.teamwork || 0
          },
          reason: item.reason || '',
          tags: item.tags || [],
          recommendTime: item.createdAt ? new Date(item.createdAt).toLocaleString() : '',
          reviewComment: item.reviewComment || '',
          reviewedAt: item.reviewedAt,
          // 保留原始数据以备需要
          originalData: item
        }
      })
      
      console.log('🔍 转换后的推荐数据详情:')
      transformedRecommendations.forEach((rec: any, index: number) => {
        console.log(`  ${index + 1}. ID: ${rec.id}, 学员: ${rec.studentName}, 类型: ${rec.type}, 状态: ${rec.status}`)
      })
      
      // 按类型统计
      const yulinCount = transformedRecommendations.filter((r: any) => r.type === 'yulin').length
      const jinyiCount = transformedRecommendations.filter((r: any) => r.type === 'jinyi').length
      console.log(`🔍 推荐类型统计: 羽林卫(${yulinCount}), 锦衣卫(${jinyiCount})`)
      
      recommendations.value = transformedRecommendations
      
      statsData.value = stats
    } catch (error) {
      console.error('获取推荐列表失败:', error)
      throw error
    } finally {
      loading.value = false
    }
  }

  // 获取推荐列表（累积模式，不清空现有数据）
  const appendRecommendations = async (projectId: string) => {
    if (!projectId) return
    loading.value = true
    try {
      // 获取推荐数据，但不清空现有的recommendations
      const [recommendationsResponse, stats] = await Promise.all([
        getAdminRecommendations(projectId),
        getRecommendationStats(projectId)
      ])
      
      console.log('🔍 累积模式API响应数据:', recommendationsResponse)
      
      let rawRecommendations = []
      
      if (recommendationsResponse?.data?.recommendations) {
        rawRecommendations = recommendationsResponse.data.recommendations
      } else if (Array.isArray(recommendationsResponse)) {
        rawRecommendations = recommendationsResponse
      } else {
        console.warn('未知的推荐数据格式:', recommendationsResponse)
        rawRecommendations = []
      }
      
      // 转换数据格式
      const transformedRecommendations = rawRecommendations.map((item: any) => {
        const originalType = item.type
        let convertedType = 'jinyi'
        
        if (originalType) {
          const lowerType = originalType.toLowerCase()
          if (lowerType === 'yulin') {
            convertedType = 'yulin'
          } else if (lowerType === 'jinyi') {
            convertedType = 'jinyi'
          }
        }
        
        return {
          id: item.id,
          studentId: item.student_id || item.studentId || '未知ID',
          studentName: item.student_name || item.studentName || '未知学员',
          counselor: item.counselor_name || item.counselorName || '未知推荐人',
          department: item.student_department || item.department || '未知部门',
          position: item.student_position || item.position || '未知职位',
          projectId: item.project_id || item.projectId || projectId,
          type: convertedType,
          status: item.status?.toLowerCase() || 'pending',
          scores: {
            leadership: item.leadership || 0,
            innovation: item.innovation || 0,
            execution: item.execution || 0,
            teamwork: item.teamwork || 0
          },
          reason: item.reason || '',
          tags: item.tags || [],
          recommendTime: item.createdAt ? new Date(item.createdAt).toLocaleString() : '',
          reviewComment: item.reviewComment || '',
          reviewedAt: item.reviewedAt,
          originalData: item
        }
      })
      
      console.log(`🔍 项目 ${projectId} 转换后的推荐数据:`, transformedRecommendations.length, '条')
      
      // 追加到现有数据中，而不是覆盖
      recommendations.value = [...recommendations.value, ...transformedRecommendations]
      
      console.log(`🔍 累积后的总推荐数据:`, recommendations.value.length, '条')
      
    } catch (error) {
      console.error(`获取项目 ${projectId} 推荐列表失败:`, error)
      throw error
    } finally {
      loading.value = false
    }
  }

  // 审核推荐
  const reviewRecommendationAction = async (payload: ReviewPayload) => {
    loading.value = true
    try {
      console.log('🔄 Store: 开始审核推荐', {
        currentProjectId: currentProjectId.value,
        payload
      })
      
      // 先查找要审核的推荐记录，从记录中获取项目ID
      const targetRecommendation = recommendations.value.find(item => item.id === payload.id)
      if (!targetRecommendation) {
        throw new Error(`未找到ID为 ${payload.id} 的推荐记录`)
      }
      
             // 优先使用推荐记录中的项目ID，如果没有则使用当前项目ID
       const projectIdToUse = (targetRecommendation as any).projectId || currentProjectId.value
      
      if (!projectIdToUse) {
        throw new Error('无法确定项目ID，请确保推荐记录包含项目信息')
      }
      
      console.log('🔄 Store: 使用项目ID', projectIdToUse, '审核推荐', payload.id)
      
      const response = await reviewRecommendation(projectIdToUse, payload)
      console.log('✅ Store: 审核推荐API响应', response)
      
      // 更新本地状态
      const index = recommendations.value.findIndex(item => item.id === payload.id)
      if (index !== -1) {
        const newStatus = payload.type === 'approve' ? 'approved' : 'rejected'
        console.log(`🔄 Store: 更新本地状态 ${payload.id} -> ${newStatus}`)
        
        recommendations.value[index] = {
          ...recommendations.value[index],
          status: newStatus,
          reviewComment: payload.comment,
          reviewTime: new Date().toISOString(),
          reviewer: 'Admin' // TODO: 从用户状态获取
        }
        
        console.log('✅ Store: 本地状态更新完成', recommendations.value[index])
      } else {
        console.warn('⚠️ Store: 未找到要更新的推荐记录', payload.id)
      }
      
      return response
    } catch (error) {
      console.error('❌ Store: 审核推荐失败:', error)
      throw error
    } finally {
      loading.value = false
    }
  }

  // 提交最终名单
  const submitFinalListAction = async () => {
    loading.value = true
    try {
      await submitFinalList(currentProjectId.value)
    } catch (error) {
      console.error('提交最终名单失败:', error)
      throw error
    } finally {
      loading.value = false
    }
  }

  return {
    loading,
    recommendations,
    stats,
    fetchRecommendations,
    appendRecommendations,
    reviewRecommendation: reviewRecommendationAction,
    submitFinalList: submitFinalListAction,
    currentProjectId,
  }
}) 