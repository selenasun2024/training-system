<template>
  <div class="evaluation-form">
    <!-- 评价信息概览 -->
    <div class="evaluation-header">
      <div class="header-info">
        <h3>{{ getEvaluationTitle() }}</h3>
        <div class="meta-info">
          <span class="evaluator">评价者：{{ getCurrentUserName() }}</span>
          <span class="due-date">截止时间：{{ formatDate(evaluationTask.dueDate) }}</span>
          <el-tag :type="getTypeTag(evaluationTask.type)" size="small">
            {{ getTypeText(evaluationTask.type) }}
          </el-tag>
        </div>
      </div>
      <div class="score-summary">
        <div class="total-score">
          <span class="label">总分</span>
          <span class="score">{{ totalScore }}/100</span>
        </div>
        <div class="pass-status">
          <el-tag :type="totalScore >= 90 ? 'success' : 'warning'">
            {{ totalScore >= 90 ? '通过' : '待提升' }}
          </el-tag>
        </div>
      </div>
    </div>

    <!-- 评价说明 -->
    <el-alert
      title="评价说明"
      type="info"
      :closable="false"
      style="margin-bottom: 20px"
    >
      <template #default>
        <div class="evaluation-guide">
          <p>请根据《带教老师讲师及导师管理办法》中的评价标准进行评分：</p>
          <ul>
            <li><strong>认识维度（15分）：</strong>明确表达责任(10分) + 工作环境熟悉(5分)</li>
            <li><strong>技能维度（50分）：</strong>一对一带教时长(20分) + 专业知识扎实度(10分) + 有效解决问题(10分) + 思路表达清晰(10分)</li>
            <li><strong>文化和人文维度（35分）：</strong>面对面沟通频率(20分) + 共餐关怀次数(5分) + 情绪疏导效果(5分) + 经验分享意愿(5分)</li>
          </ul>
          <p><strong>通过标准：</strong>总分≥90分为通过，<90分为待提升</p>
        </div>
      </template>
    </el-alert>

    <!-- 评价表单 -->
    <el-form
      ref="formRef"
      :model="formData"
      :rules="formRules"
      label-width="180px"
      @submit.prevent
    >
      <!-- 认识维度评价 (15分) -->
      <el-card class="dimension-card recognition-card" shadow="never">
        <template #header>
          <div class="dimension-header">
            <h4>认识维度评价</h4>
            <div class="dimension-score">
              <span class="current">{{ recognitionScore }}</span>
              <span class="total">/15分</span>
            </div>
          </div>
        </template>
        
        <!-- 明确表达责任 (10分) -->
        <el-form-item label="明确表达责任" prop="recognition.明确表达责任">
          <div class="evaluation-item">
            <div class="item-description">
              <strong>评价标准：</strong>带教老师在入职当日明确表达"我是你的带教老师，接下来一年时间我会对你的成长负责任"
            </div>
            <div class="scoring-section">
              <el-radio-group v-model="formData.recognition.明确表达责任">
                <el-radio :label="10">
                  <div class="radio-content">
                    <span class="score">10分</span>
                    <span class="description">明确表达并主动承担责任</span>
                  </div>
                </el-radio>
                <el-radio :label="5">
                  <div class="radio-content">
                    <span class="score">5分</span>
                    <span class="description">有表达但不够明确</span>
                  </div>
                </el-radio>
                <el-radio :label="0">
                  <div class="radio-content">
                    <span class="score">0分</span>
                    <span class="description">未明确表达</span>
                  </div>
                </el-radio>
              </el-radio-group>
            </div>
          </div>
        </el-form-item>

        <!-- 工作环境熟悉 (5分) -->
        <el-form-item label="工作环境熟悉" prop="recognition.工作环境熟悉">
          <div class="evaluation-item">
            <div class="item-description">
              <strong>评价标准：</strong>入职一周内带领新员工熟悉工作环境，并共同就餐一次
            </div>
            <div class="scoring-section">
              <el-radio-group v-model="formData.recognition.工作环境熟悉">
                <el-radio :label="5">
                  <div class="radio-content">
                    <span class="score">5分</span>
                    <span class="description">及时带领熟悉环境并共餐</span>
                  </div>
                </el-radio>
                <el-radio :label="3">
                  <div class="radio-content">
                    <span class="score">3分</span>
                    <span class="description">熟悉环境但未共餐</span>
                  </div>
                </el-radio>
                <el-radio :label="0">
                  <div class="radio-content">
                    <span class="score">0分</span>
                    <span class="description">未带领熟悉环境</span>
                  </div>
                </el-radio>
              </el-radio-group>
            </div>
          </div>
        </el-form-item>
      </el-card>

      <!-- 技能维度评价 (50分) -->
      <el-card class="dimension-card skills-card" shadow="never">
        <template #header>
          <div class="dimension-header">
            <h4>技能维度评价</h4>
            <div class="dimension-score">
              <span class="current">{{ skillsScore }}</span>
              <span class="total">/50分</span>
            </div>
          </div>
        </template>

        <!-- 一对一带教时长 (20分) -->
        <el-form-item label="一对一带教时长" prop="skills.一对一带教时长">
          <div class="evaluation-item">
            <div class="item-description">
              <strong>评价标准：</strong>入职3个月内一对一带教时长统计
            </div>
            <div class="scoring-section">
              <el-radio-group v-model="formData.skills.一对一带教时长">
                <el-radio :label="20">
                  <div class="radio-content">
                    <span class="score">20分</span>
                    <span class="description">≥4小时/周</span>
                  </div>
                </el-radio>
                <el-radio :label="15">
                  <div class="radio-content">
                    <span class="score">15分</span>
                    <span class="description">≥3小时/周</span>
                  </div>
                </el-radio>
                <el-radio :label="10">
                  <div class="radio-content">
                    <span class="score">10分</span>
                    <span class="description">≥2小时/周</span>
                  </div>
                </el-radio>
                <el-radio :label="0">
                  <div class="radio-content">
                    <span class="score">0分</span>
                    <span class="description"><2小时/周</span>
                  </div>
                </el-radio>
              </el-radio-group>
            </div>
          </div>
        </el-form-item>

        <!-- 专业知识扎实度 (10分) -->
        <el-form-item label="专业知识扎实度" prop="skills.专业知识扎实度">
          <div class="evaluation-item">
            <div class="item-description">
              <strong>评价标准：</strong>岗位专业知识掌握程度
            </div>
            <div class="scoring-section">
              <el-slider
                v-model="formData.skills.专业知识扎实度"
                :min="0"
                :max="10"
                :step="1"
                show-stops
                show-input
                :marks="{ 0: '0分', 5: '5分', 10: '10分' }"
              />
              <div class="slider-description">
                <span>非常精通为10分，非常差劲为0分</span>
              </div>
            </div>
          </div>
        </el-form-item>

        <!-- 有效解决问题 (10分) -->
        <el-form-item label="有效解决问题" prop="skills.有效解决问题">
          <div class="evaluation-item">
            <div class="item-description">
              <strong>评价标准：</strong>解决学员问题的能力和效果
            </div>
            <div class="scoring-section">
              <el-slider
                v-model="formData.skills.有效解决问题"
                :min="0"
                :max="10"
                :step="1"
                show-stops
                show-input
                :marks="{ 0: '0分', 5: '5分', 10: '10分' }"
              />
              <div class="slider-description">
                <span>非常有效为10分，置之不理为0分</span>
              </div>
            </div>
          </div>
        </el-form-item>

        <!-- 思路表达清晰 (10分) -->
        <el-form-item label="思路表达清晰" prop="skills.思路表达清晰">
          <div class="evaluation-item">
            <div class="item-description">
              <strong>评价标准：</strong>思路和表达的清晰程度
            </div>
            <div class="scoring-section">
              <el-slider
                v-model="formData.skills.思路表达清晰"
                :min="0"
                :max="10"
                :step="1"
                show-stops
                show-input
                :marks="{ 0: '0分', 5: '5分', 10: '10分' }"
              />
              <div class="slider-description">
                <span>非常清晰为10分，很糟糕为0分</span>
              </div>
            </div>
          </div>
        </el-form-item>
      </el-card>

      <!-- 文化和人文维度评价 (35分) -->
      <el-card class="dimension-card culture-card" shadow="never">
        <template #header>
          <div class="dimension-header">
            <h4>文化和人文维度评价</h4>
            <div class="dimension-score">
              <span class="current">{{ cultureScore }}</span>
              <span class="total">/35分</span>
            </div>
          </div>
        </template>

        <!-- 面对面沟通频率 (20分) -->
        <el-form-item label="面对面沟通频率" prop="cultureHumanity.面对面沟通频率">
          <div class="evaluation-item">
            <div class="item-description">
              <strong>评价标准：</strong>入职4-12月期间带教老师主动面对面沟通频率
            </div>
            <div class="scoring-section">
              <el-radio-group v-model="formData.cultureHumanity.面对面沟通频率">
                <el-radio :label="20">
                  <div class="radio-content">
                    <span class="score">20分</span>
                    <span class="description">>3次/月</span>
                  </div>
                </el-radio>
                <el-radio :label="15">
                  <div class="radio-content">
                    <span class="score">15分</span>
                    <span class="description">2次/月</span>
                  </div>
                </el-radio>
                <el-radio :label="10">
                  <div class="radio-content">
                    <span class="score">10分</span>
                    <span class="description">1次/月</span>
                  </div>
                </el-radio>
                <el-radio :label="0">
                  <div class="radio-content">
                    <span class="score">0分</span>
                    <span class="description">0次/月</span>
                  </div>
                </el-radio>
              </el-radio-group>
            </div>
          </div>
        </el-form-item>

        <!-- 共餐关怀次数 (5分) -->
        <el-form-item label="共餐关怀次数" prop="cultureHumanity.共餐关怀次数">
          <div class="evaluation-item">
            <div class="item-description">
              <strong>评价标准：</strong>正式谈心，关心工作生活情况，帮助疏导情绪
            </div>
            <div class="scoring-section">
              <el-radio-group v-model="formData.cultureHumanity.共餐关怀次数">
                <el-radio :label="5">
                  <div class="radio-content">
                    <span class="score">5分</span>
                    <span class="description">和带教老师共餐次数≥5次</span>
                  </div>
                </el-radio>
                <el-radio :label="3">
                  <div class="radio-content">
                    <span class="score">3分</span>
                    <span class="description">共餐2-4次</span>
                  </div>
                </el-radio>
                <el-radio :label="0">
                  <div class="radio-content">
                    <span class="score">0分</span>
                    <span class="description">共餐<2次</span>
                  </div>
                </el-radio>
              </el-radio-group>
            </div>
          </div>
        </el-form-item>

        <!-- 情绪疏导效果 (5分) -->
        <el-form-item label="情绪疏导效果" prop="cultureHumanity.情绪疏导效果">
          <div class="evaluation-item">
            <div class="item-description">
              <strong>评价标准：</strong>通过和带教老师沟通，对自身情绪的影响
            </div>
            <div class="scoring-section">
              <el-slider
                v-model="formData.cultureHumanity.情绪疏导效果"
                :min="0"
                :max="5"
                :step="1"
                show-stops
                show-input
                :marks="{ 0: '0分', 5: '5分' }"
              />
              <div class="slider-description">
                <span>非常高兴为5分，非常担忧为0分</span>
              </div>
            </div>
          </div>
        </el-form-item>

        <!-- 经验分享意愿 (5分) -->
        <el-form-item label="经验分享意愿" prop="cultureHumanity.经验分享意愿">
          <div class="evaluation-item">
            <div class="item-description">
              <strong>评价标准：</strong>带教老师主动分享经验的意愿度
            </div>
            <div class="scoring-section">
              <el-slider
                v-model="formData.cultureHumanity.经验分享意愿"
                :min="0"
                :max="5"
                :step="1"
                show-stops
                show-input
                :marks="{ 0: '0分', 5: '5分' }"
              />
              <div class="slider-description">
                <span>非常愿意为5分，非常勉强为0分</span>
              </div>
            </div>
          </div>
        </el-form-item>
      </el-card>

      <!-- 综合评价 -->
      <el-card class="dimension-card summary-card" shadow="never">
        <template #header>
          <div class="dimension-header">
            <h4>综合评价</h4>
          </div>
        </template>

        <el-form-item label="总体评价">
          <el-input
            v-model="formData.comments"
            type="textarea"
            :rows="4"
            placeholder="请对本次带教的总体情况进行评价，包括优点、不足和建议..."
            maxlength="500"
            show-word-limit
          />
        </el-form-item>

        <el-form-item label="改进建议">
          <el-input
            v-model="formData.suggestions"
            type="textarea"
            :rows="3"
            placeholder="请提出具体的改进建议..."
            maxlength="300"
            show-word-limit
          />
        </el-form-item>
      </el-card>
    </el-form>

    <!-- 操作按钮 -->
    <div class="form-actions">
      <el-button @click="handleCancel">取消</el-button>
      <el-button @click="handleSaveDraft">保存草稿</el-button>
      <el-button 
        type="primary" 
        @click="handleSubmit"
        :disabled="!isFormValid"
        :loading="submitting"
      >
        提交评价
      </el-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed } from 'vue'
