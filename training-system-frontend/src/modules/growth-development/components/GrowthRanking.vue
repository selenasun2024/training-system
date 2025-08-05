<template>
  <div class="growth-ranking">
    <div class="ranking-header">
      <div class="ranking-tabs">
        <div 
          class="tab-item"
          :class="{ active: activeTab === 'overall' }"
          @click="activeTab = 'overall'"
        >
          综合排行
        </div>
        <div 
          class="tab-item"
          :class="{ active: activeTab === 'monthly' }"
          @click="activeTab = 'monthly'"
        >
          月度新星
        </div>
      </div>
    </div>
    
    <div class="ranking-list">
      <div 
        v-for="(item, index) in currentRankingData" 
        :key="item.id"
        class="ranking-item"
        :class="{ 'top-three': index < 3 }"
      >
        <div class="rank-number">
          <span v-if="index < 3" class="medal" :class="getMedalClass(index)">
            {{ index + 1 }}
          </span>
          <span v-else class="normal-rank">{{ index + 1 }}</span>
        </div>
        
        <div class="user-info">
          <div class="user-avatar">
            <img :src="item.avatar" :alt="item.name" />
          </div>
          <div class="user-details">
            <div class="user-name">{{ item.name }}</div>
            <div class="user-meta">
              <span class="department">{{ item.department }}</span>
              <span class="role">{{ item.role }}</span>
            </div>
          </div>
        </div>
        
        <div class="growth-metrics">
          <div class="metric-item">
            <span class="metric-label">成长积分</span>
            <span class="metric-value">{{ item.growthPoints }}</span>
          </div>
          <div class="metric-item">
            <span class="metric-label">目标完成</span>
            <span class="metric-value">{{ item.completedGoals }}</span>
          </div>
        </div>
        
        <div class="growth-areas">
          <el-tag 
            v-for="area in item.growthAreas" 
            :key="area"
            size="small"
            class="area-tag"
          >
            {{ area }}
          </el-tag>
        </div>
        
        <div class="trend-indicator">
          <el-icon v-if="item.trend === 'up'" class="trend-up">
            <ArrowUp />
          </el-icon>
          <el-icon v-else-if="item.trend === 'down'" class="trend-down">
            <ArrowDown />
          </el-icon>
                     <el-icon v-else class="trend-stable">
             <Remove />
           </el-icon>
          <span class="trend-value">{{ item.trendValue }}</span>
        </div>
      </div>
    </div>
    
    <div class="ranking-footer">
      <el-button text type="primary" @click="showMore">
        查看更多排行
      </el-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { ArrowUp, ArrowDown, Remove } from '@element-plus/icons-vue'

interface Props {
  data: any[]
}

const props = defineProps<Props>()

const activeTab = ref('overall')

// 模拟排行数据
const overallRankingData = [
  {
    id: 1,
    name: '张小明',
    department: '技术部',
    role: '高级工程师',
    avatar: '/api/placeholder/40/40',
    growthPoints: 2580,
    completedGoals: 12,
    growthAreas: ['Vue.js', '架构设计'],
    trend: 'up',
    trendValue: '+15%'
  },
  {
    id: 2,
    name: '李小红',
    department: '产品部',
    role: '产品经理',
    avatar: '/api/placeholder/40/40',
    growthPoints: 2420,
    completedGoals: 10,
    growthAreas: ['产品设计', '用户研究'],
    trend: 'up',
    trendValue: '+12%'
  },
  {
    id: 3,
    name: '王小强',
    department: '技术部',
    role: '架构师',
    avatar: '/api/placeholder/40/40',
    growthPoints: 2380,
    completedGoals: 11,
    growthAreas: ['微服务', '系统设计'],
    trend: 'stable',
    trendValue: '+2%'
  },
  {
    id: 4,
    name: '赵小美',
    department: '运营部',
    role: '运营经理',
    avatar: '/api/placeholder/40/40',
    growthPoints: 2150,
    completedGoals: 9,
    growthAreas: ['数据分析', '市场营销'],
    trend: 'up',
    trendValue: '+8%'
  },
  {
    id: 5,
    name: '陈小刚',
    department: '技术部',
    role: '前端工程师',
    avatar: '/api/placeholder/40/40',
    growthPoints: 1980,
    completedGoals: 8,
    growthAreas: ['React', 'TypeScript'],
    trend: 'down',
    trendValue: '-3%'
  }
]

