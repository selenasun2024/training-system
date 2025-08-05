<template>
  <el-dialog
    v-model="innerVisible"
    :title="`${homework?.title || '作业'} - 提交列表`"
    width="90%"
    top="5vh"
    @close="handleClose"
  >
    <div class="submission-container">
      <!-- 统计信息 -->
      <div class="submission-stats">
        <el-card class="stat-card">
          <el-statistic title="总人数" :value="homework?.assignedTo?.length || 0" />
        </el-card>
        <el-card class="stat-card">
          <el-statistic title="已提交" :value="submittedCount" />
        </el-card>
        <el-card class="stat-card">
          <el-statistic title="未提交" :value="unsubmittedCount" />
        </el-card>
        <el-card class="stat-card">
          <el-statistic title="已批改" :value="reviewedCount" />
        </el-card>
        <el-card class="stat-card">
          <el-statistic title="平均分" :value="averageScore" :precision="1" />
        </el-card>
        <el-card class="stat-card">
          <el-statistic title="提交率" :value="submissionRate" suffix="%" />
        </el-card>
      </div>

      <!-- 操作栏 -->
      <div class="actions-bar">
        <div class="actions-left">
          <el-button type="primary" @click="batchReview" :disabled="unReviewedSubmissions.length === 0">
            <el-icon><Edit /></el-icon>
            批量批改
          </el-button>
          <el-button @click="exportSubmissions">
            <el-icon><Download /></el-icon>
            导出数据
          </el-button>
          <el-button @click="sendReminder" :disabled="unsubmittedStudents.length === 0">
            <el-icon><Message /></el-icon>
            催交提醒
          </el-button>
        </div>
        <div class="actions-right">
          <el-select v-model="filterStatus" placeholder="筛选状态" clearable style="width: 150px">
            <el-option label="全部" value="" />
            <el-option label="已提交" value="submitted" />
            <el-option label="未提交" value="unsubmitted" />
            <el-option label="已批改" value="reviewed" />
            <el-option label="待批改" value="pending" />
          </el-select>
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

      <!-- 提交列表 -->
      <div class="submission-list">
        <el-table
          :data="filteredSubmissions"
          stripe
          style="width: 100%"
          @selection-change="handleSelectionChange"
        >
          <el-table-column type="selection" width="55" />
          <el-table-column prop="studentName" label="学员姓名" width="120" />
          <el-table-column prop="department" label="部门" width="120" />
          <el-table-column prop="position" label="职位" width="100" />
          <el-table-column label="提交状态" width="100">
            <template #default="{ row }">
              <el-tag :type="getSubmissionStatusColor(row.status)">
                {{ getSubmissionStatusText(row.status) }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="submitTime" label="提交时间" width="160">
            <template #default="{ row }">
              {{ row.submitTime ? formatDateTime(row.submitTime) : '-' }}
            </template>
          </el-table-column>
          <el-table-column label="提交附件" width="120">
            <template #default="{ row }">
              <div v-if="row.attachments?.length" class="attachments">
                <el-tooltip
                  v-for="attachment in row.attachments"
                  :key="attachment.id"
                  :content="attachment.name"
                  placement="top"
                >
                  <el-button
                    size="small"
                    type="text"
                    @click="downloadAttachment(attachment)"
                  >
                    <el-icon><Document /></el-icon>
                  </el-button>
                </el-tooltip>
              </div>
              <span v-else class="no-attachment">无附件</span>
            </template>
          </el-table-column>
          <el-table-column label="批改状态" width="100">
            <template #default="{ row }">
              <el-tag v-if="row.status === 'submitted'" type="warning">
                待批改
              </el-tag>
              <el-tag v-else-if="row.reviewed" type="success">
                已批改
              </el-tag>
              <span v-else>-</span>
            </template>
          </el-table-column>
          <el-table-column prop="score" label="得分" width="80">
            <template #default="{ row }">
              <span v-if="row.score !== null && row.score !== undefined" class="score">
                {{ row.score }}分
              </span>
              <span v-else>-</span>
            </template>
          </el-table-column>
          <el-table-column prop="reviewTime" label="批改时间" width="160">
            <template #default="{ row }">
              {{ row.reviewTime ? formatDateTime(row.reviewTime) : '-' }}
            </template>
          </el-table-column>
          <el-table-column label="操作" width="180" fixed="right">
            <template #default="{ row }">
              <el-button
                v-if="row.status === 'submitted'"
                size="small"
                type="primary"
                @click="reviewSubmission(row)"
              >
                批改
              </el-button>
              <el-button
                v-if="row.reviewed"
                size="small"
                type="success"
                @click="viewReview(row)"
              >
                查看批改
              </el-button>
              <el-button
                v-if="row.status === 'unsubmitted'"
                size="small"
                type="warning"
                @click="remindStudent(row)"
              >
                催交
              </el-button>
              <el-button
                size="small"
                type="text"
                @click="viewSubmissionDetail(row)"
              >
                详情
              </el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>
    </div>

    <!-- 提交详情对话框 -->
    <!-- <SubmissionDetailDialog
      v-model:visible="showDetailDialog"
      :submission="selectedSubmission"
      :homework="homework"
    /> -->

    <!-- 批改结果查看对话框 -->
    <!-- <ReviewResultDialog
      v-model:visible="showReviewResultDialog"
      :submission="selectedSubmission"
      :homework="homework"
    /> -->

    <template #footer>
      <div class="dialog-footer">
        <el-button @click="handleClose">关闭</el-button>
        <el-button
          type="primary"
          @click="startBatchReview"
          :disabled="selectedSubmissions.length === 0"
        >
          批改选中项 ({{ selectedSubmissions.length }})
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Edit, Download, Message, Search, Document
} from '@element-plus/icons-vue'

