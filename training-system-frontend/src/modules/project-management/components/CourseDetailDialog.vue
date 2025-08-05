<template>
  <el-dialog
    v-model="innerVisible"
    :title="course?.courseName || '课程详情'"
    width="800px"
    @close="handleClose"
  >
    <div class="course-detail" v-if="course">
      <!-- 课程基本信息 -->
      <div class="detail-section">
        <h3>基本信息</h3>
        <div class="info-grid">
          <div class="info-item">
            <label>课程名称：</label>
            <span>{{ course.courseName }}</span>
          </div>
          <div class="info-item">
            <label>授课讲师：</label>
            <span>{{ course.lecturer }}</span>
          </div>
          <div class="info-item">
            <label>课程类别：</label>
            <el-tag>{{ getCategoryText(course.category) }}</el-tag>
          </div>
          <div class="info-item">
            <label>课程状态：</label>
            <el-tag :type="getStatusColor(course.status)">
              {{ getStatusText(course.status) }}
            </el-tag>
          </div>
          <div class="info-item">
            <label>开始时间：</label>
            <span>{{ formatDateTime(course.startTime) }}</span>
          </div>
          <div class="info-item">
            <label>结束时间：</label>
            <span>{{ formatDateTime(course.endTime) }}</span>
          </div>
          <div class="info-item">
            <label>课程时长：</label>
            <span>{{ course.duration }}分钟</span>
          </div>
          <div class="info-item">
            <label>授课地点：</label>
            <span>{{ course.location || '线上授课' }}</span>
          </div>
        </div>
      </div>

      <!-- 课程描述 -->
      <div class="detail-section" v-if="course.courseDesc">
        <h3>课程简介</h3>
        <div class="description">
          {{ course.courseDesc }}
        </div>
      </div>

      <!-- 讲师信息 -->
      <div class="detail-section" v-if="course.lecturerDesc">
        <h3>讲师简介</h3>
        <div class="description">
          {{ course.lecturerDesc }}
        </div>
      </div>

      <!-- 参与学员 -->
      <div class="detail-section">
        <h3>参与学员 ({{ course.participants?.length || 0 }}人)</h3>
        <div class="participants-list" v-if="course.participants?.length">
          <div class="participant-stats">
            <el-statistic title="总人数" :value="participantStats.total" />
            <el-statistic title="已签到" :value="participantStats.checkedIn" />
            <el-statistic title="出席率" :value="participantStats.attendanceRate" suffix="%" />
            <el-statistic title="互动次数" :value="participantStats.interactions" />
          </div>
          <el-table :data="course.participants" style="margin-top: 16px;">
            <el-table-column prop="name" label="姓名" />
            <el-table-column prop="department" label="部门" />
            <el-table-column prop="position" label="职位" />
            <el-table-column label="签到状态">
              <template #default="{ row }">
                <el-tag :type="row.checkedIn ? 'success' : 'warning'">
                  {{ row.checkedIn ? '已签到' : '未签到' }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="互动次数">
              <template #default="{ row }">
                {{ row.interactions || 0 }}次
              </template>
            </el-table-column>
          </el-table>
        </div>
        <el-empty v-else description="暂无参与学员" />
      </div>

      <!-- 课程资料 -->
      <div class="detail-section">
        <h3>课程资料</h3>
        <div class="materials-list" v-if="course.materials?.length">
          <div
            v-for="material in course.materials"
            :key="material.id"
            class="material-item"
          >
            <el-icon><Document /></el-icon>
            <span class="material-name">{{ material.name }}</span>
            <span class="material-size">{{ material.size }}</span>
            <el-button size="small" type="text" @click="downloadMaterial(material)">
              下载
            </el-button>
          </div>
        </div>
        <el-empty v-else description="暂无课程资料" />
      </div>

      <!-- 课程评价 -->
      <div class="detail-section" v-if="course.status === 'completed'">
        <h3>课程评价</h3>
        <div class="evaluation-summary" v-if="course.rating">
          <div class="rating-overview">
            <div class="rating-score">
              <span class="score">{{ course.rating }}</span>
              <div class="stars">
                <el-rate :model-value="course.rating" disabled />
              </div>
            </div>
            <div class="rating-stats">
              <div class="stat-item">
                <span>内容质量</span>
                <el-rate :model-value="4.5" disabled />
              </div>
              <div class="stat-item">
                <span>讲师表现</span>
                <el-rate :model-value="4.8" disabled />
              </div>
              <div class="stat-item">
                <span>互动效果</span>
                <el-rate :model-value="4.2" disabled />
              </div>
            </div>
          </div>
        </div>
        
        <div class="feedback-list" v-if="courseFeedback.length">
          <h4>学员反馈</h4>
          <div
            v-for="feedback in courseFeedback"
            :key="feedback.id"
            class="feedback-item"
          >
            <div class="feedback-header">
              <span class="student-name">{{ feedback.studentName }}</span>
              <el-rate :model-value="feedback.rating" disabled size="small" />
            </div>
            <div class="feedback-content">{{ feedback.content }}</div>
            <div class="feedback-time">{{ formatDate(feedback.time) }}</div>
          </div>
        </div>
      </div>

      <!-- 实时数据（进行中的课程） -->
      <div class="detail-section" v-if="course.status === 'ongoing'">
        <h3>实时数据</h3>
        <div class="live-stats">
          <el-statistic title="在线人数" :value="course.onlineCount || 0" />
          <el-statistic title="互动次数" :value="course.interactionCount || 0" />
          <el-statistic title="举手提问" :value="course.questionCount || 0" />
          <el-statistic title="课程进度" :value="course.progress || 0" suffix="%" />
        </div>
        
        <div class="live-activities" v-if="liveActivities.length">
          <h4>最近活动</h4>
          <div class="activity-timeline">
            <div
              v-for="activity in liveActivities"
              :key="activity.id"
              class="activity-item"
            >
              <div class="activity-time">{{ formatTime(activity.time) }}</div>
              <div class="activity-content">{{ activity.content }}</div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <template #footer>
      <div class="dialog-footer">
        <el-button @click="handleClose">关闭</el-button>
        <el-button
          v-if="course?.status === 'ongoing'"
          type="primary"
          @click="enterLiveMode"
        >
          进入授课
        </el-button>
        <el-button
          v-else-if="course?.status === 'completed'"
          type="success"
          @click="downloadReport"
        >
          下载报告
        </el-button>
        <el-button type="text" @click="editCourse">编辑课程</el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { Document } from '@element-plus/icons-vue'

const props = defineProps<{
  visible: boolean
  course: any
}>()

const emit = defineEmits<{
  (e: 'update:visible', value: boolean): void
  (e: 'enter-live', course: any): void
  (e: 'edit', course: any): void
}>()

// 内部可见性状态
const innerVisible = ref(props.visible)
watch(() => props.visible, (val) => {
  innerVisible.value = val
})
watch(innerVisible, (val) => {
  emit('update:visible', val)
})

// 模拟数据
const courseFeedback = ref([
  {
    id: '1',
    studentName: '张三',
    rating: 5,
    content: '课程内容非常实用，讲师讲解清晰，受益匪浅。',
    time: '2024-01-20T15:30:00'
  },
  {
    id: '2',
    studentName: '李四',
    content: '项目实战部分很有帮助，希望能有更多这样的课程。',
    rating: 4,
    time: '2024-01-20T15:25:00'
  }
])

const liveActivities = ref([
  {
    id: '1',
    content: '张三举手提问',
    time: '2024-01-20T10:15:00'
  },
  {
    id: '2',
    content: '李四发送了消息',
    time: '2024-01-20T10:12:00'
  },
  {
    id: '3',
    content: '开始播放课件第3页',
    time: '2024-01-20T10:10:00'
  }
])

// 计算属性
const participantStats = computed(() => {
  const participants = props.course?.participants || []
  const checkedIn = participants.filter((p: any) => p.checkedIn).length
  const interactions = participants.reduce((sum: number, p: any) => sum + (p.interactions || 0), 0)
  
  return {
    total: participants.length,
    checkedIn,
    attendanceRate: participants.length > 0 ? Math.round((checkedIn / participants.length) * 100) : 0,
    interactions
  }
})

// 工具方法
const getStatusColor = (status: string) => {
  const colors = {
    pending: 'warning',
    ongoing: 'success',
    completed: 'info',
    cancelled: 'danger'
  }
  return colors[status] || 'info'
}

const getStatusText = (status: string) => {
  const texts = {
    pending: '待开始',
    ongoing: '进行中',
    completed: '已结束',
    cancelled: '已取消'
  }
  return texts[status] || status
}

const getCategoryText = (category: string) => {
  const texts = {
    general: '通用课程',
    professional: '专业课程',
    skill: '技能培训',
    management: '管理培训'
  }
  return texts[category] || category
}

const formatDateTime = (dateString: string) => {
  return new Date(dateString).toLocaleString('zh-CN')
}

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('zh-CN')
}

