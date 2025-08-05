<template>
  <div class="attendance-management">
    <!-- 页面头部 -->
    <div class="page-header">
      <div class="header-content">
        <h1>考勤管理</h1>
        <p>管理培训考勤的多种签到方式、实时监控和数据统计</p>
      </div>
      <div class="header-actions">
        <el-button type="primary" @click="createAttendance">
          <el-icon><Plus /></el-icon>
          创建考勤
        </el-button>
        <el-button @click="exportAttendanceData">
          <el-icon><Download /></el-icon>
          导出数据
        </el-button>
        <el-button @click="showRealTimeMonitor">
          <el-icon><Monitor /></el-icon>
          实时监控
        </el-button>
      </div>
    </div>

    <!-- 实时状态概览 -->
    <div class="realtime-overview">
      <el-card class="overview-card active-card">
        <div class="card-header">
          <h3>进行中的考勤</h3>
          <el-badge :value="activeAttendances.length" type="primary">
            <el-icon><Timer /></el-icon>
          </el-badge>
        </div>
        <div class="active-list">
          <div
            v-for="attendance in activeAttendances"
            :key="attendance.id"
            class="active-item"
            @click="viewAttendanceDetail(attendance)"
          >
            <div class="attendance-info">
              <h4>{{ attendance.title }}</h4>
              <p>{{ attendance.location }}</p>
            </div>
            <div class="attendance-stats">
              <div class="stat-item">
                <span class="label">已签到</span>
                <span class="value">{{ attendance.checkedInCount }}/{{ attendance.totalCount }}</span>
              </div>
              <div class="progress-bar">
                <el-progress
                  :percentage="getAttendanceProgress(attendance)"
                  :color="getProgressColor(attendance)"
                  :stroke-width="4"
                  :show-text="false"
                />
              </div>
            </div>
          </div>
        </div>
      </el-card>

      <el-card class="overview-card">
        <el-statistic title="今日考勤次数" :value="todayStats.total" />
        <div class="stats-detail">
          <span>完成率：{{ todayStats.completionRate }}%</span>
        </div>
      </el-card>

      <el-card class="overview-card">
        <el-statistic title="在线签到人数" :value="realtimeStats.onlineUsers" />
        <div class="stats-detail">
          <span class="live-indicator">
            <span class="live-dot"></span>
            实时更新
          </span>
        </div>
      </el-card>

      <el-card class="overview-card">
        <el-statistic title="异常考勤" :value="realtimeStats.abnormalCount" />
        <div class="stats-detail">
          <span style="color: #f56c6c;">需要处理</span>
        </div>
      </el-card>
    </div>

    <!-- 筛选和搜索 -->
    <div class="filter-section">
      <div class="filter-left">
        <el-select v-model="filterStatus" placeholder="考勤状态" clearable style="width: 150px">
          <el-option label="全部" value="" />
          <el-option label="准备中" value="preparing" />
          <el-option label="进行中" value="active" />
          <el-option label="已结束" value="ended" />
          <el-option label="已取消" value="cancelled" />
        </el-select>
        <el-select v-model="filterMethod" placeholder="签到方式" clearable style="width: 150px">
          <el-option label="全部" value="" />
          <el-option label="二维码" value="qr" />
          <el-option label="位置签到" value="location" />
          <el-option label="人脸识别" value="face" />
          <el-option label="手动签到" value="manual" />
          <el-option label="组合方式" value="multiple" />
        </el-select>
        <el-date-picker
          v-model="filterDate"
          type="daterange"
          range-separator="至"
          start-placeholder="开始日期"
          end-placeholder="结束日期"
          style="width: 240px"
        />
      </div>
      <div class="filter-right">
        <el-input
          v-model="searchKeyword"
          placeholder="搜索考勤标题或地点"
          style="width: 300px"
          clearable
        >
          <template #prefix>
            <el-icon><Search /></el-icon>
          </template>
        </el-input>
      </div>
    </div>

    <!-- 考勤列表 -->
    <div class="attendance-list">
      <div class="list-header">
        <h3>考勤列表</h3>
        <div class="view-controls">
          <el-radio-group v-model="viewMode" size="small">
            <el-radio-button label="card">卡片视图</el-radio-button>
            <el-radio-button label="table">表格视图</el-radio-button>
          </el-radio-group>
        </div>
      </div>

      <!-- 卡片视图 -->
      <div v-if="viewMode === 'card'" class="attendance-cards">
        <div
          v-for="attendance in filteredAttendances"
          :key="attendance.id"
          class="attendance-card"
          :class="{ 'active': attendance.status === 'active' }"
        >
          <div class="card-header">
            <div class="attendance-status">
              <el-tag :type="getStatusColor(attendance.status)">
                {{ getStatusText(attendance.status) }}
              </el-tag>
              <el-tag v-if="attendance.methods.length > 1" type="info" size="small">
                多重验证
              </el-tag>
            </div>
            <div class="card-actions">
              <el-dropdown @command="(action) => handleAttendanceAction(action, attendance)">
                <el-button size="small" type="text">
                  更多 <el-icon><ArrowDown /></el-icon>
                </el-button>
                <template #dropdown>
                  <el-dropdown-menu>
                    <el-dropdown-item command="view">查看详情</el-dropdown-item>
                    <el-dropdown-item command="start" v-if="attendance.status === 'preparing'">
                      开始考勤
                    </el-dropdown-item>
                    <el-dropdown-item command="end" v-if="attendance.status === 'active'">
                      结束考勤
                    </el-dropdown-item>
                    <el-dropdown-item command="extend" v-if="attendance.status === 'active'">
                      延长时间
                    </el-dropdown-item>
                    <el-dropdown-item command="edit">编辑设置</el-dropdown-item>
                    <el-dropdown-item command="qr" v-if="attendance.methods.includes('qr')">
                      生成二维码
                    </el-dropdown-item>
                    <el-dropdown-item command="delete" divided>删除</el-dropdown-item>
                  </el-dropdown-menu>
                </template>
              </el-dropdown>
            </div>
          </div>

          <div class="card-content">
            <h4>{{ attendance.title }}</h4>
            <div class="attendance-meta">
              <div class="meta-item">
                <el-icon><Clock /></el-icon>
                <span>{{ formatTimeRange(attendance.startTime, attendance.endTime) }}</span>
              </div>
              <div class="meta-item">
                <el-icon><LocationFilled /></el-icon>
                <span>{{ attendance.location }}</span>
              </div>
              <div class="meta-item">
                <el-icon><UserFilled /></el-icon>
                <span>{{ attendance.totalCount }}人</span>
              </div>
              <div class="meta-item">
                <el-icon><Grid /></el-icon>
                <span>{{ getMethodsText(attendance.methods) }}</span>
              </div>
            </div>

            <!-- 签到进度 -->
            <div class="checkin-progress">
              <div class="progress-header">
                <span>签到进度</span>
                <span class="progress-text">
                  {{ attendance.checkedInCount }}/{{ attendance.totalCount }}
                </span>
              </div>
              <el-progress
                :percentage="getAttendanceProgress(attendance)"
                :color="getProgressColor(attendance)"
                :stroke-width="6"
              />
              <div class="progress-details">
                <span class="detail-item success">
                  正常：{{ attendance.normalCount || 0 }}
                </span>
                <span class="detail-item warning">
                  迟到：{{ attendance.lateCount || 0 }}
                </span>
                <span class="detail-item danger">
                  缺勤：{{ attendance.absentCount || 0 }}
                </span>
              </div>
            </div>

            <!-- 实时状态 -->
            <div v-if="attendance.status === 'active'" class="realtime-status">
              <div class="status-indicator">
                <span class="live-dot"></span>
                <span>考勤进行中</span>
                <span class="remaining-time">剩余 {{ getRemainingTime(attendance) }}</span>
              </div>
              <div class="recent-checkins" v-if="attendance.recentCheckins?.length">
                <span class="recent-label">最近签到：</span>
                <div class="recent-users">
                  <el-avatar
                    v-for="user in attendance.recentCheckins.slice(0, 3)"
                    :key="user.id"
                    :size="24"
                    :src="user.avatar"
                  >
                    {{ user.name[0] }}
                  </el-avatar>
                  <span v-if="attendance.recentCheckins.length > 3" class="more-users">
                    +{{ attendance.recentCheckins.length - 3 }}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div class="card-footer">
            <el-button
              v-if="attendance.status === 'active'"
              size="small"
              type="primary"
              @click="viewRealTimeDetail(attendance)"
            >
              实时监控
            </el-button>
            <el-button
              v-else-if="attendance.status === 'preparing'"
              size="small"
              type="success"
              @click="startAttendance(attendance)"
            >
              开始考勤
            </el-button>
            <el-button
              v-else
              size="small"
              @click="viewAttendanceReport(attendance)"
            >
              查看报告
            </el-button>
            <el-button
              size="small"
              type="text"
              @click="manageParticipants(attendance)"
            >
              管理人员
            </el-button>
          </div>
        </div>
      </div>

      <!-- 表格视图 -->
      <el-table
        v-else
        :data="filteredAttendances"
        stripe
        style="width: 100%"
        @row-click="viewAttendanceDetail"
      >
        <el-table-column prop="title" label="考勤标题" min-width="180" />
        <el-table-column prop="location" label="地点" width="120" />
        <el-table-column label="签到方式" width="120">
          <template #default="{ row }">
            {{ getMethodsText(row.methods) }}
          </template>
        </el-table-column>
        <el-table-column label="时间范围" width="200">
          <template #default="{ row }">
            {{ formatTimeRange(row.startTime, row.endTime) }}
          </template>
        </el-table-column>
        <el-table-column label="签到进度" width="150">
          <template #default="{ row }">
            <div class="table-progress">
              <span class="progress-text">
                {{ row.checkedInCount }}/{{ row.totalCount }}
              </span>
              <el-progress
                :percentage="getAttendanceProgress(row)"
                :color="getProgressColor(row)"
                :stroke-width="4"
                :show-text="false"
              />
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="getStatusColor(row.status)">
              {{ getStatusText(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button
              v-if="row.status === 'active'"
              size="small"
              type="primary"
              @click.stop="viewRealTimeDetail(row)"
            >
              监控
            </el-button>
            <el-button
              v-else-if="row.status === 'preparing'"
              size="small"
              type="success"
              @click.stop="startAttendance(row)"
            >
              开始
            </el-button>
            <el-button
              size="small"
              @click.stop="manageParticipants(row)"
            >
              人员
            </el-button>
            <el-button size="small" type="text" @click.stop="editAttendance(row)">
              编辑
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <!-- 考勤设置表单 -->
    <AttendanceForm
      v-model:visible="showAttendanceForm"
      :attendance="selectedAttendance"
      @save="handleAttendanceSave"
    />

    <!-- 实时监控对话框 -->
    <RealTimeMonitorDialog
      v-model:visible="showMonitorDialog"
      :attendance="selectedAttendance"
    />

    <!-- 考勤详情对话框 -->
    <AttendanceDetailDialog
      v-model:visible="showDetailDialog"
      :attendance="selectedAttendance"
    />

    <!-- 人员管理对话框 -->
    <ParticipantManagerDialog
      v-model:visible="showParticipantDialog"
      :attendance="selectedAttendance"
    />

    <!-- 二维码显示对话框 -->
    <QRCodeDialog
      v-model:visible="showQRDialog"
      :attendance="selectedAttendance"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Plus, Download, Monitor, Search, Timer, Clock,
  LocationFilled, UserFilled, Grid, ArrowDown
} from '@element-plus/icons-vue'

// 导入子组件
import AttendanceForm from '../execution/components/AttendanceForm.vue'
import RealTimeMonitorDialog from '../components/RealTimeMonitorDialog.vue'
import AttendanceDetailDialog from '../components/AttendanceDetailDialog.vue'
import ParticipantManagerDialog from '../components/ParticipantManagerDialog.vue'
import QRCodeDialog from '../components/QRCodeDialog.vue'

// 页面状态
const viewMode = ref('card')
const showAttendanceForm = ref(false)
const showMonitorDialog = ref(false)
const showDetailDialog = ref(false)
const showParticipantDialog = ref(false)
const showQRDialog = ref(false)
const selectedAttendance = ref<any>(null)

// 筛选状态
const filterStatus = ref('')
const filterMethod = ref('')
const filterDate = ref<[Date, Date] | null>(null)
const searchKeyword = ref('')

// 实时更新定时器
const realtimeTimer = ref<number>()

// 模拟考勤数据
const attendanceList = ref([
  {
    id: 'att-1',
    title: '项目管理培训考勤',
    location: '培训中心A201',
    startTime: '2024-01-20T09:00:00',
    endTime: '2024-01-20T12:00:00',
    status: 'active',
    methods: ['qr', 'location'],
    totalCount: 25,
    checkedInCount: 18,
    normalCount: 15,
    lateCount: 3,
    absentCount: 7,
    recentCheckins: [
      { id: '1', name: '张三', avatar: '', time: '2024-01-20T09:05:00' },
      { id: '2', name: '李四', avatar: '', time: '2024-01-20T09:03:00' },
      { id: '3', name: '王五', avatar: '', time: '2024-01-20T09:02:00' }
    ]
  },
  {
    id: 'att-2',
    title: 'Vue 3开发实战考勤',
    location: '线上培训',
    startTime: '2024-01-21T14:00:00',
    endTime: '2024-01-21T17:00:00',
    status: 'preparing',
    methods: ['face', 'qr'],
    totalCount: 30,
    checkedInCount: 0,
    normalCount: 0,
    lateCount: 0,
    absentCount: 0,
    recentCheckins: []
  },
  {
    id: 'att-3',
    title: '团队沟通技巧考勤',
    location: '培训中心B302',
    startTime: '2024-01-18T10:00:00',
    endTime: '2024-01-18T12:00:00',
    status: 'ended',
    methods: ['manual'],
    totalCount: 20,
    checkedInCount: 19,
    normalCount: 18,
    lateCount: 1,
    absentCount: 1,
    recentCheckins: []
  }
])

// 计算属性
const activeAttendances = computed(() => 
  attendanceList.value.filter(a => a.status === 'active')
)

const todayStats = computed(() => {
  const today = new Date().toDateString()
  const todayAttendances = attendanceList.value.filter(a => 
    new Date(a.startTime).toDateString() === today
  )
  const total = todayAttendances.length
  const completed = todayAttendances.filter(a => a.status === 'ended').length
  
  return {
    total,
    completionRate: total > 0 ? Math.round((completed / total) * 100) : 0
  }
})

const realtimeStats = computed(() => ({
  onlineUsers: 156,
  abnormalCount: 3
}))

const filteredAttendances = computed(() => {
  let filtered = attendanceList.value

  if (filterStatus.value) {
    filtered = filtered.filter(a => a.status === filterStatus.value)
  }

  if (filterMethod.value) {
    filtered = filtered.filter(a => a.methods.includes(filterMethod.value))
  }

  if (filterDate.value) {
    const [start, end] = filterDate.value
    filtered = filtered.filter(a => {
      const startTime = new Date(a.startTime)
      return startTime >= start && startTime <= end
    })
  }

  if (searchKeyword.value) {
    const keyword = searchKeyword.value.toLowerCase()
    filtered = filtered.filter(a => 
      a.title.toLowerCase().includes(keyword) ||
      a.location.toLowerCase().includes(keyword)
    )
  }

  return filtered
})

// 工具方法
const getStatusColor = (status: string) => {
  const colors = {
    preparing: 'info',
    active: 'success',
    ended: 'warning',
    cancelled: 'danger'
  }
  return colors[status] || 'info'
}

const getStatusText = (status: string) => {
  const texts = {
    preparing: '准备中',
    active: '进行中',
    ended: '已结束',
    cancelled: '已取消'
  }
  return texts[status] || status
}

const getMethodsText = (methods: string[]) => {
  const methodTexts = {
    qr: '二维码',
    location: '位置',
    face: '人脸',
    manual: '手动',
    multiple: '组合'
  }
  
  if (methods.length === 1) {
    return methodTexts[methods[0]] || methods[0]
  } else {
    return `${methodTexts[methods[0]]}等${methods.length}种`
  }
}

const formatTimeRange = (startTime: string, endTime: string) => {
  const start = new Date(startTime)
  const end = new Date(endTime)
  const startStr = start.toLocaleString('zh-CN', { 
    month: '2-digit', 
    day: '2-digit', 
    hour: '2-digit', 
    minute: '2-digit' 
  })
  const endStr = end.toLocaleString('zh-CN', { 
    hour: '2-digit', 
    minute: '2-digit' 
  })
  return `${startStr} - ${endStr}`
}

const getAttendanceProgress = (attendance: any) => {
  return attendance.totalCount > 0 ? Math.round((attendance.checkedInCount / attendance.totalCount) * 100) : 0
}

const getProgressColor = (attendance: any) => {
  const progress = getAttendanceProgress(attendance)
  if (progress >= 90) return '#67c23a'
  if (progress >= 70) return '#e6a23c'
  return '#f56c6c'
}

const getRemainingTime = (attendance: any) => {
  const now = new Date()
  const endTime = new Date(attendance.endTime)
  const diff = endTime.getTime() - now.getTime()
  
  if (diff <= 0) return '已结束'
  
  const hours = Math.floor(diff / (1000 * 60 * 60))
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
  
  if (hours > 0) {
    return `${hours}h${minutes}m`
  } else {
    return `${minutes}m`
  }
}

// 操作方法
const createAttendance = () => {
  selectedAttendance.value = null
  showAttendanceForm.value = true
}

const editAttendance = (attendance: any) => {
  selectedAttendance.value = attendance
  showAttendanceForm.value = true
}

const viewAttendanceDetail = (attendance: any) => {
  selectedAttendance.value = attendance
  showDetailDialog.value = true
}

const viewRealTimeDetail = (attendance: any) => {
  selectedAttendance.value = attendance
  showMonitorDialog.value = true
}

const showRealTimeMonitor = () => {
  if (activeAttendances.value.length === 0) {
    ElMessage.warning('当前没有进行中的考勤')
    return
  }
  selectedAttendance.value = activeAttendances.value[0]
  showMonitorDialog.value = true
}

const startAttendance = (attendance: any) => {
  ElMessageBox.confirm('确定开始这个考勤吗？', '开始考勤', {
    confirmButtonText: '开始',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    attendance.status = 'active'
    ElMessage.success('考勤已开始')
    startRealTimeUpdate()
  })
}

const manageParticipants = (attendance: any) => {
  selectedAttendance.value = attendance
  showParticipantDialog.value = true
}

const viewAttendanceReport = (attendance: any) => {
  ElMessage.info(`查看考勤"${attendance.title}"的详细报告`)
}

const handleAttendanceAction = (action: string, attendance: any) => {
  switch (action) {
    case 'view':
      viewAttendanceDetail(attendance)
      break
    case 'start':
      startAttendance(attendance)
      break
    case 'end':
      handleEndAttendance(attendance)
      break
    case 'extend':
      handleExtendAttendance(attendance)
      break
    case 'edit':
      editAttendance(attendance)
      break
    case 'qr':
      showQRCode(attendance)
      break
    case 'delete':
      handleDeleteAttendance(attendance)
      break
  }
}

const handleAttendanceSave = (attendanceData: any) => {
  if (selectedAttendance.value) {
    // 编辑现有考勤
    Object.assign(selectedAttendance.value, attendanceData)
    ElMessage.success('考勤设置更新成功')
  } else {
    // 新建考勤
    const newAttendance = {
      id: `att-${Date.now()}`,
      ...attendanceData,
      status: 'preparing',
      checkedInCount: 0,
      normalCount: 0,
      lateCount: 0,
      absentCount: 0,
      recentCheckins: []
    }
    attendanceList.value.push(newAttendance)
    ElMessage.success('考勤创建成功')
  }
}

const handleEndAttendance = (attendance: any) => {
  ElMessageBox.confirm('确定结束这个考勤吗？', '结束考勤', {
    confirmButtonText: '结束',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    attendance.status = 'ended'
    ElMessage.success('考勤已结束')
  })
}

const handleExtendAttendance = (attendance: any) => {
  ElMessageBox.prompt('请输入延长的分钟数', '延长考勤时间', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    inputPattern: /^\d+$/,
    inputErrorMessage: '请输入有效的分钟数'
  }).then(({ value }) => {
    const endTime = new Date(attendance.endTime)
    endTime.setMinutes(endTime.getMinutes() + parseInt(value))
    attendance.endTime = endTime.toISOString()
    ElMessage.success(`考勤时间已延长${value}分钟`)
  })
}

const handleDeleteAttendance = (attendance: any) => {
  ElMessageBox.confirm('确定删除这个考勤吗？', '删除考勤', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    const index = attendanceList.value.findIndex(a => a.id === attendance.id)
    if (index > -1) {
      attendanceList.value.splice(index, 1)
      ElMessage.success('考勤已删除')
    }
  })
}

