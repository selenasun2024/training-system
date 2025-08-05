<template>
  <div class="cooperation-management">
    <!-- 协同管理标题 -->
    <div class="page-header">
      <h3>协同管理</h3>
    </div>

    <!-- 协同任务列表 -->
    <div class="cooperation-tasks">
      <!-- 空状态 -->
      <div v-if="existingCooperationTasks.length === 0" class="empty-state">
        <el-empty description="暂无协同作业">
          <el-button 
            v-if="props.editMode && availableHomeworks.length > 0"
            type="primary" 
            @click="showAddCooperationDialog"
          >
            添加第一个协同作业
          </el-button>
          <!-- 草稿状态下显示新增协同作业按钮 -->
          <el-button 
            v-else-if="props.projectStatus === 'DRAFT' && availableHomeworks.length > 0"
            type="primary" 
            @click="showAddCooperationDialog"
          >
            新增协同作业
          </el-button>
          <div v-else-if="availableHomeworks.length === 0" style="color: #999; font-size: 14px;">
            请先在任务管理中创建作业任务
          </div>
        </el-empty>
      </div>
      
      <!-- 协同任务卡片 -->
      <div 
        v-for="(task, taskIndex) in existingCooperationTasks" 
        :key="task.id"
        class="task-card"
        style="border: 1px solid #ebeef5; padding: 16px; margin: 16px 0; background: #fff; border-radius: 4px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);"
      >
        <!-- 任务头部信息 -->
        <div class="task-header">
          <div class="task-info">
            <h4 class="task-title">{{ task.category }}</h4>
            <div class="task-stats">
              <span class="stat">{{ task.count || 1 }}项目</span>
              <span class="stat">{{ task.groupProgress?.length || 0 }}组</span>
              <span class="stat">{{ getOverallProgress(task) }}%完成</span>
              <!-- 移除个人协同标签，只显示小组协同 -->
              <el-tag size="small" type="primary" v-if="task.config?.mode === 'group'">
                小组协同
              </el-tag>
            </div>
          </div>
          <div class="task-actions">
            <!-- 只在编辑模式下显示删除按钮 -->
            <el-button 
              v-if="props.editMode" 
              link 
              size="small" 
              style="color: #f56c6c" 
              @click="deleteTask(task)"
            >
              删除
            </el-button>
          </div>
        </div>

        <!-- 小组进度列表 -->
        <div class="group-section">
          
          <!-- 搜索和筛选 -->
          <div class="filter-section">
            <div class="filter-left">
              <el-select 
                :model-value="filters[task.id]?.status || ''"
                @update:model-value="(val) => updateFilter(task.id, 'status', val)"
                placeholder="状态" 
                style="width: 120px;"
                clearable
              >
                <el-option label="全部" value="" />
                <el-option label="未开始" value="未开始" />
                <el-option label="进行中" value="进行中" />
                <el-option label="已完成" value="已完成" />
              </el-select>
            </div>
            <div class="filter-right">
              <el-input
                :model-value="filters[task.id]?.search || ''"
                @update:model-value="(val) => updateFilter(task.id, 'search', val)"
                placeholder="请输入名称搜索"
                prefix-icon="Search"
                style="width: 240px;"
                clearable
              />
            </div>
          </div>

          <!-- 小组进度表格 -->
          <div class="group-table-wrapper">
            <el-table 
              :data="getFilteredGroups(task)" 
              border 
              stripe 
              size="small"
            >
              <el-table-column prop="groupName" label="小组名称" width="100" />
              <el-table-column label="小组人数" width="100">
                <template #default="{ row }">
                  {{ getGroupMemberCount(row) }}人
                </template>
              </el-table-column>
              <el-table-column prop="mentor" label="辅导员" width="100">
                <template #default="{ row }">
                  {{ row.mentor || '张老师' }}
                </template>
              </el-table-column>
              <el-table-column label="进度" width="120">
                <template #default="{ row }">
                  <el-progress 
                    :percentage="row.progress || 0" 
                    :stroke-width="6" 
                    :show-text="false"
                  />
                  <span style="margin-left: 8px; font-size: 12px;">{{ row.progress || 0 }}%</span>
                </template>
              </el-table-column>
              <el-table-column label="状态" width="100">
                <template #default="{ row }">
                  <el-tag 
                    size="small" 
                    :type="getStatusType(row.status || '未开始')"
                  >
                    {{ row.status || '未开始' }}
                  </el-tag>
                </template>
              </el-table-column>
              <el-table-column prop="submittedBy" label="提交者" width="100">
                <template #default="{ row }">
                  {{ row.submittedBy || '-' }}
                </template>
              </el-table-column>
              <el-table-column prop="submittedAt" label="提交时间" width="140">
                <template #default="{ row }">
                  {{ row.submittedAt || '-' }}
                </template>
              </el-table-column>
              <el-table-column label="备注" min-width="120">
                <template #default="{ row }">
                  <span style="color: #666; font-size: 12px;">{{ row.remark || '-' }}</span>
                </template>
              </el-table-column>
              <el-table-column label="操作" width="100" fixed="right">
                <template #default="{ row }">
                  <el-button 
                    type="link" 
                    size="small" 
                    @click="editGroupProgress(task, row)"
                  >
                    编辑
                  </el-button>
                </template>
              </el-table-column>
            </el-table>
          </div>

          <!-- 分页 -->
          <div class="pagination-wrapper">
            <span class="total-text">共 {{ task.groupProgress?.length || 0 }} 条</span>
            <el-pagination
              :current-page="pagination[task.id]?.currentPage || 1"
              :page-size="pagination[task.id]?.pageSize || 10"
              :total="task.groupProgress?.length || 0"
              layout="prev, pager, next"
              @current-change="(page) => handlePageChange(task.id, page)"
            />
          </div>
        </div>
      </div>
      
      <!-- 编辑模式下的添加协同作业区域 -->
      <div v-if="props.editMode" class="add-cooperation-section">
        <el-button 
          type="default" 
          style="width: 100%; border-style: dashed; border-color: #d9d9d9;"
          @click="showAddCooperationDialog"
          :disabled="availableHomeworks.length === 0"
        >
          <el-icon><Plus /></el-icon>
          添加协同作业
        </el-button>
      </div>

      <!-- 草稿状态下的新增协同作业按钮 -->
      <div v-if="props.projectStatus === 'DRAFT' && !props.editMode && existingCooperationTasks.length > 0 && availableHomeworks.length > 0" class="draft-add-cooperation">
        <el-button 
          type="primary" 
          @click="showAddCooperationDialog"
        >
          <el-icon><Plus /></el-icon>
          新增协同作业
        </el-button>
      </div>
    </div>

    <!-- 进度编辑对话框 -->
    <el-dialog v-model="editDialogVisible" title="编辑小组进度" width="500px">
      <el-form :model="editForm" label-width="100px">
        <el-form-item label="小组名称">
          <span>{{ editForm.groupName }}</span>
        </el-form-item>
        <el-form-item label="完成进度">
          <el-slider 
            v-model="editForm.progress" 
            :max="100"
            :step="10"
            show-stops
            show-tooltip
          />
          <span style="margin-left: 12px;">{{ editForm.progress }}%</span>
        </el-form-item>
        <el-form-item label="任务状态">
          <el-select v-model="editForm.status" style="width: 100%">
            <el-option label="未开始" value="未开始" />
            <el-option label="进行中" value="进行中" />
            <el-option label="已完成" value="已完成" />
          </el-select>
        </el-form-item>
        <el-form-item label="备注">
          <el-input 
            v-model="editForm.remark" 
            type="textarea" 
            :rows="3"
            placeholder="请输入备注信息"
          />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="editDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="saveProgress">保存</el-button>
      </template>
    </el-dialog>

    <!-- 添加协同作业对话框 -->
    <el-dialog v-model="addCooperationVisible" title="添加协同作业" width="600px">
      <el-form :model="addCooperationForm" label-width="120px" ref="addCooperationFormRef">
        <el-form-item label="选择作业" prop="selectedHomework" required>
          <el-select 
            v-model="addCooperationForm.selectedHomework" 
            placeholder="请选择要设为协同的作业"
            style="width: 100%"
            @change="handleHomeworkSelect"
          >
            <el-option
              v-for="homework in availableHomeworks"
              :key="homework.id"
              :label="homework.name"
              :value="homework.id"
            >
              <div class="homework-option">
                <el-tag size="small" type="primary">作业</el-tag>
                <span style="margin-left: 8px">{{ homework.name }}</span>
                <span v-if="homework.config?.deadline" style="margin-left: 8px; color: #999; font-size: 12px;">
                  截止：{{ homework.config.deadline }}
                </span>
              </div>
            </el-option>
          </el-select>
          <div style="margin-top: 8px; color: #666; font-size: 12px;">
            当前可用作业：{{ availableHomeworks.length }} 个
            <span v-if="availableHomeworks.length === 0" style="color: #f56c6c;">
              (请先在任务管理中创建作业任务)
            </span>
          </div>
        </el-form-item>

        <el-form-item label="协同规则">
          <el-alert
            title="协同作业规则"
            type="info"
            :closable="false"
            show-icon
          >
            <p>• 小组任意成员都可以提交作业</p>
            <p>• 一人提交后，整个小组标记为完成</p>
            <p>• 可以查看各小组的完成进度</p>
          </el-alert>
        </el-form-item>

        <el-form-item label="说明">
          <el-input
            v-model="addCooperationForm.description"
            type="textarea"
            :rows="3"
            placeholder="请输入协同作业的具体要求和说明..."
          />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="addCooperationVisible = false">取消</el-button>
        <el-button 
          type="primary" 
          @click="confirmAddCooperation"
          :disabled="!addCooperationForm.selectedHomework || availableHomeworks.length === 0"
        >
          添加
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, reactive, onMounted, watch, nextTick, onUnmounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Search } from '@element-plus/icons-vue'
import { useTrainingStageStore } from '../stores/trainingStage'
import { storeToRefs } from 'pinia'

