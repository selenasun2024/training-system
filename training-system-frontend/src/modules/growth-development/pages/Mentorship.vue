<template>
  <div class="mentorship-management">
    <!-- 页面头部 -->
    <div class="page-header">
      <div class="header-content">
        <div class="header-left">
          <h1 class="page-title">
            <el-icon class="title-icon"><UserFilled /></el-icon>
            带教管理
          </h1>
          <p class="page-subtitle">结构化的师徒赋能网络，让传承更有温度</p>
        </div>
        <div class="header-right">
          <el-button 
            type="primary" 
            :icon="Plus" 
            @click="handleCreateProject"
            v-if="canCreateProject"
          >
            创建带教项目
          </el-button>
        </div>
      </div>
    </div>

    <!-- 标签页导航 -->
    <div class="tab-navigation">
      <el-tabs 
        v-model="activeTab" 
        @tab-click="handleTabClick"
        class="main-tabs"
      >
        <el-tab-pane 
          label="概览仪表盘" 
          name="dashboard"
          v-if="canViewDashboard"
        >
          <template #label>
            <div class="tab-label">
              <el-icon><Odometer /></el-icon>
              <span>概览仪表盘</span>
            </div>
          </template>
        </el-tab-pane>

        <el-tab-pane 
          label="我的项目" 
          name="projects"
        >
          <template #label>
            <div class="tab-label">
              <el-icon><Management /></el-icon>
              <span>我的项目</span>
            </div>
          </template>
        </el-tab-pane>

        <el-tab-pane 
          label="师资池" 
          name="mentors"
          v-if="canViewMentors"
        >
          <template #label>
            <div class="tab-label">
              <el-icon><User /></el-icon>
              <span>师资池</span>
            </div>
          </template>
        </el-tab-pane>

        <el-tab-pane 
          label="模板库" 
          name="templates"
          v-if="canViewTemplates"
        >
          <template #label>
            <div class="tab-label">
              <el-icon><Collection /></el-icon>
              <span>模板库</span>
            </div>
          </template>
        </el-tab-pane>

        <el-tab-pane 
          label="数据统计" 
          name="analytics"
          v-if="canViewAnalytics"
        >
          <template #label>
            <div class="tab-label">
              <el-icon><DataAnalysis /></el-icon>
              <span>数据统计</span>
            </div>
          </template>
        </el-tab-pane>
      </el-tabs>
    </div>

    <!-- 内容区域 -->
    <div class="content-area">
      <!-- 概览仪表盘 -->
      <div v-if="activeTab === 'dashboard'" class="tab-content">
        <MentorshipDashboard 
          :user-role="userRole"
          :user-id="userId"
          @create-project="handleCreateProject"
        />
      </div>

      <!-- 我的项目 -->
      <div v-if="activeTab === 'projects'" class="tab-content">
        <ProjectManagement 
          :user-role="userRole"
          :user-id="userId"
          @view-details="handleViewProjectDetails"
        />
      </div>

      <!-- 师资池 -->
      <div v-if="activeTab === 'mentors'" class="tab-content">
        <MentorPool 
          :user-role="userRole"
          :user-id="userId"
          @view-profile="handleViewMentorProfile"
        />
      </div>

      <!-- 模板库 -->
      <div v-if="activeTab === 'templates'" class="tab-content">
        <TemplateLibrary 
          :user-role="userRole"
          :user-id="userId"
          @edit-template="handleEditTemplate"
        />
      </div>

      <!-- 数据统计 -->
      <div v-if="activeTab === 'analytics'" class="tab-content">
        <Analytics 
          :user-role="userRole"
          :user-id="userId"
        />
      </div>
    </div>

    <!-- 创建项目对话框 -->
    <el-dialog
      v-model="createProjectVisible"
      title="创建带教项目"
      width="600px"
      :before-close="handleCloseCreateProject"
    >
      <CreateProjectForm 
        @success="handleCreateProjectSuccess"
        @cancel="handleCloseCreateProject"
      />
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { 
  Plus, 
  Odometer, 
  Management, 
  User, 
  Collection, 
  DataAnalysis,
  UserFilled
} from '@element-plus/icons-vue';
import { ElMessage } from 'element-plus';
import { useUserStore } from '@/stores/user';
import MentorshipDashboard from '../components/mentorship/MentorshipDashboard.vue';
import ProjectManagement from '../components/mentorship/ProjectManagement.vue';
import MentorPool from '../components/mentorship/MentorPool.vue';
import TemplateLibrary from '../components/mentorship/TemplateLibrary.vue';
import Analytics from '../components/mentorship/Analytics.vue';
import CreateProjectForm from '../components/mentorship/CreateProjectForm.vue';

