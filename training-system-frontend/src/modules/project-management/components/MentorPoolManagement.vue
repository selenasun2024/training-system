<template>
  <div class="mentor-pool-management">
    <!-- 统计概览 -->
    <div class="pool-stats">
      <el-card class="stat-card">
        <el-statistic title="师傅总数" :value="mentorStats.total" />
        <div class="stat-detail">
          <span class="available">可用: {{ mentorStats.available }}</span>
        </div>
      </el-card>
      
      <el-card class="stat-card">
        <el-statistic title="专业领域" :value="mentorStats.domains" />
        <div class="stat-detail">
          <span>覆盖率: {{ mentorStats.coverage }}%</span>
        </div>
      </el-card>
      
      <el-card class="stat-card">
        <el-statistic title="平均评分" :value="mentorStats.averageRating" :precision="1" />
        <div class="stat-detail">
          <el-rate :model-value="mentorStats.averageRating" disabled size="small" />
        </div>
      </el-card>
      
      <el-card class="stat-card">
        <el-statistic title="本月新增" :value="mentorStats.newThisMonth" />
        <div class="stat-detail">
          <span class="trend-up">同比+{{ mentorStats.growthRate }}%</span>
        </div>
      </el-card>
    </div>

    <!-- 操作栏 -->
    <div class="action-bar">
      <div class="action-left">
        <el-button type="primary" @click="showAddDialog = true">
          <el-icon><Plus /></el-icon>
          添加师傅
        </el-button>
        <el-button @click="batchImport">
          <el-icon><Upload /></el-icon>
          批量导入
        </el-button>
        <el-button @click="exportData">
          <el-icon><Download /></el-icon>
          导出数据
        </el-button>
      </div>
      <div class="action-right">
        <el-input
          v-model="searchKeyword"
          placeholder="搜索师傅姓名、部门、技能"
          style="width: 300px"
          clearable
        >
          <template #prefix>
            <el-icon><Search /></el-icon>
          </template>
        </el-input>
      </div>
    </div>

    <!-- 筛选器 -->
    <div class="filter-section">
      <el-select v-model="filterStatus" placeholder="状态" clearable style="width: 120px">
        <el-option label="全部" value="" />
        <el-option label="可用" value="available" />
        <el-option label="忙碌" value="busy" />
        <el-option label="暂停" value="paused" />
      </el-select>
      
      <el-select v-model="filterDepartment" placeholder="部门" clearable style="width: 150px">
        <el-option label="全部" value="" />
        <el-option label="技术部" value="tech" />
        <el-option label="产品部" value="product" />
        <el-option label="运营部" value="operation" />
        <el-option label="人事部" value="hr" />
      </el-select>
      
      <el-select v-model="filterLevel" placeholder="级别" clearable style="width: 150px">
        <el-option label="全部" value="" />
        <el-option label="初级师傅" value="junior" />
        <el-option label="中级师傅" value="middle" />
        <el-option label="高级师傅" value="senior" />
        <el-option label="专家级" value="expert" />
      </el-select>
      
      <el-select v-model="filterSpecialty" placeholder="专业领域" clearable style="width: 150px">
        <el-option label="全部" value="" />
        <el-option label="前端开发" value="frontend" />
        <el-option label="后端开发" value="backend" />
        <el-option label="产品设计" value="product" />
        <el-option label="项目管理" value="pm" />
      </el-select>
    </div>

    <!-- 师傅列表 -->
    <div class="mentor-list">
      <div
        v-for="mentor in filteredMentors"
        :key="mentor.id"
        class="mentor-card"
        :class="{ 'selected': selectedMentor?.id === mentor.id }"
        @click="selectMentor(mentor)"
      >
        <div class="card-header">
          <div class="mentor-status">
            <el-tag :type="getStatusColor(mentor.status)">
              {{ getStatusText(mentor.status) }}
            </el-tag>
            <el-tag v-if="mentor.isRecommended" type="warning" size="small">
              推荐师傅
            </el-tag>
          </div>
          <div class="card-actions">
            <el-dropdown @command="(action) => handleMentorAction(action, mentor)">
              <el-button size="small" type="text">
                更多 <el-icon><ArrowDown /></el-icon>
              </el-button>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item command="view">查看详情</el-dropdown-item>
                  <el-dropdown-item command="edit">编辑信息</el-dropdown-item>
                  <el-dropdown-item command="history">带教历史</el-dropdown-item>
                  <el-dropdown-item command="evaluate">评价管理</el-dropdown-item>
                  <el-dropdown-item command="pause" v-if="mentor.status === 'available'">
                    暂停带教
                  </el-dropdown-item>
                  <el-dropdown-item command="activate" v-if="mentor.status === 'paused'">
                    恢复带教
                  </el-dropdown-item>
                  <el-dropdown-item command="delete" divided>删除师傅</el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </div>
        </div>

        <div class="mentor-content">
          <!-- 基本信息 -->
          <div class="mentor-info">
            <el-avatar :size="80" :src="mentor.avatar">
              {{ mentor.name[0] }}
            </el-avatar>
            <div class="info-details">
              <h3>{{ mentor.name }}</h3>
              <p class="title">{{ mentor.title }}</p>
              <p class="department">{{ mentor.department }}</p>
              <div class="mentor-rating">
                <el-rate :model-value="mentor.rating" disabled size="small" />
                <span class="rating-text">{{ mentor.rating }} ({{ mentor.evaluationCount }}评)</span>
              </div>
            </div>
          </div>

          <!-- 专业技能 -->
          <div class="mentor-skills">
            <h4>专业技能</h4>
            <div class="skill-tags">
              <el-tag
                v-for="skill in mentor.skills"
                :key="skill.name"
                :type="getSkillLevelColor(skill.level)"
                size="small"
              >
                {{ skill.name }} ({{ skill.level }})
              </el-tag>
            </div>
          </div>

          <!-- 带教数据 -->
          <div class="mentoring-data">
            <div class="data-item">
              <span class="label">工作经验:</span>
              <span class="value">{{ mentor.experience }}年</span>
            </div>
            <div class="data-item">
              <span class="label">带教经验:</span>
              <span class="value">{{ mentor.mentoringExperience }}年</span>
            </div>
            <div class="data-item">
              <span class="label">当前徒弟:</span>
              <span class="value">{{ mentor.currentMentees }}/{{ mentor.maxMentees }}人</span>
            </div>
            <div class="data-item">
              <span class="label">成功案例:</span>
              <span class="value">{{ mentor.successCases }}个</span>
            </div>
          </div>

          <!-- 可用时间 -->
          <div class="availability">
            <h4>可用时间</h4>
            <div class="time-slots">
              <span
                v-for="slot in mentor.availableTimeSlots"
                :key="slot"
                class="time-slot"
              >
                {{ slot }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 添加师傅对话框 -->
    <el-dialog
      v-model="showAddDialog"
      title="添加师傅"
      width="600px"
    >
      <el-form :model="mentorForm" label-width="100px">
        <el-form-item label="姓名" required>
          <el-input v-model="mentorForm.name" placeholder="请输入师傅姓名" />
        </el-form-item>
        <el-form-item label="职位" required>
          <el-input v-model="mentorForm.title" placeholder="请输入职位" />
        </el-form-item>
        <el-form-item label="部门" required>
          <el-select v-model="mentorForm.department" placeholder="请选择部门">
            <el-option label="技术部" value="tech" />
            <el-option label="产品部" value="product" />
            <el-option label="运营部" value="operation" />
            <el-option label="人事部" value="hr" />
          </el-select>
        </el-form-item>
        <el-form-item label="工作经验">
          <el-input-number v-model="mentorForm.experience" :min="0" />
          <span class="input-suffix">年</span>
        </el-form-item>
        <el-form-item label="带教经验">
          <el-input-number v-model="mentorForm.mentoringExperience" :min="0" />
          <span class="input-suffix">年</span>
        </el-form-item>
        <el-form-item label="专业技能">
          <el-input
            v-model="mentorForm.skillsText"
            type="textarea"
            placeholder="请输入专业技能，用逗号分隔"
          />
        </el-form-item>
        <el-form-item label="最大带教数">
          <el-input-number v-model="mentorForm.maxMentees" :min="1" :max="10" />
          <span class="input-suffix">人</span>
        </el-form-item>
      </el-form>
      
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="showAddDialog = false">取消</el-button>
          <el-button type="primary" @click="handleAddMentor">确定</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, reactive } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Plus, Upload, Download, Search, ArrowDown, Star
} from '@element-plus/icons-vue'

