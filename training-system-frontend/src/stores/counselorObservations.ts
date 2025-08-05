import { defineStore } from 'pinia'
import type { ObservationTarget } from '../types/observation'
import { getObservationsForCounselor, submitObservation } from '../api/modules/observation'
import { useUserStore } from './user'

export const useCounselorObservationStore = defineStore('counselorObservations', {
  state: () => ({
    targets: [] as ObservationTarget[],
    loading: false,
  }),
  actions: {
    async fetchTargets(counselorId?: string) {
      this.loading = true
      try {
        const userStore = useUserStore()
        
        console.log('🔍 开发阶段：获取所有辅导员的观察数据')
        
        // 开发阶段：获取所有观察目标，不基于特定用户ID筛选
        // 这样可以看到所有通过分组选择的辅导员及其对应的学员
        try {
          console.log('🔍 调用观察API获取所有观察目标...')
          // 使用 'all' 作为特殊标识，让后端返回所有观察目标
          const targets = await getObservationsForCounselor('all', userStore.userId || 'admin')
          console.log(`✅ 获取到观察目标数量:`, targets.length)
          
          this.targets = targets
          console.log('✅ 开发阶段：获取所有观察目标成功，总数量:', targets.length)
        } catch (error) {
          console.warn('⚠️ 获取所有观察数据失败，尝试获取管理员数据:', error)
          
          // 如果特殊API失败，尝试使用admin获取数据
          try {
            const fallbackTargets = await getObservationsForCounselor('admin', 'admin')
            this.targets = fallbackTargets
            console.log('✅ Fallback：获取管理员观察数据成功，数量:', fallbackTargets.length)
          } catch (fallbackError) {
            console.error('❌ Fallback也失败了:', fallbackError)
            this.targets = []
          }
        }
        
        console.log('✅ 获取观察目标成功，数量:', this.targets.length)
      } catch (error) {
        console.error('❌ 获取观察目标失败:', error)
        this.targets = []
      } finally {
        this.loading = false
      }
    },
    async submit(target: ObservationTarget, content: string, tags:string[] = []) {
      await submitObservation(target, content, tags)
      // 更新本地数据
      target.status = 'submitted'
      target.record = {
        id: 'local',
        content,
        tags,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
    },
    saveDraft(target: ObservationTarget, content: string, tags: string[] = []) {
      target.draftContent = content
      target.draftTags = tags
      target.status = 'draft'
    },
    async submitProject(projectId: string) {
      const drafts = this.targets.filter(t => t.projectId === projectId && t.status === 'draft')
      for (const d of drafts) {
        await this.submit(d as ObservationTarget, d.draftContent || '', d.draftTags || [])
        delete d.draftContent
        delete d.draftTags
      }
    },
  },
}) 