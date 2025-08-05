<template>
  <div class="activity-card" @click="handleCardClick">
    <div class="activity-card__header">
      <div class="activity-card__type">
        <el-icon :size="16" class="type-icon">
          <component :is="getTypeIcon(activity.type)" />
        </el-icon>
        <span class="type-text">{{ getTypeLabel(activity.type) }}</span>
      </div>
      <div class="activity-card__status">
        <el-tag :type="getStatusTagType(activity.status)" size="small">
          {{ getStatusLabel(activity.status) }}
        </el-tag>
      </div>
    </div>

    <div class="activity-card__content">
      <h3 class="activity-card__title">{{ activity.title }}</h3>
      <p class="activity-card__summary">{{ activity.summary || activity.description }}</p>
      
      <div class="activity-card__meta">
        <div class="meta-item">
          <el-icon :size="14">
            <User />
          </el-icon>
          <span>{{ activity.organizerName }}</span>
        </div>
        <div class="meta-item">
          <el-icon :size="14">
            <Calendar />
          </el-icon>
          <span>{{ formatDateTime(activity.startTime) }}</span>
        </div>
        <div class="meta-item">
          <el-icon :size="14">
            <Clock />
          </el-icon>
          <span>{{ formatDuration(activity.duration) }}</span>
        </div>
        <div class="meta-item">
          <el-icon :size="14">
            <component :is="getFormatIcon(activity.format)" />
          </el-icon>
          <span>{{ getFormatLabel(activity.format) }}</span>
        </div>
      </div>

      <div class="activity-card__tags">
        <el-tag
          v-for="tag in activity.tags.slice(0, 3)"
          :key="tag"
          size="small"
          type="info"
          effect="plain"
        >
          {{ tag }}
        </el-tag>
        <span v-if="activity.tags.length > 3" class="more-tags">
          +{{ activity.tags.length - 3 }}
        </span>
      </div>
    </div>

    <div class="activity-card__footer">
      <div class="activity-card__participants">
        <el-icon :size="16">
          <UserFilled />
        </el-icon>
        <span class="participants-count">
          {{ activity.currentParticipants }}
          <span v-if="activity.maxParticipants">/ {{ activity.maxParticipants }}</span>
        </span>
        <div class="participants-bar" v-if="activity.maxParticipants">
          <div 
            class="participants-progress"
            :style="{ width: `${(activity.currentParticipants / activity.maxParticipants) * 100}%` }"
          ></div>
        </div>
      </div>

      <div class="activity-card__actions">
        <el-button
          v-if="canRegister"
          type="primary"
          size="small"
          @click.stop="handleRegister"
          :loading="registering"
        >
          {{ isRegistered ? '已报名' : '立即报名' }}
        </el-button>
        <el-button
          v-else-if="activity.status === 'registration_closed'"
          size="small"
          disabled
        >
          报名截止
        </el-button>
        <el-button
          v-else-if="activity.status === 'completed'"
          size="small"
          @click.stop="handleViewDetails"
        >
          查看回顾
        </el-button>
        <el-button
          v-else
          size="small"
          @click.stop="handleViewDetails"
        >
          查看详情
        </el-button>

        <div class="action-buttons">
          <el-button
            :icon="isLiked ? StarFilled : Star"
            :type="isLiked ? 'warning' : 'default'"
            size="small"
            text
            @click.stop="handleLike"
          >
            {{ activity.likeCount }}
          </el-button>
          <el-button
            :icon="Share"
            size="small"
            text
            @click.stop="handleShare"
          >
            {{ activity.shareCount }}
          </el-button>
        </div>
      </div>
    </div>

    <!-- 活动状态指示器 -->
    <div class="activity-card__indicator" :class="`indicator--${activity.status}`"></div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  User,
  UserFilled,
  Calendar,
  Clock,
  StarFilled,
  Star,
  Share,
  Document,
  VideoPlay,
  Reading,
  Trophy,
  Tools,
  ChatDotRound,
  Monitor,
  OfficeBuilding,
  Connection
} from '@element-plus/icons-vue'
import type { KnowledgeActivity, ActivityType, ActivityFormat, ActivityStatus } from '@/types/activity'
import { useActivitiesStore } from '@/stores/activities'

