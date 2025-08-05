<template>
  <el-dialog
    v-model="innerVisible"
    title="实时授课"
    width="90%"
    top="5vh"
    :close-on-click-modal="false"
    @close="handleClose"
  >
    <div class="live-teaching-container">
      <!-- 左侧主要区域 -->
      <div class="main-area">
        <!-- 授课控制栏 -->
        <div class="teaching-controls">
          <div class="control-left">
            <h3>{{ course?.courseName }}</h3>
            <div class="course-info">
              <span>讲师：{{ course?.lecturer }}</span>
              <span>时长：{{ formatDuration(elapsedTime) }}</span>
              <span class="live-status">
                <span class="live-dot"></span>
                直播中
              </span>
            </div>
          </div>
          <div class="control-right">
            <el-button
              :type="isPaused ? 'success' : 'warning'"
              @click="togglePause"
            >
              {{ isPaused ? '继续授课' : '暂停授课' }}
            </el-button>
            <el-button type="danger" @click="endCourse">
              结束课程
            </el-button>
          </div>
        </div>

        <!-- 教学内容区域 -->
        <div class="teaching-content">
          <el-tabs v-model="activeTab" type="border-card">
            <el-tab-pane label="课件展示" name="slides">
              <div class="slides-area">
                <div class="slide-viewer">
                  <img 
                    v-if="currentSlide"
                    :src="currentSlide.url" 
                    :alt="currentSlide.title"
                    class="slide-image"
                  />
                  <div v-else class="no-slide">
                    <el-icon><Document /></el-icon>
                    <p>请上传课件</p>
                    <el-button type="primary" @click="uploadSlides">
                      上传课件
                    </el-button>
                  </div>
                </div>
                <div class="slide-controls" v-if="slides.length > 0">
                  <el-button
                    :disabled="currentSlideIndex <= 0"
                    @click="previousSlide"
                  >
                    上一页
                  </el-button>
                  <span class="slide-info">
                    {{ currentSlideIndex + 1 }} / {{ slides.length }}
                  </span>
                  <el-button
                    :disabled="currentSlideIndex >= slides.length - 1"
                    @click="nextSlide"
                  >
                    下一页
                  </el-button>
                </div>
              </div>
            </el-tab-pane>

            <el-tab-pane label="白板工具" name="whiteboard">
              <div class="whiteboard-area">
                <div class="whiteboard-tools">
                  <el-button-group>
                    <el-button 
                      :type="drawTool === 'pen' ? 'primary' : ''"
                      @click="setDrawTool('pen')"
                    >
                      <el-icon><Edit /></el-icon>
                      画笔
                    </el-button>
                    <el-button 
                      :type="drawTool === 'eraser' ? 'primary' : ''"
                      @click="setDrawTool('eraser')"
                    >
                      <el-icon><Delete /></el-icon>
                      橡皮
                    </el-button>
                    <el-button @click="clearWhiteboard">
                      <el-icon><RefreshLeft /></el-icon>
                      清空
                    </el-button>
                  </el-button-group>
                  <el-color-picker v-model="drawColor" />
                </div>
                <canvas
                  ref="whiteboardCanvas"
                  class="whiteboard-canvas"
                  @mousedown="startDrawing"
                  @mousemove="draw"
                  @mouseup="stopDrawing"
                  @mouseleave="stopDrawing"
                ></canvas>
              </div>
            </el-tab-pane>

            <el-tab-pane label="屏幕共享" name="screen">
              <div class="screen-share-area">
                <div class="share-controls">
                  <el-button
                    v-if="!isScreenSharing"
                    type="primary"
                    @click="startScreenShare"
                  >
                    开始屏幕共享
                  </el-button>
                  <el-button
                    v-else
                    type="danger"
                    @click="stopScreenShare"
                  >
                    停止屏幕共享
                  </el-button>
                </div>
                <div class="screen-preview" v-if="isScreenSharing">
                  <video ref="screenVideo" autoplay muted></video>
                </div>
              </div>
            </el-tab-pane>
          </el-tabs>
        </div>
      </div>

      <!-- 右侧互动区域 -->
      <div class="interaction-area">
        <!-- 学员列表 -->
        <div class="participants-panel">
          <div class="panel-header">
            <h4>在线学员 ({{ onlineParticipants.length }})</h4>
            <el-button size="small" type="text" @click="refreshParticipants">
              <el-icon><Refresh /></el-icon>
            </el-button>
          </div>
          <div class="participants-list">
            <div
              v-for="participant in onlineParticipants"
              :key="participant.id"
              class="participant-item"
              :class="{ 'speaking': participant.isSpeaking }"
            >
              <el-avatar :size="32" :src="participant.avatar">
                {{ participant.name[0] }}
              </el-avatar>
              <div class="participant-info">
                <span class="name">{{ participant.name }}</span>
                <div class="status">
                  <el-icon v-if="participant.isMuted" color="#f56c6c">
                    <Microphone />
                  </el-icon>
                  <el-icon v-if="participant.hasQuestion" color="#e6a23c">
                    <QuestionFilled />
                  </el-icon>
                </div>
              </div>
              <el-dropdown @command="(action) => handleParticipantAction(action, participant)">
                <el-button size="small" type="text">
                  <el-icon><MoreFilled /></el-icon>
                </el-button>
                <template #dropdown>
                  <el-dropdown-menu>
                    <el-dropdown-item command="mute">静音</el-dropdown-item>
                    <el-dropdown-item command="invite">邀请发言</el-dropdown-item>
                    <el-dropdown-item command="remove" divided>移除</el-dropdown-item>
                  </el-dropdown-menu>
                </template>
              </el-dropdown>
            </div>
          </div>
        </div>

        <!-- 实时互动 -->
        <div class="chat-panel">
          <div class="panel-header">
            <h4>实时讨论</h4>
            <el-badge :value="unreadCount" :hidden="unreadCount === 0">
              <el-icon><ChatDotRound /></el-icon>
            </el-badge>
          </div>
          <div class="chat-messages" ref="chatMessages">
            <div
              v-for="message in chatMessages"
              :key="message.id"
              class="message-item"
              :class="{ 'system': message.type === 'system' }"
            >
              <div class="message-header">
                <span class="sender">{{ message.sender }}</span>
                <span class="time">{{ formatTime(message.time) }}</span>
              </div>
              <div class="message-content">{{ message.content }}</div>
            </div>
          </div>
          <div class="chat-input">
            <el-input
              v-model="newMessage"
              placeholder="输入消息..."
              @keyup.enter="sendMessage"
            >
              <template #append>
                <el-button @click="sendMessage">发送</el-button>
              </template>
            </el-input>
          </div>
        </div>

        <!-- 举手提问 -->
        <div class="questions-panel">
          <div class="panel-header">
            <h4>举手提问</h4>
            <el-badge :value="questionsCount" :hidden="questionsCount === 0">
              <el-icon><QuestionFilled /></el-icon>
            </el-badge>
          </div>
          <div class="questions-list">
            <div
              v-for="question in questions"
              :key="question.id"
              class="question-item"
            >
              <div class="question-header">
                <span class="student">{{ question.student }}</span>
                <span class="time">{{ formatTime(question.time) }}</span>
              </div>
              <div class="question-content">{{ question.content }}</div>
              <div class="question-actions">
                <el-button size="small" type="primary" @click="answerQuestion(question)">
                  回答
                </el-button>
                <el-button size="small" type="text" @click="dismissQuestion(question)">
                  忽略
                </el-button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 上传课件对话框 -->
    <el-dialog v-model="showUploadDialog" title="上传课件" width="500px">
      <el-upload
        drag
        :auto-upload="false"
        :on-change="handleSlideUpload"
        accept=".pdf,.ppt,.pptx"
      >
        <el-icon class="el-icon--upload"><UploadFilled /></el-icon>
        <div class="el-upload__text">
          将课件拖到此处，或<em>点击上传</em>
        </div>
        <template #tip>
          <div class="el-upload__tip">
            支持PDF、PPT、PPTX格式，文件大小不超过50MB
          </div>
        </template>
      </el-upload>
    </el-dialog>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick, onMounted, onUnmounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Document, Edit, Delete, RefreshLeft, Refresh, Microphone,
  QuestionFilled, MoreFilled, ChatDotRound, UploadFilled
} from '@element-plus/icons-vue'

