<template>
  <div class="analytics-dashboard">
    <!-- 页面头部 -->
    <div class="page-header">
      <div class="header-left">
        <h2>数据统计分析</h2>
        <p>数据驱动的管理决策，优化带教效果</p>
      </div>
      <div class="header-right">
        <el-button type="primary" :icon="Download" @click="exportReport">
          导出报告
        </el-button>
      </div>
    </div>

    <!-- 时间范围选择 -->
    <div class="time-selector">
      <el-radio-group v-model="timeRange" @change="handleTimeRangeChange">
        <el-radio-button label="week">本周</el-radio-button>
        <el-radio-button label="month">本月</el-radio-button>
        <el-radio-button label="quarter">本季度</el-radio-button>
        <el-radio-button label="year">本年度</el-radio-button>
        <el-radio-button label="custom">自定义</el-radio-button>
      </el-radio-group>
      
      <el-date-picker
        v-if="timeRange === 'custom'"
        v-model="customTimeRange"
        type="daterange"
        range-separator="至"
        start-placeholder="开始日期"
        end-placeholder="结束日期"
        format="YYYY-MM-DD"
        value-format="YYYY-MM-DD"
        @change="handleCustomTimeChange"
      />
    </div>

    <!-- 核心指标概览 -->
    <div class="kpi-overview">
      <div class="kpi-card">
        <div class="kpi-icon">
          <el-icon color="#409EFF"><TrendCharts /></el-icon>
        </div>
        <div class="kpi-content">
          <div class="kpi-value">{{ kpiData.completionRate }}%</div>
          <div class="kpi-label">完成率</div>
          <div class="kpi-trend" :class="getTrendClass(kpiData.completionRateTrend)">
            <el-icon><ArrowUp v-if="kpiData.completionRateTrend > 0" /><ArrowDown v-else /></el-icon>
            {{ Math.abs(kpiData.completionRateTrend) }}%
          </div>
        </div>
      </div>

      <div class="kpi-card">
        <div class="kpi-icon">
          <el-icon color="#67C23A"><Star /></el-icon>
        </div>
        <div class="kpi-content">
          <div class="kpi-value">{{ kpiData.satisfaction }}</div>
          <div class="kpi-label">满意度</div>
          <div class="kpi-trend" :class="getTrendClass(kpiData.satisfactionTrend)">
            <el-icon><ArrowUp v-if="kpiData.satisfactionTrend > 0" /><ArrowDown v-else /></el-icon>
            {{ Math.abs(kpiData.satisfactionTrend).toFixed(1) }}
          </div>
        </div>
      </div>

      <div class="kpi-card">
        <div class="kpi-icon">
          <el-icon color="#E6A23C"><Clock /></el-icon>
        </div>
        <div class="kpi-content">
          <div class="kpi-value">{{ kpiData.averageDuration }}</div>
          <div class="kpi-label">平均周期(天)</div>
          <div class="kpi-trend" :class="getTrendClass(-kpiData.durationTrend)">
            <el-icon><ArrowUp v-if="kpiData.durationTrend < 0" /><ArrowDown v-else /></el-icon>
            {{ Math.abs(kpiData.durationTrend) }}天
          </div>
        </div>
      </div>

      <div class="kpi-card">
        <div class="kpi-icon">
          <el-icon color="#F56C6C"><User /></el-icon>
        </div>
        <div class="kpi-content">
          <div class="kpi-value">{{ kpiData.activeProjects }}</div>
          <div class="kpi-label">活跃项目</div>
          <div class="kpi-trend" :class="getTrendClass(kpiData.projectsTrend)">
            <el-icon><ArrowUp v-if="kpiData.projectsTrend > 0" /><ArrowDown v-else /></el-icon>
            {{ Math.abs(kpiData.projectsTrend) }}
          </div>
        </div>
      </div>
    </div>

    <!-- 图表区域 -->
    <div class="charts-section">
      <!-- 第一行图表 -->
      <div class="chart-row">
        <!-- 项目完成趋势 -->
        <div class="chart-card">
          <div class="chart-header">
            <h3>项目完成趋势</h3>
            <el-select v-model="completionChartType" size="small" style="width: 120px">
              <el-option label="按月统计" value="month" />
              <el-option label="按周统计" value="week" />
              <el-option label="按天统计" value="day" />
            </el-select>
          </div>
          <div class="chart-container">
            <canvas ref="completionChart" width="400" height="200"></canvas>
          </div>
        </div>

        <!-- 导师负荷分布 -->
        <div class="chart-card">
          <div class="chart-header">
            <h3>导师负荷分布</h3>
            <el-button type="text" @click="viewMentorDetails">查看详情</el-button>
          </div>
          <div class="chart-container">
            <canvas ref="mentorLoadChart" width="400" height="200"></canvas>
          </div>
        </div>
      </div>

      <!-- 第二行图表 -->
      <div class="chart-row">
        <!-- 学员进度分析 -->
        <div class="chart-card">
          <div class="chart-header">
            <h3>学员进度分析</h3>
            <el-radio-group v-model="progressAnalysisType" size="small">
              <el-radio-button label="department">按部门</el-radio-button>
              <el-radio-button label="level">按级别</el-radio-button>
            </el-radio-group>
          </div>
          <div class="chart-container">
            <canvas ref="progressChart" width="400" height="200"></canvas>
          </div>
        </div>

        <!-- 带教效果评估 -->
        <div class="chart-card">
          <div class="chart-header">
            <h3>带教效果评估</h3>
            <el-button type="text" @click="viewEffectDetails">查看详情</el-button>
          </div>
          <div class="chart-container">
            <canvas ref="effectChart" width="400" height="200"></canvas>
          </div>
        </div>
      </div>

      <!-- 第三行图表 -->
      <div class="chart-row">
        <!-- 模板使用统计 -->
        <div class="chart-card">
          <div class="chart-header">
            <h3>模板使用统计</h3>
            <el-select v-model="templateStatsType" size="small" style="width: 120px">
              <el-option label="使用次数" value="usage" />
              <el-option label="成功率" value="success" />
              <el-option label="满意度" value="rating" />
            </el-select>
          </div>
          <div class="chart-container">
            <canvas ref="templateChart" width="400" height="200"></canvas>
          </div>
        </div>

        <!-- 关键洞察 -->
        <div class="insights-card">
          <div class="chart-header">
            <h3>关键洞察</h3>
            <el-button type="text" @click="refreshInsights">刷新</el-button>
          </div>
          <div class="insights-list">
            <div 
              v-for="insight in keyInsights" 
              :key="insight.id"
              class="insight-item"
              :class="insight.type"
            >
              <div class="insight-icon">
                <el-icon>
                  <component :is="insight.icon" />
                </el-icon>
              </div>
              <div class="insight-content">
                <h4>{{ insight.title }}</h4>
                <p>{{ insight.description }}</p>
                <div class="insight-actions">
                  <el-button type="text" size="small" @click="viewInsightDetail(insight.id)">
                    查看详情
                  </el-button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 详细报表 -->
    <div class="detailed-reports">
      <div class="report-tabs">
        <el-tabs v-model="activeReportTab" @tab-click="handleReportTabClick">
          <el-tab-pane label="导师绩效报告" name="mentor">
            <MentorPerformanceReport 
              :time-range="timeRange" 
              :user-role="userRole"
            />
          </el-tab-pane>
          
          <el-tab-pane label="学员发展报告" name="student">
            <StudentDevelopmentReport 
              :time-range="timeRange"
              :user-role="userRole"
            />
          </el-tab-pane>
          
          <el-tab-pane label="部门效果对比" name="department">
            <DepartmentComparisonReport 
              :time-range="timeRange"
              :user-role="userRole"
            />
          </el-tab-pane>
          
          <el-tab-pane label="模板效果分析" name="template">
            <TemplateEffectivenessReport 
              :time-range="timeRange"
              :user-role="userRole"
            />
          </el-tab-pane>
        </el-tabs>
      </div>
    </div>

    <!-- 预警和建议 -->
    <div class="alerts-section">
      <div class="section-header">
        <h3>预警和建议</h3>
        <el-button type="text" @click="viewAllAlerts">查看全部</el-button>
      </div>
      <div class="alerts-grid">
        <div 
          v-for="alert in alerts" 
          :key="alert.id"
          class="alert-card"
          :class="alert.level"
        >
          <div class="alert-icon">
            <el-icon>
              <component :is="alert.icon" />
            </el-icon>
          </div>
          <div class="alert-content">
            <h4>{{ alert.title }}</h4>
            <p>{{ alert.description }}</p>
            <div class="alert-actions">
              <el-button type="primary" size="small" @click="handleAlert(alert.id)">
                处理
              </el-button>
              <el-button type="text" size="small" @click="dismissAlert(alert.id)">
                忽略
              </el-button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, nextTick } from 'vue';
