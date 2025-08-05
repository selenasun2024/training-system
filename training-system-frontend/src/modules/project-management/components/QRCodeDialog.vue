<template>
  <el-dialog
    v-model="visible"
    title="考勤二维码"
    width="500px"
    :before-close="handleClose"
    class="qrcode-dialog"
  >
    <div class="qrcode-content">
      <!-- 二维码展示区 -->
      <div class="qrcode-display">
        <div class="qrcode-container">
          <div class="qrcode-placeholder">
            <img 
              v-if="qrCodeUrl" 
              :src="qrCodeUrl" 
              alt="考勤二维码"
              class="qrcode-image"
            />
            <div v-else class="qrcode-loading">
              <el-icon size="48" class="is-loading"><Loading /></el-icon>
              <p>生成中...</p>
            </div>
          </div>
          
          <!-- 二维码信息 -->
          <div class="qrcode-info">
            <h3>{{ attendanceTitle }}</h3>
            <p class="info-item">
              <el-icon><LocationFilled /></el-icon>
              {{ attendanceLocation }}
            </p>
            <p class="info-item">
              <el-icon><Clock /></el-icon>
              {{ formatTimeRange(startTime, endTime) }}
            </p>
          </div>
        </div>
      </div>

      <!-- 设置选项 -->
      <div class="qrcode-settings">
        <el-card>
          <template #header>
            <span>二维码设置</span>
          </template>
          
          <div class="setting-item">
            <span class="setting-label">有效期：</span>
            <el-select v-model="validityPeriod" @change="regenerateQRCode">
              <el-option label="5分钟" value="5" />
              <el-option label="10分钟" value="10" />
              <el-option label="30分钟" value="30" />
              <el-option label="1小时" value="60" />
              <el-option label="永久有效" value="-1" />
            </el-select>
          </div>
          
          <div class="setting-item">
            <span class="setting-label">刷新间隔：</span>
            <el-switch
              v-model="autoRefresh"
              active-text="自动刷新"
              @change="toggleAutoRefresh"
            />
          </div>
          
          <div class="setting-item" v-if="autoRefresh">
            <span class="setting-label">刷新频率：</span>
            <el-select v-model="refreshInterval" @change="updateRefreshInterval">
              <el-option label="30秒" value="30" />
              <el-option label="1分钟" value="60" />
              <el-option label="5分钟" value="300" />
            </el-select>
          </div>
        </el-card>
      </div>

      <!-- 状态信息 -->
      <div class="qrcode-status">
        <el-card>
          <template #header>
            <span>实时状态</span>
          </template>
          
          <div class="status-grid">
            <div class="status-item">
              <span class="status-label">生成时间：</span>
              <span class="status-value">{{ formatTime(generateTime) }}</span>
            </div>
            
            <div class="status-item" v-if="validityPeriod !== '-1'">
              <span class="status-label">过期时间：</span>
              <span class="status-value">{{ formatTime(expiryTime) }}</span>
            </div>
            
            <div class="status-item">
              <span class="status-label">剩余时间：</span>
              <span class="status-value" :class="{ 'text-danger': remainingTime < 300 }">
                {{ remainingTimeText }}
              </span>
            </div>
            
            <div class="status-item">
              <span class="status-label">扫码次数：</span>
              <span class="status-value">{{ scanCount }}</span>
            </div>
          </div>
          
          <!-- 进度条 -->
          <div class="validity-progress" v-if="validityPeriod !== '-1'">
            <el-progress 
              :percentage="validityProgress" 
              :color="progressColor"
              :show-text="false"
              :stroke-width="6"
            />
          </div>
        </el-card>
      </div>

      <!-- 操作按钮 -->
      <div class="qrcode-actions">
        <el-button @click="regenerateQRCode">
          <el-icon><Refresh /></el-icon>
          重新生成
        </el-button>
        <el-button type="success" @click="downloadQRCode">
          <el-icon><Download /></el-icon>
          下载二维码
        </el-button>
        <el-button type="info" @click="shareQRCode">
          <el-icon><Share /></el-icon>
          分享链接
        </el-button>
      </div>

      <!-- 使用说明 -->
      <div class="usage-tips">
        <el-alert
          title="使用说明"
          type="info"
          :closable="false"
          show-icon
        >
          <template #default>
            <ol>
              <li>请在有效期内使用二维码进行签到</li>
              <li>二维码每次扫描后会自动记录签到信息</li>
              <li>如需延长使用时间，请点击重新生成</li>
              <li>建议在签到开始前5-10分钟展示二维码</li>
            </ol>
          </template>
        </el-alert>
      </div>
    </div>

    <template #footer>
      <div class="dialog-footer">
        <el-button @click="handleClose">关闭</el-button>
        <el-button type="primary" @click="startAttendance">开始考勤</el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { ElMessage } from 'element-plus'
