<template>
  <div class="kpi-metrics-config">
    <el-card shadow="never">
      <template #header>
        <div class="card-header">
          <h3>KPI指标配置</h3>
          <el-button type="primary" @click="handleAddMetric">
            <el-icon><Plus /></el-icon>
            添加指标
          </el-button>
        </div>
      </template>

      <div class="metrics-categories">
        <el-tabs v-model="activeCategory" @tab-change="handleCategoryChange">
          <el-tab-pane label="培训指标" name="training" />
          <el-tab-pane label="成长指标" name="growth" />
          <el-tab-pane label="绩效指标" name="performance" />
          <el-tab-pane label="参与度指标" name="engagement" />
        </el-tabs>

        <div class="metrics-grid">
          <div v-for="metric in currentMetrics" :key="metric.id" class="metric-card">
            <el-card>
              <template #header>
                <div class="metric-header">
                  <div class="metric-title">
                    <h4>{{ metric.name }}</h4>
                    <el-tag :type="getMetricTypeColor(metric.type)">{{ metric.type }}</el-tag>
                  </div>
                  <div class="metric-actions">
                    <el-button type="text" @click="handleEditMetric(metric)">
                      <el-icon><Edit /></el-icon>
                    </el-button>
                    <el-button type="text" @click="handleDeleteMetric(metric.id)">
                      <el-icon><Delete /></el-icon>
                    </el-button>
                  </div>
                </div>
              </template>

              <div class="metric-content">
                <div class="metric-info">
                  <p><strong>描述：</strong>{{ metric.description }}</p>
                  <p><strong>数据源：</strong>{{ metric.dataSource }}</p>
                  <p><strong>更新频率：</strong>{{ metric.updateFrequency }}</p>
                  <p><strong>目标值：</strong>{{ metric.targetValue }}{{ metric.unit }}</p>
                </div>

                <div class="metric-formula">
                  <h5>计算公式：</h5>
                  <el-input 
                    v-model="metric.formula" 
                    readonly 
                    class="formula-input"
                    placeholder="计算公式"
                  />
                </div>

                <div class="metric-thresholds">
                  <h5>阈值设置：</h5>
                  <div class="threshold-items">
                    <div v-for="threshold in metric.thresholds" :key="threshold.level" class="threshold-item">
                      <el-tag :color="threshold.color" class="threshold-tag">
                        {{ threshold.level }}
                      </el-tag>
                      <span>{{ threshold.min }}{{ metric.unit }} - {{ threshold.max }}{{ metric.unit }}</span>
                    </div>
                  </div>
                </div>
              </div>
            </el-card>
          </div>
        </div>
      </div>
    </el-card>

    <!-- 添加/编辑指标对话框 -->
    <el-dialog 
      v-model="dialogVisible" 
      :title="isEditing ? '编辑KPI指标' : '添加KPI指标'"
      width="800px"
    >
      <el-form :model="currentMetric" :rules="metricRules" ref="metricFormRef" label-width="120px">
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="指标名称" prop="name">
              <el-input v-model="currentMetric.name" placeholder="请输入指标名称" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="指标类型" prop="type">
              <el-select v-model="currentMetric.type" placeholder="请选择指标类型">
                <el-option label="数量型" value="数量型" />
                <el-option label="比率型" value="比率型" />
                <el-option label="百分比型" value="百分比型" />
                <el-option label="时间型" value="时间型" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="所属分类" prop="category">
              <el-select v-model="currentMetric.category" placeholder="请选择分类">
                <el-option label="培训指标" value="training" />
                <el-option label="成长指标" value="growth" />
                <el-option label="绩效指标" value="performance" />
                <el-option label="参与度指标" value="engagement" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="单位" prop="unit">
              <el-input v-model="currentMetric.unit" placeholder="请输入单位" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-form-item label="指标描述" prop="description">
          <el-input 
            v-model="currentMetric.description" 
            type="textarea" 
            :rows="3"
            placeholder="请输入指标描述"
          />
        </el-form-item>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="数据源" prop="dataSource">
              <el-select v-model="currentMetric.dataSource" placeholder="请选择数据源">
                <el-option label="培训系统" value="training-system" />
                <el-option label="人事系统" value="hr-system" />
                <el-option label="绩效系统" value="performance-system" />
                <el-option label="OA系统" value="oa-system" />
                <el-option label="手工录入" value="manual" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="更新频率" prop="updateFrequency">
              <el-select v-model="currentMetric.updateFrequency" placeholder="请选择更新频率">
                <el-option label="实时" value="实时" />
                <el-option label="每日" value="每日" />
                <el-option label="每周" value="每周" />
                <el-option label="每月" value="每月" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="目标值" prop="targetValue">
              <el-input-number 
                v-model="currentMetric.targetValue" 
                :min="0" 
                controls-position="right"
                placeholder="请输入目标值"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="权重" prop="weight">
              <el-input-number 
                v-model="currentMetric.weight" 
                :min="0" 
                :max="100"
                controls-position="right"
                placeholder="请输入权重"
              />
              <span style="margin-left: 8px;">%</span>
            </el-form-item>
          </el-col>
        </el-row>

        <el-form-item label="计算公式" prop="formula">
          <el-input 
            v-model="currentMetric.formula" 
            type="textarea"
            :rows="3"
            placeholder="请输入计算公式，如：完成项目数 / 总项目数 * 100"
          />
        </el-form-item>

        <el-form-item label="阈值设置">
          <div class="thresholds-form">
            <div v-for="(threshold, index) in currentMetric.thresholds" :key="index" class="threshold-form-item">
              <el-row :gutter="10" align="middle">
                <el-col :span="4">
                  <el-select v-model="threshold.level" placeholder="等级">
                    <el-option label="优秀" value="优秀" />
                    <el-option label="良好" value="良好" />
                    <el-option label="一般" value="一般" />
                    <el-option label="待改进" value="待改进" />
                  </el-select>
                </el-col>
                <el-col :span="3">
                  <el-input-number 
                    v-model="threshold.min" 
                    :min="0" 
                    controls-position="right"
                    placeholder="最小值"
                  />
                </el-col>
                <el-col :span="1" class="text-center">-</el-col>
                <el-col :span="3">
                  <el-input-number 
                    v-model="threshold.max" 
                    :min="0" 
                    controls-position="right"
                    placeholder="最大值"
                  />
                </el-col>
                <el-col :span="4">
                  <el-color-picker v-model="threshold.color" />
                </el-col>
                <el-col :span="2">
                  <el-button 
                    type="text" 
                    @click="removeThreshold(index)"
                    :disabled="currentMetric.thresholds.length <= 1"
                  >
                    <el-icon><Delete /></el-icon>
                  </el-button>
                </el-col>
              </el-row>
            </div>
            <el-button type="dashed" @click="addThreshold" class="add-threshold-btn">
              <el-icon><Plus /></el-icon>
              添加阈值
            </el-button>
          </div>
        </el-form-item>
      </el-form>
      
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" @click="handleSaveMetric">确定</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Edit, Delete } from '@element-plus/icons-vue'
import type { FormInstance, FormRules } from 'element-plus'

