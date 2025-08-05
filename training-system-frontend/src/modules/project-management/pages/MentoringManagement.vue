<template>
  <div class="mentoring-management">
    <!-- 页面头部 -->
    <div class="page-header">
      <div class="header-content">
        <h1>师徒带教管理</h1>
        <p>管理师徒关系建立、带教计划制定、进度跟踪和评估反馈的完整流程</p>
      </div>
      <div class="header-actions">
        <el-button type="primary" @click="createMentoringPair">
          <el-icon><Plus /></el-icon>
          建立师徒关系
        </el-button>
        <el-button @click="showMentorPool">
          <el-icon><UserFilled /></el-icon>
          师傅库管理
        </el-button>
        <el-button @click="exportMentoringData">
          <el-icon><Download /></el-icon>
          导出数据
        </el-button>
      </div>
    </div>

    <!-- 关键指标概览 -->
    <div class="metrics-overview">
      <el-card class="metrics-card">
        <el-statistic title="师徒对数" :value="mentoringStats.totalPairs" />
        <div class="metric-detail">
          <span class="trend-up">较上月 +{{ mentoringStats.newPairsThisMonth }}</span>
        </div>
      </el-card>
      
      <el-card class="metrics-card">
        <el-statistic title="活跃师傅" :value="mentoringStats.activeMentors" />
        <div class="metric-detail">
          <span>平均带教 {{ mentoringStats.avgMenteesPerMentor }} 人</span>
        </div>
      </el-card>
      
      <el-card class="metrics-card">
        <el-statistic title="在培徒弟" :value="mentoringStats.activeMentees" />
        <div class="metric-detail">
          <span class="completion-rate">
            完成率 {{ mentoringStats.completionRate }}%
          </span>
        </div>
      </el-card>
      
      <el-card class="metrics-card">
        <el-statistic title="平均评分" :value="mentoringStats.averageRating" :precision="1" />
        <div class="metric-detail">
          <el-rate :model-value="mentoringStats.averageRating" disabled size="small" />
        </div>
      </el-card>
    </div>

    <!-- 功能标签页 -->
    <el-tabs v-model="activeTab" type="border-card" class="mentoring-tabs">
      <!-- 师徒关系管理 -->
      <el-tab-pane label="师徒关系" name="relationships">
        <div class="relationships-content">
          <!-- 筛选和搜索 -->
          <div class="filter-section">
            <div class="filter-left">
              <el-select v-model="filterStatus" placeholder="关系状态" clearable style="width: 150px">
                <el-option label="全部" value="" />
                <el-option label="进行中" value="active" />
                <el-option label="已完成" value="completed" />
                <el-option label="已暂停" value="paused" />
                <el-option label="已终止" value="terminated" />
              </el-select>
              <el-select v-model="filterDepartment" placeholder="部门" clearable style="width: 150px">
                <el-option label="全部" value="" />
                <el-option label="技术部" value="tech" />
                <el-option label="产品部" value="product" />
                <el-option label="运营部" value="operation" />
                <el-option label="人事部" value="hr" />
              </el-select>
              <el-select v-model="filterLevel" placeholder="带教级别" clearable style="width: 150px">
                <el-option label="全部" value="" />
                <el-option label="新员工" value="newcomer" />
                <el-option label="转岗培养" value="transfer" />
                <el-option label="技能提升" value="skill" />
                <el-option label="管理培养" value="management" />
              </el-select>
            </div>
            <div class="filter-right">
              <el-input
                v-model="searchKeyword"
                placeholder="搜索师傅或徒弟姓名"
                style="width: 300px"
                clearable
              >
                <template #prefix>
                  <el-icon><Search /></el-icon>
                </template>
              </el-input>
            </div>
          </div>

          <!-- 师徒关系列表 -->
          <div class="relationships-list">
            <div
              v-for="pair in filteredRelationships"
              :key="pair.id"
              class="relationship-card"
              :class="{ 'active': pair.status === 'active' }"
            >
              <div class="card-header">
                <div class="relationship-status">
                  <el-tag :type="getStatusColor(pair.status)">
                    {{ getStatusText(pair.status) }}
                  </el-tag>
                  <el-tag v-if="pair.isUrgent" type="danger" size="small">
                    需要关注
                  </el-tag>
                </div>
                <div class="card-actions">
                  <el-dropdown @command="(action) => handleRelationshipAction(action, pair)">
                    <el-button size="small" type="text">
                      更多 <el-icon><ArrowDown /></el-icon>
                    </el-button>
                    <template #dropdown>
                      <el-dropdown-menu>
                        <el-dropdown-item command="view">查看详情</el-dropdown-item>
                        <el-dropdown-item command="plan">带教计划</el-dropdown-item>
                        <el-dropdown-item command="progress">进度跟踪</el-dropdown-item>
                        <el-dropdown-item command="evaluate">阶段评估</el-dropdown-item>
                        <el-dropdown-item command="pause" v-if="pair.status === 'active'">
                          暂停带教
                        </el-dropdown-item>
                        <el-dropdown-item command="resume" v-if="pair.status === 'paused'">
                          恢复带教
                        </el-dropdown-item>
                        <el-dropdown-item command="complete" v-if="pair.status === 'active'">
                          完成带教
                        </el-dropdown-item>
                        <el-dropdown-item command="terminate" divided>
                          终止关系
                        </el-dropdown-item>
                      </el-dropdown-menu>
                    </template>
                  </el-dropdown>
                </div>
              </div>

              <div class="relationship-content">
                <!-- 师傅信息 -->
                <div class="mentor-section">
                  <div class="person-info">
                    <el-avatar :size="60" :src="pair.mentor.avatar">
                      {{ pair.mentor.name[0] }}
                    </el-avatar>
                    <div class="person-details">
                      <h4>{{ pair.mentor.name }}</h4>
                      <p class="title">{{ pair.mentor.title }}</p>
                      <p class="department">{{ pair.mentor.department }}</p>
                      <div class="mentor-stats">
                        <span class="stat-item">
                          经验：{{ pair.mentor.experience }}年
                        </span>
                        <span class="stat-item">
                          带教：{{ pair.mentor.menteesCount }}人
                        </span>
                        <div class="mentor-rating">
                          <el-rate :model-value="pair.mentor.rating" disabled size="small" />
                          <span class="rating-text">{{ pair.mentor.rating }}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div class="mentor-badge">
                    <el-icon><Star /></el-icon>
                    <span>师傅</span>
                  </div>
                </div>

                <!-- 连接线 -->
                <div class="connection-line">
                  <div class="connection-info">
                    <div class="start-date">
                      <span class="label">开始时间</span>
                      <span class="date">{{ formatDate(pair.startDate) }}</span>
                    </div>
                    <div class="duration">
                      <span class="label">带教周期</span>
                      <span class="value">{{ pair.duration }}个月</span>
                    </div>
                    <div class="progress-indicator">
                      <el-progress
                        :percentage="pair.progress"
                        :color="getProgressColor(pair.progress)"
                        :stroke-width="8"
                      />
                      <span class="progress-text">{{ pair.progress }}%</span>
                    </div>
                  </div>
                </div>

                <!-- 徒弟信息 -->
                <div class="mentee-section">
                  <div class="mentee-badge">
                    <el-icon><User /></el-icon>
                    <span>徒弟</span>
                  </div>
                  <div class="person-info">
                    <el-avatar :size="60" :src="pair.mentee.avatar">
                      {{ pair.mentee.name[0] }}
                    </el-avatar>
                    <div class="person-details">
                      <h4>{{ pair.mentee.name }}</h4>
                      <p class="title">{{ pair.mentee.title }}</p>
                      <p class="department">{{ pair.mentee.department }}</p>
                      <div class="mentee-stats">
                        <span class="stat-item">
                          入职：{{ formatDaysAgo(pair.mentee.joinDate) }}
                        </span>
                        <span class="stat-item">
                          级别：{{ getMenteeLevelText(pair.menteeLevel) }}
                        </span>
                        <div class="mentee-score">
                          <span class="score-label">当前评分：</span>
                          <span class="score-value">{{ pair.mentee.currentScore || 'N/A' }}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- 最近活动 -->
              <div class="recent-activities" v-if="pair.recentActivities?.length">
                <h5>最近活动</h5>
                <div class="activities-list">
                  <div
                    v-for="activity in pair.recentActivities.slice(0, 3)"
                    :key="activity.id"
                    class="activity-item"
                  >
                    <div class="activity-time">{{ formatRelativeTime(activity.time) }}</div>
                    <div class="activity-content">{{ activity.content }}</div>
                  </div>
                </div>
              </div>

              <!-- 关键指标 -->
              <div class="key-metrics">
                <div class="metric-item">
                  <span class="metric-label">沟通频次</span>
                  <span class="metric-value">{{ pair.communicationFrequency }}次/周</span>
                </div>
                <div class="metric-item">
                  <span class="metric-label">目标完成</span>
                  <span class="metric-value">{{ pair.goalsCompleted }}/{{ pair.totalGoals }}</span>
                </div>
                <div class="metric-item">
                  <span class="metric-label">下次评估</span>
                  <span class="metric-value">{{ formatDate(pair.nextEvaluation) }}</span>
                </div>
              </div>

              <div class="card-footer">
                <el-button size="small" @click="viewProgress(pair)">
                  查看进度
                </el-button>
                <el-button size="small" type="primary" @click="createPlan(pair)">
                  制定计划
                </el-button>
                <el-button
                  size="small"
                  type="success"
                  @click="evaluate(pair)"
                  v-if="needsEvaluation(pair)"
                >
                  立即评估
                </el-button>
              </div>
            </div>
          </div>
        </div>
      </el-tab-pane>

      <!-- 师傅库管理 -->
      <el-tab-pane label="师傅库" name="mentors">
        <MentorPoolManagement @mentor-selected="handleMentorSelected" />
      </el-tab-pane>

      <!-- 带教计划 -->
      <el-tab-pane label="带教计划" name="plans">
        <MentoringPlansManagement />
      </el-tab-pane>

      <!-- 评估报告 -->
      <el-tab-pane label="评估报告" name="evaluations">
        <EvaluationReportsManagement />
      </el-tab-pane>

      <!-- 数据分析 -->
      <el-tab-pane label="数据分析" name="analytics">
        <MentoringAnalytics />
      </el-tab-pane>
    </el-tabs>

    <!-- 师徒关系建立对话框 -->
    <CreateMentoringDialog
      v-model:visible="showCreateDialog"
      @create="handleCreateMentoringPair"
    />

    <!-- 带教计划对话框 -->
    <MentoringPlanDialog
      v-model:visible="showPlanDialog"
      :mentoring-pair="selectedPair"
      @save="handlePlanSave"
    />

    <!-- 进度跟踪对话框 -->
    <ProgressTrackingDialog
      v-model:visible="showProgressDialog"
      :mentoring-pair="selectedPair"
    />

    <!-- 评估对话框 -->
    <EvaluationDialog
      v-model:visible="showEvaluationDialog"
      :mentoring-pair="selectedPair"
      @evaluate="handleEvaluation"
    />

    <!-- 师徒详情对话框 -->
    <MentoringDetailDialog
      v-model:visible="showDetailDialog"
      :mentoring-pair="selectedPair"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Plus, Download, UserFilled, Search, ArrowDown, Star, User
} from '@element-plus/icons-vue'

