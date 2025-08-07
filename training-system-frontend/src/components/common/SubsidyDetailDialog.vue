<template>
  <el-dialog
    v-model="visible"
    :title="title"
    width="600px"
    :close-on-click-modal="true"
    :close-on-press-escape="true"
    custom-class="subsidy-detail-dialog"
  >
    <div class="subsidy-detail-content">
      <!-- 导师信息 -->
      <div class="info-section mentor-info">
        <h4 class="section-title">👤 导师信息</h4>
        <div class="info-grid">
          <div class="info-item">
            <span class="label">导师姓名：</span>
            <span class="value">{{ mentorData.mentorName }}</span>
          </div>
          <div class="info-item">
            <span class="label">所在部门：</span>
            <span class="value">{{ mentorData.department }}</span>
          </div>
          <div class="info-item">
            <span class="label">认证类型：</span>
            <span class="value">{{ getCertificationTypeText(mentorData.mentorLevel) }}</span>
          </div>
          <div class="info-item">
            <span class="label">带教学员数：</span>
            <span class="value">{{ mentorData.studentCount }}人</span>
          </div>
        </div>
      </div>

      <!-- 学员详情 -->
      <div class="info-section students-info">
        <h4 class="section-title">👨‍🎓 所有学员详情</h4>
        <div class="students-list">
          <div 
            v-for="(student, index) in studentsData" 
            :key="index"
            class="student-card"
          >
            <div class="student-header">
              <strong>{{ student.name }}</strong>
              <span class="student-dept">({{ student.department }})</span>
            </div>
            <div class="student-grid">
              <div class="grid-item">
                <span class="grid-label">评价分数:</span>
                <strong>{{ student.criteria.evaluationScore }}/100</strong>
              </div>
              <div class="grid-item">
                <span class="grid-label">在职考核:</span>
                <strong :class="student.criteria.employment ? 'text-success' : 'text-danger'">
                  {{ student.criteria.employment ? '在职' : '离职' }}
                </strong>
              </div>
              <div class="grid-item">
                <span class="grid-label">带教时长:</span>
                <strong>{{ student.criteria.duration }}个月</strong>
              </div>
              <div class="grid-item">
                <span class="grid-label">投诉事故:</span>
                <strong :class="student.criteria.hasComplaints ? 'text-danger' : 'text-success'">
                  {{ student.criteria.hasComplaints ? '有' : '无' }}
                </strong>
              </div>
              <div class="grid-item">
                <span class="grid-label">补贴金额:</span>
                <strong class="text-success">¥{{ calculateStudentSubsidy(student) }}</strong>
              </div>
              <div class="grid-item">
                <span class="grid-label">发放状态:</span>
                <strong :class="student.paid ? 'text-success' : 'text-warning'">
                  {{ student.paid ? '已发放' : '未发放' }}
                </strong>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 补贴汇总 -->
      <div class="info-section subsidy-summary">
        <h4 class="section-title">💰 补贴汇总</h4>
        <div class="info-grid">
          <div class="info-item">
            <span class="label">申请月份：</span>
            <span class="value">{{ mentorData.month }}</span>
          </div>
          <div class="info-item">
            <span class="label">总补贴金额：</span>
            <span class="value highlight">¥{{ summaryData.totalSubsidy }}</span>
          </div>
          <div class="info-item">
            <span class="label">平均评分：</span>
            <span class="value">{{ summaryData.averageScore }}分</span>
          </div>
          <div class="info-item">
            <span class="label">审批状态：</span>
            <span class="value" :style="{ color: getStatusColor(mentorData.status) }">
              {{ getStatusText(mentorData.status) }}
            </span>
          </div>
          <div class="info-item">
            <span class="label">带教成功率：</span>
            <span class="value">{{ summaryData.mentorSuccessRate }}%</span>
          </div>
          <div class="info-item">
            <span class="label">教案记录：</span>
            <span class="value" :class="summaryData.mentorHasTeachingMaterials ? 'text-success' : 'text-danger'">
              {{ summaryData.mentorHasTeachingMaterials ? '完整' : '不完整' }}
            </span>
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
import { ref, computed, watch } from 'vue'

interface StudentData {
  name: string
  department: string
  criteria: {
    evaluationScore: number
    employment: boolean
    duration: number
    hasComplaints: boolean
  }
  paid: boolean
}

