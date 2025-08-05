<template>
  <div class="evaluation-management">
    <!-- 工具栏 -->
    <div class="toolbar">
      <div class="toolbar-left">
        <el-input
          v-model="searchKeyword"
          placeholder="搜索带教老师或学员名称"
          style="width: 200px"
          clearable
          @input="handleSearchChange"
        >
          <template #prefix>
            <el-icon><Search /></el-icon>
          </template>
        </el-input>
        <el-select v-model="filterProject" placeholder="选择项目" style="width: 200px" clearable>
          <el-option label="全部项目" value="" />
          <el-option
            v-for="project in projects"
            :key="project.id"
            :label="project.name"
            :value="project.id"
          />
        </el-select>
        <el-select v-model="filterEvaluationType" placeholder="评价类型" style="width: 150px" clearable>
          <el-option label="全部类型" value="" />
          <el-option label="学员评价带教老师" value="student_to_mentor" />
          <el-option label="带教老师评价学员" value="mentor_to_student" />
          <el-option label="师徒互评" value="mutual" />
        </el-select>
        <el-select v-model="filterStatus" placeholder="评价状态" style="width: 120px" clearable>
          <el-option label="全部状态" value="" />
          <el-option label="待评价" value="pending" />
          <el-option label="已完成" value="completed" />
          <el-option label="已过期" value="expired" />
        </el-select>
        <el-select v-model="filterFollowupStatus" placeholder="回访状态" style="width: 120px" clearable>
          <el-option label="全部" value="" />
          <el-option label="待回访" value="pending_followup" />
          <el-option label="已回访" value="completed_followup" />
          <el-option label="无需回访" value="no_followup" />
        </el-select>
      </div>
      <div class="toolbar-right">
        <el-button @click="exportData">导出数据</el-button>
        <el-button @click="refreshData">刷新</el-button>
      </div>
    </div>

    <!-- 统计面板 -->
    <div class="stats-panel">
      <div class="stat-item">
        <div class="stat-number">{{ stats.totalEvaluations }}</div>
        <div class="stat-label">总评价数</div>
      </div>
      <div class="stat-item">
        <div class="stat-number">{{ stats.pendingEvaluations }}</div>
        <div class="stat-label">待评价</div>
      </div>
      <div class="stat-item">
        <div class="stat-number">{{ stats.completedEvaluations }}</div>
        <div class="stat-label">已完成</div>
      </div>
      <div class="stat-item">
        <div class="stat-number">{{ stats.pendingFollowups }}</div>
        <div class="stat-label">待回访</div>
      </div>
    </div>

    <!-- 评价记录表格 -->
    <el-table
      :data="filteredEvaluations"
      v-loading="loading"
      style="width: 100%"
      border
      @row-click="handleRowClick"
      @sort-change="handleSortChange"
    >
      <el-table-column label="评价模板" prop="templateName" min-width="120" sortable="custom">
        <template #default="{ row }">
          <div class="template-info">
            <el-icon><Document /></el-icon>
            <span>{{ row.templateName }}</span>
          </div>
        </template>
      </el-table-column>

      <el-table-column label="项目信息" prop="projectName" min-width="160" sortable="custom">
        <template #default="{ row }">
          <div class="project-info">
            <div class="project-name">{{ row.projectName }}</div>
            <div class="project-phase">{{ row.phaseName || '整体项目' }}</div>
          </div>
        </template>
      </el-table-column>

      <el-table-column label="评价类型" prop="evaluationType" width="120" sortable="custom">
        <template #default="{ row }">
          <el-tag :type="getEvaluationTypeColor(row.evaluationType)" size="small">
            {{ getEvaluationTypeText(row.evaluationType) }}
          </el-tag>
        </template>
      </el-table-column>

      <el-table-column label="师徒信息" min-width="160">
        <template #default="{ row }">
          <div class="mentor-student-info">
            <div class="mentor-info">
              <span class="label">带教老师：</span>
              <span class="name">{{ row.mentorName }}</span>
            </div>
            <div class="student-info">
              <span class="label">学员：</span>
              <span class="name">{{ row.studentName }}</span>
            </div>
          </div>
        </template>
      </el-table-column>

      <el-table-column label="评价得分" width="90">
        <template #default="{ row }">
          <div v-if="row.status === 'completed'" class="score-display">
            <div class="score">{{ row.totalScore }}分</div>
            <div class="score-level" :class="getScoreLevel(row.totalScore)">
              {{ getScoreLevelText(row.totalScore) }}
            </div>
          </div>
          <span v-else class="pending-text">-</span>
        </template>
      </el-table-column>

      <el-table-column label="评价状态" width="85">
        <template #default="{ row }">
          <el-tag :type="getStatusColor(row.status)" size="small">
            {{ getStatusText(row.status) }}
          </el-tag>
        </template>
      </el-table-column>

      <el-table-column label="评价时间" width="110">
        <template #default="{ row }">
          {{ row.completedAt ? formatDate(row.completedAt) : '-' }}
        </template>
      </el-table-column>

      <el-table-column label="回访状态" width="85">
        <template #default="{ row }">
          <el-tag :type="getFollowupColor(row.followupStatus)" size="small">
            {{ getFollowupText(row.followupStatus) }}
          </el-tag>
        </template>
      </el-table-column>

      <el-table-column label="操作" width="180" fixed="right">
        <template #default="{ row }">
          <div class="operation-buttons">
            <el-button
              type="primary"
              size="small"
              @click.stop="viewEvaluationDetail(row)"
            >
              查看详情
            </el-button>
            
            <el-button
              v-if="row.status === 'completed' && row.followupStatus === 'pending_followup'"
              type="success"
              size="small"
              @click.stop="handleFollowup(row)"
            >
              教务回访
            </el-button>
            <el-button
              v-else-if="row.followupStatus === 'completed_followup'"
              type="info"
              size="small"
              @click.stop="viewFollowupRecord(row)"
            >
              查看回访
            </el-button>
          </div>
        </template>
      </el-table-column>
    </el-table>

    <!-- 分页器 -->
    <div class="pagination-wrapper">
      <el-pagination
        v-model:current-page="pagination.page"
        v-model:page-size="pagination.pageSize"
        :total="pagination.total"
        :page-sizes="[10, 20, 50]"
        layout="total, sizes, prev, pager, next, jumper"
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
      />
    </div>

    <!-- 教务回访对话框 -->
    <el-dialog
      v-model="showFollowupDialog"
      title="教务回访"
      width="600px"
      :close-on-click-modal="false"
    >
      <FollowupForm
        v-if="selectedEvaluation"
        :evaluation="selectedEvaluation"
        @submit="handleFollowupSubmit"
        @cancel="showFollowupDialog = false"
      />
    </el-dialog>

    <!-- 评价详情对话框 -->
    <el-dialog
      v-model="showDetailDialog"
      title="评价详情"
      width="800px"
    >
      <EvaluationDetail
        v-if="selectedEvaluation"
        :evaluation="selectedEvaluation"
      />
    </el-dialog>

    <!-- 回访记录对话框 -->
    <el-dialog
      v-model="showFollowupRecordDialog"
      title="回访记录"
      width="600px"
    >
      <FollowupRecord
        v-if="selectedEvaluation"
        :evaluation="selectedEvaluation"
      />
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { Search, Document } from '@element-plus/icons-vue'
import FollowupForm from './evaluation/FollowupForm.vue'
import EvaluationDetail from './evaluation/EvaluationDetail.vue'
import FollowupRecord from './evaluation/FollowupRecord.vue'
import { 
  getAllEvaluations, 
  getEvaluationStats, 
  getEvaluationDetail,
  submitFollowup,
  getFollowupRecord,
  getProjectsForFilter,
  type EvaluationOverview,
  type EvaluationStats
} from '@/api/modules/evaluation-management'

