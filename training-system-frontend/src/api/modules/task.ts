import type { TaskForReview } from '../../types/task'
import request from '../../utils/request'

// 配置：是否使用mock数据
const USE_MOCK = false

// 创建任务的数据类型
export interface CreateTaskRequest {
  projectId: string;
  stageId: string;
  name: string;
  description?: string;
  type: string;
  required?: boolean;
  orderIndex?: number;
  config?: Record<string, any>;
  assignedTo?: string;
  reviewerRole?: 'COUNSELOR' | 'TEACHER' | 'ADMIN';
  dueDate?: string;
  estimatedHours?: number;
}

// Mock 数据（保留作为fallback）
const mockTasks: TaskForReview[] = [
  // 项目 A
  {
    id: 'T1',
    title: '小组讨论：企业文化案例',
    projectId: 'P101',
    projectName: '干部入模子培训 · 第 1 期',
    reviewerRole: 'counselor',
    deadline: '2025-08-01',
    submissions: [
      { userId: '1', userName: '张三', content: '提交内容 A' },
      { userId: '2', userName: '李四', content: '提交内容 B', score: 85 },
    ],
  },
  {
    id: 'T2',
    title: '作业：市场分析报告',
    projectId: 'P101',
    projectName: '干部入模子培训 · 第 1 期',
    reviewerRole: 'counselor',
    deadline: '2025-08-05',
    submissions: [
      { userId: '3', userName: '王五', content: '报告内容 C' },
    ],
  },
  // 项目 B
  {
    id: 'T3',
    title: '课堂测验 1',
    projectId: 'P202',
    projectName: '营销基础培训 · 第 2 期',
    reviewerRole: 'counselor',
    deadline: '2025-08-03',
    submissions: [
      { userId: '1', userName: '张三', content: '答案' },
    ],
  },
  // teacher 任务示例
  {
    id: 'T4',
    title: '课堂测验 1',
    projectId: 'P202',
    projectName: '营销基础培训 · 第 2 期',
    reviewerRole: 'teacher',
    deadline: '2025-08-03',
    submissions: [
      { userId: '1', userName: '张三', content: '答案', score: 90 },
    ],
  },
];

/**
 * 创建任务
 */
