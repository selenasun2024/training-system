// 统一成长档案数据类型定义

import type { TrainingProject } from './training';
import type { MentorshipProject } from './mentorship';

// 统一成长档案
export interface GrowthProfile {
  id: string;
  userId: string;
  userName: string;
  
  // 基本信息
  department: string;
  position: string;
  entryDate: Date;
  currentLevel: 'junior' | 'intermediate' | 'senior' | 'expert';
  
  // 培训项目历史
  trainingHistory: TrainingHistoryItem[];
  
  // 带教项目历史
  mentorshipHistory: MentorshipHistoryItem[];
  
  // 统一成长时间线
  combinedTimeline: GrowthTimelineEvent[];
  
  // 能力发展轨迹
  skillDevelopment: SkillDevelopmentTrack[];
  
  // 成就与里程碑
  achievements: Achievement[];
  
  // 反馈收集
  feedbackCollection: FeedbackItem[];
  
  // 目标设定
  goals: GrowthGoal[];
  
  // 统计信息
  statistics: GrowthStatistics;
  
  // 元数据
  lastUpdated: Date;
  createdAt: Date;
}

// 培训历史项目
export interface TrainingHistoryItem {
  projectId: string;
  projectName: string;
  projectType: 'onboarding' | 'skills' | 'leadership' | 'certification' | 'custom';
  startDate: Date;
  endDate?: Date;
  status: 'enrolled' | 'active' | 'completed' | 'dropped' | 'suspended';
  
  // 成果
  finalScore?: number;
  certificationsObtained: string[];
  skillsLearned: string[];
  
  // 反馈
  instructorFeedback?: string;
  selfReflection?: string;
  
  // 带教相关
  hadMentorship: boolean;
  mentorName?: string;
  mentorshipFeedback?: string;
  
  // 项目影响
  impactAreas: string[];
}

// 带教历史项目
export interface MentorshipHistoryItem {
  projectId: string;
  projectName: string;
  role: 'student' | 'mentor';
  
  // 参与者信息
  mentorId: string;
  mentorName: string;
  studentId: string;
  studentName: string;
  
  // 时间信息
  startDate: Date;
  endDate?: Date;
  status: 'active' | 'completed' | 'paused' | 'cancelled';
  
  // 来源
  sourceType: 'training_project' | 'direct_mentorship' | 'skill_development';
  sourceProjectId?: string;
  
  // 成果
  completedMilestones: string[];
  skillsImproved: string[];
  overallRating?: number;
  
  // 反馈
  mutualFeedback: {
    mentorToStudent?: string;
    studentToMentor?: string;
  };
  
  // 成长领域
  growthAreas: string[];
}

// 成长时间线事件
export interface GrowthTimelineEvent {
  id: string;
  date: Date;
  type: 'training' | 'mentorship' | 'achievement' | 'milestone' | 'feedback' | 'goal' | 'assessment';
  category: 'learning' | 'development' | 'recognition' | 'relationship' | 'skill' | 'career';
  
  // 事件内容
  title: string;
  description: string;
  
  // 关联信息
  relatedProjectId?: string;
  relatedProjectType?: 'training' | 'mentorship';
  
  // 影响标签
  tags: string[];
  
  // 重要性级别
  importance: 'low' | 'medium' | 'high' | 'critical';
  
  // 附件
  attachments?: string[];
  
  // 评分（如果适用）
  rating?: number;
}

// 技能发展轨迹
export interface SkillDevelopmentTrack {
  skillId: string;
  skillName: string;
  category: 'technical' | 'soft' | 'leadership' | 'domain';
  
  // 级别定义
  currentLevel: number;
  targetLevel: number;
  maxLevel: number;
  
  // 发展历史
  progressHistory: SkillProgressRecord[];
  
  // 学习路径
  learningPath: SkillLearningPath[];
  
  // 验证记录
  validations: SkillValidation[];
  
  // 元数据
  lastAssessed: Date;
  nextAssessment?: Date;
  priority: 'low' | 'medium' | 'high';
}

// 技能进度记录
export interface SkillProgressRecord {
  date: Date;
  level: number;
  source: 'training' | 'mentorship' | 'self_assessment' | 'peer_review' | 'manager_review';
  sourceId?: string;
  assessorId?: string;
  assessorName?: string;
  notes?: string;
  evidence?: string[];
}

// 技能学习路径
export interface SkillLearningPath {
  id: string;
  title: string;
  description: string;
  type: 'training' | 'mentorship' | 'practice' | 'project' | 'certification';
  
  // 状态
  status: 'planned' | 'active' | 'completed' | 'cancelled';
  
  // 时间
  startDate?: Date;
  endDate?: Date;
  estimatedDuration?: number;
  
  // 资源
  resources: string[];
  
  // 预期提升
  expectedImprovement: number;
}

// 技能验证
export interface SkillValidation {
  id: string;
  type: 'certification' | 'assessment' | 'project' | 'peer_review' | 'mentor_confirmation';
  date: Date;
  validatorId: string;
  validatorName: string;
  validatorRole: string;
  
