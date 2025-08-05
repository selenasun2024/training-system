<template>
  <div class="personal-center">
    <!-- 页面头部 -->
    <div class="page-header">
      <div class="user-greeting">
        <el-avatar :size="60" :src="personalStore.userProfile?.avatar" />
        <div class="greeting-text">
          <h2>{{ getGreeting() }}，{{ personalStore.userProfile?.name }}</h2>
          <p class="position-info">{{ personalStore.userProfile?.position }} · {{ personalStore.userProfile?.department }}</p>
        </div>
      </div>
      <div class="header-stats">
        <div class="stat-item">
          <span class="stat-number">{{ personalStore.urgentItems.length }}</span>
          <span class="stat-label">待办事项</span>
        </div>
        <div class="stat-item">
          <span class="stat-number">{{ personalStore.todaySchedule.length }}</span>
          <span class="stat-label">今日安排</span>
        </div>
        <div class="stat-item">
          <span class="stat-number">{{ Math.round(personalStore.completionRate) }}%</span>
          <span class="stat-label">完成率</span>
        </div>
      </div>
    </div>

    <!-- 主要内容区域 -->
    <div class="main-content">
      <!-- 快捷功能区 -->
      <div class="quick-functions-section">
        <h3 class="section-title">快捷功能</h3>
        <div class="quick-grid">
          <QuickFunctionCard
            v-for="func in quickFunctions"
            :key="func.id"
            :icon="func.icon"
            :title="func.title"
            :count="func.count"
            :route="func.route"
            :color="func.color"
          />
        </div>
      </div>

      <!-- 成长概览区 -->
      <div class="growth-overview-section">
        <h3 class="section-title">成长概览</h3>
        <div class="overview-grid">
          <div class="overview-card training-progress">
            <div class="card-header">
              <h4>培训进度</h4>
              <el-button type="text" @click="navigateToTrainingDetail">查看详情</el-button>
            </div>
            <div class="progress-list">
              <div 
                v-for="progress in personalStore.trainingProgress" 
                :key="progress.projectId"
                class="progress-item"
              >
                <div class="progress-info">
                  <span class="project-name">{{ progress.projectName }}</span>
                  <span class="phase-info">{{ progress.currentPhase }}</span>
                </div>
                <el-progress 
                  :percentage="progress.progress" 
                  :color="getProgressColor(progress.progress)"
                  :show-text="false"
                />
                <span class="progress-text">{{ progress.progress }}%</span>
              </div>
            </div>
          </div>

          <div class="overview-card mentorship-status">
            <div class="card-header">
              <h4>带教关系</h4>
              <el-button type="text" @click="navigateToMentorshipDetail">管理</el-button>
            </div>
            <div class="mentorship-info">
              <div v-if="personalStore.mentorshipStatus?.hasMentor" class="mentor-info">
                <el-avatar :size="40" :src="personalStore.mentorshipStatus.mentor?.avatar" />
                <div class="mentor-details">
                  <p class="mentor-name">导师：{{ personalStore.mentorshipStatus.mentor?.name }}</p>
                  <p class="mentor-dept">{{ personalStore.mentorshipStatus.mentor?.department }}</p>
                </div>
              </div>
              <div v-if="personalStore.mentorshipStatus?.hasStudents" class="students-info">
                <p class="students-count">指导学员：{{ personalStore.mentorshipStatus.students?.length }}人</p>
                <div class="students-avatars">
                  <el-avatar
                    v-for="student in personalStore.mentorshipStatus.students?.slice(0, 3)"
                    :key="student.id"
                    :size="30"
                    :src="student.avatar"
                  />
                  <span 
                    v-if="personalStore.mentorshipStatus.students && personalStore.mentorshipStatus.students.length > 3"
                    class="more-count"
                  >
                    +{{ personalStore.mentorshipStatus.students.length - 3 }}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div class="overview-card recent-goals">
            <div class="card-header">
              <h4>近期目标</h4>
              <el-button type="text" @click="navigateToGoalsDetail">设置目标</el-button>
            </div>
            <div class="goals-list">
              <div 
                v-for="goal in personalStore.currentGoals.slice(0, 3)" 
                :key="goal.id"
                class="goal-item"
              >
                <div class="goal-info">
                  <span class="goal-title">{{ goal.title }}</span>
                  <span class="goal-target">目标：{{ formatDate(goal.targetDate) }}</span>
                </div>
                <el-progress 
                  :percentage="goal.progress" 
                  :show-text="false"
                  size="small"
                />
              </div>
            </div>
          </div>

          <div class="overview-card todo-reminders">
            <div class="card-header">
              <h4>待办提醒</h4>
              <el-button type="text" @click="navigateToTodoDetail">全部待办</el-button>
            </div>
            <div class="todo-list">
              <div 
                v-for="todo in personalStore.thisWeekTodos.slice(0, 5)" 
                :key="todo.id"
                class="todo-item"
                :class="{ 'urgent': todo.isUrgent }"
              >
                <el-checkbox v-model="todo.completed" @change="updateTodoStatus(todo)" />
                <span class="todo-title">{{ todo.title }}</span>
                <span class="todo-due">{{ formatDate(todo.dueDate) }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 智能导航区 -->
      <div class="smart-navigation-section">
        <h3 class="section-title">智能导航</h3>
        <div class="navigation-grid">
          <NavigationCard
            v-for="nav in personalStore.personalizedNavigation"
            :key="nav.id"
            :title="nav.title"
            :description="nav.description"
            :icon="nav.icon"
            :route="nav.route"
            :badge="nav.badge"
            :color="nav.color"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { usePersonalCenterStore } from '@/stores/personalCenter'
import QuickFunctionCard from '@/modules/personal/components/QuickFunctionCard.vue'
import NavigationCard from '@/modules/personal/components/NavigationCard.vue'

const router = useRouter()
const personalStore = usePersonalCenterStore()

// 快捷功能配置
const quickFunctions = computed(() => [
  {
    id: 'my-tasks',
    title: '我的作业',
    icon: 'Document',
    count: personalStore.tasks.filter(t => t.status === 'pending').length,
    route: '/training-management/personal-center/tasks',
    color: '#409EFF'
  },
  {
    id: 'my-schedule',
    title: '我的课表',
    icon: 'Calendar',
    count: personalStore.todaySchedule.length,
    route: '/training-management/personal-center/schedule',
    color: '#67C23A'
  },
  {
    id: 'my-achievements',
    title: '我的成绩',
    icon: 'TrophyBase',
    count: personalStore.achievements.length,
    route: '/personal/achievements',
    color: '#E6A23C'
  },
  {
    id: 'learning-resources',
    title: '学习资源',
    icon: 'Reading',
    count: 0,
    route: '/learning/resources',
    color: '#F56C6C'
  }
])

// 生命周期
onMounted(async () => {
  await personalStore.loadUserProfile()
  await personalStore.loadTasks()
  await personalStore.loadSchedule()
  await personalStore.loadAchievements()
  await personalStore.loadTrainingProgress()
  await personalStore.loadMentorshipStatus()
  await personalStore.loadCurrentGoals()
  await personalStore.loadTodos()
  await personalStore.loadNavigationPreferences()
})

// 方法
function getGreeting() {
  const hour = new Date().getHours()
  if (hour < 12) return '早上好'
  if (hour < 18) return '下午好'
  return '晚上好'
}

function getProgressColor(progress: number) {
  if (progress < 30) return '#F56C6C'
  if (progress < 70) return '#E6A23C'
  return '#67C23A'
}

function formatDate(dateStr: string) {
  const date = new Date(dateStr)
  const today = new Date()
  const diffTime = date.getTime() - today.getTime()
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  
  if (diffDays === 0) return '今天'
  if (diffDays === 1) return '明天'
  if (diffDays === -1) return '昨天'
  if (diffDays > 0) return `${diffDays}天后`
  return `${Math.abs(diffDays)}天前`
}

function updateTodoStatus(todo: any) {
  personalStore.updateTodoStatus(todo.id, todo.completed)
}

function navigateToTrainingDetail() {
  router.push('/growth/training-progress')
}

function navigateToMentorshipDetail() {
  router.push('/training-management/workbench/mentor')
}

function navigateToGoalsDetail() {
  router.push('/growth/goals')
}

function navigateToTodoDetail() {
  router.push('/personal/todos')
}
</script>

<style scoped>
.personal-center {
  padding: 20px;
  max-width: 1400px;
  margin: 0 auto;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
  padding: 24px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 16px;
  color: white;
}

.user-greeting {
  display: flex;
  align-items: center;
  gap: 16px;
}

.greeting-text h2 {
  margin: 0 0 8px 0;
  font-size: 24px;
  font-weight: 600;
}

.position-info {
  margin: 0;
  opacity: 0.9;
  font-size: 14px;
}

.header-stats {
  display: flex;
  gap: 40px;
}

.stat-item {
  text-align: center;
}

.stat-number {
  display: block;
  font-size: 28px;
  font-weight: bold;
  line-height: 1;
}

.stat-label {
  font-size: 14px;
  opacity: 0.9;
}

.main-content {
  display: flex;
  flex-direction: column;
  gap: 30px;
}

.section-title {
  margin: 0 0 20px 0;
  font-size: 20px;
  font-weight: 600;
  color: #303133;
}

.quick-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 20px;
}

