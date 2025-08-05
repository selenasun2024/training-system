<template>
  <div class="succession-pipeline-view">
    <div class="pipeline-header">
      <div class="header-info">
        <h3>继任者梯队</h3>
        <span class="position-count">{{ keyPositions.length }} 个关键岗位</span>
      </div>
      <div class="header-actions">
        <el-button-group>
          <el-button 
            :type="viewMode === 'pipeline' ? 'primary' : 'default'"
            @click="viewMode = 'pipeline'"
            size="small"
          >
            <el-icon><Rank /></el-icon>
            管道图
          </el-button>
          <el-button 
            :type="viewMode === 'matrix' ? 'primary' : 'default'"
            @click="viewMode = 'matrix'"
            size="small"
          >
            <el-icon><Grid /></el-icon>
            矩阵图
          </el-button>
        </el-button-group>
        
        <el-select v-model="selectedDepartment" size="small" style="width: 120px" clearable>
          <el-option label="全部部门" value="" />
          <el-option v-for="dept in departments" :key="dept" :label="dept" :value="dept" />
        </el-select>
        
        <el-select v-model="readinessFilter" size="small" style="width: 120px" clearable>
          <el-option label="全部就绪度" value="" />
          <el-option label="立即" value="immediate" />
          <el-option label="6个月内" value="6months" />
          <el-option label="1年内" value="1year" />
          <el-option label="2年内" value="2years" />
        </el-select>
        
        <el-button size="small" @click="addSuccessionPlan">
          <el-icon><Plus /></el-icon>
          添加计划
        </el-button>
      </div>
    </div>

    <div class="pipeline-content">
      <!-- 管道图视图 -->
      <div v-if="viewMode === 'pipeline'" class="pipeline-view">
        <div class="pipeline-container">
          <div 
            v-for="position in filteredPositions" 
            :key="position.id"
            class="position-pipeline"
          >
            <!-- 岗位信息 -->
            <div class="position-header">
              <div class="position-info">
                <h4 class="position-title">{{ position.title }}</h4>
                <p class="position-details">
                  {{ position.department }} | {{ position.level }}
                </p>
                <div class="position-status">
                  <el-tag :type="position.riskLevel === 'high' ? 'danger' : position.riskLevel === 'medium' ? 'warning' : 'success'" size="small">
                    {{ getRiskLevelText(position.riskLevel) }}
                  </el-tag>
                  <el-tag v-if="position.isKey" type="danger" size="small">关键岗位</el-tag>
                </div>
              </div>
              <div class="position-current">
                <div class="current-holder">
                  <el-avatar :size="50" :src="position.currentHolder.avatar">
                    {{ position.currentHolder.name }}
                  </el-avatar>
                  <div class="holder-info">
                    <div class="holder-name">{{ position.currentHolder.name }}</div>
                    <div class="holder-tenure">在岗 {{ position.currentHolder.tenure }}</div>
                  </div>
                </div>
              </div>
            </div>

            <!-- 继任者梯队 -->
            <div class="succession-tiers">
              <div 
                v-for="(tier, tierIndex) in position.successors" 
                :key="tierIndex"
                class="succession-tier"
              >
                <div class="tier-header">
                  <div class="tier-number">{{ tierIndex + 1 }}</div>
                  <div class="tier-info">
                    <div class="tier-readiness">{{ tier.readiness }}</div>
                    <div class="tier-count">{{ tier.candidates.length }} 人</div>
                  </div>
                </div>
                
                <div class="tier-candidates">
                  <div 
                    v-for="candidate in tier.candidates" 
                    :key="candidate.id"
                    class="candidate-card"
                    @click="selectCandidate(candidate)"
                  >
                    <el-avatar :size="40" :src="candidate.avatar">
                      {{ candidate.name }}
                    </el-avatar>
                    <div class="candidate-info">
                      <div class="candidate-name">{{ candidate.name }}</div>
                      <div class="candidate-position">{{ candidate.currentPosition }}</div>
                      <div class="candidate-readiness">
                        <el-progress 
                          :percentage="candidate.readinessScore" 
                          :color="getReadinessColor(candidate.readinessScore)"
                          :stroke-width="4"
                          :show-text="false"
                        />
                        <span class="readiness-text">{{ candidate.readinessScore }}%</span>
                      </div>
                    </div>
                    <div class="candidate-actions">
                      <el-button type="text" size="small" @click.stop="viewCandidateProfile(candidate)">
                        详情
                      </el-button>
                    </div>
                  </div>
                  
                  <div class="add-candidate" @click="addCandidate(position, tierIndex)">
                    <el-icon><Plus /></el-icon>
                    <span>添加候选人</span>
                  </div>
                </div>
              </div>
              
              <!-- 添加新梯队 -->
              <div class="add-tier" @click="addTier(position)">
                <el-icon><Plus /></el-icon>
                <span>添加梯队</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 矩阵图视图 -->
      <div v-else class="matrix-view">
        <div class="matrix-container">
          <div class="matrix-header">
            <div class="matrix-title">继任者就绪度矩阵</div>
            <div class="matrix-legend">
              <div class="legend-item">
                <div class="legend-color immediate"></div>
                <span>立即就绪</span>
              </div>
              <div class="legend-item">
                <div class="legend-color short-term"></div>
                <span>短期就绪</span>
              </div>
              <div class="legend-item">
                <div class="legend-color medium-term"></div>
                <span>中期就绪</span>
              </div>
              <div class="legend-item">
                <div class="legend-color long-term"></div>
                <span>长期就绪</span>
              </div>
            </div>
          </div>
          
          <div class="matrix-grid">
            <div class="matrix-axis">
              <div class="y-axis">
                <div class="axis-label">岗位重要性</div>
                <div class="axis-values">
                  <span>高</span>
                  <span>中</span>
                  <span>低</span>
                </div>
              </div>
              <div class="x-axis">
                <div class="axis-label">继任者就绪度</div>
                <div class="axis-values">
                  <span>低</span>
                  <span>中</span>
                  <span>高</span>
                </div>
              </div>
            </div>
            
            <div class="matrix-cells">
              <div 
                v-for="(cell, index) in matrixCells" 
                :key="index"
                class="matrix-cell"
                :class="cell.className"
              >
                <div class="cell-positions">
                  <div 
                    v-for="position in cell.positions" 
                    :key="position.id"
                    class="position-dot"
                    @click="selectPosition(position)"
                  >
                    <el-tooltip :content="position.title" placement="top">
                      <div class="dot-content">
                        {{ position.title.substring(0, 2) }}
                      </div>
                    </el-tooltip>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 候选人详情弹窗 -->
    <el-dialog
      v-model="candidateDetailVisible"
      :title="selectedCandidate?.name || '候选人详情'"
      width="600px"
    >
      <div v-if="selectedCandidate" class="candidate-detail">
        <div class="detail-header">
          <el-avatar :size="80" :src="selectedCandidate.avatar">
            {{ selectedCandidate.name }}
          </el-avatar>
          <div class="detail-info">
            <h3>{{ selectedCandidate.name }}</h3>
            <p class="current-position">{{ selectedCandidate.currentPosition }}</p>
            <p class="department">{{ selectedCandidate.department }}</p>
            <div class="readiness-info">
              <span class="readiness-label">就绪度评分：</span>
              <el-progress 
                :percentage="selectedCandidate.readinessScore" 
                :color="getReadinessColor(selectedCandidate.readinessScore)"
                :stroke-width="8"
              />
            </div>
          </div>
        </div>
        
        <el-divider />
        
        <div class="detail-content">
          <div class="assessment-grid">
            <div class="assessment-item">
              <div class="assessment-label">技能匹配度</div>
              <el-progress 
                :percentage="selectedCandidate.skillMatch" 
                color="#67c23a"
                :stroke-width="6"
              />
            </div>
            <div class="assessment-item">
              <div class="assessment-label">经验匹配度</div>
              <el-progress 
                :percentage="selectedCandidate.experienceMatch" 
                color="#409eff"
                :stroke-width="6"
              />
            </div>
            <div class="assessment-item">
              <div class="assessment-label">领导力评估</div>
              <el-progress 
                :percentage="selectedCandidate.leadershipScore" 
                color="#e6a23c"
                :stroke-width="6"
              />
            </div>
            <div class="assessment-item">
              <div class="assessment-label">文化适应度</div>
              <el-progress 
                :percentage="selectedCandidate.culturalFit" 
                color="#f56c6c"
                :stroke-width="6"
              />
            </div>
          </div>
          
          <div class="development-plan">
            <h4>发展计划</h4>
            <div class="plan-items">
              <div 
                v-for="item in selectedCandidate.developmentPlan" 
                :key="item.id"
                class="plan-item"
              >
                <div class="plan-title">{{ item.title }}</div>
                <div class="plan-timeline">{{ item.timeline }}</div>
                <div class="plan-status">
                  <el-tag :type="item.status === 'completed' ? 'success' : item.status === 'in-progress' ? 'warning' : 'info'" size="small">
                    {{ getStatusText(item.status) }}
                  </el-tag>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <template #footer>
        <el-button @click="candidateDetailVisible = false">关闭</el-button>
        <el-button type="primary" @click="editDevelopmentPlan">编辑发展计划</el-button>
      </template>
    </el-dialog>

    <!-- 添加候选人弹窗 -->
    <el-dialog
      v-model="addCandidateVisible"
      title="添加继任者候选人"
      width="500px"
    >
      <el-form :model="newCandidateForm" label-width="100px">
        <el-form-item label="选择员工">
          <el-select v-model="newCandidateForm.employeeId" placeholder="请选择员工" style="width: 100%">
            <el-option 
              v-for="employee in availableEmployees" 
              :key="employee.id"
              :label="employee.name"
              :value="employee.id"
            >
              <span>{{ employee.name }}</span>
              <span style="float: right; color: #8492a6; font-size: 13px">{{ employee.position }}</span>
            </el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="就绪时间">
          <el-select v-model="newCandidateForm.readiness" placeholder="请选择就绪时间">
            <el-option label="立即" value="immediate" />
            <el-option label="6个月内" value="6months" />
            <el-option label="1年内" value="1year" />
            <el-option label="2年内" value="2years" />
          </el-select>
        </el-form-item>
        <el-form-item label="初始评分">
          <el-slider 
            v-model="newCandidateForm.initialScore" 
            :min="0" 
            :max="100"
            show-input
          />
        </el-form-item>
      </el-form>
      
      <template #footer>
        <el-button @click="addCandidateVisible = false">取消</el-button>
        <el-button type="primary" @click="confirmAddCandidate">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { Rank, Grid, Plus } from '@element-plus/icons-vue'

