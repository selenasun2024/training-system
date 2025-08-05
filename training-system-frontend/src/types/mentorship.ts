// 带教管理相关数据类型定义

// 基础用户信息
export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  department: string;
  position: string;
  entryDate: Date;
  status: 'active' | 'inactive' | 'suspended';
}

// 学员信息
export interface Student extends User {
  studentId: string;
  level: 'junior' | 'intermediate' | 'senior';
  skills: string[];
  learningGoals: string[];
  // 培训项目关联
  trainingProjects: string[]; // 培训项目ID数组
  // 带教项目关联
  mentorshipProjects: string[]; // 带教项目ID数组
  // 成长档案
  growthProfileId: string;
}

// 导师信息
export interface Mentor extends User {
  mentorId: string;
  expertise: string[];
  certifications: Certification[];
  currentLoad: number;
  maxLoad: number;
  rating: number;
  // 培训项目中的带教记录
  trainingMentorships: string[];
  // 专业带教项目记录
  mentorshipProjects: string[];
  // 导师特色
  mentorStyle: 'strict' | 'gentle' | 'balanced';
  availability: {
    weekdays: string[];
    timeSlots: string[];
  };
}

// 导师认证
export interface Certification {
  id: string;
  name: string;
  type: 'academy' | 'internal' | 'professional';
  issueDate: Date;
  expiryDate?: Date;
  status: 'active' | 'expired' | 'revoked';
}

// 里程碑
export interface Milestone {
  id: string;
  title: string;
  description: string;
  targetDate: Date;
  completedDate?: Date;
  status: 'pending' | 'in_progress' | 'completed' | 'overdue';
  criteria: string[];
  attachments?: string[];
}

// 任务
export interface Task {
  id: string;
  title: string;
  description: string;
  type: 'learning' | 'practice' | 'assessment' | 'discussion';
  priority: 'high' | 'medium' | 'low';
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  dueDate: Date;
  estimatedHours: number;
  actualHours?: number;
  resources: Resource[];
  dependencies: string[];
}

// 资源
export interface Resource {
  id: string;
  name: string;
  type: 'document' | 'video' | 'course' | 'tool' | 'link';
  url: string;
  description?: string;
  tags: string[];
}

// 沟通记录
export interface Communication {
  id: string;
  type: 'meeting' | 'message' | 'feedback' | 'report';
  date: Date;
  participants: string[];
  content: string;
  attachments?: string[];
  tags: string[];
}

// 带教项目
export interface MentorshipProject {
  id: string;
  title: string;
  description: string;
  status: 'draft' | 'active' | 'completed' | 'paused' | 'cancelled';
  mentorId: string;
  studentId: string;
  templateId?: string;
  
  // 时间相关
  startDate: Date;
  expectedEndDate: Date;
  actualEndDate?: Date;
  
  // 进度信息
  progress: number;
  milestones: Milestone[];
  tasks: Task[];
  
  // 关联培训项目
  sourceTrainingProject?: {
    id: string;
    name: string;
    type: string;
    status: string;
  };
  relatedTrainingProjects?: string[];
  
  // 沟通记录
  communications: Communication[];
  
  // 评估信息
  assessments: Assessment[];
  
  // 元数据
  priority: 'high' | 'medium' | 'low';
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
}

// 评估
export interface Assessment {
  id: string;
  type: 'milestone' | 'periodic' | 'final' | 'self';
  assessorId: string;
  assessorRole: 'mentor' | 'student' | 'manager' | 'hr';
  date: Date;
  criteria: AssessmentCriteria[];
  overallScore: number;
  comments: string;
  attachments?: string[];
}

// 评估标准
export interface AssessmentCriteria {
  id: string;
  name: string;
  weight: number;
  score: number;
  maxScore: number;
  comments?: string;
}

// 带教模板
export interface MentorshipTemplate {
  id: string;
  name: string;
  description: string;
  position: string;
  department?: string;
  version: string;
  
  // 模板内容
  tasks: TemplateTask[];
  milestones: TemplateMilestone[];
  resources: Resource[];
  evaluationCriteria: TemplateEvaluationCriteria[];
  
  // 预计时长
  estimatedDuration: number; // 天数
  
  // 使用统计
  usageCount: number;
  successRate: number;
  
  // 元数据
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  status: 'active' | 'inactive' | 'deprecated';
}

// 模板任务
export interface TemplateTask {
  id: string;
  title: string;
  description: string;
  type: 'learning' | 'practice' | 'assessment' | 'discussion';
  priority: 'high' | 'medium' | 'low';
  estimatedHours: number;
  dayOffset: number; // 相对于开始日期的天数偏移
  resources: Resource[];
  dependencies: string[];
}

// 模板里程碑
export interface TemplateMilestone {
  id: string;
  title: string;
  description: string;
  dayOffset: number;
  criteria: string[];
}

// 模板评估标准
export interface TemplateEvaluationCriteria {
  id: string;
  name: string;
  weight: number;
  maxScore: number;
  description: string;
}

// 导师匹配结果
export interface MentorMatchingResult {
  mentorId: string;
  score: number;
  reasons: string[];
  compatibility: {
    skillMatch: number;
    styleMatch: number;
    availabilityMatch: number;
    historicalSuccess: number;
  };
}

// 带教统计
export interface MentorshipStatistics {
  totalProjects: number;
  activeProjects: number;
  completedProjects: number;
  averageRating: number;
  completionRate: number;
  averageDuration: number;
  studentCount: number;
  mentorCount: number;
} 