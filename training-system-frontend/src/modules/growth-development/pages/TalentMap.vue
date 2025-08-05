<template>
  <div class="talent-map">
    <!-- 顶部工具栏 -->
    <div class="talent-map-header">
      <div class="header-left">
        <h1 class="page-title">
          <el-icon><User /></el-icon>
          人力地图
        </h1>
        <span class="subtitle">全局人才态势 · 可视化管理</span>
      </div>
      
      <div class="header-actions">
        <!-- 快速体检 -->
        <el-button type="primary" @click="runHealthCheck">
          <el-icon><Monitor /></el-icon>
          一键体检
        </el-button>
        
        <!-- 视图切换 -->
        <el-button-group class="view-switcher">
          <el-button 
            v-for="view in viewModes" 
            :key="view.key"
            :type="currentView === view.key ? 'primary' : 'default'"
            @click="switchView(view.key)"
          >
            <el-icon><component :is="view.icon" /></el-icon>
            {{ view.label }}
          </el-button>
        </el-button-group>
      </div>
    </div>

    <!-- 搜索和筛选工具栏 -->
    <div class="filter-toolbar">
      <div class="search-section">
        <el-input
          v-model="searchKeyword"
          placeholder="搜索员工姓名、部门、岗位..."
          style="width: 300px"
          clearable
        >
          <template #prefix>
            <el-icon><Search /></el-icon>
          </template>
        </el-input>
      </div>
      
      <div class="filter-section">
        <el-select
          v-model="filterOptions.department"
          placeholder="部门"
          clearable
          style="width: 150px"
        >
          <el-option 
            v-for="dept in departments" 
            :key="dept.id" 
            :label="dept.name" 
            :value="dept.id" 
          />
        </el-select>
        
        <el-select
          v-model="filterOptions.riskLevel"
          placeholder="风险等级"
          clearable
          style="width: 120px"
        >
          <el-option label="高风险" value="high" />
          <el-option label="中风险" value="medium" />
          <el-option label="低风险" value="low" />
        </el-select>
        
        <el-select
          v-model="filterOptions.talentTag"
          placeholder="人才标签"
          clearable
          style="width: 120px"
        >
          <el-option label="三卫" value="elite" />
          <el-option label="继任者" value="successor" />
          <el-option label="高潜" value="high-potential" />
          <el-option label="关键人才" value="key-talent" />
        </el-select>
        
        <el-button @click="resetFilters">
          <el-icon><Refresh /></el-icon>
          重置
        </el-button>
      </div>
    </div>

    <!-- 主体内容区域 -->
    <div class="talent-map-body">
      <!-- 左侧概览面板 -->
      <div class="left-panel">
        <el-card class="overview-card" shadow="never">
          <template #header>
            <div class="card-header">
              <span>全局概览</span>
              <el-button type="text" @click="refreshData">
                <el-icon><Refresh /></el-icon>
              </el-button>
            </div>
          </template>
          
          <div class="overview-stats">
            <div class="stat-item">
              <div class="stat-number">{{ statistics.totalEmployees }}</div>
              <div class="stat-label">总员工数</div>
            </div>
            <div class="stat-item">
              <div class="stat-number risk-high">{{ statistics.highRiskPositions }}</div>
              <div class="stat-label">高风险岗位</div>
            </div>
            <div class="stat-item">
              <div class="stat-number talent-elite">{{ statistics.eliteMembers }}</div>
              <div class="stat-label">三卫成员</div>
            </div>
            <div class="stat-item">
              <div class="stat-number successor-count">{{ statistics.successors }}</div>
              <div class="stat-label">继任者候选</div>
            </div>
          </div>
        </el-card>
        
        <!-- 风险预警 -->
        <el-card class="risk-alerts-card" shadow="never">
          <template #header>
            <span>风险预警</span>
          </template>
          
          <div class="risk-alerts">
            <div 
              v-for="alert in riskAlerts" 
              :key="alert.id"
              class="alert-item"
              :class="`alert-${alert.level}`"
              @click="handleAlertClick(alert)"
            >
              <div class="alert-icon">
                <el-icon><Warning /></el-icon>
              </div>
              <div class="alert-content">
                <div class="alert-title">{{ alert.title }}</div>
                <div class="alert-desc">{{ alert.description }}</div>
              </div>
              <div class="alert-arrow">
                <el-icon><ArrowRight /></el-icon>
              </div>
            </div>
          </div>
        </el-card>
        
        <!-- 快速操作 -->
        <el-card class="quick-actions-card" shadow="never">
          <template #header>
            <span>快速操作</span>
          </template>
          
          <div class="quick-actions">
            <el-button 
              v-for="action in quickActions" 
              :key="action.key"
              :type="action.type"
              class="action-btn"
              @click="handleQuickAction(action.key)"
            >
              <el-icon><component :is="action.icon" /></el-icon>
              {{ action.label }}
            </el-button>
          </div>
        </el-card>
      </div>

      <!-- 主要视图区域 -->
      <div class="main-content">
        <component 
          :is="currentViewComponent" 
          :search-keyword="searchKeyword"
          :filter-options="filterOptions"
          :selected-employee="selectedEmployee"
          @employee-select="handleEmployeeSelect"
          @position-select="handlePositionSelect"
        />
      </div>

      <!-- 右侧详情面板 -->
      <div class="right-panel" v-if="selectedEmployee || selectedPosition">
        <el-card class="detail-card" shadow="never">
          <template #header>
            <div class="detail-header">
              <span>{{ selectedEmployee ? '员工详情' : '岗位详情' }}</span>
              <el-button type="text" @click="closeDetailPanel">
                <el-icon><Close /></el-icon>
              </el-button>
            </div>
          </template>
          
          <!-- 员工详情 -->
          <div v-if="selectedEmployee" class="employee-detail">
            <div class="employee-basic">
              <el-avatar :size="60" :src="selectedEmployee.avatar">
                {{ selectedEmployee.name }}
              </el-avatar>
              <div class="employee-info">
                <h3>{{ selectedEmployee.name }}</h3>
                <p class="position">{{ selectedEmployee.position }}</p>
                <p class="department">{{ selectedEmployee.department }}</p>
                <div class="employee-tags">
                  <el-tag 
                    v-for="tag in selectedEmployee.tags" 
                    :key="tag"
                    :type="getTagType(tag)"
                    size="small"
                  >
                    {{ tag }}
                  </el-tag>
                </div>
              </div>
            </div>
            
            <el-divider />
            
            <div class="employee-metrics">
              <div class="metric-item">
                <span class="metric-label">绩效等级</span>
                <el-tag :type="getPerformanceTagType(selectedEmployee.performance)">
                  {{ selectedEmployee.performance }}
                </el-tag>
              </div>
              <div class="metric-item">
                <span class="metric-label">潜力评级</span>
                <el-tag :type="getPotentialTagType(selectedEmployee.potential)">
                  {{ selectedEmployee.potential }}
                </el-tag>
              </div>
              <div class="metric-item">
                <span class="metric-label">入职时间</span>
                <span>{{ selectedEmployee.joinDate }}</span>
              </div>
              <div class="metric-item">
                <span class="metric-label">在岗时长</span>
                <span>{{ selectedEmployee.tenure }}</span>
              </div>
            </div>
            
            <el-divider />
            
            <div class="action-buttons">
              <el-button type="primary" size="small" @click="viewGrowthProfile">
                查看成长档案
              </el-button>
              <el-button size="small" @click="startMentorship">
                安排导师
              </el-button>
              <el-button size="small" @click="addToSuccession">
                加入继任者计划
              </el-button>
            </div>
          </div>
          
          <!-- 岗位详情 -->
          <div v-if="selectedPosition" class="position-detail">
            <div class="position-basic">
              <h3>{{ selectedPosition.title }}</h3>
              <p class="position-level">{{ selectedPosition.level }}</p>
              <p class="position-dept">{{ selectedPosition.department }}</p>
              
              <div class="position-status">
                <div class="status-item">
                  <span class="status-label">岗位状态</span>
                  <el-tag :type="selectedPosition.isKey ? 'danger' : 'info'">
                    {{ selectedPosition.isKey ? '关键岗位' : '普通岗位' }}
                  </el-tag>
                </div>
                <div class="status-item">
                  <span class="status-label">风险等级</span>
                  <el-tag :type="getRiskTagType(selectedPosition.riskLevel)">
                    {{ getRiskLevelText(selectedPosition.riskLevel) }}
                  </el-tag>
                </div>
              </div>
            </div>
            
            <el-divider />
            
            <div class="succession-info">
              <h4>继任者梯队</h4>
              <div v-if="selectedPosition.successors.length > 0">
                <div 
                  v-for="(tier, index) in selectedPosition.successors" 
                  :key="index"
                  class="succession-tier"
                >
                  <div class="tier-header">
                    第{{ index + 1 }}梯队 ({{ tier.readiness }})
                  </div>
                  <div class="tier-candidates">
                    <div 
                      v-for="candidate in tier.candidates" 
                      :key="candidate.id"
                      class="candidate-item"
                      @click="selectEmployee(candidate)"
                    >
                      <el-avatar :size="24" :src="candidate.avatar">
                        {{ candidate.name }}
                      </el-avatar>
                      <span class="candidate-name">{{ candidate.name }}</span>
                    </div>
                  </div>
                </div>
              </div>
              <div v-else class="no-successors">
                <p>暂无继任者候选人</p>
                <el-button size="small" type="primary" @click="addSuccessors">
                  添加候选人
                </el-button>
              </div>
            </div>
          </div>
        </el-card>
      </div>
    </div>

    <!-- 一键体检结果对话框 -->
    <el-dialog
      v-model="healthCheckDialogVisible"
      title="组织人才健康检查报告"
      width="800px"
    >
      <div class="health-report">
        <div class="report-summary">
          <div class="summary-item">
            <div class="summary-number risk-high">{{ healthReport.highRiskCount }}</div>
            <div class="summary-label">高风险岗位</div>
          </div>
          <div class="summary-item">
            <div class="summary-number risk-medium">{{ healthReport.mediumRiskCount }}</div>
            <div class="summary-label">中风险岗位</div>
          </div>
          <div class="summary-item">
            <div class="summary-number">{{ healthReport.coverageRate }}%</div>
            <div class="summary-label">继任者覆盖率</div>
          </div>
          <div class="summary-item">
            <div class="summary-number">{{ healthReport.healthScore }}</div>
            <div class="summary-label">健康评分</div>
          </div>
        </div>
        
        <el-divider />
        
        <div class="report-recommendations">
          <h4>改进建议</h4>
          <ul>
            <li v-for="recommendation in healthReport.recommendations" :key="recommendation">
              {{ recommendation }}
            </li>
          </ul>
        </div>
      </div>
      
      <template #footer>
        <el-button @click="healthCheckDialogVisible = false">关闭</el-button>
        <el-button type="primary" @click="exportHealthReport">导出报告</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, shallowRef } from 'vue'