// Props
const props = defineProps<{
  projectId?: string
  cooperationTasks?: any[]
  editMode?: boolean
  projectStatus?: string
}>()

// Emits
const emit = defineEmits<{
  'update-progress': [taskId: string, groupId: string, progress: number, status: string]
  'cooperation-added': [task: any]
}>()

// 响应式数据
const filters = ref<Record<string, { status: string; search: string }>>({})
const pagination = ref<Record<string, { currentPage: number; pageSize: number }>>({})
const editDialogVisible = ref(false)
const editForm = ref({
  taskId: '',
  groupId: '',
  groupName: '',
  progress: 0,
  status: '未开始',
  remark: ''
})

// 添加协同作业相关状态
const addCooperationVisible = ref(false)
const addCooperationFormRef = ref()
const addCooperationForm = ref({
  selectedHomework: '', // 确保是字符串类型
  description: ''
})

// 连接到TrainingStageStore获取实际任务数据
const stageStore = useTrainingStageStore()
const { stages } = storeToRefs(stageStore)

// 计算可用的作业列表（从项目的所有阶段中获取作业任务）
const availableHomeworks = computed(() => {
  const allTasks = stages.value.flatMap(stage => stage.tasks || [])
  
  // 过滤出作业类型的任务，且不是已经设为协同的任务
  const homeworkTasks = allTasks.filter(task => 
    task.type === 'homework' && 
    !task.config?.isCooperation  // 排除已经是协同的作业
  )
  
  return homeworkTasks
})

