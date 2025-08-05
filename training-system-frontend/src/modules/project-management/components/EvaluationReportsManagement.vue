<template>
  <div class="evaluation-reports-management">
    <!-- 评估统计 -->
    <div class="evaluation-stats">
      <el-card class="stat-card">
        <el-statistic title="总报告数" :value="evaluationStats.total" />
        <div class="stat-detail">
          <span class="pending">待审核: {{ evaluationStats.pending }}</span>
        </div>
      </el-card>
      
      <el-card class="stat-card">
        <el-statistic title="平均评分" :value="evaluationStats.averageScore" :precision="1" />
        <div class="stat-detail">
          <el-rate :model-value="evaluationStats.averageScore" disabled size="small" />
        </div>
      </el-card>
      
      <el-card class="stat-card">
        <el-statistic title="本月完成" :value="evaluationStats.completedThisMonth" />
        <div class="stat-detail">
          <span class="trend-up">环比+{{ evaluationStats.growth }}%</span>
        </div>
      </el-card>
      
      <el-card class="stat-card">
        <el-statistic title="优秀率" :value="evaluationStats.excellentRate" suffix="%" />
        <div class="stat-detail">
          <span>良好率: {{ evaluationStats.goodRate }}%</span>
        </div>
      </el-card>
    </div>

    <!-- 操作栏 -->
    <div class="action-bar">
      <div class="action-left">
        <el-button type="primary" @click="showCreateDialog = true">
          <el-icon><Plus /></el-icon>
          新建评估
        </el-button>
        <el-button @click="batchProcess">
          <el-icon><Edit /></el-icon>
          批量处理
        </el-button>
        <el-button @click="generateReport">
          <el-icon><Document /></el-icon>
          生成报告
        </el-button>
        <el-button @click="exportData">
          <el-icon><Download /></el-icon>
          导出数据
        </el-button>
      </div>
      <div class="action-right">
        <el-input
          v-model="searchKeyword"
          placeholder="搜索师傅、徒弟、评估内容"
          style="width: 300px"
          clearable
        >
          <template #prefix>
            <el-icon><Search /></el-icon>
          </template>
        </el-input>
      </div>
    </div>

    <!-- 筛选器 -->
    <div class="filter-section">
      <el-select v-model="filterStatus" placeholder="状态" clearable style="width: 120px">
        <el-option label="全部" value="" />
        <el-option label="待评估" value="pending" />
        <el-option label="已完成" value="completed" />
        <el-option label="已审核" value="reviewed" />
        <el-option label="需修改" value="revision" />
      </el-select>
      
      <el-select v-model="filterType" placeholder="评估类型" clearable style="width: 150px">
        <el-option label="全部" value="" />
        <el-option label="阶段评估" value="stage" />
        <el-option label="月度评估" value="monthly" />
        <el-option label="季度评估" value="quarterly" />
        <el-option label="最终评估" value="final" />
      </el-select>
      
      <el-select v-model="filterScore" placeholder="评分等级" clearable style="width: 150px">
        <el-option label="全部" value="" />
        <el-option label="优秀(90+)" value="excellent" />
        <el-option label="良好(80-89)" value="good" />
        <el-option label="合格(60-79)" value="pass" />
        <el-option label="不合格(<60)" value="fail" />
      </el-select>
      
      <el-date-picker
        v-model="filterDateRange"
        type="daterange"
        range-separator="至"
        start-placeholder="开始日期"
        end-placeholder="结束日期"
        style="width: 240px"
        clearable
      />
    </div>

    <!-- 评估报告列表 -->
    <div class="reports-list">
      <div
        v-for="report in filteredReports"
        :key="report.id"
        class="report-card"
        :class="{ 'urgent': report.isUrgent }"
      >
        <div class="card-header">
          <div class="report-title">
            <h3>{{ report.title }}</h3>
            <div class="report-meta">
              <el-tag :type="getStatusColor(report.status)">
                {{ getStatusText(report.status) }}
              </el-tag>
              <el-tag type="info" size="small">
                {{ getTypeText(report.type) }}
              </el-tag>
              <span v-if="report.isUrgent" class="urgent-badge">
                <el-icon><Warning /></el-icon>
                逾期
              </span>
            </div>
          </div>
          <div class="card-actions">
            <el-dropdown @command="(action) => handleReportAction(action, report)">
              <el-button size="small" type="text">
                更多 <el-icon><ArrowDown /></el-icon>
              </el-button>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item command="view">查看详情</el-dropdown-item>
                  <el-dropdown-item command="edit">编辑评估</el-dropdown-item>
                  <el-dropdown-item command="review">审核评估</el-dropdown-item>
                  <el-dropdown-item command="comment">添加评论</el-dropdown-item>
                  <el-dropdown-item command="export">导出报告</el-dropdown-item>
                  <el-dropdown-item command="duplicate">复制评估</el-dropdown-item>
                  <el-dropdown-item command="delete" divided>删除评估</el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </div>
        </div>

        <div class="report-content">
          <!-- 师徒信息 -->
          <div class="participants-info">
            <div class="participant mentor">
              <el-avatar :size="50" :src="report.mentor.avatar">
                {{ report.mentor.name[0] }}
              </el-avatar>
              <div class="participant-details">
                <h4>{{ report.mentor.name }}</h4>
                <p>{{ report.mentor.title }}</p>
                <p class="department">{{ report.mentor.department }}</p>
              </div>
              <el-tag type="warning" size="small">师傅</el-tag>
            </div>
            
            <div class="evaluation-arrow">
              <el-icon><ArrowRight /></el-icon>
              <span class="evaluation-label">评估</span>
            </div>
            
            <div class="participant mentee">
              <el-avatar :size="50" :src="report.mentee.avatar">
                {{ report.mentee.name[0] }}
              </el-avatar>
              <div class="participant-details">
                <h4>{{ report.mentee.name }}</h4>
                <p>{{ report.mentee.title }}</p>
                <p class="department">{{ report.mentee.department }}</p>
              </div>
              <el-tag type="success" size="small">徒弟</el-tag>
            </div>
          </div>

          <!-- 评估概览 -->
          <div class="evaluation-overview">
            <div class="score-section">
              <div class="overall-score">
                <span class="score-label">综合评分</span>
                <div class="score-value" :class="getScoreClass(report.overallScore)">
                  {{ report.overallScore }}
                </div>
                <div class="score-rating">
                  <el-rate :model-value="report.overallScore / 20" disabled />
                  <span class="rating-text">{{ getScoreLevel(report.overallScore) }}</span>
                </div>
              </div>
              
              <div class="dimension-scores">
                <div
                  v-for="dimension in report.dimensionScores"
                  :key="dimension.name"
                  class="dimension-item"
                >
                  <span class="dimension-name">{{ dimension.name }}</span>
                  <div class="dimension-progress">
                    <el-progress
                      :percentage="dimension.score"
                      :color="getScoreColor(dimension.score)"
                      :stroke-width="6"
                      :show-text="false"
                    />
                    <span class="dimension-score">{{ dimension.score }}</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div class="evaluation-summary">
              <h4>评估总结</h4>
              <p class="summary-text">{{ report.summary }}</p>
              
              <div class="strengths-weaknesses">
                <div class="strengths">
                  <h5><el-icon><CircleCheck /></el-icon> 优势表现</h5>
                  <ul>
                    <li v-for="strength in report.strengths" :key="strength">
                      {{ strength }}
                    </li>
                  </ul>
                </div>
                
                <div class="weaknesses">
                  <h5><el-icon><WarningFilled /></el-icon> 改进建议</h5>
                  <ul>
                    <li v-for="improvement in report.improvements" :key="improvement">
                      {{ improvement }}
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          <!-- 评估详情 -->
          <div class="evaluation-details">
            <div class="detail-item">
              <span class="detail-label">评估周期</span>
              <span class="detail-value">{{ formatDate(report.periodStart) }} - {{ formatDate(report.periodEnd) }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">评估时间</span>
              <span class="detail-value">{{ formatDateTime(report.evaluationDate) }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">评估方式</span>
              <span class="detail-value">{{ report.evaluationMethod }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">下次评估</span>
              <span class="detail-value">{{ formatDate(report.nextEvaluation) }}</span>
            </div>
          </div>

          <!-- 评估进展 -->
          <div class="evaluation-progress">
            <h4>能力发展轨迹</h4>
            <div class="progress-chart">
              <div
                v-for="(milestone, index) in report.milestones"
                :key="milestone.id"
                class="milestone"
                :class="{ 'achieved': milestone.achieved }"
              >
                <div class="milestone-marker">
                  <el-icon v-if="milestone.achieved"><Check /></el-icon>
                  <span v-else>{{ index + 1 }}</span>
                </div>
                <div class="milestone-content">
                  <h5>{{ milestone.title }}</h5>
                  <p>{{ milestone.description }}</p>
                  <span class="milestone-date">{{ formatDate(milestone.targetDate) }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 新建评估对话框 -->
    <el-dialog
      v-model="showCreateDialog"
      title="新建评估报告"
      width="800px"
    >
      <el-form :model="evaluationForm" label-width="120px">
        <el-form-item label="评估标题" required>
          <el-input v-model="evaluationForm.title" placeholder="请输入评估标题" />
        </el-form-item>
        
        <el-form-item label="评估类型" required>
          <el-select v-model="evaluationForm.type" placeholder="请选择评估类型">
            <el-option label="阶段评估" value="stage" />
            <el-option label="月度评估" value="monthly" />
            <el-option label="季度评估" value="quarterly" />
            <el-option label="最终评估" value="final" />
          </el-select>
        </el-form-item>
        
        <el-form-item label="师徒关系" required>
          <el-select v-model="evaluationForm.relationshipId" placeholder="请选择师徒关系">
            <el-option
              v-for="relationship in availableRelationships"
              :key="relationship.id"
              :label="`${relationship.mentor.name} - ${relationship.mentee.name}`"
              :value="relationship.id"
            />
          </el-select>
        </el-form-item>
        
        <el-form-item label="评估周期">
          <el-date-picker
            v-model="evaluationForm.periodRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
          />
        </el-form-item>
        
        <el-form-item label="评估方式">
          <el-radio-group v-model="evaluationForm.method">
            <el-radio label="一对一面谈">一对一面谈</el-radio>
            <el-radio label="360度评估">360度评估</el-radio>
            <el-radio label="项目评估">项目评估</el-radio>
            <el-radio label="综合评估">综合评估</el-radio>
          </el-radio-group>
        </el-form-item>
        
        <el-form-item label="评估维度">
          <div class="dimensions-form">
            <div
              v-for="dimension in evaluationForm.dimensions"
              :key="dimension.name"
              class="dimension-form-item"
            >
              <span class="dimension-name">{{ dimension.name }}</span>
              <el-slider
                v-model="dimension.score"
                :max="100"
                :step="5"
                show-input
                input-size="small"
                style="width: 200px"
              />
            </div>
          </div>
        </el-form-item>
        
        <el-form-item label="评估总结">
          <el-input
            v-model="evaluationForm.summary"
            type="textarea"
            :autosize="{ minRows: 3, maxRows: 6 }"
            placeholder="请输入评估总结"
          />
        </el-form-item>
      </el-form>
      
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="showCreateDialog = false">取消</el-button>
          <el-button type="primary" @click="handleCreateEvaluation">创建</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, reactive } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Plus, Edit, Document, Download, Search, ArrowDown, Warning,
  ArrowRight, CircleCheck, WarningFilled, Check
} from '@element-plus/icons-vue'

// 状态管理
const showCreateDialog = ref(false)
const searchKeyword = ref('')
const filterStatus = ref('')
const filterType = ref('')
const filterScore = ref('')
const filterDateRange = ref<[Date, Date] | null>(null)

// 表单数据
const evaluationForm = reactive({
  title: '',
  type: '',
  relationshipId: '',
  periodRange: null as [Date, Date] | null,
  method: '一对一面谈',
  dimensions: [
    { name: '专业技能', score: 80 },
    { name: '学习能力', score: 85 },
    { name: '沟通协作', score: 75 },
    { name: '工作态度', score: 90 },
    { name: '创新思维', score: 70 }
  ],
  summary: ''
})

// 模拟数据
const reportList = ref([
  {
    id: 'eval-1',
    title: '李新人第一季度技能评估',
    type: 'quarterly',
    status: 'completed',
    mentor: {
      id: 'mentor-1',
      name: '张资深',
      title: '高级架构师',
      department: '技术部',
      avatar: ''
    },
    mentee: {
      id: 'mentee-1',
      name: '李新人',
      title: '初级工程师',
      department: '技术部',
      avatar: ''
    },
    overallScore: 82,
    dimensionScores: [
      { name: '专业技能', score: 80 },
      { name: '学习能力', score: 85 },
      { name: '沟通协作', score: 78 },
      { name: '工作态度', score: 90 },
      { name: '创新思维', score: 75 }
    ],
    summary: '李新人在本季度表现良好，专业技能有显著提升，学习积极性很高。需要在沟通协作和创新思维方面继续加强。',
    strengths: [
      '学习能力强，能够快速掌握新技术',
      '工作态度认真负责，执行力强',
      '代码质量有明显改善'
    ],
    improvements: [
      '需要提高团队协作能力',
      '建议多参与技术讨论',
      '可以尝试承担更有挑战性的任务'
    ],
    periodStart: '2024-01-01',
    periodEnd: '2024-03-31',
    evaluationDate: '2024-04-02T14:30:00',
    evaluationMethod: '一对一面谈',
    nextEvaluation: '2024-07-01',
    isUrgent: false,
    milestones: [
      {
        id: 'milestone-1',
        title: '基础框架掌握',
        description: '熟练使用Vue.js进行开发',
        targetDate: '2024-02-01',
        achieved: true
      },
      {
        id: 'milestone-2',
        title: '独立模块开发',
        description: '能够独立完成小型功能模块',
        targetDate: '2024-03-01',
        achieved: true
      },
      {
        id: 'milestone-3',
        title: '团队协作提升',
        description: '提高代码评审和团队沟通能力',
        targetDate: '2024-04-01',
        achieved: false
      }
    ]
  }
])

const availableRelationships = ref([
  {
    id: 'rel-1',
    mentor: { name: '张资深' },
    mentee: { name: '李新人' }
  },
  {
    id: 'rel-2',
    mentor: { name: '王专家' },
    mentee: { name: '陈学员' }
  }
])

// 统计数据
const evaluationStats = computed(() => {
  const total = reportList.value.length
  const pending = reportList.value.filter(r => r.status === 'pending').length
  const avgScore = reportList.value.reduce((sum, r) => sum + r.overallScore, 0) / total
  const excellent = reportList.value.filter(r => r.overallScore >= 90).length
  const good = reportList.value.filter(r => r.overallScore >= 80 && r.overallScore < 90).length
  
  return {
    total,
    pending,
    averageScore: avgScore,
    completedThisMonth: 8,
    growth: 20,
    excellentRate: Math.round((excellent / total) * 100),
    goodRate: Math.round((good / total) * 100)
  }
})

// 筛选后的报告列表
const filteredReports = computed(() => {
  let filtered = reportList.value

  if (filterStatus.value) {
    filtered = filtered.filter(r => r.status === filterStatus.value)
  }

  if (filterType.value) {
    filtered = filtered.filter(r => r.type === filterType.value)
  }

  if (filterScore.value) {
    const score = r => r.overallScore
    switch (filterScore.value) {
      case 'excellent':
        filtered = filtered.filter(r => score(r) >= 90)
        break
      case 'good':
        filtered = filtered.filter(r => score(r) >= 80 && score(r) < 90)
        break
      case 'pass':
        filtered = filtered.filter(r => score(r) >= 60 && score(r) < 80)
        break
      case 'fail':
        filtered = filtered.filter(r => score(r) < 60)
        break
    }
  }

  if (searchKeyword.value) {
    const keyword = searchKeyword.value.toLowerCase()
    filtered = filtered.filter(r => 
      r.title.toLowerCase().includes(keyword) ||
      r.mentor.name.toLowerCase().includes(keyword) ||
      r.mentee.name.toLowerCase().includes(keyword)
    )
  }

  return filtered
})

// 工具方法
const getStatusColor = (status: string) => {
  const colors = {
    pending: 'warning',
    completed: 'success',
    reviewed: 'primary',
    revision: 'danger'
  }
  return colors[status] || 'info'
}

const getStatusText = (status: string) => {
  const texts = {
    pending: '待评估',
    completed: '已完成',
    reviewed: '已审核',
    revision: '需修改'
  }
  return texts[status] || status
}

const getTypeText = (type: string) => {
  const texts = {
    stage: '阶段评估',
    monthly: '月度评估',
    quarterly: '季度评估',
    final: '最终评估'
  }
  return texts[type] || type
}

const getScoreClass = (score: number) => {
  if (score >= 90) return 'excellent'
  if (score >= 80) return 'good'
  if (score >= 60) return 'pass'
  return 'fail'
}

const getScoreLevel = (score: number) => {
  if (score >= 90) return '优秀'
  if (score >= 80) return '良好'
  if (score >= 60) return '合格'
  return '不合格'
}

const getScoreColor = (score: number) => {
  if (score >= 90) return '#67c23a'
  if (score >= 80) return '#409eff'
  if (score >= 60) return '#e6a23c'
  return '#f56c6c'
}

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('zh-CN')
}

const formatDateTime = (dateString: string) => {
  return new Date(dateString).toLocaleString('zh-CN')
}

// 操作方法
const handleReportAction = (action: string, report: any) => {
  switch (action) {
    case 'view':
      ElMessage.info(`查看评估: ${report.title}`)
      break
    case 'edit':
      ElMessage.info(`编辑评估: ${report.title}`)
      break
    case 'review':
      ElMessage.info(`审核评估: ${report.title}`)
      break
    case 'comment':
      ElMessage.info(`添加评论: ${report.title}`)
      break
    case 'export':
      ElMessage.success(`正在导出: ${report.title}`)
      break
    case 'duplicate':
      ElMessage.success(`已复制评估: ${report.title}`)
      break
    case 'delete':
      ElMessageBox.confirm(`确定删除评估 "${report.title}"？`, '删除确认', {
        type: 'warning'
      }).then(() => {
        const index = reportList.value.findIndex(r => r.id === report.id)
        if (index > -1) {
          reportList.value.splice(index, 1)
          ElMessage.success('评估已删除')
        }
      })
      break
  }
}

const handleCreateEvaluation = () => {
  if (!evaluationForm.title || !evaluationForm.type || !evaluationForm.relationshipId) {
    ElMessage.error('请填写必填项')
    return
  }

  const relationship = availableRelationships.value.find(r => r.id === evaluationForm.relationshipId)
  const overallScore = Math.round(
    evaluationForm.dimensions.reduce((sum, d) => sum + d.score, 0) / evaluationForm.dimensions.length
  )

  const newEvaluation = {
    id: `eval-${Date.now()}`,
    title: evaluationForm.title,
    type: evaluationForm.type,
    status: 'pending',
    mentor: relationship!.mentor,
    mentee: relationship!.mentee,
    overallScore,
    dimensionScores: [...evaluationForm.dimensions],
    summary: evaluationForm.summary,
    strengths: [],
    improvements: [],
    periodStart: evaluationForm.periodRange?.[0]?.toISOString().split('T')[0] || new Date().toISOString().split('T')[0],
    periodEnd: evaluationForm.periodRange?.[1]?.toISOString().split('T')[0] || new Date().toISOString().split('T')[0],
    evaluationDate: new Date().toISOString(),
    evaluationMethod: evaluationForm.method,
    nextEvaluation: new Date().toISOString().split('T')[0],
    isUrgent: false,
    milestones: []
  }

  reportList.value.push(newEvaluation)
  showCreateDialog.value = false
  
  // 重置表单
  Object.assign(evaluationForm, {
    title: '',
    type: '',
    relationshipId: '',
    periodRange: null,
    method: '一对一面谈',
    dimensions: [
      { name: '专业技能', score: 80 },
      { name: '学习能力', score: 85 },
      { name: '沟通协作', score: 75 },
      { name: '工作态度', score: 90 },
      { name: '创新思维', score: 70 }
    ],
    summary: ''
  })
  
  ElMessage.success('评估创建成功')
}

const batchProcess = () => {
  ElMessage.info('批量处理功能开发中...')
}

const generateReport = () => {
  ElMessage.success('正在生成综合报告...')
}

const exportData = () => {
  ElMessage.success('正在导出评估数据...')
}
</script>

<style scoped>
.evaluation-reports-management {
  padding: 20px;
}

.evaluation-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
  margin-bottom: 20px;
}

