<template>
  <el-dialog 
    v-model="visible" 
    title="选择协同任务" 
    width="800px"
    @closed="handleClose"
  >
    <div class="task-selector">
      <!-- 搜索和筛选 -->
      <div class="selector-filters">
        <el-input
          v-model="searchKeyword"
          placeholder="搜索任务名称"
          style="width: 200px"
          clearable
        />
        <el-select v-model="filterType" placeholder="任务类型" style="width: 150px" clearable>
          <el-option label="全部" value="" />
          <el-option label="作业" value="homework" />
          <el-option label="考试" value="exam" />
          <el-option label="问卷" value="questionnaire" />
          <el-option label="面授" value="face-to-face" />
          <el-option label="讨论" value="discussion" />
        </el-select>
        <el-select v-model="filterStage" placeholder="所在阶段" style="width: 150px" clearable>
          <el-option label="全部阶段" value="" />
          <el-option 
            v-for="stage in stages" 
            :key="stage.id" 
            :label="stage.name" 
            :value="stage.id" 
          />
        </el-select>
      </div>

      <!-- 任务列表 -->
      <div class="task-list">
        <el-table 
          :data="filteredTasks" 
          @selection-change="handleSelectionChange"
          max-height="400"
        >
          <el-table-column type="selection" width="55" />
          <el-table-column prop="name" label="任务名称" min-width="200" />
          <el-table-column label="任务类型" width="100">
            <template #default="{ row }">
              <el-tag :type="getTaskTypeTag(row.type)" size="small">
                {{ getTaskTypeLabel(row.type) }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="所在阶段" width="120">
            <template #default="{ row }">
              {{ getStageNameById(row.stageId) }}
            </template>
          </el-table-column>
          <el-table-column prop="status" label="状态" width="100">
            <template #default="{ row }">
              <el-tag :type="getStatusTag(row.status)" size="small">
                {{ row.status }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="预计时长" width="100">
            <template #default="{ row }">
              {{ getTaskEstimatedHours(row.type) }}小时
            </template>
          </el-table-column>
        </el-table>
      </div>

      <!-- 协同设置 -->
      <div v-if="selectedTasks.length > 0" class="cooperation-settings">
        <el-divider>协同设置</el-divider>
        <el-form :model="cooperationConfig" label-width="120px" size="small">
          <el-form-item label="协同模式">
            <el-radio-group v-model="cooperationConfig.mode">
              <el-radio value="group">按小组协同</el-radio>
              <el-radio value="individual">个人协同</el-radio>
            </el-radio-group>
          </el-form-item>
          <el-form-item label="进度跟踪">
            <el-checkbox v-model="cooperationConfig.trackProgress">启用进度跟踪</el-checkbox>
          </el-form-item>
          <el-form-item label="互评功能">
            <el-checkbox v-model="cooperationConfig.enablePeerReview">启用组间互评</el-checkbox>
          </el-form-item>
          <el-form-item label="截止时间">
            <el-date-picker
              v-model="cooperationConfig.deadline"
              type="datetime"
              placeholder="选择截止时间"
              style="width: 100%"
            />
          </el-form-item>
        </el-form>
      </div>
    </div>

    <template #footer>
      <div class="dialog-footer">
        <span class="selected-info">已选择 {{ selectedTasks.length }} 个任务</span>
        <div>
          <el-button @click="handleClose">取消</el-button>
          <el-button 
            type="primary" 
            @click="confirmSelection"
            :disabled="selectedTasks.length === 0"
          >
            确认添加
          </el-button>
        </div>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useTrainingStageStore } from '../stores/trainingStage'
import { storeToRefs } from 'pinia'
import { getTaskTypeConfig } from '../constants/taskTypeCategories'

// Props & Emits
const props = defineProps<{
  modelValue: boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  'confirm': [tasks: any[], config: any]
}>()

// Store
const trainingStageStore = useTrainingStageStore()
const { stages } = storeToRefs(trainingStageStore)

// 响应式数据
const visible = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

const searchKeyword = ref('')
const filterType = ref('')
const filterStage = ref('')
const selectedTasks = ref<any[]>([])

// 协同配置
const cooperationConfig = ref({
  mode: 'group',
  trackProgress: true,
  enablePeerReview: false,
  deadline: null as Date | null
})

// 获取所有任务
const allTasks = computed(() => {
  const tasks: any[] = []
  stages.value.forEach(stage => {
    stage.tasks.forEach(task => {
      tasks.push({
        ...task,
        stageId: stage.id,
        stageName: stage.name
      })
    })
  })
  return tasks
})

// 过滤后的任务
const filteredTasks = computed(() => {
  let tasks = allTasks.value

  // 关键词搜索
  if (searchKeyword.value) {
    tasks = tasks.filter(task => 
      task.name.toLowerCase().includes(searchKeyword.value.toLowerCase())
    )
  }

  // 任务类型筛选
  if (filterType.value) {
    tasks = tasks.filter(task => task.type === filterType.value)
  }

  // 阶段筛选
  if (filterStage.value) {
    tasks = tasks.filter(task => task.stageId === filterStage.value)
  }

  return tasks
})

// 方法
const handleSelectionChange = (selection: any[]) => {
  selectedTasks.value = selection
}

const getTaskTypeLabel = (type: string) => {
  const config = getTaskTypeConfig(type)
  return config?.label || type
}

const getTaskTypeTag = (type: string) => {
  const typeMap: Record<string, string> = {
    homework: 'primary',
    exam: 'warning',
    questionnaire: 'info',
    'face-to-face': 'success',
    discussion: 'danger'
  }
  return typeMap[type] || 'info'
}

const getStatusTag = (status: string) => {
  const statusMap: Record<string, string> = {
    '未开始': 'info',
    '进行中': 'warning',
    '已完成': 'success',
    '已取消': 'danger'
  }
  return statusMap[status] || 'info'
}

const getStageNameById = (stageId: string) => {
  const stage = stages.value.find(s => s.id === stageId)
  return stage?.name || '未知阶段'
}

const getTaskEstimatedHours = (type: string) => {
  const config = getTaskTypeConfig(type)
  return config?.estimatedHours || 0
}

const confirmSelection = () => {
  emit('confirm', selectedTasks.value, cooperationConfig.value)
  handleClose()
}

const handleClose = () => {
  // 重置状态
  selectedTasks.value = []
  searchKeyword.value = ''
  filterType.value = ''
  filterStage.value = ''
  cooperationConfig.value = {
    mode: 'group',
    trackProgress: true,
    enablePeerReview: false,
    deadline: null
  }
  emit('update:modelValue', false)
}
</script>

<style scoped>
.task-selector {
  padding: 10px 0;
}

.selector-filters {
  display: flex;
  gap: 12px;
  margin-bottom: 16px;
  align-items: center;
}

.task-list {
  margin-bottom: 20px;
}

.cooperation-settings {
  background: #f5f7fa;
  padding: 16px;
  border-radius: 4px;
  margin-top: 16px;
}

.dialog-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.selected-info {
  color: #606266;
  font-size: 14px;
}
</style> 