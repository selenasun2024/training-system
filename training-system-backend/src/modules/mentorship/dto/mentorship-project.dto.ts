import { IsNotEmpty, IsOptional, IsString, IsArray, IsEnum, IsNumber } from 'class-validator';

/**
 * 创建带教项目DTO
 */
export class CreateMentorshipProjectDto {
  @IsNotEmpty()
  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsNotEmpty()
  @IsEnum(['training_based', 'direct_mentorship', 'skill_development'])
  projectType: string;

  @IsOptional()
  @IsEnum(['draft', 'active', 'completed', 'paused', 'cancelled'])
  status?: string;

  @IsOptional()
  @IsString()
  department?: string;

  @IsOptional()
  @IsArray()
  objectives?: string[];

  @IsOptional()
  @IsArray()
  expectedOutcomes?: string[];

  @IsOptional()
  @IsNumber()
  plannedDuration?: number;

  @IsOptional()
  @IsString()
  plannedStartDate?: string;

  @IsOptional()
  @IsString()
  plannedEndDate?: string;

  @IsOptional()
  @IsArray()
  mentorRequirements?: string[];

  @IsOptional()
  @IsArray()
  studentRequirements?: string[];

  @IsOptional()
  @IsString()
  createdBy?: string;
}

/**
 * 更新带教项目DTO
 */
export class UpdateMentorshipProjectDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsEnum(['training_based', 'direct_mentorship', 'skill_development'])
  projectType?: string;

  @IsOptional()
  @IsEnum(['draft', 'active', 'completed', 'paused', 'cancelled'])
  status?: string;

  @IsOptional()
  @IsString()
  department?: string;

  @IsOptional()
  @IsArray()
  objectives?: string[];

  @IsOptional()
  @IsArray()
  expectedOutcomes?: string[];

  @IsOptional()
  @IsNumber()
  plannedDuration?: number;

  @IsOptional()
  @IsString()
  plannedStartDate?: string;

  @IsOptional()
  @IsString()
  plannedEndDate?: string;

  @IsOptional()
  @IsArray()
  mentorRequirements?: string[];

  @IsOptional()
  @IsArray()
  studentRequirements?: string[];

  @IsOptional()
  @IsString()
  updatedBy?: string;
}

/**
 * 带教项目查询参数
 */
export interface ProjectQueryDto {
  page: number;
  limit: number;
  status?: string;
  type?: string;
  search?: string;
  currentUserId?: string;
}

/**
 * 带教项目统计查询参数
 */
export interface ProjectStatisticsQueryDto {
  startDate?: string;
  endDate?: string;
  currentUserId?: string;
} 