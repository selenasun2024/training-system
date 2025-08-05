<template>
  <div class="task-list">

    <!-- 编辑模式下的任务类型选择器 -->
    <div v-if="isActualEditMode" class="task-type-selector">
      <!-- 当前选中阶段提示 -->
      <div v-if="stages.length > 1" class="current-stage-tip">
        <el-icon><InfoFilled /></el-icon>
        <span>当前选中阶段：<strong>{{ getCurrentStageName() }}</strong>，新添加的任务将加入此阶段</span>
      </div>
      <!-- 这里可以集成TaskTypeSelector的内容 -->
    </div>

    <!-- 按阶段分组的任务列表 -->
    <div v-if="stages.length > 0" class="stage-groups">
      <div 
        v-for="stage in stages" 
        :key="stage.id"
        class="stage-group"
        :class="{ 
          'stage-selected': isActualEditMode && stage.id === activeStageId,
          'clickable': isActualEditMode
        }"
        @click="isActualEditMode ? selectStage(stage.id) : null"
      >
        <!-- 阶段标题行 -->
        <div class="stage-header">
          <div class="stage-info">
            <h3 class="stage-name">{{ stage.name }}</h3>
            <div class="stage-meta">
              <span v-if="stage.description" class="stage-description">{{ stage.description }}</span>
              <span class="task-count">
                {{ getStageTaskCount(stage) }}个任务
                <template v-if="!isActualEditMode">
                  (已完成 {{ getCompletedTaskCount(stage) }}/{{ getStageTaskCount(stage) }})
                </template>
              </span>
            </div>
          </div>
          
          <!-- 编辑模式下的阶段操作 -->
          <div v-if="isActualEditMode" class="stage-actions" @click.stop>
            <el-button size="small" type="text" @click="editStage(stage)">
              <el-icon><Edit /></el-icon>
              编辑
            </el-button>
            <el-button size="small" type="text" @click="deleteStage(stage.id)" style="color: #f56c6c">
              <el-icon><Delete /></el-icon>
              删除
            </el-button>
          </div>
          
          <!-- 执行模式下的进度条 -->
          <div v-else-if="!isActualEditMode" class="stage-progress">
            <el-progress 
              :percentage="getStageCompletionRate(stage)" 
              :stroke-width="6"
              :show-text="true"
              :format="() => `${getCompletedTaskCount(stage)}/${getStageTaskCount(stage)}`"
            />
          </div>
        </div>

        <!-- 阶段任务表格 -->
        <div class="stage-tasks">
          <el-table 
            :data="getStageFilteredTasks(stage)" 
            size="small"
            :show-header="stages.length > 1"
          >
            <el-table-column type="index" label="序号" width="60" />
            
            <el-table-column label="任务类型" width="100">
              <template #default="{ row }">
                <el-tag 
                  :type="getTaskTypeConfig(row.type)?.color || 'info'"
                  size="small"
                >
                  {{ getTypeLabel(row.type) }}
                </el-tag>
              </template>
            </el-table-column>
            
            <el-table-column prop="name" label="任务名称" min-width="180" />
            
                         <!-- 只在多阶段且执行模式下显示所属阶段 -->
             <el-table-column v-if="stages.length > 1 && !isActualEditMode" prop="stageName" label="所属阶段" width="120">
              <template #default="{ row }">
                <el-tag type="info" size="small">
                  {{ stage.name }}
                </el-tag>
              </template>
            </el-table-column>
            
            <el-table-column label="预计时长" width="90">
              <template #default="{ row }">
                <span v-if="row.config?.estimatedHours">
                  {{ row.config.estimatedHours }}h
                </span>
                <span v-else>-</span>
              </template>
            </el-table-column>
            
                         <el-table-column label="状态" width="100" v-if="!isActualEditMode">
              <template #default="{ row }">
                <el-tag :type="getStatusType(row.status)" size="small">
                  {{ row.status || '未开始' }}
                </el-tag>
              </template>
            </el-table-column>
            
            <el-table-column label="操作" width="160" fixed="right">
              <template #default="{ row }">
                <!-- 编辑模式：显示编辑和删除按钮 -->
                <template v-if="isActualEditMode">
                  <el-button
                    v-if="isEditable(row.type)"
                    size="small"
                    type="primary"
                    @click="openEditor(row)"
                  >
                    编辑
                  </el-button>
                  <el-button size="small" type="danger" @click="confirmDeleteTask(row.id)">
                    删除
                  </el-button>
                </template>
                
                <!-- 执行模式：显示管理按钮 -->
                <template v-else>
                  <el-button
                    size="small"
                    type="primary"
                    @click="handleTaskManagement(row)"
                  >
                    管理
                  </el-button>
                </template>
              </template>
            </el-table-column>
            <!-- 🔧 优化：空阶段显示紧凑提示行 -->
            <template v-if="getStageFilteredTasks(stage).length === 0" #empty>
              <div class="empty-stage-compact">
                <span class="empty-text" v-if="isActualEditMode">
                  该阶段暂无任务，请选中此阶段后点击上方"+ 添加任务"按钮
                </span>
                <span class="empty-text" v-else>
                  该阶段暂无任务
                </span>
              </div>
            </template>
          </el-table>
        </div>
      </div>
    </div>

    <!-- 无阶段时的提示 -->
    <div v-else class="no-stages">
      <el-empty description="暂无阶段，请先添加阶段" />
    </div>

    <!-- 编辑模式下的添加阶段按钮 -->
    <div v-if="isActualEditMode" class="add-stage-section">
      <el-button 
        type="text" 
        :icon="Plus" 
        @click="addNewStage"
        class="add-stage-btn"
      >
        添加阶段
      </el-button>
    </div>

    <!-- 阶段编辑对话框 -->
    <el-dialog
      v-model="stageEditVisible"
      title="编辑阶段"
      width="500px"
    >
      <el-form :model="editingStageForm" label-width="80px">
        <el-form-item label="阶段名称">
          <el-input v-model="editingStageForm.name" placeholder="请输入阶段名称" />
        </el-form-item>
        <el-form-item label="阶段描述">
          <el-input
            v-model="editingStageForm.description"
            type="textarea"
            :rows="3"
            placeholder="请输入阶段描述（可选）"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="stageEditVisible = false">取消</el-button>
        <el-button type="primary" @click="saveStageEdit">确定</el-button>
      </template>
    </el-dialog>
  </div>
  
  <!-- 动态编辑器 -->
  <component
    :is="currentEditorComponent"
    v-if="editorVisible && currentEditorComponent"
    :key="`editor-${currentTaskData?.id || 'new'}`"
    :visible="editorVisible"
    :initialData="currentTaskData"
    v-bind="editorProps"
    @update:visible="handleEditorClose"
  />
