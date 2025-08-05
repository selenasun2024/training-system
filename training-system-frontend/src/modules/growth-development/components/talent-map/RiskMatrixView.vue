<template>
  <div class="risk-matrix-view">
    <div class="matrix-header">
      <div class="header-info">
        <h3>人力风险矩阵</h3>
        <span class="risk-count">{{ totalRisks }} 个风险点</span>
      </div>
      <div class="header-actions">
        <el-select v-model="selectedRiskType" size="small" style="width: 120px">
          <el-option label="全部风险" value="" />
          <el-option label="离职风险" value="turnover" />
          <el-option label="技能风险" value="skill" />
          <el-option label="继任风险" value="succession" />
        </el-select>
        <el-button size="small" @click="refreshRiskData">
          <el-icon><Refresh /></el-icon>
          刷新
        </el-button>
      </div>
    </div>

    <div class="matrix-content">
      <!-- 风险矩阵图 -->
      <div class="risk-matrix">
        <div class="matrix-axis">
          <div class="y-axis">
            <span class="axis-title">影响程度</span>
            <div class="axis-labels">
              <span>高</span>
              <span>中</span>
              <span>低</span>
            </div>
          </div>
          <div class="x-axis">
            <span class="axis-title">发生概率</span>
            <div class="axis-labels">
              <span>低</span>
              <span>中</span>
              <span>高</span>
            </div>
          </div>
        </div>
        
        <div class="matrix-grid">
          <div 
            v-for="(cell, index) in riskCells" 
            :key="index"
            class="risk-cell"
            :class="cell.severity"
            @click="selectCell(cell)"
          >
            <div class="cell-content">
              <div class="risk-count">{{ cell.risks.length }}</div>
              <div class="risk-indicators">
                <div 
                  v-for="risk in cell.risks.slice(0, 3)" 
                  :key="risk.id"
                  class="risk-indicator"
                  :title="risk.title"
                >
                  <el-icon><Warning /></el-icon>
                </div>
                <div v-if="cell.risks.length > 3" class="more-risks">
                  +{{ cell.risks.length - 3 }}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 风险详情列表 -->
      <div class="risk-details">
        <div class="details-header">
          <h4>风险详情</h4>
          <el-tag :type="getSelectedCellType()" v-if="selectedCell">
            {{ selectedCell.title }}
          </el-tag>
        </div>
        
        <div class="risk-list">
          <div 
            v-for="risk in displayRisks" 
            :key="risk.id"
            class="risk-item"
            :class="risk.severity"
            @click="selectRisk(risk)"
          >
            <div class="risk-icon">
              <el-icon><Warning /></el-icon>
            </div>
            <div class="risk-content">
              <div class="risk-title">{{ risk.title }}</div>
              <div class="risk-description">{{ risk.description }}</div>
              <div class="risk-meta">
                <span class="risk-type">{{ getRiskTypeText(risk.type) }}</span>
                <span class="risk-probability">概率: {{ risk.probability }}%</span>
                <span class="risk-impact">影响: {{ risk.impact }}</span>
              </div>
            </div>
            <div class="risk-actions">
              <el-button type="text" size="small" @click.stop="handleRisk(risk)">
                处理
              </el-button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 风险处理弹窗 -->
    <el-dialog
      v-model="riskHandleVisible"
      :title="selectedRisk?.title || '风险处理'"
      width="600px"
    >
      <div v-if="selectedRisk" class="risk-handle-form">
        <el-form label-width="100px">
          <el-form-item label="风险类型">
            <el-tag :type="getRiskSeverityType(selectedRisk.severity)">
              {{ getRiskSeverityText(selectedRisk.severity) }}
            </el-tag>
          </el-form-item>
          <el-form-item label="风险描述">
            <p>{{ selectedRisk.description }}</p>
          </el-form-item>
          <el-form-item label="影响范围">
            <p>{{ selectedRisk.impactScope }}</p>
          </el-form-item>
          <el-form-item label="处理方案">
            <el-select v-model="handleForm.action" placeholder="选择处理方案">
              <el-option label="立即处理" value="immediate" />
              <el-option label="制定计划" value="plan" />
              <el-option label="监控观察" value="monitor" />
              <el-option label="风险转移" value="transfer" />
            </el-select>
          </el-form-item>
          <el-form-item label="负责人">
            <el-select v-model="handleForm.assignee" placeholder="选择负责人">
              <el-option v-for="person in assignees" :key="person.id" :label="person.name" :value="person.id" />
            </el-select>
          </el-form-item>
          <el-form-item label="预期完成">
            <el-date-picker v-model="handleForm.deadline" type="date" placeholder="选择日期" />
          </el-form-item>
        </el-form>
      </div>
      
      <template #footer>
        <el-button @click="riskHandleVisible = false">取消</el-button>
        <el-button type="primary" @click="confirmHandleRisk">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed } from 'vue'
