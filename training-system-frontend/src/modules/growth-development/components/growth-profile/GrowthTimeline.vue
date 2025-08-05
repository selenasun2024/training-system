<template>
  <div class="growth-timeline">
    <!-- 时间线筛选器 -->
    <div class="timeline-filters">
      <div class="filter-group">
        <label>事件类型：</label>
        <el-checkbox-group v-model="selectedTypes" @change="handleTypeChange">
          <el-checkbox 
            v-for="type in eventTypes" 
            :key="type.value" 
            :label="type.value"
            :style="{ color: type.color }"
          >
            {{ type.label }}
          </el-checkbox>
        </el-checkbox-group>
      </div>
      
      <div class="filter-group">
        <label>时间范围：</label>
        <el-select v-model="timeRange" @change="handleTimeRangeChange">
          <el-option label="全部" value="all" />
          <el-option label="近一年" value="year" />
          <el-option label="近半年" value="half_year" />
          <el-option label="近三个月" value="quarter" />
        </el-select>
      </div>
      
      <div class="filter-group">
        <label>重要性：</label>
        <el-select v-model="importanceFilter" @change="handleImportanceChange">
          <el-option label="全部" value="all" />
          <el-option label="关键" value="critical" />
          <el-option label="重要" value="high" />
          <el-option label="一般" value="medium" />
        </el-select>
      </div>
    </div>

    <!-- 时间线内容 -->
    <div class="timeline-content">
      <div v-if="filteredTimeline.length === 0" class="empty-timeline">
        <el-empty description="暂无成长记录" />
      </div>
      
      <el-timeline v-else>
        <el-timeline-item
          v-for="event in filteredTimeline"
          :key="event.id"
          :timestamp="formatDate(event.date)"
          :type="getEventTypeStyle(event.type)"
          :icon="getEventIcon(event.type)"
          :color="getEventColor(event.type)"
          placement="top"
        >
          <div class="timeline-event" @click="handleEventClick(event)">
            <div class="event-header">
              <h4 class="event-title">{{ event.title }}</h4>
              <div class="event-meta">
                <el-tag 
                  :type="getImportanceTagType(event.importance)" 
                  size="small"
                  class="importance-tag"
                >
                  {{ getImportanceLabel(event.importance) }}
                </el-tag>
                <el-tag 
                  :color="getEventColor(event.type)" 
                  size="small"
                  class="type-tag"
                >
                  {{ getEventTypeLabel(event.type) }}
                </el-tag>
              </div>
            </div>
            
            <div class="event-content">
              <p class="event-description">{{ event.description }}</p>
              
              <!-- 标签 -->
              <div v-if="event.tags.length > 0" class="event-tags">
                <el-tag 
                  v-for="tag in event.tags" 
                  :key="tag" 
                  size="small"
                  type="info"
                  class="tag-item"
                >
                  {{ tag }}
                </el-tag>
              </div>
              
              <!-- 评分 -->
              <div v-if="event.rating" class="event-rating">
                <el-rate 
                  v-model="event.rating" 
                  disabled 
                  show-score 
                  text-color="#ff9900"
                  size="small"
                />
              </div>
              
              <!-- 相关项目 -->
              <div v-if="event.relatedProjectId" class="event-project">
                <el-link 
                  :underline="false" 
                  @click.stop="handleProjectClick(event.relatedProjectId, event.relatedProjectType)"
                >
                  <el-icon><FolderOpened /></el-icon>
                  查看相关项目
                </el-link>
              </div>
            </div>
          </div>
        </el-timeline-item>
      </el-timeline>
    </div>

    <!-- 加载更多 -->
    <div v-if="hasMore" class="load-more">
      <el-button 
        @click="loadMore" 
        :loading="loading"
        type="primary"
        plain
      >
        加载更多
      </el-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { FolderOpened } from '@element-plus/icons-vue';
import type { GrowthTimelineEvent } from '@/types/growth-profile';

// 组件属性
interface Props {
  timeline: GrowthTimelineEvent[];
}

const props = defineProps<Props>();

// 组件事件
const emit = defineEmits<{
  'event-click': [event: GrowthTimelineEvent];
  'project-click': [projectId: string, type: string];
}>();

// 响应式数据
const selectedTypes = ref<string[]>(['training', 'mentorship', 'achievement', 'milestone']);
const timeRange = ref('all');
const importanceFilter = ref('all');
const loading = ref(false);
const hasMore = ref(false);

// 事件类型定义
const eventTypes = [
  { value: 'training', label: '培训', color: '#409EFF' },
  { value: 'mentorship', label: '带教', color: '#67C23A' },
  { value: 'achievement', label: '成就', color: '#E6A23C' },
  { value: 'milestone', label: '里程碑', color: '#F56C6C' },
  { value: 'feedback', label: '反馈', color: '#909399' },
  { value: 'goal', label: '目标', color: '#f093fb' },
  { value: 'assessment', label: '评估', color: '#4facfe' }
];

