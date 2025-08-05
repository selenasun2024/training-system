<template>
  <div class="mentor-resource-management">
    <!-- 工具栏 -->
    <div class="toolbar">
      <div class="toolbar-left">
        <el-select v-model="filterYear" placeholder="选择年度" style="width: 130px">
          <el-option label="2024年度" value="2024" />
          <el-option label="2023年度" value="2023" />
          <el-option label="2022年度" value="2022" />
          <el-option label="2021年度" value="2021" />
        </el-select>
        <el-select v-model="filterCertType" placeholder="认证类型" style="width: 140px" clearable>
          <el-option label="全部类型" value="" />
          <el-option label="书院认证" value="academy" />
          <el-option label="部门指定" value="department" />
          <el-option label="金牌导师" value="gold" />
        </el-select>
        <el-input
          v-model="searchKeyword"
          placeholder="搜索导师姓名"
          style="width: 200px"
          clearable
        >
          <template #prefix>
            <el-icon><Search /></el-icon>
          </template>
        </el-input>
        <el-select v-model="filterDepartment" placeholder="部门" style="width: 120px" clearable>
          <el-option label="全部" value="" />
          <el-option label="技术部" value="技术部" />
          <el-option label="产品部" value="产品部" />
          <el-option label="市场部" value="市场部" />
        </el-select>
        <el-select v-model="filterStatus" placeholder="状态" style="width: 120px" clearable>
          <el-option label="全部" value="" />
          <el-option label="可用" value="active" />
          <el-option label="忙碌" value="busy" />
          <el-option label="暂停" value="inactive" />
        </el-select>
      </div>
      <div class="toolbar-right">
        <el-button type="primary" @click="addMentor">添加导师</el-button>
        <el-button @click="refreshData">刷新</el-button>
      </div>
    </div>

    <!-- 导师资源表格 -->
    <el-table
      :data="filteredMentors"
      v-loading="loading"
      style="width: 100%"
      border
    >
      <el-table-column label="导师信息" min-width="200">
        <template #default="{ row }">
          <div class="user-cell">
            <el-avatar :size="40">{{ row.name.charAt(0) }}</el-avatar>
            <div class="user-info">
              <div class="name">{{ row.name }}</div>
              <div class="department">{{ row.department }} - {{ row.position }}</div>
              <div class="contact">{{ row.email }}</div>
            </div>
          </div>
        </template>
      </el-table-column>

      <el-table-column label="认证类型" width="120">
        <template #default="{ row }">
          <el-tag :type="getCertType(row.certType)" size="small">
            {{ getCertText(row.certType) }}
          </el-tag>
        </template>
      </el-table-column>

      <el-table-column label="认证年限" width="120">
        <template #default="{ row }">
          <div class="certification-years">
            <div v-if="row.certificationYears > 0" class="years-info">
              <span class="years-count">{{ row.certificationYears }}年</span>
              <div v-if="row.certificationYears >= 3" class="gold-badge">
                <el-tag type="warning" size="small">金牌</el-tag>
              </div>
            </div>
            <div v-else class="no-cert">
              <span class="no-years">-</span>
            </div>
          </div>
        </template>
      </el-table-column>

      <el-table-column label="专业领域" min-width="200">
        <template #default="{ row }">
          <div class="expertise-tags">
            <el-tag
              v-for="skill in row.expertise.slice(0, 3)"
              :key="skill"
              size="small"
              type="info"
              style="margin-right: 4px; margin-bottom: 4px;"
            >
              {{ skill }}
            </el-tag>
            <span v-if="row.expertise.length > 3" class="more-text">
              +{{ row.expertise.length - 3 }}项
            </span>
          </div>
        </template>
      </el-table-column>

      <el-table-column label="工作负载" width="150">
        <template #default="{ row }">
          <div class="workload-cell">
            <div class="load-info">
              <span class="current">{{ row.currentLoad }}</span>
              <span class="separator">/</span>
              <span class="max">{{ row.maxLoad }}</span>
            </div>
            <el-progress
              :percentage="getLoadPercentage(row)"
              :color="getLoadColor(row)"
              :stroke-width="6"
              :show-text="false"
              style="margin-top: 4px;"
            />
          </div>
        </template>
      </el-table-column>

      <el-table-column label="评分" width="100">
        <template #default="{ row }">
          <div class="rating-cell">
            <el-rate
              :model-value="row.rating"
              disabled
              size="small"
              text-color="#ff9900"
            />
            <div class="rating-text">{{ row.rating.toFixed(1) }}分</div>
          </div>
        </template>
      </el-table-column>

      <el-table-column label="状态" width="100">
        <template #default="{ row }">
          <el-tag :type="getStatusType(row.status)" size="small">
            {{ getStatusText(row.status) }}
          </el-tag>
        </template>
      </el-table-column>

      <el-table-column label="操作" width="200" fixed="right">
        <template #default="{ row }">
          <el-button type="primary" size="small" @click="viewMentor(row)">
            详情
          </el-button>
          <el-button type="warning" size="small" @click="editMentor(row)">
            编辑
          </el-button>
          <el-dropdown @command="(cmd) => handleAction(cmd, row)">
            <el-button size="small">
              更多<el-icon class="el-icon--right"><ArrowDown /></el-icon>
            </el-button>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="workload">负载管理</el-dropdown-item>
                <el-dropdown-item command="certification">认证管理</el-dropdown-item>
                <el-dropdown-item command="assign">指派学员</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
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
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { Search, ArrowDown } from '@element-plus/icons-vue'

// 响应式数据
const loading = ref(false)
const searchKeyword = ref('')
const filterYear = ref('2024')
const filterCertType = ref('')
const filterDepartment = ref('')
const filterStatus = ref('')

