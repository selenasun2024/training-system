<template>
  <div class="growth-profile-page">
    <div class="page-header">
      <div class="header-left">
        <h1 class="page-title">成长档案</h1>
        <div class="page-subtitle">{{ profile?.userName }}的成长轨迹</div>
      </div>
      <div class="header-right">
        <el-button 
          v-if="permissionConfig.canShare" 
          type="primary" 
          @click="handleShare"
        >
          <el-icon><Share /></el-icon>
          分享档案
        </el-button>
        <el-button 
          v-if="permissionConfig.canDownload" 
          type="default" 
          @click="handleExport"
        >
          <el-icon><Download /></el-icon>
          导出档案
        </el-button>
      </div>
    </div>

    <div class="profile-content">
      <div class="main-content">
        <!-- 主要档案信息 -->
        <GrowthProfile 
          v-if="profile" 
          :profile="profile"
          :permission-config="permissionConfig"
          @edit="handleEdit"
          @refresh="handleRefresh"
        />
        
        <!-- 标签页内容 -->
        <div class="profile-tabs">
          <el-tabs v-model="activeTab" @tab-click="handleTabClick">
            <el-tab-pane label="成长时间线" name="timeline">
              <GrowthTimeline 
                v-if="profile && permissionConfig.sections.timeline"
                :timeline="profile.combinedTimeline"
                @event-click="handleEventClick"
                @project-click="handleProjectClick"
              />
            </el-tab-pane>
            
            <el-tab-pane label="技能发展" name="skills">
              <SkillDevelopment 
                v-if="profile && permissionConfig.sections.skills"
                :skills="profile.skillDevelopment"
                @skill-click="handleSkillClick"
                @view-progress="handleViewProgress"
                @plan-learning="handlePlanLearning"
              />
            </el-tab-pane>
            
            <el-tab-pane label="项目历史" name="projects">
              <ProjectHistory 
                v-if="profile && permissionConfig.sections.timeline"
                :training-history="profile.trainingHistory"
                :mentorship-history="profile.mentorshipHistory"
                @project-click="handleProjectClick"
              />
            </el-tab-pane>
            
            <el-tab-pane label="成就荣誉" name="achievements">
              <AchievementGallery 
                v-if="profile && permissionConfig.sections.achievements"
                :achievements="profile.achievements"
                @achievement-click="handleAchievementClick"
              />
            </el-tab-pane>
            
            <el-tab-pane 
              v-if="permissionConfig.sections.feedback" 
              label="反馈收集" 
              name="feedback"
            >
              <FeedbackCollection 
                :feedback="profile?.feedbackCollection || []"
                @feedback-click="handleFeedbackClick"
              />
            </el-tab-pane>
            
            <el-tab-pane 
              v-if="permissionConfig.sections.goals" 
              label="目标规划" 
              name="goals"
            >
              <GoalPlanning 
                :goals="profile?.goals || []"
                @goal-click="handleGoalClick"
                @add-goal="handleAddGoal"
              />
            </el-tab-pane>
          </el-tabs>
        </div>
      </div>
      
      <!-- 侧边栏 -->
      <div class="sidebar">
        <div class="sidebar-widget">
          <h3>快速统计</h3>
          <div class="stats-grid">
            <div class="stat-item">
              <div class="stat-number">{{ profile?.trainingHistory.length || 0 }}</div>
              <div class="stat-label">培训项目</div>
            </div>
            <div class="stat-item">
              <div class="stat-number">{{ profile?.mentorshipHistory.length || 0 }}</div>
              <div class="stat-label">带教项目</div>
            </div>
            <div class="stat-item">
              <div class="stat-number">{{ profile?.achievements.length || 0 }}</div>
              <div class="stat-label">成就</div>
            </div>
            <div class="stat-item">
              <div class="stat-number">{{ profile?.skillDevelopment.length || 0 }}</div>
              <div class="stat-label">技能</div>
            </div>
          </div>
        </div>
        
        <div v-if="permissionConfig.canComment" class="sidebar-widget">
          <h3>添加反馈</h3>
          <el-form @submit.prevent="handleAddFeedback">
            <el-form-item>
              <el-select v-model="feedbackForm.type" placeholder="反馈类型">
                <el-option label="技能反馈" value="skill" />
                <el-option label="项目反馈" value="project" />
                <el-option label="成长建议" value="growth" />
              </el-select>
            </el-form-item>
            <el-form-item>
              <el-input 
                v-model="feedbackForm.content"
                type="textarea"
                :rows="3"
                placeholder="请输入反馈内容..."
              />
            </el-form-item>
            <el-form-item>
              <el-button type="primary" @click="handleAddFeedback">
                提交反馈
              </el-button>
            </el-form-item>
          </el-form>
        </div>
      </div>
    </div>
    
    <!-- 权限不足提示 -->
    <div v-if="!permissionConfig.canView && !loading" class="no-permission">
      <el-empty description="您没有访问此成长档案的权限" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import { Share, Download } from '@element-plus/icons-vue';

// 组件导入
import GrowthProfile from '../components/GrowthProfile.vue';
import GrowthTimeline from '../components/growth-profile/GrowthTimeline.vue';
import SkillDevelopment from '../components/growth-profile/SkillDevelopment.vue';
import ProjectHistory from '../components/growth-profile/ProjectHistory.vue';
import AchievementGallery from '../components/growth-profile/AchievementGallery.vue';
import FeedbackCollection from '../components/growth-profile/FeedbackCollection.vue';
import GoalPlanning from '../components/growth-profile/GoalPlanning.vue';

// Composables
import { useGrowthProfilePermissions } from '../composables/useGrowthProfilePermissions';
import { useCurrentUser } from '@/composables/useCurrentUser';

