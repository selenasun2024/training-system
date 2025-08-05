<template>
  <div class="student-management-panel">
    <el-tabs v-model="activeTab" class="student-tabs">
      <!-- 学员列表 -->
      <el-tab-pane name="student-list">
        <template #label>
          <div class="tab-label">
            <el-icon><User /></el-icon>
            <span>学员列表</span>
            <el-badge :value="myStudents.length" v-if="myStudents.length > 0" />
          </div>
        </template>
        
        <div class="student-list-section">
          <div class="section-header">
            <h3>我的学员</h3>
            <div class="header-actions">
              <el-button @click="showFilters = !showFilters">
                <el-icon><Filter /></el-icon>
                筛选
              </el-button>
              <el-button type="primary" @click="showAddStudentDialog = true">
                <el-icon><Plus /></el-icon>
                添加学员
              </el-button>
            </div>
          </div>
          
          <!-- 筛选器 -->
          <div v-show="showFilters" class="filters-panel">
            <el-row :gutter="16">
              <el-col :span="6">
                <el-select v-model="filters.status" placeholder="学员状态" clearable>
                  <el-option label="全部状态" value="" />
                  <el-option label="活跃" value="active" />
                  <el-option label="暂停" value="paused" />
                  <el-option label="完成" value="completed" />
                </el-select>
              </el-col>
              <el-col :span="6">
                <el-select v-model="filters.progress" placeholder="进度范围" clearable>
                  <el-option label="全部进度" value="" />
                  <el-option label="0-30%" value="low" />
                  <el-option label="30-70%" value="medium" />
                  <el-option label="70-100%" value="high" />
                </el-select>
              </el-col>
              <el-col :span="6">
                <el-select v-model="filters.department" placeholder="部门" clearable>
                  <el-option label="全部部门" value="" />
                  <el-option label="技术部" value="tech" />
                  <el-option label="产品部" value="product" />
                  <el-option label="运营部" value="operation" />
                </el-select>
              </el-col>
              <el-col :span="6">
                <el-input v-model="filters.search" placeholder="搜索学员" clearable>
                  <template #prefix>
                    <el-icon><Search /></el-icon>
                  </template>
                </el-input>
              </el-col>
            </el-row>
          </div>
          
          <!-- 学员列表表格 -->
          <div class="students-table">
            <el-table :data="filteredStudents" style="width: 100%">
              <el-table-column label="学员信息" width="200">
                <template #default="scope">
                  <div class="student-info">
                    <el-avatar :size="40" :src="scope.row.avatar" />
                    <div class="student-details">
                      <div class="student-name">{{ scope.row.name }}</div>
                      <div class="student-id">{{ scope.row.employeeId }}</div>
                    </div>
                  </div>
                </template>
              </el-table-column>
              
              <el-table-column label="部门/职位" width="180">
                <template #default="scope">
                  <div class="dept-position">
                    <div class="department">{{ scope.row.department }}</div>
                    <div class="position">{{ scope.row.position }}</div>
                  </div>
                </template>
              </el-table-column>
              
              <el-table-column label="项目名称" prop="projectName" width="200" />
              
              <el-table-column label="当前阶段" prop="currentPhase" width="150" />
              
              <el-table-column label="总体进度" width="200">
                <template #default="scope">
                  <div class="progress-column">
                    <el-progress 
                      :percentage="scope.row.progress" 
                      :color="getProgressColor(scope.row.progress)"
                    />
                    <span class="progress-text">{{ scope.row.progress }}%</span>
                  </div>
                </template>
              </el-table-column>
              
              <el-table-column label="状态" width="100">
                <template #default="scope">
                  <el-tag :type="getStatusType(scope.row.status)">
                    {{ getStatusLabel(scope.row.status) }}
                  </el-tag>
                </template>
              </el-table-column>
              
              <el-table-column label="入职时间" width="120">
                <template #default="scope">
                  <span>{{ formatDate(scope.row.entryDate) }}</span>
                </template>
              </el-table-column>
              
              <el-table-column label="操作" width="200">
                <template #default="scope">
                  <el-button size="small" @click="handleViewProgress(scope.row.id)">
                    查看进度
                  </el-button>
                  <el-button size="small" type="primary" @click="handleContactStudent(scope.row.id)">
                    联系
                  </el-button>
                  <el-button size="small" @click="handleEditStudent(scope.row.id)">
                    编辑
                  </el-button>
                </template>
              </el-table-column>
            </el-table>
          </div>
          
          <el-empty v-if="filteredStudents.length === 0" description="暂无符合条件的学员" />
        </div>
      </el-tab-pane>

      <!-- 进度跟踪 -->
      <el-tab-pane name="progress-tracking">
        <template #label>
          <div class="tab-label">
            <el-icon><TrendCharts /></el-icon>
            <span>进度跟踪</span>
            <el-badge :value="overdueStudents.length" type="warning" v-if="overdueStudents.length > 0" />
          </div>
        </template>
        
        <div class="progress-tracking-section">
          <div class="section-header">
            <h3>学员进度跟踪</h3>
            <div class="header-actions">
              <el-button @click="refreshProgress">
                <el-icon><Refresh /></el-icon>
                刷新数据
              </el-button>
              <el-button type="primary" @click="exportProgressReport">
                <el-icon><Download /></el-icon>
                导出报告
              </el-button>
            </div>
          </div>
          
          <!-- 进度概览 -->
          <div class="progress-overview">
            <el-row :gutter="20">
              <el-col :span="6">
                <div class="overview-card">
                  <div class="card-icon" style="background: #e6f7ff; color: #1890ff;">
                    <el-icon><User /></el-icon>
                  </div>
                  <div class="card-content">
                    <h4>{{ myStudents.length }}</h4>
                    <p>学员总数</p>
                  </div>
                </div>
              </el-col>
              <el-col :span="6">
                <div class="overview-card">
                  <div class="card-icon" style="background: #f6ffed; color: #52c41a;">
                    <el-icon><SuccessFilled /></el-icon>
                  </div>
                  <div class="card-content">
                    <h4>{{ onTrackStudents }}</h4>
                    <p>按时进行</p>
                  </div>
                </div>
              </el-col>
              <el-col :span="6">
                <div class="overview-card">
                  <div class="card-icon" style="background: #fff7e6; color: #fa8c16;">
                    <el-icon><WarningFilled /></el-icon>
                  </div>
                  <div class="card-content">
                    <h4>{{ behindStudents }}</h4>
                    <p>进度滞后</p>
                  </div>
                </div>
              </el-col>
              <el-col :span="6">
                <div class="overview-card">
                  <div class="card-icon" style="background: #fff1f0; color: #f5222d;">
                    <el-icon><CircleCloseFilled /></el-icon>
                  </div>
                  <div class="card-content">
                    <h4>{{ overdueStudents.length }}</h4>
                    <p>逾期风险</p>
                  </div>
                </div>
              </el-col>
            </el-row>
          </div>
          
          <!-- 进度详情表格 -->
          <div class="progress-table">
            <el-table :data="myStudents" style="width: 100%">
              <el-table-column label="学员信息" width="200">
                <template #default="scope">
                  <div class="student-info">
                    <el-avatar :size="40" :src="scope.row.avatar" />
                    <div class="student-details">
                      <div class="student-name">{{ scope.row.name }}</div>
                      <div class="student-id">{{ scope.row.employeeId }}</div>
                    </div>
                  </div>
                </template>
              </el-table-column>
              
              <el-table-column label="当前阶段" prop="currentPhase" width="150" />
              
              <el-table-column label="总体进度" width="200">
                <template #default="scope">
                  <div class="progress-column">
                    <el-progress 
                      :percentage="scope.row.progress" 
                      :color="getProgressColor(scope.row.progress)"
                    />
                    <span class="progress-text">{{ scope.row.progress }}%</span>
                  </div>
                </template>
              </el-table-column>
              
              <el-table-column label="预期完成" width="120">
                <template #default="scope">
                  <span>{{ formatDate(scope.row.expectedEndDate) }}</span>
                </template>
              </el-table-column>
              
              <el-table-column label="状态" width="100">
                <template #default="scope">
                  <el-tag :type="getStatusType(scope.row.status)">
                    {{ getStatusLabel(scope.row.status) }}
                  </el-tag>
                </template>
              </el-table-column>
              
              <el-table-column label="最近更新" width="120">
                <template #default="scope">
                  <span>{{ formatDate(scope.row.lastUpdate) }}</span>
                </template>
              </el-table-column>
              
              <el-table-column label="操作" width="150">
                <template #default="scope">
                  <el-button size="small" @click="viewDetailedProgress(scope.row.id)">
                    详情
                  </el-button>
                  <el-button size="small" type="primary" @click="updateProgress(scope.row.id)">
                    更新
                  </el-button>
                </template>
              </el-table-column>
            </el-table>
          </div>
        </div>
      </el-tab-pane>

      <!-- 沟通记录 -->
      <el-tab-pane name="communication-records">
        <template #label>
          <div class="tab-label">
            <el-icon><ChatDotRound /></el-icon>
            <span>沟通记录</span>
            <el-badge :value="newCommunications" type="danger" v-if="newCommunications > 0" />
          </div>
        </template>
        
        <div class="communication-section">
          <div class="section-header">
            <h3>沟通记录</h3>
            <div class="header-actions">
              <el-button @click="showCommunicationFilter = !showCommunicationFilter">
                <el-icon><Filter /></el-icon>
                筛选
              </el-button>
              <el-button type="primary" @click="showAddCommunicationDialog = true">
                <el-icon><Plus /></el-icon>
                添加记录
              </el-button>
            </div>
          </div>
          
          <!-- 沟通筛选器 -->
          <div v-show="showCommunicationFilter" class="filters-panel">
            <el-row :gutter="16">
              <el-col :span="6">
                <el-select v-model="communicationFilters.student" placeholder="选择学员" clearable>
                  <el-option label="全部学员" value="" />
                  <el-option 
                    v-for="student in myStudents" 
                    :key="student.id"
                    :label="student.name" 
                    :value="student.id" 
                  />
                </el-select>
              </el-col>
              <el-col :span="6">
                <el-select v-model="communicationFilters.type" placeholder="沟通类型" clearable>
                  <el-option label="全部类型" value="" />
                  <el-option label="面谈" value="meeting" />
                  <el-option label="电话" value="phone" />
                  <el-option label="邮件" value="email" />
                  <el-option label="即时消息" value="chat" />
                </el-select>
              </el-col>
              <el-col :span="6">
                <el-date-picker
                  v-model="communicationFilters.dateRange"
                  type="daterange"
                  placeholder="选择日期范围"
                  format="YYYY-MM-DD"
                  value-format="YYYY-MM-DD"
                />
              </el-col>
              <el-col :span="6">
                <el-input v-model="communicationFilters.search" placeholder="搜索内容" clearable>
                  <template #prefix>
                    <el-icon><Search /></el-icon>
                  </template>
                </el-input>
              </el-col>
            </el-row>
          </div>
          
          <!-- 沟通记录时间线 -->
          <div class="communication-timeline">
            <el-timeline>
              <el-timeline-item
                v-for="record in filteredCommunications"
                :key="record.id"
                :timestamp="formatDateTime(record.createdAt)"
                :type="getCommunicationType(record.type)"
              >
                <div class="communication-item">
                  <div class="communication-header">
                    <div class="participant-info">
                      <el-avatar :size="30" :src="getStudentAvatar(record.studentId)" />
                      <span class="participant-name">{{ getStudentName(record.studentId) }}</span>
                      <el-tag size="small" :type="getCommunicationTagType(record.type)">
                        {{ getCommunicationTypeLabel(record.type) }}
                      </el-tag>
                    </div>
                    <div class="communication-actions">
                      <el-button size="small" @click="editCommunication(record.id)">编辑</el-button>
                      <el-button size="small" type="danger" @click="deleteCommunication(record.id)">删除</el-button>
                    </div>
                  </div>
                  
                  <div class="communication-content">
                    <h4 class="communication-subject">{{ record.subject }}</h4>
                    <p class="communication-summary">{{ record.summary }}</p>
                    
                    <div class="communication-details" v-if="record.details">
                      <el-collapse>
                        <el-collapse-item title="详细内容" :name="record.id">
                          <p>{{ record.details }}</p>
                        </el-collapse-item>
                      </el-collapse>
                    </div>
                    
                    <div class="communication-tags" v-if="record.tags && record.tags.length > 0">
                      <el-tag 
                        v-for="tag in record.tags" 
                        :key="tag" 
                        size="small" 
                        class="tag-item"
                      >
                        {{ tag }}
                      </el-tag>
                    </div>
                  </div>
                  
                  <div class="communication-footer" v-if="record.nextActions">
                    <div class="next-actions">
                      <strong>后续行动：</strong>
                      <span>{{ record.nextActions }}</span>
                    </div>
                  </div>
                </div>
              </el-timeline-item>
            </el-timeline>
            
            <el-empty v-if="filteredCommunications.length === 0" description="暂无沟通记录" />
          </div>
        </div>
      </el-tab-pane>
    </el-tabs>

    <!-- 添加学员对话框 -->
    <el-dialog v-model="showAddStudentDialog" title="添加学员" width="500px">
      <!-- 添加学员表单 -->
      <div>添加学员表单 - 待完善</div>
      <template #footer>
        <el-button @click="showAddStudentDialog = false">取消</el-button>
        <el-button type="primary">确定添加</el-button>
      </template>
    </el-dialog>

    <!-- 添加沟通记录对话框 -->
    <el-dialog v-model="showAddCommunicationDialog" title="添加沟通记录" width="600px">
      <!-- 沟通记录表单 -->
      <div>沟通记录表单 - 待完善</div>
      <template #footer>
        <el-button @click="showAddCommunicationDialog = false">取消</el-button>
        <el-button type="primary">保存记录</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { 
  User, 
  Filter, 
  Plus, 
  Search, 
  TrendCharts, 
  Refresh, 
  Download,
  SuccessFilled,
  WarningFilled,
  CircleCloseFilled,
  ChatDotRound
} from '@element-plus/icons-vue'

