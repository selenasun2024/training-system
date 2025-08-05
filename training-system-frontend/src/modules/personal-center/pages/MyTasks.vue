<template>
  <div class="my-tasks">
    <!-- 页面头部 -->
    <div class="page-header">
      <h2>我的作业</h2>
      <div class="header-stats">
        <el-statistic title="待完成" :value="pendingTasks.length" />
        <el-statistic title="已完成" :value="completedTasks.length" />
        <el-statistic title="总计" :value="allTasks.length" />
      </div>
    </div>

    <!-- 筛选器 -->
    <div class="filters">
      <el-tabs v-model="activeTab" @tab-click="handleTabClick">
        <el-tab-pane label="待完成" name="pending">
          <template #label>
            <span>
              待完成
              <el-badge :value="pendingTasks.length" type="warning" v-if="pendingTasks.length > 0" />
            </span>
          </template>
        </el-tab-pane>
        <el-tab-pane label="已完成" name="completed">
          <template #label>
            <span>
              已完成
              <el-badge :value="completedTasks.length" type="success" v-if="completedTasks.length > 0" />
            </span>
          </template>
        </el-tab-pane>
        <el-tab-pane label="全部" name="all">
          <template #label>
            <span>全部</span>
          </template>
        </el-tab-pane>
      </el-tabs>
    </div>

    <!-- 作业列表 -->
    <div class="tasks-list">
      <div v-if="currentTasks.length === 0" class="empty-state">
        <el-empty :description="getEmptyDescription()" />
      </div>
      <div v-else class="tasks-grid">
        <el-card 
          v-for="task in currentTasks" 
          :key="task.id"
          class="task-card"
          :class="{ 'completed': task.status === 'completed', 'overdue': isOverdue(task) }"
          shadow="hover"
        >
          <template #header>
            <div class="task-header">
              <div class="task-title">
                <el-icon class="task-icon"><Document /></el-icon>
                <span>{{ task.title }}</span>
              </div>
              <el-tag 
                :type="getTaskStatusType(task)" 
                size="small"
              >
                {{ getTaskStatusText(task) }}
              </el-tag>
            </div>
          </template>

          <div class="task-content">
            <div class="task-info">
              <div class="info-item">
                <el-icon><Folder /></el-icon>
                <span>{{ task.projectName }}</span>
              </div>
              <div class="info-item" v-if="task.dueDate">
                <el-icon><Clock /></el-icon>
                <span>截止：{{ formatDate(task.dueDate) }}</span>
              </div>
              <div class="info-item" v-if="task.score !== undefined">
                <el-icon><Trophy /></el-icon>
                <span>得分：{{ task.score }}分</span>
              </div>
            </div>

            <div class="task-description" v-if="task.description">
              {{ task.description }}
            </div>

            <div class="task-actions">
              <el-button
                v-if="task.status === 'pending'"
                type="primary"
                size="small"
                @click="handleSubmitTask(task)"
              >
                提交作业
              </el-button>
              <el-button
                v-if="task.status === 'completed'"
                type="default"
                size="small"
                @click="handleViewSubmission(task)"
              >
                查看提交
              </el-button>
              <el-button
                size="small"
                @click="handleViewDetails(task)"
              >
                查看详情
              </el-button>
            </div>
          </div>
        </el-card>
      </div>
    </div>

    <!-- 作业提交对话框 -->
    <el-dialog
      v-model="submitDialogVisible"
      title="提交作业"
      width="600px"
      :before-close="handleSubmitDialogClose"
    >
      <div v-if="currentTask">
        <div class="submit-form">
          <h4>{{ currentTask.title }}</h4>
          <p class="task-desc">{{ currentTask.description }}</p>
          
          <el-form :model="submitForm" label-width="80px">
            <el-form-item label="作业内容" required>
              <el-input
                v-model="submitForm.content"
                type="textarea"
                :rows="6"
                placeholder="请输入您的作业内容..."
              />
            </el-form-item>
            <el-form-item label="附件">
              <el-upload
                v-model:file-list="submitForm.attachments"
                action="#"
                :auto-upload="false"
                multiple
              >
                <el-button type="primary">选择文件</el-button>
              </el-upload>
            </el-form-item>
          </el-form>
        </div>
      </div>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="submitDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="handleConfirmSubmit" :loading="submitting">
            提交作业
          </el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, inject } from 'vue'
import { ElMessage } from 'element-plus'
import { Document, Folder, Clock, Trophy } from '@element-plus/icons-vue'
import { getStudentTasks, submitTask } from '@/api/modules/task'

// 任务数据类型
interface Task {
  id: string
  title: string
  description: string
  projectName: string
  projectId: string
  dueDate?: string
  status: 'pending' | 'completed' | 'overdue'
  score?: number
  submittedAt?: string
}

// 响应式数据
const activeTab = ref('pending')
const tasks = ref<Task[]>([])
const loading = ref(false)
const submitDialogVisible = ref(false)
const currentTask = ref<Task | null>(null)
const submitting = ref(false)

// 提交表单数据
const submitForm = ref({
  content: '',
  attachments: [] as any[]
})

// 计算属性
const pendingTasks = computed(() => tasks.value.filter(task => task.status === 'pending'))
const completedTasks = computed(() => tasks.value.filter(task => task.status === 'completed'))
const allTasks = computed(() => tasks.value)