// 导入子组件
import MentorPoolManagement from '../components/MentorPoolManagement.vue'
import MentoringPlansManagement from '../components/MentoringPlansManagement.vue'
import EvaluationReportsManagement from '../components/EvaluationReportsManagement.vue'
import MentoringAnalytics from '../components/MentoringAnalytics.vue'
import CreateMentoringDialog from '../components/CreateMentoringDialog.vue'
import MentoringPlanDialog from '../components/MentoringPlanDialog.vue'
import ProgressTrackingDialog from '../components/ProgressTrackingDialog.vue'
import EvaluationDialog from '../components/EvaluationDialog.vue'
import MentoringDetailDialog from '../components/MentoringDetailDialog.vue'

// 页面状态
const activeTab = ref('relationships')
const showCreateDialog = ref(false)
const showPlanDialog = ref(false)
const showProgressDialog = ref(false)
const showEvaluationDialog = ref(false)
const showDetailDialog = ref(false)
const selectedPair = ref<any>(null)

// 筛选状态
const filterStatus = ref('')
const filterDepartment = ref('')
const filterLevel = ref('')
const searchKeyword = ref('')

// 模拟师徒关系数据
const mentoringRelationships = ref([
  {
    id: 'pair-1',
    mentor: {
      id: 'mentor-1',
      name: '张资深',
      title: '高级架构师',
      department: '技术部',
      avatar: '',
      experience: 8,
      menteesCount: 3,
      rating: 4.8
    },
    mentee: {
      id: 'mentee-1',
      name: '李新人',
      title: '初级开发工程师',
      department: '技术部',
      avatar: '',
      joinDate: '2024-01-01',
      currentScore: 85
    },
    startDate: '2024-01-15',
    duration: 6,
    progress: 35,
    status: 'active',
    menteeLevel: 'newcomer',
    communicationFrequency: 3,
    goalsCompleted: 4,
    totalGoals: 12,
    nextEvaluation: '2024-02-15',
    isUrgent: false,
    recentActivities: [
      {
        id: 'act-1',
        content: '完成了第二阶段技能评估',
        time: '2024-01-18T14:30:00'
      },
      {
        id: 'act-2',
        content: '提交了项目实践报告',
        time: '2024-01-17T16:20:00'
      }
    ]
  },
  {
    id: 'pair-2',
    mentor: {
      id: 'mentor-2',
      name: '王经理',
      title: '产品经理',
      department: '产品部',
      avatar: '',
      experience: 6,
      menteesCount: 2,
      rating: 4.6
    },
    mentee: {
      id: 'mentee-2',
      name: '陈转岗',
      title: '产品专员',
      department: '产品部',
      avatar: '',
      joinDate: '2023-08-15',
      currentScore: 92
    },
    startDate: '2024-01-10',
    duration: 4,
    progress: 60,
    status: 'active',
    menteeLevel: 'transfer',
    communicationFrequency: 2,
    goalsCompleted: 6,
    totalGoals: 10,
    nextEvaluation: '2024-02-10',
    isUrgent: true,
    recentActivities: [
      {
        id: 'act-3',
        content: '需求分析能力评估优秀',
        time: '2024-01-19T10:15:00'
      }
    ]
  }
])