import { useMentorWorkbenchStore } from '@/stores/mentorWorkbench'

const mentorStore = useMentorWorkbenchStore()

// 响应式数据
const activeTab = ref('student-list')
const showFilters = ref(false)
const showCommunicationFilter = ref(false)
const showAddStudentDialog = ref(false)
const showAddCommunicationDialog = ref(false)

const filters = ref({
  status: '',
  progress: '',
  department: '',
  search: ''
})

const communicationFilters = ref({
  student: '',
  type: '',
  dateRange: [],
  search: ''
})

// 计算属性
const myStudents = computed(() => mentorStore.myStudents || [])
const communicationRecords = computed(() => mentorStore.communicationRecords || [])

const filteredStudents = computed(() => {
  let students = myStudents.value
  
  if (filters.value.status) {
    students = students.filter(s => s.status === filters.value.status)
  }
  
  if (filters.value.progress) {
    students = students.filter(s => {
      if (filters.value.progress === 'low') return s.progress <= 30
      if (filters.value.progress === 'medium') return s.progress > 30 && s.progress <= 70
      if (filters.value.progress === 'high') return s.progress > 70
      return true
    })
  }
  
  if (filters.value.department) {
    students = students.filter(s => s.department === filters.value.department)
  }
  
  if (filters.value.search) {
    const search = filters.value.search.toLowerCase()
    students = students.filter(s => 
      s.name.toLowerCase().includes(search) ||
      s.employeeId.toLowerCase().includes(search)
    )
  }
  
  return students
})

