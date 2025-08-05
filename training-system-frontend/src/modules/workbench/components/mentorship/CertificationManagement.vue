<template>
  <div class="certification-management">
    <!-- 工具栏 -->
    <div class="toolbar">
      <div class="toolbar-left">
        <el-select v-model="filterYear" placeholder="选择年度" style="width: 150px">
          <el-option label="2024年度" value="2024" />
          <el-option label="2023年度" value="2023" />
          <el-option label="2022年度" value="2022" />
        </el-select>
        <el-select v-model="filterStatus" placeholder="认证状态" style="width: 150px" clearable>
          <el-option label="全部状态" value="" />
          <el-option label="已满足条件" value="qualified" />
          <el-option label="部分满足" value="partial" />
          <el-option label="不满足条件" value="unqualified" />
          <el-option label="已认证" value="certified" />
        </el-select>
        <el-select v-model="filterDepartment" placeholder="部门筛选" style="width: 150px" clearable>
          <el-option label="全部部门" value="" />
          <el-option label="技术部" value="tech" />
          <el-option label="产品部" value="product" />
          <el-option label="设计部" value="design" />
        </el-select>
      </div>
      <div class="toolbar-right">
        <el-button type="primary" @click="startCertification" :disabled="!hasQualifiedCandidates">
          开始年度认证
        </el-button>
        <el-button @click="exportReport">导出报告</el-button>
        <el-button @click="refreshData">刷新</el-button>
      </div>
    </div>

    <!-- 认证统计 -->
    <div class="stats-panel">
      <div class="stat-item">
        <div class="stat-number">{{ stats.totalCandidates }}</div>
        <div class="stat-label">候选人总数</div>
      </div>
      <div class="stat-item qualified">
        <div class="stat-number">{{ stats.qualifiedCandidates }}</div>
        <div class="stat-label">满足条件</div>
      </div>
      <div class="stat-item partial">
        <div class="stat-number">{{ stats.partialCandidates }}</div>
        <div class="stat-label">部分满足</div>
      </div>
      <div class="stat-item certified">
        <div class="stat-number">{{ stats.certifiedMentors }}</div>
        <div class="stat-label">已认证导师</div>
      </div>
    </div>

    <!-- 认证条件说明 -->
    <div class="criteria-info">
      <h4>书院认证带教老师条件</h4>
      <div class="criteria-list">
        <div class="criteria-item">
          <el-icon class="criteria-icon"><Calendar /></el-icon>
          <span>入职时间满2年</span>
        </div>
        <div class="criteria-item">
          <el-icon class="criteria-icon"><User /></el-icon>
          <span>带教学员数量≥3人</span>
        </div>
        <div class="criteria-item">
          <el-icon class="criteria-icon"><Document /></el-icon>
          <span>具备完整教案</span>
        </div>
        <div class="criteria-item">
          <el-icon class="criteria-icon"><Medal /></el-icon>
          <span>具有传承卡</span>
        </div>
      </div>
    </div>

    <!-- 候选人表格 -->
    <el-table
      :data="filteredCandidates"
      v-loading="loading"
      style="width: 100%"
      border
      @selection-change="handleSelectionChange"
    >
      <el-table-column 
        type="selection" 
        width="55"
        :selectable="isSelectable"
      />
      
      <el-table-column label="姓名" width="120">
        <template #default="{ row }">
          <div class="mentor-name">
            <el-avatar :size="32">{{ row.name.charAt(0) }}</el-avatar>
            <span>{{ row.name }}</span>
          </div>
        </template>
      </el-table-column>

      <el-table-column label="部门" width="120">
        <template #default="{ row }">
          {{ row.department }}
        </template>
      </el-table-column>

      <el-table-column label="入职时间" width="120">
        <template #default="{ row }">
          <div class="criteria-check">
            <span>{{ formatDate(row.hireDate) }}</span>
            <el-icon 
              :class="row.criteria.tenure ? 'check-pass' : 'check-fail'"
              :title="row.criteria.tenure ? '满足条件' : '不满足条件'"
            >
              <component :is="row.criteria.tenure ? 'CircleCheckFilled' : 'CircleCloseFilled'" />
            </el-icon>
          </div>
        </template>
      </el-table-column>

      <el-table-column label="带教数量" width="120">
        <template #default="{ row }">
          <div class="criteria-check">
            <span>{{ row.mentoringCount }}人</span>
            <el-icon 
              :class="row.criteria.mentoringCount ? 'check-pass' : 'check-fail'"
              :title="row.criteria.mentoringCount ? '满足条件' : '不满足条件'"
            >
              <component :is="row.criteria.mentoringCount ? 'CircleCheckFilled' : 'CircleCloseFilled'" />
            </el-icon>
          </div>
        </template>
      </el-table-column>

      <el-table-column label="教案情况" width="120">
        <template #default="{ row }">
          <div class="criteria-check">
            <span>{{ row.hasTeachingPlan ? '已提交' : '未提交' }}</span>
            <el-icon 
              :class="row.criteria.teachingPlan ? 'check-pass' : 'check-fail'"
              :title="row.criteria.teachingPlan ? '满足条件' : '不满足条件'"
            >
              <component :is="row.criteria.teachingPlan ? 'CircleCheckFilled' : 'CircleCloseFilled'" />
            </el-icon>
          </div>
        </template>
      </el-table-column>

      <el-table-column label="传承卡" width="120">
        <template #default="{ row }">
          <div class="criteria-check">
            <span>{{ row.hasLegacyCard ? '已获得' : '未获得' }}</span>
            <el-icon 
              :class="row.criteria.legacyCard ? 'check-pass' : 'check-fail'"
              :title="row.criteria.legacyCard ? '满足条件' : '不满足条件'"
            >
              <component :is="row.criteria.legacyCard ? 'CircleCheckFilled' : 'CircleCloseFilled'" />
            </el-icon>
          </div>
        </template>
      </el-table-column>

      <el-table-column label="综合状态" width="120">
        <template #default="{ row }">
          <el-tag :type="getStatusColor(row.status)" size="small">
            {{ getStatusText(row.status) }}
          </el-tag>
        </template>
      </el-table-column>

      <el-table-column label="认证年限" width="100">
        <template #default="{ row }">
          <div v-if="row.certificationYears > 0" class="certification-years">
            <el-tag type="warning" size="small">{{ row.certificationYears }}年</el-tag>
            <div v-if="row.certificationYears >= 3" class="gold-mentor">
              <el-tag type="success" size="small">金牌导师</el-tag>
            </div>
          </div>
          <span v-else class="no-certification">-</span>
        </template>
      </el-table-column>

      <el-table-column label="操作" width="200" fixed="right">
        <template #default="{ row }">
          <el-button 
            type="primary" 
            size="small"
            @click="viewDetail(row)"
          >
            查看详情
          </el-button>
          <el-button 
            v-if="row.status === 'qualified'"
            type="success" 
            size="small"
            @click="certifyMentor(row)"
          >
            认证
          </el-button>
          <el-button 
            v-else-if="row.status === 'partial'"
            type="warning" 
            size="small"
            @click="viewRequirements(row)"
          >
            查看缺项
          </el-button>
        </template>
      </el-table-column>
    </el-table>

    <!-- 分页器 -->
    <div class="pagination-wrapper">
      <el-pagination
        v-model:current-page="pagination.page"
        v-model:page-size="pagination.pageSize"
        :total="pagination.total"
        :page-sizes="[10, 20, 50]"
        layout="total, sizes, prev, pager, next, jumper"
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
      />
    </div>

    <!-- 候选人详情对话框 -->
    <el-dialog
      v-model="showDetailDialog"
      title="候选人详情"
      width="800px"
    >
      <CandidateDetail
        v-if="selectedCandidate"
        :candidate="selectedCandidate"
      />
    </el-dialog>

    <!-- 缺项要求对话框 -->
    <el-dialog
      v-model="showRequirementsDialog"
      title="认证要求缺项"
      width="600px"
    >
      <RequirementsList
        v-if="selectedCandidate"
        :candidate="selectedCandidate"
      />
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { 
  Calendar, 
  User, 
  Document, 
  Medal,
  CircleCheckFilled,
  CircleCloseFilled
} from '@element-plus/icons-vue'
import CandidateDetail from './certification/CandidateDetail.vue'
import RequirementsList from './certification/RequirementsList.vue'

