<template>
  <div class="assignment-dialog">
    <el-form
      ref="formRef"
      :model="formData"
      :rules="formRules"
      label-width="120px"
      @submit.prevent
    >
      <!-- 学员选择 -->
      <el-form-item label="选择学员" prop="studentId">
        <el-select
          v-model="formData.studentId"
          placeholder="请选择需要指派导师的学员"
          style="width: 100%"
          @change="handleStudentChange"
        >
          <el-option
            v-for="student in availableStudents"
            :key="student.id"
            :label="`${student.name} - ${student.department}`"
            :value="student.id"
          >
            <div class="student-option">
              <div class="student-info">
                <span class="name">{{ student.name }}</span>
                <span class="department">{{ student.department }}</span>
              </div>
              <div class="student-meta">
                <el-tag size="small" type="info">{{ student.position }}</el-tag>
              </div>
            </div>
          </el-option>
        </el-select>
      </el-form-item>

      <!-- 智能推荐区域 -->
      <div v-if="formData.studentId && smartRecommendationEnabled" class="smart-recommendation">
        <div class="recommendation-header">
          <el-button
            type="primary"
            @click="getSmartRecommendations"
            :loading="recommendationLoading"
            :disabled="!formData.studentId"
          >
            <el-icon><MagicStick /></el-icon>
            获取智能推荐
          </el-button>
          <span class="header-tip">基于技能匹配、经验水平、工作负载等因素推荐</span>
        </div>

        <!-- 推荐结果展示 -->
        <div v-if="recommendations.length > 0" class="recommendation-results">
          <h4>智能推荐结果</h4>
          <div class="recommendation-cards">
            <div
              v-for="rec in recommendations"
              :key="rec.mentorId"
              class="recommendation-card"
              :class="{ selected: formData.mentorId === rec.mentorId }"
              @click="selectRecommendedMentor(rec)"
            >
              <div class="card-header">
                <el-avatar :src="rec.mentor.avatar" :size="40">
                  {{ rec.mentor.name.charAt(0) }}
                </el-avatar>
                <div class="mentor-basic">
                  <div class="name">{{ rec.mentor.name }}</div>
                  <div class="department">{{ rec.mentor.department }}</div>
                </div>
                <div class="score">
                  <el-progress
                    type="circle"
                    :percentage="rec.matchingScore"
                    :width="50"
                    :stroke-width="6"
                    :color="getScoreColor(rec.matchingScore)"
                  />
                </div>
              </div>
              
              <div class="card-content">
                <div class="confidence">
                  <span class="label">推荐置信度：</span>
                  <el-tag :type="getConfidenceType(rec.confidence)">
                    {{ getConfidenceText(rec.confidence) }}
                  </el-tag>
                </div>
                
                <div class="reasons">
                  <span class="label">推荐理由：</span>
                  <ul class="reason-list">
                    <li v-for="reason in rec.reasons" :key="reason">{{ reason }}</li>
                  </ul>
                </div>

                <div class="strengths" v-if="rec.strengths.length > 0">
                  <span class="label">优势：</span>
                  <div class="tag-list">
                    <el-tag
                      v-for="strength in rec.strengths"
                      :key="strength"
                      size="small"
                      type="success"
                    >
                      {{ strength }}
                    </el-tag>
                  </div>
                </div>

                <div class="considerations" v-if="rec.considerations.length > 0">
                  <span class="label">需要考虑：</span>
                  <div class="tag-list">
                    <el-tag
                      v-for="consideration in rec.considerations"
                      :key="consideration"
                      size="small"
                      type="warning"
                    >
                      {{ consideration }}
                    </el-tag>
                  </div>
                </div>
              </div>

              <div class="card-actions">
                <el-button
                  v-if="formData.mentorId === rec.mentorId"
                  type="success"
                  size="small"
                  disabled
                >
                  已选择
                </el-button>
                <el-button
                  v-else
                  type="primary"
                  size="small"
                  @click.stop="selectRecommendedMentor(rec)"
                >
                  选择此导师
                </el-button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 手动选择导师 -->
      <el-form-item label="选择导师" prop="mentorId">
        <el-select
          v-model="formData.mentorId"
          placeholder="请选择带教导师"
          style="width: 100%"
          @change="handleMentorChange"
        >
          <el-option
            v-for="mentor in availableMentors"
            :key="mentor.id"
            :label="`${mentor.name} - ${mentor.department}`"
            :value="mentor.id"
          >
            <div class="mentor-option">
              <div class="mentor-info">
                <span class="name">{{ mentor.name }}</span>
                <span class="department">{{ mentor.department }}</span>
              </div>
              <div class="mentor-meta">
                <el-tag size="small" type="success" v-if="mentor.certifications.some(c => c.type === 'academy')">
                  书院认证
                </el-tag>
                <el-tag size="small" type="info" v-else>
                  部门指定
                </el-tag>
                <span class="load">{{ mentor.currentLoad }}/{{ mentor.maxLoad }}</span>
              </div>
            </div>
          </el-option>
        </el-select>
      </el-form-item>

      <!-- 师徒关系类型 -->
      <el-form-item label="关系类型" prop="type">
        <el-radio-group v-model="formData.type">
          <el-radio label="department_assigned">部门指定</el-radio>
          <el-radio label="academy_certified">书院认证</el-radio>
        </el-radio-group>
      </el-form-item>

      <!-- 带教范围 -->
      <el-form-item label="带教范围" prop="scope">
        <el-radio-group v-model="formData.scope">
          <el-radio label="full_project">全项目带教</el-radio>
          <el-radio label="specific_phase">特定阶段</el-radio>
        </el-radio-group>
      </el-form-item>

      <!-- 预期时长 -->
      <el-form-item label="预期时长" prop="expectedDuration">
        <el-input-number
          v-model="formData.expectedDuration"
          :min="1"
          :max="24"
          placeholder="月"
        />
        <span style="margin-left: 8px; color: #909399;">月</span>
      </el-form-item>

      <!-- 备注 -->
      <el-form-item label="备注">
        <el-input
          v-model="formData.notes"
          type="textarea"
          :rows="3"
          placeholder="请输入备注信息"
        />
      </el-form-item>
    </el-form>

    <!-- 对话框底部操作按钮 -->
    <template #footer>
      <div class="dialog-footer">
        <el-button @click="handleCancel">取消</el-button>
        <el-button
          type="primary"
          @click="handleSubmit"
          :loading="submitting"
          :disabled="!formData.studentId || !formData.mentorId"
        >
          确定创建
        </el-button>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed } from 'vue'