const filteredCommunications = computed(() => {
  let communications = communicationRecords.value
  
  if (communicationFilters.value.student) {
    communications = communications.filter(c => c.studentId === communicationFilters.value.student)
  }
  
  if (communicationFilters.value.type) {
    communications = communications.filter(c => c.type === communicationFilters.value.type)
  }
  
  if (communicationFilters.value.search) {
    const search = communicationFilters.value.search.toLowerCase()
    communications = communications.filter(c => 
      c.subject.toLowerCase().includes(search) ||
      c.summary.toLowerCase().includes(search)
    )
  }
  
  return communications.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
})

const onTrackStudents = computed(() => {
  return myStudents.value.filter(s => s.progress >= 70 && s.status === 'active').length
})

const behindStudents = computed(() => {
  return myStudents.value.filter(s => s.progress < 50 && s.status === 'active').length
})

const overdueStudents = computed(() => {
  return myStudents.value.filter(s => {
    const expected = new Date(s.expectedEndDate)
    const now = new Date()
    return expected < now && s.status === 'active'
  })
})

const newCommunications = computed(() => {
  // 计算新的沟通记录数量（示例逻辑）
  return communicationRecords.value.filter(c => {
    const created = new Date(c.createdAt)
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)
    return created > oneDayAgo
  }).length
})