const props = defineProps<{
  visible: boolean
  course: any
}>()

const emit = defineEmits<{
  (e: 'update:visible', value: boolean): void
  (e: 'end', course: any): void
}>()

// 内部可见性状态
const innerVisible = ref(props.visible)
watch(() => props.visible, (val) => {
  innerVisible.value = val
})
watch(innerVisible, (val) => {
  emit('update:visible', val)
})

// 授课状态
const isPaused = ref(false)
const elapsedTime = ref(0)
const timer = ref<number>()

// 标签页状态
const activeTab = ref('slides')

// 课件相关
const slides = ref([
  { id: 1, title: '第一页', url: '/api/placeholder/800/600' },
  { id: 2, title: '第二页', url: '/api/placeholder/800/600' }
])
const currentSlideIndex = ref(0)
const currentSlide = computed(() => slides.value[currentSlideIndex.value])
const showUploadDialog = ref(false)

// 白板相关
const whiteboardCanvas = ref<HTMLCanvasElement>()
const drawTool = ref('pen')
const drawColor = ref('#000000')
const isDrawing = ref(false)

// 屏幕共享
const isScreenSharing = ref(false)
const screenVideo = ref<HTMLVideoElement>()

// 学员列表
const onlineParticipants = ref([
  {
    id: '1',
    name: '张三',
    avatar: '',
    isMuted: false,
    isSpeaking: false,
    hasQuestion: true
  },
  {
    id: '2',
    name: '李四',
    avatar: '',
    isMuted: true,
    isSpeaking: false,
    hasQuestion: false
  }
])

