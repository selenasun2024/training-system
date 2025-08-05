<template>
  <div class="mentorship-execution-panel">
    <!-- Tab导航 -->
    <el-tabs v-model="activeTab" @tab-click="handleTabClick" class="execution-tabs">
      <el-tab-pane label="计划管理" name="plan-management">
        <template #label>
          <div class="tab-label">
            <el-icon><Document /></el-icon>
            <span>计划管理</span>
            <el-badge 
              v-if="activePlansCount > 0" 
              :value="activePlansCount" 
              type="primary"
              class="tab-badge"
            />
          </div>
        </template>
        <PlanManagementTab 
          :plans="mentorshipPlans"
          :students="students"
          :loading="loading"
          @plan-created="handlePlanCreated"
          @plan-updated="handlePlanUpdated"
          @plan-activated="handlePlanActivated"
        />
      </el-tab-pane>

      <el-tab-pane label="任务分配" name="task-assignment">
        <template #label>
          <div class="tab-label">
            <el-icon><List /></el-icon>
            <span>任务分配</span>
            <el-badge 
              v-if="pendingTasksCount > 0" 
              :value="pendingTasksCount" 
              type="warning"
              class="tab-badge"
            />
          </div>
        </template>
        <TaskAssignmentTab 
          :plans="mentorshipPlans"
          :students="students"
          :loading="loading"
          @task-created="handleTaskCreated"
          @task-updated="handleTaskUpdated"
          @task-completed="handleTaskCompleted"
        />
      </el-tab-pane>

      <el-tab-pane label="阶段评价" name="stage-evaluation">
        <template #label>
          <div class="tab-label">
            <el-icon><Star /></el-icon>
            <span>阶段评价</span>
            <el-badge 
              v-if="pendingEvaluationsCount > 0" 
              :value="pendingEvaluationsCount" 
              type="danger"
              class="tab-badge"
            />
          </div>
        </template>
        <StageEvaluationTab 
          :evaluations="evaluations"
          :students="students"
          :loading="loading"
          @evaluation-submitted="handleEvaluationSubmitted"
          @evaluation-scheduled="handleEvaluationScheduled"
          @report-generated="handleReportGenerated"
        />
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, inject, onMounted, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { Document, List, Star } from '@element-plus/icons-vue'

// 导入子组件
import PlanManagementTab from './mentorship-execution/PlanManagementTab.vue'
import TaskAssignmentTab from './mentorship-execution/TaskAssignmentTab.vue'
import StageEvaluationTab from './mentorship-execution/StageEvaluationTab.vue'

// 导入状态管理
import { useMentorWorkbenchStore } from '@/stores/mentorWorkbench'
import type { StudentInfo, MentorshipPlan, Evaluation } from '@/stores/mentorWorkbench'

// Props
interface Props {
  mentorId: string
}

const props = defineProps<Props>()

// Emits
const emit = defineEmits<{
  'student-selected': [studentId: string]
  'evaluation-created': [evaluationId: string]
  'communication-added': [recordId: string]
}>()

// 状态管理
const mentorStore = useMentorWorkbenchStore()

// 响应式数据
const activeTab = ref('plan-management')
const loading = ref(false)

// 注入的方法
const refreshStats = inject('refreshStats') as (() => Promise<void>) | undefined

// 计算属性
const students = computed(() => mentorStore.myStudents)
const mentorshipPlans = computed(() => mentorStore.activePlans)
const evaluations = computed(() => mentorStore.pendingEvaluations)

const activePlansCount = computed(() => 
  mentorshipPlans.value.filter(p => p.status === 'active').length
)

const pendingTasksCount = computed(() => {
  // 统计所有计划中的待完成任务数量
  return mentorshipPlans.value.reduce((total, plan) => {
    return total + plan.phases.reduce((phaseTotal, phase) => {
      return phaseTotal + phase.tasks.filter(task => 
        task.status === 'not_started' || task.status === 'in_progress'
      ).length
    }, 0)
  }, 0)
})

const pendingEvaluationsCount = computed(() => 
  evaluations.value.filter(e => e.status === 'pending').length
)

// 方法
const handleTabClick = (tab: any) => {
  activeTab.value = tab.name
  console.log('🔄 切换到Tab:', tab.name)
}

// 计划管理相关方法
const handlePlanCreated = async (planData: any) => {
  try {
    console.log('📋 创建带教计划:', planData)
    ElMessage.success('带教计划创建成功')
    
    // 刷新统计数据
    if (refreshStats) {
      await refreshStats()
    }
  } catch (error) {
    console.error('❌ 创建带教计划失败:', error)
    ElMessage.error('创建带教计划失败')
  }
}

const handlePlanUpdated = async (planId: string, updateData: any) => {
  try {
    console.log('📝 更新带教计划:', planId, updateData)
    ElMessage.success('带教计划更新成功')
    
    // 刷新数据
    if (refreshStats) {
      await refreshStats()
    }
  } catch (error) {
    console.error('❌ 更新带教计划失败:', error)
    ElMessage.error('更新带教计划失败')
  }
}

const handlePlanActivated = async (planId: string) => {
  try {
    console.log('▶️ 激活带教计划:', planId)
    ElMessage.success('带教计划已激活')
    
    // 刷新数据
    if (refreshStats) {
      await refreshStats()
    }
  } catch (error) {
    console.error('❌ 激活带教计划失败:', error)
    ElMessage.error('激活带教计划失败')
  }
}