// 响应式数据
const loading = ref(false)
const searchKeyword = ref('')
const searchTimeout = ref<NodeJS.Timeout | null>(null)
const filterProject = ref('')
const filterEvaluationType = ref('')
const filterStatus = ref('')
const filterFollowupStatus = ref('')
const showFollowupDialog = ref(false)
const showDetailDialog = ref(false)
const showFollowupRecordDialog = ref(false)
const selectedEvaluation = ref<any>(null)

// 排序相关
const sortField = ref('')
const sortOrder = ref('')

// 分页数据
const pagination = ref({
  page: 1,
  pageSize: 20,
  total: 0
})

// 数据
const projects = ref<any[]>([])
const stats = ref<EvaluationStats>({
  totalEvaluations: 0,
  pendingEvaluations: 0,
  completedEvaluations: 0,
  pendingFollowups: 0
})
const evaluations = ref<EvaluationOverview[]>([])
const allEvaluations = ref<EvaluationOverview[]>([])

// 计算属性
const filteredEvaluations = computed(() => {
  const start = (pagination.value.page - 1) * pagination.value.pageSize
  const end = start + pagination.value.pageSize
  return evaluations.value.slice(start, end)
})

// 方法
const getEvaluationTypeColor = (type: string) => {
  const colorMap: Record<string, string> = {
    student_to_mentor: 'success',
    mentor_to_student: 'warning',
    mutual: 'info'
  }
  return colorMap[type] || 'info'
}