// 计算已存在的协同作业任务
const existingCooperationTasks = computed(() => {
  const allTasks = stages.value.flatMap(stage => stage.tasks || [])
  
  // 获取已标记为协同的作业任务
  const cooperationTasks = allTasks.filter(task => {
    const isCooperation = task.type === 'homework' && task.config?.isCooperation
    return isCooperation
  }).map(task => ({
    id: task.id,
    category: task.name,
    count: 1,
    type: 'cooperation',
    config: task.config,
    groupProgress: [
      { groupId: '1', groupName: '第1组', progress: 0, status: '未开始', memberCount: 4, remark: '' },
      { groupId: '2', groupName: '第2组', progress: 0, status: '未开始', memberCount: 5, remark: '' },
      { groupId: '3', groupName: '第3组', progress: 0, status: '未开始', memberCount: 3, remark: '' },
      { groupId: '4', groupName: '第4组', progress: 0, status: '未开始', memberCount: 4, remark: '' }
    ]
  }))
  
  return cooperationTasks
})

// 初始化filters和pagination
const initializeFilters = () => {
  // 为所有协同任务初始化filters
  existingCooperationTasks.value.forEach(task => {
    if (!filters.value[task.id]) {
      filters.value[task.id] = { status: '', search: '' }
    }
    if (!pagination.value[task.id]) {
      pagination.value[task.id] = { currentPage: 1, pageSize: 10 }
    }
  })
  
  // 也为props传入的任务初始化
  if (props.cooperationTasks) {
    props.cooperationTasks.forEach(task => {
      if (!filters.value[task.id]) {
        filters.value[task.id] = { status: '', search: '' }
      }
      if (!pagination.value[task.id]) {
        pagination.value[task.id] = { currentPage: 1, pageSize: 10 }
      }
    })
  }
}

