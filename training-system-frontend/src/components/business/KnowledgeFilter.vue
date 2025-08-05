<template>
  <div class="knowledge-filter">
    <div class="filter-header">
      <h3 class="filter-title">筛选条件</h3>
      <el-button text size="small" @click="handleReset">
        <el-icon><Refresh /></el-icon>
        重置
      </el-button>
    </div>

    <div class="filter-content">
      <!-- 知识类型筛选 -->
      <div class="filter-section">
        <h4 class="section-title">知识类型</h4>
        <div class="type-filters">
          <div
            v-for="type in typeOptions"
            :key="type.value"
            class="type-item"
            :class="{ active: selectedTypes.includes(type.value) }"
            @click="toggleType(type.value)"
          >
            <div class="type-icon">
              <el-icon><component :is="getTypeIcon(type.value)" /></el-icon>
            </div>
            <div class="type-info">
              <span class="type-name">{{ type.label }}</span>
              <span class="type-count">{{ type.count }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 分类筛选 -->
      <div class="filter-section">
        <h4 class="section-title">知识分类</h4>
        <div class="category-tree">
          <div
            v-for="category in categoryOptions"
            :key="category.value"
            class="category-item"
            :class="{ active: selectedCategories.includes(category.value) }"
            @click="toggleCategory(category.value)"
          >
            <div class="category-content">
              <span class="category-name">{{ category.label }}</span>
              <span class="category-count">{{ category.count }}</span>
            </div>
            <!-- 子分类 -->
            <div v-if="category.children" class="subcategories">
              <div
                v-for="subcategory in category.children"
                :key="subcategory.value"
                class="subcategory-item"
                :class="{ active: selectedCategories.includes(subcategory.value) }"
                @click.stop="toggleCategory(subcategory.value)"
              >
                <span class="subcategory-name">{{ subcategory.label }}</span>
                <span class="subcategory-count">{{ subcategory.count }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 标签筛选 -->
      <div class="filter-section">
        <h4 class="section-title">热门标签</h4>
        <div class="tag-cloud">
          <el-tag
            v-for="tag in popularTags"
            :key="tag.value"
            :type="selectedTags.includes(tag.value) ? 'primary' : ''"
            :effect="selectedTags.includes(tag.value) ? 'dark' : 'plain'"
            size="small"
            class="tag-item"
            @click="toggleTag(tag.value)"
          >
            {{ tag.label }} ({{ tag.count }})
          </el-tag>
        </div>
        
        <!-- 标签搜索 -->
        <div class="tag-search">
          <el-input
            v-model="tagSearchQuery"
            placeholder="搜索标签..."
            size="small"
            clearable
            @input="handleTagSearch"
          >
            <template #prefix>
              <el-icon><Search /></el-icon>
            </template>
          </el-input>
          
          <!-- 搜索结果 -->
          <div v-if="searchedTags.length > 0" class="tag-search-results">
            <el-tag
              v-for="tag in searchedTags"
              :key="tag.value"
              :type="selectedTags.includes(tag.value) ? 'primary' : ''"
              :effect="selectedTags.includes(tag.value) ? 'dark' : 'plain'"
              size="small"
              class="tag-item"
              @click="toggleTag(tag.value)"
            >
              {{ tag.label }} ({{ tag.count }})
            </el-tag>
          </div>
        </div>
      </div>

      <!-- 作者筛选 -->
      <div class="filter-section">
        <h4 class="section-title">作者</h4>
        <div class="author-list">
          <div
            v-for="author in topAuthors"
            :key="author.value"
            class="author-item"
            :class="{ active: selectedAuthors.includes(author.value) }"
            @click="toggleAuthor(author.value)"
          >
            <el-avatar size="small" class="author-avatar">
              {{ author.label.charAt(0) }}
            </el-avatar>
            <div class="author-info">
              <span class="author-name">{{ author.label }}</span>
              <span class="author-count">{{ author.count }} 篇</span>
            </div>
          </div>
        </div>
        
        <!-- 显示更多作者 -->
        <el-button
          v-if="authorOptions.length > topAuthors.length"
          text
          size="small"
          @click="showAllAuthors = !showAllAuthors"
        >
          {{ showAllAuthors ? '收起' : `查看更多 (${authorOptions.length - topAuthors.length})` }}
        </el-button>
      </div>

      <!-- 时间筛选 -->
      <div class="filter-section">
        <h4 class="section-title">发布时间</h4>
        <div class="time-filters">
          <el-radio-group
            v-model="selectedTimeRange"
            direction="vertical"
            @change="handleTimeRangeChange"
          >
            <el-radio label="all">全部时间</el-radio>
            <el-radio label="today">今天</el-radio>
            <el-radio label="week">本周</el-radio>
            <el-radio label="month">本月</el-radio>
            <el-radio label="quarter">本季度</el-radio>
            <el-radio label="year">今年</el-radio>
            <el-radio label="custom">自定义</el-radio>
          </el-radio-group>
          
          <!-- 自定义时间范围 -->
          <div v-if="selectedTimeRange === 'custom'" class="custom-date-range">
            <el-date-picker
              v-model="customDateRange"
              type="daterange"
              range-separator="至"
              start-placeholder="开始日期"
              end-placeholder="结束日期"
              size="small"
              @change="handleCustomDateChange"
            />
          </div>
        </div>
      </div>

      <!-- 其他筛选 -->
      <div class="filter-section">
        <h4 class="section-title">其他条件</h4>
        <div class="other-filters">
          <el-checkbox
            v-model="hasAttachments"
            @change="handleOtherFilterChange"
          >
            包含附件
          </el-checkbox>
          <el-checkbox
            v-model="hasVideo"
            @change="handleOtherFilterChange"
          >
            包含视频
          </el-checkbox>
          <el-checkbox
            v-model="isPopular"
            @change="handleOtherFilterChange"
          >
            热门内容
          </el-checkbox>
        </div>
      </div>
    </div>

    <!-- 筛选结果统计 -->
    <div class="filter-footer">
      <div class="result-summary">
        共找到 <span class="result-count">{{ totalResults }}</span> 个结果
      </div>
      <el-button
        type="primary"
        size="small"
        @click="handleApplyFilter"
        :disabled="!hasChanges"
      >
        应用筛选
      </el-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue';
import {
  Refresh,
  Search,
  Document,
  VideoPlay,
  Files,
  DataAnalysis,
  Star
} from '@element-plus/icons-vue';
import type {
  KnowledgeType,
  KnowledgeFilterOptions,
  KnowledgeSearchParams
} from '@/types/knowledge';
import { useKnowledgeStore } from '@/stores/knowledge';

interface Props {
  totalResults?: number;
}

interface Emits {
  (e: 'filter-change', params: KnowledgeSearchParams): void;
}

const props = withDefaults(defineProps<Props>(), {
  totalResults: 0
});

const emit = defineEmits<Emits>();

const knowledgeStore = useKnowledgeStore();

// 筛选状态
const selectedTypes = ref<KnowledgeType[]>([]);
const selectedCategories = ref<string[]>([]);
const selectedTags = ref<string[]>([]);
const selectedAuthors = ref<string[]>([]);
const selectedTimeRange = ref('all');
const customDateRange = ref<Date[]>([]);
const hasAttachments = ref(false);
const hasVideo = ref(false);
const isPopular = ref(false);

// 界面状态
const showAllAuthors = ref(false);
const tagSearchQuery = ref('');
const searchedTags = ref<any[]>([]);

// 筛选选项
const filterOptions = ref<KnowledgeFilterOptions | null>(null);

// 计算属性
const typeOptions = computed(() => filterOptions.value?.types || []);
const categoryOptions = computed(() => filterOptions.value?.categories || []);
const tagOptions = computed(() => filterOptions.value?.tags || []);
const authorOptions = computed(() => filterOptions.value?.authors || []);

const popularTags = computed(() => {
  return tagOptions.value
    .slice()
    .sort((a, b) => b.count - a.count)
    .slice(0, 20);
});

const topAuthors = computed(() => {
  const limit = showAllAuthors.value ? authorOptions.value.length : 10;
  return authorOptions.value
    .slice()
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
});

const hasChanges = computed(() => {
  return selectedTypes.value.length > 0 ||
         selectedCategories.value.length > 0 ||
         selectedTags.value.length > 0 ||
         selectedAuthors.value.length > 0 ||
         selectedTimeRange.value !== 'all' ||
         hasAttachments.value ||
         hasVideo.value ||
         isPopular.value;
});

// 获取知识类型图标
const getTypeIcon = (type: KnowledgeType) => {
  const iconMap: Record<KnowledgeType, any> = {
    article: Document,
    video: VideoPlay,
    document: Files,
    presentation: Document, // 使用 Document 图标替代 Presentation
    case_study: DataAnalysis,
    best_practice: Star
  };
  return iconMap[type] || Document;
};

// 筛选操作
const toggleType = (type: KnowledgeType) => {
  const index = selectedTypes.value.indexOf(type);
  if (index > -1) {
    selectedTypes.value.splice(index, 1);
  } else {
    selectedTypes.value.push(type);
  }
  handleFilterChange();
};

const toggleCategory = (categoryId: string) => {
  const index = selectedCategories.value.indexOf(categoryId);
  if (index > -1) {
    selectedCategories.value.splice(index, 1);
  } else {
    selectedCategories.value.push(categoryId);
  }
  handleFilterChange();
};

const toggleTag = (tagId: string) => {
  const index = selectedTags.value.indexOf(tagId);
  if (index > -1) {
    selectedTags.value.splice(index, 1);
  } else {
    selectedTags.value.push(tagId);
  }
  handleFilterChange();
};

const toggleAuthor = (authorId: string) => {
  const index = selectedAuthors.value.indexOf(authorId);
  if (index > -1) {
    selectedAuthors.value.splice(index, 1);
  } else {
    selectedAuthors.value.push(authorId);
  }
  handleFilterChange();
};

const handleTimeRangeChange = () => {
  if (selectedTimeRange.value !== 'custom') {
    customDateRange.value = [];
  }
  handleFilterChange();
};

const handleCustomDateChange = () => {
  handleFilterChange();
};

const handleOtherFilterChange = () => {
  handleFilterChange();
};

const handleTagSearch = async () => {
  if (!tagSearchQuery.value.trim()) {
    searchedTags.value = [];
    return;
  }

  try {
    const tags = await knowledgeStore.fetchTags({
      query: tagSearchQuery.value,
      limit: 20
    });
    searchedTags.value = tags.map(tag => ({
      value: tag.id,
      label: tag.name,
      count: tag.usageCount
    }));
  } catch (error) {
    console.error('搜索标签失败:', error);
  }
};

const handleReset = () => {
  selectedTypes.value = [];
  selectedCategories.value = [];
  selectedTags.value = [];
  selectedAuthors.value = [];
  selectedTimeRange.value = 'all';
  customDateRange.value = [];
  hasAttachments.value = false;
  hasVideo.value = false;
  isPopular.value = false;
  tagSearchQuery.value = '';
  searchedTags.value = [];
  handleFilterChange();
};

const handleFilterChange = () => {
  // 实时筛选，可以根据需要改为手动应用
  handleApplyFilter();
};

const handleApplyFilter = () => {
  const params: KnowledgeSearchParams = {
    type: selectedTypes.value.length > 0 ? selectedTypes.value : undefined,
    category: selectedCategories.value.length > 0 ? selectedCategories.value : undefined,
    tags: selectedTags.value.length > 0 ? selectedTags.value : undefined,
    author: selectedAuthors.value.length > 0 ? selectedAuthors.value : undefined,
    dateRange: getDateRange(),
    page: 1,
    pageSize: 20
  };

  // 添加其他筛选条件
  if (hasAttachments.value || hasVideo.value || isPopular.value) {
    // 这里可以扩展更多筛选条件
  }

  emit('filter-change', params);
};

const getDateRange = () => {
  if (selectedTimeRange.value === 'custom' && customDateRange.value.length === 2) {
    return {
      start: customDateRange.value[0].toISOString(),
      end: customDateRange.value[1].toISOString()
    };
  }

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  switch (selectedTimeRange.value) {
    case 'today':
      return {
        start: today.toISOString(),
        end: now.toISOString()
      };
    case 'week':
      const weekStart = new Date(today);
      weekStart.setDate(today.getDate() - today.getDay());
      return {
        start: weekStart.toISOString(),
        end: now.toISOString()
      };
    case 'month':
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      return {
        start: monthStart.toISOString(),
        end: now.toISOString()
      };
    case 'quarter':
      const quarterStart = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1);
      return {
        start: quarterStart.toISOString(),
        end: now.toISOString()
      };
    case 'year':
      const yearStart = new Date(now.getFullYear(), 0, 1);
      return {
        start: yearStart.toISOString(),
        end: now.toISOString()
      };
    default:
      return undefined;
  }
};

// 初始化
onMounted(async () => {
  try {
    filterOptions.value = await knowledgeStore.fetchFilterOptions();
  } catch (error) {
    console.error('获取筛选选项失败:', error);
  }
});
</script>

<style scoped lang="scss">
.knowledge-filter {
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  height: fit-content;

  .filter-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 16px;
    border-bottom: 1px solid #ebeef5;

    .filter-title {
      margin: 0;
      font-size: 16px;
      font-weight: 600;
      color: #303133;
    }
  }

  .filter-content {
    max-height: 70vh;
    overflow-y: auto;
    padding: 16px;

    .filter-section {
      margin-bottom: 24px;

      &:last-child {
        margin-bottom: 0;
      }

      .section-title {
        margin: 0 0 12px 0;
        font-size: 14px;
        font-weight: 600;
        color: #606266;
      }
    }

    .type-filters {
      display: flex;
      flex-direction: column;
      gap: 8px;

      .type-item {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 8px;
        border-radius: 6px;
        cursor: pointer;
        transition: all 0.2s;

        &:hover {
          background: #f5f7fa;
        }

        &.active {
          background: #e1f3d8;
          border: 1px solid #67c23a;
        }

        .type-icon {
          width: 24px;
          height: 24px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #409eff;
        }

        .type-info {
          flex: 1;
          display: flex;
          justify-content: space-between;
          align-items: center;

          .type-name {
            font-size: 14px;
            color: #303133;
          }

          .type-count {
            font-size: 12px;
            color: #909399;
          }
        }
      }
    }

    .category-tree {
      .category-item {
        margin-bottom: 4px;

        .category-content {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 6px 8px;
          border-radius: 4px;
          cursor: pointer;
          transition: all 0.2s;

          &:hover {
            background: #f5f7fa;
          }
        }

        &.active .category-content {
          background: #e1f3d8;
          border: 1px solid #67c23a;
        }

        .category-name {
          font-size: 14px;
          color: #303133;
        }

        .category-count {
          font-size: 12px;
          color: #909399;
        }

        .subcategories {
          margin-left: 16px;
          margin-top: 4px;

          .subcategory-item {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 4px 8px;
            border-radius: 4px;
            cursor: pointer;
            transition: all 0.2s;

            &:hover {
              background: #f5f7fa;
            }

            &.active {
              background: #e1f3d8;
              border: 1px solid #67c23a;
            }

            .subcategory-name {
              font-size: 13px;
              color: #606266;
            }

            .subcategory-count {
              font-size: 11px;
              color: #c0c4cc;
            }
          }
        }
      }
    }

    .tag-cloud {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
      margin-bottom: 12px;

      .tag-item {
        cursor: pointer;
        transition: all 0.2s;

        &:hover {
          transform: scale(1.05);
        }
      }
    }

    .tag-search {
      .tag-search-results {
        margin-top: 8px;
        display: flex;
        flex-wrap: wrap;
        gap: 6px;
        max-height: 120px;
        overflow-y: auto;

        .tag-item {
          cursor: pointer;
        }
      }
    }

    .author-list {
      display: flex;
      flex-direction: column;
      gap: 8px;
      margin-bottom: 8px;

      .author-item {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 6px 8px;
        border-radius: 4px;
        cursor: pointer;
        transition: all 0.2s;

        &:hover {
          background: #f5f7fa;
        }

        &.active {
          background: #e1f3d8;
          border: 1px solid #67c23a;
        }

        .author-avatar {
          flex-shrink: 0;
        }

        .author-info {
          flex: 1;
          min-width: 0;

          .author-name {
            display: block;
            font-size: 13px;
            color: #303133;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
          }

          .author-count {
            font-size: 11px;
            color: #909399;
          }
        }
      }
    }

    .time-filters {
      .el-radio-group {
        width: 100%;
      }

      .custom-date-range {
        margin-top: 8px;

        .el-date-picker {
          width: 100%;
        }
      }
    }

    .other-filters {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
  }

  .filter-footer {
    padding: 16px;
    border-top: 1px solid #ebeef5;
    display: flex;
    justify-content: space-between;
    align-items: center;

    .result-summary {
      font-size: 14px;
      color: #606266;

      .result-count {
        font-weight: 600;
        color: #409eff;
      }
    }
  }
}

// 滚动条样式
.filter-content::-webkit-scrollbar {
  width: 4px;
}

.filter-content::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 2px;
}

.filter-content::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 2px;
}

.filter-content::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}
</style> 