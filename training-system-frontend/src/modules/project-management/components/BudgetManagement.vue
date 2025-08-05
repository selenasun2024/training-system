<template>
  <div class="budget-management-container">
    <el-row :gutter="20">
      <!-- Left: Budget Chart -->
      <el-col :span="8">
        <el-card shadow="never">
          <template #header>
            <div class="card-header">
              <span>预算费用占比</span>
            </div>
          </template>
          <div ref="chartRef" style="height: 400px; width: 100%;"></div>
        </el-card>
      </el-col>

      <!-- Right: Budget Details Table -->
      <el-col :span="16">
        <el-card shadow="never">
          <template #header>
            <div class="card-header">
              <span>费用明细</span>
              <div class="actions">
                <el-button 
                  type="primary" 
                  :icon="Plus" 
                  @click="openDialog"
                  :disabled="isNewProject"
                >
                  新增费用
                </el-button>
                <el-text v-if="isNewProject" size="small" type="info" style="margin-left: 8px;">
                  请先保存项目基本信息
                </el-text>
              </div>
            </div>
          </template>
          <el-table :data="budgetItems" show-summary stripe style="width: 100%" :summary-method="getSummaries">
            <el-table-column
              prop="category"
              label="费用科目"
              width="120"
              :filters="categoryFilters"
              :filter-method="filterHandler"
            />
            <el-table-column prop="item" label="费用项目" />
            <el-table-column prop="budgetAmount" label="预算金额 (元)" align="left" sortable>
               <template #default="scope">¥{{ (scope.row.budgetAmount/100).toLocaleString() }}</template>
            </el-table-column>
            <el-table-column prop="notes" label="备注" />
            <el-table-column label="操作" width="120" align="center">
              <template #default="scope">
                <div class="operation-buttons">
                  <el-button type="primary" link :icon="Edit" size="small" @click="openDialog(scope.row)">编辑</el-button>
                  <el-button type="danger" link :icon="Delete" size="small" @click="handleDelete(scope.row)">删除</el-button>
                </div>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-col>
    </el-row>

    <!-- Add/Edit Dialog -->
    <el-dialog v-model="dialogVisible" title="新增费用" width="500px">
      <el-form :model="form" label-width="90px" :rules="rules" ref="formRef">
        <el-form-item label="费用科目" prop="category">
          <el-input v-model="form.category" placeholder="如 讲师费用" />
        </el-form-item>
        <el-form-item label="费用项目" prop="item">
          <el-input v-model="form.item" placeholder="如 李老师授课费" />
        </el-form-item>
        <el-form-item label="预算金额" prop="budgetAmount">
          <el-input-number v-model="form.budgetAmountDisplay" :min="0" :step="100" />
          <span class="ml-2">元</span>
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="form.notes" type="textarea" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible=false">取消</el-button>
        <el-button type="primary" @click="handleSubmit">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, shallowRef, computed, watch } from 'vue'
import { Plus, Edit, Delete } from '@element-plus/icons-vue'
import * as echarts from 'echarts'
import { useBudgetStore } from '@/stores/budget'
import { useRoute } from 'vue-router'
import { ElMessageBox, ElMessage } from 'element-plus'

const chartRef = ref<HTMLElement | null>(null)
const chartInstance = shallowRef<echarts.ECharts | null>(null)

// === Store ===
const route = useRoute()
const projectId = (route.params.id as string) || 'mock'
const budgetStore = useBudgetStore()

// 检查是否为新项目
const isNewProject = computed(() => projectId === 'new')

onMounted(() => {
  if (!isNewProject.value) {
    budgetStore.fetchBudget(projectId)
  }
})

const budgetItems = computed(() => budgetStore.budgetLines)

// 根据 store 生成 filters
const categoryFilters = computed(() => {
  const set = new Set(budgetItems.value.map((b) => b.category))
  return Array.from(set).map((text) => ({ text, value: text }))
})

const filterHandler = (value: string, row: any) => row.category === value

