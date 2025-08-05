<template>
  <div class="dashboard-display-config">
    <el-card shadow="never">
      <template #header>
        <div class="card-header">
          <h3>看板展示配置</h3>
          <div class="header-actions">
            <el-button @click="handlePreview">
              <el-icon><View /></el-icon>
              预览效果
            </el-button>
            <el-button type="primary" @click="handleSaveConfig">
              <el-icon><Check /></el-icon>
              保存配置
            </el-button>
          </div>
        </div>
      </template>

      <div class="config-sections">
        <!-- 基础设置 -->
        <el-card class="section-card" shadow="never">
          <template #header>
            <h4>基础设置</h4>
          </template>
          
          <el-form :model="dashboardConfig" label-width="120px">
            <el-row :gutter="20">
              <el-col :span="12">
                <el-form-item label="看板标题">
                  <el-input v-model="dashboardConfig.title" placeholder="请输入看板标题" />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="更新频率">
                  <el-select v-model="dashboardConfig.refreshInterval" placeholder="请选择更新频率">
                    <el-option label="实时" value="0" />
                    <el-option label="每分钟" value="60" />
                    <el-option label="每5分钟" value="300" />
                    <el-option label="每15分钟" value="900" />
                    <el-option label="每小时" value="3600" />
                  </el-select>
                </el-form-item>
              </el-col>
            </el-row>
            
            <el-row :gutter="20">
              <el-col :span="12">
                <el-form-item label="主题色彩">
                  <el-select v-model="dashboardConfig.theme" placeholder="请选择主题">
                    <el-option label="默认蓝色" value="default" />
                    <el-option label="商务灰色" value="business" />
                    <el-option label="活力绿色" value="green" />
                    <el-option label="温暖橙色" value="orange" />
                  </el-select>
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="显示Logo">
                  <el-switch v-model="dashboardConfig.showLogo" />
                </el-form-item>
              </el-col>
            </el-row>
          </el-form>
        </el-card>

        <!-- 统计卡片配置 -->
        <el-card class="section-card" shadow="never">
          <template #header>
            <div class="section-header">
              <h4>统计卡片配置</h4>
              <el-button type="primary" size="small" @click="handleAddStatCard">
                <el-icon><Plus /></el-icon>
                添加卡片
              </el-button>
            </div>
          </template>
          
          <div class="stat-cards-config">
            <draggable 
              v-model="dashboardConfig.statCards" 
              class="cards-grid"
              :animation="200"
              handle=".drag-handle"
            >
              <template #item="{ element: card, index }">
                <div class="stat-card-item">
                  <el-card class="config-card">
                    <div class="card-config-header">
                      <div class="drag-handle">
                        <el-icon><Rank /></el-icon>
                      </div>
                      <div class="card-info">
                        <span class="card-title">{{ card.title }}</span>
                        <el-switch 
                          v-model="card.enabled" 
                          active-text="显示" 
                          inactive-text="隐藏"
                        />
                      </div>
                      <div class="card-actions">
                        <el-button type="text" @click="handleEditStatCard(card, index)">
                          <el-icon><Edit /></el-icon>
                        </el-button>
                        <el-button type="text" @click="handleDeleteStatCard(index)">
                          <el-icon><Delete /></el-icon>
                        </el-button>
                      </div>
                    </div>
                    
                    <div class="card-preview">
                      <div class="preview-card" :style="{ backgroundColor: card.bgColor }">
                        <div class="preview-icon" :style="{ color: card.iconColor }">
                          <component :is="getIconComponent(card.icon)" />
                        </div>
                        <div class="preview-content">
                          <div class="preview-value">{{ card.sampleValue }}</div>
                          <div class="preview-label">{{ card.title }}</div>
                        </div>
                      </div>
                    </div>
                  </el-card>
                </div>
              </template>
            </draggable>
          </div>
        </el-card>

        <!-- 图表配置 -->
        <el-card class="section-card" shadow="never">
          <template #header>
            <div class="section-header">
              <h4>图表配置</h4>
              <el-button type="primary" size="small" @click="handleAddChart">
                <el-icon><Plus /></el-icon>
                添加图表
              </el-button>
            </div>
          </template>
          
          <div class="charts-config">
            <div v-for="(chart, index) in dashboardConfig.charts" :key="index" class="chart-config-item">
              <el-card class="chart-card">
                <template #header>
                  <div class="chart-header">
                    <div class="chart-info">
                      <span class="chart-title">{{ chart.title }}</span>
                      <el-tag :type="getChartTypeColor(chart.type)">{{ chart.type }}</el-tag>
                    </div>
                    <div class="chart-actions">
                      <el-switch 
                        v-model="chart.enabled" 
                        active-text="显示" 
                        inactive-text="隐藏"
                      />
                      <el-button type="text" @click="handleEditChart(chart, index)">
                        <el-icon><Edit /></el-icon>
                      </el-button>
                      <el-button type="text" @click="handleDeleteChart(index)">
                        <el-icon><Delete /></el-icon>
                      </el-button>
                    </div>
                  </div>
                </template>
                
                <div class="chart-config-content">
                  <el-row :gutter="20">
                    <el-col :span="12">
                      <p><strong>数据源：</strong>{{ chart.dataSource }}</p>
                      <p><strong>图表尺寸：</strong>{{ chart.width }} x {{ chart.height }}</p>
                      <p><strong>显示位置：</strong>{{ chart.position }}</p>
                    </el-col>
                    <el-col :span="12">
                      <div class="chart-preview">
                        <div class="preview-placeholder">
                          <el-icon><PieChart /></el-icon>
                          <span>{{ chart.type }}图表预览</span>
                        </div>
                      </div>
                    </el-col>
                  </el-row>
                </div>
              </el-card>
            </div>
          </div>
        </el-card>

        <!-- 快捷入口配置 -->
        <el-card class="section-card" shadow="never">
          <template #header>
            <div class="section-header">
              <h4>快捷入口配置</h4>
              <el-button type="primary" size="small" @click="handleAddQuickLink">
                <el-icon><Plus /></el-icon>
                添加入口
              </el-button>
            </div>
          </template>
          
          <div class="quick-links-config">
            <div class="links-grid">
              <div v-for="(link, index) in dashboardConfig.quickLinks" :key="index" class="link-item">
                <el-card class="link-card">
                  <div class="link-header">
                    <div class="link-info">
                      <span class="link-title">{{ link.title }}</span>
                      <el-switch 
                        v-model="link.enabled" 
                        active-text="显示" 
                        inactive-text="隐藏"
                      />
                    </div>
                    <div class="link-actions">
                      <el-button type="text" @click="handleEditQuickLink(link, index)">
                        <el-icon><Edit /></el-icon>
                      </el-button>
                      <el-button type="text" @click="handleDeleteQuickLink(index)">
                        <el-icon><Delete /></el-icon>
                      </el-button>
                    </div>
                  </div>
                  
                  <div class="link-preview">
                    <div class="preview-link" :style="{ backgroundColor: link.bgColor }">
                      <div class="preview-icon" :style="{ color: link.iconColor }">
                        <component :is="getIconComponent(link.icon)" />
                      </div>
                      <div class="preview-label">{{ link.title }}</div>
                    </div>
                  </div>
                </el-card>
              </div>
            </div>
          </div>
        </el-card>
      </div>
    </el-card>

    <!-- 统计卡片编辑对话框 -->
    <el-dialog 
      v-model="statCardDialogVisible" 
      :title="isEditingStatCard ? '编辑统计卡片' : '添加统计卡片'"
      width="600px"
    >
      <el-form :model="currentStatCard" label-width="100px">
        <el-form-item label="卡片标题">
          <el-input v-model="currentStatCard.title" placeholder="请输入卡片标题" />
        </el-form-item>
        
        <el-form-item label="数据源">
          <el-select v-model="currentStatCard.dataSource" placeholder="请选择数据源">
            <el-option label="培训项目数" value="training-projects" />
            <el-option label="学员数量" value="students" />
            <el-option label="完成率" value="completion-rate" />
            <el-option label="平均分数" value="average-score" />
          </el-select>
        </el-form-item>
        
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="图标">
              <el-select v-model="currentStatCard.icon" placeholder="请选择图标">
                <el-option label="文件夹" value="Folder" />
                <el-option label="用户" value="User" />
                <el-option label="时钟" value="Clock" />
                <el-option label="完成" value="CircleCheck" />
                <el-option label="趋势" value="TrendCharts" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="图标颜色">
              <el-color-picker v-model="currentStatCard.iconColor" />
            </el-form-item>
          </el-col>
        </el-row>
        
        <el-form-item label="背景颜色">
          <el-color-picker v-model="currentStatCard.bgColor" />
        </el-form-item>
        
        <el-form-item label="示例数值">
          <el-input v-model="currentStatCard.sampleValue" placeholder="请输入示例数值" />
        </el-form-item>
      </el-form>
      
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="statCardDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="handleSaveStatCard">确定</el-button>
        </div>
      </template>
    </el-dialog>

    <!-- 图表编辑对话框 -->
    <el-dialog 
      v-model="chartDialogVisible" 
      :title="isEditingChart ? '编辑图表' : '添加图表'"
      width="700px"
    >
      <el-form :model="currentChart" label-width="100px">
        <el-form-item label="图表标题">
          <el-input v-model="currentChart.title" placeholder="请输入图表标题" />
        </el-form-item>
        
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="图表类型">
              <el-select v-model="currentChart.type" placeholder="请选择图表类型">
                <el-option label="柱状图" value="柱状图" />
                <el-option label="饼图" value="饼图" />
                <el-option label="折线图" value="折线图" />
                <el-option label="环形图" value="环形图" />
                <el-option label="雷达图" value="雷达图" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="数据源">
              <el-select v-model="currentChart.dataSource" placeholder="请选择数据源">
                <el-option label="培训完成情况" value="training-completion" />
                <el-option label="员工能力分布" value="skill-distribution" />
                <el-option label="部门参与度" value="department-engagement" />
                <el-option label="月度趋势" value="monthly-trend" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        
        <el-row :gutter="20">
          <el-col :span="8">
            <el-form-item label="宽度">
              <el-input-number v-model="currentChart.width" :min="200" :max="800" controls-position="right" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="高度">
              <el-input-number v-model="currentChart.height" :min="200" :max="600" controls-position="right" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="显示位置">
              <el-select v-model="currentChart.position" placeholder="请选择位置">
                <el-option label="左侧" value="left" />
                <el-option label="右侧" value="right" />
                <el-option label="居中" value="center" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
      
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="chartDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="handleSaveChart">确定</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, shallowRef } from 'vue'
import { ElMessage } from 'element-plus'
import { 
  Plus, Edit, Delete, View, Check, Rank, PieChart, 
  Folder, User, Clock, CircleCheck, TrendCharts 
} from '@element-plus/icons-vue'
import draggable from 'vuedraggable'

