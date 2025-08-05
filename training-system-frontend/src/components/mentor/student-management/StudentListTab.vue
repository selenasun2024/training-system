<template>
  <div class="student-list-tab">
    <!-- 筛选工具栏 -->
    <div class="filter-toolbar">
      <div class="filter-section">
        <el-select 
          v-model="filters.department" 
          placeholder="按部门筛选" 
          clearable
          style="width: 160px"
          @change="handleFilterChange"
        >
          <el-option label="全部部门" value="" />
          <el-option label="技术部" value="技术部" />
          <el-option label="产品部" value="产品部" />
          <el-option label="运营部" value="运营部" />
        </el-select>
        
        <el-select 
          v-model="filters.status" 
          placeholder="带教状态" 
          clearable
          style="width: 160px"
          @change="handleFilterChange"
        >
          <el-option label="全部状态" value="" />
          <el-option label="进行中" value="active" />
          <el-option label="已完成" value="completed" />
          <el-option label="已暂停" value="paused" />
          <el-option label="已终止" value="terminated" />
        </el-select>
        
        <el-select 
          v-model="filters.progress" 
          placeholder="进度范围" 
          clearable
          style="width: 160px"
          @change="handleFilterChange"
        >
          <el-option label="全部进度" value="" />
          <el-option label="0-30%" value="0-30" />
          <el-option label="31-60%" value="31-60" />
          <el-option label="61-90%" value="61-90" />
          <el-option label="91-100%" value="91-100" />
        </el-select>
      </div>
      
      <div class="search-section">
        <el-input 
          v-model="filters.search"
          placeholder="搜索学员姓名/工号"
          style="width: 280px"
          clearable
          @input="handleSearchInput"
        >
          <template #prefix>
            <el-icon><Search /></el-icon>
          </template>
        </el-input>
        
        <el-button @click="resetFilters">
          <el-icon><Refresh /></el-icon>
          重置
        </el-button>
      </div>
    </div>

    <!-- 统计信息 -->
    <div class="statistics-bar">
      <div class="stat-cards">
        <div class="stat-card total">
          <div class="stat-number">{{ filteredStudents.length }}</div>
          <div class="stat-label">学员总数</div>
        </div>
        <div class="stat-card active">
          <div class="stat-number">{{ activeStudentsCount }}</div>
          <div class="stat-label">进行中</div>
        </div>
        <div class="stat-card completed">
          <div class="stat-number">{{ completedStudentsCount }}</div>
          <div class="stat-label">已完成</div>
        </div>
        <div class="stat-card warning">
          <div class="stat-number">{{ behindScheduleCount }}</div>
          <div class="stat-label">进度滞后</div>
        </div>
      </div>
      
      <div class="view-options">
        <el-radio-group v-model="viewMode" @change="handleViewModeChange">
          <el-radio-button label="card">卡片视图</el-radio-button>
          <el-radio-button label="table">表格视图</el-radio-button>
        </el-radio-group>
      </div>
    </div>

    <!-- 学员展示区 -->
    <div class="students-container" v-loading="loading">
      <!-- 卡片视图 -->
      <div v-if="viewMode === 'card'" class="students-grid">
        <StudentCard 
          v-for="student in filteredStudents"
          :key="student.id"
          :student="student"
          @click="handleStudentClick(student)"
          @quick-contact="handleQuickContact(student)"
          @view-progress="handleViewProgress(student)"
        />
      </div>
      
      <!-- 表格视图 -->
      <div v-else class="students-table">
        <el-table 
          :data="filteredStudents"
          style="width: 100%"
          @row-click="handleStudentClick"
          row-class-name="student-row"
        >
          <el-table-column width="60">
            <template #default="{ row }">
              <el-avatar :src="row.avatar" :size="40">
                {{ row.name.charAt(0) }}
              </el-avatar>
            </template>
          </el-table-column>
          
          <el-table-column prop="name" label="姓名" width="120" />
          <el-table-column prop="employeeId" label="工号" width="120" />
          <el-table-column prop="department" label="部门" width="100" />
          <el-table-column prop="position" label="岗位" width="150" />
          <el-table-column prop="entryDate" label="入职时间" width="120" />
          
          <el-table-column label="带教状态" width="100">
            <template #default="{ row }">
              <el-tag :type="getStatusType(row.status)">
                {{ getStatusLabel(row.status) }}
              </el-tag>
            </template>
          </el-table-column>
          
          <el-table-column label="进度" width="120">
            <template #default="{ row }">
              <div class="progress-cell">
                <el-progress 
                  :percentage="row.progress" 
                  :color="getProgressColor(row.progress)"
                  :stroke-width="6"
                  :show-text="false"
                />
                <span class="progress-text">{{ row.progress }}%</span>
              </div>
            </template>
          </el-table-column>
          
          <el-table-column label="当前阶段" width="150">
            <template #default="{ row }">
              <span class="phase-text">{{ row.currentPhase }}</span>
            </template>
          </el-table-column>
          
          <el-table-column label="操作" width="150" fixed="right">
            <template #default="{ row }">
              <el-button size="small" @click.stop="handleQuickContact(row)">
                <el-icon><ChatDotSquare /></el-icon>
                沟通
              </el-button>
              <el-button size="small" @click.stop="handleViewProgress(row)">
                <el-icon><TrendCharts /></el-icon>
                进度
              </el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>
      
      <!-- 空状态 -->
      <div v-if="filteredStudents.length === 0 && !loading" class="empty-state">
        <el-empty description="暂无学员数据">
          <el-button type="primary">添加学员</el-button>
        </el-empty>
      </div>
    </div>

    <!-- 学员详情预览抽屉 -->
    <el-drawer
      v-model="showStudentDetail"
      title="学员详情"
      size="40%"
      direction="rtl"
    >
      <StudentDetailPreview 
        v-if="selectedStudent"
        :student="selectedStudent"
        @close="showStudentDetail = false"
        @contact="handleQuickContact"
        @edit="handleEditStudent"
      />
    </el-drawer>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { Search, Refresh, ChatDotSquare, TrendCharts } from '@element-plus/icons-vue'

