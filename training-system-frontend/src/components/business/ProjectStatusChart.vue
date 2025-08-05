<template>
  <div class="project-status-chart">
    <div class="filter-row">
      <el-date-picker
        v-model="dateRange"
        type="daterange"
        range-separator="~"
        start-placeholder="开始日期"
        end-placeholder="结束日期"
        style="width: 260px;"
      />
      <el-button type="primary" icon="Search" style="margin-left: 12px;" @click="loadData">筛选</el-button>
    </div>
    <div ref="chartRef" class="chart"></div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch, computed } from 'vue';
import * as echarts from 'echarts';
import { useDictStore } from '@/stores/dict';
import axios from 'axios';

interface Project {
  id: string;
  name: string;
  typeCode: string;
  typeName: string;
  startDate: string;
  endDate: string;
  status: string;
}

const dictStore = useDictStore();
const projectTypes = computed(() => dictStore.projectTypes);

const dateRange = ref<string[]>([]);
const chartRef = ref<HTMLDivElement | null>(null);
let chart: echarts.ECharts | null = null;

const statusList = [
  { key: 'upcoming', name: '即将开始', color: '#E6A23C' },
  { key: 'in-progress', name: '进行中', color: '#409EFF' },
  { key: 'completed', name: '已完成', color: '#67C23A' },
  { key: 'not-started', name: '未开始', color: '#909399' },
  { key: 'delayed', name: '延迟', color: '#F56C6C' },
  { key: 'cancelled', name: '已取消', color: '#C0C4CC' },
];

const myProjects = ref<Project[]>([]);

function getStatusByDate(p: Project, remindDays: number) {
  const today = new Date();
  const start = new Date(p.startDate);
  const end = new Date(p.endDate);
  const remind = new Date(start);
  remind.setDate(remind.getDate() - remindDays);
  if (today >= remind && today < start) return 'upcoming';
  if (today >= start && today <= end) return 'in-progress';
  if (today > end) return 'completed';
  return p.status || 'not-started';
}

function groupData() {
  // 按类型和状态分组统计
  const typeMap = Object.fromEntries(projectTypes.value.map(t => [t.code, t]));
  const result: Record<string, Record<string, Project[]>> = {};
  for (const t of projectTypes.value) {
    result[t.code] = {};
    for (const s of statusList) result[t.code][s.key] = [];
  }
  for (const p of myProjects.value) {
    const t = typeMap[p.typeCode];
    if (!t) continue;
    const remindDays = t.remindDays ?? 7;
    const status = getStatusByDate(p, remindDays);
    result[p.typeCode][status].push(p);
  }
  return result;
}

function renderChart() {
  if (!chart) return;
  const grouped = groupData();
  const types = projectTypes.value.map(t => t.code);
  const categories = projectTypes.value.map(t => t.name);
  const series = statusList.map(s => ({
    name: s.name,
    type: 'bar',
    stack: 'total',
    emphasis: { focus: 'series' },
    itemStyle: { color: s.color },
    data: types.map(code => grouped[code][s.key].length),
  }));
  chart.setOption({
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      formatter(params: any) {
        let html = '';
        params.forEach((item: any) => {
          const t = item.axisValue;
          html += `<div><span style='display:inline-block;margin-right:4px;border-radius:3px;width:10px;height:10px;background:${item.color}'></span>${item.seriesName}: ${item.value}`;
          // 展示项目名
          const code = types[item.dataIndex];
          const statusKey = statusList.find(s => s.name === item.seriesName)?.key;
          const projs = grouped[code][statusKey] || [];
          if (projs.length) {
            html += '<ul style="margin:0 0 0 16px;padding:0">';
            projs.forEach(p => html += `<li style='font-size:12px'>${p.name}</li>`);
            html += '</ul>';
          }
          html += '</div>';
        });
        return html;
      }
    },
    legend: { top: 0 },
    grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
    xAxis: { type: 'category', data: categories },
    yAxis: { type: 'value' },
    series,
  });
}

// 模拟异步接口请求"我负责的项目"
async function fetchMyProjects() {
  // TODO: 替换为真实接口
  // const { data } = await axios.get('/api/my-projects', { params: { startDate: dateRange.value?.[0], endDate: dateRange.value?.[1] } });
  // myProjects.value = data;
  // mock数据
  await new Promise(r => setTimeout(r, 500));
  myProjects.value = [
    { id: 'p1', name: '2024新员工A', typeCode: 'NEW_HIRE', typeName: '新员工入职培训', startDate: '2024-07-20', endDate: '2024-08-10', status: 'not-started' },
    { id: 'p2', name: '2024新员工B', typeCode: 'NEW_HIRE', typeName: '新员工入职培训', startDate: '2024-07-05', endDate: '2024-08-01', status: 'in-progress' },
    { id: 'p3', name: '干部入模子', typeCode: 'LEADERSHIP', typeName: '干部入模子培训', startDate: '2024-07-01', endDate: '2024-07-30', status: 'completed' },
    { id: 'p4', name: '战狼一期', typeCode: 'WOLF', typeName: '战狼培训', startDate: '2024-07-10', endDate: '2024-08-10', status: 'not-started' },
    { id: 'p5', name: '战狼二期', typeCode: 'WOLF', typeName: '战狼培训', startDate: '2024-07-15', endDate: '2024-08-20', status: 'not-started' },
    { id: 'p6', name: '海豹一期', typeCode: 'SEAL', typeName: '海豹培训', startDate: '2024-07-03', endDate: '2024-07-25', status: 'in-progress' },
  ];
}

async function loadData() {
  await dictStore.loadProjectTypes();
  await fetchMyProjects();
  renderChart();
}

onMounted(() => {
  loadData();
  if (chartRef.value) {
    chart = echarts.init(chartRef.value);
    window.addEventListener('resize', () => chart?.resize());
  }
});

watch(() => dictStore.projectTypes, () => renderChart());
watch(dateRange, () => renderChart());
</script>

<style scoped>
.project-status-chart {
  width: 100%;
}
.filter-row {
  margin-bottom: 12px;
  display: flex;
  align-items: center;
}
.chart {
  width: 100%;
  height: 300px;
}
</style> 