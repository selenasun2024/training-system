<template>
  <div class="growth-dashboard">
    <!-- 顶部控制区 -->
    <div class="dashboard-header">
      <div class="header-left">
        <h1 class="dashboard-title">成长数据看板</h1>
        <div class="subtitle">Growth Analytics Dashboard</div>
      </div>
      <div class="header-right">
        <div class="filter-controls">
          <!-- 时间维度选择器 -->
          <el-select v-model="timeRange" placeholder="时间范围" style="width: 120px; margin-right: 12px;">
            <el-option label="近7天" value="7d" />
            <el-option label="近30天" value="30d" />
            <el-option label="近3个月" value="3m" />
            <el-option label="近1年" value="1y" />
            <el-option label="自定义" value="custom" />
          </el-select>
          
          <!-- 组织维度筛选 -->
          <el-select v-model="orgFilter" placeholder="组织范围" style="width: 140px; margin-right: 12px;">
            <el-option label="全公司" value="all" />
            <el-option label="技术事业部" value="tech" />
            <el-option label="产品事业部" value="product" />
            <el-option label="运营事业部" value="operation" />
          </el-select>
          
          <!-- 人员维度筛选 -->
          <el-select v-model="staffFilter" placeholder="人员类型" style="width: 120px; margin-right: 12px;">
            <el-option label="全员" value="all" />
            <el-option label="新员工" value="new" />
            <el-option label="老员工" value="senior" />
            <el-option label="管理层" value="manager" />
            <el-option label="技术骨干" value="tech-expert" />
          </el-select>
          
          <!-- 刷新按钮 -->
          <el-button 
            type="primary" 
            :icon="Refresh" 
            @click="refreshData"
            :loading="loading"
          >
            刷新
          </el-button>
        </div>
      </div>
    </div>

    <!-- 核心指标区 -->
    <div class="kpi-section">
      <div class="kpi-grid">
        <KpiCard
          v-for="kpi in kpiData"
          :key="kpi.key"
          :title="kpi.title"
          :value="kpi.value"
          :change="kpi.change"
          :trend="kpi.trend"
          :color="kpi.color"
          :icon="kpi.icon"
          @click="handleKpiClick(kpi.key)"
        />
      </div>
    </div>

    <!-- 主要分析区 -->
    <div class="analysis-section">
      <div class="analysis-left">
        <!-- 成长活跃度热力图 -->
        <div class="chart-card">
          <div class="card-header">
            <h3>成长活跃度热力图</h3>
            <div class="card-actions">
              <el-button text type="primary" @click="showHeatmapDetail">详情</el-button>
            </div>
          </div>
          <div class="chart-container">
            <OrganizationHeatmap :data="heatmapData" @node-click="handleOrgClick" />
          </div>
        </div>

        <!-- 成长路径分析图 -->
        <div class="chart-card">
          <div class="card-header">
            <h3>成长路径分析</h3>
            <div class="card-actions">
              <el-button text type="primary" @click="showPathDetail">详情</el-button>
            </div>
          </div>
          <div class="chart-container">
            <GrowthPathAnalysis :data="pathData" />
          </div>
        </div>

        <!-- 技能需求趋势图 -->
        <div class="chart-card">
          <div class="card-header">
            <h3>技能需求趋势</h3>
            <div class="card-actions">
              <el-button text type="primary" @click="showSkillDetail">详情</el-button>
            </div>
          </div>
          <div class="chart-container">
            <SkillTrendChart :data="skillData" />
          </div>
        </div>
      </div>

      <div class="analysis-right">
        <!-- 成长伙伴网络图 -->
        <div class="chart-card">
          <div class="card-header">
            <h3>成长伙伴网络</h3>
            <div class="card-actions">
              <el-button text type="primary" @click="showNetworkDetail">详情</el-button>
            </div>
          </div>
          <div class="chart-container">
            <PartnerNetworkGraph :data="networkData" @node-click="handlePersonClick" />
          </div>
        </div>

        <!-- 个人成长排行榜 -->
        <div class="chart-card">
          <div class="card-header">
            <h3>成长活跃度排行</h3>
            <div class="card-actions">
              <el-button text type="primary" @click="showRankingDetail">详情</el-button>
            </div>
          </div>
          <div class="chart-container">
            <GrowthRanking :data="rankingData" />
          </div>
        </div>

        <!-- 预警和建议面板 -->
        <div class="chart-card">
          <div class="card-header">
            <h3>预警与建议</h3>
            <div class="card-actions">
              <el-badge :value="alertCount" class="alert-badge">
                <el-button text type="primary" @click="showAlertDetail">查看全部</el-button>
              </el-badge>
            </div>
          </div>
          <div class="chart-container">
            <AlertPanel :data="alertData" />
          </div>
        </div>
      </div>
    </div>

    <!-- 底部趋势区 -->
    <div class="trend-section">
      <div class="chart-card full-width">
        <div class="card-header">
          <h3>综合趋势分析</h3>
          <div class="card-actions">
            <el-button-group>
              <el-button 
                :type="trendView === 'overview' ? 'primary' : ''"
                @click="trendView = 'overview'"
              >
                总览
              </el-button>
              <el-button 
                :type="trendView === 'compare' ? 'primary' : ''"
                @click="trendView = 'compare'"
              >
                对比
              </el-button>
              <el-button 
                :type="trendView === 'predict' ? 'primary' : ''"
                @click="trendView = 'predict'"
              >
                预测
              </el-button>
            </el-button-group>
          </div>
        </div>
        <div class="chart-container large">
          <TrendAnalysisChart 
            :data="trendData" 
            :view="trendView"
            @anomaly-click="handleAnomalyClick"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue'
