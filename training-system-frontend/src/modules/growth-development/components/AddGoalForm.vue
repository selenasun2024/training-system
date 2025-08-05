<template>
  <div class="add-goal-form">
    <el-form :model="goalForm" :rules="rules" ref="formRef" label-width="120px">
      <el-form-item label="目标分类" prop="category">
        <el-select v-model="goalForm.category" placeholder="请选择目标分类">
          <el-option label="💼 职业发展" value="career" />
          <el-option label="🚀 技能提升" value="skill" />
          <el-option label="⚡ 个人效能" value="efficiency" />
          <el-option label="📚 学习成长" value="learning" />
        </el-select>
      </el-form-item>
      
      <el-form-item label="目标标题" prop="title">
        <el-input 
          v-model="goalForm.title" 
          placeholder="请输入目标标题"
          maxlength="50"
          show-word-limit
        />
      </el-form-item>
      
      <el-form-item label="目标描述" prop="description">
        <el-input 
          v-model="goalForm.description" 
          type="textarea" 
          :rows="4"
          placeholder="详细描述你的目标内容、预期成果和实现方式"
          maxlength="500"
          show-word-limit
        />
      </el-form-item>
      
      <el-form-item label="目标日期" prop="targetDate">
        <el-date-picker
          v-model="goalForm.targetDate"
          type="date"
          placeholder="选择目标完成日期"
          format="YYYY-MM-DD"
          value-format="YYYY-MM-DD"
          :disabledDate="disabledDate"
        />
      </el-form-item>
      
      <el-form-item label="跟踪方式" prop="trackingType">
        <el-radio-group v-model="goalForm.trackingType">
          <el-radio label="percentage">
            <div class="tracking-option">
              <strong>百分比进度</strong>
              <p>适合可量化的目标，如学习进度、项目完成度等</p>
            </div>
          </el-radio>
          <el-radio label="milestone">
            <div class="tracking-option">
              <strong>里程碑式</strong>
              <p>适合阶段性目标，如认证考试、项目交付等</p>
            </div>
          </el-radio>
          <el-radio label="evidence">
            <div class="tracking-option">
              <strong>证据记录</strong>
              <p>适合需要提供证明的目标，如获得证书、完成作品等</p>
            </div>
          </el-radio>
          <el-radio label="self-assessment">
            <div class="tracking-option">
              <strong>自我评估</strong>
              <p>适合主观性目标，如改善沟通能力、提升自信等</p>
            </div>
          </el-radio>
        </el-radio-group>
      </el-form-item>
      
      <!-- 里程碑设置 -->
      <el-form-item v-if="goalForm.trackingType === 'milestone'" label="里程碑设置">
        <div class="milestones-container">
          <div 
            v-for="(milestone, index) in goalForm.milestones" 
            :key="index"
            class="milestone-item"
          >
            <el-input 
              v-model="milestone.title" 
              placeholder="里程碑标题"
              style="flex: 1"
            />
            <el-date-picker
              v-model="milestone.date"
              type="date"
              placeholder="完成日期"
              format="YYYY-MM-DD"
              value-format="YYYY-MM-DD"
              style="width: 150px"
            />
            <el-button 
              type="danger" 
              size="small" 
              @click="removeMilestone(index)"
              :disabled="goalForm.milestones.length <= 1"
            >
              删除
            </el-button>
          </div>
          <el-button type="primary" size="small" @click="addMilestone">
            <el-icon><Plus /></el-icon>
            添加里程碑
          </el-button>
        </div>
      </el-form-item>
      
      <el-form-item label="优先级" prop="priority">
        <el-select v-model="goalForm.priority" placeholder="选择优先级">
          <el-option label="🔴 高优先级" value="high" />
          <el-option label="🟡 中优先级" value="medium" />
          <el-option label="🟢 低优先级" value="low" />
        </el-select>
      </el-form-item>
      
      <el-form-item label="相关技能">
        <el-select 
          v-model="goalForm.skills" 
          multiple 
          filterable 
          allow-create
          placeholder="选择或输入相关技能标签"
        >
          <el-option 
            v-for="skill in commonSkills" 
            :key="skill"
            :label="skill" 
            :value="skill"
          />
        </el-select>
      </el-form-item>
      
      <el-form-item label="成长伙伴">
        <div class="partner-settings">
          <el-checkbox v-model="goalForm.findPartners">
            <strong>自动寻找成长伙伴</strong>
          </el-checkbox>
          <p class="partner-tip">
            系统会自动推荐有相同目标的同事，你可以邀请他们成为成长伙伴，一起制定计划、分享进度、相互激励。
          </p>
        </div>
      </el-form-item>
      
      <el-form-item label="提醒设置">
        <div class="reminder-settings">
          <el-checkbox v-model="goalForm.enableReminder">
            <strong>开启进度提醒</strong>
          </el-checkbox>
          <div v-if="goalForm.enableReminder" class="reminder-options">
            <el-select v-model="goalForm.reminderFrequency" placeholder="提醒频率">
              <el-option label="每日提醒" value="daily" />
              <el-option label="每周提醒" value="weekly" />
              <el-option label="每月提醒" value="monthly" />
            </el-select>
          </div>
        </div>
      </el-form-item>
      
      <el-form-item label="公开设置">
        <el-radio-group v-model="goalForm.visibility">
          <el-radio label="private">
            <div class="visibility-option">
              <strong>仅自己可见</strong>
              <p>目标只有你自己能看到</p>
            </div>
          </el-radio>
          <el-radio label="team">
            <div class="visibility-option">
              <strong>团队可见</strong>
              <p>你的团队成员可以看到这个目标</p>
            </div>
          </el-radio>
          <el-radio label="public">
            <div class="visibility-option">
              <strong>公开可见</strong>
              <p>所有同事都可以看到这个目标</p>
            </div>
          </el-radio>
        </el-radio-group>
      </el-form-item>
    </el-form>
    
    <div class="form-actions">
      <el-button @click="handleCancel">取消</el-button>
      <el-button type="primary" @click="handleSubmit" :loading="submitting">
        创建目标
      </el-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { Plus, Upload } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'

