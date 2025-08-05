import { defineStore } from 'pinia'
import { ref } from 'vue'
import { nanoid } from 'nanoid'

export interface ExamScore {
  userId: string
  score: number
  status: 'pending' | 'graded' | 'reviewed'
}

export interface Exam {
  id: string
  stageId: string
  code: string // 编号
  title: string
  description?: string
  category: string // 类别
  type: 'online' | 'offline'
  paperType: 'questionBank' | 'upload'
  paperId?: string
  paperName?: string
  department: string // 部门
  location: string // 所在地址
  createTime: string // 创建时间
  startTime: string
  endTime: string
  duration: number
  passScore: number
  totalScore: number
  status: 'draft' | 'published' | 'closed'
  attendees: string[]
  scores: ExamScore[]
}

export const useExamStore = defineStore('exam', () => {
  const exams = ref<Exam[]>([
    // 模拟数据
    {
      id: '1',
      stageId: '',
      code: '00243',
      title: '企业文化知识考试',
      description: '测试员工对企业文化的理解程度',
      category: '培训考试',
      type: 'online',
      paperType: 'questionBank',
      paperId: undefined,
      paperName: undefined,
      department: '人力资源部',
      location: '在线考试',
      createTime: '2025-07-19 18:27',
      startTime: '2025-07-20 09:00',
      endTime: '2025-07-20 11:00',
      duration: 90,
      passScore: 60,
      totalScore: 100,
      status: 'published',
      attendees: [],
      scores: [],
    }
  ])

  function createExam(stageId: string): Exam {
    const exam: Exam = {
      id: nanoid(),
      stageId,
      code: generateCode(),
      title: '新考试',
      description: '',
      category: '',
      type: 'online',
      paperType: 'questionBank',
      paperId: undefined,
      paperName: undefined,
      department: '',
      location: '',
      createTime: new Date().toLocaleString('zh-CN'),
      startTime: '',
      endTime: '',
      duration: 60,
      passScore: 60,
      totalScore: 100,
      status: 'draft',
      attendees: [],
      scores: [],
    }
    exams.value.push(exam)
    return exam
  }

  function generateCode(): string {
    const num = exams.value.length + 1
    return num.toString().padStart(5, '0')
  }

  function updateExam(id: string, patch: Partial<Exam>) {
    const ex = exams.value.find((e) => e.id === id)
    if (ex) Object.assign(ex, patch)
  }

  function deleteExam(id: string) {
    const idx = exams.value.findIndex((e) => e.id === id)
    if (idx !== -1) exams.value.splice(idx, 1)
  }

  return { exams, createExam, updateExam, deleteExam, generateCode }
}) 