<template>
  <div class="my-todos">
    <div class="page-header">
      <h2>我的待办</h2>
      <div class="header-actions">
        <el-button type="primary" @click="showAddDialog = true">
          <el-icon><Plus /></el-icon>
          添加待办
        </el-button>
      </div>
    </div>

    <div class="todos-content">
      <!-- 筛选和搜索 -->
      <div class="filter-bar">
        <el-row :gutter="16">
          <el-col :span="8">
            <el-select v-model="filterStatus" placeholder="状态筛选" clearable>
              <el-option label="全部" value="" />
              <el-option label="待完成" value="pending" />
              <el-option label="已完成" value="completed" />
              <el-option label="已逾期" value="overdue" />
            </el-select>
          </el-col>
          <el-col :span="8">
            <el-select v-model="filterPriority" placeholder="优先级筛选" clearable>
              <el-option label="全部优先级" value="" />
              <el-option label="高优先级" value="high" />
              <el-option label="中优先级" value="medium" />
              <el-option label="低优先级" value="low" />
            </el-select>
          </el-col>
          <el-col :span="8">
            <el-input
              v-model="searchText"
              placeholder="搜索待办事项"
              clearable
            >
              <template #prefix>
                <el-icon><Search /></el-icon>
              </template>
            </el-input>
          </el-col>
        </el-row>
      </div>

      <!-- 待办列表 -->
      <div class="todos-list">
        <div
          v-for="todo in filteredTodos"
          :key="todo.id"
          class="todo-item"
          :class="{
            'completed': todo.completed,
            'urgent': todo.isUrgent,
            'overdue': isOverdue(todo.dueDate)
          }"
        >
          <div class="todo-checkbox">
            <el-checkbox
              v-model="todo.completed"
              @change="handleToggleComplete(todo)"
            />
          </div>
          
          <div class="todo-content">
            <h4 class="todo-title">{{ todo.title }}</h4>
            <p class="todo-description" v-if="todo.description">{{ todo.description }}</p>
            
            <div class="todo-meta">
              <el-tag
                :type="getPriorityType(todo.priority)"
                size="small"
              >
                {{ getPriorityLabel(todo.priority) }}
              </el-tag>
              
              <el-tag
                :type="getTypeColor(todo.type)"
                size="small"
              >
                {{ getTypeLabel(todo.type) }}
              </el-tag>
              
              <span class="due-date">
                <el-icon><Clock /></el-icon>
                {{ formatDueDate(todo.dueDate) }}
              </span>
            </div>
          </div>
          
          <div class="todo-actions">
            <el-button
              type="text"
              size="small"
              @click="editTodo(todo)"
            >
              编辑
            </el-button>
            <el-button
              type="text"
              size="small"
              @click="deleteTodo(todo.id)"
              class="delete-btn"
            >
              删除
            </el-button>
          </div>
        </div>
        
        <el-empty
          v-if="filteredTodos.length === 0"
          description="暂无待办事项"
        />
      </div>
    </div>

    <!-- 添加/编辑待办对话框 -->
    <el-dialog
      v-model="showAddDialog"
      :title="editingTodo ? '编辑待办' : '添加待办'"
      width="500px"
    >
      <el-form :model="todoForm" :rules="todoRules" ref="todoFormRef">
        <el-form-item label="标题" prop="title">
          <el-input v-model="todoForm.title" placeholder="请输入待办标题" />
        </el-form-item>
        
        <el-form-item label="描述">
          <el-input
            v-model="todoForm.description"
            type="textarea"
            :rows="3"
            placeholder="请输入详细描述（可选）"
          />
        </el-form-item>
        
        <el-form-item label="类型" prop="type">
          <el-select v-model="todoForm.type" placeholder="选择类型">
            <el-option label="任务" value="task" />
            <el-option label="提醒" value="reminder" />
            <el-option label="截止日期" value="deadline" />
            <el-option label="会议" value="meeting" />
          </el-select>
        </el-form-item>
        
        <el-form-item label="优先级" prop="priority">
          <el-select v-model="todoForm.priority" placeholder="选择优先级">
            <el-option label="低" value="low" />
            <el-option label="中" value="medium" />
            <el-option label="高" value="high" />
          </el-select>
        </el-form-item>
        
        <el-form-item label="截止时间" prop="dueDate">
          <el-date-picker
            v-model="todoForm.dueDate"
            type="datetime"
            placeholder="选择截止时间"
            format="YYYY-MM-DD HH:mm"
            value-format="YYYY-MM-DD HH:mm:ss"
          />
        </el-form-item>
        
        <el-form-item>
          <el-checkbox v-model="todoForm.isUrgent">标记为紧急</el-checkbox>
        </el-form-item>
      </el-form>
      
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="showAddDialog = false">取消</el-button>
          <el-button type="primary" @click="saveTodo">确定</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Search, Clock } from '@element-plus/icons-vue'
