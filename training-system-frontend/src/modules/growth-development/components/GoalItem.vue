<template>
  <div class="goal-item" :class="{ 'completed': goal.progress >= 100 }">
    <div class="goal-header">
      <div class="goal-title">
        <h4>{{ goal.title }}</h4>
        <div class="goal-meta">
          <el-tag :type="getStatusType(goal.progress)" size="small">
            {{ getStatusText(goal.progress) }}
          </el-tag>
          <span class="goal-date">目标日期：{{ formatDate(goal.targetDate) }}</span>
        </div>
      </div>
      <div class="goal-actions">
        <el-dropdown @command="handleCommand">
          <el-button size="small" text>
            <el-icon><More /></el-icon>
          </el-button>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item command="edit">编辑目标</el-dropdown-item>
              <el-dropdown-item command="update-progress">更新进度</el-dropdown-item>
              <el-dropdown-item command="find-partners">寻找伙伴</el-dropdown-item>
              <el-dropdown-item command="view-history">查看历史</el-dropdown-item>
              <el-dropdown-item command="delete" divided>删除目标</el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </div>
    </div>

    <div class="goal-description">
      <p>{{ goal.description }}</p>
    </div>

    <div class="goal-progress">
      <div class="progress-header">
        <span class="progress-label">完成进度</span>
        <span class="progress-value">{{ goal.progress }}%</span>
      </div>
      <el-progress 
        :percentage="goal.progress" 
        :stroke-width="12"
        :color="getProgressColor(goal.progress)"
      />
    </div>

    <!-- 里程碑进度 -->
    <div v-if="goal.trackingType === 'milestone' && goal.milestones" class="milestones">
      <h5>里程碑进度</h5>
      <div class="milestone-list">
        <div 
          v-for="(milestone, index) in goal.milestones" 
          :key="index"
          class="milestone-item"
          :class="{ 'completed': milestone.completed }"
        >
          <div class="milestone-indicator">
            <el-icon v-if="milestone.completed" color="#67c23a">
              <Check />
            </el-icon>
            <div v-else class="milestone-dot"></div>
          </div>
          <div class="milestone-content">
            <span class="milestone-title">{{ milestone.title }}</span>
            <span class="milestone-date">{{ formatDate(milestone.date) }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 成长伙伴 -->
    <div v-if="goal.partners && goal.partners.length > 0" class="partners">
      <h5>成长伙伴</h5>
      <div class="partner-list">
        <div class="partner-avatars">
          <el-avatar 
            v-for="(partnerId, index) in goal.partners.slice(0, 3)" 
            :key="partnerId"
            :size="32"
            :src="getPartnerAvatar(partnerId)"
            class="partner-avatar"
            :style="{ marginLeft: index > 0 ? '-8px' : '0' }"
          >
            {{ getPartnerName(partnerId).charAt(0) }}
          </el-avatar>
          <div v-if="goal.partners.length > 3" class="more-partners">
            +{{ goal.partners.length - 3 }}
          </div>
        </div>
        <el-button size="small" text @click="$emit('find-partners', goal)">
          <el-icon><Plus /></el-icon>
          邀请更多伙伴
        </el-button>
      </div>
    </div>

    <div v-else class="no-partners">
      <el-button size="small" type="primary" @click="$emit('find-partners', goal)">
        <el-icon><UserFilled /></el-icon>
        寻找成长伙伴
      </el-button>
    </div>

    <!-- 更新进度对话框 -->
    <el-dialog
      v-model="showUpdateDialog"
      title="更新进度"
      width="500px"
    >
      <div class="update-content">
        <div v-if="goal.trackingType === 'percentage'" class="percentage-update">
          <el-form-item label="完成进度">
            <el-slider 
              v-model="updateProgress" 
              :max="100"
              :format-tooltip="formatTooltip"
              show-input
            />
          </el-form-item>
          <el-form-item label="进度说明">
            <el-input 
              v-model="progressNote" 
              type="textarea" 
              :rows="3"
              placeholder="请简要说明本次进度更新的内容"
            />
          </el-form-item>
        </div>
        
        <div v-else-if="goal.trackingType === 'milestone'" class="milestone-update">
          <h5>更新里程碑状态</h5>
          <div class="milestone-checklist">
            <div 
              v-for="(milestone, index) in goal.milestones" 
              :key="index"
              class="milestone-check"
            >
              <el-checkbox 
                v-model="milestone.completed"
                @change="updateMilestoneProgress"
              >
                {{ milestone.title }}
              </el-checkbox>
              <span class="milestone-date">{{ formatDate(milestone.date) }}</span>
            </div>
          </div>
        </div>
        
        <div v-else-if="goal.trackingType === 'evidence'" class="evidence-update">
          <el-form-item label="上传证据">
            <el-upload
              class="upload-demo"
              drag
              multiple
              :file-list="evidenceFiles"
            >
              <el-icon class="el-icon--upload"><Upload /></el-icon>
              <div class="el-upload__text">
                将文件拖到此处，或<em>点击上传</em>
              </div>
              <template #tip>
                <div class="el-upload__tip">
                  支持上传学习证明、工作成果等支撑材料
                </div>
              </template>
            </el-upload>
          </el-form-item>
          <el-form-item label="成果说明">
            <el-input 
              v-model="evidenceNote" 
              type="textarea" 
              :rows="4"
              placeholder="请描述你的学习成果或工作成就"
            />
          </el-form-item>
        </div>
        
        <div v-else-if="goal.trackingType === 'self-assessment'" class="assessment-update">
          <el-form-item label="自我评估">
            <el-rate 
              v-model="selfAssessmentScore" 
              :max="5"
              show-text
              :texts="['很差', '较差', '一般', '良好', '优秀']"
            />
          </el-form-item>
          <el-form-item label="反思记录">
            <el-input 
              v-model="assessmentNote" 
              type="textarea" 
              :rows="4"
              placeholder="请记录你的学习感受、遇到的挑战和收获"
            />
          </el-form-item>
        </div>
      </div>
      
      <template #footer>
        <el-button @click="showUpdateDialog = false">取消</el-button>
        <el-button type="primary" @click="confirmUpdate">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { 
  More, 
  Check, 
  Plus, 
  UserFilled,
  Upload 
} from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'

// Props
const props = defineProps<{
  goal: any
}>()

// Emits
const emit = defineEmits<{
  update: [goal: any]
  delete: [goalId: string]
  findPartners: [goal: any]
}>()

// 响应式数据
const showUpdateDialog = ref(false)
const updateProgress = ref(props.goal.progress)
const progressNote = ref('')
const evidenceFiles = ref([])
const evidenceNote = ref('')
const selfAssessmentScore = ref(3)
const assessmentNote = ref('')

// 模拟伙伴数据
const partnersData = {
  'partner-1': { name: '李四', avatar: '' },
  'partner-2': { name: '王五', avatar: '' },
  'partner-3': { name: '赵六', avatar: '' },
  'partner-4': { name: '钱七', avatar: '' },
  'partner-5': { name: '孙八', avatar: '' }
}

// 计算属性
const daysRemaining = computed(() => {
  const targetDate = new Date(props.goal.targetDate)
  const today = new Date()
  const diffTime = targetDate.getTime() - today.getTime()
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  return diffDays
})

// 方法
const formatDate = (dateString: string) => {
  const date = new Date(dateString)
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

const getStatusType = (progress: number) => {
  if (progress >= 100) return 'success'
  if (progress >= 80) return 'warning'
  if (progress >= 50) return 'primary'
  return 'info'
}

const getStatusText = (progress: number) => {
  if (progress >= 100) return '已完成'
  if (progress >= 80) return '即将完成'
  if (progress >= 50) return '进行中'
  return '刚开始'
}

const getProgressColor = (progress: number) => {
  if (progress >= 100) return '#67c23a'
  if (progress >= 80) return '#e6a23c'
  if (progress >= 50) return '#409eff'
  return '#909399'
}

const getPartnerName = (partnerId: string) => {
  return partnersData[partnerId]?.name || '未知'
}

const getPartnerAvatar = (partnerId: string) => {
  return partnersData[partnerId]?.avatar || ''
}

const formatTooltip = (value: number) => {
  return `${value}%`
}

const handleCommand = (command: string) => {
  switch (command) {
    case 'edit':
      editGoal()
      break
    case 'update-progress':
      updateProgressDialog()
      break
    case 'find-partners':
      emit('findPartners', props.goal)
      break
    case 'view-history':
      viewHistory()
      break
    case 'delete':
      deleteGoal()
      break
  }
}

const editGoal = () => {
  // 编辑目标逻辑
  ElMessage.info('编辑目标功能开发中...')
}

const updateProgressDialog = () => {
  updateProgress.value = props.goal.progress
  showUpdateDialog.value = true
}

const updateMilestoneProgress = () => {
  const completedCount = props.goal.milestones.filter(m => m.completed).length
  const totalCount = props.goal.milestones.length
  updateProgress.value = Math.round((completedCount / totalCount) * 100)
}

const confirmUpdate = () => {
  const updatedGoal = {
    ...props.goal,
    progress: updateProgress.value,
    lastUpdated: new Date().toISOString()
  }
  
  emit('update', updatedGoal)
  showUpdateDialog.value = false
  
  // 重置表单
  progressNote.value = ''
  evidenceFiles.value = []
  evidenceNote.value = ''
  selfAssessmentScore.value = 3
  assessmentNote.value = ''
}

const viewHistory = () => {
  // 查看历史逻辑
  ElMessage.info('查看历史功能开发中...')
}

const deleteGoal = () => {
  ElMessageBox.confirm(
    '确定要删除这个目标吗？删除后无法恢复。',
    '确认删除',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(() => {
    emit('delete', props.goal.id)
  }).catch(() => {
    // 用户取消删除
  })
}
</script>

<style scoped>
.goal-item {
  background: white;
  border: 1px solid #e4e7ed;
  border-radius: 8px;
  padding: 20px;
  transition: all 0.3s;
}

.goal-item:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.goal-item.completed {
  background: linear-gradient(135deg, #f0f9ff, #e6f7ff);
  border-color: #67c23a;
}

.goal-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 16px;
}

.goal-title h4 {
  margin: 0 0 8px 0;
  font-size: 18px;
  font-weight: 600;
  color: #303133;
}

.goal-meta {
  display: flex;
  align-items: center;
  gap: 12px;
}

.goal-date {
  font-size: 14px;
  color: #909399;
}

.goal-description {
  margin-bottom: 16px;
}

.goal-description p {
  margin: 0;
  font-size: 14px;
  color: #606266;
  line-height: 1.6;
}

.goal-progress {
  margin-bottom: 16px;
}

.progress-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.progress-label {
  font-size: 14px;
  color: #606266;
}

.progress-value {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}

/* 里程碑样式 */
.milestones {
  margin-bottom: 16px;
}

.milestones h5 {
  margin: 0 0 12px 0;
  font-size: 14px;
  color: #303133;
}

.milestone-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.milestone-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 0;
}

.milestone-item.completed {
  opacity: 0.7;
}

.milestone-indicator {
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.milestone-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #c0c4cc;
}

.milestone-content {
  flex: 1;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.milestone-title {
  font-size: 14px;
  color: #303133;
}

.milestone-date {
  font-size: 12px;
  color: #909399;
}

/* 成长伙伴样式 */
.partners {
  margin-bottom: 16px;
}

.partners h5 {
  margin: 0 0 12px 0;
  font-size: 14px;
  color: #303133;
}

.partner-list {
  display: flex;
  align-items: center;
  gap: 12px;
}

.partner-avatars {
  display: flex;
  align-items: center;
  position: relative;
}

.partner-avatar {
  border: 2px solid white;
  position: relative;
  z-index: 1;
}

.partner-avatar:hover {
  z-index: 10;
  transform: scale(1.1);
  transition: all 0.2s;
}

.more-partners {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: #f0f2f5;
  color: #606266;
  font-size: 12px;
  font-weight: 500;
  margin-left: -8px;
  border: 2px solid white;
}

.no-partners {
  text-align: center;
  padding: 16px;
  background: #f8f9fa;
  border-radius: 6px;
}

/* 更新进度对话框样式 */
.update-content {
  padding: 20px 0;
}

.milestone-checklist {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.milestone-check {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
  border-bottom: 1px solid #f0f2f5;
}

.milestone-check:last-child {
  border-bottom: none;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .goal-header {
    flex-direction: column;
    gap: 12px;
  }
  
  .goal-meta {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }
  
  .milestone-content {
    flex-direction: column;
    align-items: flex-start;
    gap: 4px;
  }
  
  .partner-list {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }
}
</style> 