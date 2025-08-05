<template>
  <el-dialog
    v-model="visible"
    title="考勤详情"
    width="80%"
    :before-close="handleClose"
    class="attendance-detail-dialog"
  >
    <div class="detail-content" v-if="attendanceDetail">
      <!-- 基本信息 -->
      <el-card class="basic-info">
        <template #header>
          <span>基本信息</span>
        </template>
        <el-row :gutter="24">
          <el-col :span="12">
            <div class="info-item">
              <span class="label">考勤标题：</span>
              <span class="value">{{ attendanceDetail.title }}</span>
            </div>
            <div class="info-item">
              <span class="label">考勤地点：</span>
              <span class="value">{{ attendanceDetail.location }}</span>
            </div>
            <div class="info-item">
              <span class="label">签到方式：</span>
              <span class="value">
                <el-tag
                  v-for="method in attendanceDetail.methods"
                  :key="method"
                  :type="getMethodType(method)"
                  size="small"
                  style="margin-right: 8px;"
                >
                  {{ getMethodText(method) }}
                </el-tag>
              </span>
            </div>
          </el-col>
          <el-col :span="12">
            <div class="info-item">
              <span class="label">考勤状态：</span>
              <el-tag :type="getStatusColor(attendanceDetail.status)">
                {{ getStatusText(attendanceDetail.status) }}
              </el-tag>
            </div>
            <div class="info-item">
              <span class="label">时间范围：</span>
              <span class="value">{{ formatTimeRange(attendanceDetail.startTime, attendanceDetail.endTime) }}</span>
            </div>
            <div class="info-item">
              <span class="label">创建时间：</span>
              <span class="value">{{ formatTime(attendanceDetail.createTime) }}</span>
            </div>
          </el-col>
        </el-row>
      </el-card>

      <!-- 统计概览 -->
      <el-card class="statistics">
        <template #header>
          <span>统计概览</span>
        </template>
        <div class="stat-grid">
          <div class="stat-item">
            <div class="stat-value">{{ attendanceDetail.totalCount }}</div>
            <div class="stat-label">总人数</div>
          </div>
          <div class="stat-item success">
            <div class="stat-value">{{ attendanceDetail.checkedInCount }}</div>
            <div class="stat-label">已签到</div>
          </div>
          <div class="stat-item warning">
            <div class="stat-value">{{ attendanceDetail.lateCount || 0 }}</div>
            <div class="stat-label">迟到</div>
          </div>
          <div class="stat-item danger">
            <div class="stat-value">{{ attendanceDetail.absentCount || 0 }}</div>
            <div class="stat-label">缺勤</div>
          </div>
          <div class="stat-item info">
            <div class="stat-value">{{ attendanceProgress }}%</div>
            <div class="stat-label">完成率</div>
          </div>
        </div>
        
        <div class="progress-chart">
          <el-progress 
            :percentage="attendanceProgress" 
            :color="progressColor" 
            :stroke-width="12"
          />
        </div>
      </el-card>

      <!-- 参与者列表 -->
      <el-card class="participants">
        <template #header>
          <div class="header-actions">
            <span>参与者列表</span>
            <div class="actions">
              <el-input
                v-model="searchKeyword"
                placeholder="搜索参与者"
                style="width: 200px; margin-right: 12px;"
                clearable
              >
                <template #prefix>
                  <el-icon><Search /></el-icon>
                </template>
              </el-input>
              <el-select v-model="statusFilter" placeholder="状态筛选" style="width: 120px;">
                <el-option label="全部" value="" />
                <el-option label="已签到" value="checked" />
                <el-option label="未签到" value="unchecked" />
                <el-option label="迟到" value="late" />
              </el-select>
            </div>
          </div>
        </template>

        <el-table :data="filteredParticipants" style="width: 100%">
          <el-table-column prop="name" label="姓名" width="120">
            <template #default="{ row }">
              <div class="participant-info">
                <el-avatar :src="row.avatar" :icon="UserFilled" size="small" />
                <span style="margin-left: 8px;">{{ row.name }}</span>
              </div>
            </template>
          </el-table-column>
          <el-table-column prop="department" label="部门" width="150" />
          <el-table-column prop="position" label="职位" width="120" />
          <el-table-column label="签到状态" width="120">
            <template #default="{ row }">
              <el-tag :type="getParticipantStatusType(row.status)">
                {{ getParticipantStatusText(row.status) }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="签到时间" width="160">
            <template #default="{ row }">
              <span v-if="row.checkinTime">{{ formatTime(row.checkinTime) }}</span>
              <span v-else class="text-muted">-</span>
            </template>
          </el-table-column>
          <el-table-column label="签到方式" width="100">
            <template #default="{ row }">
              <el-tag v-if="row.checkinMethod" :type="getMethodType(row.checkinMethod)" size="small">
                {{ getMethodText(row.checkinMethod) }}
              </el-tag>
              <span v-else class="text-muted">-</span>
            </template>
          </el-table-column>
          <el-table-column label="备注" show-overflow-tooltip>
            <template #default="{ row }">
              <span>{{ row.remark || '-' }}</span>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="120" fixed="right">
            <template #default="{ row }">
              <el-button
                v-if="row.status === 'unchecked'"
                size="small"
                type="primary"
                @click="manualCheckin(row)"
              >
                手动签到
              </el-button>
              <el-button
                v-if="row.status === 'checked'"
                size="small"
                type="info"
                @click="viewCheckinDetail(row)"
              >
                查看详情
              </el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-card>
    </div>

    <template #footer>
      <div class="dialog-footer">
        <el-button @click="handleClose">关闭</el-button>
        <el-button type="primary" @click="exportData">导出数据</el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { ElMessage } from 'element-plus'
import { Search, UserFilled } from '@element-plus/icons-vue'

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

const searchKeyword = ref('')
const statusFilter = ref('')

// 模拟考勤详情数据
const attendanceDetail = ref({
  id: 'att-1',
  title: '项目管理培训考勤',
  location: '培训中心A201',
  startTime: '2024-01-20T09:00:00',
  endTime: '2024-01-20T12:00:00',
  createTime: '2024-01-19T15:30:00',
  status: 'active',
  methods: ['qr', 'location'],
  totalCount: 25,
  checkedInCount: 18,
  lateCount: 3,
  absentCount: 7
})

// 参与者列表
const participants = ref([
  {
    id: '1',
    name: '张三',
    avatar: '',
    department: '技术部',
    position: '高级工程师',
    status: 'checked',
    checkinTime: '2024-01-20T09:05:00',
    checkinMethod: 'qr',
    remark: ''
  },
  {
    id: '2',
    name: '李四',
    avatar: '',
    department: '产品部',
    position: '产品经理',
    status: 'late',
    checkinTime: '2024-01-20T09:15:00',
    checkinMethod: 'location',
    remark: '交通堵塞'
  },
  {
    id: '3',
    name: '王五',
    avatar: '',
    department: '设计部',
    position: 'UI设计师',
    status: 'unchecked',
    checkinTime: null,
    checkinMethod: null,
    remark: ''
  }
])

// 计算属性
const attendanceProgress = computed(() => {
  return attendanceDetail.value.totalCount > 0 
    ? Math.round((attendanceDetail.value.checkedInCount / attendanceDetail.value.totalCount) * 100)
    : 0
})

const progressColor = computed(() => {
  const progress = attendanceProgress.value
  if (progress >= 80) return '#67c23a'
  if (progress >= 60) return '#e6a23c'
  return '#f56c6c'
})

const filteredParticipants = computed(() => {
  let filtered = participants.value

  if (statusFilter.value) {
    filtered = filtered.filter(p => p.status === statusFilter.value)
  }

  if (searchKeyword.value) {
    const keyword = searchKeyword.value.toLowerCase()
    filtered = filtered.filter(p => 
      p.name.toLowerCase().includes(keyword) ||
      p.department.toLowerCase().includes(keyword) ||
      p.position.toLowerCase().includes(keyword)
    )
  }

  return filtered
})

// 方法
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

const getParticipantStatusType = (status: string) => {
  const types = {
    checked: 'success',
    unchecked: 'info',
    late: 'warning',
    absent: 'danger'
  }
  return types[status] || 'info'
}

const getParticipantStatusText = (status: string) => {
  const texts = {
    checked: '已签到',
    unchecked: '未签到',
    late: '迟到',
    absent: '缺勤'
  }
  return texts[status] || status
}

const formatTime = (timeStr: string) => {
  return new Date(timeStr).toLocaleString('zh-CN')
}

const formatTimeRange = (startTime: string, endTime: string) => {
  const start = new Date(startTime).toLocaleString('zh-CN')
  const end = new Date(endTime).toLocaleString('zh-CN')
  return `${start} - ${end}`
}

const manualCheckin = (participant: any) => {
  ElMessage.success(`已为 ${participant.name} 手动签到`)
}

const viewCheckinDetail = (participant: any) => {
  ElMessage.info('查看签到详情功能开发中')
}

const exportData = () => {
  ElMessage.success('导出功能开发中')
}

const handleClose = () => {
  emit('update:modelValue', false)
}
</script>

<style scoped>
.attendance-detail-dialog :deep(.el-dialog__body) {
  padding: 0 20px 20px;
}

.detail-content {
  space-y: 20px;
}

.basic-info,
.statistics,
.participants {
  margin-bottom: 20px;
}

.info-item {
  display: flex;
  margin-bottom: 12px;
}

.label {
  width: 100px;
  color: #666;
  flex-shrink: 0;
}

.value {
  flex: 1;
  font-weight: 500;
}

.stat-grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 20px;
  margin-bottom: 20px;
}

.stat-item {
  text-align: center;
  padding: 16px;
  border-radius: 8px;
  background: #f5f7fa;
}

.stat-item.success { background: #f0f9ff; color: #67c23a; }
.stat-item.warning { background: #fdf6ec; color: #e6a23c; }
.stat-item.danger { background: #fef0f0; color: #f56c6c; }
.stat-item.info { background: #f4f4f5; color: #909399; }

.stat-value {
  font-size: 24px;
  font-weight: bold;
  margin-bottom: 4px;
}

.stat-label {
  font-size: 12px;
  color: #666;
}

.progress-chart {
  margin-top: 20px;
}

.header-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.actions {
  display: flex;
  align-items: center;
}

.participant-info {
  display: flex;
  align-items: center;
}

.text-muted {
  color: #999;
}

.dialog-footer {
  text-align: right;
}
</style> 