// 导入子组件
import StudentCard from './StudentCard.vue'
import StudentDetailPreview from './StudentDetailPreview.vue'

// 导入类型
import type { StudentInfo } from '@/stores/mentorWorkbench'

// Props
interface Props {
  students: StudentInfo[]
  loading: boolean
}

const props = defineProps<Props>()

// Emits
const emit = defineEmits<{
  'student-selected': [studentId: string]
  'filter-changed': [filters: any]
}>()

// 响应式数据
const filters = ref({
  department: '',
  status: '',
  progress: '',
  search: ''
})

const viewMode = ref<'card' | 'table'>('card')
const showStudentDetail = ref(false)
const selectedStudent = ref<StudentInfo | null>(null)
const searchTimer = ref<NodeJS.Timeout | null>(null)

// 计算属性
const filteredStudents = computed(() => {
  return props.students.filter(student => {
    // 部门筛选
    if (filters.value.department && student.department !== filters.value.department) {
      return false
    }
    
    // 状态筛选
    if (filters.value.status && student.status !== filters.value.status) {
      return false
    }
    
    // 进度筛选
    if (filters.value.progress) {
      const [min, max] = filters.value.progress.split('-').map(Number)
      if (student.progress < min || student.progress > max) {
        return false
      }
    }
    
    // 搜索筛选
    if (filters.value.search) {
      const searchText = filters.value.search.toLowerCase()
      const matchName = student.name.toLowerCase().includes(searchText)
      const matchEmployeeId = student.employeeId.toLowerCase().includes(searchText)
      if (!matchName && !matchEmployeeId) {
        return false
      }
    }
    
    return true
  })
})

const activeStudentsCount = computed(() => 
  filteredStudents.value.filter(s => s.status === 'active').length
)

const completedStudentsCount = computed(() => 
  filteredStudents.value.filter(s => s.status === 'completed').length
)

