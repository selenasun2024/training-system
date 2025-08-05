<template>
  <div class="project-card" :class="cardClass">
    <!-- 卡片头部 -->
    <div class="card-header">
      <div class="project-title">
        <h3>{{ project.title }}</h3>
        <el-tag 
          :type="getStatusTagType(project.status)" 
          size="small"
          class="status-tag"
        >
          {{ getStatusText(project.status) }}
        </el-tag>
      </div>
      <div class="project-actions">
        <el-dropdown @command="handleCommand" trigger="click">
          <el-button type="text" :icon="More" />
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item command="view">查看详情</el-dropdown-item>
              <el-dropdown-item command="edit" v-if="canEdit">编辑</el-dropdown-item>
              <el-dropdown-item command="pause" v-if="project.status === 'active'">暂停</el-dropdown-item>
              <el-dropdown-item command="resume" v-if="project.status === 'paused'">恢复</el-dropdown-item>
              <el-dropdown-item command="complete" v-if="canComplete">完成</el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </div>
    </div>

    <!-- 项目描述 -->
    <div class="project-description">
      <p>{{ project.description }}</p>
    </div>

    <!-- 师徒信息 -->
    <div class="participants-section">
      <div class="participant">
        <div class="participant-label">导师</div>
        <div class="participant-info">
          <el-avatar :size="32" :src="project.mentor.avatar">
            {{ project.mentor.name[0] }}
          </el-avatar>
          <div class="participant-details">
            <span class="name">{{ project.mentor.name }}</span>
            <span class="department">{{ project.mentor.department }}</span>
          </div>
        </div>
      </div>
      
      <div class="participant">
        <div class="participant-label">学员</div>
        <div class="participant-info">
          <el-avatar :size="32" :src="project.student.avatar">
            {{ project.student.name[0] }}
          </el-avatar>
          <div class="participant-details">
            <span class="name">{{ project.student.name }}</span>
            <span class="department">{{ project.student.department }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 进度条 -->
    <div class="progress-section">
      <div class="progress-header">
        <span class="progress-label">项目进度</span>
        <span class="progress-percentage">{{ project.progress }}%</span>
      </div>
      <el-progress 
        :percentage="project.progress" 
        :stroke-width="8"
        :show-text="false"
        :color="getProgressColor(project.progress)"
      />
    </div>

    <!-- 里程碑 -->
    <div class="milestones-section">
      <div class="milestone-header">
        <span class="milestone-label">里程碑</span>
        <span class="milestone-count">{{ completedMilestones }}/{{ project.milestones.length }}</span>
      </div>
      <div class="milestone-list">
        <div 
          v-for="(milestone, index) in project.milestones" 
          :key="index"
          class="milestone-item"
          :class="{ 'completed': milestone.completed }"
        >
          <el-icon class="milestone-icon">
            <CircleCheck v-if="milestone.completed" />
            <Clock v-else />
          </el-icon>
          <span class="milestone-name">{{ milestone.name }}</span>
          <span class="milestone-date">{{ formatDate(milestone.date) }}</span>
        </div>
      </div>
    </div>

    <!-- 标签 -->
    <div class="project-tags">
      <el-tag 
        v-for="tag in project.tags" 
        :key="tag"
        size="small"
        class="tag-item"
      >
        {{ tag }}
      </el-tag>
    </div>

    <!-- 新增：培训项目关联信息 -->
    <div v-if="project.sourceTrainingProject" class="project-source">
      <div class="source-item">
        <el-icon><Link /></el-icon>
        <span class="source-text">来源：{{ project.sourceTrainingProject.name }}</span>
        <el-tag size="small" :type="getStatusType(project.sourceTrainingProject.status)">
          {{ getStatusText(project.sourceTrainingProject.status) }}
        </el-tag>
      </div>
    </div>

    <!-- 时间信息 -->
    <div class="project-time">
      <span class="time-label">开始时间:</span>
      <span class="time-value">{{ formatDate(project.startDate) }}</span>
    </div>

    <!-- 卡片底部 -->
    <div class="card-footer">
      <div class="footer-left">
        <el-tag 
          :type="getPhaseTagType(project.phase)" 
          size="small"
        >
          {{ getPhaseText(project.phase) }}
        </el-tag>
        <el-tag 
          :type="getPriorityTagType(project.priority)" 
          size="small"
        >
          {{ getPriorityText(project.priority) }}
        </el-tag>
      </div>
      <div class="footer-right">
        <el-button 
          type="primary" 
          size="small"
          @click="viewDetails"
        >
          查看详情
        </el-button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { 
  More, 
  CircleCheck, 
  Clock, 
  Calendar, 
  Select,
  Link
} from '@element-plus/icons-vue';

// Props
interface Project {
  id: string;
  title: string;
  status: string;
  phase: string;
  progress: number;
  priority: string;
  description: string;
  mentor: {
    id: string;
    name: string;
    avatar: string;
    department: string;
  };
  student: {
    id: string;
    name: string;
    avatar: string;
    department: string;
  };
  startDate: Date;
  expectedEndDate: Date;
  actualEndDate?: Date;
  milestones: Array<{
    name: string;
    completed: boolean;
    date: Date;
  }>;
  tags?: string[];
  sourceTrainingProject?: {
    id: string;
    name: string;
    status: string;
  };
}

interface Props {
  project: Project;
  userRole: string;
}

const props = defineProps<Props>();

// Emits
const emit = defineEmits<{
  viewDetails: [id: string];
  editProject: [id: string];
  pauseProject: [id: string];
  resumeProject: [id: string];
  completeProject: [id: string];
}>();

// 计算属性
const cardClass = computed(() => {
  return {
    'status-active': props.project.status === 'active',
    'status-completed': props.project.status === 'completed',
    'status-paused': props.project.status === 'paused',
    'priority-high': props.project.priority === 'high',
    'priority-medium': props.project.priority === 'medium',
    'priority-low': props.project.priority === 'low'
  };
});

const canEdit = computed(() => {
  return ['manager', 'hr'].includes(props.userRole) || 
         (props.userRole === 'mentor' && props.project.mentor.id === 'current_user_id');
});

const canComplete = computed(() => {
  return props.project.status === 'active' && props.project.progress >= 90;
});

const completedMilestones = computed(() => {
  return props.project.milestones.filter(m => m.completed).length;
});

// 方法
const formatDate = (dateString: string | Date) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString('zh-CN');
};