// 导入子组件
// import SubmissionDetailDialog from './SubmissionDetailDialog.vue'
// import ReviewResultDialog from './ReviewResultDialog.vue'

const props = defineProps<{
  visible: boolean
  homework: any
}>()

const emit = defineEmits<{
  (e: 'update:visible', value: boolean): void
  (e: 'review', submission: any): void
}>()

// 内部可见性状态
const innerVisible = ref(props.visible)
watch(() => props.visible, (val) => {
  innerVisible.value = val
})
watch(innerVisible, (val) => {
  emit('update:visible', val)
})

// 对话框状态
const showDetailDialog = ref(false)
const showReviewResultDialog = ref(false)
const selectedSubmission = ref<any>(null)
const selectedSubmissions = ref<any[]>([])

// 筛选状态
const filterStatus = ref('')
const searchKeyword = ref('')

// 计算完整的提交列表（包含未提交的学员）
const fullSubmissionList = computed(() => {
  const homework = props.homework
  if (!homework) return []

  const assignedStudents = homework.assignedTo || []
  const submissions = homework.submissions || []
  
  return assignedStudents.map((student: any) => {
    const submission = submissions.find((s: any) => s.studentId === student.id)
    
    if (submission) {
      return {
        ...submission,
        studentName: student.name,
        department: student.department || '未知部门',
        position: student.position || '未知职位'
      }
    } else {
      return {
        id: `unsubmitted-${student.id}`,
        studentId: student.id,
        studentName: student.name,
        department: student.department || '未知部门',
        position: student.position || '未知职位',
        status: 'unsubmitted',
        submitTime: null,
        attachments: [],
        reviewed: false,
        score: null,
        feedback: null,
        reviewTime: null
      }
    }
  })
})

// 筛选后的提交列表
const filteredSubmissions = computed(() => {
  let filtered = fullSubmissionList.value

  if (filterStatus.value) {
    if (filterStatus.value === 'submitted') {
      filtered = filtered.filter(s => s.status === 'submitted' || s.status === 'reviewed')
    } else if (filterStatus.value === 'reviewed') {
      filtered = filtered.filter(s => s.reviewed)
    } else if (filterStatus.value === 'pending') {
      filtered = filtered.filter(s => s.status === 'submitted' && !s.reviewed)
    } else {
      filtered = filtered.filter(s => s.status === filterStatus.value)
    }
  }

  if (searchKeyword.value) {
    const keyword = searchKeyword.value.toLowerCase()
    filtered = filtered.filter(s => 
      s.studentName.toLowerCase().includes(keyword) ||
      s.department.toLowerCase().includes(keyword)
    )
  }

  return filtered
})

// 统计数据
const submittedCount = computed(() => 
  fullSubmissionList.value.filter(s => s.status === 'submitted' || s.status === 'reviewed').length
)