interface MetricThreshold {
  level: string
  min: number
  max: number
  color: string
}

interface KPIMetric {
  id: string
  name: string
  type: string
  category: string
  description: string
  dataSource: string
  updateFrequency: string
  targetValue: number
  weight: number
  unit: string
  formula: string
  thresholds: MetricThreshold[]
}

// 当前选中的分类
const activeCategory = ref('training')

// KPI指标数据
const kpiMetrics = ref<KPIMetric[]>([
  {
    id: '1',
    name: '培训完成率',
    type: '百分比型',
    category: 'training',
    description: '员工按时完成培训的比例',
    dataSource: 'training-system',
    updateFrequency: '每日',
    targetValue: 90,
    weight: 25,
    unit: '%',
    formula: '完成培训人数 / 总培训人数 * 100',
    thresholds: [
      { level: '优秀', min: 90, max: 100, color: '#67c23a' },
      { level: '良好', min: 80, max: 89, color: '#e6a23c' },
      { level: '一般', min: 70, max: 79, color: '#f56c6c' },
      { level: '待改进', min: 0, max: 69, color: '#909399' }
    ]
  },
  {
    id: '2',
    name: '新员工培训周期',
    type: '时间型',
    category: 'training',
    description: '新员工完成入职培训的平均时间',
    dataSource: 'training-system',
    updateFrequency: '每周',
    targetValue: 30,
    weight: 20,
    unit: '天',
    formula: '所有新员工培训完成时间的平均值',
    thresholds: [
      { level: '优秀', min: 0, max: 30, color: '#67c23a' },
      { level: '良好', min: 31, max: 45, color: '#e6a23c' },
      { level: '一般', min: 46, max: 60, color: '#f56c6c' },
      { level: '待改进', min: 61, max: 999, color: '#909399' }
    ]
  },
  {
    id: '3',
    name: '员工成长档案完整度',
    type: '百分比型',
    category: 'growth',
    description: '员工成长档案信息的完整程度',
    dataSource: 'hr-system',
    updateFrequency: '每月',
    targetValue: 85,
    weight: 15,
    unit: '%',
    formula: '已填写字段数 / 总字段数 * 100',
    thresholds: [
      { level: '优秀', min: 85, max: 100, color: '#67c23a' },
      { level: '良好', min: 70, max: 84, color: '#e6a23c' },
      { level: '一般', min: 60, max: 69, color: '#f56c6c' },
      { level: '待改进', min: 0, max: 59, color: '#909399' }
    ]
  },
  {
    id: '4',
    name: '平均绩效评分',
    type: '数量型',
    category: 'performance',
    description: '员工绩效评分的平均值',
    dataSource: 'performance-system',
    updateFrequency: '每月',
    targetValue: 4.0,
    weight: 30,
    unit: '分',
    formula: '所有员工绩效评分的平均值',
    thresholds: [
      { level: '优秀', min: 4.0, max: 5.0, color: '#67c23a' },
      { level: '良好', min: 3.5, max: 3.9, color: '#e6a23c' },
      { level: '一般', min: 3.0, max: 3.4, color: '#f56c6c' },
      { level: '待改进', min: 0, max: 2.9, color: '#909399' }
    ]
  },
  {
    id: '5',
    name: '员工参与度',
    type: '百分比型',
    category: 'engagement',
    description: '员工参与培训和发展活动的积极程度',
    dataSource: 'training-system',
    updateFrequency: '每周',
    targetValue: 80,
    weight: 10,
    unit: '%',
    formula: '主动参与活动人数 / 总员工人数 * 100',
    thresholds: [
      { level: '优秀', min: 80, max: 100, color: '#67c23a' },
      { level: '良好', min: 70, max: 79, color: '#e6a23c' },
      { level: '一般', min: 60, max: 69, color: '#f56c6c' },
      { level: '待改进', min: 0, max: 59, color: '#909399' }
    ]
  }
])

