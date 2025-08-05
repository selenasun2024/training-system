<template>
  <div class="knowledge-search-page">
    <!-- 搜索头部 -->
    <div class="search-header">
      <div class="search-container">
        <div class="search-input-wrapper">
          <el-input
            v-model="searchQuery"
            placeholder="搜索知识、标签、作者..."
            size="large"
            clearable
            @input="handleSearchInput"
            @clear="handleSearchClear"
            @keyup.enter="handleSearch"
          >
            <template #prefix>
              <el-icon><Search /></el-icon>
            </template>
            <template #suffix>
              <el-button 
                type="primary" 
                @click="handleSearch"
                :loading="searchLoading"
              >
                搜索
              </el-button>
            </template>
          </el-input>
        </div>
        
        <div class="search-info">
          <span v-if="searchResults.total > 0" class="results-count">
            找到 {{ searchResults.total }} 条相关知识
          </span>
          <span v-else-if="hasSearched" class="no-results">
            未找到相关知识
          </span>
        </div>
      </div>
    </div>

    <!-- 搜索内容区域 -->
    <div class="search-content">
      <div class="content-container">
        <!-- 筛选侧边栏 -->
        <div class="search-filters">
          <div class="filter-section">
            <h3 class="filter-title">筛选条件</h3>
            
            <!-- 知识类型筛选 -->
            <div class="filter-group">
              <h4 class="filter-label">知识类型</h4>
              <el-checkbox-group v-model="filters.types" @change="handleFilterChange">
                <el-checkbox
                  v-for="type in typeOptions"
                  :key="type.value"
                  :label="type.value"
                  :disabled="type.count === 0"
                >
                  <div class="filter-option">
                    <el-icon class="option-icon">
                      <component :is="type.icon" />
                    </el-icon>
                    <span class="option-label">{{ type.label }}</span>
                    <span class="option-count">({{ type.count }})</span>
                  </div>
                </el-checkbox>
              </el-checkbox-group>
            </div>

            <!-- 分类筛选 -->
            <div class="filter-group">
              <h4 class="filter-label">知识分类</h4>
              <el-checkbox-group v-model="filters.categories" @change="handleFilterChange">
                <el-checkbox
                  v-for="category in categoryOptions"
                  :key="category.value"
                  :label="category.value"
                  :disabled="category.count === 0"
                >
                  <div class="filter-option">
                    <span class="option-label">{{ category.label }}</span>
                    <span class="option-count">({{ category.count }})</span>
                  </div>
                </el-checkbox>
              </el-checkbox-group>
            </div>

            <!-- 标签筛选 -->
            <div class="filter-group">
              <h4 class="filter-label">热门标签</h4>
              <div class="tag-filters">
                <el-tag
                  v-for="tag in popularTags"
                  :key="tag.value"
                  :type="filters.tags.includes(tag.value) ? 'primary' : 'info'"
                  :effect="filters.tags.includes(tag.value) ? 'dark' : 'plain'"
                  size="small"
                  class="tag-filter"
                  @click="toggleTagFilter(tag.value)"
                >
                  {{ tag.label }} ({{ tag.count }})
                </el-tag>
              </div>
            </div>

            <!-- 作者筛选 -->
            <div class="filter-group">
              <h4 class="filter-label">作者</h4>
              <el-checkbox-group v-model="filters.authors" @change="handleFilterChange">
                <el-checkbox
                  v-for="author in authorOptions"
                  :key="author.value"
                  :label="author.value"
                  :disabled="author.count === 0"
                >
                  <div class="filter-option">
                    <span class="option-label">{{ author.label }}</span>
                    <span class="option-count">({{ author.count }})</span>
                  </div>
                </el-checkbox>
              </el-checkbox-group>
            </div>

            <!-- 时间筛选 -->
            <div class="filter-group">
              <h4 class="filter-label">发布时间</h4>
              <el-radio-group v-model="filters.timeRange" @change="handleFilterChange">
                <el-radio label="all">全部</el-radio>
                <el-radio label="today">今天</el-radio>
                <el-radio label="week">近一周</el-radio>
                <el-radio label="month">近一个月</el-radio>
                <el-radio label="quarter">近三个月</el-radio>
                <el-radio label="year">近一年</el-radio>
              </el-radio-group>
            </div>

            <!-- 清除筛选 -->
            <div class="filter-actions">
              <el-button 
                type="danger" 
                text
                @click="clearFilters"
                :disabled="!hasActiveFilters"
              >
                清除筛选
              </el-button>
            </div>
          </div>
        </div>

        <!-- 搜索结果区域 -->
        <div class="search-results">
          <!-- 结果工具栏 -->
          <div class="results-toolbar">
            <div class="toolbar-left">
              <span class="results-info">
                {{ searchResults.total }} 条结果
              </span>
              <div class="active-filters" v-if="hasActiveFilters">
                <el-tag
                  v-for="filter in activeFilterTags"
                  :key="filter.key"
                  closable
                  size="small"
                  @close="removeFilter(filter.key, filter.value)"
                >
                  {{ filter.label }}
                </el-tag>
              </div>
            </div>
            
            <div class="toolbar-right">
              <el-select
                v-model="sortBy"
                placeholder="排序方式"
                style="width: 150px"
                @change="handleSortChange"
              >
                <el-option label="相关度" value="relevance" />
                <el-option label="最新发布" value="publishedAt" />
                <el-option label="最多浏览" value="viewCount" />
                <el-option label="最多点赞" value="likeCount" />
                <el-option label="评分最高" value="rating" />
              </el-select>
              
              <el-radio-group v-model="viewMode" size="small">
                <el-radio-button label="list">
                  <el-icon><List /></el-icon>
                </el-radio-button>
                <el-radio-button label="grid">
                  <el-icon><Grid /></el-icon>
                </el-radio-button>
              </el-radio-group>
            </div>
          </div>

          <!-- 搜索结果列表 -->
          <div v-if="searchLoading" class="loading-container">
            <el-skeleton :rows="5" animated />
          </div>
          
          <div v-else-if="searchResults.items.length === 0 && hasSearched" class="no-results-container">
            <div class="no-results-content">
              <el-icon class="no-results-icon"><DocumentRemove /></el-icon>
              <h3>未找到相关知识</h3>
              <p>尝试调整搜索关键词或筛选条件</p>
              <div class="search-suggestions">
                <h4>搜索建议：</h4>
                <ul>
                  <li>检查搜索词是否正确</li>
                  <li>尝试使用更通用的关键词</li>
                  <li>减少筛选条件</li>
                  <li>尝试搜索相关标签</li>
                </ul>
              </div>
            </div>
          </div>

          <div v-else class="results-list" :class="{ 'grid-view': viewMode === 'grid' }">
            <div
              v-for="item in searchResults.items"
              :key="item.id"
              class="result-item"
              @click="goToDetail(item.id)"
            >
              <!-- 列表视图 -->
              <template v-if="viewMode === 'list'">
                <div class="item-cover">
                  <img 
                    v-if="item.coverImage"
                    :src="item.coverImage"
                    :alt="item.title"
                  />
                  <div v-else class="cover-placeholder">
                    <el-icon><Document /></el-icon>
                  </div>
                </div>
                
                <div class="item-content">
                  <div class="item-header">
                    <h3 class="item-title" v-html="highlightText(item.title)"></h3>
                    <div class="item-meta">
                      <el-tag :type="getTypeTagType(item.type)" size="small">
                        {{ getTypeLabel(item.type) }}
                      </el-tag>
                      <span class="meta-separator">·</span>
                      <span class="meta-category">{{ item.category }}</span>
                      <span class="meta-separator">·</span>
                      <span class="meta-author">{{ item.author.name }}</span>
                      <span class="meta-separator">·</span>
                      <span class="meta-date">{{ formatDate(item.publishedAt) }}</span>
                    </div>
                  </div>
                  
                  <p class="item-summary" v-html="highlightText(item.summary)"></p>
                  
                  <div class="item-tags">
                    <el-tag
                      v-for="tag in item.tags.slice(0, 3)"
                      :key="tag"
                      size="small"
                      type="info"
                      effect="plain"
                    >
                      {{ tag }}
                    </el-tag>
                    <span v-if="item.tags.length > 3" class="more-tags">
                      +{{ item.tags.length - 3 }}
                    </span>
                  </div>
                  
                  <div class="item-stats">
                    <span class="stat-item">
                      <el-icon><View /></el-icon>
                      {{ formatNumber(item.viewCount) }}
                    </span>
                    <span class="stat-item">
                      <el-icon><Star /></el-icon>
                      {{ item.likeCount }}
                    </span>
                    <span class="stat-item">
                      <el-icon><ChatDotRound /></el-icon>
                      {{ item.commentCount }}
                    </span>
                    <span class="stat-item">
                      <el-icon><Collection /></el-icon>
                      {{ item.collectCount }}
                    </span>
                  </div>
                </div>
              </template>

              <!-- 网格视图 -->
              <template v-else>
                <div class="grid-item-cover">
                  <img 
                    v-if="item.coverImage"
                    :src="item.coverImage"
                    :alt="item.title"
                  />
                  <div v-else class="cover-placeholder">
                    <el-icon><Document /></el-icon>
                  </div>
                </div>
                
                <div class="grid-item-content">
                  <h3 class="grid-item-title" v-html="highlightText(item.title)"></h3>
                  <p class="grid-item-summary" v-html="highlightText(item.summary)"></p>
                  
                  <div class="grid-item-meta">
                    <span class="meta-author">{{ item.author.name }}</span>
                    <span class="meta-date">{{ formatDate(item.publishedAt) }}</span>
                  </div>
                  
                  <div class="grid-item-stats">
                    <span class="stat-item">
                      <el-icon><View /></el-icon>
                      {{ formatNumber(item.viewCount) }}
                    </span>
                    <span class="stat-item">
                      <el-icon><Star /></el-icon>
                      {{ item.likeCount }}
                    </span>
                  </div>
                </div>
              </template>
            </div>
          </div>

          <!-- 分页 -->
          <div v-if="searchResults.totalPages > 1" class="pagination-container">
            <el-pagination
              v-model:current-page="currentPage"
              v-model:page-size="pageSize"
              :page-sizes="[10, 20, 50, 100]"
              :total="searchResults.total"
              layout="total, sizes, prev, pager, next, jumper"
              @size-change="handleSizeChange"
              @current-change="handlePageChange"
            />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import {
  Search,
  Document,
  List,
  Grid,
  View,
  Star,
  ChatDotRound,
  Collection,
  DocumentRemove,
  VideoPlay,
  Folder,
  Presentation,
  DataAnalysis,
  TrendCharts,
  Globe,
  Lock,
  OfficeBuilding,
  User
} from '@element-plus/icons-vue';
import { useKnowledgeStore } from '@/stores/knowledge';
import type { 
  KnowledgeAsset, 
  KnowledgeType, 
  KnowledgeSearchParams,
  KnowledgeSearchResult 
} from '@/types/knowledge';

