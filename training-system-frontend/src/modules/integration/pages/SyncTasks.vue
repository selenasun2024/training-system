<template>
  <div class="sync-tasks">
    <div class="page-header">
      <h2>同步任务监控</h2>
      <p>监控培训项目与带教项目的数据同步状态</p>
    </div>

    <!-- 筛选和操作栏 -->
    <div class="filter-bar">
      <el-row :gutter="16">
        <el-col :span="6">
          <el-select v-model="filters.status" placeholder="任务状态" clearable @change="loadTasks">
            <el-option label="全部" value="" />
            <el-option label="等待中" value="pending" />
            <el-option label="运行中" value="running" />
            <el-option label="已完成" value="completed" />
            <el-option label="失败" value="failed" />
            <el-option label="已取消" value="cancelled" />
          </el-select>
        </el-col>
        <el-col :span="6">
          <el-select v-model="filters.type" placeholder="任务类型" clearable @change="loadTasks">
            <el-option label="全部" value="" />
            <el-option label="培训→带教" value="training_to_mentorship" />
            <el-option label="带教→培训" value="mentorship_to_training" />
            <el-option label="双向同步" value="bidirectional" />
          </el-select>
        </el-col>
        <el-col :span="6">
          <el-select v-model="filters.priority" placeholder="优先级" clearable @change="loadTasks">
            <el-option label="全部" value="" />
            <el-option label="紧急" value="urgent" />
            <el-option label="高" value="high" />
            <el-option label="中" value="medium" />
            <el-option label="低" value="low" />
          </el-select>
        </el-col>
        <el-col :span="6">
          <el-button type="primary" @click="showTriggerDialog = true">
            <el-icon><Operation /></el-icon>
            手动触发
          </el-button>
        </el-col>
      </el-row>
    </div>

    <!-- 任务列表 -->
    <el-table :data="tasks" border stripe v-loading="loading">
      <el-table-column prop="id" label="任务ID" width="150" />
      <el-table-column prop="type" label="类型" width="150">
        <template #default="{ row }">
          <el-tag :type="getTaskTypeColor(row.type)">
            {{ getTaskTypeLabel(row.type) }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="source" label="源系统" width="100">
        <template #default="{ row }">
          <el-tag :type="row.source === 'training' ? 'primary' : 'success'">
            {{ row.source === 'training' ? '培训' : '带教' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="sourceId" label="源项目ID" width="150" />
      <el-table-column prop="status" label="状态" width="100">
        <template #default="{ row }">
          <el-tag :type="getStatusType(row.status)">
            {{ getStatusLabel(row.status) }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="progress" label="进度" width="150">
        <template #default="{ row }">
          <el-progress
            :percentage="row.progress"
            :status="getProgressStatus(row.status)"
            :stroke-width="6"
          />
        </template>
      </el-table-column>
      <el-table-column prop="priority" label="优先级" width="100">
        <template #default="{ row }">
          <el-tag :type="getPriorityType(row.priority)">
            {{ row.priority }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="scheduledAt" label="计划时间" width="180">
        <template #default="{ row }">
          {{ row.scheduledAt ? formatDate(row.scheduledAt) : '-' }}
        </template>
      </el-table-column>
      <el-table-column prop="startedAt" label="开始时间" width="180">
        <template #default="{ row }">
          {{ row.startedAt ? formatDate(row.startedAt) : '-' }}
        </template>
      </el-table-column>
      <el-table-column prop="completedAt" label="完成时间" width="180">
        <template #default="{ row }">
          {{ row.completedAt ? formatDate(row.completedAt) : '-' }}
        </template>
      </el-table-column>
      <el-table-column label="操作" width="200" fixed="right">
        <template #default="{ row }">
          <el-button size="small" @click="viewTaskDetails(row)">详情</el-button>
          <el-button 
            v-if="row.status === 'pending'"
            size="small" 
            type="danger" 
            @click="cancelTask(row)"
          >
            取消
          </el-button>
          <el-button 
            v-if="row.status === 'failed'"
            size="small" 
            type="warning" 
            @click="retryTask(row)"
          >
            重试
          </el-button>
        </template>
      </el-table-column>
    </el-table>

    <!-- 分页 -->
    <div class="pagination-wrapper">
      <el-pagination
        v-model:current-page="pagination.current"
        v-model:page-size="pagination.size"
        :total="pagination.total"
        :page-sizes="[10, 20, 50, 100]"
        layout="total, sizes, prev, pager, next, jumper"
        @size-change="loadTasks"
        @current-change="loadTasks"
      />
    </div>

    <!-- 手动触发对话框 -->
    <el-dialog
      v-model="showTriggerDialog"
      title="手动触发同步"
      width="600px"
    >
      <el-form :model="triggerForm" ref="triggerFormRef" label-width="120px">
        <el-form-item label="源系统" prop="sourceType">
          <el-radio-group v-model="triggerForm.sourceType">
            <el-radio value="training">培训项目</el-radio>
            <el-radio value="mentorship">带教项目</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="源项目ID" prop="sourceId">
          <el-input v-model="triggerForm.sourceId" placeholder="请输入项目ID" />
        </el-form-item>
        <el-form-item label="目标项目ID" prop="targetId">
          <el-input v-model="triggerForm.targetId" placeholder="可选，留空将自动创建" />
        </el-form-item>
        <el-form-item label="优先级" prop="priority">
          <el-select v-model="triggerForm.priority" placeholder="选择优先级">
            <el-option label="紧急" value="urgent" />
            <el-option label="高" value="high" />
            <el-option label="中" value="medium" />
            <el-option label="低" value="low" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showTriggerDialog = false">取消</el-button>
        <el-button type="primary" @click="triggerSync">触发同步</el-button>
      </template>
    </el-dialog>

    <!-- 任务详情对话框 -->
    <el-dialog
      v-model="showDetailsDialog"
      title="任务详情"
      width="800px"
    >
      <div v-if="selectedTask" class="task-details">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="任务ID">{{ selectedTask.id }}</el-descriptions-item>
          <el-descriptions-item label="任务类型">{{ getTaskTypeLabel(selectedTask.type) }}</el-descriptions-item>
          <el-descriptions-item label="源系统">{{ selectedTask.source === 'training' ? '培训' : '带教' }}</el-descriptions-item>
          <el-descriptions-item label="源项目ID">{{ selectedTask.sourceId }}</el-descriptions-item>
          <el-descriptions-item label="目标项目ID">{{ selectedTask.targetId || '自动创建' }}</el-descriptions-item>
          <el-descriptions-item label="状态">
            <el-tag :type="getStatusType(selectedTask.status)">
              {{ getStatusLabel(selectedTask.status) }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="进度">{{ selectedTask.progress }}%</el-descriptions-item>
          <el-descriptions-item label="优先级">
            <el-tag :type="getPriorityType(selectedTask.priority)">
              {{ selectedTask.priority }}
            </el-tag>
          </el-descriptions-item>
        </el-descriptions>

        <div v-if="selectedTask.errors.length > 0" class="error-section">
          <h4>错误信息</h4>
          <el-alert
            v-for="(error, index) in selectedTask.errors"
            :key="index"
            :title="error"
            type="error"
            show-icon
            :closable="false"
          />
        </div>

        <div v-if="selectedTask.warnings.length > 0" class="warning-section">
          <h4>警告信息</h4>
          <el-alert
            v-for="(warning, index) in selectedTask.warnings"
            :key="index"
            :title="warning"
            type="warning"
            show-icon
            :closable="false"
          />
        </div>

        <div v-if="selectedTask.metadata" class="metadata-section">
          <h4>元数据</h4>
          <pre>{{ JSON.stringify(selectedTask.metadata, null, 2) }}</pre>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, reactive } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { Operation } from '@element-plus/icons-vue';
import { dataSyncService } from '../services/DataSyncService';
import type { SyncTask } from '@/types';

// 响应式数据
const tasks = ref<SyncTask[]>([]);
const loading = ref(false);
const showTriggerDialog = ref(false);
const showDetailsDialog = ref(false);
const selectedTask = ref<SyncTask | null>(null);
const triggerFormRef = ref();

const filters = reactive({
  status: '',
  type: '',
  priority: ''
});

const pagination = reactive({
  current: 1,
  size: 20,
  total: 0
});

const triggerForm = reactive({
  sourceType: 'training',
  sourceId: '',
  targetId: '',
  priority: 'medium'
});

// 生命周期
onMounted(() => {
  loadTasks();
  startPolling();
});

// 方法
const loadTasks = async () => {
  loading.value = true;
  try {
    // 模拟加载任务数据
    tasks.value = [
      {
        id: 'sync-1',
        type: 'training_to_mentorship',
        source: 'training',
        sourceId: 'training-001',
        targetId: 'mentorship-001',
        status: 'completed',
        priority: 'high',
        progress: 100,
        scheduledAt: new Date(Date.now() - 1000 * 60 * 60 * 2),
        startedAt: new Date(Date.now() - 1000 * 60 * 60 * 2),
        completedAt: new Date(Date.now() - 1000 * 60 * 60 * 1),
        errors: [],
        warnings: [],
        metadata: { ruleId: 'auto-create-mentorship-high-score' }
      },
      {
        id: 'sync-2',
        type: 'mentorship_to_training',
        source: 'mentorship',
        sourceId: 'mentorship-002',
        status: 'running',
        priority: 'medium',
        progress: 65,
        scheduledAt: new Date(Date.now() - 1000 * 60 * 30),
        startedAt: new Date(Date.now() - 1000 * 60 * 30),
        errors: [],
        warnings: ['部分数据字段缺失'],
        metadata: { ruleId: 'mentorship-progress-to-profile' }
      },
      {
        id: 'sync-3',
        type: 'training_to_mentorship',
        source: 'training',
        sourceId: 'training-003',
        status: 'failed',
        priority: 'urgent',
        progress: 0,
        scheduledAt: new Date(Date.now() - 1000 * 60 * 15),
        startedAt: new Date(Date.now() - 1000 * 60 * 15),
        errors: ['目标系统连接失败', 'API接口超时'],
        warnings: [],
        metadata: { ruleId: 'auto-create-mentorship-high-score', retryCount: 2 }
      },
      {
        id: 'sync-4',
        type: 'bidirectional',
        source: 'training',
        sourceId: 'training-004',
        status: 'pending',
        priority: 'low',
        progress: 0,
        scheduledAt: new Date(Date.now() + 1000 * 60 * 10),
        errors: [],
        warnings: [],
        metadata: { ruleId: 'skill-development-bidirectional' }
      }
    ] as SyncTask[];

    // 应用筛选
    if (filters.status) {
      tasks.value = tasks.value.filter(task => task.status === filters.status);
    }
    if (filters.type) {
      tasks.value = tasks.value.filter(task => task.type === filters.type);
    }
    if (filters.priority) {
      tasks.value = tasks.value.filter(task => task.priority === filters.priority);
    }

    pagination.total = tasks.value.length;
  } catch (error) {
    ElMessage.error('加载任务列表失败');
  } finally {
    loading.value = false;
  }
};

const viewTaskDetails = (task: SyncTask) => {
  selectedTask.value = task;
  showDetailsDialog.value = true;
};

const cancelTask = async (task: SyncTask) => {
  try {
    await ElMessageBox.confirm('确定要取消这个同步任务吗？', '确认取消', {
      type: 'warning'
    });
    
    dataSyncService.cancelSyncTask(task.id);
    ElMessage.success('任务已取消');
    loadTasks();
  } catch {
    // 用户取消
  }
};

const retryTask = (task: SyncTask) => {
  const newTaskId = dataSyncService.createSyncTask({
    type: task.type,
    source: task.source,
    sourceId: task.sourceId,
    targetId: task.targetId,
    priority: 'high',
    metadata: { ...task.metadata, retry: true, originalTaskId: task.id }
  });
  
  ElMessage.success('重试任务已创建');
  loadTasks();
};

const triggerSync = async () => {
  if (!triggerFormRef.value) return;
  
  try {
    const taskId = dataSyncService.createSyncTask({
      type: 'training_to_mentorship',
      source: triggerForm.sourceType,
      sourceId: triggerForm.sourceId,
      targetId: triggerForm.targetId || undefined,
      priority: triggerForm.priority,
      metadata: { manual: true }
    });
    
    ElMessage.success('同步任务已创建');
    showTriggerDialog.value = false;
    resetTriggerForm();
    loadTasks();
  } catch (error) {
    ElMessage.error('创建同步任务失败');
  }
};

const resetTriggerForm = () => {
  triggerForm.sourceType = 'training';
  triggerForm.sourceId = '';
  triggerForm.targetId = '';
  triggerForm.priority = 'medium';
};

const startPolling = () => {
  // 每30秒刷新一次任务状态
  setInterval(() => {
    if (!showDetailsDialog.value && !showTriggerDialog.value) {
      loadTasks();
    }
  }, 30000);
};

// 工具方法
const getTaskTypeLabel = (type: string) => {
  const labels = {
    training_to_mentorship: '培训→带教',
    mentorship_to_training: '带教→培训',
    bidirectional: '双向同步'
  };
  return labels[type] || type;
};

const getTaskTypeColor = (type: string) => {
  const colors = {
    training_to_mentorship: 'primary',
    mentorship_to_training: 'success',
    bidirectional: 'warning'
  };
  return colors[type] || 'info';
};

const getStatusType = (status: string) => {
  const types = {
    pending: 'warning',
    running: 'primary',
    completed: 'success',
    failed: 'danger',
    cancelled: 'info'
  };
  return types[status] || 'info';
};

const getStatusLabel = (status: string) => {
  const labels = {
    pending: '等待',
    running: '运行',
    completed: '完成',
    failed: '失败',
    cancelled: '取消'
  };
  return labels[status] || status;
};

const getProgressStatus = (status: string) => {
  if (status === 'completed') return 'success';
  if (status === 'failed') return 'exception';
  return undefined;
};

const getPriorityType = (priority: string) => {
  const types = {
    urgent: 'danger',
    high: 'warning',
    medium: 'primary',
    low: 'info'
  };
  return types[priority] || 'info';
};

const formatDate = (date: Date) => {
  return new Intl.DateTimeFormat('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date);
};
</script>

<style scoped>
.sync-tasks {
  padding: 20px;
}

.page-header {
  margin-bottom: 24px;
}

.page-header h2 {
  margin: 0 0 8px 0;
  font-size: 24px;
  color: #303133;
}

.page-header p {
  margin: 0;
  color: #606266;
}

.filter-bar {
  margin-bottom: 16px;
}

.pagination-wrapper {
  margin-top: 20px;
  text-align: right;
}

.task-details {
  max-height: 500px;
  overflow-y: auto;
}

.error-section,
.warning-section,
.metadata-section {
  margin-top: 20px;
}

.error-section h4,
.warning-section h4,
.metadata-section h4 {
  margin: 0 0 10px 0;
  color: #303133;
}

.error-section .el-alert,
.warning-section .el-alert {
  margin-bottom: 8px;
}

.metadata-section pre {
  background-color: #F5F7FA;
  padding: 12px;
  border-radius: 4px;
  font-size: 12px;
  color: #606266;
  white-space: pre-wrap;
  word-wrap: break-word;
}
</style> 