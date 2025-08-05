<template>
  <div class="mentorship-relationship-overview">
    <!-- 工具栏 -->
    <div class="toolbar">
      <div class="toolbar-left">
        <el-input
          v-model="searchKeyword"
          placeholder="搜索导师或学员姓名"
          style="width: 250px"
          clearable
        >
          <template #prefix>
            <el-icon><Search /></el-icon>
          </template>
        </el-input>
        <el-select v-model="filterDepartment" placeholder="部门" style="width: 120px" clearable>
          <el-option label="全部" value="" />
          <el-option label="技术部" value="技术部" />
          <el-option label="产品部" value="产品部" />
          <el-option label="市场部" value="市场部" />
          <el-option label="人事部" value="人事部" />
        </el-select>
        <el-select v-model="filterStatus" placeholder="状态" style="width: 120px" clearable>
          <el-option label="全部" value="" />
          <el-option label="未出师" value="active" />
          <el-option label="已出师" value="graduated" />
        </el-select>
        <el-select v-model="filterTrainingType" placeholder="培训类型" style="width: 140px" clearable>
          <el-option label="全部" value="" />
          <el-option label="新员工培训" value="新员工培训" />
          <el-option label="技能提升" value="技能提升" />
          <el-option label="转岗培训" value="转岗培训" />
          <el-option label="管理培训" value="管理培训" />
        </el-select>
        <el-select v-model="filterProject" placeholder="培训项目" style="width: 160px" clearable>
          <el-option label="全部" value="" />
          <el-option 
            v-for="project in availableProjects" 
            :key="project.id" 
            :label="project.name" 
            :value="project.id" 
          />
        </el-select>
      </div>
      <div class="toolbar-right">
        <el-button type="primary" @click="exportData">导出数据</el-button>
      </div>
    </div>

    <!-- 师徒关系表格 -->
    <el-table
      :data="relationships"
      v-loading="loading"
      style="width: 100%"
      border
      @selection-change="handleSelectionChange"
    >
      <el-table-column type="selection" width="55" v-if="visibleColumns.includes('selection')" />
      
      <el-table-column 
        label="导师信息" 
        min-width="140" 
        v-if="visibleColumns.includes('mentorInfo')"
      >
        <template #default="{ row }">
          <div class="user-cell">
            <el-avatar :size="32">{{ row.mentorInfo.name.charAt(0) }}</el-avatar>
            <div class="user-info">
              <div class="name">{{ row.mentorInfo.name }}</div>
              <div class="department">{{ row.mentorInfo.department }}</div>
            </div>
          </div>
        </template>
      </el-table-column>

      <el-table-column 
        label="学员信息" 
        min-width="140" 
        v-if="visibleColumns.includes('studentInfo')"
      >
        <template #default="{ row }">
          <div class="user-cell">
            <el-avatar :size="32">{{ row.studentInfo.name.charAt(0) }}</el-avatar>
            <div class="user-info">
              <div class="name">{{ row.studentInfo.name }}</div>
              <div class="department">{{ row.studentInfo.department }}</div>
            </div>
          </div>
        </template>
      </el-table-column>

      <el-table-column 
        label="项目" 
        min-width="120" 
        v-if="visibleColumns.includes('project')"
      >
        <template #default="{ row }">
          <el-link type="primary" @click="viewProject(row.project.id)">
            {{ row.project.name }}
          </el-link>
        </template>
      </el-table-column>

      <el-table-column 
        label="指派类型" 
        width="90" 
        v-if="visibleColumns.includes('relationType')"
      >
        <template #default="{ row }">
          <el-tag size="small" type="info">
            {{ row.relationType }}
          </el-tag>
        </template>
      </el-table-column>

      <el-table-column 
        label="建立时间" 
        width="100" 
        v-if="visibleColumns.includes('establishedDate')"
      >
        <template #default="{ row }">
          {{ formatDate(row.establishedDate) }}
        </template>
      </el-table-column>

      <el-table-column 
        label="状态" 
        width="80" 
        v-if="visibleColumns.includes('status')"
      >
        <template #default="{ row }">
          <el-tag :type="row.statusType" size="small">
            {{ row.statusText }}
          </el-tag>
        </template>
      </el-table-column>

      <el-table-column 
        label="进度" 
        width="100" 
        v-if="visibleColumns.includes('progress')"
      >
        <template #default="{ row }">
          <div class="progress-cell">
            <el-progress
              :percentage="row.progress"
              :stroke-width="6"
              :show-text="false"
              :color="getProgressColor(row.progress)"
            />
            <span class="progress-text">{{ row.progress }}%</span>
          </div>
        </template>
      </el-table-column>

      <el-table-column 
        label="操作" 
        width="80" 
        fixed="right" 
        v-if="visibleColumns.includes('actions')"
      >
        <template #default="{ row }">
          <el-button type="primary" size="small" @click="viewDetails(row)">
            详情
          </el-button>
        </template>
      </el-table-column>

      <!-- 列配置按钮 -->
      <el-table-column width="60" fixed="right">
        <template #header>
          <el-popover placement="bottom" width="300" trigger="click">
            <template #reference>
              <el-button size="small" type="text">
                <el-icon><Setting /></el-icon>
              </el-button>
            </template>
            <div class="column-config">
              <div class="config-title">选择显示列</div>
              <el-checkbox-group v-model="visibleColumns" class="config-options">
                <el-checkbox 
                  v-for="option in columnOptions" 
                  :key="option.value" 
                  :label="option.value"
                  :disabled="option.required"
                >
                  {{ option.label }}
                </el-checkbox>
              </el-checkbox-group>
            </div>
          </el-popover>
        </template>
      </el-table-column>
    </el-table>

    <!-- 分页器 -->
    <div class="pagination-wrapper">
      <el-pagination
        v-model:current-page="pagination.page"
        v-model:page-size="pagination.pageSize"
        :total="pagination.total"
        :page-sizes="[10, 20, 50, 100]"
        layout="total, sizes, prev, pager, next, jumper"
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
      />
    </div>

    <!-- 统计信息卡片 -->
    <div class="stats-cards" v-if="stats">
      <el-row :gutter="16" style="margin-top: 20px">
        <el-col :span="6">
          <el-card class="stat-card">
            <div class="stat-number">{{ stats.total }}</div>
            <div class="stat-label">总师徒关系</div>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card class="stat-card">
            <div class="stat-number active">{{ stats.active }}</div>
            <div class="stat-label">进行中</div>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card class="stat-card">
            <div class="stat-number completed">{{ stats.completed }}</div>
            <div class="stat-label">已出师</div>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card class="stat-card">
            <div class="stat-number graduation">{{ stats.graduationRate }}%</div>
            <div class="stat-label">出师率</div>
          </el-card>
        </el-col>
      </el-row>
    </div>

    <!-- 师徒关系详情弹窗 -->
    <el-dialog 
      v-model="detailDialogVisible" 
      title="师徒关系详情" 
      width="1200px"
      :before-close="handleDetailDialogClose"
    >
      <div v-if="selectedRelationship" class="relationship-detail">
        <!-- 基本信息 -->
        <el-card class="detail-card" shadow="never">
          <template #header>
            <span class="card-header">基本信息</span>
          </template>
          
          <el-row :gutter="24">
            <el-col :span="12">
              <el-descriptions :column="1" border>
                <el-descriptions-item label="导师">
                  <div class="user-info-inline">
                    <el-avatar :size="32">{{ selectedRelationship.mentorInfo.name.charAt(0) }}</el-avatar>
                    <div class="info">
                      <div class="name">{{ selectedRelationship.mentorInfo.name }}</div>
                      <div class="meta">{{ selectedRelationship.mentorInfo.department }} - {{ selectedRelationship.mentorInfo.position }}</div>
                    </div>
                  </div>
                </el-descriptions-item>
                
                <el-descriptions-item label="学员">
                  <div class="user-info-inline">
                    <el-avatar :size="32">{{ selectedRelationship.studentInfo.name.charAt(0) }}</el-avatar>
                    <div class="info">
                      <div class="name">{{ selectedRelationship.studentInfo.name }}</div>
                      <div class="meta">{{ selectedRelationship.studentInfo.department }} - {{ selectedRelationship.studentInfo.position }}</div>
                    </div>
                  </div>
                </el-descriptions-item>
                
                <el-descriptions-item label="项目">
                  <el-link type="primary" @click="viewProject(selectedRelationship.project.id)">
                    {{ selectedRelationship.project.name }}
                  </el-link>
                  <el-tag size="small" type="info" style="margin-left: 8px">
                    {{ selectedRelationship.project.type }}
                  </el-tag>
                </el-descriptions-item>
              </el-descriptions>
            </el-col>
            
            <el-col :span="12">
              <el-descriptions :column="1" border>
                <el-descriptions-item label="指派类型">
                  <el-tag size="small" type="info">{{ selectedRelationship.relationType }}</el-tag>
                </el-descriptions-item>
                
                <el-descriptions-item label="建立时间">
                  {{ formatDate(selectedRelationship.establishedDate) }}
                </el-descriptions-item>
                
                <el-descriptions-item label="当前状态">
                  <el-tag :type="selectedRelationship.statusType" size="small">
                    {{ selectedRelationship.statusText }}
                  </el-tag>
                </el-descriptions-item>
                
                <el-descriptions-item label="学习进度">
                  <div class="progress-display">
                    <el-progress
                      :percentage="selectedRelationship.progress"
                      :stroke-width="8"
                      :color="getProgressColor(selectedRelationship.progress)"
                    />
                  </div>
                </el-descriptions-item>
              </el-descriptions>
            </el-col>
          </el-row>
        </el-card>

        <!-- 学习情况 -->
        <el-card class="detail-card" shadow="never" style="margin-top: 20px">
          <template #header>
            <span class="card-header">学习情况</span>
          </template>
          
          <el-tabs v-model="detailActiveTab">
            <!-- 任务进度 -->
            <el-tab-pane label="任务进度" name="tasks">
              <div v-loading="taskLoading">
                <div v-if="studentTasks.length > 0">
                  <el-table :data="studentTasks" border>
                    <el-table-column label="任务名称" prop="title" min-width="200" />
                    <el-table-column label="任务类型" width="100">
                      <template #default="{ row }">
                        <el-tag size="small" :type="getTaskTypeColor(row.type)">
                          {{ getTaskTypeText(row.type) }}
                        </el-tag>
                      </template>
                    </el-table-column>
                    <el-table-column label="完成状态" width="120">
                      <template #default="{ row }">
                        <el-tag size="small" :type="getTaskStatusColor(row.status)">
                          {{ getTaskStatusText(row.status) }}
                        </el-tag>
                      </template>
                    </el-table-column>
                    <el-table-column label="评分" width="80">
                      <template #default="{ row }">
                        <span v-if="row.score !== null">{{ row.score }}分</span>
                        <span v-else class="text-gray">未评分</span>
                      </template>
                    </el-table-column>
                    <el-table-column label="提交时间" width="120">
                      <template #default="{ row }">
                        <span v-if="row.submittedAt">{{ formatDate(row.submittedAt) }}</span>
                        <span v-else class="text-gray">未提交</span>
                      </template>
                    </el-table-column>
                    <el-table-column label="截止时间" width="120">
                      <template #default="{ row }">
                        {{ formatDate(row.dueDate) }}
                      </template>
                    </el-table-column>
                  </el-table>
                </div>
                <el-empty v-else description="暂无任务数据" />
              </div>
            </el-tab-pane>
            
            <!-- 评价记录 -->
            <el-tab-pane label="评价记录" name="evaluations">
              <div v-loading="evaluationLoading">
                <div v-if="relationshipEvaluations.length > 0">
                  <el-table :data="relationshipEvaluations" border>
                    <el-table-column label="评价维度" width="120">
                      <template #default="{ row }">
                        <el-tag size="small" :type="row.evaluatorType === 'MENTOR' ? 'success' : 'warning'">
                          {{ row.evaluatorType === 'MENTOR' ? '导师评价' : '学员评价' }}
                        </el-tag>
                      </template>
                    </el-table-column>
                    <el-table-column label="评价者" width="100">
                      <template #default="{ row }">
                        {{ row.evaluatorName }}
                      </template>
                    </el-table-column>
                    <el-table-column label="被评价者" width="100">
                      <template #default="{ row }">
                        {{ row.evaluateeName }}
                      </template>
                    </el-table-column>
                    <el-table-column label="总体评分" width="100">
                      <template #default="{ row }">
                        <span v-if="row.overallScore > 0" :class="getScoreClass(row.overallScore)">
                          {{ row.overallScore }}分
                        </span>
                        <span v-else class="text-gray">未评分</span>
                      </template>
                    </el-table-column>
                    <el-table-column label="状态" width="100">
                      <template #default="{ row }">
                        <el-tag size="small" :type="row.status === 'COMPLETED' ? 'success' : 'warning'">
                          {{ row.status === 'COMPLETED' ? '已完成' : '进行中' }}
                        </el-tag>
                      </template>
                    </el-table-column>
                    <el-table-column label="评价时间" width="120">
                      <template #default="{ row }">
                        {{ formatDate(row.evaluationDate) }}
                      </template>
                    </el-table-column>
                    <el-table-column label="反馈内容" min-width="200">
                      <template #default="{ row }">
                        <div class="feedback-content">
                          {{ row.specificFeedback || '暂无反馈' }}
                        </div>
                      </template>
                    </el-table-column>
                  </el-table>
                </div>
                <el-empty v-else description="暂无评价记录" />
              </div>
            </el-tab-pane>
            
            <!-- 阶段总结 -->
            <el-tab-pane label="学习总结" name="summary" v-if="selectedRelationship.phase">
              <div class="learning-summary">
                <el-row :gutter="24">
                  <el-col :span="12">
                    <el-statistic title="任务完成率" :value="taskCompletionRate" suffix="%" />
                  </el-col>
                  <el-col :span="12">
                    <el-statistic title="平均评分" :value="averageScore" :precision="1" suffix="分" />
                  </el-col>
                </el-row>
                
                <div class="summary-content" style="margin-top: 20px">
                  <h4>学习亮点</h4>
                  <ul v-if="learningHighlights.length > 0">
                    <li v-for="highlight in learningHighlights" :key="highlight">{{ highlight }}</li>
                  </ul>
                  <p v-else class="text-gray">暂无学习亮点记录</p>
                  
                  <h4 style="margin-top: 20px">改进建议</h4>
                  <ul v-if="improvementSuggestions.length > 0">
                    <li v-for="suggestion in improvementSuggestions" :key="suggestion">{{ suggestion }}</li>
                  </ul>
                  <p v-else class="text-gray">暂无改进建议</p>
                </div>
              </div>
            </el-tab-pane>
          </el-tabs>
        </el-card>
      </div>
      
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="detailDialogVisible = false">关闭</el-button>
          <el-button type="primary" @click="exportLearningReport">导出学习报告</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { Search, Setting } from '@element-plus/icons-vue'
