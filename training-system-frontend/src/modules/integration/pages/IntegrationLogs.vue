<template>
  <div class="integration-logs">
    <div class="page-header">
      <h2>系统日志</h2>
      <p>查看和分析集成系统的运行日志</p>
    </div>

    <!-- 筛选条件 -->
    <div class="filter-section">
      <el-card>
        <el-form :model="filters" inline>
          <el-form-item label="日志级别">
            <el-select v-model="filters.level" placeholder="全部" clearable @change="loadLogs">
              <el-option label="DEBUG" value="debug" />
              <el-option label="INFO" value="info" />
              <el-option label="WARN" value="warn" />
              <el-option label="ERROR" value="error" />
            </el-select>
          </el-form-item>
          <el-form-item label="模块">
            <el-select v-model="filters.module" placeholder="全部" clearable @change="loadLogs">
              <el-option label="自动集成" value="auto_integration" />
              <el-option label="导师匹配" value="mentor_matching" />
              <el-option label="数据同步" value="data_sync" />
              <el-option label="通知服务" value="notification" />
              <el-option label="任务调度" value="scheduler" />
              <el-option label="API接口" value="api" />
            </el-select>
          </el-form-item>
          <el-form-item label="时间范围">
            <el-date-picker
              v-model="filters.timeRange"
              type="datetimerange"
              range-separator="至"
              start-placeholder="开始时间"
              end-placeholder="结束时间"
              @change="loadLogs"
            />
          </el-form-item>
          <el-form-item label="关键词">
            <el-input 
              v-model="filters.keyword" 
              placeholder="搜索关键词" 
              @keyup.enter="loadLogs"
              clearable
            />
          </el-form-item>
          <el-form-item>
            <el-button type="primary" @click="loadLogs">
              <el-icon><Search /></el-icon>
              搜索
            </el-button>
            <el-button @click="resetFilters">
              <el-icon><Refresh /></el-icon>
              重置
            </el-button>
          </el-form-item>
        </el-form>
      </el-card>
    </div>

    <!-- 日志统计 -->
    <div class="statistics-section">
      <el-row :gutter="16">
        <el-col :span="4">
          <el-card class="stat-card">
            <div class="stat-item">
              <div class="stat-icon debug">
                <el-icon><InfoFilled /></el-icon>
              </div>
              <div class="stat-content">
                <div class="stat-value">{{ logStats.debug }}</div>
                <div class="stat-label">DEBUG</div>
              </div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="4">
          <el-card class="stat-card">
            <div class="stat-item">
              <div class="stat-icon info">
                <el-icon><SuccessFilled /></el-icon>
              </div>
              <div class="stat-content">
                <div class="stat-value">{{ logStats.info }}</div>
                <div class="stat-label">INFO</div>
              </div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="4">
          <el-card class="stat-card">
            <div class="stat-item">
              <div class="stat-icon warn">
                <el-icon><Warning /></el-icon>
              </div>
              <div class="stat-content">
                <div class="stat-value">{{ logStats.warn }}</div>
                <div class="stat-label">WARN</div>
              </div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="4">
          <el-card class="stat-card">
            <div class="stat-item">
              <div class="stat-icon error">
                <el-icon><CircleCloseFilled /></el-icon>
              </div>
              <div class="stat-content">
                <div class="stat-value">{{ logStats.error }}</div>
                <div class="stat-label">ERROR</div>
              </div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="8">
          <el-card class="stat-card">
            <div class="stat-item">
              <div class="stat-content">
                <div class="stat-value">{{ logStats.total }}</div>
                <div class="stat-label">总日志数</div>
              </div>
            </div>
          </el-card>
        </el-col>
      </el-row>
    </div>

    <!-- 日志列表 -->
    <div class="logs-section">
      <el-table :data="logs" border v-loading="loading" height="600">
        <el-table-column prop="timestamp" label="时间" width="180" fixed="left">
          <template #default="{ row }">
            <div class="timestamp">{{ formatTimestamp(row.timestamp) }}</div>
          </template>
        </el-table-column>
        <el-table-column prop="level" label="级别" width="80" fixed="left">
          <template #default="{ row }">
            <el-tag :type="getLogLevelType(row.level)" size="small">
              {{ row.level.toUpperCase() }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="module" label="模块" width="120">
          <template #default="{ row }">
            <el-tag size="small">{{ getModuleLabel(row.module) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="message" label="消息" min-width="300">
          <template #default="{ row }">
            <div class="log-message" :class="row.level">
              {{ row.message }}
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="traceId" label="追踪ID" width="120">
          <template #default="{ row }">
            <div class="trace-id">{{ row.traceId }}</div>
          </template>
        </el-table-column>
        <el-table-column prop="requestId" label="请求ID" width="120">
          <template #default="{ row }">
            <div class="request-id">{{ row.requestId }}</div>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="120" fixed="right">
          <template #default="{ row }">
            <el-button size="small" @click="viewLogDetails(row)">详情</el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <!-- 分页 -->
    <div class="pagination-wrapper">
      <el-pagination
        v-model:current-page="pagination.current"
        v-model:page-size="pagination.size"
        :total="pagination.total"
        :page-sizes="[20, 50, 100, 200]"
        layout="total, sizes, prev, pager, next, jumper"
        @size-change="loadLogs"
        @current-change="loadLogs"
      />
    </div>

    <!-- 实时日志控制 -->
    <div class="realtime-controls">
      <el-button 
        :type="isRealtime ? 'danger' : 'primary'"
        @click="toggleRealtime"
      >
        <el-icon v-if="isRealtime"><VideoPause /></el-icon>
        <el-icon v-else><VideoPlay /></el-icon>
        {{ isRealtime ? '停止实时' : '开始实时' }}
      </el-button>
      <el-button @click="clearLogs">
        <el-icon><Delete /></el-icon>
        清空日志
      </el-button>
      <el-button @click="exportLogs">
        <el-icon><Download /></el-icon>
        导出日志
      </el-button>
    </div>

    <!-- 日志详情对话框 -->
    <el-dialog
      v-model="showDetailsDialog"
      title="日志详情"
      width="900px"
    >
      <div v-if="selectedLog" class="log-details">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="时间">{{ formatTimestamp(selectedLog.timestamp) }}</el-descriptions-item>
          <el-descriptions-item label="级别">
            <el-tag :type="getLogLevelType(selectedLog.level)">
              {{ selectedLog.level.toUpperCase() }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="模块">{{ getModuleLabel(selectedLog.module) }}</el-descriptions-item>
          <el-descriptions-item label="追踪ID">{{ selectedLog.traceId }}</el-descriptions-item>
          <el-descriptions-item label="请求ID">{{ selectedLog.requestId }}</el-descriptions-item>
          <el-descriptions-item label="用户ID">{{ selectedLog.userId || '-' }}</el-descriptions-item>
          <el-descriptions-item label="IP地址">{{ selectedLog.ip || '-' }}</el-descriptions-item>
          <el-descriptions-item label="用户代理">{{ selectedLog.userAgent || '-' }}</el-descriptions-item>
          <el-descriptions-item label="消息" :span="2">
            <div class="log-message-detail">{{ selectedLog.message }}</div>
          </el-descriptions-item>
        </el-descriptions>

        <div v-if="selectedLog.stack" class="stack-trace">
          <h4>堆栈跟踪</h4>
          <pre class="stack-content">{{ selectedLog.stack }}</pre>
        </div>

        <div v-if="selectedLog.context" class="context-info">
          <h4>上下文信息</h4>
          <pre class="context-content">{{ JSON.stringify(selectedLog.context, null, 2) }}</pre>
        </div>

        <div v-if="selectedLog.relatedLogs && selectedLog.relatedLogs.length > 0" class="related-logs">
          <h4>相关日志</h4>
          <div class="related-logs-list">
            <div 
              v-for="relatedLog in selectedLog.relatedLogs" 
              :key="relatedLog.id"
              class="related-log-item"
            >
              <el-tag :type="getLogLevelType(relatedLog.level)" size="small">
                {{ relatedLog.level.toUpperCase() }}
              </el-tag>
              <span class="related-log-time">{{ formatTimestamp(relatedLog.timestamp) }}</span>
              <span class="related-log-message">{{ relatedLog.message }}</span>
            </div>
          </div>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, reactive } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { 
  Search, 
  Refresh, 
  InfoFilled, 
  SuccessFilled, 
  Warning, 
  CircleCloseFilled,
  VideoPlay,
  VideoPause,
  Delete,
  Download
} from '@element-plus/icons-vue';
import type { LogEntry } from '@/types';

// 响应式数据
const logs = ref<LogEntry[]>([]);
const loading = ref(false);
const showDetailsDialog = ref(false);
const selectedLog = ref<LogEntry | null>(null);
const isRealtime = ref(false);
const realtimeTimer = ref<NodeJS.Timeout | null>(null);

const filters = reactive({
  level: '',
  module: '',
  timeRange: null,
  keyword: ''
});

const pagination = reactive({
  current: 1,
  size: 50,
  total: 0
});

const logStats = ref({
  debug: 0,
  info: 0,
  warn: 0,
  error: 0,
  total: 0
});

// 生命周期
onMounted(() => {
  loadLogs();
  loadLogStats();
});

onUnmounted(() => {
  if (realtimeTimer.value) {
    clearInterval(realtimeTimer.value);
  }
});

// 方法
const loadLogs = async () => {
  loading.value = true;
  try {
    // 模拟日志数据
    const mockLogs = [
      {
        id: 'log-1',
        timestamp: new Date(Date.now() - 1000 * 60 * 5),
        level: 'info',
        module: 'auto_integration',
        message: '培训项目集成完成，创建了5个带教项目',
        traceId: 'trace-001',
        requestId: 'req-001',
        userId: 'user-123',
        ip: '192.168.1.100',
        userAgent: 'Mozilla/5.0...',
        context: {
          trainingProjectId: 'training-001',
          mentorshipProjectIds: ['mentorship-001', 'mentorship-002'],
          ruleId: 'auto-create-mentorship-high-score'
        }
      },
      {
        id: 'log-2',
        timestamp: new Date(Date.now() - 1000 * 60 * 10),
        level: 'warn',
        module: 'mentor_matching',
        message: '导师匹配算法发现潜在冲突：导师工作负载过高',
        traceId: 'trace-002',
        requestId: 'req-002',
        userId: 'system',
        context: {
          mentorId: 'mentor-001',
          currentLoad: 8,
          maxLoad: 5,
          studentId: 'student-001'
        }
      },
      {
        id: 'log-3',
        timestamp: new Date(Date.now() - 1000 * 60 * 15),
        level: 'error',
        module: 'data_sync',
        message: '数据同步失败：API接口连接超时',
        traceId: 'trace-003',
        requestId: 'req-003',
        userId: 'system',
        stack: 'Error: Connection timeout\n  at DataSyncService.syncData (sync.js:123)\n  at async SyncTask.execute (task.js:45)',
        context: {
          syncTaskId: 'sync-001',
          sourceType: 'training',
          sourceId: 'training-001',
          targetType: 'mentorship',
          error: 'ETIMEDOUT'
        }
      },
      {
        id: 'log-4',
        timestamp: new Date(Date.now() - 1000 * 60 * 20),
        level: 'debug',
        module: 'notification',
        message: '发送通知：带教项目创建成功',
        traceId: 'trace-004',
        requestId: 'req-004',
        userId: 'system',
        context: {
          notificationId: 'notification-001',
          templateId: 'template-001',
          recipientId: 'user-456',
          channel: 'email'
        }
      },
      {
        id: 'log-5',
        timestamp: new Date(Date.now() - 1000 * 60 * 25),
        level: 'info',
        module: 'scheduler',
        message: '定时任务启动：每日数据同步',
        traceId: 'trace-005',
        requestId: 'req-005',
        userId: 'system',
        context: {
          jobId: 'daily-sync',
          scheduledTime: '02:00:00',
          nextRun: new Date(Date.now() + 1000 * 60 * 60 * 24)
        }
      }
    ];

    // 应用筛选
    let filteredLogs = [...mockLogs];
    
    if (filters.level) {
      filteredLogs = filteredLogs.filter(log => log.level === filters.level);
    }
    
    if (filters.module) {
      filteredLogs = filteredLogs.filter(log => log.module === filters.module);
    }
    
    if (filters.keyword) {
      filteredLogs = filteredLogs.filter(log => 
        log.message.toLowerCase().includes(filters.keyword.toLowerCase())
      );
    }

    logs.value = filteredLogs;
    pagination.total = filteredLogs.length;
  } catch (error) {
    ElMessage.error('加载日志失败');
  } finally {
    loading.value = false;
  }
};

const loadLogStats = () => {
  // 模拟统计数据
  logStats.value = {
    debug: 125,
    info: 438,
    warn: 23,
    error: 7,
    total: 593
  };
};

const viewLogDetails = (log: LogEntry) => {
  selectedLog.value = log;
  showDetailsDialog.value = true;
};

const toggleRealtime = () => {
  isRealtime.value = !isRealtime.value;
  
  if (isRealtime.value) {
    // 开始实时日志
    realtimeTimer.value = setInterval(() => {
      loadLogs();
    }, 5000);
    ElMessage.success('开始实时日志监控');
  } else {
    // 停止实时日志
    if (realtimeTimer.value) {
      clearInterval(realtimeTimer.value);
      realtimeTimer.value = null;
    }
    ElMessage.info('停止实时日志监控');
  }
};

const clearLogs = async () => {
  try {
    await ElMessageBox.confirm('确定要清空所有日志吗？此操作不可恢复！', '确认清空', {
      type: 'warning'
    });
    
    logs.value = [];
    pagination.total = 0;
    ElMessage.success('日志已清空');
  } catch {
    // 用户取消
  }
};

const exportLogs = () => {
  // 导出日志功能
  ElMessage.info('导出功能开发中...');
};

const resetFilters = () => {
  filters.level = '';
  filters.module = '';
  filters.timeRange = null;
  filters.keyword = '';
  loadLogs();
};

// 工具方法
const getLogLevelType = (level: string) => {
  const types = {
    debug: 'info',
    info: 'success',
    warn: 'warning',
    error: 'danger'
  };
  return types[level] || 'info';
};

const getModuleLabel = (module: string) => {
  const labels = {
    auto_integration: '自动集成',
    mentor_matching: '导师匹配',
    data_sync: '数据同步',
    notification: '通知服务',
    scheduler: '任务调度',
    api: 'API接口'
  };
  return labels[module] || module;
};

const formatTimestamp = (timestamp: Date) => {
  return new Intl.DateTimeFormat('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    fractionalSecondDigits: 3
  }).format(timestamp);
};
</script>

<style scoped>
.integration-logs {
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

.filter-section {
  margin-bottom: 20px;
}

.statistics-section {
  margin-bottom: 20px;
}

.stat-card {
  height: 100px;
}

.stat-item {
  display: flex;
  align-items: center;
  height: 100%;
}

.stat-icon {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 16px;
}

.stat-icon.debug {
  background-color: #E6F7FF;
  color: #1890FF;
}

.stat-icon.info {
  background-color: #F6FFED;
  color: #52C41A;
}

.stat-icon.warn {
  background-color: #FFF7E6;
  color: #FA8C16;
}

.stat-icon.error {
  background-color: #FFF2F0;
  color: #F5222D;
}

.stat-content {
  flex: 1;
}

.stat-value {
  font-size: 24px;
  font-weight: bold;
  color: #303133;
  margin-bottom: 4px;
}

.stat-label {
  font-size: 14px;
  color: #909399;
}

.logs-section {
  margin-bottom: 20px;
}

.timestamp {
  font-family: monospace;
  font-size: 12px;
}

.log-message {
  font-size: 14px;
  line-height: 1.5;
}

.log-message.error {
  color: #F56C6C;
}

.log-message.warn {
  color: #E6A23C;
}

.trace-id,
.request-id {
  font-family: monospace;
  font-size: 12px;
  color: #909399;
}

.pagination-wrapper {
  margin-bottom: 20px;
  text-align: right;
}

.realtime-controls {
  position: fixed;
  bottom: 20px;
  right: 20px;
  display: flex;
  gap: 8px;
  z-index: 1000;
}

.log-details {
  max-height: 600px;
  overflow-y: auto;
}

.log-message-detail {
  white-space: pre-wrap;
  word-wrap: break-word;
  background-color: #F5F7FA;
  padding: 12px;
  border-radius: 4px;
  font-size: 14px;
  color: #606266;
}

.stack-trace,
.context-info,
.related-logs {
  margin-top: 20px;
}

.stack-trace h4,
.context-info h4,
.related-logs h4 {
  margin: 0 0 10px 0;
  color: #303133;
}

.stack-content,
.context-content {
  background-color: #F5F7FA;
  padding: 12px;
  border-radius: 4px;
  font-size: 12px;
  color: #606266;
  white-space: pre-wrap;
  word-wrap: break-word;
  max-height: 200px;
  overflow-y: auto;
}

.related-logs-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.related-log-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px;
  background-color: #F5F7FA;
  border-radius: 4px;
}

.related-log-time {
  font-family: monospace;
  font-size: 12px;
  color: #909399;
  min-width: 120px;
}

.related-log-message {
  font-size: 14px;
  color: #606266;
  flex: 1;
}
</style> 