const unsubmittedCount = computed(() => 
  fullSubmissionList.value.filter(s => s.status === 'unsubmitted').length
)

const reviewedCount = computed(() => 
  fullSubmissionList.value.filter(s => s.reviewed).length
)

const averageScore = computed(() => {
  const reviewedSubmissions = fullSubmissionList.value.filter(s => s.reviewed && s.score !== null)
  if (reviewedSubmissions.length === 0) return 0
  
  const totalScore = reviewedSubmissions.reduce((sum, s) => sum + s.score, 0)
  return totalScore / reviewedSubmissions.length
})

const submissionRate = computed(() => {
  const total = fullSubmissionList.value.length
  if (total === 0) return 0
  return Math.round((submittedCount.value / total) * 100)
})

const unReviewedSubmissions = computed(() => 
  fullSubmissionList.value.filter(s => s.status === 'submitted' && !s.reviewed)
)

const unsubmittedStudents = computed(() => 
  fullSubmissionList.value.filter(s => s.status === 'unsubmitted')
)

// 工具方法
const getSubmissionStatusColor = (status: string) => {
  const colors = {
    submitted: 'warning',
    reviewed: 'success',
    unsubmitted: 'info'
  }
  return colors[status] || 'info'
}

const getSubmissionStatusText = (status: string) => {
  const texts = {
    submitted: '已提交',
    reviewed: '已批改',
    unsubmitted: '未提交'
  }
  return texts[status] || status
}

const formatDateTime = (dateString: string) => {
  return new Date(dateString).toLocaleString('zh-CN')
}

// 操作方法
const handleClose = () => {
  innerVisible.value = false
}

const handleSelectionChange = (selections: any[]) => {
  selectedSubmissions.value = selections
}

const reviewSubmission = (submission: any) => {
  selectedSubmission.value = submission
  emit('review', submission)
}

const viewReview = (submission: any) => {
  selectedSubmission.value = submission
  showReviewResultDialog.value = true
}

const viewSubmissionDetail = (submission: any) => {
  selectedSubmission.value = submission
  showDetailDialog.value = true
}

const remindStudent = (student: any) => {
  ElMessage.success(`已向 ${student.studentName} 发送催交提醒`)
}

const downloadAttachment = (attachment: any) => {
  ElMessage.success(`正在下载 ${attachment.name}`)
}

const batchReview = () => {
  if (unReviewedSubmissions.value.length === 0) {
    ElMessage.warning('没有需要批改的提交')
    return
  }
  
  ElMessage.info('开始批量批改模式')
}

const startBatchReview = () => {
  const unreviewed = selectedSubmissions.value.filter(s => s.status === 'submitted' && !s.reviewed)
  if (unreviewed.length === 0) {
    ElMessage.warning('请选择待批改的提交')
    return
  }
  
  // 批量批改逻辑
  ElMessage.success(`开始批改 ${unreviewed.length} 份提交`)
}

const exportSubmissions = () => {
  ElMessage.success('正在导出提交数据...')
}

const sendReminder = () => {
  if (unsubmittedStudents.value.length === 0) {
    ElMessage.warning('没有需要催交的学员')
    return
  }
  
  ElMessageBox.confirm(
    `确定向 ${unsubmittedStudents.value.length} 名未提交的学员发送催交提醒吗？`,
    '批量催交',
    {
      confirmButtonText: '发送',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(() => {
    ElMessage.success(`已向 ${unsubmittedStudents.value.length} 名学员发送催交提醒`)
  })
}
</script>

<style scoped>
.submission-container {
  padding: 0;
}

.submission-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 16px;
  margin-bottom: 20px;
}

.stat-card {
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.actions-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding: 16px;
  background: #f8f9fa;
  border-radius: 8px;
}

.actions-left,
.actions-right {
  display: flex;
  gap: 12px;
  align-items: center;
}

.submission-list {
  border: 1px solid #e8e8e8;
  border-radius: 8px;
  overflow: hidden;
}

.attachments {
  display: flex;
  gap: 4px;
}

.no-attachment {
  color: #999;
  font-size: 12px;
}

.score {
  font-weight: 600;
  color: #67c23a;
}

.dialog-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
</style> 