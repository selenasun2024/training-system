<template>
  <div class="student-management">
    <div class="page-header">
      <h1>学员管理</h1>
      <p>管理培训系统中的所有学员信息</p>
    </div>
    
    <div class="content-area">
      <!-- 搜索和筛选区域 -->
      <div class="search-section">
        <el-card>
          <el-form :model="searchForm" inline>
            <el-form-item label="学员姓名">
              <el-input 
                v-model="searchForm.name" 
                placeholder="请输入学员姓名"
                clearable
              />
            </el-form-item>
            <el-form-item label="部门">
              <el-select 
                v-model="searchForm.department" 
                placeholder="请选择部门"
                clearable
              >
                <el-option label="技术部" value="技术部" />
                <el-option label="市场部" value="市场部" />
                <el-option label="人事部" value="人事部" />
                <el-option label="财务部" value="财务部" />
              </el-select>
            </el-form-item>
            <el-form-item label="状态">
              <el-select 
                v-model="searchForm.status" 
                placeholder="请选择状态"
                clearable
              >
                <el-option label="在职" value="在职" />
                <el-option label="离职" value="离职" />
                <el-option label="实习" value="实习" />
              </el-select>
            </el-form-item>
            <el-form-item>
              <el-button type="primary" @click="handleSearch">
                <el-icon><Search /></el-icon>
                搜索
              </el-button>
              <el-button @click="handleReset">
                <el-icon><Refresh /></el-icon>
                重置
              </el-button>
            </el-form-item>
          </el-form>
        </el-card>
      </div>

      <!-- 学员列表区域 -->
      <div class="list-section">
        <el-card>
          <template #header>
            <div class="card-header">
              <span>学员列表</span>
              <el-button type="primary" @click="handleAddStudent">
                <el-icon><Plus /></el-icon>
                添加学员
              </el-button>
            </div>
          </template>
          
          <el-table :data="studentList" stripe>
            <el-table-column prop="id" label="ID" width="80" />
            <el-table-column prop="name" label="姓名" width="120" />
            <el-table-column prop="department" label="部门" width="120" />
            <el-table-column prop="position" label="职位" width="120" />
            <el-table-column prop="email" label="邮箱" />
            <el-table-column prop="phone" label="电话" width="130" />
            <el-table-column prop="status" label="状态" width="100">
              <template #default="{ row }">
                <el-tag :type="getStatusType(row.status)">
                  {{ row.status }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="joinDate" label="入职日期" width="120" />
            <el-table-column label="操作" width="200" fixed="right">
              <template #default="{ row }">
                <el-button size="small" @click="handleEdit(row)">编辑</el-button>
                <el-button size="small" type="danger" @click="handleDelete(row)">删除</el-button>
              </template>
            </el-table-column>
          </el-table>
          
          <div class="pagination-wrapper">
            <el-pagination
              v-model:current-page="pagination.currentPage"
              v-model:page-size="pagination.pageSize"
              :total="pagination.total"
              :page-sizes="[10, 20, 50, 100]"
              layout="total, sizes, prev, pager, next, jumper"
              @size-change="handleSizeChange"
              @current-change="handleCurrentChange"
            />
          </div>
        </el-card>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { Search, Refresh, Plus } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'

// 搜索表单
const searchForm = reactive({
  name: '',
  department: '',
  status: ''
})

// 分页信息
const pagination = reactive({
  currentPage: 1,
  pageSize: 20,
  total: 0
})

// 模拟学员数据
const studentList = ref([
  {
    id: 1,
    name: '张三',
    department: '技术部',
    position: '前端工程师',
    email: 'zhangsan@company.com',
    phone: '13800138001',
    status: '在职',
    joinDate: '2023-01-15'
  },
  {
    id: 2,
    name: '李四',
    department: '市场部',
    position: '市场专员',
    email: 'lisi@company.com',
    phone: '13800138002',
    status: '在职',
    joinDate: '2023-03-20'
  },
  {
    id: 3,
    name: '王五',
    department: '人事部',
    position: 'HR专员',
    email: 'wangwu@company.com',
    phone: '13800138003',
    status: '实习',
    joinDate: '2024-06-01'
  }
])

// 获取状态标签类型
const getStatusType = (status: string) => {
  switch (status) {
    case '在职':
      return 'success'
    case '离职':
      return 'danger'
    case '实习':
      return 'warning'
    default:
      return 'info'
  }
}

// 搜索处理
const handleSearch = () => {
  console.log('搜索条件:', searchForm)
  // TODO: 实现搜索逻辑
  ElMessage.success('搜索功能待实现')
}

// 重置搜索
const handleReset = () => {
  searchForm.name = ''
  searchForm.department = ''
  searchForm.status = ''
}

// 添加学员
const handleAddStudent = () => {
  ElMessage.info('添加学员功能待实现')
}

// 编辑学员
const handleEdit = (row: any) => {
  console.log('编辑学员:', row)
  ElMessage.info('编辑功能待实现')
}

// 删除学员
const handleDelete = (row: any) => {
  ElMessageBox.confirm(
    `确定要删除学员 ${row.name} 吗？`,
    '确认删除',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    }
  ).then(() => {
    ElMessage.success('删除成功')
  }).catch(() => {
    ElMessage.info('已取消删除')
  })
}

// 分页处理
const handleSizeChange = (size: number) => {
  pagination.pageSize = size
  // TODO: 重新加载数据
}

const handleCurrentChange = (page: number) => {
  pagination.currentPage = page
  // TODO: 重新加载数据
}
</script>

<style scoped>
.student-management {
  padding: 24px;
}

.page-header {
  margin-bottom: 24px;
}

.page-header h1 {
  margin: 0 0 8px 0;
  font-size: 24px;
  font-weight: 600;
  color: #1f2937;
}

.page-header p {
  margin: 0;
  color: #6b7280;
  font-size: 14px;
}

.content-area {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.search-section {
  margin-bottom: 16px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.list-section {
  flex: 1;
}

.pagination-wrapper {
  margin-top: 20px;
  display: flex;
  justify-content: center;
}
</style> 