</template>

<script setup lang="ts">
import { computed, ref, nextTick, markRaw } from 'vue';
import { useTrainingStageStore } from '../stores/trainingStage';
import { storeToRefs } from 'pinia';
import { TASK_EDIT_REGISTRY } from '../constants/taskEditRegistry';
import { getTaskTypeConfig, getEnabledTaskTypes } from '../constants/taskTypeCategories';
import { ElMessage, ElMessageBox } from 'element-plus';
import { Clock, Calendar, Sort, Edit, Delete, Plus, InfoFilled } from '@element-plus/icons-vue';

interface Props {
  projectStatus?: 'DRAFT' | 'ACTIVE' | 'COMPLETED';
  taskEditMode?: boolean;
  projectId?: string;
}

interface Emits {
  (e: 'switch-to-management', data: { type: string; task: any; title: string }): void;
}

const props = withDefaults(defineProps<Props>(), {
  projectStatus: 'DRAFT',
  taskEditMode: false,
  projectId: undefined
});

const emit = defineEmits<Emits>();

const store = useTrainingStageStore();
const { stages, activeStageId, isEditMode, isExecutionMode } = storeToRefs(store);
const { updateTask, removeTask, addStage, setStageName, setStageDescription, removeStage, setActiveStage } = store;

// 状态管理
const stageEditVisible = ref(false);
const editingStageForm = ref({
  id: '',
  name: '',
  description: ''
});

