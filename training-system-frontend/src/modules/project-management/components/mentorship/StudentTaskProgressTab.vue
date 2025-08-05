<template>
  <div class="student-task-progress-tab">
    <!-- 工具栏 -->
    <div class="toolbar">
      <div class="toolbar-left">
              <el-select v-model="filterMentor" placeholder="筛选带教老师" style="width: 180px" clearable>
        <el-option label="全部带教老师" value="" />
          <el-option
            v-for="mentor in mentors"
            :key="mentor.id"
            :label="mentor.name"
            :value="mentor.id"
          />
        </el-select>
        <el-select v-model="filterTaskStatus" placeholder="任务状态" style="width: 140px" clearable>
          <el-option label="全部状态" value="" />
          <el-option label="未开始" value="not_started" />
          <el-option label="进行中" value="in_progress" />
          <el-option label="已完成" value="completed" />
          <el-option label="已逾期" value="overdue" />
        </el-select>
        <el-select v-model="filterTaskType" placeholder="任务类型" style="width: 140px" clearable>
          <el-option label="全部类型" value="" />
          <el-option label="理论学习" value="theory" />
          <el-option label="实践操作" value="practice" />
          <el-option label="作业提交" value="homework" />
          <el-option label="考试测评" value="exam" />
        </el-select>
        <el-input
          v-model="searchKeyword"
          placeholder="搜索学员姓名"
          style="width: 200px"
          clearable
        >
          <template #prefix>
            <el-icon><Search /></el-icon>
          </template>
        </el-input>
      </div>
      <div class="toolbar-right">
        <el-button @click="exportProgress">导出进度</el-button>
      </div>
    </div>

    <!-- 统计概览 -->
    <div class="progress-overview">
      <div class="overview-card">
        <div class="card-content">
          <div class="card-title">总学员数</div>
          <div class="card-value">{{ stats.totalStudents }}</div>
        </div>
        <div class="card-icon student">
          <el-icon><User /></el-icon>
        </div>
      </div>
      
      <div class="overview-card">
        <div class="card-content">
          <div class="card-title">平均完成率</div>
          <div class="card-value">{{ stats.averageProgress }}%</div>
        </div>
        <div class="card-icon progress">
          <el-icon><TrendCharts /></el-icon>
        </div>
      </div>
      
      <div class="overview-card">
        <div class="card-content">
          <div class="card-title">按时完成</div>
          <div class="card-value">{{ stats.onTimeCompletion }}%</div>
        </div>
        <div class="card-icon success">
          <el-icon><CircleCheckFilled /></el-icon>
        </div>
      </div>
      
      <div class="overview-card">
        <div class="card-content">
          <div class="card-title">需要关注</div>
          <div class="card-value">{{ stats.needsAttention }}</div>
        </div>
        <div class="card-icon warning">
          <el-icon><WarningFilled /></el-icon>
        </div>
      </div>
    </div>

    <!-- 学员任务进度表格 -->
    <el-table
      :data="filteredTaskProgress"
      v-loading="loading"
      style="width: 100%"
      border
      row-key="id"
    >
      <el-table-column label="学员信息" min-width="180" fixed="left">
        <template #default="{ row }">
          <div class="student-cell">
            <el-avatar :size="40">{{ row.studentName.charAt(0) }}</el-avatar>
            <div class="student-info">
              <div class="name">{{ row.studentName }}</div>
              <div class="meta">{{ row.department }}</div>
              <div class="mentor-name">带教老师：{{ row.mentorName }}</div>
            </div>
          </div>
        </template>
      </el-table-column>

      <el-table-column label="当前任务" min-width="200">
        <template #default="{ row }">
          <div class="current-task">
            <div class="task-name">{{ row.currentTask.name }}</div>
            <div class="task-meta">
              <el-tag
                :type="getTaskTypeColor(row.currentTask.type)"
                size="small"
              >
                {{ getTaskTypeText(row.currentTask.type) }}
              </el-tag>
              <span class="deadline">
                截止：{{ formatDate(row.currentTask.deadline) }}
              </span>
            </div>
          </div>
        </template>
      </el-table-column>

      <el-table-column label="完成进度" width="150">
        <template #default="{ row }">
          <div class="progress-cell">
            <el-progress
              :percentage="row.overallProgress"
              :stroke-width="8"
              :color="getProgressColor(row.overallProgress)"
              :format="() => `${row.overallProgress}%`"
            />
            <div class="progress-stats">
              <span class="completed">{{ row.completedTasks }}/{{ row.totalTasks }} 任务</span>
            </div>
          </div>
        </template>
      </el-table-column>

      <el-table-column label="任务状态" width="120">
        <template #default="{ row }">
          <el-tag
            :type="getTaskStatusColor(row.currentTask.status)"
            size="small"
          >
            {{ getTaskStatusText(row.currentTask.status) }}
          </el-tag>
        </template>
      </el-table-column>

      <el-table-column label="质量评分" width="120">
        <template #default="{ row }">
          <div v-if="row.averageScore" class="score-cell">
            <div class="score-value" :class="getScoreClass(row.averageScore)">
              {{ row.averageScore }}分
            </div>
            <el-rate
              :model-value="row.averageScore / 20"
              disabled
              size="small"
              :max="5"
            />
          </div>
          <span v-else class="no-score">暂无评分</span>
        </template>
      </el-table-column>

      <el-table-column label="学习时长" width="100">
        <template #default="{ row }">
          <div class="study-time">
            <div class="time-value">{{ row.studyTime }}h</div>
            <div class="time-target">
              目标：{{ row.targetTime }}h
            </div>
          </div>
        </template>
      </el-table-column>

      <el-table-column label="最近活动" width="120">
        <template #default="{ row }">
          <div class="last-activity">
            <div class="activity-text">{{ row.lastActivity.action }}</div>
            <div class="activity-time">{{ getRelativeTime(row.lastActivity.time) }}</div>
          </div>
        </template>
      </el-table-column>

      <el-table-column label="风险提示" width="120">
        <template #default="{ row }">
          <div class="risk-indicators">
            <el-tooltip
              v-for="risk in row.risks"
              :key="risk.type"
              :content="risk.description"
              placement="top"
            >
              <el-tag
                :type="getRiskColor(risk.level)"
                size="small"
                style="margin-bottom: 2px;"
              >
                {{ getRiskText(risk.type) }}
              </el-tag>
            </el-tooltip>
          </div>
        </template>
      </el-table-column>

      <el-table-column label="操作" width="140" fixed="right">
        <template #default="{ row }">
          <el-button
            type="primary"
            size="small"
            @click="viewTaskDetails(row)"
          >
            查看详情
          </el-button>
          <el-dropdown @command="(cmd) => handleAction(cmd, row)">
            <el-button size="small">
              更多<el-icon class="el-icon--right"><ArrowDown /></el-icon>
            </el-button>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="communication">沟通记录</el-dropdown-item>
                <el-dropdown-item command="adjust">调整计划</el-dropdown-item>
                <el-dropdown-item command="report">生成报告</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </template>
      </el-table-column>
    </el-table>

    <!-- 分页器 -->
    <div class="pagination-wrapper">
      <el-pagination
        v-model:current-page="pagination.page"
        v-model:page-size="pagination.pageSize"
        :total="pagination.total"
        :page-sizes="[10, 20, 50]"
        layout="total, sizes, prev, pager, next, jumper"
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
      />
    </div>

    <!-- 任务详情对话框 -->
    <el-dialog
      v-model="showTaskDialog"
      title="学员任务详情"
      width="1000px"
    >
      <TaskProgressDetail
        v-if="selectedStudent"
        :student="selectedStudent"
        :project-id="projectId"
      />
    </el-dialog>


  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, inject, watch } from 'vue'
