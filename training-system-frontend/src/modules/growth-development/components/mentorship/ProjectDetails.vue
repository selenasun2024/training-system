<template>
  <div class="project-details">
    <!-- 项目头部信息 -->
    <div class="project-header">
      <div class="header-left">
        <div class="project-title">
          <h2>{{ project.title }}</h2>
          <div class="project-meta">
            <el-tag 
              :type="getStatusTagType(project.status)" 
              size="large"
              class="status-tag"
            >
              {{ getStatusText(project.status) }}
            </el-tag>
            <el-tag 
              :type="getPhaseTagType(project.phase)" 
              size="large"
              class="phase-tag"
            >
              {{ getPhaseText(project.phase) }}
            </el-tag>
            <el-tag 
              :type="getPriorityTagType(project.priority)" 
              size="large"
              class="priority-tag"
            >
              {{ getPriorityText(project.priority) }}
            </el-tag>
          </div>
        </div>
        <div class="project-description">
          <p>{{ project.description }}</p>
        </div>
      </div>
      <div class="header-right">
        <div class="action-buttons">
          <el-button 
            v-if="canEdit" 
            type="primary" 
            :icon="Edit"
            @click="handleEdit"
          >
            编辑项目
          </el-button>
          <el-dropdown @command="handleCommand">
            <el-button :icon="More">
              更多操作
              <el-icon class="el-icon--right"><arrow-down /></el-icon>
            </el-button>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="pause" v-if="project.status === 'active'">
                  <el-icon><VideoPause /></el-icon>
                  暂停项目
                </el-dropdown-item>
                <el-dropdown-item command="resume" v-if="project.status === 'paused'">
                  <el-icon><VideoPlay /></el-icon>
                  恢复项目
                </el-dropdown-item>
                <el-dropdown-item command="complete" v-if="project.status !== 'completed'">
                  <el-icon><Check /></el-icon>
                  完成项目
                </el-dropdown-item>
                <el-dropdown-item command="archive" divided>
                  <el-icon><Box /></el-icon>
                  归档项目
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </div>
    </div>

    <!-- 项目详情内容 -->
    <div class="project-content">
      <el-row :gutter="24">
        <!-- 左侧主要内容 -->
        <el-col :span="16">
          <!-- 项目进度 -->
          <div class="detail-section">
            <div class="section-header">
              <h3>
                <el-icon><TrendCharts /></el-icon>
                项目进度
              </h3>
            </div>
            <div class="progress-container">
              <div class="progress-info">
                <div class="progress-stats">
                  <div class="stat-item">
                    <span class="stat-value">{{ project.progress }}%</span>
                    <span class="stat-label">完成度</span>
                  </div>
                  <div class="stat-item">
                    <span class="stat-value">{{ completedMilestones }}/{{ totalMilestones }}</span>
                    <span class="stat-label">里程碑</span>
                  </div>
                  <div class="stat-item">
                    <span class="stat-value">{{ daysBetween(project.startDate, new Date()) }}</span>
                    <span class="stat-label">已进行(天)</span>
                  </div>
                  <div class="stat-item">
                    <span class="stat-value">{{ daysBetween(new Date(), project.expectedEndDate) }}</span>
                    <span class="stat-label">剩余(天)</span>
                  </div>
                </div>
              </div>
              <div class="progress-bar">
                <el-progress 
                  :percentage="project.progress" 
                  :stroke-width="12"
                  :color="getProgressColor(project.progress)"
                />
              </div>
            </div>
          </div>

          <!-- 里程碑列表 -->
          <div class="detail-section">
            <div class="section-header">
              <h3>
                <el-icon><Flag /></el-icon>
                项目里程碑
              </h3>
              <el-button 
                v-if="canEdit" 
                type="text" 
                size="small"
                @click="handleAddMilestone"
              >
                <el-icon><Plus /></el-icon>
                添加里程碑
              </el-button>
            </div>
            <div class="milestone-list">
              <div 
                v-for="(milestone, index) in project.milestones" 
                :key="index"
                class="milestone-item"
                :class="{ 'completed': milestone.completed }"
              >
                <div class="milestone-icon">
                  <el-icon v-if="milestone.completed" class="completed-icon">
                    <Check />
                  </el-icon>
                  <el-icon v-else class="pending-icon">
                    <Clock />
                  </el-icon>
                </div>
                <div class="milestone-content">
                  <div class="milestone-title">{{ milestone.name }}</div>
                  <div class="milestone-date">
                    <span v-if="milestone.completed">
                      已完成 - {{ formatDate(milestone.date) }}
                    </span>
                    <span v-else>
                      预计完成 - {{ formatDate(milestone.date) }}
                    </span>
                  </div>
                </div>
                <div class="milestone-actions" v-if="canEdit">
                  <el-button 
                    v-if="!milestone.completed"
                    type="text" 
                    size="small"
                    @click="handleCompleteMilestone(index)"
                  >
                    标记完成
                  </el-button>
                  <el-button 
                    type="text" 
                    size="small"
                    @click="handleEditMilestone(index)"
                  >
                    编辑
                  </el-button>
                </div>
              </div>
            </div>
          </div>

          <!-- 培训项目关联 -->
          <div class="detail-section" v-if="hasTrainingRelation">
            <div class="section-header">
              <h3>
                <el-icon><Connection /></el-icon>
                培训项目关联
              </h3>
            </div>
            <div class="training-relation">
              <!-- 源培训项目 -->
              <div v-if="project.sourceTrainingProject" class="relation-item">
                <div class="relation-header">
                  <el-icon><ArrowRight /></el-icon>
                  <span>源培训项目</span>
                </div>
                <div class="relation-content">
                  <div class="project-card">
                    <div class="project-info">
                      <h4>{{ project.sourceTrainingProject.name }}</h4>
                      <p>从此培训项目转化而来</p>
                      <el-tag 
                        :type="getStatusTagType(project.sourceTrainingProject.status)" 
                        size="small"
                      >
                        {{ getStatusText(project.sourceTrainingProject.status) }}
                      </el-tag>
                    </div>
                    <div class="project-actions">
                      <el-button type="text" size="small">查看详情</el-button>
                    </div>
                  </div>
                </div>
              </div>

              <!-- 相关培训项目 -->
              <div v-if="project.relatedTrainingProjects?.length" class="relation-item">
                <div class="relation-header">
                  <el-icon><Connection /></el-icon>
                  <span>相关培训项目</span>
                </div>
                <div class="relation-content">
                  <div 
                    v-for="trainingProject in project.relatedTrainingProjects" 
                    :key="trainingProject.id"
                    class="project-card"
                  >
                    <div class="project-info">
                      <h4>{{ trainingProject.name }}</h4>
                      <p>支持当前带教项目的培训</p>
                      <el-tag 
                        :type="getStatusTagType(trainingProject.status)" 
                        size="small"
                      >
                        {{ getStatusText(trainingProject.status) }}
                      </el-tag>
                    </div>
                    <div class="project-actions">
                      <el-button type="text" size="small">查看详情</el-button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- 活动记录 -->
          <div class="detail-section">
            <div class="section-header">
              <h3>
                <el-icon><ChatDotRound /></el-icon>
                活动记录
              </h3>
              <el-button 
                type="text" 
                size="small"
                @click="handleAddActivity"
              >
                <el-icon><Plus /></el-icon>
                添加记录
              </el-button>
            </div>
            <div class="activity-timeline">
              <el-timeline>
                <el-timeline-item
                  v-for="activity in mockActivities"
                  :key="activity.id"
                  :timestamp="formatDateTime(activity.createdAt)"
                  :type="getActivityType(activity.type)"
                >
                  <div class="activity-content">
                    <div class="activity-header">
                      <span class="activity-title">{{ activity.title }}</span>
                      <span class="activity-author">{{ activity.author }}</span>
                    </div>
                    <div class="activity-description">
                      {{ activity.description }}
                    </div>
                    <div class="activity-attachments" v-if="activity.attachments?.length">
                      <el-tag 
                        v-for="attachment in activity.attachments" 
                        :key="attachment.id"
                        size="small"
                        class="attachment-tag"
                      >
                        <el-icon><Paperclip /></el-icon>
                        {{ attachment.name }}
                      </el-tag>
                    </div>
                  </div>
                </el-timeline-item>
              </el-timeline>
            </div>
          </div>
        </el-col>

        <!-- 右侧信息面板 -->
        <el-col :span="8">
          <!-- 项目基本信息 -->
          <div class="detail-section">
            <div class="section-header">
              <h3>
                <el-icon><InfoFilled /></el-icon>
                基本信息
              </h3>
            </div>
            <div class="info-list">
              <div class="info-item">
                <label>项目ID:</label>
                <span>{{ project.id }}</span>
              </div>
              <div class="info-item">
                <label>创建时间:</label>
                <span>{{ formatDate(project.createTime) }}</span>
              </div>
              <div class="info-item">
                <label>开始时间:</label>
                <span>{{ formatDate(project.startDate) }}</span>
              </div>
              <div class="info-item">
                <label>预计结束:</label>
                <span>{{ formatDate(project.expectedEndDate) }}</span>
              </div>
              <div class="info-item" v-if="project.actualEndDate">
                <label>实际结束:</label>
                <span>{{ formatDate(project.actualEndDate) }}</span>
              </div>
              <div class="info-item">
                <label>更新时间:</label>
                <span>{{ formatDate(project.updateTime) }}</span>
              </div>
              <div class="info-item">
                <label>使用模板:</label>
                <span>{{ project.template?.name || '无' }}</span>
              </div>
            </div>
          </div>

          <!-- 师生信息 -->
          <div class="detail-section">
            <div class="section-header">
              <h3>
                <el-icon><User /></el-icon>
                师生信息
              </h3>
            </div>
            <div class="user-cards">
              <!-- 导师信息 -->
              <div class="user-card mentor-card">
                <div class="user-avatar">
                  <el-avatar 
                    :size="50" 
                    :src="project.mentor.avatar"
                  >
                    {{ project.mentor.name[0] }}
                  </el-avatar>
                </div>
                <div class="user-info">
                  <h4>{{ project.mentor.name }}</h4>
                  <p class="user-role">导师</p>
                  <p class="user-department">{{ project.mentor.department }}</p>
                </div>
                <div class="user-actions">
                  <el-button type="text" size="small">
                    <el-icon><ChatDotRound /></el-icon>
                    沟通
                  </el-button>
                  <el-button type="text" size="small">
                    <el-icon><View /></el-icon>
                    档案
                  </el-button>
                </div>
              </div>

              <!-- 学员信息 -->
              <div class="user-card student-card">
                <div class="user-avatar">
                  <el-avatar 
                    :size="50" 
                    :src="project.student.avatar"
                  >
                    {{ project.student.name[0] }}
                  </el-avatar>
                </div>
                <div class="user-info">
                  <h4>{{ project.student.name }}</h4>
                  <p class="user-role">学员</p>
                  <p class="user-department">{{ project.student.department }}</p>
                </div>
                <div class="user-actions">
                  <el-button type="text" size="small">
                    <el-icon><ChatDotRound /></el-icon>
                    沟通
                  </el-button>
                  <el-button type="text" size="small">
                    <el-icon><TrendCharts /></el-icon>
                    成长档案
                  </el-button>
                </div>
              </div>
            </div>
          </div>

          <!-- 项目标签 -->
          <div class="detail-section">
            <div class="section-header">
              <h3>
                <el-icon><PriceTag /></el-icon>
                项目标签
              </h3>
              <el-button 
                v-if="canEdit" 
                type="text" 
                size="small"
                @click="handleEditTags"
              >
                编辑
              </el-button>
            </div>
            <div class="tags-container">
              <el-tag 
                v-for="tag in project.tags" 
                :key="tag"
                class="project-tag"
                closable
                @close="handleRemoveTag(tag)"
              >
                {{ tag }}
              </el-tag>
            </div>
          </div>

          <!-- 相关资源 -->
          <div class="detail-section">
            <div class="section-header">
              <h3>
                <el-icon><Files /></el-icon>
                相关资源
              </h3>
              <el-button 
                type="text" 
                size="small"
                @click="handleAddResource"
              >
                <el-icon><Plus /></el-icon>
                添加
              </el-button>
            </div>
            <div class="resources-list">
              <div 
                v-for="resource in mockResources" 
                :key="resource.id"
                class="resource-item"
              >
                <div class="resource-icon">
                  <el-icon><Document /></el-icon>
                </div>
                <div class="resource-info">
                  <div class="resource-name">{{ resource.name }}</div>
                  <div class="resource-meta">
                    <span>{{ resource.type }}</span>
                    <span>{{ resource.size }}</span>
                  </div>
                </div>
                <div class="resource-actions">
                  <el-button type="text" size="small">
                    <el-icon><Download /></el-icon>
                  </el-button>
                  <el-button type="text" size="small">
                    <el-icon><View /></el-icon>
                  </el-button>
                </div>
              </div>
            </div>
          </div>
        </el-col>
      </el-row>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { 
  Edit, 
  More, 
  ArrowDown,
  VideoPause,
  VideoPlay,
  Check,
  Box,
  TrendCharts,
  Flag,
  Plus,
  Clock,
  Connection,
  ArrowRight,
  ChatDotRound,
  Paperclip,
  InfoFilled,
  User,
  View,
  PriceTag,
  Files,
  Document,
  Download
} from '@element-plus/icons-vue';
import { ElMessage, ElMessageBox } from 'element-plus';

