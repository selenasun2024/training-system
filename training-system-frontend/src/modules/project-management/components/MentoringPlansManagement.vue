<template>
  <div class="mentoring-plans-management">
    <!-- 计划统计 -->
    <div class="plans-overview">
      <el-card class="overview-card">
        <el-statistic title="总计划数" :value="planStats.total" />
        <div class="stat-detail">
          <span class="active">进行中: {{ planStats.active }}</span>
        </div>
      </el-card>
      
      <el-card class="overview-card">
        <el-statistic title="完成率" :value="planStats.completionRate" suffix="%" />
        <div class="stat-detail">
          <span>平均进度: {{ planStats.averageProgress }}%</span>
        </div>
      </el-card>
      
      <el-card class="overview-card">
        <el-statistic title="本月新增" :value="planStats.newThisMonth" />
        <div class="stat-detail">
          <span class="trend-up">较上月 +{{ planStats.growth }}%</span>
        </div>
      </el-card>
      
      <el-card class="overview-card">
        <el-statistic title="待评估" :value="planStats.pendingEvaluation" />
        <div class="stat-detail">
          <span class="urgent">需要关注: {{ planStats.urgent }}</span>
        </div>
      </el-card>
    </div>

    <!-- 操作栏 -->
    <div class="action-bar">
      <div class="action-left">
        <el-button type="primary" @click="showCreateDialog = true">
          <el-icon><Plus /></el-icon>
          创建计划
        </el-button>
        <el-button @click="showTemplateDialog = true">
          <el-icon><Document /></el-icon>
          计划模板
        </el-button>
        <el-button @click="batchUpdate">
          <el-icon><Edit /></el-icon>
          批量更新
        </el-button>
        <el-button @click="exportPlans">
          <el-icon><Download /></el-icon>
          导出计划
        </el-button>
      </div>
      <div class="action-right">
        <el-input
          v-model="searchKeyword"
          placeholder="搜索计划名称、师傅、徒弟"
          style="width: 300px"
          clearable
        >
          <template #prefix>
            <el-icon><Search /></el-icon>
          </template>
        </el-input>
      </div>
    </div>

    <!-- 筛选器 -->
    <div class="filter-section">
      <el-select v-model="filterStatus" placeholder="状态" clearable style="width: 120px">
        <el-option label="全部" value="" />
        <el-option label="进行中" value="active" />
        <el-option label="已完成" value="completed" />
        <el-option label="已暂停" value="paused" />
        <el-option label="已取消" value="cancelled" />
      </el-select>
      
      <el-select v-model="filterType" placeholder="计划类型" clearable style="width: 150px">
        <el-option label="全部" value="" />
        <el-option label="新员工培养" value="newcomer" />
        <el-option label="转岗培训" value="transfer" />
        <el-option label="技能提升" value="skill" />
        <el-option label="管理培养" value="management" />
      </el-select>
      
      <el-select v-model="filterDepartment" placeholder="部门" clearable style="width: 150px">
        <el-option label="全部" value="" />
        <el-option label="技术部" value="tech" />
        <el-option label="产品部" value="product" />
        <el-option label="运营部" value="operation" />
        <el-option label="人事部" value="hr" />
      </el-select>
      
      <el-date-picker
        v-model="filterDateRange"
        type="daterange"
        range-separator="至"
        start-placeholder="开始日期"
        end-placeholder="结束日期"
        style="width: 240px"
        clearable
      />
    </div>

    <!-- 计划列表 -->
    <div class="plans-list">
      <div
        v-for="plan in filteredPlans"
        :key="plan.id"
        class="plan-card"
        :class="{ 'urgent': plan.isUrgent }"
      >
        <div class="card-header">
          <div class="plan-title">
            <h3>{{ plan.title }}</h3>
            <div class="plan-meta">
              <el-tag :type="getStatusColor(plan.status)">
                {{ getStatusText(plan.status) }}
              </el-tag>
              <el-tag type="info" size="small">
                {{ getTypeText(plan.type) }}
              </el-tag>
              <span v-if="plan.isUrgent" class="urgent-badge">
                <el-icon><Warning /></el-icon>
                紧急
              </span>
            </div>
          </div>
          <div class="card-actions">
            <el-dropdown @command="(action) => handlePlanAction(action, plan)">
              <el-button size="small" type="text">
                更多 <el-icon><ArrowDown /></el-icon>
              </el-button>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item command="view">查看详情</el-dropdown-item>
                  <el-dropdown-item command="edit">编辑计划</el-dropdown-item>
                  <el-dropdown-item command="progress">更新进度</el-dropdown-item>
                  <el-dropdown-item command="evaluate">阶段评估</el-dropdown-item>
                  <el-dropdown-item command="copy">复制计划</el-dropdown-item>
                  <el-dropdown-item command="pause" v-if="plan.status === 'active'">
                    暂停计划
                  </el-dropdown-item>
                  <el-dropdown-item command="resume" v-if="plan.status === 'paused'">
                    恢复计划
                  </el-dropdown-item>
                  <el-dropdown-item command="complete" v-if="plan.status === 'active'">
                    完成计划
                  </el-dropdown-item>
                  <el-dropdown-item command="cancel" divided>取消计划</el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </div>
        </div>

        <div class="plan-content">
          <!-- 师徒信息 -->
          <div class="participants">
            <div class="mentor-info">
              <el-avatar :size="50" :src="plan.mentor.avatar">
                {{ plan.mentor.name[0] }}
              </el-avatar>
              <div class="participant-details">
                <h4>{{ plan.mentor.name }}</h4>
                <p>{{ plan.mentor.title }}</p>
                <p class="department">{{ plan.mentor.department }}</p>
              </div>
              <el-tag type="warning" size="small">师傅</el-tag>
            </div>
            
            <div class="arrow">
              <el-icon><ArrowRight /></el-icon>
            </div>
            
            <div class="mentee-info">
              <el-avatar :size="50" :src="plan.mentee.avatar">
                {{ plan.mentee.name[0] }}
              </el-avatar>
              <div class="participant-details">
                <h4>{{ plan.mentee.name }}</h4>
                <p>{{ plan.mentee.title }}</p>
                <p class="department">{{ plan.mentee.department }}</p>
              </div>
              <el-tag type="success" size="small">徒弟</el-tag>
            </div>
          </div>

          <!-- 计划进度 -->
          <div class="plan-progress">
            <div class="progress-header">
              <span class="progress-label">整体进度</span>
              <span class="progress-percent">{{ plan.progress }}%</span>
            </div>
            <el-progress
              :percentage="plan.progress"
              :color="getProgressColor(plan.progress)"
              :stroke-width="8"
            />
            <div class="progress-details">
              <span>已完成: {{ plan.completedTasks }}/{{ plan.totalTasks }} 项</span>
              <span>剩余: {{ plan.remainingDays }} 天</span>
            </div>
          </div>

          <!-- 阶段目标 -->
          <div class="plan-stages">
            <h4>阶段目标</h4>
            <div class="stages-timeline">
              <div
                v-for="(stage, index) in plan.stages"
                :key="stage.id"
                class="stage-item"
                :class="{ 
                  'completed': stage.status === 'completed',
                  'active': stage.status === 'active',
                  'pending': stage.status === 'pending'
                }"
              >
                <div class="stage-marker">
                  <el-icon v-if="stage.status === 'completed'"><Check /></el-icon>
                  <el-icon v-else-if="stage.status === 'active'"><Timer /></el-icon>
                  <span v-else>{{ index + 1 }}</span>
                </div>
                <div class="stage-content">
                  <h5>{{ stage.title }}</h5>
                  <p>{{ stage.description }}</p>
                  <div class="stage-meta">
                    <span class="duration">{{ stage.duration }}周</span>
                    <span class="deadline">截止: {{ formatDate(stage.deadline) }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- 关键指标 -->
          <div class="plan-metrics">
            <div class="metric-item">
              <span class="metric-label">开始时间</span>
              <span class="metric-value">{{ formatDate(plan.startDate) }}</span>
            </div>
            <div class="metric-item">
              <span class="metric-label">预计完成</span>
              <span class="metric-value">{{ formatDate(plan.endDate) }}</span>
            </div>
            <div class="metric-item">
              <span class="metric-label">沟通频率</span>
              <span class="metric-value">每周{{ plan.communicationFrequency }}次</span>
            </div>
            <div class="metric-item">
              <span class="metric-label">下次评估</span>
              <span class="metric-value">{{ formatDate(plan.nextEvaluation) }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 创建计划对话框 -->
    <el-dialog
      v-model="showCreateDialog"
      title="创建带教计划"
      width="800px"
    >
      <el-form :model="planForm" label-width="120px">
        <el-form-item label="计划名称" required>
          <el-input v-model="planForm.title" placeholder="请输入计划名称" />
        </el-form-item>
        
        <el-form-item label="计划类型" required>
          <el-select v-model="planForm.type" placeholder="请选择计划类型">
            <el-option label="新员工培养" value="newcomer" />
            <el-option label="转岗培训" value="transfer" />
            <el-option label="技能提升" value="skill" />
            <el-option label="管理培养" value="management" />
          </el-select>
        </el-form-item>
        
        <el-form-item label="师傅" required>
          <el-select v-model="planForm.mentorId" placeholder="请选择师傅">
            <el-option
              v-for="mentor in availableMentors"
              :key="mentor.id"
              :label="`${mentor.name} - ${mentor.title}`"
              :value="mentor.id"
            />
          </el-select>
        </el-form-item>
        
        <el-form-item label="徒弟" required>
          <el-select v-model="planForm.menteeId" placeholder="请选择徒弟">
            <el-option
              v-for="mentee in availableMentees"
              :key="mentee.id"
              :label="`${mentee.name} - ${mentee.title}`"
              :value="mentee.id"
            />
          </el-select>
        </el-form-item>
        
        <el-form-item label="计划周期">
          <el-date-picker
            v-model="planForm.dateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
          />
        </el-form-item>
        
        <el-form-item label="沟通频率">
          <el-input-number v-model="planForm.communicationFrequency" :min="1" :max="7" />
          <span class="input-suffix">次/周</span>
        </el-form-item>
        
        <el-form-item label="计划描述">
          <el-input
            v-model="planForm.description"
            type="textarea"
            :autosize="{ minRows: 3, maxRows: 6 }"
            placeholder="请输入计划描述"
          />
        </el-form-item>
      </el-form>
      
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="showCreateDialog = false">取消</el-button>
          <el-button type="primary" @click="handleCreatePlan">创建</el-button>
        </div>
      </template>
    </el-dialog>

    <!-- 计划模板对话框 -->
    <el-dialog
      v-model="showTemplateDialog"
      title="计划模板"
      width="600px"
    >
      <div class="template-list">
        <div
          v-for="template in planTemplates"
          :key="template.id"
          class="template-item"
          @click="useTemplate(template)"
        >
          <h4>{{ template.name }}</h4>
          <p>{{ template.description }}</p>
          <div class="template-meta">
            <span>周期: {{ template.duration }}周</span>
            <span>阶段: {{ template.stages }}个</span>
          </div>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, reactive } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Plus, Document, Edit, Download, Search, ArrowDown, Warning,
  ArrowRight, Check, Timer
} from '@element-plus/icons-vue'