// 响应式数据
const loading = ref(false)
const filterYear = ref('2024')
const filterStatus = ref('')
const filterDepartment = ref('')
const selectedCandidates = ref<any[]>([])
const showDetailDialog = ref(false)
const showRequirementsDialog = ref(false)
const selectedCandidate = ref<any>(null)

// 分页数据
const pagination = ref({
  page: 1,
  pageSize: 20,
  total: 0
})

// 统计数据
const stats = ref({
  totalCandidates: 24,
  qualifiedCandidates: 8,
  partialCandidates: 12,
  certifiedMentors: 15
})

// 模拟候选人数据
const candidates = ref([
  {
    id: 'candidate1',
    name: '张老师',
    department: '技术部',
    hireDate: new Date('2020-03-15'),
    mentoringCount: 5,
    hasTeachingPlan: true,
    hasLegacyCard: true,
    certificationYears: 2,
    status: 'qualified',
    criteria: {
      tenure: true,
      mentoringCount: true,
      teachingPlan: true,
      legacyCard: true
    }
  },
  {
    id: 'candidate2',
    name: '李老师',
    department: '产品部',
    hireDate: new Date('2021-06-20'),
    mentoringCount: 4,
    hasTeachingPlan: true,
    hasLegacyCard: false,
    certificationYears: 1,
    status: 'partial',
    criteria: {
      tenure: true,
      mentoringCount: true,
      teachingPlan: true,
      legacyCard: false
    }
  },
  {
    id: 'candidate3',
    name: '王老师',
    department: '技术部',
    hireDate: new Date('2019-01-10'),
    mentoringCount: 8,
    hasTeachingPlan: true,
    hasLegacyCard: true,
    certificationYears: 4,
    status: 'certified',
    criteria: {
      tenure: true,
      mentoringCount: true,
      teachingPlan: true,
      legacyCard: true
    }
  },
  {
    id: 'candidate4',
    name: '陈老师',
    department: '设计部',
    hireDate: new Date('2023-01-15'),
    mentoringCount: 1,
    hasTeachingPlan: false,
    hasLegacyCard: false,
    certificationYears: 0,
    status: 'unqualified',
    criteria: {
      tenure: false,
      mentoringCount: false,
      teachingPlan: false,
      legacyCard: false
    }
  }
])