const route = useRoute();
const router = useRouter();
const knowledgeStore = useKnowledgeStore();

// 搜索状态
const searchQuery = ref('');
const searchLoading = ref(false);
const hasSearched = ref(false);
const searchResults = ref<KnowledgeSearchResult>({
  items: [],
  total: 0,
  page: 1,
  pageSize: 20,
  totalPages: 0,
  hasNext: false,
  hasPrev: false
});

// 筛选条件
const filters = reactive({
  types: [] as KnowledgeType[],
  categories: [] as string[],
  tags: [] as string[],
  authors: [] as string[],
  timeRange: 'all' as string
});

// 排序和视图
const sortBy = ref('relevance');
const viewMode = ref<'list' | 'grid'>('list');
const currentPage = ref(1);
const pageSize = ref(20);

// 筛选选项
const typeOptions = ref([
  { value: 'article', label: '文章', icon: 'Document', count: 0 },
  { value: 'video', label: '视频', icon: 'VideoPlay', count: 0 },
  { value: 'document', label: '文档', icon: 'Folder', count: 0 },
  { value: 'presentation', label: '演示文稿', icon: 'Presentation', count: 0 },
  { value: 'case_study', label: '案例研究', icon: 'DataAnalysis', count: 0 },
  { value: 'best_practice', label: '最佳实践', icon: 'TrendCharts', count: 0 }
]);