import { 
  getAllMentorshipRelationships, 
  getAllTrainingProjects,
  getMentorshipRelationshipDetail,
  getStudentTaskDetails,
  getProjectEvaluations,
  type MentorshipRelationshipOverview,
  type MentorshipRelationshipStats
} from '@/api/modules/project-mentorship'

// 响应式数据
const loading = ref(false)
const searchKeyword = ref('')
const filterDepartment = ref('')
const filterStatus = ref('')
const filterTrainingType = ref('')
const filterProject = ref('')
const selectedRows = ref([])

// 数据
const relationships = ref<MentorshipRelationshipOverview[]>([])
const availableProjects = ref<any[]>([])
const stats = ref<MentorshipRelationshipStats | null>(null)

// 详情弹窗相关数据
const detailDialogVisible = ref(false)
const selectedRelationship = ref<MentorshipRelationshipOverview | null>(null)
const detailActiveTab = ref('tasks')
const taskLoading = ref(false)
const evaluationLoading = ref(false)
const studentTasks = ref<any[]>([])
const relationshipEvaluations = ref<any[]>([])

// 分页数据
const pagination = ref({
  page: 1,
  pageSize: 20,
  total: 0
})

// 列显示配置
const visibleColumns = ref(['mentorInfo', 'studentInfo', 'project', 'relationType', 'establishedDate', 'status', 'progress', 'actions'])