import { ElMessage } from 'element-plus'
import {
  Search,
  User,
  TrendCharts,
  CircleCheckFilled,
  WarningFilled,
  ArrowDown
} from '@element-plus/icons-vue'
import TaskProgressDetail from './dialogs/TaskProgressDetail.vue'
import { getMentorshipProgress } from '@/api/modules/project-mentorship'

// Props
interface Props {
  projectId: string
  mentors: any[]
  relationships: any[]
}

const props = defineProps<Props>()

// 获取项目ID（从父组件注入或props）
const injectedProjectId = inject<string>('projectId')
const currentProjectId = computed(() => props.projectId || injectedProjectId || '')

// 响应式数据
const loading = ref(false)
const filterMentor = ref('')
const filterTaskStatus = ref('')
const filterTaskType = ref('')
const searchKeyword = ref('')
const showTaskDialog = ref(false)
const selectedStudent = ref<any>(null)

// 分页数据
const pagination = ref({
  page: 1,
  pageSize: 20,
  total: 0
})

// 统计数据
const stats = ref({
  totalStudents: 0,
  averageProgress: 0,
  onTimeCompletion: 0,
  needsAttention: 0
})

// 任务进度数据 - 改为从API获取
const taskProgress = ref<any[]>([])

// 过滤后的任务进度数据
const filteredTaskProgress = computed(() => {
  console.log('🔍 计算filteredTaskProgress - 原始数据长度:', taskProgress.value.length)
  console.log('🔍 筛选条件:', {
    filterMentor: filterMentor.value,
    filterTaskStatus: filterTaskStatus.value,
    filterTaskType: filterTaskType.value,
    searchKeyword: searchKeyword.value
  })
  
  let filtered = taskProgress.value

        // 按带教老师筛选
  if (filterMentor.value) {
    const beforeLength = filtered.length
    filtered = filtered.filter(item => item.mentorId === filterMentor.value)
          console.log(`📊 带教老师筛选: ${beforeLength} -> ${filtered.length}`)
  }

  // 按任务状态筛选
  if (filterTaskStatus.value) {
    const beforeLength = filtered.length
    filtered = filtered.filter(item => item.currentTask.status === filterTaskStatus.value)
    console.log(`📊 任务状态筛选: ${beforeLength} -> ${filtered.length}`)
  }

  // 按任务类型筛选
  if (filterTaskType.value) {
    const beforeLength = filtered.length
    filtered = filtered.filter(item => item.currentTask.type === filterTaskType.value)
    console.log(`📊 任务类型筛选: ${beforeLength} -> ${filtered.length}`)
  }

  // 按学员姓名搜索
  if (searchKeyword.value) {
    const beforeLength = filtered.length
    filtered = filtered.filter(item => 
      item.studentName.toLowerCase().includes(searchKeyword.value.toLowerCase()) ||
      item.mentorName.toLowerCase().includes(searchKeyword.value.toLowerCase())
    )
    console.log(`📊 姓名搜索筛选: ${beforeLength} -> ${filtered.length}`)
  }

  console.log('✅ 最终过滤结果长度:', filtered.length)
  return filtered
})

