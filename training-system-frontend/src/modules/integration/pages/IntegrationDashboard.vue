<template>
  <div class="integration-dashboard">
    <div class="page-header">
      <h2>系统集成概览</h2>
      <p>培训项目与带教项目的集成状态监控</p>
    </div>

    <!-- 关键指标 -->
    <el-row :gutter="20" class="metrics-row">
      <el-col :span="6">
        <el-card class="metric-card">
          <div class="metric-content">
            <div class="metric-icon">
              <el-icon size="32" color="#409EFF"><Connection /></el-icon>
            </div>
            <div class="metric-info">
              <div class="metric-value">{{ metrics.totalIntegrations }}</div>
              <div class="metric-label">总集成数</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="metric-card">
          <div class="metric-content">
            <div class="metric-icon">
              <el-icon size="32" color="#67C23A"><SuccessFilled /></el-icon>
            </div>
            <div class="metric-info">
              <div class="metric-value">{{ metrics.successRate }}%</div>
              <div class="metric-label">成功率</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="metric-card">
          <div class="metric-content">
            <div class="metric-icon">
              <el-icon size="32" color="#E6A23C"><Clock /></el-icon>
            </div>
            <div class="metric-info">
              <div class="metric-value">{{ metrics.pendingTasks }}</div>
              <div class="metric-label">待处理任务</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="metric-card">
          <div class="metric-content">
            <div class="metric-icon">
              <el-icon size="32" color="#F56C6C"><Warning /></el-icon>
            </div>
            <div class="metric-info">
              <div class="metric-value">{{ metrics.failedTasks }}</div>
              <div class="metric-label">失败任务</div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 快速操作 -->
    <el-card class="section-card">
      <template #header>
        <div class="card-header">
          <h3>快速操作</h3>
        </div>
      </template>
      <el-row :gutter="16">
        <el-col :span="6">
          <el-button 
            type="primary" 
            size="large" 
            @click="$router.push('/training-management/growth-development/integration/management')"
            class="quick-action-btn"
          >
            <el-icon><Setting /></el-icon>
            集成管理
          </el-button>
        </el-col>
        <el-col :span="6">
          <el-button 
            type="success" 
            size="large" 
            @click="$router.push('/training-management/growth-development/integration/tasks')"
            class="quick-action-btn"
          >
            <el-icon><Refresh /></el-icon>
            同步任务
          </el-button>
        </el-col>
        <el-col :span="6">
          <el-button 
            type="warning" 
            size="large" 
            @click="$router.push('/training-management/growth-development/integration/matching')"
            class="quick-action-btn"
          >
            <el-icon><UserFilled /></el-icon>
            导师匹配
          </el-button>
        </el-col>
        <el-col :span="6">
          <el-button 
            type="info" 
            size="large" 
            @click="$router.push('/training-management/growth-development/integration/logs')"
            class="quick-action-btn"
          >
            <el-icon><Document /></el-icon>
            系统日志
          </el-button>
        </el-col>
      </el-row>
    </el-card>

    <!-- 最近活动 -->
    <el-row :gutter="20">
      <el-col :span="12">
        <el-card class="section-card">
          <template #header>
            <div class="card-header">
              <h3>最近集成活动</h3>
              <el-button type="text" @click="$router.push('/training-management/growth-development/integration/tasks')">
                查看全部
              </el-button>
            </div>
          </template>
          <div class="activity-list">
            <div 
              v-for="activity in recentActivities" 
              :key="activity.id"
              class="activity-item"
            >
              <div class="activity-icon">
                <el-icon :color="getActivityColor(activity.type)">
                  <component :is="getActivityIcon(activity.type)" />
                </el-icon>
              </div>
              <div class="activity-content">
                <div class="activity-title">{{ activity.title }}</div>
                <div class="activity-desc">{{ activity.description }}</div>
                <div class="activity-time">{{ formatTime(activity.createdAt) }}</div>
              </div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="12">
        <el-card class="section-card">
          <template #header>
            <div class="card-header">
              <h3>系统状态</h3>
            </div>
          </template>
          <div class="status-list">
            <div class="status-item">
              <span class="status-label">自动集成服务</span>
              <el-tag type="success">运行中</el-tag>
            </div>
            <div class="status-item">
              <span class="status-label">导师匹配服务</span>
              <el-tag type="success">运行中</el-tag>
            </div>
            <div class="status-item">
              <span class="status-label">数据同步服务</span>
              <el-tag type="success">运行中</el-tag>
            </div>
            <div class="status-item">
              <span class="status-label">通知服务</span>
              <el-tag type="success">运行中</el-tag>
            </div>
            <div class="status-item">
              <span class="status-label">队列处理器</span>
              <el-tag type="warning">繁忙</el-tag>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { 
  Connection, 
  SuccessFilled, 
  Clock, 
  Warning, 
  Setting, 
  Refresh, 
  UserFilled, 
  Document,
  Check,
  Close,
  InfoFilled
} from '@element-plus/icons-vue';