// 计算整体进度
const getOverallProgress = (task: any) => {
  if (!task.groupProgress || task.groupProgress.length === 0) return 0
  const totalProgress = task.groupProgress.reduce((sum: number, group: any) => sum + (group.progress || 0), 0)
  return Math.round(totalProgress / task.groupProgress.length)
}

// 获取完成数量
const getCompletedCount = (task: any) => {
  if (!task.groupProgress) return 0
  return task.groupProgress.filter((group: any) => group.status === '已完成').length
}

// 获取任务分数
const getTaskScore = (task: any) => {
  return task.config?.score || 0
}

// 获取批改人
const getReviewer = (task: any) => {
  return task.config?.reviewer || '辅导员批改'
}

// 获取小组成员数量
const getGroupMemberCount = (group: any) => {
  return group.memberCount || parseInt(group.groupName?.match(/\d+/)?.[0] || '0') + 2
}

// 获取状态类型
const getStatusType = (status: string) => {
  const statusMap: Record<string, string> = {
    '未开始': 'info',
    '进行中': 'warning',
    '已完成': 'success'
  }
  return statusMap[status] || 'info'
}

// 获取过滤后的小组
const getFilteredGroups = (task: any) => {
  if (!task.groupProgress) return []
  
  // 确保过滤器已初始化
  if (!filters.value[task.id]) {
    filters.value[task.id] = { status: '', search: '' }
  }
  // 确保分页已初始化
  if (!pagination.value[task.id]) {
    pagination.value[task.id] = { currentPage: 1, pageSize: 10 }
  }
  
  let groups = [...task.groupProgress]
  const filter = filters.value[task.id]
  
  if (filter?.status) {
    groups = groups.filter(group => group.status === filter.status)
  }
  
  if (filter?.search) {
    groups = groups.filter(group => 
      group.groupName.toLowerCase().includes(filter.search.toLowerCase())
    )
  }
  
  // 分页处理
  const page = pagination.value[task.id]
  const start = (page.currentPage - 1) * page.pageSize
  const end = start + page.pageSize
  groups = groups.slice(start, end)
  
  return groups
}

// 方法