const getStatusTagType = (status: string) => {
  const types = {
    'active': 'success',
    'completed': 'info',
    'paused': 'warning'
  };
  return types[status] || 'default';
};

const getStatusType = (status: string) => {
  const statusMap = {
    'active': 'success',
    'completed': 'info',
    'pending': 'warning',
    'cancelled': 'danger'
  };
  return statusMap[status] || 'info';
};

const getStatusText = (status: string) => {
  const statusMap = {
    'active': '进行中',
    'completed': '已完成',
    'pending': '待开始',
    'cancelled': '已取消'
  };
  return statusMap[status] || status;
};

const getPhaseTagType = (phase: string) => {
  const types = {
    'startup': 'primary',
    'execution': 'success',
    'evaluation': 'warning',
    'completion': 'info'
  };
  return types[phase] || 'default';
};

const getPhaseText = (phase: string) => {
  const texts = {
    'startup': '启动阶段',
    'execution': '执行阶段',
    'evaluation': '评估阶段',
    'completion': '结束阶段'
  };
  return texts[phase] || phase;
};

const getPriorityTagType = (priority: string) => {
  const types = {
    'high': 'danger',
    'medium': 'warning',
    'low': 'info'
  };
  return types[priority] || 'default';
};

const getPriorityText = (priority: string) => {
  const texts = {
    'high': '高优先级',
    'medium': '中优先级',
    'low': '低优先级'
  };
  return texts[priority] || priority;
};

