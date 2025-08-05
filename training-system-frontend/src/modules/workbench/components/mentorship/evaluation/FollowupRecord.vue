<template>
  <div class="followup-record">
    <!-- 评价基本信息 -->
    <div class="evaluation-summary">
      <h4>评价基本信息</h4>
      <el-descriptions :column="2" border size="small">
        <el-descriptions-item label="项目名称">{{ evaluation.projectName }}</el-descriptions-item>
        <el-descriptions-item label="评价类型">{{ getEvaluationTypeText(evaluation.evaluationType) }}</el-descriptions-item>
        <el-descriptions-item label="导师">{{ evaluation.mentorName }}</el-descriptions-item>
        <el-descriptions-item label="学员">{{ evaluation.studentName }}</el-descriptions-item>
        <el-descriptions-item label="评价得分">{{ evaluation.totalScore }}分</el-descriptions-item>
        <el-descriptions-item label="完成时间">{{ formatDate(evaluation.completedAt) }}</el-descriptions-item>
      </el-descriptions>
    </div>

    <!-- 回访记录信息 -->
    <div class="followup-info">
      <h4>回访记录详情</h4>
      <div v-if="followupRecord" class="record-content">
        <el-descriptions :column="2" border size="small">
          <el-descriptions-item label="回访人员">{{ followupRecord.followupBy }}</el-descriptions-item>
          <el-descriptions-item label="回访时间">{{ formatDate(followupRecord.followupDate) }}</el-descriptions-item>
          <el-descriptions-item label="回访方式">{{ getFollowupTypeText(followupRecord.followupType) }}</el-descriptions-item>
          <el-descriptions-item v-if="followupRecord.followupScore" label="回访评分">{{ followupRecord.followupScore }}分</el-descriptions-item>
        </el-descriptions>

        <div class="content-section">
          <h5>回访内容</h5>
          <div class="content-text">{{ followupRecord.followupContent }}</div>
        </div>

        <div v-if="followupRecord.suggestions" class="content-section">
          <h5>改进建议</h5>
          <div class="content-text">{{ followupRecord.suggestions }}</div>
        </div>
      </div>
      
      <div v-else class="no-record">
        <el-empty description="暂无回访记录" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { getFollowupRecord } from '@/api/modules/evaluation-management'

interface Props {
  evaluation: any
}

const props = defineProps<Props>()

const followupRecord = ref<any>(null)

const getEvaluationTypeText = (type: string) => {
  const textMap: Record<string, string> = {
    student_to_mentor: '学员评价导师',
    mentor_to_student: '导师评价学员',
    mutual: '师徒互评'
  }
  return textMap[type] || type
}

const getFollowupTypeText = (type: string) => {
  const textMap: Record<string, string> = {
    phone: '电话回访',
    visit: '实地走访',
    online: '在线沟通'
  }
  return textMap[type] || type
}

const formatDate = (date: Date | string) => {
  if (!date) return '-'
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleDateString('zh-CN') + ' ' + d.toLocaleTimeString('zh-CN', { 
    hour: '2-digit', 
    minute: '2-digit' 
  })
}

const loadFollowupRecord = async () => {
  try {
    const record = await getFollowupRecord(props.evaluation.id)
    followupRecord.value = record
  } catch (error) {
    console.error('获取回访记录失败:', error)
    followupRecord.value = null
  }
}

onMounted(() => {
  // 如果evaluation中已经包含followupRecord，直接使用
  if (props.evaluation.followupRecord) {
    followupRecord.value = props.evaluation.followupRecord
  } else {
    // 否则通过API获取
    loadFollowupRecord()
  }
})
</script>

<style scoped>
.followup-record {
  padding: 20px;
}

.evaluation-summary {
  margin-bottom: 30px;
  padding: 20px;
  background: #f8f9fa;
  border-radius: 8px;
  border-left: 4px solid #409eff;
}

.evaluation-summary h4 {
  margin: 0 0 16px 0;
  color: #303133;
  font-size: 16px;
  font-weight: 600;
}

.followup-info h4 {
  margin-bottom: 16px;
  color: #303133;
  font-size: 16px;
  font-weight: 600;
}

.record-content {
  background: #ffffff;
  border-radius: 8px;
}

.content-section {
  margin-top: 20px;
}

.content-section h5 {
  margin-bottom: 12px;
  color: #606266;
  font-size: 14px;
  font-weight: 600;
}

.content-text {
  background: #f8f9fa;
  padding: 16px;
  border-radius: 8px;
  border-left: 4px solid #67c23a;
  line-height: 1.6;
  color: #303133;
  white-space: pre-wrap;
  min-height: 60px;
}

.no-record {
  padding: 40px;
  text-align: center;
}

:deep(.el-descriptions__body) {
  background: #ffffff;
}

:deep(.el-descriptions__label) {
  font-weight: 600;
  color: #606266;
}

:deep(.el-descriptions__content) {
  color: #303133;
}
</style> 