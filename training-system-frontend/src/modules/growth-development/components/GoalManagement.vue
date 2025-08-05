<template>
  <div class="goal-management">
    <!-- 目标分类标签 -->
    <div class="goal-categories">
      <el-tabs v-model="activeCategory" @tab-change="handleCategoryChange">
        <el-tab-pane label="💼 职业发展" name="career">
          <div class="category-goals">
            <GoalItem 
              v-for="goal in careerGoals" 
              :key="goal.id"
              :goal="goal"
              @update="updateGoal"
              @delete="deleteGoal"
              @find-partners="findPartners"
            />
            <div class="add-goal-card" @click="showAddGoalDialog('career')">
              <el-icon size="24"><Plus /></el-icon>
              <span>添加职业发展目标</span>
            </div>
          </div>
        </el-tab-pane>
        
        <el-tab-pane label="🚀 技能提升" name="skill">
          <div class="category-goals">
            <GoalItem 
              v-for="goal in skillGoals" 
              :key="goal.id"
              :goal="goal"
              @update="updateGoal"
              @delete="deleteGoal"
              @find-partners="findPartners"
            />
            <div class="add-goal-card" @click="showAddGoalDialog('skill')">
              <el-icon size="24"><Plus /></el-icon>
              <span>添加技能提升目标</span>
            </div>
          </div>
        </el-tab-pane>
        
        <el-tab-pane label="⚡ 个人效能" name="efficiency">
          <div class="category-goals">
            <GoalItem 
              v-for="goal in efficiencyGoals" 
              :key="goal.id"
              :goal="goal"
              @update="updateGoal"
              @delete="deleteGoal"
              @find-partners="findPartners"
            />
            <div class="add-goal-card" @click="showAddGoalDialog('efficiency')">
              <el-icon size="24"><Plus /></el-icon>
              <span>添加个人效能目标</span>
            </div>
          </div>
        </el-tab-pane>
        
        <el-tab-pane label="📚 学习成长" name="learning">
          <div class="category-goals">
            <GoalItem 
              v-for="goal in learningGoals" 
              :key="goal.id"
              :goal="goal"
              @update="updateGoal"
              @delete="deleteGoal"
              @find-partners="findPartners"
            />
            <div class="add-goal-card" @click="showAddGoalDialog('learning')">
              <el-icon size="24"><Plus /></el-icon>
              <span>添加学习成长目标</span>
            </div>
          </div>
        </el-tab-pane>
      </el-tabs>
    </div>

    <!-- 成长伙伴推荐对话框 -->
    <el-dialog
      v-model="showPartnersDialog"
      title="发现成长伙伴"
      width="700px"
    >
      <div class="partners-content">
        <div class="partners-tip">
          <el-alert
            title="发现了与你有相同目标的同事！"
            type="success"
            :closable="false"
          >
            <template #default>
              <p>还有 <strong>{{ suggestedPartners.length }}</strong> 位同事选择了相同的目标："{{ selectedGoalForPartners?.title }}"</p>
              <p>你可以邀请他们成为成长伙伴，一起制定计划、分享进度、相互激励！</p>
            </template>
          </el-alert>
        </div>
        
        <div class="partners-list">
          <div 
            v-for="partner in suggestedPartners" 
            :key="partner.id"
            class="partner-card"
          >
            <div class="partner-info">
              <el-avatar :size="50" :src="partner.avatar">
                <el-icon><User /></el-icon>
              </el-avatar>
              <div class="partner-details">
                <h4>{{ partner.name }}</h4>
                <p>{{ partner.department }} - {{ partner.position }}</p>
                <div class="partner-progress">
                  <span>目标进度：{{ partner.goalProgress }}%</span>
                  <el-progress 
                    :percentage="partner.goalProgress" 
                    :stroke-width="6"
                    :show-text="false"
                  />
                </div>
              </div>
            </div>
            <div class="partner-actions">
              <el-button 
                type="primary" 
                size="small"
                @click="invitePartner(partner)"
              >
                邀请合作
              </el-button>
              <el-button 
                size="small"
                @click="viewPartnerProfile(partner)"
              >
                查看资料
              </el-button>
            </div>
          </div>
        </div>
      </div>
    </el-dialog>

    <!-- 添加目标对话框 -->
    <el-dialog
      v-model="showAddDialog"
      :title="`添加${getCategoryName(newGoal.category)}目标`"
      width="600px"
    >
      <el-form :model="newGoal" :rules="goalRules" ref="goalFormRef" label-width="120px">
        <el-form-item label="目标标题" prop="title">
          <el-input v-model="newGoal.title" placeholder="请输入目标标题" />
        </el-form-item>
        
        <el-form-item label="目标描述" prop="description">
          <el-input 
            v-model="newGoal.description" 
            type="textarea" 
            :rows="3"
            placeholder="详细描述你的目标内容"
          />
        </el-form-item>
        
        <el-form-item label="目标日期" prop="targetDate">
          <el-date-picker
            v-model="newGoal.targetDate"
            type="date"
            placeholder="选择目标完成日期"
            format="YYYY-MM-DD"
            value-format="YYYY-MM-DD"
          />
        </el-form-item>
        
        <el-form-item label="跟踪方式" prop="trackingType">
          <el-radio-group v-model="newGoal.trackingType">
            <el-radio label="percentage">百分比进度</el-radio>
            <el-radio label="milestone">里程碑式</el-radio>
            <el-radio label="evidence">证据记录</el-radio>
            <el-radio label="self-assessment">自我评估</el-radio>
          </el-radio-group>
        </el-form-item>
        
        <el-form-item v-if="newGoal.trackingType === 'milestone'" label="里程碑">
          <div class="milestones-input">
            <div 
              v-for="(milestone, index) in newGoal.milestones" 
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
                :disabled="newGoal.milestones.length <= 1"
              >
                删除
              </el-button>
            </div>
            <el-button type="primary" size="small" @click="addMilestone">
              添加里程碑
            </el-button>
          </div>
        </el-form-item>
        
        <el-form-item label="寻找伙伴">
          <el-checkbox v-model="newGoal.findPartners">
            创建目标后自动寻找有相同目标的同事作为成长伙伴
          </el-checkbox>
        </el-form-item>
      </el-form>
      
      <template #footer>
        <el-button @click="showAddDialog = false">取消</el-button>
        <el-button type="primary" @click="addGoal">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { Plus, User } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import GoalItem from './GoalItem.vue'

