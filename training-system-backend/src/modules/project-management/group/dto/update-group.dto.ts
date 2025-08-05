import { IsString, IsOptional, MaxLength } from 'class-validator';

export class UpdateGroupDto {
  @IsOptional()
  @IsString()
  @MaxLength(100, { message: '小组名称不能超过100个字符' })
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;
} 