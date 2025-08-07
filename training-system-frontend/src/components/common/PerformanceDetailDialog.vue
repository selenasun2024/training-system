<template>
  <el-dialog
    v-model="visible"
    title="师徒对考核详情"
    width="800px"
    :close-on-click-modal="true"
    :close-on-press-escape="true"
    custom-class="performance-detail-dialog"
  >
    <div class="performance-detail-content">
      <div class="mentor-pairs-list">
        <div 
          v-for="(pair, index) in mentorPairs" 
          :key="index"
          class="pair-card"
        >
          <!-- 师徒对基本信息 -->
          <div class="pair-header">
            <div class="mentor-info">
              <span class="role-badge mentor">导师</span>
              <span class="name">{{ pair.mentorName }}</span>
              <span class="dept">({{ pair.mentorDepartment }})</span>
            </div>
            <div class="arrow">→</div>
            <div class="student-info">
              <span class="role-badge student">学员</span>
              <span class="name">{{ pair.studentName }}</span>
              <span class="dept">({{ pair.studentDepartment }})</span>
            </div>
          </div>

          <!-- 考核指标 -->
          <div class="performance-metrics">
            <div class="metrics-grid">
              <div class="metric-item">
                <span class="metric-label">💼 学员就业状态</span>
                <span class="metric-value" :class="pair.employment ? 'status-good' : 'status-bad'">
                  {{ pair.employment ? '✓ 在职' : '✗ 离职' }}
                </span>
              </div>
              
              <div class="metric-item">
                <span class="metric-label">📊 评价分数</span>
                <span class="metric-value score" :class="getScoreClass(pair.evaluationScore)">
                  {{ pair.evaluationScore }}/100
                </span>
              </div>
              
              <div class="metric-item">
                <span class="metric-label">⏱️ 带教时长</span>
                <span class="metric-value">{{ pair.duration }}个月</span>
              </div>
              
              <div class="metric-item">
                <span class="metric-label">⚠️ 投诉事故</span>
                <span class="metric-value" :class="pair.hasComplaints ? 'status-bad' : 'status-good'">
                  {{ pair.hasComplaints ? '✗ 有投诉' : '✓ 无投诉' }}
                </span>
              </div>
              
              <div class="metric-item">
                <span class="metric-label">💰 补贴金额</span>
                <span class="metric-value amount">¥{{ pair.subsidyAmount }}</span>
              </div>
              
              <div class="metric-item">
                <span class="metric-label">📋 发放状态</span>
                <span class="metric-value" :class="pair.paid ? 'status-good' : 'status-pending'">
                  {{ pair.paid ? '✓ 已发放' : '⏳ 未发放' }}
                </span>
              </div>
            </div>

            <!-- 绩效评估 -->
            <div class="performance-assessment">
              <div class="assessment-title">综合评估</div>
              <div class="assessment-content">
                <div class="assessment-item">
                  <span class="assessment-label">综合得分:</span>
                  <span class="assessment-score" :class="getOverallScoreClass(pair.overallScore)">
                    {{ pair.overallScore }}分
                  </span>
                </div>
                <div class="assessment-item">
                  <span class="assessment-label">评估等级:</span>
                  <span class="assessment-grade" :class="getGradeClass(pair.grade)">
                    {{ getGradeText(pair.grade) }}
                  </span>
                </div>
                <div class="assessment-item">
                  <span class="assessment-label">带教效果:</span>
                  <span class="assessment-effect">{{ getEffectText(pair.effect) }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <template #footer>
      <div class="dialog-footer">
        <el-button @click="handleClose">关闭</el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'

interface MentorPair {
  mentorName: string
  mentorDepartment: string
  studentName: string
  studentDepartment: string
  employment: boolean
  evaluationScore: number
  duration: number
  hasComplaints: boolean
  subsidyAmount: number
  paid: boolean
  overallScore: number
  grade: string
  effect: string
}

interface Props {
  modelValue: boolean
  mentorPairs: MentorPair[]
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: false,
  mentorPairs: () => []
})

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  'close': []
}>()

const visible = ref(props.modelValue)

watch(() => props.modelValue, (newVal) => {
  visible.value = newVal
})

watch(visible, (newVal) => {
  emit('update:modelValue', newVal)
})

// 工具函数
const getScoreClass = (score: number): string => {
  if (score >= 90) return 'score-excellent'
  if (score >= 80) return 'score-good'
  if (score >= 70) return 'score-fair'
  return 'score-poor'
}

