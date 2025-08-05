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
const userRole = computed(() => userStore.userRole);
const userId = computed(() => userStore.userId);

// 当前活动标签页
const activeTab = ref('dashboard');

// 对话框状态
const createProjectVisible = ref(false);

// 权限控制
const canViewDashboard = computed(() => {
  return ['student', 'mentor', 'manager', 'hr'].includes(userRole.value);
});

const canViewMentors = computed(() => {
  return ['manager', 'hr'].includes(userRole.value);
});

const canViewTemplates = computed(() => {
  return ['mentor', 'manager', 'hr'].includes(userRole.value);
});

const canViewAnalytics = computed(() => {
  return ['manager', 'hr'].includes(userRole.value);
});

const canCreateProject = computed(() => {
  return ['manager', 'hr'].includes(userRole.value);
});

// 标签页切换
const handleTabClick = (tab: any) => {
  console.log('切换到标签页:', tab.name);
};

// 创建项目
const handleCreateProject = () => {
  createProjectVisible.value = true;
};

// 关闭创建项目对话框
const handleCloseCreateProject = () => {
  createProjectVisible.value = false;
};

// 创建项目成功
const handleCreateProjectSuccess = () => {
  ElMessage.success('带教项目创建成功');
  createProjectVisible.value = false;
  // 刷新项目列表
  activeTab.value = 'projects';
};

// 查看项目详情
const handleViewProjectDetails = (projectId: string) => {
  console.log('查看项目详情:', projectId);
  // 导航到项目详情页面
};

// 查看导师档案
const handleViewMentorProfile = (mentorId: string) => {
  console.log('查看导师档案:', mentorId);
  // 导航到导师档案页面
};

// 编辑模板
const handleEditTemplate = (templateId: string) => {
  console.log('编辑模板:', templateId);
  // 导航到模板编辑页面
};

// 页面初始化
onMounted(() => {
  // 根据用户角色设置默认标签页
  if (userRole.value === 'student') {
    activeTab.value = 'projects';
  } else if (userRole.value === 'mentor') {
    activeTab.value = 'dashboard';
  } else if (['manager', 'hr'].includes(userRole.value)) {
    activeTab.value = 'dashboard';
  }
});
</script>

<style scoped>
.mentorship-management {
  min-height: 100vh;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
}

.page-header {
  background: white;
  padding: 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  border-bottom: 1px solid #e8e8e8;
}

.header-content {
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-left {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.page-title {
  font-size: 28px;
  font-weight: 600;
  color: #1f2937;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 12px;
}

.title-icon {
  font-size: 32px;
  color: #3b82f6;
}

.page-subtitle {
  font-size: 16px;
  color: #6b7280;
  margin: 0;
}

.header-right {
  display: flex;
  gap: 16px;
}

.tab-navigation {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 24px;
  background: white;
  border-bottom: 1px solid #e8e8e8;
}

.main-tabs {
  :deep(.el-tabs__nav-wrap) {
    margin-bottom: 0;
  }
  
  :deep(.el-tabs__header) {
    margin: 0;
    border-bottom: none;
  }
  
  :deep(.el-tabs__item) {
    font-size: 16px;
    font-weight: 500;
    padding: 0 24px;
    height: 60px;
    line-height: 60px;
    color: #6b7280;
    border-bottom: 3px solid transparent;
    transition: all 0.3s ease;
    
    &:hover {
      color: #3b82f6;
      background: #f8fafc;
    }
    
    &.is-active {
      color: #3b82f6;
      border-bottom-color: #3b82f6;
      background: white;
    }
  }
}

.tab-label {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
}

.content-area {
  max-width: 1200px;
  margin: 0 auto;
  padding: 24px;
}

.tab-content {
  background: white;
  border-radius: 12px;
  min-height: 600px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
  overflow: hidden;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .header-content {
    flex-direction: column;
    gap: 16px;
    text-align: center;
  }
  
  .page-title {
    font-size: 24px;
  }
  
  .tab-navigation {
    padding: 0 16px;
  }
  
  .main-tabs :deep(.el-tabs__item) {
    padding: 0 16px;
    font-size: 14px;
  }
  
  .tab-label span {
    display: none;
  }
  
  .content-area {
    padding: 16px;
  }
}

/* 深色主题适配 */
@media (prefers-color-scheme: dark) {
  .mentorship-management {
    background: linear-gradient(135deg, #1f2937 0%, #111827 100%);
  }
  
  .page-header {
    background: #374151;
    border-bottom-color: #4b5563;
  }
  
  .page-title {
    color: #f9fafb;
  }
  
  .page-subtitle {
    color: #d1d5db;
  }
  
  .tab-navigation {
    background: #374151;
    border-bottom-color: #4b5563;
  }
  
  .main-tabs :deep(.el-tabs__item) {
    color: #d1d5db;
    
    &:hover {
      color: #60a5fa;
      background: #4b5563;
    }
    
    &.is-active {
      color: #60a5fa;
      background: #374151;
    }
  }
  
  .tab-content {
    background: #374151;
  }
}
</style> 