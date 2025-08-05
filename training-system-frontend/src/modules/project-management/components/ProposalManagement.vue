<template>
  <div class="proposal-management-container">
    <!-- TAB导航和操作按钮 -->
    <div class="proposal-header">
      <el-tabs v-model="activeTab" class="proposal-tabs">
        <el-tab-pane 
          v-if="projectConfig.enableAgenda"
          label="议程" 
          name="agenda"
        />
        <el-tab-pane 
          v-if="projectConfig.enableResource"
          label="资源" 
          name="resources"
        />
        <el-tab-pane 
          v-if="projectConfig.enableBudget"
          label="预算" 
          name="budget"
        />
        <el-tab-pane 
          v-if="projectConfig.enableDivision"
          label="分工" 
          name="division"
        />
        <el-tab-pane 
          label="决算" 
          name="settlement"
        />
        <el-tab-pane 
          v-if="isApprovalEnabled"
          label="审批" 
          name="approval"
        />
      </el-tabs>
      
      <!-- 操作按钮区域 -->
      <div class="proposal-actions">
        <!-- 只在非审批流程TAB时显示预览按钮 -->
        <el-button 
          v-if="activeTab !== 'approval'"
          :icon="View" 
          @click="showPreview = true"
          :disabled="isNewProject"
        >
          预览
        </el-button>
      </div>
    </div>

    <!-- 新项目提示 -->
    <el-card v-if="isNewProject" shadow="never" class="placeholder-card">
      <el-result icon="warning" title="请先保存项目" sub-title="您需要先填写并保存项目基本信息，才能管理项目方案">
        <template #extra>
          <el-button type="primary" @click="$emit('goto-basic-info')">返回基本信息</el-button>
        </template>
      </el-result>
    </el-card>

    <!-- TAB内容区域 -->
    <div v-else class="proposal-content">
      <!-- 议程 -->
      <div v-show="activeTab === 'agenda'" class="tab-content">
        <EventAgenda :readonly="isReadonly" />
      </div>
      
      <!-- 资源 -->
      <div v-show="activeTab === 'resources'" class="tab-content">
        <ResourceManagement :readonly="isReadonly" />
      </div>
      
      <!-- 预算 -->
      <div v-show="activeTab === 'budget'" class="tab-content">
        <BudgetManagement :readonly="isReadonly" />
      </div>
      
            <!-- 分工 -->
      <div v-show="activeTab === 'division'" class="tab-content">
        <DivisionManagement 
          :project-id="projectId" 
          :project-data="projectData" 
          :readonly="isReadonly"
          ref="divisionManagementComponentRef"
        />
      </div>
      
      <!-- 决算 -->
      <div v-show="activeTab === 'settlement'" class="tab-content">
        <SettlementManagement 
          :project-id="projectId"
          :readonly="isReadonly"
        />
      </div>
      
      <!-- 审批流程 -->
      <div v-show="activeTab === 'approval'" class="tab-content">
        <ApprovalWorkflow 
          :project-id="projectId"
          :project-config="projectConfig"
          @show-preview="showPreview = true"
        />
      </div>
    </div>



    <!-- 预览对话框 -->
    <el-dialog v-model="showPreview" title="方案预览" width="90%" top="3vh">
      <div class="proposal-preview">
        <!-- 基本信息（默认包含） -->
        <el-descriptions title="项目概览" :column="2" border>
          <el-descriptions-item label="项目名称">{{ projectData?.name || '未设置' }}</el-descriptions-item>
          <el-descriptions-item label="项目编号">{{ projectData?.projectNo || '未生成' }}</el-descriptions-item>
          <el-descriptions-item label="负责人">{{ projectData?.owner?.name || '未指定' }}</el-descriptions-item>
          <el-descriptions-item label="状态">{{ getProjectStatusText(projectData?.status) }}</el-descriptions-item>
          <el-descriptions-item label="项目类型">{{ getProjectTypeName(projectData?.type) || '未选择' }}</el-descriptions-item>
          <el-descriptions-item label="培训目标">{{ projectData?.goal || '待完善' }}</el-descriptions-item>
        </el-descriptions>
        
        <!-- 对象与分组（默认包含） -->
        <div class="preview-section">
          <h3>培训对象与分组</h3>
          
          <!-- 如果有分组，按组显示成员 -->
          <div v-if="previewData.groups && previewData.groups.length > 0">
            <p><strong>总人数：</strong>{{ getTotalParticipants() }} 人，共{{ previewData.groups.length }}个小组</p>
            
            <div v-for="group in previewData.groups" :key="group.id" class="group-members" style="margin-bottom: 20px;">
              <h4 style="margin: 10px 0 8px 0; color: var(--el-color-primary);">
                {{ group.name }} ({{ (group.students || []).length }}人)
              </h4>
              
              <div v-if="group.students && group.students.length > 0">
                <el-table :data="group.students" size="small">
                  <el-table-column prop="name" label="姓名" width="120" />
                  <el-table-column prop="department" label="部门" width="150" />
                  <el-table-column prop="position" label="职位" width="120" />
                  <el-table-column label="角色" width="100">
                    <template #default="{ row }">
                      <el-tag size="small" type="info">学员</el-tag>
                    </template>
                  </el-table-column>
                </el-table>
              </div>
              <p v-else style="color: #909399; font-size: 14px; margin: 8px 0;">该组暂无成员</p>
            </div>
          </div>
          
          <!-- 如果没有分组，显示所有参与者 -->
          <div v-else-if="previewData.participants && previewData.participants.length > 0">
            <p><strong>参与人数：</strong>{{ previewData.participants.length }} 人（未分组）</p>
            <el-table :data="previewData.participants.slice(0, 10)" size="small" style="margin-top: 10px;">
              <el-table-column prop="name" label="姓名" width="120" />
              <el-table-column prop="department" label="部门" width="150" />
              <el-table-column prop="position" label="职位" width="120" />
              <el-table-column prop="role" label="角色" width="100" />
            </el-table>
            <p v-if="previewData.participants.length > 10" style="margin-top: 8px; color: #909399; font-size: 12px;">
              仅显示前10条，共{{ previewData.participants.length }}条记录
            </p>
          </div>
          
          <!-- 没有任何数据 -->
          <p v-else style="color: #909399;">暂无培训对象数据</p>
        </div>
        
        <!-- 议程安排（根据配置显示） -->
        <div v-if="projectConfig.enableAgenda" class="preview-section">
          <h3>议程安排</h3>
          <div v-if="previewData.agenda && previewData.agenda.length > 0">
            <div v-for="(day, index) in previewData.agenda" :key="index" class="agenda-day">
              <h4>第{{ index + 1 }}天 {{ day.date }}</h4>
              <el-table :data="day.items" size="small">
                <el-table-column prop="startTime" label="时间" width="100" />
                <el-table-column prop="title" label="内容" />
                <el-table-column prop="speaker" label="讲师" width="120" />
                <el-table-column prop="location" label="地点" width="120" />
                <el-table-column prop="duration" label="时长" width="80">
                  <template #default="{ row }">{{ row.duration }}分钟</template>
                </el-table-column>
              </el-table>
            </div>
          </div>
          <p v-else style="color: #909399;">暂无议程安排</p>
        </div>
        
        <!-- 资源配置（根据配置显示） -->
        <div v-if="projectConfig.enableResource" class="preview-section">
          <h3>资源配置</h3>
          <div v-if="previewData.resources && previewData.resources.length > 0">
            <el-table :data="previewData.resources" size="small">
              <el-table-column prop="type" label="资源类型" width="100">
                <template #default="{ row }">
                  <el-tag :type="getResourceTypeColor(row.type)">{{ getResourceTypeName(row.type) }}</el-tag>
                </template>
              </el-table-column>
              <el-table-column prop="name" label="资源名称" />
              <el-table-column prop="spec" label="规格说明" />
              <el-table-column prop="quantity" label="数量" width="80" />
              <el-table-column prop="responsible" label="负责人" width="100" />
              <el-table-column prop="status" label="状态" width="100">
                <template #default="{ row }">
                  <el-tag :type="getResourceStatusColor(row.status)">{{ getResourceStatusName(row.status) }}</el-tag>
                </template>
              </el-table-column>
            </el-table>
          </div>
          <p v-else style="color: #909399;">暂无资源配置</p>
        </div>
        
        <!-- 预算计划（根据配置显示） -->
        <div v-if="projectConfig.enableBudget" class="preview-section">
          <h3>预算计划</h3>
          <div v-if="previewData.budget && previewData.budget.lines && previewData.budget.lines.length > 0">
            <div class="budget-summary" style="margin-bottom: 15px;">
              <el-statistic title="预算总额" :value="previewData.budget.summary?.totalBudget || 0" suffix="元" />
            </div>
            <el-table :data="previewData.budget.lines" size="small">
              <el-table-column prop="category" label="费用科目" width="120" />
              <el-table-column prop="item" label="费用项目" />
              <el-table-column prop="budgetAmount" label="预算金额" width="100">
                <template #default="{ row }">{{ formatMoney(row.budgetAmount) }}</template>
              </el-table-column>
              <el-table-column prop="notes" label="备注" />
            </el-table>
          </div>
          <p v-else style="color: #909399;">暂无预算计划</p>
        </div>
        
        <!-- 分工安排（根据配置显示） -->
        <div v-if="projectConfig.enableDivision" class="preview-section">
          <h3>任务分工</h3>
          <div v-if="previewData.division && previewData.division.length > 0">
            <el-table :data="previewData.division" size="small">
              <el-table-column prop="taskName" label="任务名称" />
              <el-table-column prop="assignee" label="负责人" width="120" />
              <el-table-column prop="role" label="角色" width="100" />
              <el-table-column prop="deadline" label="截止时间" width="120" />
              <el-table-column prop="status" label="状态" width="100">
                <template #default="{ row }">
                  <el-tag :type="getDivisionStatusColor(row.status)">{{ getDivisionStatusName(row.status) }}</el-tag>
                </template>
              </el-table-column>
            </el-table>
                    </div>
          <p v-else style="color: #909399;">暂无任务分工</p>
        </div>
      </div>
      
      <template #footer>
        <el-button @click="showPreview = false">关闭</el-button>
        <el-button type="primary" @click="handlePrint">打印</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, watch } from 'vue';