// Props
interface Props {
  project: any;
  userRole: string;
}

const props = defineProps<Props>();

// Emits
const emit = defineEmits<{
  updateProject: [project: any];
  close: [];
}>();

// 计算属性
const canEdit = computed(() => {
  return ['mentor', 'manager', 'hr', 'academic'].includes(props.userRole);
});

const completedMilestones = computed(() => {
  return props.project.milestones?.filter(m => m.completed).length || 0;
});

const totalMilestones = computed(() => {
  return props.project.milestones?.length || 0;
});

const hasTrainingRelation = computed(() => {
  return props.project.sourceTrainingProject || 
         (props.project.relatedTrainingProjects && props.project.relatedTrainingProjects.length > 0);
});

// 模拟数据
const mockActivities = ref([
  {
    id: 1,
    type: 'milestone',
    title: '完成基础技能掌握里程碑',
    description: '学员已完成Vue3基础语法学习，掌握组件化开发思想',
    author: '张导师',
    createdAt: new Date('2024-01-15'),
    attachments: [
      { id: 1, name: 'Vue3学习笔记.pdf' },
      { id: 2, name: '练习项目代码.zip' }
    ]
  },
  {
    id: 2,
    type: 'communication',
    title: '师生沟通会议',
    description: '讨论了TypeScript学习计划，确定了下一阶段的学习重点',
    author: '李小明',
    createdAt: new Date('2024-01-10'),
    attachments: []
  },
  {
    id: 3,
    type: 'assessment',
    title: '阶段性评估',
    description: '完成了第一阶段的技能评估，成绩良好',
    author: '张导师',
    createdAt: new Date('2024-01-05'),
    attachments: [
      { id: 3, name: '评估报告.pdf' }
    ]
  }
]);

