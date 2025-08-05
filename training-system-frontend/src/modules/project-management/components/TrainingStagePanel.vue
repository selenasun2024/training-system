<template>
  <div class="training-stage-panel">
    <!-- 编辑模式：显示完整的阶段管理界面 -->
    <template v-if="isEditMode">
      <div class="stage-header">
        <span>阶段管理</span>
        <el-button size="small" type="primary" circle @click="onAddStage">
          <el-icon><Plus /></el-icon>
        </el-button>
      </div>
      
      <!-- 阶段统计信息 -->
      <div class="stage-stats-summary">
        <div class="stats-item">
          <span class="stats-label">总阶段</span>
          <span class="stats-value">{{ stages.length }}</span>
        </div>
        <div class="stats-item">
          <span class="stats-label">总任务</span>
          <span class="stats-value">{{ totalTasks }}</span>
        </div>
      </div>
      
      <!-- 阶段列表 -->
      <div class="stage-list">
        <div
          v-for="(stage, index) in stages"
          :key="stage.id"
          class="stage-item"
          :class="{ 'is-active': stage.id === activeStageId }"
          @click="onSelectStage(stage.id)"
        >
          <!-- 阶段标题区域 -->
          <div class="stage-title-area">
            <template v-if="editingId !== stage.id">
              <div class="stage-title" @dblclick="startEdit(stage.id, stage.name)">
                <span class="stage-name">{{ stage.name }}</span>
                <el-tag v-if="stage.status" :type="getStageStatusType(stage.status)" size="small">
                  {{ getStageStatusText(stage.status) }}
                </el-tag>
              </div>
            </template>
            <template v-else>
              <el-input 
                v-model="editingName" 
                size="small" 
                @keyup.enter="confirmEdit" 
                @blur="confirmEdit" 
                style="width: 100%"
                ref="editInput"
              />
            </template>
            
            <el-dropdown trigger="click" @command="cmd => handleCommand(stage.id, cmd)">
              <span class="more-btn">
                <el-icon><MoreFilled /></el-icon>
              </span>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item command="edit">编辑名称</el-dropdown-item>
                  <el-dropdown-item command="editDesc">编辑描述</el-dropdown-item>
                  <el-dropdown-item command="duplicate" divided>复制阶段</el-dropdown-item>
                  <el-dropdown-item command="delete" divided style="color: #f56c6c">删除阶段</el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </div>
          
          <!-- 阶段描述 -->
          <div v-if="stage.description" class="stage-description">
            {{ stage.description }}
          </div>
          
          <!-- 阶段统计信息 -->
          <div class="stage-stats">
            <div class="stat-item">
              <el-icon><Document /></el-icon>
              <span>{{ stage.tasks.length }}个任务</span>
            </div>
            <div v-if="stage.estimatedDuration" class="stat-item">
              <el-icon><Clock /></el-icon>
              <span>{{ stage.estimatedDuration }}h</span>
            </div>
            <div class="stat-item">
              <el-icon><SuccessFilled /></el-icon>
              <span>{{ getCompletedTasksCount(stage) }}/{{ stage.tasks.length }}</span>
            </div>
          </div>
          
          <!-- 进度条 -->
          <el-progress 
            :percentage="getStageProgress(stage)" 
            :stroke-width="4"
            :show-text="false"
            class="stage-progress"
          />
        </div>
      </div>
    </template>

    <!-- 执行模式：显示简化的任务菜单 -->
    <template v-else>
      <div class="execution-header">
        <span>任务</span>
        <el-button 
          size="small" 
          type="text" 
          @click="switchToEditMode"
          title="切换到编辑模式"
        >
          <el-icon><Edit /></el-icon>
        </el-button>
      </div>
      
      <!-- 任务总览统计 -->
      <div class="task-stats-summary">
        <div class="stats-item">
          <span class="stats-label">总任务</span>
          <span class="stats-value">{{ totalTasks }}</span>
        </div>
        <div class="stats-item">
          <span class="stats-label">已完成</span>
          <span class="stats-value">{{ completedTasks }}</span>
        </div>
      </div>

      <!-- 任务执行进度 -->
      <div class="execution-progress">
        <div class="progress-label">总体进度</div>
        <el-progress 
          :percentage="overallProgress" 
          :stroke-width="6"
          :text-inside="true"
          class="overall-progress"
        />
      </div>

      <!-- 按阶段分组的任务快速导航 -->
      <div class="task-navigation">
        <div class="nav-title">快速导航</div>
        <div class="nav-list">
          <div
            v-for="stage in stages"
            :key="stage.id"
            class="nav-item"
            @click="onSelectStage(stage.id)"
            :class="{ 'is-active': stage.id === activeStageId }"
          >
            <div class="nav-item-header">
              <span class="nav-stage-name">{{ stage.name }}</span>
              <el-tag 
                size="small" 
                :type="getStageProgressType(stage)"
              >
                {{ getCompletedTasksCount(stage) }}/{{ stage.tasks.length }}
              </el-tag>
            </div>
            <el-progress 
              :percentage="getStageProgress(stage)" 
              :stroke-width="3"
              :show-text="false"
              class="nav-progress"
            />
          </div>
        </div>
      </div>
    </template>

    <!-- 编辑描述对话框 -->
    <el-dialog
      v-model="descEditVisible"
      title="编辑阶段描述"
      width="500px"
      :before-close="handleDescEditClose"
    >
      <el-form label-width="80px">
        <el-form-item label="阶段名称">
          <el-input v-model="editingStage.name" placeholder="请输入阶段名称" />
        </el-form-item>
        <el-form-item label="阶段描述">
          <el-input
            v-model="editingStage.description"
            type="textarea"
            :rows="4"
            placeholder="请输入阶段描述（可选）"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="descEditVisible = false">取消</el-button>
          <el-button type="primary" @click="confirmDescEdit">确定</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, nextTick } from 'vue';
