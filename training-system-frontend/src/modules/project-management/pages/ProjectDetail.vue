<template>
  <div class="project-detail-page">
    <!-- 三列布局的项目管理界面 -->
    <div class="project-detail-container">
      <!-- 左侧统一菜单 -->
      <div class="left-menu" :class="{ 'collapsed': leftMenuCollapsed }">
        <el-menu :default-active="activeMenu" @select="handleMenuSelect" class="unified-menu">
          <!-- 基本信息 -->
          <el-menu-item index="basic-info">
            <el-icon><Document /></el-icon>
            <span v-show="!leftMenuCollapsed">概览</span>
          </el-menu-item>
          
          <!-- 学员管理 -->
          <el-menu-item index="students">
            <el-icon><User /></el-icon>
            <span v-show="!leftMenuCollapsed">学员</span>
          </el-menu-item>
          
          <!-- 培训方案 -->
          <el-menu-item v-if="projectConfig.enableFullPlan" index="proposal">
            <el-icon><Reading /></el-icon>
            <span v-show="!leftMenuCollapsed">方案</span>
          </el-menu-item>
          
          <!-- 任务管理 -->
          <el-menu-item index="tasks">
            <el-icon><List /></el-icon>
            <span v-show="!leftMenuCollapsed">任务</span>
          </el-menu-item>
          
          <!-- 带教管理 -->
          <el-menu-item v-if="projectConfig.enableMentorship" index="mentoring">
            <el-icon><UserFilled /></el-icon>
            <span v-show="!leftMenuCollapsed">带教</span>
          </el-menu-item>
          
          <!-- 项目新闻 -->
          <el-menu-item v-if="projectConfig.enableNews" index="news">
            <el-icon><Notification /></el-icon>
            <span v-show="!leftMenuCollapsed">新闻</span>
          </el-menu-item>
        </el-menu>
        
        <!-- 左侧收缩按钮 -->
        <div class="collapse-button left-collapse-button" @click="toggleLeftMenu">
          <el-icon>
            <component :is="leftMenuCollapsed ? 'ArrowRight' : 'ArrowLeft'" />
          </el-icon>
        </div>
      </div>
      
      <!-- 中间主内容区 -->
      <div class="main-content">
                <!-- 概览管理 -->
        <div v-show="activeMenu === 'basic-info'" class="content-section">
          <div class="tabs-container">
            <el-tabs v-model="activeInfoTab" class="info-tabs">
            
            <!-- Tab1: 基本信息 -->
            <el-tab-pane label="基本信息" name="basic-info">
              <BasicInfoForm 
                v-model="formData" 
                :project-data="projectData"
                :is-new-project="isNewProject"
                :edit-mode="editStates.basicInfo"
                @form-data-updated="handleFormDataUpdate"
                @project-type-changed="handleProjectTypeChanged"
                ref="basicInfoRef"
              />
            </el-tab-pane>
            
            <!-- Tab2: 功能配置 -->
            <el-tab-pane label="功能配置" name="config">
              <ProjectConfigForm 
                :config="projectConfig"
                :available-users="availableUsers"
                :edit-mode="editStates.basicInfo"
                @update:config="handleConfigUpdate"
              />
            </el-tab-pane>

            <!-- Tab3: 总结 -->
            <el-tab-pane label="总结" name="summary">
              <ProjectSummaryContent 
                ref="projectSummaryRef"
                :edit-mode="editStates.summary" 
                :project-id="projectNo"
                :project-data="projectData"
                @summary-saved="handleSummarySaved"
              />
            </el-tab-pane>
          </el-tabs>
          
          <!-- Tab行编辑按钮 -->
          <div class="tab-edit-button">
            <el-button 
              v-if="canEditCurrentTab('basic-info', activeInfoTab)"
              size="small" 
              type="primary" 
              :icon="getCurrentEditState(activeInfoTab) ? Check : Edit"
              @click="toggleCurrentTabEditMode(activeInfoTab)"
            >
              {{ getCurrentEditState(activeInfoTab) ? '保存' : '编辑' }}
            </el-button>
          </div>
          </div>
        </div>

        <!-- 学员管理 -->
        <div v-show="activeMenu === 'students'" class="content-section">
          <StudentManagement 
            :project-id="projectNo"
            :project-data="projectData"
            :project-type="effectiveProjectType"
            :participants="participants"
            :is-new-project="isNewProject"
            :edit-mode="editStates.students"
            @participants-updated="handleParticipantsUpdated"
          />
        </div>

        <!-- 培训方案 -->
        <div v-show="activeMenu === 'proposal'" class="content-section">
          
          <ProposalManagement 
            :project-id="projectNo" 
            :project-data="projectData" 
            :project-config="projectConfig"
            :is-new-project="isNewProject"
            :edit-mode="editStates.proposal"
            @goto-basic-info="activeMenu = 'basic-info'"
          />
        </div>

                <!-- 任务管理 (原培训中的完整内容) -->
        <div v-show="activeMenu === 'tasks'" class="content-section">
          <!-- Tab布局和编辑按钮 -->
          <div class="tabs-container">
            <el-tabs v-model="activeTaskTab" class="task-tabs" @tab-click="handleTabClick">
            
            <!-- Tab1: 任务 -->
            <el-tab-pane label="任务" name="outline">
              <div class="task-management-container">
                <!-- 任务内容区域 - 移除左侧面板，全宽显示 -->
                <div class="task-main-content full-width">
                  <!-- 默认任务列表界面 -->
                  <template v-if="currentView === 'tasks'">
                    <!-- 只在草稿状态或编辑模式显示任务类型选择器 -->
                    <TaskTypeSelector v-if="isNewProject || projectData?.status === 'DRAFT' || editStates.tasks" />
                    
                    <TaskList 
                      :project-status="projectData?.status" 
                      :task-edit-mode="editStates.tasks"
                      :project-id="projectNo"
                      @switch-to-management="handleSwitchToManagement"
                    />
                  </template>

                  <!-- 管理界面 -->
                  <template v-else-if="currentView === 'management'">
                    <component 
                      :is="getCurrentManagementComponent()" 
                      :key="managementType"
                      @back-to-tasks="currentView = 'tasks'"
                    />
                  </template>
                </div>
              </div>
            </el-tab-pane>

            <!-- Tab2: 协同 -->
            <el-tab-pane label="协同" name="cooperation">
              <CooperationManagement 
                :edit-mode="editStates.tasks" 
                :project-id="projectNo"
                :project-status="projectData?.status"
              />
            </el-tab-pane>

            <!-- Tab3: 成绩 (不提供编辑功能) -->
            <el-tab-pane label="成绩" name="grades">
              <ScoreManagement :project-id="projectNo" />
            </el-tab-pane>

            <!-- Tab4: 会议 -->
            <el-tab-pane label="会议" name="meetings">
              <MeetingRecords :edit-mode="editStates.tasks" :project-id="projectNo" />
            </el-tab-pane>
          </el-tabs>
          
          <!-- Tab行编辑按钮 - 仅在任务列表模式下显示 -->
          <div class="tab-edit-button">
            <el-button 
              v-if="canEditCurrentTab('tasks', activeTaskTab) && currentView === 'tasks'"
              size="small" 
              type="primary" 
              :icon="editStates.tasks ? Check : Edit"
              @click="toggleEditMode('tasks')"
            >
              {{ editStates.tasks ? '保存' : '编辑' }}
            </el-button>
          </div>
          </div>
        </div>

        <!-- 带教管理 -->
        <div v-if="projectConfig.enableMentorship" v-show="activeMenu === 'mentoring'" class="content-section">
          <MentoringManagement :project-id="projectNo" />
        </div>

        <!-- 项目新闻 -->
        <div v-show="activeMenu === 'news'" class="content-section">
          <ProjectNewsPage 
            :edit-mode="editStates.news" 
            :project-id="projectNo"
            :project-data="projectData"
          />
        </div>
      </div>
      
      <!-- 右侧项目信息面板 -->
      <div class="project-info-panel" :class="{ 'collapsed': rightPanelCollapsed }">
        <!-- 右侧收缩按钮 -->
        <div class="collapse-button right-collapse-button" @click="toggleRightPanel">
          <el-icon>
            <component :is="rightPanelCollapsed ? 'ArrowLeft' : 'ArrowRight'" />
          </el-icon>
        </div>
        
        <el-card class="project-info-card" shadow="hover" v-show="!rightPanelCollapsed">
          <!-- 项目操作按钮栏 - 置于顶部 -->
          <div class="project-actions-bar">
            <!-- 草稿状态的操作按钮 -->
            <template v-if="isNewProject || projectData?.status === 'DRAFT'">
              <el-button 
                type="text" 
                :icon="DocumentAdd"
                @click="handleSaveProject"
                :loading="saving"
                class="action-button"
              >
                保存项目
              </el-button>
              <el-divider direction="vertical" />
              <el-button 
                type="text" 
                :icon="Promotion"
                @click="publishProject"
                :loading="publishing"
                class="action-button primary-action"
              >
                发布项目
              </el-button>
            </template>
            
            <!-- 执行状态的操作按钮 -->
            <template v-else-if="projectData?.status === 'ACTIVE'">
              <el-dropdown @command="handleProjectAction">
                <el-button type="text" class="action-button">
                  项目操作 <el-icon class="el-icon--right"><arrow-down /></el-icon>
                </el-button>
                <template #dropdown>
                  <el-dropdown-menu>
                    <el-dropdown-item command="revoke" :icon="RefreshLeft">
                      撤回项目
                    </el-dropdown-item>
                    <el-dropdown-item command="complete" :icon="Check">
                      结束项目
                    </el-dropdown-item>
                    <el-dropdown-item command="saveTemplate" :icon="DocumentCopy">
                      保存为模板
                    </el-dropdown-item>
                  </el-dropdown-menu>
                </template>
              </el-dropdown>
            </template>
          </div>

          <!-- 项目基本信息头部 -->
          <div class="project-info-header">
            <div class="project-title">
              <h3>{{ projectData?.name || '新建项目' }}</h3>
              <el-tag 
                :type="getProjectStatusType(projectData?.status)" 
                size="default"
                class="status-tag"
              >
                {{ getProjectStatusText(projectData?.status) }}
              </el-tag>
            </div>
          </div>
          
          <!-- 项目详细信息 -->
          <div class="project-details">
            <div class="detail-item" v-if="projectData?.projectType">
              <span class="label">项目类型：</span>
              <span class="value">{{ projectData.projectType }}</span>
            </div>
            <div class="detail-item" v-if="projectData?.startDate">
              <span class="label">开始日期：</span>
              <span class="value">{{ formatDate(projectData.startDate) }}</span>
            </div>
            <div class="detail-item" v-if="projectData?.endDate">
              <span class="label">结束日期：</span>
              <span class="value">{{ formatDate(projectData.endDate) }}</span>
            </div>
            <div class="detail-item" v-if="projectData?.ownerName">
              <span class="label">负责人：</span>
              <span class="value">{{ projectData.ownerName }}</span>
            </div>
            <div class="detail-item" v-if="projectData?.estimatedDuration">
              <span class="label">预计时长：</span>
              <span class="value">{{ projectData.estimatedDuration }}小时</span>
            </div>
          </div>
        </el-card>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, reactive, defineComponent, watch } from 'vue';
