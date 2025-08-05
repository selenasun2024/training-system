import { ref, computed, watch } from 'vue';
import { ElMessage } from 'element-plus';
import { useKnowledgeStore } from '@/stores/knowledge';
import type {
  KnowledgeAsset,
  KnowledgeSearchParams,
  KnowledgeType,
  KnowledgeAssetListParams
} from '@/types/knowledge';

/**
 * 知识列表管理
 */
export function useKnowledgeList() {
  const knowledgeStore = useKnowledgeStore();
  
  const loading = ref(false);
  const loadingMore = ref(false);
  const currentPage = ref(1);
  const pageSize = ref(20);
  
  // 计算属性
  const assetList = computed(() => knowledgeStore.assetList);
  const totalCount = computed(() => knowledgeStore.totalAssets);
  const hasMore = computed(() => knowledgeStore.hasMore);
  
  // 加载知识列表
  const loadAssetList = async (params: KnowledgeAssetListParams = {}) => {
    try {
      loading.value = true;
      const requestParams = {
        page: currentPage.value,
        pageSize: pageSize.value,
        ...params
      };
      
      await knowledgeStore.fetchAssetList(requestParams);
      return true;
    } catch (error: any) {
      ElMessage.error(error.message || '加载失败');
      return false;
    } finally {
      loading.value = false;
    }
  };
  
  // 加载更多
  const loadMore = async () => {
    if (!hasMore.value || loadingMore.value) return;
    
    try {
      loadingMore.value = true;
      currentPage.value += 1;
      await loadAssetList();
    } catch (error) {
      currentPage.value -= 1; // 回滚页码
      throw error;
    } finally {
      loadingMore.value = false;
    }
  };
  
  // 刷新列表
  const refresh = async (params?: KnowledgeAssetListParams) => {
    currentPage.value = 1;
    return await loadAssetList(params);
  };
  
  // 重置状态
  const reset = () => {
    currentPage.value = 1;
    loading.value = false;
    loadingMore.value = false;
  };
  
  return {
    loading: computed(() => loading.value),
    loadingMore: computed(() => loadingMore.value),
    assetList,
    totalCount,
    hasMore,
    currentPage: computed(() => currentPage.value),
    pageSize: computed(() => pageSize.value),
    loadAssetList,
    loadMore,
    refresh,
    reset
  };
}

/**
 * 知识搜索管理
 */
export function useKnowledgeSearch() {
  const knowledgeStore = useKnowledgeStore();
  
  const searching = ref(false);
  const searchHistory = ref<string[]>([]);
  const searchSuggestions = ref<string[]>([]);
  
  // 计算属性
  const searchResult = computed(() => knowledgeStore.searchResult);
  const hasSearched = computed(() => knowledgeStore.hasSearchResult);
  
  // 搜索知识
  const search = async (params: KnowledgeSearchParams) => {
    try {
      searching.value = true;
      
      // 添加到搜索历史
      if (params.query && !searchHistory.value.includes(params.query)) {
        searchHistory.value.unshift(params.query);
        if (searchHistory.value.length > 10) {
          searchHistory.value = searchHistory.value.slice(0, 10);
        }
      }
      
      await knowledgeStore.searchAssets(params);
      return true;
    } catch (error: any) {
      ElMessage.error(error.message || '搜索失败');
      return false;
    } finally {
      searching.value = false;
    }
  };
  
  // 获取搜索建议
  const getSearchSuggestions = async (query: string) => {
    if (!query.trim()) {
      searchSuggestions.value = [];
      return;
    }
    
    try {
      // TODO: 实现搜索建议API
      // const suggestions = await knowledgeApi.getSearchSuggestions(query);
      // searchSuggestions.value = suggestions;
      
      // 临时使用历史搜索作为建议
      searchSuggestions.value = searchHistory.value.filter(item =>
        item.toLowerCase().includes(query.toLowerCase())
      );
    } catch (error) {
      console.error('获取搜索建议失败:', error);
    }
  };
  
  // 清空搜索结果
  const clearSearch = () => {
    knowledgeStore.clearSearchResult();
  };
  
  // 清空搜索历史
  const clearSearchHistory = () => {
    searchHistory.value = [];
  };
  
  return {
    searching: computed(() => searching.value),
    searchResult,
    hasSearched,
    searchHistory: computed(() => searchHistory.value),
    searchSuggestions: computed(() => searchSuggestions.value),
    search,
    getSearchSuggestions,
    clearSearch,
    clearSearchHistory
  };
}

/**
 * 知识交互管理（点赞、收藏、分享等）
 */