// 计算属性
const filteredCandidates = computed(() => {
  let filtered = candidates.value

  if (filterStatus.value) {
    filtered = filtered.filter(candidate => candidate.status === filterStatus.value)
  }

  if (filterDepartment.value) {
    const deptMap: Record<string, string> = {
      tech: '技术部',
      product: '产品部',
      design: '设计部'
    }
    filtered = filtered.filter(candidate => candidate.department === deptMap[filterDepartment.value])
  }

  return filtered
})

const hasQualifiedCandidates = computed(() => {
  return candidates.value.some(candidate => candidate.status === 'qualified')
})

// 方法
const getStatusColor = (status: string) => {
  const colorMap: Record<string, string> = {
    qualified: 'success',
    partial: 'warning',
    unqualified: 'danger',
    certified: 'primary'
  }
  return colorMap[status] || 'info'
}

const getStatusText = (status: string) => {
  const textMap: Record<string, string> = {
    qualified: '满足条件',
    partial: '部分满足',
    unqualified: '不满足条件',
    certified: '已认证'
  }
  return textMap[status] || status
}

const isSelectable = (row: any) => {
  return row.status === 'qualified'
}

const formatDate = (date: Date) => {
  return date.toLocaleDateString('zh-CN')
}

const handleSelectionChange = (selection: any[]) => {
  selectedCandidates.value = selection
}

const viewDetail = (candidate: any) => {
  selectedCandidate.value = candidate
  showDetailDialog.value = true
}

const viewRequirements = (candidate: any) => {
  selectedCandidate.value = candidate
  showRequirementsDialog.value = true
}