// 聊天消息
const chatMessages = ref([
  {
    id: '1',
    sender: '系统',
    content: '课程开始，欢迎大家！',
    time: new Date(),
    type: 'system'
  },
  {
    id: '2',
    sender: '张三',
    content: '老师好！',
    time: new Date(),
    type: 'user'
  }
])
const newMessage = ref('')
const unreadCount = ref(0)
const chatMessages_ref = ref<HTMLElement>()

// 举手提问
const questions = ref([
  {
    id: '1',
    student: '张三',
    content: '请问这个概念如何理解？',
    time: new Date()
  }
])
const questionsCount = computed(() => questions.value.length)

// 生命周期
onMounted(() => {
  startTimer()
  initWhiteboard()
})

onUnmounted(() => {
  stopTimer()
})

// 计时器
const startTimer = () => {
  timer.value = window.setInterval(() => {
    if (!isPaused.value) {
      elapsedTime.value++
    }
  }, 1000)
}

const stopTimer = () => {
  if (timer.value) {
    clearInterval(timer.value)
  }
}

// 格式化时间
const formatDuration = (seconds: number) => {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = seconds % 60
  
  const pad = (num: number) => num < 10 ? '0' + num : num.toString()
  
  if (hours > 0) {
    return `${hours}:${pad(minutes)}:${pad(secs)}`
  }
  return `${minutes}:${pad(secs)}`
}

const formatTime = (date: Date) => {
  return date.toLocaleTimeString('zh-CN', { 
    hour: '2-digit', 
    minute: '2-digit' 
  })
}

// 授课控制
const togglePause = () => {
  isPaused.value = !isPaused.value
  ElMessage.info(isPaused.value ? '课程已暂停' : '课程已继续')
}

const endCourse = () => {
  ElMessageBox.confirm('确定结束课程吗？', '结束课程', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    stopTimer()
    emit('end', props.course)
  })
}

// 课件控制
const previousSlide = () => {
  if (currentSlideIndex.value > 0) {
    currentSlideIndex.value--
  }
}

const nextSlide = () => {
  if (currentSlideIndex.value < slides.value.length - 1) {
    currentSlideIndex.value++
  }
}

const uploadSlides = () => {
  showUploadDialog.value = true
}