import { ElMessage } from 'element-plus'
import { 
  User, Search, Refresh, Warning, ArrowRight, Close, Monitor,
  Grid, List, Rank, PieChart
} from '@element-plus/icons-vue'

// 导入子组件（稍后创建）
import OrganizationView from '../components/talent-map/OrganizationView.vue'
import NineGridView from '../components/talent-map/NineGridView.vue'
import SuccessionPipelineView from '../components/talent-map/SuccessionPipelineView.vue'
import RiskMatrixView from '../components/talent-map/RiskMatrixView.vue'

// 视图模式定义
const viewModes = shallowRef([
  { key: 'organization', label: '组织架构', icon: Grid, component: OrganizationView },
  { key: 'nine-grid', label: '九宫格盘点', icon: PieChart, component: NineGridView },
  { key: 'succession', label: '继任梯队', icon: Rank, component: SuccessionPipelineView },
  { key: 'risk-matrix', label: '风险矩阵', icon: Warning, component: RiskMatrixView }
])

// 当前视图
const currentView = ref('organization')

// 当前视图组件
const currentViewComponent = computed(() => {
  const viewMode = viewModes.value.find(v => v.key === currentView.value)
  return viewMode?.component || OrganizationView
})

// 搜索和筛选
const searchKeyword = ref('')
const filterOptions = reactive({
  department: '',
  riskLevel: '',
  talentTag: ''
})

