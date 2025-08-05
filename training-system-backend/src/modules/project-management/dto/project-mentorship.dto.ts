import { IsNotEmpty, IsOptional, IsString, IsNumber, IsEnum, IsArray, IsDate, Min, Max } from 'class-validator';
import { Type, Transform } from 'class-transformer';

/**
 * 创建师徒关系DTO
 */
export class CreateMentorshipRelationshipDto {
  @IsOptional()
  @IsString()
  projectId?: string;

  @IsNotEmpty()
  @IsString()
  mentorId: string;

  @IsNotEmpty()
  @IsString()
  studentId: string;

  @IsOptional()
  @IsEnum(['PROJECT_BASED', 'LONG_TERM', 'SKILL_SPECIFIC'])
  type?: string;

  @IsOptional()
  @IsEnum(['MANUAL', 'SYSTEM_RECOMMENDED'])
  matchingType?: string;

  @IsOptional()
  @IsNumber()
  matchingScore?: number;

  @IsOptional()
  @IsArray()
  matchingReasons?: string[];

  @IsOptional()
  @IsString()
  remarks?: string;

  @IsOptional()
  @IsString()
  createdBy?: string;
}

/**
 * 创建带教评价DTO
 */
export class CreateMentorshipEvaluationDto {
  @IsOptional()
  @IsString()
  projectId?: string;

  @IsOptional()
  @IsString()
  relationshipId?: string;

  @IsOptional()
  @IsString()
  evaluatorId?: string;

  @IsNotEmpty()
  @IsString()
  evaluateeId: string;

  @IsNotEmpty()
  @IsEnum(['MENTOR', 'STUDENT', 'SUPERVISOR', 'ADMIN'])
  evaluatorType: string;

  @IsNotEmpty()
  @IsEnum(['WEEKLY', 'MONTHLY', 'PHASE_END', 'PROJECT_END'])
  evaluationPeriod: string;

  @IsNotEmpty()
  @IsNumber()
  performanceRating: number;

  @IsNotEmpty()
  @IsNumber()
  communicationRating: number;

  @IsNotEmpty()
  @IsNumber()
  guidanceEffectivenessRating: number;

  @IsNotEmpty()
  @IsNumber()
  progressRating: number;

  @IsNotEmpty()
  @IsNumber()
  overallRating: number;

  @IsOptional()
  @IsArray()
  strengths?: string[];

  @IsOptional()
  @IsArray()
  areasForImprovement?: string[];

  @IsOptional()
  @IsString()
  feedback?: string;

  @IsOptional()
  @IsArray()
  recommendations?: string[];
}

/**
 * 带教进度查询DTO
 */
export class MentorshipProgressQueryDto {
  @IsOptional()
  @IsString()
  mentorId?: string;

  @IsOptional()
  @IsString()
  studentId?: string;

  @IsOptional()
  @IsEnum(['ACTIVE', 'COMPLETED', 'PAUSED', 'CANCELLED'])
  status?: string;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  page?: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  limit?: number;

  @IsOptional()
  @IsString()
  taskStatus?: string;

  @IsOptional()
  @IsString()
  taskType?: string;

  @IsOptional()
  @IsString()
  searchKeyword?: string;
}

// =====================================================
// 接口定义
// =====================================================

/**
 * 师徒关系接口
 */
export interface MentorshipRelationship {
  id: string;
  projectId: string;
  mentorId: string;
  studentId: string;
  type: string;
  status: string;
  establishedDate: Date;
  mentor: {
    id: string;
    name: string;
    department: string;
    position: string;
  };
  student: {
    id: string;
    name: string;
    department: string;
    position: string;
  };
  project: {
    id: string;
    title: string;
    status: string;
  };
}

/**
 * 带教进度接口
 */
export interface MentorshipProgressResponse {
  relationships: any[];
  summary: {
    totalStudents: number;
    averageProgress: number;
    onTimeCompletion: number;
    needsAttention: number;
  };
  pagination: {
    total: number;
    page: number;
    limit: number;
  };
}

/**
 * 带教评价接口
 */
export interface MentorshipEvaluation {
  id: string;
  projectId: string;
  relationshipId: string;
  evaluatorId: string;
  evaluateeId: string;
  evaluatorType: string;
  evaluationPeriod: string;
  performanceRating: number;
  communicationRating: number;
  guidanceEffectivenessRating: number;
  progressRating: number;
  overallRating: number;
  strengths?: string[];
  areasForImprovement?: string[];
  feedback?: string;
  recommendations?: string[];
  status: string;
  createdAt: Date;
}

/**
 * 带教标准接口
 */
export interface MentorshipStandards {
  projectId: string;
  basicRequirements: string[];
  skillRequirements: {
    skill: string;
    description: string;
    level: string;
    assessmentMethod: string;
  }[];
  timeRequirements: {
    totalHours: number;
    weeklyHours: number;
    duration: string;
  };
  evaluationCriteria: string[];
}

/**
 * 师徒反馈DTO
 */
export class CreateMentorshipFeedbackDto {
  @IsString()
  feedbackType: string; // positive, improvement, concern, encouragement

  @IsArray()
  @IsString({ each: true })
  feedbackFocus: string[]; // learning_attitude, task_completion, skill_mastery, etc.

  @IsString()
  specificPerformance: string;

  @IsOptional()
  @IsString()
  improvementSuggestions?: string;

  @IsOptional()
  @IsString()
  nextStageGoals?: string;

  @IsOptional()
  @IsString()
  recommendedResources?: string;

  @IsString()
  followUpPlan: string; // none, weekly, biweekly, monthly

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  ccList?: string[];

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(5)
  rating?: number;
} 