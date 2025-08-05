import request from '@/utils/request';

export interface ProjectCreateDto {
  name: string;
  description?: string;
  startDate?: string;
  endDate?: string;
  estimatedDuration?: number;
  config?: any;
}

export interface ProjectUpdateDto {
  name?: string;
  description?: string;
  status?: 'DRAFT' | 'PLANNING' | 'APPROVED' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED';
  currentStage?: 'BEFORE' | 'DURING' | 'AFTER';
  estimatedDuration?: number;
  startDate?: string;
  endDate?: string;
  config?: any;
}

export interface Project {
  id: string;
  projectNo: string;
  name: string;
  description?: string;
  status: 'DRAFT' | 'PLANNING' | 'APPROVED' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED';
  currentStage: 'BEFORE' | 'DURING' | 'AFTER';
  ownerId: string;
  owner?: {
    id: string;
    name: string;
    department?: string;
  };
  config?: any;
  estimatedDuration?: number;
  startDate?: string;
  endDate?: string;
  createdAt: string;
  updatedAt: string;
  stages?: any[];
  participants?: any[];
  taskCount?: number;
  participantCount?: number;
}

export interface ProjectStage {
  id: string;
  projectId: string;
  name: string;
  description?: string;
  startDate: string;
  endDate: string;
  status: string;
  order: number;
  createdAt: string;
  updatedAt: string;
}

// 获取项目列表
export const getProjects = (params?: {
  page?: number;
  limit?: number;
  status?: string;
  managerId?: string;
}): Promise<{
  projects: Project[];
  total: number;
  page: number;
  limit: number;
}> => {
  const url = '/api/projects';  // 修复API路径
  if (params) {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        searchParams.append(key, String(value));
      }
    });
    return request.get(`${url}?${searchParams.toString()}`);
  }
  return request.get(url);
};

// 获取项目详情
export const getProject = (id: string): Promise<Project> => {
  return request.get(`/api/projects/${id}`);
};

// 创建项目
export const createProject = (data: ProjectCreateDto): Promise<Project> => {
  return request.post('/api/projects', data);
};

// 更新项目
export const updateProject = (id: string, data: ProjectUpdateDto): Promise<Project> => {
  return request.put(`/api/projects/${id}`, data);
};

// 发布项目
export const publishProject = (id: string): Promise<Project> => {
  return request.put(`/api/projects/${id}/publish`);
};

// 撤回项目
export const withdrawProject = (id: string): Promise<Project> => {
  return request.put(`/api/projects/${id}/withdraw`);
};

// 添加项目参与者
export const addProjectParticipant = (projectId: string, data: {
  userId: string;
  role: 'OWNER' | 'TEACHER' | 'COUNSELOR' | 'STUDENT' | 'OBSERVER';
  notes?: string;
}): Promise<any> => {
  return request.post(`/api/projects/${projectId}/participants`, data);
};

// 删除项目参与者
export const removeProjectParticipant = (projectId: string, userId: string): Promise<void> => {
  return request.delete(`/api/projects/${projectId}/participants/${userId}`);
};

// 删除项目
export const deleteProject = (id: string): Promise<void> => {
  return request.delete(`/api/projects/${id}`);
};

// 获取项目阶段
export const getProjectStages = (projectId: string): Promise<ProjectStage[]> => {
  return request.get(`/api/projects/${projectId}/stages`);
};

// 创建项目阶段
export const createProjectStage = (projectId: string, data: {
  name: string;
  type: 'BEFORE' | 'DURING' | 'AFTER';
  description?: string;
  estimatedDuration?: number;
  startDate?: string;
  endDate?: string;
  config?: any;
}): Promise<ProjectStage> => {
  return request.post(`/api/projects/${projectId}/stages`, data);
};

// 更新项目阶段
export const updateProjectStage = (stageId: string, data: {
  name?: string;
  description?: string;
  startDate?: string;
  endDate?: string;
  status?: string;
  order?: number;
}): Promise<ProjectStage> => {
  return request.put(`/api/stages/${stageId}`, data);
};

// 删除项目阶段
export const deleteProjectStage = (stageId: string): Promise<void> => {
  return request.delete(`/api/stages/${stageId}`);
};

// 获取有协同任务的项目列表
export function getProjectsWithCooperationTasks() {
  return request.get('/api/projects/with-cooperation-tasks');
} 