const categoryOptions = ref([
  { value: '前端开发', label: '前端开发', count: 0 },
  { value: '后端开发', label: '后端开发', count: 0 },
  { value: '架构设计', label: '架构设计', count: 0 },
  { value: '数据库', label: '数据库', count: 0 },
  { value: '运维部署', label: '运维部署', count: 0 },
  { value: '项目管理', label: '项目管理', count: 0 }
]);

const authorOptions = ref([
  { value: 'user1', label: '张三', count: 0 },
  { value: 'user2', label: '李四', count: 0 },
  { value: 'user3', label: '王五', count: 0 },
  { value: 'user4', label: '赵六', count: 0 }
]);

const popularTags = ref([
  { value: 'Vue3', label: 'Vue3', count: 0 },
  { value: 'React', label: 'React', count: 0 },
  { value: '微服务', label: '微服务', count: 0 },
  { value: 'Docker', label: 'Docker', count: 0 },
  { value: 'Kubernetes', label: 'Kubernetes', count: 0 },
  { value: '性能优化', label: '性能优化', count: 0 }
]);

// 计算属性
const hasActiveFilters = computed(() => {
  return filters.types.length > 0 ||
         filters.categories.length > 0 ||
         filters.tags.length > 0 ||
         filters.authors.length > 0 ||
         filters.timeRange !== 'all';
});

