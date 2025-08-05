import { IsString, IsOptional, IsEnum, IsNumber, IsBoolean, IsDateString, IsArray, IsObject, Min, Max } from 'class-validator';

// 用户级别枚举
export enum UserLevel {
  JUNIOR = 'junior',
  INTERMEDIATE = 'intermediate', 
  SENIOR = 'senior',
  EXPERT = 'expert'
}

// 技能分类枚举
export enum SkillCategory {
  TECHNICAL = 'technical',
  SOFT = 'soft',
  LEADERSHIP = 'leadership',
  DOMAIN = 'domain'
}

// 成就类型枚举
export enum AchievementType {
  MILESTONE = 'milestone',
  CERTIFICATION = 'certification',
  RECOGNITION = 'recognition',
  PROJECT_COMPLETION = 'project_completion',
  SKILL_MASTERY = 'skill_mastery'
}

// 成就级别枚举
export enum AchievementLevel {
  BRONZE = 'bronze',
  SILVER = 'silver',
  GOLD = 'gold',
  PLATINUM = 'platinum'
}

// 目标分类枚举
export enum GoalCategory {
  SKILL = 'skill',
  CAREER = 'career',
  LEADERSHIP = 'leadership',
  KNOWLEDGE = 'knowledge',
  NETWORK = 'network'
}

// 目标状态枚举
export enum GoalStatus {
  DRAFT = 'draft',
  ACTIVE = 'active',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  OVERDUE = 'overdue'
}

// 反馈类型枚举
export enum FeedbackType {
  MENTOR = 'mentor',
  PEER = 'peer',
  MANAGER = 'manager',
  INSTRUCTOR = 'instructor',
  SELF = 'self',
  REVIEW_360 = '360_review'
}

// 更新成长档案基本信息DTO
export class UpdateGrowthProfileDto {
  @IsOptional()
  @IsString()
  department?: string;

  @IsOptional()
  @IsString()
  position?: string;

  @IsOptional()
  @IsDateString()
  entryDate?: string;

  @IsOptional()
  @IsEnum(UserLevel)
  currentLevel?: UserLevel;

  @IsOptional()
  @IsObject()
  profileConfig?: any;
}

// 创建时间线事件DTO
export class CreateTimelineEventDto {
  @IsString()
  eventDate: string;

  @IsString()
  type: string;

  @IsString()
  category: string;

  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  relatedProjectId?: string;

  @IsOptional()
  @IsString()
  importance?: string;

  @IsOptional()
  @IsArray()
  tags?: string[];

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(10)
  rating?: number;
}

// 创建技能DTO
export class CreateSkillDto {
  @IsString()
  skillName: string;

  @IsEnum(SkillCategory)
  skillCategory: SkillCategory;

  @IsNumber()
  @Min(1)
  @Max(10)
  currentLevel: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(10)
  targetLevel?: number;

  @IsOptional()
  @IsString()
  priority?: string;

  @IsOptional()
  @IsDateString()
  lastAssessed?: string;

  @IsOptional()
  @IsArray()
  progressHistory?: any[];
}

// 更新技能DTO
export class UpdateSkillDto {
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(10)
  currentLevel?: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(10)
  targetLevel?: number;

  @IsOptional()
  @IsString()
  priority?: string;

  @IsOptional()
  @IsDateString()
  lastAssessed?: string;

  @IsOptional()
  @IsArray()
  progressHistory?: any[];
}

// 创建成就DTO
export class CreateAchievementDto {
  @IsEnum(AchievementType)
  achievementType: AchievementType;

  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsString()
  achievementDate: string;

  @IsString()
  source: string;

  @IsEnum(AchievementLevel)
  level: AchievementLevel;

  @IsOptional()
  @IsString()
  sourceId?: string;

  @IsOptional()
  @IsBoolean()
  verified?: boolean;

  @IsOptional()
  @IsArray()
  skillImpact?: string[];

  @IsOptional()
  @IsString()
  careerImpact?: string;

  @IsOptional()
  @IsString()
  certificateUrl?: string;
}

// 创建目标DTO
export class CreateGoalDto {
  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsEnum(GoalCategory)
  category: GoalCategory;

  @IsString()
  startDate: string;

  @IsString()
  targetDate: string;

  @IsOptional()
  @IsArray()
  metrics?: any[];

  @IsOptional()
  @IsArray()
  actionPlan?: any[];

  @IsOptional()
  @IsArray()
  milestones?: any[];

  @IsOptional()
  @IsString()
  mentorId?: string;
}