const mockResources = ref([
  {
    id: 1,
    name: 'Vue3开发指南',
    type: 'PDF',
    size: '2.3MB'
  },
  {
    id: 2,
    name: 'TypeScript教程',
    type: 'PDF',
    size: '1.8MB'
  },
  {
    id: 3,
    name: '项目实战视频',
    type: 'MP4',
    size: '256MB'
  }
]);

// 工具函数
const formatDate = (date: Date) => {
  return new Date(date).toLocaleDateString('zh-CN');
};

const formatDateTime = (date: Date) => {
  return new Date(date).toLocaleString('zh-CN');
};

const daysBetween = (date1: Date, date2: Date) => {
  const diffTime = Math.abs(date2.getTime() - date1.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
};

const getStatusTagType = (status: string) => {
  const types = {
    'active': 'success',
    'paused': 'warning',
    'completed': 'info',
    'archived': 'info'
  };
  return types[status] || 'info';
};

const getStatusText = (status: string) => {
  const texts = {
    'active': '进行中',
    'paused': '已暂停',
    'completed': '已完成',
    'archived': '已归档'
  };
  return texts[status] || status;
};

const getPhaseTagType = (phase: string) => {
  const types = {
    'startup': 'primary',
    'execution': 'success',
    'evaluation': 'warning',
    'completion': 'info'
  };
  return types[phase] || 'primary';
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
    'low': 'success'
  };
  return types[priority] || 'info';
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
  if (progress < 30) return '#f56c6c';
  if (progress < 70) return '#e6a23c';
  return '#67c23a';
};