const certifyMentor = async (candidate: any) => {
  try {
    await ElMessageBox.confirm(
      `确定要认证 ${candidate.name} 为书院认证带教老师吗？`,
      '确认认证',
      {
        confirmButtonText: '确认',
        cancelButtonText: '取消',
        type: 'success',
      }
    )
    
    // 更新候选人状态
    candidate.status = 'certified'
    candidate.certificationYears = candidate.certificationYears || 1
    
    // 更新统计数据
    stats.value.qualifiedCandidates--
    stats.value.certifiedMentors++
    
    ElMessage.success(`${candidate.name} 已成功认证为书院认证带教老师`)
  } catch {
    ElMessage.info('已取消认证操作')
  }
}

const startCertification = async () => {
  const qualifiedCount = candidates.value.filter(c => c.status === 'qualified').length
  
  try {
    await ElMessageBox.confirm(
      `将开始 ${filterYear.value} 年度认证流程，共有 ${qualifiedCount} 名候选人满足条件。确定开始吗？`,
      '开始年度认证',
      {
        confirmButtonText: '开始认证',
        cancelButtonText: '取消',
        type: 'primary',
      }
    )
    
    ElMessage.success('年度认证流程已启动')
  } catch {
    ElMessage.info('已取消认证流程')
  }
}

const exportReport = () => {
  ElMessage.info('导出认证报告功能开发中...')
}

const refreshData = () => {
  ElMessage.success('数据已刷新')
}

const handleSizeChange = (size: number) => {
  pagination.value.pageSize = size
}

const handleCurrentChange = (page: number) => {
  pagination.value.page = page
}

// 生命周期
onMounted(() => {
  pagination.value.total = candidates.value.length
})
</script>

<style scoped>
.certification-management {
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
}

.toolbar-right {
  display: flex;
  gap: 8px;
}

.stats-panel {
  display: flex;
  gap: 20px;
  margin-bottom: 20px;
}

.stat-item {
  flex: 1;
  text-align: center;
  padding: 20px;
  background: #fff;
  border-radius: 8px;
  border: 1px solid #e4e7ed;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.stat-item.qualified {
  border-color: #67c23a;
}

.stat-item.partial {
  border-color: #e6a23c;
}

.stat-item.certified {
  border-color: #409eff;
}

.stat-number {
  font-size: 28px;
  font-weight: bold;
  margin-bottom: 8px;
}

.stat-item .stat-number {
  color: #409eff;
}

.stat-item.qualified .stat-number {
  color: #67c23a;
}

.stat-item.partial .stat-number {
  color: #e6a23c;
}

.stat-item.certified .stat-number {
  color: #409eff;
}

.stat-label {
  font-size: 14px;
  color: #606266;
}

.criteria-info {
  margin-bottom: 20px;
  padding: 20px;
  background: #f0f9ff;
  border-radius: 8px;
  border-left: 4px solid #409eff;
}

.criteria-info h4 {
  margin: 0 0 16px 0;
  color: #303133;
  font-size: 16px;
}

.criteria-list {
  display: flex;
  gap: 30px;
  flex-wrap: wrap;
}

.criteria-item {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #606266;
  font-size: 14px;
}

.criteria-icon {
  color: #409eff;
  font-size: 16px;
}

.mentor-name {
  display: flex;
  align-items: center;
  gap: 8px;
}

.criteria-check {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.check-pass {
  color: #67c23a;
}

.check-fail {
  color: #f56c6c;
}

.certification-years {
  text-align: center;
}

.gold-mentor {
  margin-top: 4px;
}

.no-certification {
  color: #c0c4cc;
}

.pagination-wrapper {
  display: flex;
  justify-content: center;
  margin-top: 20px;
  padding: 16px;
}

:deep(.el-table) {
  flex: 1;
}

/* 响应式设计 */
@media (max-width: 1200px) {
  .stats-panel {
    flex-direction: column;
  }
  
  .criteria-list {
    flex-direction: column;
    gap: 12px;
  }
  
  .toolbar {
    flex-direction: column;
    align-items: stretch;
    gap: 12px;
  }
  
  .toolbar-left {
    justify-content: center;
  }
}
</style> 