// 状态管理
const showCreateDialog = ref(false)
const showTemplateDialog = ref(false)
const searchKeyword = ref('')
const filterStatus = ref('')
const filterType = ref('')
const filterDepartment = ref('')
const filterDateRange = ref<[Date, Date] | null>(null)

// 表单数据
const planForm = reactive({
  title: '',
  type: '',
  mentorId: '',
  menteeId: '',
  dateRange: null as [Date, Date] | null,
  communicationFrequency: 2,
  description: ''
})

// 模拟数据
const planList = ref([
  {
    id: 'plan-1',
    title: '新员工技术培养计划',
    type: 'newcomer',
    status: 'active',
    mentor: {
      id: 'mentor-1',
      name: '张资深',
      title: '高级架构师',
      department: '技术部',
      avatar: ''
    },
    mentee: {
      id: 'mentee-1',
      name: '李新人',
      title: '初级工程师',
      department: '技术部',
      avatar: ''
    },
    progress: 35,
    completedTasks: 4,
    totalTasks: 12,
    remainingDays: 45,
    startDate: '2024-01-15',
    endDate: '2024-04-15',
    communicationFrequency: 3,
    nextEvaluation: '2024-02-15',
    isUrgent: false,
    stages: [
      {
        id: 'stage-1',
        title: '基础技能培养',
        description: '掌握基本开发技能和工具使用',
        duration: 4,
        deadline: '2024-02-15',
        status: 'completed'
      },
      {
        id: 'stage-2',
        title: '项目实践',
        description: '参与实际项目开发，积累经验',
        duration: 6,
        deadline: '2024-03-15',
        status: 'active'
      },
      {
        id: 'stage-3',
        title: '独立负责',
        description: '独立负责小模块开发',
        duration: 4,
        deadline: '2024-04-15',
        status: 'pending'
      }
    ]
  }
])