.overview-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
  gap: 20px;
}

.overview-card {
  background: white;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  border: 1px solid #ebeef5;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.card-header h4 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}

.progress-item, .goal-item, .todo-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 0;
  border-bottom: 1px solid #f5f5f5;
}

.progress-item:last-child, .goal-item:last-child, .todo-item:last-child {
  border-bottom: none;
}

.progress-info, .goal-info {
  flex: 1;
  min-width: 0;
}

.project-name, .goal-title {
  display: block;
  font-weight: 500;
  color: #303133;
}

.phase-info, .goal-target {
  display: block;
  font-size: 12px;
  color: #909399;
  margin-top: 4px;
}

.progress-text {
  font-size: 14px;
  color: #606266;
  min-width: 40px;
}

.mentorship-info {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.mentor-info, .students-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.mentor-details {
  flex: 1;
}

.mentor-name, .students-count {
  margin: 0 0 4px 0;
  font-weight: 500;
  color: #303133;
}

.mentor-dept {
  margin: 0;
  font-size: 12px;
  color: #909399;
}

.students-avatars {
  display: flex;
  align-items: center;
  gap: 8px;
}

.more-count {
  background: #f5f5f5;
  border-radius: 50%;
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  color: #606266;
}

.todo-item {
  gap: 8px;
}

.todo-item.urgent .todo-title {
  color: #f56c6c;
  font-weight: 500;
}

.todo-title {
  flex: 1;
  font-size: 14px;
  color: #303133;
}

.todo-due {
  font-size: 12px;
  color: #909399;
}

.navigation-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;
}

/* 响应式设计 */
@media (max-width: 1200px) {
  .overview-grid {
    grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
  }
}

@media (max-width: 768px) {
  .personal-center {
    padding: 16px;
  }
  
  .page-header {
    flex-direction: column;
    gap: 20px;
    text-align: center;
  }
  
  .header-stats {
    gap: 20px;
  }
  
  .quick-grid {
    grid-template-columns: 1fr;
  }
  
  .overview-grid {
    grid-template-columns: 1fr;
  }
  
  .navigation-grid {
    grid-template-columns: 1fr;
  }
}
</style> 