import { Position, RefreshLeft, View } from '@element-plus/icons-vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { useProposalStore } from '../stores/proposal';
import { storeToRefs } from 'pinia';

// 导入子组件
import EventAgenda from './EventAgenda.vue';
import BudgetManagement from './BudgetManagement.vue';
import ResourceManagement from './ResourceManagement.vue';
import DivisionManagement from './DivisionManagement.vue';
import ApprovalWorkflow from './ApprovalWorkflow.vue';
import SettlementManagement from './SettlementManagement.vue'; // 新增决算管理组件

// 导入stores
import { useResourceStore } from '../../../stores/resources';
import { useBudgetStore } from '../../../stores/budget';
import { useGroupStore } from '../stores/group';
import { useUserStore } from '../../../stores/user';
import { useAgendaStore } from '../stores/agenda';
import { useDivisionStore } from '../stores/division';

// Props
const props = defineProps<{
  projectId?: string;
  projectData?: any;
  projectConfig: {
    enableAgenda: boolean;
    enableBudget: boolean;
    enableResource: boolean;
    enableDivision: boolean;
  };
  isNewProject: boolean;
}>();

// Emits
defineEmits(['goto-basic-info']);

// Store
const proposalStore = useProposalStore();
const { currentProposal, loading } = storeToRefs(proposalStore);