const emit = defineEmits<{
  (e: 'mentor-selected', mentor: any): void
}>()

// 状态管理
const showAddDialog = ref(false)
const selectedMentor = ref<any>(null)
const searchKeyword = ref('')
const filterStatus = ref('')
const filterDepartment = ref('')
const filterLevel = ref('')
const filterSpecialty = ref('')

// 表单数据
const mentorForm = reactive({
  name: '',
  title: '',
  department: '',
  experience: 0,
  mentoringExperience: 0,
  skillsText: '',
  maxMentees: 3
})

// 模拟师傅数据
const mentorList = ref([
  {
    id: 'mentor-1',
    name: '张资深',
    title: '高级架构师',
    department: '技术部',
    avatar: '',
    experience: 8,
    mentoringExperience: 5,
    rating: 4.8,
    evaluationCount: 25,
    status: 'available',
    isRecommended: true,
    currentMentees: 2,
    maxMentees: 4,
    successCases: 12,
    skills: [
      { name: 'Vue.js', level: 'expert' },
      { name: 'Node.js', level: 'advanced' },
      { name: '架构设计', level: 'expert' }
    ],
    availableTimeSlots: ['周一 14:00-16:00', '周三 10:00-12:00', '周五 15:00-17:00']
  },
  {
    id: 'mentor-2',
    name: '李专家',
    title: '产品总监',
    department: '产品部',
    avatar: '',
    experience: 10,
    mentoringExperience: 6,
    rating: 4.9,
    evaluationCount: 30,
    status: 'busy',
    isRecommended: true,
    currentMentees: 3,
    maxMentees: 3,
    successCases: 18,
    skills: [
      { name: '产品设计', level: 'expert' },
      { name: '用户研究', level: 'advanced' },
      { name: '商业分析', level: 'expert' }
    ],
    availableTimeSlots: ['周二 09:00-11:00', '周四 14:00-16:00']
  }
])