// 用户信息
const userStore = useUserStore();
const userRole = computed(() => userStore.userRole || 'student');
const userId = computed(() => userStore.userId || '1');

// 当前活动标签页
const activeTab = ref('dashboard');

// 对话框状态
const createProjectVisible = ref(false);

// 权限控制
const canViewDashboard = computed(() => {
  return ['student', 'mentor', 'manager', 'hr', 'academic'].includes(userRole.value);
});

const canViewMentors = computed(() => {
  return ['manager', 'hr', 'academic'].includes(userRole.value);
});

const canViewTemplates = computed(() => {
  return ['mentor', 'manager', 'hr', 'academic'].includes(userRole.value);
});

const canViewAnalytics = computed(() => {
  return ['manager', 'hr', 'academic'].includes(userRole.value);
});

const canCreateProject = computed(() => {
  return ['mentor', 'manager', 'hr', 'academic'].includes(userRole.value);
});

// 事件处理
const handleTabClick = (tab: any) => {
  console.log('切换到标签页:', tab.paneName || tab.name);
};

const handleCreateProject = () => {
  createProjectVisible.value = true;
};

const handleCloseCreateProject = () => {
  createProjectVisible.value = false;
};

const handleCreateProjectSuccess = () => {
  createProjectVisible.value = false;
  ElMessage.success('创建带教项目成功');
  // 刷新数据
  refreshData();
};

const handleViewProjectDetails = (project: any) => {
  console.log('查看项目详情:', project);
  // 这里可以跳转到项目详情页面
};

const handleViewMentorProfile = (mentor: any) => {
  console.log('查看导师档案:', mentor);
  // 这里可以跳转到导师档案页面
};

const handleEditTemplate = (template: any) => {
  console.log('编辑模板:', template);
  // 这里可以跳转到模板编辑页面
};

const refreshData = () => {
  // 刷新各组件数据
  console.log('刷新数据');
};

// 组件挂载时根据用户角色设置默认标签页
onMounted(() => {
  if (userRole.value === 'student') {
    activeTab.value = 'projects';
  } else if (userRole.value === 'mentor') {
    activeTab.value = 'dashboard';
  } else if (['manager', 'hr', 'academic'].includes(userRole.value)) {
    activeTab.value = 'dashboard';
  }
});
</script>

<style scoped>
.mentorship-management {
  height: 100%;
  display: flex;
  flex-direction: column;
}

/* 页面头部 */
.page-header {
  padding: 20px 24px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  margin-bottom: 20px;
  border-radius: 8px;
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-left {
  flex: 1;
}

.page-title {
  font-size: 24px;
  font-weight: 600;
  margin: 0 0 8px 0;
  display: flex;
  align-items: center;
}

.title-icon {
  margin-right: 12px;
  font-size: 28px;
}

.page-subtitle {
  font-size: 14px;
  opacity: 0.9;
  margin: 0;
}

.header-right {
  flex-shrink: 0;
}

/* 标签页导航 */
.tab-navigation {
  padding: 0 24px;
  margin-bottom: 20px;
}

.main-tabs {
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.tab-label {
  display: flex;
  align-items: center;
  gap: 6px;
}

.tab-label .el-icon {
  font-size: 16px;
}

/* 内容区域 */
.content-area {
  flex: 1;
  padding: 0 24px;
  overflow: hidden;
}

.tab-content {
  height: 100%;
  overflow: auto;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .header-content {
    flex-direction: column;
    gap: 16px;
    align-items: flex-start;
  }
  
  .page-title {
    font-size: 20px;
  }
  
  .tab-navigation {
    padding: 0 16px;
  }
  
  .content-area {
    padding: 0 16px;
  }
}

/* 深色模式支持 */
@media (prefers-color-scheme: dark) {
  .main-tabs {
    background: #1f2937;
    color: #f3f4f6;
  }
}
</style> 