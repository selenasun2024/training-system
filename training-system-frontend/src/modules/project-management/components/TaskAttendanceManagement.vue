<template>
  <div class="task-attendance-management">
    <!-- 页面头部信息 -->
    <div class="page-header">
      <div class="header-left">
        <div class="header-title">
          <el-button 
            type="text" 
            @click="goBack"
            class="back-button"
          >
            <el-icon><ArrowLeft /></el-icon>
          </el-button>
          <h3>{{ task?.name || '考勤管理' }}</h3>
        </div>
        <div class="task-meta">
          <span class="meta-item">
            <el-icon><Clock /></el-icon>
            考勤时间：{{ formatTimeRange(task?.config?.startTime, task?.config?.endTime) }}
          </span>
          <span class="meta-item">
            <el-icon><LocationFilled /></el-icon>
            考勤地点：{{ task?.config?.location || '未设置' }}
          </span>
          <span class="meta-item">
            <el-icon><UserFilled /></el-icon>
            应到人数：{{ studentList.length }}人
          </span>
        </div>
      </div>
      <div class="header-actions">
        <el-button type="primary" @click="exportData">
          <el-icon><Download /></el-icon>
          导出数据
        </el-button>
        <el-button @click="refreshData">
          <el-icon><Refresh /></el-icon>
          刷新
        </el-button>
      </div>
    </div>

    <!-- 统计卡片 -->
    <div class="stats-cards">
      <el-card class="stats-card">
        <div class="stats-content">
          <div class="stats-number">{{ attendanceStats.present }}</div>
          <div class="stats-label">已签到</div>
        </div>
      </el-card>
      <el-card class="stats-card">
        <div class="stats-content">
          <div class="stats-number">{{ attendanceStats.late }}</div>
          <div class="stats-label">迟到</div>
        </div>
      </el-card>
      <el-card class="stats-card">
        <div class="stats-content">
          <div class="stats-number">{{ attendanceStats.absent }}</div>
          <div class="stats-label">缺勤</div>
        </div>
      </el-card>
      <el-card class="stats-card">
        <div class="stats-content">
          <div class="stats-number">{{ attendanceRate }}%</div>
          <div class="stats-label">出勤率</div>
        </div>
      </el-card>
    </div>

    <!-- 筛选控制 -->
    <div class="filter-section">
      <div class="filter-left">
        <el-select v-model="statusFilter" placeholder="筛选状态" clearable style="width: 120px">
          <el-option label="全部" value="" />
          <el-option label="已签到" value="present" />
          <el-option label="迟到" value="late" />
          <el-option label="缺勤" value="absent" />
        </el-select>
      </div>
      <div class="filter-right">
        <el-input
          v-model="searchKeyword"
          placeholder="搜索学员姓名"
          style="width: 200px"
          clearable
        >
          <template #prefix>
            <el-icon><Search /></el-icon>
          </template>
        </el-input>
      </div>
    </div>

    <!-- 考勤表格 -->
    <el-card shadow="never" class="table-card">
      <el-table
        :data="filteredStudentList"
        stripe
        border
        style="width: 100%"
        :default-sort="{ prop: 'checkInTime', order: 'ascending' }"
      >
        <el-table-column type="index" label="序号" width="60" align="center" />
        <el-table-column prop="name" label="姓名" width="100" />
        <el-table-column prop="studentId" label="学号" width="120" />
        <el-table-column prop="department" label="所在部门" width="150" />
        <el-table-column prop="position" label="职位" width="120" />
        <el-table-column label="签到状态" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="getStatusTagType(row.attendanceStatus)">
              {{ getStatusText(row.attendanceStatus) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="签到时间" width="150" align="center">
          <template #default="{ row }">
            <span v-if="row.checkInTime">
              {{ formatDateTime(row.checkInTime) }}
            </span>
            <span v-else class="text-muted">--</span>
          </template>
        </el-table-column>
        <el-table-column label="备注" min-width="150">
          <template #default="{ row }">
            <span v-if="row.notes">{{ row.notes }}</span>
            <span v-else class="text-muted">--</span>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="150" align="center" fixed="right">
          <template #default="{ row }">
            <el-button
              v-if="row.attendanceStatus === 'absent'"
              size="small"
              type="primary"
              @click="manualCheckIn(row)"
            >
              手动签到
            </el-button>
            <el-button
              v-if="row.attendanceStatus !== 'absent'"
              size="small"
              type="text"
              @click="viewDetail(row)"
            >
              查看详情
            </el-button>
            <el-button
              size="small"
              type="text"
              @click="editNotes(row)"
            >
              编辑备注
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 手动签到对话框 -->
    <el-dialog
      v-model="showManualCheckIn"
      title="手动签到"
      width="400px"
    >
      <el-form :model="manualForm" label-width="80px">
        <el-form-item label="学员姓名">
          <el-input :value="selectedStudent?.name" disabled />
        </el-form-item>
        <el-form-item label="签到状态">
          <el-radio-group v-model="manualForm.status">
            <el-radio label="present">正常签到</el-radio>
            <el-radio label="late">迟到</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="签到时间">
          <el-date-picker
            v-model="manualForm.checkInTime"
            type="datetime"
            placeholder="选择签到时间"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="备注">
          <el-input
            v-model="manualForm.notes"
            type="textarea"
            placeholder="请输入备注"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showManualCheckIn = false">取消</el-button>
        <el-button type="primary" @click="confirmManualCheckIn">确认签到</el-button>
      </template>
    </el-dialog>

    <!-- 编辑备注对话框 -->
    <el-dialog
      v-model="showEditNotes"
      title="编辑备注"
      width="400px"
    >
      <el-form :model="notesForm" label-width="80px">
        <el-form-item label="学员姓名">
          <el-input :value="selectedStudent?.name" disabled />
        </el-form-item>
        <el-form-item label="备注">
          <el-input
            v-model="notesForm.notes"
            type="textarea"
            placeholder="请输入备注"
            :rows="4"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showEditNotes = false">取消</el-button>
        <el-button type="primary" @click="confirmEditNotes">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Clock, LocationFilled, UserFilled, Download, Refresh, Search, ArrowLeft
} from '@element-plus/icons-vue'

interface Props {
  task?: any
  visible?: boolean
}

const props = defineProps<Props>()

// 定义事件
const emit = defineEmits<{
  'back-to-tasks': []
}>()

// 状态管理
const statusFilter = ref('')
const searchKeyword = ref('')
const showManualCheckIn = ref(false)
const showEditNotes = ref(false)
const selectedStudent = ref<any>(null)

// 表单数据
const manualForm = ref({
  status: 'present',
  checkInTime: new Date(),
  notes: ''
})

const notesForm = ref({
  notes: ''
})

// 模拟学员数据
const studentList = ref([
  {
    id: '1',
    name: '张三',
    studentId: '00242',
    department: 'MBA(31期)>人员赋权管理组>测试1组',
    position: '正式',
    attendanceStatus: 'present',
    checkInTime: '2025-07-18 09:03',
    notes: ''
  },
  {
    id: '2',
    name: '李四',
    studentId: '00243',
    department: 'MBA(31期)>人员赋权管理组>测试2组',
    position: '正式',
    attendanceStatus: 'late',
    checkInTime: '2025-07-18 09:15',
    notes: '迟到原因：交通拥堵'
  },
  {
    id: '3',
    name: '王五',
    studentId: '00244',
    department: 'MBA(31期)>人员赋权管理组>测试1组',
    position: '正式',
    attendanceStatus: 'absent',
    checkInTime: null,
    notes: ''
  },
  {
    id: '4',
    name: '赵六',
    studentId: '00245',
    department: 'MBA(31期)>人员赋权管理组>测试3组',
    position: '正式',
    attendanceStatus: 'present',
    checkInTime: '2025-07-18 08:58',
    notes: ''
  },
  {
    id: '5',
    name: '钱七',
    studentId: '00246',
    department: 'MBA(31期)>人员赋权管理组>测试2组',
    position: '正式',
    attendanceStatus: 'present',
    checkInTime: '2025-07-18 09:01',
    notes: ''
  }
])

// 计算属性
const attendanceStats = computed(() => {
  const present = studentList.value.filter(s => s.attendanceStatus === 'present').length
  const late = studentList.value.filter(s => s.attendanceStatus === 'late').length
  const absent = studentList.value.filter(s => s.attendanceStatus === 'absent').length
  
  return { present, late, absent }
})

const attendanceRate = computed(() => {
  const total = studentList.value.length
  const attended = attendanceStats.value.present + attendanceStats.value.late
  return total > 0 ? Math.round((attended / total) * 100) : 0
})

const filteredStudentList = computed(() => {
  let filtered = studentList.value

  // 状态筛选
  if (statusFilter.value) {
    filtered = filtered.filter(student => student.attendanceStatus === statusFilter.value)
  }

  // 姓名搜索
  if (searchKeyword.value) {
    const keyword = searchKeyword.value.toLowerCase()
    filtered = filtered.filter(student => 
      student.name.toLowerCase().includes(keyword) ||
      student.studentId.includes(keyword)
    )
  }

  return filtered
})

// 工具方法
const getStatusTagType = (status: string) => {
  const types = {
    present: 'success',
    late: 'warning',
    absent: 'danger'
  }
  return types[status] || 'info'
}

const getStatusText = (status: string) => {
  const texts = {
    present: '已签到',
    late: '迟到',
    absent: '缺勤'
  }
  return texts[status] || status
}

const formatTimeRange = (startTime?: string, endTime?: string) => {
  if (!startTime || !endTime) return '2025-07-18 00:00 至 2025-07-18 09:54'
  
  const start = new Date(startTime)
  const end = new Date(endTime)
  
  return `${start.toLocaleString()} 至 ${end.toLocaleString()}`
}

const formatDateTime = (dateString: string) => {
  if (!dateString) return '--'
  return dateString
}

// 操作方法
const manualCheckIn = (student: any) => {
  selectedStudent.value = student
  manualForm.value = {
    status: 'present',
    checkInTime: new Date(),
    notes: ''
  }
  showManualCheckIn.value = true
}

const confirmManualCheckIn = () => {
  if (selectedStudent.value) {
    selectedStudent.value.attendanceStatus = manualForm.value.status
    selectedStudent.value.checkInTime = manualForm.value.checkInTime.toLocaleString()
    selectedStudent.value.notes = manualForm.value.notes
    
    ElMessage.success(`${selectedStudent.value.name} 手动签到成功`)
    showManualCheckIn.value = false
  }
}

const editNotes = (student: any) => {
  selectedStudent.value = student
  notesForm.value.notes = student.notes || ''
  showEditNotes.value = true
}

const confirmEditNotes = () => {
  if (selectedStudent.value) {
    selectedStudent.value.notes = notesForm.value.notes
    ElMessage.success('备注保存成功')
    showEditNotes.value = false
  }
}

const viewDetail = (student: any) => {
  ElMessage.info(`查看 ${student.name} 的考勤详情`)
}

const exportData = () => {
  ElMessage.success('正在导出考勤数据...')
}

const refreshData = () => {
  ElMessage.success('数据已刷新')
}

// 返回功能
const goBack = () => {
  emit('back-to-tasks')
}

// 生命周期
onMounted(() => {
  console.log('考勤任务管理界面已加载，任务信息:', props.task)
})
</script>

<style scoped>
.task-attendance-management {
  padding: 16px;
  background: #f5f7fa;
  min-height: calc(100vh - 100px);
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 16px;
  padding: 16px;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.header-title {
  display: flex;
  align-items: center;
  gap: 8px;
}

.back-button {
  font-size: 16px;
  color: #409eff;
  padding: 4px 8px;
}

.back-button:hover {
  background-color: #e6f7ff;
}

.header-left h3 {
  margin: 0 0 8px 0;
  font-size: 18px;
  color: #333;
}

.task-meta {
  display: flex;
  gap: 20px;
  font-size: 14px;
  color: #666;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 4px;
}

.header-actions {
  display: flex;
  gap: 8px;
}

.stats-cards {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  margin-bottom: 16px;
}

.stats-card {
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.stats-content {
  text-align: center;
  padding: 8px 0;
}

.stats-number {
  font-size: 24px;
  font-weight: bold;
  color: #409eff;
  margin-bottom: 4px;
}

.stats-label {
  font-size: 14px;
  color: #666;
}

.filter-section {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding: 12px 16px;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.table-card {
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.text-muted {
  color: #999;
}

:deep(.el-table) {
  font-size: 14px;
}

:deep(.el-table th) {
  background-color: #f8f9fa;
  font-weight: 600;
}
</style> 