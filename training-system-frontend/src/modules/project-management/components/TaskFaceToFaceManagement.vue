<template>
  <div class="task-face-to-face-management">
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
          <h3>{{ task?.name || '面授培训管理' }}</h3>
        </div>
        <div class="task-meta">
          <span class="meta-item">
            <el-icon><Clock /></el-icon>
            授课时间：{{ formatTimeRange(task?.config?.startTime, task?.config?.endTime) }}
          </span>
          <span class="meta-item">
            <el-icon><LocationFilled /></el-icon>
            授课地点：{{ task?.config?.location || '第一会议室' }}
          </span>
          <span class="meta-item">
            <el-icon><UserFilled /></el-icon>
            参与人数：{{ studentList.length }}人
          </span>
          <span class="meta-item">
            <el-icon><Star /></el-icon>
            课程类型：{{ task?.config?.courseType || '理论课程' }}
          </span>
        </div>
      </div>
      <div class="header-actions">
        <el-button type="primary" @click="startClass">
          <el-icon><VideoPlay /></el-icon>
          开始上课
        </el-button>
        <el-button @click="exportData">
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
          <div class="stats-number">{{ attendanceStats.active }}</div>
          <div class="stats-label">积极互动</div>
        </div>
      </el-card>
      <el-card class="stats-card">
        <div class="stats-content">
          <div class="stats-number">{{ attendanceStats.absent }}</div>
          <div class="stats-label">缺席</div>
        </div>
      </el-card>
      <el-card class="stats-card">
        <div class="stats-content">
          <div class="stats-number">{{ attendanceRate }}%</div>
          <div class="stats-label">出勤率</div>
        </div>
      </el-card>
    </div>

    <!-- Tab切换：签到管理、课堂表现、课程记录 -->
    <el-tabs v-model="activeTab" class="course-tabs">
      <!-- 签到管理Tab -->
      <el-tab-pane label="签到管理" name="attendance">
        <!-- 签到控制面板 -->
        <div class="attendance-control">
          <el-card class="control-card">
            <div class="control-header">
              <h4>签到控制</h4>
              <div class="control-status">
                <span :class="['status-indicator', { active: isAttendanceOpen }]"></span>
                <span>{{ isAttendanceOpen ? '签到进行中' : '签到已关闭' }}</span>
              </div>
            </div>
            <div class="control-actions">
              <el-button 
                type="primary" 
                @click="toggleAttendance"
                :loading="attendanceLoading"
              >
                {{ isAttendanceOpen ? '关闭签到' : '开启签到' }}
              </el-button>
              <el-button @click="manualCheckIn">手动签到</el-button>
              <el-button @click="batchCheckIn">批量签到</el-button>
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
              <el-option label="缺席" value="absent" />
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

        <!-- 签到状态表格 -->
        <el-card shadow="never" class="table-card">
          <el-table
            :data="filteredStudentList"
            stripe
            border
            style="width: 100%"
          >
            <el-table-column type="index" label="序号" width="60" align="center" />
            <el-table-column prop="name" label="姓名" width="100" />
            <el-table-column prop="studentId" label="学号" width="120" />
            <el-table-column prop="department" label="所在部门" width="150" />
            <el-table-column label="签到状态" width="120" align="center">
              <template #default="{ row }">
                <el-tag :type="getAttendanceTagType(row.attendanceStatus)">
                  {{ getAttendanceText(row.attendanceStatus) }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="签到时间" width="150" align="center">
              <template #default="{ row }">
                <span v-if="row.checkInTime">{{ formatDateTime(row.checkInTime) }}</span>
                <span v-else class="text-muted">--</span>
              </template>
            </el-table-column>
            <el-table-column label="座位号" width="100" align="center">
              <template #default="{ row }">
                <span v-if="row.seatNumber">{{ row.seatNumber }}</span>
                <span v-else class="text-muted">--</span>
              </template>
            </el-table-column>
            <el-table-column label="课堂表现" width="120" align="center">
              <template #default="{ row }">
                <el-rate 
                  v-model="row.classPerformance" 
                  :max="5" 
                  show-score 
                  text-color="#ff9900"
                  @change="updatePerformance(row)"
                  :disabled="row.attendanceStatus === 'absent'"
                />
              </template>
            </el-table-column>
            <el-table-column label="操作" width="150" align="center" fixed="right">
              <template #default="{ row }">
                <el-button
                  v-if="row.attendanceStatus === 'absent'"
                  size="small"
                  type="primary"
                  @click="checkInStudent(row)"
                >
                  手动签到
                </el-button>
                <el-button
                  v-else
                  size="small"
                  type="warning"
                  @click="cancelCheckIn(row)"
                >
                  取消签到
                </el-button>
                <el-button
                  size="small"
                  type="text"
                  @click="viewDetail(row)"
                >
                  详情
                </el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-tab-pane>

      <!-- 课堂表现Tab -->
      <el-tab-pane label="课堂表现" name="performance">
        <div class="performance-section">
          <!-- 互动统计 -->
          <div class="interaction-stats">
            <h4>互动统计</h4>
            <div class="stats-grid">
              <div class="stat-item">
                <div class="stat-number">{{ interactionStats.questions }}</div>
                <div class="stat-label">提问次数</div>
              </div>
              <div class="stat-item">
                <div class="stat-number">{{ interactionStats.answers }}</div>
                <div class="stat-label">回答次数</div>
              </div>
              <div class="stat-item">
                <div class="stat-number">{{ interactionStats.discussions }}</div>
                <div class="stat-label">讨论参与</div>
              </div>
            </div>
          </div>

          <!-- 表现记录列表 -->
          <div class="performance-records">
            <div class="records-header">
              <h4>表现记录</h4>
              <el-button type="primary" @click="addPerformanceRecord">
                <el-icon><Plus /></el-icon>
                添加记录
              </el-button>
            </div>
            <div class="records-list">
              <div 
                v-for="record in performanceRecords" 
                :key="record.id"
                class="record-item"
              >
                <div class="record-header">
                  <div class="student-info">
                    <span class="student-name">{{ record.studentName }}</span>
                    <span class="record-type">{{ record.type }}</span>
                  </div>
                  <div class="record-time">{{ formatDateTime(record.time) }}</div>
                </div>
                <div class="record-content">
                  <p>{{ record.content }}</p>
                  <div class="record-score">
                    <span>评分：</span>
                    <el-rate :model-value="record.score" disabled show-score />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </el-tab-pane>

      <!-- 课程记录Tab -->
      <el-tab-pane label="课程记录" name="records">
        <div class="course-records">
          <div class="records-header">
            <h4>课程进度记录</h4>
            <el-button type="primary" @click="addCourseRecord">
              <el-icon><Plus /></el-icon>
              添加记录
            </el-button>
          </div>
          <div class="timeline-container">
            <el-timeline>
              <el-timeline-item
                v-for="record in courseRecords"
                :key="record.id"
                :timestamp="record.time"
                placement="top"
              >
                <el-card>
                  <h4>{{ record.title }}</h4>
                  <p>{{ record.content }}</p>
                  <div v-if="record.attachments?.length" class="record-attachments">
                    <span>附件：</span>
                    <el-link 
                      v-for="file in record.attachments" 
                      :key="file.name"
                      type="primary"
                      style="margin-right: 8px"
                    >
                      {{ file.name }}
                    </el-link>
                  </div>
                </el-card>
              </el-timeline-item>
            </el-timeline>
          </div>
        </div>
      </el-tab-pane>
    </el-tabs>

    <!-- 手动签到对话框 -->
    <el-dialog
      v-model="showManualCheckIn"
      title="手动签到"
      width="400px"
    >
      <el-form :model="checkInForm">
        <el-form-item label="选择学员">
          <el-select v-model="checkInForm.studentId" placeholder="请选择学员" style="width: 100%">
            <el-option
              v-for="student in absentStudents"
              :key="student.id"
              :label="student.name"
              :value="student.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="座位号">
          <el-input v-model="checkInForm.seatNumber" placeholder="请输入座位号" />
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="checkInForm.note" placeholder="签到备注（可选）" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showManualCheckIn = false">取消</el-button>
        <el-button type="primary" @click="confirmManualCheckIn">确认签到</el-button>
      </template>
    </el-dialog>

    <!-- 添加表现记录对话框 -->
    <el-dialog
      v-model="showAddPerformance"
      title="添加表现记录"
      width="500px"
    >
      <el-form :model="performanceForm" label-width="80px">
        <el-form-item label="选择学员">
          <el-select v-model="performanceForm.studentId" placeholder="请选择学员" style="width: 100%">
            <el-option
              v-for="student in presentStudents"
              :key="student.id"
              :label="student.name"
              :value="student.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="记录类型">
          <el-select v-model="performanceForm.type" placeholder="请选择类型" style="width: 100%">
            <el-option label="主动提问" value="question" />
            <el-option label="回答问题" value="answer" />
            <el-option label="积极讨论" value="discussion" />
            <el-option label="违纪行为" value="violation" />
          </el-select>
        </el-form-item>
        <el-form-item label="具体内容">
          <el-input
            v-model="performanceForm.content"
            type="textarea"
            placeholder="请描述具体的表现内容"
            :rows="3"
          />
        </el-form-item>
        <el-form-item label="评分">
          <el-rate v-model="performanceForm.score" :max="5" show-score />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showAddPerformance = false">取消</el-button>
        <el-button type="primary" @click="confirmAddPerformance">添加记录</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Clock, LocationFilled, UserFilled, Star, VideoPlay, Download, Refresh, 
  Search, Plus, ArrowLeft
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
const activeTab = ref('attendance')
const statusFilter = ref('')
const searchKeyword = ref('')
const isAttendanceOpen = ref(false)
const attendanceLoading = ref(false)
const showManualCheckIn = ref(false)
const showAddPerformance = ref(false)

// 表单数据
const checkInForm = ref({
  studentId: '',
  seatNumber: '',
  note: ''
})

const performanceForm = ref({
  studentId: '',
  type: '',
  content: '',
  score: 3
})

// 模拟学员数据
const studentList = ref([
  {
    id: '1',
    name: '张三',
    studentId: '00242',
    department: 'MBA(31期)>人员赋权管理组>测试1组',
    attendanceStatus: 'present',
    checkInTime: '2025-07-18 09:05',
    seatNumber: 'A01',
    classPerformance: 5
  },
  {
    id: '2',
    name: '李四',
    studentId: '00243',
    department: 'MBA(31期)>人员赋权管理组>测试2组',
    attendanceStatus: 'late',
    checkInTime: '2025-07-18 09:15',
    seatNumber: 'A02',
    classPerformance: 4
  },
  {
    id: '3',
    name: '王五',
    studentId: '00244',
    department: 'MBA(31期)>人员赋权管理组>测试1组',
    attendanceStatus: 'absent',
    checkInTime: null,
    seatNumber: null,
    classPerformance: 0
  },
  {
    id: '4',
    name: '赵六',
    studentId: '00245',
    department: 'MBA(31期)>人员赋权管理组>测试3组',
    attendanceStatus: 'present',
    checkInTime: '2025-07-18 08:58',
    seatNumber: 'B01',
    classPerformance: 4
  },
  {
    id: '5',
    name: '钱七',
    studentId: '00246',
    department: 'MBA(31期)>人员赋权管理组>测试2组',
    attendanceStatus: 'present',
    checkInTime: '2025-07-18 09:02',
    seatNumber: 'B02',
    classPerformance: 5
  }
])

// 模拟表现记录数据
const performanceRecords = ref([
  {
    id: '1',
    studentName: '张三',
    type: '主动提问',
    content: '针对项目管理中的风险评估提出了深入的问题，显示出良好的理解能力',
    score: 5,
    time: '2025-07-18 10:30'
  },
  {
    id: '2',
    studentName: '钱七',
    type: '积极讨论',
    content: '在小组讨论中积极发言，提出了建设性的观点和解决方案',
    score: 5,
    time: '2025-07-18 11:15'
  },
  {
    id: '3',
    studentName: '李四',
    type: '回答问题',
    content: '正确回答了关于敏捷开发方法论的问题，答案准确完整',
    score: 4,
    time: '2025-07-18 11:45'
  }
])

// 模拟课程记录数据
const courseRecords = ref([
  {
    id: '1',
    title: '课程开始 - 破冰活动',
    content: '进行学员自我介绍和团队破冰活动，建立轻松的学习氛围',
    time: '09:00',
    attachments: []
  },
  {
    id: '2',
    title: '理论讲解 - 项目管理基础',
    content: '详细讲解项目管理的基本概念、流程和方法论，包括传统瀑布模型和敏捷开发方法',
    time: '10:00',
    attachments: [
      { name: '项目管理基础.pptx', url: '#' }
    ]
  },
  {
    id: '3',
    title: '案例分析',
    content: '通过实际案例分析，让学员理解项目管理在实际工作中的应用',
    time: '11:00',
    attachments: [
      { name: '案例分析材料.pdf', url: '#' }
    ]
  }
])

// 计算属性
const attendanceStats = computed(() => {
  const present = studentList.value.filter(s => s.attendanceStatus === 'present').length
  const late = studentList.value.filter(s => s.attendanceStatus === 'late').length
  const absent = studentList.value.filter(s => s.attendanceStatus === 'absent').length
  const active = studentList.value.filter(s => s.classPerformance >= 4).length
  
  return { present: present + late, active, absent }
})

const attendanceRate = computed(() => {
  const total = studentList.value.length
  const attended = attendanceStats.value.present
  return total > 0 ? Math.round((attended / total) * 100) : 0
})

const interactionStats = computed(() => {
  const questions = performanceRecords.value.filter(r => r.type === '主动提问').length
  const answers = performanceRecords.value.filter(r => r.type === '回答问题').length
  const discussions = performanceRecords.value.filter(r => r.type === '积极讨论').length
  
  return { questions, answers, discussions }
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

const absentStudents = computed(() => {
  return studentList.value.filter(s => s.attendanceStatus === 'absent')
})

const presentStudents = computed(() => {
  return studentList.value.filter(s => s.attendanceStatus !== 'absent')
})

// 工具方法
const getAttendanceTagType = (status: string) => {
  const types = {
    present: 'success',
    late: 'warning',
    absent: 'danger'
  }
  return types[status] || 'info'
}

const getAttendanceText = (status: string) => {
  const texts = {
    present: '已签到',
    late: '迟到',
    absent: '缺席'
  }
  return texts[status] || status
}

const formatTimeRange = (startTime?: string, endTime?: string) => {
  if (!startTime || !endTime) return '2025-07-18 09:00 至 2025-07-18 12:00'
  
  const start = new Date(startTime)
  const end = new Date(endTime)
  
  return `${start.toLocaleString()} 至 ${end.toLocaleString()}`
}

const formatDateTime = (dateString: string) => {
  if (!dateString) return '--'
  return dateString
}

// 操作方法
const startClass = () => {
  ElMessage.success('开始上课，已自动开启签到')
  isAttendanceOpen.value = true
}

const toggleAttendance = () => {
  attendanceLoading.value = true
  setTimeout(() => {
    isAttendanceOpen.value = !isAttendanceOpen.value
    attendanceLoading.value = false
    ElMessage.success(isAttendanceOpen.value ? '签到已开启' : '签到已关闭')
  }, 1000)
}

const manualCheckIn = () => {
  if (absentStudents.value.length === 0) {
    ElMessage.info('所有学员都已签到')
    return
  }
  checkInForm.value = {
    studentId: '',
    seatNumber: '',
    note: ''
  }
  showManualCheckIn.value = true
}

const confirmManualCheckIn = () => {
  const student = studentList.value.find(s => s.id === checkInForm.value.studentId)
  if (student) {
    student.attendanceStatus = 'present'
    student.checkInTime = new Date().toLocaleString()
    student.seatNumber = checkInForm.value.seatNumber
    
    ElMessage.success(`${student.name} 签到成功`)
    showManualCheckIn.value = false
  }
}

const batchCheckIn = () => {
  ElMessageBox.confirm('确定要为所有缺席学员进行批量签到吗？', '批量签到确认', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    absentStudents.value.forEach(student => {
      student.attendanceStatus = 'present'
      student.checkInTime = new Date().toLocaleString()
    })
    ElMessage.success('批量签到完成')
  })
}

const checkInStudent = (student: any) => {
  student.attendanceStatus = 'present'
  student.checkInTime = new Date().toLocaleString()
  ElMessage.success(`${student.name} 签到成功`)
}

const cancelCheckIn = (student: any) => {
  ElMessageBox.confirm(`确定要取消 ${student.name} 的签到吗？`, '取消签到确认', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    student.attendanceStatus = 'absent'
    student.checkInTime = null
    student.seatNumber = null
    ElMessage.success('签到已取消')
  })
}

const updatePerformance = (student: any) => {
  ElMessage.success(`${student.name} 的课堂表现评分已更新`)
}

const viewDetail = (student: any) => {
  ElMessage.info(`查看 ${student.name} 的详细信息`)
}

const addPerformanceRecord = () => {
  if (presentStudents.value.length === 0) {
    ElMessage.info('没有已签到的学员')
    return
  }
  performanceForm.value = {
    studentId: '',
    type: '',
    content: '',
    score: 3
  }
  showAddPerformance.value = true
}

const confirmAddPerformance = () => {
  const student = studentList.value.find(s => s.id === performanceForm.value.studentId)
  if (student) {
    const newRecord = {
      id: Date.now().toString(),
      studentName: student.name,
      type: performanceForm.value.type,
      content: performanceForm.value.content,
      score: performanceForm.value.score,
      time: new Date().toLocaleString()
    }
    
    performanceRecords.value.unshift(newRecord)
    ElMessage.success('表现记录添加成功')
    showAddPerformance.value = false
  }
}

const addCourseRecord = () => {
  ElMessage.info('添加课程记录功能')
}

const exportData = () => {
  ElMessage.success('正在导出面授培训数据...')
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
  console.log('面授培训管理界面已加载，任务信息:', props.task)
})
</script>

