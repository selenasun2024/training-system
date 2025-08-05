// 培训项目相关数据类型定义

// 培训项目
export interface TrainingProject {
  id: string;
  name: string;
  description: string;
  type: 'onboarding' | 'skills' | 'leadership' | 'certification' | 'custom';
  status: 'planning' | 'active' | 'completed' | 'cancelled' | 'on_hold';
  
  // 时间相关
  startDate: Date;
  endDate: Date;
  duration: number; // 天数
  
  // 参与者
  participants: TrainingParticipant[];
  instructors: TrainingInstructor[];
  
  // 培训内容
  curriculum: TrainingCurriculum[];
  resources: TrainingResource[];
  
  // 带教集成
  mentorshipEnabled: boolean;
  mentorshipProjects: string[]; // 关联的带教项目ID
  autoCreateMentorship: boolean; // 是否自动创建带教项目
  
  // 评估
  assessments: TrainingAssessment[];
  
  // 元数据
  budget: number;
  location: string;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
}

// 培训参与者
export interface TrainingParticipant {
  id: string;
  userId: string;
  role: 'student' | 'observer' | 'assistant';
  status: 'enrolled' | 'active' | 'completed' | 'dropped' | 'suspended';
  enrollmentDate: Date;
  completionDate?: Date;
  progress: number;
  
  // 带教相关
  needsMentorship: boolean;
  mentorId?: string;
  mentorshipProjectId?: string;
  
  // 评估结果
  finalScore?: number;
  feedback?: string;
}

// 培训讲师
export interface TrainingInstructor {
  id: string;
  userId: string;
  role: 'primary' | 'assistant' | 'guest';
  expertise: string[];
  
  // 是否可作为导师
  availableAsMentor: boolean;
  mentorshipProjects: string[];
}

// 培训课程
export interface TrainingCurriculum {
  id: string;
  title: string;
  description: string;
  type: 'lecture' | 'workshop' | 'practice' | 'assessment' | 'discussion';
  duration: number; // 小时
  order: number;
  
  // 内容
  content: string;
  materials: TrainingResource[];
  
  // 是否包含带教环节
  includeMentorship: boolean;
  mentorshipHours?: number;
  
  // 前置要求
  prerequisites: string[];
}

// 培训资源
export interface TrainingResource {
  id: string;
  name: string;
  type: 'document' | 'video' | 'audio' | 'link' | 'tool' | 'template';
  url: string;
  description?: string;
  size?: number;
  duration?: number;
  tags: string[];
}

// 培训评估
export interface TrainingAssessment {
  id: string;
  name: string;
  type: 'quiz' | 'assignment' | 'project' | 'presentation' | 'peer_review';
  weight: number;
  maxScore: number;
  passingScore: number;
  
  // 评估内容
  questions: AssessmentQuestion[];
  
  // 是否包含导师评估
  includeMentorAssessment: boolean;
  mentorAssessmentWeight?: number;
}

// 评估问题
export interface AssessmentQuestion {
  id: string;
  type: 'multiple_choice' | 'single_choice' | 'essay' | 'file_upload' | 'practical';
  question: string;
  options?: string[];
  correctAnswer?: string;
  points: number;
  explanation?: string;
}

// 培训中的带教记录
export interface TrainingMentorship {
  id: string;
  trainingProjectId: string;
  mentorId: string;
  studentId: string;
  
  // 带教时间
  startDate: Date;
  endDate: Date;
  totalHours: number;
  
  // 带教内容
  sessions: MentorshipSession[];
  
  // 评估结果
  mentorRating: number;
  studentRating: number;
  feedback: string;
  
  // 是否转化为长期带教
  convertedToLongTerm: boolean;
  longTermProjectId?: string;
}

// 带教会话
export interface MentorshipSession {
  id: string;
  date: Date;
  duration: number;
  type: 'meeting' | 'review' | 'guidance' | 'assessment';
  topics: string[];
  notes: string;
  attachments?: string[];
  rating?: number;
}

// 培训统计
export interface TrainingStatistics {
  totalProjects: number;
  activeProjects: number;
  completedProjects: number;
  totalParticipants: number;
  averageRating: number;
  completionRate: number;
  mentorshipConversionRate: number;
  
  // 按类型统计
  projectsByType: Record<string, number>;
  
  // 按月统计
  monthlyStats: MonthlyTrainingStats[];
}

// 月度培训统计
export interface MonthlyTrainingStats {
  month: string;
  projectCount: number;
  participantCount: number;
  completionRate: number;
  mentorshipCount: number;
}

// 培训计划
export interface TrainingPlan {
  id: string;
  name: string;
  description: string;
  type: 'quarterly' | 'annual' | 'custom';
  
  // 时间范围
  startDate: Date;
  endDate: Date;
  
  // 包含的培训项目
  projects: string[];
  
  // 带教规划
  mentorshipPlan: {
    enabled: boolean;
    targetMentorCount: number;
    targetStudentCount: number;
    expectedProjects: number;
  };
  
  // 目标
  objectives: string[];
  
  // 预算
  budget: number;
  
  // 元数据
  status: 'draft' | 'approved' | 'active' | 'completed' | 'cancelled';
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
}

// 培训模板
export interface TrainingTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  
  // 模板内容
  curriculum: TrainingCurriculum[];
  resources: TrainingResource[];
  assessments: TrainingAssessment[];
  
  // 带教模板关联
  mentorshipTemplate?: string;
  
  // 预计信息
  estimatedDuration: number;
  estimatedBudget: number;
  
  // 使用统计
  usageCount: number;
  successRate: number;
  
  // 元数据
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  status: 'active' | 'inactive' | 'deprecated';
} 