const formatTime = (dateString: string) => {
  return new Date(dateString).toLocaleTimeString('zh-CN', {
    hour: '2-digit',
    minute: '2-digit'
  })
}

// 操作方法
const handleClose = () => {
  innerVisible.value = false
}

const enterLiveMode = () => {
  emit('enter-live', props.course)
  handleClose()
}

const editCourse = () => {
  emit('edit', props.course)
  handleClose()
}

const downloadMaterial = (material: any) => {
  ElMessage.success(`正在下载 ${material.name}`)
  // 实际下载逻辑
}

const downloadReport = () => {
  ElMessage.success('正在生成课程报告...')
  // 实际报告生成逻辑
}
</script>

<style scoped>
.course-detail {
  max-height: 600px;
  overflow-y: auto;
}

.detail-section {
  margin-bottom: 24px;
  padding-bottom: 20px;
  border-bottom: 1px solid #f0f0f0;
}

.detail-section:last-child {
  border-bottom: none;
}

.detail-section h3 {
  margin: 0 0 16px 0;
  font-size: 16px;
  color: #333;
  font-weight: 600;
}

.detail-section h4 {
  margin: 16px 0 12px 0;
  font-size: 14px;
  color: #666;
  font-weight: 500;
}

.info-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.info-item {
  display: flex;
  align-items: center;
  font-size: 14px;
}

