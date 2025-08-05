<template>
  <div class="partner-network-graph">
    <div ref="chartRef" class="chart-container"></div>
    <div class="network-info">
      <div class="info-item">
        <span class="info-label">活跃伙伴:</span>
        <span class="info-value">{{ activePartners }}对</span>
      </div>
      <div class="info-item">
        <span class="info-label">关键连接者:</span>
        <span class="info-value">{{ keyConnectors }}人</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, nextTick, watch, computed } from 'vue'
import * as echarts from 'echarts'

interface Props {
  data: any
}

const props = defineProps<Props>()

const emit = defineEmits<{
  nodeClick: [personId: string]
}>()

const chartRef = ref<HTMLElement>()
let chartInstance: echarts.ECharts | null = null

// 模拟网络数据
const networkData = {
  nodes: [
    // 技术部门
    { id: 'tech-1', name: '张三', department: '技术部', role: '高级工程师', connections: 8, category: 0 },
    { id: 'tech-2', name: '李四', department: '技术部', role: '技术经理', connections: 12, category: 0 },
    { id: 'tech-3', name: '王五', department: '技术部', role: '架构师', connections: 15, category: 0 },
    { id: 'tech-4', name: '赵六', department: '技术部', role: '前端工程师', connections: 6, category: 0 },
    { id: 'tech-5', name: '陈七', department: '技术部', role: '后端工程师', connections: 7, category: 0 },
    
    // 产品部门
    { id: 'prod-1', name: '刘八', department: '产品部', role: '产品经理', connections: 10, category: 1 },
    { id: 'prod-2', name: '周九', department: '产品部', role: '产品设计师', connections: 8, category: 1 },
    { id: 'prod-3', name: '吴十', department: '产品部', role: '用户研究员', connections: 5, category: 1 },
    
    // 运营部门
    { id: 'ops-1', name: '郑一', department: '运营部', role: '运营经理', connections: 9, category: 2 },
    { id: 'ops-2', name: '孙二', department: '运营部', role: '市场专员', connections: 6, category: 2 },
    { id: 'ops-3', name: '何三', department: '运营部', role: '客服主管', connections: 4, category: 2 },
    
    // 跨部门连接者
    { id: 'cross-1', name: '林四', department: '技术部', role: '技术总监', connections: 20, category: 3 },
    { id: 'cross-2', name: '黄五', department: '产品部', role: '产品总监', connections: 18, category: 3 }
  ],
  links: [
    // 技术部内部连接
    { source: 'tech-1', target: 'tech-2', value: 5 },
    { source: 'tech-2', target: 'tech-3', value: 8 },
    { source: 'tech-3', target: 'tech-4', value: 4 },
    { source: 'tech-4', target: 'tech-5', value: 6 },
    { source: 'tech-1', target: 'tech-5', value: 3 },
    
    // 产品部内部连接
    { source: 'prod-1', target: 'prod-2', value: 7 },
    { source: 'prod-2', target: 'prod-3', value: 4 },
    { source: 'prod-1', target: 'prod-3', value: 5 },
    
    // 运营部内部连接
    { source: 'ops-1', target: 'ops-2', value: 6 },
    { source: 'ops-2', target: 'ops-3', value: 3 },
    { source: 'ops-1', target: 'ops-3', value: 4 },
    
    // 跨部门连接
    { source: 'cross-1', target: 'tech-1', value: 9 },
    { source: 'cross-1', target: 'tech-2', value: 10 },
    { source: 'cross-1', target: 'tech-3', value: 12 },
    { source: 'cross-1', target: 'prod-1', value: 8 },
    { source: 'cross-2', target: 'prod-1', value: 10 },
    { source: 'cross-2', target: 'prod-2', value: 9 },
    { source: 'cross-2', target: 'ops-1', value: 7 },
    
    // 其他跨部门连接
    { source: 'tech-2', target: 'prod-1', value: 6 },
    { source: 'prod-1', target: 'ops-1', value: 5 },
    { source: 'tech-3', target: 'prod-2', value: 4 }
  ]
}

