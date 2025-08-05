<template>
  <div class="evaluation-detail">
    <!-- 基本信息 -->
    <div class="detail-section">
      <h4>基本信息</h4>
      <el-descriptions :column="2" border>
        <el-descriptions-item label="项目名称">{{ evaluation.projectName }}</el-descriptions-item>
        <el-descriptions-item label="项目阶段">{{ evaluation.phaseName || '整体项目' }}</el-descriptions-item>
        <el-descriptions-item label="评价类型">{{ getEvaluationTypeText(evaluation.evaluationType) }}</el-descriptions-item>
        <el-descriptions-item label="评价状态">
          <el-tag :type="getStatusColor(evaluation.status)" size="small">
            {{ getStatusText(evaluation.status) }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="导师">{{ evaluation.mentorName }}</el-descriptions-item>
        <el-descriptions-item label="学员">{{ evaluation.studentName }}</el-descriptions-item>
        <el-descriptions-item label="创建时间">{{ formatDate(evaluation.createdAt) }}</el-descriptions-item>
        <el-descriptions-item label="完成时间">{{ evaluation.completedAt ? formatDate(evaluation.completedAt) : '-' }}</el-descriptions-item>
      </el-descriptions>
    </div>

    <!-- 评价结果 -->
    <div v-if="evaluation.status === 'completed'" class="detail-section">
      <h4>评价结果</h4>
      <div class="score-section">
        <div class="total-score-card">
          <div class="score-number">{{ evaluation.totalScore || 0 }}</div>
          <div class="score-label">总分</div>
          <div class="score-level" :class="getScoreLevel(evaluation.totalScore)">
            {{ getScoreLevelText(evaluation.totalScore) }}
          </div>
        </div>

        <!-- 详细评分项 -->
        <div v-if="evaluation.scores" class="detailed-scores">
          <h5>详细评分</h5>
          <div class="score-items">
            <div v-for="score in evaluation.scores" :key="score.criteria" class="score-item">
              <div class="criteria-name">{{ score.criteria }}</div>
              <div class="score-bar">
                <el-progress 
                  :percentage="score.value" 
                  :show-text="false" 
                  :stroke-width="8"
                  :color="getScoreColor(score.value)"
                />
                <span class="score-text">{{ score.value }}分</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 评价内容 -->
    <div v-if="evaluation.status === 'completed'" class="detail-section">
      <h4>评价内容</h4>
      
      <div v-if="evaluation.specificFeedback" class="feedback-section">
        <h5>具体反馈</h5>
        <div class="feedback-content">{{ evaluation.specificFeedback }}</div>
      </div>

      <div v-if="evaluation.strengths" class="feedback-section">
        <h5>优点表现</h5>
        <div class="feedback-content">{{ evaluation.strengths }}</div>
      </div>

      <div v-if="evaluation.improvementAreas" class="feedback-section">
        <h5>改进建议</h5>
        <div class="feedback-content">{{ evaluation.improvementAreas }}</div>
      </div>

      <div v-if="evaluation.suggestions" class="feedback-section">
        <h5>其他建议</h5>
        <div class="feedback-content">{{ evaluation.suggestions }}</div>
      </div>

      <div v-if="evaluation.goalAchievement" class="feedback-section">
        <h5>目标达成情况</h5>
        <div class="feedback-content">{{ evaluation.goalAchievement }}</div>
      </div>
    </div>

    <!-- 评价模板信息 -->
    <div v-if="evaluation.templateName" class="detail-section">
      <h4>模板信息</h4>
      <el-descriptions :column="1" border>
        <el-descriptions-item label="使用模板">{{ evaluation.templateName }}</el-descriptions-item>
        <el-descriptions-item v-if="evaluation.evaluationPeriod" label="评价周期">{{ getEvaluationPeriodText(evaluation.evaluationPeriod) }}</el-descriptions-item>
        <el-descriptions-item v-if="evaluation.isAnonymous !== undefined" label="匿名评价">{{ evaluation.isAnonymous ? '是' : '否' }}</el-descriptions-item>
      </el-descriptions>
    </div>

    <!-- 待评价状态的说明 -->
    <div v-if="evaluation.status === 'pending'" class="detail-section">
      <h4>评价说明</h4>
      <el-alert 
        title="该评价尚未完成" 
        type="warning" 
        description="评价仍在进行中，完成后将显示详细的评价内容和得分信息。"
        :closable="false"
      />
    </div>

    <!-- 过期评价的说明 -->
    <div v-if="evaluation.status === 'expired'" class="detail-section">
      <h4>评价说明</h4>
      <el-alert 
        title="该评价已过期" 
        type="error" 
        description="评价已超过预设的完成期限，无法再进行评价操作。"
        :closable="false"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  evaluation: any
}

