<template>
  <div class="homework-management">
    <!-- 页面头部 -->
    <div class="page-header">
      <div class="header-content">
        <h1>作业管理</h1>
        <p>管理作业发布、学员提交、批改反馈的完整流程</p>
      </div>
      <div class="header-actions">
        <el-button type="primary" @click="createHomework">
          <el-icon><Plus /></el-icon>
          发布作业
        </el-button>
        <el-button @click="exportData">
          <el-icon><Download /></el-icon>
          导出数据
        </el-button>
      </div>
    </div>

    <!-- 统计概览 -->
    <div class="stats-overview">
      <el-card class="stats-card">
        <el-statistic title="总作业数" :value="homeworkStats.total" />
        <div class="stats-trend">
          <el-icon color="#67c23a"><TrendCharts /></el-icon>
          <span>本周新增 {{ homeworkStats.weeklyNew }}</span>
        </div>
      </el-card>
      <el-card class="stats-card">
        <el-statistic title="待批改" :value="homeworkStats.pending" />
        <div class="stats-trend">
          <el-icon color="#e6a23c"><Clock /></el-icon>
          <span>需要处理</span>
        </div>
      </el-card>
      <el-card class="stats-card">
        <el-statistic title="已批改" :value="homeworkStats.reviewed" />
        <div class="stats-trend">
          <el-icon color="#409eff"><Check /></el-icon>
          <span>完成率 {{ homeworkStats.completionRate }}%</span>
        </div>
      </el-card>
      <el-card class="stats-card">
        <el-statistic title="平均分" :value="homeworkStats.averageScore" :precision="1" />
        <div class="stats-trend">
          <el-icon color="#f56c6c"><Star /></el-icon>
          <span>质量评估</span>
        </div>
      </el-card>
    </div>

    <!-- 筛选和搜索 -->
    <div class="filter-section">
      <div class="filter-left">
        <el-select v-model="filterStatus" placeholder="作业状态" clearable style="width: 150px">
          <el-option label="全部" value="" />
          <el-option label="发布中" value="published" />
          <el-option label="收集中" value="collecting" />
          <el-option label="批改中" value="reviewing" />
          <el-option label="已完成" value="completed" />
          <el-option label="已过期" value="expired" />
        </el-select>
        <el-select v-model="filterReviewType" placeholder="批改类型" clearable style="width: 150px">
          <el-option label="全部" value="" />
          <el-option label="导师批阅" value="mentor" />
          <el-option label="辅导师批阅" value="assistant" />
          <el-option label="部门经理批阅" value="deptManager" />
          <el-option label="直属经理批阅" value="directManager" />
          <el-option label="指定人批阅" value="custom" />
        </el-select>
        <el-date-picker
          v-model="filterDate"
          type="daterange"
          range-separator="至"
          start-placeholder="开始日期"
          end-placeholder="结束日期"
          style="width: 240px"
        />
      </div>
      <div class="filter-right">
        <el-input
          v-model="searchKeyword"
          placeholder="搜索作业标题或关联课程"
          style="width: 300px"
          clearable
        >
          <template #prefix>
            <el-icon><Search /></el-icon>
          </template>
        </el-input>
      </div>
    </div>

    <!-- 作业列表 -->
    <div class="homework-list">
      <div class="list-header">
        <h3>作业列表</h3>
        <div class="view-controls">
          <el-radio-group v-model="viewMode" size="small">
            <el-radio-button label="card">卡片视图</el-radio-button>
            <el-radio-button label="table">表格视图</el-radio-button>
          </el-radio-group>
        </div>
      </div>

      <!-- 卡片视图 -->
      <div v-if="viewMode === 'card'" class="homework-cards">
        <div
          v-for="homework in filteredHomework"
          :key="homework.id"
          class="homework-card"
          :class="{ 'urgent': isUrgent(homework) }"
        >
          <div class="card-header">
            <div class="homework-status">
              <el-tag :type="getStatusColor(homework.status)">
                {{ getStatusText(homework.status) }}
              </el-tag>
              <el-tag v-if="homework.onsiteDisplay" type="warning" size="small">
                现场展示
              </el-tag>
            </div>
            <div class="card-actions">
              <el-dropdown @command="(action) => handleHomeworkAction(action, homework)">
                <el-button size="small" type="text">
                  更多 <el-icon><ArrowDown /></el-icon>
                </el-button>
                <template #dropdown>
                  <el-dropdown-menu>
                    <el-dropdown-item command="view">查看详情</el-dropdown-item>
                    <el-dropdown-item command="review" v-if="homework.status === 'collecting'">
                      开始批改
                    </el-dropdown-item>
                    <el-dropdown-item command="edit">编辑</el-dropdown-item>
                    <el-dropdown-item command="close" v-if="homework.status === 'collecting'">
                      停止收集
                    </el-dropdown-item>
                    <el-dropdown-item command="extend">延长期限</el-dropdown-item>
                    <el-dropdown-item command="delete" divided>删除</el-dropdown-item>
                  </el-dropdown-menu>
                </template>
              </el-dropdown>
            </div>
          </div>

          <div class="card-content">
            <h4>{{ homework.title }}</h4>
            <p class="description">{{ homework.description }}</p>
            <div class="homework-meta">
              <div class="meta-item">
                <el-icon><Document /></el-icon>
                <span>{{ homework.linkCourse || '独立作业' }}</span>
              </div>
              <div class="meta-item">
                <el-icon><User /></el-icon>
                <span>{{ getReviewerText(homework.reviewType) }}</span>
              </div>
              <div class="meta-item">
                <el-icon><Calendar /></el-icon>
                <span>{{ formatDate(homework.deadline) }}</span>
              </div>
              <div class="meta-item">
                <el-icon><TrophyBase /></el-icon>
                <span>{{ homework.totalScore }}分</span>
              </div>
            </div>

            <!-- 提交进度 -->
            <div class="submission-progress">
              <div class="progress-header">
                <span>提交进度</span>
                <span class="progress-text">
                  {{ homework.submissions?.length || 0 }}/{{ homework.assignedTo?.length || 0 }}
                </span>
              </div>
              <el-progress
                :percentage="getSubmissionProgress(homework)"
                :color="getProgressColor(homework)"
                :stroke-width="6"
              />
            </div>

            <!-- 批改进度 -->
            <div class="review-progress" v-if="homework.status !== 'published'">
              <div class="progress-header">
                <span>批改进度</span>
                <span class="progress-text">
                  {{ getReviewedCount(homework) }}/{{ homework.submissions?.length || 0 }}
                </span>
              </div>
              <el-progress
                :percentage="getReviewProgress(homework)"
                color="#67c23a"
                :stroke-width="6"
              />
            </div>

            <!-- 截止时间提醒 -->
            <div v-if="getDaysUntilDeadline(homework) <= 3" class="deadline-warning">
              <el-icon><Warning /></el-icon>
              <span v-if="getDaysUntilDeadline(homework) > 0">
                {{ getDaysUntilDeadline(homework) }}天后截止
              </span>
              <span v-else class="overdue">已过期</span>
            </div>
          </div>

          <div class="card-footer">
            <el-button
              size="small"
              type="primary"
              @click="viewSubmissions(homework)"
            >
              查看提交
            </el-button>
            <el-button
              v-if="homework.status === 'collecting'"
              size="small"
              type="success"
              @click="startReview(homework)"
            >
              开始批改
            </el-button>
            <el-button
              v-else-if="homework.status === 'reviewing'"
              size="small"
              type="warning"
              @click="continueReview(homework)"
            >
              继续批改
            </el-button>
          </div>
        </div>
      </div>

      <!-- 表格视图 -->
      <el-table
        v-else
        :data="filteredHomework"
        stripe
        style="width: 100%"
        @row-click="viewHomeworkDetail"
      >
        <el-table-column prop="title" label="作业标题" min-width="200" />
        <el-table-column prop="linkCourse" label="关联课程" width="150">
          <template #default="{ row }">
            {{ row.linkCourse || '独立作业' }}
          </template>
        </el-table-column>
        <el-table-column prop="reviewType" label="批改类型" width="120">
          <template #default="{ row }">
            {{ getReviewerText(row.reviewType) }}
          </template>
        </el-table-column>
        <el-table-column prop="totalScore" label="总分" width="80">
          <template #default="{ row }">
            {{ row.totalScore }}分
          </template>
        </el-table-column>
        <el-table-column label="提交进度" width="120">
          <template #default="{ row }">
            <div class="table-progress">
              <span class="progress-text">
                {{ row.submissions?.length || 0 }}/{{ row.assignedTo?.length || 0 }}
              </span>
              <el-progress
                :percentage="getSubmissionProgress(row)"
                :color="getProgressColor(row)"
                :stroke-width="4"
                :show-text="false"
              />
            </div>
          </template>
        </el-table-column>
        <el-table-column label="批改进度" width="120">
          <template #default="{ row }">
            <div class="table-progress">
              <span class="progress-text">
                {{ getReviewedCount(row) }}/{{ row.submissions?.length || 0 }}
              </span>
              <el-progress
                :percentage="getReviewProgress(row)"
                color="#67c23a"
                :stroke-width="4"
                :show-text="false"
              />
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="deadline" label="截止时间" width="160">
          <template #default="{ row }">
            <span :class="{ 'text-danger': getDaysUntilDeadline(row) <= 0 }">
              {{ formatDateTime(row.deadline) }}
            </span>
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="getStatusColor(row.status)">
              {{ getStatusText(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button size="small" type="primary" @click.stop="viewSubmissions(row)">
              查看提交
            </el-button>
            <el-button
              v-if="row.status === 'collecting'"
              size="small"
              type="success"
              @click.stop="startReview(row)"
            >
              批改
            </el-button>
            <el-button size="small" type="text" @click.stop="editHomework(row)">
              编辑
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <!-- 作业发布表单 -->
    <HomeworkForm
      v-model:visible="showHomeworkForm"
      :homework="selectedHomework"
      @save="handleHomeworkSave"
    />

    <!-- 提交列表对话框 -->
    <SubmissionListDialog
      v-model:visible="showSubmissionDialog"
      :homework="selectedHomework"
      @review="handleStartReview"
    />

    <!-- 作业详情对话框 -->
    <!-- <HomeworkDetailDialog
      v-model:visible="showDetailDialog"
      :homework="selectedHomework"
    /> -->

    <!-- 批改界面对话框 -->
    <ReviewDialog
      v-model:visible="showReviewDialog"
      :homework="selectedHomework"
      :submission="selectedSubmission"
      @save="handleReviewSave"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Plus, Download, Search, TrendCharts, Clock, Check, Star,
  ArrowDown, Document, User, Calendar, TrophyBase, Warning
} from '@element-plus/icons-vue'

// 导入子组件
import HomeworkForm from '../execution/components/HomeworkForm.vue'
import SubmissionListDialog from '../components/SubmissionListDialog.vue'
// HomeworkDetailDialog 组件暂未实现
import ReviewDialog from '../components/ReviewDialog.vue'

// 页面状态
const viewMode = ref('card')
const showHomeworkForm = ref(false)
const showSubmissionDialog = ref(false)
const showDetailDialog = ref(false)
const showReviewDialog = ref(false)
const selectedHomework = ref<any>(null)
const selectedSubmission = ref<any>(null)

// 筛选状态
const filterStatus = ref('')
const filterReviewType = ref('')
const filterDate = ref<[Date, Date] | null>(null)
const searchKeyword = ref('')

// 模拟作业数据
const homeworkList = ref([
  {
    id: 'hw-1',
    title: '项目管理案例分析',
    description: '请根据提供的案例，分析项目管理中的关键问题并提出解决方案。',
    linkCourse: '项目管理基础培训',
    reviewType: 'mentor',
    totalScore: 100,
    deadline: '2024-01-25T23:59:59',
    status: 'collecting',
    onsiteDisplay: true,
    assignedTo: [
      { id: '1', name: '张三' },
      { id: '2', name: '李四' },
      { id: '3', name: '王五' }
    ],
    submissions: [
      { 
        id: 'sub-1', 
        studentId: '1', 
        studentName: '张三', 
        submitTime: '2024-01-23T14:30:00',
        status: 'submitted',
        score: null,
        reviewed: false
      },
      { 
        id: 'sub-2', 
        studentId: '2', 
        studentName: '李四', 
        submitTime: '2024-01-24T09:15:00',
        status: 'reviewed',
        score: 85,
        reviewed: true
      }
    ]
  },
  {
    id: 'hw-2',
    title: 'Vue 3组件开发实践',
    description: '开发一个包含增删改查功能的Vue 3组件，要求使用Composition API。',
    linkCourse: 'Vue 3开发实战',
    reviewType: 'assistant',
    totalScore: 80,
    deadline: '2024-01-28T23:59:59',
    status: 'published',
    onsiteDisplay: false,
    assignedTo: [
      { id: '4', name: '赵六' },
      { id: '5', name: '钱七' }
    ],
    submissions: []
  }
])

// 统计数据
const homeworkStats = computed(() => {
  const total = homeworkList.value.length
  const pending = homeworkList.value.filter(h => h.status === 'collecting' || h.status === 'reviewing').length
  const reviewed = homeworkList.value.filter(h => h.status === 'completed').length
  const allSubmissions = homeworkList.value.flatMap(h => h.submissions || [])
  const reviewedSubmissions = allSubmissions.filter(s => s.reviewed)
  const totalScore = reviewedSubmissions.reduce((sum, s) => sum + (s.score || 0), 0)
  
  return {
    total,
    pending,
    reviewed,
    weeklyNew: 2,
    completionRate: Math.round((reviewed / total) * 100) || 0,
    averageScore: reviewedSubmissions.length > 0 ? totalScore / reviewedSubmissions.length : 0
  }
})

// 筛选后的作业
const filteredHomework = computed(() => {
  let filtered = homeworkList.value

  if (filterStatus.value) {
    filtered = filtered.filter(h => h.status === filterStatus.value)
  }

  if (filterReviewType.value) {
    filtered = filtered.filter(h => h.reviewType === filterReviewType.value)
  }

  if (filterDate.value) {
    const [start, end] = filterDate.value
    filtered = filtered.filter(h => {
      const deadline = new Date(h.deadline)
      return deadline >= start && deadline <= end
    })
  }

  if (searchKeyword.value) {
    const keyword = searchKeyword.value.toLowerCase()
    filtered = filtered.filter(h => 
      h.title.toLowerCase().includes(keyword) ||
      (h.linkCourse && h.linkCourse.toLowerCase().includes(keyword))
    )
  }

  return filtered
})

// 工具方法
const getStatusColor = (status: string) => {
  const colors = {
    published: 'info',
    collecting: 'warning',
    reviewing: 'primary',
    completed: 'success',
    expired: 'danger'
  }
  return colors[status] || 'info'
}

const getStatusText = (status: string) => {
  const texts = {
    published: '发布中',
    collecting: '收集中',
    reviewing: '批改中',
    completed: '已完成',
    expired: '已过期'
  }
  return texts[status] || status
}

const getReviewerText = (reviewType: string) => {
  const texts = {
    mentor: '导师批阅',
    assistant: '辅导师',
    deptManager: '部门经理',
    directManager: '直属经理',
    custom: '指定人员'
  }
  return texts[reviewType] || reviewType
}

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('zh-CN')
}

const formatDateTime = (dateString: string) => {
  return new Date(dateString).toLocaleString('zh-CN')
}

const getDaysUntilDeadline = (homework: any) => {
  const now = new Date()
  const deadline = new Date(homework.deadline)
  const diffTime = deadline.getTime() - now.getTime()
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
}

const isUrgent = (homework: any) => {
  return getDaysUntilDeadline(homework) <= 1
}

const getSubmissionProgress = (homework: any) => {
  const assigned = homework.assignedTo?.length || 0
  const submitted = homework.submissions?.length || 0
  return assigned > 0 ? Math.round((submitted / assigned) * 100) : 0
}

const getProgressColor = (homework: any) => {
  const progress = getSubmissionProgress(homework)
  if (progress >= 80) return '#67c23a'
  if (progress >= 50) return '#e6a23c'
  return '#f56c6c'
}

const getReviewedCount = (homework: any) => {
  return homework.submissions?.filter((s: any) => s.reviewed).length || 0
}

const getReviewProgress = (homework: any) => {
  const total = homework.submissions?.length || 0
  const reviewed = getReviewedCount(homework)
  return total > 0 ? Math.round((reviewed / total) * 100) : 0
}

// 操作方法
const createHomework = () => {
  selectedHomework.value = null
  showHomeworkForm.value = true
}

const editHomework = (homework: any) => {
  selectedHomework.value = homework
  showHomeworkForm.value = true
}

const viewSubmissions = (homework: any) => {
  selectedHomework.value = homework
  showSubmissionDialog.value = true
}

const viewHomeworkDetail = (homework: any) => {
  selectedHomework.value = homework
  showDetailDialog.value = true
}

const startReview = (homework: any) => {
  selectedHomework.value = homework
  // 找到第一个未批改的提交
  const unreviewed = homework.submissions?.find((s: any) => !s.reviewed)
  if (unreviewed) {
    selectedSubmission.value = unreviewed
    showReviewDialog.value = true
  } else {
    ElMessage.warning('没有需要批改的提交')
  }
}

const continueReview = (homework: any) => {
  startReview(homework)
}

const handleHomeworkAction = (action: string, homework: any) => {
  switch (action) {
    case 'view':
      viewHomeworkDetail(homework)
      break
    case 'review':
      startReview(homework)
      break
    case 'edit':
      editHomework(homework)
      break
    case 'close':
      handleCloseCollection(homework)
      break
    case 'extend':
      handleExtendDeadline(homework)
      break
    case 'delete':
      handleDeleteHomework(homework)
      break
  }
}

const handleHomeworkSave = (homeworkData: any) => {
  if (selectedHomework.value) {
    // 编辑现有作业
    selectedHomework.value.title = homeworkData.title
    selectedHomework.value.description = homeworkData.description
    selectedHomework.value.linkCourse = homeworkData.linkCourse
    selectedHomework.value.reviewType = homeworkData.reviewType
    selectedHomework.value.totalScore = homeworkData.totalScore
    selectedHomework.value.deadline = homeworkData.deadline
    selectedHomework.value.onsiteDisplay = homeworkData.onsiteDisplay
    ElMessage.success('作业更新成功')
  } else {
    // 新建作业
    const newHomework = {
      id: `hw-${Date.now()}`,
      ...homeworkData,
      status: 'published',
      assignedTo: [],
      submissions: []
    }
    homeworkList.value.push(newHomework)
    ElMessage.success('作业发布成功')
  }
}

const handleStartReview = (submission: any) => {
  selectedSubmission.value = submission
  showSubmissionDialog.value = false
  showReviewDialog.value = true
}

const handleReviewSave = (reviewData: any) => {
  if (selectedSubmission.value) {
    selectedSubmission.value.score = reviewData.score
    selectedSubmission.value.feedback = reviewData.feedback
    selectedSubmission.value.reviewed = true
    selectedSubmission.value.reviewTime = new Date().toISOString()
    ElMessage.success('批改完成')
  }
}

const handleCloseCollection = (homework: any) => {
  ElMessageBox.confirm('确定停止收集作业吗？', '停止收集', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    homework.status = 'reviewing'
    ElMessage.success('已停止收集作业')
  })
}