import { storeToRefs } from 'pinia';
import { InfoFilled, ArrowDown, ArrowLeft, Operation, Edit, Document, User, Reading, List, DataAnalysis, Notification, DocumentAdd, Promotion, RefreshLeft, Check, DocumentCopy, UserFilled, ArrowRight } from '@element-plus/icons-vue';
import ProposalManagement from '../components/ProposalManagement.vue';
import BasicInfoManagement from '../components/BasicInfoManagement.vue';
import BasicInfoForm from '../components/BasicInfoForm.vue';
import ProjectConfigForm from '../components/ProjectConfigForm.vue';
import TrainingStagePanel from '../components/TrainingStagePanel.vue';
import TaskTypeSelector from '../components/TaskTypeSelector.vue';
import TaskList from '../components/TaskList.vue';
import StudentManagement from '../components/StudentManagement.vue';
import ProjectSummary from '../components/ProjectSummary.vue';
import ProjectSummaryContent from '../components/ProjectSummaryContent.vue';
import ProjectNewsPage from '../components/ProjectNewsPage.vue';
import ProjectNews from '../components/ProjectNews.vue';
import CooperationManagement from '../components/CooperationManagement.vue';
import CooperationSetting from '../components/CooperationSetting.vue'
import TaskAttendanceManagement from '../components/TaskAttendanceManagement.vue'
import TaskHomeworkManagement from '../components/TaskHomeworkManagement.vue'
import TaskActivityManagement from '../components/TaskActivityManagement.vue'
import TaskDiscussionManagement from '../components/TaskDiscussionManagement.vue'
import TaskFaceToFaceManagement from '../components/TaskFaceToFaceManagement.vue'
import TaskOnlineCourseManagement from '../components/TaskOnlineCourseManagement.vue'
import MeetingRecords from '../components/MeetingRecords.vue'
import ScoreManagement from '../components/ScoreManagement.vue'
import ExamManagement from '../components/ExamManagement.vue'
import QuestionnaireManagement from '../components/QuestionnaireManagement.vue'
import MentoringManagement from '../components/MentoringManagement.vue'
import CooperationTaskSelector from '../components/CooperationTaskSelector.vue'
import { createProject, updateProject, getProject, publishProject as publishProjectApi, withdrawProject as withdrawProjectApi } from '@/api/modules/project';
import type { Project } from '@/api/modules/project';

// 添加 router 导入
import { useRouter } from 'vue-router';
import { onMounted } from 'vue';

// 添加议程store导入
import { useAgendaStore } from '../stores/agenda';
import { useTrainingStageStore } from '../stores/trainingStage';
import { useDivisionStore } from '../stores/division';
import { useRoute } from 'vue-router';
import { ElMessageBox, ElMessage } from 'element-plus';
import { ElEmpty } from 'element-plus';

// --- 项目数据状态 ---
const projectData = ref<Project | null>(null);
const loading = ref(false);
const publishLoading = ref(false);
const formData = ref<any>(null);

// --- 界面切换状态 ---
const currentView = ref<'tasks' | 'management'>('tasks');
const managementType = ref('');
const managementTitle = ref('');
const currentTask = ref<any>(null);

// --- Tab状态 ---
const activeInfoTab = ref('basic-info'); // 基本信息Tab：basic-info(基本信息) | config(功能配置)
const activeTaskTab = ref('outline'); // 任务Tab：outline(任务) | cooperation(协同) | grades(成绩) | meetings(会议)

// --- 编辑模式状态 ---
// 编辑状态管理
const editStates = reactive({
  basicInfo: false, // 先设为false，稍后在isNewProject定义后更新
  students: false, 
  proposal: false,
  tasks: false,
  summary: false,
  news: false
});

// 项目操作加载状态
const saving = ref(false);
const publishing = ref(false);
const cooperationEditMode = ref(false);
const isEditMode = ref(false); // 新增：控制基本信息和功能配置的编辑模式