const getActivityType = (type: string) => {
  const types = {
    'milestone': 'primary',
    'communication': 'success',
    'assessment': 'warning',
    'task': 'info'
  };
  return types[type] || 'primary';
};

// 事件处理
const handleEdit = () => {
  ElMessage.info('编辑功能开发中');
};

const handleCommand = (command: string) => {
  switch (command) {
    case 'pause':
      handlePause();
      break;
    case 'resume':
      handleResume();
      break;
    case 'complete':
      handleComplete();
      break;
    case 'archive':
      handleArchive();
      break;
  }
};

const handlePause = async () => {
  try {
    await ElMessageBox.confirm('确定要暂停这个项目吗？', '确认暂停', {
      type: 'warning'
    });
    
    const updatedProject = { ...props.project, status: 'paused' };
    emit('updateProject', updatedProject);
    ElMessage.success('项目已暂停');
  } catch {
    // 用户取消操作
  }
};

const handleResume = () => {
  const updatedProject = { ...props.project, status: 'active' };
  emit('updateProject', updatedProject);
  ElMessage.success('项目已恢复');
};

const handleComplete = async () => {
  try {
    await ElMessageBox.confirm('确定要完成这个项目吗？', '确认完成', {
      type: 'info'
    });
    
    const updatedProject = { 
      ...props.project, 
      status: 'completed',
      progress: 100,
      actualEndDate: new Date()
    };
    emit('updateProject', updatedProject);
    ElMessage.success('项目已完成');
  } catch {
    // 用户取消操作
  }
};