// 计算统计数据
const mentoringStats = computed(() => {
  const totalPairs = mentoringRelationships.value.length
  const activePairs = mentoringRelationships.value.filter(p => p.status === 'active').length
  const mentors = new Set(mentoringRelationships.value.map(p => p.mentor.id))
  const avgRating = mentoringRelationships.value.reduce((sum, p) => sum + p.mentor.rating, 0) / totalPairs
  
  return {
    totalPairs,
    newPairsThisMonth: 3,
    activeMentors: mentors.size,
    avgMenteesPerMentor: 2.5,
    activeMentees: activePairs,
    completionRate: 85,
    averageRating: avgRating
  }
})

// 筛选后的师徒关系
const filteredRelationships = computed(() => {
  let filtered = mentoringRelationships.value

  if (filterStatus.value) {
    filtered = filtered.filter(p => p.status === filterStatus.value)
  }

  if (filterDepartment.value) {
    filtered = filtered.filter(p => 
      p.mentor.department === filterDepartment.value ||
      p.mentee.department === filterDepartment.value
    )
  }

  if (filterLevel.value) {
    filtered = filtered.filter(p => p.menteeLevel === filterLevel.value)
  }

  if (searchKeyword.value) {
    const keyword = searchKeyword.value.toLowerCase()
    filtered = filtered.filter(p => 
      p.mentor.name.toLowerCase().includes(keyword) ||
      p.mentee.name.toLowerCase().includes(keyword)
    )
  }

  return filtered
})

