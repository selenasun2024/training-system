<template>
  <div class="mentorship-execution-panel">
    <el-tabs v-model="activeTab" class="execution-tabs">
      <!-- 计划管理 -->
      <el-tab-pane label="计划管理" name="plan-management">
        <template #label>
          <div class="tab-label">
            <el-icon><Calendar /></el-icon>
            <span>计划管理</span>
            <el-badge :value="activePlans.length" v-if="activePlans.length > 0" />
          </div>
        </template>
        
        <div class="plan-management">
          <div class="section-header">
            <h3>我的带教计划</h3>
            <el-button type="primary" @click="showCreatePlanDialog = true">
              <el-icon><Plus /></el-icon>
              创建计划
            </el-button>
          </div>
          
          <div class="plans-grid">
            <div 
              v-for="plan in activePlans" 
              :key="plan.id"
              class="plan-card"
            >
              <div class="plan-header">
                <h4>{{ plan.title }}</h4>
                <el-tag :type="getPlanStatusType(plan.status)">
                  {{ getPlanStatusLabel(plan.status) }}
                </el-tag>
              </div>
              
              <div class="plan-content">
                <p class="plan-description">{{ plan.description }}</p>
                <div class="plan-meta">
                  <span class="meta-item">
                    <el-icon><User /></el-icon>
                    学员：{{ plan.studentCount }}人
                  </span>
                  <span class="meta-item">
                    <el-icon><Clock /></el-icon>
                    期限：{{ formatDate(plan.endDate) }}
                  </span>
                </div>
              </div>
              
              <div class="plan-progress">
                <div class="progress-info">
                  <span>完成进度</span>
                  <span>{{ plan.progress }}%</span>
                </div>
                <el-progress :percentage="plan.progress" />
              </div>
              
              <div class="plan-actions">
                <el-button size="small" @click="viewPlanDetail(plan.id)">查看详情</el-button>
                <el-button size="small" type="primary" @click="editPlan(plan.id)">编辑</el-button>
              </div>
            </div>
          </div>
          
          <el-empty v-if="activePlans.length === 0" description="暂无活跃的带教计划" />
        </div>
      </el-tab-pane>

      <!-- 任务分配 -->
      <el-tab-pane label="任务分配" name="task-assignment">
        <template #label>
          <div class="tab-label">
            <el-icon><List /></el-icon>
            <span>任务分配</span>
            <el-badge :value="pendingTasks.length" type="warning" v-if="pendingTasks.length > 0" />
          </div>
        </template>
        
        <div class="task-assignment">
          <div class="section-header">
            <h3>任务分配管理</h3>
            <el-button type="primary" @click="showCreateTaskDialog = true">
              <el-icon><Plus /></el-icon>
              分配任务
            </el-button>
          </div>
          
          <div class="task-filters">
            <el-row :gutter="16">
              <el-col :span="6">
                <el-select v-model="taskFilter.status" placeholder="任务状态" clearable>
                  <el-option label="全部" value="" />
                  <el-option label="待开始" value="pending" />
                  <el-option label="进行中" value="in-progress" />
                  <el-option label="已完成" value="completed" />
                  <el-option label="已逾期" value="overdue" />
                </el-select>
              </el-col>
              <el-col :span="6">
                <el-select v-model="taskFilter.student" placeholder="选择学员" clearable>
                  <el-option 
                    v-for="student in myStudents" 
                    :key="student.id"
                    :label="student.name" 
                    :value="student.id" 
                  />
                </el-select>
              </el-col>
              <el-col :span="12">
                <el-input v-model="taskFilter.search" placeholder="搜索任务" clearable>
                  <template #prefix>
                    <el-icon><Search /></el-icon>
                  </template>
                </el-input>
              </el-col>
            </el-row>
          </div>
          
          <div class="tasks-list">
            <div 
              v-for="task in filteredTasks" 
              :key="task.id"
              class="task-item"
              :class="{ 'overdue': isTaskOverdue(task) }"
            >
              <div class="task-left">
                <div class="task-status">
                  <el-tag :type="getTaskStatusType(task.status)">
                    {{ getTaskStatusLabel(task.status) }}
                  </el-tag>
                </div>
                <div class="task-info">
                  <h4 class="task-title">{{ task.title }}</h4>
                  <p class="task-description">{{ task.description }}</p>
                  <div class="task-meta">
                    <span class="meta-item">
                      <el-icon><User /></el-icon>
                      {{ getStudentName(task.studentId) }}
                    </span>
                    <span class="meta-item">
                      <el-icon><Clock /></el-icon>
                      截止：{{ formatDate(task.dueDate) }}
                    </span>
                  </div>
                </div>
              </div>
              
              <div class="task-actions">
                <el-button size="small" @click="viewTaskDetail(task.id)">查看</el-button>
                <el-button size="small" type="primary" @click="editTask(task.id)">编辑</el-button>
                <el-button 
                  size="small" 
                  type="success" 
                  v-if="task.status === 'submitted'"
                  @click="reviewTask(task.id)"
                >
                  评阅
                </el-button>
              </div>
            </div>
          </div>
          
          <el-empty v-if="filteredTasks.length === 0" description="暂无任务数据" />
        </div>
      </el-tab-pane>

      <!-- 作业批阅 -->
      <el-tab-pane label="作业批阅" name="homework-review">
        <template #label>
          <div class="tab-label">
            <el-icon><Document /></el-icon>
            <span>作业批阅</span>
            <el-badge :value="pendingHomeworks.length" type="warning" v-if="pendingHomeworks.length > 0" />
          </div>
        </template>
        
        <div class="homework-review">
          <div class="section-header">
            <h3>作业批阅管理</h3>
            <el-button type="primary" @click="showBatchReviewDialog = true">
              <el-icon><Edit /></el-icon>
              批量批阅
            </el-button>
          </div>
          
          <div class="homework-filters">
            <el-row :gutter="16">
              <el-col :span="6">
                <el-select v-model="homeworkFilter.status" placeholder="批阅状态" clearable>
                  <el-option label="全部" value="" />
                  <el-option label="待批阅" value="pending" />
                  <el-option label="已批阅" value="reviewed" />
                  <el-option label="需重做" value="needs-revision" />
                </el-select>
              </el-col>
              <el-col :span="6">
                <el-select v-model="homeworkFilter.student" placeholder="选择学员" clearable>
                  <el-option 
                    v-for="student in myStudents" 
                    :key="student.id"
                    :label="student.name" 
                    :value="student.id" 
                  />
                </el-select>
              </el-col>
              <el-col :span="6">
                <el-select v-model="homeworkFilter.subject" placeholder="科目" clearable>
                  <el-option label="全部科目" value="" />
                  <el-option label="专业技能" value="professional" />
                  <el-option label="理论基础" value="theory" />
                  <el-option label="实践操作" value="practice" />
                </el-select>
              </el-col>
              <el-col :span="6">
                <el-input v-model="homeworkFilter.search" placeholder="搜索作业" clearable>
                  <template #prefix>
                    <el-icon><Search /></el-icon>
                  </template>
                </el-input>
              </el-col>
            </el-row>
          </div>
          
          <div class="homework-list">
            <div 
              v-for="homework in filteredHomeworks" 
              :key="homework.id"
              class="homework-item"
              :class="{ 'urgent': isHomeworkUrgent(homework) }"
            >
              <div class="homework-left">
                <div class="homework-status">
                  <el-tag :type="getHomeworkStatusType(homework.status)">
                    {{ getHomeworkStatusLabel(homework.status) }}
                  </el-tag>
                </div>
                <div class="homework-info">
                  <h4 class="homework-title">{{ homework.title }}</h4>
                  <p class="homework-description">{{ homework.description }}</p>
                  <div class="homework-meta">
                    <span class="meta-item">
                      <el-icon><User /></el-icon>
                      {{ getStudentName(homework.studentId) }}
                    </span>
                    <span class="meta-item">
                      <el-icon><Calendar /></el-icon>
                      提交时间：{{ formatDate(homework.submittedAt) }}
                    </span>
                    <span class="meta-item">
                      <el-icon><Clock /></el-icon>
                      截止：{{ formatDate(homework.dueDate) }}
                    </span>
                  </div>
                </div>
              </div>
              
              <div class="homework-score" v-if="homework.score !== null">
                <span class="score-label">得分：</span>
                <span class="score-value">{{ homework.score }}/{{ homework.maxScore }}</span>
              </div>
              
              <div class="homework-actions">
                <el-button size="small" @click="viewHomework(homework.id)">查看</el-button>
                <el-button 
                  size="small" 
                  type="primary" 
                  v-if="homework.status === 'pending'"
                  @click="reviewHomework(homework.id)"
                >
                  批阅
                </el-button>
                <el-button 
                  size="small" 
                  v-if="homework.status === 'reviewed'"
                  @click="reReviewHomework(homework.id)"
                >
                  重新批阅
                </el-button>
              </div>
            </div>
          </div>
          
          <el-empty v-if="filteredHomeworks.length === 0" description="暂无作业需要批阅" />
        </div>
      </el-tab-pane>

      <!-- 考试批阅 -->
      <el-tab-pane label="考试批阅" name="exam-review">
        <template #label>
          <div class="tab-label">
            <el-icon><Medal /></el-icon>
            <span>考试批阅</span>
            <el-badge :value="pendingExams.length" type="danger" v-if="pendingExams.length > 0" />
          </div>
        </template>
        
        <div class="exam-review">
          <div class="section-header">
            <h3>考试批阅管理</h3>
            <el-button type="primary" @click="showExamStatsDialog = true">
              <el-icon><DataAnalysis /></el-icon>
              考试统计
            </el-button>
          </div>
          
          <div class="exam-filters">
            <el-row :gutter="16">
              <el-col :span="6">
                <el-select v-model="examFilter.status" placeholder="批阅状态" clearable>
                  <el-option label="全部" value="" />
                  <el-option label="待批阅" value="pending" />
                  <el-option label="已批阅" value="reviewed" />
                  <el-option label="异常试卷" value="abnormal" />
                </el-select>
              </el-col>
              <el-col :span="6">
                <el-select v-model="examFilter.type" placeholder="考试类型" clearable>
                  <el-option label="全部类型" value="" />
                  <el-option label="阶段考试" value="stage" />
                  <el-option label="期中考试" value="midterm" />
                  <el-option label="期末考试" value="final" />
                  <el-option label="技能考核" value="skill" />
                </el-select>
              </el-col>
              <el-col :span="6">
                <el-select v-model="examFilter.student" placeholder="选择学员" clearable>
                  <el-option 
                    v-for="student in myStudents" 
                    :key="student.id"
                    :label="student.name" 
                    :value="student.id" 
                  />
                </el-select>
              </el-col>
              <el-col :span="6">
                <el-date-picker
                  v-model="examFilter.dateRange"
                  type="daterange"
                  placeholder="考试日期范围"
                  format="YYYY-MM-DD"
                  value-format="YYYY-MM-DD"
                />
              </el-col>
            </el-row>
          </div>
          
          <div class="exam-list">
            <div 
              v-for="exam in filteredExams" 
              :key="exam.id"
              class="exam-item"
            >
              <div class="exam-header">
                <div class="exam-basic">
                  <h4>{{ exam.title }}</h4>
                  <el-tag :type="getExamTypeType(exam.type)">
                    {{ getExamTypeLabel(exam.type) }}
                  </el-tag>
                  <el-tag :type="getExamStatusType(exam.status)">
                    {{ getExamStatusLabel(exam.status) }}
                  </el-tag>
                </div>
                <div class="exam-score" v-if="exam.score !== null">
                  <span class="score-label">得分：</span>
                  <span class="score-value">{{ exam.score }}/{{ exam.maxScore }}</span>
                  <span class="score-percent">({{ ((exam.score / exam.maxScore) * 100).toFixed(1) }}%)</span>
                </div>
              </div>
              
              <div class="exam-content">
                <div class="exam-meta">
                  <span class="meta-item">
                    <el-icon><User /></el-icon>
                    学员：{{ getStudentName(exam.studentId) }}
                  </span>
                  <span class="meta-item">
                    <el-icon><Calendar /></el-icon>
                    考试时间：{{ formatDateTime(exam.examTime) }}
                  </span>
                  <span class="meta-item">
                    <el-icon><Clock /></el-icon>
                    用时：{{ exam.duration }}分钟
                  </span>
                  <span class="meta-item" v-if="exam.reviewedAt">
                    <el-icon><Check /></el-icon>
                    批阅时间：{{ formatDate(exam.reviewedAt) }}
                  </span>
                </div>
                <p class="exam-comment" v-if="exam.comment">
                  <strong>批阅意见：</strong>{{ exam.comment }}
                </p>
              </div>
              
              <div class="exam-actions">
                <el-button size="small" @click="viewExamDetail(exam.id)">查看详情</el-button>
                <el-button 
                  size="small" 
                  type="primary" 
                  v-if="exam.status === 'pending'"
                  @click="reviewExam(exam.id)"
                >
                  批阅
                </el-button>
                <el-button 
                  size="small" 
                  v-if="exam.status === 'reviewed'"
                  @click="reReviewExam(exam.id)"
                >
                  重新批阅
                </el-button>
                <el-button size="small" @click="exportExamResult(exam.id)">导出成绩</el-button>
              </div>
            </div>
          </div>
          
          <el-empty v-if="filteredExams.length === 0" description="暂无考试需要批阅" />
        </div>
      </el-tab-pane>

      <!-- 阶段评价 -->
      <el-tab-pane label="阶段评价" name="stage-evaluation">
        <template #label>
          <div class="tab-label">
            <el-icon><Star /></el-icon>
            <span>阶段评价</span>
            <el-badge :value="pendingEvaluations.length" type="danger" v-if="pendingEvaluations.length > 0" />
          </div>
        </template>
        
        <div class="stage-evaluation">
          <div class="section-header">
            <h3>阶段评价管理</h3>
            <el-button type="primary" @click="showCreateEvaluationDialog = true">
              <el-icon><Plus /></el-icon>
              创建评价
            </el-button>
          </div>
          
          <div class="evaluation-filters">
            <el-row :gutter="16">
              <el-col :span="8">
                <el-select v-model="evaluationFilter.stage" placeholder="评价阶段" clearable>
                  <el-option label="全部阶段" value="" />
                  <el-option label="初期评价" value="initial" />
                  <el-option label="中期评价" value="mid-term" />
                  <el-option label="期末评价" value="final" />
                </el-select>
              </el-col>
              <el-col :span="8">
                <el-select v-model="evaluationFilter.student" placeholder="选择学员" clearable>
                  <el-option 
                    v-for="student in myStudents" 
                    :key="student.id"
                    :label="student.name" 
                    :value="student.id" 
                  />
                </el-select>
              </el-col>
              <el-col :span="8">
                <el-date-picker
                  v-model="evaluationFilter.dateRange"
                  type="daterange"
                  placeholder="选择日期范围"
                  format="YYYY-MM-DD"
                  value-format="YYYY-MM-DD"
                />
              </el-col>
            </el-row>
          </div>
          
          <div class="evaluations-list">
            <div 
              v-for="evaluation in filteredEvaluations" 
              :key="evaluation.id"
              class="evaluation-item"
            >
              <div class="evaluation-header">
                <div class="evaluation-basic">
                  <h4>{{ evaluation.title }}</h4>
                  <el-tag :type="getEvaluationStageType(evaluation.stage)">
                    {{ getEvaluationStageLabel(evaluation.stage) }}
                  </el-tag>
                </div>
                <div class="evaluation-score" v-if="evaluation.score">
                  <span class="score-label">总分：</span>
                  <span class="score-value">{{ evaluation.score }}/{{ evaluation.maxScore }}</span>
                </div>
              </div>
              
              <div class="evaluation-content">
                <div class="evaluation-meta">
                  <span class="meta-item">
                    <el-icon><User /></el-icon>
                    学员：{{ getStudentName(evaluation.studentId) }}
                  </span>
                  <span class="meta-item">
                    <el-icon><Calendar /></el-icon>
                    评价时间：{{ formatDate(evaluation.evaluatedAt) }}
                  </span>
                  <span class="meta-item">
                    <el-icon><Star /></el-icon>
                    评级：{{ evaluation.rating }}
                  </span>
                </div>
                <p class="evaluation-comment" v-if="evaluation.comment">
                  {{ evaluation.comment }}
                </p>
              </div>
              
              <div class="evaluation-actions">
                <el-button size="small" @click="viewEvaluationDetail(evaluation.id)">查看详情</el-button>
                <el-button size="small" type="primary" @click="editEvaluation(evaluation.id)">编辑</el-button>
                <el-button size="small" @click="exportEvaluation(evaluation.id)">导出</el-button>
              </div>
            </div>
          </div>
          
          <el-empty v-if="filteredEvaluations.length === 0" description="暂无评价记录" />
        </div>
      </el-tab-pane>
    </el-tabs>

    <!-- 创建计划对话框 -->
    <el-dialog v-model="showCreatePlanDialog" title="创建带教计划" width="600px">
      <!-- 计划创建表单 -->
      <div>计划创建表单 - 待完善</div>
      <template #footer>
        <el-button @click="showCreatePlanDialog = false">取消</el-button>
        <el-button type="primary">确定</el-button>
      </template>
    </el-dialog>

    <!-- 创建任务对话框 -->
    <el-dialog v-model="showCreateTaskDialog" title="分配任务" width="600px">
      <!-- 任务分配表单 -->
      <div>任务分配表单 - 待完善</div>
      <template #footer>
        <el-button @click="showCreateTaskDialog = false">取消</el-button>
        <el-button type="primary">确定</el-button>
      </template>
    </el-dialog>

    <!-- 创建评价对话框 -->
    <el-dialog v-model="showCreateEvaluationDialog" title="创建阶段评价" width="600px">
      <!-- 评价创建表单 -->
      <div>评价创建表单 - 待完善</div>
      <template #footer>
        <el-button @click="showCreateEvaluationDialog = false">取消</el-button>
        <el-button type="primary">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { 
  Calendar, 
  List, 
  Star, 
  Plus, 
  User, 
  Clock, 
  Search,
  Document,
  Edit,
  Medal,
  DataAnalysis,
  Check
} from '@element-plus/icons-vue'
import { useMentorWorkbenchStore } from '@/stores/mentorWorkbench'

