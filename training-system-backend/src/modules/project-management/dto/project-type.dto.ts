import { IsString, IsBoolean, IsOptional, IsInt, Min, Max } from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateProjectTypeDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  code?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(365)
  remindDays?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(20)
  defaultGroupCount?: number;

  @IsOptional()
  @IsBoolean()
  enabled?: boolean;

  @IsOptional()
  @IsInt()
  @Min(0)
  orderIndex?: number;
}

export class UpdateProjectTypeDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  code?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(365)
  remindDays?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(20)
  defaultGroupCount?: number;

  @IsOptional()
  @IsBoolean()
  enabled?: boolean;

  @IsOptional()
  @IsInt()
  @Min(0)
  orderIndex?: number;
}

export class QueryProjectTypeDto {
  @IsOptional()
  @Transform(({ value }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return value;
  })
  @IsBoolean()
  enabled?: boolean;

  @IsOptional()
  @Transform(({ value }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return value;
  })
  @IsBoolean()
  isSystem?: boolean;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsString()
  orderBy?: string;

  @IsOptional()
  @IsString()
  sortOrder?: 'asc' | 'desc';
} 