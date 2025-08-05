import {
  IsString,
  IsOptional,
  IsBoolean,
  IsInt,
  IsEnum,
  IsDateString,
  IsObject,
  IsUUID,
  Min,
  Max,
} from 'class-validator';

export class CreateTaskDto {
  @IsUUID(4, { message: '项目ID必须是有效的UUID' })
  projectId: string;

  @IsUUID(4, { message: '阶段ID必须是有效的UUID' })
  stageId: string;

  @IsString({ message: '任务名称必须是字符串' })
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsString({ message: '任务类型必须是字符串' })
  type: string; // 'homework', 'face-to-face', 'online-course', 'exam', etc.

  @IsOptional()
  @IsBoolean()
  required?: boolean;

  @IsOptional()
  @IsInt()
  @Min(0)
  orderIndex?: number;

  @IsOptional()
  @IsObject()
  config?: Record<string, any>;

  @IsOptional()
  @IsUUID(4, { message: '分配人ID必须是有效的UUID' })
  assignedTo?: string;

  @IsOptional()
  @IsEnum(['COUNSELOR', 'TEACHER', 'ADMIN'])
  reviewerRole?: 'COUNSELOR' | 'TEACHER' | 'ADMIN';

  @IsOptional()
  @IsDateString()
  dueDate?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100)
  estimatedHours?: number;
}

export class UpdateTaskDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsEnum(['PENDING', 'ACTIVE', 'COMPLETED', 'CANCELLED'])
  status?: 'PENDING' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED';

  @IsOptional()
  @IsBoolean()
  required?: boolean;

  @IsOptional()
  @IsInt()
  @Min(0)
  orderIndex?: number;

  @IsOptional()
  @IsObject()
  config?: Record<string, any>;

  @IsOptional()
  @IsUUID(4, { message: '分配人ID必须是有效的UUID' })
  assignedTo?: string;

  @IsOptional()
  @IsEnum(['COUNSELOR', 'TEACHER', 'ADMIN'])
  reviewerRole?: 'COUNSELOR' | 'TEACHER' | 'ADMIN';

  @IsOptional()
  @IsDateString()
  dueDate?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100)
  estimatedHours?: number;
} 