const getProgressColor = (progress: number) => {
  if (progress >= 90) return '#67C23A';
  if (progress >= 70) return '#409EFF';
  if (progress >= 50) return '#E6A23C';
  return '#F56C6C';
};

const viewDetails = () => {
  emit('viewDetails', props.project.id);
};

const handleCommand = (command: string) => {
  switch (command) {
    case 'view':
      emit('viewDetails', props.project.id);
      break;
    case 'edit':
      emit('editProject', props.project.id);
      break;
    case 'pause':
      emit('pauseProject', props.project.id);
      break;
    case 'resume':
      emit('resumeProject', props.project.id);
      break;
    case 'complete':
      emit('completeProject', props.project.id);
      break;
  }
};
</script>

<style scoped>
.project-card {
  background: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
  border: 2px solid transparent;
}

.project-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
}

.project-card.status-active {
  border-color: #67C23A;
}

.project-card.status-completed {
  border-color: #409EFF;
}

.project-card.status-paused {
  border-color: #E6A23C;
}

.project-card.priority-high {
  box-shadow: 0 2px 8px rgba(245, 108, 108, 0.2);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 16px;
}

.project-title {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.project-title h3 {
  margin: 0;
  font-size: 18px;
  color: #1f2937;
  font-weight: 600;
}

.project-description {
  margin-bottom: 16px;
}

.project-description p {
  margin: 0;
  color: #6b7280;
  font-size: 14px;
  line-height: 1.5;
}

.participants-section {
  display: flex;
  gap: 16px;
  margin-bottom: 16px;
}

.participant {
  flex: 1;
}

.participant-label {
  font-size: 12px;
  color: #6b7280;
  margin-bottom: 8px;
}

.participant-info {
  display: flex;
  align-items: center;
  gap: 8px;
}

.participant-details {
  display: flex;
  flex-direction: column;
}

.participant-details .name {
  font-size: 14px;
  color: #1f2937;
  font-weight: 500;
}

.participant-details .department {
  font-size: 12px;
  color: #6b7280;
}

.progress-section {
  margin-bottom: 16px;
}

.progress-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.progress-label {
  font-size: 14px;
  color: #374151;
  font-weight: 500;
}

.progress-percentage {
  font-size: 14px;
  color: #1f2937;
  font-weight: 600;
}

.milestones-section {
  margin-bottom: 16px;
}

.milestone-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.milestone-label {
  font-size: 14px;
  color: #374151;
  font-weight: 500;
}

.milestone-count {
  font-size: 12px;
  color: #6b7280;
}

.milestone-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.milestone-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px 0;
  font-size: 12px;
}

.milestone-item.completed {
  color: #67C23A;
}

.milestone-item:not(.completed) {
  color: #6b7280;
}

.milestone-icon {
  font-size: 14px;
}

.milestone-name {
  flex: 1;
}

.milestone-date {
  font-size: 11px;
  color: #9ca3af;
}

.project-tags {
  margin-bottom: 16px;
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.tag-item {
  font-size: 11px;
}

.project-source {
  margin-bottom: 16px;
}

.source-item {
  display: flex;
  align-items: center;
  gap: 8px;
}

.source-text {
  font-size: 12px;
  color: #6b7280;
}

.project-time {
  margin-bottom: 16px;
}

.time-label {
  color: #6b7280;
  min-width: 64px;
}

.time-value {
  color: #1f2937;
  font-weight: 500;
}

.card-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 16px;
  border-top: 1px solid #e5e7eb;
}

.footer-left {
  display: flex;
  gap: 8px;
}

.footer-right {
  display: flex;
  gap: 8px;
}

/* 响应式设计 */
@media (max-width: 480px) {
  .project-card {
    padding: 16px;
  }
  
  .participants-section {
    flex-direction: column;
    gap: 12px;
  }
  
  .card-footer {
    flex-direction: column;
    gap: 12px;
    align-items: stretch;
  }
  
  .footer-left {
    justify-content: center;
  }
}
</style> 