interface StatCard {
  title: string
  dataSource: string
  icon: string
  iconColor: string
  bgColor: string
  sampleValue: string
  enabled: boolean
}

interface Chart {
  title: string
  type: string
  dataSource: string
  width: number
  height: number
  position: string
  enabled: boolean
}

interface QuickLink {
  title: string
  icon: string
  iconColor: string
  bgColor: string
  url: string
  enabled: boolean
}

interface DashboardConfig {
  title: string
  refreshInterval: string
  theme: string
  showLogo: boolean
  statCards: StatCard[]
  charts: Chart[]
  quickLinks: QuickLink[]
}

// 看板配置
const dashboardConfig = reactive<DashboardConfig>({
  title: '人才发展数据看板',
  refreshInterval: '300',
  theme: 'default',
  showLogo: true,
  statCards: [
    {
      title: '进行中的项目',
      dataSource: 'training-projects',
      icon: 'Folder',
      iconColor: '#409eff',
      bgColor: '#ecf5ff',
      sampleValue: '12',
      enabled: true
    },
    {
      title: '本月新增学员',
      dataSource: 'students',
      icon: 'User',
      iconColor: '#67c23a',
      bgColor: '#f0f9ff',
      sampleValue: '85',
      enabled: true
    },
    {
      title: '待处理任务',
      dataSource: 'tasks',
      icon: 'Clock',
      iconColor: '#e6a23c',
      bgColor: '#fdf6ec',
      sampleValue: '8',
      enabled: true
    },
    {
      title: '本周完成课程',
      dataSource: 'completion-rate',
      icon: 'CircleCheck',
      iconColor: '#f56c6c',
      bgColor: '#fef0f0',
      sampleValue: '126',
      enabled: true
    }
  ],
  charts: [
    {
      title: '培训完成情况',
      type: '柱状图',
      dataSource: 'training-completion',
      width: 400,
      height: 300,
      position: 'left',
      enabled: true
    },
    {
      title: '员工能力分布',
      type: '雷达图',
      dataSource: 'skill-distribution',
      width: 400,
      height: 300,
      position: 'right',
      enabled: true
    }
  ],
  quickLinks: [
    {
      title: '新建项目',
      icon: 'Plus',
      iconColor: '#409eff',
      bgColor: '#ecf5ff',
      url: '/training-management/project-management/detail/new',
      enabled: true
    },
    {
      title: '项目列表',
      icon: 'Folder',
      iconColor: '#67c23a',
      bgColor: '#f0f9ff',
      url: '/training-management/project-management/list',
      enabled: true
    },
    {
      title: '个人成长档案',
      icon: 'User',
      iconColor: '#e6a23c',
      bgColor: '#fdf6ec',
      url: '/training-management/growth-profile',
      enabled: true
    },
    {
      title: '系统配置',
      icon: 'Setting',
      iconColor: '#f56c6c',
      bgColor: '#fef0f0',
      url: '/training-management/system-configuration',
      enabled: true
    }
  ]
})