const activeFilterTags = computed(() => {
  const tags = [];
  
  filters.types.forEach(type => {
    const option = typeOptions.value.find(opt => opt.value === type);
    if (option) {
      tags.push({ key: 'types', value: type, label: `类型: ${option.label}` });
    }
  });
  
  filters.categories.forEach(category => {
    tags.push({ key: 'categories', value: category, label: `分类: ${category}` });
  });
  
  filters.tags.forEach(tag => {
    tags.push({ key: 'tags', value: tag, label: `标签: ${tag}` });
  });
  
  filters.authors.forEach(author => {
    const option = authorOptions.value.find(opt => opt.value === author);
    if (option) {
      tags.push({ key: 'authors', value: author, label: `作者: ${option.label}` });
    }
  });
  
  if (filters.timeRange !== 'all') {
    const timeLabels = {
      today: '今天',
      week: '近一周',
      month: '近一个月',
      quarter: '近三个月',
      year: '近一年'
    };
    tags.push({ 
      key: 'timeRange', 
      value: filters.timeRange, 
      label: `时间: ${timeLabels[filters.timeRange] || filters.timeRange}` 
    });
  }
  
  return tags;
});

// 方法
const handleSearch = async () => {
  if (!searchQuery.value.trim()) {
    ElMessage.warning('请输入搜索关键词');
    return;
  }
  
  searchLoading.value = true;
  hasSearched.value = true;
  
  try {
    const params: KnowledgeSearchParams = {
      query: searchQuery.value,
      type: filters.types.length > 0 ? filters.types : undefined,
      category: filters.categories.length > 0 ? filters.categories : undefined,
      tags: filters.tags.length > 0 ? filters.tags : undefined,
      author: filters.authors.length > 0 ? filters.authors : undefined,
      sortBy: sortBy.value === 'relevance' ? 'createdAt' : sortBy.value as any,
      sortOrder: 'desc',
      page: currentPage.value,
      pageSize: pageSize.value
    };
    
    // 添加时间范围筛选
    if (filters.timeRange !== 'all') {
      const now = new Date();
      const ranges = {
        today: { days: 1 },
        week: { days: 7 },
        month: { days: 30 },
        quarter: { days: 90 },
        year: { days: 365 }
      };
      
      const range = ranges[filters.timeRange];
      if (range) {
        const startDate = new Date(now.getTime() - range.days * 24 * 60 * 60 * 1000);
        params.dateRange = {
          start: startDate.toISOString(),
          end: now.toISOString()
        };
      }
    }
    
    const result = await knowledgeStore.searchAssets(searchQuery.value, params);
    searchResults.value = result;
    
    // 更新筛选选项的计数
    updateFilterCounts();
    
  } catch (error) {
    console.error('搜索失败:', error);
    ElMessage.error('搜索失败，请重试');
  } finally {
    searchLoading.value = false;
  }
};