// Emits
const emit = defineEmits<{
  success: []
  cancel: []
}>()

// 响应式数据
const formRef = ref()
const submitting = ref(false)

// 表单数据
const goalForm = reactive({
  category: '',
  title: '',
  description: '',
  targetDate: '',
  trackingType: 'percentage',
  milestones: [{ title: '', date: '' }],
  priority: 'medium',
  skills: [],
  findPartners: true,
  enableReminder: true,
  reminderFrequency: 'weekly',
  visibility: 'team'
})

// 验证规则
const rules = {
  category: [
    { required: true, message: '请选择目标分类', trigger: 'change' }
  ],
  title: [
    { required: true, message: '请输入目标标题', trigger: 'blur' },
    { min: 5, max: 50, message: '标题长度在 5 到 50 个字符', trigger: 'blur' }
  ],
  description: [
    { required: true, message: '请输入目标描述', trigger: 'blur' },
    { min: 10, max: 500, message: '描述长度在 10 到 500 个字符', trigger: 'blur' }
  ],
  targetDate: [
    { required: true, message: '请选择目标日期', trigger: 'change' }
  ],
  trackingType: [
    { required: true, message: '请选择跟踪方式', trigger: 'change' }
  ],
  priority: [
    { required: true, message: '请选择优先级', trigger: 'change' }
  ]
}

// 常用技能标签
const commonSkills = ref([
  '项目管理', '团队领导', '沟通技巧', '技术架构', '数据分析',
  '创新思维', '问题解决', '时间管理', '学习能力', '适应能力',
  '编程技能', '设计思维', '商业理解', '客户服务', '质量管理'
])

// 方法
const disabledDate = (time: Date) => {
  // 禁用今天之前的日期
  return time.getTime() < Date.now() - 8.64e7
}

const addMilestone = () => {
  goalForm.milestones.push({ title: '', date: '' })
}

const removeMilestone = (index: number) => {
  goalForm.milestones.splice(index, 1)
}

const handleSubmit = async () => {
  if (!formRef.value) return
  
  try {
    await formRef.value.validate()
    
    // 验证里程碑数据
    if (goalForm.trackingType === 'milestone') {
      const hasEmptyMilestone = goalForm.milestones.some(m => !m.title || !m.date)
      if (hasEmptyMilestone) {
        ElMessage.error('请完善所有里程碑信息')
        return
      }
    }
    
    submitting.value = true
    
    // 模拟API调用
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    // 创建目标数据
    const goalData = {
      ...goalForm,
      id: `goal-${Date.now()}`,
      progress: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
    
    console.log('Creating goal:', goalData)
    
    ElMessage.success('目标创建成功！')
    emit('success')
    
  } catch (error) {
    console.error('Form validation failed:', error)
    ElMessage.error('请检查表单填写是否完整')
  } finally {
    submitting.value = false
  }
}

const handleCancel = () => {
  emit('cancel')
}
</script>

<style scoped>
.add-goal-form {
  padding: 20px 0;
}

.tracking-option {
  margin-left: 8px;
}

.tracking-option strong {
  display: block;
  margin-bottom: 4px;
  color: #303133;
}

.tracking-option p {
  margin: 0;
  font-size: 13px;
  color: #909399;
  line-height: 1.4;
}

.milestones-container {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.milestone-item {
  display: flex;
  align-items: center;
  gap: 8px;
}

.partner-settings,
.reminder-settings {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.partner-tip {
  margin: 0;
  font-size: 13px;
  color: #909399;
  line-height: 1.4;
}

.reminder-options {
  margin-left: 24px;
  margin-top: 8px;
}

.visibility-option {
  margin-left: 8px;
}

.visibility-option strong {
  display: block;
  margin-bottom: 4px;
  color: #303133;
}

.visibility-option p {
  margin: 0;
  font-size: 13px;
  color: #909399;
  line-height: 1.4;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 24px;
  padding-top: 20px;
  border-top: 1px solid #e4e7ed;
}

/* 表单项样式优化 */
:deep(.el-form-item__label) {
  font-weight: 500;
  color: #303133;
}

:deep(.el-radio) {
  margin-bottom: 12px;
  align-items: flex-start;
}

:deep(.el-radio__label) {
  line-height: 1.4;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .milestone-item {
    flex-direction: column;
    gap: 8px;
  }
  
  .form-actions {
    flex-direction: column;
  }
}
</style> 