interface MentorData {
  mentorName: string
  department: string
  mentorLevel: string
  studentCount: number
  month: string
  status: string
}

interface SummaryData {
  totalSubsidy: number
  averageScore: number
  mentorSuccessRate: number
  mentorHasTeachingMaterials: boolean
}

interface Props {
  modelValue: boolean
  title: string
  mentorData: MentorData
  studentsData: StudentData[]
  summaryData: SummaryData
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: false,
  title: '补贴详情'
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
const getCertificationTypeText = (level: string): string => {
  const typeMap: Record<string, string> = {
    'college_certified': '书院认证带教老师',
    'department_certified': '部门认证带教老师',
    'senior': '高级带教老师',
    'expert': '专家级带教老师'
  }
  return typeMap[level] || level
}

const getStatusText = (status: string): string => {
  const statusMap: Record<string, string> = {
    'pending_review': '待审核',
    'approved': '已通过',
    'rejected': '已拒绝',
    'paid': '已发放'
  }
  return statusMap[status] || status
}

const getStatusColor = (status: string): string => {
  const colorMap: Record<string, string> = {
    'pending_review': '#e6a23c',
    'approved': '#67c23a',
    'rejected': '#f56c6c',
    'paid': '#409eff'
  }
  return colorMap[status] || '#303133'
}

const calculateStudentSubsidy = (student: StudentData): number => {
  // 这里应该使用实际的补贴计算逻辑
  // 简化示例：基础补贴 + 绩效加成
  const baseAmount = 1000
  const performanceMultiplier = student.criteria.evaluationScore / 100
  const employmentBonus = student.criteria.employment ? 500 : 0
  const durationBonus = student.criteria.duration * 100
  const penaltyForComplaints = student.criteria.hasComplaints ? -200 : 0
  
  return Math.max(0, baseAmount * performanceMultiplier + employmentBonus + durationBonus + penaltyForComplaints)
}

const handleClose = () => {
  visible.value = false
  emit('close')
}
</script>

<style scoped>
.subsidy-detail-content {
  text-align: left;
  line-height: 1.8;
  color: #303133;
  font-family: 'Microsoft YaHei', Arial, sans-serif;
}

.info-section {
  margin-bottom: 20px;
  padding: 12px;
  border-radius: 8px;
  border-left: 4px solid;
}

.mentor-info {
  background: #f0f9ff;
  border-left-color: #409eff;
}

.students-info {
  background: #f0f9f0;
  border-left-color: #67c23a;
}

.subsidy-summary {
  background: #fef9e7;
  border-left-color: #e6a23c;
}

.section-title {
  margin: 0 0 10px 0;
  font-size: 16px;
  font-weight: 600;
  color: inherit;
}

.mentor-info .section-title {
  color: #409eff;
}

.students-info .section-title {
  color: #67c23a;
}

.subsidy-summary .section-title {
  color: #e6a23c;
}

.info-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
  font-size: 14px;
  line-height: 1.6;
}

.info-item {
  margin: 8px 0;
}

.label {
  color: #606266;
  font-weight: 600;
}

.value {
  color: #303133;
}

.value.highlight {
  color: #67c23a;
  font-weight: 700;
  font-size: 16px;
}

.students-list {
  max-height: 300px;
  overflow-y: auto;
}

.student-card {
  margin-bottom: 15px;
  padding: 10px;
  background: white;
  border-radius: 6px;
  border: 1px solid #e4e7ed;
}

.student-header {
  margin-bottom: 8px;
  font-size: 14px;
}

.student-dept {
  color: #909399;
  font-weight: normal;
  margin-left: 8px;
}

.student-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
  font-size: 13px;
  line-height: 1.4;
}

.grid-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.grid-label {
  color: #606266;
}

.text-success {
  color: #67c23a !important;
}

.text-danger {
  color: #f56c6c !important;
}

.text-warning {
  color: #e6a23c !important;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
}

/* 滚动条样式 */
.students-list::-webkit-scrollbar {
  width: 6px;
}

.students-list::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 3px;
}

.students-list::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 3px;
}

.students-list::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}
</style>

<style>
.subsidy-detail-dialog {
  --el-dialog-padding-primary: 20px;
}

.subsidy-detail-dialog .el-dialog__body {
  padding: 20px;
  max-height: 70vh;
  overflow-y: auto;
}
</style>
