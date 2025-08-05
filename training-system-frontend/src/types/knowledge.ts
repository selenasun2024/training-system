// 知识资产相关类型定义

/**
 * 知识资产类型枚举
 */
export enum KnowledgeType {
  ARTICLE = 'article',           // 文章
  VIDEO = 'video',               // 视频
  DOCUMENT = 'document',         // 文档
  PRESENTATION = 'presentation', // 演示文稿
  CASE_STUDY = 'case_study',     // 案例研究
  BEST_PRACTICE = 'best_practice' // 最佳实践
}

/**
 * 知识资产状态枚举
 */
export enum KnowledgeStatus {
  DRAFT = 'draft',         // 草稿
  PUBLISHED = 'published', // 已发布
  ARCHIVED = 'archived'    // 已归档
}

/**
 * 知识可见性枚举
 */
export enum KnowledgeVisibility {
  PUBLIC = 'public',           // 公开
  INTERNAL = 'internal',       // 内部
  DEPARTMENT = 'department',   // 部门
  PRIVATE = 'private'          // 私有
}

/**
 * 知识作者信息
 */
export interface KnowledgeAuthor {
  id: string;
  name: string;
  avatar?: string;
  department: string;
  position?: string;
}

/**
 * 知识资产核心接口
 */
export interface KnowledgeAsset {
  id: string;
  title: string;
  summary: string;
  content: string;
  type: KnowledgeType;
  category: string;
  tags: string[];
  author: KnowledgeAuthor;
  status: KnowledgeStatus;
  visibility: KnowledgeVisibility;
  
  // 时间信息
  createdAt: string;
  updatedAt: string;
  publishedAt?: string;
  
  // 统计数据
  viewCount: number;
  likeCount: number;
  commentCount: number;
  shareCount: number;
  collectCount: number;
  
  // 媒体资源
  coverImage?: string;
  attachments?: KnowledgeAttachment[];
  
  // 关联信息
  relatedTraining?: string[]; // 关联的培训项目ID
  relatedAssets?: string[];   // 关联的知识资产ID
}

/**
 * 知识附件
 */
export interface KnowledgeAttachment {
  id: string;
  name: string;
  url: string;
  type: string;
  size: number;
  uploadedAt: string;
}

/**
 * 知识搜索参数
 */
export interface KnowledgeSearchParams {
  query?: string;                    // 搜索关键词
  type?: KnowledgeType[];           // 知识类型筛选
  category?: string[];              // 分类筛选
  tags?: string[];                  // 标签筛选
  author?: string[];                // 作者筛选
  department?: string[];            // 部门筛选
  dateRange?: {                     // 时间范围
    start: string;
    end: string;
  };
  sortBy?: 'createdAt' | 'updatedAt' | 'publishedAt' | 'viewCount' | 'likeCount';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  pageSize?: number;
}

/**
 * 知识搜索结果
 */
