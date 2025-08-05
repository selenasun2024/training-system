<template>
  <div class="feedback-form">
    <!-- 学员信息摘要 -->
    <div class="student-summary">
      <h4>学员信息</h4>
      <div class="summary-content">
        <div class="student-basic">
          <span><strong>姓名：</strong>{{ student.studentName }}</span>
          <span><strong>部门：</strong>{{ student.department }}</span>
          <span><strong>导师：</strong>{{ student.mentorName }}</span>
        </div>
        <div class="progress-info">
          <span><strong>总进度：</strong>{{ student.overallProgress }}%</span>
          <span><strong>当前任务：</strong>{{ student.currentTask.name }}</span>
        </div>
      </div>
    </div>

    <el-form :model="form" :rules="rules" ref="formRef" label-width="120px">
      <el-form-item label="反馈类型" prop="feedbackType">
        <el-radio-group v-model="form.feedbackType">
          <el-radio value="positive">正面反馈</el-radio>
          <el-radio value="improvement">改进建议</el-radio>
          <el-radio value="concern">关注提醒</el-radio>
          <el-radio value="encouragement">鼓励激励</el-radio>
        </el-radio-group>
      </el-form-item>

      <el-form-item label="反馈重点" prop="feedbackFocus">
        <el-checkbox-group v-model="form.feedbackFocus">
          <el-checkbox value="learning_attitude">学习态度</el-checkbox>
          <el-checkbox value="task_completion">任务完成</el-checkbox>
          <el-checkbox value="skill_mastery">技能掌握</el-checkbox>
          <el-checkbox value="time_management">时间管理</el-checkbox>
          <el-checkbox value="quality_improvement">质量提升</el-checkbox>
          <el-checkbox value="communication">沟通交流</el-checkbox>
        </el-checkbox-group>
      </el-form-item>

      <el-form-item label="具体表现" prop="specificPerformance">
        <el-input
          v-model="form.specificPerformance"
          type="textarea"
          :rows="4"
          placeholder="请详细描述学员在学习过程中的具体表现..."
        />
      </el-form-item>

      <el-form-item label="改进建议" prop="improvementSuggestions">
        <el-input
          v-model="form.improvementSuggestions"
          type="textarea"
          :rows="4"
          placeholder="针对发现的问题提出具体的改进建议和学习方法..."
        />
      </el-form-item>

      <el-form-item label="下阶段目标" prop="nextStageGoals">
        <el-input
          v-model="form.nextStageGoals"
          type="textarea"
          :rows="3"
          placeholder="设定下一阶段的学习目标和期望..."
        />
      </el-form-item>

      <el-form-item label="推荐资源" prop="recommendedResources">
        <el-input
          v-model="form.recommendedResources"
          type="textarea"
          :rows="3"
          placeholder="推荐相关的学习资源、参考资料或实践项目..."
        />
      </el-form-item>

      <el-form-item label="跟进计划" prop="followUpPlan">
        <el-select v-model="form.followUpPlan" placeholder="选择跟进频率" style="width: 100%">
          <el-option label="无需特殊跟进" value="none" />
          <el-option label="一周内跟进" value="weekly" />
          <el-option label="两周内跟进" value="biweekly" />
          <el-option label="一个月内跟进" value="monthly" />
          <el-option label="立即关注" value="immediate" />
        </el-select>
      </el-form-item>

      <el-form-item label="是否抄送" prop="ccList">
        <el-checkbox-group v-model="form.ccList">
          <el-checkbox value="mentor">带教导师</el-checkbox>
          <el-checkbox value="department_head">部门负责人</el-checkbox>
          <el-checkbox value="hr">人力资源</el-checkbox>
          <el-checkbox value="student">学员本人</el-checkbox>
        </el-checkbox-group>
      </el-form-item>

      <el-form-item label="反馈评级" prop="rating">
        <el-rate
          v-model="form.rating"
          :max="5"
          show-text
          :texts="['需改进', '一般', '良好', '优秀', '卓越']"
        />
      </el-form-item>
    </el-form>

    <div class="form-footer">
      <el-button @click="$emit('cancel')">取消</el-button>
      <el-button type="primary" @click="handleSubmit" :loading="submitting">
        提交反馈
      </el-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import type { FormInstance, FormRules } from 'element-plus'

interface Props {
  student: any
}

const props = defineProps<Props>()

const emit = defineEmits<{
  submit: [data: any]
  cancel: []
}>()

const formRef = ref<FormInstance>()
const submitting = ref(false)

const form = reactive({
  feedbackType: 'positive',
  feedbackFocus: ['learning_attitude'],
  specificPerformance: '',
  improvementSuggestions: '',
  nextStageGoals: '',
  recommendedResources: '',
  followUpPlan: 'none',
  ccList: ['mentor'],
  rating: 4
})

const rules: FormRules = {
  feedbackType: [
    { required: true, message: '请选择反馈类型', trigger: 'change' }
  ],
  feedbackFocus: [
    { type: 'array', required: true, message: '请选择反馈重点', trigger: 'change' }
  ],
  specificPerformance: [
    { required: true, message: '请描述具体表现', trigger: 'blur' },
    { min: 20, message: '请详细描述，至少20个字符', trigger: 'blur' }
  ],
  followUpPlan: [
    { required: true, message: '请选择跟进计划', trigger: 'change' }
  ],
  rating: [
    { required: true, message: '请给出评级', trigger: 'change' }
  ]
}

const handleSubmit = async () => {
  if (!formRef.value) return

  try {
    await formRef.value.validate()
    
    submitting.value = true
    
    const feedbackData = {
      feedbackType: form.feedbackType,
      feedbackFocus: form.feedbackFocus,
      specificPerformance: form.specificPerformance,
      improvementSuggestions: form.improvementSuggestions,
      nextStageGoals: form.nextStageGoals,
      recommendedResources: form.recommendedResources,
      followUpPlan: form.followUpPlan,
      ccList: form.ccList,
      rating: form.rating
    }
    
    console.log('📝 提交反馈数据:', feedbackData)
    
    emit('submit', feedbackData)
  } catch (error) {
    console.error('表单验证失败:', error)
  } finally {
    submitting.value = false
  }
}
</script>

<style scoped>
.feedback-form {
  padding: 20px;
}

.student-summary {
  margin-bottom: 24px;
  padding: 16px;
  background: #f0f9ff;
  border-radius: 8px;
  border-left: 4px solid #409eff;
}

.student-summary h4 {
  margin: 0 0 12px 0;
  color: #303133;
  font-size: 16px;
}

.summary-content {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.student-basic, .progress-info {
  display: flex;
  gap: 20px;
  flex-wrap: wrap;
}

.student-basic span, .progress-info span {
  font-size: 14px;
  color: #606266;
}

.form-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 24px;
  padding-top: 16px;
  border-top: 1px solid #e4e7ed;
}

:deep(.el-form-item__label) {
  font-weight: 500;
}

:deep(.el-checkbox-group) {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

:deep(.el-radio-group) {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .student-basic, .progress-info {
    flex-direction: column;
    gap: 8px;
  }
}
</style> 