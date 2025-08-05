<template>
  <div class="mentor-workbench">
    <!-- 顶部数据概览条 -->
    <div class="workbench-header">
      <div class="overview-stats">
        <div class="stat-item">
          <el-icon class="stat-icon"><User /></el-icon>
          <div class="stat-content">
            <div class="stat-number">{{ mentorStats.activeStudents }}</div>
            <div class="stat-label">带教学员</div>
          </div>
        </div>
        <div class="stat-item">
          <el-icon class="stat-icon"><TrendCharts /></el-icon>
          <div class="stat-content">
            <div class="stat-number">{{ mentorStats.averageProgress }}%</div>
            <div class="stat-label">平均进度</div>
          </div>
        </div>
        <div class="stat-item">
          <el-icon class="stat-icon"><Document /></el-icon>
          <div class="stat-content">
            <div class="stat-number">{{ mentorStats.pendingEvaluations }}</div>
            <div class="stat-label">待评价</div>
          </div>
        </div>
        <div class="stat-item">
          <el-icon class="stat-icon"><ChatDotSquare /></el-icon>
          <div class="stat-content">
            <div class="stat-number">{{ mentorStats.recentCommunications }}</div>
            <div class="stat-label">本周沟通</div>
          </div>
        </div>
      </div>
      
      <!-- 快捷操作按钮 -->
      <div class="quick-actions">
        <el-button type="primary" @click="addCommunicationRecord">
          <el-icon><Plus /></el-icon>
          记录沟通
        </el-button>
        <el-button @click="scheduleEvaluation">
          <el-icon><Calendar /></el-icon>
          安排评价
        </el-button>
        <el-button @click="viewAllStudents">
          <el-icon><View /></el-icon>
          查看学员
        </el-button>
      </div>
    </div>

    <!-- 主要内容区 -->
    <div class="workbench-content">
      <!-- 左侧菜单 -->
      <div class="sidebar">
        <el-menu 
          :default-active="activeMenu" 
          @select="handleMenuSelect"
          class="mentor-menu"
        >
          <el-menu-item index="student-management">
            <el-icon><User /></el-icon>
            <span>学员管理</span>
          </el-menu-item>
          <el-menu-item index="mentorship-execution">
            <el-icon><Aim /></el-icon>
            <span>带教执行</span>
          </el-menu-item>
          <el-menu-item index="resource-tools">
            <el-icon><Tools /></el-icon>
            <span>资源工具</span>
          </el-menu-item>
        </el-menu>
      </div>

      <!-- 主内容区 -->
      <div class="main-content">
        <component 
          :is="currentComponent" 
          :mentor-id="currentMentorId"
          @student-selected="handleStudentSelected"
          @evaluation-created="handleEvaluationCreated"
          @communication-added="handleCommunicationAdded"
        />
      </div>
    </div>

    <!-- 浮动操作按钮 (移动端) -->
    <div class="fab-container" v-if="isMobile">
      <el-button 
        type="primary" 
        circle 
        size="large" 
        class="fab-button"
        @click="showQuickActions = true"
      >
        <el-icon><Plus /></el-icon>
      </el-button>
    </div>

    <!-- 快捷操作抽屉 (移动端) -->
    <el-drawer
      v-model="showQuickActions"
      title="快捷操作"
      direction="btt"
      size="30%"
    >
      <div class="quick-actions-drawer">
        <el-button 
          v-for="action in quickActionList"
          :key="action.key"
          :type="action.type"
          block
          @click="handleQuickAction(action.key)"
        >
          <el-icon :class="action.icon" />
          {{ action.label }}
        </el-button>
      </div>
    </el-drawer>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, provide } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { 
  User, TrendCharts, Document, ChatDotSquare, Plus, Calendar, View, Aim, Tools 
} from '@element-plus/icons-vue'

// 导入子组件
import StudentManagementPanel from './components/mentor/StudentManagementPanel.vue'
import MentorshipExecutionPanel from './components/mentor/MentorshipExecutionPanel.vue'
import ResourceToolsPanel from './components/mentor/ResourceToolsPanel.vue'

// 导入状态管理
import { useMentorWorkbenchStore } from '@/stores/mentorWorkbench'
import { useUserStore } from '@/stores/user'

// 响应式数据
const route = useRoute()
const router = useRouter()
const mentorStore = useMentorWorkbenchStore()
const userStore = useUserStore()

const activeMenu = ref('student-management')
const showQuickActions = ref(false)
const currentMentorId = ref('')

// 计算属性
const isMobile = computed(() => {
  return window.innerWidth < 768
})

const currentComponent = computed(() => {
  const componentMap = {
    'student-management': StudentManagementPanel,
    'mentorship-execution': MentorshipExecutionPanel,
    'resource-tools': ResourceToolsPanel,
  }
  return componentMap[activeMenu.value as keyof typeof componentMap] || StudentManagementPanel
})

const mentorStats = computed(() => ({
  activeStudents: mentorStore.activeStudentCount,
  averageProgress: mentorStore.averageProgress,
  pendingEvaluations: mentorStore.pendingEvaluations.length,
  recentCommunications: mentorStore.recentCommunications.length,
}))