const deleteTask = async (task: any) => {
  try {
    await ElMessageBox.confirm(`确认删除协同任务"${task.category}"？`, '确认删除', {
      type: 'warning',
      confirmButtonText: '确认删除',
      cancelButtonText: '取消'
    })

    // 使用 stageStore 的 removeTask 方法删除任务
    const success = await stageStore.removeTask(task.id, props.projectId)
    
    if (success) {
      // 删除成功后，清理本地存储的协同配置
      const storageKey = `cooperation_config_${props.projectId || 'default'}`
      const savedConfigs = localStorage.getItem(storageKey)
      if (savedConfigs) {
        try {
          const configs = JSON.parse(savedConfigs)
          delete configs[task.id]
          localStorage.setItem(storageKey, JSON.stringify(configs))
        } catch (error) {
          console.warn('清理协同配置失败:', error)
        }
      }
      
      ElMessage.success('协同任务删除成功')
    }
  } catch (error) {
    if (error !== 'cancel') {
      console.error('删除协同任务失败:', error)
      ElMessage.error('删除协同任务失败')
    }
  }
}

const editGroupProgress = (task: any, group: any) => {
  editForm.value = {
    taskId: task.id,
    groupId: group.groupId,
    groupName: group.groupName,
    progress: group.progress || 0,
    status: group.status || '未开始',
    remark: group.remark || ''
  }
  editDialogVisible.value = true
}

const saveProgress = () => {
  const { taskId, groupId, progress, status } = editForm.value
  emit('update-progress', taskId, groupId, progress, status)
  editDialogVisible.value = false
  ElMessage.success('进度更新成功')
}

const handlePageChange = (taskId: string, page: number) => {
  if (pagination.value[taskId]) {
    pagination.value[taskId].currentPage = page
  }
}

// 添加协同作业相关方法
const showAddCooperationDialog = () => {
  addCooperationForm.value = {
    selectedHomework: '',
    description: ''
  }
  addCooperationVisible.value = true
}

const handleHomeworkSelect = (homeworkId: string) => {
  // 确保选择的是字符串ID而不是数组
  if (Array.isArray(homeworkId)) {
    addCooperationForm.value.selectedHomework = homeworkId[0] || '';
  } else {
    addCooperationForm.value.selectedHomework = String(homeworkId); // 强制转换为字符串
  }
  
  const selectedHomework = availableHomeworks.value.find(hw => hw.id === addCooperationForm.value.selectedHomework)
  if (selectedHomework) {
  } else {
  }
}

// 添加监听器来监控addCooperationForm的变化
watch(() => addCooperationForm.value.selectedHomework, (newVal, oldVal) => {
  // 如果发现变成了数组，立即修正
  if (Array.isArray(newVal)) {
    addCooperationForm.value.selectedHomework = newVal[0] || '';
  }
}, { immediate: true });

const confirmAddCooperation = async () => {
  try {
    console.log('🚀 开始添加协同作业...')
    console.log('🔍 当前表单数据:', addCooperationForm.value)
    console.log('🔍 可用作业列表:', availableHomeworks.value.map(hw => ({ id: hw.id, name: hw.name })))
    
    // 确保selectedHomework是字符串
    const selectedHomeworkId = Array.isArray(addCooperationForm.value.selectedHomework) 
      ? addCooperationForm.value.selectedHomework[0] 
      : addCooperationForm.value.selectedHomework

    console.log('🔍 选择的作业ID:', selectedHomeworkId)

    if (!selectedHomeworkId) {
      ElMessage.error('请选择要设为协同的作业')
      return
    }

    const selectedHomework = availableHomeworks.value.find(
      hw => hw.id === selectedHomeworkId
    )

    console.log('🔍 找到的作业对象:', selectedHomework)

    if (!selectedHomework) {
      ElMessage.error('所选作业不存在')
      return
    }

    // 更新原作业任务，标记为协同作业
    const updatedConfig = {
      ...selectedHomework.config,
      isCooperation: true,
      cooperationMode: 'group',
      description: addCooperationForm.value.description
    }
    
    // 直接更新任务对象，确保立即生效
    selectedHomework.config = updatedConfig
    
    // 同时使用stageStore更新任务配置，传递projectId参数
    await stageStore.updateTaskConfig(selectedHomework.id, { config: updatedConfig }, props.projectId)

    // 保存协同作业配置到localStorage
    saveCooperationConfig(selectedHomework.id, updatedConfig)
    
    // 创建协同作业进度跟踪
    const newCooperationTask = {
      id: selectedHomework.id,
      category: selectedHomework.name,
      count: 1,
      type: 'cooperation',
      config: updatedConfig,
      groupProgress: [
        { groupId: '1', groupName: '第1组', progress: 0, status: '未开始', memberCount: 4, remark: '' },
        { groupId: '2', groupName: '第2组', progress: 0, status: '未开始', memberCount: 5, remark: '' },
        { groupId: '3', groupName: '第3组', progress: 0, status: '未开始', memberCount: 3, remark: '' },
        { groupId: '4', groupName: '第4组', progress: 0, status: '未开始', memberCount: 4, remark: '' }
      ]
    }

    ElMessage.success(`成功将"${selectedHomework.name}"设为协同作业`)
    addCooperationVisible.value = false
    
    // 重置表单
    addCooperationForm.value = {
      selectedHomework: '',
      description: ''
    }
    
    // 初始化新任务的filters
    filters.value[newCooperationTask.id] = { status: '', search: '' }
    pagination.value[newCooperationTask.id] = { currentPage: 1, pageSize: 10 }
    
    // 触发视图更新
    await nextTick()
    
    // 触发更新事件
    emit('cooperation-added', newCooperationTask)
    
  } catch (error) {
    console.error('添加协同作业失败:', error)
    ElMessage.error('添加协同作业失败')
  }
}