// 响应式数据
const metrics = ref({
  totalIntegrations: 0,
  successRate: 0,
  pendingTasks: 0,
  failedTasks: 0
});

const recentActivities = ref([
  {
    id: 1,
    type: 'success',
    title: '培训项目自动集成完成',
    description: '前端技能培训项目已成功创建5个带教项目',
    createdAt: new Date(Date.now() - 1000 * 60 * 30) // 30分钟前
  },
  {
    id: 2,
    type: 'warning',
    title: '导师匹配需要审核',
    description: '学员王五的导师匹配需要人工审核',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2) // 2小时前
  },
  {
    id: 3,
    type: 'info',
    title: '数据同步完成',
    description: '带教项目进度已同步到成长档案',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 4) // 4小时前
  },
  {
    id: 4,
    type: 'error',
    title: '同步任务失败',
    description: '培训记录同步失败，请检查网络连接',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 6) // 6小时前
  }
]);

// 生命周期
onMounted(() => {
  loadMetrics();
});

// 方法
const loadMetrics = async () => {
  // 模拟数据加载
  metrics.value = {
    totalIntegrations: 128,
    successRate: 94.5,
    pendingTasks: 3,
    failedTasks: 2
  };
};

const getActivityColor = (type: string) => {
  const colors = {
    success: '#67C23A',
    warning: '#E6A23C',
    info: '#409EFF',
    error: '#F56C6C'
  };
  return colors[type] || '#909399';
};

const getActivityIcon = (type: string) => {
  const icons = {
    success: 'Check',
    warning: 'Warning',
    info: 'InfoFilled',
    error: 'Close'
  };
  return icons[type] || 'InfoFilled';
};

const formatTime = (date: Date) => {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / (1000 * 60));
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (minutes < 60) {
    return `${minutes}分钟前`;
  } else if (hours < 24) {
    return `${hours}小时前`;
  } else {
    return `${days}天前`;
  }
};
</script>

<style scoped>
.integration-dashboard {
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

.metrics-row {
  margin-bottom: 24px;
}

.metric-card {
  height: 120px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.metric-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
}

.metric-content {
  display: flex;
  align-items: center;
  height: 100%;
}

.metric-icon {
  margin-right: 16px;
}

.metric-info {
  flex: 1;
}

.metric-value {
  font-size: 32px;
  font-weight: bold;
  color: #303133;
  margin-bottom: 4px;
}

.metric-label {
  font-size: 14px;
  color: #909399;
}

.section-card {
  margin-bottom: 24px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.card-header h3 {
  margin: 0;
  font-size: 18px;
  color: #303133;
}

.quick-action-btn {
  width: 100%;
  height: 60px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.activity-list {
  max-height: 400px;
  overflow-y: auto;
}

.activity-item {
  display: flex;
  align-items: flex-start;
  padding: 16px 0;
  border-bottom: 1px solid #EBEEF5;
}

.activity-item:last-child {
  border-bottom: none;
}

.activity-icon {
  margin-right: 12px;
  margin-top: 4px;
}

.activity-content {
  flex: 1;
}

.activity-title {
  font-size: 14px;
  font-weight: 500;
  color: #303133;
  margin-bottom: 4px;
}

.activity-desc {
  font-size: 12px;
  color: #606266;
  margin-bottom: 8px;
}

.activity-time {
  font-size: 12px;
  color: #909399;
}

.status-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.status-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 0;
  border-bottom: 1px solid #EBEEF5;
}

.status-item:last-child {
  border-bottom: none;
}

.status-label {
  font-size: 14px;
  color: #303133;
}
</style> 