const mentorStore = useMentorWorkbenchStore()

// 响应式数据
const activeTab = ref('plan-management')
const showCreatePlanDialog = ref(false)
const showCreateTaskDialog = ref(false)
const showCreateEvaluationDialog = ref(false)
const showBatchReviewDialog = ref(false)
const showExamStatsDialog = ref(false)

const taskFilter = ref({
  status: '',
  student: '',
  search: ''
})

const evaluationFilter = ref({
  stage: '',
  student: '',
  dateRange: []
})

const homeworkFilter = ref({
  status: '',
  student: '',
  subject: '',
  search: ''
})

const examFilter = ref({
  status: '',
  type: '',
  student: '',
  dateRange: []
})

// 计算属性
const activePlans = computed(() => mentorStore.activePlans || [])
const myStudents = computed(() => mentorStore.myStudents || [])
const pendingTasks = computed(() => mentorStore.pendingTasks || [])
const pendingEvaluations = computed(() => mentorStore.pendingEvaluations || [])
const pendingHomeworks = computed(() => mentorStore.pendingHomeworks || [])
const pendingExams = computed(() => mentorStore.pendingExams || [])

const filteredTasks = computed(() => {
  let tasks = pendingTasks.value
  
  if (taskFilter.value.status) {
    tasks = tasks.filter(t => t.status === taskFilter.value.status)
  }
  
  if (taskFilter.value.student) {
    tasks = tasks.filter(t => t.studentId === taskFilter.value.student)
  }
  
  if (taskFilter.value.search) {
    const search = taskFilter.value.search.toLowerCase()
    tasks = tasks.filter(t => 
      t.title.toLowerCase().includes(search) ||
      t.description.toLowerCase().includes(search)
    )
  }
  
  return tasks
})