const showQRCode = (attendance: any) => {
  selectedAttendance.value = attendance
  showQRDialog.value = true
}

const exportAttendanceData = () => {
  ElMessage.success('正在导出考勤数据...')
}

// 实时更新
const startRealTimeUpdate = () => {
  if (realtimeTimer.value) {
    clearInterval(realtimeTimer.value)
  }
  
  realtimeTimer.value = window.setInterval(() => {
    // 模拟实时数据更新
    activeAttendances.value.forEach(attendance => {
      // 随机增加签到人数
      if (Math.random() < 0.3 && attendance.checkedInCount < attendance.totalCount) {
        attendance.checkedInCount++
        if (Math.random() < 0.9) {
          attendance.normalCount++
        } else {
          attendance.lateCount++
        }
      }
    })
  }, 5000)
}

const stopRealTimeUpdate = () => {
  if (realtimeTimer.value) {
    clearInterval(realtimeTimer.value)
    realtimeTimer.value = undefined
  }
}

// 生命周期
onMounted(() => {
  startRealTimeUpdate()
})

onUnmounted(() => {
  stopRealTimeUpdate()
})
</script>

<style scoped>
.attendance-management {
  padding: 20px;
  background: #f5f7fa;
  min-height: 100vh;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 20px;
  padding: 20px;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.header-content h1 {
  margin: 0 0 8px 0;
  font-size: 24px;
  color: #333;
}

.header-content p {
  margin: 0;
  color: #666;
  font-size: 14px;
}

.header-actions {
  display: flex;
  gap: 12px;
}

.realtime-overview {
  display: grid;
  grid-template-columns: 2fr 1fr 1fr 1fr;
  gap: 16px;
  margin-bottom: 20px;
}

.overview-card {
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.active-card {
  padding: 0;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid #f0f0f0;
}

.card-header h3 {
  margin: 0;
  font-size: 16px;
  color: #333;
}

.active-list {
  max-height: 200px;
  overflow-y: auto;
}

.active-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 20px;
  border-bottom: 1px solid #f8f9fa;
  cursor: pointer;
  transition: background-color 0.2s;
}

.active-item:hover {
  background: #f8f9fa;
}

.active-item:last-child {
  border-bottom: none;
}

.attendance-info h4 {
  margin: 0 0 4px 0;
  font-size: 14px;
  color: #333;
}

.attendance-info p {
  margin: 0;
  font-size: 12px;
  color: #666;
}

.attendance-stats {
  text-align: right;
  min-width: 100px;
}

.stat-item {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  margin-bottom: 4px;
}

.stat-item .label {
  color: #666;
}

.stat-item .value {
  color: #333;
  font-weight: 500;
}

.progress-bar {
  width: 100px;
}

.stats-detail {
  margin-top: 8px;
  font-size: 12px;
  color: #666;
}

.live-indicator {
  display: flex;
  align-items: center;
  gap: 6px;
}

.live-dot {
  width: 8px;
  height: 8px;
  background: #67c23a;
  border-radius: 50%;
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0% { opacity: 1; }
  50% { opacity: 0.5; }
  100% { opacity: 1; }
}

.filter-section {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding: 16px 20px;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.filter-left {
  display: flex;
  gap: 12px;
  align-items: center;
}

.attendance-list {
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  padding: 20px;
}

.list-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.list-header h3 {
  margin: 0;
  font-size: 18px;
  color: #333;
}

.attendance-cards {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(450px, 1fr));
  gap: 20px;
}

.attendance-card {
  border: 1px solid #e8e8e8;
  border-radius: 8px;
  padding: 20px;
  background: #fff;
  transition: all 0.3s;
}

.attendance-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.attendance-card.active {
  border-color: #67c23a;
  background: linear-gradient(135deg, #fff 0%, #f0f9ff 100%);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.attendance-status {
  display: flex;
  gap: 8px;
}

.card-content h4 {
  margin: 0 0 12px 0;
  font-size: 16px;
  color: #333;
  font-weight: 600;
}

.attendance-meta {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
  margin-bottom: 16px;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
  color: #666;
}

.checkin-progress {
  margin-bottom: 16px;
}

.progress-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
  font-size: 14px;
  color: #333;
}

.progress-text {
  font-size: 12px;
  color: #666;
}

.progress-details {
  display: flex;
  justify-content: space-between;
  margin-top: 8px;
  font-size: 12px;
}

.detail-item {
  padding: 2px 6px;
  border-radius: 3px;
  background: #f8f9fa;
}

.detail-item.success {
  color: #67c23a;
  background: #f0f9ff;
}

.detail-item.warning {
  color: #e6a23c;
  background: #fdf6ec;
}

.detail-item.danger {
  color: #f56c6c;
  background: #fef0f0;
}

.realtime-status {
  padding: 12px;
  background: #f0f9ff;
  border: 1px solid #b3d8ff;
  border-radius: 6px;
  margin-bottom: 12px;
}

.status-indicator {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  color: #409eff;
  margin-bottom: 8px;
}

.remaining-time {
  margin-left: auto;
  font-weight: 500;
}

.recent-checkins {
  display: flex;
  align-items: center;
  gap: 8px;
}

.recent-label {
  font-size: 12px;
  color: #666;
}

.recent-users {
  display: flex;
  align-items: center;
  gap: 4px;
}

.more-users {
  font-size: 12px;
  color: #666;
  margin-left: 4px;
}

.card-footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}

.table-progress {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
</style> 