const handleArchive = () => {
  ElMessage.info('归档功能开发中');
};

const handleAddMilestone = () => {
  ElMessage.info('添加里程碑功能开发中');
};

const handleCompleteMilestone = (index: number) => {
  ElMessage.info(`标记里程碑 ${index + 1} 为完成`);
};

const handleEditMilestone = (index: number) => {
  ElMessage.info(`编辑里程碑 ${index + 1}`);
};

const handleAddActivity = () => {
  ElMessage.info('添加活动记录功能开发中');
};

const handleEditTags = () => {
  ElMessage.info('编辑标签功能开发中');
};

const handleRemoveTag = (tag: string) => {
  ElMessage.info(`移除标签: ${tag}`);
};

const handleAddResource = () => {
  ElMessage.info('添加资源功能开发中');
};

onMounted(() => {
  console.log('项目详情组件已加载', props.project);
});
</script>

<style scoped>
.project-details {
  padding: 24px;
  background: #f8f9fa;
  min-height: 100vh;
}

/* 项目头部 */
.project-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 24px;
  padding: 24px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.header-left {
  flex: 1;
}

.project-title h2 {
  margin: 0 0 16px 0;
  font-size: 24px;
  font-weight: 600;
  color: #1f2937;
}

.project-meta {
  display: flex;
  gap: 8px;
  margin-bottom: 16px;
}

.project-description p {
  margin: 0;
  color: #6b7280;
  line-height: 1.6;
}

.action-buttons {
  display: flex;
  gap: 12px;
}

/* 详情内容 */
.project-content {
  margin-top: 24px;
}

.detail-section {
  background: white;
  border-radius: 8px;
  margin-bottom: 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 24px;
  border-bottom: 1px solid #e5e7eb;
}

.section-header h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #1f2937;
  display: flex;
  align-items: center;
  gap: 8px;
}

/* 进度区域 */
.progress-container {
  padding: 24px;
}

.progress-stats {
  display: flex;
  justify-content: space-between;
  margin-bottom: 20px;
}

.stat-item {
  text-align: center;
}

.stat-value {
  display: block;
  font-size: 24px;
  font-weight: 600;
  color: #1f2937;
}

.stat-label {
  font-size: 12px;
  color: #6b7280;
  margin-top: 4px;
}

.progress-bar {
  margin-top: 16px;
}

/* 里程碑 */
.milestone-list {
  padding: 16px 24px;
}

.milestone-item {
  display: flex;
  align-items: center;
  padding: 12px 0;
  border-bottom: 1px solid #f3f4f6;
}

.milestone-item:last-child {
  border-bottom: none;
}

