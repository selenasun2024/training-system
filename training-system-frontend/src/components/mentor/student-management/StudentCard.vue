<template>
  <div 
    class="student-card" 
    :class="{ 
      'card-active': student.status === 'active',
      'card-completed': student.status === 'completed',
      'card-warning': isBehindSchedule
    }"
    @click="handleCardClick"
  >
    <!-- 卡片头部 -->
    <div class="card-header">
      <div class="student-avatar">
        <el-avatar :src="student.avatar" :size="50">
          {{ student.name.charAt(0) }}
        </el-avatar>
        <div class="status-indicator" :class="student.status"></div>
      </div>
      
      <div class="student-info">
        <h3 class="student-name">{{ student.name }}</h3>
        <p class="student-id">{{ student.employeeId }}</p>
        <div class="student-tags">
          <el-tag size="small" type="info">{{ student.department }}</el-tag>
          <el-tag size="small" :type="getStatusType(student.status)">
            {{ getStatusLabel(student.status) }}
          </el-tag>
        </div>
      </div>
      
      <div class="card-actions">
        <el-dropdown @command="handleQuickAction">
          <el-button text circle>
            <el-icon><More /></el-icon>
          </el-button>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item command="contact">
                <el-icon><ChatDotSquare /></el-icon>
                快速联系
              </el-dropdown-item>
              <el-dropdown-item command="progress">
                <el-icon><TrendCharts /></el-icon>
                查看进度
              </el-dropdown-item>
              <el-dropdown-item command="plan">
                <el-icon><Document /></el-icon>
                带教计划
              </el-dropdown-item>
              <el-dropdown-item command="evaluation">
                <el-icon><Star /></el-icon>
                评价记录
              </el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </div>
    </div>

    <!-- 岗位和项目信息 -->
    <div class="card-content">
      <div class="position-info">
        <span class="position-title">{{ student.position }}</span>
        <span class="project-name">{{ student.projectName }}</span>
      </div>
      
      <div class="time-info">
        <div class="time-item">
          <span class="time-label">入职时间：</span>
          <span class="time-value">{{ formatDate(student.entryDate) }}</span>
        </div>
        <div class="time-item">
          <span class="time-label">带教开始：</span>
          <span class="time-value">{{ formatDate(student.mentorshipStartDate) }}</span>
        </div>
      </div>
    </div>

    <!-- 进度信息 -->
    <div class="card-progress">
      <div class="progress-header">
        <span class="progress-label">带教进度</span>
        <span class="progress-value">{{ student.progress }}%</span>
      </div>
      
      <el-progress 
        :percentage="student.progress" 
        :color="getProgressColor(student.progress)"
        :stroke-width="8"
        :show-text="false"
      />
      
      <div class="progress-info">
        <span class="current-phase">{{ student.currentPhase }}</span>
        <span class="next-milestone">下个节点：{{ student.nextMilestone }}</span>
      </div>
    </div>

    <!-- 最近沟通 -->
    <div class="card-footer">
      <div class="last-communication">
        <el-icon><Clock /></el-icon>
        <span>最近沟通：{{ formatDate(student.lastCommunication) }}</span>
      </div>
      
      <div class="quick-buttons">
        <el-button 
          size="small" 
          type="primary" 
          @click.stop="handleQuickContact"
        >
          <el-icon><ChatDotSquare /></el-icon>
          沟通
        </el-button>
        <el-button 
          size="small" 
          @click.stop="handleViewProgress"
        >
          <el-icon><TrendCharts /></el-icon>
          进度
        </el-button>
      </div>
    </div>

    <!-- 预警标识 -->
    <div v-if="isBehindSchedule" class="warning-badge">
      <el-icon><Warning /></el-icon>
      <span>进度滞后</span>
    </div>

    <!-- 新消息提示 -->
    <div v-if="hasUnreadMessages" class="unread-badge">
      <el-badge :value="unreadCount" type="danger" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { 
  More, ChatDotSquare, TrendCharts, Document, Star, Clock, Warning 
} from '@element-plus/icons-vue'

// 导入类型
import type { StudentInfo } from '@/stores/mentorWorkbench'

// Props
interface Props {
  student: StudentInfo
}

const props = defineProps<Props>()

// Emits
const emit = defineEmits<{
  'click': [student: StudentInfo]
  'quick-contact': [student: StudentInfo]
  'view-progress': [student: StudentInfo]
}>()

