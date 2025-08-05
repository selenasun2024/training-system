<template>
  <div class="skill-development">
    <!-- 技能概览 -->
    <div class="skill-overview">
      <div class="overview-cards">
        <div class="overview-card">
          <div class="card-icon technical">
            <el-icon><Monitor /></el-icon>
          </div>
          <div class="card-content">
            <div class="card-number">{{ skillsByCategory.technical.length }}</div>
            <div class="card-label">技术技能</div>
          </div>
        </div>
        
        <div class="overview-card">
          <div class="card-icon soft">
            <el-icon><User /></el-icon>
          </div>
          <div class="card-content">
            <div class="card-number">{{ skillsByCategory.soft.length }}</div>
            <div class="card-label">软技能</div>
          </div>
        </div>
        
        <div class="overview-card">
          <div class="card-icon leadership">
            <el-icon><Crown /></el-icon>
          </div>
          <div class="card-content">
            <div class="card-number">{{ skillsByCategory.leadership.length }}</div>
            <div class="card-label">领导力</div>
          </div>
        </div>
        
        <div class="overview-card">
          <div class="card-icon domain">
            <el-icon><Reading /></el-icon>
          </div>
          <div class="card-content">
            <div class="card-number">{{ skillsByCategory.domain.length }}</div>
            <div class="card-label">领域知识</div>
          </div>
        </div>
      </div>
    </div>

    <!-- 视图切换 -->
    <div class="view-selector">
      <el-radio-group v-model="currentView" @change="handleViewChange">
        <el-radio-button label="radar">雷达图</el-radio-button>
        <el-radio-button label="list">列表视图</el-radio-button>
        <el-radio-button label="progress">进度跟踪</el-radio-button>
      </el-radio-group>
    </div>

    <!-- 雷达图视图 -->
    <div v-if="currentView === 'radar'" class="radar-view">
      <div class="radar-container">
        <div class="radar-chart" ref="radarChartRef"></div>
        <div class="radar-legend">
          <div class="legend-item" v-for="category in skillCategories" :key="category.value">
            <div class="legend-color" :style="{ backgroundColor: category.color }"></div>
            <span class="legend-label">{{ category.label }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 列表视图 -->
    <div v-if="currentView === 'list'" class="list-view">
      <div class="skill-filters">
        <el-select v-model="selectedCategory" @change="handleCategoryChange" placeholder="选择分类">
          <el-option label="全部" value="all" />
          <el-option 
            v-for="category in skillCategories" 
            :key="category.value"
            :label="category.label" 
            :value="category.value" 
          />
        </el-select>
        
        <el-select v-model="levelFilter" @change="handleLevelChange" placeholder="技能等级">
          <el-option label="全部等级" value="all" />
          <el-option label="初学者(1-2)" value="beginner" />
          <el-option label="中级(3-4)" value="intermediate" />
          <el-option label="高级(5-6)" value="advanced" />
          <el-option label="专家(7-8)" value="expert" />
        </el-select>
        
        <el-input 
          v-model="searchKeyword" 
          placeholder="搜索技能"
          :prefix-icon="Search"
          clearable
          @input="handleSearch"
        />
      </div>
      
      <div class="skill-list">
        <div 
          v-for="skill in filteredSkills" 
          :key="skill.skillId"
          class="skill-item"
          @click="handleSkillClick(skill)"
        >
          <div class="skill-header">
            <div class="skill-info">
              <h4 class="skill-name">{{ skill.skillName }}</h4>
              <el-tag 
                :type="getCategoryTagType(skill.category)" 
                size="small"
              >
                {{ getCategoryLabel(skill.category) }}
              </el-tag>
            </div>
            <div class="skill-level">
              <span class="level-text">{{ skill.currentLevel }}/{{ skill.maxLevel }}</span>
              <el-progress 
                :percentage="getSkillPercentage(skill)" 
                :color="getSkillColor(skill.currentLevel)"
                :stroke-width="6"
                :show-text="false"
              />
            </div>
          </div>
          
          <div class="skill-details">
            <div class="skill-meta">
              <span class="meta-item">
                <el-icon><Calendar /></el-icon>
                最近评估：{{ formatDate(skill.lastAssessed) }}
              </span>
              <span class="meta-item">
                <el-icon><TrendCharts /></el-icon>
                优先级：{{ getPriorityLabel(skill.priority) }}
              </span>
              <span v-if="skill.nextAssessment" class="meta-item">
                <el-icon><Clock /></el-icon>
                下次评估：{{ formatDate(skill.nextAssessment) }}
              </span>
            </div>
            
            <div class="skill-actions">
              <el-button 
                size="small" 
                type="primary" 
                plain 
                @click.stop="viewSkillProgress(skill)"
              >
                查看进展
              </el-button>
              <el-button 
                size="small" 
                type="success" 
                plain 
                @click.stop="planLearning(skill)"
              >
                学习规划
              </el-button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 进度跟踪视图 -->
    <div v-if="currentView === 'progress'" class="progress-view">
      <div class="progress-summary">
        <h3>技能发展趋势</h3>
        <div class="trend-chart" ref="trendChartRef"></div>
      </div>
      
      <div class="progress-details">
        <div class="progress-filters">
          <el-date-picker
            v-model="progressTimeRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            @change="handleTimeRangeChange"
          />
        </div>
        
        <div class="progress-timeline">
          <el-timeline>
            <el-timeline-item
              v-for="record in recentProgressRecords"
              :key="record.date.toString() + record.skillId"
              :timestamp="formatDate(record.date)"
              :type="getProgressType(record.source)"
            >
              <div class="progress-record">
                <div class="record-header">
                  <span class="skill-name">{{ getSkillName(record.skillId) }}</span>
                  <span class="level-change">
                    等级：{{ record.level }}/{{ getMaxLevel(record.skillId) }}
                  </span>
                </div>
                <div class="record-content">
                  <p class="record-notes">{{ record.notes || '技能等级更新' }}</p>
                  <div class="record-meta">
                    <el-tag size="small" :type="getSourceTagType(record.source)">
                      {{ getSourceLabel(record.source) }}
                    </el-tag>
                    <span v-if="record.assessorName" class="assessor">
                      评估者：{{ record.assessorName }}
                    </span>
                  </div>
                </div>
              </div>
            </el-timeline-item>
          </el-timeline>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, nextTick } from 'vue';