const getEvaluationTypeText = (type: string) => {
  const textMap: Record<string, string> = {
    student_to_mentor: '学员评价带教老师',
    mentor_to_student: '带教老师评价学员',
    mutual: '师徒互评'
  }
  return textMap[type] || type
}

const getStatusColor = (status: string) => {
  const colorMap: Record<string, string> = {
    pending: 'warning',
    completed: 'success',
    expired: 'danger'
  }
  return colorMap[status] || 'info'
}

const getStatusText = (status: string) => {
  const textMap: Record<string, string> = {
    pending: '待评价',
    completed: '已完成',
    expired: '已过期'
  }
  return textMap[status] || status
}

const getFollowupColor = (status: string) => {
  const colorMap: Record<string, string> = {
    pending_followup: 'warning',
    completed_followup: 'success',
    no_followup: 'info'
  }
  return colorMap[status] || 'info'
}

const getFollowupText = (status: string) => {
  const textMap: Record<string, string> = {
    pending_followup: '待回访',
    completed_followup: '已回访',
    no_followup: '无需回访'
  }
  return textMap[status] || status
}

const getScoreLevel = (score: number) => {
  if (score >= 90) return 'excellent'
  if (score >= 80) return 'good'
  if (score >= 70) return 'average'
  return 'poor'
}

const getScoreLevelText = (score: number) => {
  if (score >= 90) return '优秀'
  if (score >= 80) return '良好'
  if (score >= 70) return '一般'
  return '较差'
}

const formatDate = (date: Date | string) => {
  if (!date) return '-'
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleDateString('zh-CN')
}

const handleRowClick = (row: any) => {
  console.log('点击行:', row)
}

const handleSortChange = ({ prop, order }: any) => {
  console.log('🔧 表格排序:', prop, order)
  sortField.value = prop || ''
  sortOrder.value = order || ''
  pagination.value.page = 1
  loadEvaluations()
}

const handleSearchChange = () => {
  // 延迟搜索，避免频繁调用API
  clearTimeout(searchTimeout.value)
  searchTimeout.value = setTimeout(() => {
    pagination.value.page = 1
    loadEvaluations()
  }, 500)
}