const columnOptions = [
  { label: '多选框', value: 'selection', required: false },
  { label: '导师信息', value: 'mentorInfo', required: true },
  { label: '学员信息', value: 'studentInfo', required: true },
  { label: '项目', value: 'project', required: false },
  { label: '指派类型', value: 'relationType', required: false },
  { label: '建立时间', value: 'establishedDate', required: false },
  { label: '状态', value: 'status', required: false },
  { label: '进度', value: 'progress', required: false },
  { label: '操作', value: 'actions', required: true }
]

// 计算属性
const taskCompletionRate = computed(() => {
  if (studentTasks.value.length === 0) return 0
  const completedTasks = studentTasks.value.filter(task => task.status === 'COMPLETED')
  return Math.round((completedTasks.length / studentTasks.value.length) * 100)
})

const averageScore = computed(() => {
  const scoredTasks = studentTasks.value.filter(task => task.score !== null && task.score > 0)
  if (scoredTasks.length === 0) return 0
  const totalScore = scoredTasks.reduce((sum, task) => sum + task.score, 0)
  return Math.round((totalScore / scoredTasks.length) * 10) / 10
})

const learningHighlights = computed(() => {
  const highlights: string[] = []
  
  // 基于任务完成情况生成亮点
  if (taskCompletionRate.value >= 90) {
    highlights.push('任务完成率优秀，学习态度积极')
  }
  
  if (averageScore.value >= 85) {
    highlights.push('任务质量优秀，平均评分较高')
  }
  
  // 基于评价记录生成亮点
  const positiveEvaluations = relationshipEvaluations.value.filter(evaluation => evaluation.overallScore >= 80)
  if (positiveEvaluations.length > 0) {
    highlights.push('获得导师积极评价，表现突出')
  }
  
  return highlights
})