import { ElMessage } from 'element-plus'
import { Warning, Refresh } from '@element-plus/icons-vue'

interface Risk {
  id: string
  title: string
  description: string
  type: 'turnover' | 'skill' | 'succession'
  probability: number
  impact: 'low' | 'medium' | 'high'
  severity: 'low' | 'medium' | 'high' | 'critical'
  impactScope: string
  employee?: string
  position?: string
}

const selectedRiskType = ref('')
const selectedCell = ref<any>(null)
const selectedRisk = ref<Risk | null>(null)
const riskHandleVisible = ref(false)

const handleForm = reactive({
  action: '',
  assignee: '',
  deadline: null
})

const assignees = ref([
  { id: '1', name: '张经理' },
  { id: '2', name: '李主管' },
  { id: '3', name: '王总监' }
])

// 模拟风险数据
const riskData = ref<Risk[]>([
  {
    id: '1',
    title: '技术总监离职风险',
    description: '现任技术总监有离职倾向，缺乏合适继任者',
    type: 'turnover',
    probability: 70,
    impact: 'high',
    severity: 'critical',
    impactScope: '整个技术部门',
    employee: '李技术',
    position: '技术总监'
  },
  {
    id: '2',
    title: '核心技术人员流失',
    description: '多名核心开发人员有跳槽意向',
    type: 'turnover',
    probability: 50,
    impact: 'medium',
    severity: 'high',
    impactScope: '产品开发进度',
    employee: '开发团队',
    position: '高级开发工程师'
  }
])

const riskCells = computed(() => {
  const cells = []
  const impactLevels = ['high', 'medium', 'low']
  const probabilities = ['low', 'medium', 'high']
  
  for (let i = 0; i < 3; i++) {
    for (let j = 0; j < 3; j++) {
      const impact = impactLevels[i]
      const probability = probabilities[j]
      
      const cellRisks = riskData.value.filter(risk => {
        const riskProb = risk.probability < 30 ? 'low' : risk.probability < 70 ? 'medium' : 'high'
        return risk.impact === impact && riskProb === probability
      })
      
      let severity = 'low'
      if (impact === 'high' && probability === 'high') severity = 'critical'
      else if ((impact === 'high' && probability === 'medium') || (impact === 'medium' && probability === 'high')) severity = 'high'
      else if (impact === 'medium' && probability === 'medium') severity = 'medium'
      
      cells.push({
        impact,
        probability,
        severity,
        title: `${impact === 'high' ? '高' : impact === 'medium' ? '中' : '低'}影响-${probability === 'high' ? '高' : probability === 'medium' ? '中' : '低'}概率`,
        risks: cellRisks
      })
    }
  }
  
  return cells
})

const totalRisks = computed(() => riskData.value.length)

const displayRisks = computed(() => {
  if (selectedCell.value) {
    return selectedCell.value.risks
  }
  return riskData.value
})

const selectCell = (cell: any) => {
  selectedCell.value = cell
}

const selectRisk = (risk: Risk) => {
  selectedRisk.value = risk
  riskHandleVisible.value = true
}

const handleRisk = (risk: Risk) => {
  selectRisk(risk)
}

const refreshRiskData = () => {
  ElMessage.success('风险数据已刷新')
}

const confirmHandleRisk = () => {
  ElMessage.success('风险处理方案已保存')
  riskHandleVisible.value = false
}

const getSelectedCellType = () => {
  if (!selectedCell.value) return 'info'
  const severity = selectedCell.value.severity
  if (severity === 'critical') return 'danger'
  if (severity === 'high') return 'warning'
  return 'info'
}

const getRiskTypeText = (type: string) => {
  const texts = { 'turnover': '离职风险', 'skill': '技能风险', 'succession': '继任风险' }
  return texts[type] || '未知'
}

const getRiskSeverityType = (severity: string) => {
  const types = { 'critical': 'danger', 'high': 'warning', 'medium': 'info', 'low': 'success' }
  return types[severity] || 'info'
}

