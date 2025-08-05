<template>
  <div class="integration-management">
    <!-- 页面标题 -->
    <div class="page-header">
      <h2>系统集成管理</h2>
      <p>管理培训项目与带教项目的自动集成流程</p>
    </div>

    <!-- 统计卡片 -->
    <el-row :gutter="20" class="stats-row">
      <el-col :span="6">
        <el-card class="stats-card">
          <div class="stat-item">
            <div class="stat-value">{{ statistics.totalTasks }}</div>
            <div class="stat-label">总任务数</div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stats-card">
          <div class="stat-item">
            <div class="stat-value success">{{ statistics.completedTasks }}</div>
            <div class="stat-label">完成任务</div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stats-card">
          <div class="stat-item">
            <div class="stat-value danger">{{ statistics.failedTasks }}</div>
            <div class="stat-label">失败任务</div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stats-card">
          <div class="stat-item">
            <div class="stat-value warning">{{ statistics.pendingTasks }}</div>
            <div class="stat-label">等待任务</div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 标签页 -->
    <el-tabs v-model="activeTab" type="border-card">
      <!-- 集成规则管理 -->
      <el-tab-pane label="集成规则" name="rules">
        <div class="rules-section">
          <div class="section-header">
            <h3>集成规则</h3>
            <el-button type="primary" @click="showRuleDialog = true">
              <el-icon><Plus /></el-icon>
              新增规则
            </el-button>
          </div>

          <el-table :data="integrationRules" border stripe>
            <el-table-column prop="name" label="规则名称" min-width="200" />
            <el-table-column prop="description" label="描述" min-width="300" />
            <el-table-column prop="enabled" label="状态" width="100">
              <template #default="{ row }">
                <el-switch
                  v-model="row.enabled"
                  @change="toggleRuleEnabled(row)"
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
            <el-table-column prop="direction" label="方向" width="120">
              <template #default="{ row }">
                <el-tag :type="row.direction === 'bidirectional' ? 'success' : 'info'">
                  {{ row.direction === 'bidirectional' ? '双向' : '单向' }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="triggers" label="触发器" width="150">
              <template #default="{ row }">
                <el-tag
                  v-for="trigger in row.triggers"
                  :key="trigger.event"
                  size="small"
                  class="trigger-tag"
                >
                  {{ getTriggerLabel(trigger.event) }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="200" fixed="right">
              <template #default="{ row }">
                <el-button size="small" @click="editRule(row)">编辑</el-button>
                <el-button size="small" type="warning" @click="testRule(row)">测试</el-button>
                <el-button size="small" type="danger" @click="deleteRule(row)">删除</el-button>
              </template>
            </el-table-column>
          </el-table>
        </div>
      </el-tab-pane>

      <!-- 同步任务监控 -->
      <el-tab-pane label="同步任务" name="tasks">
        <div class="tasks-section">
          <div class="section-header">
            <h3>同步任务</h3>
            <div class="header-controls">
              <el-select v-model="taskFilter" placeholder="筛选状态" clearable>
                <el-option label="全部" value="" />
                <el-option label="等待中" value="pending" />
                <el-option label="运行中" value="running" />
                <el-option label="已完成" value="completed" />
                <el-option label="失败" value="failed" />
              </el-select>
              <el-button type="primary" @click="showTriggerDialog = true">
                <el-icon><Operation /></el-icon>
                手动触发
              </el-button>
            </div>
          </div>

          <el-table :data="filteredTasks" border stripe>
            <el-table-column prop="id" label="任务ID" width="150" />
            <el-table-column prop="type" label="类型" width="180">
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
            <el-table-column prop="createdAt" label="创建时间" width="180">
              <template #default="{ row }">
                {{ formatDate(row.scheduledAt || new Date()) }}
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
        </div>
      </el-tab-pane>

      <!-- 匹配结果 -->
      <el-tab-pane label="导师匹配" name="matching">
        <div class="matching-section">
          <div class="section-header">
            <h3>导师匹配结果</h3>
            <el-button type="primary" @click="showMatchingDialog = true">
              <el-icon><Search /></el-icon>
              重新匹配
            </el-button>
          </div>

          <el-table :data="matchingResults" border stripe>
            <el-table-column prop="studentName" label="学员姓名" width="120" />
            <el-table-column prop="department" label="部门" width="120" />
            <el-table-column prop="requiredSkills" label="需求技能" min-width="200">
              <template #default="{ row }">
                <el-tag
                  v-for="skill in row.requiredSkills"
                  :key="skill"
                  size="small"
                  class="skill-tag"
                >
                  {{ skill }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="mentorName" label="匹配导师" width="120" />
            <el-table-column prop="matchScore" label="匹配度" width="120">
              <template #default="{ row }">
                <div class="match-score">
                  <el-progress
                    :percentage="Math.round(row.matchScore * 100)"
                    :color="getMatchScoreColor(row.matchScore)"
                    :stroke-width="8"
                  />
                  <span class="score-text">{{ (row.matchScore * 100).toFixed(1) }}%</span>
                </div>
              </template>
            </el-table-column>
            <el-table-column prop="reasons" label="匹配原因" min-width="300">
              <template #default="{ row }">
                <div class="match-reasons">
                  <el-tag
                    v-for="reason in row.reasons.slice(0, 2)"
                    :key="reason"
                    size="small"
                    type="info"
                  >
                    {{ reason }}
                  </el-tag>
                  <el-popover
                    v-if="row.reasons.length > 2"
                    placement="top"
                    width="300"
                    trigger="hover"
                  >
                    <div class="all-reasons">
                      <p v-for="reason in row.reasons" :key="reason">• {{ reason }}</p>
                    </div>
                    <template #reference>
                      <el-tag size="small" type="primary">
                        +{{ row.reasons.length - 2 }}
                      </el-tag>
                    </template>
                  </el-popover>
                </div>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="150" fixed="right">
              <template #default="{ row }">
                <el-button size="small" @click="viewMatchDetails(row)">详情</el-button>
                <el-button size="small" type="warning" @click="rejectMatch(row)">拒绝</el-button>
              </template>
            </el-table-column>
          </el-table>
        </div>
      </el-tab-pane>

      <!-- 系统日志 -->
      <el-tab-pane label="系统日志" name="logs">
        <div class="logs-section">
          <div class="section-header">
            <h3>系统日志</h3>
            <div class="header-controls">
              <el-select v-model="logLevel" placeholder="日志级别" clearable>
                <el-option label="全部" value="" />
                <el-option label="信息" value="info" />
                <el-option label="警告" value="warning" />
                <el-option label="错误" value="error" />
              </el-select>
              <el-button @click="clearLogs" type="danger" plain>清空日志</el-button>
            </div>
          </div>

          <div class="log-container">
            <div 
              v-for="log in filteredLogs" 
              :key="log.id"
              :class="['log-item', log.level]"
            >
              <div class="log-header">
                <span class="log-time">{{ formatTime(log.timestamp) }}</span>
                <el-tag :type="getLogLevelType(log.level)" size="small">
                  {{ log.level.toUpperCase() }}
                </el-tag>
                <span class="log-module">{{ log.module }}</span>
              </div>
              <div class="log-content">{{ log.message }}</div>
              <div v-if="log.details" class="log-details">
                <pre>{{ JSON.stringify(log.details, null, 2) }}</pre>
              </div>
            </div>
          </div>
        </div>
      </el-tab-pane>
    </el-tabs>

    <!-- 新增规则对话框 -->
    <el-dialog
      v-model="showRuleDialog"
      title="新增集成规则"
      width="800px"
    >
      <RuleEditor
        :rule="editingRule"
        @save="saveRule"
        @cancel="showRuleDialog = false"
      />
    </el-dialog>

    <!-- 手动触发对话框 -->
    <el-dialog
      v-model="showTriggerDialog"
      title="手动触发同步"
      width="600px"
    >
      <ManualTrigger
        @trigger="handleManualTrigger"
        @cancel="showTriggerDialog = false"
      />
    </el-dialog>

    <!-- 导师匹配对话框 -->
    <el-dialog
      v-model="showMatchingDialog"
      title="导师匹配"
      width="700px"
    >
      <MentorMatching
        @match="handleMentorMatching"
        @cancel="showMatchingDialog = false"
      />
    </el-dialog>

    <!-- 任务详情对话框 -->
    <el-dialog
      v-model="showTaskDetailsDialog"
      title="任务详情"
      width="800px"
    >
      <TaskDetails
        v-if="selectedTask"
        :task="selectedTask"
        @close="showTaskDetailsDialog = false"
      />
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { Plus, Operation, Search } from '@element-plus/icons-vue';
import { 
  autoIntegrationService, 
  dataSyncService, 
  mentorMatchingService 
} from '../services';
import type { 
  IntegrationRule, 
  SyncTask, 
  MatchingResult 
} from '@/types';

// 子组件（这里只是引用，实际需要单独创建）
import RuleEditor from './RuleEditor.vue';
import ManualTrigger from './ManualTrigger.vue';
import MentorMatching from './MentorMatching.vue';
import TaskDetails from './TaskDetails.vue';

// 响应式数据
const activeTab = ref('rules');
const taskFilter = ref('');
const logLevel = ref('');

// 对话框控制
const showRuleDialog = ref(false);
const showTriggerDialog = ref(false);
const showMatchingDialog = ref(false);
const showTaskDetailsDialog = ref(false);

// 数据
const integrationRules = ref<IntegrationRule[]>([]);
const syncTasks = ref<SyncTask[]>([]);
const matchingResults = ref<MatchingResult[]>([]);
const systemLogs = ref<any[]>([]);
const statistics = ref({
  totalTasks: 0,
  completedTasks: 0,
  failedTasks: 0,
  pendingTasks: 0,
  averageExecutionTime: 0
});

// 编辑相关
const editingRule = ref<IntegrationRule | null>(null);
const selectedTask = ref<SyncTask | null>(null);

// 计算属性
const filteredTasks = computed(() => {
  if (!taskFilter.value) return syncTasks.value;
  return syncTasks.value.filter(task => task.status === taskFilter.value);
});

const filteredLogs = computed(() => {
  if (!logLevel.value) return systemLogs.value;
  return systemLogs.value.filter(log => log.level === logLevel.value);
});

// 生命周期
onMounted(() => {
  loadData();
});

// 方法
const loadData = async () => {
  try {
    // 加载集成规则
    integrationRules.value = autoIntegrationService.getRules();
    
    // 加载同步任务（模拟数据）
    syncTasks.value = [
      {
        id: 'sync-1',
        type: 'training_to_mentorship',
        source: 'training',
        sourceId: 'training-1',
        status: 'completed',
        priority: 'high',
        progress: 100,
        errors: [],
        warnings: [],
        metadata: { ruleId: 'auto-create-mentorship-high-score' }
      },
      {
        id: 'sync-2',
        type: 'mentorship_to_training',
        source: 'mentorship',
        sourceId: 'mentorship-1',
        status: 'running',
        priority: 'medium',
        progress: 65,
        errors: [],
        warnings: [],
        metadata: { ruleId: 'mentorship-progress-to-profile' }
      }
    ] as SyncTask[];

    // 加载匹配结果（模拟数据）
    matchingResults.value = [
      {
        mentor: {
          id: 'mentor-1',
          name: '李高级',
          department: '技术部',
          expertise: ['JavaScript', 'Vue.js'],
          rating: 4.8
        },
        score: 0.92,
        studentName: '张三',
        department: '技术部',
        requiredSkills: ['JavaScript', 'Vue.js'],
        mentorName: '李高级',
        matchScore: 0.92,
        reasons: ['技能匹配度高', '同部门协作', '导师评分优秀'],
        breakdown: {
          skillsMatch: 0.95,
          departmentMatch: 1.0,
          workloadScore: 0.8,
          ratingScore: 0.96,
          experienceScore: 0.9,
          styleMatch: 0.8,
          overallFit: 0.92
        },
        warnings: []
      }
    ] as any[];

    // 加载统计数据
    statistics.value = dataSyncService.getSyncStatistics();

    // 加载系统日志（模拟数据）
    systemLogs.value = [
      {
        id: 'log-1',
        level: 'info',
        module: '自动集成',
        message: '培训项目"前端技能培训"完成，开始自动创建带教项目',
        timestamp: new Date(),
        details: { projectId: 'training-1', score: 85 }
      },
      {
        id: 'log-2',
        level: 'warning',
        module: '导师匹配',
        message: '学员"王五"未找到合适导师，需要人工干预',
        timestamp: new Date(),
        details: { studentId: 'student-2', requiredSkills: ['Python', 'AI'] }
      },
      {
        id: 'log-3',
        level: 'error',
        module: '数据同步',
        message: '同步任务失败：目标系统连接超时',
        timestamp: new Date(),
        details: { taskId: 'sync-3', error: 'Connection timeout' }
      }
    ];
  } catch (error) {
    console.error('加载数据失败:', error);
    ElMessage.error('加载数据失败');
  }
};

// 规则管理
const editRule = (rule: IntegrationRule) => {
  editingRule.value = { ...rule };
  showRuleDialog.value = true;
};

const saveRule = (rule: IntegrationRule) => {
  if (rule.id) {
    // 更新规则
    autoIntegrationService.updateRule(rule.id, rule);
    ElMessage.success('规则更新成功');
  } else {
    // 新增规则
    autoIntegrationService.addRule(rule);
    ElMessage.success('规则添加成功');
  }
  
  showRuleDialog.value = false;
  editingRule.value = null;
  loadData();
};

const deleteRule = async (rule: IntegrationRule) => {
  try {
    await ElMessageBox.confirm('确定要删除这个规则吗？', '确认删除', {
      type: 'warning'
    });
    
    autoIntegrationService.deleteRule(rule.id);
    ElMessage.success('规则删除成功');
    loadData();
  } catch {
    // 用户取消删除
  }
};

const toggleRuleEnabled = (rule: IntegrationRule) => {
  autoIntegrationService.updateRule(rule.id, { enabled: rule.enabled });
  ElMessage.success(`规则已${rule.enabled ? '启用' : '禁用'}`);
};

const testRule = async (rule: IntegrationRule) => {
  try {
    // 模拟测试上下文
    const testContext = {
      trainingProject: {
        id: 'test-project',
        name: '测试项目',
        status: 'completed',
        participants: [{
          userId: 'test-user',
          finalScore: 85
        }]
      },
      student: {
        id: 'test-student',
        name: '测试学员',
        department: '技术部'
      },
      department: '技术部',
      metadata: {}
    };

    const result = await autoIntegrationService.testRule(rule.id, testContext);
    
    if (result.success) {
      ElMessage.success('规则测试通过');
    } else {
      ElMessage.warning(`规则测试失败：${result.errors.join(', ')}`);
    }
  } catch (error) {
    ElMessage.error('规则测试失败');
  }
};

// 任务管理
const viewTaskDetails = (task: SyncTask) => {
  selectedTask.value = task;
  showTaskDetailsDialog.value = true;
};

const cancelTask = async (task: SyncTask) => {
  try {
    await ElMessageBox.confirm('确定要取消这个任务吗？', '确认取消', {
      type: 'warning'
    });
    
    dataSyncService.cancelSyncTask(task.id);
    ElMessage.success('任务已取消');
    loadData();
  } catch {
    // 用户取消
  }
};

const retryTask = (task: SyncTask) => {
  // 创建新的重试任务
  dataSyncService.createSyncTask({
    type: task.type,
    source: task.source,
    sourceId: task.sourceId,
    targetId: task.targetId,
    priority: 'high',
    metadata: { ...task.metadata, retry: true }
  });
  
  ElMessage.success('重试任务已创建');
  loadData();
};

// 手动触发
const handleManualTrigger = (triggerData: any) => {
  const taskId = dataSyncService.triggerSync(triggerData.sourceType, triggerData.sourceId);
  ElMessage.success('同步任务已创建');
  showTriggerDialog.value = false;
  loadData();
};

// 导师匹配
const handleMentorMatching = async (matchingData: any) => {
  try {
    const results = await mentorMatchingService.findBestMatches(matchingData);
    matchingResults.value = results;
    ElMessage.success('导师匹配完成');
    showMatchingDialog.value = false;
  } catch (error) {
    ElMessage.error('导师匹配失败');
  }
};

const viewMatchDetails = (match: any) => {
  // 显示匹配详情
  ElMessageBox.alert(
    `匹配详情：
技能匹配: ${(match.breakdown.skillsMatch * 100).toFixed(1)}%
部门匹配: ${(match.breakdown.departmentMatch * 100).toFixed(1)}%
工作负载: ${(match.breakdown.workloadScore * 100).toFixed(1)}%
导师评分: ${(match.breakdown.ratingScore * 100).toFixed(1)}%
经验评分: ${(match.breakdown.experienceScore * 100).toFixed(1)}%
风格匹配: ${(match.breakdown.styleMatch * 100).toFixed(1)}%`,
    '匹配详情',
    { type: 'info' }
  );
};

const rejectMatch = async (match: any) => {
  try {
    await ElMessageBox.confirm('确定要拒绝这个匹配吗？', '确认拒绝', {
      type: 'warning'
    });
    
    // 移除这个匹配结果
    const index = matchingResults.value.findIndex(m => m === match);
    if (index > -1) {
      matchingResults.value.splice(index, 1);
    }
    
    ElMessage.success('匹配已拒绝');
  } catch {
    // 用户取消
  }
};

// 日志管理
const clearLogs = async () => {
  try {
    await ElMessageBox.confirm('确定要清空所有日志吗？', '确认清空', {
      type: 'warning'
    });
    
    systemLogs.value = [];
    ElMessage.success('日志已清空');
  } catch {
    // 用户取消
  }
};

// 工具方法
const formatDate = (date: Date) => {
  return new Intl.DateTimeFormat('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date);
};

const formatTime = (date: Date) => {
  return new Intl.DateTimeFormat('zh-CN', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  }).format(date);
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

const getTriggerLabel = (event: string) => {
  const labels = {
    create: '创建',
    update: '更新',
    delete: '删除',
    status_change: '状态变更',
    schedule: '定时'
  };
  return labels[event] || event;
};

const getMatchScoreColor = (score: number) => {
  if (score >= 0.8) return '#67C23A';
  if (score >= 0.6) return '#E6A23C';
  return '#F56C6C';
};

const getLogLevelType = (level: string) => {
  const types = {
    info: 'primary',
    warning: 'warning',
    error: 'danger'
  };
  return types[level] || 'info';
};
</script>

<style scoped>
.integration-management {
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

.stats-row {
  margin-bottom: 24px;
}

.stats-card {
  text-align: center;
}

.stat-item {
  padding: 20px;
}

.stat-value {
  font-size: 32px;
  font-weight: bold;
  color: #303133;
  margin-bottom: 8px;
}

.stat-value.success {
  color: #67C23A;
}

.stat-value.danger {
  color: #F56C6C;
}

.stat-value.warning {
  color: #E6A23C;
}

.stat-label {
  font-size: 14px;
  color: #909399;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.section-header h3 {
  margin: 0;
  font-size: 18px;
  color: #303133;
}

.header-controls {
  display: flex;
  gap: 12px;
}

.trigger-tag {
  margin-right: 4px;
  margin-bottom: 4px;
}

.skill-tag {
  margin-right: 4px;
  margin-bottom: 4px;
}

.match-score {
  display: flex;
  align-items: center;
  gap: 8px;
}

.score-text {
  font-weight: bold;
  color: #303133;
}

.match-reasons {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.all-reasons p {
  margin: 4px 0;
  color: #606266;
}

.log-container {
  max-height: 500px;
  overflow-y: auto;
  border: 1px solid #EBEEF5;
  border-radius: 4px;
}

.log-item {
  padding: 16px;
  border-bottom: 1px solid #EBEEF5;
}

.log-item:last-child {
  border-bottom: none;
}

.log-item.warning {
  background-color: #FDF6EC;
}

.log-item.error {
  background-color: #FEF0F0;
}

.log-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 8px;
}

.log-time {
  font-size: 12px;
  color: #909399;
}

.log-module {
  font-size: 12px;
  color: #606266;
}

.log-content {
  color: #303133;
  margin-bottom: 8px;
}

.log-details {
  background-color: #F5F7FA;
  padding: 8px;
  border-radius: 4px;
  font-size: 12px;
}

.log-details pre {
  margin: 0;
  color: #606266;
  white-space: pre-wrap;
}
</style> 