import { 
  Loading, LocationFilled, Clock, Refresh, 
  Download, Share 
} from '@element-plus/icons-vue'

interface Props {
  modelValue: boolean
  attendanceId?: string
  attendanceTitle?: string
  attendanceLocation?: string
  startTime?: string
  endTime?: string
}

interface Emits {
  (e: 'update:modelValue', value: boolean): void
}

const props = withDefaults(defineProps<Props>(), {
  attendanceTitle: '考勤签到',
  attendanceLocation: '培训中心',
  startTime: '',
  endTime: ''
})

const emit = defineEmits<Emits>()

const visible = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

const qrCodeUrl = ref('')
const validityPeriod = ref('30') // 分钟
const autoRefresh = ref(false)
const refreshInterval = ref('60') // 秒
const generateTime = ref(new Date())
const scanCount = ref(0)
const refreshTimer = ref<number>()
const countdownTimer = ref<number>()

// 计算属性
const expiryTime = computed(() => {
  if (validityPeriod.value === '-1') return null
  const expiry = new Date(generateTime.value)
  expiry.setMinutes(expiry.getMinutes() + parseInt(validityPeriod.value))
  return expiry
})

const remainingTime = computed(() => {
  if (validityPeriod.value === '-1') return Infinity
  if (!expiryTime.value) return 0
  
  const now = new Date()
  const remaining = Math.max(0, Math.floor((expiryTime.value.getTime() - now.getTime()) / 1000))
  return remaining
})

const remainingTimeText = computed(() => {
  if (validityPeriod.value === '-1') return '永久有效'
  
  const total = remainingTime.value
  if (total <= 0) return '已过期'
  
  const hours = Math.floor(total / 3600)
  const minutes = Math.floor((total % 3600) / 60)
  const seconds = total % 60
  
  if (hours > 0) {
    return `${hours}小时${minutes}分钟`
  } else if (minutes > 0) {
    return `${minutes}分钟${seconds}秒`
  } else {
    return `${seconds}秒`
  }
})

const validityProgress = computed(() => {
  if (validityPeriod.value === '-1') return 100
  
  const totalSeconds = parseInt(validityPeriod.value) * 60
  const remaining = remainingTime.value
  return Math.max(0, Math.round((remaining / totalSeconds) * 100))
})

const progressColor = computed(() => {
  const progress = validityProgress.value
  if (progress > 50) return '#67c23a'
  if (progress > 20) return '#e6a23c'
  return '#f56c6c'
})

// 方法
const formatTime = (time: Date) => {
  return time.toLocaleString('zh-CN')
}

const formatTimeRange = (start: string, end: string) => {
  if (!start || !end) return '时间待定'
  const startTime = new Date(start).toLocaleTimeString('zh-CN', { 
    hour: '2-digit', 
    minute: '2-digit' 
  })
  const endTime = new Date(end).toLocaleTimeString('zh-CN', { 
    hour: '2-digit', 
    minute: '2-digit' 
  })
  return `${startTime} - ${endTime}`
}

const generateQRCode = () => {
  // 模拟生成二维码
  generateTime.value = new Date()
  
  // 这里应该调用后端API生成真实的二维码
  // 暂时使用模拟数据
  const qrData = {
    attendanceId: props.attendanceId,
    timestamp: generateTime.value.getTime(),
    validity: validityPeriod.value
  }
  
  // 模拟生成二维码URL (实际应该是真实的二维码图片)
  qrCodeUrl.value = '/src/assets/images/qr-code-mock.png'
  
  ElMessage.success('二维码生成成功')
}