// --- 协同任务数据 ---
const cooperationTasks = ref([
  {
    id: '1',
    category: '人工作判组',
    count: 1,
    type: 'manual_group',
    config: {},
    originalTasks: [],
    groupProgress: [
      { groupId: '1', groupName: '第1组', progress: 80, status: '进行中' },
      { groupId: '2', groupName: '第2组', progress: 60, status: '进行中' },
      { groupId: '3', groupName: '第3组', progress: 100, status: '已完成' }
    ]
  }
]);

// --- 协同任务选择器状态 ---
const taskSelectorVisible = ref(false);
// --- Refs ---
const basicInfoRef = ref();
const projectSummaryRef = ref()
// const groupManagementRef = ref(); // 已移除：分组管理现在在StudentManagement中

// --- Reactive Data ---
const currentProjectType = ref<string>(''); // 当前项目类型ID

// ✅ 新增：一个计算属性，用于确定传递给子组件的最终项目类型
const effectiveProjectType = computed(() => {
  let result = '';
  if (isNewProject.value) {
    // 对于新项目，实时使用在"基本信息"中选择的类型
    result = currentProjectType.value;
    console.log('🔍 新项目 - effectiveProjectType:', result, '来源: currentProjectType.value');
  } else {
    // 对于现有项目，使用从后端加载的数据
    result = projectData.value?.type || '';
    console.log('🔍 现有项目 - effectiveProjectType:', result, '来源: projectData.value?.type');
  }
  
  console.log('🔍 最终传递给子组件的项目类型:', result);
  return result;
});

const participants = computed(() => {
  const participantsData = projectData.value?.participants || [];
  console.log('🔍 ProjectDetail - participants computed 被调用');
  console.log('🔍 projectData.value:', projectData.value);
  console.log('🔍 participants 数据:', participantsData);
  console.log('🔍 participants 长度:', participantsData.length);
  if (participantsData.length > 0) {
    console.log('🔍 第一个participant结构:', participantsData[0]);
  }
  return participantsData;
});

// 处理参与者更新事件
const handleParticipantsUpdated = async (updatedParticipants: any[]) => {
  console.log('🔄 参与者数据已更新:', updatedParticipants);
  
  // 如果是新项目，暂存参与者数据
  if (isNewProject.value) {
    // 为新项目临时存储参与者数据
    if (!projectData.value) {
      projectData.value = { participants: [] };
    }
    if (!projectData.value.participants) {
      projectData.value.participants = [];
    }
    
    // 将新选择的参与者添加到项目数据中（转换为ProjectParticipant格式）
    const newParticipants = updatedParticipants.map(p => ({
      userId: p.id,
      role: 'STUDENT',
      status: 'ACTIVE',
      user: p
    }));
    
    projectData.value.participants = [...projectData.value.participants, ...newParticipants];
  } else {
    // 对于现有项目，重新获取项目数据以确保数据同步
    await fetchProjectData();
  }
};

// --- 议程store ---
const agendaStore = useAgendaStore();

// --- 培训阶段store ---
const trainingStageStore = useTrainingStageStore();
const { stages } = storeToRefs(trainingStageStore);

const activeTab = ref('before');
const activeMenu = ref('basic-info');

// --- Project Feature Configuration (State Lifted from Child) ---
const projectConfig = reactive({
  enableGroupChat: false,
  enableNews: false,      // 🔧 新增：新闻功能，默认关闭
  enableFullPlan: false,  // 🔧 修改：新项目默认关闭完整方案
  enableMentorship: false, // 🔧 新增：带教功能，默认关闭
  enableAgenda: false,    // 🔧 修改：默认关闭，从后端数据恢复
  enableResource: false,  // 🔧 修改：默认关闭，从后端数据恢复
  enableBudget: false,    // 🔧 修改：默认关闭，从后端数据恢复
  enableDivision: false, // 🔧 修改：默认关闭，从后端数据恢复
  approver: '',
});

// 可用用户列表（从API获取真实数据）
const availableUsers = ref<{ id: string; name: string }[]>([]);

// 加载用户列表
const loadAvailableUsers = async () => {
  try {
    console.log('🔄 加载用户列表...');
    const { searchUsers } = await import('@/api/modules/user');
    const users = await searchUsers({ limit: 100 });
    console.log('✅ 用户列表加载成功:', users);
    
    availableUsers.value = users.map(user => ({
      id: user.id,
      name: user.name,
    }));
  } catch (error) {
    console.error('❌ 加载用户列表失败:', error);
    // 如果加载失败，使用模拟数据作为兜底
    availableUsers.value = [
      { id: 'user-1', name: '张经理' },
      { id: 'user-2', name: '李主管' },
      { id: 'user-3', name: '王总监' },
      { id: 'user-4', name: '赵部长' },
    ];
  }
};

// 监听菜单切换，当切换到"任务"时加载任务数据
watch(activeMenu, async (newMenu, oldMenu) => {
  console.log('📝 菜单切换:', oldMenu, '->', newMenu);
  
  if (newMenu === 'tasks' && !isNewProject.value) {
    console.log('📝 切换到任务菜单，开始加载项目任务数据');
    await trainingStageStore.loadProjectTasks(projectNo.value);
  }
}, { immediate: false });

const menuItems = [
      { index: 'info', label: '概览' },
  { index: 'audience', label: '对象' },
  { index: 'grouping', label: '分组' },
  { index: 'group-chat', label: '群聊', enabled: () => projectConfig.enableGroupChat },
  { index: 'notice', label: '通知' },
  { index: 'proposal', label: '方案', enabled: () => projectConfig.enableFullPlan },
];

// --- 菜单切换处理 ---
function handleMenuSelect(index: string) {
  activeMenu.value = index;
  console.log('菜单切换:', index);
}

// --- 基本信息编辑处理 ---
function handleBasicInfoSubmit(data: any) {
  formData.value = data;
  isEditMode.value = false;
  // 保存逻辑
}

function handleConfigSubmit(config: any) {
  projectConfig.value = config;
  isEditMode.value = false;
  // 保存逻辑
}

async function handleConfigUpdate(newConfig: any) {
  // 若关闭完整方案，则级联关闭其子模块
  if (!newConfig.enableFullPlan) {
    newConfig.enableAgenda = false;
    newConfig.enableResource = false;
    newConfig.enableBudget = false;
    newConfig.enableDivision = false;
    newConfig.approver = '';
  }
  
  // 若开启完整方案，则自动启用其子模块
  if (newConfig.enableFullPlan && !projectConfig.enableFullPlan) {
    newConfig.enableAgenda = true;
    newConfig.enableResource = true;
    newConfig.enableBudget = true;
    newConfig.enableDivision = true;
  }
  
  // 更新本地配置
  Object.assign(projectConfig, newConfig);
  
  // 自动保存到后端
  if (!isNewProject.value && projectNo.value) {
    try {
      const updateData = {
        config: {
          ...projectData.value?.config,
          ...newConfig
        }
      };
      
      await updateProject(projectNo.value, updateData);
      ElMessage.success('配置已自动保存');
    } catch (error) {
      console.error('❌ 保存项目配置失败:', error);
      ElMessage.error('保存配置失败');
    }
  }
}

function handleFormDataUpdate(data: any) {
  console.log('表单数据更新:', data);
  formData.value = data;
}

function handleProjectTypeChanged(projectType: string) {
  console.log('🔄 项目类型变化:', projectType);
  currentProjectType.value = projectType;
}

function handlePublish() {
  // 发布项目逻辑
}

function handleWithdraw() {
  // 撤回项目逻辑
}

function handleDelete() {
  // 删除项目逻辑
}