import { ElMessage } from 'element-plus'
import type { 
  EvaluationTask, 
  ProjectMentorRelationship, 
  MentorshipStandards,
  RelationshipEvaluation,
  RecognitionEvaluation,
  SkillsEvaluation,
  CultureEvaluation
} from '../../types/mentorship'
import { formatDate } from '@/utils/dateUtils'

// Props
interface Props {
  evaluationTask: EvaluationTask
  relationship: ProjectMentorRelationship
  standards: MentorshipStandards
}

const props = defineProps<Props>()

// 响应式数据
const formRef = ref()
const submitting = ref(false)

// 表单数据
const formData = reactive({
  recognition: {
    明确表达责任: 0,
    工作环境熟悉: 0
  },
  skills: {
    一对一带教时长: 0,
    专业知识扎实度: 0,
    有效解决问题: 0,
    思路表达清晰: 0
  },
  cultureHumanity: {
    面对面沟通频率: 0,
    共餐关怀次数: 0,
    情绪疏导效果: 0,
    经验分享意愿: 0
  },
  comments: '',
  suggestions: ''
})

// 表单验证规则
const formRules = {
  'recognition.明确表达责任': [
    { required: true, message: '请评价明确表达责任', trigger: 'change' }
  ],
  'recognition.工作环境熟悉': [
    { required: true, message: '请评价工作环境熟悉', trigger: 'change' }
  ],
  'skills.一对一带教时长': [
    { required: true, message: '请评价一对一带教时长', trigger: 'change' }
  ],
  'cultureHumanity.面对面沟通频率': [
    { required: true, message: '请评价面对面沟通频率', trigger: 'change' }
  ],
  'cultureHumanity.共餐关怀次数': [
    { required: true, message: '请评价共餐关怀次数', trigger: 'change' }
  ]
}

