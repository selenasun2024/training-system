<template>
  <div class="task-progress-detail">
    <!-- 学员基本信息 -->
    <div class="student-summary">
      <div class="student-header">
        <el-avatar :size="60">{{ studentInfo.name?.charAt(0) || student.studentName?.charAt(0) }}</el-avatar>
        <div class="student-info">
          <h3>{{ studentInfo.name || student.studentName }}</h3>
          <p>{{ studentInfo.department || student.department }} | 导师：{{ mentorshipInfo?.mentor?.name || student.mentorName }}</p>
          <div class="progress-summary">
            <el-progress
              :percentage="summaryData.overallProgress"
              :stroke-width="10"
              :color="getProgressColor(summaryData.overallProgress)"
            />
            <span class="progress-text">
              总进度：{{ summaryData.completedTasks }}/{{ summaryData.totalTasks }} 任务
            </span>
          </div>
        </div>
      </div>
    </div>

    <!-- 详细任务列表 -->
    <div class="task-details" v-loading="loading">
      <h4>任务完成详情</h4>
      <el-table :data="taskList" style="width: 100%" border>
        <el-table-column label="任务名称" min-width="200">
          <template #default="{ row }">
            <div class="task-info">
              <div class="task-name">{{ row.name }}</div>
              <el-tag
                :type="getTaskTypeColor(row.type)"
                size="small"
              >
                {{ getTaskTypeText(row.type) }}
              </el-tag>
            </div>
          </template>
        </el-table-column>

        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-tag
              :type="getStatusColor(row.status)"
              size="small"
            >
              {{ getStatusText(row.status) }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column label="截止时间" width="120">
          <template #default="{ row }">
            {{ row.dueDate ? formatDate(new Date(row.dueDate)) : '-' }}
          </template>
        </el-table-column>

        <el-table-column label="完成时间" width="120">
          <template #default="{ row }">
            {{ row.submission?.submittedAt ? formatDate(new Date(row.submission.submittedAt)) : '-' }}
          </template>
        </el-table-column>

        <el-table-column label="评分" width="100">
          <template #default="{ row }">
            <div v-if="row.submission?.score" class="score-cell">
              <span class="score" :class="getScoreClass(row.submission.score)">{{ row.submission.score }}分</span>
            </div>
            <span v-else class="no-score">-</span>
          </template>
        </el-table-column>

        <el-table-column label="用时" width="80">
          <template #default="{ row }">
            {{ row.timeSpent || '-' }}h
          </template>
        </el-table-column>

        <el-table-column label="操作" width="120">
          <template #default="{ row }">
            <el-button
              type="primary"
              size="small"
              @click="viewTaskContent(row)"
            >
              查看内容
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <!-- 学习数据分析 -->
    <div class="learning-analytics">
      <h4>学习数据分析</h4>
      <div class="analytics-grid">
        <div class="analytics-card">
          <div class="card-title">学习时长</div>
          <div class="card-content">
            <div class="metric-value">{{ summaryData.actualStudyTime }}h</div>
            <div class="metric-target">目标：{{ summaryData.totalEstimatedHours }}h</div>
            <el-progress
              :percentage="Math.min(100, summaryData.totalEstimatedHours > 0 ? (summaryData.actualStudyTime / summaryData.totalEstimatedHours) * 100 : 0)"
              :stroke-width="6"
              :color="summaryData.actualStudyTime >= summaryData.totalEstimatedHours ? '#67c23a' : '#e6a23c'"
            />
          </div>
        </div>

        <div class="analytics-card">
          <div class="card-title">平均评分</div>
          <div class="card-content">
            <div class="metric-value" :class="summaryData.averageScore ? getScoreClass(summaryData.averageScore) : ''">
              {{ summaryData.averageScore || '-' }}{{ summaryData.averageScore ? '分' : '' }}
            </div>
            <el-rate
              :model-value="summaryData.averageScore ? summaryData.averageScore / 20 : 0"
              disabled
              size="small"
            />
          </div>
        </div>

        <div class="analytics-card">
          <div class="card-title">完成率</div>
          <div class="card-content">
            <div class="metric-value">{{ summaryData.overallProgress }}%</div>
            <div class="completion-trend">
              <span class="trend-label">已完成：</span>
              <span class="trend-value positive">{{ summaryData.completedTasks }}/{{ summaryData.totalTasks }}</span>
            </div>
          </div>
        </div>

        <div class="analytics-card">
          <div class="card-title">师徒关系</div>
          <div class="card-content">
            <div class="metric-value">{{ getMentorshipStatusText(mentorshipInfo?.status) }}</div>
            <div class="activity-detail">
              {{ mentorshipInfo?.mentor?.name || '暂无导师' }}
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 导师反馈记录 -->
    <div class="feedback-history">
      <h4>导师反馈记录</h4>
      <div class="feedback-list">
        <div
          v-for="feedback in processedFeedbacks"
          :key="feedback.id"
          class="feedback-item"
        >
          <div class="feedback-header">
            <span class="feedback-date">
              {{ formatDate(feedback.date) }}
              <span v-if="feedback.providerName" class="provider-name"> - {{ feedback.providerName }}</span>
            </span>
            <el-tag :type="feedback.type === 'positive' ? 'success' : 'warning'" size="small">
              {{ getFeedbackTypeText(feedback.type) }}
            </el-tag>
          </div>
          <div class="feedback-content">{{ feedback.content }}</div>
          <div v-if="feedback.rating" class="feedback-rating">
            <el-rate :model-value="feedback.rating" disabled size="small" />
          </div>
        </div>
        
        <div v-if="processedFeedbacks.length === 0" class="no-feedback">
          <el-empty description="暂无反馈记录" />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { getStudentTaskDetails } from '@/api/modules/project-mentorship'

interface Props {
  student: any
  projectId: string
}

const props = defineProps<Props>()

// 响应式数据
const loading = ref(false)
const taskDetailData = ref<any>(null)
const feedbackList = ref<any[]>([])

// 计算属性
const taskList = computed(() => taskDetailData.value?.tasks || [])
const studentInfo = computed(() => taskDetailData.value?.student || props.student)
const mentorshipInfo = computed(() => taskDetailData.value?.mentorship)
const summaryData = computed(() => taskDetailData.value?.summary || {
  totalTasks: 0,
  completedTasks: 0,
  overallProgress: 0,
  averageScore: null,
  totalEstimatedHours: 0,
  actualStudyTime: 0
})

// 加载学员任务详情
const loadTaskDetails = async () => {
  try {
    loading.value = true
    console.log('🔍 加载学员任务详情 - 项目ID:', props.projectId, '学员ID:', props.student.studentId)
    
    const response = await getStudentTaskDetails(props.projectId, props.student.studentId)
    console.log('📋 API响应原始数据:', response)
    console.log('📋 API响应类型:', typeof response)
    console.log('📋 API响应code:', response?.code)
    console.log('📋 API响应message:', response?.message)
    console.log('📋 API响应的data字段:', response?.data)
    
    // 处理API响应
    if (!response) {
      throw new Error('API响应为空')
    }
    
    // 检查是否是错误响应
    if (response.code !== 200) {
      throw new Error(response.message || `API错误: ${response.code}`)
    }
    
    // 处理成功响应
    if (response.data) {
      taskDetailData.value = response.data
    } else {
      // 如果data为null，创建默认结构
      taskDetailData.value = {
        student: {
          id: props.student.studentId,
          name: props.student.studentName,
          department: props.student.department || '未知部门',
          email: null
        },
        mentorship: null,
        summary: {
          totalTasks: 0,
          completedTasks: 0,
          overallProgress: 0,
          averageScore: null,
          totalEstimatedHours: 0,
          actualStudyTime: 0
        },
        tasks: []
      }
    }
    
    console.log('✅ 学员任务详情加载成功:', taskDetailData.value)
    console.log('📋 师徒关系数据:', taskDetailData.value?.mentorship)
    
    // 同时加载反馈记录
    await loadFeedbackData()
  } catch (error) {
    console.error('❌ 加载学员任务详情失败:', error)
    ElMessage.error('加载任务详情失败')
  } finally {
    loading.value = false
  }
}

// 加载反馈数据
const loadFeedbackData = async () => {
  try {
    console.log('🔍 加载反馈数据 - 项目ID:', props.projectId, '学员ID:', props.student.studentId)
    
    const { getStudentFeedback } = await import('@/api/modules/project-mentorship')
    const response = await getStudentFeedback(props.projectId, props.student.studentId)
    feedbackList.value = response.data || []
    
    console.log('✅ 反馈数据加载成功:', feedbackList.value)
  } catch (error) {
    console.error('❌ 加载反馈数据失败:', error)
    // 不显示错误消息，因为反馈数据是可选的
  }
}

// 计算属性 - 处理反馈数据
const processedFeedbacks = computed(() => {
  return feedbackList.value.map(feedback => ({
    id: feedback.id,
    date: new Date(feedback.feedbackDate),
    type: feedback.feedbackType,
    content: feedback.content,
    rating: feedback.rating,
    providerName: feedback.providerName
  }))
})

// 组件挂载时加载数据
onMounted(() => {
  loadTaskDetails()
})

// 方法
const getMentorshipStatusText = (status: string) => {
  const statusMap: Record<string, string> = {
    'ACTIVE': '进行中',
    'COMPLETED': '已出师', 
    'TERMINATED': '已解除'
  }
  
  return statusMap[status] || `未知状态(${status})`
}

const getFeedbackTypeText = (type: string) => {
  const typeMap: Record<string, string> = {
    'positive': '正面反馈',
    'improvement': '改进建议',
    'concern': '关注提醒',
    'encouragement': '鼓励激励'
  }
  return typeMap[type] || type
}

const getProgressColor = (progress: number) => {
  if (progress >= 90) return '#67c23a'
  if (progress >= 70) return '#e6a23c'
  if (progress >= 50) return '#f56c6c'
  return '#909399'
}

const getTaskTypeColor = (type: string) => {
  const colorMap: Record<string, string> = {
    theory: 'primary',
    practice: 'success',
    homework: 'warning',
    exam: 'danger'
  }
  return colorMap[type] || 'info'
}

const getTaskTypeText = (type: string) => {
  const textMap: Record<string, string> = {
    theory: '理论学习',
    practice: '实践操作',
    homework: '作业提交',
    exam: '考试测评'
  }
  return textMap[type] || type
}

const getStatusColor = (status: string) => {
  const colorMap: Record<string, string> = {
    not_started: 'info',
    in_progress: 'warning',
    completed: 'success',
    overdue: 'danger'
  }
  return colorMap[status] || 'info'
}

const getStatusText = (status: string) => {
  const textMap: Record<string, string> = {
    not_started: '未开始',
    in_progress: '进行中',
    completed: '已完成',
    overdue: '已逾期'
  }
  return textMap[status] || status
}

const getScoreClass = (score: number) => {
  if (score >= 90) return 'score-excellent'
  if (score >= 80) return 'score-good'
  if (score >= 70) return 'score-average'
  return 'score-poor'
}

const getActivityLevel = () => {
  // 根据最近活动时间计算活跃度
  const now = new Date()
  const lastActivity = props.student.lastActivity.time
  const hoursDiff = (now.getTime() - lastActivity.getTime()) / (1000 * 60 * 60)
  
  if (hoursDiff <= 24) return '高'
  if (hoursDiff <= 72) return '中'
  return '低'
}

const getRelativeTime = (date: Date) => {
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  const hours = Math.floor(diff / (1000 * 60 * 60))
  
  if (days > 0) return `${days}天前`
  if (hours > 0) return `${hours}小时前`
  return '刚刚'
}

const formatDate = (date: Date) => {
  return date.toLocaleDateString('zh-CN')
}

const viewTaskContent = (task: any) => {
  console.log('查看任务内容:', task)
}
</script>

<style scoped>
.task-progress-detail {
  padding: 20px;
  max-height: 70vh;
  overflow-y: auto;
}

.student-summary {
  margin-bottom: 30px;
  padding: 20px;
  background: #f0f9ff;
  border-radius: 8px;
  border-left: 4px solid #409eff;
}

.student-header {
  display: flex;
  align-items: center;
  gap: 20px;
}

.student-info h3 {
  margin: 0 0 8px 0;
  color: #303133;
}

.student-info p {
  margin: 0 0 12px 0;
  color: #606266;
  font-size: 14px;
}

.progress-summary {
  display: flex;
  align-items: center;
  gap: 12px;
}

.progress-text {
  font-size: 14px;
  color: #303133;
  font-weight: 500;
}

.task-details {
  margin-bottom: 30px;
}

.task-details h4 {
  margin: 0 0 16px 0;
  color: #303133;
  font-size: 16px;
  font-weight: 600;
}

.task-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.task-name {
  font-weight: 500;
  color: #303133;
}

.score-cell .score {
  font-weight: bold;
}

.score-excellent {
  color: #67c23a;
}

.score-good {
  color: #e6a23c;
}

.score-average {
  color: #f56c6c;
}

.score-poor {
  color: #909399;
}

.no-score {
  color: #c0c4cc;
}

.learning-analytics {
  margin-bottom: 30px;
}

.learning-analytics h4 {
  margin: 0 0 16px 0;
  color: #303133;
  font-size: 16px;
  font-weight: 600;
}

.analytics-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
}