// --- 动态管理组件加载 ---
function getCurrentManagementComponent() {
  const componentMap: Record<string, any> = {
    'attendance': TaskAttendanceManagement,
    'homework': TaskHomeworkManagement,
    'activity': TaskActivityManagement,
    'discussion': TaskDiscussionManagement,
    'face-to-face': TaskFaceToFaceManagement,
    'online-course': TaskOnlineCourseManagement,
    'cooperation': CooperationManagement,
    'exam': ExamManagement,
    'questionnaire': QuestionnaireManagement,
    'score': ScoreManagement
  };
  
  return componentMap[managementType.value] || CooperationManagement;
}

// ============ 培训中阶段菜单 ============
const activeDuringMenu = ref('face-to-face');

const trainingDuringMenuItems = [
  { index: 'face-to-face', label: '面授' },
  { index: 'homework', label: '作业' },
  { index: 'online-course', label: '课程' },
  { index: 'conference', label: '会务' },
  { index: 'exam', label: '考试' },
  { index: 'attendance', label: '考勤' },
  { index: 'mentorship', label: '带教' },
  { index: 'review', label: '复盘' },
];

const handleDuringMenuSelect = (index: string) => {
  activeDuringMenu.value = index;
};

const getDuringMenuLabel = (index: string) => {
  return trainingDuringMenuItems.find(item => item.index === index)?.label || '内容区';
};

// ============ 培训后阶段菜单 ============
const activeAfterMenu = ref('summary');

const trainingAfterMenuItems = [
  {
    index: 'settlement',
    label: '决算',
    enabled: () => projectConfig.enableFullPlan && projectConfig.enableBudget,
  },
  { index: 'summary', label: '总结' },
  { index: 'news', label: '新闻' },
];

const handleAfterMenuSelect = (index: string) => {
  activeAfterMenu.value = index;
};

const visibleAfterMenuItems = computed(()=> trainingAfterMenuItems.filter(it=> !it.enabled || it.enabled()));

const getAfterMenuLabel = (index: string) => {
  return trainingAfterMenuItems.find(item => item.index === index)?.label || '内容区';
};

// ==== Route param & project info ====
const route = useRoute();
const router = useRouter();
const projectNo = computed(() => String(route.params.id ?? ''));
const isNewProject = computed(() => projectNo.value === 'new');

// 设置新建项目时基本信息默认进入编辑模式
if (isNewProject.value) {
  editStates.basicInfo = true;
}

// 检查是否显示会议管理Tab：项目发布后且有面授或需要展示的作业
const showMeetingTab = computed(() => {
  // 只在ACTIVE状态下显示
  if (projectData.value?.status !== 'ACTIVE') {
    return false;
  }
  
  // 检查所有阶段的任务中是否有面授或需要展示的作业
  const hasRelevantTasks = stages.value.some(stage => 
    stage.tasks.some(task => 
      task.type === 'face-to-face' || 
      (task.type === 'homework' && task.config?.onsiteDisplay === true)
    )
  );
  
  return hasRelevantTasks;
});

// --- 数据获取逻辑 ---
const fetchProjectData = async () => {
  if (isNewProject.value) {
    // 新项目：初始化空数据和默认配置
    console.log('🔍 新项目 - 初始化空数据');
    projectData.value = null;
    // 重置为默认配置
    Object.assign(projectConfig, {
      enableGroupChat: false,
      enableFullPlan: false,  // 🔧 修改：新项目默认关闭完整方案
      enableAgenda: true,
      enableResource: true,
      enableBudget: true,
      enableDivision: true,
      approver: '',
    });
    // 清空议程数据
    agendaStore.clearAgenda();
    return;
  }
  
  loading.value = true;
  try {
    console.log('🔍 现有项目 - 开始获取项目数据, ID:', projectNo.value);
    const result = await getProject(projectNo.value);
    console.log('🔍 获取项目数据成功:', result);
    projectData.value = result;
    
    // 🔍 立即检查赋值后的projectData.value
    console.log('🔧 projectData.value赋值后立即检查:');
    console.log('🔧 projectData.value:', projectData.value);
    console.log('🔧 projectData.value.config:', projectData.value?.config);
    console.log('🔧 projectData.value.config.type:', projectData.value?.config?.type);
    console.log('🔧 projectData.value.config.target:', projectData.value?.config?.target);
    
    console.log('🔧 获取项目数据成功，开始详细检查:');
    console.log('🔧 result对象:', result);
    console.log('🔧 result.id:', result.id);
    console.log('🔧 result.name:', result.name);
    console.log('🔧 result.config存在吗:', !!result.config);
    console.log('🔧 result.config内容:', result.config);
    
    // 🔍 深度检查config对象
    if (result.config) {
      console.log('🔍 详细检查config对象:');
      console.log('  - config是对象吗:', typeof result.config === 'object');
      console.log('  - config.type:', result.config.type, '(类型:', typeof result.config.type, ')');
      console.log('  - config.target:', result.config.target, '(类型:', typeof result.config.target, ')');
      console.log('  - config所有键:', Object.keys(result.config));
      console.log('  - config JSON:', JSON.stringify(result.config, null, 2));
      
      // 🔍 特别检查项目类型字段
      if (result.config.type) {
        console.log('✅ 项目类型存在且有值:', result.config.type);
      } else {
        console.log('❌ 项目类型不存在或为空值');
        console.log('  - config.type === undefined:', result.config.type === undefined);
        console.log('  - config.type === null:', result.config.type === null);
        console.log('  - config.type === "":', result.config.type === '');
      }
    } else {
      console.log('❌ config对象不存在');
    }
    
    // 关键修复：从项目数据恢复功能模块配置和议程数据
    console.log('🔍 完整的后端返回数据:', result);
    if (result?.config) {
      const config = result.config;
      console.log('🔍 后端config数据:', config);
      
      // 恢复项目配置
      Object.assign(projectConfig, {
        enableGroupChat: config.enableGroupChat ?? false,
        enableNews: config.enableNews ?? false,        // 🔧 新增：新闻功能恢复
        enableFullPlan: config.enableFullPlan ?? false,  // 🔧 修改：默认关闭完整方案
        enableMentorship: config.enableMentorship ?? false, // 🔧 新增：带教功能恢复
        enableAgenda: config.enableAgenda ?? true,
        enableResource: config.enableResource ?? true,
        enableBudget: config.enableBudget ?? true,
        enableDivision: config.enableDivision ?? true,
        approver: config.approver ?? '',
      });
      console.log('已恢复项目配置:', projectConfig);
      console.log('🔍 恢复的配置详情:');
      console.log('  🔍 enableFullPlan:', projectConfig.enableFullPlan);
      console.log('  🔍 enableAgenda:', projectConfig.enableAgenda);
      console.log('  🔍 enableResource:', projectConfig.enableResource);
      console.log('  🔍 enableBudget:', projectConfig.enableBudget);
      console.log('  🔍 enableDivision:', projectConfig.enableDivision);
      console.log('  🔍 approver:', projectConfig.approver);
      
      // 恢复项目类型
      if (config.type) {
        currentProjectType.value = config.type;
        console.log('🔄 恢复项目类型:', config.type);
      }
      
      // 恢复议程数据 - 修复：从config.agenda中读取
      console.log('🔍 config.agenda存在吗?', !!config.agenda);
      console.log('🔍 config.agenda内容:', config.agenda);
      console.log('🔍 🔍 议程详细结构 (从后端):', JSON.stringify(config.agenda, null, 2));
      if (config.agenda) {
        console.log('🔄 恢复议程数据:', config.agenda);
        console.log('🔄 议程天数:', config.agenda.days?.length || 0);
        // 额外验证：确保数据结构正确
        if (config.agenda.days && Array.isArray(config.agenda.days)) {
          config.agenda.days.forEach((day, index) => {
            console.log(`🔄 第${index + 1}天 - 日期: ${day.date}, 议程项: ${day.items?.length || 0}`);
          });
        }
        agendaStore.loadAgendaData(config.agenda);
        console.log('🔄 ✅ 议程数据已加载到store，当前store天数:', agendaStore.days.length);
      } else {
        console.log('❌ 没有议程数据，清空store');
        agendaStore.clearAgenda();
      }
      
      // 🔧 新增：恢复分工数据
      console.log('🔍 config.division存在吗?', !!config.division);
      console.log('🔍 config.division内容:', config.division);
      if (config.division) {
        console.log('🔄 恢复分工数据:', config.division);
        const divisionStore = useDivisionStore();
        if (config.division.roles && Array.isArray(config.division.roles)) {
          divisionStore.roles = config.division.roles;
          console.log('🔄 恢复角色数据:', config.division.roles.length, '个');
        }
        if (config.division.tasks && Array.isArray(config.division.tasks)) {
          // 🔧 修复：转换旧格式的任务数据
          const convertedTasks = config.division.tasks.map((task: any) => {
            // 检查并转换checklist格式
            let checklist = [];
            if (task.checklist) {
              if (Array.isArray(task.checklist)) {
                // 新格式：已经是对象数组
                if (task.checklist.length > 0 && typeof task.checklist[0] === 'object' && 'text' in task.checklist[0]) {
                  checklist = task.checklist;
                } else {
                  // 旧格式：字符串数组，需要转换
                  checklist = task.checklist.map((item: any) => ({
                    text: typeof item === 'string' ? item : String(item),
                    completed: false
                  }));
                }
              } else if (task.checklist.items && Array.isArray(task.checklist.items)) {
                // 更旧格式：{total, completed, items}
                checklist = task.checklist.items.map((item: any) => ({
                  text: typeof item === 'string' ? item : String(item),
                  completed: false
                }));
              }
            }
            
            return {
              ...task,
              checklist,
              // 确保其他字段格式正确
              name: task.name || task.title || '未命名任务',
              assignedUserId: task.assignedUserId || task.roleId || undefined,
            };
          });
          
          divisionStore.tasks = convertedTasks;
          console.log('🔄 恢复任务数据:', convertedTasks.length, '个');
        }
      } else {
        console.log('❌ 没有分工数据，清空store');
        const divisionStore = useDivisionStore();
        divisionStore.roles = [];
        divisionStore.tasks = [];
      }
    } else {
      // 没有config数据，清空议程store
      console.log('❌ 没有config数据，清空议程store');
      agendaStore.clearAgenda();
    }
  } catch (error) {
    console.error('❌ 获取项目数据失败:', error);
    console.error('❌ 错误详情:', error.response?.data);
    console.error('❌ 错误状态码:', error.response?.status);
    console.error('❌ 项目ID:', projectNo.value);
    ElMessage.error(`获取项目数据失败: ${error.response?.data?.message || error.message || '未知错误'}`);
    
    // 如果是404错误，可能是项目不存在
    if (error.response?.status === 404) {
      console.error('❌ 项目不存在，重定向到项目列表');
      ElMessage.error('项目不存在');
      // router.push('/projects'); // 可以选择重定向到项目列表
    }
  } finally {
    loading.value = false;
  }
};