// 工具方法
const getStatusColor = (status: string) => {
  const colors = {
    active: 'success',
    completed: 'primary',
    paused: 'warning',
    terminated: 'danger'
  }
  return colors[status] || 'info'
}

const getStatusText = (status: string) => {
  const texts = {
    active: '进行中',
    completed: '已完成',
    paused: '已暂停',
    terminated: '已终止'
  }
  return texts[status] || status
}

const getMenteeLevelText = (level: string) => {
  const texts = {
    newcomer: '新员工',
    transfer: '转岗培养',
    skill: '技能提升',
    management: '管理培养'
  }
  return texts[level] || level
}

const getProgressColor = (progress: number) => {
  if (progress >= 80) return '#67c23a'
  if (progress >= 50) return '#e6a23c'
  return '#f56c6c'
}

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('zh-CN')
}

const formatDaysAgo = (dateString: string) => {
  const date = new Date(dateString)
  const now = new Date()
  const days = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24))
  return `${days}天前`
}

const formatRelativeTime = (dateString: string) => {
  const date = new Date(dateString)
  const now = new Date()
  const hours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60))
  
  if (hours < 1) return '刚刚'
  if (hours < 24) return `${hours}小时前`
  const days = Math.floor(hours / 24)
  return `${days}天前`
}