// 其他stores
const resourceStore = useResourceStore();
const budgetStore = useBudgetStore();
const groupStore = useGroupStore();
const userStore = useUserStore();
const agendaStore = useAgendaStore();
const divisionStore = useDivisionStore();

// 状态
const activeTab = ref('agenda');
const showPreview = ref(false);

// 预览数据
const previewData = reactive({
  participants: [] as any[],
  groups: [] as any[],
  agenda: [] as any[],
  resources: [] as any[],
  budget: {
    lines: [] as any[],
    summary: null as any
  },
  division: [] as any[]
});

// 组件引用
const divisionManagementComponentRef = ref<InstanceType<typeof DivisionManagement> | null>(null);

// 初始化
onMounted(async () => {
  console.log('📋 ProposalManagement 组件挂载:', {
    projectId: props.projectId,
    isNewProject: props.isNewProject,
    willLoadProposal: props.projectId && !props.isNewProject
  });
  
  if (props.projectId && !props.isNewProject) {
    console.log('🔄 开始调用 loadProposal...');
    await proposalStore.loadProposal(props.projectId);
    console.log('✅ loadProposal 调用完成');
  } else {
    console.log('⚠️ 跳过 loadProposal 调用');
  }
  
  // 设置默认激活的TAB
  setDefaultActiveTab();
});

// 监听预览对话框开启，加载预览数据
watch(showPreview, async (newVal) => {
  if (newVal && props.projectId && !props.isNewProject) {
    await loadPreviewData();
  }
});

// 监听配置变化，调整激活TAB
watch(() => props.projectConfig, () => {
  setDefaultActiveTab();
}, { deep: true });

// 设置默认激活TAB
const setDefaultActiveTab = () => {
  if (props.projectConfig.enableAgenda) {
    activeTab.value = 'agenda';
  } else if (props.projectConfig.enableResource) {
    activeTab.value = 'resources';
  } else if (props.projectConfig.enableBudget) {
    activeTab.value = 'budget';
  } else if (props.projectConfig.enableDivision) {
    activeTab.value = 'division';
  } else {
    // 如果没有其他TAB可用，默认显示决算
    activeTab.value = 'settlement';
  }
};

// 计算是否只读（已提交审批后不可编辑）
const isReadonly = computed(() => {
  if (props.isNewProject) return false;
  
  const status = currentProposal.value?.status;
  return status === 'submitted' || status === 'under_review' || status === 'approved';
});

// 计算审批TAB是否启用 - 启用议程、资源、预算决算、分工中任意一个时启用审批
const isApprovalEnabled = computed(() => {
  return props.projectConfig.enableAgenda || 
         props.projectConfig.enableResource || 
         props.projectConfig.enableBudget || 
         props.projectConfig.enableDivision;
});


// 获取状态类型
const getStatusType = (status: string) => {
  switch (status) {
    case 'submitted':
    case 'under_review':
      return 'warning';
    case 'approved':
      return 'success';
    case 'rejected':
      return 'danger';
    default:
      return 'info';
  }
};

// 获取状态文字
const getStatusText = (status: string) => {
  switch (status) {
    case 'draft':
      return '草稿';
    case 'submitted':
      return '已提交';
    case 'under_review':
      return '审批中';
    case 'approved':
      return '已通过';
    case 'rejected':
      return '已拒绝';
    default:
      return '未知';
  }
};