// 简易占位组件
const AdminPlaceholder = defineComponent({
  components: { ElEmpty },
  template: `<el-empty description="功能正在开发中..." />`,
});

// ============ 操作按钮逻辑 ============
const projectFinished = ref(false);

const saveProject = async () => {
  try {
    console.log('💾 开始保存项目，项目ID:', projectNo.value);
    console.log('💾 basicInfoRef存在吗?', !!basicInfoRef.value);
    console.log('💾 formData存在吗?', !!formData.value);
    
    // 从BasicInfoManagement组件获取最新的表单数据
    let projectData;
    if (basicInfoRef.value) {
      console.log('💾 使用basicInfoRef获取表单数据');
      // 先验证表单
      console.log('💾 开始表单验证...');
      const isValid = await basicInfoRef.value.validate();
      console.log('💾 表单验证结果:', isValid);
      if (!isValid) {
        console.log('❌ 表单验证失败，提前返回');
        ElMessage.warning('请检查表单填写是否完整');
        return;
      }
      
      // 获取表单数据
      console.log('💾 获取表单数据...');
      projectData = basicInfoRef.value.getFormData();
      console.log('💾 获取到的表单数据:', projectData);
      console.log('💾 🔍 项目类型检查 - config.type:', projectData?.config?.type);
      console.log('💾 🔍 完整config对象:', projectData?.config);
    } else if (formData.value) {
      console.log('💾 使用缓存的表单数据');
      // 使用缓存的表单数据
      projectData = formData.value;
    } else if (!isNewProject.value && projectData.value) {
      console.log('💾 从当前项目数据构造表单数据');
      // 对于现有项目，从项目数据构造表单数据
      const currentProject = projectData.value;
      const formDataFromProject = {
        name: currentProject.name,
        description: currentProject.description,
        type: currentProject.type,
        estimatedDuration: currentProject.estimatedDuration,
        startDate: currentProject.startDate,
        endDate: currentProject.endDate,
        config: {
          // 使用当前的项目配置
          ...projectConfig,
          // 如果有现有config，也合并进来
          ...(currentProject.config || {}),
        }
      };
      projectData = formDataFromProject;
      console.log('💾 构造的表单数据:', projectData);
    } else {
      console.log('❌ 没有表单数据，提前返回');
      ElMessage.warning('请先填写项目基本信息');
      return;
    }
    
    console.log('💾 表单数据获取成功，继续后续流程...');
    
    // 包含议程数据 - 修复：将议程数据放到config中
    const agendaData = agendaStore.getAgendaData();
    console.log('📝 保存时的议程数据:', agendaData);
    console.log('📝 议程数据是否为空:', !agendaData || !agendaData.days || agendaData.days.length === 0);
    console.log('📝 议程天数:', agendaData?.days?.length || 0);
    console.log('📝 🔍 议程详细结构:', JSON.stringify(agendaData, null, 2));
    
    // 🔧 暂时注释：分组数据获取（现在在StudentManagement中）
    let groupData = null;
    // TODO: 需要从StudentManagement组件中获取分组数据
    console.log('📝 分组数据获取暂时禁用（集成到StudentManagement中）');
    
    // 🔧 新增：获取分工数据
    let divisionData = null;
    try {
      const divisionStore = useDivisionStore();
      divisionData = {
        roles: divisionStore.roles,
        tasks: divisionStore.tasks,
      };
      console.log('📝 保存时的分工数据:', divisionData);
    } catch (error) {
      console.warn('获取分工数据失败，使用空数据:', error);
      divisionData = null;
    }
    
    const fullProjectData = {
      ...projectData,
      config: {
        ...projectData.config, // 关键修复：合并来自表单的config
        ...projectConfig, // 项目配置
        agenda: agendaData, // 议程数据存储在config.agenda中
        groups: groupData, // 🔧 新增：分组数据存储在config.groups中
        division: divisionData, // 🔧 新增：分工数据存储在config.division中
      },
    };
    
    console.log('📝 完整项目数据:', fullProjectData);
    console.log('📝 config结构:', fullProjectData.config);
    console.log('📝 🔍 保存的配置详情:');
    console.log('  📝 enableFullPlan:', fullProjectData.config.enableFullPlan);
    console.log('  📝 enableAgenda:', fullProjectData.config.enableAgenda);
    console.log('  📝 enableResource:', fullProjectData.config.enableResource);
    console.log('  📝 enableBudget:', fullProjectData.config.enableBudget);
    console.log('  📝 enableDivision:', fullProjectData.config.enableDivision);
    console.log('  📝 approver:', fullProjectData.config.approver);
    console.log('📝 config.agenda:', fullProjectData.config.agenda);
    
    if (isNewProject.value) {
      // 创建新项目
      console.log('创建新项目...');
      const result = await createProject(fullProjectData);
      ElMessage.success('项目创建成功！');
      
      // 跳转到新创建的项目详情页
      router.push({ name: 'ProjectDetail', params: { id: result.id } });
    } else {
      // 更新现有项目
      console.log('更新现有项目...');
      const result = await updateProject(projectNo.value, fullProjectData);
      ElMessage.success('项目更新成功！');
      
      // 重新获取项目数据
      await fetchProjectData();
    }
  } catch (error: any) {
    console.error('Save project error:', error);
    ElMessage.error(`保存项目失败: ${error.response?.data?.message || error.message || '未知错误'}`);
  }
};