// 从API加载任务进度数据
const loadTaskProgress = async () => {
  if (!currentProjectId.value) {
    console.warn('⚠️ 项目ID为空，无法加载任务进度')
    return
  }

  loading.value = true
  try {
    console.log('🔍 加载项目任务进度 - 项目ID:', currentProjectId.value)
    console.log('📋 请求参数:', {
      page: pagination.value.page,
      limit: pagination.value.pageSize,
      mentorId: filterMentor.value,
      status: filterTaskStatus.value,
      taskType: filterTaskType.value
    })
    
    // 过滤掉空字符串参数，避免后端验证错误
    const params: any = {
      page: pagination.value.page,
      limit: pagination.value.pageSize
    }
    
    // 只有非空值才添加到参数中
    if (filterMentor.value) {
      params.mentorId = filterMentor.value
    }
    if (filterTaskStatus.value) {
      params.status = filterTaskStatus.value
    }
    if (filterTaskType.value) {
      params.taskType = filterTaskType.value
    }
    
    console.log('📋 过滤后的请求参数:', params)
    
    const response = await getMentorshipProgress(currentProjectId.value, params)
    
    console.log('✅ 任务进度数据加载成功 - 原始响应:', response)
    console.log('📊 响应数据类型:', typeof response)
    console.log('📊 响应数据键:', Object.keys(response || {}))
    
    // 更新数据 - 修复数据结构映射
    const responseData = response.data || response; // 兼容不同的响应格式
    
    console.log('🔄 处理响应数据:', responseData)
    console.log('🔍 responseData.relationships 存在:', !!responseData?.relationships)
    console.log('🔍 responseData.relationships 长度:', responseData?.relationships?.length || 0)
    
    if (responseData && responseData.relationships) {
      taskProgress.value = responseData.relationships.map((item: any) => ({
        id: item.id,
        studentId: item.studentId || item.student?.id,
        studentName: item.studentName || item.student?.name || '未知学员',
        department: item.student?.department || item.department || '未知部门',
        mentorId: item.mentorId || item.mentor?.id,
        mentorName: item.mentorName || item.mentor?.name || '未知带教老师',
        currentTask: {
          id: item.currentTask?.id || 'task-unknown',
          name: item.currentTask?.name || '当前无任务',
          type: item.currentTask?.type || 'theory',
          status: item.currentTask?.status || 'not_started',
          deadline: item.currentTask?.deadline ? new Date(item.currentTask.deadline) : new Date()
        },
        overallProgress: item.overallProgress || item.progress || 0,
        completedTasks: item.completedTasks || 0,
        totalTasks: item.totalTasks || 0,
        averageScore: item.averageScore || null,
        studyTime: item.studyTime || 0,
        targetTime: item.targetTime || 0,
        lastActivity: {
          action: item.lastActivity?.action || '暂无活动',
          time: item.lastActivity?.time ? new Date(item.lastActivity.time) : new Date()
        },
        risks: item.risks || []
      }))
      
      // 更新统计数据
      if (responseData.summary) {
        stats.value = {
          totalStudents: responseData.summary.totalStudents || taskProgress.value.length,
          averageProgress: Math.round(responseData.summary.averageProgress || 0),
          onTimeCompletion: Math.round(responseData.summary.onTimeCompletion || 0),
          needsAttention: responseData.summary.needsAttention || 0
        }
      }
      
      // 更新分页信息
      if (responseData.pagination) {
        pagination.value = {
          ...pagination.value,
          total: responseData.pagination.total || 0
        }
      }
      
      console.log('📊 任务进度数据处理完成，学员数量:', taskProgress.value.length)
      console.log('👥 最终的taskProgress数据:', taskProgress.value.slice(0, 2)) // 只显示前2个学员的数据，避免控制台过长
    } else {
      console.warn('⚠️ 响应数据格式异常:', responseData)
      console.warn('⚠️ 期望的数据结构: { relationships: [...] }')
      taskProgress.value = []
    }
  } catch (error) {
    console.error('❌ 加载任务进度失败:', error)
    ElMessage.error('加载任务进度失败，请稍后重试')
    taskProgress.value = []
  } finally {
    loading.value = false
  }
}