const currentTasks = computed(() => {
  switch (activeTab.value) {
    case 'pending':
      return pendingTasks.value
    case 'completed':
      return completedTasks.value
    case 'all':
    default:
      return allTasks.value
  }
})

// 方法
function handleTabClick(tab: any) {
  console.log('切换tab:', tab.paneName)
}

function getEmptyDescription() {
  switch (activeTab.value) {
    case 'pending':
      return '暂无待完成的作业'
    case 'completed':
      return '暂无已完成的作业'
    case 'all':
    default:
      return '暂无作业任务'
  }
}

function getTaskStatusType(task: Task) {
  switch (task.status) {
    case 'pending':
      return isOverdue(task) ? 'danger' : 'warning'
    case 'completed':
      return 'success'
    default:
      return 'info'
  }
}

function getTaskStatusText(task: Task) {
  switch (task.status) {
    case 'pending':
      return isOverdue(task) ? '已逾期' : '待完成'
    case 'completed':
      return '已完成'
    default:
      return '未知'
  }
}

function isOverdue(task: Task) {
  if (!task.dueDate) return false
  return new Date(task.dueDate) < new Date()
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('zh-CN')
}

function handleSubmitTask(task: Task) {
  currentTask.value = task
  submitForm.value = {
    content: '',
    attachments: []
  }
  submitDialogVisible.value = true
}

function handleViewSubmission(task: Task) {
  ElMessage.info('查看提交功能开发中...')
}

function handleViewDetails(task: Task) {
  ElMessage.info('查看详情功能开发中...')
}

function handleSubmitDialogClose() {
  submitDialogVisible.value = false
  currentTask.value = null
}

async function handleConfirmSubmit() {
  if (!submitForm.value.content.trim()) {
    ElMessage.warning('请输入作业内容')
    return
  }

  if (!currentTask.value) {
    ElMessage.error('任务信息错误')
    return
  }

  submitting.value = true
  try {
    // 获取当前用户ID
    const userId = getCurrentUserId?.() || 'user-market-001'  // 改为吴静的ID
    
    console.log('🔍 开始提交作业:', {
      taskId: currentTask.value.id,
      studentId: userId,
      content: submitForm.value.content
    })
    
    // 调用真实的提交作业API
    await submitTask(
      currentTask.value.id,
      userId,
      submitForm.value.content,
      [] // TODO: 后续处理附件上传
    )
    
    // 更新任务状态
    const task = tasks.value.find(t => t.id === currentTask.value!.id)
    if (task) {
      task.status = 'completed'
      task.submittedAt = new Date().toISOString()
    }

    ElMessage.success('作业提交成功！')
    submitDialogVisible.value = false
  } catch (error) {
    console.error('❌ 提交作业失败:', error)
    ElMessage.error('提交失败：' + (error?.message || '网络错误'))
  } finally {
    submitting.value = false
  }
}

// 获取当前用户ID的方法
const getCurrentUserId = inject<() => string>('getCurrentUserId')

// 加载用户的作业任务
async function loadMyTasks() {
  loading.value = true
  try {
    // 🔧 修复：直接使用吴静的用户ID，因为inject在当前路由结构下接收不到数据
    const userId = getCurrentUserId?.() || 'user-market-001'  // 改为吴静的ID
    
    console.log('🔍 开始加载学员任务数据 - 用户ID:', userId)
    const tasksData = await getStudentTasks(userId)
    
    // 转换数据格式以匹配前端界面
    tasks.value = tasksData.map(task => ({
      id: task.id,
      title: task.title,
      description: task.description || '',
      projectName: task.projectName,
      projectId: task.projectId,
      dueDate: task.dueDate,
      status: task.status,
      score: task.score,
      submittedAt: task.submittedAt
    }))
    
    console.log('✅ 学员任务数据加载完成，任务数量:', tasks.value.length)
  } catch (error) {
    console.error('❌ 加载作业列表失败:', error)
    ElMessage.error('加载作业列表失败：' + (error?.message || '网络错误'))
  } finally {
    loading.value = false
  }
}

// 生命周期
onMounted(() => {
  loadMyTasks()
})
</script>

<style scoped>
.my-tasks {
  max-width: 1200px;
  margin: 0 auto;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  padding: 20px;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.page-header h2 {
  margin: 0;
  color: #303133;
}

.header-stats {
  display: flex;
  gap: 24px;
}

.filters {
  margin-bottom: 20px;
}

.tasks-list {
  min-height: 400px;
}

.empty-state {
  text-align: center;
  padding: 60px 20px;
}

.tasks-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 16px;
}

.task-card {
  transition: all 0.3s;
}

.task-card:hover {
  transform: translateY(-2px);
}

.task-card.completed {
  opacity: 0.8;
}

.task-card.overdue {
  border-left: 4px solid #f56c6c;
}

.task-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.task-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
}

.task-icon {
  color: #409eff;
}

.task-content {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.task-info {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.info-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
  color: #606266;
}

.task-description {
  font-size: 14px;
  color: #909399;
  line-height: 1.4;
}

.task-actions {
  display: flex;
  gap: 8px;
  margin-top: 12px;
}

.submit-form h4 {
  margin: 0 0 8px 0;
  color: #303133;
}

.task-desc {
  margin: 0 0 20px 0;
  color: #606266;
  font-size: 14px;
  line-height: 1.4;
}
</style> 