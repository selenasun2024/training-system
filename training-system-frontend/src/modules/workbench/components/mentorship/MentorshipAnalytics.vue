<template>
  <div class="mentorship-analytics">
    <!-- 工具栏 -->
    <div class="toolbar">
      <div class="toolbar-left">
        <el-date-picker
          v-model="dateRange"
          type="daterange"
          range-separator="至"
          start-placeholder="开始日期"
          end-placeholder="结束日期"
          format="YYYY-MM-DD"
          value-format="YYYY-MM-DD"
          style="width: 240px"
        />
        <el-select v-model="filterDepartment" placeholder="部门" style="width: 120px" clearable>
          <el-option label="全部" value="" />
          <el-option label="技术部" value="技术部" />
          <el-option label="产品部" value="产品部" />
          <el-option label="市场部" value="市场部" />
        </el-select>
      </div>
      <div class="toolbar-right">
        <el-button @click="exportReport">导出报告</el-button>
        <el-button @click="refreshData">刷新</el-button>
      </div>
    </div>

    <!-- 统计卡片 -->
    <div class="stats-cards">
      <el-card class="stat-card">
        <div class="stat-content">
          <div class="stat-number">{{ stats.totalMentors }}</div>
          <div class="stat-label">总导师数</div>
        </div>
      </el-card>
      <el-card class="stat-card">
        <div class="stat-content">
          <div class="stat-number">{{ stats.totalRelationships }}</div>
          <div class="stat-label">师徒关系数</div>
        </div>
      </el-card>
      <el-card class="stat-card">
        <div class="stat-content">
          <div class="stat-number">{{ stats.successRate }}%</div>
          <div class="stat-label">成功转正率</div>
        </div>
      </el-card>
      <el-card class="stat-card">
        <div class="stat-content">
          <div class="stat-number">{{ stats.avgRating }}</div>
          <div class="stat-label">平均评分</div>
        </div>
      </el-card>
    </div>

    <!-- 分析表格 -->
    <div class="analytics-tables">
      <!-- 导师绩效排行 -->
      <div class="table-section">
        <h4>导师绩效排行</h4>
        <el-table
          :data="mentorPerformance"
          style="width: 100%"
          border
          size="small"
        >
          <el-table-column type="index" label="排名" width="60" />
          <el-table-column label="导师姓名" width="120">
            <template #default="{ row }">
              <div class="mentor-name">{{ row.name }}</div>
            </template>
          </el-table-column>
          <el-table-column label="部门" width="100">
            <template #default="{ row }">
              {{ row.department }}
            </template>
          </el-table-column>
          <el-table-column label="带教人数" width="100">
            <template #default="{ row }">
              <div class="student-count">{{ row.studentCount }}人</div>
            </template>
          </el-table-column>
          <el-table-column label="转正率" width="100">
            <template #default="{ row }">
              <div class="success-rate" :class="getRateClass(row.successRate)">
                {{ row.successRate }}%
              </div>
            </template>
          </el-table-column>
          <el-table-column label="平均评分" width="100">
            <template #default="{ row }">
              <div class="avg-score">{{ row.avgScore }}分</div>
            </template>
          </el-table-column>
          <el-table-column label="补贴总额" width="100">
            <template #default="{ row }">
              <div class="subsidy-total">¥{{ row.subsidyTotal }}</div>
            </template>
          </el-table-column>
        </el-table>
      </div>

      <!-- 部门数据对比 -->
      <div class="table-section">
        <h4>部门数据对比</h4>
        <el-table
          :data="departmentStats"
          style="width: 100%"
          border
          size="small"
        >
          <el-table-column label="部门" width="120">
            <template #default="{ row }">
              <div class="department-name">{{ row.department }}</div>
            </template>
          </el-table-column>
          <el-table-column label="导师数" width="100">
            <template #default="{ row }">
              <div class="mentor-count">{{ row.mentorCount }}人</div>
            </template>
          </el-table-column>
          <el-table-column label="学员数" width="100">
            <template #default="{ row }">
              <div class="student-count">{{ row.studentCount }}人</div>
            </template>
          </el-table-column>
          <el-table-column label="活跃关系" width="100">
            <template #default="{ row }">
              <div class="active-relationships">{{ row.activeRelationships }}对</div>
            </template>
          </el-table-column>
          <el-table-column label="完成率" width="100">
            <template #default="{ row }">
              <div class="completion-rate" :class="getRateClass(row.completionRate)">
                {{ row.completionRate }}%
              </div>
            </template>
          </el-table-column>
          <el-table-column label="满意度" width="100">
            <template #default="{ row }">
              <div class="satisfaction">{{ row.satisfaction }}分</div>
            </template>
          </el-table-column>
        </el-table>
      </div>

      <!-- 趋势分析 -->
      <div class="table-section">
        <h4>月度趋势</h4>
        <el-table
          :data="monthlyTrends"
          style="width: 100%"
          border
          size="small"
        >
          <el-table-column label="月份" width="100">
            <template #default="{ row }">
              {{ row.month }}
            </template>
          </el-table-column>
          <el-table-column label="新增关系" width="100">
            <template #default="{ row }">
              <div class="new-relationships">{{ row.newRelationships }}对</div>
            </template>
          </el-table-column>
          <el-table-column label="完成关系" width="100">
            <template #default="{ row }">
              <div class="completed-relationships">{{ row.completedRelationships }}对</div>
            </template>
          </el-table-column>
          <el-table-column label="转正人数" width="100">
            <template #default="{ row }">
              <div class="promotions">{{ row.promotions }}人</div>
            </template>
          </el-table-column>
          <el-table-column label="补贴发放" width="120">
            <template #default="{ row }">
              <div class="subsidies-paid">¥{{ row.subsidiesPaid }}</div>
            </template>
          </el-table-column>
          <el-table-column label="评价完成率" width="120">
            <template #default="{ row }">
              <div class="evaluation-rate" :class="getRateClass(row.evaluationRate)">
                {{ row.evaluationRate }}%
              </div>
            </template>
          </el-table-column>
        </el-table>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'

