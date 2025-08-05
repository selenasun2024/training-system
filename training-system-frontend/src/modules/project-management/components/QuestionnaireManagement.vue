<template>
  <div class="questionnaire-management">
    <!-- 页面头部 -->
    <div class="page-header">
      <div class="header-info">
        <div class="header-title">
          <el-button 
            type="text" 
            @click="goBack"
            class="back-button"
          >
            <el-icon><ArrowLeft /></el-icon>
          </el-button>
          <h2>问卷管理</h2>
        </div>
        <div class="header-meta">
          <span>发布时间：{{ currentDate }}</span>
          <span>问卷数量：{{ questionnaires.length }}</span>
          <span>回收总数：{{ totalResponses }}份</span>
        </div>
      </div>
      <div class="header-actions">
        <el-button type="primary" @click="createQuestionnaire">创建问卷</el-button>
        <el-button @click="importTemplates">导入模板</el-button>
        <el-button @click="exportResults">导出结果</el-button>
      </div>
    </div>

    <!-- 筛选条件 -->
    <div class="filter-section">
      <el-form :model="filters" inline>
        <el-form-item label="问卷状态">
          <el-select v-model="filters.status" placeholder="请选择" style="width: 120px">
            <el-option label="全部" value="" />
            <el-option label="草稿" value="draft" />
            <el-option label="已发布" value="published" />
            <el-option label="收集中" value="collecting" />
            <el-option label="已结束" value="finished" />
            <el-option label="已关闭" value="closed" />
          </el-select>
        </el-form-item>
        
        <el-form-item label="问卷类型">
          <el-select v-model="filters.type" placeholder="请选择" style="width: 120px">
            <el-option label="全部" value="" />
            <el-option label="满意度调研" value="satisfaction" />
            <el-option label="培训反馈" value="feedback" />
            <el-option label="需求调研" value="demand" />
            <el-option label="其他" value="other" />
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
        <el-table-column type="selection" width="55" />
        <el-table-column prop="code" label="编号" width="80" />
        <el-table-column prop="title" label="问卷名称" min-width="200" />
        <el-table-column prop="category" label="类别" width="120" />
        <el-table-column label="问卷类型" width="100">
          <template #default="{ row }">
            <el-tag type="primary" size="small">
              {{ getTypeText(row.type) }}
            </el-tag>
          </template>
        </el-table-column>
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
        <el-table-column label="参与人数" width="100">
          <template #default="{ row }">
            {{ row.participants?.length || 0 }}
          </template>
        </el-table-column>
        <el-table-column label="回收数量" width="100">
          <template #default="{ row }">
            {{ row.responses?.length || 0 }}
          </template>
        </el-table-column>
        <el-table-column label="回收率" width="100">
          <template #default="{ row }">
            {{ getResponseRate(row) }}%
          </template>
        </el-table-column>
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)" size="small">
              {{ getStatusText(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="220" fixed="right">
          <template #default="{ row }">
            <el-button type="text" size="small" @click="viewQuestionnaire(row)">查看</el-button>
            <el-button type="text" size="small" @click="editQuestionnaire(row)">编辑</el-button>
            <el-button type="text" size="small" @click="viewResults(row)">结果</el-button>
            <el-button type="text" size="small" @click="manageParticipants(row)">参与者</el-button>
            <el-button type="text" size="small" @click="duplicateQuestionnaire(row)">复制</el-button>
            <el-popconfirm title="确认删除？" @confirm="deleteQuestionnaire(row)">
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
    <QuestionnaireForm v-if="questionnaireFormVisible" v-model:visible="questionnaireFormVisible" @save="handleQuestionnaireSave" />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useQuestionnaireStore } from '../stores/questionnaire'
import { storeToRefs } from 'pinia'
import QuestionnaireForm from './QuestionnaireForm.vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { ArrowLeft } from '@element-plus/icons-vue'

// Props
const props = defineProps<{
  projectId?: string
  task?: any
}>()

// 定义事件
const emit = defineEmits<{
  'back-to-tasks': []
}>()

// 使用 stores
const questionnaireStore = useQuestionnaireStore()
const { questionnaires } = storeToRefs(questionnaireStore)

// 界面状态
const loading = ref(false)
const questionnaireFormVisible = ref(false)

// 筛选条件
const filters = ref({
  status: '',
  type: '',
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
const totalResponses = computed(() => 
  questionnaires.value.reduce((sum, q) => sum + q.responses.length, 0)
)

// 过滤后的列表
const filteredList = computed(() => {
  let list = questionnaires.value.filter(questionnaire => {
    // 如果有特定任务，只显示该任务相关的问卷
    if (props.task && props.task.config?.questionnaireId) {
      return questionnaire.id === props.task.config.questionnaireId
    }
    return true
  })

  // 状态筛选
  if (filters.value.status) {
    list = list.filter(item => item.status === filters.value.status)
  }

  // 类型筛选
  if (filters.value.type) {
    list = list.filter(item => item.type === filters.value.type)
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
    status: '',
    type: '',
    dateRange: [],
    department: ''
  }
  pagination.value.currentPage = 1
}

function formatTime(timeStr: string) {
  if (!timeStr) return '--'
  return new Date(timeStr).toLocaleString('zh-CN')
}

function getStatusType(status: string) {
  const types: Record<string, string> = {
    draft: 'info',
    published: 'success',
    collecting: 'warning',
    finished: 'success',
    closed: 'danger'
  }
  return types[status] || 'info'
}

function getStatusText(status: string) {
  const texts: Record<string, string> = {
    draft: '草稿',
    published: '已发布',
    collecting: '收集中',
    finished: '已结束',
    closed: '已关闭'
  }
  return texts[status] || status
}

function getTypeText(type: string) {
  const texts: Record<string, string> = {
    satisfaction: '满意度调研',
    feedback: '培训反馈',
    demand: '需求调研',
    other: '其他'
  }
  return texts[type] || type
}

function getResponseRate(questionnaire: any) {
  const participantCount = questionnaire.participants?.length || 0
  const responseCount = questionnaire.responses?.length || 0
  if (participantCount === 0) return 0
  return Math.round((responseCount / participantCount) * 100)
}

function createQuestionnaire() {
  questionnaireFormVisible.value = true
}

function editQuestionnaire(questionnaire: any) {
  ElMessage.info(`编辑问卷：${questionnaire.title}`)
  questionnaireFormVisible.value = true
}

function viewQuestionnaire(questionnaire: any) {
  ElMessage.info(`查看问卷：${questionnaire.title}`)
}

function viewResults(questionnaire: any) {
  ElMessage.info(`查看问卷结果：${questionnaire.title}`)
}

function manageParticipants(questionnaire: any) {
  ElMessage.info(`管理参与者：${questionnaire.title}`)
}

function duplicateQuestionnaire(questionnaire: any) {
  const newQuestionnaire = questionnaireStore.createQuestionnaire()
  questionnaireStore.updateQuestionnaire(newQuestionnaire.id, {
    ...questionnaire,
    id: newQuestionnaire.id,
    code: newQuestionnaire.code,
    title: `${questionnaire.title}（副本）`,
    status: 'draft',
    createTime: newQuestionnaire.createTime,
    responses: []
  })
  ElMessage.success('问卷复制成功')
}

function deleteQuestionnaire(questionnaire: any) {
  questionnaireStore.deleteQuestionnaire(questionnaire.id)
  ElMessage.success('删除成功')
}

function handleQuestionnaireSave(data: any) {
  const questionnaire = questionnaireStore.createQuestionnaire()
  questionnaireStore.updateQuestionnaire(questionnaire.id, {
    title: data.title,
    templateId: data.templateId,
    intro: data.intro,
    category: data.category,
    type: data.type,
    department: data.department,
    location: data.location,
    startTime: data.dateRange?.[0] || '',
    endTime: data.dateRange?.[1] || ''
  })
  ElMessage.success('问卷创建成功')
}

function importTemplates() {
  ElMessage.info('导入模板功能开发中...')
}

function exportResults() {
  ElMessage.info('导出结果功能开发中...')
}

function handleSizeChange(size: number) {
  pagination.value.pageSize = size
  pagination.value.currentPage = 1
}

function handleCurrentChange(page: number) {
  pagination.value.currentPage = page
}

// 返回功能
const goBack = () => {
  emit('back-to-tasks')
}

onMounted(() => {
  // 初始化数据
})
</script>

<style scoped>
.questionnaire-management {
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

.header-info h2 {
  margin: 0 0 8px 0;
  font-size: 20px;
  font-weight: 600;
  color: #303133;
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