const improvementSuggestions = computed(() => {
  const suggestions: string[] = []
  
  // 基于任务完成情况生成建议
  if (taskCompletionRate.value < 70) {
    suggestions.push('建议提高任务完成效率，按时提交作业')
  }
  
  if (averageScore.value < 70) {
    suggestions.push('建议加强学习质量，提升任务完成水平')
  }
  
  // 基于超期任务生成建议
  const overdueTasks = studentTasks.value.filter(task => 
    task.status !== 'COMPLETED' && new Date(task.dueDate) < new Date()
  )
  if (overdueTasks.length > 0) {
    suggestions.push('有超期任务，建议合理安排时间')
  }
  
  return suggestions
})

// 监听筛选条件变化
watch([searchKeyword, filterDepartment, filterStatus, filterTrainingType, filterProject], () => {
  pagination.value.page = 1
  loadRelationships()
}, { deep: true })

// 方法
const loadRelationships = async () => {
  loading.value = true
  try {
    const params = {
      page: pagination.value.page,
      pageSize: pagination.value.pageSize,
      search: searchKeyword.value || undefined,
      department: filterDepartment.value || undefined,
      status: filterStatus.value || undefined,
      trainingType: filterTrainingType.value || undefined,
      projectId: filterProject.value || undefined
    }

    const response = await getAllMentorshipRelationships(params)
    
    // 注意：request拦截器已经返回了data字段的内容
    // 所以response直接就是 {relationships: [...], pagination: {...}, stats: {...}}
    console.log('🔍 前端收到的响应数据:', response)
    
    if (response) {
      // 过滤掉已终止的师徒关系
      const filteredRelationships = (response.relationships || []).filter(rel => rel.status !== 'TERMINATED')
      relationships.value = filteredRelationships
      
      // 重新计算分页信息（因为过滤了数据）
      pagination.value.total = filteredRelationships.length
      
      // 保持统计数据
      stats.value = response.stats || null
      
      console.log('📋 师徒关系数据（已过滤终止状态）:', relationships.value.length, '条')
      console.log('📊 统计数据:', stats.value)
    }
  } catch (error) {
    console.error('获取师徒关系失败:', error)
    ElMessage.error('获取师徒关系失败')
    relationships.value = []
  } finally {
    loading.value = false
  }
}