// 方法
function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('zh-CN')
}

function formatDateTime(dateStr: string): string {
  return new Date(dateStr).toLocaleString('zh-CN')
}

function getProgressColor(progress: number): string {
  if (progress < 30) return '#f56c6c'
  if (progress < 70) return '#e6a23c'
  return '#67c23a'
}

function getStatusType(status: string): string {
  const types = { active: 'success', paused: 'warning', completed: 'info' }
  return types[status] || 'info'
}

function getStatusLabel(status: string): string {
  const labels = { active: '活跃', paused: '暂停', completed: '完成' }
  return labels[status] || status
}

function getCommunicationType(type: string): string {
  const types = { 
    meeting: 'primary', 
    phone: 'success', 
    email: 'warning', 
    chat: 'info' 
  }
  return types[type] || 'info'
}

function getCommunicationTagType(type: string): string {
  const types = { 
    meeting: 'primary', 
    phone: 'success', 
    email: 'warning', 
    chat: 'info' 
  }
  return types[type] || 'info'
}

function getCommunicationTypeLabel(type: string): string {
  const labels = { 
    meeting: '面谈', 
    phone: '电话', 
    email: '邮件', 
    chat: '即时消息' 
  }
  return labels[type] || type
}

function getStudentName(studentId: string): string {
  const student = myStudents.value.find(s => s.id === studentId)
  return student ? student.name : '未知学员'
}