// 加载预览数据
const loadPreviewData = async () => {
  try {
    if (!props.projectId) return;
    
    // 并行加载各种数据
    const promises = [];
    
    // 加载参与者数据
    promises.push(loadParticipants());
    
    // 加载分组数据
    promises.push(loadGroups());
    
    // 根据配置加载相应数据
    if (props.projectConfig.enableResource) {
      promises.push(loadResources());
    }
    
    if (props.projectConfig.enableBudget) {
      promises.push(loadBudget());
    }
    
    if (props.projectConfig.enableAgenda) {
      promises.push(loadAgenda());
    }
    
    if (props.projectConfig.enableDivision) {
      promises.push(loadDivision());
    }
    
    await Promise.allSettled(promises);
  } catch (error) {
    console.error('加载预览数据失败:', error);
  }
};

// 加载参与者数据
const loadParticipants = async () => {
  try {
    // 这里应该调用API获取项目参与者，现在用mock数据
    if (props.projectData?.participants) {
      previewData.participants = props.projectData.participants;
    } else {
      // 如果没有现成数据，可以从userStore获取
      previewData.participants = [];
    }
  } catch (error) {
    console.error('加载参与者数据失败:', error);
  }
};

// 加载分组数据
const loadGroups = async () => {
  try {
    console.log('🔍 预览：加载分组数据，项目ID:', props.projectId);
    
    if (!props.projectId) {
      console.log('⚠️ 预览：项目ID为空，跳过分组加载');
      previewData.groups = [];
      return;
    }
    
    await groupStore.fetchGroups(props.projectId);
    console.log('✅ 预览：groupStore.groups:', groupStore.groups);
    
    // 检查store中的数据格式
    if (!groupStore.groups || !Array.isArray(groupStore.groups)) {
      console.warn('⚠️ 预览：groupStore返回数据格式异常:', groupStore.groups);
      previewData.groups = [];
      return;
    }
    
    // 🔧 修复：处理后端返回的分组数据格式
    previewData.groups = groupStore.groups.map(group => {
      // 后端返回的是members字段，需要转换为students格式
      const students = (group.members || [])
        .filter(member => member.role === 'MEMBER') // 只取学员角色
        .map(member => ({
          id: member.user?.id || 'unknown',
          name: member.user?.name || '未知用户',
          department: member.user?.department || '未知部门',
          position: member.user?.position || '未知职位',
        }));
      
      return {
        id: group.id,
        name: group.name,
        students: students,
        memberCount: students.length
      };
    });
    
    console.log('✅ 预览：分组数据加载成功，分组数:', previewData.groups.length);
    console.log('✅ 预览：分组详情:', previewData.groups.map(g => ({ 
      name: g.name, 
      memberCount: g.memberCount,
      studentsPreview: g.students?.slice(0, 2).map(s => s.name).join(', ') || '无成员'
    })));
    
    // 如果没有分组数据，提供提示信息
    if (previewData.groups.length === 0) {
      console.log('⚠️ 预览：没有分组数据，可能项目尚未配置分组');
    }
    
  } catch (error) {
    console.error('❌ 预览：加载分组数据失败:', error);
    previewData.groups = [];
    
    // 不显示错误消息，只在控制台记录
    console.log('⚠️ 预览：分组加载失败，将显示"暂无分组数据"');
  }
};

// 加载资源数据
const loadResources = async () => {
  try {
    await resourceStore.fetchResources(props.projectId);
    previewData.resources = resourceStore.resources;
  } catch (error) {
    console.error('加载资源数据失败:', error);
  }
};

// 加载预算数据
const loadBudget = async () => {
  try {
    console.log('🔍 预览：加载预算数据，项目ID:', props.projectId);
    
    if (!props.projectId) {
      console.log('⚠️ 预览：项目ID为空，跳过预算加载');
      previewData.budget.lines = [];
      previewData.budget.summary = null;
      return;
    }
    
    await budgetStore.fetchBudget(props.projectId);
    
    // 确保budgetLines是数组格式
    const lines = Array.isArray(budgetStore.budgetLines) ? budgetStore.budgetLines : [];
    previewData.budget.lines = lines;
    
    // 🔧 重要修复：预算金额需要除以100转换为元（数据库以分为单位存储）
    const calculatedTotalBudget = lines.reduce((sum, line) => sum + (line.budgetAmount || 0), 0) / 100;
    
    previewData.budget.summary = {
      totalBudget: calculatedTotalBudget
    };
    
    console.log('✅ 预览：预算数据加载成功，明细数:', previewData.budget.lines.length);
    console.log('✅ 预览：预算明细:', lines.map(l => ({ 
      item: l.item, 
      budgetRaw: l.budgetAmount, 
      budgetYuan: (l.budgetAmount || 0) / 100
    })));
    console.log('✅ 预览：预算汇总(元) - 总预算:', calculatedTotalBudget);
    console.log('✅ 预览：Store计算值(分) - 总预算:', budgetStore.totalBudget);
    
  } catch (error) {
    console.error('❌ 预览：加载预算数据失败:', error);
    previewData.budget.lines = [];
    previewData.budget.summary = null;
    console.log('⚠️ 预览：预算加载失败，将显示"暂无预算计划"');
  }
};