// 项目状态相关方法
const getProjectStatusType = (status?: string) => {
  switch (status) {
    case 'DRAFT':
      return 'warning';
    case 'ACTIVE':
      return 'success';
    case 'COMPLETED':
      return 'info';
    default:
      return 'info';
  }
};

const getProjectStatusText = (status?: string) => {
  switch (status) {
    case 'DRAFT':
      return '草稿';
    case 'ACTIVE':
      return '执行中';
    case 'COMPLETED':
      return '已完成';
    default:
      return '新建';
  }
};

const formatDate = (dateString?: string) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString('zh-CN');
};

// 项目操作方法
const handleProjectAction = (command: string) => {
  switch (command) {
    case 'revoke':
      withdrawProject();
      break;
    case 'complete':
      completeProject();
      break;
    case 'saveTemplate':
      saveAsTemplate();
      break;
  }
};

// 包装原有的saveProject方法，添加loading状态
const handleSaveProject = async () => {
  saving.value = true;
  try {
    await saveProject();
  } catch (error) {
    // saveProject内部已经处理了错误
  } finally {
    saving.value = false;
  }
};

// 完成项目
const completeProject = async () => {
  ElMessageBox.confirm(
    '完成项目后将无法继续编辑，是否确认完成？',
    '完成项目',
    {
      confirmButtonText: '确认完成',
      cancelButtonText: '取消',
      type: 'warning',
    }
  ).then(async () => {
    try {
      // 这里添加完成项目的API调用
      ElMessage.success('项目已完成');
    } catch (error) {
      console.error('完成项目失败:', error);
      ElMessage.error('完成项目失败');
    }
  }).catch(() => {
    // 用户取消
  });
};



// 发布项目
const publishProject = async () => {
  // 发布前确认
  ElMessageBox.confirm(
    '发布后项目将进入执行状态，主要结构将无法修改。是否确认发布？',
    '发布项目',
    {
      confirmButtonText: '确认发布',
      cancelButtonText: '取消',
      type: 'warning',
    }
  ).then(async () => {
    try {
      publishing.value = true;
    console.log('🚀 开始发布项目，项目ID:', projectNo.value);
    
    // 调用发布项目API
    const result = await publishProjectApi(projectNo.value);
    
    console.log('🚀 项目发布成功:', result);
    ElMessage({
      type: 'success',
      message: '项目发布成功！项目现已进入培训阶段。',
      duration: 3000
    });
    
    // 重新获取项目数据以更新状态
    await fetchProjectData();
    
  } catch (error: any) {
    console.error('发布项目失败:', error);
    
    let errorMessage = '发布项目失败';
    let showGuide = false;
    
    // 解析错误信息
    if (error.response?.data?.message) {
      errorMessage = error.response.data.message;
      
      // 检查是否是参与者相关的错误
      if (errorMessage.includes('教师或辅导员') || errorMessage.includes('参与者')) {
        showGuide = true;
      }
    } else if (error.message) {
      errorMessage = error.message;
    }
    
    console.log('🚀 错误详情:', {
      status: error.response?.status,
      message: errorMessage,
      showGuide
    });
    
    // 显示错误信息
    ElMessage({
      type: 'error',
      message: errorMessage,
      duration: 5000,
      showClose: true
    });
    
    // 如果是参与者相关错误，提供额外的引导
    if (showGuide) {
      setTimeout(() => {
        ElMessage({
          type: 'info',
          message: '提示：请点击"学员"标签页，在"对象"部分添加教师或辅导员角色的参与者。',
          duration: 8000,
          showClose: true
        });
      }, 1000);
    }
    
    } finally {
      publishing.value = false;
    }
  }).catch(() => {
    // 用户取消发布
  });
};

function finishProject() {
  ElMessageBox.confirm('确认结束该项目？', '提示', { type: 'warning' })
    .then(() => {
      projectFinished.value = true;
      // TODO: 调用接口更新项目状态
      ElMessage.success('项目已结束（Mock）');
    })
    .catch(() => {});
}

function saveAsTemplate() {
  ElMessageBox.confirm(
    '是否将当前项目保存为模板？',
    '保存模板',
    {
      confirmButtonText: '确认保存',
      cancelButtonText: '取消',
      type: 'info',
    }
  ).then(async () => {
    try {
      // TODO: 调用接口保存为模板
      ElMessage.success('项目模板保存成功');
    } catch (error) {
      console.error('保存模板失败:', error);
      ElMessage.error('保存模板失败');
    }
  }).catch(() => {
    // 用户取消保存
  });
}

// 管理功能导航方法已移除，现在通过任务列表中的管理按钮访问

// --- 界面切换方法 ---
const handleSwitchToManagement = (data: { type: string; task: any; title: string }) => {
  managementType.value = data.type;
  managementTitle.value = data.title;
  currentTask.value = data.task;
  currentView.value = 'management';
};

const backToTasks = () => {
  currentView.value = 'tasks';
  managementType.value = '';
  managementTitle.value = '';
  currentTask.value = null;
};

// 调试Tab点击
const handleTabClick = (tab: any) => {
  console.log('🔄 Tab点击事件:', tab.props.name, tab.props.label);
  console.log('✅ activeTaskTab当前值:', activeTaskTab.value);
};

// --- 编辑模式切换方法 ---
// 编辑模式控制方法
const toggleEditMode = (section: string) => {
  if (editStates[section]) {
    // 保存操作
    saveSection(section);
  } else {
    // 进入编辑模式
    editStates[section] = true;
    ElMessage.success(`进入${getSectionName(section)}编辑模式`);
  }
};

// 保存section
const saveSection = async (section: string) => {
  try {
    console.log(`保存${section}数据`);
    
    if (section === 'basicInfo') {
      // 基本信息保存：调用完整的项目保存逻辑
      await saveProject();
    } else if (section === 'summary') {
      // 总结保存：调用ProjectSummary组件的保存方法
      if (projectSummaryRef.value) {
        const success = await projectSummaryRef.value.saveSummary();
        if (!success) {
          throw new Error('总结保存失败');
        }
      } else {
        throw new Error('总结组件引用不存在');
      }
    } else {
      // 其他section的保存逻辑可以在这里添加
      console.log(`TODO: 实现${section}的保存逻辑`);
    }
    
    editStates[section] = false;
    ElMessage.success(`${getSectionName(section)}已保存`);
  } catch (error) {
    console.error(`保存${section}失败:`, error);
    ElMessage.error(`保存${getSectionName(section)}失败`);
    // 保存失败时不退出编辑模式
  }
};

