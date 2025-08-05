import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type {
  KnowledgeAsset,
  KnowledgeSearchParams,
  KnowledgeSearchResult,
  KnowledgeFilterOptions,
  KnowledgeCategory,
  KnowledgeTag,
  KnowledgeAssetListParams,
  PaginatedKnowledgeResult,
  KnowledgeType,
  KnowledgeStatus,
  KnowledgeVisibility,
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
  KnowledgeNotification
} from '@/types/knowledge';
import knowledgeApi from '@/api/modules/knowledge';

// 模拟数据扩展
const mockKnowledgeAssets: KnowledgeAsset[] = [
  {
    id: '1',
    title: 'Vue 3 Composition API 最佳实践指南',
    content: '详细介绍Vue 3 Composition API的使用方法和最佳实践...',
    summary: '本文深入探讨Vue 3 Composition API的核心概念、使用场景和最佳实践，帮助开发者更好地理解和应用这一重要特性。',
    type: 'article' as KnowledgeType,
    category: '前端开发',
    tags: ['Vue3', 'Composition API', '前端开发', '最佳实践'],
    author: {
      id: 'user1',
      name: '张三',
      avatar: 'https://cube.elemecdn.com/0/88/03b0d39583f48206768a7534e55bcpng.png',
      department: '技术部'
    },
    status: 'published' as KnowledgeStatus,
    visibility: 'public' as KnowledgeVisibility,
    createdAt: '2024-01-15T10:00:00Z',
    updatedAt: '2024-01-15T10:00:00Z',
    publishedAt: '2024-01-15T10:00:00Z',
    viewCount: 1250,
    likeCount: 89,
    commentCount: 23,
    shareCount: 45,
    collectCount: 67
  },
  {
    id: '2',
    title: '微服务架构设计与实践',
    content: '微服务架构的设计原则、实施策略和常见问题解决方案...',
    summary: '从零开始构建微服务架构，包括服务拆分、API设计、数据一致性、服务治理等关键技术点的详细说明。',
    type: 'document' as KnowledgeType,
    category: '架构设计',
    tags: ['微服务', '架构设计', '分布式系统', 'API设计'],
    author: {
      id: 'user2',
      name: '李四',
      avatar: 'https://cube.elemecdn.com/0/88/03b0d39583f48206768a7534e55bcpng.png',
      department: '架构部'
    },
    status: 'published' as KnowledgeStatus,
    visibility: 'public' as KnowledgeVisibility,
    createdAt: '2024-01-10T09:00:00Z',
    updatedAt: '2024-01-12T09:00:00Z',
    publishedAt: '2024-01-10T09:00:00Z',
    viewCount: 980,
    likeCount: 76,
    commentCount: 18,
    shareCount: 32,
    collectCount: 54
  },
  {
    id: '3',
    title: 'React Hook 使用技巧与性能优化',
    content: 'React Hook的高级使用技巧和性能优化方法...',
    summary: '深入讲解React Hook的使用技巧，包括自定义Hook、性能优化、常见陷阱及解决方案，提升React应用性能。',
    type: 'video' as KnowledgeType,
    category: '前端开发',
    tags: ['React', 'Hook', '性能优化', '前端开发'],
    author: {
      id: 'user3',
      name: '王五',
      avatar: 'https://cube.elemecdn.com/0/88/03b0d39583f48206768a7534e55bcpng.png',
      department: '技术部'
    },
    status: 'published' as KnowledgeStatus,
    visibility: 'public' as KnowledgeVisibility,
    createdAt: '2024-01-08T14:00:00Z',
    updatedAt: '2024-01-08T14:00:00Z',
    publishedAt: '2024-01-08T14:00:00Z',
    viewCount: 1450,
    likeCount: 112,
    commentCount: 34,
    shareCount: 67,
    collectCount: 89
  },
  {
    id: '4',
    title: 'Docker 容器化部署实战',
    content: 'Docker容器化技术的实战应用和部署策略...',
    summary: '从基础概念到实战部署，全面介绍Docker容器化技术在项目中的应用，包括镜像制作、容器编排、CI/CD集成等。',
    type: 'presentation' as KnowledgeType,
    category: '运维部署',
    tags: ['Docker', '容器化', '部署', 'DevOps'],
    author: {
      id: 'user4',
      name: '赵六',
      avatar: 'https://cube.elemecdn.com/0/88/03b0d39583f48206768a7534e55bcpng.png',
      department: '运维部'
    },
    status: 'published' as KnowledgeStatus,
    visibility: 'public' as KnowledgeVisibility,
    createdAt: '2024-01-05T11:00:00Z',
    updatedAt: '2024-01-06T11:00:00Z',
    publishedAt: '2024-01-05T11:00:00Z',
    viewCount: 876,
    likeCount: 65,
    commentCount: 15,
    shareCount: 28,
    collectCount: 43
  },
  {
    id: '5',
    title: '数据库性能调优案例分析',
    content: '真实项目中的数据库性能问题分析和优化方案...',
    summary: '通过具体案例分析数据库性能瓶颈的识别、诊断和优化方法，包括索引优化、查询优化、架构调整等实用技巧。',
    type: 'case_study' as KnowledgeType,
    category: '数据库',
    tags: ['数据库', '性能优化', '案例分析', 'SQL优化'],
    author: {
      id: 'user5',
      name: '孙七',
      avatar: 'https://cube.elemecdn.com/0/88/03b0d39583f48206768a7534e55bcpng.png',
      department: 'DBA团队'
    },
    status: 'published' as KnowledgeStatus,
    visibility: 'public' as KnowledgeVisibility,
    createdAt: '2024-01-03T16:00:00Z',
    updatedAt: '2024-01-03T16:00:00Z',
    publishedAt: '2024-01-03T16:00:00Z',
    viewCount: 654,
    likeCount: 48,
    commentCount: 12,
    shareCount: 19,
    collectCount: 31
  },
  {
    id: '6',
    title: 'Kubernetes 集群管理最佳实践',
    content: 'K8s集群的搭建、管理和监控最佳实践...',
    summary: '详细介绍Kubernetes集群的搭建、配置、管理和监控，包括网络配置、存储管理、安全策略等核心内容。',
    type: 'best_practice' as KnowledgeType,
    category: '运维部署',
    tags: ['Kubernetes', '集群管理', '容器编排', '最佳实践'],
    author: {
      id: 'user6',
      name: '周八',
      avatar: 'https://cube.elemecdn.com/0/88/03b0d39583f48206768a7534e55bcpng.png',
      department: '运维部'
    },
    status: 'published' as KnowledgeStatus,
    visibility: 'public' as KnowledgeVisibility,
    createdAt: '2024-01-01T13:00:00Z',
    updatedAt: '2024-01-02T13:00:00Z',
    publishedAt: '2024-01-01T13:00:00Z',
    viewCount: 789,
    likeCount: 58,
    commentCount: 16,
    shareCount: 24,
    collectCount: 37
  }
];