export function useKnowledgeInteraction() {
  const knowledgeStore = useKnowledgeStore();
  
  const actionLoading = ref<Record<string, boolean>>({});
  
  // 设置操作加载状态
  const setActionLoading = (assetId: string, action: string, loading: boolean) => {
    const key = `${assetId}-${action}`;
    actionLoading.value[key] = loading;
  };
  
  // 获取操作加载状态
  const isActionLoading = (assetId: string, action: string) => {
    const key = `${assetId}-${action}`;
    return actionLoading.value[key] || false;
  };
  
  // 点赞操作
  const toggleLike = async (asset: KnowledgeAsset, isLiked: boolean) => {
    if (isActionLoading(asset.id, 'like')) return false;
    
    try {
      setActionLoading(asset.id, 'like', true);
      
      if (isLiked) {
        await knowledgeStore.unlikeAsset(asset.id);
        ElMessage.success('已取消点赞');
      } else {
        await knowledgeStore.likeAsset(asset.id);
        ElMessage.success('点赞成功');
      }
      
      return !isLiked;
    } catch (error: any) {
      ElMessage.error(error.message || '操作失败');
      return isLiked;
    } finally {
      setActionLoading(asset.id, 'like', false);
    }
  };
  
  // 收藏操作
  const toggleCollect = async (asset: KnowledgeAsset, isCollected: boolean) => {
    if (isActionLoading(asset.id, 'collect')) return false;
    
    try {
      setActionLoading(asset.id, 'collect', true);
      
      if (isCollected) {
        await knowledgeStore.uncollectAsset(asset.id);
        ElMessage.success('已取消收藏');
      } else {
        await knowledgeStore.collectAsset(asset.id);
        ElMessage.success('收藏成功');
      }
      
      return !isCollected;
    } catch (error: any) {
      ElMessage.error(error.message || '操作失败');
      return isCollected;
    } finally {
      setActionLoading(asset.id, 'collect', false);
    }
  };
  
  // 分享操作
  const shareAsset = async (asset: KnowledgeAsset, platform: string, message?: string) => {
    if (isActionLoading(asset.id, 'share')) return false;
    
    try {
      setActionLoading(asset.id, 'share', true);
      
      await knowledgeStore.shareAsset(asset.id, { platform, message });
      ElMessage.success('分享成功');
      
      return true;
    } catch (error: any) {
      ElMessage.error(error.message || '分享失败');
      return false;
    } finally {
      setActionLoading(asset.id, 'share', false);
    }
  };
  
  return {
    isActionLoading,
    toggleLike,
    toggleCollect,
    shareAsset
  };
}

/**
 * 知识筛选管理
 */
export function useKnowledgeFilter() {
  const knowledgeStore = useKnowledgeStore();
  
  const filterOptions = computed(() => knowledgeStore.filterOptions);
  const categories = computed(() => knowledgeStore.categories);
  const tags = computed(() => knowledgeStore.tags);
  
  // 加载筛选选项
  const loadFilterOptions = async () => {
    try {
      await Promise.all([
        knowledgeStore.fetchFilterOptions(),
        knowledgeStore.fetchCategories(),
        knowledgeStore.fetchTags()
      ]);
    } catch (error) {
      console.error('加载筛选选项失败:', error);
    }
  };
  
  // 获取类型选项
  const getTypeOptions = () => {
    const typeMap: Record<KnowledgeType, string> = {
      article: '文章',
      video: '视频',
      document: '文档',
      presentation: '演示',
      case_study: '案例',
      best_practice: '实践'
    };
    
    return Object.entries(typeMap).map(([value, label]) => ({
      value: value as KnowledgeType,
      label,
      count: filterOptions.value?.types.find(t => t.value === value)?.count || 0
    }));
  };
  
  // 获取分类选项
  const getCategoryOptions = () => {
    return categories.value.map(category => ({
      value: category.id,
      label: category.name,
      count: category.knowledgeCount || 0
    }));
  };
  
  // 获取标签选项
  const getTagOptions = () => {
    return tags.value.map(tag => ({
      value: tag.id,
      label: tag.name,
      count: tag.usageCount || 0
    }));
  };
  
  return {
    filterOptions,
    categories,
    tags,
    loadFilterOptions,
    getTypeOptions,
    getCategoryOptions,
    getTagOptions
  };
}

/**
 * 知识详情管理
 */