// 动态编辑器状态
const editorVisible = ref(false);
const currentEditorComponent = ref(null);
const editorProps = ref({});
const currentTaskData = ref(null);

// 计算属性
const isNewProject = computed(() => !props.projectStatus || props.projectStatus === 'DRAFT');

// 实际的编辑模式：结合store状态和props
const isActualEditMode = computed(() => 
  isEditMode.value || props.projectStatus === 'DRAFT' || props.taskEditMode
);

const taskTypes = computed(() => getEnabledTaskTypes());

// 阶段相关方法
const getStageTaskCount = (stage: any) => {
  return stage.tasks?.length || 0;
};

const getCompletedTaskCount = (stage: any) => {
  return stage.tasks?.filter((task: any) => task.status === '已完成').length || 0;
};

const getStageCompletionRate = (stage: any) => {
  const total = getStageTaskCount(stage);
  if (total === 0) return 0;
  const completed = getCompletedTaskCount(stage);
  return Math.round((completed / total) * 100);
};

const getStageFilteredTasks = (stage: any) => {
  return stage.tasks?.filter((task: any) => task.type !== 'cooperation') || [];
};

// 阶段操作方法
const selectStage = (stageId: string) => {
  setActiveStage(stageId);
  console.log('选中阶段:', stageId);
};

const editStage = (stage: any) => {
  editingStageForm.value = {
    id: stage.id,
    name: stage.name,
    description: stage.description || ''
  };
  stageEditVisible.value = true;
};

const saveStageEdit = async () => {
  const { id, name, description } = editingStageForm.value;
  
  try {
    // 🔧 修复：传递projectId参数以确保调用后端API
    await setStageName(id, name, props.projectId);
    await setStageDescription(id, description, props.projectId);
    ElMessage.success('阶段信息已更新');
    stageEditVisible.value = false;
  } catch (error) {
    console.error('更新阶段信息失败:', error);
    ElMessage.error('更新阶段信息失败');
  }
};

const deleteStage = async (stageId: string) => {
  ElMessageBox.confirm(
    '确定要删除这个阶段吗？删除后阶段内的所有任务也将被删除。',
    '删除确认',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    }
  ).then(async () => {
    try {
      await removeStage(stageId, props.projectId);
      ElMessage.success('阶段已删除');
    } catch (error: any) {
      console.error('删除阶段失败:', error);
      const errorMessage = error?.response?.data?.message || 
                          error?.response?.data?.error || 
                          error?.message || 
                          '删除阶段失败';
      ElMessage.error('删除阶段失败：' + errorMessage);
    }
  }).catch(() => {
    // 用户取消删除
  });
};

// 🔧 新增：将数字转换为中文数字的工具函数
const numberToChinese = (num: number): string => {
  const chineseNumbers = ['零', '一', '二', '三', '四', '五', '六', '七', '八', '九', '十'];
  if (num <= 10) {
    return chineseNumbers[num];
  }
  // 对于大于10的数字，这里简化处理，可以根据需要扩展
  return `${num}`;
};

const addNewStage = async () => {
  try {
    const stageCount = stages.value.length;
    const newStageName = `阶段${numberToChinese(stageCount + 1)}`;  // 🔧 修改：使用中文数字命名
    
    await addStage(newStageName, '新建培训阶段', props.projectId);
    ElMessage.success('阶段已添加');
  } catch (error) {
    console.error('添加阶段失败:', error);
    ElMessage.error('添加阶段失败');
  }
};

// 移除了quickAddTask方法，因为改为引导用户使用上方按钮