const getRiskSeverityText = (severity: string) => {
  const texts = { 'critical': '极高风险', 'high': '高风险', 'medium': '中风险', 'low': '低风险' }
  return texts[severity] || '未知'
}
</script>

<style scoped>
.risk-matrix-view {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.matrix-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid #e4e7ed;
}

.header-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.header-info h3 {
  margin: 0;
  color: #303133;
  font-size: 18px;
}

.risk-count {
  color: #909399;
  font-size: 14px;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.matrix-content {
  flex: 1;
  display: flex;
  gap: 20px;
  padding: 20px;
  overflow: hidden;
}

.risk-matrix {
  flex: 1;
  position: relative;
}

.matrix-axis {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
}

.y-axis {
  position: absolute;
  left: -80px;
  top: 0;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 20px;
}

.x-axis {
  position: absolute;
  bottom: -60px;
  left: 0;
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
}

.axis-title {
  font-weight: 600;
  color: #303133;
  font-size: 14px;
}

.axis-labels {
  display: flex;
  gap: 20px;
}

.y-axis .axis-labels {
  flex-direction: column;
  height: 100%;
  justify-content: space-around;
}

.x-axis .axis-labels {
  width: 100%;
  justify-content: space-around;
}

.axis-labels span {
  font-size: 12px;
  color: #606266;
}

.matrix-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  grid-template-rows: repeat(3, 1fr);
  gap: 4px;
  height: 300px;
  width: 100%;
}

.risk-cell {
  border: 1px solid #e4e7ed;
  border-radius: 6px;
  padding: 12px;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
}

.risk-cell:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.risk-cell.critical {
  background: linear-gradient(135deg, #ff4757 0%, #c44569 100%);
  color: white;
}

.risk-cell.high {
  background: linear-gradient(135deg, #ffa502 0%, #ff6348 100%);
  color: white;
}

.risk-cell.medium {
  background: linear-gradient(135deg, #f1c40f 0%, #f39c12 100%);
  color: white;
}

.risk-cell.low {
  background: linear-gradient(135deg, #2ecc71 0%, #27ae60 100%);
  color: white;
}

.cell-content {
  text-align: center;
}

.risk-count {
  font-size: 24px;
  font-weight: 600;
  margin-bottom: 8px;
}

.risk-indicators {
  display: flex;
  justify-content: center;
  gap: 4px;
  flex-wrap: wrap;
}

.risk-indicator {
  width: 16px;
  height: 16px;
  background: rgba(255, 255, 255, 0.3);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 10px;
}

.more-risks {
  font-size: 10px;
  background: rgba(255, 255, 255, 0.3);
  padding: 2px 4px;
  border-radius: 8px;
}

.risk-details {
  width: 400px;
  border: 1px solid #e4e7ed;
  border-radius: 6px;
  overflow: hidden;
}

.details-header {
  padding: 16px;
  background: #f8f9fa;
  border-bottom: 1px solid #e4e7ed;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.details-header h4 {
  margin: 0;
  color: #303133;
}

.risk-list {
  max-height: 400px;
  overflow-y: auto;
}

.risk-item {
  display: flex;
  gap: 12px;
  padding: 12px 16px;
  border-bottom: 1px solid #f0f0f0;
  cursor: pointer;
  transition: background 0.2s;
}

.risk-item:hover {
  background: #f8f9fa;
}

.risk-item:last-child {
  border-bottom: none;
}

.risk-icon {
  flex-shrink: 0;
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  color: white;
}

.risk-item.critical .risk-icon {
  background: #ff4757;
}

.risk-item.high .risk-icon {
  background: #ffa502;
}

.risk-item.medium .risk-icon {
  background: #f1c40f;
}

.risk-item.low .risk-icon {
  background: #2ecc71;
}

.risk-content {
  flex: 1;
}

.risk-title {
  font-weight: 600;
  color: #303133;
  margin-bottom: 4px;
}

.risk-description {
  color: #606266;
  font-size: 14px;
  margin-bottom: 6px;
}

.risk-meta {
  display: flex;
  gap: 12px;
  font-size: 12px;
  color: #909399;
}

.risk-actions {
  flex-shrink: 0;
}

.risk-handle-form {
  padding: 16px 0;
}

.risk-handle-form p {
  margin: 0;
  color: #606266;
  line-height: 1.5;
}
</style> 