interface Position {
  id: string
  title: string
  department: string
  level: string
  isKey: boolean
  riskLevel: 'high' | 'medium' | 'low'
  currentHolder: {
    name: string
    avatar?: string
    tenure: string
  }
  successors: {
    readiness: string
    candidates: Candidate[]
  }[]
}

interface Candidate {
  id: string
  name: string
  avatar?: string
  currentPosition: string
  department: string
  readinessScore: number
  skillMatch: number
  experienceMatch: number
  leadershipScore: number
  culturalFit: number
  developmentPlan: {
    id: string
    title: string
    timeline: string
    status: 'pending' | 'in-progress' | 'completed'
  }[]
}

interface Props {
  searchKeyword: string
  filterOptions: any
  selectedEmployee?: any
}

interface Emits {
  (e: 'employee-select', employee: any): void
  (e: 'position-select', position: any): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

// 基础状态
const viewMode = ref<'pipeline' | 'matrix'>('pipeline')
const selectedDepartment = ref('')
const readinessFilter = ref('')
const selectedCandidate = ref<Candidate | null>(null)
const candidateDetailVisible = ref(false)
const addCandidateVisible = ref(false)
const selectedPosition = ref<Position | null>(null)
const selectedTierIndex = ref(0)

// 新增候选人表单
const newCandidateForm = reactive({
  employeeId: '',
  readiness: '',
  initialScore: 60
})

// 部门列表
const departments = ref(['技术部', '销售部', '市场部', '人事部', '财务部'])

// 模拟关键岗位数据
const keyPositions = ref<Position[]>([
  {
    id: '1',
    title: '技术总监',
    department: '技术部',
    level: '高级管理层',
    isKey: true,
    riskLevel: 'medium',
    currentHolder: {
      name: '李技术',
      avatar: '',
      tenure: '3年2个月'
    },
    successors: [
      {
        readiness: '立即',
        candidates: [
          {
            id: 'c1',
            name: '王架构',
            currentPosition: '架构师',
            department: '技术部',
            readinessScore: 85,
            skillMatch: 90,
            experienceMatch: 80,
            leadershipScore: 75,
            culturalFit: 95,
            developmentPlan: [
              { id: 'p1', title: '管理技能培训', timeline: '2024Q1', status: 'completed' },
              { id: 'p2', title: '战略规划课程', timeline: '2024Q2', status: 'in-progress' },
              { id: 'p3', title: '高级领导力项目', timeline: '2024Q3', status: 'pending' }
            ]
          }
        ]
      },
      {
        readiness: '6个月内',
        candidates: [
          {
            id: 'c2',
            name: '刘前端',
            currentPosition: '前端主管',
            department: '技术部',
            readinessScore: 70,
            skillMatch: 75,
            experienceMatch: 65,
            leadershipScore: 80,
            culturalFit: 85,
            developmentPlan: [
              { id: 'p4', title: '技术管理培训', timeline: '2024Q2', status: 'in-progress' },
              { id: 'p5', title: '跨部门协作项目', timeline: '2024Q3', status: 'pending' }
            ]
          }
        ]
      }
    ]
  },
  {
    id: '2',
    title: '销售总监',
    department: '销售部',
    level: '高级管理层',
    isKey: true,
    riskLevel: 'high',
    currentHolder: {
      name: '赵销售',
      avatar: '',
      tenure: '5年1个月'
    },
    successors: [
      {
        readiness: '1年内',
        candidates: [
          {
            id: 'c3',
            name: '孙区域',
            currentPosition: '区域经理',
            department: '销售部',
            readinessScore: 65,
            skillMatch: 70,
            experienceMatch: 85,
            leadershipScore: 60,
            culturalFit: 80,
            developmentPlan: [
              { id: 'p6', title: '战略销售培训', timeline: '2024Q1', status: 'completed' },
              { id: 'p7', title: '团队管理技能', timeline: '2024Q2', status: 'in-progress' }
            ]
          }
        ]
      }
    ]
  }
])

// 可用员工列表
const availableEmployees = ref([
  { id: 'e1', name: '张开发', position: '高级开发工程师' },
  { id: 'e2', name: '李产品', position: '产品经理' },
  { id: 'e3', name: '王设计', position: '设计师' },
  { id: 'e4', name: '刘测试', position: '测试工程师' }
])

// 计算属性
const filteredPositions = computed(() => {
  let filtered = keyPositions.value

  if (selectedDepartment.value) {
    filtered = filtered.filter(pos => pos.department === selectedDepartment.value)
  }

  if (readinessFilter.value) {
    filtered = filtered.filter(pos => 
      pos.successors.some(tier => 
        tier.readiness === readinessFilter.value
      )
    )
  }

  return filtered
})

// 矩阵单元格
const matrixCells = computed(() => {
  const cells = []
  for (let importance = 2; importance >= 0; importance--) {
    for (let readiness = 0; readiness < 3; readiness++) {
      const cell = {
        className: `cell-${importance}-${readiness}`,
        positions: []
      }
      
      // 根据重要性和就绪度分配岗位
      keyPositions.value.forEach(position => {
        const posImportance = position.isKey ? 2 : position.riskLevel === 'high' ? 1 : 0
        const avgReadiness = position.successors.reduce((sum, tier) => {
          return sum + tier.candidates.reduce((cSum, candidate) => cSum + candidate.readinessScore, 0) / tier.candidates.length
        }, 0) / position.successors.length
        
        let posReadiness = 0
        if (avgReadiness > 75) posReadiness = 2
        else if (avgReadiness > 50) posReadiness = 1
        
        if (posImportance === importance && posReadiness === readiness) {
          cell.positions.push(position)
        }
      })
      
      cells.push(cell)
    }
  }
  return cells
})

// 方法定义
const selectCandidate = (candidate: Candidate) => {
  selectedCandidate.value = candidate
  candidateDetailVisible.value = true
  emit('employee-select', candidate)
}

const selectPosition = (position: Position) => {
  emit('position-select', position)
}

const viewCandidateProfile = (candidate: Candidate) => {
  selectCandidate(candidate)
}

const addCandidate = (position: Position, tierIndex: number) => {
  selectedPosition.value = position
  selectedTierIndex.value = tierIndex
  addCandidateVisible.value = true
}

const addTier = (position: Position) => {
  ElMessage.info('添加新梯队功能')
}

const addSuccessionPlan = () => {
  ElMessage.info('添加继任计划功能')
}

const confirmAddCandidate = () => {
  if (!newCandidateForm.employeeId || !newCandidateForm.readiness) {
    ElMessage.warning('请填写完整信息')
    return
  }
  
  const employee = availableEmployees.value.find(e => e.id === newCandidateForm.employeeId)
  if (!employee) return
  
  const newCandidate: Candidate = {
    id: `c${Date.now()}`,
    name: employee.name,
    currentPosition: employee.position,
    department: selectedPosition.value?.department || '',
    readinessScore: newCandidateForm.initialScore,
    skillMatch: 50,
    experienceMatch: 50,
    leadershipScore: 50,
    culturalFit: 50,
    developmentPlan: []
  }
  
  selectedPosition.value?.successors[selectedTierIndex.value].candidates.push(newCandidate)
  
  ElMessage.success('候选人添加成功')
  addCandidateVisible.value = false
  
  // 重置表单
  newCandidateForm.employeeId = ''
  newCandidateForm.readiness = ''
  newCandidateForm.initialScore = 60
}

const editDevelopmentPlan = () => {
  ElMessage.info('编辑发展计划功能')
  candidateDetailVisible.value = false
}

const getRiskLevelText = (level: string) => {
  const texts = { 'high': '高风险', 'medium': '中风险', 'low': '低风险' }
  return texts[level] || '未知'
}

const getReadinessColor = (score: number) => {
  if (score >= 80) return '#67c23a'
  if (score >= 60) return '#e6a23c'
  return '#f56c6c'
}

const getStatusText = (status: string) => {
  const texts = { 'pending': '待开始', 'in-progress': '进行中', 'completed': '已完成' }
  return texts[status] || '未知'
}

onMounted(() => {
  // 初始化数据
})
</script>

<style scoped>
.succession-pipeline-view {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.pipeline-header {
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

.position-count {
  color: #909399;
  font-size: 14px;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.pipeline-content {
  flex: 1;
  overflow: auto;
}

.pipeline-view {
  padding: 20px;
}

.pipeline-container {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.position-pipeline {
  border: 1px solid #e4e7ed;
  border-radius: 8px;
  padding: 20px;
  background: white;
}

.position-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 16px;
  border-bottom: 1px solid #f0f0f0;
}

.position-info {
  flex: 1;
}

.position-title {
  margin: 0 0 8px 0;
  color: #303133;
  font-size: 18px;
  font-weight: 600;
}

.position-details {
  margin: 0 0 8px 0;
  color: #606266;
  font-size: 14px;
}

.position-status {
  display: flex;
  gap: 8px;
}

.position-current {
  display: flex;
  align-items: center;
}

.current-holder {
  display: flex;
  align-items: center;
  gap: 12px;
}

.holder-info {
  text-align: right;
}

.holder-name {
  font-weight: 600;
  color: #303133;
  margin-bottom: 4px;
}

.holder-tenure {
  color: #909399;
  font-size: 12px;
}

.succession-tiers {
  display: flex;
  gap: 20px;
  align-items: flex-start;
}

.succession-tier {
  flex: 1;
  min-width: 200px;
}

.tier-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}

.tier-number {
  width: 32px;
  height: 32px;
  background: #409EFF;
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 14px;
}

.tier-info {
  flex: 1;
}

.tier-readiness {
  font-weight: 600;
  color: #303133;
  margin-bottom: 2px;
}

.tier-count {
  color: #909399;
  font-size: 12px;
}

.tier-candidates {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.candidate-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  border: 1px solid #e4e7ed;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
}

.candidate-card:hover {
  border-color: #409EFF;
  box-shadow: 0 2px 8px rgba(64, 158, 255, 0.2);
}

.candidate-info {
  flex: 1;
  min-width: 0;
}

.candidate-name {
  font-weight: 600;
  color: #303133;
  margin-bottom: 4px;
}

.candidate-position {
  color: #606266;
  font-size: 12px;
  margin-bottom: 4px;
}

.candidate-readiness {
  display: flex;
  align-items: center;
  gap: 8px;
}

.readiness-text {
  font-size: 11px;
  color: #909399;
  min-width: 30px;
}

.candidate-actions {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.add-candidate,
.add-tier {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 12px;
  border: 2px dashed #d9d9d9;
  border-radius: 6px;
  color: #909399;
  cursor: pointer;
  transition: all 0.2s;
}

.add-candidate:hover,
.add-tier:hover {
  border-color: #409EFF;
  color: #409EFF;
}

.add-tier {
  flex-shrink: 0;
  min-width: 120px;
}

.matrix-view {
  padding: 20px;
}

.matrix-container {
  background: white;
  border-radius: 8px;
  padding: 20px;
  border: 1px solid #e4e7ed;
}

.matrix-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.matrix-title {
  font-size: 18px;
  font-weight: 600;
  color: #303133;
}

.matrix-legend {
  display: flex;
  gap: 16px;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
}

.legend-color {
  width: 12px;
  height: 12px;
  border-radius: 2px;
}

.legend-color.immediate {
  background: #67c23a;
}

.legend-color.short-term {
  background: #e6a23c;
}

.legend-color.medium-term {
  background: #f56c6c;
}

.legend-color.long-term {
  background: #909399;
}

.matrix-grid {
  position: relative;
  height: 400px;
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
  left: -40px;
  top: 0;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.y-axis .axis-label {
  writing-mode: vertical-lr;
  text-orientation: mixed;
  font-weight: 600;
  color: #303133;
  margin-bottom: 20px;
}

.y-axis .axis-values {
  display: flex;
  flex-direction: column;
  height: 100%;
  justify-content: space-around;
  align-items: center;
}

.y-axis .axis-values span {
  writing-mode: vertical-lr;
  text-orientation: mixed;
  font-size: 12px;
  color: #606266;
}

.x-axis {
  position: absolute;
  bottom: -40px;
  left: 0;
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.x-axis .axis-label {
  font-weight: 600;
  color: #303133;
  margin-bottom: 8px;
}

.x-axis .axis-values {
  display: flex;
  width: 100%;
  justify-content: space-around;
}

.x-axis .axis-values span {
  font-size: 12px;
  color: #606266;
}

.matrix-cells {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  grid-template-rows: repeat(3, 1fr);
  gap: 2px;
  width: 100%;
  height: 100%;
}

.matrix-cell {
  border: 1px solid #e4e7ed;
  border-radius: 4px;
  padding: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #fafafa;
}

.cell-positions {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  justify-content: center;
}

.position-dot {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #409EFF;
  color: white;
  font-size: 10px;
  font-weight: 600;
  cursor: pointer;
  transition: transform 0.2s;
}

.position-dot:hover {
  transform: scale(1.1);
}

.dot-content {
  text-align: center;
  line-height: 1;
}

.candidate-detail {
  padding: 0;
}

.detail-header {
  display: flex;
  gap: 16px;
  margin-bottom: 16px;
}

.detail-info {
  flex: 1;
}

.detail-info h3 {
  margin: 0 0 8px 0;
  color: #303133;
}

.detail-info p {
  margin: 4px 0;
  color: #606266;
}

.readiness-info {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-top: 12px;
}

.readiness-label {
  font-size: 14px;
  color: #606266;
  min-width: 80px;
}

.detail-content {
  margin-top: 16px;
}

.assessment-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
  margin-bottom: 20px;
}

.assessment-item {
  padding: 12px;
  background: #f8f9fa;
  border-radius: 6px;
}

.assessment-label {
  font-size: 12px;
  color: #909399;
  margin-bottom: 8px;
}

.development-plan h4 {
  margin: 0 0 12px 0;
  color: #303133;
}

.plan-items {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.plan-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  background: #f8f9fa;
  border-radius: 4px;
}

.plan-title {
  font-size: 14px;
  color: #303133;
  font-weight: 600;
}

.plan-timeline {
  font-size: 12px;
  color: #909399;
}

.plan-status {
  flex-shrink: 0;
}
</style> 