const behindScheduleCount = computed(() => {
  // 计算进度滞后的学员数量
  const now = new Date()
  return filteredStudents.value.filter(student => {
    if (student.status !== 'active') return false
    
    const startDate = new Date(student.mentorshipStartDate)
    const daysPassed = Math.floor((now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
    const expectedProgress = Math.min((daysPassed / 90) * 100, 100)
    
    return student.progress < expectedProgress - 10
  }).length
})

// 方法
const handleFilterChange = () => {
  emit('filter-changed', filters.value)
}

const handleSearchInput = () => {
  // 防抖搜索
  if (searchTimer.value) {
    clearTimeout(searchTimer.value)
  }
  
  searchTimer.value = setTimeout(() => {
    handleFilterChange()
  }, 300)
}

const resetFilters = () => {
  filters.value = {
    department: '',
    status: '',
    progress: '',
    search: ''
  }
  handleFilterChange()
}

const handleViewModeChange = (mode: 'card' | 'table') => {
  viewMode.value = mode
  console.log('🔄 切换视图模式:', mode)
}

const handleStudentClick = (student: StudentInfo) => {
  selectedStudent.value = student
  showStudentDetail.value = true
  emit('student-selected', student.id)
}

const handleQuickContact = (student: StudentInfo) => {
  console.log('💬 快速联系学员:', student.name)
  ElMessage.success(`正在联系 ${student.name}...`)
  // TODO: 实现快速联系功能
}

const handleViewProgress = (student: StudentInfo) => {
  console.log('📊 查看学员进度:', student.name)
  // TODO: 跳转到进度详情页面
}

const handleEditStudent = (student: StudentInfo) => {
  console.log('✏️ 编辑学员信息:', student.name)
  // TODO: 实现编辑学员功能
}

// 辅助方法
const getStatusType = (status: string) => {
  const typeMap = {
    active: 'success',
    completed: 'info',
    paused: 'warning',
    terminated: 'danger'
  }
  return typeMap[status as keyof typeof typeMap] || 'info'
}

const getStatusLabel = (status: string) => {
  const labelMap = {
    active: '进行中',
    completed: '已完成',
    paused: '已暂停',
    terminated: '已终止'
  }
  return labelMap[status as keyof typeof labelMap] || status
}

const getProgressColor = (progress: number) => {
  if (progress < 30) return '#f56c6c'
  if (progress < 60) return '#e6a23c'
  if (progress < 90) return '#409eff'
  return '#67c23a'
}

// 监听器
watch(() => props.students, () => {
  // 当学员数据变化时，重新应用筛选
  handleFilterChange()
}, { deep: true })
</script>

<style scoped>
.student-list-tab {
  height: 100%;
  display: flex;
  flex-direction: column;
}

/* 筛选工具栏 */
.filter-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 0;
  border-bottom: 1px solid #e4e7ed;
  margin-bottom: 16px;
}

.filter-section {
  display: flex;
  gap: 12px;
  align-items: center;
}

.search-section {
  display: flex;
  gap: 12px;
  align-items: center;
}

/* 统计信息栏 */
.statistics-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 0;
  margin-bottom: 16px;
}

.stat-cards {
  display: flex;
  gap: 16px;
}

.stat-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 12px 16px;
  border-radius: 8px;
  background: white;
  border: 1px solid #e4e7ed;
  min-width: 80px;
}

.stat-card.total {
  border-color: #409eff;
  color: #409eff;
}

.stat-card.active {
  border-color: #67c23a;
  color: #67c23a;
}

.stat-card.completed {
  border-color: #909399;
  color: #909399;
}

.stat-card.warning {
  border-color: #e6a23c;
  color: #e6a23c;
}

.stat-number {
  font-size: 20px;
  font-weight: 600;
  line-height: 1;
}

.stat-label {
  font-size: 12px;
  margin-top: 4px;
  opacity: 0.8;
}

/* 学员展示区 */
.students-container {
  flex: 1;
  overflow: hidden;
}

.students-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 16px;
  padding: 8px 0;
  overflow-y: auto;
  height: 100%;
}

.students-table {
  height: 100%;
  overflow: auto;
}

.students-table :deep(.student-row) {
  cursor: pointer;
  transition: background-color 0.3s;
}

.students-table :deep(.student-row:hover) {
  background-color: #f5f7fa;
}

.progress-cell {
  display: flex;
  align-items: center;
  gap: 8px;
}

.progress-text {
  font-size: 12px;
  color: #606266;
  min-width: 30px;
}

.phase-text {
  font-size: 12px;
  color: #606266;
}

/* 空状态 */
.empty-state {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100%;
  min-height: 300px;
}

/* 响应式设计 */
@media (max-width: 1200px) {
  .students-grid {
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  }
}

@media (max-width: 768px) {
  .filter-toolbar {
    flex-direction: column;
    gap: 12px;
    align-items: stretch;
  }
  
  .filter-section {
    flex-wrap: wrap;
  }
  
  .search-section {
    justify-content: center;
  }
  
  .statistics-bar {
    flex-direction: column;
    gap: 12px;
  }
  
  .stat-cards {
    justify-content: center;
    flex-wrap: wrap;
  }
  
  .students-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 480px) {
  .filter-section .el-select {
    min-width: 120px;
  }
  
  .search-section .el-input {
    min-width: 200px;
  }
  
  .stat-cards {
    gap: 8px;
  }
  
  .stat-card {
    min-width: 70px;
    padding: 8px 12px;
  }
}
</style> 