const monthlyRankingData = [
  {
    id: 6,
    name: '刘小华',
    department: '产品部',
    role: '产品设计师',
    avatar: '/api/placeholder/40/40',
    growthPoints: 580,
    completedGoals: 4,
    growthAreas: ['UI设计', '用户体验'],
    trend: 'up',
    trendValue: '+45%'
  },
  {
    id: 7,
    name: '周小军',
    department: '技术部',
    role: '后端工程师',
    avatar: '/api/placeholder/40/40',
    growthPoints: 520,
    completedGoals: 3,
    growthAreas: ['Node.js', '数据库'],
    trend: 'up',
    trendValue: '+38%'
  },
  {
    id: 8,
    name: '吴小丽',
    department: '运营部',
    role: '市场专员',
    avatar: '/api/placeholder/40/40',
    growthPoints: 480,
    completedGoals: 3,
    growthAreas: ['内容营销', '社群运营'],
    trend: 'up',
    trendValue: '+32%'
  }
]

const currentRankingData = computed(() => {
  return activeTab.value === 'overall' ? overallRankingData : monthlyRankingData
})

const getMedalClass = (index: number) => {
  return ['gold', 'silver', 'bronze'][index]
}

const showMore = () => {
  console.log('Show more ranking data')
}
</script>

<style scoped>
.growth-ranking {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.ranking-header {
  margin-bottom: 16px;
}

.ranking-tabs {
  display: flex;
  border-bottom: 1px solid #e5e7eb;
}

.tab-item {
  padding: 8px 16px;
  cursor: pointer;
  font-size: 14px;
  color: #6b7280;
  border-bottom: 2px solid transparent;
  transition: all 0.3s ease;
}

.tab-item:hover {
  color: #409eff;
}

.tab-item.active {
  color: #409eff;
  border-bottom-color: #409eff;
  font-weight: 500;
}

.ranking-list {
  flex: 1;
  overflow-y: auto;
}

.ranking-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  margin-bottom: 8px;
  background: #f9fafb;
  border-radius: 8px;
  transition: all 0.3s ease;
}

.ranking-item:hover {
  background: #f3f4f6;
  transform: translateX(2px);
}

.ranking-item.top-three {
  background: linear-gradient(135deg, #fff7ed 0%, #fef3c7 100%);
  border: 1px solid #fbbf24;
}

.rank-number {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  border-radius: 50%;
}

.medal {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 12px;
  font-weight: bold;
}

.medal.gold {
  background: linear-gradient(135deg, #ffd700 0%, #ffed4e 100%);
}

.medal.silver {
  background: linear-gradient(135deg, #c0c0c0 0%, #e5e5e5 100%);
}

.medal.bronze {
  background: linear-gradient(135deg, #cd7f32 0%, #daa520 100%);
}

.normal-rank {
  color: #6b7280;
  font-size: 14px;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
}

.user-avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  overflow: hidden;
}

.user-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.user-details {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.user-name {
  font-weight: 500;
  color: #1f2937;
  font-size: 14px;
}

.user-meta {
  display: flex;
  gap: 8px;
  font-size: 12px;
  color: #6b7280;
}

.growth-metrics {
  display: flex;
  gap: 16px;
}

.metric-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
}

.metric-label {
  font-size: 11px;
  color: #6b7280;
}

.metric-value {
  font-weight: bold;
  color: #1f2937;
  font-size: 14px;
}

.growth-areas {
  display: flex;
  gap: 4px;
  flex-wrap: wrap;
}

.area-tag {
  font-size: 10px;
  height: 20px;
  line-height: 18px;
}

.trend-indicator {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  font-weight: 500;
  min-width: 60px;
}

.trend-up {
  color: #67c23a;
}

.trend-down {
  color: #f56c6c;
}

.trend-stable {
  color: #909399;
}

.trend-value {
  font-size: 11px;
}

.ranking-footer {
  text-align: center;
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid #e5e7eb;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .ranking-item {
    flex-direction: column;
    gap: 8px;
    align-items: flex-start;
  }
  
  .user-info {
    width: 100%;
  }
  
  .growth-metrics {
    width: 100%;
    justify-content: space-around;
  }
  
  .growth-areas {
    width: 100%;
  }
  
  .trend-indicator {
    align-self: flex-end;
  }
}
</style> 