import { useTrainingStageStore } from '../stores/trainingStage';
import { storeToRefs } from 'pinia';
import { ElMessage, ElMessageBox } from 'element-plus';
import { 
  Plus, MoreFilled, Document, Clock, SuccessFilled, Edit 
} from '@element-plus/icons-vue';
import { useRoute } from 'vue-router';

const store = useTrainingStageStore();
const { stages, activeStageId, isEditMode, isExecutionMode } = storeToRefs(store);
const { 
  addStage, removeStage, setActiveStage, setStageName, 
  setStageDescription, updateStageStatus, duplicateStage,
  switchToEditMode, switchToExecutionMode
} = store;

const route = useRoute();
// 获取当前项目ID
const currentProjectId = computed(() => {
  const projectId = route.params.id as string;
  return projectId && projectId !== 'new' ? projectId : null;
});

const editingId = ref('');
const editingName = ref('');
const editInput = ref();

// 描述编辑
const descEditVisible = ref(false);
const editingStage = ref({
  id: '',
  name: '',
  description: '',
  status: 'pending' as 'pending' | 'active' | 'completed'
});

// 视图模式已从store中获取


// 计算属性
const totalTasks = computed(() => {
  return stages.value.reduce((total, stage) => total + stage.tasks.length, 0);
});

const completedTasks = computed(() => {
  return stages.value.reduce((total, stage) => total + getCompletedTasksCount(stage), 0);
});

const overallProgress = computed(() => {
  const total = totalTasks.value;
  if (total === 0) return 0;
  const completed = completedTasks.value;
  return Math.round((completed / total) * 100);
});

async function onAddStage() {
  const newStage = await addStage(`阶段${stages.value.length + 1}`, '新建培训阶段', currentProjectId.value);
  if (!newStage) {
    // 错误消息已在store中显示
    return;
  }
  // 成功消息已在store中显示
}

