<template>
  <div class="skill-trend-chart">
    <div class="chart-tabs">
      <div 
        class="tab-item"
        :class="{ active: activeTab === 'wordcloud' }"
        @click="activeTab = 'wordcloud'"
      >
        技能热度
      </div>
      <div 
        class="tab-item"
        :class="{ active: activeTab === 'trend' }"
        @click="activeTab = 'trend'"
      >
        趋势变化
      </div>
    </div>
    
    <!-- 词云图 -->
    <div 
      v-show="activeTab === 'wordcloud'"
      ref="wordcloudRef" 
      class="chart-container"
    ></div>
    
    <!-- 趋势图 -->
    <div 
      v-show="activeTab === 'trend'"
      ref="trendRef" 
      class="chart-container"
    ></div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, nextTick, watch } from 'vue'
import * as echarts from 'echarts'

interface Props {
  data: any
}

const props = defineProps<Props>()

const activeTab = ref('wordcloud')
const wordcloudRef = ref<HTMLElement>()
const trendRef = ref<HTMLElement>()
let wordcloudChart: echarts.ECharts | null = null
let trendChart: echarts.ECharts | null = null

// 模拟技能词云数据
const skillWordData = [
  { name: 'Vue.js', value: 156 },
  { name: 'React', value: 142 },
  { name: 'TypeScript', value: 138 },
  { name: 'Node.js', value: 125 },
  { name: 'Python', value: 118 },
  { name: '产品设计', value: 105 },
  { name: '数据分析', value: 98 },
  { name: '项目管理', value: 92 },
  { name: 'UI设计', value: 85 },
  { name: '微服务', value: 78 },
  { name: '人工智能', value: 72 },
  { name: '云计算', value: 68 },
  { name: '用户体验', value: 65 },
  { name: '敏捷开发', value: 58 },
  { name: '区块链', value: 45 },
  { name: '大数据', value: 42 },
  { name: '移动开发', value: 38 },
  { name: '测试自动化', value: 35 },
  { name: 'DevOps', value: 32 },
  { name: '安全技术', value: 28 }
]

// 模拟趋势数据
const skillTrendData = {
  categories: ['1月', '2月', '3月', '4月', '5月', '6月'],
  series: [
    {
      name: 'Vue.js',
      data: [120, 132, 145, 152, 158, 156],
      color: '#5470c6'
    },
    {
      name: 'React',
      data: [100, 115, 125, 135, 140, 142],
      color: '#91cc75'
    },
    {
      name: 'TypeScript',
      data: [80, 95, 110, 125, 135, 138],
      color: '#fac858'
    },
    {
      name: 'Python',
      data: [110, 118, 120, 122, 124, 125],
      color: '#ee6666'
    },
    {
      name: '产品设计',
      data: [85, 90, 95, 100, 103, 105],
      color: '#73c0de'
    }
  ]
}

const initWordcloud = () => {
  if (!wordcloudRef.value) return

  wordcloudChart = echarts.init(wordcloudRef.value)
  
  // 使用柱状图替代词云图
  const option = {
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'shadow'
      }
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      top: '10%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: skillWordData.slice(0, 10).map(item => item.name),
      axisLabel: {
        rotate: 45,
        fontSize: 10
      }
    },
    yAxis: {
      type: 'value',
      name: '学习人数'
    },
    series: [{
      name: '技能热度',
      type: 'bar',
      data: skillWordData.slice(0, 10).map((item, index) => ({
        value: item.value,
        itemStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: '#83bff6' },
            { offset: 0.5, color: '#188df0' },
            { offset: 1, color: '#188df0' }
          ])
        }
      })),
      emphasis: {
        itemStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: '#2378f7' },
            { offset: 0.7, color: '#2378f7' },
            { offset: 1, color: '#83bff6' }
          ])
        }
      }
    }]
  }

  wordcloudChart.setOption(option)
}

const initTrend = () => {
  if (!trendRef.value) return

  trendChart = echarts.init(trendRef.value)
  
  const option = {
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'cross',
        label: {
          backgroundColor: '#6a7985'
        }
      }
    },
    legend: {
      data: skillTrendData.series.map(s => s.name),
      top: 10
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      top: '15%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: skillTrendData.categories
    },
    yAxis: {
      type: 'value',
      name: '学习人数'
    },
    series: skillTrendData.series.map(s => ({
      name: s.name,
      type: 'line',
      smooth: true,
      data: s.data,
      lineStyle: {
        color: s.color,
        width: 2
      },
      itemStyle: {
        color: s.color
      },
      areaStyle: {
        color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
          {
            offset: 0,
            color: s.color
          },
          {
            offset: 1,
            color: 'rgba(255, 255, 255, 0.1)'
          }
        ])
      }
    }))
  }

  trendChart.setOption(option)
}

const resizeCharts = () => {
  if (wordcloudChart) {
    wordcloudChart.resize()
  }
  if (trendChart) {
    trendChart.resize()
  }
}

watch(activeTab, (newTab) => {
  nextTick(() => {
    if (newTab === 'wordcloud' && !wordcloudChart) {
      initWordcloud()
    } else if (newTab === 'trend' && !trendChart) {
      initTrend()
    }
    resizeCharts()
  })
})

onMounted(() => {
  nextTick(() => {
    initWordcloud()
    window.addEventListener('resize', resizeCharts)
  })
})

watch(() => props.data, () => {
  if (wordcloudChart) {
    initWordcloud()
  }
  if (trendChart) {
    initTrend()
  }
}, { deep: true })
</script>

<style scoped>
.skill-trend-chart {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.chart-tabs {
  display: flex;
  border-bottom: 1px solid #e5e7eb;
  margin-bottom: 12px;
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

.chart-container {
  flex: 1;
  width: 100%;
  min-height: 0;
}

@media (max-width: 768px) {
  .chart-tabs {
    font-size: 12px;
  }
  
  .tab-item {
    padding: 6px 12px;
    font-size: 12px;
  }
}
</style> 