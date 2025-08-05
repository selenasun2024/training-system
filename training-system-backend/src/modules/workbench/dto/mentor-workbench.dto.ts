import { IsNotEmpty, IsOptional, IsString, IsNumber, IsEnum, IsArray, IsDate, IsJSON } from 'class-validator';
import { Type, Transform } from 'class-transformer';

/**
 * 导师工作台查询DTO
 */
export class MentorDashboardQueryDto {
  @IsOptional()
  @IsString()
  @Transform(({ value }) => value === 'true')
  includeStatistics?: boolean;

  @IsOptional()
  @IsString()
  dateRange?: string; // 'week' | 'month' | 'quarter'
}

/**
 * 创建带教计划DTO
 */
export class CreateMentorshipPlanDto {
  @IsNotEmpty()
  @IsString()
  projectId: string;

  @IsNotEmpty()
  @IsString()
  relationshipId: string;

  @IsNotEmpty()
  @IsString()
  planTitle: string;

  @IsOptional()
  @IsString()
  planDescription?: string;

  @IsNotEmpty()
  @IsString()
  overallGoal: string;

  @IsOptional()
  @IsArray()
  specificObjectives?: string[];

  @IsOptional()
  @IsArray()
  successMetrics?: string[];

  @IsOptional()
  @IsArray()
  expectedOutcomes?: string[];

  @IsNotEmpty()
  @IsNumber()
  totalDuration: number;

  @IsNotEmpty()
  @IsString()
  plannedStartDate: string;

  @IsNotEmpty()
  @IsString()
  plannedEndDate: string;

  @IsOptional()
  @IsArray()
  learningTopics?: string[];

  @IsOptional()
  @IsArray()
  skillDevelopmentAreas?: string[];

  @IsOptional()
  @IsString()
  createdBy?: string;
}

/**
 * 创建带教任务DTO
 */
export class CreateMentorshipTaskDto {
  @IsNotEmpty()
  @IsString()
  projectId: string;

  @IsOptional()
  @IsString()
  phaseId?: string;

  @IsNotEmpty()
  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsNotEmpty()
  @IsEnum(['LEARNING', 'PRACTICE', 'ASSESSMENT', 'REVIEW', 'PRESENTATION'])
  taskType: string;

  @IsOptional()
  @IsEnum(['HIGH', 'MEDIUM', 'LOW'])
  priority?: string;

  @IsOptional()
  @IsNumber()
  estimatedHours?: number;

  @IsOptional()
  @IsString()
  dueDate?: string;

  @IsNotEmpty()
  @IsEnum(['STUDENT', 'MENTOR', 'BOTH'])
  assignedTo: string;

  @IsOptional()
  @IsArray()
  requirements?: string[];

  @IsOptional()
  @IsArray()
  deliverables?: string[];

  @IsOptional()
  @IsString()
  createdBy?: string;
}

/**
 * 创建导师评价DTO
 */
export class CreateMentorEvaluationDto {
  @IsNotEmpty()
  @IsString()
  projectId: string;

  @IsNotEmpty()
  @IsString()
  relationshipId: string;

  @IsOptional()
  @IsString()
  phaseId?: string;

  @IsOptional()
  @IsString()
  evaluatorId?: string;

  @IsNotEmpty()
  @IsString()
  evaluateeId: string;

  @IsNotEmpty()
  @IsEnum(['REGULAR', 'MILESTONE', 'FINAL'])
  evaluationType: string;

  @IsNotEmpty()
  @IsString()
  evaluationTitle: string;

  @IsOptional()
  @IsEnum(['WEEKLY', 'MONTHLY', 'PHASE_END', 'PROJECT_END'])
  evaluationPeriod?: string;

  @IsOptional()
  @IsNumber()
  technicalSkillsScore?: number;

  @IsOptional()
  @IsNumber()
  communicationScore?: number;

  @IsOptional()
  @IsNumber()
  learningAttitudeScore?: number;

  @IsOptional()
  @IsNumber()
  problemSolvingScore?: number;

  @IsOptional()
  @IsNumber()
  collaborationScore?: number;

  @IsNotEmpty()
  @IsNumber()
  overallScore: number;

  @IsOptional()
  @IsString()
  strengths?: string;

  @IsOptional()
  @IsString()
  improvementAreas?: string;

  @IsNotEmpty()
  @IsString()
  specificFeedback: string;

  @IsOptional()
  @IsString()
  suggestions?: string;

  @IsOptional()
  @IsArray()
  nextPhaseGoals?: string[];

  @IsOptional()
  @IsArray()
  recommendedActions?: string[];
}

/**
 * 创建师徒交互DTO
 */
export class CreateInteractionDto {
  @IsNotEmpty()
  @IsString()
  relationshipId: string;

  @IsNotEmpty()
  @IsString()
  projectId: string;

  @IsNotEmpty()
  @IsEnum(['MEETING', 'GUIDANCE', 'FEEDBACK', 'PROGRESS_REVIEW', 'PROBLEM_SOLVING'])
  interactionType: string;

  @IsNotEmpty()
  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsNotEmpty()
  @IsString()
  interactionDate: string;

  @IsOptional()
  @IsString()
  startTime?: string;

  @IsOptional()
  @IsString()
  endTime?: string;

  @IsOptional()
  @IsNumber()
  duration?: number;

  @IsOptional()
  @IsString()
  location?: string;

  @IsNotEmpty()
  @IsEnum(['FACE_TO_FACE', 'VIDEO_CALL', 'PHONE_CALL', 'INSTANT_MESSAGE', 'EMAIL'])
  method: string;

  @IsOptional()
  @IsArray()
  participants?: string[];

  @IsNotEmpty()
  @IsEnum(['MENTOR', 'STUDENT', 'BOTH'])
  initiator: string;

  @IsOptional()
  @IsArray()
  topics?: string[];

  @IsNotEmpty()
  @IsString()
  content: string;

  @IsOptional()
  @IsArray()
  actionItems?: string[];

  @IsOptional()
  @IsArray()
  attachments?: string[];

  @IsOptional()
  @IsNumber()
  effectivenessRating?: number;

  @IsOptional()
  @IsString()
  recordedBy?: string;
}

/**
 * 学员查询参数DTO
 */
export interface StudentQueryDto {
  status?: string;
  project?: string;
}

/**
 * 带教计划查询参数DTO
 */
export interface PlanQueryDto {
  status?: string;
  studentId?: string;
}

/**
 * 带教任务查询参数DTO
 */
export interface TaskQueryDto {
  status?: string;
  studentId?: string;
  type?: string;
}

/**
 * 评价查询参数DTO
 */
export interface EvaluationQueryDto {
  status?: string;
  studentId?: string;
  period?: string;
}

/**
 * 资源查询参数DTO
 */
export interface ResourceQueryDto {
  category?: string;
  type?: string;
}

/**
 * 沟通记录查询参数DTO
 */
export interface CommunicationQueryDto {
  studentId?: string;
  type?: string;
  startDate?: string;
  endDate?: string;
}

/**
 * 导师工作台统计数据DTO
 */
export interface MentorDashboardStatsDto {
  activeStudents: number;
  totalStudents: number;
  averageProgress: number;
  pendingEvaluations: number;
  completedEvaluations: number;
  thisWeekCommunications: number;
  pendingTasks: number;
  completedTasks: number;
  activeProjects: number;
} 