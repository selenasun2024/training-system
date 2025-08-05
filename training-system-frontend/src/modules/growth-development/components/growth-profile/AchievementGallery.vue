<template>
  <div class="achievement-gallery">
    <div class="achievement-grid">
      <div 
        v-for="achievement in achievements" 
        :key="achievement.id"
        class="achievement-card"
        @click="handleAchievementClick(achievement)"
      >
        <div class="achievement-header">
          <div class="achievement-badge" :class="achievement.level">
            <el-icon><Trophy /></el-icon>
          </div>
          <h4 class="achievement-title">{{ achievement.title }}</h4>
        </div>
        <div class="achievement-content">
          <p class="achievement-description">{{ achievement.description }}</p>
          <div class="achievement-meta">
            <span class="achievement-date">{{ formatDate(achievement.date) }}</span>
            <el-tag :type="getTypeTagType(achievement.type)" size="small">
              {{ getTypeLabel(achievement.type) }}
            </el-tag>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Trophy } from '@element-plus/icons-vue';
import type { Achievement } from '@/types/growth-profile';

interface Props {
  achievements: Achievement[];
}

const props = defineProps<Props>();

const emit = defineEmits<{
  'achievement-click': [achievementId: string];
}>();

const formatDate = (date: Date | string) => {
  return new Date(date).toLocaleDateString('zh-CN');
};

const getTypeTagType = (type: string) => {
  const types = {
    'milestone': 'primary',
    'certification': 'success',
    'recognition': 'warning',
    'skill_mastery': 'info'
  };
  return types[type as keyof typeof types] || 'default';
};

const getTypeLabel = (type: string) => {
  const labels = {
    'milestone': '里程碑',
    'certification': '认证',
    'recognition': '认可',
    'skill_mastery': '技能精通'
  };
  return labels[type as keyof typeof labels] || type;
};

const handleAchievementClick = (achievement: Achievement) => {
  emit('achievement-click', achievement.id);
};
</script>

<style scoped>
.achievement-gallery {
  padding: 20px 0;
}

.achievement-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;
}

.achievement-card {
  background: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  transition: all 0.3s;
  cursor: pointer;
}

.achievement-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
}

.achievement-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}

.achievement-badge {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  color: white;
}

.achievement-badge.bronze {
  background: linear-gradient(135deg, #cd7f32, #b8860b);
}

.achievement-badge.silver {
  background: linear-gradient(135deg, #c0c0c0, #a8a8a8);
}

.achievement-badge.gold {
  background: linear-gradient(135deg, #ffd700, #ffb347);
}

.achievement-badge.platinum {
  background: linear-gradient(135deg, #e5e4e2, #d3d3d3);
}

.achievement-title {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #1f2937;
}

.achievement-description {
  margin: 0 0 12px 0;
  color: #6b7280;
  line-height: 1.5;
}

.achievement-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.achievement-date {
  font-size: 12px;
  color: #9ca3af;
}
</style> 