// 协同配置持久化方法
const getCooperationConfigStorageKey = () => {
  const key = `cooperation-config-${props.projectId}`;
  return key;
};

const saveCooperationConfig = (taskId: string, config: any) => {
  if (props.projectId) {
    const storageKey = getCooperationConfigStorageKey();
    const existingConfig = JSON.parse(localStorage.getItem(storageKey) || '{}');
    existingConfig[taskId] = config;
    localStorage.setItem(storageKey, JSON.stringify(existingConfig));
  }
};

const loadCooperationConfigs = async () => {
  if (!props.projectId) {
    console.warn('⚠️ projectId为空，无法加载协同配置');
    return;
  }

  const storageKey = getCooperationConfigStorageKey();
  const savedConfigs = localStorage.getItem(storageKey);
  
  console.log('🔍 加载协同配置，项目ID:', props.projectId);
  console.log('🔍 存储键:', storageKey);
  console.log('🔍 保存的配置:', savedConfigs);
  
  if (!savedConfigs) {
    console.log('📭 localStorage中无协同配置数据');
    return;
  }

  try {
    const configs = JSON.parse(savedConfigs);
    const configKeys = Object.keys(configs);
    
    console.log('🔍 配置键列表:', configKeys);
    
    // 获取当前的所有任务
    const allTasks = stages.value.flatMap(stage => stage.tasks || []);
    console.log('🔍 当前所有任务数量:', allTasks.length);
    console.log('🔍 当前任务ID列表:', allTasks.map(t => t.id));
    
    // 应用配置到store中的任务
    let restoredCount = 0;
    for (const taskId of configKeys) {
      const config = configs[taskId];
      const task = allTasks.find(t => t.id === taskId);
      
      console.log(`🔍 处理任务 ${taskId}:`, task ? '找到' : '未找到');
      
      if (task) {
        // 直接更新任务配置，确保isCooperation标记生效
        const updatedConfig = { ...task.config, ...config };
        task.config = updatedConfig;
        
        // 同步到store以确保持久性
        await stageStore.updateTaskConfig(taskId, { config: updatedConfig }, props.projectId);
        
        console.log(`✅ 任务 ${taskId} 配置已更新:`, updatedConfig);
        restoredCount++;
      }
    }
    
    // 强制触发响应式更新
    await nextTick();
    
    console.log(`🎉 成功恢复 ${restoredCount} 个协同作业配置`);
    console.log('🔍 恢复后的协同任务数量:', existingCooperationTasks.value.length);
    
    if (restoredCount > 0) {
      ElMessage.success(`成功恢复 ${restoredCount} 个协同作业配置`);
    }
    
  } catch (error) {
    console.error('❌ 解析协同配置失败:', error, savedConfigs);
    ElMessage.error('恢复协同配置失败');
  }
};