const handleSearchInput = () => {
  // 可以添加防抖逻辑
};

const handleSearchClear = () => {
  searchQuery.value = '';
  searchResults.value = {
    items: [],
    total: 0,
    page: 1,
    pageSize: 20,
    totalPages: 0,
    hasNext: false,
    hasPrev: false
  };
  hasSearched.value = false;
};

const handleFilterChange = () => {
  if (hasSearched.value) {
    currentPage.value = 1;
    handleSearch();
  }
};

const handleSortChange = () => {
  if (hasSearched.value) {
    handleSearch();
  }
};

const handlePageChange = (page: number) => {
  currentPage.value = page;
  handleSearch();
};

const handleSizeChange = (size: number) => {
  pageSize.value = size;
  currentPage.value = 1;
  handleSearch();
};

const toggleTagFilter = (tag: string) => {
  const index = filters.tags.indexOf(tag);
  if (index > -1) {
    filters.tags.splice(index, 1);
  } else {
    filters.tags.push(tag);
  }
  handleFilterChange();
};

const removeFilter = (key: string, value: string) => {
  if (key === 'timeRange') {
    filters.timeRange = 'all';
  } else {
    const filterArray = filters[key] as string[];
    const index = filterArray.indexOf(value);
    if (index > -1) {
      filterArray.splice(index, 1);
    }
  }
  handleFilterChange();
};

const clearFilters = () => {
  filters.types = [];
  filters.categories = [];
  filters.tags = [];
  filters.authors = [];
  filters.timeRange = 'all';
  handleFilterChange();
};

const updateFilterCounts = () => {
  // 这里可以根据搜索结果更新筛选选项的计数
  // 实际项目中应该从后端获取
};

const goToDetail = (id: string) => {
  router.push({
    name: 'KnowledgeDetail',
    params: { id }
  });
};

const highlightText = (text: string) => {
  if (!searchQuery.value) return text;
  
  const regex = new RegExp(`(${searchQuery.value})`, 'gi');
  return text.replace(regex, '<mark>$1</mark>');
};

const getTypeLabel = (type: KnowledgeType) => {
  const option = typeOptions.value.find(opt => opt.value === type);
  return option ? option.label : type;
};

const getTypeTagType = (type: KnowledgeType) => {
  const typeMap = {
    article: '',
    video: 'success',
    document: 'info',
    presentation: 'warning',
    case_study: 'danger',
    best_practice: 'primary'
  };
  return typeMap[type] || '';
};

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - date.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays === 1) return '今天';
  if (diffDays <= 7) return `${diffDays}天前`;
  if (diffDays <= 30) return `${Math.ceil(diffDays / 7)}周前`;
  if (diffDays <= 365) return `${Math.ceil(diffDays / 30)}个月前`;
  return `${Math.ceil(diffDays / 365)}年前`;
};

const formatNumber = (num: number) => {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
  return num.toString();
};

// 生命周期
onMounted(() => {
  // 从路由参数获取搜索关键词
  const query = route.query.q as string;
  if (query) {
    searchQuery.value = query;
    handleSearch();
  }
});

// 监听路由变化
watch(() => route.query.q, (newQuery) => {
  if (newQuery && newQuery !== searchQuery.value) {
    searchQuery.value = newQuery as string;
    handleSearch();
  }
});
</script>

<style scoped lang="scss">
.knowledge-search-page {
  min-height: 100vh;
  background: #f5f7fa;
}