const handleExtendDeadline = (homework: any) => {
  ElMessageBox.prompt('请输入延长的天数', '延长期限', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    inputPattern: /^\d+$/,
    inputErrorMessage: '请输入有效的天数'
  }).then(({ value }) => {
    const deadline = new Date(homework.deadline)
    deadline.setDate(deadline.getDate() + parseInt(value))
    homework.deadline = deadline.toISOString()
    ElMessage.success(`期限已延长${value}天`)
  })
}

const handleDeleteHomework = (homework: any) => {
  ElMessageBox.confirm('确定删除这个作业吗？', '删除作业', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    const index = homeworkList.value.findIndex(h => h.id === homework.id)
    if (index > -1) {
      homeworkList.value.splice(index, 1)
      ElMessage.success('作业已删除')
    }
  })
}

const exportData = () => {
  ElMessage.success('正在导出作业数据...')
}

// 生命周期
onMounted(() => {
  // 初始化数据
})
</script>

<style scoped>
.homework-management {
  padding: 20px;
  background: #f5f7fa;
  min-height: 100vh;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 20px;
  padding: 20px;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.header-content h1 {
  margin: 0 0 8px 0;
  font-size: 24px;
  color: #333;
}

.header-content p {
  margin: 0;
  color: #666;
  font-size: 14px;
}

.header-actions {
  display: flex;
  gap: 12px;
}

.stats-overview {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 16px;
  margin-bottom: 20px;
}

.stats-card {
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.stats-trend {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: 8px;
  font-size: 12px;
  color: #666;
}

.filter-section {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding: 16px 20px;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.filter-left {
  display: flex;
  gap: 12px;
  align-items: center;
}

.homework-list {
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  padding: 20px;
}

.list-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.list-header h3 {
  margin: 0;
  font-size: 18px;
  color: #333;
}

.homework-cards {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(450px, 1fr));
  gap: 20px;
}

.homework-card {
  border: 1px solid #e8e8e8;
  border-radius: 8px;
  padding: 20px;
  background: #fff;
  transition: all 0.3s;
}

.homework-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.homework-card.urgent {
  border-color: #f56c6c;
  background: linear-gradient(135deg, #fff 0%, #fef0f0 100%);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.homework-status {
  display: flex;
  gap: 8px;
}

.card-content h4 {
  margin: 0 0 8px 0;
  font-size: 16px;
  color: #333;
  font-weight: 600;
}

.description {
  font-size: 14px;
  color: #666;
  line-height: 1.5;
  margin-bottom: 12px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.homework-meta {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
  margin-bottom: 16px;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
  color: #666;
}

.submission-progress,
.review-progress {
  margin-bottom: 12px;
}

.progress-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 6px;
  font-size: 14px;
  color: #333;
}

.progress-text {
  font-size: 12px;
  color: #666;
}

.deadline-warning {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
  background: #fef0f0;
  border: 1px solid #f56c6c;
  border-radius: 4px;
  font-size: 14px;
  color: #f56c6c;
  margin-bottom: 12px;
}

.overdue {
  font-weight: 600;
}

.card-footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}

.table-progress {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.text-danger {
  color: #f56c6c;
}
</style> 