// 获取section中文名称
const getSectionName = (section: string) => {
  const names = {
    basicInfo: '基本信息',
    students: '学员管理',
    proposal: '培训方案',
    tasks: '任务管理',
    summary: '项目总结',
    news: '项目新闻'
  };
  return names[section] || section;
};

// 获取当前tab的编辑状态
const getCurrentEditState = (tab: string) => {
  switch (tab) {
    case 'basic-info':
      return editStates.basicInfo;
    case 'summary':
      return editStates.summary;
    default:
      return false;
  }
};

// 切换当前tab的编辑模式
const toggleCurrentTabEditMode = (tab: string) => {
  switch (tab) {
    case 'basic-info':
      toggleEditMode('basicInfo');
      break;
    case 'summary':
      toggleEditMode('summary');
      break;
  }
};

// 判断当前tab是否可以编辑
const canEditCurrentTab = (menu: string, tab: string) => {
  // 成绩管理tab不提供编辑
  if (menu === 'tasks' && tab === 'grades') {
    return false;
  }
  // 会议管理tab不提供编辑按钮（因为有自己的操作按钮）
  if (menu === 'tasks' && tab === 'meetings') {
    return false;
  }
  
  // 基本信息：只有新建项目时不显示编辑按钮（因为已经默认编辑模式）
  // 功能配置tab不显示编辑按钮（因为是即时保存）
  // 总结tab显示编辑按钮（如果有编辑权限）
  if (menu === 'basic-info') {
    if (tab === 'basic-info') {
      return !isNewProject.value;
    } else if (tab === 'summary') {
      return canEditSection('summary');
    }
    return false;
  }
  
  // 其他tabs：草稿状态不显示编辑按钮（本身就可以编辑）
  if (isNewProject.value || projectData.value?.status === 'DRAFT') {
    return false;
  }
  
  // 只在发布状态（执行中）显示编辑按钮
  return canEditSection(menu);
};

// 判断section是否可以编辑
const canEditSection = (section: string) => {
  // 草稿状态可以编辑所有
  if (isNewProject.value || projectData.value?.status === 'DRAFT') {
    return true;
  }
  // 执行状态可以编辑基本信息、任务相关内容、项目总结和新闻
  if (projectData.value?.status === 'ACTIVE') {
    return section === 'tasks' || section === 'basic-info' || section === 'summary' || section === 'news';
  }
  // 已完成状态可以编辑项目总结和新闻
  if (projectData.value?.status === 'COMPLETED') {
    return section === 'summary' || section === 'news';
  }
  return false;
};

const toggleCooperationEditMode = () => {
  cooperationEditMode.value = !cooperationEditMode.value;
  ElMessage.success(cooperationEditMode.value ? '进入协同编辑模式' : '退出协同编辑模式');
};

// --- 协同任务管理方法 ---
const addCooperationTask = () => {
  taskSelectorVisible.value = true;
};

const handleTaskSelection = (selectedTasks: any[], config: any) => {
  // 创建协同任务
  const newCooperationTask = {
    id: Date.now().toString(),
    category: selectedTasks.length === 1 ? selectedTasks[0].name : `${selectedTasks.length}个任务协同`,
    count: selectedTasks.length,
    type: 'cooperation',
    config: config,
    originalTasks: selectedTasks,
    groupProgress: [
      { groupId: '1', groupName: '第1组', progress: 0, status: '未开始' },
      { groupId: '2', groupName: '第2组', progress: 0, status: '未开始' },
      { groupId: '3', groupName: '第3组', progress: 0, status: '未开始' }
    ]
  };
  
  cooperationTasks.value.push(newCooperationTask);
  ElMessage.success(`成功添加协同任务：${newCooperationTask.category}`);
};

const editCooperationTask = (task: any, index: number) => {
  ElMessage.info(`编辑协同任务：${task.category}`);
  // 这里可以打开编辑对话框
};

const deleteCooperationTask = (index: number) => {
  cooperationTasks.value.splice(index, 1);
  ElMessage.success('协同任务删除成功');
};

const getOverallProgress = (task: any) => {
  if (!task.groupProgress || task.groupProgress.length === 0) return 0;
  const totalProgress = task.groupProgress.reduce((sum: number, group: any) => sum + group.progress, 0);
  return Math.round(totalProgress / task.groupProgress.length);
};

const viewProgress = (task: any) => {
  // 创建进度详情的展示内容
  const progressDetails = task.groupProgress.map((group: any) => 
    `${group.groupName}: ${group.progress}% (${group.status})`
  ).join('\n');
  
  ElMessageBox.alert(
    progressDetails,
    `${task.category} - 各组进度详情`,
    {
      confirmButtonText: '确定',
      customClass: 'progress-detail-dialog'
    }
  );
};

const updateTaskProgress = (taskId: string, groupId: string, progress: number, status: string) => {
  const task = cooperationTasks.value.find(t => t.id === taskId);
  if (task && task.groupProgress) {
    const group = task.groupProgress.find(g => g.groupId === groupId);
    if (group) {
      group.progress = progress;
      group.status = status;
      ElMessage.success(`${group.groupName}进度更新成功`);
    }
  }
};

// 管理组件映射已移除，现在使用占位符界面

// --- 新增：更多操作处理方法 ---
const handleMoreAction = async (command: string) => {
  switch (command) {
    case 'withdraw':
      await withdrawProject();
      break;
    case 'finish':
      finishProject();
      break;
    case 'saveTemplate':
      saveAsTemplate();
      break;
  }
}

// --- 新增：撤回项目方法 ---
const withdrawProject = async () => {
  try {
    await ElMessageBox.confirm(
      '撤回项目将使项目重新变为草稿状态，已进行的培训执行数据可能受到影响。确认撤回？',
      '撤回项目',
      {
        confirmButtonText: '确认撤回',
        cancelButtonText: '取消',
        type: 'warning'
      }
    );

    // 临时解决方案：使用更新项目API来撤回项目
    // TODO: 后端实现 /api/projects/{id}/withdraw 接口后，改回使用 withdrawProjectApi
    const withdrawnProject = await updateProject(projectNo.value, { status: 'DRAFT' });
    
    // 更新项目状态为DRAFT
    if (projectData.value) {
      projectData.value.status = withdrawnProject.status;
    }
    
    ElMessage.success('项目已撤回，现在可以重新编辑');
    
    // 重新获取项目数据
    await fetchProjectData();
    
  } catch (error: any) {
    if (error !== 'cancel') {
      console.error('撤回项目失败:', error);
      ElMessage.error(`撤回项目失败: ${error.message || '未知错误'}`);
    }
  }
}

// --- 左侧菜单收缩/展开状态 ---
const leftMenuCollapsed = ref(false);

const toggleLeftMenu = () => {
  leftMenuCollapsed.value = !leftMenuCollapsed.value;
};

// --- 右侧项目信息面板收缩/展开状态 ---
const rightPanelCollapsed = ref(false);

const toggleRightPanel = () => {
  rightPanelCollapsed.value = !rightPanelCollapsed.value;
};

// --- 处理总结保存成功 ---
const handleSummarySaved = (summaryData: any) => {
  console.log('✅ 总结保存成功事件:', summaryData);
  // 可以在这里执行其他后续操作，比如刷新项目数据
};

// --- 生命周期 ---
onMounted(async () => {
  console.log('🚀 ProjectDetail页面挂载，项目ID:', projectNo.value);
  
  // 加载基础数据
  fetchProjectData();
  loadAvailableUsers();
  
  if (!isNewProject.value) {
    // 如果默认激活的是任务菜单，立即加载任务数据
    if (activeMenu.value === 'tasks') {
      console.log('📝 默认激活任务菜单，加载项目任务数据');
      await trainingStageStore.loadProjectTasks(projectNo.value);
    }
  }
});
</script>

