<template>
  <div class="mentor-profile-tab">
    <!-- 统计概览 -->
    <div class="statistics-overview">
      <div class="stat-cards">
        <el-card class="stat-card">
          <div class="stat-content">
            <div class="stat-number">{{ totalMentors }}</div>
            <div class="stat-label">导师总数</div>
          </div>
          <div class="stat-icon">
            <el-icon size="24" color="#409eff"><User /></el-icon>
          </div>
        </el-card>
        
        <el-card class="stat-card">
          <div class="stat-content">
            <div class="stat-number">{{ activeMentors }}</div>
            <div class="stat-label">活跃导师</div>
          </div>
          <div class="stat-icon">
            <el-icon size="24" color="#67c23a"><UserFilled /></el-icon>
          </div>
        </el-card>
        
        <el-card class="stat-card">
          <div class="stat-content">
            <div class="stat-number">{{ averageRating.toFixed(1) }}</div>
            <div class="stat-label">平均评分</div>
          </div>
          <div class="stat-icon">
            <el-icon size="24" color="#e6a23c"><Star /></el-icon>
          </div>
        </el-card>
        
        <el-card class="stat-card">
          <div class="stat-content">
            <div class="stat-number">{{ totalRelationships }}</div>
            <div class="stat-label">师徒关系</div>
          </div>
          <div class="stat-icon">
            <el-icon size="24" color="#f56c6c"><Connection /></el-icon>
          </div>
        </el-card>
      </div>
    </div>

    <!-- 操作工具栏 -->
    <div class="toolbar">
      <div class="toolbar-left">
        <el-button type="primary" @click="showAddMentorDialog = true">
          <el-icon><Plus /></el-icon>
          添加导师
        </el-button>
        <el-button @click="exportMentorData">
          <el-icon><Download /></el-icon>
          导出数据
        </el-button>
      </div>
      <div class="toolbar-right">
        <el-select
          v-model="filterCertification"
          placeholder="认证类型"
          style="width: 150px; margin-right: 12px"
          clearable
        >
          <el-option label="全部" value="" />
          <el-option label="书院认证" value="academy_certified" />
          <el-option label="部门指定" value="department_assigned" />
        </el-select>
        
        <el-input
          v-model="searchKeyword"
          placeholder="搜索导师姓名或部门"
          style="width: 200px"
          clearable
        >
          <template #prefix>
            <el-icon><Search /></el-icon>
          </template>
        </el-input>
      </div>
    </div>

    <!-- 导师列表 -->
    <div class="mentor-list">
      <!-- 导师数据表格 -->
      <el-table
        :data="filteredMentors"
        v-loading="loading"
        style="width: 100%"
        border
        row-key="id"
        @row-click="handleViewMentorDetails"
      >
        <el-table-column label="导师信息" min-width="200">
          <template #default="{ row }">
            <div class="mentor-cell">
              <el-avatar :src="row.avatar" :size="40">
                {{ row.name.charAt(0) }}
              </el-avatar>
              <div class="mentor-info">
                <div class="name">{{ row.name }}</div>
                <div class="department">{{ row.department }} - {{ row.position }}</div>
                <el-tag
                  :type="getMentorTypeTag(row.id)"
                  size="small"
                  style="margin-top: 4px;"
                >
                  {{ getMentorTypeText(row.id) }}
                </el-tag>
              </div>
            </div>
          </template>
        </el-table-column>

        <el-table-column label="认证资质" min-width="180">
          <template #default="{ row }">
            <div class="certifications-cell">
              <el-tag
                v-for="cert in row.certifications.slice(0, 2)"
                :key="cert.id"
                :type="getCertificationType(cert.type)"
                size="small"
                style="margin-right: 4px; margin-bottom: 4px;"
              >
                {{ cert.name }}
              </el-tag>
              <span v-if="row.certifications.length > 2" class="more-text">
                +{{ row.certifications.length - 2 }}项
              </span>
              <span v-if="row.certifications.length === 0" class="no-data">暂无认证</span>
            </div>
          </template>
        </el-table-column>

        <el-table-column label="专业领域" min-width="180">
          <template #default="{ row }">
            <div class="expertise-cell">
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
              <span v-if="row.expertise.length === 0" class="no-data">未设置</span>
            </div>
          </template>
        </el-table-column>

        <el-table-column label="工作负载" width="140">
          <template #default="{ row }">
            <div class="workload-cell">
              <div class="load-info">
                <span class="current">{{ getCurrentLoad(row.id) }}</span>
                <span class="separator">/</span>
                <span class="max">{{ row.maxLoad }}</span>
              </div>
              <el-progress
                :percentage="getLoadPercentage(row.id)"
                :color="getLoadColor(row.id)"
                :stroke-width="6"
                :show-text="false"
                style="margin-top: 4px;"
              />
              <div class="load-status">
                <el-tag
                  :type="isOverloaded(row.id) ? 'danger' : 'success'"
                  size="small"
                >
                  {{ isOverloaded(row.id) ? '超载' : '正常' }}
                </el-tag>
              </div>
            </div>
          </template>
        </el-table-column>

        <el-table-column label="评分" width="120">
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

        <el-table-column label="可用性" width="100">
          <template #default="{ row }">
            <div class="availability-cell">
              <el-tag
                :type="row.status === 'active' ? 'success' : 'danger'"
                size="small"
              >
                {{ row.status === 'active' ? '可用' : '不可用' }}
              </el-tag>
              <div class="availability-info" v-if="row.status === 'active'">
                <span class="time-slots">{{ getAvailabilityText(row) }}</span>
              </div>
            </div>
          </template>
        </el-table-column>

        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button
              type="primary"
              size="small"
              @click.stop="handleViewMentorDetails(row)"
            >
              详情
            </el-button>
            <el-button
              type="warning"
              size="small"
              @click.stop="handleEditMentor(row)"
            >
              编辑
            </el-button>
            <el-dropdown @command="(cmd) => handleMentorAction(cmd, row)" @click.stop>
              <el-button size="small">
                更多<el-icon class="el-icon--right"><ArrowDown /></el-icon>
              </el-button>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item command="assign">指派学员</el-dropdown-item>
                  <el-dropdown-item command="workload">工作负载</el-dropdown-item>
                  <el-dropdown-item command="history">带教历史</el-dropdown-item>
                  <el-dropdown-item command="evaluation">评价记录</el-dropdown-item>
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

      <!-- 空状态 -->
      <div v-if="filteredMentors.length === 0 && !loading" class="empty-state">
        <el-empty description="没有找到匹配的导师">
          <el-button type="primary" @click="showAddMentorDialog = true">
            添加导师
          </el-button>
        </el-empty>
      </div>
    </div>

    <!-- 导师详情对话框 -->
    <el-dialog
      v-model="showDetailsDialog"
      title="导师详细信息"
      width="1000px"
      :close-on-click-modal="false"
    >
      <MentorDetailsDialog
        v-if="selectedMentor"
        :mentor="selectedMentor"
        :relationships="getMentorRelationships(selectedMentor.id)"
        :workload-data="getMentorWorkload(selectedMentor.id)"
        @close="showDetailsDialog = false"
      />
    </el-dialog>

    <!-- 添加导师对话框 -->
    <el-dialog
      v-model="showAddMentorDialog"
      title="添加项目导师"
      width="600px"
      :close-on-click-modal="false"
    >
      <AddMentorDialog
        :project-id="projectId"
        @submit="handleAddMentor"
        @cancel="showAddMentorDialog = false"
      />
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import {
  User,
  UserFilled,
  Star,
  Connection,
  Plus,
  Download,
  Search,
  ArrowDown
} from '@element-plus/icons-vue'
import type {
  MentorTabProps,
  Mentor,
  ProjectMentorRelationship,
  MentorWorkload
} from '../types/mentorship'
import MentorDetailsDialog from './dialogs/MentorDetailsDialog.vue'
import AddMentorDialog from './dialogs/AddMentorDialog.vue'

