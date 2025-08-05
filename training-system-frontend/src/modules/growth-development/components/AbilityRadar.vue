<template>
  <div class="ability-radar">
    <div class="radar-header">
      <h3>💪 能力雷达图</h3>
      <div class="radar-controls">
        <el-button size="small" @click="showComparison = !showComparison">
          {{ showComparison ? '隐藏对比' : '显示对比' }}
        </el-button>
        <el-button size="small" @click="showDetailDialog = true">
          详细评估
        </el-button>
      </div>
    </div>

    <div class="radar-chart" ref="radarChartRef"></div>

    <div class="ability-summary">
      <div class="summary-item" v-for="ability in abilities" :key="ability.name">
        <div class="ability-name">{{ ability.name }}</div>
        <div class="ability-progress">
          <el-progress 
            :percentage="ability.current" 
            :stroke-width="8"
            :color="getProgressColor(ability.current)"
          />
        </div>
        <div class="ability-level">{{ getAbilityLevel(ability.current) }}</div>
      </div>
    </div>

    <!-- 详细评估对话框 -->
    <el-dialog
      v-model="showDetailDialog"
      title="能力详细评估"
      width="800px"
    >
      <div class="detail-content">
        <div v-for="ability in abilities" :key="ability.name" class="ability-detail">
          <h4>{{ ability.name }}</h4>
          <div class="detail-info">
            <div class="current-level">
              <span class="label">当前水平：</span>
              <span class="value">{{ ability.current }}分 ({{ getAbilityLevel(ability.current) }})</span>
            </div>
            <div class="target-level" v-if="showComparison">
              <span class="label">目标水平：</span>
              <span class="value">{{ ability.target }}分 ({{ getAbilityLevel(ability.target) }})</span>
            </div>
            <div class="gap-analysis" v-if="showComparison">
              <span class="label">差距分析：</span>
              <span class="value" :class="{ 'negative': ability.current < ability.target }">
                {{ ability.current - ability.target > 0 ? '+' : '' }}{{ ability.current - ability.target }}分
              </span>
            </div>
          </div>
          <div class="improvement-suggestions">
            <h5>提升建议：</h5>
            <ul>
              <li v-for="suggestion in ability.suggestions" :key="suggestion">
                {{ suggestion }}
              </li>
            </ul>
          </div>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, nextTick } from 'vue'
import * as echarts from 'echarts'

// 响应式数据
const radarChartRef = ref<HTMLElement>()
const showComparison = ref(false)
const showDetailDialog = ref(false)
let radarChart: echarts.ECharts | null = null

// 能力数据
const abilities = ref([
  {
    name: '专业技能',
    current: 85,
    target: 90,
    suggestions: ['参加高级技术培训', '深入学习新技术栈', '参与开源项目贡献']
  },
  {
    name: '领导力',
    current: 70,
    target: 85,
    suggestions: ['参加领导力培训', '主导团队项目', '学习管理理论']
  },
  {
    name: '沟通能力',
    current: 80,
    target: 85,
    suggestions: ['参加演讲培训', '多参与跨部门协作', '提升书面表达能力']
  },
  {
    name: '学习能力',
    current: 90,
    target: 95,
    suggestions: ['建立系统化学习方法', '培养快速学习新技能的能力', '分享学习经验']
  },
  {
    name: '创新思维',
    current: 75,
    target: 80,
    suggestions: ['参加创新思维训练', '多关注行业前沿', '尝试新的解决方案']
  },
  {
    name: '团队协作',
    current: 88,
    target: 90,
    suggestions: ['参与更多团队项目', '提升冲突解决能力', '加强跨团队合作']
  }
])

// 获取能力等级
const getAbilityLevel = (score: number) => {
  if (score >= 90) return '优秀'
  if (score >= 80) return '良好'
  if (score >= 70) return '中等'
  if (score >= 60) return '及格'
  return '需改进'
}

