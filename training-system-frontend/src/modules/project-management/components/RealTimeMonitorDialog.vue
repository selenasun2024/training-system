<template>
  <el-dialog
    v-model="visible"
    title="实时监控"
    width="90%"
    :before-close="handleClose"
    @close="handleClose"
    class="realtime-monitor-dialog"
  >
    <div class="monitor-content">
      <!-- 统计概览 -->
      <div class="monitor-stats">
        <el-card class="stat-card">
          <el-statistic title="在线人数" :value="realtimeData.onlineCount" />
          <div class="stat-footer">
            <span class="live-indicator">
              <span class="live-dot"></span>
              实时更新
            </span>
          </div>
        </el-card>
        
        <el-card class="stat-card">
          <el-statistic title="签到进度" :value="realtimeData.checkinRate" suffix="%" />
          <div class="stat-footer">
            {{ realtimeData.checkedInCount }}/{{ realtimeData.totalCount }}
          </div>
        </el-card>
        
        <el-card class="stat-card">
          <el-statistic title="正常签到" :value="realtimeData.normalCount" />
          <div class="stat-footer text-success">
            正常率 {{ normalRate }}%
          </div>
        </el-card>
        
        <el-card class="stat-card">
          <el-statistic title="异常情况" :value="realtimeData.abnormalCount" />
          <div class="stat-footer text-danger">
            需要关注
          </div>
        </el-card>
      </div>

      <!-- 实时签到流 -->
      <div class="monitor-sections">
        <div class="monitor-left">
          <el-card class="checkin-stream">
            <template #header>
              <div class="card-header">
                <span>实时签到流</span>
                <el-switch v-model="autoRefresh" active-text="自动刷新" />
              </div>
            </template>
            
            <div class="stream-container">
              <div
                v-for="record in recentCheckins"
                :key="record.id"
                class="stream-item"
                :class="record.status"
              >
                <div class="user-avatar">
                  <el-avatar :src="record.avatar" :icon="UserFilled" />
                </div>
                <div class="checkin-info">
                  <div class="user-name">{{ record.userName }}</div>
                  <div class="checkin-method">
                    <el-tag :type="getMethodType(record.method)" size="small">
                      {{ getMethodText(record.method) }}
                    </el-tag>
                  </div>
                  <div class="checkin-time">{{ formatTime(record.checkinTime) }}</div>
                </div>
                <div class="checkin-status">
                  <el-tag :type="getStatusType(record.status)" size="small">
                    {{ getStatusText(record.status) }}
                  </el-tag>
                </div>
              </div>
            </div>
          </el-card>
        </div>

        <div class="monitor-right">
          <!-- 地理位置监控 -->
          <el-card class="location-monitor">
            <template #header>
              <span>地理位置监控</span>
            </template>
            <div class="location-stats">
              <div class="stat-item">
                <span class="label">正常范围内：</span>
                <span class="value text-success">{{ realtimeData.inRangeCount }}</span>
              </div>
              <div class="stat-item">
                <span class="label">超出范围：</span>
                <span class="value text-warning">{{ realtimeData.outRangeCount }}</span>
              </div>
              <div class="stat-item">
                <span class="label">位置异常：</span>
                <span class="value text-danger">{{ realtimeData.locationErrorCount }}</span>
              </div>
            </div>
          </el-card>

          <!-- 异常处理 -->
          <el-card class="exception-handling">
            <template #header>
              <span>异常处理</span>
            </template>
            <div class="exception-list">
              <div
                v-for="exception in exceptions"
                :key="exception.id"
                class="exception-item"
              >
                <div class="exception-info">
                  <div class="exception-type">{{ exception.type }}</div>
                  <div class="exception-desc">{{ exception.description }}</div>
                </div>
                <el-button size="small" type="primary" @click="handleException(exception)">
                  处理
                </el-button>
              </div>
            </div>
          </el-card>
        </div>
      </div>
    </div>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { ElMessage } from 'element-plus'
import { UserFilled } from '@element-plus/icons-vue'

interface Props {
  modelValue: boolean
  attendanceId?: string
}