// Props
const props = defineProps<MentorTabProps>()

// 响应式数据
const searchKeyword = ref('')
const filterCertification = ref('')
const showDetailsDialog = ref(false)
const showAddMentorDialog = ref(false)
const selectedMentor = ref<Mentor | null>(null)

// 分页数据
const pagination = ref({
  page: 1,
  pageSize: 12,
  total: 0
})

// 计算属性
const filteredMentors = computed(() => {
  let filtered = props.mentors
  
  // 搜索关键词过滤
  if (searchKeyword.value) {
    const keyword = searchKeyword.value.toLowerCase()
    filtered = filtered.filter(mentor => 
      mentor.name.toLowerCase().includes(keyword) ||
      mentor.department.toLowerCase().includes(keyword)
    )
  }
  
  // 认证类型过滤
  if (filterCertification.value) {
    filtered = filtered.filter(mentor => {
      const hasAcademyCert = mentor.certifications.some(c => c.type === 'academy')
      return filterCertification.value === 'academy_certified' ? hasAcademyCert : !hasAcademyCert
    })
  }
  
  return filtered
})

const totalMentors = computed(() => props.mentors.length)

const activeMentors = computed(() => {
  return props.mentors.filter(mentor => 
    props.relationships.some(rel => 
      rel.mentorId === mentor.id && rel.status === 'active'
    )
  ).length
})

