<template>
  <!-- 带教老师列表 -->
  <div class="mentor-tab">
    <div class="mentor-header">
      <div class="header-left">
        <h4>项目带教老师</h4>
        <el-button type="primary" :icon="Plus" @click="handleAddMentor">
          添加带教老师
        </el-button>
      </div>
    </div>
    <el-table :data="mentors" stripe style="width: 100%">
      <el-table-column label="带教老师信息" min-width="200">
        <template #default="{ row }">
          <div class="mentor-info">
            <div class="name">{{ row.name }}</div>
            <div class="department">{{ row.department }} | {{ row.position }}</div>
            <div class="expertise" v-if="row.expertise">
              <el-tag
                v-for="skill in row.expertise"
                :key="skill"
                size="small"
                style="margin-right: 4px; margin-top: 4px;"
              >
                {{ skill }}
              </el-tag>
            </div>
          </div>
        </template>
      </el-table-column>
      
      <el-table-column prop="level" label="级别" width="80">
        <template #default="{ row }">
          <el-tag :type="getLevelType(row.level)" size="small">
            {{ getLevelText(row.level) }}
          </el-tag>
        </template>
      </el-table-column>
      
      <el-table-column prop="studentCount" label="学员数" width="80" align="center" />
      
      <el-table-column prop="status" label="状态" width="80">
        <template #default="{ row }">
          <el-tag 
            :type="row.status === 'active' ? 'success' : 'info'" 
            size="small"
          >
            {{ row.status === 'active' ? '在岗' : '离职' }}
          </el-tag>
        </template>
      </el-table-column>
      
      <el-table-column label="操作" width="150" align="center">
        <template #default="{ row }">
          <el-button 
            type="primary" 
            link 
            size="small"
            @click="handleViewDetails(row)"
          >
            查看详情
          </el-button>
          <el-button 
            type="primary" 
            link 
            size="small"
            @click="handleEdit(row)"
          >
            编辑
          </el-button>
        </template>
      </el-table-column>
      
      <template #empty>
        <el-empty description="当前项目暂无带教老师">
          <el-button type="primary" @click="handleAddMentor">
            添加带教老师
          </el-button>
        </el-empty>
      </template>
    </el-table>

    <!-- 添加带教老师对话框 - 临时占位 -->
    <el-dialog
      v-model="addDialogVisible"
      title="添加项目带教老师"
      width="600px"
    >
      <p>添加带教老师功能开发中...</p>
      <template #footer>
        <el-button @click="addDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="addDialogVisible = false">确定</el-button>
      </template>
    </el-dialog>

    <!-- 带教老师详情对话框 - 临时占位 -->
    <el-dialog
      v-model="detailDialogVisible"
      title="带教老师详情"
      width="600px"
    >
      <p>带教老师详情功能开发中...</p>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { ElMessage } from 'element-plus'
import { ArrowDown, Plus } from '@element-plus/icons-vue'
import type { Mentor, ProjectMentorRelationship } from '../types/mentorship'
// import SimpleAddMentorForm from './dialogs/SimpleAddMentorForm.vue'
// import SimpleMentorDetails from './dialogs/SimpleMentorDetails.vue'

// Props
const props = defineProps<{
  projectId?: string
  mentors?: Mentor[]
  relationships?: ProjectMentorRelationship[]
}>()

// 响应式数据
const addDialogVisible = ref(false)
const detailDialogVisible = ref(false)

// 计算属性 - 项目带教老师
const mentors = computed(() => {
  return props.mentors || []
})

// 带教老师级别相关方法
const getLevelType = (level: string) => {
  const typeMap: Record<string, string> = {
    'senior': 'warning',
    'expert': 'success',
    'gold': 'danger'
  }
  return typeMap[level] || 'info'
}

const getLevelText = (level: string) => {
  const textMap: Record<string, string> = {
    'senior': '高级',
    'expert': '专家',
    'gold': '金牌'
  }
  return textMap[level] || '普通'
}

// 处理方法
const handleAddMentor = () => {
  const mentorData = {
    name: '新带教老师',
    department: '示例部门',
    position: '高级工程师'
  }
  
  console.log('添加带教老师:', mentorData)
  addDialogVisible.value = true
  
  ElMessage.success('带教老师添加成功！')
}

const handleViewDetails = (mentor: Mentor) => {
  console.log('查看带教老师详情:', mentor)
  detailDialogVisible.value = true
}

const handleEdit = (mentor: Mentor) => {
  ElMessage.info(`编辑带教老师信息: ${mentor.name}`)
}

const handleMentorAction = (command: string, mentor: Mentor) => {
  switch (command) {
    case 'assign':
      ElMessage.info(`为 ${mentor.name} 指派学员`)
      break
    case 'history':
      ElMessage.info(`查看 ${mentor.name} 的带教历史`)
      break
    case 'evaluation':
      ElMessage.info(`查看 ${mentor.name} 的评价记录`)
      break
  }
}

// 事件定义
const emits = defineEmits<{
  'mentor-added': [data: any]
}>()
</script>

<style scoped>
.project-mentor-tab {
  padding: 20px;
}

.list-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.list-header h4 {
  margin: 0;
  color: #303133;
  font-size: 16px;
}

.mentor-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 20px;
}

.mentor-card {
  border-radius: 8px;
}

.mentor-card :deep(.el-card__body) {
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.mentor-header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding-bottom: 12px;
  border-bottom: 1px solid #f0f0f0;
}

.mentor-basic {
  flex: 1;
}

.mentor-name {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 4px;
}

.mentor-department {
  font-size: 13px;
  color: #606266;
  margin-bottom: 2px;
}

.mentor-position {
  font-size: 12px;
  color: #909399;
}

.section-title {
  font-size: 12px;
  font-weight: 500;
  color: #606266;
  margin-bottom: 8px;
}

.mentor-skills {
  
}

.skills-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  align-items: center;
}

.skill-tag {
  margin-bottom: 4px;
}

.more-skills {
  font-size: 11px;
  color: #909399;
}

.mentoring-status {
  
}

.status-content {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.students-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.student-count {
  font-weight: 500;
  color: #409eff;
  font-size: 14px;
}

.student-list {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.student-name {
  font-size: 11px;
  color: #606266;
  background: #f0f9ff;
  padding: 2px 6px;
  border-radius: 4px;
}

.workload-info {
  width: 100%;
}

.mentor-rating {
  
}

.rating-content {
  display: flex;
  align-items: center;
  gap: 8px;
}

.rating-text {
  font-size: 12px;
  color: #606266;
  font-weight: 500;
}

.availability {
  
}

.availability-info {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.time-info {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  align-items: center;
}

.more-days {
  font-size: 11px;
  color: #909399;
}

.status-info {
  align-self: flex-start;
}

.mentor-actions {
  display: flex;
  gap: 8px;
  padding-top: 12px;
  border-top: 1px solid #f0f0f0;
}

.empty-state {
  padding: 40px;
  text-align: center;
}

:deep(.el-card):hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

:deep(.el-progress) {
  line-height: 1;
}

:deep(.el-progress__text) {
  font-size: 12px !important;
}
</style> 