const loadProjects = async () => {
  try {
    const response = await getAllTrainingProjects()
    
    // 同样，request拦截器已经处理了响应格式
    console.log('🔍 培训项目响应数据:', response)
    
    if (response) {
      availableProjects.value = Array.isArray(response) ? response : []
    }
  } catch (error) {
    console.error('获取培训项目失败:', error)
    availableProjects.value = []
  }
}

const formatDate = (dateString: string) => {
  const date = new Date(dateString)
  return date.toLocaleDateString('zh-CN')
}

const getProgressColor = (progress: number) => {
  if (progress >= 80) return '#67c23a'
  if (progress >= 60) return '#e6a23c'
  return '#f56c6c'
}

const handleSelectionChange = (selection: any[]) => {
  selectedRows.value = selection
}

const viewProject = (projectId: string) => {
  ElMessage.info(`查看项目: ${projectId}`)
}

const viewDetails = async (row: MentorshipRelationshipOverview) => {
  try {
    selectedRelationship.value = row
    detailDialogVisible.value = true
    detailActiveTab.value = 'tasks'
    
    console.log('查看师徒关系详情:', row)
    
    // 并行加载学员任务和评价记录
    await Promise.all([
      loadStudentTasks(row),
      loadRelationshipEvaluations(row)
    ])
    
  } catch (error) {
    console.error('查看详情失败:', error)
    ElMessage.error('查看详情失败')
  }
}

