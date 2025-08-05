<template>
  <div class="exam-questionnaire-management">
    <!-- 页面头部 -->
    <div class="page-header">
      <div class="header-info">
        <h2>考试和问卷管理</h2>
        <div class="header-meta">
          <span>发布时间：{{ currentDate }}</span>
          <span>考试次数：{{ totalCount }}</span>
          <span>考试人数：{{ totalParticipants }}人</span>
        </div>
      </div>
      <div class="header-actions">
        <el-button type="primary" @click="createExam">创建考试</el-button>
        <el-button type="primary" @click="createQuestionnaire">创建问卷</el-button>
      </div>
    </div>

    <!-- 筛选条件 -->
    <div class="filter-section">
      <el-form :model="filters" inline>
        <el-form-item label="类型">
          <el-select v-model="filters.type" placeholder="请选择" style="width: 120px">
            <el-option label="全部" value="" />
            <el-option label="考试" value="exam" />
            <el-option label="问卷" value="questionnaire" />
          </el-select>
        </el-form-item>
        
        <el-form-item label="状态">
          <el-select v-model="filters.status" placeholder="请选择" style="width: 120px">
            <el-option label="全部" value="" />
            <el-option label="草稿" value="draft" />
            <el-option label="已发布" value="published" />
            <el-option label="已结束" value="finished" />
            <el-option label="已关闭" value="closed" />
          </el-select>
        </el-form-item>

        <el-form-item label="时间范围">
          <el-date-picker
            v-model="filters.dateRange"
            type="daterange"
            range-separator="~"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            style="width: 240px"
          />
        </el-form-item>

        <el-form-item label="部门">
          <el-select v-model="filters.department" placeholder="请选择" style="width: 150px">
            <el-option label="全部" value="" />
            <el-option label="人力资源部" value="人力资源部" />
            <el-option label="消费者服务" value="消费者服务" />
            <el-option label="技术部" value="技术部" />
          </el-select>
        </el-form-item>

        <el-form-item>
          <el-button type="primary" @click="handleSearch">查询</el-button>
          <el-button @click="resetFilters">重置</el-button>
        </el-form-item>
      </el-form>
    </div>

    <!-- 数据表格 -->
    <div class="table-section">
      <el-table :data="filteredList" stripe border size="default" v-loading="loading">
        <el-table-column prop="code" label="编号" width="80" />
        <el-table-column prop="title" label="标题" min-width="200" />
        <el-table-column label="类别" width="100">
          <template #default="{ row }">
            <el-tag :type="row.itemType === 'exam' ? 'warning' : 'info'" size="small">
              {{ row.itemType === 'exam' ? '考试' : '问卷' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="category" label="类型" width="120" />
        <el-table-column prop="department" label="部门" width="150" />
        <el-table-column prop="location" label="所在地址" min-width="180" />
        <el-table-column label="开始时间" width="160">
          <template #default="{ row }">
            {{ formatTime(row.startTime) }}
          </template>
        </el-table-column>
        <el-table-column label="截止时间" width="160">
          <template #default="{ row }">
            {{ formatTime(row.endTime) }}
          </template>
        </el-table-column>
        <el-table-column label="管理员信息" width="120">
          <template #default="{ row }">
            <span>--</span>
          </template>
        </el-table-column>
        <el-table-column label="同导师学员数（%）" width="140">
          <template #default="{ row }">
            <span>{{ row.attendees?.length || 0 }}</span>
          </template>
        </el-table-column>
        <el-table-column label="主导者监督地块" width="140">
          <template #default="{ row }">
            <span>0</span>
          </template>
        </el-table-column>
        <el-table-column label="考次" width="80">
          <template #default="{ row }">
            <span>--</span>
          </template>
        </el-table-column>
        <el-table-column label="主导者监督地块" width="140">
          <template #default="{ row }">
            <span>--</span>
          </template>
        </el-table-column>
        <el-table-column label="参与数量" width="100">
          <template #default="{ row }">
            <span>{{ row.attendees?.length || 0 }}</span>
          </template>
        </el-table-column>
        <el-table-column label="计算项目" width="100">
          <template #default="{ row }">
            <span>--</span>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="150" fixed="right">
          <template #default="{ row }">
            <el-button type="text" size="small" @click="viewItem(row)">查看</el-button>
            <el-button type="text" size="small" @click="editItem(row)">编辑</el-button>
            <el-popconfirm title="确认删除？" @confirm="deleteItem(row)">
              <template #reference>
                <el-button type="text" size="small" style="color: #f56c6c">删除</el-button>
              </template>
            </el-popconfirm>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="pagination-wrapper">
        <el-pagination
          v-model:current-page="pagination.currentPage"
          v-model:page-size="pagination.pageSize"
          :page-sizes="[10, 20, 50, 100]"
          :total="pagination.total"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </div>

    <!-- 表单弹窗 -->
    <ExamForm v-if="examFormVisible && currentItem" v-model:visible="examFormVisible" :exam-id="currentItem.id" />
    <QuestionnaireForm v-if="questionnaireFormVisible" v-model:visible="questionnaireFormVisible" @save="handleQuestionnaireSave" />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useExamStore } from '../stores/exam'
import { useQuestionnaireStore } from '../stores/questionnaire'
import { storeToRefs } from 'pinia'
import ExamForm from './ExamForm.vue'
import QuestionnaireForm from './QuestionnaireForm.vue'
import { ElMessage, ElMessageBox } from 'element-plus'

// 使用 stores
const examStore = useExamStore()
const questionnaireStore = useQuestionnaireStore()
const { exams } = storeToRefs(examStore)
const { questionnaires } = storeToRefs(questionnaireStore)

// 界面状态
const loading = ref(false)
const examFormVisible = ref(false)
const questionnaireFormVisible = ref(false)
const currentItem = ref<any>(null)

// 筛选条件
const filters = ref({
  type: '',
  status: '',
  dateRange: [] as [string, string] | [],
  department: ''
})

// 分页
const pagination = ref({
  currentPage: 1,
  pageSize: 10,
  total: 0
})

// 计算属性
const currentDate = computed(() => new Date().toLocaleDateString('zh-CN'))
const totalCount = computed(() => exams.value.length + questionnaires.value.length)
const totalParticipants = computed(() => {
  const examParticipants = exams.value.reduce((sum, exam) => sum + exam.attendees.length, 0)
  const questionnaireParticipants = questionnaires.value.reduce((sum, q) => sum + q.participants.length, 0)
  return examParticipants + questionnaireParticipants
})

// 合并考试和问卷数据
const combinedList = computed(() => {
  const examList = exams.value.map(exam => ({ ...exam, itemType: 'exam' }))
  const questionnaireList = questionnaires.value.map(q => ({ ...q, itemType: 'questionnaire' }))
  return [...examList, ...questionnaireList].sort((a, b) => 
    new Date(b.createTime).getTime() - new Date(a.createTime).getTime()
  )
})

// 过滤后的列表
const filteredList = computed(() => {
  let list = combinedList.value

  // 类型筛选
  if (filters.value.type) {
    list = list.filter(item => item.itemType === filters.value.type)
  }

  // 状态筛选
  if (filters.value.status) {
    list = list.filter(item => item.status === filters.value.status)
  }

  // 部门筛选
  if (filters.value.department) {
    list = list.filter(item => item.department.includes(filters.value.department))
  }

  // 时间范围筛选
  if (filters.value.dateRange && filters.value.dateRange.length === 2) {
    const [start, end] = filters.value.dateRange
    list = list.filter(item => {
      const itemDate = new Date(item.startTime)
      return itemDate >= new Date(start) && itemDate <= new Date(end)
    })
  }

  // 更新分页总数
  pagination.value.total = list.length

  // 分页处理
  const start = (pagination.value.currentPage - 1) * pagination.value.pageSize
  const end = start + pagination.value.pageSize
  return list.slice(start, end)
})

// 方法
function handleSearch() {
  pagination.value.currentPage = 1
}

function resetFilters() {
  filters.value = {
    type: '',
    status: '',
    dateRange: [],
    department: ''
  }
  pagination.value.currentPage = 1
}

function formatTime(timeStr: string) {
  if (!timeStr) return '--'
  return new Date(timeStr).toLocaleString('zh-CN')
}

function createExam() {
  const exam = examStore.createExam('')
  currentItem.value = exam
  examFormVisible.value = true
}

function createQuestionnaire() {
  questionnaireFormVisible.value = true
}

function handleQuestionnaireSave(data: any) {
  const questionnaire = questionnaireStore.createQuestionnaire()
  questionnaireStore.updateQuestionnaire(questionnaire.id, {
    title: data.title,
    templateId: data.templateId,
    intro: data.intro,
    startTime: data.dateRange?.[0] || '',
    endTime: data.dateRange?.[1] || ''
  })
  ElMessage.success('问卷创建成功')
}

function viewItem(item: any) {
  ElMessage.info(`查看${item.itemType === 'exam' ? '考试' : '问卷'}：${item.title}`)
}

function editItem(item: any) {
  currentItem.value = item
  if (item.itemType === 'exam') {
    examFormVisible.value = true
  } else {
    questionnaireFormVisible.value = true
  }
}

function deleteItem(item: any) {
  if (item.itemType === 'exam') {
    examStore.deleteExam(item.id)
  } else {
    questionnaireStore.deleteQuestionnaire(item.id)
  }
  ElMessage.success('删除成功')
}

function handleSizeChange(size: number) {
  pagination.value.pageSize = size
  pagination.value.currentPage = 1
}

function handleCurrentChange(page: number) {
  pagination.value.currentPage = page
}

onMounted(() => {
  // 初始化数据
})
</script>

<style scoped>
.exam-questionnaire-management {
  padding: 20px;
  background: #fff;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 20px;
  padding-bottom: 16px;
  border-bottom: 1px solid #e4e7ed;
}

.header-info h2 {
  margin: 0 0 8px 0;
  font-size: 20px;
  font-weight: 600;
}

.header-meta {
  display: flex;
  gap: 24px;
  font-size: 14px;
  color: #606266;
}

.header-actions {
  display: flex;
  gap: 12px;
}

.filter-section {
  margin-bottom: 20px;
  padding: 16px;
  background: #f5f7fa;
  border-radius: 4px;
}

.table-section {
  margin-bottom: 20px;
}

.pagination-wrapper {
  display: flex;
  justify-content: flex-end;
  margin-top: 20px;
}

:deep(.el-table) {
  font-size: 14px;
}

:deep(.el-table th) {
  background: #fafafa;
  font-weight: 600;
}
</style> 