<template>
  <div class="activity-detail" v-if="activity">
    <!-- 返回按钮 -->
    <div class="back-button">
      <el-button :icon="ArrowLeft" @click="handleBack">
        返回活动列表
      </el-button>
    </div>

    <!-- 活动头部 -->
    <div class="activity-header">
      <div class="header-background">
        <div class="header-content">
          <div class="header-main">
            <div class="activity-type">
              <el-icon :size="20">
                <component :is="getTypeIcon(activity.type)" />
              </el-icon>
              <span>{{ getTypeLabel(activity.type) }}</span>
            </div>
            
            <h1 class="activity-title">{{ activity.title }}</h1>
            <p class="activity-summary">{{ activity.summary }}</p>
            
            <div class="activity-meta">
              <div class="meta-item">
                <el-icon><User /></el-icon>
                <span>{{ activity.organizerName }}</span>
              </div>
              <div class="meta-item">
                <el-icon><Calendar /></el-icon>
                <span>{{ formatDateTime(activity.startTime) }}</span>
              </div>
              <div class="meta-item">
                <el-icon><Clock /></el-icon>
                <span>{{ formatDuration(activity.duration) }}</span>
              </div>
              <div class="meta-item">
                <el-icon><component :is="getFormatIcon(activity.format)" /></el-icon>
                <span>{{ getFormatLabel(activity.format) }}</span>
              </div>
            </div>
            
            <div class="activity-tags">
              <el-tag
                v-for="tag in activity.tags"
                :key="tag"
                type="info"
                effect="light"
              >
                {{ tag }}
              </el-tag>
            </div>
          </div>
          
          <div class="header-actions">
            <div class="status-card">
              <el-tag :type="getStatusTagType(activity.status)" size="large">
                {{ getStatusLabel(activity.status) }}
              </el-tag>
            </div>
            
            <div class="participants-card">
              <div class="participants-count">
                <span class="current">{{ activity.currentParticipants }}</span>
                <span class="separator">/</span>
                <span class="max">{{ activity.maxParticipants || '∞' }}</span>
              </div>
              <div class="participants-label">参与人数</div>
              <div class="participants-bar" v-if="activity.maxParticipants">
                <div 
                  class="participants-progress"
                  :style="{ width: `${(activity.currentParticipants / activity.maxParticipants) * 100}%` }"
                ></div>
              </div>
            </div>
            
            <div class="action-buttons">
              <el-button
                v-if="canRegister"
                type="primary"
                size="large"
                @click="handleRegister"
                :loading="registering"
              >
                {{ isRegistered ? '取消报名' : '立即报名' }}
              </el-button>
              <el-button
                v-else-if="activity.status === 'registration_closed'"
                size="large"
                disabled
              >
                报名已截止
              </el-button>
              <el-button
                v-else-if="activity.status === 'completed'"
                size="large"
                @click="handleViewFeedback"
              >
                查看反馈
              </el-button>
              
              <div class="social-actions">
                <el-button
                  :icon="isLiked ? HeartFilled : Heart"
                  :type="isLiked ? 'danger' : 'default'"
                  @click="handleLike"
                  text
                >
                  {{ activity.likeCount }}
                </el-button>
                <el-button
                  :icon="Share"
                  @click="handleShare"
                  text
                >
                  {{ activity.shareCount }}
                </el-button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 活动内容 -->
    <div class="activity-content">
      <div class="content-main">
        <!-- 活动描述 -->
        <div class="section">
          <h2 class="section-title">活动描述</h2>
          <div class="section-content">
            <p class="activity-description">{{ activity.description }}</p>
          </div>
        </div>

        <!-- 学习目标 -->
        <div class="section" v-if="activity.objectives.length > 0">
          <h2 class="section-title">学习目标</h2>
          <div class="section-content">
            <ul class="objectives-list">
              <li v-for="objective in activity.objectives" :key="objective">
                <el-icon color="#67c23a"><Check /></el-icon>
                {{ objective }}
              </li>
            </ul>
          </div>
        </div>

        <!-- 活动议程 -->
        <div class="section" v-if="activity.agenda.length > 0">
          <h2 class="section-title">活动议程</h2>
          <div class="section-content">
            <div class="agenda-timeline">
              <div
                v-for="(item, index) in activity.agenda"
                :key="item.id"
                class="agenda-item"
              >
                <div class="agenda-time">
                  <div class="time-dot"></div>
                  <div class="time-range">
                    <div class="start-time">{{ formatTime(item.startTime) }}</div>
                    <div class="duration">{{ item.duration }}分钟</div>
                  </div>
                </div>
                <div class="agenda-content">
                  <div class="agenda-header">
                    <h4 class="agenda-title">{{ item.title }}</h4>
                    <el-tag :type="getAgendaTypeTagType(item.type)" size="small">
                      {{ getAgendaTypeLabel(item.type) }}
                    </el-tag>
                  </div>
                  <p v-if="item.description" class="agenda-description">
                    {{ item.description }}
                  </p>
                  <div v-if="item.speakerName" class="agenda-speaker">
                    <el-icon><User /></el-icon>
                    <span>{{ item.speakerName }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 讲师信息 -->
        <div class="section" v-if="activity.speakers.length > 0">
          <h2 class="section-title">讲师介绍</h2>
          <div class="section-content">
            <div class="speakers-grid">
              <div
                v-for="speaker in activity.speakers"
                :key="speaker.id"
                class="speaker-card"
              >
                <div class="speaker-avatar">
                  <el-avatar :size="60" :src="speaker.avatar">
                    <el-icon><User /></el-icon>
                  </el-avatar>
                </div>
                <div class="speaker-info">
                  <h4 class="speaker-name">{{ speaker.name }}</h4>
                  <p class="speaker-title">{{ speaker.title }}</p>
                  <p class="speaker-department">{{ speaker.department }}</p>
                  <p class="speaker-bio">{{ speaker.bio }}</p>
                  <div class="speaker-expertise">
                    <el-tag
                      v-for="skill in speaker.expertise"
                      :key="skill"
                      size="small"
                      type="info"
                      effect="plain"
                    >
                      {{ skill }}
                    </el-tag>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 参与要求 -->
        <div class="section" v-if="activity.prerequisites && activity.prerequisites.length > 0">
          <h2 class="section-title">参与要求</h2>
          <div class="section-content">
            <ul class="prerequisites-list">
              <li v-for="prerequisite in activity.prerequisites" :key="prerequisite">
                <el-icon color="#e6a23c"><Warning /></el-icon>
                {{ prerequisite }}
              </li>
            </ul>
          </div>
        </div>

        <!-- 目标人群 -->
        <div class="section" v-if="activity.targetAudience && activity.targetAudience.length > 0">
          <h2 class="section-title">目标人群</h2>
          <div class="section-content">
            <div class="target-audience">
              <el-tag
                v-for="audience in activity.targetAudience"
                :key="audience"
                type="success"
                effect="light"
              >
                {{ audience }}
              </el-tag>
            </div>
          </div>
        </div>

        <!-- 活动资源 -->
        <div class="section" v-if="activity.resources.length > 0">
          <h2 class="section-title">活动资源</h2>
          <div class="section-content">
            <div class="resources-list">
              <div
                v-for="resource in activity.resources"
                :key="resource.id"
                class="resource-item"
              >
                <div class="resource-icon">
                  <el-icon><component :is="getResourceIcon(resource.type)" /></el-icon>
                </div>
                <div class="resource-info">
                  <h5 class="resource-name">{{ resource.name }}</h5>
                  <p class="resource-description">{{ resource.description }}</p>
                  <div class="resource-meta">
                    <span class="resource-size" v-if="resource.size">
                      {{ formatFileSize(resource.size) }}
                    </span>
                    <span class="resource-downloads">
                      下载: {{ resource.downloadCount }}
                    </span>
                  </div>
                </div>
                <div class="resource-actions">
                  <el-button size="small" @click="handleDownloadResource(resource)">
                    下载
                  </el-button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 侧边栏 -->
      <div class="content-sidebar">
        <!-- 活动信息卡片 -->
        <div class="info-card">
          <h3 class="card-title">活动信息</h3>
          <div class="info-list">
            <div class="info-item">
              <span class="info-label">活动时间</span>
              <span class="info-value">{{ formatDateTimeRange(activity.startTime, activity.endTime) }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">活动形式</span>
              <span class="info-value">{{ getFormatLabel(activity.format) }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">活动地点</span>
              <span class="info-value">{{ getLocationText(activity.location) }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">报名时间</span>
              <span class="info-value">
                {{ formatRegistrationTime(activity.registrationStartTime, activity.registrationEndTime) }}
              </span>
            </div>
            <div class="info-item">
              <span class="info-label">组织者</span>
              <span class="info-value">
                <div class="organizer-info">
                  <el-avatar :size="24" :src="activity.organizerAvatar">
                    <el-icon><User /></el-icon>
                  </el-avatar>
                  <span>{{ activity.organizerName }}</span>
                </div>
              </span>
            </div>
          </div>
        </div>

        <!-- 相关活动 -->
        <div class="related-card" v-if="relatedActivities.length > 0">
          <h3 class="card-title">相关活动</h3>
          <div class="related-list">
            <div
              v-for="relatedActivity in relatedActivities"
              :key="relatedActivity.id"
              class="related-item"
              @click="handleRelatedActivityClick(relatedActivity)"
            >
              <div class="related-info">
                <h5 class="related-title">{{ relatedActivity.title }}</h5>
                <p class="related-meta">
                  {{ formatDateTime(relatedActivity.startTime) }} · 
                  {{ relatedActivity.currentParticipants }}人参与
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- 加载状态 -->
  <div v-else class="loading-container">
    <el-skeleton :rows="5" animated />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  ArrowLeft,
  User,
  Calendar,
  Clock,
  Heart,
  HeartFilled,
  Share,
  Check,
  Warning,
  Document,
  VideoPlay,
  Files,
  Link,
  Monitor,
  OfficeBuilding,
  Connection,
  ChatDotRound,
  Tools,
  Reading,
  Trophy
} from '@element-plus/icons-vue'
import type { KnowledgeActivity, ActivityType, ActivityFormat, ActivityStatus } from '@/types/activity'
import { useActivitiesStore } from '@/stores/activities'

const route = useRoute()
const router = useRouter()
const activitiesStore = useActivitiesStore()

// 响应式状态
const registering = ref(false)
const isLiked = ref(false)
const relatedActivities = ref<KnowledgeActivity[]>([])

// 计算属性
const activity = computed(() => activitiesStore.currentActivity)
const isRegistered = computed(() => 
  activity.value ? activitiesStore.isUserRegistered(activity.value.id) : false
)

const canRegister = computed(() => {
  if (!activity.value) return false
  return activity.value.status === 'registration_open' && 
         !isRegistered.value &&
         (activity.value.currentParticipants < (activity.value.maxParticipants || Infinity))
})

// 方法
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
    community_event: User
  }
  return iconMap[type] || Document
}

const getFormatIcon = (format: ActivityFormat) => {
  const iconMap: Record<ActivityFormat, any> = {
    online: Monitor,
    offline: OfficeBuilding,
    hybrid: Connection
  }
  return iconMap[format] || Monitor
}

const getResourceIcon = (type: string) => {
  const iconMap: Record<string, any> = {
    document: Document,
    video: VideoPlay,
    audio: VideoPlay,
    image: Files,
    link: Link,
    code: Document
  }
  return iconMap[type] || Document
}

const getTypeLabel = (type: ActivityType) => {
  return activitiesStore.getActivityTypeLabel(type)
}

const getFormatLabel = (format: ActivityFormat) => {
  return activitiesStore.getActivityFormatLabel(format)
}

const getStatusLabel = (status: ActivityStatus) => {
  return activitiesStore.getActivityStatusLabel(status)
}

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

const getAgendaTypeLabel = (type: string) => {
  const labels: Record<string, string> = {
    presentation: '演讲',
    discussion: '讨论',
    workshop: '实操',
    break: '休息',
    qa: '问答',
    networking: '交流'
  }
  return labels[type] || type
}

const getAgendaTypeTagType = (type: string) => {
  const typeMap: Record<string, string> = {
    presentation: 'primary',
    discussion: 'success',
    workshop: 'warning',
    break: 'info',
    qa: 'danger',
    networking: 'primary'
  }
  return typeMap[type] || 'default'
}

const formatDateTime = (date: Date) => {
  return new Intl.DateTimeFormat('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(new Date(date))
}

const formatTime = (date: Date) => {
  return new Intl.DateTimeFormat('zh-CN', {
    hour: '2-digit',
    minute: '2-digit'
  }).format(new Date(date))
}

const formatDuration = (minutes: number) => {
  if (minutes < 60) {
    return `${minutes}分钟`
  } else {
    const hours = Math.floor(minutes / 60)
    const remainingMinutes = minutes % 60
    return remainingMinutes > 0 ? `${hours}小时${remainingMinutes}分钟` : `${hours}小时`
  }
}

const formatDateTimeRange = (start: Date, end: Date) => {
  const startDate = new Date(start)
  const endDate = new Date(end)
  
  if (startDate.toDateString() === endDate.toDateString()) {
    return `${formatDateTime(startDate)} - ${formatTime(endDate)}`
  } else {
    return `${formatDateTime(startDate)} - ${formatDateTime(endDate)}`
  }
}

const formatRegistrationTime = (start?: Date, end?: Date) => {
  if (!start || !end) return '随时可报名'
  return `${formatDateTime(start)} - ${formatDateTime(end)}`
}

const getLocationText = (location: any) => {
  switch (location.type) {
    case 'online':
      return `线上 (${location.onlinePlatform || '在线会议'})`
    case 'offline':
      return `${location.venue || '待定'} ${location.room || ''}`
    case 'hybrid':
      return `线上线下混合 (${location.venue || '待定'})`
    default:
      return '待定'
  }
}

const formatFileSize = (bytes: number) => {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

const handleBack = () => {
  router.back()
}

const handleRegister = async () => {
  if (!activity.value) return
  
  if (isRegistered.value) {
    try {
      await ElMessageBox.confirm('确定要取消报名吗？', '确认取消', {
        type: 'warning'
      })
      
      registering.value = true
      await activitiesStore.cancelRegistration(activity.value.id)
      ElMessage.success('取消报名成功')
    } catch (error) {
      if (error !== 'cancel') {
        ElMessage.error('取消报名失败')
      }
    } finally {
      registering.value = false
    }
  } else {
    try {
      registering.value = true
      await activitiesStore.registerActivity(activity.value.id)
      ElMessage.success('报名成功')
    } catch (error) {
      ElMessage.error('报名失败')
    } finally {
      registering.value = false
    }
  }
}

const handleLike = async () => {
  if (!activity.value) return
  
  try {
    if (isLiked.value) {
      await activitiesStore.unlikeActivity(activity.value.id)
      isLiked.value = false
    } else {
      await activitiesStore.likeActivity(activity.value.id)
      isLiked.value = true
    }
  } catch (error) {
    ElMessage.error('操作失败')
  }
}

const handleShare = async () => {
  if (!activity.value) return
  
  try {
    await activitiesStore.shareActivity(activity.value.id)
    const url = `${window.location.origin}${route.fullPath}`
    await navigator.clipboard.writeText(url)
    ElMessage.success('链接已复制到剪贴板')
  } catch (error) {
    ElMessage.error('分享失败')
  }
}

const handleViewFeedback = () => {
  // 跳转到反馈页面
  router.push(`/training-management/knowledge-sharing/activities/${activity.value?.id}/feedback`)
}

const handleDownloadResource = (resource: any) => {
  // 下载资源
  window.open(resource.url, '_blank')
}

const handleRelatedActivityClick = (relatedActivity: KnowledgeActivity) => {
  router.push(`/training-management/knowledge-sharing/activities/${relatedActivity.id}`)
}

// 生命周期
onMounted(async () => {
  const activityId = route.params.id as string
  
  try {
    await activitiesStore.fetchActivityDetail(activityId)
    
    // 获取相关活动
    if (activity.value) {
      relatedActivities.value = activitiesStore.activities
        .filter(a => 
          a.id !== activityId && 
          (a.type === activity.value!.type || 
           a.tags.some(tag => activity.value!.tags.includes(tag)))
        )
        .slice(0, 5)
    }
  } catch (error) {
    ElMessage.error('加载活动详情失败')
    router.push('/training-management/knowledge-sharing/activities')
  }
})
</script>

<style scoped>
.activity-detail {
  min-height: 100vh;
  background: #f8f9fa;
}

.back-button {
  padding: 16px 24px;
  background: white;
  border-bottom: 1px solid #e4e7ed;
}

.activity-header {
  background: white;
  margin-bottom: 24px;
}

.header-background {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 40px 0;
}

.header-content {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 24px;
  display: flex;
  gap: 40px;
  align-items: flex-start;
}

.header-main {
  flex: 1;
}

.activity-type {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 16px;
  opacity: 0.9;
}

.activity-title {
  font-size: 32px;
  font-weight: 700;
  margin: 0 0 12px 0;
  line-height: 1.3;
}

.activity-summary {
  font-size: 18px;
  opacity: 0.9;
  margin: 0 0 24px 0;
  line-height: 1.5;
}

.activity-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 24px;
  margin-bottom: 20px;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 8px;
  opacity: 0.9;
}

.activity-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.header-actions {
  display: flex;
  flex-direction: column;
  gap: 20px;
  min-width: 280px;
}

.status-card,
.participants-card {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  padding: 20px;
  backdrop-filter: blur(10px);
}

.participants-count {
  font-size: 24px;
  font-weight: 700;
  text-align: center;
  margin-bottom: 8px;
}

.participants-count .current {
  color: #67c23a;
}

.participants-count .separator {
  margin: 0 8px;
  opacity: 0.7;
}

.participants-label {
  text-align: center;
  opacity: 0.9;
  margin-bottom: 12px;
}

.participants-bar {
  height: 6px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 3px;
  overflow: hidden;
}

.participants-progress {
  height: 100%;
  background: #67c23a;
  border-radius: 3px;
  transition: width 0.3s ease;
}

.action-buttons {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.social-actions {
  display: flex;
  justify-content: center;
  gap: 16px;
}

.activity-content {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 24px;
  display: grid;
  grid-template-columns: 1fr 300px;
  gap: 32px;
}

.content-main {
  background: white;
  border-radius: 12px;
  padding: 32px;
}

.section {
  margin-bottom: 40px;
}

.section:last-child {
  margin-bottom: 0;
}

.section-title {
  font-size: 20px;
  font-weight: 600;
  color: #303133;
  margin: 0 0 20px 0;
  padding-bottom: 12px;
  border-bottom: 2px solid #f0f2f5;
}

.section-content {
  color: #606266;
  line-height: 1.6;
}

.activity-description {
  font-size: 16px;
  margin: 0;
}

.objectives-list,
.prerequisites-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.objectives-list li,
.prerequisites-list li {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  margin-bottom: 12px;
  padding: 12px;
  background: #f8f9fa;
  border-radius: 8px;
}

.agenda-timeline {
  position: relative;
}

.agenda-timeline::before {
  content: '';
  position: absolute;
  left: 15px;
  top: 0;
  bottom: 0;
  width: 2px;
  background: #e4e7ed;
}

.agenda-item {
  display: flex;
  gap: 20px;
  margin-bottom: 24px;
  position: relative;
}

.agenda-time {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  min-width: 120px;
}

.time-dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: #409eff;
  margin-top: 4px;
  position: relative;
  z-index: 1;
}

.time-range {
  font-size: 14px;
}

.start-time {
  font-weight: 600;
  color: #303133;
}

.duration {
  color: #909399;
  font-size: 12px;
}

.agenda-content {
  flex: 1;
  padding: 8px 0;
}

.agenda-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 8px;
}

.agenda-title {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
  margin: 0;
}

.agenda-description {
  color: #606266;
  margin: 8px 0;
}

.agenda-speaker {
  display: flex;
  align-items: center;
  gap: 6px;
  color: #909399;
  font-size: 14px;
}

.speakers-grid {
  display: grid;
  gap: 24px;
}

.speaker-card {
  display: flex;
  gap: 16px;
  padding: 20px;
  background: #f8f9fa;
  border-radius: 12px;
}

.speaker-info {
  flex: 1;
}

.speaker-name {
  font-size: 18px;
  font-weight: 600;
  color: #303133;
  margin: 0 0 4px 0;
}

.speaker-title {
  color: #409eff;
  font-weight: 500;
  margin: 0 0 4px 0;
}

.speaker-department {
  color: #909399;
  font-size: 14px;
  margin: 0 0 12px 0;
}

.speaker-bio {
  color: #606266;
  margin: 0 0 12px 0;
  line-height: 1.5;
}

.speaker-expertise {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.target-audience {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.resources-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.resource-item {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px;
  background: #f8f9fa;
  border-radius: 8px;
}

.resource-icon {
  width: 40px;
  height: 40px;
  background: #409eff;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
}

.resource-info {
  flex: 1;
}

.resource-name {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
  margin: 0 0 4px 0;
}

.resource-description {
  color: #606266;
  margin: 0 0 8px 0;
  font-size: 14px;
}

.resource-meta {
  display: flex;
  gap: 16px;
  font-size: 12px;
  color: #909399;
}

.content-sidebar {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.info-card,
.related-card {
  background: white;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
}

.card-title {
  font-size: 18px;
  font-weight: 600;
  color: #303133;
  margin: 0 0 20px 0;
}

.info-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.info-label {
  font-size: 14px;
  color: #909399;
}

.info-value {
  font-size: 14px;
  color: #303133;
  font-weight: 500;
}

.organizer-info {
  display: flex;
  align-items: center;
  gap: 8px;
}

.related-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.related-item {
  padding: 12px;
  border-radius: 8px;
  cursor: pointer;
  transition: background-color 0.3s ease;
}

.related-item:hover {
  background: #f8f9fa;
}

.related-title {
  font-size: 14px;
  font-weight: 600;
  color: #303133;
  margin: 0 0 4px 0;
  line-height: 1.4;
}

.related-meta {
  font-size: 12px;
  color: #909399;
  margin: 0;
}

.loading-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 40px 24px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .header-content {
    flex-direction: column;
    gap: 24px;
  }
  
  .header-actions {
    min-width: auto;
    width: 100%;
  }
  
  .activity-content {
    grid-template-columns: 1fr;
    gap: 24px;
  }
  
  .content-main {
    padding: 20px;
  }
  
  .speaker-card {
    flex-direction: column;
    text-align: center;
  }
  
  .agenda-item {
    flex-direction: column;
    gap: 12px;
  }
  
  .agenda-timeline::before {
    display: none;
  }
}
</style> 