.milestone-icon {
  margin-right: 16px;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.completed-icon {
  color: #10b981;
}

.pending-icon {
  color: #6b7280;
}

.milestone-content {
  flex: 1;
}

.milestone-title {
  font-weight: 500;
  color: #1f2937;
  margin-bottom: 4px;
}

.milestone-date {
  font-size: 12px;
  color: #6b7280;
}

.milestone-item.completed .milestone-title {
  text-decoration: line-through;
  color: #6b7280;
}

.milestone-actions {
  display: flex;
  gap: 8px;
}

/* 培训关联 */
.training-relation {
  padding: 16px 24px;
}

.relation-item {
  margin-bottom: 24px;
}

.relation-item:last-child {
  margin-bottom: 0;
}

.relation-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 16px;
  font-weight: 500;
  color: #1f2937;
}

.relation-content {
  padding-left: 24px;
}

.project-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  margin-bottom: 12px;
}

.project-card:last-child {
  margin-bottom: 0;
}

.project-info h4 {
  margin: 0 0 8px 0;
  font-size: 14px;
  font-weight: 500;
}

.project-info p {
  margin: 0 0 8px 0;
  font-size: 12px;
  color: #6b7280;
}

/* 活动记录 */
.activity-timeline {
  padding: 16px 24px;
}

.activity-content {
  padding-left: 12px;
}

.activity-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.activity-title {
  font-weight: 500;
  color: #1f2937;
}

.activity-author {
  font-size: 12px;
  color: #6b7280;
}

.activity-description {
  color: #6b7280;
  margin-bottom: 12px;
  line-height: 1.5;
}

.activity-attachments {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.attachment-tag {
  cursor: pointer;
}

/* 基本信息 */
.info-list {
  padding: 16px 24px;
}

.info-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
  border-bottom: 1px solid #f3f4f6;
}

.info-item:last-child {
  border-bottom: none;
}

.info-item label {
  font-weight: 500;
  color: #6b7280;
}

.info-item span {
  color: #1f2937;
}

/* 用户卡片 */
.user-cards {
  padding: 16px 24px;
}

.user-card {
  display: flex;
  align-items: center;
  padding: 16px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  margin-bottom: 16px;
}

.user-card:last-child {
  margin-bottom: 0;
}

.user-avatar {
  margin-right: 16px;
}

.user-info {
  flex: 1;
}

.user-info h4 {
  margin: 0 0 4px 0;
  font-size: 16px;
  font-weight: 500;
}

.user-role {
  margin: 0 0 4px 0;
  font-size: 12px;
  color: #6b7280;
}

.user-department {
  margin: 0;
  font-size: 14px;
  color: #374151;
}

.user-actions {
  display: flex;
  gap: 8px;
}

.mentor-card {
  border-left: 4px solid #3b82f6;
}

.student-card {
  border-left: 4px solid #10b981;
}

/* 标签 */
.tags-container {
  padding: 16px 24px;
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.project-tag {
  cursor: pointer;
}

/* 资源列表 */
.resources-list {
  padding: 16px 24px;
}

.resource-item {
  display: flex;
  align-items: center;
  padding: 12px 0;
  border-bottom: 1px solid #f3f4f6;
}

.resource-item:last-child {
  border-bottom: none;
}

.resource-icon {
  margin-right: 12px;
  color: #6b7280;
}

.resource-info {
  flex: 1;
}

.resource-name {
  font-weight: 500;
  color: #1f2937;
  margin-bottom: 4px;
}

.resource-meta {
  font-size: 12px;
  color: #6b7280;
  display: flex;
  gap: 16px;
}

.resource-actions {
  display: flex;
  gap: 8px;
}

/* 响应式设计 */
@media (max-width: 1200px) {
  .project-content .el-col {
    width: 100%;
  }
  
  .project-header {
    flex-direction: column;
    gap: 16px;
  }
  
  .header-right {
    align-self: flex-start;
  }
}

@media (max-width: 768px) {
  .project-details {
    padding: 16px;
  }
  
  .project-header {
    padding: 16px;
  }
  
  .progress-stats {
    flex-direction: column;
    gap: 16px;
  }
  
  .stat-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  
  .stat-value {
    font-size: 18px;
  }
}
</style> 