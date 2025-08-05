<template>
  <div class="followup-form">
    <div class="evaluation-summary">
      <h4>评价基本信息</h4>
      <div class="summary-grid">
        <div class="summary-item">
          <span class="label">项目名称：</span>
          <span class="value">{{ evaluation.projectName }}</span>
        </div>
        <div class="summary-item">
          <span class="label">评价类型：</span>
          <span class="value">{{ getEvaluationTypeText(evaluation.evaluationType) }}</span>
        </div>
        <div class="summary-item">
          <span class="label">导师：</span>
          <span class="value">{{ evaluation.mentorName }}</span>
        </div>
        <div class="summary-item">
          <span class="label">学员：</span>
          <span class="value">{{ evaluation.studentName }}</span>
        </div>
        <div class="summary-item">
          <span class="label">评价得分：</span>
          <span class="value score">{{ evaluation.totalScore }}分</span>
        </div>
        <div class="summary-item">
          <span class="label">完成时间：</span>
          <span class="value">{{ formatDate(evaluation.completedAt) }}</span>
        </div>
      </div>
    </div>

    <el-form :model="form" :rules="rules" ref="formRef" label-width="120px">
      <el-form-item label="回访方式" prop="followupMethod">
        <el-radio-group v-model="form.followupMethod">
          <el-radio value="phone">电话回访</el-radio>
          <el-radio value="face_to_face">面对面沟通</el-radio>
          <el-radio value="online">在线沟通</el-radio>
        </el-radio-group>
      </el-form-item>

      <el-form-item label="回访对象" prop="followupTarget">
        <el-checkbox-group v-model="form.followupTarget">
          <el-checkbox value="mentor">导师</el-checkbox>
          <el-checkbox value="student">学员</el-checkbox>
        </el-checkbox-group>
      </el-form-item>

      <el-form-item label="回访重点" prop="followupFocus">
        <el-checkbox-group v-model="form.followupFocus">
          <el-checkbox value="evaluation_accuracy">评价准确性</el-checkbox>
          <el-checkbox value="relationship_quality">师徒关系质量</el-checkbox>
          <el-checkbox value="learning_progress">学习进展情况</el-checkbox>
          <el-checkbox value="problem_solving">问题解决效果</el-checkbox>
          <el-checkbox value="satisfaction">满意度调查</el-checkbox>
        </el-checkbox-group>
      </el-form-item>

      <el-form-item label="导师反馈" prop="mentorFeedback">
        <el-input
          v-model="form.mentorFeedback"
          type="textarea"
          :rows="4"
          placeholder="请记录导师在回访中的反馈和建议..."
        />
      </el-form-item>

      <el-form-item label="学员反馈" prop="studentFeedback">
        <el-input
          v-model="form.studentFeedback"
          type="textarea"
          :rows="4"
          placeholder="请记录学员在回访中的反馈和感受..."
        />
      </el-form-item>

      <el-form-item label="发现问题" prop="identifiedIssues">
        <el-input
          v-model="form.identifiedIssues"
          type="textarea"
          :rows="3"
          placeholder="记录在回访过程中发现的问题和不足..."
        />
      </el-form-item>

      <el-form-item label="改进建议" prop="improvementSuggestions">
        <el-input
          v-model="form.improvementSuggestions"
          type="textarea"
          :rows="3"
          placeholder="针对发现的问题提出改进建议..."
        />
      </el-form-item>

      <el-form-item label="后续跟进" prop="followupActions">
        <el-input
          v-model="form.followupActions"
          type="textarea"
          :rows="3"
          placeholder="需要后续跟进的事项和计划..."
        />
      </el-form-item>

      <el-form-item label="总体评估" prop="overallAssessment">
        <el-radio-group v-model="form.overallAssessment">
          <el-radio value="excellent">师徒关系优秀，带教效果显著</el-radio>
          <el-radio value="good">师徒关系良好，带教效果较好</el-radio>
          <el-radio value="average">师徒关系一般，带教效果普通</el-radio>
          <el-radio value="poor">师徒关系存在问题，需要改进</el-radio>
        </el-radio-group>
      </el-form-item>
    </el-form>

    <div class="form-footer">
      <el-button @click="$emit('cancel')">取消</el-button>
      <el-button type="primary" @click="handleSubmit" :loading="submitting">保存回访记录</el-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import type { FormInstance, FormRules } from 'element-plus'