.info-item label {
  min-width: 80px;
  color: #666;
  font-weight: 500;
}

.info-item span {
  color: #333;
}

.description {
  font-size: 14px;
  line-height: 1.6;
  color: #333;
  background: #f8f9fa;
  padding: 12px;
  border-radius: 6px;
}

.participant-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 16px;
  margin-bottom: 16px;
}

.materials-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.material-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 12px;
  background: #f8f9fa;
  border-radius: 6px;
  font-size: 14px;
}

.material-name {
  flex: 1;
  color: #333;
}

.material-size {
  color: #999;
  font-size: 12px;
}

.evaluation-summary {
  background: #f8f9fa;
  padding: 16px;
  border-radius: 8px;
  margin-bottom: 16px;
}

.rating-overview {
  display: flex;
  gap: 24px;
  align-items: center;
}

.rating-score {
  text-align: center;
}

.score {
  font-size: 36px;
  font-weight: 600;
  color: #f56c6c;
  display: block;
}

.rating-stats {
  flex: 1;
}

.stat-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
  font-size: 14px;
}

.feedback-list {
  margin-top: 16px;
}

.feedback-item {
  background: #f8f9fa;
  padding: 12px;
  border-radius: 6px;
  margin-bottom: 12px;
}

.feedback-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.student-name {
  font-weight: 500;
  color: #333;
}

.feedback-content {
  font-size: 14px;
  line-height: 1.5;
  color: #333;
  margin-bottom: 8px;
}

.feedback-time {
  font-size: 12px;
  color: #999;
}

.live-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 16px;
  margin-bottom: 16px;
}

.activity-timeline {
  max-height: 200px;
  overflow-y: auto;
}

.activity-item {
  display: flex;
  gap: 12px;
  padding: 8px 0;
  border-bottom: 1px solid #f0f0f0;
}

.activity-item:last-child {
  border-bottom: none;
}

.activity-time {
  min-width: 60px;
  font-size: 12px;
  color: #999;
}

.activity-content {
  font-size: 14px;
  color: #333;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}
</style> 