// 任务相关方法
const getTypeLabel = (type: string) => {
  const config = taskTypes.value.find(t => t.type === type);
  return config?.label || type;
};

const getStatusType = (status: string) => {
  switch (status) {
    case '已完成':
      return 'success';
    case '进行中':
      return 'warning';
    case '未开始':
    default:
      return 'info';
  }
};

const isEditable = (type: string) => {
  return Boolean(TASK_EDIT_REGISTRY[type]);
};

const openEditor = (task: any) => {
  const meta = TASK_EDIT_REGISTRY[task.type];
  if (!meta) {
    ElMessage.warning('该任务类型不支持编辑');
    return;
  }
  
  // 设置编辑器组件和数据
  currentEditorComponent.value = markRaw(meta.component);
  currentTaskData.value = task;
  
  // 构建传递给编辑器的props
  // 如果有自定义的props构建函数，使用它来获取特定的props
  const customProps = meta.buildProps ? meta.buildProps(task) : {};
  editorProps.value = { ...customProps };
  
  // 显示编辑器
  editorVisible.value = true;
};

const handleEditorClose = (visible: boolean) => {
  editorVisible.value = visible;
  if (!visible) {
    // 清理状态
    currentEditorComponent.value = null;
    currentTaskData.value = null;
    editorProps.value = {};
  }
};

const confirmDeleteTask = (taskId: string) => {
  ElMessageBox.confirm('确定要删除这个任务吗？', '删除确认', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning',
    center: true,
    showClose: true,
    closeOnClickModal: false,
    closeOnPressEscape: true,
  }).then(async () => {
    try {
      await removeTask(taskId, props.projectId);
      ElMessage.success('任务已删除');
    } catch (error: any) {
      console.error('删除任务失败:', error);
      const errorMessage = error?.response?.data?.message || 
                          error?.response?.data?.error || 
                          error?.message || 
                          '删除任务失败';
      ElMessage.error('删除任务失败：' + errorMessage);
    }
  }).catch(() => {
    // 用户取消删除
  });
};

const handleTaskManagement = (task: any) => {
  console.log(`任务管理操作 - 任务类型: ${task.type}`, task);
  
  // 根据任务类型确定管理界面类型
  let managementType = '';
  switch (task.type) {
    case 'homework':
      managementType = 'homework';
      break;
    case 'attendance':
      managementType = 'attendance';
      break;
    case 'cooperation':
      managementType = 'cooperation';
      break;
    case 'exam':
      managementType = 'exam';
      break;
    case 'face-to-face':
      managementType = 'face-to-face';
      break;
    case 'activity':
      managementType = 'activity';
      break;
    case 'discussion':
      managementType = 'discussion';
      break;
    case 'online-course':
      managementType = 'online-course';
      break;
    case 'questionnaire':
      managementType = 'questionnaire';
      break;
    default:
      managementType = 'cooperation';
      console.log('使用默认管理页面:', task.type);
  }
  
  // 发送事件给父组件，切换到管理界面
  emit('switch-to-management', {
    type: managementType,
    task: task,
    title: getManagementTitle(managementType, task)
  });
};

// 获取管理界面标题
const getManagementTitle = (type: string, task: any) => {
  const titles: Record<string, string> = {
    homework: '作业管理',
    attendance: '考勤管理', 
    cooperation: '协同管理',
    activity: '活动管理',
    discussion: '讨论管理',
    'face-to-face': '面授管理',
    'online-course': '在线课程管理',
    exam: '考试管理',
    questionnaire: '问卷管理',
    score: '成绩管理'
  };
  return `${titles[type] || '任务管理'} - ${task.name}`;
};

// 获取任务类型配置
const getTaskTypeConfig = (type: string) => {
  return taskTypes.value.find(t => t.type === type);
};

// 获取当前选中阶段名称
const getCurrentStageName = () => {
  const currentStage = stages.value.find(s => s.id === activeStageId.value);
  return currentStage?.name || '未选中';
};
</script>