<style scoped>
.task-face-to-face-management {
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

.course-tabs {
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  padding: 16px;
}

.attendance-control {
  margin-bottom: 16px;
}

.control-card {
  box-shadow: none;
  border: 1px solid #eee;
}

.control-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.control-header h4 {
  margin: 0;
  font-size: 16px;
  color: #333;
}

.control-status {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  color: #666;
}

.status-indicator {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #ccc;
}

.status-indicator.active {
  background: #67c23a;
}

.control-actions {
  display: flex;
  gap: 8px;
}

.filter-section {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding: 12px 16px;
  background: #f8f9fa;
  border-radius: 8px;
}

.table-card {
  box-shadow: none;
  border: 1px solid #eee;
}

.text-muted {
  color: #999;
}

.performance-section {
  max-height: 600px;
  overflow-y: auto;
}

.interaction-stats {
  margin-bottom: 24px;
  padding: 16px;
  background: #f8f9fa;
  border-radius: 8px;
}

.interaction-stats h4 {
  margin: 0 0 16px 0;
  font-size: 16px;
  color: #333;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
}

.stat-item {
  text-align: center;
  padding: 12px;
  background: #fff;
  border-radius: 6px;
  border: 1px solid #eee;
}

.stat-number {
  font-size: 20px;
  font-weight: bold;
  color: #409eff;
  margin-bottom: 4px;
}

.stat-label {
  font-size: 12px;
  color: #666;
}

.performance-records {
  background: #fff;
  border-radius: 8px;
  padding: 16px;
}

.records-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding-bottom: 8px;
  border-bottom: 1px solid #eee;
}