const regenerateQRCode = () => {
  qrCodeUrl.value = ''
  setTimeout(() => {
    generateQRCode()
  }, 1000)
}

const downloadQRCode = () => {
  ElMessage.success('下载功能开发中')
}

const shareQRCode = () => {
  // 模拟分享链接
  const shareUrl = `${window.location.origin}/attendance/${props.attendanceId}`
  navigator.clipboard?.writeText(shareUrl).then(() => {
    ElMessage.success('分享链接已复制到剪贴板')
  }).catch(() => {
    ElMessage.info('请手动复制分享链接')
  })
}

const startAttendance = () => {
  ElMessage.success('考勤已开始')
  emit('update:modelValue', false)
}

const toggleAutoRefresh = () => {
  if (autoRefresh.value) {
    startAutoRefresh()
  } else {
    stopAutoRefresh()
  }
}

const updateRefreshInterval = () => {
  if (autoRefresh.value) {
    stopAutoRefresh()
    startAutoRefresh()
  }
}

const startAutoRefresh = () => {
  const interval = parseInt(refreshInterval.value) * 1000
  refreshTimer.value = window.setInterval(() => {
    regenerateQRCode()
  }, interval)
}

const stopAutoRefresh = () => {
  if (refreshTimer.value) {
    clearInterval(refreshTimer.value)
    refreshTimer.value = undefined
  }
}

const startCountdown = () => {
  countdownTimer.value = window.setInterval(() => {
    // 强制更新计算属性
    if (remainingTime.value <= 0 && validityPeriod.value !== '-1') {
      ElMessage.warning('二维码已过期，请重新生成')
      stopCountdown()
    }
  }, 1000)
}

const stopCountdown = () => {
  if (countdownTimer.value) {
    clearInterval(countdownTimer.value)
    countdownTimer.value = undefined
  }
}

const handleClose = () => {
  stopAutoRefresh()
  stopCountdown()
  emit('update:modelValue', false)
}

onMounted(() => {
  generateQRCode()
  startCountdown()
})

onUnmounted(() => {
  stopAutoRefresh()
  stopCountdown()
})
</script>

<style scoped>
.qrcode-dialog :deep(.el-dialog__body) {
  padding: 0 20px 20px;
}

.qrcode-content {
  space-y: 24px;
}

.qrcode-display {
  text-align: center;
  margin-bottom: 24px;
}

.qrcode-container {
  display: inline-block;
  padding: 24px;
  border: 2px dashed #dcdfe6;
  border-radius: 8px;
  background: #fafbfc;
}

.qrcode-placeholder {
  width: 200px;
  height: 200px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 16px;
}

.qrcode-image {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.qrcode-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  color: #999;
}

.qrcode-info h3 {
  margin: 0 0 8px 0;
  font-size: 18px;
  color: #303133;
}

.info-item {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  margin: 4px 0;
  color: #666;
  font-size: 14px;
}

.qrcode-settings,
.qrcode-status {
  margin-bottom: 20px;
}

.setting-item {
  display: flex;
  align-items: center;
  margin-bottom: 16px;
}

.setting-item:last-child {
  margin-bottom: 0;
}

.setting-label {
  width: 80px;
  color: #666;
  flex-shrink: 0;
}

.status-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  margin-bottom: 16px;
}

.status-item {
  display: flex;
  justify-content: space-between;
}

.status-label {
  color: #666;
}

.status-value {
  font-weight: 500;
}

.text-danger {
  color: #f56c6c;
}

.validity-progress {
  margin-top: 12px;
}

.qrcode-actions {
  display: flex;
  justify-content: center;
  gap: 12px;
  margin-bottom: 20px;
}

.usage-tips {
  margin-bottom: 20px;
}

.usage-tips ol {
  margin: 0;
  padding-left: 20px;
}

.usage-tips li {
  margin-bottom: 4px;
  color: #666;
  font-size: 13px;
}

.dialog-footer {
  text-align: right;
}
</style> 