const availableMentors = ref([
  { id: 'mentor-1', name: '张资深', title: '高级架构师' },
  { id: 'mentor-2', name: '李专家', title: '产品总监' }
])

const availableMentees = ref([
  { id: 'mentee-1', name: '王新人', title: '初级工程师' },
  { id: 'mentee-2', name: '陈学员', title: '产品助理' }
])

const planTemplates = ref([
  {
    id: 'template-1',
    name: '新员工培养模板',
    description: '适用于新入职员工的标准培养计划',
    duration: 12,
    stages: 3
  },
  {
    id: 'template-2',
    name: '技能提升模板',
    description: '针对在职员工技能提升的培养计划',
    duration: 8,
    stages: 2
  }
])

// 统计数据
const planStats = computed(() => {
  const total = planList.value.length
  const active = planList.value.filter(p => p.status === 'active').length
  const avgProgress = planList.value.reduce((sum, p) => sum + p.progress, 0) / total
  
  return {
    total,
    active,
    completionRate: 75,
    averageProgress: Math.round(avgProgress),
    newThisMonth: 5,
    growth: 25,
    pendingEvaluation: 3,
    urgent: 1
  }
})

// 筛选后的计划列表
const filteredPlans = computed(() => {
  let filtered = planList.value

  if (filterStatus.value) {
    filtered = filtered.filter(p => p.status === filterStatus.value)
  }

  if (filterType.value) {
    filtered = filtered.filter(p => p.type === filterType.value)
  }

  if (searchKeyword.value) {
    const keyword = searchKeyword.value.toLowerCase()
    filtered = filtered.filter(p => 
      p.title.toLowerCase().includes(keyword) ||
      p.mentor.name.toLowerCase().includes(keyword) ||
      p.mentee.name.toLowerCase().includes(keyword)
    )
  }

  return filtered
})

