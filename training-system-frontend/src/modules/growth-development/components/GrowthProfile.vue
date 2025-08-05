<template>
  <div class="growth-profile">
    <!-- 成长档案头部 -->
    <div class="profile-header">
      <div class="profile-info">
        <div class="avatar-section">
          <el-avatar :size="80" :src="profile.avatar">
            {{ profile.userName.charAt(0) }}
          </el-avatar>
        </div>
        <div class="basic-info">
          <h2 class="name">{{ profile.userName }}</h2>
          <div class="info-tags">
            <el-tag type="info" size="small">{{ profile.department }}</el-tag>
            <el-tag type="" size="small">{{ profile.position }}</el-tag>
            <el-tag :type="getLevelType(profile.currentLevel)" size="small">
              {{ getLevelLabel(profile.currentLevel) }}
            </el-tag>
          </div>
          <div class="info-details">
            <span class="detail-item">
              <el-icon><Calendar /></el-icon>
              入职时间：{{ formatDate(profile.entryDate) }}
            </span>
            <span class="detail-item">
              <el-icon><Clock /></el-icon>
              最近更新：{{ formatDate(profile.lastUpdated) }}
            </span>
          </div>
        </div>
      </div>
      <div class="profile-actions">
        <el-button 
          type="primary" 
          :icon="Edit" 
          @click="handleEdit"
          v-if="canEdit"
        >
          编辑档案
        </el-button>
        <el-button 
          type="default" 
          :icon="Share" 
          @click="handleShare"
          v-if="canShare"
        >
          分享
        </el-button>
        <el-button 
          type="default" 
          :icon="Download" 
          @click="handleExport"
          v-if="canExport"
        >
          导出
        </el-button>
      </div>
    </div>

    <!-- 统计卡片 -->
    <div class="stats-cards">
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-icon training">
            <el-icon><Document /></el-icon>
          </div>
          <div class="stat-content">
            <div class="stat-number">{{ profile.statistics.trainingProjects.total }}</div>
            <div class="stat-label">培训项目</div>
            <div class="stat-detail">
              完成率 {{ Math.round(profile.statistics.trainingProjects.completionRate * 100) }}%
            </div>
          </div>
        </div>
        
        <div class="stat-card">
          <div class="stat-icon mentorship">
            <el-icon><User /></el-icon>
          </div>
          <div class="stat-content">
            <div class="stat-number">{{ profile.statistics.mentorshipProjects.asStudent }}</div>
            <div class="stat-label">带教项目</div>
            <div class="stat-detail">
              平均评分 {{ profile.statistics.mentorshipProjects.averageRating.toFixed(1) }}
            </div>
          </div>
        </div>
        
        <div class="stat-card">
          <div class="stat-icon skills">
            <el-icon><Trophy /></el-icon>
          </div>
          <div class="stat-content">
            <div class="stat-number">{{ profile.statistics.skills.mastered }}</div>
            <div class="stat-label">掌握技能</div>
            <div class="stat-detail">
              平均等级 {{ profile.statistics.skills.averageLevel.toFixed(1) }}
            </div>
          </div>
        </div>
        
        <div class="stat-card">
          <div class="stat-icon achievements">
            <el-icon><Medal /></el-icon>
          </div>
          <div class="stat-content">
            <div class="stat-number">{{ profile.statistics.achievements.total }}</div>
            <div class="stat-label">获得成就</div>
            <div class="stat-detail">
              黄金成就 {{ profile.statistics.achievements.byLevel.gold || 0 }}
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 标签页内容 -->
    <div class="profile-content">
      <el-tabs v-model="activeTab" @tab-click="handleTabClick">
        <el-tab-pane label="成长轨迹" name="timeline">
          <template #label>
            <div class="tab-label">
              <el-icon><Timeline /></el-icon>
              <span>成长轨迹</span>
            </div>
          </template>
          <GrowthTimeline 
            :timeline="profile.combinedTimeline" 
            @event-click="handleTimelineEventClick"
          />
        </el-tab-pane>

        <el-tab-pane label="能力发展" name="skills">
          <template #label>
            <div class="tab-label">
              <el-icon><Opportunity /></el-icon>
              <span>能力发展</span>
            </div>
          </template>
          <SkillDevelopment 
            :skills="profile.skillDevelopment" 
            @skill-click="handleSkillClick"
          />
        </el-tab-pane>

        <el-tab-pane label="项目历史" name="projects">
          <template #label>
            <div class="tab-label">
              <el-icon><FolderOpened /></el-icon>
              <span>项目历史</span>
            </div>
          </template>
          <ProjectHistory 
            :training-history="profile.trainingHistory"
            :mentorship-history="profile.mentorshipHistory"
            @project-click="handleProjectClick"
          />
        </el-tab-pane>

        <el-tab-pane label="成就荣誉" name="achievements">
          <template #label>
            <div class="tab-label">
              <el-icon><Star /></el-icon>
              <span>成就荣誉</span>
            </div>
          </template>
          <AchievementGallery 
            :achievements="profile.achievements" 
            @achievement-click="handleAchievementClick"
          />
        </el-tab-pane>

        <el-tab-pane label="反馈收集" name="feedback">
          <template #label>
            <div class="tab-label">
              <el-icon><ChatDotSquare /></el-icon>
              <span>反馈收集</span>
            </div>
          </template>
          <FeedbackCollection 
            :feedback="profile.feedbackCollection" 
            @feedback-click="handleFeedbackClick"
          />
        </el-tab-pane>

        <el-tab-pane label="目标规划" name="goals">
          <template #label>
            <div class="tab-label">
              <el-icon><Aim /></el-icon>
              <span>目标规划</span>
            </div>
          </template>
          <GoalPlanning 
            :goals="profile.goals" 
            @goal-click="handleGoalClick"
            @add-goal="handleAddGoal"
          />
        </el-tab-pane>
      </el-tabs>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { 
  Edit, Share, Download, Calendar, Clock, Document, User, Trophy, Medal,
  Timeline, Opportunity, FolderOpened, Star, ChatDotSquare, Aim
} from '@element-plus/icons-vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import type { GrowthProfile } from '@/types/growth-profile';
import GrowthTimeline from './growth-profile/GrowthTimeline.vue';
import SkillDevelopment from './growth-profile/SkillDevelopment.vue';
import ProjectHistory from './growth-profile/ProjectHistory.vue';
import AchievementGallery from './growth-profile/AchievementGallery.vue';
import FeedbackCollection from './growth-profile/FeedbackCollection.vue';
import GoalPlanning from './growth-profile/GoalPlanning.vue';