// 计算属性
const recognitionScore = computed(() => {
  return formData.recognition.明确表达责任 + formData.recognition.工作环境熟悉
})

const skillsScore = computed(() => {
  return formData.skills.一对一带教时长 + 
         formData.skills.专业知识扎实度 + 
         formData.skills.有效解决问题 + 
         formData.skills.思路表达清晰
})

const cultureScore = computed(() => {
  return formData.cultureHumanity.面对面沟通频率 + 
         formData.cultureHumanity.共餐关怀次数 + 
         formData.cultureHumanity.情绪疏导效果 + 
         formData.cultureHumanity.经验分享意愿
})

const totalScore = computed(() => {
  return recognitionScore.value + skillsScore.value + cultureScore.value
})

const isFormValid = computed(() => {
  return formData.recognition.明确表达责任 > 0 &&
         formData.recognition.工作环境熟悉 > 0 &&
         formData.skills.一对一带教时长 > 0 &&
         formData.cultureHumanity.面对面沟通频率 > 0 &&
         formData.cultureHumanity.共餐关怀次数 > 0
})

// 方法
const getEvaluationTitle = (): string => {
  const typeText = getTypeText(props.evaluationTask.type)
  return `${typeText} - ${props.relationship.mentorId} → ${props.relationship.studentId}`
}

