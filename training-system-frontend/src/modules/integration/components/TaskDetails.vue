<template>
  <div class="task-details">
    <div v-if="task" class="task-info">
      <el-descriptions :column="2" border>
        <el-descriptions-item label="任务ID">{{ task.id }}</el-descriptions-item>
        <el-descriptions-item label="任务类型">
          <el-tag :type="getTaskTypeColor(task.type)">
            {{ getTaskTypeLabel(task.type) }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="源系统">{{ task.source }}</el-descriptions-item>
        <el-descriptions-item label="源ID">{{ task.sourceId }}</el-descriptions-item>
        <el-descriptions-item label="目标ID">{{ task.targetId || '-' }}</el-descriptions-item>
        <el-descriptions-item label="状态">
          <el-tag :type="getStatusColor(task.status)">
            {{ getStatusLabel(task.status) }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="优先级">
          <el-tag :type="getPriorityColor(task.priority)">
            {{ getPriorityLabel(task.priority) }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="进度">
          <el-progress 
            :percentage="task.progress" 
            :color="getProgressColor(task.progress)"
            :stroke-width="8"
          />
        </el-descriptions-item>
        <el-descriptions-item label="计划时间">
          {{ formatDate(task.scheduledAt) }}
        </el-descriptions-item>
        <el-descriptions-item label="开始时间">
          {{ formatDate(task.startedAt) }}
        </el-descriptions-item>
        <el-descriptions-item label="完成时间">
          {{ formatDate(task.completedAt) }}
        </el-descriptions-item>
        <el-descriptions-item label="执行耗时">
          {{ getExecutionTime(task) }}
        </el-descriptions-item>
      </el-descriptions>
      
      <el-divider />
      
      <el-tabs v-model="activeTab" type="card">
        <el-tab-pane label="执行日志" name="logs">
          <div class="logs-container">
            <div class="log-controls">
              <el-select v-model="logLevel" placeholder="选择日志级别" size="small" style="width: 120px">
                <el-option label="全部" value="" />
                <el-option label="信息" value="info" />
                <el-option label="警告" value="warning" />
                <el-option label="错误" value="error" />
              </el-select>
              <el-button size="small" @click="refreshLogs">刷新</el-button>
            </div>
            
            <div class="logs-list">
              <div 
                v-for="log in filteredLogs" 
                :key="log.id" 
                :class="['log-item', `log-${log.level}`]"
              >
                <div class="log-header">
                  <span class="log-time">{{ formatTime(log.timestamp) }}</span>
                  <el-tag :type="getLogLevelColor(log.level)" size="small">
                    {{ log.level.toUpperCase() }}
                  </el-tag>
                </div>
                <div class="log-content">{{ log.message }}</div>
                <div v-if="log.details" class="log-details">
                  <pre>{{ JSON.stringify(log.details, null, 2) }}</pre>
                </div>
              </div>
            </div>
          </div>
        </el-tab-pane>
        
        <el-tab-pane label="错误信息" name="errors">
          <div class="errors-container">
            <el-alert 
              v-for="error in task.errors" 
              :key="error" 
              :title="error" 
              type="error" 
              show-icon 
              :closable="false"
              style="margin-bottom: 8px"
            />
            <div v-if="task.errors.length === 0" class="no-errors">
              <el-empty description="暂无错误信息" />
            </div>
          </div>
        </el-tab-pane>
        
        <el-tab-pane label="警告信息" name="warnings">
          <div class="warnings-container">
            <el-alert 
              v-for="warning in task.warnings" 
              :key="warning" 
              :title="warning" 
              type="warning" 
              show-icon 
              :closable="false"
              style="margin-bottom: 8px"
            />
            <div v-if="task.warnings.length === 0" class="no-warnings">
              <el-empty description="暂无警告信息" />
            </div>
          </div>
        </el-tab-pane>
        
        <el-tab-pane label="元数据" name="metadata">
          <div class="metadata-container">
            <el-descriptions :column="1" border>
              <el-descriptions-item 
                v-for="(value, key) in task.metadata" 
                :key="key" 
                :label="key"
              >
                <span v-if="typeof value === 'object'">
                  <pre>{{ JSON.stringify(value, null, 2) }}</pre>
                </span>
                <span v-else>{{ value }}</span>
              </el-descriptions-item>
            </el-descriptions>
            <div v-if="Object.keys(task.metadata).length === 0" class="no-metadata">
              <el-empty description="暂无元数据" />
            </div>
          </div>
        </el-tab-pane>
      </el-tabs>
      
      <el-divider />
      
      <div class="task-actions">
        <el-button 
          v-if="task.status === 'pending'" 
          type="primary" 
          @click="startTask"
        >
          开始执行
        </el-button>
        <el-button 
          v-if="task.status === 'running'" 
          type="warning" 
          @click="pauseTask"
        >
          暂停
        </el-button>
        <el-button 
          v-if="task.status === 'running'" 
          type="danger" 
          @click="cancelTask"
        >
          取消
        </el-button>
        <el-button 
          v-if="task.status === 'failed'" 
          type="primary" 
          @click="retryTask"
        >
          重试
        </el-button>
        <el-button @click="refreshTask">刷新</el-button>
      </div>
    </div>
    
    <div v-else class="no-task">
      <el-empty description="请选择一个任务查看详情" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import type { SyncTask } from '../services';

interface Props {
  task?: SyncTask | null;
}

const props = withDefaults(defineProps<Props>(), {
  task: null
});

const emit = defineEmits<{
  start: [taskId: string];
  pause: [taskId: string];
  cancel: [taskId: string];
  retry: [taskId: string];
  refresh: [taskId: string];
}>();

const activeTab = ref('logs');
const logLevel = ref('');

// 模拟日志数据
const logs = ref([
  {
    id: 'log-1',
    level: 'info',
    timestamp: new Date(),
    message: '任务开始执行',
    details: { taskId: 'sync-1', startTime: new Date() }
  },
  {
    id: 'log-2',
    level: 'info',
    timestamp: new Date(),
    message: '正在同步数据...',
    details: { progress: 25, processedRecords: 10 }
  },
  {
    id: 'log-3',
    level: 'warning',
    timestamp: new Date(),
    message: '部分数据需要人工确认',
    details: { affectedRecords: 3, reason: '数据冲突' }
  },
  {
    id: 'log-4',
    level: 'info',
    timestamp: new Date(),
    message: '数据同步完成',
    details: { totalRecords: 50, successCount: 47, failedCount: 3 }
  }
]);

const filteredLogs = computed(() => {
  if (!logLevel.value) return logs.value;
  return logs.value.filter(log => log.level === logLevel.value);
});

const getTaskTypeLabel = (type: string) => {
  const labels: Record<string, string> = {
    'training_to_mentorship': '培训转带教',
    'mentorship_to_training': '带教转培训',
    'bidirectional': '双向同步'
  };
  return labels[type] || type;
};

const getTaskTypeColor = (type: string) => {
  const colors: Record<string, string> = {
    'training_to_mentorship': '',
    'mentorship_to_training': 'success',
    'bidirectional': 'warning'
  };
  return colors[type] || '';
};

const getStatusLabel = (status: string) => {
  const labels: Record<string, string> = {
    'pending': '待执行',
    'running': '执行中',
    'completed': '已完成',
    'failed': '失败',
    'cancelled': '已取消'
  };
  return labels[status] || status;
};

const getStatusColor = (status: string) => {
  const colors: Record<string, string> = {
    'pending': 'warning',
    'running': 'primary',
    'completed': 'success',
    'failed': 'danger',
    'cancelled': 'info'
  };
  return colors[status] || '';
};

const getPriorityLabel = (priority: string) => {
  const labels: Record<string, string> = {
    'low': '低',
    'medium': '中',
    'high': '高',
    'urgent': '紧急'
  };
  return labels[priority] || priority;
};

const getPriorityColor = (priority: string) => {
  const colors: Record<string, string> = {
    'low': 'info',
    'medium': '',
    'high': 'warning',
    'urgent': 'danger'
  };
  return colors[priority] || '';
};

const getProgressColor = (progress: number) => {
  if (progress >= 100) return '#67C23A';
  if (progress >= 70) return '#E6A23C';
  if (progress >= 40) return '#409EFF';
  return '#F56C6C';
};

const getLogLevelColor = (level: string) => {
  const colors: Record<string, string> = {
    'info': 'primary',
    'warning': 'warning',
    'error': 'danger'
  };
  return colors[level] || '';
};

const formatDate = (date?: Date) => {
  if (!date) return '-';
  return date.toLocaleString();
};

const formatTime = (date: Date) => {
  return date.toLocaleTimeString();
};

const getExecutionTime = (task: SyncTask) => {
  if (!task.startedAt) return '-';
  
  const endTime = task.completedAt || new Date();
  const duration = endTime.getTime() - task.startedAt.getTime();
  
  const seconds = Math.floor(duration / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  
  if (hours > 0) {
    return `${hours}小时${minutes % 60}分钟`;
  } else if (minutes > 0) {
    return `${minutes}分钟${seconds % 60}秒`;
  } else {
    return `${seconds}秒`;
  }
};

const startTask = async () => {
  if (!props.task) return;
  
  try {
    await ElMessageBox.confirm('确定要开始执行这个任务吗？', '确认操作', {
      type: 'warning'
    });
    
    emit('start', props.task.id);
    ElMessage.success('任务已开始执行');
  } catch {
    // 用户取消
  }
};

const pauseTask = async () => {
  if (!props.task) return;
  
  try {
    await ElMessageBox.confirm('确定要暂停这个任务吗？', '确认操作', {
      type: 'warning'
    });
    
    emit('pause', props.task.id);
    ElMessage.success('任务已暂停');
  } catch {
    // 用户取消
  }
};

const cancelTask = async () => {
  if (!props.task) return;
  
  try {
    await ElMessageBox.confirm('确定要取消这个任务吗？任务取消后无法恢复。', '确认操作', {
      type: 'warning'
    });
    
    emit('cancel', props.task.id);
    ElMessage.success('任务已取消');
  } catch {
    // 用户取消
  }
};

const retryTask = async () => {
  if (!props.task) return;
  
  try {
    await ElMessageBox.confirm('确定要重试这个任务吗？', '确认操作', {
      type: 'warning'
    });
    
    emit('retry', props.task.id);
    ElMessage.success('任务已重新开始');
  } catch {
    // 用户取消
  }
};

const refreshTask = () => {
  if (!props.task) return;
  emit('refresh', props.task.id);
};

const refreshLogs = () => {
  // 模拟刷新日志
  ElMessage.success('日志已刷新');
};

// 监听任务变化，重置标签页
watch(() => props.task, () => {
  activeTab.value = 'logs';
  logLevel.value = '';
});
</script>

<style scoped>
.task-details {
  padding: 16px;
}

.task-info {
  max-height: 600px;
  overflow-y: auto;
}

.logs-container {
  max-height: 300px;
  overflow-y: auto;
}

.log-controls {
  display: flex;
  gap: 8px;
  margin-bottom: 16px;
  padding: 8px;
  background-color: #f5f7fa;
  border-radius: 4px;
}

.logs-list {
  max-height: 250px;
  overflow-y: auto;
}

.log-item {
  margin-bottom: 8px;
  padding: 8px;
  border-radius: 4px;
  border-left: 4px solid #ddd;
}

.log-item.log-info {
  border-left-color: #409EFF;
  background-color: #f0f9ff;
}

.log-item.log-warning {
  border-left-color: #E6A23C;
  background-color: #fdf6ec;
}

.log-item.log-error {
  border-left-color: #F56C6C;
  background-color: #fef0f0;
}

.log-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 4px;
}

.log-time {
  font-size: 12px;
  color: #666;
}

.log-content {
  font-size: 14px;
  line-height: 1.5;
}

.log-details {
  margin-top: 8px;
  padding: 8px;
  background-color: #f9f9f9;
  border-radius: 4px;
}

.log-details pre {
  margin: 0;
  font-size: 12px;
  white-space: pre-wrap;
  word-break: break-all;
}

.errors-container,
.warnings-container,
.metadata-container {
  max-height: 300px;
  overflow-y: auto;
}

.no-errors,
.no-warnings,
.no-metadata,
.no-task {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 200px;
}

.task-actions {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
  margin-top: 16px;
}
</style> 