// 加载议程数据
const loadAgenda = async () => {
  try {
    // 从agenda store获取实际议程数据
    console.log('🔍 预览：加载议程数据，store中的天数:', agendaStore.days.length);
    if (agendaStore.days && agendaStore.days.length > 0) {
      previewData.agenda = agendaStore.days.map(day => ({
        date: day.date,
        items: day.items.map(item => ({
          startTime: item.start,
          title: item.title,
          speaker: item.speaker,
          location: item.location,
          duration: item.duration
        }))
      }));
      console.log('✅ 预览：议程数据加载成功，天数:', previewData.agenda.length);
    } else {
      console.log('⚠️ 预览：store中没有议程数据');
      previewData.agenda = [];
    }
  } catch (error) {
    console.error('加载议程数据失败:', error);
    previewData.agenda = [];
  }
};

// 加载分工数据
const loadDivision = async () => {
  try {
    console.log('🔍 预览：加载分工数据，项目ID:', props.projectId);
    
    if (!props.projectId) {
      console.log('⚠️ 预览：项目ID为空，跳过分工加载');
      previewData.division = [];
      return;
    }
    
    // 🔧 重要修复：直接从后端获取最新的分工数据，确保预览与保存的数据一致
    console.log('🔄 预览：从后端重新加载最新分工数据');
    
    // 重新加载最新的分工数据
    await divisionStore.initProject(props.projectId);
    await divisionStore.loadMembers(props.projectId);
    
    console.log('✅ 预览：后端数据加载完成');
    console.log('✅ 预览：roles数量:', divisionStore.roles.length);
    console.log('✅ 预览：tasks数量:', divisionStore.tasks.length);
    console.log('✅ 预览：members数量:', divisionStore.members.length);
    
    // 从最新的store数据转换为预览格式
    if (divisionStore.tasks && divisionStore.tasks.length > 0) {
      previewData.division = divisionStore.tasks.map(task => {
        // 🔧 关键修复：任务使用assignedRoleId字段，需要先找到角色，再找到用户
        let assigneeName = '未指派';
        let assigneeRole = '未分配角色';
        
        if (task.assignedRoleId) {
          // 先通过角色ID找到角色
          const assignedRole = divisionStore.roles.find(role => role.id === task.assignedRoleId);
          if (assignedRole) {
            assigneeRole = assignedRole.name || '未命名角色';
            
            // 再通过角色的assignedUserId找到用户
            if (assignedRole.assignedUserId) {
              const assignedMember = divisionStore.members.find(member => member.userId === assignedRole.assignedUserId);
              assigneeName = assignedMember ? (assignedMember.user?.name || assignedMember.name || '未知人员') : '用户不存在';
            }
          }
        }
        
        // 根据checklist计算任务状态  
        let status = 'pending';
        if (task.checklist && task.checklist.length > 0) {
          const completedCount = task.checklist.filter(item => item.completed).length;
          const totalCount = task.checklist.length;
          if (completedCount === totalCount) {
            status = 'completed';
          } else if (completedCount > 0) {
            status = 'in_progress';
          }
        }
        
        return {
          taskName: task.name || '未命名任务',
          assignee: assigneeName,
          role: assigneeRole,
          deadline: '待设定',
          status: status
        };
      });
      
      console.log('✅ 预览：分工数据转换成功，任务数:', previewData.division.length);
      console.log('✅ 预览：分工详情:', previewData.division.map(d => ({ 
        taskName: d.taskName, 
        assignee: d.assignee,
        role: d.role,
        status: d.status 
      })));
    } else {
      console.log('⚠️ 预览：没有分工任务数据');
      previewData.division = [];
    }
    
  } catch (error) {
    console.error('❌ 预览：加载分工数据失败:', error);
    previewData.division = [];
    console.log('⚠️ 预览：分工加载失败，将显示"暂无任务分工"');
  }
};

// 辅助方法：获取项目状态文本
const getProjectStatusText = (status: string) => {
  const statusMap = {
    'draft': '草稿',
    'planning': '规划中',
    'approved': '已批准',
    'active': '执行中',
    'completed': '已完成',
    'cancelled': '已取消'
  };
  return statusMap[status] || status || '未知';
};

// 辅助方法：获取项目类型名称
const getProjectTypeName = (typeId: string) => {
  const typeMap = {
    'bf11c0bb-03c8-426c-8a37-dc3f5da848b2': '内部培训',
    'c0aa1234-1234-5678-9abc-def123456789': '外部培训',
    'a1b2c3d4-5678-9012-3456-789012345678': '在线培训',
    'd4e5f6g7-8901-2345-6789-012345678901': '混合培训',
    'e7f8g9h0-1234-5678-9012-345678901234': '专项培训'
  };
  return typeMap[typeId] || typeId || '未知类型';
};

// 辅助方法：获取资源类型颜色
const getResourceTypeColor = (type: string) => {
  const colorMap = {
    'digital': 'primary',
    'service': 'success',
    'supply': 'warning'
  };
  return colorMap[type] || 'info';
};

// 辅助方法：获取资源类型名称
const getResourceTypeName = (type: string) => {
  const nameMap = {
    'digital': '数字资源',
    'service': '服务资源',
    'supply': '物料资源'
  };
  return nameMap[type] || type;
};

