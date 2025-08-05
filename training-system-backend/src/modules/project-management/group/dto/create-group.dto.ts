import { IsNotEmpty, IsString, IsOptional, MaxLength } from 'class-validator';

export class CreateGroupDto {
  @IsNotEmpty({ message: '小组名称不能为空' })
  @IsString()
  @MaxLength(100, { message: '小组名称不能超过100个字符' })
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsNotEmpty()
  @IsString()
  projectId: string;
} 