const filteredEvaluations = computed(() => {
  let evaluations = pendingEvaluations.value
  
  if (evaluationFilter.value.stage) {
    evaluations = evaluations.filter(e => e.stage === evaluationFilter.value.stage)
  }
  
  if (evaluationFilter.value.student) {
    evaluations = evaluations.filter(e => e.studentId === evaluationFilter.value.student)
  }
  
  // 日期范围筛选暂时跳过
  
  return evaluations
})

const filteredHomeworks = computed(() => {
  let homeworks = pendingHomeworks.value
  
  if (homeworkFilter.value.status) {
    homeworks = homeworks.filter(h => h.status === homeworkFilter.value.status)
  }
  
  if (homeworkFilter.value.student) {
    homeworks = homeworks.filter(h => h.studentId === homeworkFilter.value.student)
  }
  
  if (homeworkFilter.value.subject) {
    homeworks = homeworks.filter(h => h.subject === homeworkFilter.value.subject)
  }
  
  if (homeworkFilter.value.search) {
    const search = homeworkFilter.value.search.toLowerCase()
    homeworks = homeworks.filter(h => 
      h.title.toLowerCase().includes(search) ||
      h.description.toLowerCase().includes(search)
    )
  }
  
  return homeworks
})

const filteredExams = computed(() => {
  let exams = pendingExams.value
  
  if (examFilter.value.status) {
    exams = exams.filter(e => e.status === examFilter.value.status)
  }
  
  if (examFilter.value.type) {
    exams = exams.filter(e => e.type === examFilter.value.type)
  }
  
  if (examFilter.value.student) {
    exams = exams.filter(e => e.studentId === examFilter.value.student)
  }
  
  // 日期范围筛选暂时跳过
  
  return exams
})

