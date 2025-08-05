// 项目管理模块 - 带教管理类型定义
import type { User, Student, Mentor } from '@/types/mentorship'

// 项目内师徒关系
export interface ProjectMentorRelationship {
  id: string
  projectId: string
  mentorId: string
  studentId: string
  type: 'department_assigned' | 'academy_certified'
  scope: 'full_project' | 'specific_phase'
  
  // 匹配信息
  matchingScore?: number
  matchingType: 'manual' | 'smart_assisted'
  matchingReasons: string[]
  
  // 时间管理
  establishedDate: Date
  expectedDuration: number // 月数
  
  // 关系状态
  status: 'active' | 'paused' | 'completed' | 'terminated'
  
  // 过程记录
  interactions: MentorInteraction[]
  milestones: RelationshipMilestone[]
  
  // 评价记录
  evaluations: RelationshipEvaluation[]
  
  // 元数据
  createdAt: Date
  updatedAt: Date
  createdBy: string
}

// 师徒互动记录
export interface MentorInteraction {
  id: string
  type: 'meeting' | 'communication' | 'guidance' | 'feedback'
  date: Date
  duration: number // 分钟
  content: string
  mentorNotes?: string
  studentNotes?: string
  attachments?: string[]
  effectiveness: 1 | 2 | 3 | 4 | 5 // 1-5评分
}

// 关系里程碑
export interface RelationshipMilestone {
  id: string
  title: string
  description: string
  targetDate: Date
  completedDate?: Date
  status: 'pending' | 'in_progress' | 'completed' | 'overdue'
  evaluationScore?: number
}

// 关系评价
export interface RelationshipEvaluation {
  id: string
  type: 'probation' | 'annual' | 'phase_end'
  evaluator: 'mentor' | 'student' | 'mutual'
  
  // 三维评价（基于管理办法）
  dimensions: {
    recognition: RecognitionEvaluation    // 认识维度 15分
    skills: SkillsEvaluation             // 技能维度 50分  
    cultureHumanity: CultureEvaluation   // 文化和人文维度 35分
  }
  
  totalScore: number
  passThreshold: number
  result: 'pass' | 'fail' | 'pending'
  
  comments: string
  submittedAt: Date
  reviewedAt?: Date
  reviewedBy?: string
}

// 认识维度评价
export interface RecognitionEvaluation {
  明确表达责任: number      // 10分
  工作环境熟悉: number      // 5分
  totalScore: number        // 15分
}

// 技能维度评价  
export interface SkillsEvaluation {
  一对一带教时长: number    // 20分
  专业知识扎实度: number    // 10分
  有效解决问题: number      // 10分
  思路表达清晰: number      // 10分
  totalScore: number        // 50分
}

// 文化和人文维度评价
export interface CultureEvaluation {
  面对面沟通频率: number    // 20分
  共餐关怀次数: number      // 5分
  情绪疏导效果: number      // 5分
  经验分享意愿: number      // 5分
  totalScore: number        // 35分
}

// 智能推荐结果
export interface SmartRecommendationResult {
  mentorId: string
  mentor: Mentor
  matchingScore: number
  confidence: number
  reasons: string[]
  strengths: string[]
  considerations: string[]
}

// 匹配请求
export interface MentorMatchingRequest {
  studentInfo: Student
  projectId: string
  projectType: string
  requirements: string[]
  preferences?: {
    mentorType?: 'department_assigned' | 'academy_certified'
    experienceLevel?: 'junior' | 'senior' | 'expert'
    workLocation?: string
  }
}

// 带教标准配置
export interface MentorshipStandards {
  id: string
  projectId: string
  
  // 基础标准
  basicRequirements: {
    minimumMeetingFrequency: number      // 每周最少会面次数
    minimumCommunicationHours: number    // 每周最少沟通时长
    progressReviewCycle: number          // 进度检查周期（天）
    documentationRequired: boolean       // 是否需要文档记录
  }
  
  // 评价标准
  evaluationStandards: {
    probationEvaluation: EvaluationStandard
    annualEvaluation: EvaluationStandard
    phaseEvaluation?: EvaluationStandard
  }
  
  // 质量要求
  qualityRequirements: {
    minimumScore: number                 // 最低评分要求
    improvementPlan: boolean             // 是否需要改进计划
    escalationThreshold: number          // 问题升级阈值
  }
  
  // 激励措施
  incentives: {
    subsidyEligible: boolean             // 是否符合补贴条件
    recognitionProgram: boolean          // 是否参与表彰计划
    careerDevelopment: string[]          // 职业发展支持
  }
  
  createdAt: Date
  updatedAt: Date
  createdBy: string
}

// 评价标准
export interface EvaluationStandard {
  id: string
  name: string
  description: string
  dimensions: {
    recognition: DimensionStandard
    skills: DimensionStandard
    cultureHumanity: DimensionStandard
  }
  totalScore: number
  passThreshold: number
  frequency: 'once' | 'periodic' | 'milestone_based'
  mandatory: boolean
}

// 维度标准
export interface DimensionStandard {
  name: string
  weight: number
  maxScore: number
  criteria: CriteriaStandard[]
  description: string
}

// 标准细则
export interface CriteriaStandard {
  id: string
  name: string
  description: string
  maxScore: number
  scoringGuide: ScoringGuide[]
}

// 评分指南
export interface ScoringGuide {
  score: number
  description: string
  examples?: string[]
}

// Tab组件Props接口
export interface AssignmentTabProps {
  projectId: string
  students: Student[]
  mentors: Mentor[]
  relationships: ProjectMentorRelationship[]
}

export interface MentorTabProps {
  projectId: string
  mentors: Mentor[]
  relationships: ProjectMentorRelationship[]
  workloadData: MentorWorkload[]
}

export interface EvaluationTabProps {
  projectId: string
  relationships: ProjectMentorRelationship[]
  evaluationTasks: EvaluationTask[]
  standards: MentorshipStandards
}

export interface StandardsTabProps {
  projectId: string
  standards?: MentorshipStandards
  editable: boolean
}

// 导师工作负载
export interface MentorWorkload {
  mentorId: string
  currentLoad: number
  maxLoad: number
  activeRelationships: number
  averageScore: number
  successRate: number
}

// 评价任务
export interface EvaluationTask {
  id: string
  relationshipId: string
  type: 'probation' | 'annual' | 'phase_end'
  evaluator: string
  evaluatee: string
  dueDate: Date
  status: 'pending' | 'in_progress' | 'completed' | 'overdue'
  priority: 'high' | 'medium' | 'low'
}

// API响应类型
export interface ApiResponse<T> {
  code: number
  message: string
  data: T
  success: boolean
}

// 分页响应
export interface PagedResponse<T> {
  items: T[]
  total: number
  page: number
  pageSize: number
  totalPages: number
} 