import { usePersonalCenterStore } from '@/stores/personalCenter'
import type { TodoItem } from '@/stores/personalCenter'

const personalStore = usePersonalCenterStore()

// 响应式数据
const filterStatus = ref('')
const filterPriority = ref('')
const searchText = ref('')
const showAddDialog = ref(false)
const editingTodo = ref<TodoItem | null>(null)

const todoForm = ref({
  title: '',
  description: '',
  type: 'task' as TodoItem['type'],
  priority: 'medium' as TodoItem['priority'],
  dueDate: '',
  isUrgent: false
})

const todoRules = {
  title: [
    { required: true, message: '请输入待办标题', trigger: 'blur' }
  ],
  type: [
    { required: true, message: '请选择类型', trigger: 'change' }
  ],
  priority: [
    { required: true, message: '请选择优先级', trigger: 'change' }
  ],
  dueDate: [
    { required: true, message: '请选择截止时间', trigger: 'change' }
  ]
}

const todoFormRef = ref()

// 计算属性
const filteredTodos = computed(() => {
  let todos = personalStore.todos || []
  
  // 状态筛选
  if (filterStatus.value) {
    if (filterStatus.value === 'completed') {
      todos = todos.filter(t => t.completed)
    } else if (filterStatus.value === 'pending') {
      todos = todos.filter(t => !t.completed && !isOverdue(t.dueDate))
    } else if (filterStatus.value === 'overdue') {
      todos = todos.filter(t => !t.completed && isOverdue(t.dueDate))
    }
  }
  
  // 优先级筛选
  if (filterPriority.value) {
    todos = todos.filter(t => t.priority === filterPriority.value)
  }
  
  // 搜索筛选
  if (searchText.value) {
    const search = searchText.value.toLowerCase()
    todos = todos.filter(t => 
      t.title.toLowerCase().includes(search) ||
      (t.description && t.description.toLowerCase().includes(search))
    )
  }
  
  return todos.sort((a, b) => {
    // 未完成的排在前面
    if (a.completed !== b.completed) {
      return a.completed ? 1 : -1
    }
    // 紧急的排在前面
    if (a.isUrgent !== b.isUrgent) {
      return a.isUrgent ? -1 : 1
    }
    // 按截止时间排序
    return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
  })
})

// 方法
function isOverdue(dueDate: string): boolean {
  return new Date(dueDate) < new Date()
}

function formatDueDate(dueDate: string): string {
  const date = new Date(dueDate)
  const now = new Date()
  const diffMs = date.getTime() - now.getTime()
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24))
  
  if (diffDays === 0) return '今天到期'
  if (diffDays === 1) return '明天到期'
  if (diffDays === -1) return '昨天已过期'
  if (diffDays > 0) return `${diffDays}天后到期`
  return `已过期${Math.abs(diffDays)}天`
}

function getPriorityType(priority: string): string {
  const types = { high: 'danger', medium: 'warning', low: 'info' }
  return types[priority] || 'info'
}

function getPriorityLabel(priority: string): string {
  const labels = { high: '高优先级', medium: '中优先级', low: '低优先级' }
  return labels[priority] || priority
}