<style scoped>
.task-list {
  background: #fff;
  border-radius: 8px;
  overflow: hidden;
}

/* 阶段分组样式 */
.stage-groups {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.stage-group {
  border: 1px solid #e8e8e8;
  border-radius: 8px;
  overflow: hidden;
  background: #fff;
  transition: all 0.3s ease;
}

/* 只在编辑模式下显示可点击样式 */
.stage-group.clickable {
  cursor: pointer;
}

.stage-group.clickable:hover {
  border-color: #c0c4cc;
}

.stage-group.stage-selected {
  border-color: #409eff;
  border-width: 2px;
  box-shadow: 0 0 8px rgba(64, 158, 255, 0.2);
}

.stage-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  background: #f8f9fa;
  border-bottom: 1px solid #e8e8e8;
}

.stage-info {
  flex: 1;
}

.stage-name {
  margin: 0 0 8px 0;
  font-size: 16px;
  font-weight: 600;
  color: #333;
}

.stage-meta {
  display: flex;
  gap: 16px;
  align-items: center;
}

.stage-description {
  color: #666;
  font-size: 14px;
}

.task-count {
  color: #999;
  font-size: 14px;
}

.stage-actions {
  display: flex;
  gap: 8px;
  align-items: center;
}

.stage-progress {
  min-width: 200px;
}

.stage-tasks {
  /* 任务表格容器 */
}

/* 空阶段样式 */
.empty-stage {
  padding: 40px 20px;
  text-align: center;
  color: #999;
}

/* 🔧 新增：紧凑的空状态显示 */
.empty-stage-compact {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 16px 20px;
  color: #909399;
  background-color: #fafafa;
  border-radius: 4px;
  min-height: 60px;
}

.empty-text {
  font-size: 14px;
  line-height: 1.5;
}

/* 无阶段提示 */
.no-stages {
  padding: 60px 20px;
  text-align: center;
}

/* 添加阶段按钮 */
.add-stage-section {
  margin-top: 20px;
  padding: 10px 0;
  text-align: left;
}

.add-stage-btn {
  color: #409eff;
  background: none;
  border: none;
  padding: 8px 0;
  font-size: 14px;
}

.add-stage-btn:hover {
  color: #337ecc;
  background: none;
}

/* 任务类型选择器 */
.task-type-selector {
  margin-bottom: 20px;
  padding: 16px;
  background: #f8f9fa;
  border: 1px solid #e8e8e8;
  border-radius: 8px;
}

.current-stage-tip {
  display: flex;
  align-items: center;
  margin-bottom: 12px;
  padding: 8px 12px;
  background: #e1f3ff;
  border: 1px solid #b3d8ff;
  border-radius: 4px;
  color: #2c5aa0;
  font-size: 14px;
}

.current-stage-tip .el-icon {
  margin-right: 8px;
  color: #409eff;
}

/* 表格样式调整 */
:deep(.el-table) {
  border: none;
}

:deep(.el-table th) {
  background: #fafafa;
  border-bottom: 1px solid #e8e8e8;
  font-weight: 600;
}

:deep(.el-table td) {
  border-bottom: 1px solid #f0f0f0;
}

:deep(.el-table tr:hover > td) {
  background-color: #f5f7fa;
}

/* 进度条样式 */
:deep(.el-progress-bar__outer) {
  background-color: #e8e8e8;
}

:deep(.el-progress-bar__inner) {
  transition: width 0.3s ease;
}

/* 对话框样式 */
:deep(.el-dialog__header) {
  border-bottom: 1px solid #e8e8e8;
  padding-bottom: 16px;
}

:deep(.el-dialog__body) {
  padding-top: 20px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .stage-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }
  
  .stage-meta {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }
  
  .stage-progress {
    min-width: 100%;
  }
  
  .stage-actions {
    align-self: flex-end;
  }
}

/* 动画效果 */
.add-stage-section:hover .add-stage-btn {
  color: #337ecc;
}
</style> 