// 方法
function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('zh-CN')
}

function getPlanStatusType(status: string): string {
  const types = { active: 'success', completed: 'info', draft: 'warning' }
  return types[status] || 'info'
}

function getPlanStatusLabel(status: string): string {
  const labels = { active: '进行中', completed: '已完成', draft: '草稿' }
  return labels[status] || status
}

function getTaskStatusType(status: string): string {
  const types = { 
    pending: 'info', 
    'in-progress': 'primary', 
    completed: 'success', 
    overdue: 'danger',
    submitted: 'warning'
  }
  return types[status] || 'info'
}

function getTaskStatusLabel(status: string): string {
  const labels = { 
    pending: '待开始', 
    'in-progress': '进行中', 
    completed: '已完成', 
    overdue: '已逾期',
    submitted: '已提交'
  }
  return labels[status] || status
}

function getEvaluationStageType(stage: string): string {
  const types = { initial: 'primary', 'mid-term': 'warning', final: 'success' }
  return types[stage] || 'info'
}

function getEvaluationStageLabel(stage: string): string {
  const labels = { initial: '初期评价', 'mid-term': '中期评价', final: '期末评价' }
  return labels[stage] || stage
}

function getStudentName(studentId: string): string {
  const student = myStudents.value.find(s => s.id === studentId)
  return student ? student.name : '未知学员'
}