// 统计数据
const mentorStats = computed(() => {
  const total = mentorList.value.length
  const available = mentorList.value.filter(m => m.status === 'available').length
  const avgRating = mentorList.value.reduce((sum, m) => sum + m.rating, 0) / total
  const domains = new Set(mentorList.value.flatMap(m => m.skills.map(s => s.name))).size
  
  return {
    total,
    available,
    domains,
    coverage: 95,
    averageRating: avgRating,
    newThisMonth: 3,
    growthRate: 15
  }
})

// 筛选后的师傅列表
const filteredMentors = computed(() => {
  let filtered = mentorList.value

  if (filterStatus.value) {
    filtered = filtered.filter(m => m.status === filterStatus.value)
  }

  if (filterDepartment.value) {
    filtered = filtered.filter(m => m.department === filterDepartment.value)
  }

  if (searchKeyword.value) {
    const keyword = searchKeyword.value.toLowerCase()
    filtered = filtered.filter(m => 
      m.name.toLowerCase().includes(keyword) ||
      m.title.toLowerCase().includes(keyword) ||
      m.skills.some(s => s.name.toLowerCase().includes(keyword))
    )
  }

  return filtered
})

// 工具方法
const getStatusColor = (status: string) => {
  const colors = {
    available: 'success',
    busy: 'warning',
    paused: 'info'
  }
  return colors[status] || 'info'
}

const getStatusText = (status: string) => {
  const texts = {
    available: '可用',
    busy: '忙碌',
    paused: '暂停'
  }
  return texts[status] || status
}

const getSkillLevelColor = (level: string) => {
  const colors = {
    beginner: 'info',
    intermediate: 'warning',
    advanced: 'primary',
    expert: 'success'
  }
  return colors[level] || 'info'
}

// 操作方法
const selectMentor = (mentor: any) => {
  selectedMentor.value = mentor
  emit('mentor-selected', mentor)
}