const handleSlideUpload = (file: any) => {
  // 处理课件上传
  ElMessage.success('课件上传成功')
  showUploadDialog.value = false
}

// 白板功能
const initWhiteboard = () => {
  nextTick(() => {
    if (whiteboardCanvas.value) {
      const canvas = whiteboardCanvas.value
      canvas.width = 800
      canvas.height = 600
    }
  })
}

const setDrawTool = (tool: string) => {
  drawTool.value = tool
}

const startDrawing = (e: MouseEvent) => {
  isDrawing.value = true
  draw(e)
}

const draw = (e: MouseEvent) => {
  if (!isDrawing.value || !whiteboardCanvas.value) return
  
  const canvas = whiteboardCanvas.value
  const ctx = canvas.getContext('2d')!
  const rect = canvas.getBoundingClientRect()
  const x = e.clientX - rect.left
  const y = e.clientY - rect.top
  
  ctx.lineWidth = 2
  ctx.lineCap = 'round'
  
  if (drawTool.value === 'pen') {
    ctx.globalCompositeOperation = 'source-over'
    ctx.strokeStyle = drawColor.value
  } else {
    ctx.globalCompositeOperation = 'destination-out'
  }
  
  ctx.lineTo(x, y)
  ctx.stroke()
  ctx.beginPath()
  ctx.moveTo(x, y)
}

const stopDrawing = () => {
  if (!isDrawing.value) return
  isDrawing.value = false
  if (whiteboardCanvas.value) {
    const ctx = whiteboardCanvas.value.getContext('2d')!
    ctx.beginPath()
  }
}

const clearWhiteboard = () => {
  if (whiteboardCanvas.value) {
    const ctx = whiteboardCanvas.value.getContext('2d')!
    ctx.clearRect(0, 0, whiteboardCanvas.value.width, whiteboardCanvas.value.height)
  }
}

// 屏幕共享
const startScreenShare = () => {
  navigator.mediaDevices.getDisplayMedia({
    video: true,
    audio: true
  }).then(stream => {
    if (screenVideo.value) {
      screenVideo.value.srcObject = stream
    }
    
    isScreenSharing.value = true
    ElMessage.success('屏幕共享已开始')
  }).catch(error => {
    ElMessage.error('屏幕共享启动失败')
  })
}

const stopScreenShare = () => {
  if (screenVideo.value?.srcObject) {
    const stream = screenVideo.value.srcObject as MediaStream
    stream.getTracks().forEach(track => track.stop())
    screenVideo.value.srcObject = null
  }
  isScreenSharing.value = false
  ElMessage.info('屏幕共享已停止')
}

// 学员管理
const refreshParticipants = () => {
  ElMessage.info('学员列表已刷新')
}

const handleParticipantAction = (action: string, participant: any) => {
  switch (action) {
    case 'mute':
      participant.isMuted = !participant.isMuted
      ElMessage.info(`${participant.name} 已${participant.isMuted ? '静音' : '取消静音'}`)
      break
    case 'invite':
      ElMessage.info(`已邀请 ${participant.name} 发言`)
      break
    case 'remove':
      ElMessage.info(`${participant.name} 已被移除`)
      break
  }
}

// 聊天功能
const sendMessage = () => {
  if (!newMessage.value.trim()) return
  
  const message = {
    id: Date.now().toString(),
    sender: '讲师',
    content: newMessage.value,
    time: new Date(),
    type: 'teacher'
  }
  
  chatMessages.value.push(message)
  newMessage.value = ''
  
  // 滚动到底部
  nextTick(() => {
    if (chatMessages_ref.value) {
      chatMessages_ref.value.scrollTop = chatMessages_ref.value.scrollHeight
    }
  })
}

// 提问管理
const answerQuestion = (question: any) => {
  ElMessage.success(`正在回答 ${question.student} 的问题`)
  const index = questions.value.findIndex(q => q.id === question.id)
  if (index > -1) {
    questions.value.splice(index, 1)
  }
}