// 组件属性
interface Props {
  userId: string;
  userRole: string;
  readonly?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  readonly: false
});

// 组件事件
const emit = defineEmits<{
  'profile-updated': [profile: GrowthProfile];
  'project-view': [projectId: string, type: 'training' | 'mentorship'];
  'skill-detail': [skillId: string];
  'achievement-detail': [achievementId: string];
}>();

// 响应式数据
const activeTab = ref('timeline');
const profile = ref<GrowthProfile>({} as GrowthProfile);
const loading = ref(false);

// 计算属性
const canEdit = computed(() => {
  return props.userRole === 'owner' || props.userRole === 'hr' || !props.readonly;
});

const canShare = computed(() => {
  return props.userRole === 'owner' || props.userRole === 'mentor' || props.userRole === 'manager';
});

const canExport = computed(() => {
  return props.userRole === 'owner' || props.userRole === 'hr' || props.userRole === 'manager';
});

// 方法
const getLevelType = (level: string) => {
  const types = {
    'junior': 'info',
    'intermediate': 'warning',
    'senior': 'success',
    'expert': 'danger'
  };
  return types[level as keyof typeof types] || 'info';
};

const getLevelLabel = (level: string) => {
  const labels = {
    'junior': '初级',
    'intermediate': '中级',
    'senior': '高级',
    'expert': '专家'
  };
  return labels[level as keyof typeof labels] || level;
};

const formatDate = (date: Date | string) => {
  const d = new Date(date);
  return d.toLocaleDateString('zh-CN');
};

const handleEdit = () => {
  // 编辑档案逻辑
  ElMessage.info('编辑功能开发中...');
};

const handleShare = () => {
  // 分享逻辑
  ElMessage.info('分享功能开发中...');
};

const handleExport = () => {
  // 导出逻辑
  ElMessage.info('导出功能开发中...');
};

const handleTabClick = (tab: any) => {
  activeTab.value = tab.name;
};

const handleTimelineEventClick = (eventId: string) => {
  // 处理时间线事件点击
  console.log('Timeline event clicked:', eventId);
};

const handleSkillClick = (skillId: string) => {
  emit('skill-detail', skillId);
};

