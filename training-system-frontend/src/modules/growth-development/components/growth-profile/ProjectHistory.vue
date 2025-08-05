<template>
  <div class="project-history">
    <!-- 项目统计 -->
    <div class="history-stats">
      <div class="stat-item">
        <div class="stat-number">{{ trainingHistory.length }}</div>
        <div class="stat-label">培训项目</div>
      </div>
      <div class="stat-item">
        <div class="stat-number">{{ mentorshipHistory.length }}</div>
        <div class="stat-label">带教项目</div>
      </div>
      <div class="stat-item">
        <div class="stat-number">{{ completedProjects }}</div>
        <div class="stat-label">已完成</div>
      </div>
      <div class="stat-item">
        <div class="stat-number">{{ averageRating.toFixed(1) }}</div>
        <div class="stat-label">平均评分</div>
      </div>
    </div>

    <!-- 项目列表 -->
    <div class="project-tabs">
      <el-tabs v-model="activeTab" @tab-click="handleTabClick">
        <el-tab-pane label="培训项目" name="training">
          <div class="project-list">
            <div 
              v-for="project in trainingHistory" 
              :key="project.projectId"
              class="project-card"
              @click="handleProjectClick(project.projectId, 'training')"
            >
              <div class="project-header">
                <h4 class="project-title">{{ project.projectName }}</h4>
                <el-tag :type="getStatusType(project.status)" size="small">
                  {{ getStatusLabel(project.status) }}
                </el-tag>
              </div>
              
              <div class="project-content">
                <div class="project-meta">
                  <span class="meta-item">
                    <el-icon><Calendar /></el-icon>
                    {{ formatDate(project.startDate) }} - {{ project.endDate ? formatDate(project.endDate) : '进行中' }}
                  </span>
                  <span class="meta-item">
                    <el-icon><Flag /></el-icon>
                    {{ getProjectTypeLabel(project.projectType) }}
                  </span>
                  <span v-if="project.finalScore" class="meta-item">
                    <el-icon><Star /></el-icon>
                    评分：{{ project.finalScore }}
                  </span>
                </div>
                
                <div v-if="project.skillsLearned.length > 0" class="skills-learned">
                  <strong>学到的技能：</strong>
                  <el-tag 
                    v-for="skill in project.skillsLearned.slice(0, 3)" 
                    :key="skill"
                    size="small"
                    type="info"
                  >
                    {{ skill }}
                  </el-tag>
                  <span v-if="project.skillsLearned.length > 3" class="more-skills">
                    +{{ project.skillsLearned.length - 3 }}个技能
                  </span>
                </div>
                
                <div v-if="project.hadMentorship" class="mentorship-info">
                  <el-icon><User /></el-icon>
                  <span>包含导师指导：{{ project.mentorName }}</span>
                </div>
              </div>
            </div>
          </div>
        </el-tab-pane>

        <el-tab-pane label="带教项目" name="mentorship">
          <div class="project-list">
            <div 
              v-for="project in mentorshipHistory" 
              :key="project.projectId"
              class="project-card"
              @click="handleProjectClick(project.projectId, 'mentorship')"
            >
              <div class="project-header">
                <h4 class="project-title">{{ project.projectName }}</h4>
                <div class="project-badges">
                  <el-tag :type="getRoleType(project.role)" size="small">
                    {{ getRoleLabel(project.role) }}
                  </el-tag>
                  <el-tag :type="getStatusType(project.status)" size="small">
                    {{ getStatusLabel(project.status) }}
                  </el-tag>
                </div>
              </div>
              
              <div class="project-content">
                <div class="project-participants">
                  <div class="participant">
                    <strong>导师：</strong>{{ project.mentorName }}
                  </div>
                  <div class="participant">
                    <strong>学员：</strong>{{ project.studentName }}
                  </div>
                </div>
                
                <div class="project-meta">
                  <span class="meta-item">
                    <el-icon><Calendar /></el-icon>
                    {{ formatDate(project.startDate) }} - {{ project.endDate ? formatDate(project.endDate) : '进行中' }}
                  </span>
                  <span v-if="project.overallRating" class="meta-item">
                    <el-icon><Star /></el-icon>
                    评分：{{ project.overallRating }}
                  </span>
                  <span class="meta-item">
                    <el-icon><TrendCharts /></el-icon>
                    {{ getSourceTypeLabel(project.sourceType) }}
                  </span>
                </div>
                
                <div v-if="project.completedMilestones.length > 0" class="milestones">
                  <strong>完成里程碑：</strong>
                  <span class="milestone-count">{{ project.completedMilestones.length }}个</span>
                </div>
                
                <div v-if="project.skillsImproved.length > 0" class="skills-improved">
                  <strong>提升技能：</strong>
                  <el-tag 
                    v-for="skill in project.skillsImproved.slice(0, 3)" 
                    :key="skill"
                    size="small"
                    type="success"
                  >
                    {{ skill }}
                  </el-tag>
                  <span v-if="project.skillsImproved.length > 3" class="more-skills">
                    +{{ project.skillsImproved.length - 3 }}个技能
                  </span>
                </div>
              </div>
            </div>
          </div>
        </el-tab-pane>
      </el-tabs>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { Calendar, Flag, Star, User, TrendCharts } from '@element-plus/icons-vue';