// 选中的员工和岗位
const selectedEmployee = ref(null)
const selectedPosition = ref(null)

// 一键体检对话框
const healthCheckDialogVisible = ref(false)

// 统计数据
const statistics = reactive({
  totalEmployees: 1247,
  highRiskPositions: 12,
  eliteMembers: 89,
  successors: 156
})

// 部门列表
const departments = ref([
  { id: '1', name: '技术部' },
  { id: '2', name: '销售部' },
  { id: '3', name: '市场部' },
  { id: '4', name: '人事部' },
  { id: '5', name: '财务部' }
])

// 风险预警
const riskAlerts = ref([
  {
    id: 1,
    level: 'high',
    title: '销售总监岗位',
    description: '现任者离职风险高，缺乏继任者'
  },
  {
    id: 2,
    level: 'medium',
    title: '技术专家群体',
    description: '关键技能人员储备不足'
  },
  {
    id: 3,
    level: 'high',
    title: '市场部经理',
    description: '继任者梯队空缺，需要紧急补充'
  }
])

// 快速操作
const quickActions = ref([
  { key: 'add-successor', label: '添加继任者', icon: User, type: 'primary' },
  { key: 'export-report', label: '导出报告', icon: List, type: 'default' },
  { key: 'talent-review', label: '人才盘点', icon: PieChart, type: 'default' },
  { key: 'risk-analysis', label: '风险分析', icon: Warning, type: 'warning' }
])

