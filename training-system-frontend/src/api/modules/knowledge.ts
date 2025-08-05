import request from '@/utils/request';
import type {
  KnowledgeAsset,
  KnowledgeSearchParams,
  KnowledgeSearchResult,
  KnowledgeFilterOptions,
  KnowledgeStatistics,
  KnowledgeCategory,
  KnowledgeTag,
  CreateKnowledgeAssetDto,
  UpdateKnowledgeAssetDto,
  KnowledgeAssetListParams,
  PaginatedKnowledgeResult,
  UserKnowledgeAction,
  KnowledgeRecommendation,
  KnowledgeReviewRecord,
  KnowledgeReviewStatus,
  KnowledgeEvaluation,
  EvaluationReply,
  KnowledgeQualityAssessment,
  PersonalKnowledgeStats,
  MyKnowledgeItem,
  MyCollectionItem,
  CollectionFolder,
  KnowledgeFormData,
  KnowledgeManagementFilters,
  BatchOperationParams,
  KnowledgeAnalyticsReport,
  KnowledgeImportData,
  KnowledgeExportData,
  KnowledgeNotification
} from '@/types/knowledge';

/**
 * 知识资产API接口
 */
export const knowledgeApi = {
  /**
   * 获取知识资产列表
   */
  getAssetList: (params: KnowledgeAssetListParams = {}): Promise<PaginatedKnowledgeResult<KnowledgeAsset>> => {
    return request.get('/knowledge/assets', { params });
  },

  /**
   * 获取知识资产详情
   */
  getAssetDetail: (id: string): Promise<KnowledgeAsset> => {
    return request.get(`/knowledge/assets/${id}`);
  },

  /**
   * 创建知识资产
   */
  createAsset: (data: CreateKnowledgeAssetDto): Promise<KnowledgeAsset> => {
    return request.post('/knowledge/assets', data);
  },

  /**
   * 更新知识资产
   */
  updateAsset: (id: string, data: UpdateKnowledgeAssetDto): Promise<KnowledgeAsset> => {
    return request.put(`/knowledge/assets/${id}`, data);
  },

  /**
   * 删除知识资产
   */
  deleteAsset: (id: string): Promise<void> => {
    return request.delete(`/knowledge/assets/${id}`);
  },

  /**
   * 搜索知识资产
   */
  searchAssets: (params: KnowledgeSearchParams): Promise<KnowledgeSearchResult> => {
    return request.get('/knowledge/search', { params });
  },

  /**
   * 获取筛选选项
   */
  getFilterOptions: (): Promise<KnowledgeFilterOptions> => {
    return request.get('/knowledge/filter-options');
  },

  /**
   * 点赞知识资产
   */
  likeAsset: (id: string): Promise<void> => {
    return request.post(`/knowledge/assets/${id}/like`);
  },

  /**
   * 取消点赞知识资产
   */
  unlikeAsset: (id: string): Promise<void> => {
    return request.delete(`/knowledge/assets/${id}/like`);
  },

  /**
   * 收藏知识资产
   */
  collectAsset: (id: string): Promise<void> => {
    return request.post(`/knowledge/assets/${id}/collect`);
  },

  /**
   * 取消收藏知识资产
   */
  uncollectAsset: (id: string): Promise<void> => {
    return request.delete(`/knowledge/assets/${id}/collect`);
  },

  /**
   * 分享知识资产
   */
  shareAsset: (id: string, data: { platform: string; message?: string }): Promise<void> => {
    return request.post(`/knowledge/assets/${id}/share`, data);
  },

  /**
   * 增加知识资产查看次数
   */
  viewAsset: (id: string): Promise<void> => {
    return request.post(`/knowledge/assets/${id}/view`);
  },

  /**
   * 获取用户的知识行为记录
   */
  getUserActions: (userId: string, params: { page?: number; pageSize?: number } = {}): Promise<PaginatedKnowledgeResult<UserKnowledgeAction>> => {
    return request.get(`/knowledge/users/${userId}/actions`, { params });
  },

  /**
   * 获取用户收藏的知识资产
   */
  getUserCollections: (userId: string, params: KnowledgeAssetListParams = {}): Promise<PaginatedKnowledgeResult<KnowledgeAsset>> => {
    return request.get(`/knowledge/users/${userId}/collections`, { params });
  },

  /**
   * 获取用户创建的知识资产
   */
  getUserAssets: (userId: string, params: KnowledgeAssetListParams = {}): Promise<PaginatedKnowledgeResult<KnowledgeAsset>> => {
    return request.get(`/knowledge/users/${userId}/assets`, { params });
  },

  /**
   * 获取知识推荐
   */
  getRecommendations: (userId: string, params: { limit?: number; type?: string } = {}): Promise<KnowledgeRecommendation[]> => {
    return request.get(`/knowledge/recommendations/${userId}`, { params });
  },

  /**
   * 获取热门知识资产
   */
  getPopularAssets: (params: { limit?: number; timeRange?: string } = {}): Promise<KnowledgeAsset[]> => {
    return request.get('/knowledge/popular', { params });
  },

  /**
   * 获取最新知识资产
   */
  getLatestAssets: (params: { limit?: number } = {}): Promise<KnowledgeAsset[]> => {
    return request.get('/knowledge/latest', { params });
  },

  /**
   * 获取知识统计信息
   */
  getStatistics: (): Promise<KnowledgeStatistics> => {
    return request.get('/knowledge/statistics');
  },

  /**
   * 获取知识分类列表
   */
  getCategories: (): Promise<KnowledgeCategory[]> => {
    return request.get('/knowledge/categories');
  },

  /**
   * 获取知识标签列表
   */
  getTags: (params: { query?: string; limit?: number } = {}): Promise<KnowledgeTag[]> => {
    return request.get('/knowledge/tags', { params });
  },

  /**
   * 上传知识资产附件
   */
  uploadAttachment: (file: File): Promise<{ url: string; id: string }> => {
    const formData = new FormData();
    formData.append('file', file);
    
    return request.post('/knowledge/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
  },

  /**
   * 批量删除知识资产
   */
  batchDeleteAssets: (ids: string[]): Promise<void> => {
    return request.delete('/knowledge/assets/batch-delete', { data: { ids } });
  },

  /**
   * 批量更新知识资产状态
   */
  batchUpdateAssetStatus: (ids: string[], status: string): Promise<void> => {
    return request.put('/knowledge/assets/batch-update-status', { ids, status });
  },

  /**
   * 获取相关知识资产
   */
  getRelatedAssets: (id: string, params: { limit?: number } = {}): Promise<KnowledgeAsset[]> => {
    return request.get(`/knowledge/assets/${id}/related`, { params });
  },

  /**
   * 检查用户是否已点赞
   */
  checkUserLiked: (assetId: string, userId: string): Promise<{ liked: boolean }> => {
    return request.get(`/knowledge/assets/${assetId}/like-status`, { params: { userId } });
  },

  /**
   * 检查用户是否已收藏
   */
  checkUserCollected: (assetId: string, userId: string): Promise<{ collected: boolean }> => {
    return request.get(`/knowledge/assets/${assetId}/collect-status`, { params: { userId } });
  }
};

// ========== 第三阶段：知识管理接口 ==========

/**
 * 创建知识
 */
export function createKnowledge(data: KnowledgeFormData) {
  return request<KnowledgeAsset>({
    url: '/knowledge/assets',
    method: 'post',
    data
  })
}

/**
 * 更新知识
 */
export function updateKnowledge(id: string, data: Partial<KnowledgeFormData>) {
  return request<KnowledgeAsset>({
    url: `/knowledge/assets/${id}`,
    method: 'put',
    data
  })
}

/**
 * 删除知识
 */
export function deleteKnowledge(id: string) {
  return request<void>({
    url: `/knowledge/assets/${id}`,
    method: 'delete'
  })
}

/**
 * 发布知识
 */
export function publishKnowledge(id: string) {
  return request<KnowledgeAsset>({
    url: `/knowledge/assets/${id}/publish`,
    method: 'post'
  })
}

/**
 * 归档知识
 */
export function archiveKnowledge(id: string) {
  return request<KnowledgeAsset>({
    url: `/knowledge/assets/${id}/archive`,
    method: 'post'
  })
}

/**
 * 批量操作知识
 */
export function batchOperateKnowledge(params: BatchOperationParams) {
  return request<{ success: number; failed: number; errors?: string[] }>({
    url: '/knowledge/assets/batch',
    method: 'post',
    data: params
  })
}

/**
 * 上传知识附件
 */
export function uploadKnowledgeAttachment(file: File) {
  const formData = new FormData()
  formData.append('file', file)
  
  return request<{ id: string; name: string; url: string; size: number }>({
    url: '/knowledge/attachments',
    method: 'post',
    data: formData,
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  })
}

/**
 * 删除知识附件
 */
export function deleteKnowledgeAttachment(id: string) {
  return request<void>({
    url: `/knowledge/attachments/${id}`,
    method: 'delete'
  })
}

// ========== 知识审核接口 ==========

/**
 * 获取待审核知识列表
 */
export function getPendingReviewKnowledge(params?: KnowledgeManagementFilters) {
  return request<PaginatedKnowledgeResult<MyKnowledgeItem>>({
    url: '/knowledge/review/pending',
    method: 'get',
    params
  })
}

/**
 * 审核知识
 */
export function reviewKnowledge(id: string, data: {
  status: KnowledgeReviewStatus;
  comments: string;
  suggestions?: string;
}) {
  return request<KnowledgeReviewRecord>({
    url: `/knowledge/assets/${id}/review`,
    method: 'post',
    data
  })
}

/**
 * 获取知识审核历史
 */
export function getKnowledgeReviewHistory(id: string) {
  return request<KnowledgeReviewRecord[]>({
    url: `/knowledge/assets/${id}/review-history`,
    method: 'get'
  })
}

// ========== 评价反馈接口 ==========

/**
 * 获取知识评价列表
 */
export function getKnowledgeEvaluations(assetId: string, params?: {
  page?: number;
  pageSize?: number;
  sortBy?: 'createdAt' | 'rating' | 'likeCount';
  sortOrder?: 'asc' | 'desc';
}) {
  return request<PaginatedKnowledgeResult<KnowledgeEvaluation>>({
    url: `/knowledge/assets/${assetId}/evaluations`,
    method: 'get',
    params
  })
}

/**
 * 创建知识评价
 */
export function createKnowledgeEvaluation(assetId: string, data: {
  rating: number;
  comment: string;
  pros?: string[];
  cons?: string[];
  suggestions?: string;
  isAnonymous?: boolean;
}) {
  return request<KnowledgeEvaluation>({
    url: `/knowledge/assets/${assetId}/evaluations`,
    method: 'post',
    data
  })
}

/**
 * 更新知识评价
 */
export function updateKnowledgeEvaluation(assetId: string, evaluationId: string, data: {
  rating?: number;
  comment?: string;
  pros?: string[];
  cons?: string[];
  suggestions?: string;
}) {
  return request<KnowledgeEvaluation>({
    url: `/knowledge/assets/${assetId}/evaluations/${evaluationId}`,
    method: 'put',
    data
  })
}

/**
 * 删除知识评价
 */
export function deleteKnowledgeEvaluation(assetId: string, evaluationId: string) {
  return request<void>({
    url: `/knowledge/assets/${assetId}/evaluations/${evaluationId}`,
    method: 'delete'
  })
}

/**
 * 点赞/取消点赞评价
 */
export function toggleEvaluationLike(assetId: string, evaluationId: string) {
  return request<{ isLiked: boolean; likeCount: number }>({
    url: `/knowledge/assets/${assetId}/evaluations/${evaluationId}/like`,
    method: 'post'
  })
}

/**
 * 回复评价
 */
export function replyToEvaluation(assetId: string, evaluationId: string, data: {
  content: string;
  parentReplyId?: string;
}) {
  return request<EvaluationReply>({
    url: `/knowledge/assets/${assetId}/evaluations/${evaluationId}/replies`,
    method: 'post',
    data
  })
}

/**
 * 获取评价回复列表
 */
export function getEvaluationReplies(assetId: string, evaluationId: string) {
  return request<EvaluationReply[]>({
    url: `/knowledge/assets/${assetId}/evaluations/${evaluationId}/replies`,
    method: 'get'
  })
}

/**
 * 获取知识质量评估
 */
export function getKnowledgeQualityAssessment(assetId: string) {
  return request<KnowledgeQualityAssessment>({
    url: `/knowledge/assets/${assetId}/quality-assessment`,
    method: 'get'
  })
}

// ========== 个人知识中心接口 ==========

/**
 * 获取个人知识统计
 */
export function getPersonalKnowledgeStats(userId?: string) {
  return request<PersonalKnowledgeStats>({
    url: '/knowledge/personal/stats',
    method: 'get',
    params: userId ? { userId } : undefined
  })
}

/**
 * 获取我的知识列表
 */
export function getMyKnowledge(params?: KnowledgeManagementFilters) {
  return request<PaginatedKnowledgeResult<MyKnowledgeItem>>({
    url: '/knowledge/personal/my-knowledge',
    method: 'get',
    params
  })
}

/**
 * 获取我的收藏列表
 */
export function getMyCollections(params?: {
  folderId?: string;
  page?: number;
  pageSize?: number;
  sortBy?: 'collectedAt' | 'title' | 'viewCount';
  sortOrder?: 'asc' | 'desc';
}) {
  return request<PaginatedKnowledgeResult<MyCollectionItem>>({
    url: '/knowledge/personal/collections',
    method: 'get',
    params
  })
}

/**
 * 收藏/取消收藏知识
 */
export function toggleKnowledgeCollection(assetId: string, data?: {
  folderId?: string;
  tags?: string[];
  notes?: string;
  isPrivate?: boolean;
}) {
  return request<{ isCollected: boolean; collectCount: number }>({
    url: `/knowledge/assets/${assetId}/collect`,
    method: 'post',
    data
  })
}

/**
 * 获取收藏夹列表
 */
export function getCollectionFolders() {
  return request<CollectionFolder[]>({
    url: '/knowledge/personal/folders',
    method: 'get'
  })
}

/**
 * 创建收藏夹
 */
export function createCollectionFolder(data: {
  name: string;
  description?: string;
  isPrivate?: boolean;
}) {
  return request<CollectionFolder>({
    url: '/knowledge/personal/folders',
    method: 'post',
    data
  })
}

/**
 * 更新收藏夹
 */
export function updateCollectionFolder(id: string, data: {
  name?: string;
  description?: string;
  isPrivate?: boolean;
}) {
  return request<CollectionFolder>({
    url: `/knowledge/personal/folders/${id}`,
    method: 'put',
    data
  })
}

/**
 * 删除收藏夹
 */
export function deleteCollectionFolder(id: string) {
  return request<void>({
    url: `/knowledge/personal/folders/${id}`,
    method: 'delete'
  })
}

/**
 * 获取我的评论列表
 */
export function getMyEvaluations(params?: {
  page?: number;
  pageSize?: number;
  sortBy?: 'createdAt' | 'rating';
  sortOrder?: 'asc' | 'desc';
}) {
  return request<PaginatedKnowledgeResult<KnowledgeEvaluation & { asset: KnowledgeAsset }>>({
    url: '/knowledge/personal/evaluations',
    method: 'get',
    params
  })
}

/**
 * 点赞/取消点赞知识
 */
export function toggleKnowledgeLike(assetId: string) {
  return request<{ isLiked: boolean; likeCount: number }>({
    url: `/knowledge/assets/${assetId}/like`,
    method: 'post'
  })
}

/**
 * 分享知识
 */
export function shareKnowledge(assetId: string, data: {
  platform?: string;
  message?: string;
}) {
  return request<{ shareCount: number }>({
    url: `/knowledge/assets/${assetId}/share`,
    method: 'post',
    data
  })
}

// ========== 分析报告接口 ==========

/**
 * 获取知识分析报告
 */
export function getKnowledgeAnalyticsReport(params: {
  startDate: string;
  endDate: string;
  type?: 'overview' | 'detailed';
}) {
  return request<KnowledgeAnalyticsReport>({
    url: '/knowledge/analytics/report',
    method: 'get',
    params
  })
}

/**
 * 导出知识数据
 */
export function exportKnowledgeData(params: {
  assetIds?: string[];
  includeCategories?: boolean;
  includeTags?: boolean;
  format?: 'json' | 'excel' | 'pdf';
}) {
  return request<Blob>({
    url: '/knowledge/export',
    method: 'post',
    data: params,
    responseType: 'blob'
  })
}

/**
 * 导入知识数据
 */
export function importKnowledgeData(file: File, options?: {
  skipDuplicates?: boolean;
  autoPublish?: boolean;
  defaultVisibility?: string;
}) {
  const formData = new FormData()
  formData.append('file', file)
  if (options) {
    formData.append('options', JSON.stringify(options))
  }
  
  return request<{ success: number; failed: number; errors?: string[] }>({
    url: '/knowledge/import',
    method: 'post',
    data: formData,
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  })
}

// ========== 通知接口 ==========

/**
 * 获取知识相关通知
 */
export function getKnowledgeNotifications(params?: {
  page?: number;
  pageSize?: number;
  isRead?: boolean;
  type?: string[];
}) {
  return request<PaginatedKnowledgeResult<KnowledgeNotification>>({
    url: '/knowledge/notifications',
    method: 'get',
    params
  })
}

/**
 * 标记通知为已读
 */
export function markNotificationAsRead(id: string) {
  return request<void>({
    url: `/knowledge/notifications/${id}/read`,
    method: 'post'
  })
}

/**
 * 批量标记通知为已读
 */
export function markAllNotificationsAsRead() {
  return request<void>({
    url: '/knowledge/notifications/read-all',
    method: 'post'
  })
}

export default {
  // 基础接口
  getAssetList: knowledgeApi.getAssetList,
  getAssetDetail: knowledgeApi.getAssetDetail,
  createAsset: knowledgeApi.createAsset,
  updateAsset: knowledgeApi.updateAsset,
  deleteAsset: knowledgeApi.deleteAsset,
  searchAssets: knowledgeApi.searchAssets,
  getFilterOptions: knowledgeApi.getFilterOptions,
  likeAsset: knowledgeApi.likeAsset,
  unlikeAsset: knowledgeApi.unlikeAsset,
  collectAsset: knowledgeApi.collectAsset,
  uncollectAsset: knowledgeApi.uncollectAsset,
  shareAsset: knowledgeApi.shareAsset,
  viewAsset: knowledgeApi.viewAsset,
  getUserActions: knowledgeApi.getUserActions,
  getUserCollections: knowledgeApi.getUserCollections,
  getUserAssets: knowledgeApi.getUserAssets,
  getRecommendations: knowledgeApi.getRecommendations,
  getPopularAssets: knowledgeApi.getPopularAssets,
  getLatestAssets: knowledgeApi.getLatestAssets,
  getStatistics: knowledgeApi.getStatistics,
  getCategories: knowledgeApi.getCategories,
  getTags: knowledgeApi.getTags,
  uploadAttachment: knowledgeApi.uploadAttachment,
  batchDeleteAssets: knowledgeApi.batchDeleteAssets,
  batchUpdateAssetStatus: knowledgeApi.batchUpdateAssetStatus,
  getRelatedAssets: knowledgeApi.getRelatedAssets,
  checkUserLiked: knowledgeApi.checkUserLiked,
  checkUserCollected: knowledgeApi.checkUserCollected,
  
  // 知识管理
  createKnowledge,
  updateKnowledge,
  deleteKnowledge,
  publishKnowledge,
  archiveKnowledge,
  batchOperateKnowledge,
  uploadKnowledgeAttachment,
  deleteKnowledgeAttachment,
  
  // 审核管理
  getPendingReviewKnowledge,
  reviewKnowledge,
  getKnowledgeReviewHistory,
  
  // 评价反馈
  getKnowledgeEvaluations,
  createKnowledgeEvaluation,
  updateKnowledgeEvaluation,
  deleteKnowledgeEvaluation,
  toggleEvaluationLike,
  replyToEvaluation,
  getEvaluationReplies,
  getKnowledgeQualityAssessment,
  
  // 个人中心
  getPersonalKnowledgeStats,
  getMyKnowledge,
  getMyCollections,
  toggleKnowledgeCollection,
  getCollectionFolders,
  createCollectionFolder,
  updateCollectionFolder,
  deleteCollectionFolder,
  getMyEvaluations,
  toggleKnowledgeLike,
  shareKnowledge,
  
  // 分析报告
  getKnowledgeAnalyticsReport,
  exportKnowledgeData,
  importKnowledgeData,
  
  // 通知
  getKnowledgeNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead
} 