// 表单相关
const dialogVisible = ref(false)
const isEditing = ref(false)
const metricFormRef = ref<FormInstance>()

// 当前编辑的指标
const currentMetric = reactive<KPIMetric>({
  id: '',
  name: '',
  type: '',
  category: 'training',
  description: '',
  dataSource: '',
  updateFrequency: '',
  targetValue: 0,
  weight: 0,
  unit: '',
  formula: '',
  thresholds: []
})

// 表单验证规则
const metricRules: FormRules = {
  name: [
    { required: true, message: '请输入指标名称', trigger: 'blur' }
  ],
  type: [
    { required: true, message: '请选择指标类型', trigger: 'change' }
  ],
  category: [
    { required: true, message: '请选择所属分类', trigger: 'change' }
  ],
  description: [
    { required: true, message: '请输入指标描述', trigger: 'blur' }
  ],
  dataSource: [
    { required: true, message: '请选择数据源', trigger: 'change' }
  ],
  updateFrequency: [
    { required: true, message: '请选择更新频率', trigger: 'change' }
  ],
  targetValue: [
    { required: true, message: '请输入目标值', trigger: 'blur' }
  ],
  weight: [
    { required: true, message: '请输入权重', trigger: 'blur' }
  ],
  unit: [
    { required: true, message: '请输入单位', trigger: 'blur' }
  ],
  formula: [
    { required: true, message: '请输入计算公式', trigger: 'blur' }
  ]
}

// 当前分类的指标
const currentMetrics = computed(() => {
  return kpiMetrics.value.filter(metric => metric.category === activeCategory.value)
})