// 计算统计数据
const activePartners = computed(() => {
  return Math.floor(networkData.links.length / 2)
})

const keyConnectors = computed(() => {
  return networkData.nodes.filter(node => node.connections > 10).length
})

// 获取节点颜色
const getNodeColor = (category: number) => {
  const colors = ['#5470c6', '#91cc75', '#fac858', '#ee6666']
  return colors[category] || '#73c0de'
}

// 获取节点大小
const getNodeSize = (connections: number) => {
  return Math.max(20, Math.min(60, connections * 3))
}

const initChart = () => {
  if (!chartRef.value) return

  chartInstance = echarts.init(chartRef.value)
  
  const option = {
    tooltip: {
      formatter: function(params: any) {
        if (params.dataType === 'node') {
          return `
            <div style="padding: 8px;">
              <div style="font-weight: bold; margin-bottom: 4px;">${params.data.name}</div>
              <div>部门: ${params.data.department}</div>
              <div>职位: ${params.data.role}</div>
              <div>伙伴连接: ${params.data.connections}个</div>
              <div style="font-size: 12px; color: #666; margin-top: 4px;">
                点击查看详细信息
              </div>
            </div>
          `
        } else {
          return `
            <div style="padding: 8px;">
              <div style="font-weight: bold; margin-bottom: 4px;">伙伴关系</div>
              <div>合作紧密度: ${params.data.value}</div>
              <div style="font-size: 12px; color: #666; margin-top: 4px;">
                共同目标和学习记录
              </div>
            </div>
          `
        }
      }
    },
    legend: {
      data: ['技术部', '产品部', '运营部', '管理层'],
      top: 10,
      itemGap: 20
    },
    series: [
      {
        name: '成长伙伴网络',
        type: 'graph',
        layout: 'force',
        data: networkData.nodes.map(node => ({
          ...node,
          symbolSize: getNodeSize(node.connections),
          itemStyle: {
            color: getNodeColor(node.category)
          },
          label: {
            show: true,
            position: 'bottom',
            fontSize: 10,
            fontWeight: 'bold'
          }
        })),
        links: networkData.links.map(link => ({
          ...link,
          lineStyle: {
            color: '#999',
            width: Math.max(1, link.value / 2),
            curveness: 0.1
          }
        })),
        categories: [
          { name: '技术部', itemStyle: { color: '#5470c6' } },
          { name: '产品部', itemStyle: { color: '#91cc75' } },
          { name: '运营部', itemStyle: { color: '#fac858' } },
          { name: '管理层', itemStyle: { color: '#ee6666' } }
        ],
        roam: true,
        focusNodeAdjacency: true,
        force: {
          repulsion: 1000,
          gravity: 0.1,
          edgeLength: 150,
          layoutAnimation: true
        },
        emphasis: {
          focus: 'adjacency',
          lineStyle: {
            width: 4
          }
        }
      }
    ]
  }

  chartInstance.setOption(option)

  // 添加点击事件
  chartInstance.on('click', (params: any) => {
    if (params.dataType === 'node') {
      emit('nodeClick', params.data.id)
    }
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
    initChart()
  }
}, { deep: true })
</script>

<style scoped>
.partner-network-graph {
  width: 100%;
  height: 100%;
  position: relative;
}

.chart-container {
  width: 100%;
  height: calc(100% - 50px);
}

.network-info {
  position: absolute;
  bottom: 10px;
  right: 20px;
  display: flex;
  gap: 16px;
  font-size: 12px;
}

.info-item {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.info-label {
  color: #666;
  margin-bottom: 2px;
}

.info-value {
  font-weight: bold;
  color: #1f2937;
}

@media (max-width: 768px) {
  .network-info {
    flex-direction: column;
    gap: 8px;
  }
  
  .info-item {
    flex-direction: row;
    gap: 8px;
  }
}
</style> 