// 小组成员提交状态检查和自动完成逻辑
const checkGroupSubmissionStatus = async (cooperationTask: any) => {
  try {
    // 模拟检查小组成员提交状态的API调用
    // 实际应该调用后端API检查作业提交状态
    const groupSubmissions = await mockCheckGroupSubmissions(cooperationTask.config?.originalHomeworkId)
    
    // 更新小组进度
    cooperationTask.groupProgress?.forEach((group: any) => {
      const groupSubmission = groupSubmissions.find((sub: any) => sub.groupId === group.groupId)
      if (groupSubmission && groupSubmission.hasSubmission && group.status !== '已完成') {
        // 一人提交，整个小组标记为完成
        group.status = '已完成'
        group.progress = 100
        group.submittedBy = groupSubmission.submittedBy
        group.submittedAt = groupSubmission.submittedAt
        
      }
    })
    
  } catch (error) {
    console.error('检查小组提交状态失败:', error)
  }
}

// 模拟检查小组成员提交状态的API
const mockCheckGroupSubmissions = async (homeworkId: string) => {
  // 模拟API延迟
  await new Promise(resolve => setTimeout(resolve, 100))
  
  // 模拟返回小组提交状态
  return [
    { groupId: '1', hasSubmission: true, submittedBy: '张三', submittedAt: '2025-01-17 10:30' },
    { groupId: '2', hasSubmission: false },
    { groupId: '3', hasSubmission: true, submittedBy: '王五', submittedAt: '2025-01-17 11:15' },
    { groupId: '4', hasSubmission: false }
  ]
}

// 实时监听小组提交状态
const startProgressMonitoring = () => {
  if (!props.cooperationTasks || props.cooperationTasks.length === 0) return
  
  // 每30秒检查一次小组提交状态
  const interval = setInterval(() => {
    props.cooperationTasks?.forEach(task => {
      checkGroupSubmissionStatus(task)
    })
  }, 30000) // 30秒间隔
  
  // 组件卸载时清理定时器
  onUnmounted(() => {
    clearInterval(interval)
  })
}

// 手动刷新进度
const refreshProgressStatus = () => {
  ElMessage.info('正在刷新小组进度状态...')
  props.cooperationTasks?.forEach(task => {
    checkGroupSubmissionStatus(task)
  })
  ElMessage.success('进度状态已刷新')
}

// 更新过滤器和分页
const updateFilter = (taskId: string, key: string, value: string) => {
  if (filters.value[taskId]) {
    filters.value[taskId][key] = value
  }
}

// 生命周期
onMounted(async () => {
  console.log('🚀 CooperationManagement 组件挂载，项目ID:', props.projectId)
  
  initializeFilters()
  
  // 如果有项目ID，加载项目任务数据和协同配置
  if (props.projectId) {
    try {
      console.log('🔄 开始加载项目任务数据...')
      await stageStore.loadProjectTasks(props.projectId)
      console.log('✅ 项目任务数据加载完成')
      
      // 等待一下，确保任务数据完全加载后再恢复协同配置
      await nextTick()
      console.log('🔄 开始恢复协同配置...')
      await loadCooperationConfigs()
      console.log('✅ 协同配置恢复完成')
      
    } catch (error) {
      console.error('❌ 协同管理：项目任务数据加载失败', error)
      ElMessage.error('加载协同管理数据失败')
    }
  } else {
    console.warn('⚠️ 协同管理：projectId为空，无法加载数据')
  }
  
  // 开始监听小组提交状态
  startProgressMonitoring()
  // 初始检查一次
  setTimeout(() => {
    props.cooperationTasks?.forEach(task => {
      checkGroupSubmissionStatus(task)
    })
  }, 1000)
})