function onSelectStage(id: string) {
  setActiveStage(id);
}

function onRemoveStage(id: string) {
  ElMessageBox.confirm(
    '确定要删除这个阶段吗？删除后阶段内的所有任务也将被删除。',
    '删除确认',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    }
  ).then(async () => {
    const success = await removeStage(id, currentProjectId.value);
    if (!success) {
      // 错误消息已在store中显示
      return;
    }
    // 成功消息已在store中显示
  }).catch(() => {
    // 用户取消删除
  });
}

function startEdit(id: string, name: string) {
  editingId.value = id;
  editingName.value = name;
  nextTick(() => {
    editInput.value?.focus();
  });
}

async function confirmEdit() {
  if (editingId.value && editingName.value.trim()) {
    const success = await setStageName(editingId.value, editingName.value.trim(), currentProjectId.value);
    if (success) {
    ElMessage.success('阶段名称已更新');
    }
    // 错误消息已在store中显示
  }
  editingId.value = '';
  editingName.value = '';
}

function startDescEdit(stage: any) {
  editingStage.value = {
    id: stage.id,
    name: stage.name,
    description: stage.description || '',
    status: stage.status || 'pending'
  };
  descEditVisible.value = true;
}

async function confirmDescEdit() {
  console.log('🔧 开始保存阶段描述:', {
    stageId: editingStage.value.id,
    name: editingStage.value.name,
    description: editingStage.value.description,
    projectId: currentProjectId.value
  });
  
  const nameSuccess = await setStageName(editingStage.value.id, editingStage.value.name, currentProjectId.value);
  console.log('🔧 阶段名称保存结果:', nameSuccess);
  
  const descSuccess = await setStageDescription(editingStage.value.id, editingStage.value.description, currentProjectId.value);
  console.log('🔧 阶段描述保存结果:', descSuccess);
  
  if (nameSuccess && descSuccess) {
  ElMessage.success('阶段信息已更新');
  }
  // 错误消息已在store中显示
  descEditVisible.value = false;
}

function handleDescEditClose() {
  descEditVisible.value = false;
}

// switchToEditMode 函数已从store中获取

function getStageProgressType(stage: any) {
  const total = stage.tasks.length;
  if (total === 0) return 'info';
  const completed = getCompletedTasksCount(stage);
  if (completed === total) return 'success';
  if (completed > 0) return 'warning';
  return 'info';
}

function duplicateStageAction(stageId: string) {
  ElMessageBox.confirm(
    '确定要复制这个阶段吗？将创建一个包含所有任务的副本。',
    '复制确认',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'info',
    }
  ).then(async () => {
    const newStage = await duplicateStage(stageId, currentProjectId.value);
    if (!newStage) {
      // 错误消息已在store中显示
      return;
    }
    // 成功消息已在store中显示
  }).catch(() => {
    // 用户取消复制
  });
}

function handleCommand(id: string, cmd: string) {
  const stage = stages.value.find(s => s.id === id);
  if (!stage) return;
  
  switch (cmd) {
    case 'edit':
      startEdit(id, stage.name);
      break;
    case 'editDesc':
      startDescEdit(stage);
      break;
    case 'duplicate':
      duplicateStageAction(id);
      break;
    case 'delete':
      onRemoveStage(id);
      break;
  }
}

function getStageStatusType(status: string) {
  const statusTypes: Record<string, string> = {
    'pending': 'info',
    'active': 'warning',
    'completed': 'success',
  };
  return statusTypes[status] || 'info';
}

function getStageStatusText(status: string) {
  const statusTexts: Record<string, string> = {
    'pending': '待开始',
    'active': '进行中',
    'completed': '已完成',
  };
  return statusTexts[status] || '待开始';
}

function getCompletedTasksCount(stage: any) {
  return stage.tasks.filter((task: any) => task.status === '已完成').length;
}