// 对话框状态
const statCardDialogVisible = ref(false)
const chartDialogVisible = ref(false)
const isEditingStatCard = ref(false)
const isEditingChart = ref(false)
const currentStatCardIndex = ref(-1)
const currentChartIndex = ref(-1)

// 当前编辑的项目
const currentStatCard = reactive<StatCard>({
  title: '',
  dataSource: '',
  icon: '',
  iconColor: '#409eff',
  bgColor: '#ecf5ff',
  sampleValue: '',
  enabled: true
})

const currentChart = reactive<Chart>({
  title: '',
  type: '',
  dataSource: '',
  width: 400,
  height: 300,
  position: 'center',
  enabled: true
})

// 图标组件映射
const iconComponents = shallowRef({
  Folder,
  User,
  Clock,
  CircleCheck,
  TrendCharts,
  Plus
})

// 获取图标组件
const getIconComponent = (iconName: string) => {
  return iconComponents.value[iconName] || Folder
}

// 获取图表类型颜色
const getChartTypeColor = (type: string) => {
  switch (type) {
    case '柱状图':
      return 'primary'
    case '饼图':
      return 'success'
    case '折线图':
      return 'warning'
    case '环形图':
      return 'info'
    case '雷达图':
      return 'danger'
    default:
      return 'default'
  }
}