// 数据加载方法
const loadEvaluations = async () => {
  loading.value = true
  try {
    const params = {
      page: pagination.value.page,
      pageSize: pagination.value.pageSize,
      projectId: filterProject.value || undefined,
      evaluationType: filterEvaluationType.value || undefined,
      status: filterStatus.value || undefined,
      followupStatus: filterFollowupStatus.value || undefined,
      search: searchKeyword.value || undefined,
      sortField: sortField.value || undefined,
      sortOrder: sortOrder.value === 'ascending' ? 'asc' : sortOrder.value === 'descending' ? 'desc' : undefined
    }

    const response = await getAllEvaluations(params)
    evaluations.value = response.evaluations || []
    pagination.value.total = response.total || 0
    
    console.log('✅ 加载评价数据成功:', evaluations.value.length, '条')
  } catch (error) {
    console.error('❌ 加载评价数据失败:', error)
    ElMessage.error('加载评价数据失败')
    evaluations.value = []
  } finally {
    loading.value = false
  }
}

const loadStats = async () => {
  try {
    const response = await getEvaluationStats()
    stats.value = response
  } catch (error) {
    console.error('❌ 加载统计数据失败:', error)
    // 统计数据失败不影响主要功能，只是记录错误
  }
}

const loadProjects = async () => {
  try {
    const response = await getProjectsForFilter()
    projects.value = response.projects || []
  } catch (error) {
    console.error('❌ 加载项目列表失败:', error)
    // 提供默认的空列表
    projects.value = []
  }
}

const viewEvaluationDetail = async (evaluation: any) => {
  try {
    const detailResponse = await getEvaluationDetail(evaluation.id)
    selectedEvaluation.value = { ...evaluation, ...detailResponse }
    showDetailDialog.value = true
  } catch (error) {
    console.error('获取评价详情失败:', error)
    ElMessage.error('获取评价详情失败')
  }
}

const handleFollowup = (evaluation: any) => {
  selectedEvaluation.value = evaluation
  showFollowupDialog.value = true
}

const viewFollowupRecord = async (evaluation: any) => {
  try {
    const followupResponse = await getFollowupRecord(evaluation.id)
    selectedEvaluation.value = { ...evaluation, followupRecord: followupResponse }
    showFollowupRecordDialog.value = true
  } catch (error) {
    console.error('获取回访记录失败:', error)
    ElMessage.error('获取回访记录失败')
  }
}

const handleFollowupSubmit = async (followupData: any) => {
  try {
    await submitFollowup(selectedEvaluation.value.id, followupData)
    
    // 刷新数据
    await loadEvaluations()
    await loadStats()
    
    showFollowupDialog.value = false
    ElMessage.success('教务回访记录已保存')
  } catch (error) {
    console.error('提交教务回访失败:', error)
    ElMessage.error('提交教务回访失败')
  }
}

const exportData = async () => {
  try {
    // 获取所有数据进行导出
    const allParams = {
      page: 1,
      pageSize: 9999,
      projectId: filterProject.value || undefined,
      evaluationType: filterEvaluationType.value || undefined,
      status: filterStatus.value || undefined,
      followupStatus: filterFollowupStatus.value || undefined
    }

    const response = await getAllEvaluations(allParams)
    const allEvaluations = response.evaluations || []
    
    if (allEvaluations.length === 0) {
      ElMessage.warning('没有可导出的数据')
      return
    }

    // 准备导出数据
    const exportEvaluations = allEvaluations.map(evaluation => ({
      '项目名称': evaluation.projectName,
      '阶段名称': evaluation.phaseName || '全项目',
      '评价类型': getEvaluationTypeText(evaluation.evaluationType),
      '导师姓名': evaluation.mentorName,
      '学员姓名': evaluation.studentName,
      '评价得分': evaluation.totalScore ? `${evaluation.totalScore}分` : '未评分',
      '评价状态': getStatusText(evaluation.status),
      '回访状态': getFollowupText(evaluation.followupStatus),
      '完成时间': evaluation.completedAt ? formatDate(evaluation.completedAt) : '未完成',
      '创建时间': formatDate(evaluation.createdAt)
    }))

    // 创建CSV格式数据
    const headers = ['项目名称', '阶段名称', '评价类型', '导师姓名', '学员姓名', '评价得分', '评价状态', '回访状态', '完成时间', '创建时间']
    const csvRows = []
    
    // 添加表头
    csvRows.push(headers.join(','))
    
    // 添加数据行
    exportEvaluations.forEach(row => {
      const values = headers.map(header => {
        const value = row[header] || ''
        return `"${value.toString().replace(/"/g, '""')}"`
      })
      csvRows.push(values.join(','))
    })
    
    const csvContent = csvRows.join('\n')
    const BOM = '\uFEFF'
    const csvWithBOM = BOM + csvContent

    // 生成文件名
    const now = new Date()
    const fileName = `评价管理数据_${now.getFullYear()}${(now.getMonth() + 1).toString().padStart(2, '0')}${now.getDate().toString().padStart(2, '0')}.csv`

    // 创建并下载文件
    const blob = new Blob([csvWithBOM], { type: 'text/csv;charset=utf-8' })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = fileName
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)

    ElMessage.success(`数据已导出到 ${fileName}`)
  } catch (error) {
    console.error('导出数据失败:', error)
    ElMessage.error('导出数据失败，请重试')
  }
}