const averageRating = computed(() => {
  if (props.mentors.length === 0) return 0
  const totalRating = props.mentors.reduce((sum, mentor) => sum + mentor.rating, 0)
  return totalRating / props.mentors.length
})

const totalRelationships = computed(() => 
  props.relationships.filter(rel => rel.status === 'active').length
)

// 方法
const getCurrentLoad = (mentorId: string): number => {
  const workload = props.workloadData.find(w => w.mentorId === mentorId)
  return workload?.currentLoad || 0
}

const getLoadPercentage = (mentorId: string): number => {
  const mentor = props.mentors.find(m => m.id === mentorId)
  const currentLoad = getCurrentLoad(mentorId)
  if (!mentor || mentor.maxLoad === 0) return 0
  return Math.round((currentLoad / mentor.maxLoad) * 100)
}

const getLoadColor = (mentorId: string): string => {
  const percentage = getLoadPercentage(mentorId)
  if (percentage >= 90) return '#f56c6c'
  if (percentage >= 75) return '#e6a23c'
  return '#67c23a'
}

const isOverloaded = (mentorId: string): boolean => {
  return getLoadPercentage(mentorId) >= 100
}

const getCurrentStudentCount = (mentorId: string): number => {
  return props.relationships.filter(rel => 
    rel.mentorId === mentorId && rel.status === 'active'
  ).length
}

const getMentorTypeTag = (mentorId: string): string => {
  const relationships = props.relationships.filter(rel => rel.mentorId === mentorId)
  const hasAcademyCert = relationships.some(rel => rel.type === 'academy_certified')
  return hasAcademyCert ? 'success' : 'info'
}

const getMentorTypeText = (mentorId: string): string => {
  const relationships = props.relationships.filter(rel => rel.mentorId === mentorId)
  const hasAcademyCert = relationships.some(rel => rel.type === 'academy_certified')
  return hasAcademyCert ? '书院认证' : '部门指定'
}

const getCertificationType = (type: string): string => {
  const typeMap: Record<string, string> = {
    academy: 'success',
    internal: 'warning',
    professional: 'info'
  }
  return typeMap[type] || 'info'
}

const getMentorSuccessRate = (mentorId: string): number => {
  const workload = props.workloadData.find(w => w.mentorId === mentorId)
  return workload?.successRate || 0
}