function isTaskOverdue(task: any): boolean {
  return new Date(task.dueDate) < new Date() && task.status !== 'completed'
}

// 事件处理
function viewPlanDetail(planId: string) {
  console.log('查看计划详情:', planId)
}

function editPlan(planId: string) {
  console.log('编辑计划:', planId)
}

function viewTaskDetail(taskId: string) {
  console.log('查看任务详情:', taskId)
}

function editTask(taskId: string) {
  console.log('编辑任务:', taskId)
}

function reviewTask(taskId: string) {
  console.log('评阅任务:', taskId)
}

function viewEvaluationDetail(evaluationId: string) {
  console.log('查看评价详情:', evaluationId)
}

function editEvaluation(evaluationId: string) {
  console.log('编辑评价:', evaluationId)
}

function exportEvaluation(evaluationId: string) {
  console.log('导出评价:', evaluationId)
}

// 作业批阅相关方法
function isHomeworkUrgent(homework: any): boolean {
  const daysDiff = (new Date(homework.dueDate).getTime() - new Date().getTime()) / (1000 * 3600 * 24)
  return daysDiff < 1 && homework.status === 'pending'
}

function getHomeworkStatusType(status: string): string {
  const types = { 
    pending: 'warning', 
    reviewed: 'success', 
    'needs-revision': 'danger'
  }
  return types[status] || 'info'
}

