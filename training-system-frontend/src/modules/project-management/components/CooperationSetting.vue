<template>
  <div class="cooperation-setting">
    <!-- 协同作业配置区域 -->
    <div class="cooperation-header">
      <div class="header-info">
        <h3>协同作业</h3>
        <span class="task-count">{{ cooperationTasks.length }}</span>
      </div>
      <div class="header-actions">
        <el-button type="primary" @click="showAddDialog">
          + 添加作业
        </el-button>
      </div>
    </div>

    <!-- 协同作业列表 -->
    <div class="cooperation-table">
      <el-table 
        :data="cooperationTasks" 
        border 
        stripe
        style="width: 100%"
      >
        <el-table-column prop="index" label="编号" width="80" align="center">
          <template #default="{ $index }">
            {{ $index + 1 }}
          </template>
        </el-table-column>
        <el-table-column prop="name" label="作业名称" min-width="200">
          <template #default="scope">
            <div class="task-name">
              <el-tag size="small" :type="getTaskTypeTag(scope.row.type)">
                {{ getTypeLabel(scope.row.type) }}
              </el-tag>
              <span>{{ scope.row.name }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="questionCount" label="题数" width="120" align="center">
          <template #default="scope">
            <span>{{ scope.row.config?.questionCount || 1 }}题数</span>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="120" align="center">
          <template #default="scope">
            <el-button 
              size="small" 
              type="primary" 
              @click="editTask(scope.row)"
            >
              编辑
            </el-button>
            <el-button 
              size="small" 
              type="danger" 
              @click="removeTask(scope.row)"
            >
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 空状态 -->
      <div v-if="cooperationTasks.length === 0" class="empty-state">
        <el-empty description="暂无协同作业">
          <el-button type="primary" @click="showAddDialog">
            添加第一个协同作业
          </el-button>
        </el-empty>
      </div>
    </div>

    <!-- 添加/编辑协同作业对话框 -->
    <el-dialog 
      v-model="dialogVisible" 
      :title="isEditing ? '编辑协同作业' : '添加协同作业'"
      width="600px"
    >
      <el-form :model="taskForm" label-width="120px" ref="taskFormRef">
        <el-form-item label="选择作业" prop="selectedTask" :rules="[{ required: true, message: '请选择作业' }]">
          <el-select 
            v-model="taskForm.selectedTask" 
            placeholder="请选择要设为协同的作业"
            style="width: 100%"
            @change="handleTaskSelect"
          >
            <el-option
              v-for="task in availableTasks"
              :key="task.id"
              :label="task.name"
              :value="task.id"
            >
              <div class="task-option">
                <el-tag size="small" :type="getTaskTypeTag(task.type)">
                  {{ getTypeLabel(task.type) }}
                </el-tag>
                <span>{{ task.name }}</span>
              </div>
            </el-option>
          </el-select>
        </el-form-item>

        <el-form-item label="题目数量" prop="questionCount">
          <el-input-number 
            v-model="taskForm.questionCount" 
            :min="1" 
            :max="100"
            placeholder="请输入题目数量"
          />
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
          </el-alert>
        </el-form-item>

        <el-form-item label="说明">
          <el-input
            v-model="taskForm.description"
            type="textarea"
            :rows="3"
            placeholder="请输入协同作业的具体要求和说明..."
          />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="saveTask">
          {{ isEditing ? '保存' : '添加' }}
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { useTrainingStageStore } from '../stores/trainingStage';
import { storeToRefs } from 'pinia';

interface Props {
  projectId?: string;
}

const props = defineProps<Props>();

// Store相关
const stageStore = useTrainingStageStore();
const { stages } = storeToRefs(stageStore);

// 对话框和表单相关
const dialogVisible = ref(false);
const isEditing = ref(false);
const taskFormRef = ref();

// 表单数据
const taskForm = ref({
  selectedTask: '',
  questionCount: 1,
  description: ''
});

// 当前编辑的任务
const editingTask = ref<any>(null);

// 协同任务列表（从后端获取）
const cooperationTasks = ref<any[]>([]);

// 计算可用的任务列表（排除已设为协同的任务）
const availableTasks = computed(() => {
  const allTasks = stages.value.flatMap(stage => stage.tasks);
  const cooperationTaskIds = cooperationTasks.value.map(t => t.id);
  
  return allTasks.filter(task => 
    !cooperationTaskIds.includes(task.id) && 
    ['homework', 'exam', 'discussion'].includes(task.type) // 只显示可协同的任务类型
  );
});

// 方法
const getTypeLabel = (type: string) => {
  const typeLabels: Record<string, string> = {
    homework: '作业',
    exam: '考试',
    discussion: '讨论',
    activity: '活动',
    cooperation: '协同'
  };
  return typeLabels[type] || type;
};

const getTaskTypeTag = (type: string) => {
  const typeMap: Record<string, string> = {
    homework: 'primary',
    exam: 'success',
    discussion: 'warning',
    activity: 'info'
  };
  return typeMap[type] || 'info';
};

const showAddDialog = () => {
  isEditing.value = false;
  editingTask.value = null;
  taskForm.value = {
    selectedTask: '',
    questionCount: 1,
    description: ''
  };
  dialogVisible.value = true;
};

const editTask = (task: any) => {
  isEditing.value = true;
  editingTask.value = task;
  taskForm.value = {
    selectedTask: task.id,
    questionCount: task.config?.questionCount || 1,
    description: task.config?.description || ''
  };
  dialogVisible.value = true;
};

const handleTaskSelect = (taskId: string) => {
  const selectedTask = availableTasks.value.find(t => t.id === taskId);
  if (selectedTask) {
    // 可以根据任务类型设置默认值
    console.log('选择的任务:', selectedTask);
  }
};

const saveTask = async () => {
  try {
    await taskFormRef.value?.validate();
    
    if (isEditing.value) {
      // 编辑现有协同作业
      const selectedTask = availableTasks.value.find(t => t.id === taskForm.value.selectedTask) || 
                         editingTask.value;
      
      // 更新实际的任务配置
      const updatedConfig = {
        ...selectedTask.config,
        questionCount: taskForm.value.questionCount,
        description: taskForm.value.description,
        isCooperation: true
      };
      
      // 使用TrainingStageStore更新任务
      await stageStore.updateTaskConfig(selectedTask.id, { config: updatedConfig }, props.projectId);
      
      ElMessage.success('协同作业编辑成功');
    } else {
      // 添加新的协同作业
      const selectedTask = availableTasks.value.find(t => t.id === taskForm.value.selectedTask);
      if (!selectedTask) {
        ElMessage.error('请选择要设为协同的作业');
        return;
      }
      
      // 更新任务配置，标记为协同任务
      const cooperationConfig = {
        ...selectedTask.config,
        questionCount: taskForm.value.questionCount,
        description: taskForm.value.description,
        isCooperation: true
      };
      
      // 使用TrainingStageStore更新任务
      await stageStore.updateTaskConfig(selectedTask.id, { config: cooperationConfig }, props.projectId);
      
      ElMessage.success('协同作业添加成功');
    }
    
    // 重新加载协同任务列表
    loadCooperationTasks();
    dialogVisible.value = false;
  } catch (error) {
    console.error('保存协同作业失败:', error);
    ElMessage.error('保存协同作业失败');
  }
};

const removeTask = (task: any) => {
  ElMessageBox.confirm(
    `确定要取消 "${task.name}" 的协同设置吗？`,
    '取消协同确认',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    }
  ).then(() => {
    // 移除协同标记，保留原任务
    const updatedConfig = { ...task.config };
    delete updatedConfig.isCooperation;
    
    // 使用TrainingStageStore更新任务配置
    await stageStore.updateTaskConfig(task.id, { config: updatedConfig }, props.projectId);
    
    // 重新加载协同任务列表
    loadCooperationTasks();
    
    ElMessage.success(`已取消 "${task.name}" 的协同设置`);
  }).catch(() => {
    // 用户取消删除
  });
};