// 模拟评价数据
const mockEvaluations: KnowledgeEvaluation[] = [
  {
    id: 'eval1',
    assetId: '1',
    userId: 'user7',
    userName: '刘九',
    userAvatar: 'https://cube.elemecdn.com/0/88/03b0d39583f48206768a7534e55bcpng.png',
    rating: 5,
    comment: '非常详细的教程，对理解 Composition API 很有帮助！',
    pros: ['内容详细', '示例丰富', '易于理解'],
    cons: [],
    suggestions: '希望能增加更多实际项目案例',
    isAnonymous: false,
    isHelpful: true,
    createdAt: '2024-01-16T10:30:00Z',
    updatedAt: '2024-01-16T10:30:00Z',
    likeCount: 12,
    replyCount: 3,
    isLiked: false
  },
  {
    id: 'eval2',
    assetId: '1',
    userId: 'user8',
    userName: '陈十',
    userAvatar: 'https://cube.elemecdn.com/0/88/03b0d39583f48206768a7534e55bcpng.png',
    rating: 4,
    comment: '内容很好，但是有些地方可以更深入一些。',
    pros: ['结构清晰', '代码示例好'],
    cons: ['深度不够'],
    suggestions: '建议增加高级用法的介绍',
    isAnonymous: false,
    isHelpful: true,
    createdAt: '2024-01-17T14:20:00Z',
    updatedAt: '2024-01-17T14:20:00Z',
    likeCount: 8,
    replyCount: 1,
    isLiked: true
  }
];