.stat-card {
  text-align: center;
}

.stat-detail {
  margin-top: 8px;
  font-size: 12px;
}

.pending {
  color: #e6a23c;
}

.trend-up {
  color: #67c23a;
}

.action-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.action-left {
  display: flex;
  gap: 12px;
}

.filter-section {
  display: flex;
  gap: 12px;
  margin-bottom: 20px;
}

.reports-list {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.report-card {
  border: 1px solid #e8e8e8;
  border-radius: 8px;
  padding: 20px;
  background: #fff;
  transition: all 0.3s;
}

.report-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.report-card.urgent {
  border-color: #f56c6c;
  background: linear-gradient(135deg, #fff 0%, #fef0f0 100%);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 20px;
}

.report-title h3 {
  margin: 0 0 8px 0;
  font-size: 18px;
  color: #333;
}

.report-meta {
  display: flex;
  gap: 8px;
  align-items: center;
}

.urgent-badge {
  color: #f56c6c;
  font-size: 12px;
  display: flex;
  align-items: center;
  gap: 4px;
}

.report-content {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.participants-info {
  display: flex;
  align-items: center;
  gap: 20px;
  padding: 16px;
  background: #f8f9fa;
  border-radius: 8px;
}

.participant {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
}

.participant-details h4 {
  margin: 0 0 4px 0;
  font-size: 16px;
  color: #333;
}

.participant-details p {
  margin: 2px 0;
  color: #666;
  font-size: 13px;
}

.evaluation-arrow {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  color: #409eff;
}

.evaluation-label {
  font-size: 12px;
}

.evaluation-overview {
  display: grid;
  grid-template-columns: 300px 1fr;
  gap: 20px;
  padding: 20px;
  background: #fff;
  border: 1px solid #e8e8e8;
  border-radius: 8px;
}

.overall-score {
  text-align: center;
  padding: 16px;
  background: #f8f9fa;
  border-radius: 8px;
}

.score-label {
  font-size: 14px;
  color: #666;
  margin-bottom: 8px;
  display: block;
}

.score-value {
  font-size: 48px;
  font-weight: 600;
  margin-bottom: 8px;
}

.score-value.excellent {
  color: #67c23a;
}

.score-value.good {
  color: #409eff;
}

.score-value.pass {
  color: #e6a23c;
}

.score-value.fail {
  color: #f56c6c;
}

.score-rating {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.rating-text {
  font-size: 12px;
  color: #666;
}

.dimension-scores {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.dimension-item {
  display: flex;
  align-items: center;
  gap: 12px;
}

.dimension-name {
  width: 80px;
  font-size: 13px;
  color: #333;
}

.dimension-progress {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 8px;
}

.dimension-score {
  width: 30px;
  text-align: right;
  font-size: 13px;
  color: #666;
}

.evaluation-summary h4 {
  margin: 0 0 12px 0;
  color: #333;
}

.summary-text {
  margin: 0 0 16px 0;
  color: #666;
  line-height: 1.6;
}

.strengths-weaknesses {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.strengths h5,
.weaknesses h5 {
  margin: 0 0 8px 0;
  color: #333;
  display: flex;
  align-items: center;
  gap: 6px;
}

.strengths ul,
.weaknesses ul {
  margin: 0;
  padding-left: 16px;
}

.strengths li,
.weaknesses li {
  margin: 4px 0;
  color: #666;
  font-size: 13px;
}

.evaluation-details {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 12px;
  padding: 16px;
  background: #f8f9fa;
  border-radius: 8px;
}

.detail-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.detail-label {
  font-size: 12px;
  color: #666;
}

.detail-value {
  font-weight: 500;
  color: #333;
}

.evaluation-progress h4 {
  margin: 0 0 12px 0;
  color: #333;
}

.progress-chart {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.milestone {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 12px;
  border-radius: 6px;
  transition: all 0.3s;
}

.milestone.achieved {
  background: #f0f9ff;
  border-left: 3px solid #67c23a;
}

.milestone:not(.achieved) {
  background: #f5f7fa;
  border-left: 3px solid #909399;
}

.milestone-marker {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  color: #fff;
  flex-shrink: 0;
}

.milestone.achieved .milestone-marker {
  background: #67c23a;
}

.milestone:not(.achieved) .milestone-marker {
  background: #909399;
}

.milestone-content h5 {
  margin: 0 0 4px 0;
  color: #333;
}

.milestone-content p {
  margin: 0 0 4px 0;
  color: #666;
  font-size: 13px;
}

.milestone-date {
  font-size: 12px;
  color: #999;
}

.dimensions-form {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.dimension-form-item {
  display: flex;
  align-items: center;
  gap: 12px;
}

.dimension-form-item .dimension-name {
  width: 80px;
  font-size: 13px;
}
</style> 