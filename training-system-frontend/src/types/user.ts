// 统一的用户类型定义
// 与后端users表字段完全一致

export interface User {
  id: string;
  username: string;
  email: string;
  name: string; // 对应realName
  department: string;
  position: string;
  level: string; // 职级：P4, P5, P6, P7等
  hireDate: string; // 入职日期 (YYYY-MM-DD格式)
  status: 'active' | 'inactive' | 'suspended';
  createdAt: string;
  updatedAt: string;
  lastLoginAt?: string;
}

export interface UserRole {
  id: string;
  userId: string;
  roleName: 'admin' | 'teacher' | 'counselor' | 'student' | 'observer';
  projectId?: string; // 项目级别角色，null表示全局角色
  grantedBy: string;
  grantedAt: string;
  revokedAt?: string;
  status: 'active' | 'revoked';
}

export interface UserWithRoles extends User {
  roles: UserRole[];
}

// 项目参与者（用于项目管理）
export interface ProjectParticipant {
  id: string;
  projectId: string;
  userId: string;
  role: 'owner' | 'teacher' | 'counselor' | 'student' | 'observer';
  status: 'active' | 'inactive' | 'completed' | 'dropped';
  joinedAt: string;
  completedAt?: string;
  notes?: string;
  // 关联用户信息
  user: User;
}

// 用户查询参数
export interface UserQuery {
  keyword?: string; // 搜索关键词（姓名、部门）
  department?: string; // 部门筛选
  level?: string; // 职级筛选
  status?: 'active' | 'inactive' | 'suspended'; // 状态筛选
  hireDate?: [string, string]; // 入职日期范围
  role?: string; // 角色筛选
  page?: number;
  pageSize?: number;
}

// 用户创建DTO
export interface CreateUserDto {
  username: string;
  email: string;
  password: string;
  name: string;
  department: string;
  position: string;
  level: string;
  hireDate: string;
}

// 用户更新DTO
export interface UpdateUserDto {
  email?: string;
  name?: string;
  department?: string;
  position?: string;
  level?: string;
  hireDate?: string;
  status?: 'active' | 'inactive' | 'suspended';
}

// 用户列表响应
export interface UserListResponse {
  users: UserWithRoles[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
} 