const quickActionList = computed(() => [
  {
    key: 'add-communication',
    label: '记录沟通',
    icon: 'ChatDotSquare',
    type: 'primary'
  },
  {
    key: 'schedule-evaluation',
    label: '安排评价',
    icon: 'Calendar',
    type: 'success'
  },
  {
    key: 'create-task',
    label: '创建任务',
    icon: 'Plus',
    type: 'warning'
  },
  {
    key: 'view-progress',
    label: '查看进度',
    icon: 'TrendCharts',
    type: 'info'
  }
])

// 方法
const handleMenuSelect = (index: string) => {
  activeMenu.value = index
  
  // 更新路由但不刷新页面
  const newPath = `/training-management/workbench/mentor?tab=${index}`
  if (route.fullPath !== newPath) {
    router.replace(newPath)
  }
}

const handleStudentSelected = (studentId: string) => {
  // 跳转到学员详情
  router.push(`/training-management/workbench/mentor/student/${studentId}`)
}

const handleEvaluationCreated = (evaluationId: string) => {
  ElMessage.success('评价创建成功')
  // 刷新待评价数据
  mentorStore.refreshPendingEvaluations()
}

const handleCommunicationAdded = (recordId: string) => {
  ElMessage.success('沟通记录添加成功')
  // 刷新沟通记录数据
  mentorStore.refreshCommunicationRecords()
}

const addCommunicationRecord = () => {
  // 跳转到沟通记录页面或打开对话框
  activeMenu.value = 'student-management'
  // 触发子组件的添加沟通记录功能
}

const scheduleEvaluation = () => {
  // 跳转到评价管理页面
  activeMenu.value = 'mentorship-execution'
}

const viewAllStudents = () => {
  // 跳转到学员管理页面
  activeMenu.value = 'student-management'
}

const handleQuickAction = (actionKey: string) => {
  showQuickActions.value = false
  
  switch (actionKey) {
    case 'add-communication':
      addCommunicationRecord()
      break
    case 'schedule-evaluation':
      scheduleEvaluation()
      break
    case 'create-task':
      activeMenu.value = 'mentorship-execution'
      break
    case 'view-progress':
      activeMenu.value = 'student-management'
      break
  }
}

// 初始化
const initializeWorkbench = async () => {
  try {
    // 获取当前导师信息
    currentMentorId.value = userStore.userId || 'user-mentor-001'
    
    // 从路由参数初始化活动菜单
    const tabParam = route.query.tab as string
    if (tabParam && ['student-management', 'mentorship-execution', 'resource-tools'].includes(tabParam)) {
      activeMenu.value = tabParam
    }
    
    // 初始化导师工作台数据
    await mentorStore.initializeMentorData(currentMentorId.value)
    
    console.log('🎯 带教老师工作台初始化完成')
  } catch (error) {
    console.error('❌ 工作台初始化失败:', error)
    ElMessage.error('工作台初始化失败，请刷新页面重试')
  }
}

// 提供给子组件的数据和方法
provide('mentorId', currentMentorId)
provide('refreshStats', mentorStore.refreshMentorStats)

// 生命周期
onMounted(() => {
  initializeWorkbench()
})
</script>

<style scoped>
.mentor-workbench {
  min-height: 100vh;
  background-color: #f5f7fa;
}

/* 顶部概览区 */
.workbench-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  background: white;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  margin-bottom: 16px;
}

.overview-stats {
  display: flex;
  gap: 32px;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 12px;
}

.stat-icon {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
}

.stat-content {
  display: flex;
  flex-direction: column;
}

.stat-number {
  font-size: 24px;
  font-weight: 600;
  color: #303133;
  line-height: 1;
}

.stat-label {
  font-size: 12px;
  color: #909399;
  margin-top: 2px;
}

.quick-actions {
  display: flex;
  gap: 12px;
}

/* 主内容区 */
.workbench-content {
  display: flex;
  gap: 16px;
  padding: 0 24px;
}

.sidebar {
  width: 240px;
  background: white;
  border-radius: 8px;
  padding: 8px 0;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  height: fit-content;
}

.mentor-menu {
  border: none;
}

.mentor-menu .el-menu-item {
  height: 50px;
  line-height: 50px;
  margin: 4px 12px;
  border-radius: 6px;
  transition: all 0.3s;
}

.mentor-menu .el-menu-item:hover {
  background-color: #f0f2f5;
}

.mentor-menu .el-menu-item.is-active {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.mentor-menu .el-menu-item.is-active .el-icon {
  color: white;
}

.main-content {
  flex: 1;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  min-height: 600px;
}

/* 移动端浮动按钮 */
.fab-container {
  position: fixed;
  right: 20px;
  bottom: 20px;
  z-index: 1000;
}

.fab-button {
  width: 56px;
  height: 56px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.quick-actions-drawer {
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .workbench-header {
    flex-direction: column;
    gap: 16px;
    padding: 16px;
  }
  
  .overview-stats {
    flex-wrap: wrap;
    gap: 16px;
    justify-content: center;
  }
  
  .workbench-content {
    flex-direction: column;
    padding: 0 16px;
  }
  
  .sidebar {
    width: 100%;
    margin-bottom: 16px;
  }
  
  .mentor-menu {
    display: flex;
    overflow-x: auto;
  }
  
  .mentor-menu .el-menu-item {
    white-space: nowrap;
    flex-shrink: 0;
  }
}

@media (max-width: 480px) {
  .overview-stats {
    grid-template-columns: 1fr 1fr;
  }
  
  .stat-number {
    font-size: 20px;
  }
  
  .quick-actions {
    flex-wrap: wrap;
    justify-content: center;
  }
}
</style> 