<template>
  <div class="knowledge-search">
    <!-- 搜索框 -->
    <div class="search-bar">
      <el-input
        v-model="searchQuery"
        placeholder="搜索知识内容、标题、作者..."
        size="large"
        clearable
        @keyup.enter="handleSearch"
        @clear="handleClear"
      >
        <template #prefix>
          <el-icon><Search /></el-icon>
        </template>
        <template #suffix>
          <el-button
            type="primary"
            @click="handleSearch"
            :loading="loading"
          >
            搜索
          </el-button>
        </template>
      </el-input>
    </div>

    <!-- 筛选条件 -->
    <div class="filters" v-if="showFilters">
      <div class="filter-section">
        <!-- 知识类型筛选 -->
        <div class="filter-group">
          <label class="filter-label">类型</label>
          <el-checkbox-group v-model="selectedTypes" size="small">
            <el-checkbox
              v-for="type in typeOptions"
              :key="type.value"
              :label="type.value"
              :disabled="type.count === 0"
            >
              {{ type.label }} ({{ type.count }})
            </el-checkbox>
          </el-checkbox-group>
        </div>

        <!-- 分类筛选 -->
        <div class="filter-group">
          <label class="filter-label">分类</label>
          <el-select
            v-model="selectedCategories"
            placeholder="选择分类"
            multiple
            collapse-tags
            collapse-tags-tooltip
            size="small"
            style="width: 200px"
          >
            <el-option
              v-for="category in categoryOptions"
              :key="category.value"
              :label="category.label"
              :value="category.value"
              :disabled="category.count === 0"
            >
              <span>{{ category.label }}</span>
              <span style="float: right; color: #8492a6; font-size: 13px">
                {{ category.count }}
              </span>
            </el-option>
          </el-select>
        </div>

        <!-- 标签筛选 -->
        <div class="filter-group">
          <label class="filter-label">标签</label>
          <el-select
            v-model="selectedTags"
            placeholder="选择标签"
            multiple
            filterable
            collapse-tags
            collapse-tags-tooltip
            size="small"
            style="width: 200px"
          >
            <el-option
              v-for="tag in tagOptions"
              :key="tag.value"
              :label="tag.label"
              :value="tag.value"
            />
          </el-select>
        </div>

        <!-- 作者筛选 -->
        <div class="filter-group">
          <label class="filter-label">作者</label>
          <el-select
            v-model="selectedAuthors"
            placeholder="选择作者"
            multiple
            filterable
            collapse-tags
            collapse-tags-tooltip
            size="small"
            style="width: 200px"
          >
            <el-option
              v-for="author in authorOptions"
              :key="author.value"
              :label="author.label"
              :value="author.value"
              :disabled="author.count === 0"
            >
              <span>{{ author.label }}</span>
              <span style="float: right; color: #8492a6; font-size: 13px">
                {{ author.count }}
              </span>
            </el-option>
          </el-select>
        </div>

        <!-- 时间范围筛选 -->
        <div class="filter-group">
          <label class="filter-label">时间</label>
          <el-date-picker
            v-model="dateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            size="small"
            style="width: 240px"
            @change="handleDateChange"
          />
        </div>
      </div>

      <!-- 筛选操作 -->
      <div class="filter-actions">
        <el-button size="small" @click="handleReset">
          <el-icon><Refresh /></el-icon>
          重置
        </el-button>
        <el-button type="primary" size="small" @click="handleFilter">
          <el-icon><Filter /></el-icon>
          筛选
        </el-button>
      </div>
    </div>

    <!-- 搜索结果工具栏 -->
    <div class="result-toolbar" v-if="showResultBar">
      <div class="result-info">
        <span v-if="searchQuery" class="search-keyword">
          "{{ searchQuery }}" 
        </span>
        <span class="result-count">
          找到 {{ totalResults }} 个结果
        </span>
      </div>

      <div class="toolbar-actions">
        <!-- 排序选项 -->
        <el-select
          v-model="sortBy"
          placeholder="排序方式"
          size="small"
          style="width: 140px"
          @change="handleSortChange"
        >
          <el-option label="最新发布" value="publishedAt" />
          <el-option label="最多查看" value="viewCount" />
          <el-option label="最多点赞" value="likeCount" />
          <el-option label="最近更新" value="updatedAt" />
        </el-select>

        <!-- 视图模式切换 -->
        <el-radio-group
          v-model="viewMode"
          size="small"
          @change="handleViewModeChange"
        >
          <el-radio-button label="grid">
            <el-icon><Grid /></el-icon>
          </el-radio-button>
          <el-radio-button label="list">
            <el-icon><List /></el-icon>
          </el-radio-button>
        </el-radio-group>

        <!-- 筛选开关 -->
        <el-button
          size="small"
          :type="showFilters ? 'primary' : ''"
          @click="toggleFilters"
        >
          <el-icon><Filter /></el-icon>
          筛选
        </el-button>
      </div>
    </div>

    <!-- 已选筛选标签 -->
    <div class="active-filters" v-if="hasActiveFilters">
      <span class="filter-title">已选条件：</span>
      
      <!-- 类型标签 -->
      <el-tag
        v-for="type in selectedTypes"
        :key="`type-${type}`"
        closable
        size="small"
        @close="removeTypeFilter(type)"
      >
        {{ getTypeLabel(type) }}
      </el-tag>

      <!-- 分类标签 -->
      <el-tag
        v-for="category in selectedCategories"
        :key="`category-${category}`"
        closable
        size="small"
        type="success"
        @close="removeCategoryFilter(category)"
      >
        {{ getCategoryLabel(category) }}
      </el-tag>

      <!-- 标签标签 -->
      <el-tag
        v-for="tag in selectedTags"
        :key="`tag-${tag}`"
        closable
        size="small"
        type="warning"
        @close="removeTagFilter(tag)"
      >
        {{ tag }}
      </el-tag>

      <!-- 作者标签 -->
      <el-tag
        v-for="author in selectedAuthors"
        :key="`author-${author}`"
        closable
        size="small"
        type="info"
        @close="removeAuthorFilter(author)"
      >
        {{ getAuthorLabel(author) }}
      </el-tag>

      <!-- 时间范围标签 -->
      <el-tag
        v-if="dateRange && dateRange.length === 2"
        closable
        size="small"
        type="danger"
        @close="removeDateFilter"
      >
        {{ formatDateRange(dateRange) }}
      </el-tag>

      <!-- 清空所有筛选 -->
      <el-button
        size="small"
        text
        type="danger"
        @click="clearAllFilters"
      >
        清空所有
      </el-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue';