const needsEvaluation = (pair: any) => {
  const nextEval = new Date(pair.nextEvaluation)
  const now = new Date()
  return nextEval <= now
}

// 操作方法
const createMentoringPair = () => {
  showCreateDialog.value = true
}

const showMentorPool = () => {
  activeTab.value = 'mentors'
}

const viewProgress = (pair: any) => {
  selectedPair.value = pair
  showProgressDialog.value = true
}

const createPlan = (pair: any) => {
  selectedPair.value = pair
  showPlanDialog.value = true
}

const evaluate = (pair: any) => {
  selectedPair.value = pair
  showEvaluationDialog.value = true
}

const handleRelationshipAction = (action: string, pair: any) => {
  selectedPair.value = pair
  
  switch (action) {
    case 'view':
      showDetailDialog.value = true
      break
    case 'plan':
      showPlanDialog.value = true
      break
    case 'progress':
      showProgressDialog.value = true
      break
    case 'evaluate':
      showEvaluationDialog.value = true
      break
    case 'pause':
      handlePauseMentoring(pair)
      break
    case 'resume':
      handleResumeMentoring(pair)
      break
    case 'complete':
      handleCompleteMentoring(pair)
      break
    case 'terminate':
      handleTerminateMentoring(pair)
      break
  }
}

const handleCreateMentoringPair = (pairData: any) => {
  const newPair = {
    id: `pair-${Date.now()}`,
    ...pairData,
    startDate: new Date().toISOString(),
    progress: 0,
    status: 'active',
    communicationFrequency: 0,
    goalsCompleted: 0,
    totalGoals: 0,
    recentActivities: []
  }
  
  mentoringRelationships.value.push(newPair)
  ElMessage.success('师徒关系建立成功')
}

const handlePlanSave = (planData: any) => {
  if (selectedPair.value) {
    selectedPair.value.plan = planData
    selectedPair.value.totalGoals = planData.goals?.length || 0
    ElMessage.success('带教计划保存成功')
  }
}

const handleEvaluation = (evaluationData: any) => {
  if (selectedPair.value) {
    selectedPair.value.mentee.currentScore = evaluationData.score
    selectedPair.value.progress = evaluationData.progress
    
    // 更新下次评估时间
    const nextEval = new Date()
    nextEval.setMonth(nextEval.getMonth() + 1)
    selectedPair.value.nextEvaluation = nextEval.toISOString()
    
    ElMessage.success('评估完成')
  }
}

const handleMentorSelected = (mentor: any) => {
  ElMessage.info(`选择了师傅：${mentor.name}`)
}

const handlePauseMentoring = (pair: any) => {
  ElMessageBox.confirm('确定暂停这个师徒关系吗？', '暂停带教', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    pair.status = 'paused'
    ElMessage.success('师徒关系已暂停')
  })
}

const handleResumeMentoring = (pair: any) => {
  pair.status = 'active'
  ElMessage.success('师徒关系已恢复')
}

const handleCompleteMentoring = (pair: any) => {
  ElMessageBox.confirm('确定完成这个师徒关系吗？', '完成带教', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'success'
  }).then(() => {
    pair.status = 'completed'
    pair.progress = 100
    ElMessage.success('带教已完成')
  })
}

const handleTerminateMentoring = (pair: any) => {
  ElMessageBox.confirm('确定终止这个师徒关系吗？', '终止关系', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'error'
  }).then(() => {
    pair.status = 'terminated'
    ElMessage.success('师徒关系已终止')
  })
}

const exportMentoringData = () => {
  ElMessage.success('正在导出师徒带教数据...')
}