// 工具方法
const getStatusColor = (status: string) => {
  const colors = {
    active: 'success',
    completed: 'primary',
    paused: 'warning',
    cancelled: 'danger'
  }
  return colors[status] || 'info'
}

const getStatusText = (status: string) => {
  const texts = {
    active: '进行中',
    completed: '已完成',
    paused: '已暂停',
    cancelled: '已取消'
  }
  return texts[status] || status
}

const getTypeText = (type: string) => {
  const texts = {
    newcomer: '新员工培养',
    transfer: '转岗培训',
    skill: '技能提升',
    management: '管理培养'
  }
  return texts[type] || type
}

const getProgressColor = (progress: number) => {
  if (progress >= 80) return '#67c23a'
  if (progress >= 50) return '#e6a23c'
  return '#f56c6c'
}

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('zh-CN')
}

// 操作方法
const handlePlanAction = (action: string, plan: any) => {
  switch (action) {
    case 'view':
      ElMessage.info(`查看计划: ${plan.title}`)
      break
    case 'edit':
      ElMessage.info(`编辑计划: ${plan.title}`)
      break
    case 'progress':
      ElMessage.info(`更新进度: ${plan.title}`)
      break
    case 'evaluate':
      ElMessage.info(`阶段评估: ${plan.title}`)
      break
    case 'copy':
      ElMessage.success(`已复制计划: ${plan.title}`)
      break
    case 'pause':
      plan.status = 'paused'
      ElMessage.success(`已暂停计划: ${plan.title}`)
      break
    case 'resume':
      plan.status = 'active'
      ElMessage.success(`已恢复计划: ${plan.title}`)
      break
    case 'complete':
      plan.status = 'completed'
      plan.progress = 100
      ElMessage.success(`已完成计划: ${plan.title}`)
      break
    case 'cancel':
      ElMessageBox.confirm(`确定取消计划 "${plan.title}"？`, '取消确认', {
        type: 'warning'
      }).then(() => {
        plan.status = 'cancelled'
        ElMessage.success('计划已取消')
      })
      break
  }
}

const handleCreatePlan = () => {
  if (!planForm.title || !planForm.type || !planForm.mentorId || !planForm.menteeId) {
    ElMessage.error('请填写必填项')
    return
  }

  const mentor = availableMentors.value.find(m => m.id === planForm.mentorId)
  const mentee = availableMentees.value.find(m => m.id === planForm.menteeId)

  const newPlan = {
    id: `plan-${Date.now()}`,
    title: planForm.title,
    type: planForm.type,
    status: 'active',
    mentor: mentor!,
    mentee: mentee!,
    progress: 0,
    completedTasks: 0,
    totalTasks: 10,
    remainingDays: 90,
    startDate: planForm.dateRange?.[0]?.toISOString().split('T')[0] || new Date().toISOString().split('T')[0],
    endDate: planForm.dateRange?.[1]?.toISOString().split('T')[0] || new Date().toISOString().split('T')[0],
    communicationFrequency: planForm.communicationFrequency,
    nextEvaluation: new Date().toISOString().split('T')[0],
    isUrgent: false,
    stages: []
  }

  planList.value.push(newPlan)
  showCreateDialog.value = false
  
  // 重置表单
  Object.assign(planForm, {
    title: '',
    type: '',
    mentorId: '',
    menteeId: '',
    dateRange: null,
    communicationFrequency: 2,
    description: ''
  })
  
  ElMessage.success('计划创建成功')
}