export function useKnowledgeDetail(assetId: string) {
  const knowledgeStore = useKnowledgeStore();
  
  const loading = ref(false);
  const relatedAssets = ref<KnowledgeAsset[]>([]);
  const userActions = ref({
    liked: false,
    collected: false
  });
  
  // 计算属性
  const asset = computed(() => knowledgeStore.currentAsset);
  
  // 加载知识详情
  const loadDetail = async () => {
    try {
      loading.value = true;
      await knowledgeStore.fetchAssetDetail(assetId);
      
      // 加载相关知识
      await loadRelatedAssets();
      
      // TODO: 加载用户操作状态
      // await loadUserActions();
      
    } catch (error: any) {
      ElMessage.error(error.message || '加载失败');
      throw error;
    } finally {
      loading.value = false;
    }
  };
  
  // 加载相关知识
  const loadRelatedAssets = async () => {
    try {
      const related = await knowledgeStore.getRelatedAssets(assetId, { limit: 5 });
      relatedAssets.value = related;
    } catch (error) {
      console.error('加载相关知识失败:', error);
    }
  };
  
  // 加载用户操作状态
  const loadUserActions = async (userId: string) => {
    try {
      const [likedStatus, collectedStatus] = await Promise.all([
        knowledgeStore.checkUserLiked(assetId, userId),
        knowledgeStore.checkUserCollected(assetId, userId)
      ]);
      
      userActions.value = {
        liked: likedStatus.liked,
        collected: collectedStatus.collected
      };
    } catch (error) {
      console.error('加载用户操作状态失败:', error);
    }
  };
  
  // 清理状态
  const cleanup = () => {
    knowledgeStore.clearCurrentAsset();
    relatedAssets.value = [];
    userActions.value = {
      liked: false,
      collected: false
    };
  };
  
  return {
    loading: computed(() => loading.value),
    asset,
    relatedAssets: computed(() => relatedAssets.value),
    userActions: computed(() => userActions.value),
    loadDetail,
    loadRelatedAssets,
    loadUserActions,
    cleanup
  };
}

/**
 * 知识统计管理
 */
export function useKnowledgeStats() {
  const knowledgeStore = useKnowledgeStore();
  
  const stats = ref({
    totalAssets: 0,
    totalViews: 0,
    totalLikes: 0,
    totalShares: 0,
    popularAssets: [] as KnowledgeAsset[],
    latestAssets: [] as KnowledgeAsset[],
    topCategories: [] as any[],
    topTags: [] as any[]
  });
  
  // 加载统计数据
  const loadStats = async () => {
    try {
      const [
        statistics,
        popular,
        latest
      ] = await Promise.all([
        knowledgeStore.getStatistics(),
        knowledgeStore.fetchPopularAssets({ limit: 10 }),
        knowledgeStore.fetchLatestAssets({ limit: 10 })
      ]);
      
      stats.value = {
        ...statistics,
        popularAssets: popular,
        latestAssets: latest
      };
      
    } catch (error) {
      console.error('加载统计数据失败:', error);
    }
  };
  
  return {
    stats: computed(() => stats.value),
    loadStats
  };
}

/**
 * 知识工具函数
 */
export function useKnowledgeUtils() {
  // 格式化数量
  const formatCount = (count: number) => {
    if (count < 1000) return count.toString();
    if (count < 10000) return (count / 1000).toFixed(1) + 'k';
    return (count / 10000).toFixed(1) + 'w';
  };
  
  // 格式化时间
  const formatTime = (time: string | Date, format: 'relative' | 'absolute' = 'relative') => {
    const date = typeof time === 'string' ? new Date(time) : time;
    
    if (format === 'absolute') {
      return date.toLocaleDateString();
    }
    
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    
    const minute = 60 * 1000;
    const hour = 60 * minute;
    const day = 24 * hour;
    const month = 30 * day;
    
    if (diff < hour) {
      return `${Math.floor(diff / minute)}分钟前`;
    } else if (diff < day) {
      return `${Math.floor(diff / hour)}小时前`;
    } else if (diff < month) {
      return `${Math.floor(diff / day)}天前`;
    } else {
      return date.toLocaleDateString();
    }
  };
  
  // 格式化文件大小
  const formatFileSize = (size: number) => {
    if (size < 1024) return size + 'B';
    if (size < 1024 * 1024) return (size / 1024).toFixed(1) + 'KB';
    return (size / (1024 * 1024)).toFixed(1) + 'MB';
  };
  
  // 获取知识类型标签
  const getTypeLabel = (type: KnowledgeType) => {
    const labelMap: Record<KnowledgeType, string> = {
      article: '文章',
      video: '视频',
      document: '文档',
      presentation: '演示',
      case_study: '案例',
      best_practice: '实践'
    };
    return labelMap[type] || '未知';
  };
  
  // 获取知识类型颜色
  const getTypeColor = (type: KnowledgeType) => {
    const colorMap: Record<KnowledgeType, string> = {
      article: '#409eff',
      video: '#67c23a',
      document: '#909399',
      presentation: '#e6a23c',
      case_study: '#f56c6c',
      best_practice: '#9c27b0'
    };
    return colorMap[type] || '#909399';
  };
  
  // 生成分享链接
  const generateShareUrl = (asset: KnowledgeAsset) => {
    return `${window.location.origin}/knowledge/detail/${asset.id}`;
  };
  
  // 复制到剪贴板
  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      ElMessage.success('已复制到剪贴板');
      return true;
    } catch (error) {
      ElMessage.error('复制失败');
      return false;
    }
  };
  
  return {
    formatCount,
    formatTime,
    formatFileSize,
    getTypeLabel,
    getTypeColor,
    generateShareUrl,
    copyToClipboard
  };
} 