export async function createTask(taskData: CreateTaskRequest): Promise<any> {
  if (USE_MOCK) {
    return new Promise((resolve) => {
      setTimeout(() => {
        const newTask = {
          id: 'mock-' + Math.random().toString(36).substr(2, 9),
          ...taskData,
          status: 'PENDING',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        resolve(newTask);
      }, 300);
    });
  }

  try {
    console.log('📝 调用真实API: 创建任务 - 数据:', taskData);
    const response = await request.post('/api/tasks', taskData);
    console.log('✅ 任务创建成功:', response);
    return response;
  } catch (error) {
    console.error('❌ 创建任务失败:', error);
    throw error;
  }
}

/**
 * 创建任务（简化版本，用于测试）
 */
export async function createTaskSimple(taskData: any): Promise<any> {
  try {
    console.log('📝 调用简化API: 创建任务 - 数据:', taskData);
    const response = await request.post('/api/tasks/simple', taskData);
    console.log('✅ 简化任务创建成功:', response);
    return response;
  } catch (error) {
    console.error('❌ 简化创建任务失败:', error);
    throw error;
  }
}

/**
 * 获取待批阅任务列表
 */
export async function getTasksToReview(role: 'counselor' | 'teacher' | 'admin' = 'counselor', projectId?: string): Promise<any> {
  if (USE_MOCK) {
    return new Promise((resolve) => {
      setTimeout(() => {
        const filteredTasks = mockTasks.filter(task => 
          task.submissions.some(sub => sub.score === undefined)
        );
        resolve(filteredTasks);
      }, 300);
    });
  }

  // 从localStorage获取辅导员ID
  const counselorId = localStorage.getItem('currentUserId') || 'user-hr-001';
  
  console.log('📡 调用真实API: 获取待批阅任务 - 角色:', role, '辅导员ID:', counselorId)
  
  try {
    const params = new URLSearchParams();
    params.append('role', role);
    if (projectId) params.append('projectId', projectId);
    if (counselorId) params.append('counselorId', counselorId);
    
    const response = await request.get(`/api/tasks/review?${params.toString()}`);
    console.log('✅ 获取待批阅任务成功:', response);
    return response;
  } catch (error) {
    console.error('❌ 获取待批阅任务失败:', error);
    throw error;
  }
}

/**
 * 获取已批阅任务列表
 */
export async function getReviewedTasks(role: 'counselor' | 'teacher' | 'admin' = 'counselor', projectId?: string): Promise<any> {
  if (USE_MOCK) {
    return new Promise((resolve) => {
      setTimeout(() => {
        const filteredTasks = mockTasks.filter(task => 
          task.submissions.some(sub => sub.score !== undefined)
        );
        resolve(filteredTasks);
      }, 300);
    });
  }

  // 从localStorage获取辅导员ID
  const counselorId = localStorage.getItem('currentUserId') || 'user-hr-001';
  
  console.log('📡 调用真实API: 获取已批阅任务 - 角色:', role, '辅导员ID:', counselorId)
  
  try {
    const params = new URLSearchParams();
    params.append('role', role);
    if (projectId) params.append('projectId', projectId);
    if (counselorId) params.append('counselorId', counselorId);
    
    const response = await request.get(`/api/tasks/reviewed?${params.toString()}`);
    console.log('✅ 获取已批阅任务成功:', response);
    return response;
  } catch (error) {
    console.error('❌ 获取已批阅任务失败:', error);
    throw error;
  }
}

/**
 * 提交任务评分
 */
export async function submitScore(taskId: string, userId: string, score: number, feedback?: string): Promise<void> {
  if (USE_MOCK) {
    return new Promise((resolve, reject) => {
      const task = mockTasks.find((t) => t.id === taskId);
      if (!task) return reject('任务不存在');
      const sub = task.submissions.find((s) => s.userId === userId);
      if (!sub) return reject('学员提交不存在');
      sub.score = score;
      setTimeout(() => resolve(), 300);
    });
  }

  try {
    console.log('📝 调用真实API: 提交评分 - 任务ID:', taskId, '学员ID:', userId, '分数:', score);
    await request.post(`/api/tasks/${taskId}/submissions/${userId}/score`, {
      score,
      feedback
    });
    console.log('✅ 评分提交成功');
  } catch (error) {
    console.error('❌ 提交评分失败:', error);
    throw error;
  }
}

/**
 * 获取项目的任务列表
 */
export async function getProjectTasks(projectId: string): Promise<any[]> {
  try {
    console.log('📝 调用API: 获取项目任务列表 - 项目ID:', projectId);
    const response = await request.get(`/api/projects/${projectId}/tasks`);
    console.log('✅ 项目任务列表获取成功:', response);
    return response || [];
  } catch (error) {
    console.error('❌ 获取项目任务列表失败:', error);
    return []; // 失败时返回空数组
  }
}

/**
 * 学生提交作业
 */
export const submitTask = async (taskId: string, studentId: string, content: string, filePaths: string[] = []) => {
  console.log('🔍 API: 提交作业 - 任务ID:', taskId, '学生ID:', studentId)
  
  try {
    const response = await request.post(`/api/tasks/${taskId}/submit`, {
      content,
      studentId,
      filePaths
    })
    console.log('✅ API: 作业提交成功:', response)
    return response
  } catch (error) {
    console.error('❌ API: 提交作业失败:', error)
    throw error
  }
}

/**
 * 获取学生的作业任务列表 (学习中心专用)
 */
export const getStudentTasks = async (userId: string) => {
  console.log('🔍 API: 调用学生任务API - 用户ID:', userId)
  
  try {
    const response = await request.get(`/api/tasks/student/${userId}`)
    console.log('🔍 API: 学生任务响应:', response)
    
    // 🔧 修复：响应拦截器已经解包了数据，response直接就是任务数组
    if (Array.isArray(response)) {
      console.log('✅ API: 学生任务数据获取成功，任务数量:', response.length)
      return response
    } else {
      console.warn('⚠️ API: 学生任务响应格式异常，期待数组但收到:', typeof response, response)
      return []
    }
  } catch (error) {
    console.error('❌ API: 获取学生任务失败:', error)
    throw error
  }
} 

/**
 * 更新任务
 */
export async function updateTask(taskId: string, updateData: any): Promise<any> {
  try {
    console.log('✏️ API: 更新任务 - 任务ID:', taskId, '数据:', updateData);
    const response = await request.put(`/api/tasks/${taskId}`, updateData);
    console.log('✅ API: 任务更新成功:', response);
    return response;
  } catch (error) {
    console.error('❌ API: 更新任务失败:', error);
    throw error;
  }
}

/**
 * 删除任务
 */
export async function deleteTask(taskId: string): Promise<void> {
  try {
    console.log('🗑️ API: 删除任务 - 任务ID:', taskId);
    await request.delete(`/api/tasks/${taskId}`);
    console.log('✅ API: 任务删除成功');
  } catch (error) {
    console.error('❌ API: 删除任务失败:', error);
    throw error;
  }
} 