function getStudentAvatar(studentId: string): string {
  const student = myStudents.value.find(s => s.id === studentId)
  return student ? student.avatar : ''
}

// 事件处理
function handleViewProgress(studentId: string) {
  console.log('查看学员进度:', studentId)
}

function handleContactStudent(studentId: string) {
  console.log('联系学员:', studentId)
}

function handleEditStudent(studentId: string) {
  console.log('编辑学员信息:', studentId)
}

function refreshProgress() {
  console.log('刷新进度数据')
}

function exportProgressReport() {
  console.log('导出进度报告')
}

function viewDetailedProgress(studentId: string) {
  console.log('查看详细进度:', studentId)
}

function updateProgress(studentId: string) {
  console.log('更新进度:', studentId)
}

function editCommunication(communicationId: string) {
  console.log('编辑沟通记录:', communicationId)
}

function deleteCommunication(communicationId: string) {
  console.log('删除沟通记录:', communicationId)
}
</script>

<style scoped>
.student-management-panel {
  height: 100%;
  padding: 20px;
}

.student-tabs {
  height: 100%;
}

.tab-label {
  display: flex;
  align-items: center;
  gap: 8px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.section-header h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #303133;
}

.header-actions {
  display: flex;
  gap: 8px;
}

.filters-panel {
  margin-bottom: 20px;
  padding: 16px;
  background: #f5f7fa;
  border-radius: 8px;
}

/* 学员列表样式 */
.students-table {
  background: white;
  border-radius: 8px;
  padding: 20px;
}

.dept-position {
  display: flex;
  flex-direction: column;
}

.department {
  font-weight: 500;
  color: #303133;
}

.position {
  font-size: 12px;
  color: #909399;
}

/* 进度跟踪样式 */
.progress-overview {
  margin-bottom: 30px;
}

.overview-card {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 20px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.card-icon {
  width: 48px;
  height: 48px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
}

.card-content h4 {
  margin: 0 0 4px 0;
  font-size: 24px;
  font-weight: 600;
  color: #303133;
}

.card-content p {
  margin: 0;
  font-size: 14px;
  color: #606266;
}

.progress-table {
  background: white;
  border-radius: 8px;
  padding: 20px;
}

.student-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.student-details {
  display: flex;
  flex-direction: column;
}

.student-name {
  font-weight: 500;
  color: #303133;
}

.student-id {
  font-size: 12px;
  color: #909399;
}

.progress-column {
  display: flex;
  align-items: center;
  gap: 12px;
}

.progress-text {
  font-size: 14px;
  color: #606266;
  min-width: 40px;
}

/* 沟通记录样式 */
.communication-timeline {
  background: white;
  border-radius: 8px;
  padding: 20px;
}

.communication-item {
  background: #f5f7fa;
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 16px;
}

.communication-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.participant-info {
  display: flex;
  align-items: center;
  gap: 8px;
}

.participant-name {
  font-weight: 500;
  color: #303133;
}

.communication-subject {
  margin: 0 0 8px 0;
  font-size: 16px;
  font-weight: 500;
  color: #303133;
}

.communication-summary {
  margin: 0 0 12px 0;
  color: #606266;
  line-height: 1.5;
}

.communication-tags {
  margin-top: 12px;
}

.tag-item {
  margin-right: 8px;
  margin-bottom: 4px;
}

.communication-footer {
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid #ebeef5;
}

.next-actions {
  font-size: 14px;
  color: #606266;
}

.next-actions strong {
  color: #303133;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .student-management-panel {
    padding: 16px;
  }
  
  .students-table {
    padding: 16px;
  }
  
  .overview-card {
    flex-direction: column;
    text-align: center;
    gap: 8px;
  }
  
  .communication-header {
    flex-direction: column;
    align-items: stretch;
    gap: 8px;
  }
  
  .participant-info {
    justify-content: center;
  }
}
</style> 