// 任务分配相关方法
const handleTaskCreated = async (taskData: any) => {
  try {
    console.log('📝 创建学习任务:', taskData)
    ElMessage.success('学习任务创建成功')
    
    // 刷新数据
    if (refreshStats) {
      await refreshStats()
    }
  } catch (error) {
    console.error('❌ 创建学习任务失败:', error)
    ElMessage.error('创建学习任务失败')
  }
}

const handleTaskUpdated = async (taskId: string, updateData: any) => {
  try {
    console.log('📝 更新学习任务:', taskId, updateData)
    ElMessage.success('学习任务更新成功')
    
    // 刷新数据
    if (refreshStats) {
      await refreshStats()
    }
  } catch (error) {
    console.error('❌ 更新学习任务失败:', error)
    ElMessage.error('更新学习任务失败')
  }
}

const handleTaskCompleted = async (taskId: string) => {
  try {
    console.log('✅ 任务完成:', taskId)
    ElMessage.success('任务标记为完成')
    
    // 检查是否达成里程碑
    // TODO: 实现里程碑检查逻辑
    
    // 刷新数据
    if (refreshStats) {
      await refreshStats()
    }
  } catch (error) {
    console.error('❌ 更新任务状态失败:', error)
    ElMessage.error('更新任务状态失败')
  }
}

// 阶段评价相关方法
const handleEvaluationSubmitted = async (evaluationId: string, evaluationData: any) => {
  try {
    await mentorStore.updateEvaluationStatus(evaluationId, 'completed')
    ElMessage.success('评价提交成功')
    
    emit('evaluation-created', evaluationId)
    
    // 刷新数据
    if (refreshStats) {
      await refreshStats()
    }
  } catch (error) {
    console.error('❌ 提交评价失败:', error)
    ElMessage.error('提交评价失败')
  }
}

const handleEvaluationScheduled = async (studentId: string, evaluationType: string, dueDate: string) => {
  try {
    console.log('📅 安排评价:', studentId, evaluationType, dueDate)
    ElMessage.success('评价安排成功')
    
    // 刷新数据
    if (refreshStats) {
      await refreshStats()
    }
  } catch (error) {
    console.error('❌ 安排评价失败:', error)
    ElMessage.error('安排评价失败')
  }
}

const handleReportGenerated = async (evaluationId: string, reportData: any) => {
  try {
    console.log('📊 生成评价报告:', evaluationId, reportData)
    ElMessage.success('评价报告生成成功')
  } catch (error) {
    console.error('❌ 生成评价报告失败:', error)
    ElMessage.error('生成评价报告失败')
  }
}

// 初始化
const initializePanel = async () => {
  loading.value = true
  try {
    console.log('🎯 带教执行面板初始化完成')
  } catch (error) {
    console.error('❌ 带教执行面板初始化失败:', error)
  } finally {
    loading.value = false
  }
}

// 监听器
watch(() => props.mentorId, async (newMentorId) => {
  if (newMentorId) {
    await initializePanel()
  }
}, { immediate: true })

// 生命周期
onMounted(() => {
  initializePanel()
})
</script>

<style scoped>
.mentorship-execution-panel {
  height: 100%;
  padding: 20px;
}

.execution-tabs {
  height: 100%;
}

.execution-tabs :deep(.el-tabs__content) {
  height: calc(100% - 60px);
  overflow: hidden;
}

.execution-tabs :deep(.el-tab-pane) {
  height: 100%;
  overflow-y: auto;
}

.tab-label {
  display: flex;
  align-items: center;
  gap: 6px;
  position: relative;
}

.tab-badge {
  margin-left: 4px;
}

.tab-badge :deep(.el-badge__content) {
  font-size: 10px;
  height: 16px;
  line-height: 16px;
  padding: 0 4px;
  min-width: 16px;
}

/* Tab样式优化 */
.execution-tabs :deep(.el-tabs__header) {
  margin-bottom: 16px;
  border-bottom: 2px solid #e4e7ed;
}

.execution-tabs :deep(.el-tabs__nav-wrap) {
  padding: 0 8px;
}

.execution-tabs :deep(.el-tabs__item) {
  height: 50px;
  line-height: 50px;
  font-size: 16px;
  font-weight: 500;
  color: #606266;
  padding: 0 20px;
  margin-right: 8px;
  border-radius: 8px 8px 0 0;
  transition: all 0.3s;
}

.execution-tabs :deep(.el-tabs__item:hover) {
  color: #409eff;
  background-color: #f0f9ff;
}

.execution-tabs :deep(.el-tabs__item.is-active) {
  color: #409eff;
  background-color: #ffffff;
  border: 1px solid #e4e7ed;
  border-bottom: 1px solid #ffffff;
  margin-bottom: -1px;
}

.execution-tabs :deep(.el-tabs__active-bar) {
  display: none;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .mentorship-execution-panel {
    padding: 12px;
  }
  
  .execution-tabs :deep(.el-tabs__item) {
    padding: 0 12px;
    font-size: 14px;
  }
  
  .tab-label span {
    display: none;
  }
  
  .tab-badge {
    margin-left: 2px;
  }
}

@media (max-width: 480px) {
  .execution-tabs :deep(.el-tabs__nav-wrap) {
    padding: 0 4px;
  }
  
  .execution-tabs :deep(.el-tabs__item) {
    padding: 0 8px;
    margin-right: 4px;
  }
}
</style> 