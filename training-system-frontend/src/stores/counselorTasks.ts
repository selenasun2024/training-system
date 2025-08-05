import { defineStore } from 'pinia'
import type { TaskForReview } from '../types/task'
import { getTasksToReview, getReviewedTasks, submitScore } from '../api/modules/task'
import { ElMessage } from 'element-plus'

export const useCounselorTaskStore = defineStore('counselorTask', {
  state: () => ({
    // 待批阅任务
    pendingTasks: [] as TaskForReview[],
    // 已批阅任务
    reviewedTasks: [] as TaskForReview[],
    loading: false,
    reviewedLoading: false,
  }),
  
  getters: {
    // 兼容性：保持原来的tasks属性指向待批阅任务
    tasks: (state) => state.pendingTasks,
  },
  
  actions: {
    /**
     * 获取待批阅任务
     */
    async fetchTasks(projectId?: string) {
      this.loading = true;
      try {
        console.log('🔍 获取待批阅任务列表...');
        const response = await getTasksToReview('counselor', projectId)
        this.pendingTasks = response?.data || response || []
        console.log(`✅ 获取到 ${this.pendingTasks.length} 个待批阅任务`);
      } catch (error) {
        console.error('获取辅导员任务失败:', error)
        this.pendingTasks = []
      } finally {
        this.loading = false;
      }
    },
    
    /**
     * 获取已批阅任务
     */
    async fetchReviewedTasks(projectId?: string) {
      this.reviewedLoading = true;
      try {
        console.log('🔍 获取已批阅任务列表...');
        const response = await getReviewedTasks('counselor', projectId)
        this.reviewedTasks = response?.data || response || []
        console.log(`✅ 获取到 ${this.reviewedTasks.length} 个已批阅任务`);
      } catch (error) {
        console.error('获取已批阅任务失败:', error)
        this.reviewedTasks = []
      } finally {
        this.reviewedLoading = false;
      }
    },
    
    /**
     * 批阅任务
     */
    async grade(taskId: string, userId: string, score: number, feedback?: string) {
      try {
        console.log('📝 开始批阅 - 任务ID:', taskId, '学员ID:', userId, '分数:', score)
        
        // 调用后端API提交评分
        await submitScore(taskId, userId, score, feedback)
        
        console.log('✅ 后端批阅成功，更新前端状态')
        
        // 找到对应的任务和提交
        const task = this.pendingTasks.find(t => t.id === taskId)
        if (task) {
          const submissionIndex = task.submissions.findIndex(s => s.userId === userId)
          if (submissionIndex !== -1) {
            const studentName = task.submissions[submissionIndex].userName
            
            // 从待批阅列表中移除该提交
            task.submissions.splice(submissionIndex, 1)
            console.log(`✅ 已从任务"${task.title}"中移除${studentName}的提交`)
            
            // 如果任务的所有提交都已批阅完成，从任务列表中移除该任务
            if (task.submissions.length === 0) {
              const taskIndex = this.pendingTasks.findIndex(t => t.id === taskId)
              if (taskIndex !== -1) {
                this.pendingTasks.splice(taskIndex, 1)
                console.log(`✅ 任务"${task.title}"的所有提交已批阅完成，从待批阅列表中移除`)
                ElMessage.success(`批阅完成！任务"${task.title}"的所有提交已处理完毕`)
              }
            } else {
              ElMessage.success(`批阅完成！${studentName}的作业已评分：${score}分`)
            }
          }
        }
        
        // 返回成功状态，用于组件中的进一步处理
        return { success: true, remainingSubmissions: task?.submissions.length || 0 }
        
      } catch (error) {
        console.error('❌ 批阅失败:', error)
        ElMessage.error('批阅失败：' + (error instanceof Error ? error.message : '网络错误'))
        throw error
      }
    },
    
    /**
     * 刷新所有任务列表
     */
    async refreshAllTasks(projectId?: string) {
      await Promise.all([
        this.fetchTasks(projectId),
        this.fetchReviewedTasks(projectId)
      ]);
    }
  }
}) 