const handleProjectClick = (projectId: string, type: 'training' | 'mentorship') => {
  emit('project-view', projectId, type);
};

const handleAchievementClick = (achievementId: string) => {
  emit('achievement-detail', achievementId);
};

const handleFeedbackClick = (feedbackId: string) => {
  // 处理反馈点击
  console.log('Feedback clicked:', feedbackId);
};

const handleGoalClick = (goalId: string) => {
  // 处理目标点击
  console.log('Goal clicked:', goalId);
};

const handleAddGoal = () => {
  // 添加目标
  console.log('Add goal');
};

const loadProfile = async () => {
  loading.value = true;
  try {
    // 模拟数据加载
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // 这里应该调用API加载真实数据
    profile.value = {
      id: 'profile-1',
      userId: props.userId,
      userName: '张三',
      department: '技术部',
      position: '前端开发工程师',
      entryDate: new Date('2022-01-01'),
      currentLevel: 'intermediate',
      trainingHistory: [],
      mentorshipHistory: [],
      combinedTimeline: [],
      skillDevelopment: [],
      achievements: [],
      feedbackCollection: [],
      goals: [],
      statistics: {
        trainingProjects: {
          total: 8,
          completed: 6,
          inProgress: 2,
          completionRate: 0.75,
          averageRating: 4.2
        },
        mentorshipProjects: {
          asStudent: 3,
          asMentor: 1,
          completed: 2,
          inProgress: 2,
          averageRating: 4.5
        },
        skills: {
          total: 15,
          mastered: 8,
          inProgress: 7,
          averageLevel: 3.2,
          improvementRate: 0.8
        },
        achievements: {
          total: 12,
          byType: {
            'milestone': 5,
            'certification': 3,
            'recognition': 2,
            'skill_mastery': 2
          },
          byLevel: {
            'bronze': 6,
            'silver': 4,
            'gold': 2,
            'platinum': 0
          }
        },
        feedback: {
          total: 25,
          averageRating: 4.3,
          byType: {
            'mentor_feedback': 8,
            'peer_feedback': 10,
            'manager_feedback': 4,
            'instructor_feedback': 3
          }
        },
        activity: {
          totalEvents: 156,
          lastActivityDate: new Date(),
          monthlyActivity: {}
        }
      },
      lastUpdated: new Date(),
      createdAt: new Date('2022-01-01')
    };
  } catch (error) {
    console.error('Error loading profile:', error);
    ElMessage.error('加载成长档案失败');
  } finally {
    loading.value = false;
  }
};

// 生命周期
onMounted(() => {
  loadProfile();
});
</script>

<style scoped>
.growth-profile {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

.profile-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 24px;
  padding: 24px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 12px;
  color: white;
}

.profile-info {
  display: flex;
  align-items: center;
  gap: 20px;
}

.avatar-section {
  flex-shrink: 0;
}

.basic-info {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.name {
  margin: 0;
  font-size: 24px;
  font-weight: 600;
}

.info-tags {
  display: flex;
  gap: 8px;
}

.info-details {
  display: flex;
  gap: 20px;
  font-size: 14px;
  opacity: 0.9;
}

.detail-item {
  display: flex;
  align-items: center;
  gap: 4px;
}

.profile-actions {
  display: flex;
  gap: 12px;
}

.stats-cards {
  margin-bottom: 24px;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 16px;
}

.stat-card {
  display: flex;
  align-items: center;
  padding: 20px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transition: transform 0.2s;
}

.stat-card:hover {
  transform: translateY(-2px);
}

.stat-icon {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 16px;
  font-size: 24px;
  color: white;
}

.stat-icon.training {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.stat-icon.mentorship {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
}

.stat-icon.skills {
  background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
}

.stat-icon.achievements {
  background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);
}

.stat-content {
  flex: 1;
}

.stat-number {
  font-size: 28px;
  font-weight: 600;
  color: #1f2937;
  line-height: 1;
}

.stat-label {
  font-size: 14px;
  color: #6b7280;
  margin: 4px 0;
}

.stat-detail {
  font-size: 12px;
  color: #9ca3af;
}

.profile-content {
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.tab-label {
  display: flex;
  align-items: center;
  gap: 4px;
}

:deep(.el-tabs__header) {
  background: #f8fafc;
  margin: 0;
  padding: 0 24px;
}

:deep(.el-tabs__content) {
  padding: 24px;
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
</style> 