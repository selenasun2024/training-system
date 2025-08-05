<template>
  <div class="evaluation-standards-management">
    <!-- 工具栏 -->
    <div class="toolbar">
      <div class="toolbar-left">
        <el-select v-model="filterCategory" placeholder="标准类型" style="width: 150px" clearable>
          <el-option label="全部" value="" />
          <el-option label="转正评价" value="probation" />
          <el-option label="一年期评价" value="annual" />
          <el-option label="阶段评价" value="phase" />
        </el-select>
        <el-select v-model="filterStatus" placeholder="状态" style="width: 120px" clearable>
          <el-option label="全部" value="" />
          <el-option label="启用" value="active" />
          <el-option label="草稿" value="draft" />
          <el-option label="停用" value="inactive" />
        </el-select>
      </div>
      <div class="toolbar-right">
        <el-button type="primary" @click="addStandard">新建标准</el-button>
        <el-button @click="refreshData">刷新</el-button>
      </div>
    </div>

    <!-- 评价标准表格 -->
    <el-table
      :data="filteredStandards"
      v-loading="loading"
      style="width: 100%"
      border
    >
      <el-table-column label="标准名称" min-width="200">
        <template #default="{ row }">
          <div class="standard-name">
            <div class="name">{{ row.name }}</div>
            <div class="description">{{ row.description }}</div>
          </div>
        </template>
      </el-table-column>

      <el-table-column label="标准类型" width="120">
        <template #default="{ row }">
          <el-tag :type="getCategoryType(row.category)" size="small">
            {{ getCategoryText(row.category) }}
          </el-tag>
        </template>
      </el-table-column>

      <el-table-column label="评价维度" min-width="200">
        <template #default="{ row }">
          <div class="dimensions-list">
            <div
              v-for="dimension in row.dimensions"
              :key="dimension.name"
              class="dimension-item"
            >
              <span class="dimension-name">{{ dimension.name }}</span>
              <span class="dimension-weight">{{ dimension.weight }}%</span>
            </div>
          </div>
        </template>
      </el-table-column>

      <el-table-column label="总分" width="80">
        <template #default="{ row }">
          <div class="total-score">{{ row.totalScore }}分</div>
        </template>
      </el-table-column>

      <el-table-column label="通过标准" width="100">
        <template #default="{ row }">
          <div class="pass-score">≥{{ row.passScore }}分</div>
        </template>
      </el-table-column>

      <el-table-column label="状态" width="100">
        <template #default="{ row }">
          <el-tag :type="getStatusType(row.status)" size="small">
            {{ getStatusText(row.status) }}
          </el-tag>
        </template>
      </el-table-column>

      <el-table-column label="更新时间" width="120">
        <template #default="{ row }">
          {{ formatDate(row.updatedAt) }}
        </template>
      </el-table-column>

      <el-table-column label="操作" width="200" fixed="right">
        <template #default="{ row }">
          <el-button type="primary" size="small" @click="viewStandard(row)">
            查看
          </el-button>
          <el-button type="warning" size="small" @click="editStandard(row)">
            编辑
          </el-button>
          <el-dropdown @command="(cmd) => handleAction(cmd, row)">
            <el-button size="small">
              更多<el-icon class="el-icon--right"><ArrowDown /></el-icon>
            </el-button>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="copy">复制标准</el-dropdown-item>
                <el-dropdown-item command="version">版本管理</el-dropdown-item>
                <el-dropdown-item 
                  command="toggle" 
                  :divided="true"
                  :disabled="row.status === 'draft'"
                >
                  {{ row.status === 'active' ? '停用' : '启用' }}
                </el-dropdown-item>
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
import { ArrowDown } from '@element-plus/icons-vue'

// 响应式数据
const loading = ref(false)
const filterCategory = ref('')
const filterStatus = ref('')

// 分页数据
const pagination = ref({
  page: 1,
  pageSize: 20,
  total: 0
})

// 模拟评价标准数据
const standards = ref([
  {
    id: 'std1',
    name: '新员工转正评价标准',
    description: '用于新员工转正期间的带教评价',
    category: 'probation',
    dimensions: [
      { name: '认识', weight: 30 },
      { name: '技能', weight: 40 },
      { name: '文化和人文', weight: 30 }
    ],
    totalScore: 100,
    passScore: 70,
    status: 'active',
    updatedAt: new Date('2024-01-15')
  },
  {
    id: 'std2',
    name: '一年期成长评价标准',
    description: '用于员工入职一年期的成长评价',
    category: 'annual',
    dimensions: [
      { name: '认识', weight: 25 },
      { name: '技能', weight: 50 },
      { name: '文化和人文', weight: 25 }
    ],
    totalScore: 100,
    passScore: 75,
    status: 'active',
    updatedAt: new Date('2024-02-01')
  },
  {
    id: 'std3',
    name: '阶段性评价标准',
    description: '用于项目阶段性评价的标准',
    category: 'phase',
    dimensions: [
      { name: '认识', weight: 35 },
      { name: '技能', weight: 35 },
      { name: '文化和人文', weight: 30 }
    ],
    totalScore: 100,
    passScore: 65,
    status: 'draft',
    updatedAt: new Date('2024-01-20')
  }
])

// 计算属性
const filteredStandards = computed(() => {
  let filtered = standards.value

  if (filterCategory.value) {
    filtered = filtered.filter(std => std.category === filterCategory.value)
  }

  if (filterStatus.value) {
    filtered = filtered.filter(std => std.status === filterStatus.value)
  }

  return filtered
})

// 方法
const getCategoryType = (category: string) => {
  const typeMap: Record<string, string> = {
    probation: 'success',
    annual: 'warning',
    phase: 'info'
  }
  return typeMap[category] || 'info'
}

const getCategoryText = (category: string) => {
  const textMap: Record<string, string> = {
    probation: '转正评价',
    annual: '一年期评价',
    phase: '阶段评价'
  }
  return textMap[category] || category
}

const getStatusType = (status: string) => {
  const typeMap: Record<string, string> = {
    active: 'success',
    draft: 'info',
    inactive: 'danger'
  }
  return typeMap[status] || 'info'
}

const getStatusText = (status: string) => {
  const textMap: Record<string, string> = {
    active: '启用',
    draft: '草稿',
    inactive: '停用'
  }
  return textMap[status] || status
}

const formatDate = (date: Date) => {
  return date.toLocaleDateString('zh-CN')
}

const addStandard = () => {
  ElMessage.info('新建评价标准功能开发中...')
}

const viewStandard = (standard: any) => {
  ElMessage.info(`查看评价标准: ${standard.name}`)
}

const editStandard = (standard: any) => {
  ElMessage.info(`编辑评价标准: ${standard.name}`)
}

const handleAction = (command: string, standard: any) => {
  ElMessage.info(`执行操作: ${command} - ${standard.name}`)
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
  pagination.value.total = standards.value.length
})
</script>

<style scoped>
.evaluation-standards-management {
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

.standard-name .name {
  font-weight: 500;
  color: #303133;
  margin-bottom: 4px;
}

.standard-name .description {
  font-size: 12px;
  color: #909399;
}

.dimensions-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.dimension-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 2px 8px;
  background: #f5f7fa;
  border-radius: 4px;
  font-size: 12px;
}

.dimension-name {
  color: #606266;
}

.dimension-weight {
  color: #409eff;
  font-weight: 500;
}

.total-score {
  font-weight: 500;
  color: #67c23a;
}

.pass-score {
  font-weight: 500;
  color: #e6a23c;
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