// 加载学员任务数据
const loadStudentTasks = async (relationship: MentorshipRelationshipOverview) => {
  taskLoading.value = true
  try {
    // 调用API获取学员在该项目中的任务详情
    const response = await getStudentTaskDetails(relationship.project.id, relationship.studentInfo.id)
    studentTasks.value = response?.tasks || []
    console.log('学员任务数据:', studentTasks.value.length, '个')
  } catch (error) {
    console.error('加载学员任务失败:', error)
    studentTasks.value = []
  } finally {
    taskLoading.value = false
  }
}

// 加载师徒关系评价记录
const loadRelationshipEvaluations = async (relationship: MentorshipRelationshipOverview) => {
  evaluationLoading.value = true
  try {
    // 调用API获取该师徒关系的评价记录
    const response = await getProjectEvaluations(relationship.project.id, {
      relationshipId: relationship.id
    })
    relationshipEvaluations.value = response || []
    console.log('评价记录数据:', relationshipEvaluations.value.length, '条')
  } catch (error) {
    console.error('加载评价记录失败:', error)
    relationshipEvaluations.value = []
  } finally {
    evaluationLoading.value = false
  }
}

// 详情弹窗关闭处理
const handleDetailDialogClose = (done: () => void) => {
  selectedRelationship.value = null
  studentTasks.value = []
  relationshipEvaluations.value = []
  done()
}

// 导出学习报告
const exportLearningReport = () => {
  if (!selectedRelationship.value) return
  
  const relationship = selectedRelationship.value
  ElMessage.info(`正在生成 ${relationship.studentInfo.name} 的学习报告...`)
  
  // 这里可以调用后端API生成PDF报告
  // 或者在前端生成简单的文本报告
  setTimeout(() => {
    ElMessage.success('学习报告生成完成！')
  }, 2000)
}

