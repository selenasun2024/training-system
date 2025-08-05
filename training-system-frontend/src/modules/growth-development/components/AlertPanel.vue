<template>
  <div class="alert-panel">
    <div class="alert-tabs">
      <div 
        class="tab-item"
        :class="{ active: activeTab === 'alerts' }"
        @click="activeTab = 'alerts'"
      >
        <el-icon><Warning /></el-icon>
        风险预警
        <el-badge v-if="alertCount > 0" :value="alertCount" class="tab-badge" />
      </div>
      <div 
        class="tab-item"
        :class="{ active: activeTab === 'suggestions' }"
        @click="activeTab = 'suggestions'"
      >
        <el-icon><Promotion /></el-icon>
        优化建议
      </div>
    </div>
    
    <!-- 风险预警 -->
    <div v-show="activeTab === 'alerts'" class="alert-content">
      <div class="alert-summary">
        <div class="summary-item high-risk">
          <span class="risk-count">{{ highRiskCount }}</span>
          <span class="risk-label">高风险</span>
        </div>
        <div class="summary-item medium-risk">
          <span class="risk-count">{{ mediumRiskCount }}</span>
          <span class="risk-label">中风险</span>
        </div>
        <div class="summary-item low-risk">
          <span class="risk-count">{{ lowRiskCount }}</span>
          <span class="risk-label">低风险</span>
        </div>
      </div>
      
      <div class="alert-list">
        <div 
          v-for="alert in alertData" 
          :key="alert.id"
          class="alert-item"
          :class="getRiskClass(alert.level)"
        >
          <div class="alert-icon">
            <el-icon v-if="alert.level === 'high'"><CircleCloseFilled /></el-icon>
            <el-icon v-else-if="alert.level === 'medium'"><WarningFilled /></el-icon>
            <el-icon v-else><InfoFilled /></el-icon>
          </div>
          
          <div class="alert-content">
            <div class="alert-title">{{ alert.title }}</div>
            <div class="alert-description">{{ alert.description }}</div>
            <div class="alert-meta">
              <span class="alert-time">{{ alert.time }}</span>
              <span class="alert-count">影响 {{ alert.affectedCount }} 人</span>
            </div>
          </div>
          
          <div class="alert-actions">
            <el-button 
              text 
              type="primary" 
              size="small"
              @click="handleAlert(alert)"
            >
              处理
            </el-button>
          </div>
        </div>
      </div>
    </div>
    
    <!-- 优化建议 -->
    <div v-show="activeTab === 'suggestions'" class="suggestion-content">
      <div class="suggestion-list">
        <div 
          v-for="suggestion in suggestionData" 
          :key="suggestion.id"
          class="suggestion-item"
        >
                     <div class="suggestion-icon">
             <el-icon><Promotion /></el-icon>
           </div>
          
          <div class="suggestion-content">
            <div class="suggestion-title">{{ suggestion.title }}</div>
            <div class="suggestion-description">{{ suggestion.description }}</div>
            <div class="suggestion-impact">
              <span class="impact-label">预期效果:</span>
              <span class="impact-value">{{ suggestion.expectedImpact }}</span>
            </div>
          </div>
          
          <div class="suggestion-actions">
            <el-button 
              text 
              type="primary" 
              size="small"
              @click="applySuggestion(suggestion)"
            >
              采纳
            </el-button>
            <el-button 
              text 
              size="small"
              @click="ignoreSuggestion(suggestion)"
            >
              忽略
            </el-button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { 
  Warning, 
  Promotion, 
  CircleCloseFilled, 
  WarningFilled, 
  InfoFilled 
} from '@element-plus/icons-vue'

interface Props {
  data: any[]
}

const props = defineProps<Props>()

const activeTab = ref('alerts')

// 模拟预警数据
const alertData = [
  {
    id: 1,
    level: 'high',
    title: '长期无成长活动',
    description: '技术部有15名员工超过30天未参与任何成长活动',
    time: '2小时前',
    affectedCount: 15
  },
  {
    id: 2,
    level: 'medium',
    title: '目标完成率偏低',
    description: '产品部Q1目标完成率仅为45%，低于预期',
    time: '1天前',
    affectedCount: 8
  },
  {
    id: 3,
    level: 'high',
    title: '成长伙伴孤立',
    description: '发现12名员工缺乏成长伙伴，存在学习孤立风险',
    time: '3天前',
    affectedCount: 12
  },
  {
    id: 4,
    level: 'low',
    title: '技能需求变化',
    description: 'AI相关技能需求增长40%，建议调整培训计划',
    time: '1周前',
    affectedCount: 25
  }
]