export interface KnowledgeSearchResult {
  items: KnowledgeAsset[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

/**
 * 知识筛选选项
 */
export interface KnowledgeFilterOptions {
  types: Array<{ value: KnowledgeType; label: string; count: number }>;
  categories: Array<{ value: string; label: string; count: number }>;
  tags: Array<{ value: string; label: string; count: number }>;
  authors: Array<{ value: string; label: string; count: number }>;
  departments: Array<{ value: string; label: string; count: number }>;
}

/**
 * 知识统计信息
 */
export interface KnowledgeStatistics {
  totalAssets: number;
  totalViews: number;
  totalLikes: number;
  totalShares: number;
  totalCollects: number;
  typeDistribution: Record<KnowledgeType, number>;
  categoryDistribution: Record<string, number>;
  monthlyTrend: Array<{
    month: string;
    count: number;
    views: number;
  }>;
}

/**
 * 用户知识行为
 */
export interface UserKnowledgeAction {
  assetId: string;
  action: 'view' | 'like' | 'collect' | 'share' | 'comment';
  timestamp: string;
  metadata?: Record<string, any>;
}

/**
 * 知识推荐项
 */
export interface KnowledgeRecommendation {
  asset: KnowledgeAsset;
  score: number;
  reason: string;
  source: 'collaborative' | 'content' | 'popular' | 'trending';
}

/**
 * 知识分类
 */
export interface KnowledgeCategory {
  id: string;
  name: string;
  description?: string;
  parentId?: string;
  children?: KnowledgeCategory[];
  assetCount: number;
  icon?: string;
  color?: string;
}

/**
 * 知识标签
 */
export interface KnowledgeTag {
  id: string;
  name: string;
  description?: string;
  color?: string;
  usageCount: number;
  createdAt: string;
}

/**
 * 创建知识资产的DTO
 */
export interface CreateKnowledgeAssetDto {
  title: string;
  summary: string;
  content: string;
  type: KnowledgeType;
  category: string;
  tags: string[];
  visibility: KnowledgeVisibility;
  coverImage?: string;
  attachments?: Omit<KnowledgeAttachment, 'id' | 'uploadedAt'>[];
  relatedTraining?: string[];
}

/**
 * 更新知识资产的DTO
 */
export interface UpdateKnowledgeAssetDto extends Partial<CreateKnowledgeAssetDto> {
  status?: KnowledgeStatus;
}

/**
 * 知识资产列表查询参数
 */
export interface KnowledgeAssetListParams extends KnowledgeSearchParams {
  status?: KnowledgeStatus[];
  visibility?: KnowledgeVisibility[];
}

/**
 * API响应的分页结果
 */
export interface PaginatedKnowledgeResult<T> {
  data: T[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
  filters?: KnowledgeFilterOptions;
}

/**
 * ========== 第三阶段：知识管理、评价反馈、个人中心相关类型 ==========
 */

/**
 * 知识审核状态枚举
 */
export enum KnowledgeReviewStatus {
  PENDING = 'pending',     // 待审核
  APPROVED = 'approved',   // 已通过
  REJECTED = 'rejected',   // 已拒绝
  REVISION = 'revision'    // 需修改
}

/**
 * 知识评分等级枚举
 */
export enum KnowledgeRating {
  EXCELLENT = 5,  // 优秀
  GOOD = 4,       // 良好
  AVERAGE = 3,    // 一般
  POOR = 2,       // 较差
  TERRIBLE = 1    // 很差
}

/**
 * 知识审核记录
 */
export interface KnowledgeReviewRecord {
  id: string;
  assetId: string;
  reviewerId: string;
  reviewerName: string;
  status: KnowledgeReviewStatus;
  comments: string;
  suggestions?: string;
  reviewedAt: string;
  version: number;
}

/**
 * 知识评价
 */
export interface KnowledgeEvaluation {
  id: string;
  assetId: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  rating: KnowledgeRating;
  comment: string;
  pros?: string[];        // 优点
  cons?: string[];        // 缺点
  suggestions?: string;   // 改进建议
  isAnonymous: boolean;
  isHelpful?: boolean;    // 是否有帮助
  createdAt: string;
  updatedAt: string;
  
  // 互动数据
  likeCount: number;
  replyCount: number;
  isLiked?: boolean;
}

/**
 * 评价回复
 */
export interface EvaluationReply {
  id: string;
  evaluationId: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  content: string;
  parentReplyId?: string; // 回复的回复
  createdAt: string;
  likeCount: number;
  isLiked?: boolean;
}

/**
 * 知识质量评估
 */
export interface KnowledgeQualityAssessment {
  assetId: string;
  overallRating: number;        // 总体评分
  ratingDistribution: Record<KnowledgeRating, number>; // 评分分布
  totalEvaluations: number;     // 总评价数
  
  // 质量维度评分
  contentQuality: number;       // 内容质量
  practicalValue: number;       // 实用价值
  clarity: number;              // 清晰度
  completeness: number;         // 完整性
  timeliness: number;           // 时效性
  
  // 推荐度
  recommendationRate: number;   // 推荐率
  
  // 质量标签
  qualityTags: string[];        // 如：实用、详细、易懂等
  
  lastUpdated: string;
}

/**
 * 个人知识统计
 */
export interface PersonalKnowledgeStats {
  userId: string;
  
  // 贡献统计
  totalContributions: number;   // 总贡献数
  publishedAssets: number;      // 已发布知识
  draftAssets: number;          // 草稿数
  underReviewAssets: number;    // 审核中数量
  
  // 影响力统计
  totalViews: number;           // 总浏览量
  totalLikes: number;           // 总点赞数
  totalCollects: number;        // 总收藏数
  totalShares: number;          // 总分享数
  
  // 互动统计
  totalComments: number;        // 总评论数
  totalReplies: number;         // 总回复数
  averageRating: number;        // 平均评分
  
  // 学习统计
  viewedAssets: number;         // 浏览过的知识
  collectedAssets: number;      // 收藏的知识
  likedAssets: number;          // 点赞的知识
  commentedAssets: number;      // 评论过的知识
  
  // 成长指标
  knowledgeLevel: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  contributionRank: number;     // 贡献排名
  influenceScore: number;       // 影响力分数
  
  // 时间统计
  monthlyContributions: Array<{
    month: string;
    count: number;
    views: number;
  }>;
  
  lastActiveAt: string;
}

/**
 * 我的知识列表项
 */
export interface MyKnowledgeItem extends KnowledgeAsset {
  reviewStatus?: KnowledgeReviewStatus;
  reviewComments?: string;
  qualityScore?: number;
  isEditable: boolean;
  canDelete: boolean;
}

/**
 * 我的收藏项
 */
export interface MyCollectionItem {
  id: string;
  asset: KnowledgeAsset;
  collectedAt: string;
  tags?: string[];              // 个人标签
  notes?: string;               // 个人笔记
  isPrivate: boolean;           // 是否私有收藏
  folder?: string;              // 收藏夹
}

/**
 * 收藏夹
 */
export interface CollectionFolder {
  id: string;
  name: string;
  description?: string;
  isPrivate: boolean;
  itemCount: number;
  createdAt: string;
  updatedAt: string;
}

/**
 * 知识创建/编辑表单数据
 */
export interface KnowledgeFormData {
  title: string;
  summary: string;
  content: string;
  type: KnowledgeType;
  category: string;
  tags: string[];
  visibility: KnowledgeVisibility;
  coverImage?: File | string;
  attachments?: File[];
  relatedTraining?: string[];
  
  // 高级选项
  allowComments: boolean;
  allowRating: boolean;
  notifyFollowers: boolean;
  schedulePublish?: string;     // 定时发布
}

/**
 * 知识管理筛选参数
 */
export interface KnowledgeManagementFilters {
  status?: KnowledgeStatus[];
  reviewStatus?: KnowledgeReviewStatus[];
  type?: KnowledgeType[];
  category?: string[];
  author?: string[];
  dateRange?: {
    start: string;
    end: string;
  };
  qualityRange?: {
    min: number;
    max: number;
  };
  sortBy?: 'createdAt' | 'updatedAt' | 'publishedAt' | 'viewCount' | 'rating';
  sortOrder?: 'asc' | 'desc';
}

/**
 * 批量操作类型
 */
export enum BatchOperationType {
  PUBLISH = 'publish',
  ARCHIVE = 'archive',
  DELETE = 'delete',
  CHANGE_CATEGORY = 'change_category',
  ADD_TAGS = 'add_tags',
  REMOVE_TAGS = 'remove_tags',
  CHANGE_VISIBILITY = 'change_visibility'
}

/**
 * 批量操作参数
 */
export interface BatchOperationParams {
  assetIds: string[];
  operation: BatchOperationType;
  params?: {
    category?: string;
    tags?: string[];
    visibility?: KnowledgeVisibility;
    reason?: string;
  };
}

/**
 * 知识分析报告
 */
export interface KnowledgeAnalyticsReport {
  period: {
    start: string;
    end: string;
  };
  
  // 总体指标
  overview: {
    totalAssets: number;
    newAssets: number;
    totalViews: number;
    totalEngagements: number;
    averageRating: number;
  };
  
  // 趋势分析
  trends: {
    dailyViews: Array<{ date: string; views: number }>;
    dailyCreations: Array<{ date: string; count: number }>;
    popularAssets: KnowledgeAsset[];
    trendingTopics: Array<{ topic: string; count: number; growth: number }>;
  };
  
  // 用户分析
  userAnalytics: {
    topContributors: Array<{
      user: KnowledgeAuthor;
      contributionCount: number;
      totalViews: number;
      averageRating: number;
    }>;
    activeUsers: number;
    newUsers: number;
  };
  
  // 内容分析
  contentAnalytics: {
    typeDistribution: Record<KnowledgeType, number>;
    categoryDistribution: Record<string, number>;
    qualityDistribution: Record<KnowledgeRating, number>;
    averageContentLength: number;
  };
}

/**
 * 知识导入/导出
 */
export interface KnowledgeImportData {
  assets: CreateKnowledgeAssetDto[];
  categories?: KnowledgeCategory[];
  tags?: KnowledgeTag[];
  options?: {
    skipDuplicates: boolean;
    autoPublish: boolean;
    defaultVisibility: KnowledgeVisibility;
  };
}

export interface KnowledgeExportData {
  assets: KnowledgeAsset[];
  categories: KnowledgeCategory[];
  tags: KnowledgeTag[];
  exportedAt: string;
  exportedBy: string;
}

/**
 * 通知相关类型
 */
export interface KnowledgeNotification {
  id: string;
  type: 'new_comment' | 'new_rating' | 'asset_approved' | 'asset_rejected' | 'asset_liked' | 'asset_shared';
  title: string;
  message: string;
  assetId?: string;
  assetTitle?: string;
  triggeredBy?: {
    userId: string;
    userName: string;
    userAvatar?: string;
  };
  isRead: boolean;
  createdAt: string;
} 