.search-header {
  background: #fff;
  border-bottom: 1px solid #e4e7ed;
  padding: 20px 0;
  
  .search-container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 0 24px;
  }
  
  .search-input-wrapper {
    margin-bottom: 12px;
    
    .el-input {
      :deep(.el-input__wrapper) {
        border-radius: 24px;
        padding: 0 20px;
      }
    }
  }
  
  .search-info {
    color: #606266;
    font-size: 14px;
    
    .results-count {
      color: #409eff;
      font-weight: 500;
    }
    
    .no-results {
      color: #909399;
    }
  }
}

.search-content {
  .content-container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 24px;
    display: flex;
    gap: 24px;
  }
}

.search-filters {
  width: 280px;
  flex-shrink: 0;
  
  .filter-section {
    background: #fff;
    border-radius: 8px;
    padding: 20px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  }
  
  .filter-title {
    margin: 0 0 20px 0;
    font-size: 16px;
    font-weight: 600;
    color: #303133;
  }
  
  .filter-group {
    margin-bottom: 24px;
    
    &:last-child {
      margin-bottom: 0;
    }
  }
  
  .filter-label {
    margin: 0 0 12px 0;
    font-size: 14px;
    font-weight: 500;
    color: #606266;
  }
  
  .filter-option {
    display: flex;
    align-items: center;
    gap: 8px;
    
    .option-icon {
      color: #909399;
    }
    
    .option-label {
      flex: 1;
    }
    
    .option-count {
      color: #909399;
      font-size: 12px;
    }
  }
  
  .tag-filters {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    
    .tag-filter {
      cursor: pointer;
      transition: all 0.2s;
      
      &:hover {
        transform: translateY(-1px);
      }
    }
  }
  
  .filter-actions {
    margin-top: 20px;
    padding-top: 20px;
    border-top: 1px solid #e4e7ed;
  }
}