// 响应式数据
const activeCategory = ref('career')
const showPartnersDialog = ref(false)
const showAddDialog = ref(false)
const selectedGoalForPartners = ref<any>(null)
const goalFormRef = ref()

// 新目标表单数据
const newGoal = ref({
  title: '',
  description: '',
  category: 'career',
  targetDate: '',
  trackingType: 'percentage',
  milestones: [{ title: '', date: '' }],
  findPartners: true
})

// 表单验证规则
const goalRules = {
  title: [{ required: true, message: '请输入目标标题', trigger: 'blur' }],
  description: [{ required: true, message: '请输入目标描述', trigger: 'blur' }],
  targetDate: [{ required: true, message: '请选择目标日期', trigger: 'change' }],
  trackingType: [{ required: true, message: '请选择跟踪方式', trigger: 'change' }]
}

// 模拟目标数据
const goals = ref([
  {
    id: 'career-1',
    title: '晋升为技术负责人',
    description: '在今年内获得技术负责人职位，带领团队完成重要项目',
    category: 'career',
    progress: 65,
    targetDate: '2024-12-31',
    trackingType: 'milestone',
    milestones: [
      { title: '完成领导力培训', completed: true, date: '2024-03-15' },
      { title: '主导重要项目', completed: true, date: '2024-06-30' },
      { title: '获得团队认可', completed: false, date: '2024-09-30' },
      { title: '通过晋升评估', completed: false, date: '2024-12-15' }
    ],
    partners: ['partner-1', 'partner-2'],
    createdAt: new Date('2024-01-15')
  },
  {
    id: 'skill-1',
    title: '掌握AI工具应用',
    description: '学会使用ChatGPT、GitHub Copilot等AI工具提升工作效率',
    category: 'skill',
    progress: 80,
    targetDate: '2024-08-31',
    trackingType: 'percentage',
    partners: ['partner-3'],
    createdAt: new Date('2024-02-01')
  },
  {
    id: 'efficiency-1',
    title: '改善时间管理',
    description: '建立更好的时间管理习惯，提高工作效率',
    category: 'efficiency',
    progress: 45,
    targetDate: '2024-10-31',
    trackingType: 'self-assessment',
    partners: [],
    createdAt: new Date('2024-03-01')
  },
  {
    id: 'learning-1',
    title: '完成架构师认证',
    description: '获得云架构师专业认证，提升技术权威性',
    category: 'learning',
    progress: 30,
    targetDate: '2024-11-30',
    trackingType: 'evidence',
    partners: ['partner-4', 'partner-5'],
    createdAt: new Date('2024-02-15')
  }
])

// 建议的成长伙伴
const suggestedPartners = ref([
  {
    id: 'partner-1',
    name: '李四',
    department: '技术研发部',
    position: '高级开发工程师',
    avatar: '',
    goalProgress: 58,
    commonGoals: ['晋升为技术负责人']
  },
  {
    id: 'partner-2',
    name: '王五',
    department: '产品技术部',
    position: '资深工程师',
    avatar: '',
    goalProgress: 72,
    commonGoals: ['晋升为技术负责人']
  },
  {
    id: 'partner-3',
    name: '赵六',
    department: '技术研发部',
    position: '中级工程师',
    avatar: '',
    goalProgress: 85,
    commonGoals: ['掌握AI工具应用']
  }
])

// 计算属性
const careerGoals = computed(() => 
  goals.value.filter(goal => goal.category === 'career')
)