import { Refresh } from '@element-plus/icons-vue'
import KpiCard from '../components/KpiCard.vue'
import OrganizationHeatmap from '../components/OrganizationHeatmap.vue'
import GrowthPathAnalysis from '../components/GrowthPathAnalysis.vue'
import SkillTrendChart from '../components/SkillTrendChart.vue'
import PartnerNetworkGraph from '../components/PartnerNetworkGraph.vue'
import GrowthRanking from '../components/GrowthRanking.vue'
import AlertPanel from '../components/AlertPanel.vue'
import TrendAnalysisChart from '../components/TrendAnalysisChart.vue'

// 响应式数据
const loading = ref(false)
const timeRange = ref('30d')
const orgFilter = ref('all')
const staffFilter = ref('all')
const trendView = ref('overview')

// KPI数据
const kpiData = ref([
  {
    key: 'activeUsers',
    title: '活跃成长用户',
    value: 1247,
    change: '+12.5%',
    trend: 'up',
    color: '#409EFF',
    icon: 'user'
  },
  {
    key: 'goalCompletion',
    title: '目标完成率',
    value: '78.3%',
    change: '+5.2%',
    trend: 'up',
    color: '#67C23A',
    icon: 'target'
  },
  {
    key: 'partnerPairs',
    title: '成长伙伴配对',
    value: 324,
    change: '+18.7%',
    trend: 'up',
    color: '#E6A23C',
    icon: 'team'
  },
  {
    key: 'riskAlert',
    title: '人才流动预警',
    value: 23,
    change: '-8.1%',
    trend: 'down',
    color: '#F56C6C',
    icon: 'warning'
  }
])

// 模拟数据
const heatmapData = ref({})
const pathData = ref({})
const skillData = ref({})
const networkData = ref({})
const rankingData = ref([])
const alertData = ref([])
const trendData = ref({})

// 计算预警数量
const alertCount = computed(() => {
  return alertData.value.filter(item => item.level === 'high').length
})

// 方法
const refreshData = async () => {
  loading.value = true
  try {
    // 模拟API调用
    await new Promise(resolve => setTimeout(resolve, 1000))
    // 刷新所有数据
    await loadDashboardData()
  } finally {
    loading.value = false
  }
}

const loadDashboardData = async () => {
  // 模拟加载数据
  console.log('Loading dashboard data...')
}

const handleKpiClick = (key: string) => {
  console.log('KPI clicked:', key)
  // 根据KPI类型跳转到详情页
}

const handleOrgClick = (orgId: string) => {
  console.log('Organization clicked:', orgId)
  // 跳转到组织详情页
}

const handlePersonClick = (personId: string) => {
  console.log('Person clicked:', personId)
  // 跳转到个人详情页
}

const handleAnomalyClick = (anomaly: any) => {
  console.log('Anomaly clicked:', anomaly)
  // 显示异常详情
}

const showHeatmapDetail = () => {
  console.log('Show heatmap detail')
}

const showPathDetail = () => {
  console.log('Show path detail')
}

const showSkillDetail = () => {
  console.log('Show skill detail')
}

const showNetworkDetail = () => {
  console.log('Show network detail')
}

const showRankingDetail = () => {
  console.log('Show ranking detail')
}

const showAlertDetail = () => {
  console.log('Show alert detail')
}

// 生命周期
onMounted(() => {
  loadDashboardData()
})
</script>

<style scoped>
.growth-dashboard {
  padding: 20px;
  background: #f5f7fa;
  min-height: 100vh;
}

.dashboard-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  padding: 20px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.header-left {
  display: flex;
  flex-direction: column;
}

.dashboard-title {
  font-size: 24px;
  font-weight: 600;
  color: #1f2937;
  margin: 0 0 4px 0;
}

.subtitle {
  font-size: 14px;
  color: #6b7280;
}

.filter-controls {
  display: flex;
  align-items: center;
}

.kpi-section {
  margin-bottom: 24px;
}

.kpi-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
}

.analysis-section {
  display: flex;
  gap: 20px;
  margin-bottom: 24px;
}

.analysis-left {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.analysis-right {
  width: 400px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.trend-section {
  margin-bottom: 24px;
}

.chart-card {
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.chart-card.full-width {
  width: 100%;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid #e5e7eb;
}

.card-header h3 {
  font-size: 16px;
  font-weight: 600;
  color: #1f2937;
  margin: 0;
}

.card-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.alert-badge {
  margin-left: 8px;
}

.chart-container {
  padding: 20px;
  height: 300px;
}

.chart-container.large {
  height: 400px;
}

/* 响应式设计 */
@media (max-width: 1400px) {
  .analysis-section {
    flex-direction: column;
  }
  
  .analysis-right {
    width: 100%;
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 20px;
  }
}

@media (max-width: 1024px) {
  .kpi-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .analysis-right {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .dashboard-header {
    flex-direction: column;
    gap: 16px;
  }
  
  .filter-controls {
    flex-wrap: wrap;
    gap: 8px;
  }
  
  .kpi-grid {
    grid-template-columns: 1fr;
  }
  
  .chart-container {
    height: 250px;
  }
}
</style> 