// 降级使用Mock数据（当API失败时）
const loadMockData = () => {
  console.log('🔄 使用Mock数据作为降级方案')
  taskProgress.value = [
    {
      id: 'tp1',
      studentId: 'stu1',
      studentName: '张三',
      department: '技术部',
      mentorId: 'men1',
      mentorName: '李老师',
      currentTask: {
        id: 'task1',
        name: 'Java基础语法学习',
        type: 'theory',
        status: 'in_progress',
        deadline: new Date('2024-02-15')
      },
      overallProgress: 85,
      completedTasks: 17,
      totalTasks: 20,
      averageScore: 92,
      studyTime: 45,
      targetTime: 60,
      lastActivity: {
        action: '提交了作业',
        time: new Date('2024-01-28T10:30:00')
      },
      risks: [
        {
          type: 'progress',
          level: 'low',
          description: '进度正常'
        }
      ]
    },
    {
      id: 'tp2',
      studentId: 'stu2',
      studentName: '李四',
      department: '产品部',
      mentorId: 'men2',
      mentorName: '王老师',
      currentTask: {
        id: 'task2',
        name: '产品需求分析实践',
        type: 'practice',
        status: 'overdue',
        deadline: new Date('2024-01-25')
      },
      overallProgress: 45,
      completedTasks: 9,
      totalTasks: 20,
      averageScore: 76,
      studyTime: 28,
      targetTime: 50,
      lastActivity: {
        action: '查看了课程资料',
        time: new Date('2024-01-26T16:20:00')
      },
      risks: [
        {
          type: 'overdue',
          level: 'high',
          description: '任务已逾期3天'
        },
        {
          type: 'engagement',
          level: 'medium',
          description: '近期活跃度较低'
        }
      ]
    }
  ]
  
  stats.value = {
    totalStudents: taskProgress.value.length,
    averageProgress: 78,
    onTimeCompletion: 85,
    needsAttention: 1
  }
  
  pagination.value.total = taskProgress.value.length
}

// 计算属性
const getTaskTypeColor = (type: string) => {
  const colorMap: Record<string, string> = {
    theory: 'primary',
    practice: 'success',
    homework: 'warning',
    exam: 'danger'
  }
  return colorMap[type] || 'info'
}

