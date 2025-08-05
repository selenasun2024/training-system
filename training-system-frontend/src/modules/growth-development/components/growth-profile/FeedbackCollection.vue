<template>
  <div class="feedback-collection">
    <div class="feedback-list">
      <div 
        v-for="item in feedback" 
        :key="item.id"
        class="feedback-item"
        @click="handleFeedbackClick(item)"
      >
        <div class="feedback-header">
          <div class="feedback-author">
            <strong>{{ item.fromName }}</strong>
            <span class="author-role">{{ item.fromRole }}</span>
          </div>
          <div class="feedback-meta">
            <span class="feedback-date">{{ formatDate(item.date) }}</span>
            <el-tag :type="getTypeTagType(item.type)" size="small">
              {{ getTypeLabel(item.type) }}
            </el-tag>
          </div>
        </div>
        <div class="feedback-content">
          <p class="feedback-text">{{ item.content }}</p>
          <div v-if="item.rating" class="feedback-rating">
            <el-rate :model-value="item.rating" disabled size="small" />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { FeedbackItem } from '@/types/growth-profile';

interface Props {
  feedback: FeedbackItem[];
}

const props = defineProps<Props>();

const emit = defineEmits<{
  'feedback-click': [feedbackId: string];
}>();

const formatDate = (date: Date | string) => {
  return new Date(date).toLocaleDateString('zh-CN');
};

const getTypeTagType = (type: string) => {
  const types = {
    'mentor_feedback': 'success',
    'peer_feedback': 'primary',
    'manager_feedback': 'warning',
    'instructor_feedback': 'info',
    'self_reflection': 'default'
  };
  return types[type as keyof typeof types] || 'default';
};

const getTypeLabel = (type: string) => {
  const labels = {
    'mentor_feedback': '导师反馈',
    'peer_feedback': '同事反馈',
    'manager_feedback': '管理者反馈',
    'instructor_feedback': '讲师反馈',
    'self_reflection': '自我反思'
  };
  return labels[type as keyof typeof labels] || type;
};

const handleFeedbackClick = (item: FeedbackItem) => {
  emit('feedback-click', item.id);
};
</script>

<style scoped>
.feedback-collection {
  padding: 20px 0;
}

.feedback-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.feedback-item {
  background: white;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transition: all 0.2s;
  cursor: pointer;
}

.feedback-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
}

.feedback-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 12px;
}

.feedback-author {
  display: flex;
  align-items: center;
  gap: 8px;
}

.author-role {
  font-size: 12px;
  color: #6b7280;
  background: #f3f4f6;
  padding: 2px 6px;
  border-radius: 4px;
}

.feedback-meta {
  display: flex;
  gap: 8px;
  align-items: center;
}

.feedback-date {
  font-size: 12px;
  color: #9ca3af;
}

.feedback-text {
  margin: 0 0 12px 0;
  color: #374151;
  line-height: 1.6;
}

.feedback-rating {
  display: flex;
  align-items: center;
}
</style> 