// 健康检查报告
const healthReport = reactive({
  highRiskCount: 12,
  mediumRiskCount: 28,
  coverageRate: 73,
  healthScore: 82,
  recommendations: [
    '优先为销售总监岗位培养继任者候选人',
    '加强技术专家的知识传承和培养',
    '建立更完善的人才梯队管理制度',
    '定期进行人才盘点和风险评估'
  ]
})

// 方法定义
const switchView = (viewKey: string) => {
  currentView.value = viewKey
  // 清空选中状态
  selectedEmployee.value = null
  selectedPosition.value = null
}

const runHealthCheck = () => {
  ElMessage.info('正在进行组织人才健康检查...')
  // 模拟检查过程
  setTimeout(() => {
    healthCheckDialogVisible.value = true
    ElMessage.success('健康检查完成')
  }, 1500)
}

const resetFilters = () => {
  searchKeyword.value = ''
  filterOptions.department = ''
  filterOptions.riskLevel = ''
  filterOptions.talentTag = ''
}

const refreshData = () => {
  ElMessage.info('正在刷新数据...')
  // 模拟数据刷新
  setTimeout(() => {
    ElMessage.success('数据刷新完成')
  }, 1000)
}

const handleEmployeeSelect = (employee: any) => {
  selectedEmployee.value = employee
  selectedPosition.value = null
}

const handlePositionSelect = (position: any) => {
  selectedPosition.value = position
  selectedEmployee.value = null
}

const closeDetailPanel = () => {
  selectedEmployee.value = null
  selectedPosition.value = null
}

const handleAlertClick = (alert: any) => {
  ElMessage.info(`查看风险详情: ${alert.title}`)
  // 跳转到具体风险详情
}

const handleQuickAction = (actionKey: string) => {
  switch (actionKey) {
    case 'add-successor':
      ElMessage.info('添加继任者功能')
      break
    case 'export-report':
      ElMessage.info('导出报告功能')
      break
    case 'talent-review':
      ElMessage.info('人才盘点功能')
      break
    case 'risk-analysis':
      ElMessage.info('风险分析功能')
      break
  }
}

const selectEmployee = (employee: any) => {
  selectedEmployee.value = employee
}

const viewGrowthProfile = () => {
  ElMessage.info('跳转到成长档案')
}

const startMentorship = () => {
  ElMessage.info('安排导师功能')
}

const addToSuccession = () => {
  ElMessage.info('加入继任者计划')
}

const addSuccessors = () => {
  ElMessage.info('添加继任者候选人')
}

const exportHealthReport = () => {
  ElMessage.success('报告导出成功')
  healthCheckDialogVisible.value = false
}

// 辅助方法
const getTagType = (tag: string) => {
  const tagTypes = {
    '三卫': 'warning',
    '继任者': 'success',
    '高潜': 'primary',
    '关键人才': 'danger'
  }
  return tagTypes[tag] || 'info'
}

const getPerformanceTagType = (performance: string) => {
  const types = { 'A': 'success', 'B': 'warning', 'C': 'danger' }
  return types[performance] || 'info'
}

const getPotentialTagType = (potential: string) => {
  const types = { '高': 'success', '中': 'warning', '低': 'info' }
  return types[potential] || 'info'
}

const getRiskTagType = (risk: string) => {
  const types = { 'high': 'danger', 'medium': 'warning', 'low': 'success' }
  return types[risk] || 'info'
}

const getRiskLevelText = (risk: string) => {
  const texts = { 'high': '高风险', 'medium': '中风险', 'low': '低风险' }
  return texts[risk] || '未知'
}

onMounted(() => {
  // 初始化数据
  refreshData()
})
</script>

<style scoped>
.talent-map {
  padding: 0;
  height: 100vh;
  display: flex;
  flex-direction: column;
  background-color: #f5f5f5;
}

.talent-map-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 24px;
  background: white;
  border-bottom: 1px solid #e4e7ed;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 16px;
}