// 模拟建议数据
const suggestionData = [
  {
    id: 1,
    title: '增加技术分享会',
    description: '建议每周举办技术分享会，提高技术部门学习氛围',
    expectedImpact: '活跃度提升20%'
  },
  {
    id: 2,
    title: '优化成长伙伴匹配',
    description: '基于技能相似度和互补性优化伙伴匹配算法',
    expectedImpact: '配对成功率提升30%'
  },
  {
    id: 3,
    title: '设置阶段性里程碑',
    description: '为长期目标设置月度里程碑，提高完成率',
    expectedImpact: '目标完成率提升15%'
  },
  {
    id: 4,
    title: '引入游戏化机制',
    description: '增加成长积分、等级系统等游戏化元素',
    expectedImpact: '参与度提升25%'
  }
]

// 计算统计数据
const alertCount = computed(() => {
  return alertData.filter(alert => alert.level === 'high').length
})

const highRiskCount = computed(() => {
  return alertData.filter(alert => alert.level === 'high').length
})

const mediumRiskCount = computed(() => {
  return alertData.filter(alert => alert.level === 'medium').length
})

const lowRiskCount = computed(() => {
  return alertData.filter(alert => alert.level === 'low').length
})

const getRiskClass = (level: string) => {
  return `risk-${level}`
}

const handleAlert = (alert: any) => {
  console.log('Handle alert:', alert)
  // 处理预警逻辑
}

const applySuggestion = (suggestion: any) => {
  console.log('Apply suggestion:', suggestion)
  // 采纳建议逻辑
}

const ignoreSuggestion = (suggestion: any) => {
  console.log('Ignore suggestion:', suggestion)
  // 忽略建议逻辑
}
</script>

<style scoped>
.alert-panel {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.alert-tabs {
  display: flex;
  border-bottom: 1px solid #e5e7eb;
  margin-bottom: 16px;
}

.tab-item {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  cursor: pointer;
  font-size: 14px;
  color: #6b7280;
  border-bottom: 2px solid transparent;
  transition: all 0.3s ease;
  position: relative;
}

.tab-item:hover {
  color: #409eff;
}

.tab-item.active {
  color: #409eff;
  border-bottom-color: #409eff;
  font-weight: 500;
}

.tab-badge {
  position: absolute;
  top: 4px;
  right: 8px;
}

.alert-content,
.suggestion-content {
  flex: 1;
  overflow-y: auto;
}

.alert-summary {
  display: flex;
  gap: 12px;
  margin-bottom: 16px;
  padding: 12px;
  background: #f9fafb;
  border-radius: 8px;
}

.summary-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  flex: 1;
}

.risk-count {
  font-size: 20px;
  font-weight: bold;
}

.risk-label {
  font-size: 12px;
  color: #6b7280;
}

.summary-item.high-risk .risk-count {
  color: #f56c6c;
}

.summary-item.medium-risk .risk-count {
  color: #e6a23c;
}

.summary-item.low-risk .risk-count {
  color: #67c23a;
}

.alert-list,
.suggestion-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.alert-item,
.suggestion-item {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 12px;
  background: white;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
  transition: all 0.3s ease;
}

.alert-item:hover,
.suggestion-item:hover {
  border-color: #d1d5db;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.alert-item.risk-high {
  border-left: 4px solid #f56c6c;
  background: #fef2f2;
}

.alert-item.risk-medium {
  border-left: 4px solid #e6a23c;
  background: #fffbeb;
}

.alert-item.risk-low {
  border-left: 4px solid #67c23a;
  background: #f0f9ff;
}

.alert-icon,
.suggestion-icon {
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  flex-shrink: 0;
}

.alert-icon {
  background: #f3f4f6;
}

.suggestion-icon {
  background: #fef3c7;
  color: #d97706;
}

.alert-content,
.suggestion-content {
  flex: 1;
}

.alert-title,
.suggestion-title {
  font-weight: 500;
  color: #1f2937;
  margin-bottom: 4px;
  font-size: 14px;
}

.alert-description,
.suggestion-description {
  color: #6b7280;
  font-size: 13px;
  line-height: 1.4;
  margin-bottom: 6px;
}

.alert-meta {
  display: flex;
  gap: 12px;
  font-size: 12px;
  color: #9ca3af;
}

.suggestion-impact {
  display: flex;
  gap: 6px;
  font-size: 12px;
}

.impact-label {
  color: #6b7280;
}

.impact-value {
  color: #059669;
  font-weight: 500;
}

.alert-actions,
.suggestion-actions {
  display: flex;
  flex-direction: column;
  gap: 4px;
  flex-shrink: 0;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .alert-summary {
    flex-direction: column;
    gap: 8px;
  }
  
  .summary-item {
    flex-direction: row;
    justify-content: space-between;
  }
  
  .alert-item,
  .suggestion-item {
    flex-direction: column;
    gap: 8px;
  }
  
  .alert-actions,
  .suggestion-actions {
    flex-direction: row;
    align-self: flex-end;
  }
}
</style> 