.analytics-card {
  padding: 16px;
  background: #fff;
  border-radius: 8px;
  border: 1px solid #e4e7ed;
}

.card-title {
  font-size: 14px;
  color: #606266;
  margin-bottom: 12px;
}

.card-content {
  text-align: center;
}

.metric-value {
  font-size: 24px;
  font-weight: bold;
  color: #303133;
  margin-bottom: 8px;
}

.metric-target {
  font-size: 12px;
  color: #909399;
  margin-bottom: 8px;
}

.completion-trend {
  font-size: 12px;
  margin-top: 8px;
}

.trend-label {
  color: #606266;
}

.trend-value.positive {
  color: #67c23a;
  font-weight: 500;
}

.activity-detail {
  font-size: 12px;
  color: #909399;
  margin-top: 8px;
}

.feedback-history h4 {
  margin: 0 0 16px 0;
  color: #303133;
  font-size: 16px;
  font-weight: 600;
}

.feedback-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.feedback-item {
  padding: 16px;
  background: #fafafa;
  border-radius: 8px;
  border-left: 4px solid #409eff;
}

.feedback-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.feedback-date {
  font-size: 12px;
  color: #909399;
}

.feedback-content {
  color: #606266;
  line-height: 1.5;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .analytics-grid {
    grid-template-columns: 1fr;
  }
  
  .student-header {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .progress-summary {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style> 