const dismissQuestion = (question: any) => {
  const index = questions.value.findIndex(q => q.id === question.id)
  if (index > -1) {
    questions.value.splice(index, 1)
  }
}

const handleClose = () => {
  stopTimer()
  innerVisible.value = false
}
</script>

<style scoped>
.live-teaching-container {
  display: flex;
  height: 75vh;
  gap: 20px;
}

.main-area {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.teaching-controls {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  background: #f8f9fa;
  border-radius: 8px;
  border: 1px solid #e8e8e8;
}

.control-left h3 {
  margin: 0 0 8px 0;
  color: #333;
}

.course-info {
  display: flex;
  gap: 16px;
  font-size: 14px;
  color: #666;
}

.live-status {
  display: flex;
  align-items: center;
  gap: 6px;
  color: #67c23a;
  font-weight: 500;
}

.live-dot {
  width: 8px;
  height: 8px;
  background: #67c23a;
  border-radius: 50%;
  animation: pulse 2s infinite;
}

.teaching-content {
  flex: 1;
  border: 1px solid #e8e8e8;
  border-radius: 8px;
  overflow: hidden;
}

.slides-area {
  height: 500px;
  display: flex;
  flex-direction: column;
}

.slide-viewer {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f5f5f5;
}

.slide-image {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
}

.no-slide {
  text-align: center;
  color: #999;
}

.no-slide .el-icon {
  font-size: 48px;
  margin-bottom: 16px;
}

.slide-controls {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 16px;
  padding: 12px;
  background: #fff;
  border-top: 1px solid #e8e8e8;
}

.whiteboard-area {
  height: 500px;
  display: flex;
  flex-direction: column;
}

.whiteboard-tools {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: #f8f9fa;
  border-bottom: 1px solid #e8e8e8;
}

.whiteboard-canvas {
  flex: 1;
  border: none;
  cursor: crosshair;
}

.screen-share-area {
  height: 500px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.screen-preview video {
  width: 100%;
  height: auto;
  max-height: 400px;
}

.interaction-area {
  width: 350px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.participants-panel,
.chat-panel,
.questions-panel {
  border: 1px solid #e8e8e8;
  border-radius: 8px;
  background: #fff;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  border-bottom: 1px solid #e8e8e8;
  background: #f8f9fa;
}

.panel-header h4 {
  margin: 0;
  font-size: 14px;
  color: #333;
}

.participants-list {
  max-height: 200px;
  overflow-y: auto;
}

.participant-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  border-bottom: 1px solid #f0f0f0;
}

.participant-item:last-child {
  border-bottom: none;
}

.participant-item.speaking {
  background: #f0f9ff;
  border-left: 3px solid #409eff;
}

.participant-info {
  flex: 1;
}

.participant-info .name {
  font-size: 14px;
  color: #333;
}

.participant-info .status {
  display: flex;
  gap: 4px;
  margin-top: 2px;
}

.chat-panel {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.chat-messages {
  flex: 1;
  max-height: 300px;
  overflow-y: auto;
  padding: 12px;
}

.message-item {
  margin-bottom: 12px;
}

.message-item.system .message-content {
  color: #999;
  font-style: italic;
}

.message-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 4px;
}

.sender {
  font-size: 12px;
  font-weight: 500;
  color: #666;
}

.time {
  font-size: 12px;
  color: #999;
}

.message-content {
  font-size: 14px;
  color: #333;
  line-height: 1.4;
}

.chat-input {
  border-top: 1px solid #e8e8e8;
}

.questions-list {
  max-height: 200px;
  overflow-y: auto;
}

.question-item {
  padding: 12px 16px;
  border-bottom: 1px solid #f0f0f0;
}

.question-item:last-child {
  border-bottom: none;
}

.question-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
}

.student {
  font-size: 12px;
  font-weight: 500;
  color: #666;
}

.question-content {
  font-size: 14px;
  color: #333;
  margin-bottom: 8px;
  line-height: 1.4;
}

.question-actions {
  display: flex;
  gap: 8px;
}

@keyframes pulse {
  0% { opacity: 1; }
  50% { opacity: 0.5; }
  100% { opacity: 1; }
}
</style> 