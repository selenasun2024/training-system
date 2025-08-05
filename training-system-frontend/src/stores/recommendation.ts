import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { StudentPerformance, RecommendationForm } from '@/types/recommendation'
import { getStudentPerformance, submitRecommendation, getCounselorRecommendations } from '@/api/modules/recommendation'

export const useRecommendationStore = defineStore('recommendation', () => {
  const loading = ref(false)
  const studentPerformance = ref<StudentPerformance[]>([])
  const recommendationRecords = ref<any[]>([])

  // 计算已推荐的学员ID列表
  const recommendedStudentIds = computed(() => {
    return recommendationRecords.value.map(rec => rec.studentId)
  })

  // 计算过滤掉已推荐学员的列表
  const availableStudents = computed(() => {
    return studentPerformance.value.filter(student => 
      !recommendedStudentIds.value.includes(student.id)
    )
  })

  // 获取学员表现数据
  const fetchStudentPerformance = async (projectId: string) => {
    if (!projectId) {
      console.warn('项目ID为空，无法获取学员数据')
      return
    }
    
    loading.value = true
    try {
      console.log('🔍 Store: 开始获取学员表现数据, projectId:', projectId)
      const response = await getStudentPerformance(projectId)
      
      console.log('🔍 Store: API响应:', response)
      
      // 处理响应数据
      let data: StudentPerformance[] = []
      if (response && typeof response === 'object') {
        // 如果响应有success字段，检查是否成功
        if ('success' in response) {
          const typedResponse = response as any
          if (typedResponse.success && typedResponse.data) {
            data = Array.isArray(typedResponse.data) ? typedResponse.data : []
          } else {
            console.warn('🔍 Store: API返回失败状态:', response)
            data = []
          }
        } else if ('data' in response) {
          // 如果响应有data字段，使用data字段
          const typedResponse = response as any
          data = Array.isArray(typedResponse.data) ? typedResponse.data : []
        } else if (Array.isArray(response)) {
          // 如果响应直接是数组
          data = response
        } else {
          console.warn('🔍 Store: 学员数据响应格式不正确:', response)
          data = []
        }
      } else if (Array.isArray(response)) {
        data = response
      } else {
        console.warn('🔍 Store: 响应数据格式无法识别:', response)
        data = []
      }
      
      studentPerformance.value = data
      console.log('🔍 Store: 学员数据设置成功, 数量:', data.length)
      
    } catch (error) {
      console.error('🔍 Store: 获取学员数据失败:', error)
      studentPerformance.value = []
      throw error
    } finally {
      loading.value = false
    }
  }

  // 获取推荐记录 - 关键修复
  const fetchRecommendationRecords = async (projectId: string) => {
    if (!projectId) {
      console.warn('🔍 Store: 项目ID为空，无法获取推荐记录')
      return
    }
    
    try {
      console.log('🔍 Store: 开始获取推荐记录, projectId:', projectId)
      const response = await getCounselorRecommendations(projectId)
      
      console.log('🔍 Store: 推荐记录API响应:', response)
      console.log('🔍 Store: 响应数据类型:', typeof response, '是否为数组:', Array.isArray(response))
      
      // 增强的数据处理逻辑
      let data: any[] = []
      
      if (response && typeof response === 'object') {
        // 处理带有success标志的响应
        if ('success' in response) {
          const typedResponse = response as any
          if (typedResponse.success && typedResponse.data) {
            data = Array.isArray(typedResponse.data) ? typedResponse.data : []
            console.log('🔍 Store: 从success响应中获取推荐记录:', data.length, '条')
          } else {
            console.warn('🔍 Store: API返回失败状态:', response)
            data = []
          }
        } 
        // 处理直接包含data字段的响应
        else if ('data' in response) {
          const typedResponse = response as any
          data = Array.isArray(typedResponse.data) ? typedResponse.data : []
          console.log('🔍 Store: 从data字段获取推荐记录:', data.length, '条')
        }
        // 如果响应本身就是数组（兼容旧格式）
        else if (Array.isArray(response)) {
          data = response
          console.log('🔍 Store: 响应直接是数组格式，推荐记录:', data.length, '条')
        } else {
          console.warn('🔍 Store: 推荐记录响应格式无法识别:', response)
          data = []
        }
      } else if (Array.isArray(response)) {
        data = response
        console.log('🔍 Store: 响应是顶级数组，推荐记录:', data.length, '条')
      } else {
        console.warn('🔍 Store: 推荐记录响应数据类型无法识别:', typeof response, response)
        data = []
      }
      
      // 确保数据是数组并设置到store
      if (Array.isArray(data)) {
        recommendationRecords.value = data
        console.log('🔍 Store: 推荐记录设置成功, 数量:', data.length)
        
        // 输出详细的记录信息用于调试
        if (data.length > 0) {
          console.log('🔍 Store: 推荐记录详细信息:')
          data.forEach((rec, index) => {
            console.log(`  ${index + 1}. ID: ${rec.id}, 学员: ${rec.studentName}, 类型: ${rec.type}, 状态: ${rec.status}`)
          })
        }
      } else {
        console.error('🔍 Store: 处理后的数据不是数组格式:', data)
        recommendationRecords.value = []
      }
      
    } catch (error) {
      console.error('�� Store: 获取推荐记录失败:', error)
      recommendationRecords.value = []
      throw error
    }
  }

  // 提交推荐
  const submitRecommendations = async (projectId: string, form: RecommendationForm) => {
    if (!projectId) {
      console.warn('项目ID为空，无法提交推荐')
      throw new Error('项目ID无效')
    }
    
    loading.value = true
    try {
      console.log('🔍 Store: 开始提交推荐, projectId:', projectId, 'form:', form)
      const response = await submitRecommendation(projectId, form)
      console.log('🔍 Store: 提交推荐响应:', response)
      
      // 提交成功后，重新获取推荐记录
      await fetchRecommendationRecords(projectId)
    } catch (error) {
      console.error('🔍 Store: 提交推荐失败:', error)
      throw error
    } finally {
      loading.value = false
    }
  }

  // 重置数据
  const resetData = () => {
    studentPerformance.value = []
    recommendationRecords.value = []
    loading.value = false
    console.log('🔍 Store: 数据已重置')
  }

  return {
    loading,
    studentPerformance,
    recommendationRecords,
    recommendedStudentIds,
    availableStudents,
    fetchStudentPerformance,
    fetchRecommendationRecords,
    submitRecommendations,
    resetData
  }
}) 