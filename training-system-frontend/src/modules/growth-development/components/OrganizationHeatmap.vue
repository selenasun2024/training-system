<template>
  <div class="organization-heatmap">
    <div ref="chartRef" class="chart-container"></div>
    <div class="legend">
      <div class="legend-item">
        <span class="legend-color" style="background: #ff4d4f"></span>
        <span>高活跃度 (80-100%)</span>
      </div>
      <div class="legend-item">
        <span class="legend-color" style="background: #ff7a45"></span>
        <span>中高活跃度 (60-80%)</span>
      </div>
      <div class="legend-item">
        <span class="legend-color" style="background: #ffa940"></span>
        <span>中等活跃度 (40-60%)</span>
      </div>
      <div class="legend-item">
        <span class="legend-color" style="background: #ffec3d"></span>
        <span>中低活跃度 (20-40%)</span>
      </div>
      <div class="legend-item">
        <span class="legend-color" style="background: #d9f7be"></span>
        <span>低活跃度 (0-20%)</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, nextTick, watch } from 'vue'
import * as echarts from 'echarts'

interface Props {
  data: any
}

const props = defineProps<Props>()

const emit = defineEmits<{
  nodeClick: [orgId: string]
}>()

const chartRef = ref<HTMLElement>()
let chartInstance: echarts.ECharts | null = null

// 模拟组织架构数据
const mockData = [
  { name: '集团总部', value: 85, children: [
    { name: '技术事业部', value: 92, children: [
      { name: '前端团队', value: 95 },
      { name: '后端团队', value: 88 },
      { name: '移动端团队', value: 90 },
      { name: '测试团队', value: 85 }
    ]},
    { name: '产品事业部', value: 78, children: [
      { name: '产品设计', value: 82 },
      { name: '用户研究', value: 75 },
      { name: '产品运营', value: 80 }
    ]},
    { name: '运营事业部', value: 65, children: [
      { name: '市场营销', value: 70 },
      { name: '客户服务', value: 60 },
      { name: '商务拓展', value: 68 }
    ]},
    { name: '职能部门', value: 45, children: [
      { name: '人力资源', value: 55 },
      { name: '财务部', value: 35 },
      { name: '行政部', value: 40 }
    ]}
  ]}
]

// 获取颜色
const getColor = (value: number) => {
  if (value >= 80) return '#ff4d4f'
  if (value >= 60) return '#ff7a45'
  if (value >= 40) return '#ffa940'
  if (value >= 20) return '#ffec3d'
  return '#d9f7be'
}

// 转换数据格式
const convertData = (data: any[]) => {
  return data.map(item => ({
    name: item.name,
    value: item.value,
    itemStyle: {
      color: getColor(item.value)
    },
    children: item.children ? convertData(item.children) : undefined
  }))
}

const initChart = () => {
  if (!chartRef.value) return

  chartInstance = echarts.init(chartRef.value)
  
  const option = {
    tooltip: {
      trigger: 'item',
      formatter: function(params: any) {
        return `
          <div style="padding: 8px;">
            <div style="font-weight: bold; margin-bottom: 4px;">${params.name}</div>
            <div>成长活跃度: ${params.value}%</div>
            <div style="font-size: 12px; color: #666; margin-top: 4px;">
              点击查看详细信息
            </div>
          </div>
        `
      }
    },
    series: [
      {
        name: '组织成长活跃度',
        type: 'treemap',
        width: '100%',
        height: '100%',
        roam: false,
        nodeClick: 'zoomToNode',
        data: convertData(mockData),
        breadcrumb: {
          show: false
        },
        label: {
          show: true,
          formatter: function(params: any) {
            return `${params.name}\n${params.value}%`
          },
          fontSize: 12,
          fontWeight: 'bold'
        },
        upperLabel: {
          show: true,
          height: 30,
          fontSize: 14,
          fontWeight: 'bold'
        },
        itemStyle: {
          borderColor: '#fff',
          borderWidth: 2,
          gapWidth: 2
        },
        emphasis: {
          itemStyle: {
            borderColor: '#409eff',
            borderWidth: 3
          }
        },
        levels: [
          {
            itemStyle: {
              borderColor: '#777',
              borderWidth: 0,
              gapWidth: 1
            },
            upperLabel: {
              show: false
            }
          },
          {
            itemStyle: {
              borderColor: '#555',
              borderWidth: 5,
              gapWidth: 1
            },
            emphasis: {
              itemStyle: {
                borderColor: '#409eff'
              }
            }
          },
          {
            colorSaturation: [0.35, 0.5],
            itemStyle: {
              borderWidth: 5,
              gapWidth: 1,
              borderColorSaturation: 0.6
            }
          }
        ]
      }
    ]
  }

  chartInstance.setOption(option)

  // 添加点击事件
  chartInstance.on('click', (params: any) => {
    emit('nodeClick', params.name)
  })
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

watch(() => props.data, () => {
  if (chartInstance) {
    // 更新数据时重新渲染
    initChart()
  }
}, { deep: true })
</script>

<style scoped>
.organization-heatmap {
  width: 100%;
  height: 100%;
  position: relative;
}

.chart-container {
  width: 100%;
  height: calc(100% - 60px);
}

.legend {
  position: absolute;
  bottom: 10px;
  left: 20px;
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: #666;
}

.legend-color {
  width: 12px;
  height: 12px;
  border-radius: 2px;
  display: inline-block;
}
</style> 