// 生命周期
onMounted(() => {
  // 初始化数据
})
</script>

<style scoped>
.mentoring-management {
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

.metrics-overview {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
  margin-bottom: 20px;
}

.metrics-card {
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.metric-detail {
  margin-top: 8px;
  font-size: 14px;
  color: #666;
}

.trend-up {
  color: #67c23a;
}

.completion-rate {
  color: #409eff;
}

.mentoring-tabs {
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.relationships-content {
  padding: 20px;
}

.filter-section {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding: 16px;
  background: #f8f9fa;
  border-radius: 8px;
}

.filter-left {
  display: flex;
  gap: 12px;
  align-items: center;
}

.relationships-list {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.relationship-card {
  border: 1px solid #e8e8e8;
  border-radius: 12px;
  padding: 24px;
  background: #fff;
  transition: all 0.3s;
}

.relationship-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.relationship-card.active {
  border-color: #67c23a;
  background: linear-gradient(135deg, #fff 0%, #f0f9ff 100%);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.relationship-status {
  display: flex;
  gap: 8px;
}

.relationship-content {
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  gap: 24px;
  align-items: center;
  margin-bottom: 20px;
}

.mentor-section,
.mentee-section {
  display: flex;
  align-items: center;
  gap: 16px;
}

.person-info {
  display: flex;
  align-items: center;
  gap: 16px;
}

.person-details h4 {
  margin: 0 0 4px 0;
  font-size: 16px;
  color: #333;
  font-weight: 600;
}

.person-details .title {
  margin: 0 0 2px 0;
  font-size: 14px;
  color: #666;
  font-weight: 500;
}

.person-details .department {
  margin: 0 0 8px 0;
  font-size: 12px;
  color: #999;
}

.mentor-stats,
.mentee-stats {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.stat-item {
  font-size: 12px;
  color: #666;
}

.mentor-rating {
  display: flex;
  align-items: center;
  gap: 4px;
}

.rating-text {
  font-size: 12px;
  color: #666;
}

.mentee-score {
  display: flex;
  align-items: center;
  gap: 4px;
}

.score-label {
  font-size: 12px;
  color: #666;
}

.score-value {
  font-size: 12px;
  color: #67c23a;
  font-weight: 600;
}

.mentor-badge,
.mentee-badge {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 8px;
  background: #f8f9fa;
  border-radius: 6px;
  font-size: 12px;
  color: #666;
}

.connection-line {
  display: flex;
  flex-direction: column;
  align-items: center;
  position: relative;
}

.connection-line::before {
  content: '';
  position: absolute;
  top: 0;
  bottom: 0;
  left: 50%;
  width: 2px;
  background: linear-gradient(to bottom, #67c23a, #409eff);
  transform: translateX(-50%);
}

.connection-info {
  background: #fff;
  padding: 16px;
  border-radius: 8px;
  border: 2px solid #e8e8e8;
  text-align: center;
  position: relative;
  z-index: 1;
}

.connection-info .label {
  display: block;
  font-size: 10px;
  color: #999;
  margin-bottom: 2px;
}

.connection-info .date,
.connection-info .value {
  font-size: 12px;
  color: #333;
  font-weight: 500;
}

.progress-indicator {
  margin-top: 8px;
}

.progress-text {
  font-size: 12px;
  color: #666;
  margin-top: 4px;
}

.recent-activities {
  margin-bottom: 16px;
}

.recent-activities h5 {
  margin: 0 0 8px 0;
  font-size: 14px;
  color: #333;
}

.activities-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.activity-item {
  display: flex;
  gap: 12px;
  padding: 8px 12px;
  background: #f8f9fa;
  border-radius: 6px;
}

.activity-time {
  font-size: 12px;
  color: #999;
  white-space: nowrap;
}

.activity-content {
  font-size: 12px;
  color: #666;
}

.key-metrics {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
  padding: 16px;
  background: #f8f9fa;
  border-radius: 8px;
  margin-bottom: 16px;
}

.metric-item {
  text-align: center;
}

.metric-label {
  display: block;
  font-size: 12px;
  color: #999;
  margin-bottom: 4px;
}

.metric-value {
  font-size: 14px;
  color: #333;
  font-weight: 600;
}

.card-footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}
</style> 