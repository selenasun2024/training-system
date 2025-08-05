<template>
  <div class="trend-analysis-chart">
    <div ref="chartRef" class="chart-container"></div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, nextTick, watch } from 'vue'
import * as echarts from 'echarts'

interface Props {
  data: any
  view: 'overview' | 'compare' | 'predict'
}

const props = defineProps<Props>()

const emit = defineEmits<{
  anomalyClick: [anomaly: any]
}>()

const chartRef = ref<HTMLElement>()
let chartInstance: echarts.ECharts | null = null

// 模拟数据
const mockData = {
  overview: {
    categories: ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'],
    series: [
      {
        name: '活跃用户数',
        type: 'line',
        data: [1200, 1320, 1450, 1380, 1520, 1680, 1750, 1820, 1900, 1850, 1920, 2000],
        color: '#5470c6'
      },
      {
        name: '目标完成率',
        type: 'line',
        data: [65, 68, 72, 70, 75, 78, 80, 82, 85, 83, 87, 90],
        color: '#91cc75'
      },
      {
        name: '成长伙伴配对',
        type: 'bar',
        data: [180, 200, 220, 210, 240, 260, 280, 300, 320, 310, 340, 360],
        color: '#fac858'
      }
    ]
  },
  compare: {
    categories: ['1月', '2月', '3月', '4月', '5月', '6月'],
    departments: [
      {
        name: '技术部',
        data: [85, 88, 92, 89, 95, 98],
        color: '#5470c6'
      },
      {
        name: '产品部',
        data: [78, 82, 85, 83, 87, 90],
        color: '#91cc75'
      },
      {
        name: '运营部',
        data: [65, 68, 72, 70, 75, 78],
        color: '#fac858'
      },
      {
        name: '职能部门',
        data: [45, 48, 52, 50, 55, 58],
        color: '#ee6666'
      }
    ]
  },
  predict: {
    categories: ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'],
    actual: [1200, 1320, 1450, 1380, 1520, 1680, 1750, 1820],
    predicted: [1900, 1950, 2000, 2100],
    confidence: [
      [1850, 1950], [1900, 2000], [1950, 2050], [2050, 2150]
    ]
  }
}

const initOverviewChart = () => {
  const data = mockData.overview
  const option = {
    title: {
      text: '成长数据总览',
      left: 'center',
      textStyle: {
        fontSize: 16,
        fontWeight: 'bold'
      }
    },
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
      data: data.series.map(s => s.name),
      top: 40
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
      data: data.categories
    },
    yAxis: [
      {
        type: 'value',
        name: '用户数/完成率',
        position: 'left'
      },
      {
        type: 'value',
        name: '配对数',
        position: 'right'
      }
    ],
    series: data.series.map((s, index) => ({
      name: s.name,
      type: s.type,
      data: s.data,
      yAxisIndex: index === 2 ? 1 : 0,
      smooth: s.type === 'line',
      lineStyle: s.type === 'line' ? {
        color: s.color,
        width: 2
      } : undefined,
      itemStyle: {
        color: s.color
      },
      areaStyle: s.type === 'line' ? {
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
      } : undefined
    }))
  }
  
  chartInstance?.setOption(option)
}

const initCompareChart = () => {
  const data = mockData.compare
  const option = {
    title: {
      text: '部门成长活跃度对比',
      left: 'center',
      textStyle: {
        fontSize: 16,
        fontWeight: 'bold'
      }
    },
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'shadow'
      }
    },
    legend: {
      data: data.departments.map(d => d.name),
      top: 40
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
      data: data.categories
    },
    yAxis: {
      type: 'value',
      name: '活跃度 (%)'
    },
    series: data.departments.map(dept => ({
      name: dept.name,
      type: 'line',
      data: dept.data,
      smooth: true,
      lineStyle: {
        color: dept.color,
        width: 3
      },
      itemStyle: {
        color: dept.color
      },
      emphasis: {
        focus: 'series'
      }
    }))
  }
  
  chartInstance?.setOption(option)
}

const initPredictChart = () => {
  const data = mockData.predict
  const actualData = data.actual
  const predictedData = data.predicted
  const confidenceData = data.confidence
  
  const option = {
    title: {
      text: '成长趋势预测分析',
      left: 'center',
      textStyle: {
        fontSize: 16,
        fontWeight: 'bold'
      }
    },
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'cross'
      }
    },
    legend: {
      data: ['实际数据', '预测数据', '置信区间'],
      top: 40
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
      data: data.categories
    },
    yAxis: {
      type: 'value',
      name: '活跃用户数'
    },
    series: [
      {
        name: '实际数据',
        type: 'line',
        data: actualData,
        smooth: true,
        lineStyle: {
          color: '#5470c6',
          width: 3
        },
        itemStyle: {
          color: '#5470c6'
        }
      },
      {
        name: '预测数据',
        type: 'line',
        data: [...Array(8).fill(null), ...predictedData],
        smooth: true,
        lineStyle: {
          color: '#ee6666',
          width: 3,
          type: 'dashed'
        },
        itemStyle: {
          color: '#ee6666'
        }
      },
      {
        name: '置信区间',
        type: 'line',
        data: [...Array(8).fill(null), ...confidenceData.map(c => c[1])],
        lineStyle: {
          opacity: 0
        },
        stack: 'confidence-band',
        symbol: 'none'
      },
      {
        name: '置信区间下限',
        type: 'line',
        data: [...Array(8).fill(null), ...confidenceData.map(c => c[0])],
        lineStyle: {
          opacity: 0
        },
        areaStyle: {
          color: 'rgba(238, 102, 102, 0.2)'
        },
        stack: 'confidence-band',
        symbol: 'none'
      }
    ]
  }
  
  chartInstance?.setOption(option)
}

const initChart = () => {
  if (!chartRef.value) return

  chartInstance = echarts.init(chartRef.value)
  
  switch (props.view) {
    case 'overview':
      initOverviewChart()
      break
    case 'compare':
      initCompareChart()
      break
    case 'predict':
      initPredictChart()
      break
  }
}

const resizeChart = () => {
  if (chartInstance) {
    chartInstance.resize()
  }
}

onMounted(() => {
  nextTick(() => {
    initChart()
    window.addEventListener('resize', resizeChart)
  })
})

watch(() => props.view, () => {
  initChart()
})

watch(() => props.data, () => {
  initChart()
}, { deep: true })
</script>

<style scoped>
.trend-analysis-chart {
  width: 100%;
  height: 100%;
}

.chart-container {
  width: 100%;
  height: 100%;
}
</style> 