const getCurrentUserName = (): string => {
  return '当前评价者' // 实际开发中从用户状态获取
}

const getTypeTag = (type: string): string => {
  const typeMap: Record<string, string> = {
    probation: 'warning',
    annual: 'success',
    phase_end: 'info'
  }
  return typeMap[type] || 'info'
}

const getTypeText = (type: string): string => {
  const textMap: Record<string, string> = {
    probation: '转正评价',
    annual: '年度评价',
    phase_end: '阶段评价'
  }
  return textMap[type] || type
}

// 事件处理
const handleSubmit = async () => {
  try {
    await formRef.value.validate()
    
    submitting.value = true
    
    // 构建评价数据
    const evaluationData: RelationshipEvaluation = {
      id: `eval_${Date.now()}`,
      type: props.evaluationTask.type,
      evaluator: 'student', // 根据评价者类型设置
      dimensions: {
        recognition: {
          明确表达责任: formData.recognition.明确表达责任,
          工作环境熟悉: formData.recognition.工作环境熟悉,
          totalScore: recognitionScore.value
        },
        skills: {
          一对一带教时长: formData.skills.一对一带教时长,
          专业知识扎实度: formData.skills.专业知识扎实度,
          有效解决问题: formData.skills.有效解决问题,
          思路表达清晰: formData.skills.思路表达清晰,
          totalScore: skillsScore.value
        },
        cultureHumanity: {
          面对面沟通频率: formData.cultureHumanity.面对面沟通频率,
          共餐关怀次数: formData.cultureHumanity.共餐关怀次数,
          情绪疏导效果: formData.cultureHumanity.情绪疏导效果,
          经验分享意愿: formData.cultureHumanity.经验分享意愿,
          totalScore: cultureScore.value
        }
      },
      totalScore: totalScore.value,
      passThreshold: 90,
      result: totalScore.value >= 90 ? 'pass' : 'fail',
      comments: formData.comments,
      submittedAt: new Date()
    }
    
    emits('submit', {
      evaluationTaskId: props.evaluationTask.id,
      evaluationData
    })
    
  } catch (error) {
    console.error('表单验证失败:', error)
  } finally {
    submitting.value = false
  }
}

