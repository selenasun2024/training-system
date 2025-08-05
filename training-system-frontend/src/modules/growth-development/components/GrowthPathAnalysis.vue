<template>
  <div class="growth-path-analysis">
    <div ref="chartRef" class="chart-container"></div>
    <div class="path-legend">
      <div class="legend-item">
        <span class="legend-line" style="background: #5470c6"></span>
        <span>普通发展通道</span>
      </div>
      <div class="legend-item">
        <span class="legend-line" style="background: #fac858"></span>
        <span>精英发展通道</span>
      </div>
      <div class="legend-item">
        <span class="legend-line" style="background: #ee6666"></span>
        <span>继任者计划</span>
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

const chartRef = ref<HTMLElement>()
let chartInstance: echarts.ECharts | null = null

// 模拟桑基图数据
const mockData = {
  nodes: [
    // 当前职位
    { name: '初级工程师', category: 0 },
    { name: '中级工程师', category: 0 },
    { name: '高级工程师', category: 0 },
    { name: '初级产品', category: 0 },
    { name: '中级产品', category: 0 },
    { name: '运营专员', category: 0 },
    
    // 目标职位
    { name: '技术专家', category: 1 },
    { name: '架构师', category: 1 },
    { name: '技术经理', category: 1 },
    { name: '产品经理', category: 1 },
    { name: '高级产品经理', category: 1 },
    { name: '运营经理', category: 1 },
    { name: '部门总监', category: 1 },
    
    // 最终目标
    { name: '技术总监', category: 2 },
    { name: '产品总监', category: 2 },
    { name: '运营总监', category: 2 },
    { name: 'CTO', category: 2 },
    { name: 'CPO', category: 2 }
  ],
  links: [
    // 从当前职位到目标职位
    { source: '初级工程师', target: '中级工程师', value: 45 },
    { source: '中级工程师', target: '高级工程师', value: 32 },
    { source: '高级工程师', target: '技术专家', value: 18 },
    { source: '高级工程师', target: '架构师', value: 12 },
    { source: '高级工程师', target: '技术经理', value: 8 },
    
    { source: '初级产品', target: '中级产品', value: 25 },
    { source: '中级产品', target: '产品经理', value: 20 },
    { source: '产品经理', target: '高级产品经理', value: 15 },
    
    { source: '运营专员', target: '运营经理', value: 12 },
    
    // 从目标职位到最终目标
    { source: '技术专家', target: '技术总监', value: 8 },
    { source: '架构师', target: '技术总监', value: 6 },
    { source: '技术经理', target: '技术总监', value: 4 },
    { source: '技术总监', target: 'CTO', value: 3 },
    
    { source: '产品经理', target: '产品总监', value: 6 },
    { source: '高级产品经理', target: '产品总监', value: 8 },
    { source: '产品总监', target: 'CPO', value: 4 },
    
    { source: '运营经理', target: '运营总监', value: 5 },
    
    // 跨部门流动
    { source: '技术经理', target: '部门总监', value: 3 },
    { source: '产品经理', target: '部门总监', value: 2 },
    { source: '运营经理', target: '部门总监', value: 2 }
  ]
}

const initChart = () => {
  if (!chartRef.value) return

  chartInstance = echarts.init(chartRef.value)
  
  const option = {
    tooltip: {
      trigger: 'item',
      triggerOn: 'mousemove',
      formatter: function(params: any) {
        if (params.dataType === 'edge') {
          return `
            <div style="padding: 8px;">
              <div style="font-weight: bold; margin-bottom: 4px;">
                ${params.data.source} → ${params.data.target}
              </div>
              <div>流动人数: ${params.data.value}人</div>
              <div style="font-size: 12px; color: #666; margin-top: 4px;">
                职业路径转换
              </div>
            </div>
          `
        } else {
          return `
            <div style="padding: 8px;">
              <div style="font-weight: bold; margin-bottom: 4px;">${params.data.name}</div>
              <div>当前人数: ${params.data.value || 0}人</div>
              <div style="font-size: 12px; color: #666; margin-top: 4px;">
                职位节点
              </div>
            </div>
          `
        }
      }
    },
    series: [
      {
        type: 'sankey',
        layout: 'none',
        emphasis: {
          focus: 'adjacency'
        },
        data: mockData.nodes.map(node => ({
          ...node,
          itemStyle: {
            color: node.category === 0 ? '#5470c6' : 
                   node.category === 1 ? '#fac858' : '#ee6666'
          }
        })),
        links: mockData.links.map(link => ({
          ...link,
          lineStyle: {
            color: 'source',
            curveness: 0.5
          }
        })),
        lineStyle: {
          color: 'gradient',
          curveness: 0.5
        },
        label: {
          show: true,
          fontSize: 11,
          fontWeight: 'bold'
        },
        nodeWidth: 20,
        nodeGap: 8,
        layoutIterations: 32,
        orient: 'horizontal',
        draggable: false
      }
    ]
  }

  chartInstance.setOption(option)
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
    initChart()
  }
}, { deep: true })
</script>

<style scoped>
.growth-path-analysis {
  width: 100%;
  height: 100%;
  position: relative;
}

.chart-container {
  width: 100%;
  height: calc(100% - 50px);
}

.path-legend {
  position: absolute;
  bottom: 10px;
  left: 20px;
  display: flex;
  gap: 20px;
  flex-wrap: wrap;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: #666;
}

.legend-line {
  width: 20px;
  height: 3px;
  border-radius: 2px;
  display: inline-block;
}

@media (max-width: 768px) {
  .path-legend {
    flex-direction: column;
    gap: 8px;
  }
  
  .legend-item {
    font-size: 11px;
  }
}
</style> 