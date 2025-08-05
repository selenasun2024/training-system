<template>
  <div class="activity-search">
    <div class="search-header">
      <div class="search-main">
        <el-input
          v-model="searchQuery"
          placeholder="搜索活动标题、描述、标签或组织者..."
          size="large"
          clearable
          @keyup.enter="handleSearch"
          @clear="handleClear"
        >
          <template #prefix>
            <el-icon>
              <Search />
            </el-icon>
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
      
      <div class="search-actions">
        <el-button
          type="primary"
          :icon="Plus"
          @click="handleCreateActivity"
        >
          创建活动
        </el-button>
        <el-button
          :icon="Calendar"
          @click="handleViewCalendar"
        >
          日历视图
        </el-button>
      </div>
    </div>

    <div class="search-filters" v-if="showFilters">
      <div class="filter-row">
        <div class="filter-item">
          <label>活动类型</label>
          <el-select
            v-model="filters.type"
            placeholder="选择类型"
            multiple
            collapse-tags
            collapse-tags-tooltip
            clearable
            style="width: 200px"
          >
            <el-option
              v-for="option in typeOptions"
              :key="option.value"
              :label="option.label"
              :value="option.value"
            />
          </el-select>
        </div>

        <div class="filter-item">
          <label>活动形式</label>
          <el-select
            v-model="filters.format"
            placeholder="选择形式"
            multiple
            collapse-tags
            clearable
            style="width: 150px"
          >
            <el-option
              v-for="option in formatOptions"
              :key="option.value"
              :label="option.label"
              :value="option.value"
            />
          </el-select>
        </div>

        <div class="filter-item">
          <label>活动状态</label>
          <el-select
            v-model="filters.status"
            placeholder="选择状态"
            multiple
            collapse-tags
            clearable
            style="width: 150px"
          >
            <el-option
              v-for="option in statusOptions"
              :key="option.value"
              :label="option.label"
              :value="option.value"
            />
          </el-select>
        </div>

        <div class="filter-item">
          <label>时间范围</label>
          <el-date-picker
            v-model="dateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            format="YYYY-MM-DD"
            value-format="YYYY-MM-DD"
            style="width: 240px"
            @change="handleDateRangeChange"
          />
        </div>
      </div>

      <div class="filter-row">
        <div class="filter-item">
          <label>标签</label>
          <el-select
            v-model="filters.tags"
            placeholder="选择标签"
            multiple
            filterable
            collapse-tags
            collapse-tags-tooltip
            clearable
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

        <div class="filter-item">
          <label>组织者</label>
          <el-select
            v-model="filters.organizerId"
            placeholder="选择组织者"
            filterable
            clearable
            style="width: 150px"
          >
            <el-option
              v-for="organizer in organizerOptions"
              :key="organizer.value"
              :label="organizer.label"
              :value="organizer.value"
            />
          </el-select>
        </div>

        <div class="filter-item">
          <label>其他筛选</label>
          <el-checkbox-group v-model="advancedFilters">
            <el-checkbox label="hasSpots">有空位</el-checkbox>
            <el-checkbox label="canRegister">可报名</el-checkbox>
            <el-checkbox label="isRecommended">推荐</el-checkbox>
          </el-checkbox-group>
        </div>
      </div>

      <div class="filter-actions">
        <el-button @click="handleReset">重置</el-button>
        <el-button type="primary" @click="handleApplyFilters">应用筛选</el-button>
        <el-button text @click="toggleFilters">
          {{ showAdvancedFilters ? '收起' : '展开' }}高级筛选
        </el-button>
      </div>
    </div>

    <div class="search-results-header">
      <div class="results-info">
        <span class="results-count">找到 {{ totalResults }} 个活动</span>
        <span v-if="searchQuery" class="search-query">关于 "{{ searchQuery }}"</span>
      </div>
      
      <div class="results-controls">
        <div class="sort-controls">
          <label>排序:</label>
          <el-select v-model="sortBy" @change="handleSortChange" style="width: 120px">
            <el-option label="开始时间" value="date" />
            <el-option label="热度" value="popularity" />
            <el-option label="评分" value="rating" />
            <el-option label="参与人数" value="participants" />
          </el-select>
          <el-button
            :icon="sortOrder === 'asc' ? SortUp : SortDown"
            @click="toggleSortOrder"
            text
          />
        </div>
        
        <div class="view-controls">
          <el-button-group>
            <el-button
              :type="viewMode === 'grid' ? 'primary' : 'default'"
              :icon="Grid"
              @click="setViewMode('grid')"
            />
            <el-button
              :type="viewMode === 'list' ? 'primary' : 'default'"
              :icon="List"
              @click="setViewMode('list')"
            />
          </el-button-group>
        </div>
      </div>
    </div>

    <!-- 快速筛选标签 -->
    <div class="quick-filters" v-if="hasActiveFilters">
      <div class="filter-tags">
        <el-tag
          v-for="tag in activeFilterTags"
          :key="tag.key"
          closable
          @close="removeFilter(tag.key, tag.value)"
        >
          {{ tag.label }}
        </el-tag>
        <el-button text @click="clearAllFilters">清除所有</el-button>
      </div>
    </div>

    <!-- 搜索建议 -->
    <div class="search-suggestions" v-if="showSuggestions && suggestions.length > 0">
      <div class="suggestions-header">
        <span>搜索建议：</span>
      </div>
      <div class="suggestions-list">
        <el-tag
          v-for="suggestion in suggestions"
          :key="suggestion"
          @click="applySuggestion(suggestion)"
          style="cursor: pointer; margin-right: 8px;"
        >
          {{ suggestion }}
        </el-tag>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import {
  Search,
  Plus,
  Calendar,
  Grid,
  List,
  SortUp,
  SortDown
} from '@element-plus/icons-vue'
import type { ActivitySearchParams, ActivityType, ActivityFormat, ActivityStatus } from '@/types/activity'
import { useActivitiesStore } from '@/stores/activities'