// 计算属性
const filteredTimeline = computed(() => {
  let filtered = props.timeline.filter(event => {
    // 类型筛选
    if (!selectedTypes.value.includes(event.type)) {
      return false;
    }
    
    // 时间范围筛选
    if (timeRange.value !== 'all') {
      const now = new Date();
      const eventDate = new Date(event.date);
      const diffMonths = (now.getTime() - eventDate.getTime()) / (1000 * 60 * 60 * 24 * 30);
      
      switch (timeRange.value) {
        case 'quarter':
          if (diffMonths > 3) return false;
          break;
        case 'half_year':
          if (diffMonths > 6) return false;
          break;
        case 'year':
          if (diffMonths > 12) return false;
          break;
      }
    }
    
    // 重要性筛选
    if (importanceFilter.value !== 'all' && event.importance !== importanceFilter.value) {
      return false;
    }
    
    return true;
  });
  
  // 按时间排序（最新的在前）
  return filtered.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
});

// 方法
const formatDate = (date: Date | string) => {
  const d = new Date(date);
  return d.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

const getEventTypeStyle = (type: string) => {
  const styles = {
    'training': 'primary',
    'mentorship': 'success',
    'achievement': 'warning',
    'milestone': 'danger',
    'feedback': 'info',
    'goal': 'default',
    'assessment': 'default'
  };
  return styles[type as keyof typeof styles] || 'default';
};

const getEventIcon = (type: string) => {
  const icons = {
    'training': 'Document',
    'mentorship': 'User',
    'achievement': 'Trophy',
    'milestone': 'Star',
    'feedback': 'ChatDotSquare',
    'goal': 'Aim',
    'assessment': 'DataAnalysis'
  };
  return icons[type as keyof typeof icons] || 'Document';
};

const getEventColor = (type: string) => {
  const typeConfig = eventTypes.find(t => t.value === type);
  return typeConfig?.color || '#409EFF';
};

const getEventTypeLabel = (type: string) => {
  const typeConfig = eventTypes.find(t => t.value === type);
  return typeConfig?.label || type;
};

const getImportanceTagType = (importance: string) => {
  const types = {
    'critical': 'danger',
    'high': 'warning',
    'medium': 'info',
    'low': 'default'
  };
  return types[importance as keyof typeof types] || 'default';
};

const getImportanceLabel = (importance: string) => {
  const labels = {
    'critical': '关键',
    'high': '重要',
    'medium': '一般',
    'low': '较低'
  };
  return labels[importance as keyof typeof labels] || importance;
};

const handleTypeChange = () => {
  // 类型变化处理
};

const handleTimeRangeChange = () => {
  // 时间范围变化处理
};

const handleImportanceChange = () => {
  // 重要性变化处理
};

const handleEventClick = (event: GrowthTimelineEvent) => {
  emit('event-click', event);
};

const handleProjectClick = (projectId: string, type?: string) => {
  emit('project-click', projectId, type || 'training');
};

const loadMore = () => {
  loading.value = true;
  // 模拟加载更多
  setTimeout(() => {
    loading.value = false;
    hasMore.value = false;
  }, 1000);
};

// 生命周期
onMounted(() => {
  // 初始化
});
</script>

<style scoped>
.growth-timeline {
  padding: 20px 0;
}

.timeline-filters {
  display: flex;
  flex-wrap: wrap;
  gap: 20px;
  margin-bottom: 30px;
  padding: 20px;
  background: #f8fafc;
  border-radius: 8px;
}

.filter-group {
  display: flex;
  align-items: center;
  gap: 8px;
}

.filter-group label {
  font-weight: 500;
  color: #374151;
  white-space: nowrap;
}

.timeline-content {
  margin-top: 20px;
}

.empty-timeline {
  text-align: center;
  padding: 40px;
}

.timeline-event {
  background: white;
  border-radius: 8px;
  padding: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transition: all 0.2s;
  cursor: pointer;
}

.timeline-event:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
}

.event-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 12px;
}

.event-title {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #1f2937;
}

.event-meta {
  display: flex;
  gap: 8px;
}

.importance-tag {
  border: none;
}

.type-tag {
  border: none;
  color: white;
}

.event-content {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.event-description {
  margin: 0;
  color: #6b7280;
  line-height: 1.5;
}

.event-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.tag-item {
  font-size: 12px;
}

.event-rating {
  display: flex;
  align-items: center;
}

.event-project {
  display: flex;
  align-items: center;
  gap: 4px;
}

.load-more {
  text-align: center;
  margin-top: 30px;
}

:deep(.el-timeline-item__timestamp) {
  color: #6b7280;
  font-weight: 500;
}

:deep(.el-timeline-item__wrapper) {
  padding-left: 20px;
}

:deep(.el-timeline-item__tail) {
  border-left: 2px solid #e5e7eb;
}

:deep(.el-timeline-item__node) {
  width: 12px;
  height: 12px;
  border-width: 2px;
}

:deep(.el-checkbox-group) {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

:deep(.el-checkbox) {
  margin-right: 0;
}
</style> 