.page-title {
  margin: 0;
  font-size: 20px;
  color: #303133;
  display: flex;
  align-items: center;
  gap: 8px;
}

.subtitle {
  color: #909399;
  font-size: 14px;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 16px;
}

.view-switcher {
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.filter-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 24px;
  background: white;
  border-bottom: 1px solid #e4e7ed;
}

.search-section {
  display: flex;
  align-items: center;
}

.filter-section {
  display: flex;
  align-items: center;
  gap: 12px;
}

.talent-map-body {
  flex: 1;
  display: flex;
  overflow: hidden;
}

.left-panel {
  width: 280px;
  padding: 16px;
  background: #f5f5f5;
  overflow-y: auto;
}

.overview-card,
.risk-alerts-card,
.quick-actions-card {
  margin-bottom: 16px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: 600;
}

.overview-stats {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.stat-item {
  text-align: center;
}

.stat-number {
  font-size: 24px;
  font-weight: 600;
  color: #303133;
}

.stat-number.risk-high {
  color: #f56c6c;
}

.stat-number.talent-elite {
  color: #e6a23c;
}

.stat-number.successor-count {
  color: #67c23a;
}

.stat-label {
  font-size: 12px;
  color: #909399;
  margin-top: 4px;
}

.risk-alerts {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.alert-item {
  display: flex;
  align-items: center;
  padding: 12px;
  border-radius: 6px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.alert-item:hover {
  background-color: #f5f7fa;
}

.alert-item.alert-high {
  border-left: 3px solid #f56c6c;
  background-color: #fef0f0;
}

.alert-item.alert-medium {
  border-left: 3px solid #e6a23c;
  background-color: #fdf6ec;
}

.alert-icon {
  margin-right: 8px;
  color: #f56c6c;
}

.alert-content {
  flex: 1;
}

.alert-title {
  font-weight: 600;
  color: #303133;
  font-size: 14px;
}

.alert-desc {
  color: #606266;
  font-size: 12px;
  margin-top: 2px;
}

.alert-arrow {
  color: #c0c4cc;
}

.quick-actions {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.action-btn {
  width: 100%;
  justify-content: flex-start;
}

.main-content {
  flex: 1;
  padding: 16px;
  overflow: hidden;
}

.right-panel {
  width: 320px;
  padding: 16px;
  background: #f5f5f5;
  overflow-y: auto;
}

.detail-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: 600;
}

.employee-basic {
  display: flex;
  gap: 12px;
  margin-bottom: 16px;
}

.employee-info h3 {
  margin: 0 0 4px 0;
  color: #303133;
}

.employee-info p {
  margin: 2px 0;
  color: #606266;
  font-size: 14px;
}

.employee-tags {
  margin-top: 8px;
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.employee-metrics {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.metric-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.metric-label {
  color: #606266;
  font-size: 14px;
}

.action-buttons {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.position-basic h3 {
  margin: 0 0 8px 0;
  color: #303133;
}

.position-basic p {
  margin: 4px 0;
  color: #606266;
}

.position-status {
  margin-top: 12px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.status-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.status-label {
  color: #606266;
  font-size: 14px;
}

.succession-info h4 {
  margin: 0 0 12px 0;
  color: #303133;
}

.succession-tier {
  margin-bottom: 12px;
}

.tier-header {
  font-weight: 600;
  color: #606266;
  font-size: 12px;
  margin-bottom: 6px;
}

.tier-candidates {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.candidate-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.candidate-item:hover {
  background-color: #f0f9ff;
}

.candidate-name {
  font-size: 14px;
  color: #303133;
}

.no-successors {
  text-align: center;
  padding: 20px;
  color: #909399;
}

.health-report {
  padding: 16px;
}

.report-summary {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  text-align: center;
}

.summary-item {
  padding: 16px;
  border-radius: 6px;
  background-color: #f8f9fa;
}

.summary-number {
  font-size: 24px;
  font-weight: 600;
  color: #303133;
}

.summary-number.risk-high {
  color: #f56c6c;
}

.summary-number.risk-medium {
  color: #e6a23c;
}

.summary-label {
  font-size: 12px;
  color: #909399;
  margin-top: 4px;
}

.report-recommendations {
  margin-top: 20px;
}

.report-recommendations h4 {
  margin: 0 0 12px 0;
  color: #303133;
}

.report-recommendations ul {
  margin: 0;
  padding-left: 20px;
}

.report-recommendations li {
  margin-bottom: 8px;
  color: #606266;
}
</style> 