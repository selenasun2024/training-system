import { defineStore } from 'pinia'
import { useDictStore } from './dict'
import request from '@/utils/request'

export interface ProjectType {
  id: string
  name: string
  code: string
  remindDays?: number
  defaultGroupCount?: number
}

export interface FilterCondition {
  field: string
  operator: string
  value: string
}

export interface FilterRule {
  description: string
  conditions: FilterCondition[]
  allowManualAdd: boolean
}

export interface SystemConfigState {
  projectTypes: ProjectType[]
  filterRules: Record<string, FilterRule[]>
}

export const useSystemConfigStore = defineStore('systemConfig', {
  state: (): SystemConfigState => ({
    projectTypes: [], // 从后端动态加载
    filterRules: {
      '1': [ // 新员工入职培训
        {
          description: '新员工筛选规则',
          conditions: [
            { field: 'department', operator: '=', value: 'Development' },
            { field: 'level', operator: 'in', value: 'P4,P5,P6' }
          ],
          allowManualAdd: true
        }
      ],
      '2': [ // 干部入线子培训
        {
          description: '干部筛选规则',
          conditions: [
            { field: 'department', operator: 'in', value: 'Development,Product' },
            { field: 'level', operator: 'in', value: 'P6,P7' }
          ],
          allowManualAdd: true
        }
      ]
    }
  }),
  
  getters: {
    getProjectTypeById: (state) => (id: string) => {
      return state.projectTypes.find(type => type.id === id)
    },
    
    getFilterRulesByTypeId: (state) => (typeId: string) => {
      return state.filterRules[typeId] || []
    }
  },
  
  actions: {
    // 从后端加载项目类型
    async loadProjectTypes() {
      try {
        const response = await request.get('/api/project-types')
        if (response && response.data) {
          const sourceData = Array.isArray(response.data) ? response.data : response.data.list;
          if(Array.isArray(sourceData)) {
            this.projectTypes = sourceData.map((item: any) => ({
              id: item.id,
              name: item.name,
              code: item.code,
              remindDays: item.remindDays,
              defaultGroupCount: item.defaultGroupCount
            }))
          }
        } else {
            this.projectTypes = [];
        }
        
        // 同步到字典Store
        const dictStore = useDictStore()
        dictStore.projectTypes = this.projectTypes.map(type => ({
          code: type.id,
          name: type.name
        }))
      } catch (error) {
        console.error('加载项目类型失败:', error)
        // 如果加载失败，使用默认数据
        this.projectTypes = [
          { id: 'type-001', name: '新员工入职培训', code: 'NEW_STAFF', remindDays: 7, defaultGroupCount: 4 },
          { id: 'type-002', name: '干部入线子培训', code: 'LEADER_ONLINE', remindDays: 5, defaultGroupCount: 3 },
          { id: 'type-003', name: '员工入线子培训', code: 'STAFF_ONLINE', remindDays: 3, defaultGroupCount: 5 },
          { id: 'type-004', name: '战狼培训', code: 'WAR_WOLF', remindDays: 7, defaultGroupCount: 2 },
          { id: 'type-005', name: '海豹培训', code: 'SEAL', remindDays: 10, defaultGroupCount: 2 },
        ]
      }
    },

    async addProjectType(typeData: Omit<ProjectType, 'id'>) {
      try {
        const response = await request.post('/api/project-types', typeData);
        if (response) {
          await this.loadProjectTypes(); // 重新加载以确保数据同步
          return true;
        }
        return false;
      } catch (error) {
        console.error('创建项目类型失败:', error);
        return false;
      }
    },

    async editProjectType(typeData: ProjectType) {
      try {
        const response = await request.put(`/api/project-types/${typeData.id}`, typeData);
        if (response) {
          await this.loadProjectTypes(); // 重新加载
          return true;
        }
        return false;
      } catch (error) {
        console.error('更新项目类型失败:', error);
        return false;
      }
    },

    async removeProjectType(id: string) {
      try {
        await request.delete(`/api/project-types/${id}`);
        await this.loadProjectTypes(); // 重新加载
        return true;
      } catch (error) {
        console.error('删除项目类型失败:', error);
        return false;
      }
    },

    // 更新筛选规则
    updateFilterRules(typeId: string, rules: FilterRule[]) {
      this.filterRules[typeId] = rules
    },
    
    // 根据项目类型和条件筛选用户
    filterUsersByType(typeId: string, users: any[]) {
      const rules = this.getFilterRulesByTypeId(typeId)
      if (!rules.length) return users
      
      // 应用第一个规则（可以扩展为多规则处理）
      const rule = rules[0]
      
      return users.filter(user => {
        return rule.conditions.every(condition => {
          const fieldValue = user[condition.field]
          
          switch (condition.operator) {
            case '=':
              return fieldValue === condition.value
            case '!=':
              return fieldValue !== condition.value
            case '>':
              return Number(fieldValue) > Number(condition.value)
            case '<':
              return Number(fieldValue) < Number(condition.value)
            case 'in':
              return condition.value.split(',').includes(fieldValue)
            case 'not in':
              return !condition.value.split(',').includes(fieldValue)
            default:
              return true
          }
        })
      })
    },
    
    // 检查项目类型是否有配置的筛选规则
    hasFilterRules(typeId: string) {
      return typeId && this.filterRules[typeId] && this.filterRules[typeId].length > 0
    }
  }
})

 