// 响应式数据
const dateRange = ref(['2024-01-01', '2024-03-31'])
const filterDepartment = ref('')

// 统计数据
const stats = ref({
  totalMentors: 45,
  totalRelationships: 128,
  successRate: 87.5,
  avgRating: 4.6
})

// 导师绩效数据
const mentorPerformance = ref([
  {
    name: '王导师',
    department: '技术部',
    studentCount: 8,
    successRate: 95,
    avgScore: 4.9,
    subsidyTotal: 5200
  },
  {
    name: '李导师',
    department: '产品部',
    studentCount: 6,
    successRate: 90,
    avgScore: 4.7,
    subsidyTotal: 4800
  },
  {
    name: '陈导师',
    department: '技术部',
    studentCount: 5,
    successRate: 88,
    avgScore: 4.5,
    subsidyTotal: 3900
  },
  {
    name: '张导师',
    department: '市场部',
    studentCount: 4,
    successRate: 85,
    avgScore: 4.3,
    subsidyTotal: 3200
  }
])

// 部门统计数据
const departmentStats = ref([
  {
    department: '技术部',
    mentorCount: 18,
    studentCount: 52,
    activeRelationships: 35,
    completionRate: 89,
    satisfaction: 4.7
  },
  {
    department: '产品部',
    mentorCount: 12,
    studentCount: 38,
    activeRelationships: 24,
    completionRate: 85,
    satisfaction: 4.5
  },
  {
    department: '市场部',
    mentorCount: 15,
    studentCount: 38,
    activeRelationships: 21,
    completionRate: 82,
    satisfaction: 4.4
  }
])

// 月度趋势数据
const monthlyTrends = ref([
  {
    month: '2024-01',
    newRelationships: 25,
    completedRelationships: 18,
    promotions: 15,
    subsidiesPaid: 28500,
    evaluationRate: 92
  },
  {
    month: '2024-02',
    newRelationships: 32,
    completedRelationships: 22,
    promotions: 19,
    subsidiesPaid: 35200,
    evaluationRate: 88
  },
  {
    month: '2024-03',
    newRelationships: 28,
    completedRelationships: 26,
    promotions: 23,
    subsidiesPaid: 41800,
    evaluationRate: 95
  }
])

// 方法
const getRateClass = (rate: number) => {
  if (rate >= 90) return 'rate-excellent'
  if (rate >= 80) return 'rate-good'
  if (rate >= 70) return 'rate-fair'
  return 'rate-poor'
}

const exportReport = () => {
  ElMessage.success('分析报告导出功能开发中...')
}

const refreshData = () => {
  ElMessage.success('数据已刷新')
}

// 生命周期
onMounted(() => {
  // 初始化数据
})
</script>

<style scoped>
.mentorship-analytics {
  padding: 20px;
  background: #fff;
}

.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  padding: 16px;
  background: #f8f9fa;
  border-radius: 8px;
}

.toolbar-left {
  display: flex;
  gap: 12px;
  align-items: center;
}

.toolbar-right {
  display: flex;
  gap: 8px;
}

.stats-cards {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
  margin-bottom: 32px;
}

.stat-card {
  text-align: center;
}

.stat-content {
  padding: 16px;
}

.stat-number {
  font-size: 28px;
  font-weight: bold;
  color: #409eff;
  margin-bottom: 8px;
}

.stat-label {
  font-size: 14px;
  color: #606266;
}

.analytics-tables {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
}

.table-section {
  background: #fff;
  border-radius: 8px;
  overflow: hidden;
}

.table-section h4 {
  margin: 0 0 16px 0;
  padding: 16px 16px 0 16px;
  color: #303133;
  font-size: 16px;
  font-weight: 600;
}

.mentor-name,
.department-name {
  font-weight: 500;
  color: #303133;
}

.student-count,
.mentor-count,
.active-relationships,
.new-relationships,
.completed-relationships,
.promotions {
  color: #409eff;
  font-weight: 500;
}

.success-rate,
.completion-rate,
.evaluation-rate {
  font-weight: 600;
}

.rate-excellent {
  color: #67c23a;
}

.rate-good {
  color: #e6a23c;
}

.rate-fair {
  color: #f56c6c;
}

.rate-poor {
  color: #f56c6c;
}

.avg-score,
.satisfaction {
  color: #e6a23c;
  font-weight: 500;
}

.subsidy-total,
.subsidies-paid {
  color: #67c23a;
  font-weight: 500;
}

:deep(.el-card__body) {
  padding: 16px;
}

:deep(.el-table) {
  border-top: none;
}

:deep(.el-table .cell) {
  padding: 8px;
}
</style> 