interface Props {
  activity: KnowledgeActivity
  showActions?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  showActions: true
})

const router = useRouter()
const activitiesStore = useActivitiesStore()

const registering = ref(false)
const isLiked = ref(false)
const isRegistered = computed(() => activitiesStore.isUserRegistered(props.activity.id))

const canRegister = computed(() => {
  return props.activity.status === 'registration_open' && 
         !isRegistered.value &&
         (props.activity.currentParticipants < (props.activity.maxParticipants || Infinity))
})

// 获取活动类型图标
const getTypeIcon = (type: ActivityType) => {
  const iconMap: Record<ActivityType, any> = {
    knowledge_sharing: Document,
    technical_seminar: ChatDotRound,
    workshop: Tools,
    book_club: Reading,
    project_review: Trophy,
    training_session: VideoPlay,
    hackathon: Trophy,
    mentoring: User,
    community_event: UserFilled
  }
  return iconMap[type] || Document
}

// 获取活动形式图标
const getFormatIcon = (format: ActivityFormat) => {
  const iconMap: Record<ActivityFormat, any> = {
    online: Monitor,
    offline: OfficeBuilding,
    hybrid: Connection
  }
  return iconMap[format] || Monitor
}

// 获取类型标签
const getTypeLabel = (type: ActivityType) => {
  return activitiesStore.getActivityTypeLabel(type)
}

// 获取形式标签
const getFormatLabel = (format: ActivityFormat) => {
  return activitiesStore.getActivityFormatLabel(format)
}

// 获取状态标签
const getStatusLabel = (status: ActivityStatus) => {
  return activitiesStore.getActivityStatusLabel(status)
}

// 获取状态标签类型
const getStatusTagType = (status: ActivityStatus) => {
  const typeMap: Record<ActivityStatus, string> = {
    draft: 'info',
    published: 'success',
    registration_open: 'success',
    registration_closed: 'warning',
    in_progress: 'primary',
    completed: 'success',
    cancelled: 'danger',
    postponed: 'warning'
  }
  return typeMap[status] || 'info'
}