// 辅助方法：获取资源状态颜色
const getResourceStatusColor = (status: string) => {
  const colorMap = {
    'pending': 'info',
    'uploaded': 'primary',
    'requested': 'warning',
    'confirmed': 'success',
    'cancelled': 'danger'
  };
  return colorMap[status] || 'info';
};

// 辅助方法：获取资源状态名称
const getResourceStatusName = (status: string) => {
  const nameMap = {
    'pending': '待处理',
    'uploaded': '已上传',
    'requested': '已申请',
    'confirmed': '已确认',
    'cancelled': '已取消'
  };
  return nameMap[status] || status;
};

// 辅助方法：格式化金额
const formatMoney = (amount: number) => {
  if (!amount) return '0';
  return (amount / 100).toLocaleString('zh-CN', {
    style: 'currency',
    currency: 'CNY'
  });
};

// 辅助方法：获取分工状态颜色
const getDivisionStatusColor = (status: string) => {
  const colorMap = {
    'pending': 'info',
    'in_progress': 'warning',
    'completed': 'success',
    'cancelled': 'danger'
  };
  return colorMap[status] || 'info';
};

// 辅助方法：获取分工状态名称
const getDivisionStatusName = (status: string) => {
  const nameMap = {
    'pending': '待开始',
    'in_progress': '进行中',
    'completed': '已完成',
    'cancelled': '已取消'
  };
  return nameMap[status] || status;
};

// 辅助方法：计算总参与人数
const getTotalParticipants = () => {
  if (previewData.groups && previewData.groups.length > 0) {
    return previewData.groups.reduce((total, group) => {
      return total + (group.students?.length || 0);
    }, 0);
  }
  return previewData.participants?.length || 0;
};

// 打印预览
const handlePrint = () => {
  // 创建一个新的窗口用于打印
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    ElMessage.error('无法打开打印窗口，请检查浏览器弹窗设置');
    return;
  }
  
  // 生成完整的HTML内容
  const printContent = generatePrintHTML();
  
  // 写入内容到新窗口
  printWindow.document.write(printContent);
  printWindow.document.close();
  
  // 等待内容加载完成后打印
  printWindow.onload = () => {
    printWindow.print();
    printWindow.close();
  };
};