const handleMentorAction = (action: string, mentor: any) => {
  switch (action) {
    case 'view':
      ElMessage.info(`查看 ${mentor.name} 的详情`)
      break
    case 'edit':
      ElMessage.info(`编辑 ${mentor.name} 的信息`)
      break
    case 'history':
      ElMessage.info(`查看 ${mentor.name} 的带教历史`)
      break
    case 'evaluate':
      ElMessage.info(`管理 ${mentor.name} 的评价`)
      break
    case 'pause':
      mentor.status = 'paused'
      ElMessage.success(`已暂停 ${mentor.name} 的带教`)
      break
    case 'activate':
      mentor.status = 'available'
      ElMessage.success(`已恢复 ${mentor.name} 的带教`)
      break
    case 'delete':
      ElMessageBox.confirm(`确定删除师傅 ${mentor.name}？`, '删除确认', {
        type: 'warning'
      }).then(() => {
        const index = mentorList.value.findIndex(m => m.id === mentor.id)
        if (index > -1) {
          mentorList.value.splice(index, 1)
          ElMessage.success('删除成功')
        }
      })
      break
  }
}

const handleAddMentor = () => {
  // 验证表单
  if (!mentorForm.name || !mentorForm.title || !mentorForm.department) {
    ElMessage.error('请填写必填项')
    return
  }

  // 处理技能
  const skills = mentorForm.skillsText.split(',').map(skill => ({
    name: skill.trim(),
    level: 'intermediate'
  }))

  // 添加新师傅
  const newMentor = {
    id: `mentor-${Date.now()}`,
    ...mentorForm,
    avatar: '',
    rating: 0,
    evaluationCount: 0,
    status: 'available',
    isRecommended: false,
    currentMentees: 0,
    successCases: 0,
    skills,
    availableTimeSlots: []
  }

  mentorList.value.push(newMentor)
  showAddDialog.value = false
  
  // 重置表单
  Object.assign(mentorForm, {
    name: '',
    title: '',
    department: '',
    experience: 0,
    mentoringExperience: 0,
    skillsText: '',
    maxMentees: 3
  })
  
  ElMessage.success('师傅添加成功')
}

const batchImport = () => {
  ElMessage.info('批量导入功能开发中...')
}

const exportData = () => {
  ElMessage.success('正在导出师傅库数据...')
}
</script>

<style scoped>
.mentor-pool-management {
  padding: 20px;
}

.pool-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
  margin-bottom: 20px;
}

.stat-card {
  text-align: center;
}

.stat-detail {
  margin-top: 8px;
  font-size: 12px;
  color: #666;
}

.available {
  color: #67c23a;
}

.trend-up {
  color: #67c23a;
}

.action-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.action-left {
  display: flex;
  gap: 12px;
}

.filter-section {
  display: flex;
  gap: 12px;
  margin-bottom: 20px;
}

.mentor-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(500px, 1fr));
  gap: 20px;
}

.mentor-card {
  border: 1px solid #e8e8e8;
  border-radius: 8px;
  padding: 20px;
  background: #fff;
  cursor: pointer;
  transition: all 0.3s;
}

.mentor-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.mentor-card.selected {
  border-color: #409eff;
  box-shadow: 0 0 8px rgba(64, 158, 255, 0.3);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.mentor-status {
  display: flex;
  gap: 8px;
}

.mentor-content {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.mentor-info {
  display: flex;
  gap: 16px;
  align-items: center;
}

.info-details h3 {
  margin: 0 0 4px 0;
  font-size: 18px;
  color: #333;
}

.info-details p {
  margin: 2px 0;
  color: #666;
  font-size: 14px;
}

.mentor-rating {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 8px;
}

.rating-text {
  font-size: 12px;
  color: #666;
}

.mentor-skills h4 {
  margin: 0 0 8px 0;
  font-size: 14px;
  color: #333;
}

.skill-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.mentoring-data {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8px;
}

.data-item {
  display: flex;
  justify-content: space-between;
  font-size: 13px;
}

.data-item .label {
  color: #666;
}

.data-item .value {
  color: #333;
  font-weight: 500;
}

.availability h4 {
  margin: 0 0 8px 0;
  font-size: 14px;
  color: #333;
}

.time-slots {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.time-slot {
  padding: 2px 8px;
  background: #f0f9ff;
  border: 1px solid #e1f5fe;
  border-radius: 4px;
  font-size: 12px;
  color: #01579b;
}

.input-suffix {
  margin-left: 8px;
  color: #666;
  font-size: 14px;
}
</style> 