import { 
  Download, 
  TrendCharts, 
  Star, 
  Clock, 
  User,
  ArrowUp,
  ArrowDown,
  Warning,
  InfoFilled,
  CircleCheck
} from '@element-plus/icons-vue';
import { ElMessage } from 'element-plus';
import MentorPerformanceReport from './reports/MentorPerformanceReport.vue';
import StudentDevelopmentReport from './reports/StudentDevelopmentReport.vue';
import DepartmentComparisonReport from './reports/DepartmentComparisonReport.vue';
import TemplateEffectivenessReport from './reports/TemplateEffectivenessReport.vue';

// Props
interface Props {
  userRole: string;
  userId: string;
}

const props = defineProps<Props>();

// 响应式数据
const timeRange = ref('month');
const customTimeRange = ref<[string, string] | null>(null);
const completionChartType = ref('month');
const progressAnalysisType = ref('department');
const templateStatsType = ref('usage');
const activeReportTab = ref('mentor');

// KPI数据
const kpiData = ref({
  completionRate: 85,
  completionRateTrend: 5,
  satisfaction: 4.6,
  satisfactionTrend: 0.2,
  averageDuration: 68,
  durationTrend: -5,
  activeProjects: 42,
  projectsTrend: 8
});

// 关键洞察
const keyInsights = ref([
  {
    id: 1,
    type: 'success',
    icon: 'CircleCheck',
    title: '技术部带教效果突出',
    description: '技术部的带教完成率达到92%，高于平均水平7%，建议将其经验推广到其他部门。'
  },
  {
    id: 2,
    type: 'warning',
    icon: 'Warning',
    title: '部分导师负荷过重',
    description: '有3位导师当前负荷超过80%，建议重新分配学员或增加导师资源。'
  },
  {
    id: 3,
    type: 'info',
    icon: 'InfoFilled',
    title: '新模板使用率偏低',
    description: '最近发布的产品管理模板使用率仅为15%，建议加强推广和培训。'
  }
]);