import { 
  Monitor, User, Crown, Reading, Search, Calendar, 
  TrendCharts, Clock 
} from '@element-plus/icons-vue';
import { ElMessage } from 'element-plus';
import * as echarts from 'echarts';
import type { SkillDevelopmentTrack, SkillProgressRecord } from '@/types/growth-profile';

// 组件属性
interface Props {
  skills: SkillDevelopmentTrack[];
}

const props = defineProps<Props>();

// 组件事件
const emit = defineEmits<{
  'skill-click': [skillId: string];
  'view-progress': [skillId: string];
  'plan-learning': [skillId: string];
}>();

// 响应式数据
const currentView = ref('radar');
const selectedCategory = ref('all');
const levelFilter = ref('all');
const searchKeyword = ref('');
const progressTimeRange = ref<[Date, Date] | null>(null);
const radarChartRef = ref<HTMLElement>();
const trendChartRef = ref<HTMLElement>();

// 技能分类定义
const skillCategories = [
  { value: 'technical', label: '技术技能', color: '#409EFF' },
  { value: 'soft', label: '软技能', color: '#67C23A' },
  { value: 'leadership', label: '领导力', color: '#E6A23C' },
  { value: 'domain', label: '领域知识', color: '#F56C6C' }
];

// 计算属性
const skillsByCategory = computed(() => {
  const categories = {
    technical: [],
    soft: [],
    leadership: [],
    domain: []
  } as Record<string, SkillDevelopmentTrack[]>;
  
  props.skills.forEach(skill => {
    if (categories[skill.category]) {
      categories[skill.category].push(skill);
    }
  });
  
  return categories;
});

const filteredSkills = computed(() => {
  return props.skills.filter(skill => {
    // 分类筛选
    if (selectedCategory.value !== 'all' && skill.category !== selectedCategory.value) {
      return false;
    }
    
    // 等级筛选
    if (levelFilter.value !== 'all') {
      const level = skill.currentLevel;
      switch (levelFilter.value) {
        case 'beginner':
          if (level > 2) return false;
          break;
        case 'intermediate':
          if (level < 3 || level > 4) return false;
          break;
        case 'advanced':
          if (level < 5 || level > 6) return false;
          break;
        case 'expert':
          if (level < 7) return false;
          break;
      }
    }
    
    // 关键词搜索
    if (searchKeyword.value) {
      const keyword = searchKeyword.value.toLowerCase();
      if (!skill.skillName.toLowerCase().includes(keyword)) {
        return false;
      }
    }
    
    return true;
  });
});

const recentProgressRecords = computed(() => {
  const allRecords: (SkillProgressRecord & { skillId: string })[] = [];
  
  props.skills.forEach(skill => {
    skill.progressHistory.forEach(record => {
      allRecords.push({
        ...record,
        skillId: skill.skillId
      });
    });
  });
  
  // 过滤时间范围
  let filtered = allRecords;
  if (progressTimeRange.value) {
    const [start, end] = progressTimeRange.value;
    filtered = allRecords.filter(record => {
      const recordDate = new Date(record.date);
      return recordDate >= start && recordDate <= end;
    });
  }
  
  // 按时间排序（最新的在前）
  return filtered.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 20);
});