.records-header h4 {
  margin: 0;
  font-size: 16px;
  color: #333;
}

.record-item {
  margin-bottom: 16px;
  padding: 16px;
  background: #f8f9fa;
  border-radius: 8px;
  border: 1px solid #eee;
}

.record-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.student-info {
  display: flex;
  align-items: center;
  gap: 8px;
}

.student-name {
  font-weight: 600;
  color: #333;
}

.record-type {
  font-size: 12px;
  color: #666;
  background: #e7f4ff;
  padding: 2px 6px;
  border-radius: 10px;
}

.record-time {
  font-size: 12px;
  color: #999;
}

.record-content p {
  margin: 0 0 8px 0;
  line-height: 1.6;
  color: #333;
}

.record-score {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  color: #666;
}

.course-records {
  max-height: 600px;
  overflow-y: auto;
}

.records-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding-bottom: 8px;
  border-bottom: 1px solid #eee;
}

.timeline-container {
  max-height: 500px;
  overflow-y: auto;
}

.record-attachments {
  margin-top: 8px;
  font-size: 14px;
  color: #666;
}

:deep(.el-table) {
  font-size: 14px;
}

:deep(.el-table th) {
  background-color: #f8f9fa;
  font-weight: 600;
}

:deep(.el-rate) {
  line-height: 1;
}

:deep(.el-timeline-item__timestamp) {
  font-size: 12px;
  color: #999;
}
</style> 