function getTypeColor(type: string): string {
  const colors = { task: 'primary', reminder: 'success', deadline: 'danger', meeting: 'warning' }
  return colors[type] || 'primary'
}

function getTypeLabel(type: string): string {
  const labels = { task: '任务', reminder: '提醒', deadline: '截止日期', meeting: '会议' }
  return labels[type] || type
}

function handleToggleComplete(todo: TodoItem) {
  personalStore.updateTodoStatus(todo.id, todo.completed)
  ElMessage.success(todo.completed ? '待办已完成' : '待办已恢复')
}

function editTodo(todo: TodoItem) {
  editingTodo.value = todo
  todoForm.value = {
    title: todo.title,
    description: todo.description || '',
    type: todo.type,
    priority: todo.priority,
    dueDate: todo.dueDate,
    isUrgent: todo.isUrgent
  }
  showAddDialog.value = true
}

function resetForm() {
  todoForm.value = {
    title: '',
    description: '',
    type: 'task',
    priority: 'medium',
    dueDate: '',
    isUrgent: false
  }
  editingTodo.value = null
}

function saveTodo() {
  todoFormRef.value?.validate((valid: boolean) => {
    if (valid) {
      if (editingTodo.value) {
        // 更新现有待办
        Object.assign(editingTodo.value, todoForm.value)
        ElMessage.success('待办已更新')
      } else {
        // 添加新待办
        const newTodo: TodoItem = {
          id: `todo-${Date.now()}`,
          completed: false,
          projectId: '',
          ...todoForm.value
        }
        personalStore.todos.push(newTodo)
        ElMessage.success('待办已添加')
      }
      
      showAddDialog.value = false
      resetForm()
    }
  })
}

function deleteTodo(todoId: string) {
  ElMessageBox.confirm('确定要删除这个待办事项吗？', '确认删除', {
    type: 'warning'
  }).then(() => {
    const index = personalStore.todos.findIndex(t => t.id === todoId)
    if (index > -1) {
      personalStore.todos.splice(index, 1)
      ElMessage.success('待办已删除')
    }
  }).catch(() => {})
}

// 生命周期
onMounted(async () => {
  await personalStore.loadTodos()
})
</script>

<style scoped>
.my-todos {
  padding: 24px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.page-header h2 {
  margin: 0;
  font-size: 24px;
  font-weight: 600;
  color: #303133;
}

.filter-bar {
  margin-bottom: 24px;
  padding: 16px;
  background: #f5f7fa;
  border-radius: 8px;
}

.todos-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.todo-item {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 16px;
  background: white;
  border-radius: 8px;
  border: 1px solid #ebeef5;
  transition: all 0.3s ease;
}

.todo-item:hover {
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
}

.todo-item.completed {
  opacity: 0.6;
}

.todo-item.completed .todo-title {
  text-decoration: line-through;
  color: #909399;
}

.todo-item.urgent {
  border-left: 4px solid #f56c6c;
}

.todo-item.overdue {
  border-left: 4px solid #e6a23c;
  background: #fef0e6;
}

.todo-checkbox {
  margin-top: 2px;
}

.todo-content {
  flex: 1;
  min-width: 0;
}

.todo-title {
  margin: 0 0 8px 0;
  font-size: 16px;
  font-weight: 500;
  color: #303133;
}

.todo-description {
  margin: 0 0 12px 0;
  font-size: 14px;
  color: #606266;
  line-height: 1.5;
}

.todo-meta {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.due-date {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: #909399;
}

.todo-actions {
  display: flex;
  gap: 8px;
}

.delete-btn {
  color: #f56c6c;
}

.delete-btn:hover {
  color: #f78989;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .my-todos {
    padding: 16px;
  }
  
  .page-header {
    flex-direction: column;
    gap: 16px;
    align-items: stretch;
  }
  
  .todo-item {
    flex-direction: column;
    gap: 8px;
  }
  
  .todo-content {
    order: 1;
  }
  
  .todo-checkbox {
    order: 0;
    align-self: flex-start;
  }
  
  .todo-actions {
    order: 2;
    align-self: flex-end;
  }
}
</style> 