// 生成打印HTML内容
const generatePrintHTML = () => {
  const currentDate = new Date().toLocaleDateString('zh-CN');
  
  // 生成基本信息HTML
  const basicInfoHTML = `
    <div class="print-section">
      <h2>项目概览</h2>
      <table class="info-table">
        <tr><td>项目名称：</td><td>${props.projectData?.name || '未设置'}</td></tr>
        <tr><td>项目编号：</td><td>${props.projectData?.projectNo || '未生成'}</td></tr>
        <tr><td>负责人：</td><td>${props.projectData?.owner?.name || '未指定'}</td></tr>
        <tr><td>状态：</td><td>${getProjectStatusText(props.projectData?.status)}</td></tr>
        <tr><td>项目类型：</td><td>${getProjectTypeName(props.projectData?.type) || '未选择'}</td></tr>
        <tr><td>培训目标：</td><td>${props.projectData?.goal || '待完善'}</td></tr>
      </table>
    </div>
  `;
  
  // 生成培训对象HTML
  let participantsHTML = '<div class="print-section"><h2>培训对象与分组</h2>';
  if (previewData.groups && previewData.groups.length > 0) {
    participantsHTML += `<p><strong>总人数：</strong>${getTotalParticipants()} 人，共${previewData.groups.length}个小组</p>`;
    previewData.groups.forEach(group => {
      participantsHTML += `
        <div class="group-section">
          <h3>${group.name} (${(group.students || []).length}人)</h3>
          <table class="participants-table">
            <thead>
              <tr><th>姓名</th><th>部门</th><th>职位</th><th>角色</th></tr>
            </thead>
            <tbody>
      `;
      if (group.students && group.students.length > 0) {
        group.students.forEach(student => {
          participantsHTML += `
            <tr>
              <td>${student.name}</td>
              <td>${student.department}</td>
              <td>${student.position}</td>
              <td>学员</td>
            </tr>
          `;
        });
      } else {
        participantsHTML += '<tr><td colspan="4">该组暂无成员</td></tr>';
      }
      participantsHTML += '</tbody></table></div>';
    });
  } else if (previewData.participants && previewData.participants.length > 0) {
    participantsHTML += `<p><strong>参与人数：</strong>${previewData.participants.length} 人（未分组）</p>`;
    participantsHTML += `
      <table class="participants-table">
        <thead>
          <tr><th>姓名</th><th>部门</th><th>职位</th><th>角色</th></tr>
        </thead>
        <tbody>
    `;
    previewData.participants.forEach(participant => {
      participantsHTML += `
        <tr>
          <td>${participant.name}</td>
          <td>${participant.department}</td>
          <td>${participant.position}</td>
          <td>${participant.role}</td>
        </tr>
      `;
    });
    participantsHTML += '</tbody></table>';
  } else {
    participantsHTML += '<p>暂无培训对象数据</p>';
  }
  participantsHTML += '</div>';
  
  // 生成议程HTML（如果启用）
  let agendaHTML = '';
  if (props.projectConfig.enableAgenda) {
    agendaHTML = '<div class="print-section"><h2>议程安排</h2>';
    if (previewData.agenda && previewData.agenda.length > 0) {
      previewData.agenda.forEach((day, index) => {
        agendaHTML += `
          <div class="agenda-day">
            <h3>第${index + 1}天 ${day.date}</h3>
            <table class="agenda-table">
              <thead>
                <tr><th>时间</th><th>内容</th><th>讲师</th><th>地点</th><th>时长</th></tr>
              </thead>
              <tbody>
        `;
        day.items.forEach(item => {
          agendaHTML += `
            <tr>
              <td>${item.startTime}</td>
              <td>${item.title}</td>
              <td>${item.speaker}</td>
              <td>${item.location}</td>
              <td>${item.duration}分钟</td>
            </tr>
          `;
        });
        agendaHTML += '</tbody></table></div>';
      });
    } else {
      agendaHTML += '<p>暂无议程安排</p>';
    }
    agendaHTML += '</div>';
  }
  
  // 生成资源配置HTML（如果启用）
  let resourcesHTML = '';
  if (props.projectConfig.enableResource) {
    resourcesHTML = '<div class="print-section"><h2>资源配置</h2>';
    if (previewData.resources && previewData.resources.length > 0) {
      resourcesHTML += `
        <table class="resources-table">
          <thead>
            <tr><th>资源类型</th><th>资源名称</th><th>规格说明</th><th>数量</th><th>负责人</th><th>状态</th></tr>
          </thead>
          <tbody>
      `;
      previewData.resources.forEach(resource => {
        resourcesHTML += `
          <tr>
            <td>${getResourceTypeName(resource.type)}</td>
            <td>${resource.name}</td>
            <td>${resource.spec}</td>
            <td>${resource.quantity}</td>
            <td>${resource.responsible}</td>
            <td>${getResourceStatusName(resource.status)}</td>
          </tr>
        `;
      });
      resourcesHTML += '</tbody></table>';
    } else {
      resourcesHTML += '<p>暂无资源配置</p>';
    }
    resourcesHTML += '</div>';
  }
  
  // 生成预算HTML（如果启用）
  let budgetHTML = '';
  if (props.projectConfig.enableBudget) {
    budgetHTML = '<div class="print-section"><h2>预算计划</h2>';
    if (previewData.budget && previewData.budget.lines && previewData.budget.lines.length > 0) {
      budgetHTML += `
        <div class="budget-summary">
          <p><strong>预算总额：</strong>${previewData.budget.summary?.totalBudget || 0} 元</p>
        </div>
        <table class="budget-table">
          <thead>
            <tr><th>费用科目</th><th>费用项目</th><th>预算金额</th><th>备注</th></tr>
          </thead>
          <tbody>
      `;
      previewData.budget.lines.forEach(line => {
        budgetHTML += `
          <tr>
            <td>${line.category}</td>
            <td>${line.item}</td>
            <td>${formatMoney(line.budgetAmount)}</td>
            <td>${line.notes || ''}</td>
          </tr>
        `;
      });
      budgetHTML += '</tbody></table>';
    } else {
      budgetHTML += '<p>暂无预算计划</p>';
    }
    budgetHTML += '</div>';
  }
  
  // 生成分工HTML（如果启用）
  let divisionHTML = '';
  if (props.projectConfig.enableDivision) {
    divisionHTML = '<div class="print-section"><h2>任务分工</h2>';
    if (previewData.division && previewData.division.length > 0) {
      divisionHTML += `
        <table class="division-table">
          <thead>
            <tr><th>任务名称</th><th>负责人</th><th>角色</th><th>截止时间</th><th>状态</th></tr>
          </thead>
          <tbody>
      `;
      previewData.division.forEach(task => {
        divisionHTML += `
          <tr>
            <td>${task.taskName}</td>
            <td>${task.assignee}</td>
            <td>${task.role}</td>
            <td>${task.deadline}</td>
            <td>${getDivisionStatusName(task.status)}</td>
          </tr>
        `;
      });
      divisionHTML += '</tbody></table>';
    } else {
      divisionHTML += '<p>暂无任务分工</p>';
    }
    divisionHTML += '</div>';
  }
  
  // 组装完整的HTML
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>培训方案预览 - ${props.projectData?.name || '培训方案'}</title>
      <style>
        body { 
          font-family: "PingFang SC", "Microsoft YaHei", sans-serif; 
          margin: 20px; 
          line-height: 1.6;
          color: #333;
        }
        .header { 
          text-align: center; 
          border-bottom: 2px solid #409eff; 
          padding-bottom: 20px; 
          margin-bottom: 30px; 
        }
        .header h1 { 
          margin: 0; 
          color: #409eff; 
          font-size: 28px; 
        }
        .header .subtitle { 
          margin: 10px 0 0 0; 
          color: #666; 
          font-size: 14px; 
        }
        .print-section { 
          margin-bottom: 30px; 
          page-break-inside: avoid; 
        }
        .print-section h2 { 
          color: #409eff; 
          border-bottom: 1px solid #409eff; 
          padding-bottom: 8px; 
          margin-bottom: 15px; 
        }
        .print-section h3 { 
          color: #666; 
          margin: 15px 0 10px 0; 
        }
        table { 
          width: 100%; 
          border-collapse: collapse; 
          margin-bottom: 15px; 
        }
        th, td { 
          border: 1px solid #ddd; 
          padding: 8px; 
          text-align: left; 
        }
        th { 
          background-color: #f5f7fa; 
          font-weight: 600; 
        }
        .info-table td:first-child { 
          background-color: #f9f9f9; 
          font-weight: 600; 
          width: 120px; 
        }
        .budget-summary { 
          background-color: #f5f7fa; 
          padding: 15px; 
          border-radius: 4px; 
          margin-bottom: 15px; 
        }
        .budget-summary p { 
          margin: 5px 0; 
          display: inline-block; 
          margin-right: 30px; 
        }
        .group-section { 
          margin-bottom: 20px; 
          padding: 15px; 
          border: 1px solid #eee; 
          border-radius: 4px; 
        }
        .agenda-day { 
          margin-bottom: 20px; 
          padding: 15px; 
          border: 1px solid #eee; 
          border-radius: 4px; 
        }
        @media print { 
          body { margin: 0; } 
          .print-section { page-break-inside: avoid; }
          table { page-break-inside: auto; }
          tr { page-break-inside: avoid; page-break-after: auto; }
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>${props.projectData?.name || '培训方案'}</h1>
        <p class="subtitle">方案预览报告 - 打印时间：${currentDate}</p>
      </div>
      
      ${basicInfoHTML}
      ${participantsHTML}
      ${agendaHTML}
      ${resourcesHTML}
      ${budgetHTML}
      ${divisionHTML}
      
      <div style="margin-top: 40px; text-align: center; color: #999; font-size: 12px; border-top: 1px solid #eee; padding-top: 20px;">
        本报告由培训管理系统自动生成 - ${currentDate}
      </div>
    </body>
    </html>
  `;
};
</script>

<style scoped>
.proposal-management-container {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.proposal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.proposal-tabs {
  flex: 1;
}

.proposal-tabs :deep(.el-tabs__header) {
  margin: 0;
}

.proposal-actions {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-left: 16px;
}

.withdraw-btn {
  color: var(--el-text-color-secondary);
}

.status-tag {
  margin-left: 12px;
}

.proposal-content {
  min-height: 500px;
}

.tab-content {
  padding: 0;
}

.placeholder-card {
  margin-top: 20px;
}

.approval-section {
  margin-top: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: 600;
}

.proposal-preview {
  max-height: 75vh;
  overflow-y: auto;
  padding: 8px;
}

.preview-section {
  margin: 24px 0;
  padding: 20px;
  background: var(--el-bg-color-page);
  border-radius: 8px;
  border: 1px solid var(--el-border-color-lighter);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.04);
}

.preview-section h3 {
  margin: 0 0 16px 0;
  color: var(--el-text-color-primary);
  font-size: 16px;
  font-weight: 600;
  border-bottom: 2px solid var(--el-color-primary);
  padding-bottom: 8px;
}

.preview-section h4 {
  margin: 16px 0 8px 0;
  color: var(--el-text-color-regular);
  font-size: 14px;
  font-weight: 500;
}

.preview-section p {
  margin: 8px 0;
  color: var(--el-text-color-regular);
  line-height: 1.6;
}

/* 分组标签样式 */
.groups-summary {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 12px;
}

/* 议程日程样式 */
.agenda-day {
  margin-bottom: 20px;
  padding: 16px;
  border: 1px solid var(--el-border-color-light);
  border-radius: 8px;
  background: var(--el-bg-color);
}

.agenda-day h4 {
  margin: 0 0 12px 0;
  color: var(--el-color-primary);
  font-weight: 600;
  font-size: 15px;
}

/* 预算汇总样式 */
.budget-summary {
  display: flex;
  gap: 40px;
  justify-content: flex-start;
  padding: 20px;
  background: var(--el-bg-color);
  border-radius: 8px;
  border: 1px solid var(--el-border-color-light);
  margin-bottom: 16px;
}

.budget-summary .el-statistic {
  text-align: center;
}

/* 表格样式优化 */
.preview-section .el-table {
  margin-top: 12px;
}

.preview-section .el-table th {
  background-color: var(--el-fill-color-light);
}

/* 描述列表样式优化 */
.preview-section .el-descriptions {
  margin-bottom: 0;
}

/* 分组成员显示样式 */
.group-members {
  padding: 12px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 6px;
  background: var(--el-bg-color);
}

.group-members h4 {
  border-bottom: 1px solid var(--el-border-color-light);
  padding-bottom: 6px;
  margin-bottom: 12px !important;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .proposal-header {
    flex-direction: column;
    gap: 12px;
    align-items: stretch;
  }
  
  .proposal-actions {
    margin-left: 0;
    justify-content: center;
  }
}
</style> 