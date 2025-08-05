import {
  IsString,
  IsOptional,
  IsEnum,
  IsObject,
  IsUUID,
  IsNotEmpty,
  IsArray,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export enum ProposalStatus {
  DRAFT = 'DRAFT',
  SUBMITTED = 'SUBMITTED',
  UNDER_REVIEW = 'UNDER_REVIEW',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  WITHDRAWN = 'WITHDRAWN',
}

export enum ApprovalStepStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  SKIPPED = 'SKIPPED',
}

export class CreateProposalDto {
  @IsUUID(4, { message: '项目ID必须是有效的UUID' })
  projectId: string;

  @IsString({ message: '标题必须是字符串' })
  @IsNotEmpty({ message: '标题不能为空' })
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsObject()
  content?: Record<string, any>;

  @IsOptional()
  @IsObject()
  reportConfig?: Record<string, any>;
}

export class UpdateProposalDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsEnum(ProposalStatus)
  status?: ProposalStatus;

  @IsOptional()
  @IsObject()
  content?: Record<string, any>;

  @IsOptional()
  @IsObject()
  reportConfig?: Record<string, any>;
}

export class SubmitProposalDto {
  @IsOptional()
  @IsString()
  comments?: string;
}

export class ApprovalActionDto {
  @IsEnum(ApprovalStepStatus)
  action: ApprovalStepStatus.APPROVED | ApprovalStepStatus.REJECTED;

  @IsOptional()
  @IsString()
  comments?: string;
}

export class CreateApprovalStepDto {
  @IsString()
  stepId: string;

  @IsString()
  stepName: string;

  @IsString()
  approverRole: string;

  @IsOptional()
  @IsUUID(4)
  approverId?: string;
}

export class ProposalQueryDto {
  @IsOptional()
  @IsEnum(ProposalStatus)
  status?: ProposalStatus;

  @IsOptional()
  @IsUUID(4)
  projectId?: string;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsString()
  page?: string;

  @IsOptional()
  @IsString()
  limit?: string;
} 