function getHomeworkStatusLabel(status: string): string {
  const labels = { 
    pending: '待批阅', 
    reviewed: '已批阅', 
    'needs-revision': '需重做'
  }
  return labels[status] || status
}

function viewHomework(homeworkId: string) {
  console.log('查看作业:', homeworkId)
}

function reviewHomework(homeworkId: string) {
  console.log('批阅作业:', homeworkId)
}

function reReviewHomework(homeworkId: string) {
  console.log('重新批阅作业:', homeworkId)
}

// 考试批阅相关方法
function getExamTypeType(type: string): string {
  const types = { 
    stage: 'primary', 
    midterm: 'warning', 
    final: 'danger',
    skill: 'success'
  }
  return types[type] || 'info'
}

function getExamTypeLabel(type: string): string {
  const labels = { 
    stage: '阶段考试', 
    midterm: '期中考试', 
    final: '期末考试',
    skill: '技能考核'
  }
  return labels[type] || type
}

function getExamStatusType(status: string): string {
  const types = { 
    pending: 'warning', 
    reviewed: 'success', 
    abnormal: 'danger'
  }
  return types[status] || 'info'
}

function getExamStatusLabel(status: string): string {
  const labels = { 
    pending: '待批阅', 
    reviewed: '已批阅', 
    abnormal: '异常试卷'
  }
  return labels[status] || status
}