// 分页数据
const pagination = ref({
  page: 1,
  pageSize: 20,
  total: 0
})

// 模拟导师数据
const mentors = ref([
  {
    id: 'mentor1',
    name: '王导师',
    department: '技术部',
    position: '高级工程师',
    email: 'wang@example.com',
    certType: 'gold',
    expertise: ['JavaScript', 'Vue.js', 'Node.js', '系统架构'],
    currentLoad: 3,
    maxLoad: 5,
    rating: 4.8,
    status: 'active',
    certificationHistory: [
      { year: '2022', type: 'academy', status: 'certified' },
      { year: '2023', type: 'academy', status: 'certified' },
      { year: '2024', type: 'gold', status: 'certified' }
    ],
    certificationYears: 3
  },
  {
    id: 'mentor2',
    name: '李导师',
    department: '产品部',
    position: '产品经理',
    email: 'li@example.com',
    certType: 'department',
    expertise: ['产品设计', '用户体验', '数据分析'],
    currentLoad: 5,
    maxLoad: 4,
    rating: 4.6,
    status: 'busy',
    certificationHistory: [
      { year: '2023', type: 'department', status: 'assigned' },
      { year: '2024', type: 'department', status: 'assigned' }
    ],
    certificationYears: 0
  },
  {
    id: 'mentor3',
    name: '陈导师',
    department: '技术部',
    position: '架构师',
    email: 'chen@example.com',
    certType: 'academy',
    expertise: ['微服务', '分布式系统', 'DevOps'],
    currentLoad: 2,
    maxLoad: 6,
    rating: 4.9,
    status: 'active',
    certificationHistory: [
      { year: '2023', type: 'academy', status: 'certified' },
      { year: '2024', type: 'academy', status: 'certified' }
    ],
    certificationYears: 2
  },
  {
    id: 'mentor4',
    name: '张导师',
    department: '市场部',
    position: '市场经理',
    email: 'zhang@example.com',
    certType: 'academy',
    expertise: ['营销策划', '品牌管理', '客户关系'],
    currentLoad: 1,
    maxLoad: 3,
    rating: 4.7,
    status: 'active',
    certificationHistory: [
      { year: '2024', type: 'academy', status: 'certified' }
    ],
    certificationYears: 1
  }
])

// 计算属性
const filteredMentors = computed(() => {
  let filtered = mentors.value

  // 年度筛选
  if (filterYear.value) {
    filtered = filtered.filter(mentor => 
      mentor.certificationHistory && 
      mentor.certificationHistory.some((cert: any) => cert.year === filterYear.value)
    )
  }

  // 认证类型筛选
  if (filterCertType.value) {
    filtered = filtered.filter(mentor => mentor.certType === filterCertType.value)
  }

  if (searchKeyword.value) {
    const keyword = searchKeyword.value.toLowerCase()
    filtered = filtered.filter(mentor => 
      mentor.name.toLowerCase().includes(keyword)
    )
  }

  if (filterDepartment.value) {
    filtered = filtered.filter(mentor => mentor.department === filterDepartment.value)
  }

  if (filterStatus.value) {
    filtered = filtered.filter(mentor => mentor.status === filterStatus.value)
  }

  return filtered
})

// 方法
const getCertType = (certType: string) => {
  return certType === 'academy' ? 'success' : 'info'
}

const getCertText = (certType: string) => {
  return certType === 'academy' ? '书院认证' : '部门指定'
}

const getLoadPercentage = (mentor: any) => {
  return Math.round((mentor.currentLoad / mentor.maxLoad) * 100)
}

const getLoadColor = (mentor: any) => {
  const percentage = getLoadPercentage(mentor)
  if (percentage >= 100) return '#f56c6c'
  if (percentage >= 80) return '#e6a23c'
  return '#67c23a'
}

const getStatusType = (status: string) => {
  const typeMap: Record<string, string> = {
    active: 'success',
    busy: 'warning',
    inactive: 'info'
  }
  return typeMap[status] || 'info'
}

const getStatusText = (status: string) => {
  const textMap: Record<string, string> = {
    active: '可用',
    busy: '忙碌',
    inactive: '暂停'
  }
  return textMap[status] || status
}

const addMentor = () => {
  ElMessage.info('添加导师功能开发中...')
}

const viewMentor = (mentor: any) => {
  ElMessage.info(`查看导师详情: ${mentor.name}`)
}

const editMentor = (mentor: any) => {
  ElMessage.info(`编辑导师: ${mentor.name}`)
}

const handleAction = (command: string, mentor: any) => {
  ElMessage.info(`执行操作: ${command} - ${mentor.name}`)
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
  pagination.value.total = mentors.value.length
})
</script>

<style scoped>
.mentor-resource-management {
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

.user-cell {
  display: flex;
  align-items: center;
  gap: 12px;
}

.user-info .name {
  font-weight: 500;
  color: #303133;
  margin-bottom: 2px;
}

.user-info .department {
  font-size: 12px;
  color: #606266;
  margin-bottom: 2px;
}

.user-info .contact {
  font-size: 11px;
  color: #909399;
}

.expertise-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.more-text {
  font-size: 12px;
  color: #909399;
}

.certification-years {
  text-align: center;
}

.years-info {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.years-count {
  font-weight: 500;
  color: #409eff;
  font-size: 14px;
}

.gold-badge {
  display: flex;
  justify-content: center;
}

.no-cert {
  display: flex;
  justify-content: center;
  align-items: center;
}

.no-years {
  color: #c0c4cc;
  font-size: 14px;
}

.workload-cell {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.load-info {
  font-size: 12px;
  color: #606266;
}

.rating-cell {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.rating-text {
  font-size: 12px;
  color: #ff9900;
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
</style> 