// 格式化日期时间
const formatDateTime = (date: Date) => {
  return new Intl.DateTimeFormat('zh-CN', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(new Date(date))
}

// 格式化持续时间
const formatDuration = (minutes: number) => {
  if (minutes < 60) {
    return `${minutes}分钟`
  } else if (minutes < 1440) {
    const hours = Math.floor(minutes / 60)
    const remainingMinutes = minutes % 60
    return remainingMinutes > 0 ? `${hours}小时${remainingMinutes}分钟` : `${hours}小时`
  } else {
    const days = Math.floor(minutes / 1440)
    const remainingHours = Math.floor((minutes % 1440) / 60)
    return remainingHours > 0 ? `${days}天${remainingHours}小时` : `${days}天`
  }
}

// 处理卡片点击
const handleCardClick = () => {
  router.push(`/training-management/knowledge-sharing/activities/${props.activity.id}`)
}

// 处理报名
const handleRegister = async () => {
  if (isRegistered.value) {
    // 取消报名
    try {
      await ElMessageBox.confirm('确定要取消报名吗？', '确认取消', {
        type: 'warning'
      })
      
      registering.value = true
      await activitiesStore.cancelRegistration(props.activity.id)
      ElMessage.success('取消报名成功')
    } catch (error) {
      if (error !== 'cancel') {
        ElMessage.error('取消报名失败')
      }
    } finally {
      registering.value = false
    }
  } else {
    // 报名
    try {
      registering.value = true
      await activitiesStore.registerActivity(props.activity.id)
      ElMessage.success('报名成功')
    } catch (error) {
      ElMessage.error('报名失败')
    } finally {
      registering.value = false
    }
  }
}

// 处理查看详情
const handleViewDetails = () => {
  router.push(`/training-management/knowledge-sharing/activities/${props.activity.id}`)
}

// 处理点赞
const handleLike = async () => {
  try {
    if (isLiked.value) {
      await activitiesStore.unlikeActivity(props.activity.id)
      isLiked.value = false
    } else {
      await activitiesStore.likeActivity(props.activity.id)
      isLiked.value = true
    }
  } catch (error) {
    ElMessage.error('操作失败')
  }
}

// 处理分享
const handleShare = async () => {
  try {
    await activitiesStore.shareActivity(props.activity.id)
    // 复制链接到剪贴板
    const url = `${window.location.origin}/training-management/knowledge-sharing/activities/${props.activity.id}`
    await navigator.clipboard.writeText(url)
    ElMessage.success('链接已复制到剪贴板')
  } catch (error) {
    ElMessage.error('分享失败')
  }
}
</script>

<style scoped>
.activity-card {
  position: relative;
  background: #fff;
  border-radius: 12px;
  border: 1px solid #e4e7ed;
  padding: 20px;
  cursor: pointer;
  transition: all 0.3s ease;
  overflow: hidden;
}

.activity-card:hover {
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
  transform: translateY(-2px);
  border-color: #409eff;
}

.activity-card__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.activity-card__type {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #606266;
  font-size: 14px;
}

.type-icon {
  color: #409eff;
}

.activity-card__content {
  margin-bottom: 16px;
}

.activity-card__title {
  font-size: 18px;
  font-weight: 600;
  color: #303133;
  margin: 0 0 8px 0;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.activity-card__summary {
  color: #606266;
  font-size: 14px;
  line-height: 1.5;
  margin: 0 0 16px 0;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.activity-card__meta {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-bottom: 12px;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 4px;
  color: #909399;
  font-size: 12px;
}

.meta-item .el-icon {
  color: #c0c4cc;
}

.activity-card__tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  align-items: center;
}

.more-tags {
  color: #909399;
  font-size: 12px;
}

.activity-card__footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 16px;
  border-top: 1px solid #f0f2f5;
}

.activity-card__participants {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
}

.participants-count {
  color: #606266;
  font-size: 14px;
  font-weight: 500;
}

.participants-bar {
  flex: 1;
  height: 4px;
  background: #f0f2f5;
  border-radius: 2px;
  overflow: hidden;
  max-width: 100px;
}

.participants-progress {
  height: 100%;
  background: #409eff;
  border-radius: 2px;
  transition: width 0.3s ease;
}

.activity-card__actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.action-buttons {
  display: flex;
  gap: 4px;
}

.activity-card__indicator {
  position: absolute;
  top: 0;
  left: 0;
  width: 4px;
  height: 100%;
  border-radius: 0 2px 2px 0;
}

.indicator--draft {
  background: #c0c4cc;
}

.indicator--published {
  background: #67c23a;
}

.indicator--registration_open {
  background: #409eff;
}

.indicator--registration_closed {
  background: #e6a23c;
}

.indicator--in_progress {
  background: #409eff;
}

.indicator--completed {
  background: #67c23a;
}

.indicator--cancelled {
  background: #f56c6c;
}

.indicator--postponed {
  background: #e6a23c;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .activity-card {
    padding: 16px;
  }
  
  .activity-card__title {
    font-size: 16px;
  }
  
  .activity-card__meta {
    flex-direction: column;
    gap: 8px;
  }
  
  .activity-card__footer {
    flex-direction: column;
    gap: 12px;
    align-items: stretch;
  }
  
  .activity-card__participants {
    justify-content: center;
  }
  
  .activity-card__actions {
    justify-content: center;
  }
}
</style> 