<template>
  <div class="goal-planning">
    <div class="goal-header">
      <h3>成长目标</h3>
      <el-button type="primary" @click="handleAddGoal">
        <el-icon><Plus /></el-icon>
        添加目标
      </el-button>
    </div>
    
    <div class="goal-list">
      <div 
        v-for="goal in goals" 
        :key="goal.id"
        class="goal-item"
        @click="handleGoalClick(goal)"
      >
        <div class="goal-header-info">
          <div class="goal-title-section">
            <h4 class="goal-title">{{ goal.title }}</h4>
            <el-tag :type="getStatusType(goal.status)" size="small">
              {{ getStatusLabel(goal.status) }}
            </el-tag>
          </div>
          <div class="goal-progress-section">
            <span class="progress-text">{{ goal.progress }}%</span>
            <el-progress 
              :percentage="goal.progress" 
              :color="getProgressColor(goal.progress)"
              :stroke-width="6"
              :show-text="false"
            />
          </div>
        </div>
        
        <div class="goal-content">
          <p class="goal-description">{{ goal.description }}</p>
          
          <div class="goal-meta">
            <span class="meta-item">
              <el-icon><Calendar /></el-icon>
              目标日期：{{ formatDate(goal.targetDate) }}
            </span>
            <span class="meta-item">
              <el-icon><Flag /></el-icon>
              {{ getCategoryLabel(goal.category) }}
            </span>
            <span v-if="goal.mentorSupport" class="meta-item">
              <el-icon><User /></el-icon>
              导师支持：{{ goal.mentorSupport.mentorName }}
            </span>
          </div>
          
          <div v-if="goal.milestones.length > 0" class="goal-milestones">
            <strong>里程碑进展：</strong>
            <div class="milestone-progress">
              <span class="milestone-text">
                {{ goal.milestones.filter(m => m.status === 'completed').length }} / {{ goal.milestones.length }}
              </span>
              <div class="milestone-indicators">
                <div 
                  v-for="milestone in goal.milestones.slice(0, 5)" 
                  :key="milestone.id"
                  class="milestone-dot"
                  :class="{ completed: milestone.status === 'completed' }"
                />
                <span v-if="goal.milestones.length > 5" class="more-milestones">
                  +{{ goal.milestones.length - 5 }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Plus, Calendar, Flag, User } from '@element-plus/icons-vue';
import type { GrowthGoal } from '@/types/growth-profile';

interface Props {
  goals: GrowthGoal[];
}

const props = defineProps<Props>();

const emit = defineEmits<{
  'goal-click': [goalId: string];
  'add-goal': [];
}>();

const formatDate = (date: Date | string) => {
  return new Date(date).toLocaleDateString('zh-CN');
};

const getStatusType = (status: string) => {
  const types = {
    'draft': 'info',
    'active': 'primary',
    'completed': 'success',
    'cancelled': 'danger',
    'overdue': 'danger'
  };
  return types[status as keyof typeof types] || 'default';
};

const getStatusLabel = (status: string) => {
  const labels = {
    'draft': '草稿',
    'active': '进行中',
    'completed': '已完成',
    'cancelled': '已取消',
    'overdue': '已逾期'
  };
  return labels[status as keyof typeof labels] || status;
};

const getCategoryLabel = (category: string) => {
  const labels = {
    'skill': '技能',
    'career': '职业',
    'leadership': '领导力',
    'knowledge': '知识',
    'network': '人脉'
  };
  return labels[category as keyof typeof labels] || category;
};

const getProgressColor = (progress: number) => {
  if (progress < 30) return '#f56c6c';
  if (progress < 70) return '#e6a23c';
  return '#67c23a';
};

const handleGoalClick = (goal: GrowthGoal) => {
  emit('goal-click', goal.id);
};

const handleAddGoal = () => {
  emit('add-goal');
};
</script>

<style scoped>
.goal-planning {
  padding: 20px 0;
}

.goal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
}

.goal-header h3 {
  margin: 0;
  font-size: 20px;
  font-weight: 600;
  color: #1f2937;
}

.goal-list {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.goal-item {
  background: white;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  border: 1px solid #e5e7eb;
  transition: all 0.3s;
  cursor: pointer;
}

.goal-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
  border-color: #667eea;
}

.goal-header-info {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 16px;
}

.goal-title-section {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
}

.goal-title {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #1f2937;
}

.goal-progress-section {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 150px;
}

.progress-text {
  font-size: 14px;
  font-weight: 500;
  color: #374151;
  white-space: nowrap;
}

.goal-description {
  margin: 0 0 16px 0;
  color: #6b7280;
  line-height: 1.6;
}

.goal-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 20px;
  margin-bottom: 16px;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 13px;
  color: #6b7280;
}

.goal-milestones {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.goal-milestones strong {
  font-size: 14px;
  color: #374151;
}

.milestone-progress {
  display: flex;
  align-items: center;
  gap: 12px;
}

.milestone-text {
  font-size: 13px;
  color: #6b7280;
  font-weight: 500;
}

.milestone-indicators {
  display: flex;
  align-items: center;
  gap: 4px;
}

.milestone-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #e5e7eb;
  transition: all 0.2s;
}

.milestone-dot.completed {
  background: #10b981;
}

.more-milestones {
  font-size: 12px;
  color: #9ca3af;
  margin-left: 4px;
}

:deep(.el-progress-bar__outer) {
  background-color: #f0f0f0;
}

@media (max-width: 768px) {
  .goal-header-info {
    flex-direction: column;
    gap: 16px;
  }
  
  .goal-title-section {
    align-items: flex-start;
    flex-direction: column;
    gap: 8px;
  }
  
  .goal-progress-section {
    width: 100%;
  }
  
  .goal-meta {
    flex-direction: column;
    gap: 8px;
  }
}
</style> 