function formatDateTime(dateTimeStr: string): string {
  return new Date(dateTimeStr).toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

function viewExamDetail(examId: string) {
  console.log('查看考试详情:', examId)
}

function reviewExam(examId: string) {
  console.log('批阅考试:', examId)
}

function reReviewExam(examId: string) {
  console.log('重新批阅考试:', examId)
}

function exportExamResult(examId: string) {
  console.log('导出考试成绩:', examId)
}
</script>

<style scoped>
.mentorship-execution-panel {
  height: 100%;
  padding: 20px;
}

.execution-tabs {
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

/* 计划管理样式 */
.plans-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 20px;
  margin-bottom: 20px;
}

.plan-card {
  background: white;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  border: 1px solid #ebeef5;
}

.plan-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.plan-header h4 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}

.plan-content .plan-description {
  margin: 0 0 12px 0;
  color: #606266;
  font-size: 14px;
  line-height: 1.5;
}

.plan-meta {
  display: flex;
  gap: 16px;
  margin-bottom: 16px;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: #909399;
}

.plan-progress {
  margin-bottom: 16px;
}

.progress-info {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
  font-size: 14px;
  color: #606266;
}

.plan-actions {
  display: flex;
  gap: 8px;
}

/* 任务分配样式 */
.task-filters {
  margin-bottom: 20px;
  padding: 16px;
  background: #f5f7fa;
  border-radius: 8px;
}

.tasks-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.task-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  background: white;
  border-radius: 8px;
  border: 1px solid #ebeef5;
  transition: box-shadow 0.3s ease;
}

.task-item:hover {
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
}

.task-item.overdue {
  border-left: 4px solid #f56c6c;
}

.task-left {
  display: flex;
  align-items: center;
  gap: 16px;
  flex: 1;
}

.task-info h4 {
  margin: 0 0 8px 0;
  font-size: 16px;
  font-weight: 500;
  color: #303133;
}

.task-description {
  margin: 0 0 8px 0;
  color: #606266;
  font-size: 14px;
}

.task-meta {
  display: flex;
  gap: 16px;
}

.task-actions {
  display: flex;
  gap: 8px;
}

/* 阶段评价样式 */
.evaluation-filters {
  margin-bottom: 20px;
  padding: 16px;
  background: #f5f7fa;
  border-radius: 8px;
}

.evaluations-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.evaluation-item {
  background: white;
  border-radius: 8px;
  padding: 20px;
  border: 1px solid #ebeef5;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.evaluation-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.evaluation-basic h4 {
  margin: 0 0 8px 0;
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}