interface Props {
  showFilters?: boolean
  showAdvancedFilters?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  showFilters: true,
  showAdvancedFilters: false
})

const emit = defineEmits<{
  search: [params: ActivitySearchParams]
  viewModeChange: [mode: 'grid' | 'list']
  createActivity: []
  viewCalendar: []
}>()

const router = useRouter()
const activitiesStore = useActivitiesStore()

// 搜索状态
const searchQuery = ref('')
const loading = ref(false)
const showSuggestions = ref(false)
const suggestions = ref<string[]>([])

// 筛选状态
const filters = ref<ActivitySearchParams>({})
const dateRange = ref<[string, string] | null>(null)
const advancedFilters = ref<string[]>([])

// 排序和视图状态
const sortBy = ref<'date' | 'popularity' | 'rating' | 'participants'>('date')
const sortOrder = ref<'asc' | 'desc'>('asc')
const viewMode = ref<'grid' | 'list'>('grid')

// 筛选选项
const typeOptions = [
  { value: 'knowledge_sharing', label: '知识分享' },
  { value: 'technical_seminar', label: '技术研讨' },
  { value: 'workshop', label: '工作坊' },
  { value: 'book_club', label: '读书会' },
  { value: 'project_review', label: '项目复盘' },
  { value: 'training_session', label: '培训课程' },
  { value: 'hackathon', label: '黑客马拉松' },
  { value: 'mentoring', label: '导师指导' },
  { value: 'community_event', label: '社区活动' }
]

const formatOptions = [
  { value: 'online', label: '线上' },
  { value: 'offline', label: '线下' },
  { value: 'hybrid', label: '混合' }
]

const statusOptions = [
  { value: 'registration_open', label: '报名中' },
  { value: 'registration_closed', label: '报名截止' },
  { value: 'in_progress', label: '进行中' },
  { value: 'completed', label: '已完成' },
  { value: 'cancelled', label: '已取消' },
  { value: 'postponed', label: '已延期' }
]

const tagOptions = ref<Array<{ value: string; label: string }>>([])
const organizerOptions = ref<Array<{ value: string; label: string }>>([])