import { ElMessage } from 'element-plus'
import { MagicStick } from '@element-plus/icons-vue'
import type {
  Student,
  Mentor,
  SmartRecommendationResult,
  MentorMatchingRequest
} from '../../types/mentorship'

// Props
interface Props {
  projectId: string
  availableStudents: Student[]
  availableMentors: Mentor[]
}

const props = defineProps<Props>()

// 响应式数据
const formRef = ref()
const submitting = ref(false)
const recommendationLoading = ref(false)
const smartRecommendationEnabled = ref(true) // 可配置是否启用智能推荐
const recommendations = ref<SmartRecommendationResult[]>([])

// 表单数据
const formData = reactive({
  studentId: '',
  mentorId: '',
  type: 'department_assigned' as 'department_assigned' | 'academy_certified',
  scope: 'full_project' as 'full_project' | 'specific_phase',
  expectedDuration: 12,
  notes: '',
  matchingType: 'manual' as 'manual' | 'smart_assisted',
  matchingReasons: [] as string[]
})

// 表单验证规则
const formRules = {
  studentId: [
    { required: true, message: '请选择学员', trigger: 'change' }
  ],
  mentorId: [
    { required: true, message: '请选择导师', trigger: 'change' }
  ],
  type: [
    { required: true, message: '请选择关系类型', trigger: 'change' }
  ],
  scope: [
    { required: true, message: '请选择带教范围', trigger: 'change' }
  ],
  expectedDuration: [
    { required: true, message: '请输入预期时长', trigger: 'blur' }
  ]
}

// 计算属性
const selectedStudent = computed(() => {
  return props.availableStudents.find(s => s.id === formData.studentId)
})

const selectedMentor = computed(() => {
  return props.availableMentors.find(m => m.id === formData.mentorId)
})

// 方法
const getScoreColor = (score: number) => {
  if (score >= 90) return '#67c23a'
  if (score >= 80) return '#e6a23c'
  if (score >= 70) return '#f56c6c'
  return '#909399'
}

const getConfidenceType = (confidence: number) => {
  if (confidence >= 0.8) return 'success'
  if (confidence >= 0.6) return 'warning'
  return 'danger'
}

const getConfidenceText = (confidence: number) => {
  if (confidence >= 0.8) return '高'
  if (confidence >= 0.6) return '中'
  return '低'
}

