<template>
  <div class="kpi-card" @click="handleClick">
    <div class="kpi-header">
      <div class="kpi-icon" :style="{ backgroundColor: color }">
        <component :is="iconComponent" />
      </div>
      <div class="kpi-trend" :class="trendClass">
        <component :is="trendIcon" />
        <span>{{ change }}</span>
      </div>
    </div>
    <div class="kpi-content">
      <div class="kpi-value">{{ value }}</div>
      <div class="kpi-title">{{ title }}</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { 
  User, 
  Trophy, 
  UserFilled, 
  Warning,
  TrendCharts,
  ArrowUp,
  ArrowDown
} from '@element-plus/icons-vue'

interface Props {
  title: string
  value: string | number
  change: string
  trend: 'up' | 'down' | 'stable'
  color: string
  icon: string
}

const props = defineProps<Props>()

const emit = defineEmits<{
  click: []
}>()

// 图标映射
const iconMap = {
  user: User,
  target: Trophy,
  team: UserFilled,
  warning: Warning
}

// 计算属性
const iconComponent = computed(() => {
  return iconMap[props.icon as keyof typeof iconMap] || TrendCharts
})

const trendClass = computed(() => {
  return {
    'trend-up': props.trend === 'up',
    'trend-down': props.trend === 'down',
    'trend-stable': props.trend === 'stable'
  }
})

const trendIcon = computed(() => {
  switch (props.trend) {
    case 'up':
      return ArrowUp
    case 'down':
      return ArrowDown
    default:
      return TrendCharts
  }
})

const handleClick = () => {
  emit('click')
}
</script>

<style scoped>
.kpi-card {
  background: white;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  cursor: pointer;
  transition: all 0.3s ease;
  border: 1px solid transparent;
}

.kpi-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
  border-color: #e5e7eb;
}

.kpi-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.kpi-icon {
  width: 40px;
  height: 40px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 18px;
}

.kpi-trend {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  font-weight: 500;
}

.kpi-trend.trend-up {
  color: #67c23a;
}

.kpi-trend.trend-down {
  color: #f56c6c;
}

.kpi-trend.trend-stable {
  color: #909399;
}

.kpi-content {
  text-align: left;
}

.kpi-value {
  font-size: 28px;
  font-weight: 700;
  color: #1f2937;
  margin-bottom: 4px;
  line-height: 1.2;
}

.kpi-title {
  font-size: 14px;
  color: #6b7280;
  font-weight: 500;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .kpi-card {
    padding: 16px;
  }
  
  .kpi-value {
    font-size: 24px;
  }
  
  .kpi-icon {
    width: 36px;
    height: 36px;
    font-size: 16px;
  }
}
</style> 