// 方法
const formatDate = (date: Date | string) => {
  const d = new Date(date);
  return d.toLocaleDateString('zh-CN');
};

const getCategoryLabel = (category: string) => {
  const cat = skillCategories.find(c => c.value === category);
  return cat?.label || category;
};

const getCategoryTagType = (category: string) => {
  const types = {
    'technical': 'primary',
    'soft': 'success',
    'leadership': 'warning',
    'domain': 'danger'
  };
  return types[category as keyof typeof types] || 'default';
};

const getSkillPercentage = (skill: SkillDevelopmentTrack) => {
  return Math.round((skill.currentLevel / skill.maxLevel) * 100);
};

const getSkillColor = (level: number) => {
  if (level <= 2) return '#F56C6C';
  if (level <= 4) return '#E6A23C';
  if (level <= 6) return '#67C23A';
  return '#409EFF';
};

const getPriorityLabel = (priority: string) => {
  const labels = {
    'high': '高',
    'medium': '中',
    'low': '低'
  };
  return labels[priority as keyof typeof labels] || priority;
};

const getProgressType = (source: string) => {
  const types = {
    'training': 'primary',
    'mentorship': 'success',
    'self_assessment': 'info',
    'peer_review': 'warning',
    'manager_review': 'danger'
  };
  return types[source as keyof typeof types] || 'default';
};

const getSourceLabel = (source: string) => {
  const labels = {
    'training': '培训',
    'mentorship': '带教',
    'self_assessment': '自评',
    'peer_review': '同事评价',
    'manager_review': '上级评价'
  };
  return labels[source as keyof typeof labels] || source;
};

const getSourceTagType = (source: string) => {
  const types = {
    'training': 'primary',
    'mentorship': 'success',
    'self_assessment': 'info',
    'peer_review': 'warning',
    'manager_review': 'danger'
  };
  return types[source as keyof typeof types] || 'default';
};

const getSkillName = (skillId: string) => {
  const skill = props.skills.find(s => s.skillId === skillId);
  return skill?.skillName || skillId;
};

const getMaxLevel = (skillId: string) => {
  const skill = props.skills.find(s => s.skillId === skillId);
  return skill?.maxLevel || 10;
};

const handleViewChange = () => {
  nextTick(() => {
    if (currentView.value === 'radar') {
      initRadarChart();
    } else if (currentView.value === 'progress') {
      initTrendChart();
    }
  });
};

const handleCategoryChange = () => {
  // 分类变化处理
};

const handleLevelChange = () => {
  // 等级筛选变化处理
};

const handleSearch = () => {
  // 搜索处理
};

const handleTimeRangeChange = () => {
  // 时间范围变化处理
};

const handleSkillClick = (skill: SkillDevelopmentTrack) => {
  emit('skill-click', skill.skillId);
};

const viewSkillProgress = (skill: SkillDevelopmentTrack) => {
  emit('view-progress', skill.skillId);
};

const planLearning = (skill: SkillDevelopmentTrack) => {
  emit('plan-learning', skill.skillId);
};

const initRadarChart = () => {
  if (!radarChartRef.value) return;
  
  const chart = echarts.init(radarChartRef.value);
  
  // 构建雷达图数据
  const indicators = skillCategories.map(category => ({
    name: category.label,
    max: 10
  }));
  
  const data = skillCategories.map(category => {
    const categorySkills = skillsByCategory.value[category.value] || [];
    const avgLevel = categorySkills.length > 0 
      ? categorySkills.reduce((sum, skill) => sum + skill.currentLevel, 0) / categorySkills.length 
      : 0;
    return avgLevel;
  });
  
  const option = {
    title: {
      text: '技能雷达图',
      left: 'center'
    },
    tooltip: {
      trigger: 'item'
    },
    radar: {
      indicator: indicators,
      center: ['50%', '55%'],
      radius: '70%'
    },
    series: [{
      name: '技能等级',
      type: 'radar',
      data: [{
        value: data,
        name: '当前水平',
        areaStyle: {
          color: 'rgba(64, 158, 255, 0.3)'
        },
        lineStyle: {
          color: '#409EFF'
        },
        itemStyle: {
          color: '#409EFF'
        }
      }]
    }]
  };
  
  chart.setOption(option);
};