// 统计卡片操作
const handleAddStatCard = () => {
  isEditingStatCard.value = false
  resetCurrentStatCard()
  statCardDialogVisible.value = true
}

const handleEditStatCard = (card: StatCard, index: number) => {
  isEditingStatCard.value = true
  currentStatCardIndex.value = index
  Object.assign(currentStatCard, card)
  statCardDialogVisible.value = true
}

const handleDeleteStatCard = (index: number) => {
  dashboardConfig.statCards.splice(index, 1)
  ElMessage.success('删除成功')
}

const handleSaveStatCard = () => {
  if (isEditingStatCard.value) {
    Object.assign(dashboardConfig.statCards[currentStatCardIndex.value], currentStatCard)
    ElMessage.success('编辑成功')
  } else {
    dashboardConfig.statCards.push({ ...currentStatCard })
    ElMessage.success('添加成功')
  }
  statCardDialogVisible.value = false
}

const resetCurrentStatCard = () => {
  Object.assign(currentStatCard, {
    title: '',
    dataSource: '',
    icon: 'Folder',
    iconColor: '#409eff',
    bgColor: '#ecf5ff',
    sampleValue: '',
    enabled: true
  })
}

// 图表操作
const handleAddChart = () => {
  isEditingChart.value = false
  resetCurrentChart()
  chartDialogVisible.value = true
}

const handleEditChart = (chart: Chart, index: number) => {
  isEditingChart.value = true
  currentChartIndex.value = index
  Object.assign(currentChart, chart)
  chartDialogVisible.value = true
}

const handleDeleteChart = (index: number) => {
  dashboardConfig.charts.splice(index, 1)
  ElMessage.success('删除成功')
}

