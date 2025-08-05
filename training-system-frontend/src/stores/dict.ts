import { defineStore } from 'pinia'
import axios from 'axios'

export interface DictItem {
  code: string
  name: string
}

interface DictState {
  projectTypes: DictItem[]
}

export const useDictStore = defineStore('dict', {
  state: (): DictState => ({
    projectTypes: [],
  }),
  actions: {
    async loadProjectTypes() {
      if (this.projectTypes.length) return
      try {
        // TODO: 替换为后端真实接口
        // const { data } = await axios.get('/api/project-types', { params: { enabled: true } })
        // this.projectTypes = data
        // 从系统配置Store中获取数据
        const { useSystemConfigStore } = await import('./systemConfig')
        const systemConfigStore = useSystemConfigStore()
        this.projectTypes = systemConfigStore.projectTypes.map(type => ({
          code: type.id,
          name: type.name
        }))
      } catch (e) {
        console.error('加载项目类型失败', e)
      }
    },
  },
}) 