const useTemplate = (template: any) => {
  planForm.title = `基于${template.name}的计划`
  showTemplateDialog.value = false
  showCreateDialog.value = true
  ElMessage.success(`已应用模板: ${template.name}`)
}

const batchUpdate = () => {
  ElMessage.info('批量更新功能开发中...')
}

const exportPlans = () => {
  ElMessage.success('正在导出计划数据...')
}
</script>

<style scoped>
.mentoring-plans-management {
  padding: 20px;
}

.plans-overview {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
  margin-bottom: 20px;
}

.overview-card {
  text-align: center;
}

.stat-detail {
  margin-top: 8px;
  font-size: 12px;
}

.active {
  color: #67c23a;
}

.trend-up {
  color: #67c23a;
}

.urgent {
  color: #f56c6c;
}

.action-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.action-left {
  display: flex;
  gap: 12px;
}

.filter-section {
  display: flex;
  gap: 12px;
  margin-bottom: 20px;
}

.plans-list {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.plan-card {
  border: 1px solid #e8e8e8;
  border-radius: 8px;
  padding: 20px;
  background: #fff;
  transition: all 0.3s;
}

.plan-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.plan-card.urgent {
  border-color: #f56c6c;
  background: linear-gradient(135deg, #fff 0%, #fef0f0 100%);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 20px;
}

.plan-title h3 {
  margin: 0 0 8px 0;
  font-size: 18px;
  color: #333;
}

.plan-meta {
  display: flex;
  gap: 8px;
  align-items: center;
}

.urgent-badge {
  color: #f56c6c;
  font-size: 12px;
  display: flex;
  align-items: center;
  gap: 4px;
}

.plan-content {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.participants {
  display: flex;
  align-items: center;
  gap: 20px;
  padding: 16px;
  background: #f8f9fa;
  border-radius: 8px;
}

.mentor-info,
.mentee-info {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
}

.participant-details h4 {
  margin: 0 0 4px 0;
  font-size: 16px;
  color: #333;
}

.participant-details p {
  margin: 2px 0;
  color: #666;
  font-size: 13px;
}

.arrow {
  color: #409eff;
  font-size: 20px;
}

.plan-progress {
  background: #fff;
  padding: 16px;
  border: 1px solid #e8e8e8;
  border-radius: 8px;
}

.progress-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.progress-label {
  font-weight: 500;
  color: #333;
}

.progress-percent {
  font-weight: 600;
  color: #409eff;
}

.progress-details {
  display: flex;
  justify-content: space-between;
  margin-top: 8px;
  font-size: 12px;
  color: #666;
}

.plan-stages h4 {
  margin: 0 0 12px 0;
  color: #333;
}

.stages-timeline {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.stage-item {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 12px;
  border-radius: 6px;
  transition: all 0.3s;
}

.stage-item.completed {
  background: #f0f9ff;
  border-left: 3px solid #67c23a;
}

.stage-item.active {
  background: #fff7e6;
  border-left: 3px solid #e6a23c;
}

.stage-item.pending {
  background: #f5f7fa;
  border-left: 3px solid #909399;
}

.stage-marker {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  color: #fff;
  flex-shrink: 0;
}

.stage-item.completed .stage-marker {
  background: #67c23a;
}

.stage-item.active .stage-marker {
  background: #e6a23c;
}

.stage-item.pending .stage-marker {
  background: #909399;
}

.stage-content h5 {
  margin: 0 0 4px 0;
  color: #333;
}

.stage-content p {
  margin: 0 0 8px 0;
  color: #666;
  font-size: 13px;
}

.stage-meta {
  display: flex;
  gap: 12px;
  font-size: 12px;
  color: #999;
}

.plan-metrics {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 12px;
  padding: 16px;
  background: #f8f9fa;
  border-radius: 8px;
}

.metric-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.metric-label {
  font-size: 12px;
  color: #666;
}

.metric-value {
  font-weight: 500;
  color: #333;
}

.template-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.template-item {
  padding: 16px;
  border: 1px solid #e8e8e8;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s;
}

.template-item:hover {
  border-color: #409eff;
  background: #f0f9ff;
}

.template-item h4 {
  margin: 0 0 8px 0;
  color: #333;
}

.template-item p {
  margin: 0 0 8px 0;
  color: #666;
  font-size: 13px;
}

.template-meta {
  display: flex;
  gap: 12px;
  font-size: 12px;
  color: #999;
}

.input-suffix {
  margin-left: 8px;
  color: #666;
  font-size: 14px;
}
</style> 