// 自定义汇总方法，正确处理单位转换
const getSummaries = (param: any) => {
  const { columns, data } = param
  const sums: string[] = []
  columns.forEach((column: any, index: number) => {
    if (index === 0) {
      sums[index] = 'Sum'
      return
    }
    if (column.property === 'budgetAmount') {
      const total = data.reduce((sum: number, item: any) => sum + (item.budgetAmount || 0), 0)
      sums[index] = `¥${(total / 100).toLocaleString()}`
    } else {
      sums[index] = '-'
    }
  })
  return sums
}

// ========== Chart ==========
const chartData = computed(() => budgetStore.chartData)

const setupChart = () => {
  if (!chartRef.value) return
  if (!chartInstance.value) chartInstance.value = echarts.init(chartRef.value)

  const option = {
    tooltip: { trigger: 'item', formatter: '{a} <br/>{b} : {c} ({d}%)' },
    legend: { orient: 'vertical', left: 'left' },
    series: [
      {
        name: '费用占比',
        type: 'pie',
        radius: '50%',
        data: chartData.value,
        emphasis: {
          itemStyle: { shadowBlur: 10, shadowOffsetX: 0, shadowColor: 'rgba(0,0,0,0.5)' },
        },
      },
    ],
  }
  chartInstance.value.setOption(option)
}

// 初始化 + 监听数据变化
onMounted(() => {
  setupChart()
  window.addEventListener('resize', () => chartInstance.value?.resize())
})

watch(chartData, () => {
  setupChart()
})

onBeforeUnmount(() => {
  chartInstance.value?.dispose()
  window.removeEventListener('resize', () => chartInstance.value?.resize())
})

// ===== Dialog =====
const dialogVisible = ref(false)
const formRef = ref()
const editingId = ref<string | null>(null)
const form = ref<{category:string; item:string; budgetAmountDisplay:number; notes?:string}>({
  category: '',
  item: '',
  budgetAmountDisplay: 0,
  notes: '',
})

const rules = {
  category: [{ required: true, message: '必填', trigger: 'blur' }],
  item: [{ required: true, message: '必填', trigger: 'blur' }],
  budgetAmount: [{ type: 'number', min: 1, message: '金额必须大于0', trigger: 'change' }],
}

function openDialog(row?: any) {
  if (row) {
    editingId.value = row.id
    form.value = {
      category: row.category,
      item: row.item,
      budgetAmountDisplay: row.budgetAmount/100,
      notes: row.notes,
    }
  } else {
    editingId.value = null
    form.value = { category: '', item: '', budgetAmountDisplay: 0, notes: '' }
  }
  dialogVisible.value = true
}

function handleSubmit() {
  formRef.value?.validate(async (valid: boolean) => {
    if (!valid) return
    
    // 检查项目ID是否有效
    if (projectId === 'new') {
      ElMessage.warning('请先保存项目基本信息再添加预算明细')
      return
    }
    
    try {
      if (editingId.value) {
        await budgetStore.updateLine(projectId, editingId.value, {
          category: form.value.category,
          item: form.value.item,
          budgetAmount: Math.round(form.value.budgetAmountDisplay * 100),
          notes: form.value.notes,
        })
        ElMessage.success('预算项目更新成功')
      } else {
        await budgetStore.createLines(projectId, [
          {
            category: form.value.category,
            item: form.value.item,
            budgetAmount: Math.round(form.value.budgetAmountDisplay * 100),
            notes: form.value.notes,
          },
        ])
        ElMessage.success('预算项目添加成功')
      }
      dialogVisible.value = false
    } catch (error) {
      console.error('预算保存失败:', error)
      ElMessage.error(`保存失败: ${error.message || '未知错误'}`)
    }
  })
}

async function handleDelete(row:any) {
  await ElMessageBox.confirm('确定删除该费用条目？', '提示', { type: 'warning' })
  await budgetStore.deleteLine(projectId, row.id)
  ElMessage.success('已删除')
}
</script>

<style scoped>
.budget-management-container {
  padding: 20px;
}
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.operation-buttons {
  display: flex;
  gap: 8px;
  justify-content: center;
  align-items: center;
}
</style> 