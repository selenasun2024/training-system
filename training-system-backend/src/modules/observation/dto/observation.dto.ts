import { IsString, IsArray, IsOptional, IsEnum, IsNumber, Min, Max } from 'class-validator';
import { Transform } from 'class-transformer';

export enum ObservationType {
  DAILY = 'DAILY',
  WEEKLY = 'WEEKLY', 
  MILESTONE = 'MILESTONE',
  SPECIAL = 'SPECIAL'
}

export enum ObservationVisibility {
  PRIVATE = 'PRIVATE',
  TEACHER = 'TEACHER', 
  PUBLIC = 'PUBLIC'
}

export class CreateObservationDto {
  @IsString()
  projectId: string;

  @IsString()
  studentId: string;

  @IsEnum(ObservationType)
  type: ObservationType;

  @IsString()
  title: string;

  @IsString()
  content: string;

  @IsArray()
  @IsOptional()
  attachments?: string[];

  @IsArray()
  @IsOptional()
  tags?: string[];

  @IsNumber()
  @Min(1)
  @Max(10)
  @IsOptional()
  score?: number;

  @IsEnum(ObservationVisibility)
  @IsOptional()
  visibility?: ObservationVisibility;
}

export class UpdateObservationDto {
  @IsEnum(ObservationType)
  @IsOptional()
  type?: ObservationType;

  @IsString()
  @IsOptional()
  title?: string;

  @IsString()
  @IsOptional()
  content?: string;

  @IsArray()
  @IsOptional()
  attachments?: string[];

  @IsArray()
  @IsOptional()
  tags?: string[];

  @IsNumber()
  @Min(1)
  @Max(10)
  @IsOptional()
  score?: number;

  @IsEnum(ObservationVisibility)
  @IsOptional()
  visibility?: ObservationVisibility;
}

export class ObservationQueryDto {
  @IsString()
  @IsOptional()
  projectId?: string;

  @IsString()
  @IsOptional()
  observerId?: string;

  @IsString()
  @IsOptional()
  studentId?: string;

  @IsEnum(ObservationType)
  @IsOptional()
  type?: ObservationType;

  @IsString()
  @IsOptional()
  dateFrom?: string;

  @IsString()
  @IsOptional()
  dateTo?: string;

  @Transform(({ value }) => parseInt(value))
  @IsNumber()
  @IsOptional()
  page?: number = 1;

  @Transform(({ value }) => parseInt(value))
  @IsNumber()
  @IsOptional()
  pageSize?: number = 10;
}

export class AdminObserveQueryDto {
  @IsArray()
  @IsOptional()
  dateRange?: [string, string];

  @IsArray()
  @IsOptional()
  counselorIds?: string[];

  @IsArray()
  @IsOptional()
  studentIds?: string[];

  @IsArray()
  @IsOptional()
  groupIds?: string[];

  @IsString()
  @IsOptional()
  type?: 'highlight' | 'improve' | '';

  @IsOptional()
  page?: number = 1;

  @IsOptional()
  pageSize?: number = 10;
} 