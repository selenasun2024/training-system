<template>
  <el-card class="chart-card" shadow="hover">
    <template #header>
      <div class="card-header">
        <span>{{ title }}</span>
        <el-tooltip content="刷新数据" placement="top">
          <el-button type="text" icon="el-icon-refresh" @click="handleRefresh" />
        </el-tooltip>
      </div>
    </template>
    <div ref="chart" class="chart-container"></div>
  </el-card>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue';
import * as echarts from 'echarts';
import type { EChartsOption } from 'echarts';

const props = defineProps<{
  title: string;
  options: EChartsOption;
  loading?: boolean;
}>();

const emit = defineEmits(['refresh']);

const chart = ref<HTMLElement | null>(null);
let myChart: echarts.ECharts | null = null;

onMounted(() => {
  if (chart.value) {
    myChart = echarts.init(chart.value);
    myChart.setOption(props.options);
  }
});

watch(() => props.options, (newOptions) => {
  if (myChart) {
    myChart.setOption(newOptions);
  }
}, { deep: true });

const handleRefresh = () => {
  emit('refresh');
};
</script>

<style scoped>
.chart-card {
  height: 100%;
}
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.chart-container {
  width: 100%;
  height: 300px;
}
</style> 