// 计算属性
const totalResults = computed(() => activitiesStore.totalResults)

const hasActiveFilters = computed(() => {
  return Object.keys(filters.value).some(key => {
    const value = filters.value[key as keyof ActivitySearchParams]
    return Array.isArray(value) ? value.length > 0 : !!value
  }) || advancedFilters.value.length > 0
})

const activeFilterTags = computed(() => {
  const tags: Array<{ key: string; value: any; label: string }> = []
  
  if (filters.value.type?.length) {
    filters.value.type.forEach(type => {
      const option = typeOptions.find(opt => opt.value === type)
      if (option) {
        tags.push({ key: 'type', value: type, label: `类型: ${option.label}` })
      }
    })
  }
  
  if (filters.value.format?.length) {
    filters.value.format.forEach(format => {
      const option = formatOptions.find(opt => opt.value === format)
      if (option) {
        tags.push({ key: 'format', value: format, label: `形式: ${option.label}` })
      }
    })
  }
  
  if (filters.value.status?.length) {
    filters.value.status.forEach(status => {
      const option = statusOptions.find(opt => opt.value === status)
      if (option) {
        tags.push({ key: 'status', value: status, label: `状态: ${option.label}` })
      }
    })
  }
  
  if (filters.value.tags?.length) {
    filters.value.tags.forEach(tag => {
      tags.push({ key: 'tags', value: tag, label: `标签: ${tag}` })
    })
  }
  
  if (filters.value.organizerId) {
    const organizer = organizerOptions.value.find(opt => opt.value === filters.value.organizerId)
    if (organizer) {
      tags.push({ key: 'organizerId', value: filters.value.organizerId, label: `组织者: ${organizer.label}` })
    }
  }
  
  advancedFilters.value.forEach(filter => {
    const labels: Record<string, string> = {
      hasSpots: '有空位',
      canRegister: '可报名',
      isRecommended: '推荐'
    }
    tags.push({ key: 'advanced', value: filter, label: labels[filter] || filter })
  })
  
  return tags
})

// 方法
const handleSearch = async () => {
  loading.value = true
  showSuggestions.value = false
  
  try {
    const searchParams: ActivitySearchParams = {
      query: searchQuery.value,
      ...filters.value,
      sortBy: sortBy.value,
      sortOrder: sortOrder.value
    }
    
    // 处理高级筛选
    if (advancedFilters.value.includes('hasSpots')) {
      searchParams.hasSpots = true
    }
    
    await activitiesStore.searchActivities(searchQuery.value, searchParams)
    emit('search', searchParams)
  } catch (error) {
    console.error('搜索失败:', error)
  } finally {
    loading.value = false
  }
}

const handleClear = () => {
  searchQuery.value = ''
  showSuggestions.value = false
  handleSearch()
}

const handleDateRangeChange = (dates: [string, string] | null) => {
  if (dates) {
    filters.value.startDate = new Date(dates[0])
    filters.value.endDate = new Date(dates[1])
  } else {
    delete filters.value.startDate
    delete filters.value.endDate
  }
}

const handleReset = () => {
  searchQuery.value = ''
  filters.value = {}
  dateRange.value = null
  advancedFilters.value = []
  handleSearch()
}

const handleApplyFilters = () => {
  handleSearch()
}

const toggleFilters = () => {
  // 切换高级筛选显示状态
}

const handleSortChange = () => {
  handleSearch()
}

const toggleSortOrder = () => {
  sortOrder.value = sortOrder.value === 'asc' ? 'desc' : 'asc'
  handleSearch()
}

const setViewMode = (mode: 'grid' | 'list') => {
  viewMode.value = mode
  emit('viewModeChange', mode)
}

const removeFilter = (key: string, value: any) => {
  if (key === 'advanced') {
    const index = advancedFilters.value.indexOf(value)
    if (index > -1) {
      advancedFilters.value.splice(index, 1)
    }
  } else {
    const filterValue = filters.value[key as keyof ActivitySearchParams]
    if (Array.isArray(filterValue)) {
      const index = filterValue.indexOf(value)
      if (index > -1) {
        filterValue.splice(index, 1)
      }
    } else {
      delete filters.value[key as keyof ActivitySearchParams]
    }
  }
  handleSearch()
}