.evaluation-score {
  text-align: right;
}

.score-label {
  color: #909399;
  font-size: 14px;
}

.score-value {
  color: #303133;
  font-size: 18px;
  font-weight: 600;
}

.evaluation-meta {
  display: flex;
  gap: 20px;
  margin-bottom: 12px;
}

.evaluation-comment {
  margin: 0 0 16px 0;
  padding: 12px;
  background: #f5f7fa;
  border-radius: 6px;
  color: #606266;
  font-size: 14px;
  line-height: 1.5;
}

.evaluation-actions {
  display: flex;
  gap: 8px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .mentorship-execution-panel {
    padding: 16px;
  }
  
  .plans-grid {
    grid-template-columns: 1fr;
  }
  
  .task-item {
    flex-direction: column;
    align-items: stretch;
    gap: 12px;
  }
  
  .task-left {
    flex-direction: column;
    align-items: stretch;
    gap: 8px;
  }
  
  .evaluation-header {
    flex-direction: column;
    align-items: stretch;
    gap: 8px;
  }
  
  .evaluation-meta {
    flex-direction: column;
    gap: 8px;
  }
}

/* 作业批阅样式 */
.homework-filters {
  margin-bottom: 20px;
  padding: 16px;
  background: #f5f7fa;
  border-radius: 8px;
}

.homework-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.homework-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  background: white;
  border-radius: 8px;
  border: 1px solid #ebeef5;
  transition: box-shadow 0.3s ease;
}

.homework-item:hover {
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
}

.homework-item.urgent {
  border-left: 4px solid #f56c6c;
  background: #fef0f0;
}

.homework-left {
  display: flex;
  align-items: center;
  gap: 16px;
  flex: 1;
}

.homework-info h4 {
  margin: 0 0 8px 0;
  font-size: 16px;
  font-weight: 500;
  color: #303133;
}

.homework-description {
  margin: 0 0 8px 0;
  color: #606266;
  font-size: 14px;
}

.homework-meta {
  display: flex;
  gap: 16px;
}

.homework-score {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  margin-right: 16px;
}

.homework-score .score-label {
  color: #909399;
  font-size: 12px;
}

.homework-score .score-value {
  color: #303133;
  font-size: 16px;
  font-weight: 600;
}

.homework-actions {
  display: flex;
  gap: 8px;
}

/* 考试批阅样式 */
.exam-filters {
  margin-bottom: 20px;
  padding: 16px;
  background: #f5f7fa;
  border-radius: 8px;
}

.exam-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.exam-item {
  background: white;
  border-radius: 8px;
  padding: 20px;
  border: 1px solid #ebeef5;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.exam-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.exam-basic {
  display: flex;
  align-items: center;
  gap: 12px;
}

.exam-basic h4 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}

.exam-score {
  text-align: right;
}

.exam-score .score-label {
  color: #909399;
  font-size: 14px;
}

.exam-score .score-value {
  color: #303133;
  font-size: 18px;
  font-weight: 600;
  margin: 0 4px;
}

.exam-score .score-percent {
  color: #67c23a;
  font-size: 14px;
}

.exam-meta {
  display: flex;
  gap: 20px;
  margin-bottom: 12px;
}

.exam-comment {
  margin: 0 0 16px 0;
  padding: 12px;
  background: #f5f7fa;
  border-radius: 6px;
  color: #606266;
  font-size: 14px;
  line-height: 1.5;
}

.exam-actions {
  display: flex;
  gap: 8px;
}

/* 移动端适配 */
@media (max-width: 768px) {
  .homework-item {
    flex-direction: column;
    align-items: stretch;
    gap: 12px;
  }
  
  .homework-left {
    flex-direction: column;
    align-items: stretch;
    gap: 8px;
  }
  
  .homework-score {
    align-items: flex-start;
    margin-right: 0;
  }
  
  .exam-header {
    flex-direction: column;
    align-items: stretch;
    gap: 8px;
  }
  
  .exam-basic {
    flex-direction: column;
    align-items: stretch;
    gap: 8px;
  }
  
  .exam-meta {
    flex-direction: column;
    gap: 8px;
  }
}
</style> 