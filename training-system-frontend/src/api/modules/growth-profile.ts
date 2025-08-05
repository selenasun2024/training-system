// 成长档案相关API接口定义

import request from '@/utils/request';
import type { 
  GrowthProfile, 
  GrowthProfileConfig, 
  GrowthProfilePermission,
  GrowthTimelineEvent,
  SkillDevelopmentTrack,
  Achievement,
  FeedbackItem,
  GrowthGoal,
  ApiResponse,
  PaginationParams,
  PaginationResult
} from '@/types';

// 成长档案基础API
export const growthProfileApi = {
  // 获取用户成长档案
  getProfile: (userId: string): Promise<ApiResponse<GrowthProfile>> => {
    return request.get(`/api/growth-profile/${userId}`);
  },

  // 更新成长档案基本信息
  updateProfile: (userId: string, data: Partial<GrowthProfile>): Promise<ApiResponse<GrowthProfile>> => {
    return request.put(`/api/growth-profile/${userId}`, data);
  },

  // 获取档案配置
  getProfileConfig: (userId: string): Promise<ApiResponse<GrowthProfileConfig>> => {
    return request.get(`/api/growth-profile/${userId}/config`);
  },

  // 更新档案配置
  updateProfileConfig: (userId: string, config: GrowthProfileConfig): Promise<ApiResponse<GrowthProfileConfig>> => {
    return request.put(`/api/growth-profile/${userId}/config`, config);
  },

  // 获取档案权限
  getProfilePermissions: (userId: string): Promise<ApiResponse<GrowthProfilePermission[]>> => {
    return request.get(`/api/growth-profile/${userId}/permissions`);
  },

  // 分享档案
  shareProfile: (userId: string, shareData: {
    targetUserIds: string[];
    permissions: string[];
    expiresAt?: Date;
  }): Promise<ApiResponse<any>> => {
    return request.post(`/api/growth-profile/${userId}/share`, shareData);
  },

  // 导出档案
  exportProfile: (userId: string, format: 'pdf' | 'excel'): Promise<Blob> => {
    return request.get(`/api/growth-profile/${userId}/export`, {
      params: { format },
      responseType: 'blob'
    });
  }
};

// 成长时间线API
export const timelineApi = {
  // 获取时间线事件
  getTimeline: (userId: string, params?: {
    types?: string[];
    timeRange?: string;
    importance?: string;
    pagination?: PaginationParams;
  }): Promise<ApiResponse<PaginationResult<GrowthTimelineEvent>>> => {
    return request.get(`/api/growth-profile/${userId}/timeline`, { params });
  },

  // 添加时间线事件
  addEvent: (userId: string, event: Omit<GrowthTimelineEvent, 'id'>): Promise<ApiResponse<GrowthTimelineEvent>> => {
    return request.post(`/api/growth-profile/${userId}/timeline`, event);
  },

  // 更新时间线事件
  updateEvent: (userId: string, eventId: string, event: Partial<GrowthTimelineEvent>): Promise<ApiResponse<GrowthTimelineEvent>> => {
    return request.put(`/api/growth-profile/${userId}/timeline/${eventId}`, event);
  },

  // 删除时间线事件
  deleteEvent: (userId: string, eventId: string): Promise<ApiResponse<any>> => {
    return request.delete(`/api/growth-profile/${userId}/timeline/${eventId}`);
  }
};

// 技能发展API
export const skillDevelopmentApi = {
  // 获取技能发展轨迹
  getSkills: (userId: string, params?: {
    category?: string;
    level?: string;
    keyword?: string;
  }): Promise<ApiResponse<SkillDevelopmentTrack[]>> => {
    return request.get(`/api/growth-profile/${userId}/skills`, { params });
  },

  // 添加技能
  addSkill: (userId: string, skill: Omit<SkillDevelopmentTrack, 'skillId'>): Promise<ApiResponse<SkillDevelopmentTrack>> => {
    return request.post(`/api/growth-profile/${userId}/skills`, skill);
  },

  // 更新技能等级
  updateSkillLevel: (userId: string, skillId: string, data: {
    level: number;
    source: string;
    assessorId?: string;
    notes?: string;
    evidence?: string[];
  }): Promise<ApiResponse<SkillDevelopmentTrack>> => {
    return request.put(`/api/growth-profile/${userId}/skills/${skillId}/level`, data);
  },

  // 添加技能验证
  addSkillValidation: (userId: string, skillId: string, validation: any): Promise<ApiResponse<any>> => {
    return request.post(`/api/growth-profile/${userId}/skills/${skillId}/validations`, validation);
  },

  // 获取技能统计
  getSkillStatistics: (userId: string): Promise<ApiResponse<any>> => {
    return request.get(`/api/growth-profile/${userId}/skills/statistics`);
  },

  // 推荐学习路径
  recommendLearningPath: (userId: string, skillId: string): Promise<ApiResponse<any>> => {
    return request.get(`/api/growth-profile/${userId}/skills/${skillId}/recommend-path`);
  }
};