import {
  Search,
  Filter,
  Refresh,
  Grid,
  List
} from '@element-plus/icons-vue';
import type {
  KnowledgeSearchParams,
  KnowledgeFilterOptions,
  KnowledgeType
} from '@/types/knowledge';
import { useKnowledgeStore } from '@/stores/knowledge';

interface Props {
  loading?: boolean;
  totalResults?: number;
  showFilters?: boolean;
  showResultBar?: boolean;
}

interface Emits {
  (e: 'search', params: KnowledgeSearchParams): void;
  (e: 'filter', params: KnowledgeSearchParams): void;
  (e: 'sort-change', sortBy: string): void;
  (e: 'view-mode-change', mode: 'grid' | 'list'): void;
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
  totalResults: 0,
  showFilters: false,
  showResultBar: true
});

const emit = defineEmits<Emits>();

const knowledgeStore = useKnowledgeStore();

// 搜索状态
const searchQuery = ref('');
const selectedTypes = ref<KnowledgeType[]>([]);
const selectedCategories = ref<string[]>([]);
const selectedTags = ref<string[]>([]);
const selectedAuthors = ref<string[]>([]);
const dateRange = ref<Date[]>([]);
const sortBy = ref('publishedAt');
const viewMode = ref<'grid' | 'list'>('grid');

// 筛选选项
const filterOptions = ref<KnowledgeFilterOptions | null>(null);

// 计算属性
const typeOptions = computed(() => filterOptions.value?.types || []);
const categoryOptions = computed(() => filterOptions.value?.categories || []);
const tagOptions = computed(() => filterOptions.value?.tags || []);
const authorOptions = computed(() => filterOptions.value?.authors || []);

const hasActiveFilters = computed(() => {
  return selectedTypes.value.length > 0 ||
         selectedCategories.value.length > 0 ||
         selectedTags.value.length > 0 ||
         selectedAuthors.value.length > 0 ||
         (dateRange.value && dateRange.value.length === 2);
});

// 获取搜索参数
const getSearchParams = (): KnowledgeSearchParams => {
  return {
    query: searchQuery.value.trim(),
    type: selectedTypes.value.length > 0 ? selectedTypes.value : undefined,
    category: selectedCategories.value.length > 0 ? selectedCategories.value : undefined,
    tags: selectedTags.value.length > 0 ? selectedTags.value : undefined,
    author: selectedAuthors.value.length > 0 ? selectedAuthors.value : undefined,
    dateRange: dateRange.value && dateRange.value.length === 2 ? {
      start: dateRange.value[0].toISOString(),
      end: dateRange.value[1].toISOString()
    } : undefined,
    sortBy: sortBy.value as any,
    sortOrder: 'desc',
    page: 1,
    pageSize: 20
  };
};

// 事件处理
const handleSearch = () => {
  const params = getSearchParams();
  emit('search', params);
};

const handleClear = () => {
  searchQuery.value = '';
  handleSearch();
};

const handleFilter = () => {
  const params = getSearchParams();
  emit('filter', params);
};

const handleReset = () => {
  selectedTypes.value = [];
  selectedCategories.value = [];
  selectedTags.value = [];
  selectedAuthors.value = [];
  dateRange.value = [];
  handleFilter();
};

const handleDateChange = () => {
  handleFilter();
};

