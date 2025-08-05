<template>
  <div class="student-management-panel">
    <!-- Tab导航 -->
    <el-tabs v-model="activeTab" @tab-click="handleTabClick" class="management-tabs">
      <el-tab-pane label="学员列表" name="student-list">
        <template #label>
          <div class="tab-label">
            <el-icon><User /></el-icon>
            <span>学员列表</span>
            <el-badge 
              v-if="activeStudentsCount > 0" 
              :value="activeStudentsCount" 
              type="primary" 
              class="tab-badge"
            />
          </div>
        </template>
        <StudentListTab 
          :students="students"
          :loading="loading"
          @student-selected="handleStudentSelected"
          @filter-changed="handleFilterChanged"
        />
      </el-tab-pane>

      <el-tab-pane label="进度跟踪" name="progress-tracking">
        <template #label>
          <div class="tab-label">
            <el-icon><TrendCharts /></el-icon>
            <span>进度跟踪</span>
            <el-badge 
              v-if="overdueStudentsCount > 0" 
              :value="overdueStudentsCount" 
              type="warning"
              class="tab-badge"
            />
          </div>
        </template>
        <ProgressTrackingTab 
          :students="students"
          :loading="loading"
          @progress-updated="handleProgressUpdated"
          @milestone-reached="handleMilestoneReached"
        />
      </el-tab-pane>

      <el-tab-pane label="沟通记录" name="communication-records">
        <template #label>
          <div class="tab-label">
            <el-icon><ChatDotSquare /></el-icon>
            <span>沟通记录</span>
            <el-badge 
              v-if="newCommunicationsCount > 0" 
              :value="newCommunicationsCount" 
              type="success"
              class="tab-badge"
            />
          </div>
        </template>
        <CommunicationRecordsTab 
          :records="communicationRecords"
          :students="students"
          :loading="loading"
          @record-added="handleRecordAdded"
          @record-updated="handleRecordUpdated"
          @record-deleted="handleRecordDeleted"
        />
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, inject, onMounted, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { User, TrendCharts, ChatDotSquare } from '@element-plus/icons-vue'

// 导入子组件
import StudentListTab from './student-management/StudentListTab.vue'
import ProgressTrackingTab from './student-management/ProgressTrackingTab.vue'
import CommunicationRecordsTab from './student-management/CommunicationRecordsTab.vue'

// 导入状态管理
import { useMentorWorkbenchStore } from '@/stores/mentorWorkbench'
import type { StudentInfo, CommunicationRecord } from '@/stores/mentorWorkbench'

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
const activeTab = ref('student-list')
const loading = ref(false)

// 注入的方法
const refreshStats = inject('refreshStats') as (() => Promise<void>) | undefined

// 计算属性
const students = computed(() => mentorStore.myStudents)
const communicationRecords = computed(() => mentorStore.communicationRecords)

const activeStudentsCount = computed(() => 
  students.value.filter(s => s.status === 'active').length
)

const overdueStudentsCount = computed(() => {
  // 计算进度滞后的学员数量
  const now = new Date()
  return students.value.filter(student => {
    if (student.status !== 'active') return false
    
    // 计算预期进度
    const startDate = new Date(student.mentorshipStartDate)
    const daysPassed = Math.floor((now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
    const expectedProgress = Math.min((daysPassed / 90) * 100, 100) // 假设90天为完整周期
    
    return student.progress < expectedProgress - 10 // 落后10%以上视为滞后
  }).length
})

const newCommunicationsCount = computed(() => {
  // 计算最近一周的沟通记录数量
  const weekAgo = new Date()
  weekAgo.setDate(weekAgo.getDate() - 7)
  
  return communicationRecords.value.filter(record => {
    const recordDate = new Date(record.date)
    return recordDate >= weekAgo
  }).length
})

// 方法
const handleTabClick = (tab: any) => {
  activeTab.value = tab.name
  console.log('🔄 切换到Tab:', tab.name)
}

const handleStudentSelected = (studentId: string) => {
  console.log('👤 选择学员:', studentId)
  emit('student-selected', studentId)
}

const handleFilterChanged = (filters: any) => {
  console.log('🔍 筛选条件变更:', filters)
  // 可以在这里处理筛选逻辑
}

const handleProgressUpdated = async (studentId: string, progress: number) => {
  try {
    await mentorStore.updateStudentProgress(studentId, progress)
    ElMessage.success('学员进度更新成功')
    
    // 刷新统计数据
    if (refreshStats) {
      await refreshStats()
    }
  } catch (error) {
    console.error('❌ 更新学员进度失败:', error)
    ElMessage.error('更新学员进度失败')
  }
}

const handleMilestoneReached = (studentId: string, milestone: string) => {
  console.log('🎯 学员达成里程碑:', studentId, milestone)
  ElMessage.success(`学员 ${milestone} 达成！`)
}

const handleRecordAdded = async (record: Omit<CommunicationRecord, 'id'>) => {
  try {
    await mentorStore.addCommunicationRecord(record)
    ElMessage.success('沟通记录添加成功')
    
    emit('communication-added', `comm-${Date.now()}`)
    
    // 刷新统计数据
    if (refreshStats) {
      await refreshStats()
    }
  } catch (error) {
    console.error('❌ 添加沟通记录失败:', error)
    ElMessage.error('添加沟通记录失败')
  }
}

const handleRecordUpdated = (recordId: string) => {
  console.log('📝 沟通记录更新:', recordId)
  ElMessage.success('沟通记录更新成功')
}

const handleRecordDeleted = (recordId: string) => {
  console.log('🗑️ 沟通记录删除:', recordId)
  ElMessage.success('沟通记录删除成功')
}

// 初始化
const initializePanel = async () => {
  loading.value = true
  try {
    // 如果需要特定的初始化逻辑，在这里添加
    console.log('📚 学员管理面板初始化完成')
  } catch (error) {
    console.error('❌ 学员管理面板初始化失败:', error)
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
.student-management-panel {
  height: 100%;
  padding: 20px;
}

.management-tabs {
  height: 100%;
}

.management-tabs :deep(.el-tabs__content) {
  height: calc(100% - 60px);
  overflow: hidden;
}

.management-tabs :deep(.el-tab-pane) {
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
.management-tabs :deep(.el-tabs__header) {
  margin-bottom: 16px;
  border-bottom: 2px solid #e4e7ed;
}

.management-tabs :deep(.el-tabs__nav-wrap) {
  padding: 0 8px;
}

.management-tabs :deep(.el-tabs__item) {
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

.management-tabs :deep(.el-tabs__item:hover) {
  color: #409eff;
  background-color: #f0f9ff;
}

.management-tabs :deep(.el-tabs__item.is-active) {
  color: #409eff;
  background-color: #ffffff;
  border: 1px solid #e4e7ed;
  border-bottom: 1px solid #ffffff;
  margin-bottom: -1px;
}

.management-tabs :deep(.el-tabs__active-bar) {
  display: none;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .student-management-panel {
    padding: 12px;
  }
  
  .management-tabs :deep(.el-tabs__item) {
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
  .management-tabs :deep(.el-tabs__nav-wrap) {
    padding: 0 4px;
  }
  
  .management-tabs :deep(.el-tabs__item) {
    padding: 0 8px;
    margin-right: 4px;
  }
}
</style> 