import type { TrainingHistoryItem, MentorshipHistoryItem } from '@/types/growth-profile';

// 组件属性
interface Props {
  trainingHistory: TrainingHistoryItem[];
  mentorshipHistory: MentorshipHistoryItem[];
}

const props = defineProps<Props>();

// 组件事件
const emit = defineEmits<{
  'project-click': [projectId: string, type: 'training' | 'mentorship'];
}>();

// 响应式数据
const activeTab = ref('training');

// 计算属性
const completedProjects = computed(() => {
  const completedTraining = props.trainingHistory.filter(p => p.status === 'completed').length;
  const completedMentorship = props.mentorshipHistory.filter(p => p.status === 'completed').length;
  return completedTraining + completedMentorship;
});

const averageRating = computed(() => {
  const trainingRatings = props.trainingHistory
    .filter(p => p.finalScore)
    .map(p => p.finalScore!);
  const mentorshipRatings = props.mentorshipHistory
    .filter(p => p.overallRating)
    .map(p => p.overallRating!);
  
  const allRatings = [...trainingRatings, ...mentorshipRatings];
  return allRatings.length > 0 
    ? allRatings.reduce((sum, rating) => sum + rating, 0) / allRatings.length 
    : 0;
});

// 方法
const formatDate = (date: Date | string) => {
  const d = new Date(date);
  return d.toLocaleDateString('zh-CN');
};

const getStatusType = (status: string) => {
  const types = {
    'enrolled': 'info',
    'active': 'primary',
    'completed': 'success',
    'dropped': 'danger',
    'suspended': 'warning',
    'paused': 'warning',
    'cancelled': 'danger'
  };
  return types[status as keyof typeof types] || 'default';
};

const getStatusLabel = (status: string) => {
  const labels = {
    'enrolled': '已注册',
    'active': '进行中',
    'completed': '已完成',
    'dropped': '已退出',
    'suspended': '已暂停',
    'paused': '已暂停',
    'cancelled': '已取消'
  };
  return labels[status as keyof typeof labels] || status;
};

const getProjectTypeLabel = (type: string) => {
  const labels = {
    'onboarding': '入职培训',
    'skills': '技能培训',
    'leadership': '领导力培训',
    'certification': '认证培训',
    'custom': '定制培训'
  };
  return labels[type as keyof typeof labels] || type;
};

const getRoleType = (role: string) => {
  return role === 'mentor' ? 'warning' : 'primary';
};

const getRoleLabel = (role: string) => {
  return role === 'mentor' ? '导师' : '学员';
};

const getSourceTypeLabel = (sourceType: string) => {
  const labels = {
    'training_project': '培训项目',
    'direct_mentorship': '直接带教',
    'skill_development': '技能发展'
  };
  return labels[sourceType as keyof typeof labels] || sourceType;
};

const handleTabClick = () => {
  // 标签页切换处理
};

const handleProjectClick = (projectId: string, type: 'training' | 'mentorship') => {
  emit('project-click', projectId, type);
};
</script>

<style scoped>
.project-history {
  padding: 20px 0;
}

.history-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 20px;
  margin-bottom: 30px;
  padding: 20px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 12px;
  color: white;
}

.stat-item {
  text-align: center;
}

.stat-number {
  font-size: 28px;
  font-weight: 600;
  line-height: 1;
}

.stat-label {
  font-size: 14px;
  opacity: 0.9;
  margin-top: 4px;
}

.project-tabs {
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.project-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 20px;
}

.project-card {
  padding: 20px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  transition: all 0.2s;
  cursor: pointer;
}

.project-card:hover {
  border-color: #667eea;
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.15);
  transform: translateY(-2px);
}

.project-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 16px;
}

.project-title {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #1f2937;
  flex: 1;
  margin-right: 12px;
}

.project-badges {
  display: flex;
  gap: 8px;
}

.project-content {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.project-participants {
  display: flex;
  gap: 20px;
  padding: 12px;
  background: #f8fafc;
  border-radius: 6px;
}

.participant {
  font-size: 14px;
  color: #374151;
}

.project-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: #6b7280;
}

.skills-learned,
.skills-improved {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  font-size: 14px;
}

.skills-learned strong,
.skills-improved strong {
  color: #374151;
}

.more-skills {
  font-size: 12px;
  color: #6b7280;
  font-style: italic;
}

.mentorship-info {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
  color: #67C23A;
  font-weight: 500;
}

.milestones {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
}

.milestones strong {
  color: #374151;
}

.milestone-count {
  background: #67C23A;
  color: white;
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
}

:deep(.el-tabs__header) {
  background: #f8fafc;
  margin: 0;
}

:deep(.el-tabs__content) {
  padding: 0;
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
  .history-stats {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .project-header {
    flex-direction: column;
    gap: 12px;
    align-items: flex-start;
  }
  
  .project-participants {
    flex-direction: column;
    gap: 8px;
  }
  
  .project-meta {
    flex-direction: column;
    gap: 8px;
  }
}
</style> 