<template>
  <div class="settlement-container">
    <el-row :gutter="20">
      <!-- 差异图表 -->
      <el-col :span="8">
        <el-card shadow="never">
          <template #header>决算差异分析</template>
          <div ref="chartRef" style="height:400px;width:100%"></div>
          <el-divider/>
          <div class="summary">
            <p>预算总额：<strong>¥{{ (totalBudget/100).toLocaleString() }}</strong></p>
            <p>实际总额：<strong>¥{{ (totalActual/100).toLocaleString() }}</strong></p>
            <p :class="{ negative: diff>0, positive: diff<0 }">差异：<strong>¥{{ (diff/100).toLocaleString() }}</strong></p>
          </div>
        </el-card>
      </el-col>

      <!-- 费用明细表 -->
      <el-col :span="16">
        <el-card shadow="never">
          <template #header>决算明细</template>
          <el-table :data="budgetLines" stripe>
            <el-table-column prop="category" label="费用科目" width="120"/>
            <el-table-column prop="item" label="费用项目"/>
            <el-table-column prop="budgetAmount" label="预算金额(元)" align="right">
              <template #default="scope">¥{{ (scope.row.budgetAmount/100).toLocaleString() }}</template>
            </el-table-column>
            <el-table-column prop="actualAmount" label="实际金额(元)" align="right">
              <template #default="scope">
                <el-input-number
                  v-model="scope.row.actualAmountDisplay"
                  :min="0"
                  @change="val => handleActualChange(scope.row, val)"
                  :precision="2"
                  :step="100"
                  size="small"
                  style="width: 120px;"
                />
              </template>
            </el-table-column>
            <el-table-column label="差异(元)" align="right">
              <template #default="scope">¥{{ ((scope.row.actualAmount||0 - scope.row.budgetAmount)/100).toLocaleString() }}</template>
            </el-table-column>
            <el-table-column prop="notes" label="备注"/>
          </el-table>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, watch, shallowRef } from 'vue'
import { useBudgetStore } from '@/stores/budget'
import { useRoute } from 'vue-router'
import * as echarts from 'echarts'

const chartRef = ref<HTMLElement | null>(null)
const chartInstance = shallowRef<echarts.ECharts | null>(null)

const route = useRoute()
const projectId = (route.params.id as string) || 'mock'
const budgetStore = useBudgetStore()

onMounted(() => {
  budgetStore.fetchBudget(projectId)
  initChart()
})

// 处理显示用的实际金额字段（转换为元）
const budgetLines = computed(() => {
  return budgetStore.budgetLines.map(line => ({
    ...line,
    actualAmountDisplay: line.actualAmount ? line.actualAmount / 100 : 0
  }))
})

const totalBudget = computed(() => budgetStore.totalBudget)
const totalActual = computed(() => budgetStore.totalActual)
const diff = computed(() => budgetStore.diff)

const chartData = computed(() => budgetLines.value.map(b=>({name:b.item, value: (b.actualAmount||0)-b.budgetAmount})))

// 处理实际金额变化
function handleActualChange(row: any, val: number) {
  if (val !== null && val !== undefined) {
    // 将元转换为分（乘以100）并更新store
    budgetStore.updateLine(projectId, row.id, { actualAmount: Math.round(val * 100) })
  }
}

function initChart(){
  if(!chartRef.value) return
  if(!chartInstance.value) chartInstance.value = echarts.init(chartRef.value)
  updateChart()
}

function updateChart(){
  if(!chartInstance.value) return
  chartInstance.value.setOption({
    tooltip:{trigger:'item'},
    xAxis:{type:'category', data: chartData.value.map(d=>d.name)},
    yAxis:{type:'value'},
    series:[{type:'bar', data: chartData.value.map(d=>d.value),
      itemStyle:{color:(val:any)=> val.value>0?'#f56c6c':'#67c23a'}}]
  })
}

watch(chartData, updateChart)
</script>

<style scoped>
.settlement-container{padding:20px}
.summary p{margin:4px 0}
.negative{color:#f56c6c}
.positive{color:#67c23a}
</style> 