// 成就管理API
export const achievementApi = {
  // 获取成就列表
  getAchievements: (userId: string, params?: {
    type?: string;
    level?: string;
    verified?: boolean;
  }): Promise<ApiResponse<Achievement[]>> => {
    return request.get(`/api/growth-profile/${userId}/achievements`, { params });
  },

  // 添加成就
  addAchievement: (userId: string, achievement: Omit<Achievement, 'id'>): Promise<ApiResponse<Achievement>> => {
    return request.post(`/api/growth-profile/${userId}/achievements`, achievement);
  },

  // 验证成就
  verifyAchievement: (userId: string, achievementId: string, verificationData: {
    verified: boolean;
    feedback?: string;
  }): Promise<ApiResponse<Achievement>> => {
    return request.put(`/api/growth-profile/${userId}/achievements/${achievementId}/verify`, verificationData);
  },

  // 获取成就统计
  getAchievementStatistics: (userId: string): Promise<ApiResponse<any>> => {
    return request.get(`/api/growth-profile/${userId}/achievements/statistics`);
  }
};

// 反馈管理API
export const feedbackApi = {
  // 获取反馈列表
  getFeedback: (userId: string, params?: {
    type?: string;
    status?: string;
    pagination?: PaginationParams;
  }): Promise<ApiResponse<PaginationResult<FeedbackItem>>> => {
    return request.get(`/api/growth-profile/${userId}/feedback`, { params });
  },

  // 添加反馈
  addFeedback: (userId: string, feedback: Omit<FeedbackItem, 'id'>): Promise<ApiResponse<FeedbackItem>> => {
    return request.post(`/api/growth-profile/${userId}/feedback`, feedback);
  },

  // 回应反馈
  respondToFeedback: (userId: string, feedbackId: string, response: {
    status: 'acknowledged' | 'acted_upon';
    actionItems?: string[];
    response?: string;
  }): Promise<ApiResponse<FeedbackItem>> => {
    return request.put(`/api/growth-profile/${userId}/feedback/${feedbackId}/respond`, response);
  },

  // 请求反馈
  requestFeedback: (userId: string, request: {
    targetUserIds: string[];
    type: string;
    message: string;
    relatedProjectId?: string;
  }): Promise<ApiResponse<any>> => {
    return request.post(`/api/growth-profile/${userId}/feedback/request`, request);
  }
};

// 目标管理API
export const goalApi = {
  // 获取目标列表
  getGoals: (userId: string, params?: {
    status?: string;
    category?: string;
  }): Promise<ApiResponse<GrowthGoal[]>> => {
    return request.get(`/api/growth-profile/${userId}/goals`, { params });
  },

  // 添加目标
  addGoal: (userId: string, goal: Omit<GrowthGoal, 'id'>): Promise<ApiResponse<GrowthGoal>> => {
    return request.post(`/api/growth-profile/${userId}/goals`, goal);
  },

  // 更新目标
  updateGoal: (userId: string, goalId: string, goal: Partial<GrowthGoal>): Promise<ApiResponse<GrowthGoal>> => {
    return request.put(`/api/growth-profile/${userId}/goals/${goalId}`, goal);
  },

  // 更新目标进度
  updateProgress: (userId: string, goalId: string, progress: {
    progress: number;
    notes?: string;
    milestoneUpdates?: any[];
  }): Promise<ApiResponse<GrowthGoal>> => {
    return request.put(`/api/growth-profile/${userId}/goals/${goalId}/progress`, progress);
  },

  // 完成目标
  completeGoal: (userId: string, goalId: string, completion: {
    finalNotes?: string;
    achievements?: string[];
  }): Promise<ApiResponse<GrowthGoal>> => {
    return request.put(`/api/growth-profile/${userId}/goals/${goalId}/complete`, completion);
  },

  // 获取目标推荐
  getGoalRecommendations: (userId: string): Promise<ApiResponse<any[]>> => {
    return request.get(`/api/growth-profile/${userId}/goals/recommendations`);
  }
};

