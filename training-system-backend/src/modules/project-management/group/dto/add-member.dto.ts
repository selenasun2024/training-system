import { IsNotEmpty, IsString } from 'class-validator';

export class AddMemberDto {
  @IsNotEmpty({ message: '用户ID不能为空' })
  @IsString()
  userId: string;

  @IsNotEmpty({ message: '角色不能为空' })
  @IsString()
  role: string; // 'LEADER' or 'MEMBER'
} 