interface Emits {
  (e: 'update:modelValue', value: boolean): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const visible = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

const autoRefresh = ref(true)
const refreshTimer = ref<number>()

// 实时数据
const realtimeData = ref({
  onlineCount: 0,
  totalCount: 25,
  checkedInCount: 18,
  normalCount: 15,
  abnormalCount: 3,
  inRangeCount: 16,
  outRangeCount: 2,
  locationErrorCount: 1,
  checkinRate: 0
})

// 最近签到记录
const recentCheckins = ref([
  {
    id: '1',
    userName: '张三',
    avatar: '',
    method: 'qr',
    status: 'normal',
    checkinTime: new Date()
  },
  {
    id: '2',
    userName: '李四',
    avatar: '',
    method: 'location',
    status: 'late',
    checkinTime: new Date(Date.now() - 2 * 60 * 1000)
  },
  {
    id: '3',
    userName: '王五',
    avatar: '',
    method: 'face',
    status: 'normal',
    checkinTime: new Date(Date.now() - 5 * 60 * 1000)
  }
])

// 异常情况
const exceptions = ref([
  {
    id: '1',
    type: '位置异常',
    description: '李四签到位置超出允许范围'
  },
  {
    id: '2',
    type: '重复签到',
    description: '王五尝试重复签到'
  }
])

// 计算属性
const normalRate = computed(() => {
  return realtimeData.value.totalCount > 0 
    ? Math.round((realtimeData.value.normalCount / realtimeData.value.checkedInCount) * 100) 
    : 0
})

// 方法
const getMethodType = (method: string) => {
  const types = {
    qr: 'primary',
    location: 'success',
    face: 'warning',
    manual: 'info'
  }
  return types[method] || 'info'
}

const getMethodText = (method: string) => {
  const texts = {
    qr: '二维码',
    location: '位置',
    face: '人脸',
    manual: '手动'
  }
  return texts[method] || method
}

const getStatusType = (status: string) => {
  const types = {
    normal: 'success',
    late: 'warning',
    exception: 'danger'
  }
  return types[status] || 'info'
}

const getStatusText = (status: string) => {
  const texts = {
    normal: '正常',
    late: '迟到',
    exception: '异常'
  }
  return texts[status] || status
}

const formatTime = (time: Date) => {
  return time.toLocaleTimeString('zh-CN', { 
    hour: '2-digit', 
    minute: '2-digit',
    second: '2-digit'
  })
}

const handleException = (exception: any) => {
  ElMessage.success('异常处理功能开发中')
}

const refreshData = () => {
  // 模拟数据更新
  realtimeData.value.checkinRate = realtimeData.value.totalCount > 0 
    ? Math.round((realtimeData.value.checkedInCount / realtimeData.value.totalCount) * 100) 
    : 0
}

const startAutoRefresh = () => {
  if (autoRefresh.value) {
    refreshTimer.value = window.setInterval(() => {
      refreshData()
    }, 5000)
  }
}

const stopAutoRefresh = () => {
  if (refreshTimer.value) {
    clearInterval(refreshTimer.value)
    refreshTimer.value = undefined
  }
}

const handleClose = () => {
  stopAutoRefresh()
  emit('update:modelValue', false)
}

onMounted(() => {
  refreshData()
  startAutoRefresh()
})

onUnmounted(() => {
  stopAutoRefresh()
})
</script>

<style scoped>
.realtime-monitor-dialog :deep(.el-dialog__body) {
  padding: 0 20px 20px;
}

.monitor-stats {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  margin-bottom: 24px;
}

.stat-card {
  text-align: center;
}

.stat-footer {
  margin-top: 8px;
  font-size: 12px;
  color: #666;
}

.live-indicator {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
}

.live-dot {
  width: 6px;
  height: 6px;
  background: #67c23a;
  border-radius: 50%;
  animation: pulse 1.5s infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

.monitor-sections {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 24px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.stream-container {
  max-height: 400px;
  overflow-y: auto;
}

.stream-item {
  display: flex;
  align-items: center;
  padding: 12px 0;
  border-bottom: 1px solid #f0f0f0;
}

.stream-item:last-child {
  border-bottom: none;
}

.user-avatar {
  margin-right: 12px;
}

.checkin-info {
  flex: 1;
}

.user-name {
  font-weight: 500;
  margin-bottom: 4px;
}

.checkin-method {
  margin-bottom: 4px;
}

.checkin-time {
  font-size: 12px;
  color: #999;
}

.location-monitor,
.exception-handling {
  margin-bottom: 16px;
}

.location-stats,
.exception-list {
  space-y: 8px;
}

.stat-item {
  display: flex;
  justify-content: space-between;
  padding: 8px 0;
}

.exception-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px;
  background: #f9f9f9;
  border-radius: 4px;
  margin-bottom: 8px;
}

.exception-info {
  flex: 1;
}

.exception-type {
  font-weight: 500;
  color: #e6a23c;
}

.exception-desc {
  font-size: 12px;
  color: #666;
  margin-top: 4px;
}

.text-success { color: #67c23a; }
.text-warning { color: #e6a23c; }
.text-danger { color: #f56c6c; }
</style> 