// 数据同步API
export const syncApi = {
  // 同步培训数据
  syncTrainingData: (userId: string): Promise<ApiResponse<any>> => {
    return request.post(`/api/growth-profile/${userId}/sync/training`);
  },

  // 同步带教数据
  syncMentorshipData: (userId: string): Promise<ApiResponse<any>> => {
    return request.post(`/api/growth-profile/${userId}/sync/mentorship`);
  },

  // 批量数据同步
  batchSync: (userIds: string[]): Promise<ApiResponse<any>> => {
    return request.post('/api/growth-profile/batch-sync', { userIds });
  },

  // 获取同步状态
  getSyncStatus: (userId: string): Promise<ApiResponse<{
    lastSyncTime: Date;
    status: 'pending' | 'syncing' | 'completed' | 'failed';
    errors?: string[];
  }>> => {
    return request.get(`/api/growth-profile/${userId}/sync/status`);
  }
};

// 统计分析API
export const analyticsApi = {
  // 获取个人成长分析
  getPersonalAnalytics: (userId: string, timeRange?: string): Promise<ApiResponse<any>> => {
    return request.get(`/api/growth-profile/${userId}/analytics`, {
      params: { timeRange }
    });
  },

  // 获取部门成长分析
  getDepartmentAnalytics: (departmentId: string, timeRange?: string): Promise<ApiResponse<any>> => {
    return request.get(`/api/growth-profile/analytics/department/${departmentId}`, {
      params: { timeRange }
    });
  },

  // 获取技能趋势分析
  getSkillTrends: (userId: string, skillIds?: string[]): Promise<ApiResponse<any>> => {
    return request.get(`/api/growth-profile/${userId}/analytics/skills`, {
      params: { skillIds: skillIds?.join(',') }
    });
  },

  // 生成成长报告
  generateGrowthReport: (userId: string, reportType: 'quarterly' | 'annual' | 'custom', params?: any): Promise<ApiResponse<any>> => {
    return request.post(`/api/growth-profile/${userId}/analytics/report`, {
      type: reportType,
      ...params
    });
  }
};

// 集成相关API
export const integrationApi = {
  // 从培训项目创建带教项目
  createMentorshipFromTraining: (trainingProjectId: string, data: {
    mentorId: string;
    studentId: string;
    templateId?: string;
  }): Promise<ApiResponse<any>> => {
    return request.post(`/api/integration/training-to-mentorship/${trainingProjectId}`, data);
  },

  // 获取可关联的培训项目
  getAvailableTrainingProjects: (userId: string): Promise<ApiResponse<any[]>> => {
    return request.get(`/api/integration/available-training/${userId}`);
  },

  // 获取可选择的导师
  getAvailableMentors: (skillIds?: string[], departmentId?: string): Promise<ApiResponse<any[]>> => {
    return request.get('/api/integration/available-mentors', {
      params: { skillIds: skillIds?.join(','), departmentId }
    });
  },

  // 自动匹配导师
  autoMatchMentor: (studentId: string, requirements: {
    skillIds: string[];
    preferredStyle?: string;
    priority?: string;
  }): Promise<ApiResponse<any[]>> => {
    return request.post(`/api/integration/auto-match-mentor/${studentId}`, requirements);
  }
};

// 导出所有API
export default {
  growthProfile: growthProfileApi,
  timeline: timelineApi,
  skillDevelopment: skillDevelopmentApi,
  achievement: achievementApi,
  feedback: feedbackApi,
  goal: goalApi,
  sync: syncApi,
  analytics: analyticsApi,
  integration: integrationApi
}; 