// 预警信息
const alerts = ref([
  {
    id: 1,
    level: 'high',
    icon: 'Warning',
    title: '项目延期风险',
    description: '有5个项目预计将延期完成，需要及时干预'
  },
  {
    id: 2,
    level: 'medium',
    icon: 'InfoFilled',
    title: '导师资源不足',
    description: '前端开发领域导师资源紧张，影响新项目启动'
  },
  {
    id: 3,
    level: 'low',
    icon: 'CircleCheck',
    title: '整体进展良好',
    description: '本月带教项目整体进展顺利，达成预期目标'
  }
]);

// Chart refs
const completionChart = ref(null);
const mentorLoadChart = ref(null);
const progressChart = ref(null);
const effectChart = ref(null);
const templateChart = ref(null);

// 方法
const getTrendClass = (trend: number) => {
  return trend > 0 ? 'trend-up' : 'trend-down';
};

const handleTimeRangeChange = (value: string) => {
  if (value !== 'custom') {
    customTimeRange.value = null;
  }
  updateCharts();
};

const handleCustomTimeChange = () => {
  updateCharts();
};

const handleReportTabClick = (tab: any) => {
  console.log('切换报告标签:', tab.name);
};

const exportReport = () => {
  ElMessage.info('正在生成报告...');
  // 模拟报告生成
  setTimeout(() => {
    ElMessage.success('报告导出成功');
  }, 2000);
};

const viewMentorDetails = () => {
  ElMessage.info('查看导师详情功能开发中');
};

const viewEffectDetails = () => {
  ElMessage.info('查看效果详情功能开发中');
};

const refreshInsights = () => {
  ElMessage.success('洞察数据已刷新');
};

const viewInsightDetail = (insightId: number) => {
  console.log('查看洞察详情:', insightId);
};

const viewAllAlerts = () => {
  ElMessage.info('查看全部预警功能开发中');
};

const handleAlert = (alertId: number) => {
  console.log('处理预警:', alertId);
  ElMessage.success('预警处理中');
};