// 智能推荐相关方法
const getSmartRecommendations = async () => {
  if (!formData.studentId) {
    ElMessage.warning('请先选择学员')
    return
  }

  recommendationLoading.value = true
  
  try {
    // 构建推荐请求
    const request: MentorMatchingRequest = {
      studentInfo: selectedStudent.value!,
      projectId: props.projectId,
      projectType: 'mentorship', // 根据实际项目类型设置
      requirements: [], // 可以根据学员信息自动提取
      preferences: {
        mentorType: formData.type,
        experienceLevel: 'senior' // 可以根据学员级别调整
      }
    }

    // 模拟API调用 - 实际开发中替换为真实API
    const mockRecommendations: SmartRecommendationResult[] = [
      {
        mentorId: props.availableMentors[0]?.id || '',
        mentor: props.availableMentors[0]!,
        matchingScore: 92,
        confidence: 0.85,
        reasons: ['技能高度匹配', '经验丰富', '工作负载适中', '同部门便于沟通'],
        strengths: ['专业技能强', '带教经验丰富', '沟通能力强'],
        considerations: ['工作负载较重', '时间安排需协调']
      },
      {
        mentorId: props.availableMentors[1]?.id || '',
        mentor: props.availableMentors[1]!,
        matchingScore: 87,
        confidence: 0.78,
        reasons: ['技能匹配良好', '带教风格适合', '地理位置近'],
        strengths: ['耐心细致', '因材施教', '响应及时'],
        considerations: ['专业领域略有差异']
      }
    ].filter(rec => rec.mentor) // 过滤掉无效数据

    recommendations.value = mockRecommendations
    
    if (mockRecommendations.length === 0) {
      ElMessage.info('暂无合适的推荐导师，请手动选择')
    } else {
      ElMessage.success(`为您推荐了 ${mockRecommendations.length} 位合适的导师`)
    }
  } catch (error) {
    console.error('获取智能推荐失败:', error)
    ElMessage.error('获取推荐失败，请稍后重试或手动选择导师')
  } finally {
    recommendationLoading.value = false
  }
}

const selectRecommendedMentor = (recommendation: SmartRecommendationResult) => {
  formData.mentorId = recommendation.mentorId
  formData.matchingType = 'smart_assisted'
  formData.matchingReasons = recommendation.reasons
  
  ElMessage.success(`已选择推荐导师：${recommendation.mentor.name}`)
}

// 事件处理
const handleStudentChange = () => {
  // 清空之前的推荐结果
  recommendations.value = []
  formData.mentorId = ''
  formData.matchingType = 'manual'
  formData.matchingReasons = []
}

const handleMentorChange = () => {
  // 如果是手动选择的导师，更新匹配类型
  if (formData.matchingType !== 'smart_assisted') {
    formData.matchingType = 'manual'
    formData.matchingReasons = ['手动选择']
  }
}

const handleSubmit = async () => {
  try {
    // 表单验证
    await formRef.value.validate()
    
    submitting.value = true
    
    // 构建提交数据
    const submitData = {
      ...formData,
      projectId: props.projectId,
      establishedDate: new Date(),
      status: 'active',
      createdAt: new Date(),
      createdBy: 'current-user-id' // 实际开发中从用户状态获取
    }
    
    // 触发提交事件
    emits('submit', submitData)
    
  } catch (error) {
    console.error('表单验证失败:', error)
  } finally {
    submitting.value = false
  }
}

const handleCancel = () => {
  emits('cancel')
}

// 事件定义
const emits = defineEmits<{
  submit: [data: any]
  cancel: []
}>()
</script>

<style scoped>
.assignment-dialog {
  padding: 20px;
}

.student-option,
.mentor-option {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
}

.student-info,
.mentor-info {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
}

.name {
  font-weight: 500;
  color: #303133;
}

.department {
  font-size: 12px;
  color: #909399;
  margin-top: 2px;
}

.student-meta,
.mentor-meta {
  display: flex;
  align-items: center;
  gap: 8px;
}

.load {
  font-size: 12px;
  color: #909399;
}

.smart-recommendation {
  margin: 20px 0;
  padding: 16px;
  border: 1px solid #e4e7ed;
  border-radius: 8px;
  background-color: #fafbfc;
}

.recommendation-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
}

.header-tip {
  font-size: 12px;
  color: #909399;
}

.recommendation-results h4 {
  margin: 0 0 16px 0;
  color: #303133;
  font-size: 14px;
  font-weight: 500;
}

.recommendation-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 16px;
}

.recommendation-card {
  border: 1px solid #e4e7ed;
  border-radius: 8px;
  padding: 16px;
  background: #fff;
  cursor: pointer;
  transition: all 0.3s ease;
}

.recommendation-card:hover {
  border-color: #409eff;
  box-shadow: 0 2px 8px rgba(64, 158, 255, 0.2);
}

.recommendation-card.selected {
  border-color: #409eff;
  background-color: #f0f9ff;
}

.card-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}

.mentor-basic {
  flex: 1;
}

.mentor-basic .name {
  font-size: 14px;
  font-weight: 500;
  margin-bottom: 4px;
}

.mentor-basic .department {
  font-size: 12px;
  color: #909399;
}

.card-content {
  margin-bottom: 12px;
}

.label {
  font-size: 12px;
  color: #606266;
  font-weight: 500;
}

.confidence {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.reasons {
  margin-bottom: 8px;
}

.reason-list {
  margin: 4px 0 0 0;
  padding-left: 16px;
  font-size: 12px;
  color: #606266;
}

.reason-list li {
  margin-bottom: 2px;
}

.strengths,
.considerations {
  margin-bottom: 8px;
}

.tag-list {
  margin-top: 4px;
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.card-actions {
  display: flex;
  justify-content: flex-end;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

:deep(.el-form-item__label) {
  font-weight: 500;
}
</style> 