// 更新目标DTO
export class UpdateGoalDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  targetDate?: string;

  @IsOptional()
  @IsEnum(GoalStatus)
  status?: GoalStatus;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  progress?: number;

  @IsOptional()
  @IsArray()
  metrics?: any[];

  @IsOptional()
  @IsArray()
  actionPlan?: any[];

  @IsOptional()
  @IsArray()
  milestones?: any[];

  @IsOptional()
  @IsDateString()
  completedDate?: string;
}

// 创建反馈DTO
export class CreateFeedbackDto {
  @IsEnum(FeedbackType)
  feedbackType: FeedbackType;

  @IsString()
  title: string;

  @IsString()
  content: string;

  @IsString()
  providerName: string;

  @IsOptional()
  @IsString()
  providerRole?: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(10)
  rating?: number;

  @IsString()
  feedbackDate: string;

  @IsOptional()
  @IsString()
  relatedProjectId?: string;

  @IsOptional()
  @IsArray()
  categories?: string[];

  @IsOptional()
  @IsArray()
  tags?: string[];
}

// 查询参数DTO
export class GrowthProfileQueryDto {
  @IsOptional()
  @IsString()
  userId?: string;

  @IsOptional()
  @IsString()
  department?: string;

  @IsOptional()
  @IsEnum(UserLevel)
  level?: UserLevel;

  @IsOptional()
  @IsNumber()
  page?: number;

  @IsOptional()
  @IsNumber()
  limit?: number;

  @IsOptional()
  @IsString()
  search?: string;
}

// 时间线查询DTO
export class TimelineQueryDto {
  @IsOptional()
  @IsString()
  type?: string;

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsString()
  startDate?: string;

  @IsOptional()
  @IsString()
  endDate?: string;

  @IsOptional()
  @IsNumber()
  page?: number;

  @IsOptional()
  @IsNumber()
  limit?: number;
}

// 技能查询DTO
export class SkillQueryDto {
  @IsOptional()
  @IsEnum(SkillCategory)
  category?: SkillCategory;

  @IsOptional()
  @IsString()
  priority?: string;

  @IsOptional()
  @IsNumber()
  minLevel?: number;

  @IsOptional()
  @IsNumber()
  maxLevel?: number;
}

// 成就查询DTO
export class AchievementQueryDto {
  @IsOptional()
  @IsEnum(AchievementType)
  type?: AchievementType;

  @IsOptional()
  @IsEnum(AchievementLevel)
  level?: AchievementLevel;

  @IsOptional()
  @IsString()
  source?: string;

  @IsOptional()
  @IsBoolean()
  verified?: boolean;

  @IsOptional()
  @IsBoolean()
  featured?: boolean;
}

// 目标查询DTO
export class GoalQueryDto {
  @IsOptional()
  @IsEnum(GoalCategory)
  category?: GoalCategory;

  @IsOptional()
  @IsEnum(GoalStatus)
  status?: GoalStatus;

  @IsOptional()
  @IsString()
  mentorId?: string;
}

// 反馈查询DTO
export class FeedbackQueryDto {
  @IsOptional()
  @IsEnum(FeedbackType)
  type?: FeedbackType;

  @IsOptional()
  @IsString()
  providerId?: string;

  @IsOptional()
  @IsNumber()
  minRating?: number;

  @IsOptional()
  @IsNumber()
  maxRating?: number;
}

// =====================================================
// 学习中心集成 - 带教相关DTO
// =====================================================

// 更新带教档案记录DTO
export class UpdateMentorshipHistoryDto {
  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(10)
  performanceRating?: number;

  @IsOptional()
  @IsArray()
  skillsImproved?: string[];

  @IsOptional()
  @IsArray()
  challengesFaced?: string[];

  @IsOptional()
  @IsArray()
  nextSteps?: string[];

  @IsOptional()
  @IsObject()
  metadata?: any;

  @IsOptional()
  @IsString()
  updatedBy?: string;
}

// 带教历史查询参数DTO
export class MentorshipHistoryQueryDto {
  @IsOptional()
  @IsNumber()
  page?: number;

  @IsOptional()
  @IsNumber()
  limit?: number;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsString()
  startDate?: string;

  @IsOptional()
  @IsString()
  endDate?: string;

  @IsOptional()
  @IsString()
  currentUserId?: string;
}

// 带教时间线查询参数DTO
export class MentorshipTimelineQueryDto {
  @IsOptional()
  @IsString()
  type?: string;

  @IsOptional()
  @IsString()
  startDate?: string;

  @IsOptional()
  @IsString()
  endDate?: string;

  @IsOptional()
  @IsString()
  mentorId?: string;

  @IsOptional()
  @IsString()
  currentUserId?: string;
}

// 带教统计查询参数DTO
export class MentorshipStatisticsQueryDto {
  @IsOptional()
  @IsString()
  period?: string;

  @IsOptional()
  @IsString()
  currentUserId?: string;
} 