const refreshData = async () => {
  await Promise.all([
    loadEvaluations(),
    loadStats(),
    loadProjects()
  ])
  ElMessage.success('数据已刷新')
}

const handleSizeChange = (size: number) => {
  pagination.value.pageSize = size
  pagination.value.page = 1
  loadEvaluations()
}

const handleCurrentChange = (page: number) => {
  pagination.value.page = page
  loadEvaluations()
}

// 监听筛选条件变化
watch([filterProject, filterEvaluationType, filterStatus, filterFollowupStatus], () => {
  pagination.value.page = 1
  loadEvaluations()
}, { deep: true })

// 生命周期
onMounted(async () => {
  await Promise.all([
    loadProjects(),
    loadStats()
  ])
  await loadEvaluations()
})
</script>

<style scoped>
.evaluation-management {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding: 16px;
  background: #f8f9fa;
  border-radius: 8px;
}

.toolbar-left {
  display: flex;
  gap: 12px;
  align-items: center;
  flex-wrap: wrap;
}

.toolbar-right {
  display: flex;
  gap: 8px;
}

.stats-panel {
  display: flex;
  gap: 20px;
  margin-bottom: 20px;
}

.stat-item {
  flex: 1;
  text-align: center;
  padding: 20px;
  background: #fff;
  border-radius: 8px;
  border: 1px solid #e4e7ed;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
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

.project-info .project-name {
  font-weight: 500;
  color: #303133;
  margin-bottom: 4px;
}

.project-info .project-phase {
  font-size: 12px;
  color: #909399;
}

.mentor-student-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.mentor-info, .student-info {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
}

.label {
  color: #606266;
  font-weight: 500;
}

.name {
  color: #303133;
}

.score-display {
  text-align: center;
}

.score {
  font-size: 16px;
  font-weight: bold;
  color: #67c23a;
  margin-bottom: 2px;
}

.score-level {
  font-size: 12px;
  padding: 2px 6px;
  border-radius: 4px;
  font-weight: 500;
}

.score-level.excellent {
  background: #f0f9ff;
  color: #1890ff;
}

.score-level.good {
  background: #f6ffed;
  color: #52c41a;
}

.score-level.average {
  background: #fff7e6;
  color: #fa8c16;
}

.score-level.poor {
  background: #fff2f0;
  color: #ff4d4f;
}

.pending-text {
  color: #c0c4cc;
  font-size: 14px;
}

.pagination-wrapper {
  display: flex;
  justify-content: center;
  margin-top: 20px;
  padding: 16px;
}

:deep(.el-table) {
  flex: 1;
}

:deep(.el-table__row) {
  cursor: pointer;
}

/* 响应式设计 */
@media (max-width: 1200px) {
  .toolbar-left {
    flex-direction: column;
    align-items: stretch;
  }
  
  .stats-panel {
    flex-direction: column;
  }
}

.operation-buttons {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.operation-buttons .el-button {
  margin: 0;
}

/* 确保按钮在小屏幕上正常显示 */
@media (max-width: 768px) {
  .operation-buttons {
    flex-direction: column;
    gap: 4px;
  }
}
</style> 