  // 验证内容
  title: string;
  description: string;
  evidence?: string[];
  
  // 结果
  passed: boolean;
  score?: number;
  feedback?: string;
}

// 成就
export interface Achievement {
  id: string;
  type: 'milestone' | 'certification' | 'recognition' | 'project_completion' | 'skill_mastery';
  title: string;
  description: string;
  date: Date;
  
  // 来源
  source: 'training' | 'mentorship' | 'work' | 'external';
  sourceId?: string;
  
  // 级别
  level: 'bronze' | 'silver' | 'gold' | 'platinum';
  
  // 验证
  verified: boolean;
  verifierId?: string;
  verifierName?: string;
  
  // 影响
  skillImpact: string[];
  careerImpact?: string;
  
  // 展示
  visible: boolean;
  featured: boolean;
  
  // 证书
  certificateUrl?: string;
  badgeUrl?: string;
}

// 反馈项目
export interface FeedbackItem {
  id: string;
  type: 'mentor_feedback' | 'peer_feedback' | 'manager_feedback' | 'instructor_feedback' | 'self_reflection';
  date: Date;
  
  // 反馈者
  fromId: string;
  fromName: string;
  fromRole: string;
  
  // 反馈内容
  content: string;
  rating?: number;
  
  // 关联项目
  relatedProjectId?: string;
  relatedProjectType?: 'training' | 'mentorship';
  
  // 反馈维度
  dimensions: FeedbackDimension[];
  
  // 行动计划
  actionItems?: string[];
  
  // 状态
  status: 'pending' | 'acknowledged' | 'acted_upon';
}

// 反馈维度
export interface FeedbackDimension {
  name: string;
  score: number;
  maxScore: number;
  comment?: string;
}

// 成长目标
export interface GrowthGoal {
  id: string;
  title: string;
  description: string;
  category: 'skill' | 'career' | 'leadership' | 'knowledge' | 'network';
  
  // 时间
  startDate: Date;
  targetDate: Date;
  
  // 状态
  status: 'draft' | 'active' | 'completed' | 'cancelled' | 'overdue';
  progress: number;
  
  // 衡量标准
  metrics: GoalMetric[];
  
  // 行动计划
  actionPlan: ActionPlan[];
  
  // 支持资源
  supportResources: string[];
  
  // 导师支持
  mentorSupport?: {
    mentorId: string;
    mentorName: string;
    supportType: 'guidance' | 'review' | 'coaching';
  };
  
  // 里程碑
  milestones: GoalMilestone[];
}

// 目标指标
export interface GoalMetric {
  name: string;
  currentValue: number;
  targetValue: number;
  unit: string;
  measurementMethod: string;
}

// 行动计划
export interface ActionPlan {
  id: string;
  title: string;
  description: string;
  dueDate: Date;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  resources: string[];
  dependencies?: string[];
}

// 目标里程碑
export interface GoalMilestone {
  id: string;
  title: string;
  description: string;
  targetDate: Date;
  completedDate?: Date;
  status: 'pending' | 'completed' | 'overdue';
  criteria: string[];
}

// 成长统计
export interface GrowthStatistics {
  // 培训统计
  trainingProjects: {
    total: number;
    completed: number;
    inProgress: number;
    completionRate: number;
    averageRating: number;
  };
  
  // 带教统计
  mentorshipProjects: {
    asStudent: number;
    asMentor: number;
    completed: number;
    inProgress: number;
    averageRating: number;
  };
  
  // 技能统计
  skills: {
    total: number;
    mastered: number;
    inProgress: number;
    averageLevel: number;
    improvementRate: number;
  };
  
  // 成就统计
  achievements: {
    total: number;
    byType: Record<string, number>;
    byLevel: Record<string, number>;
  };
  
  // 反馈统计
  feedback: {
    total: number;
    averageRating: number;
    byType: Record<string, number>;
  };
  
  // 活跃度统计
  activity: {
    totalEvents: number;
    lastActivityDate: Date;
    monthlyActivity: Record<string, number>;
  };
}

// 成长档案配置
export interface GrowthProfileConfig {
  // 可见性设置
  visibility: {
    public: boolean;
    department: boolean;
    mentors: boolean;
    managers: boolean;
  };
  
  // 通知设置
  notifications: {
    milestoneReminders: boolean;
    feedbackRequests: boolean;
    goalDeadlines: boolean;
    achievementUpdates: boolean;
  };
  
  // 分享设置
  sharing: {
    allowSkillSharing: boolean;
    allowAchievementSharing: boolean;
    allowFeedbackSharing: boolean;
  };
}

// 成长档案权限
export interface GrowthProfilePermission {
  userId: string;
  profileId: string;
  role: 'owner' | 'mentor' | 'manager' | 'hr' | 'viewer';
  permissions: {
    view: boolean;
    edit: boolean;
    comment: boolean;
    share: boolean;
    download: boolean;
  };
  grantedAt: Date;
  grantedBy: string;
  expiresAt?: Date;
} 