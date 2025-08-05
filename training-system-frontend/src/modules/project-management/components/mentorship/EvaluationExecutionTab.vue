<template>
  <div class="evaluation-execution-tab">
    <!-- 评价概览统计 -->
    <div class="evaluation-overview">
      <div class="overview-cards">
        <el-card class="overview-card">
          <div class="card-content">
            <div class="card-number">{{ totalEvaluations }}</div>
            <div class="card-label">总评价任务</div>
          </div>
          <div class="card-icon">
            <el-icon size="24" color="#409eff"><Document /></el-icon>
          </div>
        </el-card>
        
        <el-card class="overview-card">
          <div class="card-content">
            <div class="card-number">{{ pendingEvaluations }}</div>
            <div class="card-label">待完成</div>
          </div>
          <div class="card-icon">
            <el-icon size="24" color="#e6a23c"><Clock /></el-icon>
          </div>
        </el-card>
        
        <el-card class="overview-card">
          <div class="card-content">
            <div class="card-number">{{ completedEvaluations }}</div>
            <div class="card-label">已完成</div>
          </div>
          <div class="card-icon">
            <el-icon size="24" color="#67c23a"><Select /></el-icon>
          </div>
        </el-card>
        
        <el-card class="overview-card">
          <div class="card-content">
            <div class="card-number">{{ averageScore.toFixed(1) }}</div>
            <div class="card-label">平均分</div>
          </div>
          <div class="card-icon">
            <el-icon size="24" color="#f56c6c"><Star /></el-icon>
          </div>
        </el-card>
      </div>
    </div>

    <!-- 操作工具栏 -->
    <div class="toolbar">
      <div class="toolbar-left">
        <el-button type="primary" @click="showCreateEvaluationDialog = true">
          <el-icon><Plus /></el-icon>
          创建评价任务
        </el-button>
        <el-button @click="generateBatchEvaluations">
          <el-icon><Grid /></el-icon>
          批量生成
        </el-button>
        <el-button @click="exportEvaluationReport">
          <el-icon><Download /></el-icon>
          导出报告
        </el-button>
      </div>
      <div class="toolbar-right">
        <el-select
          v-model="filterType"
          placeholder="评价类型"
          style="width: 140px; margin-right: 12px"
          clearable
        >
          <el-option label="全部" value="" />
          <el-option label="转正评价" value="probation" />
          <el-option label="年度评价" value="annual" />
          <el-option label="阶段评价" value="phase_end" />
        </el-select>
        
        <el-select
          v-model="filterStatus"
          placeholder="状态"
          style="width: 120px; margin-right: 12px"
          clearable
        >
          <el-option label="全部" value="" />
          <el-option label="待完成" value="pending" />
          <el-option label="进行中" value="in_progress" />
          <el-option label="已完成" value="completed" />
          <el-option label="已逾期" value="overdue" />
        </el-select>
        
        <el-input
          v-model="searchKeyword"
          placeholder="搜索师徒关系"
          style="width: 200px"
          clearable
        >
          <template #prefix>
            <el-icon><Search /></el-icon>
          </template>
        </el-input>
      </div>
    </div>

    <!-- 评价任务列表 -->
    <div class="evaluation-list">
      <el-table
        :data="filteredEvaluations"
        v-loading="loading"
        row-key="id"
        @selection-change="handleSelectionChange"
      >
        <el-table-column type="selection" width="55" />
        
        <el-table-column label="师徒关系" min-width="200">
          <template #default="{ row }">
            <div class="relationship-info">
              <div class="mentor-student">
                <span class="mentor">{{ getMentorName(row.relationshipId) }}</span>
                <el-icon class="arrow"><Right /></el-icon>
                <span class="student">{{ getStudentName(row.relationshipId) }}</span>
              </div>
              <div class="relationship-meta">
                <el-tag size="small" type="info">
                  {{ getRelationshipType(row.relationshipId) }}
                </el-tag>
              </div>
            </div>
          </template>
        </el-table-column>
        
        <el-table-column label="评价类型" width="120">
          <template #default="{ row }">
            <el-tag
              :type="getEvaluationTypeTag(row.type)"
              size="small"
            >
              {{ getEvaluationTypeText(row.type) }}
            </el-tag>
          </template>
        </el-table-column>
        
        <el-table-column label="评价者" width="100">
          <template #default="{ row }">
            <span>{{ getEvaluatorName(row.evaluator) }}</span>
          </template>
        </el-table-column>
        
        <el-table-column label="截止时间" width="120">
          <template #default="{ row }">
            <div class="due-date" :class="{ overdue: isOverdue(row.dueDate) }">
              {{ formatDate(row.dueDate) }}
            </div>
          </template>
        </el-table-column>
        
        <el-table-column label="优先级" width="100">
          <template #default="{ row }">
            <el-tag
              :type="getPriorityType(row.priority)"
              size="small"
            >
              {{ getPriorityText(row.priority) }}
            </el-tag>
          </template>
        </el-table-column>
        
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-tag
              :type="getStatusType(row.status)"
              size="small"
            >
              {{ getStatusText(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        
        <el-table-column label="评分" width="100">
          <template #default="{ row }">
            <div v-if="row.status === 'completed'" class="score-display">
              <span class="score">{{ getTotalScore(row.id) }}</span>
              <span class="max-score">/100</span>
            </div>
            <span v-else class="no-score">-</span>
          </template>
        </el-table-column>
        
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button
              v-if="row.status === 'pending' || row.status === 'in_progress'"
              type="primary"
              size="small"
              @click="handleStartEvaluation(row)"
            >
              {{ row.status === 'pending' ? '开始评价' : '继续评价' }}
            </el-button>
            
            <el-button
              v-if="row.status === 'completed'"
              type="success"
              size="small"
              @click="handleViewResult(row)"
            >
              查看结果
            </el-button>
            
            <el-button
              type="info"
              size="small"
              @click="handleViewDetails(row)"
            >
              详情
            </el-button>
            
            <el-dropdown @command="(cmd) => handleEvaluationAction(cmd, row)">
              <el-button type="text" size="small">
                更多<el-icon class="el-icon--right"><ArrowDown /></el-icon>
              </el-button>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item command="edit" :disabled="row.status === 'completed'">
                    编辑任务
                  </el-dropdown-item>
                  <el-dropdown-item command="remind" :disabled="row.status === 'completed'">
                    发送提醒
                  </el-dropdown-item>
                  <el-dropdown-item command="extend" :disabled="row.status === 'completed'">
                    延期申请
                  </el-dropdown-item>
                  <el-dropdown-item command="delete" divided>
                    删除任务
                  </el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </template>
        </el-table-column>
      </el-table>
    </div>

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

    <!-- 创建评价任务对话框 -->
    <el-dialog
      v-model="showCreateEvaluationDialog"
      title="创建评价任务"
      width="600px"
      :close-on-click-modal="false"
    >
      <CreateEvaluationDialog
        :project-id="projectId"
        :relationships="relationships"
        @submit="handleCreateEvaluation"
        @cancel="showCreateEvaluationDialog = false"
      />
    </el-dialog>

    <!-- 评价执行对话框 -->
    <el-dialog
      v-model="showEvaluationDialog"
      :title="evaluationDialogTitle"
      width="900px"
      :close-on-click-modal="false"
      @close="handleEvaluationDialogClose"
    >
      <EvaluationForm
        v-if="selectedEvaluation"
        :evaluation-task="selectedEvaluation"
        :relationship="getRelationship(selectedEvaluation.relationshipId)"
        :standards="standards"
        @submit="handleEvaluationSubmit"
        @save-draft="handleEvaluationSaveDraft"
        @cancel="showEvaluationDialog = false"
      />
    </el-dialog>

    <!-- 评价结果查看对话框 -->
    <el-dialog
      v-model="showResultDialog"
      title="评价结果详情"
      width="800px"
      :close-on-click-modal="false"
    >
      <EvaluationResult
        v-if="selectedEvaluation"
        :evaluation-task="selectedEvaluation"
        :relationship="getRelationship(selectedEvaluation.relationshipId)"
        @close="showResultDialog = false"
      />
    </el-dialog>

    <!-- 评价详情对话框 -->
    <el-dialog
      v-model="showDetailsDialog"
      title="评价任务详情"
      width="700px"
      :close-on-click-modal="false"
    >
      <EvaluationTaskDetails
        v-if="selectedEvaluation"
        :evaluation-task="selectedEvaluation"
        :relationship="getRelationship(selectedEvaluation.relationshipId)"
        @close="showDetailsDialog = false"
      />
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Document,
  Clock,
  Select,
  Star,
  Plus,
  Grid,
  Download,
  Search,
  Right,
  ArrowDown
} from '@element-plus/icons-vue'
import type {
  EvaluationTabProps,
  EvaluationTask,
  ProjectMentorRelationship,
  MentorshipStandards
} from '../types/mentorship'
import CreateEvaluationDialog from './dialogs/CreateEvaluationDialog.vue'
import EvaluationForm from './dialogs/EvaluationForm.vue'
import EvaluationResult from './dialogs/EvaluationResult.vue'
import EvaluationTaskDetails from './dialogs/EvaluationTaskDetails.vue'
import { formatDate } from '@/utils/dateUtils'

// Props
const props = defineProps<EvaluationTabProps>()

// 响应式数据
const loading = ref(false)
const searchKeyword = ref('')
const filterType = ref('')
const filterStatus = ref('')
const selectedEvaluations = ref<EvaluationTask[]>([])

// 对话框状态
const showCreateEvaluationDialog = ref(false)
const showEvaluationDialog = ref(false)
const showResultDialog = ref(false)
const showDetailsDialog = ref(false)
const selectedEvaluation = ref<EvaluationTask | null>(null)

// 分页数据
const pagination = ref({
  page: 1,
  pageSize: 20,
  total: 0
})

// 计算属性
const filteredEvaluations = computed(() => {
  let filtered = props.evaluationTasks
  
  // 搜索关键词过滤
  if (searchKeyword.value) {
    const keyword = searchKeyword.value.toLowerCase()
    filtered = filtered.filter(task => {
      const mentorName = getMentorName(task.relationshipId).toLowerCase()
      const studentName = getStudentName(task.relationshipId).toLowerCase()
      return mentorName.includes(keyword) || studentName.includes(keyword)
    })
  }
  
  // 评价类型过滤
  if (filterType.value) {
    filtered = filtered.filter(task => task.type === filterType.value)
  }
  
  // 状态过滤
  if (filterStatus.value) {
    filtered = filtered.filter(task => task.status === filterStatus.value)
  }
  
  return filtered
})

const totalEvaluations = computed(() => props.evaluationTasks.length)

const pendingEvaluations = computed(() => 
  props.evaluationTasks.filter(task => 
    task.status === 'pending' || task.status === 'in_progress'
  ).length
)

const completedEvaluations = computed(() => 
  props.evaluationTasks.filter(task => task.status === 'completed').length
)

const averageScore = computed(() => {
  const completedTasks = props.evaluationTasks.filter(task => task.status === 'completed')
  if (completedTasks.length === 0) return 0
  
  const totalScore = completedTasks.reduce((sum, task) => {
    return sum + getTotalScore(task.id)
  }, 0)
  
  return totalScore / completedTasks.length
})

const evaluationDialogTitle = computed(() => {
  if (!selectedEvaluation.value) return ''
  
  const typeText = getEvaluationTypeText(selectedEvaluation.value.type)
  const mentorName = getMentorName(selectedEvaluation.value.relationshipId)
  const studentName = getStudentName(selectedEvaluation.value.relationshipId)
  
  return `${typeText} - ${mentorName} → ${studentName}`
})

// 方法
const getRelationship = (relationshipId: string): ProjectMentorRelationship | undefined => {
  return props.relationships.find(rel => rel.id === relationshipId)
}

const getMentorName = (relationshipId: string): string => {
  const relationship = getRelationship(relationshipId)
  return relationship ? `导师${relationship.mentorId}` : '未知导师'
}

const getStudentName = (relationshipId: string): string => {
  const relationship = getRelationship(relationshipId)
  return relationship ? `学员${relationship.studentId}` : '未知学员'
}

const getRelationshipType = (relationshipId: string): string => {
  const relationship = getRelationship(relationshipId)
  if (!relationship) return ''
  return relationship.type === 'academy_certified' ? '书院认证' : '部门指定'
}

const getEvaluationTypeTag = (type: string): string => {
  const typeMap: Record<string, string> = {
    probation: 'warning',
    annual: 'success',
    phase_end: 'info'
  }
  return typeMap[type] || 'info'
}

const getEvaluationTypeText = (type: string): string => {
  const textMap: Record<string, string> = {
    probation: '转正评价',
    annual: '年度评价',
    phase_end: '阶段评价'
  }
  return textMap[type] || type
}

const getEvaluatorName = (evaluatorId: string): string => {
  // 实际开发中根据evaluatorId查询用户信息
  return `评价者${evaluatorId}`
}

const isOverdue = (dueDate: Date): boolean => {
  return new Date() > new Date(dueDate)
}

const getPriorityType = (priority: string): string => {
  const typeMap: Record<string, string> = {
    high: 'danger',
    medium: 'warning',
    low: 'info'
  }
  return typeMap[priority] || 'info'
}

const getPriorityText = (priority: string): string => {
  const textMap: Record<string, string> = {
    high: '高',
    medium: '中',
    low: '低'
  }
  return textMap[priority] || priority
}

const getStatusType = (status: string): string => {
  const typeMap: Record<string, string> = {
    pending: 'info',
    in_progress: 'warning',
    completed: 'success',
    overdue: 'danger'
  }
  return typeMap[status] || 'info'
}

const getStatusText = (status: string): string => {
  const textMap: Record<string, string> = {
    pending: '待开始',
    in_progress: '进行中',
    completed: '已完成',
    overdue: '已逾期'
  }
  return textMap[status] || status
}

const getTotalScore = (evaluationId: string): number => {
  // 模拟获取评价总分
  // 实际开发中从评价结果数据中获取
  return Math.floor(Math.random() * 30) + 70 // 70-100分
}

// 事件处理
const handleSelectionChange = (selection: EvaluationTask[]) => {
  selectedEvaluations.value = selection
}

const generateBatchEvaluations = () => {
  ElMessage.info('批量生成评价任务功能开发中...')
}

const exportEvaluationReport = () => {
  ElMessage.info('导出评价报告功能开发中...')
}

const handleCreateEvaluation = (evaluationData: any) => {
  console.log('创建评价任务:', evaluationData)
  showCreateEvaluationDialog.value = false
  emits('evaluation-created', evaluationData)
  ElMessage.success('评价任务创建成功！')
}

const handleStartEvaluation = (evaluation: EvaluationTask) => {
  selectedEvaluation.value = evaluation
  showEvaluationDialog.value = true
}

const handleViewResult = (evaluation: EvaluationTask) => {
  selectedEvaluation.value = evaluation
  showResultDialog.value = true
}

const handleViewDetails = (evaluation: EvaluationTask) => {
  selectedEvaluation.value = evaluation
  showDetailsDialog.value = true
}

const handleEvaluationAction = async (command: string, evaluation: EvaluationTask) => {
  switch (command) {
    case 'edit':
      ElMessage.info(`编辑评价任务: ${evaluation.id}`)
      break
    case 'remind':
      ElMessage.info(`发送提醒: ${evaluation.id}`)
      break
    case 'extend':
      ElMessage.info(`延期申请: ${evaluation.id}`)
      break
    case 'delete':
      try {
        await ElMessageBox.confirm(
          '确定要删除这个评价任务吗？此操作不可恢复。',
          '确认删除',
          {
            confirmButtonText: '确定',
            cancelButtonText: '取消',
            type: 'warning',
          }
        )
        emits('evaluation-deleted', evaluation.id)
        ElMessage.success('评价任务已删除')
      } catch {
        ElMessage.info('已取消删除操作')
      }
      break
  }
}

const handleEvaluationSubmit = (evaluationData: any) => {
  console.log('提交评价:', evaluationData)
  showEvaluationDialog.value = false
  emits('evaluation-submitted', evaluationData)
  ElMessage.success('评价提交成功！')
}

const handleEvaluationSaveDraft = (evaluationData: any) => {
  console.log('保存评价草稿:', evaluationData)
  ElMessage.success('评价草稿已保存')
}

const handleEvaluationDialogClose = () => {
  selectedEvaluation.value = null
}

const handleSizeChange = (size: number) => {
  pagination.value.pageSize = size
  pagination.value.page = 1
}

const handleCurrentChange = (page: number) => {
  pagination.value.page = page
}

// 事件定义
const emits = defineEmits<{
  'evaluation-created': [data: any]
  'evaluation-submitted': [data: any]
  'evaluation-deleted': [id: string]
}>()

// 生命周期
onMounted(() => {
  pagination.value.total = props.evaluationTasks.length
})
</script>

<style scoped>
.evaluation-execution-tab {
  padding: 20px;
}

.evaluation-overview {
  margin-bottom: 24px;
}

.overview-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
}

.overview-card {
  border-radius: 8px;
}

.overview-card :deep(.el-card__body) {
  padding: 20px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.card-content {
  flex: 1;
}

.card-number {
  font-size: 24px;
  font-weight: bold;
  color: #303133;
  margin-bottom: 4px;
}

.card-label {
  font-size: 12px;
  color: #909399;
}

.card-icon {
  opacity: 0.6;
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
}

.toolbar-right {
  display: flex;
  align-items: center;
}

.evaluation-list {
  margin-bottom: 20px;
}

.relationship-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.mentor-student {
  display: flex;
  align-items: center;
  gap: 8px;
}

.mentor {
  font-weight: 500;
  color: #303133;
}

.arrow {
  color: #909399;
  font-size: 12px;
}

.student {
  color: #606266;
}

.relationship-meta {
  display: flex;
  gap: 4px;
}

.due-date {
  color: #606266;
}

.due-date.overdue {
  color: #f56c6c;
  font-weight: 500;
}

.score-display {
  display: flex;
  align-items: baseline;
  gap: 2px;
}

.score {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}

.max-score {
  font-size: 12px;
  color: #909399;
}

.no-score {
  color: #c0c4cc;
  font-size: 14px;
}

.pagination-wrapper {
  display: flex;
  justify-content: center;
  margin-top: 20px;
}

:deep(.el-table) {
  border-radius: 8px;
  overflow: hidden;
}

:deep(.el-table__header) {
  background-color: #fafafa;
}

:deep(.el-button + .el-button) {
  margin-left: 8px;
}
</style> 