const dismissAlert = (alertId: number) => {
  const index = alerts.value.findIndex(a => a.id === alertId);
  if (index !== -1) {
    alerts.value.splice(index, 1);
    ElMessage.info('预警已忽略');
  }
};

const updateCharts = () => {
  nextTick(() => {
    // 这里应该调用实际的图表更新逻辑
    console.log('更新图表数据');
  });
};

const initCharts = () => {
  nextTick(() => {
    // 初始化图表
    // 这里应该使用实际的图表库如ECharts来绘制图表
    console.log('初始化图表');
  });
};

// 页面初始化
onMounted(() => {
  initCharts();
});
</script>

<style scoped>
.analytics-dashboard {
  padding: 24px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.header-left h2 {
  margin: 0 0 8px 0;
  color: #1f2937;
  font-size: 24px;
}

.header-left p {
  margin: 0;
  color: #6b7280;
  font-size: 14px;
}

.time-selector {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 24px;
  padding: 16px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.kpi-overview {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 16px;
  margin-bottom: 24px;
}

.kpi-card {
  background: white;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  display: flex;
  align-items: center;
  gap: 16px;
}

.kpi-icon {
  font-size: 32px;
}

.kpi-content {
  flex: 1;
}

.kpi-value {
  font-size: 24px;
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 4px;
}

.kpi-label {
  font-size: 14px;
  color: #6b7280;
  margin-bottom: 8px;
}

.kpi-trend {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  font-weight: 500;
}

.kpi-trend.trend-up {
  color: #10b981;
}

.kpi-trend.trend-down {
  color: #ef4444;
}

.charts-section {
  margin-bottom: 24px;
}

.chart-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  margin-bottom: 16px;
}

.chart-card {
  background: white;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.chart-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.chart-header h3 {
  margin: 0;
  font-size: 16px;
  color: #1f2937;
}

.chart-container {
  height: 200px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f8fafc;
  border-radius: 8px;
}

.insights-card {
  background: white;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.insights-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
  max-height: 400px;
  overflow-y: auto;
}

.insight-item {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 16px;
  border-radius: 8px;
  border-left: 4px solid;
}

.insight-item.success {
  background: #f0f9ff;
  border-left-color: #10b981;
}

.insight-item.warning {
  background: #fffbeb;
  border-left-color: #f59e0b;
}

.insight-item.info {
  background: #f8fafc;
  border-left-color: #3b82f6;
}

.insight-icon {
  font-size: 20px;
  margin-top: 2px;
}

.insight-content {
  flex: 1;
}

.insight-content h4 {
  margin: 0 0 8px 0;
  font-size: 14px;
  color: #1f2937;
}

.insight-content p {
  margin: 0 0 8px 0;
  font-size: 13px;
  color: #6b7280;
  line-height: 1.5;
}

.detailed-reports {
  margin-bottom: 24px;
}

.report-tabs {
  background: white;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.alerts-section {
  background: white;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.section-header h3 {
  margin: 0;
  font-size: 18px;
  color: #1f2937;
}

.alerts-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 16px;
}

.alert-card {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 16px;
  border-radius: 8px;
  border: 1px solid;
}

.alert-card.high {
  background: #fef2f2;
  border-color: #ef4444;
}

.alert-card.medium {
  background: #fffbeb;
  border-color: #f59e0b;
}

.alert-card.low {
  background: #f0f9ff;
  border-color: #10b981;
}

.alert-icon {
  font-size: 20px;
  margin-top: 2px;
}

.alert-content {
  flex: 1;
}

.alert-content h4 {
  margin: 0 0 8px 0;
  font-size: 14px;
  color: #1f2937;
}

.alert-content p {
  margin: 0 0 12px 0;
  font-size: 13px;
  color: #6b7280;
  line-height: 1.5;
}

.alert-actions {
  display: flex;
  gap: 8px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .page-header {
    flex-direction: column;
    gap: 16px;
    align-items: flex-start;
  }
  
  .time-selector {
    flex-direction: column;
    align-items: stretch;
    gap: 12px;
  }
  
  .kpi-overview {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .chart-row {
    grid-template-columns: 1fr;
  }
  
  .alerts-grid {
    grid-template-columns: 1fr;
  }
}
</style> 