const handleSaveChart = () => {
  if (isEditingChart.value) {
    Object.assign(dashboardConfig.charts[currentChartIndex.value], currentChart)
    ElMessage.success('编辑成功')
  } else {
    dashboardConfig.charts.push({ ...currentChart })
    ElMessage.success('添加成功')
  }
  chartDialogVisible.value = false
}

const resetCurrentChart = () => {
  Object.assign(currentChart, {
    title: '',
    type: '',
    dataSource: '',
    width: 400,
    height: 300,
    position: 'center',
    enabled: true
  })
}

// 快捷入口操作
const handleAddQuickLink = () => {
  dashboardConfig.quickLinks.push({
    title: '新快捷入口',
    icon: 'Plus',
    iconColor: '#409eff',
    bgColor: '#ecf5ff',
    url: '',
    enabled: true
  })
}

const handleEditQuickLink = (link: QuickLink, index: number) => {
  // 快捷入口编辑逻辑
  console.log('编辑快捷入口', link, index)
}

const handleDeleteQuickLink = (index: number) => {
  dashboardConfig.quickLinks.splice(index, 1)
  ElMessage.success('删除成功')
}

// 其他操作
const handlePreview = () => {
  ElMessage.info('预览功能开发中...')
}

const handleSaveConfig = () => {
  // 保存配置到后端
  console.log('保存配置', dashboardConfig)
  ElMessage.success('配置保存成功')
}
</script>

<style scoped>
.dashboard-display-config {
  padding: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.card-header h3 {
  margin: 0;
  color: #303133;
}

.header-actions {
  display: flex;
  gap: 12px;
}

.config-sections {
  margin-top: 20px;
}

.section-card {
  margin-bottom: 20px;
  border: 1px solid #e4e7ed;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.section-header h4 {
  margin: 0;
  color: #303133;
}

.stat-cards-config {
  margin-top: 16px;
}

.cards-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 16px;
}

.stat-card-item {
  border: 1px solid #e4e7ed;
  border-radius: 4px;
  padding: 16px;
  background-color: #fff;
}

.config-card {
  border: none;
  box-shadow: none;
}

.card-config-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.drag-handle {
  cursor: move;
  color: #c0c4cc;
}

.card-info {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin: 0 12px;
}

.card-title {
  font-weight: 600;
  color: #303133;
}

.card-actions {
  display: flex;
  gap: 8px;
}

.card-preview {
  margin-top: 12px;
}

.preview-card {
  display: flex;
  align-items: center;
  padding: 16px;
  border-radius: 4px;
  background-color: #f5f7fa;
}

.preview-icon {
  font-size: 24px;
  margin-right: 12px;
}

.preview-content {
  flex: 1;
}

.preview-value {
  font-size: 24px;
  font-weight: 600;
  color: #303133;
}

.preview-label {
  font-size: 14px;
  color: #606266;
  margin-top: 4px;
}

.charts-config {
  margin-top: 16px;
}

.chart-config-item {
  margin-bottom: 16px;
}

.chart-card {
  border: 1px solid #e4e7ed;
}

.chart-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.chart-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.chart-title {
  font-weight: 600;
  color: #303133;
}

.chart-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.chart-config-content {
  margin-top: 16px;
}

.chart-config-content p {
  margin: 8px 0;
  color: #606266;
}

.chart-preview {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 150px;
  background-color: #f5f7fa;
  border-radius: 4px;
}

.preview-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  color: #c0c4cc;
}

.preview-placeholder .el-icon {
  font-size: 48px;
}

.quick-links-config {
  margin-top: 16px;
}

.links-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 16px;
}

.link-item {
  border: 1px solid #e4e7ed;
  border-radius: 4px;
  padding: 16px;
  background-color: #fff;
}

.link-card {
  border: none;
  box-shadow: none;
}

.link-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.link-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.link-title {
  font-weight: 600;
  color: #303133;
}

.link-actions {
  display: flex;
  gap: 8px;
}

.link-preview {
  margin-top: 12px;
}

.preview-link {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 16px;
  border-radius: 4px;
  background-color: #f5f7fa;
}

.preview-link .preview-icon {
  font-size: 24px;
  margin-bottom: 8px;
}

.preview-link .preview-label {
  font-size: 14px;
  color: #606266;
}

.dialog-footer {
  text-align: right;
}
</style> 