// 加载协同任务数据
const loadCooperationTasks = () => {
  // 从所有阶段中筛选出已标记为协同的任务
  const allTasks = stages.value.flatMap(stage => stage.tasks);
  const cooperationTaskList = allTasks.filter(task => 
    task.config?.isCooperation === true
  ).map(task => ({
    id: task.id,
    name: task.name,
    type: task.type,
    config: task.config
  }));
  
  cooperationTasks.value = cooperationTaskList;
  console.log('✅ 已加载协同任务:', cooperationTaskList);
};

// 监听stages变化，自动刷新协同任务列表
watch(stages, () => {
  loadCooperationTasks();
}, { deep: true });

onMounted(() => {
  console.log('协同设置组件加载完成，项目ID:', props.projectId);
  loadCooperationTasks();
});
</script>

<style scoped>
.cooperation-setting {
  padding: 20px;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.cooperation-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 16px;
  border-bottom: 2px solid #f0f0f0;
}

.header-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.header-info h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #333;
}

.task-count {
  background: #409eff;
  color: #fff;
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 14px;
  font-weight: 500;
}

.cooperation-table {
  margin-top: 20px;
}

.task-name {
  display: flex;
  align-items: center;
  gap: 8px;
}

.task-name span {
  font-weight: 500;
}

.empty-state {
  padding: 60px 0;
  text-align: center;
}

/* 对话框中的选项样式 */
.task-option {
  display: flex;
  align-items: center;
  gap: 8px;
}

/* 表格操作按钮样式 */
:deep(.el-table .el-button + .el-button) {
  margin-left: 8px;
}

/* 对话框表单样式 */
:deep(.el-form-item__label) {
  font-weight: 500;
}

:deep(.el-input-number) {
  width: 100%;
}

/* 表格样式优化 */
:deep(.el-table) {
  border-radius: 6px;
  overflow: hidden;
}

:deep(.el-table th) {
  background-color: #f8f9fa;
  color: #333;
  font-weight: 600;
}

:deep(.el-table td) {
  border-bottom: 1px solid #f0f0f0;
}

:deep(.el-table--border td, .el-table--border th) {
  border-right: 1px solid #f0f0f0;
}

/* 按钮样式 */
.header-actions .el-button {
  font-weight: 500;
  border-radius: 6px;
}

:deep(.el-table .el-button) {
  border-radius: 4px;
  font-size: 12px;
  padding: 5px 12px;
}

:deep(.el-table .el-button--primary) {
  background-color: #409eff;
  border-color: #409eff;
}

:deep(.el-table .el-button--danger) {
  background-color: #f56c6c;
  border-color: #f56c6c;
}
</style> 