const getTaskTypeText = (type: string) => {
  const textMap: Record<string, string> = {
    theory: '理论学习',
    practice: '实践操作',
    homework: '作业提交',
    exam: '考试测评'
  }
  return textMap[type] || type
}

const getTaskStatusColor = (status: string) => {
  const colorMap: Record<string, string> = {
    not_started: 'info',
    in_progress: 'warning',
    completed: 'success',
    overdue: 'danger'
  }
  return colorMap[status] || 'info'
}

const getTaskStatusText = (status: string) => {
  const textMap: Record<string, string> = {
    not_started: '未开始',
    in_progress: '进行中',
    completed: '已完成',
    overdue: '已逾期'
  }
  return textMap[status] || status
}

const getProgressColor = (progress: number) => {
  if (progress >= 90) return '#67c23a'
  if (progress >= 70) return '#e6a23c'
  if (progress >= 50) return '#f56c6c'
  return '#909399'
}

const getScoreClass = (score: number) => {
  if (score >= 90) return 'score-excellent'
  if (score >= 80) return 'score-good'
  if (score >= 70) return 'score-average'
  return 'score-poor'
}

const getRiskColor = (level: string) => {
  const colorMap: Record<string, string> = {
    low: 'success',
    medium: 'warning',
    high: 'danger'
  }
  return colorMap[level] || 'info'
}

const getRiskText = (type: string) => {
  const textMap: Record<string, string> = {
    overdue: '逾期',
    engagement: '活跃度低',
    progress: '进度慢',
    quality: '质量差'
  }
  return textMap[type] || type
}

const formatDate = (date: Date) => {
  return date.toLocaleDateString('zh-CN')
}

const getRelativeTime = (date: Date) => {
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  const hours = Math.floor(diff / (1000 * 60 * 60))
  const minutes = Math.floor(diff / (1000 * 60))

  if (days > 0) return `${days}天前`
  if (hours > 0) return `${hours}小时前`
  if (minutes > 0) return `${minutes}分钟前`
  return '刚刚'
}

const viewTaskDetails = (student: any) => {
  selectedStudent.value = student
  showTaskDialog.value = true
}

const handleAction = (command: string, student: any) => {
  console.log('🔍 执行操作:', command, '学员:', student.studentName)
  
  switch (command) {
    case 'communication':
      ElMessage.info('沟通记录功能开发中...')
      break
    case 'adjust':
      ElMessage.info('调整计划功能开发中...')
      break
    case 'report':
      ElMessage.info('生成报告功能开发中...')
      break
    default:
      ElMessage.info(`${command} 功能开发中...`)
  }
}

const exportProgress = () => {
  ElMessage.info('导出进度功能开发中...')
}

const refreshData = async () => {
  console.log('🔄 刷新任务进度数据')
  await loadTaskProgress()
  ElMessage.success('数据已刷新')
}

const debugStatus = () => {
  console.log('🐛 ===== 调试状态信息 =====')
  console.log('📋 项目ID (props):', props.projectId)
  console.log('📋 项目ID (注入):', injectedProjectId)
  console.log('📋 当前项目ID:', currentProjectId.value)
  console.log('📊 taskProgress长度:', taskProgress.value.length)
  console.log('📊 filteredTaskProgress长度:', filteredTaskProgress.value.length)
  console.log('📊 loading状态:', loading.value)
  console.log('📊 筛选条件:', {
    filterMentor: filterMentor.value,
    filterTaskStatus: filterTaskStatus.value,
    filterTaskType: filterTaskType.value,
    searchKeyword: searchKeyword.value
  })
  console.log('📊 统计数据:', stats.value)
  if (taskProgress.value.length > 0) {
    console.log('📊 第一个学员数据:', taskProgress.value[0])
  }
  console.log('🐛 ===== 调试状态结束 =====')
  
  ElMessage.info(`调试信息已输出到控制台。taskProgress: ${taskProgress.value.length}, filteredTaskProgress: ${filteredTaskProgress.value.length}`)
}

const handleSizeChange = async (size: number) => {
  pagination.value.pageSize = size
  pagination.value.page = 1
  await loadTaskProgress()
}

const handleCurrentChange = async (page: number) => {
  pagination.value.page = page
  await loadTaskProgress()
}

