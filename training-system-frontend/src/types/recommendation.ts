// 学员表现数据
export interface StudentPerformance {
  id: string
  name: string
  rank: number
  attendance: number
  role: string
  taskCompletion: number
  observationTags: string[]
}

// 评价表单
export interface Evaluation {
  leadership: number
  innovation: number
  execution: number
  teamwork: number
  reason: string
}

// 推荐表单
export interface RecommendationForm {
  yulinList: string[]
  jinyiList: string[]
  evaluations: Record<string, Evaluation>
}

// 推荐类型
export type RecommendationType = 'yulin' | 'jinyi'
export type RecommendationStatus = 'pending' | 'approved' | 'rejected'
export type ReviewType = 'approve' | 'reject'

// 推荐评分项
export interface RecommendationScores {
  leadership: number
  innovation: number
  execution: number
  teamwork: number
}

// 基础推荐信息
export interface BaseRecommendation {
  id: string
  studentName: string
  type: RecommendationType
  counselor: string
  department: string
  scores: RecommendationScores
  reason: string
  recommendTime: string
}

// 辅导员提交的推荐
export interface CounselorRecommendation extends BaseRecommendation {
  status: 'pending'
}

// 教务工作台的推荐
export interface AdminRecommendation extends BaseRecommendation {
  status: RecommendationStatus
  reviewer?: string
  reviewTime?: string
  reviewComment?: string
}

// 推荐统计
export interface TypeStats {
  total: number
  pending: number
  approved: number
  rejected: number
}

export interface RecommendationStats {
  yulin: TypeStats
  jinyi: TypeStats
  counselors: {
    total: number
    submitted: number
    pending: number
  }
  progress: number
}

// 审核载荷
export interface ReviewPayload {
  id: string
  type: ReviewType
  comment: string
} 