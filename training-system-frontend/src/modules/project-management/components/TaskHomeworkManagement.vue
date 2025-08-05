<template>
  <div class="task-homework-management">
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
          <h3>{{ task?.name || '作业管理' }}</h3>
        </div>
        <div class="task-meta">
          <span class="meta-item">
            <el-icon><Document /></el-icon>
            作业类型：{{ task?.config?.type || '常规作业' }}
          </span>
          <span class="meta-item">
            <el-icon><Calendar /></el-icon>
            截止时间：{{ formatDateTime(task?.config?.deadline) || '2025-07-18 23:59' }}
          </span>
          <span class="meta-item">
            <el-icon><UserFilled /></el-icon>
            参与人数：{{ studentList.length }}人
          </span>
          <span class="meta-item">
            <el-icon><TrophyBase /></el-icon>
            总分：{{ task?.config?.totalScore || 100 }}分
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
          <div class="stats-number">{{ homeworkStats.submitted }}</div>
          <div class="stats-label">已提交</div>
        </div>
      </el-card>
      <el-card class="stats-card">
        <div class="stats-content">
          <div class="stats-number">{{ homeworkStats.reviewed }}</div>
          <div class="stats-label">已批改</div>
        </div>
      </el-card>
      <el-card class="stats-card">
        <div class="stats-content">
          <div class="stats-number">{{ homeworkStats.unsubmitted }}</div>
          <div class="stats-label">未提交</div>
        </div>
      </el-card>
      <el-card class="stats-card">
        <div class="stats-content">
          <div class="stats-number">{{ averageScore.toFixed(1) }}</div>
          <div class="stats-label">平均分</div>
        </div>
      </el-card>
    </div>

    <!-- 筛选控制 -->
    <div class="filter-section">
      <div class="filter-left">
        <el-select v-model="statusFilter" placeholder="筛选状态" clearable style="width: 120px">
          <el-option label="全部" value="" />
          <el-option label="已提交" value="submitted" />
          <el-option label="已批改" value="reviewed" />
          <el-option label="未提交" value="unsubmitted" />
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

    <!-- 作业表格 -->
    <el-card shadow="never" class="table-card">
      <el-table
        :data="filteredStudentList"
        stripe
        border
        style="width: 100%"
        :default-sort="{ prop: 'submitTime', order: 'descending' }"
      >
        <el-table-column type="index" label="序号" width="60" align="center" />
        <el-table-column prop="name" label="姓名" width="100" />
        <el-table-column prop="studentId" label="学号" width="120" />
        <el-table-column prop="department" label="所在部门" width="150" />
        <el-table-column prop="position" label="职位" width="120" />
        <el-table-column label="提交状态" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="getStatusTagType(row.submissionStatus)">
              {{ getStatusText(row.submissionStatus) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="提交时间" width="150" align="center">
          <template #default="{ row }">
            <span v-if="row.submitTime">
              {{ formatDateTime(row.submitTime) }}
            </span>
            <span v-else class="text-muted">--</span>
          </template>
        </el-table-column>
        <el-table-column label="批改状态" width="100" align="center">
          <template #default="{ row }">
            <el-tag v-if="row.submissionStatus === 'reviewed'" type="success">已批改</el-tag>
            <el-tag v-else-if="row.submissionStatus === 'submitted'" type="warning">待批改</el-tag>
            <span v-else class="text-muted">--</span>
          </template>
        </el-table-column>
        <el-table-column label="得分" width="100" align="center">
          <template #default="{ row }">
            <span v-if="row.score !== null" class="score-text">
              {{ row.score }}分
            </span>
            <span v-else class="text-muted">--</span>
          </template>
        </el-table-column>
        <el-table-column label="备注" min-width="150">
          <template #default="{ row }">
            <span v-if="row.feedback">{{ row.feedback }}</span>
            <span v-else class="text-muted">--</span>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="180" align="center" fixed="right">
          <template #default="{ row }">
            <el-button
              v-if="row.submissionStatus === 'submitted'"
              size="small"
              type="primary"
              @click="reviewHomework(row)"
            >
              批改
            </el-button>
            <el-button
              v-if="row.submissionStatus === 'submitted' || row.submissionStatus === 'reviewed'"
              size="small"
              type="text"
              @click="viewSubmission(row)"
            >
              查看提交
            </el-button>
            <el-button
              v-if="row.submissionStatus === 'reviewed'"
              size="small"
              type="text"
              @click="editReview(row)"
            >
              修改批改
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 批改作业对话框 -->
    <el-dialog
      v-model="showReviewDialog"
      title="批改作业"
      width="600px"
      :before-close="handleCloseReview"
    >
      <div v-if="selectedStudent" class="review-content">
        <div class="student-info">
          <h4>学员信息</h4>
          <el-descriptions :column="2" border size="small">
            <el-descriptions-item label="姓名">{{ selectedStudent.name }}</el-descriptions-item>
            <el-descriptions-item label="学号">{{ selectedStudent.studentId }}</el-descriptions-item>
            <el-descriptions-item label="部门">{{ selectedStudent.department }}</el-descriptions-item>
            <el-descriptions-item label="提交时间">{{ formatDateTime(selectedStudent.submitTime) }}</el-descriptions-item>
          </el-descriptions>
        </div>
        
        <div class="submission-content">
          <h4>作业内容</h4>
          <div class="content-display">
            <p>{{ selectedStudent.submissionContent || '学员提交的作业内容在此显示...' }}</p>
          </div>
          
          <div v-if="selectedStudent.attachments?.length" class="attachments">
            <h5>附件</h5>
            <div class="attachment-list">
              <div 
                v-for="(file, index) in selectedStudent.attachments" 
                :key="index" 
                class="attachment-item"
              >
                <el-icon><Document /></el-icon>
                <span>{{ file.name }}</span>
                <el-button size="small" type="text" @click="downloadFile(file)">下载</el-button>
              </div>
            </div>
          </div>
        </div>
        
        <div class="review-form">
          <h4>批改评分</h4>
          <el-form :model="reviewForm" label-width="80px">
            <el-form-item label="得分">
              <el-input-number 
                v-model="reviewForm.score" 
                :min="0" 
                :max="task?.config?.totalScore || 100"
                style="width: 120px"
              />
              <span class="score-hint">/ {{ task?.config?.totalScore || 100 }}分</span>
            </el-form-item>
            <el-form-item label="评语">
              <el-input
                v-model="reviewForm.feedback"
                type="textarea"
                :rows="4"
                placeholder="请输入批改评语"
              />
            </el-form-item>
          </el-form>
        </div>
      </div>
      
      <template #footer>
        <el-button @click="handleCloseReview">取消</el-button>
        <el-button type="primary" @click="confirmReview">保存批改</el-button>
      </template>
    </el-dialog>

    <!-- 查看提交对话框 -->
    <el-dialog
      v-model="showViewDialog"
      title="查看作业提交"
      width="600px"
    >
      <div v-if="selectedStudent" class="view-content">
        <div class="student-info">
          <el-descriptions :column="2" border size="small">
            <el-descriptions-item label="姓名">{{ selectedStudent.name }}</el-descriptions-item>
            <el-descriptions-item label="学号">{{ selectedStudent.studentId }}</el-descriptions-item>
            <el-descriptions-item label="提交时间">{{ formatDateTime(selectedStudent.submitTime) }}</el-descriptions-item>
            <el-descriptions-item label="得分">
              <span v-if="selectedStudent.score !== null">{{ selectedStudent.score }}分</span>
              <span v-else>未批改</span>
            </el-descriptions-item>
          </el-descriptions>
        </div>
        
        <div class="submission-content">
          <h4>作业内容</h4>
          <div class="content-display">
            <p>{{ selectedStudent.submissionContent || '学员提交的作业内容在此显示...' }}</p>
          </div>
        </div>
        
        <div v-if="selectedStudent.feedback" class="feedback-content">
          <h4>批改评语</h4>
          <div class="feedback-display">
            <p>{{ selectedStudent.feedback }}</p>
          </div>
        </div>
      </div>
      
      <template #footer>
        <el-button @click="showViewDialog = false">关闭</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Document, Calendar, UserFilled, TrophyBase, Download, Refresh, Search, ArrowLeft
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
const showReviewDialog = ref(false)
const showViewDialog = ref(false)
const selectedStudent = ref<any>(null)

// 表单数据
const reviewForm = ref({
  score: 0,
  feedback: ''
})

// 模拟学员数据
const studentList = ref([
  {
    id: '1',
    name: '张三',
    studentId: '00242',
    department: 'MBA(31期)>人员赋权管理组>测试1组',
    position: '正式',
    submissionStatus: 'reviewed',
    submitTime: '2025-07-18 14:30',
    score: 85,
    feedback: '作业完成质量较好，分析思路清晰，但部分细节还需要进一步完善。',
    submissionContent: '根据案例分析，我认为该项目管理中存在以下几个关键问题：1. 沟通机制不完善...',
    attachments: [
      { name: '项目分析报告.docx', url: '#' },
      { name: '数据统计表.xlsx', url: '#' }
    ]
  },
  {
    id: '2',
    name: '李四',
    studentId: '00243',
    department: 'MBA(31期)>人员赋权管理组>测试2组',
    position: '正式',
    submissionStatus: 'submitted',
    submitTime: '2025-07-17 16:45',
    score: null,
    feedback: '',
    submissionContent: '通过对案例的深入研究，我发现项目管理过程中的主要挑战包括...',
    attachments: [
      { name: '案例分析.pdf', url: '#' }
    ]
  },
  {
    id: '3',
    name: '王五',
    studentId: '00244',
    department: 'MBA(31期)>人员赋权管理组>测试1组',
    position: '正式',
    submissionStatus: 'unsubmitted',
    submitTime: null,
    score: null,
    feedback: '',
    submissionContent: '',
    attachments: []
  },
  {
    id: '4',
    name: '赵六',
    studentId: '00245',
    department: 'MBA(31期)>人员赋权管理组>测试3组',
    position: '正式',
    submissionStatus: 'reviewed',
    submitTime: '2025-07-16 10:20',
    score: 92,
    feedback: '优秀的作业，分析透彻，解决方案具有很强的实用性。',
    submissionContent: '项目管理是一个复杂的系统工程，需要统筹考虑多个维度...',
    attachments: []
  },
  {
    id: '5',
    name: '钱七',
    studentId: '00246',
    department: 'MBA(31期)>人员赋权管理组>测试2组',
    position: '正式',
    submissionStatus: 'submitted',
    submitTime: '2025-07-18 09:15',
    score: null,
    feedback: '',
    submissionContent: '基于项目管理理论，结合实际案例进行分析...',
    attachments: [
      { name: '项目管理分析.docx', url: '#' }
    ]
  }
])

// 计算属性
const homeworkStats = computed(() => {
  const submitted = studentList.value.filter(s => s.submissionStatus === 'submitted' || s.submissionStatus === 'reviewed').length
  const reviewed = studentList.value.filter(s => s.submissionStatus === 'reviewed').length
  const unsubmitted = studentList.value.filter(s => s.submissionStatus === 'unsubmitted').length
  
  return { submitted, reviewed, unsubmitted }
})

const averageScore = computed(() => {
  const reviewedStudents = studentList.value.filter(s => s.score !== null)
  if (reviewedStudents.length === 0) return 0
  
  const totalScore = reviewedStudents.reduce((sum, s) => sum + s.score, 0)
  return totalScore / reviewedStudents.length
})

const filteredStudentList = computed(() => {
  let filtered = studentList.value

  // 状态筛选
  if (statusFilter.value) {
    filtered = filtered.filter(student => student.submissionStatus === statusFilter.value)
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
    submitted: 'warning',
    reviewed: 'success',
    unsubmitted: 'danger'
  }
  return types[status] || 'info'
}

const getStatusText = (status: string) => {
  const texts = {
    submitted: '已提交',
    reviewed: '已批改',
    unsubmitted: '未提交'
  }
  return texts[status] || status
}

const formatDateTime = (dateString?: string) => {
  if (!dateString) return '--'
  return dateString
}

// 操作方法
const reviewHomework = (student: any) => {
  selectedStudent.value = student
  reviewForm.value = {
    score: student.score || 0,
    feedback: student.feedback || ''
  }
  showReviewDialog.value = true
}

const editReview = (student: any) => {
  reviewHomework(student)
}

const viewSubmission = (student: any) => {
  selectedStudent.value = student
  showViewDialog.value = true
}

const confirmReview = () => {
  if (selectedStudent.value) {
    selectedStudent.value.score = reviewForm.value.score
    selectedStudent.value.feedback = reviewForm.value.feedback
    selectedStudent.value.submissionStatus = 'reviewed'
    
    ElMessage.success(`${selectedStudent.value.name} 的作业批改完成`)
    showReviewDialog.value = false
  }
}

const handleCloseReview = () => {
  showReviewDialog.value = false
}

const downloadFile = (file: any) => {
  ElMessage.info(`下载文件：${file.name}`)
}

const exportData = () => {
  ElMessage.success('正在导出作业数据...')
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
  console.log('作业任务管理界面已加载，任务信息:', props.task)
})
</script>

<style scoped>
.task-homework-management {
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

.score-text {
  font-weight: 600;
  color: #67c23a;
}

.review-content,
.view-content {
  max-height: 500px;
  overflow-y: auto;
}

.student-info,
.submission-content,
.review-form,
.feedback-content {
  margin-bottom: 20px;
}

.student-info h4,
.submission-content h4,
.review-form h4,
.feedback-content h4 {
  margin: 0 0 12px 0;
  font-size: 16px;
  color: #333;
  border-bottom: 1px solid #eee;
  padding-bottom: 8px;
}

.content-display,
.feedback-display {
  padding: 12px;
  background: #f8f9fa;
  border-radius: 4px;
  border: 1px solid #e9ecef;
  min-height: 80px;
}

.content-display p,
.feedback-display p {
  margin: 0;
  line-height: 1.6;
  color: #333;
}

.attachments h5 {
  margin: 12px 0 8px 0;
  font-size: 14px;
  color: #666;
}

.attachment-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.attachment-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: #f8f9fa;
  border-radius: 4px;
  border: 1px solid #e9ecef;
}

.attachment-item span {
  flex: 1;
  font-size: 14px;
  color: #333;
}

.score-hint {
  margin-left: 8px;
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

:deep(.el-descriptions-item__label) {
  width: 80px;
}
</style> 