import { defineStore } from 'pinia'
import { ref } from 'vue'
import { nanoid } from 'nanoid'

export interface QuestionnaireItem {
  id: string
  code: string // 编号
  title: string // 标题
  category: string // 类别
  type: string // 类型
  department: string // 部门
  location: string // 所在地址
  createTime: string // 创建时间
  startTime: string // 开始时间
  endTime: string // 截止时间
  status: 'draft' | 'published' | 'finished' | 'closed' // 状态
  templateId: string // 问卷模板ID
  intro?: string // 简介
  participants: string[] // 参与人员
  responses: QuestionnaireResponse[] // 回答记录
}

export interface QuestionnaireResponse {
  id: string
  userId: string
  userName: string
  submitTime: string
  answers: Record<string, any>
}

export const useQuestionnaireStore = defineStore('questionnaire', () => {
  const questionnaires = ref<QuestionnaireItem[]>([
    // 模拟数据
    {
      id: '1',
      code: '00242',
      title: '办公用品采购满意度调研',
      category: '已宣期',
      type: '部门项目',
      department: '...消费者服务',
      location: '陈泰中服务厅2楼',
      createTime: '2025-07-19 18:27',
      startTime: '2025-07-20 09:00',
      endTime: '2025-07-25 18:00',
      status: 'published',
      templateId: 'tpl1',
      intro: '为了提升办公用品采购服务质量，特开展此次满意度调研',
      participants: [],
      responses: []
    }
  ])

  function createQuestionnaire(): QuestionnaireItem {
    const questionnaire: QuestionnaireItem = {
      id: nanoid(),
      code: generateCode(),
      title: '新问卷',
      category: '',
      type: '',
      department: '',
      location: '',
      createTime: new Date().toLocaleString('zh-CN'),
      startTime: '',
      endTime: '',
      status: 'draft',
      templateId: '',
      intro: '',
      participants: [],
      responses: []
    }
    questionnaires.value.push(questionnaire)
    return questionnaire
  }

  function updateQuestionnaire(id: string, patch: Partial<QuestionnaireItem>) {
    const item = questionnaires.value.find((q) => q.id === id)
    if (item) Object.assign(item, patch)
  }

  function deleteQuestionnaire(id: string) {
    const idx = questionnaires.value.findIndex((q) => q.id === id)
    if (idx !== -1) questionnaires.value.splice(idx, 1)
  }

  function generateCode(): string {
    const num = questionnaires.value.length + 1
    return num.toString().padStart(5, '0')
  }

  return { 
    questionnaires, 
    createQuestionnaire, 
    updateQuestionnaire, 
    deleteQuestionnaire 
  }
}) 