const getAverageScore = (mentorId: string): number => {
  const workload = props.workloadData.find(w => w.mentorId === mentorId)
  return workload?.averageScore || 0
}

const getAvailabilityType = (mentorId: string): string => {
  const percentage = getLoadPercentage(mentorId)
  if (percentage >= 100) return 'danger'
  if (percentage >= 80) return 'warning'
  return 'success'
}

const getAvailabilityText = (mentor: Mentor): string => {
  const percentage = getLoadPercentage(mentor.id)
  if (percentage >= 100) return '已满载'
  if (percentage >= 80) return '接近满载'
  return '可接收学员'
}

const getMentorRelationships = (mentorId: string): ProjectMentorRelationship[] => {
  return props.relationships.filter(rel => rel.mentorId === mentorId)
}

const getMentorWorkload = (mentorId: string): MentorWorkload | undefined => {
  return props.workloadData.find(w => w.mentorId === mentorId)
}

// 事件处理
const handleViewMentorDetails = (mentor: Mentor) => {
  selectedMentor.value = mentor
  showDetailsDialog.value = true
}

const handleEditMentor = (mentor: Mentor) => {
  ElMessage.info(`编辑导师功能开发中: ${mentor.name}`)
}

const handleMentorAction = (command: string, row: Mentor) => {
  switch (command) {
    case 'assign':
      ElMessage.info(`指派学员给导师: ${row.name}`)
      break
    case 'workload':
      ElMessage.info(`查看工作负载: ${row.name}`)
      break
    case 'history':
      ElMessage.info(`查看带教历史: ${row.name}`)
      break
    case 'evaluation':
      ElMessage.info(`查看评价记录: ${row.name}`)
      break
    default:
      console.log('未知操作:', command)
  }
}

const handleAddMentor = (mentorData: any) => {
  console.log('添加导师:', mentorData)
  showAddMentorDialog.value = false
  emits('mentor-added', mentorData)
  ElMessage.success('导师添加成功！')
}

const exportMentorData = () => {
  ElMessage.info('导出功能开发中...')
}

const handleSizeChange = (size: number) => {
  pagination.value.pageSize = size
  pagination.value.page = 1
}

const handleCurrentChange = (page: number) => {
  pagination.value.page = page
}

// 事件定义
const emits = defineEmits<{
  'mentor-added': [data: any]
  'mentor-updated': [data: any]
}>()

// 生命周期
onMounted(() => {
  pagination.value.total = props.mentors.length
})
</script>

<style scoped>
.mentor-profile-tab {
  padding: 20px;
}

.statistics-overview {
  margin-bottom: 24px;
}

.stat-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
}

.stat-card {
  border-radius: 8px;
}

.stat-card :deep(.el-card__body) {
  padding: 20px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.stat-content {
  flex: 1;
}

.stat-number {
  font-size: 24px;
  font-weight: bold;
  color: #303133;
  margin-bottom: 4px;
}

.stat-label {
  font-size: 12px;
  color: #909399;
}

.stat-icon {
  opacity: 0.6;
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
}

.toolbar-right {
  display: flex;
  align-items: center;
}

.mentor-list {
  margin-top: 20px;
}

.mentor-cell {
  display: flex;
  align-items: center;
  gap: 12px;
}

.mentor-info {
  flex: 1;
}

.name {
  font-size: 14px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 2px;
}

.department {
  font-size: 12px;
  color: #606266;
  margin-bottom: 2px;
}

.certifications-cell {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.expertise-cell {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
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

.availability-cell {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.availability-info {
  font-size: 12px;
  color: #909399;
}

.time-slots {
  font-size: 12px;
  color: #606266;
}

.pagination-wrapper {
  display: flex;
  justify-content: center;
  margin-top: 20px;
}

.empty-state {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 200px;
}

:deep(.el-dropdown-menu__item) {
  font-size: 12px;
}
</style> 