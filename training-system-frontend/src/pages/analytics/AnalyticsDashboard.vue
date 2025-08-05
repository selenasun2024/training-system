<template>
  <div class="analytics-dashboard">
    <!-- 顶部筛选区 -->
    <el-card class="filter-section" shadow="never">
      <el-form :inline="true" :model="filters">
        <el-form-item label="时间范围">
          <el-date-picker
            v-model="filters.dateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
          />
        </el-form-item>
        <el-form-item label="项目状态">
          <el-select v-model="filters.projectStatus" placeholder="选择状态" clearable>
            <el-option label="计划中" value="planning" />
            <el-option label="进行中" value="active" />
            <el-option label="已完成" value="completed" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="onSearch">查询</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 核心指标区 -->
    <el-row :gutter="20" class="kpi-section">
      <el-col :span="6">
        <StatisticCard title="进行中项目" value="12" icon="el-icon-data-line" />
      </el-col>
      <el-col :span="6">
        <StatisticCard title="本月新增学员" value="85" icon="el-icon-user" />
      </el-col>
      <el-col :span="6">
        <StatisticCard title="待处理任务" value="8" icon="el-icon-bell" />
      </el-col>
      <el-col :span="6">
        <StatisticCard title="本周完训课程" value="126" icon="el-icon-check" />
      </el-col>
    </el-row>

    <!-- 图表展示区 -->
    <el-row :gutter="20" class="charts-section">
      <el-col :span="12">
        <ChartCard title="项目状态分布" :options="pieChartOptions" />
      </el-col>
      <el-col :span="12">
        <ChartCard title="月度培训时长趋势" :options="barChartOptions" />
      </el-col>
      <el-col :span="12">
        <ChartCard title="学员满意度" :options="radarChartOptions" />
      </el-col>
      <el-col :span="12">
        <ChartCard title="各部门参与人次" :options="horizontalBarChartOptions" />
      </el-col>
    </el-row>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue';
import StatisticCard from '@/components/business/StatisticCard.vue';
import ChartCard from '@/components/business/ChartCard.vue';
import type { EChartsOption } from 'echarts';

// 筛选条件
const filters = reactive({
  dateRange: '',
  projectStatus: '',
});

const onSearch = () => {
  console.log('Search with filters:', filters);
};

// Mock ECharts Options
const pieChartOptions = ref<EChartsOption>({
  tooltip: { trigger: 'item' },
  legend: { top: '5%', left: 'center' },
  series: [{
    name: '项目状态',
    type: 'pie',
    radius: ['40%', '70%'],
    avoidLabelOverlap: false,
    itemStyle: { borderRadius: 10, borderColor: '#fff', borderWidth: 2 },
    label: { show: false, position: 'center' },
    emphasis: { label: { show: true, fontSize: '20', fontWeight: 'bold' } },
    labelLine: { show: false },
    data: [
      { value: 12, name: '进行中' },
      { value: 8, name: '计划中' },
      { value: 25, name: '已完成' },
      { value: 5, name: '已归档' },
    ],
  }],
});

const barChartOptions = ref<EChartsOption>({
  xAxis: { type: 'category', data: ['一月', '二月', '三月', '四月', '五月', '六月'] },
  yAxis: { type: 'value' },
  tooltip: { trigger: 'axis' },
  series: [{ data: [120, 200, 150, 80, 70, 110], type: 'bar' }],
});

const radarChartOptions = ref<EChartsOption>({
  legend: { data: ['平均满意度'] },
  radar: {
    indicator: [
      { name: '课程内容', max: 5 },
      { name: '讲师水平', max: 5 },
      { name: '组织安排', max: 5 },
      { name: '培训效果', max: 5 },
      { name: '后勤支持', max: 5 },
    ],
  },
  series: [{
    name: '满意度',
    type: 'radar',
    data: [{ value: [4.5, 4.8, 4.2, 4.6, 4.0], name: '平均满意度' }],
  }],
});

const horizontalBarChartOptions = ref<EChartsOption>({
  tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
  yAxis: { type: 'category', data: ['研发部', '市场部', '销售部', '人事部', '财务部'] },
  xAxis: { type: 'value' },
  series: [{ data: [120, 200, 150, 80, 70], type: 'bar' }],
});
</script>

<style scoped>
.analytics-dashboard {
  padding: 20px;
}
.filter-section {
  margin-bottom: 20px;
}
.kpi-section {
  margin-bottom: 20px;
}
.charts-section .el-col {
  margin-bottom: 20px;
}
</style> 