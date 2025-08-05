<template>
  <div class="approval-workflow">
    <!-- 方案汇总预览 -->
    <el-card shadow="never" class="summary-card">
      <template #header>
        <div class="card-header">
          <span>方案汇总</span>
          <div class="header-actions">
            <el-space>
              <!-- 版本和状态标签 -->
              <el-tag :type="getVersionType(currentProposal?.version)">
                {{ currentProposal?.version || 'v1.0' }}
              </el-tag>
              <el-tag :type="getStatusType(currentProposal?.status)">
                {{ getStatusText(currentProposal?.status) }}
              </el-tag>
              
              <!-- 操作按钮 -->
              <el-button 
                :icon="View" 
                @click="handlePreview"
                size="small"
              >
                预览方案
              </el-button>
              
              <el-button 
                :icon="Download" 
                @click="handleExport"
                size="small"
              >
                导出方案
              </el-button>
              
              <el-button 
                :type="getSubmitButtonType()" 
                :icon="getSubmitButtonIcon()"
                :loading="submitting"
                :disabled="getSubmitButtonDisabled()"
                @click="handleSubmit"
                size="small"
              >
                {{ getSubmitButtonText() }}
              </el-button>
            </el-space>
          </div>
        </div>
      </template>
      
      <div class="summary-content">
        <el-descriptions :column="3" border>
          <el-descriptions-item label="方案标题">
            {{ currentProposal?.title || '项目培训方案' }}
          </el-descriptions-item>
          <el-descriptions-item label="当前版本">
            {{ currentProposal?.version || 'v1.0' }}
          </el-descriptions-item>
          <el-descriptions-item label="创建时间">
            {{ formatDate(currentProposal?.createdAt) }}
          </el-descriptions-item>
          <el-descriptions-item label="最后修改">
            {{ formatDate(currentProposal?.updatedAt) }}
          </el-descriptions-item>
          <el-descriptions-item label="提交时间">
            {{ formatDate(currentProposal?.submittedAt) }}
          </el-descriptions-item>
          <el-descriptions-item label="当前状态">
            <el-tag :type="getStatusType(currentProposal?.status)">
              {{ getStatusText(currentProposal?.status) }}
            </el-tag>
          </el-descriptions-item>
        </el-descriptions>
        
        <div v-if="currentProposal?.versionNotes" class="version-notes mt-3">
          <h4>版本说明</h4>
          <p>{{ currentProposal.versionNotes }}</p>
        </div>
      </div>
    </el-card>

    <!-- 审批流程跟踪 -->
    <el-card 
      v-if="showApprovalFlow" 
      shadow="never" 
      class="approval-flow-card mt-4"
    >
      <template #header>
        <div class="card-header">
          <span>审批进度</span>
          <el-button 
            v-if="canWithdraw" 
            type="warning" 
            size="small" 
            :icon="RefreshLeft"
            @click="handleWithdraw"
          >
            撤回
          </el-button>
        </div>
      </template>
      
      <el-steps 
        :active="getActiveStep()" 
        :process-status="getProcessStatus()" 
        direction="horizontal"
        :space="200"
        class="approval-steps"
      >
        <el-step 
          v-for="step in currentProposal.approvalSteps" 
          :key="step.id" 
          :title="step.title" 
          :description="getStepDescription(step)"
          :status="getStepStatus(step)"
        >
          <template #icon>
            <el-icon v-if="step.status === 'approved'">
              <Check />
            </el-icon>
            <el-icon v-else-if="step.status === 'rejected'">
              <Close />
            </el-icon>
            <el-icon v-else-if="step.status === 'in_progress'">
              <Loading />
            </el-icon>
            <el-icon v-else>
              <Clock />
            </el-icon>
          </template>
        </el-step>
      </el-steps>
    </el-card>

    <!-- 版本历史 -->
    <el-card shadow="never" class="version-history-card mt-4">
      <template #header>
        <div class="card-header">
          <span>版本历史</span>
          <el-button 
            type="primary" 
            size="small"
            @click="showVersionDialog = true"
            :disabled="loadingVersionHistory"
          >
            查看全部
          </el-button>
        </div>
      </template>
      
      <div v-if="loadingVersionHistory" class="loading-container" v-loading="loadingVersionHistory">
        <p>加载版本历史中...</p>
      </div>
      
      <div v-else-if="versionHistory.length === 0" class="empty-container">
        <el-empty description="暂无版本历史" />
      </div>
      
      <el-timeline v-else>
        <el-timeline-item
          v-for="version in versionHistory.slice(0, 3)"
          :key="version.id"
          :timestamp="formatDate(version.submittedAt)"
          :type="getVersionTimelineType(version.status)"
        >
          <div class="timeline-content">
            <h4>{{ version.version }} - {{ getStatusText(version.status) }}</h4>
            <p v-if="version.versionNotes">{{ version.versionNotes }}</p>
            <p v-else class="text-muted">无版本说明</p>
            <div class="version-actions">
              <el-button 
                type="primary" 
                link 
                size="small"
                @click="viewVersionDetail(version)"
              >
                查看详情
              </el-button>
              <el-button 
                v-if="version.status === 'approved' && version.id !== currentProposal?.id" 
                type="success" 
                link 
                size="small"
                @click="restoreVersion(version)"
              >
                恢复此版本
              </el-button>
            </div>
          </div>
        </el-timeline-item>
      </el-timeline>
    </el-card>



    <!-- 版本详情对话框 -->
    <el-dialog
      v-model="showVersionDialog"
      title="版本历史"
      width="800px"
    >
      <div v-if="loadingVersionHistory" class="loading-container" v-loading="loadingVersionHistory">
        <p>加载版本历史中...</p>
      </div>
      
      <div v-else-if="versionHistory.length === 0" class="empty-container">
        <el-empty description="暂无版本历史" />
      </div>
      
      <el-table v-else :data="versionHistory" stripe>
        <el-table-column prop="version" label="版本" width="100" />
        <el-table-column prop="status" label="状态" width="120">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)">{{ getStatusText(row.status) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="submittedAt" label="提交时间" width="160">
          <template #default="{ row }">
            {{ formatDate(row.submittedAt) }}
          </template>
        </el-table-column>
        <el-table-column prop="versionNotes" label="版本说明">
          <template #default="{ row }">
            {{ row.versionNotes || '-' }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="150">
          <template #default="{ row }">
            <el-button type="primary" link @click="viewVersionDetail(row)">查看</el-button>
            <el-button 
              v-if="row.status === 'approved'" 
              type="success" 
              link 
              @click="restoreVersion(row)"
            >
              恢复
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { Check, Close, Loading, Clock, RefreshLeft, View, Download } from '@element-plus/icons-vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { useProposalStore } from '../stores/proposal';
import { storeToRefs } from 'pinia';
import { getProposalVersionHistory } from '../../../api/modules/proposal';

// Props
const props = defineProps<{
  projectId?: string;
  projectConfig: any;
}>();

// Emits
const emit = defineEmits<{
  showPreview: [];
}>();

// Store
const proposalStore = useProposalStore();
const { currentProposal, loading } = storeToRefs(proposalStore);

// 状态
const submitting = ref(false);
const showVersionDialog = ref(false);
const loadingVersionHistory = ref(false);

// 版本历史数据
const versionHistory = ref([]);

// 计算属性
const showApprovalFlow = computed(() => {
  const status = currentProposal.value?.status;
  return status === 'submitted' || status === 'under_review' || status === 'approved' || status === 'rejected';
});

const canWithdraw = computed(() => {
  const status = currentProposal.value?.status;
  return status === 'submitted' || status === 'under_review';
});



// 方法
const formatDate = (dateStr?: string) => {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleString('zh-CN');
};

const getVersionType = (version?: string) => {
  if (!version) return 'info';
  const majorVersion = parseInt(version.split('.')[0].slice(1));
  return majorVersion >= 2 ? 'success' : 'primary';
};

const getStatusType = (status?: string) => {
  switch (status) {
    case 'approved': return 'success';
    case 'rejected': return 'danger';
    case 'submitted':
    case 'under_review': return 'warning';
    default: return 'info';
  }
};

const getStatusText = (status?: string) => {
  switch (status) {
    case 'draft': return '草稿';
    case 'submitted': return '已提交';
    case 'under_review': return '审批中';
    case 'approved': return '已通过';
    case 'rejected': return '已拒绝';
    default: return '未知';
  }
};

const getVersionTimelineType = (status?: string) => {
  switch (status) {
    case 'approved': return 'success';
    case 'rejected': return 'danger';
    case 'under_review': return 'warning';
    default: return 'primary';
  }
};

const getActiveStep = () => {
  if (!currentProposal.value?.approvalSteps) return 0;
  
  const steps = currentProposal.value.approvalSteps;
  for (let i = 0; i < steps.length; i++) {
    if (steps[i].status === 'wait' || steps[i].status === 'process') {
      return i;
    }
  }
  return steps.length;
};

const getProcessStatus = () => {
  if (!currentProposal.value) return 'process';
  
  switch (currentProposal.value.status) {
    case 'approved': return 'finish';
    case 'rejected': return 'error';
    default: return 'process';
  }
};

const getStepDescription = (step: any) => {
  if (step.status === 'finish' || step.status === 'approved') {
    return `${step.approver?.name || '已处理'} - ${step.approvedAt ? formatDate(step.approvedAt) : ''}`;
  }
  return step.description || '待处理';
};

const getStepStatus = (step: any) => {
  switch (step.status) {
    case 'approved':
    case 'finish': return 'finish';
    case 'rejected': return 'error';
    case 'in_progress':
    case 'process': return 'process';
    default: return 'wait';
  }
};

const getSubmitButtonText = () => {
  if (!currentProposal.value) return '提交审批';
  
  switch (currentProposal.value.status) {
    case 'draft':
    case 'rejected': return '提交审批';
    case 'submitted':
    case 'under_review': return '审批中';
    case 'approved': return '已通过';
    default: return '提交审批';
  }
};

const getSubmitButtonType = () => {
  if (!currentProposal.value) return 'primary';
  
  switch (currentProposal.value.status) {
    case 'approved': return 'success';
    case 'submitted':
    case 'under_review': return 'warning';
    default: return 'primary';
  }
};

const getSubmitButtonIcon = () => {
  if (!currentProposal.value) return undefined;
  
  switch (currentProposal.value.status) {
    case 'submitted':
    case 'under_review': return Loading;
    case 'approved': return Check;
    default: return undefined;
  }
};

const getSubmitButtonDisabled = () => {
  if (!currentProposal.value) return false;
  
  const status = currentProposal.value.status;
  return status === 'submitted' || status === 'under_review' || status === 'approved';
};

// 事件处理
const handleSubmit = async () => {
  try {
    await ElMessageBox.confirm('确认提交方案进行审批吗？', '确认提交', {
      type: 'warning',
    });
    
    submitting.value = true;
    await proposalStore.submitForApproval();
    ElMessage.success('方案已提交审批');
    
    // 提交成功后重新加载版本历史
    await loadVersionHistory();
  } catch (err) {
    if (err !== 'cancel') {
      console.error('提交失败:', err);
    }
  } finally {
    submitting.value = false;
  }
};

const handleWithdraw = async () => {
  try {
    await ElMessageBox.confirm('确认撤回方案申请吗？', '确认撤回', {
      type: 'warning',
    });
    
    await proposalStore.withdrawProposalRequest();
    ElMessage.success('方案已撤回');
    
    // 撤回成功后重新加载版本历史（虽然撤回不会影响已提交的版本历史，但为了保持数据一致性）
    await loadVersionHistory();
  } catch (err) {
    if (err !== 'cancel') {
      console.error('撤回失败:', err);
    }
  }
};

const handlePreview = () => {
  // 触发父组件的预览功能
  emit('showPreview');
};

const handleExport = async () => {
  try {
    if (!currentProposal.value) {
      ElMessage.warning('没有可导出的方案');
      return;
    }

    // 生成HTML格式的导出内容
    const htmlContent = generateExportHTML();
    const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
    
    // 创建下载链接
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const fileName = `${currentProposal.value.title || '培训方案'}_${currentProposal.value.version || 'v1.0'}_${new Date().toISOString().slice(0, 10)}.html`;
    link.download = fileName;
    
    // 触发下载
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
    
    ElMessage.success('方案导出成功');
  } catch (error) {
    console.error('导出失败:', error);
    ElMessage.error('导出失败，请重试');
  }
};

// 生成HTML导出内容
const generateExportHTML = () => {
  const proposal = currentProposal.value;
  const currentDate = new Date().toLocaleString('zh-CN');
  
  // 生成审批步骤HTML
  const approvalStepsHtml = proposal?.approvalSteps?.map(step => `
    <tr>
      <td>${step.title}</td>
      <td><span class="status status-${step.status}">${getStepDescription(step)}</span></td>
      <td>${step.approver?.name || '-'}</td>
      <td>${step.approvedAt ? formatDate(step.approvedAt) : '-'}</td>
    </tr>
  `).join('') || '';

  // 生成版本历史HTML
  const versionHistoryHtml = versionHistory.value.map(version => `
    <tr>
      <td>${version.version}</td>
      <td><span class="status status-${version.status}">${getStatusText(version.status)}</span></td>
      <td>${formatDate(version.submittedAt)}</td>
      <td>${version.versionNotes || '-'}</td>
    </tr>
  `).join('');

  return `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${proposal?.title || '培训方案'} - 审批流程</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; margin: 40px; color: #333; line-height: 1.6; }
    .header { text-align: center; margin-bottom: 40px; border-bottom: 2px solid #409EFF; padding-bottom: 20px; }
    .title { font-size: 28px; font-weight: bold; color: #409EFF; margin: 0; }
    .subtitle { font-size: 14px; color: #909399; margin: 10px 0 0 0; }
    .section { margin-bottom: 30px; }
    .section-title { font-size: 18px; font-weight: bold; color: #303133; margin-bottom: 15px; border-left: 4px solid #409EFF; padding-left: 10px; }
    .info-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; margin-bottom: 20px; }
    .info-item { display: flex; }
    .info-label { font-weight: bold; color: #606266; min-width: 80px; }
    .info-value { color: #303133; }
    table { width: 100%; border-collapse: collapse; margin-top: 10px; }
    th, td { padding: 12px; text-align: left; border: 1px solid #EBEEF5; }
    th { background-color: #F5F7FA; font-weight: bold; color: #303133; }
    tr:nth-child(even) { background-color: #FAFAFA; }
    .status { padding: 4px 8px; border-radius: 4px; font-size: 12px; }
    .status-draft { background-color: #F4F4F5; color: #909399; }
    .status-submitted { background-color: #FDF6EC; color: #E6A23C; }
    .status-under_review { background-color: #FDF6EC; color: #E6A23C; }
    .status-approved { background-color: #F0F9FF; color: #67C23A; }
    .status-rejected { background-color: #FEF0F0; color: #F56C6C; }
    .status-wait { background-color: #F4F4F5; color: #909399; }
    .status-process { background-color: #FDF6EC; color: #E6A23C; }
    .status-finish { background-color: #F0F9FF; color: #67C23A; }
    .version-notes { background-color: #F8F9FA; padding: 15px; border-radius: 4px; margin-top: 10px; }
    .footer { margin-top: 40px; text-align: center; color: #909399; font-size: 12px; border-top: 1px solid #EBEEF5; padding-top: 20px; }
    @media print { body { margin: 20px; } }
  </style>
</head>
<body>
  <div class="header">
    <h1 class="title">${proposal?.title || '培训方案'}</h1>
    <p class="subtitle">审批流程报告 - 导出时间：${currentDate}</p>
  </div>

  <div class="section">
    <h2 class="section-title">方案概要</h2>
    <div class="info-grid">
      <div class="info-item">
        <span class="info-label">方案标题：</span>
        <span class="info-value">${proposal?.title || '-'}</span>
      </div>
      <div class="info-item">
        <span class="info-label">当前版本：</span>
        <span class="info-value">${proposal?.version || 'v1.0'}</span>
      </div>
      <div class="info-item">
        <span class="info-label">当前状态：</span>
        <span class="info-value status status-${proposal?.status}">${getStatusText(proposal?.status)}</span>
      </div>
      <div class="info-item">
        <span class="info-label">创建时间：</span>
        <span class="info-value">${formatDate(proposal?.createdAt)}</span>
      </div>
      <div class="info-item">
        <span class="info-label">最后修改：</span>
        <span class="info-value">${formatDate(proposal?.updatedAt)}</span>
      </div>
      <div class="info-item">
        <span class="info-label">提交时间：</span>
        <span class="info-value">${formatDate(proposal?.submittedAt)}</span>
      </div>
    </div>
    ${proposal?.description ? `
    <div>
      <span class="info-label">方案描述：</span>
      <p>${proposal.description}</p>
    </div>
    ` : ''}
    ${proposal?.versionNotes ? `
    <div class="version-notes">
      <strong>版本说明：</strong><br>
      ${proposal.versionNotes}
    </div>
    ` : ''}
  </div>

  <div class="section">
    <h2 class="section-title">审批进度</h2>
    <table>
      <thead>
        <tr>
          <th>审批环节</th>
          <th>审批状态</th>
          <th>审批人</th>
          <th>审批时间</th>
        </tr>
      </thead>
      <tbody>
        ${approvalStepsHtml}
      </tbody>
    </table>
  </div>

  <div class="section">
    <h2 class="section-title">版本历史</h2>
    <table>
      <thead>
        <tr>
          <th>版本</th>
          <th>状态</th>
          <th>提交时间</th>
          <th>版本说明</th>
        </tr>
      </thead>
      <tbody>
        ${versionHistoryHtml}
      </tbody>
    </table>
  </div>

  <div class="footer">
    <p>此报告由培训系统自动生成 | 项目ID: ${props.projectId || '-'}</p>
  </div>
</body>
</html>
  `.trim();
};

const viewVersionDetail = (version: any) => {
  ElMessage.info(`查看版本 ${version.version} 详情`);
  // 这里可以打开版本详情对话框
};

const restoreVersion = async (version: any) => {
  try {
    await ElMessageBox.confirm(`确认恢复到版本 ${version.version} 吗？`, '确认恢复', {
      type: 'warning',
    });
    
    ElMessage.success(`已恢复到版本 ${version.version}`);
    // 这里调用API恢复版本
  } catch (err) {
    if (err !== 'cancel') {
      console.error('恢复版本失败:', err);
    }
  }
};

// 加载版本历史数据
const loadVersionHistory = async () => {
  if (!props.projectId) return;
  
  try {
    loadingVersionHistory.value = true;
    const response = await getProposalVersionHistory(props.projectId);
    
    if (response.data?.code === 200) {
      // 转换后端数据格式为前端需要的格式
      versionHistory.value = response.data.data.map((item: any) => ({
        id: item.id,
        version: item.version || 'v1.0',
        status: normalizeStatus(item.status),
        submittedAt: item.submittedAt || item.createdAt,
        versionNotes: item.versionNotes || '',
        title: item.title,
        description: item.description,
        createdAt: item.createdAt,
        updatedAt: item.updatedAt,
        creator: item.creator,
        submitter: item.submitter,
        approvalSteps: item.approvalSteps
      }));
      
      console.log('✅ 版本历史加载成功:', versionHistory.value.length, '个版本');
    }
  } catch (error) {
    console.error('❌ 加载版本历史失败:', error);
    ElMessage.error('加载版本历史失败');
  } finally {
    loadingVersionHistory.value = false;
  }
};

// 状态标准化函数
const normalizeStatus = (status: string) => {
  const statusMap: { [key: string]: string } = {
    'DRAFT': 'draft',
    'SUBMITTED': 'submitted', 
    'UNDER_REVIEW': 'under_review',
    'APPROVED': 'approved',
    'REJECTED': 'rejected'
  };
  return statusMap[status] || status.toLowerCase();
};

// 监听项目ID变化，重新加载版本历史
watch(() => props.projectId, (newProjectId) => {
  if (newProjectId) {
    loadVersionHistory();
  }
}, { immediate: true });

// 生命周期
onMounted(() => {
  // 初始化时加载版本历史
  if (props.projectId) {
    loadVersionHistory();
  }
});
</script>

<style scoped>
.approval-workflow {
  padding: 0;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-actions {
  display: flex;
  align-items: center;
}

.summary-content {
  padding: 0;
}

.version-notes {
  padding: 16px;
  background-color: #f8f9fa;
  border-radius: 4px;
}

.version-notes h4 {
  margin: 0 0 8px 0;
  font-size: 14px;
  color: #606266;
}

.version-notes p {
  margin: 0;
  color: #909399;
}

.approval-steps {
  margin: 20px 0;
}

.timeline-content h4 {
  margin: 0 0 8px 0;
  font-size: 16px;
}

.timeline-content p {
  margin: 0 0 8px 0;
  color: #606266;
}

.text-muted {
  color: #909399 !important;
}

.version-actions {
  display: flex;
  gap: 8px;
}

.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 40px;
  color: #909399;
}

.loading-container p {
  margin-top: 16px;
  font-size: 14px;
}

.empty-container {
  padding: 20px;
}



.mt-2 { margin-top: 8px; }
.mt-3 { margin-top: 12px; }
.mt-4 { margin-top: 16px; }
.ml-2 { margin-left: 8px; }
</style> 