<style scoped>
.project-detail-page {
  padding: 8px 16px 16px 16px; /* 减少顶部padding */
}

/* 三列布局容器 */
.project-detail-container {
  display: flex;
  min-height: calc(100vh - 200px); /* 减少高度计算，适应紧凑布局 */
  gap: 16px;
  margin-top: 8px; /* 减少与milestone的间距 */
}

/* 左侧菜单 */
.left-menu {
  width: 260px;
  flex-shrink: 0;
  border-right: 1px solid #dcdfe6;
  position: relative;
  transition: width 0.3s ease-in-out;
}

.left-menu.collapsed {
  width: 60px;
}

/* 中间内容区 */
.main-content {
  flex: 1;
  overflow-y: auto;
  min-width: 0;
  transition: margin-left 0.3s ease-in-out, margin-right 0.3s ease-in-out;
}

/* 右侧项目信息面板 */
.project-info-panel {
  width: 300px;
  flex-shrink: 0;
  position: relative;
  transition: width 0.3s ease-in-out;
}

.project-info-panel.collapsed {
  width: 40px;
}

.project-info-card {
  position: sticky;
  top: 16px;
}

/* 顶部操作按钮栏 */
.project-actions-bar {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 4px;
  padding: 12px 0 16px 0;
  border-bottom: 1px solid #ebeef5;
  margin-bottom: 16px;
}

/* 操作按钮样式 */
.action-button {
  font-size: 13px;
  padding: 4px 8px;
  color: #606266;
  border: none;
  background: none;
  transition: color 0.2s;
}

.action-button:hover {
  color: #409eff;
  background: none;
}

.action-button.primary-action {
  color: #409eff;
  font-weight: 500;
}

.action-button.primary-action:hover {
  color: #337ecc;
}

/* 分割线样式 */
.project-actions-bar .el-divider--vertical {
  margin: 0 8px;
  height: 16px;
}

/* 项目信息头部 */
.project-info-header {
  margin-bottom: 16px;
}

.project-title {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.project-title h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #333;
  line-height: 1.4;
  word-break: break-word;
}

.status-tag {
  align-self: flex-start;
}

.project-details {
  margin-bottom: 0;
}

.detail-item {
  display: flex;
  margin-bottom: 8px;
  font-size: 13px;
}

.detail-item .label {
  color: #606266;
  min-width: 70px;
  flex-shrink: 0;
}

.detail-item .value {
  color: #333;
  word-break: break-word;
}

/* Tab容器和编辑按钮布局 */
.tabs-container {
  position: relative;
}

.tab-edit-button {
  position: absolute;
  top: 12px;
  right: 0;
  z-index: 10;
}

/* 确保tabs有足够右边距 */
.task-tabs :deep(.el-tabs__header) {
  margin-right: 80px;
}

.info-tabs :deep(.el-tabs__header) {
  margin-right: 80px;
}

/* Section编辑按钮布局 */
.section-with-edit {
  display: flex;
  justify-content: flex-end;
  margin-bottom: 16px;
  padding-top: 8px;
}

/* 编辑按钮样式 */
.edit-section {
  margin-bottom: 16px;
  padding: 12px 16px;
  background: #f5f7fa;
  border-radius: 4px;
  border: 1px solid #e4e7ed;
}

.edit-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.edit-title {
  font-size: 14px;
  font-weight: 600;
  color: #303133;
}

.edit-actions {
  display: flex;
  gap: 8px;
}

.info-panel {
  width: 320px;
  flex-shrink: 0;
}
.placeholder-card {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  height: 100%;
}
/* 管理界面样式 */
.management-header {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px 0;
  border-bottom: 1px solid #e8e8e8;
  margin-bottom: 20px;
}

.management-header h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #333;
}

.management-content {
  flex: 1;
  overflow: auto;
}

.management-placeholder .task-info {
  margin: 20px 0;
  padding: 16px;
  background: #f8f9fa;
  border-radius: 6px;
}

.management-placeholder .task-info h5 {
  margin: 0 0 12px 0;
  color: #333;
}

.management-placeholder .task-info p {
  margin: 8px 0;
  color: #666;
}

/* 任务Tab样式 */
.task-tabs {
  height: 100%;
}

.task-tabs .el-tabs__content {
  height: calc(100% - 40px);
  padding: 0;
}

.task-tabs .el-tab-pane {
  height: 100%;
  overflow: auto;
}

/* 基本信息内部Tab样式 */
.info-tabs {
  background: #fff;
}

/* 统一菜单样式 */
.unified-menu {
  height: 100%;
  border-right: none;
}

.unified-menu .el-menu-item {
  height: 50px;
  display: flex;
  align-items: center;
  padding: 0 20px;
  font-size: 14px;
  color: #333;
  border-bottom: 1px solid #eee;
}

.unified-menu .el-menu-item.is-active {
  background-color: #409eff;
  color: #fff;
}

.unified-menu .el-menu-item:hover {
  background-color: #ecf5ff;
  color: #409eff;
}

.unified-menu .el-menu-item .el-icon {
  margin-right: 8px;
  font-size: 18px;
}

.content-section {
  padding: 16px;
  background-color: #fff;
  border-radius: 4px;
  box-shadow: 0 2px 8px 0 rgba(0, 0, 0, 0.06);
  margin-bottom: 16px;
}

.edit-forms {
  display: flex;
  gap: 16px;
}

.edit-forms .el-form {
  flex: 1;
}

.task-management-container {
  display: flex;
  gap: 20px;
}

.task-left-panel {
  flex: 0 0 300px;
  border-right: 1px solid #eee;
  padding-right: 10px;
}

.task-main-content {
  flex: 1;
  overflow-y: auto;
}

.task-main-content.full-width {
  flex: 1;
}

/* 左侧菜单收缩按钮样式 */
.collapse-button {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  background-color: #f5f7fa;
  border: 1px solid #dcdfe6;
  border-radius: 50%;
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  z-index: 10;
  box-shadow: 0 2px 8px 0 rgba(0, 0, 0, 0.06);
  transition: all 0.3s ease-in-out;
}

.collapse-button:hover {
  background-color: #ecf5ff;
  border-color: #409eff;
}

.collapse-button .el-icon {
  font-size: 16px;
  color: #606266;
}

.collapse-button:hover .el-icon {
  color: #409eff;
}

.left-collapse-button {
  right: -15px;
}

.left-menu.collapsed .left-collapse-button {
  right: -15px;
}

/* 右侧项目信息面板收缩按钮样式 */
.right-collapse-button {
  left: -15px;
}

.project-info-panel.collapsed .right-collapse-button {
  left: -15px;
}

/* 统一菜单在收缩状态下的样式 */
.left-menu.collapsed .unified-menu .el-menu-item {
  padding: 0 15px;
  justify-content: center;
}

.left-menu.collapsed .unified-menu .el-menu-item .el-icon {
  margin-right: 0;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .project-detail-container {
    flex-direction: column;
    gap: 16px;
  }
  
  .left-menu {
    width: 100%;
    border-right: none;
    border-bottom: 1px solid #dcdfe6;
  }
  
  .main-content {
    order: 2;
  }
  
  .project-info-panel {
    width: 100%;
    order: 1;
  }
  
  .project-info-card {
    position: static;
  }
  
  .tab-edit-button {
    position: static;
    margin-top: 10px;
  }
}
</style> 