const skillGoals = computed(() => 
  goals.value.filter(goal => goal.category === 'skill')
)

const efficiencyGoals = computed(() => 
  goals.value.filter(goal => goal.category === 'efficiency')
)

const learningGoals = computed(() => 
  goals.value.filter(goal => goal.category === 'learning')
)

// 方法
const handleCategoryChange = (category: string) => {
  activeCategory.value = category
  console.log('Category changed to:', category)
}

const getCategoryName = (category: string) => {
  const names = {
    career: '职业发展',
    skill: '技能提升',
    efficiency: '个人效能',
    learning: '学习成长'
  }
  return names[category] || category
}

const showAddGoalDialog = (category: string) => {
  newGoal.value.category = category
  showAddDialog.value = true
}

const addMilestone = () => {
  newGoal.value.milestones.push({ title: '', date: '' })
}

const removeMilestone = (index: number) => {
  newGoal.value.milestones.splice(index, 1)
}

const addGoal = async () => {
  if (!goalFormRef.value) return
  
  try {
    await goalFormRef.value.validate()
    
    // 创建新目标
    const goalData = {
      ...newGoal.value,
      id: `${newGoal.value.category}-${Date.now()}`,
      progress: 0,
      partners: [],
      createdAt: new Date()
    }
    
    goals.value.push(goalData)
    
    ElMessage.success('目标创建成功！')
    
    // 如果选择了寻找伙伴，显示伙伴推荐
    if (newGoal.value.findPartners) {
      selectedGoalForPartners.value = goalData
      showPartnersDialog.value = true
    }
    
    // 重置表单
    resetForm()
    showAddDialog.value = false
    
  } catch (error) {
    console.error('Form validation failed:', error)
  }
}

const resetForm = () => {
  newGoal.value = {
    title: '',
    description: '',
    category: 'career',
    targetDate: '',
    trackingType: 'percentage',
    milestones: [{ title: '', date: '' }],
    findPartners: true
  }
}

const updateGoal = (goalData: any) => {
  const index = goals.value.findIndex(g => g.id === goalData.id)
  if (index !== -1) {
    goals.value[index] = { ...goals.value[index], ...goalData }
    ElMessage.success('目标更新成功！')
  }
}

const deleteGoal = (goalId: string) => {
  const index = goals.value.findIndex(g => g.id === goalId)
  if (index !== -1) {
    goals.value.splice(index, 1)
    ElMessage.success('目标删除成功！')
  }
}

const findPartners = (goal: any) => {
  selectedGoalForPartners.value = goal
  showPartnersDialog.value = true
}

const invitePartner = (partner: any) => {
  // 发送邀请逻辑
  console.log('Inviting partner:', partner)
  ElMessage.success(`已向 ${partner.name} 发送成长伙伴邀请`)
}

const viewPartnerProfile = (partner: any) => {
  // 查看伙伴资料逻辑
  console.log('Viewing partner profile:', partner)
  ElMessage.info('查看伙伴资料功能开发中...')
}
</script>

<style scoped>
.goal-management {
  height: 100%;
}

.goal-categories {
  height: 100%;
}

.category-goals {
  display: flex;
  flex-direction: column;
  gap: 16px;
  max-height: 500px;
  overflow-y: auto;
  padding: 16px 0;
}

.add-goal-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 32px;
  border: 2px dashed #e4e7ed;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s;
  color: #909399;
}

.add-goal-card:hover {
  border-color: #409eff;
  color: #409eff;
  background: rgba(64, 158, 255, 0.05);
}

.add-goal-card span {
  margin-top: 8px;
  font-size: 14px;
}

/* 成长伙伴对话框 */
.partners-content {
  padding: 20px 0;
}

.partners-tip {
  margin-bottom: 24px;
}

.partners-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
  max-height: 400px;
  overflow-y: auto;
}

.partner-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px;
  border: 1px solid #e4e7ed;
  border-radius: 8px;
  transition: all 0.3s;
}

.partner-card:hover {
  border-color: #409eff;
  box-shadow: 0 2px 8px rgba(64, 158, 255, 0.1);
}

.partner-info {
  display: flex;
  align-items: center;
  gap: 16px;
  flex: 1;
}

.partner-details h4 {
  margin: 0 0 4px 0;
  font-size: 16px;
  color: #303133;
}

.partner-details p {
  margin: 0 0 8px 0;
  font-size: 14px;
  color: #909399;
}

.partner-progress {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  color: #606266;
}

.partner-actions {
  display: flex;
  gap: 8px;
}

/* 添加目标对话框 */
.milestones-input {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.milestone-item {
  display: flex;
  align-items: center;
  gap: 8px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .category-goals {
    max-height: 400px;
  }
  
  .partner-card {
    flex-direction: column;
    gap: 16px;
  }
  
  .partner-info {
    width: 100%;
  }
  
  .partner-actions {
    width: 100%;
    justify-content: center;
  }
  
  .milestone-item {
    flex-direction: column;
    gap: 8px;
  }
}
</style> 