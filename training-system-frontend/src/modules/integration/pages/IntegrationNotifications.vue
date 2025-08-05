<template>
  <div class="integration-notifications">
    <div class="page-header">
      <h2>通知管理</h2>
      <p>管理集成相关的通知配置和历史记录</p>
    </div>

    <!-- 标签页 -->
    <el-tabs v-model="activeTab" type="border-card">
      <!-- 通知模板 -->
      <el-tab-pane label="通知模板" name="templates">
        <div class="templates-section">
          <div class="section-header">
            <h3>通知模板</h3>
            <el-button type="primary" @click="showTemplateDialog = true">
              <el-icon><Plus /></el-icon>
              新建模板
            </el-button>
          </div>

          <el-table :data="templates" border stripe>
            <el-table-column prop="name" label="模板名称" min-width="200" />
            <el-table-column prop="type" label="类型" width="150">
              <template #default="{ row }">
                <el-tag :type="getNotificationTypeColor(row.type)">
                  {{ getNotificationTypeLabel(row.type) }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="channels" label="发送渠道" width="200">
              <template #default="{ row }">
                <el-tag
                  v-for="channel in row.channels"
                  :key="channel"
                  size="small"
                  class="channel-tag"
                >
                  {{ getChannelLabel(channel) }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="enabled" label="状态" width="100">
              <template #default="{ row }">
                <el-switch
                  v-model="row.enabled"
                  @change="toggleTemplateEnabled(row)"
                />
              </template>
            </el-table-column>
            <el-table-column prop="updatedAt" label="更新时间" width="180">
              <template #default="{ row }">
                {{ formatDate(row.updatedAt) }}
              </template>
            </el-table-column>
            <el-table-column label="操作" width="180" fixed="right">
              <template #default="{ row }">
                <el-button size="small" @click="editTemplate(row)">编辑</el-button>
                <el-button size="small" type="warning" @click="previewTemplate(row)">预览</el-button>
                <el-button size="small" type="danger" @click="deleteTemplate(row)">删除</el-button>
              </template>
            </el-table-column>
          </el-table>
        </div>
      </el-tab-pane>

      <!-- 通知历史 -->
      <el-tab-pane label="通知历史" name="history">
        <div class="history-section">
          <div class="section-header">
            <h3>通知历史</h3>
            <div class="header-controls">
              <el-select v-model="historyFilter.status" placeholder="状态筛选" clearable @change="loadHistory">
                <el-option label="全部" value="" />
                <el-option label="已发送" value="sent" />
                <el-option label="已送达" value="delivered" />
                <el-option label="已读" value="read" />
                <el-option label="失败" value="failed" />
              </el-select>
              <el-select v-model="historyFilter.channel" placeholder="渠道筛选" clearable @change="loadHistory">
                <el-option label="全部" value="" />
                <el-option label="邮件" value="email" />
                <el-option label="短信" value="sms" />
                <el-option label="应用内" value="in_app" />
                <el-option label="桌面" value="desktop" />
              </el-select>
              <el-date-picker
                v-model="historyFilter.dateRange"
                type="datetimerange"
                range-separator="至"
                start-placeholder="开始时间"
                end-placeholder="结束时间"
                @change="loadHistory"
              />
            </div>
          </div>

          <el-table :data="notificationHistory" border stripe v-loading="historyLoading">
            <el-table-column prop="recipientName" label="接收人" width="120" />
            <el-table-column prop="title" label="标题" min-width="200" />
            <el-table-column prop="channel" label="渠道" width="100">
              <template #default="{ row }">
                <el-tag size="small">
                  {{ getChannelLabel(row.channel) }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="status" label="状态" width="100">
              <template #default="{ row }">
                <el-tag :type="getHistoryStatusType(row.status)">
                  {{ getHistoryStatusLabel(row.status) }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="sentAt" label="发送时间" width="180">
              <template #default="{ row }">
                {{ formatDate(row.sentAt) }}
              </template>
            </el-table-column>
            <el-table-column prop="deliveredAt" label="送达时间" width="180">
              <template #default="{ row }">
                {{ row.deliveredAt ? formatDate(row.deliveredAt) : '-' }}
              </template>
            </el-table-column>
            <el-table-column prop="readAt" label="阅读时间" width="180">
              <template #default="{ row }">
                {{ row.readAt ? formatDate(row.readAt) : '-' }}
              </template>
            </el-table-column>
            <el-table-column label="操作" width="120" fixed="right">
              <template #default="{ row }">
                <el-button size="small" @click="viewNotificationDetails(row)">详情</el-button>
              </template>
            </el-table-column>
          </el-table>

          <!-- 分页 -->
          <div class="pagination-wrapper">
            <el-pagination
              v-model:current-page="historyPagination.current"
              v-model:page-size="historyPagination.size"
              :total="historyPagination.total"
              :page-sizes="[10, 20, 50, 100]"
              layout="total, sizes, prev, pager, next, jumper"
              @size-change="loadHistory"
              @current-change="loadHistory"
            />
          </div>
        </div>
      </el-tab-pane>

      <!-- 通知统计 -->
      <el-tab-pane label="通知统计" name="statistics">
        <div class="statistics-section">
          <el-row :gutter="20">
            <!-- 总体统计 -->
            <el-col :span="12">
              <el-card>
                <template #header>
                  <h4>总体统计</h4>
                </template>
                <div class="stats-grid">
                  <div class="stat-item">
                    <div class="stat-value">{{ statistics.total }}</div>
                    <div class="stat-label">总通知数</div>
                  </div>
                  <div class="stat-item">
                    <div class="stat-value">{{ statistics.sent }}</div>
                    <div class="stat-label">已发送</div>
                  </div>
                  <div class="stat-item">
                    <div class="stat-value">{{ statistics.failed }}</div>
                    <div class="stat-label">发送失败</div>
                  </div>
                  <div class="stat-item">
                    <div class="stat-value">{{ (statistics.readRate * 100).toFixed(1) }}%</div>
                    <div class="stat-label">阅读率</div>
                  </div>
                </div>
              </el-card>
            </el-col>

            <!-- 渠道统计 -->
            <el-col :span="12">
              <el-card>
                <template #header>
                  <h4>渠道统计</h4>
                </template>
                <div class="channel-stats">
                  <div 
                    v-for="(count, channel) in statistics.channelStats" 
                    :key="channel"
                    class="channel-stat-item"
                  >
                    <span class="channel-name">{{ getChannelLabel(channel) }}</span>
                    <span class="channel-count">{{ count }}</span>
                  </div>
                </div>
              </el-card>
            </el-col>
          </el-row>
        </div>
      </el-tab-pane>
    </el-tabs>

    <!-- 模板编辑对话框 -->
    <el-dialog
      v-model="showTemplateDialog"
      :title="editingTemplate ? '编辑模板' : '新建模板'"
      width="800px"
    >
      <el-form :model="templateForm" :rules="templateFormRules" ref="templateFormRef" label-width="120px">
        <el-form-item label="模板名称" prop="name">
          <el-input v-model="templateForm.name" placeholder="请输入模板名称" />
        </el-form-item>
        <el-form-item label="通知类型" prop="type">
          <el-select v-model="templateForm.type" placeholder="选择通知类型">
            <el-option label="带教项目创建" value="mentorship_created" />
            <el-option label="导师分配" value="mentor_assigned" />
            <el-option label="集成成功" value="integration_success" />
            <el-option label="集成失败" value="integration_failed" />
            <el-option label="需要人工审核" value="manual_review_required" />
            <el-option label="同步完成" value="sync_completed" />
            <el-option label="同步失败" value="sync_failed" />
          </el-select>
        </el-form-item>
        <el-form-item label="标题" prop="subject">
          <el-input v-model="templateForm.subject" placeholder="请输入通知标题" />
        </el-form-item>
        <el-form-item label="内容" prop="content">
          <el-input
            v-model="templateForm.content"
            type="textarea"
            :rows="8"
            placeholder="请输入通知内容，可使用变量如 {{recipientName}}"
          />
        </el-form-item>
        <el-form-item label="发送渠道" prop="channels">
          <el-checkbox-group v-model="templateForm.channels">
            <el-checkbox value="email">邮件</el-checkbox>
            <el-checkbox value="sms">短信</el-checkbox>
            <el-checkbox value="in_app">应用内</el-checkbox>
            <el-checkbox value="desktop">桌面通知</el-checkbox>
          </el-checkbox-group>
        </el-form-item>
        <el-form-item label="状态" prop="enabled">
          <el-switch v-model="templateForm.enabled" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showTemplateDialog = false">取消</el-button>
        <el-button type="primary" @click="saveTemplate">保存</el-button>
      </template>
    </el-dialog>

    <!-- 通知详情对话框 -->
    <el-dialog
      v-model="showDetailsDialog"
      title="通知详情"
      width="700px"
    >
      <div v-if="selectedNotification" class="notification-details">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="接收人">{{ selectedNotification.recipientName }}</el-descriptions-item>
          <el-descriptions-item label="发送渠道">{{ getChannelLabel(selectedNotification.channel) }}</el-descriptions-item>
          <el-descriptions-item label="标题" :span="2">{{ selectedNotification.title }}</el-descriptions-item>
          <el-descriptions-item label="内容" :span="2">
            <div class="notification-content">{{ selectedNotification.content }}</div>
          </el-descriptions-item>
          <el-descriptions-item label="状态">
            <el-tag :type="getHistoryStatusType(selectedNotification.status)">
              {{ getHistoryStatusLabel(selectedNotification.status) }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="重试次数">{{ selectedNotification.retryCount || 0 }}</el-descriptions-item>
          <el-descriptions-item label="发送时间">{{ formatDate(selectedNotification.sentAt) }}</el-descriptions-item>
          <el-descriptions-item label="送达时间">
            {{ selectedNotification.deliveredAt ? formatDate(selectedNotification.deliveredAt) : '-' }}
          </el-descriptions-item>
          <el-descriptions-item label="阅读时间">
            {{ selectedNotification.readAt ? formatDate(selectedNotification.readAt) : '-' }}
          </el-descriptions-item>
          <el-descriptions-item label="错误信息" v-if="selectedNotification.error">
            {{ selectedNotification.error }}
          </el-descriptions-item>
        </el-descriptions>
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, reactive } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { Plus } from '@element-plus/icons-vue';
import { notificationService } from '../services/NotificationService';
import type { NotificationTemplate, NotificationHistory } from '@/types';

// 响应式数据
const activeTab = ref('templates');
const templates = ref<NotificationTemplate[]>([]);
const notificationHistory = ref<any[]>([]);
const historyLoading = ref(false);
const showTemplateDialog = ref(false);
const showDetailsDialog = ref(false);
const editingTemplate = ref<NotificationTemplate | null>(null);
const selectedNotification = ref<any>(null);
const templateFormRef = ref();

const historyFilter = reactive({
  status: '',
  channel: '',
  dateRange: null
});

const historyPagination = reactive({
  current: 1,
  size: 20,
  total: 0
});

const statistics = ref({
  total: 0,
  sent: 0,
  failed: 0,
  pending: 0,
  readRate: 0,
  channelStats: {
    email: 0,
    sms: 0,
    in_app: 0,
    desktop: 0,
    webhook: 0
  }
});

const templateForm = reactive({
  name: '',
  type: '',
  subject: '',
  content: '',
  channels: [],
  enabled: true
});

const templateFormRules = {
  name: [
    { required: true, message: '请输入模板名称', trigger: 'blur' }
  ],
  type: [
    { required: true, message: '请选择通知类型', trigger: 'change' }
  ],
  subject: [
    { required: true, message: '请输入标题', trigger: 'blur' }
  ],
  content: [
    { required: true, message: '请输入内容', trigger: 'blur' }
  ],
  channels: [
    { required: true, message: '请选择发送渠道', trigger: 'change' }
  ]
};

// 生命周期
onMounted(() => {
  loadTemplates();
  loadHistory();
  loadStatistics();
});

// 方法
const loadTemplates = () => {
  templates.value = notificationService.getTemplates();
};

const loadHistory = async () => {
  historyLoading.value = true;
  try {
    // 模拟历史数据
    notificationHistory.value = [
      {
        id: 'history-1',
        recipientName: '李高级',
        title: '新的带教项目已创建',
        content: '系统已为学员张三自动创建了带教项目...',
        channel: 'email',
        status: 'read',
        sentAt: new Date(Date.now() - 1000 * 60 * 60 * 2),
        deliveredAt: new Date(Date.now() - 1000 * 60 * 60 * 2 + 30000),
        readAt: new Date(Date.now() - 1000 * 60 * 60 * 1),
        retryCount: 0
      },
      {
        id: 'history-2',
        recipientName: '王产品',
        title: '您被指派为新的导师',
        content: '您已被指派为学员李四的导师...',
        channel: 'in_app',
        status: 'delivered',
        sentAt: new Date(Date.now() - 1000 * 60 * 30),
        deliveredAt: new Date(Date.now() - 1000 * 60 * 30 + 5000),
        retryCount: 0
      },
      {
        id: 'history-3',
        recipientName: '系统管理员',
        title: '数据同步失败警告',
        content: '数据同步任务执行失败，请检查系统状态...',
        channel: 'email',
        status: 'failed',
        sentAt: new Date(Date.now() - 1000 * 60 * 15),
        error: 'SMTP服务器连接超时',
        retryCount: 2
      }
    ];

    // 应用筛选
    if (historyFilter.status) {
      notificationHistory.value = notificationHistory.value.filter(n => n.status === historyFilter.status);
    }
    if (historyFilter.channel) {
      notificationHistory.value = notificationHistory.value.filter(n => n.channel === historyFilter.channel);
    }

    historyPagination.total = notificationHistory.value.length;
  } catch (error) {
    ElMessage.error('加载通知历史失败');
  } finally {
    historyLoading.value = false;
  }
};

const loadStatistics = () => {
  statistics.value = notificationService.getNotificationStatistics();
};

const editTemplate = (template: NotificationTemplate) => {
  editingTemplate.value = template;
  Object.assign(templateForm, template);
  showTemplateDialog.value = true;
};

const saveTemplate = async () => {
  if (!templateFormRef.value) return;
  
  const valid = await templateFormRef.value.validate();
  if (!valid) return;

  try {
    if (editingTemplate.value) {
      notificationService.updateTemplate(editingTemplate.value.id, templateForm);
      ElMessage.success('模板更新成功');
    } else {
      notificationService.addTemplate(templateForm);
      ElMessage.success('模板创建成功');
    }
    
    showTemplateDialog.value = false;
    editingTemplate.value = null;
    resetTemplateForm();
    loadTemplates();
  } catch (error) {
    ElMessage.error('保存失败');
  }
};

const deleteTemplate = async (template: NotificationTemplate) => {
  try {
    await ElMessageBox.confirm('确定要删除这个模板吗？', '确认删除', {
      type: 'warning'
    });
    
    notificationService.deleteTemplate(template.id);
    ElMessage.success('模板删除成功');
    loadTemplates();
  } catch {
    // 用户取消删除
  }
};

const toggleTemplateEnabled = (template: NotificationTemplate) => {
  notificationService.updateTemplate(template.id, { enabled: template.enabled });
  ElMessage.success(`模板已${template.enabled ? '启用' : '禁用'}`);
};

const previewTemplate = (template: NotificationTemplate) => {
  // 模板预览逻辑
  ElMessage.info('模板预览功能开发中...');
};

const viewNotificationDetails = (notification: any) => {
  selectedNotification.value = notification;
  showDetailsDialog.value = true;
};

const resetTemplateForm = () => {
  Object.assign(templateForm, {
    name: '',
    type: '',
    subject: '',
    content: '',
    channels: [],
    enabled: true
  });
};

// 工具方法
const getNotificationTypeLabel = (type: string) => {
  const labels = {
    mentorship_created: '带教项目创建',
    mentor_assigned: '导师分配',
    integration_success: '集成成功',
    integration_failed: '集成失败',
    manual_review_required: '需要人工审核',
    sync_completed: '同步完成',
    sync_failed: '同步失败'
  };
  return labels[type] || type;
};

const getNotificationTypeColor = (type: string) => {
  const colors = {
    mentorship_created: 'primary',
    mentor_assigned: 'success',
    integration_success: 'success',
    integration_failed: 'danger',
    manual_review_required: 'warning',
    sync_completed: 'info',
    sync_failed: 'danger'
  };
  return colors[type] || 'info';
};

const getChannelLabel = (channel: string) => {
  const labels = {
    email: '邮件',
    sms: '短信',
    in_app: '应用内',
    desktop: '桌面',
    webhook: 'Webhook'
  };
  return labels[channel] || channel;
};

const getHistoryStatusType = (status: string) => {
  const types = {
    sent: 'primary',
    delivered: 'success',
    read: 'success',
    failed: 'danger'
  };
  return types[status] || 'info';
};

const getHistoryStatusLabel = (status: string) => {
  const labels = {
    sent: '已发送',
    delivered: '已送达',
    read: '已读',
    failed: '失败'
  };
  return labels[status] || status;
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
.integration-notifications {
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

.channel-tag {
  margin-right: 4px;
  margin-bottom: 4px;
}

.pagination-wrapper {
  margin-top: 20px;
  text-align: right;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20px;
}

.stat-item {
  text-align: center;
  padding: 20px;
  border: 1px solid #EBEEF5;
  border-radius: 4px;
}

.stat-value {
  font-size: 24px;
  font-weight: bold;
  color: #303133;
  margin-bottom: 8px;
}

.stat-label {
  font-size: 14px;
  color: #909399;
}

.channel-stats {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.channel-stat-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 0;
  border-bottom: 1px solid #EBEEF5;
}

.channel-stat-item:last-child {
  border-bottom: none;
}

.channel-name {
  font-size: 14px;
  color: #606266;
}

.channel-count {
  font-size: 16px;
  font-weight: bold;
  color: #303133;
}

.notification-details {
  max-height: 500px;
  overflow-y: auto;
}

.notification-content {
  white-space: pre-wrap;
  word-wrap: break-word;
  max-height: 200px;
  overflow-y: auto;
  background-color: #F5F7FA;
  padding: 12px;
  border-radius: 4px;
  font-size: 14px;
  color: #606266;
}
</style> 