// 任务类型相关方法
const getTaskTypeText = (type: string) => {
  const typeMap: Record<string, string> = {
    'LEARNING': '学习任务',
    'PRACTICE': '实践任务',
    'ASSESSMENT': '考核任务',
    'PROJECT': '项目任务'
  }
  return typeMap[type] || type
}

const getTaskTypeColor = (type: string) => {
  const colorMap: Record<string, string> = {
    'LEARNING': 'info',
    'PRACTICE': 'warning',
    'ASSESSMENT': 'danger',
    'PROJECT': 'success'
  }
  return colorMap[type] || 'info'
}

// 任务状态相关方法
const getTaskStatusText = (status: string) => {
  const statusMap: Record<string, string> = {
    'PENDING': '待开始',
    'IN_PROGRESS': '进行中',
    'SUBMITTED': '已提交',
    'COMPLETED': '已完成',
    'OVERDUE': '已超期'
  }
  return statusMap[status] || status
}

const getTaskStatusColor = (status: string) => {
  const colorMap: Record<string, string> = {
    'PENDING': 'info',
    'IN_PROGRESS': 'warning',
    'SUBMITTED': 'primary',
    'COMPLETED': 'success',
    'OVERDUE': 'danger'
  }
  return colorMap[status] || 'info'
}

// 评分样式
const getScoreClass = (score: number) => {
  if (score >= 90) return 'score-excellent'
  if (score >= 80) return 'score-good'
  if (score >= 70) return 'score-average'
  return 'score-poor'
}

const exportData = async () => {
  try {
    // 获取所有数据，不限制分页
    const allParams = {
      page: 1,
      pageSize: 9999, // 设置一个很大的数值获取所有数据
      search: searchKeyword.value || undefined,
      department: filterDepartment.value || undefined,
      status: filterStatus.value || undefined,
      trainingType: filterTrainingType.value || undefined,
      projectId: filterProject.value || undefined
    }

    const response = await getAllMentorshipRelationships(allParams)
    const allRelationships = response.relationships || []
    
    // 过滤掉已终止的师徒关系
    const filteredAllRelationships = allRelationships.filter(rel => rel.status !== 'TERMINATED')
    
    // 准备导出数据
    const exportRelationships = filteredAllRelationships.map(relationship => ({
      '导师姓名': relationship.mentorInfo.name,
      '导师部门': relationship.mentorInfo.department,
      '学员姓名': relationship.studentInfo.name,
      '学员部门': relationship.studentInfo.department,
      '培训项目': relationship.project.name,
      '指派类型': relationship.relationType,
      '建立时间': formatDate(relationship.establishedDate),
      '状态': relationship.statusText,
      '进度': `${relationship.progress}%`
    }))

    // 创建CSV格式数据
    const headers = ['导师姓名', '导师部门', '学员姓名', '学员部门', '培训项目', '指派类型', '建立时间', '状态', '进度']
    
    // 构建CSV内容
    const csvRows = []
    
    // 添加表头
    csvRows.push(headers.join(','))
    
    // 添加数据行
    exportRelationships.forEach(row => {
      const values = headers.map(header => {
        const value = row[header] || ''
        // 处理包含逗号或双引号的值
        return `"${value.toString().replace(/"/g, '""')}"`
      })
      csvRows.push(values.join(','))
    })
    
    const csvContent = csvRows.join('\n')
    
    // 添加BOM以确保Excel正确显示中文
    const BOM = '\uFEFF'
    const csvWithBOM = BOM + csvContent

    // 生成文件名
    const now = new Date()
    const fileName = `师徒关系数据_${now.getFullYear()}${(now.getMonth() + 1).toString().padStart(2, '0')}${now.getDate().toString().padStart(2, '0')}.csv`

    // 创建并下载文件
    const blob = new Blob([csvWithBOM], { 
      type: 'text/csv;charset=utf-8' 
    })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = fileName
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)

    ElMessage.success(`数据已导出到 ${fileName}`)
  } catch (error) {
    console.error('导出数据失败:', error)
    ElMessage.error('导出数据失败，请重试')
  }
}