const initTrendChart = () => {
  if (!trendChartRef.value) return;
  
  const chart = echarts.init(trendChartRef.value);
  
  // 构建趋势图数据
  const recentMonths = Array.from({ length: 6 }, (_, i) => {
    const date = new Date();
    date.setMonth(date.getMonth() - i);
    return date.toLocaleDateString('zh-CN', { year: 'numeric', month: 'short' });
  }).reverse();
  
  const seriesData = skillCategories.map(category => ({
    name: category.label,
    type: 'line',
    data: recentMonths.map(() => Math.floor(Math.random() * 3) + 3), // 模拟数据
    smooth: true,
    lineStyle: {
      color: category.color
    },
    itemStyle: {
      color: category.color
    }
  }));
  
  const option = {
    title: {
      text: '技能发展趋势',
      left: 'center'
    },
    tooltip: {
      trigger: 'axis'
    },
    legend: {
      bottom: 10
    },
    xAxis: {
      type: 'category',
      data: recentMonths
    },
    yAxis: {
      type: 'value',
      min: 0,
      max: 10,
      name: '平均技能等级'
    },
    series: seriesData
  };
  
  chart.setOption(option);
};

// 生命周期
onMounted(() => {
  nextTick(() => {
    initRadarChart();
  });
});
</script>

<style scoped>
.skill-development {
  padding: 20px 0;
}

.skill-overview {
  margin-bottom: 30px;
}

.overview-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
}

.overview-card {
  display: flex;
  align-items: center;
  padding: 20px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.card-icon {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 16px;
  font-size: 24px;
  color: white;
}

.card-icon.technical {
  background: linear-gradient(135deg, #409EFF 0%, #1890ff 100%);
}

.card-icon.soft {
  background: linear-gradient(135deg, #67C23A 0%, #52c41a 100%);
}

.card-icon.leadership {
  background: linear-gradient(135deg, #E6A23C 0%, #faad14 100%);
}

.card-icon.domain {
  background: linear-gradient(135deg, #F56C6C 0%, #ff4d4f 100%);
}

.card-number {
  font-size: 24px;
  font-weight: 600;
  color: #1f2937;
}

.card-label {
  font-size: 14px;
  color: #6b7280;
  margin-top: 4px;
}

.view-selector {
  margin-bottom: 30px;
  text-align: center;
}

.radar-view {
  background: white;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.radar-container {
  display: flex;
  align-items: center;
  gap: 40px;
}

.radar-chart {
  width: 400px;
  height: 400px;
  flex-shrink: 0;
}

.radar-legend {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 8px;
}

.legend-color {
  width: 12px;
  height: 12px;
  border-radius: 2px;
}

.legend-label {
  font-size: 14px;
  color: #374151;
}

.list-view {
  background: white;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.skill-filters {
  display: flex;
  gap: 16px;
  margin-bottom: 20px;
  flex-wrap: wrap;
}

.skill-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.skill-item {
  padding: 20px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  transition: all 0.2s;
  cursor: pointer;
}

.skill-item:hover {
  border-color: #409EFF;
  box-shadow: 0 2px 8px rgba(64, 158, 255, 0.1);
}

.skill-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.skill-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.skill-name {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #1f2937;
}

.skill-level {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 200px;
}

.level-text {
  font-size: 14px;
  font-weight: 500;
  color: #374151;
  white-space: nowrap;
}

.skill-details {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.skill-meta {
  display: flex;
  gap: 20px;
  flex-wrap: wrap;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: #6b7280;
}

.skill-actions {
  display: flex;
  gap: 8px;
}

.progress-view {
  background: white;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.progress-summary {
  margin-bottom: 30px;
}

.trend-chart {
  width: 100%;
  height: 300px;
  margin-top: 20px;
}

.progress-filters {
  margin-bottom: 20px;
}

.progress-record {
  background: #f8fafc;
  padding: 12px;
  border-radius: 6px;
}

.record-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.skill-name {
  font-weight: 600;
  color: #1f2937;
}

.level-change {
  font-size: 12px;
  color: #6b7280;
}

.record-content {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.record-notes {
  margin: 0;
  font-size: 14px;
  color: #374151;
}

.record-meta {
  display: flex;
  gap: 12px;
  align-items: center;
}

.assessor {
  font-size: 12px;
  color: #6b7280;
}

:deep(.el-progress-bar__outer) {
  background-color: #f0f0f0;
}

@media (max-width: 768px) {
  .radar-container {
    flex-direction: column;
    gap: 20px;
  }
  
  .radar-chart {
    width: 100%;
    max-width: 400px;
  }
  
  .skill-filters {
    flex-direction: column;
  }
  
  .skill-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }
  
  .skill-level {
    width: 100%;
  }
  
  .skill-details {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }
}
</style> 