const clearAllFilters = () => {
  handleReset()
}

const applySuggestion = (suggestion: string) => {
  searchQuery.value = suggestion
  showSuggestions.value = false
  handleSearch()
}

const handleCreateActivity = () => {
  emit('createActivity')
  router.push('/training-management/knowledge-sharing/activities/create')
}

const handleViewCalendar = () => {
  emit('viewCalendar')
  router.push('/training-management/knowledge-sharing/activities/calendar')
}

// 监听搜索输入
watch(searchQuery, (newQuery) => {
  if (newQuery.length > 2) {
    // 模拟搜索建议
    suggestions.value = [
      'Vue 3 实战',
      '微服务架构',
      '前端性能优化',
      'React 最佳实践',
      '数据库设计'
    ].filter(s => s.toLowerCase().includes(newQuery.toLowerCase()))
    showSuggestions.value = suggestions.value.length > 0
  } else {
    showSuggestions.value = false
  }
})

// 初始化
onMounted(async () => {
  await activitiesStore.fetchFilterOptions()
  
  // 生成标签和组织者选项
  tagOptions.value = [
    { value: 'Vue3', label: 'Vue3' },
    { value: '微服务', label: '微服务' },
    { value: '前端开发', label: '前端开发' },
    { value: '架构设计', label: '架构设计' },
    { value: '性能优化', label: '性能优化' }
  ]
  
  organizerOptions.value = [
    { value: 'user1', label: '张三' },
    { value: 'user2', label: '李四' },
    { value: 'user3', label: '王五' }
  ]
  
  // 初始加载
  handleSearch()
})
</script>

<style scoped>
.activity-search {
  background: #fff;
  border-radius: 8px;
  padding: 24px;
  margin-bottom: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
}

.search-header {
  display: flex;
  gap: 16px;
  align-items: center;
  margin-bottom: 20px;
}

.search-main {
  flex: 1;
}

.search-actions {
  display: flex;
  gap: 12px;
}

.search-filters {
  border-top: 1px solid #f0f2f5;
  padding-top: 20px;
  margin-bottom: 20px;
}

.filter-row {
  display: flex;
  gap: 20px;
  align-items: end;
  margin-bottom: 16px;
  flex-wrap: wrap;
}

.filter-item {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.filter-item label {
  font-size: 14px;
  font-weight: 500;
  color: #606266;
}

.filter-actions {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  padding-top: 16px;
  border-top: 1px solid #f0f2f5;
}

.search-results-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.results-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.results-count {
  font-weight: 500;
  color: #303133;
}

.search-query {
  color: #909399;
  font-size: 14px;
}

.results-controls {
  display: flex;
  gap: 16px;
  align-items: center;
}

.sort-controls {
  display: flex;
  align-items: center;
  gap: 8px;
}

.sort-controls label {
  font-size: 14px;
  color: #606266;
}

.quick-filters {
  margin-bottom: 16px;
}

.filter-tags {
  display: flex;
  gap: 8px;
  align-items: center;
  flex-wrap: wrap;
}

.search-suggestions {
  background: #f8f9fa;
  border-radius: 6px;
  padding: 12px;
  margin-top: 12px;
}

.suggestions-header {
  font-size: 14px;
  color: #606266;
  margin-bottom: 8px;
}

.suggestions-list {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .search-header {
    flex-direction: column;
    align-items: stretch;
  }
  
  .search-actions {
    justify-content: center;
  }
  
  .filter-row {
    flex-direction: column;
    gap: 12px;
  }
  
  .filter-item {
    width: 100%;
  }
  
  .filter-item .el-select,
  .filter-item .el-date-picker {
    width: 100% !important;
  }
  
  .search-results-header {
    flex-direction: column;
    gap: 12px;
    align-items: stretch;
  }
  
  .results-controls {
    justify-content: space-between;
  }
}
</style> 