const getOverallScoreClass = (score: number): string => {
  if (score >= 85) return 'overall-excellent'
  if (score >= 75) return 'overall-good'
  if (score >= 65) return 'overall-fair'
  return 'overall-poor'
}

const getGradeClass = (grade: string): string => {
  const gradeMap: Record<string, string> = {
    'A': 'grade-a',
    'B': 'grade-b', 
    'C': 'grade-c',
    'D': 'grade-d'
  }
  return gradeMap[grade] || 'grade-default'
}

const getGradeText = (grade: string): string => {
  const gradeMap: Record<string, string> = {
    'A': 'A级 (优秀)',
    'B': 'B级 (良好)',
    'C': 'C级 (合格)',
    'D': 'D级 (需改进)'
  }
  return gradeMap[grade] || grade
}

const getEffectText = (effect: string): string => {
  const effectMap: Record<string, string> = {
    'excellent': '效果显著',
    'good': '效果良好',
    'fair': '效果一般',
    'poor': '需要改进'
  }
  return effectMap[effect] || effect
}

const handleClose = () => {
  visible.value = false
  emit('close')
}
</script>

<style scoped>
.performance-detail-content {
  font-family: 'Microsoft YaHei', Arial, sans-serif;
  color: #303133;
}

.mentor-pairs-list {
  max-height: 60vh;
  overflow-y: auto;
}

.pair-card {
  margin-bottom: 20px;
  padding: 16px;
  background: white;
  border-radius: 8px;
  border: 1px solid #e4e7ed;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.pair-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid #ebeef5;
}

.mentor-info, .student-info {
  display: flex;
  align-items: center;
  gap: 8px;
}

.role-badge {
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 600;
  color: white;
}

.role-badge.mentor {
  background: #409eff;
}

.role-badge.student {
  background: #67c23a;
}

.name {
  font-weight: 600;
  font-size: 14px;
}

.dept {
  color: #909399;
  font-size: 12px;
}

.arrow {
  font-size: 18px;
  color: #909399;
  font-weight: bold;
}

.performance-metrics {
  background: #fafafa;
  border-radius: 6px;
  padding: 12px;
}

.metrics-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
  margin-bottom: 16px;
}

.metric-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 8px;
  background: white;
  border-radius: 4px;
  border: 1px solid #e4e7ed;
}

.metric-label {
  font-size: 12px;
  color: #606266;
  font-weight: 500;
}

.metric-value {
  font-size: 14px;
  font-weight: 600;
}

.metric-value.score {
  font-size: 16px;
}

.metric-value.amount {
  color: #67c23a;
  font-size: 16px;
}

.status-good {
  color: #67c23a;
}

.status-bad {
  color: #f56c6c;
}

.status-pending {
  color: #e6a23c;
}

.score-excellent {
  color: #67c23a;
}

.score-good {
  color: #409eff;
}

.score-fair {
  color: #e6a23c;
}

.score-poor {
  color: #f56c6c;
}

.performance-assessment {
  border-top: 1px solid #e4e7ed;
  padding-top: 12px;
}

.assessment-title {
  font-size: 14px;
  font-weight: 600;
  color: #606266;
  margin-bottom: 8px;
}

.assessment-content {
  display: flex;
  gap: 20px;
  flex-wrap: wrap;
}

.assessment-item {
  display: flex;
  align-items: center;
  gap: 8px;
}

.assessment-label {
  font-size: 13px;
  color: #606266;
}

.assessment-score {
  font-size: 16px;
  font-weight: 700;
}

.overall-excellent {
  color: #67c23a;
}

.overall-good {
  color: #409eff;
}

.overall-fair {
  color: #e6a23c;
}

.overall-poor {
  color: #f56c6c;
}

.assessment-grade {
  font-weight: 600;
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 12px;
  color: white;
}

.grade-a {
  background: #67c23a;
}

.grade-b {
  background: #409eff;
}

.grade-c {
  background: #e6a23c;
}

.grade-d {
  background: #f56c6c;
}

.grade-default {
  background: #909399;
}

.assessment-effect {
  font-size: 13px;
  color: #303133;
  font-weight: 500;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
}

/* 滚动条样式 */
.mentor-pairs-list::-webkit-scrollbar {
  width: 6px;
}

.mentor-pairs-list::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 3px;
}

.mentor-pairs-list::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 3px;
}

.mentor-pairs-list::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}
</style>

<style>
.performance-detail-dialog {
  --el-dialog-padding-primary: 20px;
}

.performance-detail-dialog .el-dialog__body {
  padding: 20px;
  max-height: 70vh;
  overflow-y: auto;
}
</style>