// 监听props变化
watch(() => props.cooperationTasks, () => {
  initializeFilters()
  // 新的协同任务添加后也要检查状态
  props.cooperationTasks?.forEach(task => {
    checkGroupSubmissionStatus(task)
  })
}, { immediate: true })

// 监听计算属性变化
watch(existingCooperationTasks, () => {
  initializeFilters()
}, { immediate: true })

// 监听projectId变化，确保在项目ID可用时加载配置
watch(() => props.projectId, async (newProjectId, oldProjectId) => {
  // 只在projectId真正发生变化时才加载，避免初始化时的重复加载
  if (newProjectId && newProjectId !== oldProjectId) {
    console.log('🔄 项目ID变化，重新加载数据:', oldProjectId, '->', newProjectId)
    try {
      await stageStore.loadProjectTasks(newProjectId);
      await nextTick();
      await loadCooperationConfigs();
      console.log('✅ 项目ID变化时数据加载完成')
    } catch (error) {
      console.error('❌ projectId变化时加载失败:', error);
      ElMessage.error('切换项目时加载数据失败')
    }
  }
})

// 监听stages变化，当数据更新后恢复协同配置（添加防抖，避免过度触发）
let configLoadTimeout: NodeJS.Timeout | null = null;
watch(() => stages.value.length, (newLength, oldLength) => {
  // 只在stages数量发生变化时才触发，避免深度监听带来的性能问题
  if (newLength > 0 && newLength !== oldLength && props.projectId) {
    console.log('🔄 stages数量变化，准备重新加载协同配置:', oldLength, '->', newLength)
    // 防抖处理，避免短时间内多次触发
    if (configLoadTimeout) clearTimeout(configLoadTimeout);
    configLoadTimeout = setTimeout(async () => {
      try {
        await loadCooperationConfigs();
        console.log('✅ stages变化时协同配置加载完成')
      } catch (error) {
        console.error('❌ stages变化时加载协同配置失败:', error)
      }
    }, 100);
  }
})
</script>

<style scoped>
.cooperation-management {
  padding: 20px;
  background: #fff;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  padding-bottom: 16px;
  border-bottom: 1px solid #e4e7ed;
}

.page-header h3 {
  margin: 0;
  font-size: 20px;
  font-weight: 600;
  color: #303133;
}

.header-actions {
  display: flex;
  gap: 12px;
  align-items: center;
}

.homework-option {
  display: flex;
  align-items: center;
}

.submission-info {
  font-size: 12px;
}

.submitted-by {
  color: #409eff;
  font-weight: 500;
}

.submitted-at {
  color: #909399;
  margin-top: 2px;
}

.not-submitted {
  color: #c0c4cc;
  font-size: 12px;
}

.cooperation-tasks {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.add-cooperation-section {
  margin-top: 16px;
  padding: 20px;
  border: 2px dashed #d9d9d9;
  border-radius: 8px;
  background: #fafafa;
  text-align: center;
}

.empty-state {
  padding: 40px 20px;
  text-align: center;
}

.task-card {
  border: 1px solid #e4e7ed;
  border-radius: 8px;
  overflow: hidden;
  background: #fff;
}

.task-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  background: #f8f9fa;
  border-bottom: 1px solid #e4e7ed;
}

.task-info {
  flex: 1;
}

.task-title {
  margin: 0 0 8px 0;
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}

.task-stats {
  display: flex;
  gap: 16px;
  align-items: center;
}

.stat {
  font-size: 13px;
  color: #606266;
  padding: 2px 8px;
  background: #fff;
  border-radius: 4px;
  border: 1px solid #e4e7ed;
}

.task-actions {
  display: flex;
  gap: 8px;
}

.group-section {
  padding: 20px;
}

.section-title {
  margin: 0 0 16px 0;
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}

.filter-section {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.group-table-wrapper {
  margin-bottom: 16px;
}

.pagination-wrapper {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.total-text {
  font-size: 14px;
  color: #606266;
}

.draft-add-cooperation {
  margin-top: 24px;
  padding: 16px;
  text-align: center;
}
</style> 