// 监听筛选条件变化，自动重新加载数据
watch([filterMentor, filterTaskStatus, filterTaskType], async () => {
  pagination.value.page = 1
  await loadTaskProgress()
}, { deep: true })

// 监听项目ID变化
watch(() => currentProjectId.value, async (newProjectId) => {
  if (newProjectId) {
    console.log('🔄 项目ID变化，重新加载数据:', newProjectId)
    await loadTaskProgress()
  }
}, { immediate: false })

// 生命周期
onMounted(async () => {
  console.log('🚀 StudentTaskProgressTab 组件挂载')
  console.log('📋 Props项目ID:', props.projectId)
  console.log('📋 注入项目ID:', injectedProjectId)
  console.log('📋 最终项目ID:', currentProjectId.value)
  console.log('📋 当前taskProgress长度:', taskProgress.value.length)
  
  if (currentProjectId.value) {
    console.log('✅ 项目ID存在，开始加载任务进度...')
    await loadTaskProgress()
  } else {
    console.warn('⚠️ 项目ID为空，使用Mock数据')
    loadMockData()
  }
})

// 为了便于调试，暴露数据到控制台
if (import.meta.env.DEV) {
  ;(window as any).taskProgressDebug = {
    projectId: currentProjectId,
    taskProgress,
    stats,
    loadTaskProgress,
    refreshData
  }
}
</script>

<style scoped>
.student-task-progress-tab {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding: 16px;
  background: #f8f9fa;
  border-radius: 8px;
}

.toolbar-left {
  display: flex;
  gap: 12px;
  align-items: center;
  flex-wrap: wrap;
}

.toolbar-right {
  display: flex;
  gap: 8px;
}

.progress-overview {
  display: flex;
  gap: 20px;
  margin-bottom: 20px;
}

.overview-card {
  flex: 1;
  display: flex;
  align-items: center;
  padding: 20px;
  background: #fff;
  border-radius: 8px;
  border: 1px solid #e4e7ed;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.card-content {
  flex: 1;
}

.card-title {
  font-size: 14px;
  color: #606266;
  margin-bottom: 8px;
}

.card-value {
  font-size: 24px;
  font-weight: bold;
  color: #303133;
}

.card-icon {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  color: #fff;
}

.card-icon.student {
  background: #409eff;
}

.card-icon.progress {
  background: #67c23a;
}

.card-icon.success {
  background: #e6a23c;
}

.card-icon.warning {
  background: #f56c6c;
}

.student-cell {
  display: flex;
  align-items: center;
  gap: 12px;
}

.student-info .name {
  font-weight: 500;
  color: #303133;
  margin-bottom: 2px;
}

.student-info .meta {
  font-size: 12px;
  color: #909399;
  margin-bottom: 2px;
}

.student-info .mentor-name {
  font-size: 11px;
  color: #606266;
}

.current-task .task-name {
  font-weight: 500;
  color: #303133;
  margin-bottom: 4px;
}

.task-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
}

.deadline {
  color: #606266;
}

.progress-cell {
  text-align: center;
}

.progress-stats {
  margin-top: 8px;
  font-size: 12px;
  color: #606266;
}

.score-cell {
  text-align: center;
}

.score-value {
  font-weight: bold;
  margin-bottom: 4px;
}

.score-value.score-excellent {
  color: #67c23a;
}

.score-value.score-good {
  color: #e6a23c;
}

.score-value.score-average {
  color: #f56c6c;
}

.score-value.score-poor {
  color: #909399;
}

.no-score {
  color: #c0c4cc;
  font-size: 12px;
}

.study-time {
  text-align: center;
}

.time-value {
  font-weight: bold;
  color: #303133;
  margin-bottom: 2px;
}

.time-target {
  font-size: 11px;
  color: #909399;
}

.last-activity {
  text-align: center;
}

.activity-text {
  font-size: 12px;
  color: #303133;
  margin-bottom: 2px;
}

.activity-time {
  font-size: 11px;
  color: #909399;
}

.risk-indicators {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.pagination-wrapper {
  display: flex;
  justify-content: center;
  margin-top: 20px;
  padding: 16px;
}

:deep(.el-table) {
  flex: 1;
}

/* 响应式设计 */
@media (max-width: 1200px) {
  .progress-overview {
    flex-direction: column;
  }
  
  .toolbar-left {
    flex-direction: column;
    align-items: stretch;
  }
}
</style> 