interface Props {
  evaluation: any
}

const props = defineProps<Props>()

const emit = defineEmits<{
  submit: [data: any]
  cancel: []
}>()

const formRef = ref<FormInstance>()
const submitting = ref(false)

const form = reactive({
  followupMethod: 'phone',
  followupTarget: ['mentor', 'student'],
  followupFocus: ['evaluation_accuracy', 'relationship_quality'],
  mentorFeedback: '',
  studentFeedback: '',
  identifiedIssues: '',
  improvementSuggestions: '',
  followupActions: '',
  overallAssessment: 'good'
})

const rules: FormRules = {
  followupMethod: [
    { required: true, message: '请选择回访方式', trigger: 'change' }
  ],
  followupTarget: [
    { type: 'array', required: true, message: '请选择回访对象', trigger: 'change' }
  ],
  followupFocus: [
    { type: 'array', required: true, message: '请选择回访重点', trigger: 'change' }
  ],
  overallAssessment: [
    { required: true, message: '请选择总体评估', trigger: 'change' }
  ]
}

const getEvaluationTypeText = (type: string) => {
  const textMap: Record<string, string> = {
    student_to_mentor: '学员评价导师',
    mentor_to_student: '导师评价学员',
    mutual: '师徒互评'
  }
  return textMap[type] || type
}

const getFollowupMethodText = (method: string) => {
  const textMap: Record<string, string> = {
    phone: '电话回访',
    face_to_face: '面对面沟通',
    online: '在线沟通'
  }
  return textMap[method] || method
}

const getFollowupTargetText = (target: string) => {
  const textMap: Record<string, string> = {
    mentor: '导师',
    student: '学员'
  }
  return textMap[target] || target
}

const getFollowupFocusText = (focus: string) => {
  const textMap: Record<string, string> = {
    evaluation_accuracy: '评价准确性',
    relationship_quality: '师徒关系质量',
    learning_progress: '学习进展情况',
    problem_solving: '问题解决效果',
    satisfaction: '满意度调查'
  }
  return textMap[focus] || focus
}

const getOverallAssessmentText = (assessment: string) => {
  const textMap: Record<string, string> = {
    excellent: '师徒关系优秀，带教效果显著',
    good: '师徒关系良好，带教效果较好',
    average: '师徒关系一般，带教效果普通',
    poor: '师徒关系存在问题，需要改进'
  }
  return textMap[assessment] || assessment
}

const formatDate = (date: Date | string) => {
  if (!date) return '-'
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleDateString('zh-CN')
}

const handleSubmit = async () => {
  if (!formRef.value) return

  try {
    await formRef.value.validate()
    
    submitting.value = true
    
    const followupData = {
      evaluationId: props.evaluation.id,
      followupDate: new Date().toISOString(),
      followupBy: 'admin-user', // 实际应该从用户信息获取
      followupType: form.followupMethod,
      followupContent: `
回访方式：${getFollowupMethodText(form.followupMethod)}
回访对象：${form.followupTarget.map(t => getFollowupTargetText(t)).join('、')}
回访重点：${form.followupFocus.map(f => getFollowupFocusText(f)).join('、')}

导师反馈：
${form.mentorFeedback}

学员反馈：
${form.studentFeedback}

发现问题：
${form.identifiedIssues}

改进建议：
${form.improvementSuggestions}

后续跟进：
${form.followupActions}

总体评估：${getOverallAssessmentText(form.overallAssessment)}
      `.trim(),
      suggestions: form.improvementSuggestions
    }
    
    emit('submit', followupData)
  } catch (error) {
    console.error('表单验证失败:', error)
  } finally {
    submitting.value = false
  }
}
</script>

<style scoped>
.followup-form {
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
}

.summary-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.summary-item {
  display: flex;
  align-items: center;
}

.summary-item .label {
  font-weight: 500;
  color: #606266;
  margin-right: 8px;
  min-width: 80px;
}

.summary-item .value {
  color: #303133;
}

.summary-item .value.score {
  font-weight: bold;
  color: #67c23a;
}

.form-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 30px;
  padding-top: 20px;
  border-top: 1px solid #e4e7ed;
}

:deep(.el-form-item__label) {
  font-weight: 500;
}

:deep(.el-checkbox-group) {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

:deep(.el-radio-group) {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .summary-grid {
    grid-template-columns: 1fr;
  }
}
</style> 