function getStageProgress(stage: any) {
  const total = stage.tasks.length;
  if (total === 0) return 0;
  const completed = getCompletedTasksCount(stage);
  return Math.round((completed / total) * 100);
}
</script>

<style scoped>
.training-stage-panel {
  width: 260px;
  background: #f8f9fa;
  border-right: 1px solid #eee;
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  position: relative;
  z-index: 1;
  padding-top: 0;
  margin-top: 0;
}

.stage-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 16px 16px 16px;
  font-weight: bold;
  font-size: 16px;
  border-bottom: 1px solid #e8e8e8;
  background: #fff;
  margin: 0;
}

.stage-stats-summary {
  display: flex;
  justify-content: space-around;
  padding: 12px;
  background: #fff;
  margin: 8px;
  border-radius: 6px;
  border: 1px solid #e8e8e8;
}

.stats-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.stats-label {
  font-size: 12px;
  color: #999;
}

.stats-value {
  font-size: 18px;
  font-weight: 600;
  color: #333;
}

.stage-list {
  flex: 1;
  overflow-y: auto;
  padding: 8px;
}

.stage-item {
  background: #fff;
  border: 1px solid #e8e8e8;
  border-radius: 8px;
  margin-bottom: 8px;
  padding: 12px;
  cursor: pointer;
  transition: all 0.3s;
}

.stage-item:hover {
  border-color: #409eff;
  box-shadow: 0 2px 8px rgba(64, 158, 255, 0.2);
}

.stage-item.is-active {
  border-color: #409eff;
  background: #f0f9ff;
  box-shadow: 0 2px 8px rgba(64, 158, 255, 0.3);
}

.stage-title-area {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 8px;
}

.stage-title {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.stage-name {
  font-weight: 600;
  color: #333;
  font-size: 14px;
}

.stage-description {
  font-size: 12px;
  color: #666;
  line-height: 1.4;
  margin-bottom: 8px;
  max-height: 40px;
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.stage-stats {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 8px;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: #666;
}

.stage-progress {
  margin-top: 8px;
}

.more-btn {
  padding: 4px;
  border-radius: 4px;
  transition: background-color 0.3s;
  cursor: pointer;
}

.more-btn:hover {
  background-color: #f0f0f0;
}

.execution-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 16px 16px 16px;
  font-weight: bold;
  font-size: 16px;
  border-bottom: 1px solid #e8e8e8;
  background: #fff;
  margin: 0;
}

.task-stats-summary {
  display: flex;
  justify-content: space-around;
  padding: 12px;
  background: #fff;
  margin: 8px;
  border-radius: 6px;
  border: 1px solid #e8e8e8;
}

.task-navigation {
  margin-top: 10px;
  padding: 12px;
  background: #fff;
  border-radius: 6px;
  border: 1px solid #e8e8e8;
}

.nav-title {
  font-weight: bold;
  font-size: 14px;
  color: #333;
  margin-bottom: 8px;
  padding-bottom: 8px;
  border-bottom: 1px solid #eee;
}

.nav-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.nav-item {
  background: #f8f9fa;
  border: 1px solid #e8e8e8;
  border-radius: 6px;
  padding: 8px 12px;
  cursor: pointer;
  transition: all 0.3s;
}

.nav-item:hover {
  background-color: #e9ecef;
  border-color: #dee2e6;
}

.nav-item.is-active {
  background-color: #e9ecef;
  border-color: #409eff;
  box-shadow: 0 2px 8px rgba(64, 158, 255, 0.2);
}

.nav-item-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 4px;
}

.nav-stage-name {
  font-weight: 600;
  color: #333;
  font-size: 13px;
}

.nav-progress {
  margin-top: 4px;
}

.progress-label {
  font-size: 12px;
  color: #666;
  margin-bottom: 4px;
}

.overall-progress {
  margin-top: 8px;
}
</style> 