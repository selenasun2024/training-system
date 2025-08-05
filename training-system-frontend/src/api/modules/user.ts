import request from '@/utils/request';
import type { 
  User, 
  UserWithRoles, 
  UserQuery, 
  UserListResponse, 
  CreateUserDto, 
  UpdateUserDto,
  ProjectParticipant
} from '@/types/user';

// 获取用户列表
export const getUsers = (params: UserQuery): Promise<UserListResponse> => {
  const searchParams = new URLSearchParams();
  if (params.page) searchParams.append('page', params.page.toString());
  if (params.pageSize) searchParams.append('pageSize', params.pageSize.toString());
  if (params.keyword) searchParams.append('keyword', params.keyword);
  if (params.department) searchParams.append('department', params.department);
  if (params.level) searchParams.append('level', params.level);
  if (params.status) searchParams.append('status', params.status);
  if (params.role) searchParams.append('role', params.role);
  if (params.hireDate?.length === 2) {
    searchParams.append('hireDateFrom', params.hireDate[0]);
    searchParams.append('hireDateTo', params.hireDate[1]);
  }
  
  const url = `/api/users${searchParams.toString() ? `?${searchParams.toString()}` : ''}`;
  return request.get(url);
};

// 获取用户详情
export const getUserById = (id: string): Promise<UserWithRoles> => {
  return request.get(`/api/users/${id}`);
};

// 创建用户
export const createUser = (data: CreateUserDto): Promise<User> => {
  return request.post('/api/users', data);
};

// 更新用户
export const updateUser = (id: string, data: UpdateUserDto): Promise<User> => {
  return request.put(`/api/users/${id}`, data);
};

// 删除用户
export const deleteUser = (id: string): Promise<void> => {
  return request.delete(`/api/users/${id}`);
};

// 搜索用户（用于选择器组件）
export const searchUsers = (params: {
  keyword?: string;
  department?: string;
  level?: string;
  role?: string; // 添加角色筛选参数
  excludeIds?: string[]; // 排除的用户ID列表
  limit?: number;
}): Promise<User[]> => {
  const searchParams = new URLSearchParams();
  if (params.keyword) searchParams.append('keyword', params.keyword);
  if (params.department) searchParams.append('department', params.department);
  if (params.level) searchParams.append('level', params.level);
  if (params.role) searchParams.append('role', params.role);
  if (params.excludeIds?.length) {
    params.excludeIds.forEach(id => searchParams.append('excludeIds', id));
  }
  if (params.limit) searchParams.append('limit', params.limit.toString());
  
  const url = `/api/users/search${searchParams.toString() ? `?${searchParams.toString()}` : ''}`;
  return request.get(url);
};

// 获取项目参与者
export const getProjectParticipants = (projectId: string): Promise<ProjectParticipant[]> => {
  return request.get(`/api/projects/${projectId}/participants`);
};

// 添加项目参与者
export const addProjectParticipant = (projectId: string, data: {
  userId: string;
  role: 'owner' | 'teacher' | 'counselor' | 'student' | 'observer';
  notes?: string;
}): Promise<ProjectParticipant> => {
  return request.post(`/api/projects/${projectId}/participants`, data);
};

// 移除项目参与者
export const removeProjectParticipant = (projectId: string, userId: string): Promise<void> => {
  return request.delete(`/api/projects/${projectId}/participants/${userId}`);
};

// 更新项目参与者角色
export const updateProjectParticipant = (projectId: string, userId: string, data: {
  role?: 'owner' | 'teacher' | 'counselor' | 'student' | 'observer';
  status?: 'active' | 'inactive' | 'completed' | 'dropped';
  notes?: string;
}): Promise<ProjectParticipant> => {
  return request.put(`/api/projects/${projectId}/participants/${userId}`, data);
};

// 获取部门列表（用于筛选）
export const getDepartments = (): Promise<string[]> => {
  return request.get('/api/users/departments');
};

// 获取职级列表（用于筛选）
export const getLevels = (): Promise<string[]> => {
  return request.get('/api/users/levels');
}; 

// 获取辅导员列表（所有用户都可能成为辅导员）
export const getCounselors = async (): Promise<User[]> => {
  try {
    console.log('🔍 API: 请求辅导员数据...');
    // 首先尝试获取所有用户，然后在前端过滤具有相关角色的用户
    const result = await searchUsers({ limit: 200 }); // 增加限制以获取更多用户
    console.log('🔍 API: 原始用户数据响应:', result);
    
    // 过滤出可以作为辅导员的用户（基于职位和部门信息）
    const counselors = result.filter(user => {
      // 基于职位和部门信息判断是否适合作为辅导员
      const position = user.position?.toLowerCase() || '';
      const department = user.department?.toLowerCase() || '';
      const name = user.name?.toLowerCase() || '';
      
      // 检查职位是否包含相关关键词
      const isTeacher = position.includes('教师') || 
                       position.includes('辅导员') || 
                       position.includes('导师') ||
                       position.includes('讲师') ||
                       position.includes('培训师');
      
      // 检查部门是否为教学相关部门
      const isFromEducationDept = department.includes('教学') ||
                                 department.includes('培训') ||
                                 department.includes('教育') ||
                                 department.includes('人力资源') ||
                                 department.includes('hr');
      
      // 检查姓名是否包含教师等关键词（作为备用判断）
      const hasEducationTitle = name.includes('老师') || name.includes('教师');
      
      return isTeacher || isFromEducationDept || hasEducationTitle;
    });
    
    console.log('🔍 API: 过滤后的辅导员数据:', counselors);
    console.log('🔍 API: 辅导员数量:', counselors.length, '/ 总用户数:', result.length);
    
    // 如果过滤后没有找到合适的辅导员，返回所有用户供选择
    if (counselors.length === 0) {
      console.log('🔍 API: 未找到特定辅导员角色，返回所有用户供选择');
      return result;
    }
    
    return counselors;
  } catch (error) {
    console.error('🔍 API: 获取辅导员失败:', error);
    throw error;
  }
}; 