// 获取进度条颜色
const getProgressColor = (score: number) => {
  if (score >= 90) return '#67c23a'
  if (score >= 80) return '#409eff'
  if (score >= 70) return '#e6a23c'
  if (score >= 60) return '#f56c6c'
  return '#f56c6c'
}

// 初始化雷达图
const initRadarChart = () => {
  if (!radarChartRef.value) return

  radarChart = echarts.init(radarChartRef.value)
  
  const option = {
    tooltip: {
      trigger: 'item'
    },
    legend: {
      data: showComparison.value ? ['当前能力', '目标能力'] : ['当前能力'],
      bottom: 0
    },
    radar: {
      indicator: abilities.value.map(item => ({
        name: item.name,
        max: 100
      })),
      radius: '70%',
      splitNumber: 5,
      splitLine: {
        lineStyle: {
          color: '#e4e7ed'
        }
      },
      splitArea: {
        areaStyle: {
          color: ['rgba(64, 158, 255, 0.1)', 'rgba(64, 158, 255, 0.05)']
        }
      }
    },
    series: [{
      name: '能力评估',
      type: 'radar',
      data: showComparison.value ? [
        {
          value: abilities.value.map(item => item.current),
          name: '当前能力',
          itemStyle: {
            color: '#409eff'
          },
          areaStyle: {
            color: 'rgba(64, 158, 255, 0.3)'
          }
        },
        {
          value: abilities.value.map(item => item.target),
          name: '目标能力',
          itemStyle: {
            color: '#67c23a'
          },
          areaStyle: {
            color: 'rgba(103, 194, 58, 0.2)'
          }
        }
      ] : [
        {
          value: abilities.value.map(item => item.current),
          name: '当前能力',
          itemStyle: {
            color: '#409eff'
          },
          areaStyle: {
            color: 'rgba(64, 158, 255, 0.3)'
          }
        }
      ]
    }]
  }

  radarChart.setOption(option)
}

// 更新雷达图
const updateRadarChart = () => {
  if (radarChart) {
    initRadarChart()
  }
}

// 组件挂载
onMounted(() => {
  nextTick(() => {
    initRadarChart()
  })
})

// 监听对比显示变化
const toggleComparison = () => {
  showComparison.value = !showComparison.value
  updateRadarChart()
}
</script>

<style scoped>
.ability-radar {
  background: white;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  height: 100%;
}

.radar-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.radar-header h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #303133;
}

.radar-controls {
  display: flex;
  gap: 8px;
}

.radar-chart {
  height: 300px;
  margin-bottom: 20px;
}

.ability-summary {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
}

.summary-item {
  padding: 12px;
  background: #f8f9fa;
  border-radius: 8px;
}

.ability-name {
  font-size: 14px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 8px;
}

.ability-progress {
  margin-bottom: 8px;
}

.ability-level {
  font-size: 12px;
  color: #909399;
  text-align: center;
}

/* 详细评估对话框样式 */
.detail-content {
  max-height: 600px;
  overflow-y: auto;
}

.ability-detail {
  margin-bottom: 24px;
  padding-bottom: 16px;
  border-bottom: 1px solid #e4e7ed;
}

.ability-detail:last-child {
  border-bottom: none;
}

.ability-detail h4 {
  margin: 0 0 12px 0;
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}

.detail-info {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 16px;
  margin-bottom: 16px;
}

.label {
  color: #909399;
  font-size: 14px;
}

.value {
  color: #303133;
  font-weight: 500;
}

.value.negative {
  color: #f56c6c;
}

.improvement-suggestions h5 {
  margin: 0 0 8px 0;
  font-size: 14px;
  color: #303133;
}

.improvement-suggestions ul {
  margin: 0;
  padding-left: 20px;
}

.improvement-suggestions li {
  font-size: 13px;
  color: #606266;
  margin-bottom: 4px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .radar-header {
    flex-direction: column;
    gap: 12px;
  }
  
  .radar-chart {
    height: 250px;
  }
  
  .ability-summary {
    grid-template-columns: 1fr;
  }
  
  .detail-info {
    grid-template-columns: 1fr;
  }
}
</style> 