// 获取指标类型颜色
const getMetricTypeColor = (type: string) => {
  switch (type) {
    case '数量型':
      return 'primary'
    case '比率型':
      return 'success'
    case '百分比型':
      return 'warning'
    case '时间型':
      return 'info'
    default:
      return 'default'
  }
}

// 分类切换
const handleCategoryChange = () => {
  // 分类切换逻辑
}

// 添加指标
const handleAddMetric = () => {
  isEditing.value = false
  resetCurrentMetric()
  dialogVisible.value = true
}

// 编辑指标
const handleEditMetric = (metric: KPIMetric) => {
  isEditing.value = true
  Object.assign(currentMetric, JSON.parse(JSON.stringify(metric)))
  dialogVisible.value = true
}

// 删除指标
const handleDeleteMetric = async (metricId: string) => {
  try {
    await ElMessageBox.confirm('确定要删除这个KPI指标吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    })
    
    const index = kpiMetrics.value.findIndex(m => m.id === metricId)
    if (index > -1) {
      kpiMetrics.value.splice(index, 1)
      ElMessage.success('删除成功')
    }
  } catch {
    // 用户取消删除
  }
}

// 保存指标
const handleSaveMetric = async () => {
  if (!metricFormRef.value) return
  
  try {
    await metricFormRef.value.validate()
    
    if (isEditing.value) {
      // 编辑模式
      const index = kpiMetrics.value.findIndex(m => m.id === currentMetric.id)
      if (index > -1) {
        kpiMetrics.value[index] = JSON.parse(JSON.stringify(currentMetric))
      }
      ElMessage.success('编辑成功')
    } else {
      // 添加模式
      const newMetric = JSON.parse(JSON.stringify(currentMetric))
      newMetric.id = Date.now().toString()
      kpiMetrics.value.push(newMetric)
      ElMessage.success('添加成功')
    }
    
    dialogVisible.value = false
  } catch {
    ElMessage.error('请检查表单内容')
  }
}

// 重置当前指标
const resetCurrentMetric = () => {
  Object.assign(currentMetric, {
    id: '',
    name: '',
    type: '',
    category: activeCategory.value,
    description: '',
    dataSource: '',
    updateFrequency: '',
    targetValue: 0,
    weight: 0,
    unit: '',
    formula: '',
    thresholds: [
      { level: '优秀', min: 0, max: 100, color: '#67c23a' }
    ]
  })
}

// 添加阈值
const addThreshold = () => {
  currentMetric.thresholds.push({
    level: '',
    min: 0,
    max: 100,
    color: '#67c23a'
  })
}

// 删除阈值
const removeThreshold = (index: number) => {
  currentMetric.thresholds.splice(index, 1)
}
</script>

<style scoped>
.kpi-metrics-config {
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

.metrics-categories {
  margin-top: 20px;
}

.metrics-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
  gap: 20px;
  margin-top: 20px;
}

.metric-card {
  border: 1px solid #e4e7ed;
  border-radius: 4px;
}

.metric-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.metric-title {
  display: flex;
  align-items: center;
  gap: 12px;
}

.metric-title h4 {
  margin: 0;
  color: #303133;
}

.metric-actions {
  display: flex;
  gap: 8px;
}

.metric-content {
  margin-top: 16px;
}

.metric-info {
  background-color: #f8f9fa;
  padding: 12px;
  border-radius: 4px;
  margin-bottom: 16px;
}

.metric-info p {
  margin: 6px 0;
  color: #606266;
}

.metric-formula {
  margin-bottom: 16px;
}

.metric-formula h5 {
  margin-bottom: 8px;
  color: #303133;
}

.formula-input {
  font-family: monospace;
}

.metric-thresholds h5 {
  margin-bottom: 8px;
  color: #303133;
}

.threshold-items {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.threshold-item {
  display: flex;
  align-items: center;
  gap: 12px;
}

.threshold-tag {
  min-width: 60px;
  text-align: center;
}

.thresholds-form {
  border: 1px solid #e4e7ed;
  border-radius: 4px;
  padding: 16px;
}

.threshold-form-item {
  margin-bottom: 12px;
}

.text-center {
  text-align: center;
}

.add-threshold-btn {
  width: 100%;
  height: 40px;
  border: 1px dashed #d9d9d9;
  background-color: #fafafa;
  color: #666;
  margin-top: 12px;
}

.dialog-footer {
  text-align: right;
}
</style> 