const handleSaveDraft = () => {
  const draftData = {
    evaluationTaskId: props.evaluationTask.id,
    formData: { ...formData },
    totalScore: totalScore.value,
    savedAt: new Date()
  }
  
  emits('save-draft', draftData)
}

const handleCancel = () => {
  emits('cancel')
}

// 事件定义
const emits = defineEmits<{
  submit: [data: any]
  'save-draft': [data: any]
  cancel: []
}>()
</script>

<style scoped>
.evaluation-form {
  padding: 20px;
}

.evaluation-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 20px;
  padding: 16px;
  background: #f8f9fa;
  border-radius: 8px;
}

.header-info h3 {
  margin: 0 0 8px 0;
  color: #303133;
}

.meta-info {
  display: flex;
  gap: 16px;
  align-items: center;
  font-size: 14px;
  color: #606266;
}

.score-summary {
  text-align: right;
}

.total-score {
  margin-bottom: 8px;
}

.total-score .label {
  color: #909399;
  margin-right: 8px;
}

.total-score .score {
  font-size: 24px;
  font-weight: bold;
  color: #303133;
}

.evaluation-guide {
  font-size: 14px;
  line-height: 1.6;
}

.evaluation-guide ul {
  margin: 8px 0;
  padding-left: 20px;
}

.evaluation-guide li {
  margin-bottom: 4px;
}

.dimension-card {
  margin-bottom: 20px;
  border-radius: 8px;
}

.dimension-card.recognition-card {
  border-left: 4px solid #409eff;
}

.dimension-card.skills-card {
  border-left: 4px solid #67c23a;
}

.dimension-card.culture-card {
  border-left: 4px solid #e6a23c;
}

.dimension-card.summary-card {
  border-left: 4px solid #909399;
}

.dimension-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.dimension-header h4 {
  margin: 0;
  color: #303133;
}

.dimension-score .current {
  font-size: 18px;
  font-weight: bold;
  color: #409eff;
}

.dimension-score .total {
  color: #909399;
  margin-left: 2px;
}

.evaluation-item {
  width: 100%;
}

.item-description {
  margin-bottom: 12px;
  padding: 8px 12px;
  background: #fafbfc;
  border-radius: 4px;
  font-size: 13px;
  color: #606266;
  line-height: 1.5;
}

.scoring-section {
  width: 100%;
}

.radio-content {
  display: flex;
  align-items: center;
  gap: 8px;
}

.radio-content .score {
  font-weight: 600;
  color: #409eff;
  min-width: 35px;
}

.radio-content .description {
  color: #606266;
}

.slider-description {
  margin-top: 8px;
  font-size: 12px;
  color: #909399;
  text-align: center;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 24px;
  padding-top: 20px;
  border-top: 1px solid #f0f0f0;
}

:deep(.el-form-item__label) {
  font-weight: 500;
  color: #303133;
}

:deep(.el-radio) {
  margin-bottom: 8px;
  margin-right: 0;
  width: 100%;
}

:deep(.el-radio__label) {
  width: 100%;
}

:deep(.el-slider) {
  margin: 12px 0;
}

:deep(.el-card__header) {
  background: #fafafa;
  border-bottom: 1px solid #f0f0f0;
}
</style> 