const handleSortChange = () => {
  emit('sort-change', sortBy.value);
};

const handleViewModeChange = () => {
  emit('view-mode-change', viewMode.value);
};

const toggleFilters = () => {
  // 通过父组件控制筛选面板显示
};

// 移除筛选条件
const removeTypeFilter = (type: KnowledgeType) => {
  selectedTypes.value = selectedTypes.value.filter(t => t !== type);
  handleFilter();
};

const removeCategoryFilter = (category: string) => {
  selectedCategories.value = selectedCategories.value.filter(c => c !== category);
  handleFilter();
};

const removeTagFilter = (tag: string) => {
  selectedTags.value = selectedTags.value.filter(t => t !== tag);
  handleFilter();
};

const removeAuthorFilter = (author: string) => {
  selectedAuthors.value = selectedAuthors.value.filter(a => a !== author);
  handleFilter();
};

const removeDateFilter = () => {
  dateRange.value = [];
  handleFilter();
};

const clearAllFilters = () => {
  selectedTypes.value = [];
  selectedCategories.value = [];
  selectedTags.value = [];
  selectedAuthors.value = [];
  dateRange.value = [];
  handleFilter();
};

// 获取标签文本
const getTypeLabel = (type: KnowledgeType) => {
  const labelMap: Record<KnowledgeType, string> = {
    article: '文章',
    video: '视频',
    document: '文档',
    presentation: '演示',
    case_study: '案例',
    best_practice: '实践'
  };
  return labelMap[type] || type;
};

const getCategoryLabel = (categoryId: string) => {
  const category = categoryOptions.value.find(c => c.value === categoryId);
  return category?.label || categoryId;
};

const getAuthorLabel = (authorId: string) => {
  const author = authorOptions.value.find(a => a.value === authorId);
  return author?.label || authorId;
};

const formatDateRange = (range: Date[]) => {
  if (!range || range.length !== 2) return '';
  const start = range[0].toLocaleDateString();
  const end = range[1].toLocaleDateString();
  return `${start} - ${end}`;
};

// 初始化
onMounted(async () => {
  try {
    filterOptions.value = await knowledgeStore.fetchFilterOptions();
  } catch (error) {
    console.error('获取筛选选项失败:', error);
  }
});

// 监听store状态变化
watch(
  () => knowledgeStore.searchParams,
  (newParams) => {
    if (newParams) {
      searchQuery.value = newParams.query || '';
      sortBy.value = newParams.sortBy || 'publishedAt';
    }
  },
  { immediate: true }
);
</script>

<style scoped lang="scss">
.knowledge-search {
  .search-bar {
    margin-bottom: 16px;

    .el-input {
      .el-input__inner {
        padding-right: 80px;
      }
    }
  }

  .filters {
    background: #f8f9fa;
    border-radius: 8px;
    padding: 16px;
    margin-bottom: 16px;

    .filter-section {
      display: flex;
      flex-wrap: wrap;
      gap: 16px;
      margin-bottom: 12px;

      .filter-group {
        display: flex;
        align-items: center;
        gap: 8px;

        .filter-label {
          font-size: 14px;
          font-weight: 500;
          color: #606266;
          white-space: nowrap;
          min-width: 40px;
        }

        .el-checkbox-group {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }
      }
    }

    .filter-actions {
      display: flex;
      justify-content: flex-end;
      gap: 8px;
    }
  }

  .result-toolbar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;
    padding: 12px 16px;
    background: white;
    border-radius: 8px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);

    .result-info {
      .search-keyword {
        font-weight: 600;
        color: #409eff;
        margin-right: 8px;
      }

      .result-count {
        color: #606266;
        font-size: 14px;
      }
    }

    .toolbar-actions {
      display: flex;
      align-items: center;
      gap: 12px;
    }
  }

  .active-filters {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 8px;
    margin-bottom: 16px;
    padding: 12px 16px;
    background: #f0f9ff;
    border-radius: 8px;
    border: 1px solid #b3d8ff;

    .filter-title {
      font-size: 14px;
      font-weight: 500;
      color: #606266;
      margin-right: 8px;
    }
  }
}

// 响应式设计
@media (max-width: 768px) {
  .knowledge-search {
    .filters {
      .filter-section {
        flex-direction: column;
        align-items: stretch;

        .filter-group {
          flex-direction: column;
          align-items: flex-start;
          gap: 4px;

          .filter-label {
            min-width: auto;
          }

          .el-select {
            width: 100% !important;
          }

          .el-date-picker {
            width: 100% !important;
          }
        }
      }
    }

    .result-toolbar {
      flex-direction: column;
      align-items: stretch;
      gap: 12px;

      .result-info {
        text-align: center;
      }

      .toolbar-actions {
        justify-content: center;
        flex-wrap: wrap;
      }
    }

    .active-filters {
      .filter-title {
        width: 100%;
        margin-bottom: 8px;
      }
    }
  }
}
</style> 