defineProps<Props>()

const getEvaluationTypeText = (type: string) => {
  const textMap: Record<string, string> = {
    student_to_mentor: '学员评价导师',
    mentor_to_student: '导师评价学员',
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

const getScoreLevel = (score: number) => {
  if (!score) return 'no-score'
  if (score >= 90) return 'excellent'
  if (score >= 80) return 'good'
  if (score >= 70) return 'average'
  return 'poor'
}

const getScoreLevelText = (score: number) => {
  if (!score) return '未评分'
  if (score >= 90) return '优秀'
  if (score >= 80) return '良好'
  if (score >= 70) return '一般'
  return '较差'
}

const getScoreColor = (score: number) => {
  if (score >= 90) return '#67c23a'
  if (score >= 80) return '#409eff'
  if (score >= 70) return '#e6a23c'
  return '#f56c6c'
}

const getEvaluationPeriodText = (period: string) => {
  const textMap: Record<string, string> = {
    'PHASE_START': '阶段开始',
    'PHASE_MID': '阶段中期',
    'PHASE_END': '阶段结束',
    'PROJECT_END': '项目结束'
  }
  return textMap[period] || period
}

const formatDate = (date: Date | string) => {
  if (!date) return '-'
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleDateString('zh-CN') + ' ' + d.toLocaleTimeString('zh-CN', { 
    hour: '2-digit', 
    minute: '2-digit' 
  })
}
</script>

<style scoped>
.evaluation-detail {
  padding: 20px;
}

.detail-section {
  margin-bottom: 30px;
}

.detail-section h4 {
  margin-bottom: 16px;
  color: #303133;
  font-size: 16px;
  font-weight: 600;
}

.detail-section h5 {
  margin-bottom: 12px;
  color: #606266;
  font-size: 14px;
  font-weight: 600;
}

.score-section {
  display: flex;
  gap: 30px;
  align-items: flex-start;
}

.total-score-card {
  flex-shrink: 0;
  text-align: center;
  padding: 20px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 12px;
  color: white;
  min-width: 120px;
}

.score-number {
  font-size: 36px;
  font-weight: bold;
  margin-bottom: 8px;
}

.score-label {
  font-size: 14px;
  opacity: 0.9;
  margin-bottom: 8px;
}

.score-level {
  font-size: 12px;
  padding: 4px 8px;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.2);
}

.detailed-scores {
  flex: 1;
  max-width: 400px;
}

.score-items {
  space-y: 16px;
}

.score-item {
  margin-bottom: 16px;
}

.criteria-name {
  font-size: 14px;
  color: #606266;
  margin-bottom: 8px;
}

.score-bar {
  display: flex;
  align-items: center;
  gap: 12px;
}

.score-bar :deep(.el-progress) {
  flex: 1;
}

.score-text {
  font-size: 14px;
  font-weight: 600;
  color: #303133;
  min-width: 40px;
}

.feedback-section {
  margin-bottom: 20px;
}

.feedback-content {
  background: #f8f9fa;
  padding: 16px;
  border-radius: 8px;
  border-left: 4px solid #409eff;
  line-height: 1.6;
  color: #303133;
  min-height: 60px;
  white-space: pre-wrap;
}

.score-level.excellent {
  background: rgba(103, 194, 58, 0.2);
}

.score-level.good {
  background: rgba(64, 158, 255, 0.2);
}

.score-level.average {
  background: rgba(230, 162, 60, 0.2);
}

.score-level.poor {
  background: rgba(245, 108, 108, 0.2);
}

.score-level.no-score {
  background: rgba(144, 147, 153, 0.2);
}
</style> 