// 计算属性
const isBehindSchedule = computed(() => {
  if (props.student.status !== 'active') return false
  
  const now = new Date()
  const startDate = new Date(props.student.mentorshipStartDate)
  const daysPassed = Math.floor((now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
  const expectedProgress = Math.min((daysPassed / 90) * 100, 100) // 假设90天完整周期
  
  return props.student.progress < expectedProgress - 10
})

const hasUnreadMessages = computed(() => {
  // TODO: 根据实际消息系统实现
  return Math.random() > 0.7 // 模拟30%的学员有未读消息
})

const unreadCount = computed(() => {
  // TODO: 根据实际消息系统实现
  return hasUnreadMessages.value ? Math.floor(Math.random() * 3) + 1 : 0
})

// 方法
const handleCardClick = () => {
  emit('click', props.student)
}

const handleQuickContact = () => {
  emit('quick-contact', props.student)
}

const handleViewProgress = () => {
  emit('view-progress', props.student)
}

const handleQuickAction = (command: string) => {
  switch (command) {
    case 'contact':
      handleQuickContact()
      break
    case 'progress':
      handleViewProgress()
      break
    case 'plan':
      console.log('查看带教计划:', props.student.name)
      break
    case 'evaluation':
      console.log('查看评价记录:', props.student.name)
      break
  }
}

// 辅助方法
const getStatusType = (status: string) => {
  const typeMap = {
    active: 'success',
    completed: 'info',
    paused: 'warning',
    terminated: 'danger'
  }
  return typeMap[status as keyof typeof typeMap] || 'info'
}

const getStatusLabel = (status: string) => {
  const labelMap = {
    active: '进行中',
    completed: '已完成',
    paused: '已暂停',
    terminated: '已终止'
  }
  return labelMap[status as keyof typeof labelMap] || status
}

const getProgressColor = (progress: number) => {
  if (progress < 30) return '#f56c6c'
  if (progress < 60) return '#e6a23c'
  if (progress < 90) return '#409eff'
  return '#67c23a'
}

const formatDate = (dateString: string) => {
  const date = new Date(dateString)
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  })
}
</script>

<style scoped>
.student-card {
  background: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
  cursor: pointer;
  position: relative;
  border: 2px solid transparent;
}

.student-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
}

.student-card.card-active {
  border-color: #67c23a;
}

.student-card.card-completed {
  border-color: #909399;
  opacity: 0.8;
}

.student-card.card-warning {
  border-color: #e6a23c;
  background: linear-gradient(135deg, #fff7e6 0%, #ffffff 100%);
}

/* 卡片头部 */
.card-header {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  margin-bottom: 16px;
}

.student-avatar {
  position: relative;
  flex-shrink: 0;
}

.status-indicator {
  position: absolute;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  border: 2px solid white;
  bottom: 2px;
  right: 2px;
}

.status-indicator.active {
  background-color: #67c23a;
}

.status-indicator.completed {
  background-color: #909399;
}

.status-indicator.paused {
  background-color: #e6a23c;
}

.status-indicator.terminated {
  background-color: #f56c6c;
}

.student-info {
  flex: 1;
  min-width: 0;
}

.student-name {
  margin: 0 0 4px 0;
  font-size: 16px;
  font-weight: 600;
  color: #303133;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.student-id {
  margin: 0 0 8px 0;
  font-size: 12px;
  color: #909399;
}

.student-tags {
  display: flex;
  gap: 4px;
  flex-wrap: wrap;
}

.card-actions {
  flex-shrink: 0;
}

/* 卡片内容 */
.card-content {
  margin-bottom: 16px;
}

.position-info {
  margin-bottom: 12px;
}

.position-title {
  display: block;
  font-size: 14px;
  font-weight: 500;
  color: #303133;
  margin-bottom: 4px;
}

.project-name {
  font-size: 12px;
  color: #606266;
}

.time-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.time-item {
  display: flex;
  font-size: 12px;
}

.time-label {
  color: #909399;
  width: 70px;
  flex-shrink: 0;
}

.time-value {
  color: #606266;
}

/* 进度信息 */
.card-progress {
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
  font-weight: 500;
  color: #303133;
}

.progress-value {
  font-size: 14px;
  font-weight: 600;
  color: #409eff;
}

.progress-info {
  display: flex;
  justify-content: space-between;
  margin-top: 8px;
  font-size: 12px;
}

.current-phase {
  color: #606266;
  font-weight: 500;
}

.next-milestone {
  color: #909399;
}

/* 卡片底部 */
.card-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 12px;
  border-top: 1px solid #f0f2f5;
}

.last-communication {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: #909399;
  flex: 1;
  min-width: 0;
}

.last-communication span {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.quick-buttons {
  display: flex;
  gap: 8px;
  flex-shrink: 0;
}

/* 预警标识 */
.warning-badge {
  position: absolute;
  top: -2px;
  right: -2px;
  background: linear-gradient(135deg, #e6a23c, #f56c6c);
  color: white;
  padding: 4px 8px;
  border-radius: 0 10px 0 10px;
  font-size: 10px;
  display: flex;
  align-items: center;
  gap: 2px;
  font-weight: 500;
}

/* 未读消息标识 */
.unread-badge {
  position: absolute;
  top: 8px;
  right: 8px;
}

/* 响应式设计 */
@media (max-width: 480px) {
  .student-card {
    padding: 16px;
  }
  
  .card-header {
    flex-direction: column;
    align-items: stretch;
    gap: 8px;
  }
  
  .student-info {
    text-align: center;
  }
  
  .card-actions {
    align-self: center;
  }
  
  .card-footer {
    flex-direction: column;
    gap: 8px;
    align-items: stretch;
  }
  
  .quick-buttons {
    justify-content: center;
  }
  
  .progress-info {
    flex-direction: column;
    gap: 4px;
  }
}

/* 动画效果 */
@keyframes cardEnter {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.student-card {
  animation: cardEnter 0.3s ease-out;
}

/* 深色模式支持 */
@media (prefers-color-scheme: dark) {
  .student-card {
    background: #1e1e1e;
    border-color: #3c3c3c;
  }
  
  .student-name {
    color: #e0e0e0;
  }
  
  .position-title {
    color: #d0d0d0;
  }
  
  .card-footer {
    border-top-color: #3c3c3c;
  }
}
</style> 