.search-results {
  flex: 1;
  
  .results-toolbar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
    
    .toolbar-left {
      display: flex;
      align-items: center;
      gap: 16px;
      
      .results-info {
        color: #606266;
        font-size: 14px;
        font-weight: 500;
      }
      
      .active-filters {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
      }
    }
    
    .toolbar-right {
      display: flex;
      align-items: center;
      gap: 12px;
    }
  }
  
  .loading-container {
    background: #fff;
    border-radius: 8px;
    padding: 20px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  }
  
  .no-results-container {
    background: #fff;
    border-radius: 8px;
    padding: 60px 20px;
    text-align: center;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    
    .no-results-content {
      .no-results-icon {
        font-size: 64px;
        color: #c0c4cc;
        margin-bottom: 20px;
      }
      
      h3 {
        margin: 0 0 12px 0;
        color: #303133;
        font-size: 20px;
      }
      
      p {
        margin: 0 0 24px 0;
        color: #909399;
        font-size: 14px;
      }
      
      .search-suggestions {
        text-align: left;
        max-width: 400px;
        margin: 0 auto;
        
        h4 {
          margin: 0 0 12px 0;
          color: #606266;
          font-size: 14px;
        }
        
        ul {
          margin: 0;
          padding-left: 20px;
          color: #909399;
          font-size: 14px;
          
          li {
            margin-bottom: 8px;
          }
        }
      }
    }
  }
  
  .results-list {
    display: flex;
    flex-direction: column;
    gap: 16px;
    
    &.grid-view {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
      gap: 20px;
    }
    
    .result-item {
      background: #fff;
      border-radius: 8px;
      padding: 20px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
      cursor: pointer;
      transition: all 0.2s;
      
      &:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
      }
      
      // 列表视图样式
      &:not(.grid-view &) {
        display: flex;
        gap: 16px;
        
        .item-cover {
          width: 120px;
          height: 80px;
          flex-shrink: 0;
          border-radius: 6px;
          overflow: hidden;
          
          img {
            width: 100%;
            height: 100%;
            object-fit: cover;
          }
          
          .cover-placeholder {
            width: 100%;
            height: 100%;
            background: #f5f7fa;
            display: flex;
            align-items: center;
            justify-content: center;
            color: #c0c4cc;
            font-size: 24px;
          }
        }
        
        .item-content {
          flex: 1;
          
          .item-header {
            margin-bottom: 8px;
            
            .item-title {
              margin: 0 0 8px 0;
              font-size: 18px;
              font-weight: 600;
              color: #303133;
              line-height: 1.4;
              
              :deep(mark) {
                background: #fff3cd;
                color: #856404;
                padding: 2px 4px;
                border-radius: 2px;
              }
            }
            
            .item-meta {
              display: flex;
              align-items: center;
              gap: 8px;
              color: #909399;
              font-size: 12px;
              
              .meta-separator {
                color: #c0c4cc;
              }
            }
          }
          
          .item-summary {
            margin: 0 0 12px 0;
            color: #606266;
            font-size: 14px;
            line-height: 1.6;
            display: -webkit-box;
            -webkit-line-clamp: 2;
            -webkit-box-orient: vertical;
            overflow: hidden;
            
            :deep(mark) {
              background: #fff3cd;
              color: #856404;
              padding: 2px 4px;
              border-radius: 2px;
            }
          }
          
          .item-tags {
            margin-bottom: 12px;
            display: flex;
            align-items: center;
            gap: 8px;
            
            .more-tags {
              color: #909399;
              font-size: 12px;
            }
          }
          
          .item-stats {
            display: flex;
            align-items: center;
            gap: 16px;
            
            .stat-item {
              display: flex;
              align-items: center;
              gap: 4px;
              color: #909399;
              font-size: 12px;
              
              .el-icon {
                font-size: 14px;
              }
            }
          }
        }
      }
      
      // 网格视图样式
      .grid-view & {
        .grid-item-cover {
          width: 100%;
          height: 160px;
          margin-bottom: 16px;
          border-radius: 6px;
          overflow: hidden;
          
          img {
            width: 100%;
            height: 100%;
            object-fit: cover;
          }
          
          .cover-placeholder {
            width: 100%;
            height: 100%;
            background: #f5f7fa;
            display: flex;
            align-items: center;
            justify-content: center;
            color: #c0c4cc;
            font-size: 32px;
          }
        }
        
        .grid-item-content {
          .grid-item-title {
            margin: 0 0 8px 0;
            font-size: 16px;
            font-weight: 600;
            color: #303133;
            line-height: 1.4;
            display: -webkit-box;
            -webkit-line-clamp: 2;
            -webkit-box-orient: vertical;
            overflow: hidden;
            
            :deep(mark) {
              background: #fff3cd;
              color: #856404;
              padding: 2px 4px;
              border-radius: 2px;
            }
          }
          
          .grid-item-summary {
            margin: 0 0 12px 0;
            color: #606266;
            font-size: 14px;
            line-height: 1.6;
            display: -webkit-box;
            -webkit-line-clamp: 3;
            -webkit-box-orient: vertical;
            overflow: hidden;
            
            :deep(mark) {
              background: #fff3cd;
              color: #856404;
              padding: 2px 4px;
              border-radius: 2px;
            }
          }
          
          .grid-item-meta {
            margin-bottom: 8px;
            color: #909399;
            font-size: 12px;
            
            .meta-author {
              margin-right: 8px;
            }
          }
          
          .grid-item-stats {
            display: flex;
            align-items: center;
            gap: 12px;
            
            .stat-item {
              display: flex;
              align-items: center;
              gap: 4px;
              color: #909399;
              font-size: 12px;
              
              .el-icon {
                font-size: 14px;
              }
            }
          }
        }
      }
    }
  }
  
  .pagination-container {
    margin-top: 32px;
    display: flex;
    justify-content: center;
  }
}

// 响应式设计
@media (max-width: 768px) {
  .search-content .content-container {
    flex-direction: column;
    padding: 16px;
  }
  
  .search-filters {
    width: 100%;
  }
  
  .results-list {
    &.grid-view {
      grid-template-columns: 1fr;
    }
    
    .result-item:not(.grid-view &) {
      flex-direction: column;
      
      .item-cover {
        width: 100%;
        height: 160px;
      }
    }
  }
}
</style> 