const handleSizeChange = (size: number) => {
  pagination.value.pageSize = size
  pagination.value.page = 1
  loadRelationships()
}

const handleCurrentChange = (page: number) => {
  pagination.value.page = page
  loadRelationships()
}

// 生命周期
onMounted(async () => {
  await loadProjects()
  await loadRelationships()
})
</script>

<style scoped>
.mentorship-relationship-overview {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding: 16px;
  background: #f8f9fa;
  border-radius: 8px;
}

.toolbar-left {
  display: flex;
  gap: 12px;
  align-items: center;
  flex-wrap: wrap;
}

.toolbar-right {
  display: flex;
  gap: 8px;
}

.user-cell {
  display: flex;
  align-items: center;
  gap: 8px;
}

.user-info .name {
  font-weight: 500;
  color: #303133;
  margin-bottom: 2px;
}

.user-info .department {
  font-size: 12px;
  color: #909399;
}

.progress-cell {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.progress-text {
  font-size: 12px;
  color: #606266;
}

.pagination-wrapper {
  display: flex;
  justify-content: center;
  margin-top: 20px;
  padding: 16px;
}

.column-config {
  padding: 10px 0;
}

.config-title {
  font-weight: 500;
  margin-bottom: 15px;
  color: #303133;
}

.config-options {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.config-options .el-checkbox {
  margin-right: 0;
}

.stats-cards {
  margin-top: 20px;
}

.stat-card {
  text-align: center;
  border: none;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.stat-number {
  font-size: 24px;
  font-weight: bold;
  margin-bottom: 8px;
}

.stat-number.active {
  color: #409eff;
}

.stat-number.completed {
  color: #67c23a;
}

.stat-number.paused {
  color: #e6a23c;
}

.stat-number.terminated {
  color: #f56c6c;
}

.stat-number.graduation {
  color: #7c3aed;
}

.stat-label {
  font-size: 14px;
  color: #606266;
}

:deep(.el-table) {
  flex: 1;
}

/* 详情弹窗样式 */
.relationship-detail {
  max-height: 70vh;
  overflow-y: auto;
}

.detail-card {
  margin-bottom: 16px;
}

.card-header {
  font-weight: 600;
  font-size: 16px;
  color: #303133;
}

.user-info-inline {
  display: flex;
  align-items: center;
  gap: 10px;
}

.user-info-inline .info .name {
  font-weight: 500;
  color: #303133;
  margin-bottom: 2px;
}

.user-info-inline .info .meta {
  font-size: 12px;
  color: #909399;
}

.progress-display {
  max-width: 200px;
}

.feedback-content {
  max-width: 200px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.text-gray {
  color: #909399;
  font-style: italic;
}

/* 评分样式 */
.score-excellent {
  color: #67c23a;
  font-weight: bold;
}

.score-good {
  color: #409eff;
  font-weight: bold;
}

.score-average {
  color: #e6a23c;
  font-weight: bold;
}

.score-poor {
  color: #f56c6c;
  font-weight: bold;
}

.learning-summary h4 {
  color: #303133;
  font-size: 14px;
  margin: 10px 0;
}

.learning-summary ul {
  margin: 10px 0;
  padding-left: 20px;
}

.learning-summary li {
  margin: 8px 0;
  color: #606266;
}

.summary-content {
  background: #f8f9fa;
  padding: 20px;
  border-radius: 8px;
}

/* 弹窗内表格优化 */
:deep(.el-dialog__body) {
  padding: 10px 20px 20px;
}

:deep(.el-dialog__body .el-table) {
  font-size: 13px;
}

:deep(.el-dialog__body .el-table .el-table__cell) {
  padding: 8px 0;
}
</style> 