// 模拟个人统计数据
const mockPersonalStats: PersonalKnowledgeStats = {
  userId: 'current-user',
  totalContributions: 15,
  publishedAssets: 12,
  draftAssets: 2,
  underReviewAssets: 1,
  totalViews: 5420,
  totalLikes: 234,
  totalCollects: 156,
  totalShares: 89,
  totalComments: 45,
  totalReplies: 67,
  averageRating: 4.6,
  viewedAssets: 128,
  collectedAssets: 34,
  likedAssets: 67,
  commentedAssets: 23,
  knowledgeLevel: 'advanced',
  contributionRank: 8,
  influenceScore: 892,
  monthlyContributions: [
    { month: '2024-01', count: 3, views: 890 },
    { month: '2024-02', count: 5, views: 1240 },
    { month: '2024-03', count: 4, views: 1680 },
    { month: '2024-04', count: 3, views: 1610 }
  ],
  lastActiveAt: '2024-04-15T16:30:00Z'
};

export const useKnowledgeStore = defineStore('knowledge', () => {
  // ========== 基础状态 ==========
  const assets = ref<KnowledgeAsset[]>(mockKnowledgeAssets);
  const currentAsset = ref<KnowledgeAsset | null>(null);
  const searchResults = ref<KnowledgeAsset[]>([]);
  const filteredAssets = ref<KnowledgeAsset[]>([]);
  const loading = ref(false);
  const error = ref<string | null>(null);

  // 搜索和筛选状态
  const searchQuery = ref('');
  const searchFilters = ref<KnowledgeSearchParams>({});
  const searchParams = ref<KnowledgeSearchParams>({});
  const filterOptions = ref<KnowledgeFilterOptions | null>(null);

  // ========== 第三阶段新增状态 ==========
  
  // 知识管理状态
  const myKnowledge = ref<MyKnowledgeItem[]>([]);
  const pendingReviewAssets = ref<MyKnowledgeItem[]>([]);
  const managementFilters = ref<KnowledgeManagementFilters>({});
  const selectedAssets = ref<string[]>([]);
  
  // 评价反馈状态
  const evaluations = ref<KnowledgeEvaluation[]>(mockEvaluations);
  const currentEvaluations = ref<KnowledgeEvaluation[]>([]);
  const qualityAssessment = ref<KnowledgeQualityAssessment | null>(null);
  
  // 个人中心状态
  const personalStats = ref<PersonalKnowledgeStats>(mockPersonalStats);
  const myCollections = ref<MyCollectionItem[]>([]);
  const collectionFolders = ref<CollectionFolder[]>([
    {
      id: 'folder1',
      name: '前端技术',
      description: '前端开发相关的知识收藏',
      isPrivate: false,
      itemCount: 12,
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-04-01T00:00:00Z'
    },
    {
      id: 'folder2',
      name: '架构设计',
      description: '系统架构和设计模式',
      isPrivate: false,
      itemCount: 8,
      createdAt: '2024-01-15T00:00:00Z',
      updatedAt: '2024-03-20T00:00:00Z'
    }
  ]);
  const myEvaluations = ref<(KnowledgeEvaluation & { asset: KnowledgeAsset })[]>([]);
  
  // 通知状态
  const notifications = ref<KnowledgeNotification[]>([]);
  const unreadNotificationCount = ref(0);

  // ========== 基础计算属性 ==========
  const popularAssets = computed(() => {
    return [...assets.value]
      .sort((a, b) => b.viewCount - a.viewCount)
      .slice(0, 10);
  });

  const latestAssets = computed(() => {
    return [...assets.value]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 10);
  });

  const recommendedAssets = computed(() => {
    return [...assets.value]
      .sort((a, b) => (b.likeCount + b.collectCount) - (a.likeCount + a.collectCount))
      .slice(0, 10);
  });

  // ========== 第三阶段新增计算属性 ==========
  
  // 我的知识统计
  const myKnowledgeStats = computed(() => {
    const published = myKnowledge.value.filter(item => item.status === 'published').length;
    const draft = myKnowledge.value.filter(item => item.status === 'draft').length;
    const underReview = myKnowledge.value.filter(item => item.reviewStatus === 'pending').length;
    
    return {
      total: myKnowledge.value.length,
      published,
      draft,
      underReview
    };
  });
  
  // 收藏统计
  const collectionStats = computed(() => {
    const total = myCollections.value.length;
    const byFolder = collectionFolders.value.reduce((acc, folder) => {
      acc[folder.name] = myCollections.value.filter(item => item.folder === folder.id).length;
      return acc;
    }, {} as Record<string, number>);
    
    return { total, byFolder };
  });

  // ========== 基础方法 ==========
  
  const fetchAssets = async (params?: KnowledgeSearchParams) => {
    loading.value = true;
    error.value = null;
    
    try {
      // 模拟API调用
      await new Promise(resolve => setTimeout(resolve, 500));
      
      let result = [...mockKnowledgeAssets];
      
      if (params?.query) {
        result = result.filter(asset => 
          asset.title.toLowerCase().includes(params.query!.toLowerCase()) ||
          asset.summary.toLowerCase().includes(params.query!.toLowerCase()) ||
          asset.tags.some(tag => tag.toLowerCase().includes(params.query!.toLowerCase()))
        );
      }
      
      if (params?.type && params.type.length > 0) {
        result = result.filter(asset => params.type!.includes(asset.type));
      }
      
      if (params?.category && params.category.length > 0) {
        result = result.filter(asset => params.category!.includes(asset.category));
      }
      
      assets.value = result;
      filteredAssets.value = result;
    } catch (err) {
      error.value = '获取知识列表失败';
      console.error('Failed to fetch assets:', err);
    } finally {
      loading.value = false;
    }
  };

  const fetchAssetDetail = async (id: string) => {
    loading.value = true;
    error.value = null;
    
    try {
      // 模拟API调用
      await new Promise(resolve => setTimeout(resolve, 300));
      
      const asset = mockKnowledgeAssets.find(item => item.id === id);
      if (asset) {
        currentAsset.value = asset;
        // 增加浏览量
        asset.viewCount += 1;
      } else {
        throw new Error('Knowledge asset not found');
      }
    } catch (err) {
      error.value = '获取知识详情失败';
      console.error('Failed to fetch asset detail:', err);
    } finally {
      loading.value = false;
    }
  };

  const searchAssets = async (query: string, filters?: KnowledgeSearchParams) => {
    loading.value = true;
    error.value = null;
    
    try {
      // 模拟API调用
      await new Promise(resolve => setTimeout(resolve, 400));
      
      let result = [...mockKnowledgeAssets];
      
      if (query) {
        result = result.filter(asset => 
          asset.title.toLowerCase().includes(query.toLowerCase()) ||
          asset.summary.toLowerCase().includes(query.toLowerCase()) ||
          asset.tags.some(tag => tag.toLowerCase().includes(query.toLowerCase())) ||
          asset.author.name.toLowerCase().includes(query.toLowerCase())
        );
      }
      
      if (filters?.type && filters.type.length > 0) {
        result = result.filter(asset => filters.type!.includes(asset.type));
      }
      
      if (filters?.category && filters.category.length > 0) {
        result = result.filter(asset => filters.category!.includes(asset.category));
      }
      
      if (filters?.tags && filters.tags.length > 0) {
        result = result.filter(asset => 
          filters.tags!.some(tag => asset.tags.includes(tag))
        );
      }
      
      searchResults.value = result;
      searchQuery.value = query;
      searchFilters.value = filters || {};
    } catch (err) {
      error.value = '搜索失败';
      console.error('Failed to search assets:', err);
    } finally {
      loading.value = false;
    }
  };

  // ========== 第三阶段新增方法 ==========
  
  // 知识管理方法
  const createKnowledge = async (data: KnowledgeFormData) => {
    try {
      const response = await knowledgeApi.createAsset({
        title: data.title,
        summary: data.summary,
        content: data.content,
        type: data.type,
        category: data.category,
        tags: data.tags,
        visibility: data.visibility,
        coverImage: typeof data.coverImage === 'string' ? data.coverImage : undefined,
        relatedTraining: data.relatedTraining
      });
      
      // 添加到本地数据
      assets.value.unshift(response);
      
      return response;
    } catch (err) {
      error.value = '创建知识失败';
      throw err;
    }
  };

  const updateKnowledge = async (id: string, data: Partial<KnowledgeFormData>) => {
    try {
      const updateData: any = {};
      if (data.title) updateData.title = data.title;
      if (data.summary) updateData.summary = data.summary;
      if (data.content) updateData.content = data.content;
      if (data.type) updateData.type = data.type;
      if (data.category) updateData.category = data.category;
      if (data.tags) updateData.tags = data.tags;
      if (data.visibility) updateData.visibility = data.visibility;
      if (data.coverImage) updateData.coverImage = typeof data.coverImage === 'string' ? data.coverImage : undefined;
      if (data.relatedTraining) updateData.relatedTraining = data.relatedTraining;
      
      const response = await knowledgeApi.updateAsset(id, updateData);
      
      // 更新本地数据
      const index = assets.value.findIndex(item => item.id === id);
      if (index > -1) {
        assets.value[index] = response;
      }
      
      return response;
    } catch (err) {
      error.value = '更新知识失败';
      throw err;
    }
  };

  const deleteKnowledge = async (id: string) => {
    try {
      await knowledgeApi.deleteAsset(id);
      
      // 从本地数据中移除
      const index = assets.value.findIndex(item => item.id === id);
      if (index > -1) {
        assets.value.splice(index, 1);
      }
      
      return true;
    } catch (err) {
      error.value = '删除知识失败';
      throw err;
    }
  };

  const publishKnowledge = async (id: string) => {
    try {
      const response = await knowledgeApi.updateAsset(id, { status: 'published' });
      
      // 更新本地数据
      const index = assets.value.findIndex(item => item.id === id);
      if (index > -1) {
        assets.value[index] = response;
      }
      
      return response;
    } catch (err) {
      error.value = '发布知识失败';
      throw err;
    }
  };

  const batchOperateKnowledge = async (params: BatchOperationParams) => {
    try {
      // 模拟批量操作
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // 更新本地数据
      params.assetIds.forEach(id => {
        const asset = assets.value.find(item => item.id === id);
        if (asset) {
          switch (params.operation) {
            case 'publish':
              asset.status = KnowledgeStatus.PUBLISHED;
              break;
            case 'archive':
              asset.status = KnowledgeStatus.ARCHIVED;
              break;
            case 'change_category':
              if (params.params?.category) {
                asset.category = params.params.category;
              }
              break;
            case 'add_tags':
              if (params.params?.tags) {
                asset.tags = [...new Set([...asset.tags, ...params.params.tags])];
              }
              break;
            case 'remove_tags':
              if (params.params?.tags) {
                asset.tags = asset.tags.filter(tag => !params.params!.tags!.includes(tag));
              }
              break;
            case 'change_visibility':
              if (params.params?.visibility) {
                asset.visibility = params.params.visibility;
              }
              break;
          }
        }
      });
      
      return { success: true, affectedCount: params.assetIds.length };
    } catch (err) {
      error.value = '批量操作失败';
      throw err;
    }
  };

  // 评价反馈方法
  const fetchKnowledgeEvaluations = async (assetId: string) => {
    loading.value = true;
    try {
      // 模拟API调用
      await new Promise(resolve => setTimeout(resolve, 300));
      
      const assetEvaluations = mockEvaluations.filter(evaluation => evaluation.assetId === assetId);
      currentEvaluations.value = assetEvaluations;
      
      return assetEvaluations;
    } catch (err) {
      error.value = '获取评价失败';
      throw err;
    } finally {
      loading.value = false;
    }
  };

  const createEvaluation = async (assetId: string, data: {
    rating: number;
    comment: string;
    pros?: string[];
    cons?: string[];
    suggestions?: string;
    isAnonymous?: boolean;
  }) => {
    try {
      // 模拟API调用
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const newEvaluation: KnowledgeEvaluation = {
        id: `eval_${Date.now()}`,
        assetId,
        userId: 'current_user',
        userName: '当前用户',
        rating: data.rating,
        comment: data.comment,
        pros: data.pros || [],
        cons: data.cons || [],
        suggestions: data.suggestions || '',
        isAnonymous: data.isAnonymous || false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        likeCount: 0,
        replyCount: 0,
        isLiked: false
      };
      
      // 添加到评价列表
      if (!currentEvaluations.value[assetId]) {
        currentEvaluations.value[assetId] = [];
      }
      currentEvaluations.value[assetId].unshift(newEvaluation);
      
      return newEvaluation;
    } catch (err) {
      error.value = '创建评价失败';
      throw err;
    }
  };

  const toggleEvaluationLike = async (assetId: string, evaluationId: string) => {
    try {
      // 模拟API调用
      await new Promise(resolve => setTimeout(resolve, 200));
      
      const evaluation = currentEvaluations.value[assetId]?.find(e => e.id === evaluationId);
      if (evaluation) {
        evaluation.isLiked = !evaluation.isLiked;
        evaluation.likeCount += evaluation.isLiked ? 1 : -1;
      }
      
      return { isLiked: evaluation?.isLiked, likeCount: evaluation?.likeCount };
    } catch (err) {
      error.value = '点赞操作失败';
      throw err;
    }
  };

  // 个人中心方法
  const fetchPersonalStats = async (userId?: string) => {
    loading.value = true;
    try {
      // 模拟API调用
      await new Promise(resolve => setTimeout(resolve, 300));
      personalStats.value = mockPersonalStats;
      return mockPersonalStats;
    } catch (err) {
      error.value = '获取个人统计失败';
      throw err;
    } finally {
      loading.value = false;
    }
  };

  const fetchMyKnowledge = async (filters?: KnowledgeManagementFilters) => {
    loading.value = true;
    try {
      // 模拟API调用
      await new Promise(resolve => setTimeout(resolve, 400));
      
      // 模拟当前用户的知识
      const mockMyKnowledge: MyKnowledgeItem[] = mockKnowledgeAssets.slice(0, 3).map(asset => ({
        ...asset,
        reviewStatus: 'approved' as KnowledgeReviewStatus,
        qualityScore: 4.5 + Math.random() * 0.5,
        isEditable: true,
        canDelete: asset.status === 'draft'
      }));
      
      myKnowledge.value = mockMyKnowledge;
      return mockMyKnowledge;
    } catch (err) {
      error.value = '获取我的知识失败';
      throw err;
    } finally {
      loading.value = false;
    }
  };

  const fetchMyCollections = async () => {
    loading.value = true;
    try {
      // 模拟API调用
      await new Promise(resolve => setTimeout(resolve, 300));
      
      const mockCollections: MyCollectionItem[] = mockKnowledgeAssets.slice(0, 4).map(asset => ({
        id: `collection-${asset.id}`,
        asset,
        collectedAt: '2024-04-01T10:00:00Z',
        tags: ['个人学习'],
        notes: `收藏了这篇关于${asset.title}的文章`,
        isPrivate: false,
        folder: 'folder1'
      }));
      
      myCollections.value = mockCollections;
      return mockCollections;
    } catch (err) {
      error.value = '获取我的收藏失败';
      throw err;
    } finally {
      loading.value = false;
    }
  };

  const toggleKnowledgeCollection = async (assetId: string, data?: {
    folderId?: string;
    tags?: string[];
    notes?: string;
    isPrivate?: boolean;
  }) => {
    try {
      // 模拟API调用
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // 更新本地数据
      const asset = assets.value.find(item => item.id === assetId);
      if (asset) {
        // 简单的收藏状态切换
        asset.collectCount += 1;
      }
      
      return { collectCount: asset?.collectCount || 0 };
    } catch (err) {
      error.value = '收藏操作失败';
      throw err;
    }
  };

  const toggleKnowledgeLike = async (assetId: string) => {
    try {
      // 模拟API调用
      await new Promise(resolve => setTimeout(resolve, 200));
      
      // 更新本地数据
      const asset = assets.value.find(item => item.id === assetId);
      if (asset) {
        asset.likeCount += 1;
      }
      
      return { likeCount: asset?.likeCount || 0 };
    } catch (err) {
      error.value = '点赞操作失败';
      throw err;
    }
  };

  // 通知方法
  const fetchNotifications = async () => {
    loading.value = true;
    try {
      // 模拟API调用
      await new Promise(resolve => setTimeout(resolve, 200));
      
      const mockNotifications: KnowledgeNotification[] = [
        {
          id: 'notif1',
          type: 'new_comment',
          title: '新评论',
          message: '您的知识《Vue 3 Composition API 最佳实践指南》收到了新评论',
          assetId: '1',
          assetTitle: 'Vue 3 Composition API 最佳实践指南',
          triggeredBy: {
            userId: 'user7',
            userName: '刘九',
            userAvatar: 'https://cube.elemecdn.com/0/88/03b0d39583f48206768a7534e55bcpng.png'
          },
          isRead: false,
          createdAt: '2024-04-15T16:30:00Z'
        },
        {
          id: 'notif2',
          type: 'asset_liked',
          title: '收到点赞',
          message: '您的知识《微服务架构设计与实践》被点赞了',
          assetId: '2',
          assetTitle: '微服务架构设计与实践',
          triggeredBy: {
            userId: 'user8',
            userName: '陈十'
          },
          isRead: false,
          createdAt: '2024-04-15T15:20:00Z'
        }
      ];
      
      notifications.value = mockNotifications;
      unreadNotificationCount.value = mockNotifications.filter(n => !n.isRead).length;
      
      return mockNotifications;
    } catch (err) {
      error.value = '获取通知失败';
      throw err;
    } finally {
      loading.value = false;
    }
  };

  const markNotificationAsRead = async (id: string) => {
    try {
      // 模拟API调用
      await new Promise(resolve => setTimeout(resolve, 200));
      
      const notification = notifications.value.find(item => item.id === id);
      if (notification && !notification.isRead) {
        notification.isRead = true;
        unreadNotificationCount.value -= 1;
      }
    } catch (err) {
      error.value = '标记通知失败';
      throw err;
    }
  };

  // 工具方法
  const clearSearch = () => {
    searchQuery.value = '';
    searchFilters.value = {};
    searchResults.value = [];
  };

  const clearError = () => {
    error.value = null;
  };

  const toggleAssetSelection = (assetId: string) => {
    const index = selectedAssets.value.indexOf(assetId);
    if (index > -1) {
      selectedAssets.value.splice(index, 1);
    } else {
      selectedAssets.value.push(assetId);
    }
  };

  const selectAllAssets = (assetIds: string[]) => {
    selectedAssets.value = [...assetIds];
  };

  const clearAssetSelection = () => {
    selectedAssets.value = [];
  };

  return {
    // ========== 基础状态 ==========
    assets,
    currentAsset,
    searchResults,
    filteredAssets,
    loading,
    error,
    searchQuery,
    searchFilters,
    searchParams,
    filterOptions,
    
    // ========== 第三阶段状态 ==========
    myKnowledge,
    pendingReviewAssets,
    managementFilters,
    selectedAssets,
    evaluations,
    currentEvaluations,
    qualityAssessment,
    personalStats,
    myCollections,
    collectionFolders,
    myEvaluations,
    notifications,
    unreadNotificationCount,
    
    // ========== 计算属性 ==========
    popularAssets,
    latestAssets,
    recommendedAssets,
    myKnowledgeStats,
    collectionStats,
    
    // ========== 基础方法 ==========
    fetchAssets,
    fetchAssetDetail,
    searchAssets,
    clearSearch,
    clearError,
    
    // ========== 第三阶段方法 ==========
    // 知识管理
    createKnowledge,
    updateKnowledge,
    deleteKnowledge,
    publishKnowledge,
    batchOperateKnowledge,
    toggleAssetSelection,
    selectAllAssets,
    clearAssetSelection,
    
    // 评价反馈
    fetchKnowledgeEvaluations,
    createEvaluation,
    toggleEvaluationLike,
    
    // 个人中心
    fetchPersonalStats,
    fetchMyKnowledge,
    fetchMyCollections,
    toggleKnowledgeCollection,
    toggleKnowledgeLike,
    
    // 通知
    fetchNotifications,
    markNotificationAsRead
  };
}); 