// 类型导入
import type { GrowthProfile as GrowthProfileType, GrowthTimelineEvent } from '@/types';

// 路由和用户
const route = useRoute();
const router = useRouter();
const { currentUser } = useCurrentUser();

// 响应式数据
const profile = ref<GrowthProfileType | null>(null);
const loading = ref(true);
const activeTab = ref('timeline');
const feedbackForm = ref({
  type: '',
  content: ''
});

// 权限管理
const { 
  permissionConfig, 
  hasPermission, 
  loadPermissions 
} = useGrowthProfilePermissions(profile, currentUser);

// 方法
const loadProfile = async () => {
  loading.value = true;
  try {
    const userId = route.params.userId as string;
    // 这里应该调用API加载档案
    // const response = await growthProfileApi.getProfile(userId);
    // profile.value = response.data;
    
    // 模拟数据
    profile.value = {
      id: userId,
      userId: userId,
      userName: '张三',
      department: '技术部',
      position: '高级工程师',
      entryDate: new Date('2020-01-01'),
      currentLevel: 'senior',
      trainingHistory: [],
      mentorshipHistory: [],
      combinedTimeline: [],
      skillDevelopment: [],
      achievements: [],
      feedbackCollection: [],
      goals: [],
      statistics: {},
      lastUpdated: new Date(),
      createdAt: new Date()
    } as GrowthProfileType;
    
  } catch (error) {
    ElMessage.error('加载成长档案失败');
  } finally {
    loading.value = false;
  }
};

const handleEdit = () => {
  if (!hasPermission('edit')) {
    ElMessage.warning('您没有编辑权限');
    return;
  }
  // 处理编辑逻辑
};

const handleRefresh = () => {
  loadProfile();
};

const handleShare = () => {
  // 打开分享对话框
  ElMessage.info('分享功能开发中...');
};

const handleExport = async () => {
  try {
    // 这里应该调用API导出档案
    // const blob = await growthProfileApi.exportProfile(profile.value!.userId, 'pdf');
    // 创建下载链接
    ElMessage.success('导出成功');
  } catch (error) {
    ElMessage.error('导出失败');
  }
};

const handleTabClick = (tab: any) => {
  activeTab.value = tab.name;
};

const handleEventClick = (event: GrowthTimelineEvent) => {
  // 处理事件点击
};

const handleProjectClick = (projectId: string, type: 'training' | 'mentorship') => {
  // 跳转到项目详情
  if (type === 'training') {
    router.push(`/training-project/${projectId}`);
  } else {
    router.push(`/mentorship-project/${projectId}`);
  }
};

const handleSkillClick = (skillId: string) => {
  // 处理技能点击
};

const handleViewProgress = (skillId: string) => {
  // 查看技能进展
};

const handlePlanLearning = (skillId: string) => {
  // 规划学习路径
};

const handleAchievementClick = (achievementId: string) => {
  // 处理成就点击
};

const handleFeedbackClick = (feedbackId: string) => {
  // 处理反馈点击
};

const handleGoalClick = (goalId: string) => {
  // 处理目标点击
};

const handleAddGoal = () => {
  // 添加目标
};

const handleAddFeedback = () => {
  if (!feedbackForm.value.type || !feedbackForm.value.content) {
    ElMessage.warning('请填写完整的反馈信息');
    return;
  }
  
  // 提交反馈
  ElMessage.success('反馈提交成功');
  feedbackForm.value = { type: '', content: '' };
};

// 生命周期
onMounted(() => {
  loadProfile();
});
</script>

<style scoped>
.growth-profile-page {
  min-height: 100vh;
  background: #f5f7fa;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  background: white;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.header-left {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.page-title {
  margin: 0;
  font-size: 24px;
  font-weight: 600;
  color: #1f2937;
}

.page-subtitle {
  color: #6b7280;
  font-size: 14px;
}

.header-right {
  display: flex;
  gap: 12px;
}

.profile-content {
  display: flex;
  gap: 24px;
  padding: 24px;
  max-width: 1200px;
  margin: 0 auto;
}

.main-content {
  flex: 1;
  min-width: 0;
}

.profile-tabs {
  margin-top: 24px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.sidebar {
  width: 280px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.sidebar-widget {
  background: white;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.sidebar-widget h3 {
  margin: 0 0 16px 0;
  font-size: 16px;
  font-weight: 600;
  color: #1f2937;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}

.stat-item {
  text-align: center;
  padding: 12px;
  background: #f8fafc;
  border-radius: 6px;
}

.stat-number {
  font-size: 20px;
  font-weight: 600;
  color: #1f2937;
}

.stat-label {
  font-size: 12px;
  color: #6b7280;
  margin-top: 4px;
}

.no-permission {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 400px;
  background: white;
  margin: 24px;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

:deep(.el-tabs__header) {
  padding: 0 20px;
  background: #f8fafc;
  margin: 0;
}

:deep(.el-tabs__content) {
  padding: 20px;
}

:deep(.el-tabs__item) {
  font-weight: 500;
}

:deep(.el-tabs__item.is-active) {
  color: #667eea;
}

:deep(.el-tabs__active-bar) {
  background-color: #667eea;
}

@media (max-width: 768px) {
  .profile-content {
    flex-direction: column;
    padding: 16px;
  }
  
  .sidebar {
    width: 100%;
    order: -1;
  }
  
  .stats-grid {
    grid-template-columns: repeat(4, 1fr);
  }
  
  .page-header {
    flex-direction: column;
    gap: 16px;
    align-items: flex-start;
  }
  
  .header-right {
    width: 100%;
    justify-content: flex-end;
  }
}
</style> 