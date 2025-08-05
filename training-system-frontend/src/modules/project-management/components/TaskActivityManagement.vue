<template>
  <div class="task-activity-management">
    <!-- 页面头部信息 -->
    <div class="page-header">
      <div class="header-left">
        <div class="header-title">
          <el-button 
            type="text" 
            @click="goBack"
            class="back-button"
          >
            <el-icon><ArrowLeft /></el-icon>
          </el-button>
          <h3>{{ task?.name || '活动管理' }}</h3>
        </div>
        <div class="task-meta">
          <span class="meta-item">
            <el-icon><Calendar /></el-icon>
            活动时间：{{ formatTimeRange(task?.config?.startTime, task?.config?.endTime) }}
          </span>
          <span class="meta-item">
            <el-icon><LocationFilled /></el-icon>
            活动地点：{{ task?.config?.location || '未设置' }}
          </span>
          <span class="meta-item">
            <el-icon><UserFilled /></el-icon>
            参与人数：{{ studentList.length }}人
          </span>
          <span class="meta-item">
            <el-icon><Star /></el-icon>
            活动类型：{{ task?.config?.activityType || '团队活动' }}
          </span>
        </div>
      </div>
      <div class="header-actions">
        <el-button type="primary" @click="addActivityRecord">
          <el-icon><Plus /></el-icon>
          添加活动记录
        </el-button>
        <el-button @click="exportData">
          <el-icon><Download /></el-icon>
          导出数据
        </el-button>
        <el-button @click="refreshData">
          <el-icon><Refresh /></el-icon>
          刷新
        </el-button>
      </div>
    </div>

    <!-- 统计卡片 -->
    <div class="stats-cards">
      <el-card class="stats-card">
        <div class="stats-content">
          <div class="stats-number">{{ participationStats.participated }}</div>
          <div class="stats-label">已参与</div>
        </div>
      </el-card>
      <el-card class="stats-card">
        <div class="stats-content">
          <div class="stats-number">{{ participationStats.excellent }}</div>
          <div class="stats-label">表现优秀</div>
        </div>
      </el-card>
      <el-card class="stats-card">
        <div class="stats-content">
          <div class="stats-number">{{ participationStats.absent }}</div>
          <div class="stats-label">未参与</div>
        </div>
      </el-card>
      <el-card class="stats-card">
        <div class="stats-content">
          <div class="stats-number">{{ participationRate }}%</div>
          <div class="stats-label">参与率</div>
        </div>
      </el-card>
    </div>

    <!-- Tab切换：参与情况 和 活动记录 -->
    <el-tabs v-model="activeTab" class="activity-tabs">
      <!-- 参与情况Tab -->
      <el-tab-pane label="参与情况" name="participation">
        <!-- 筛选控制 -->
        <div class="filter-section">
          <div class="filter-left">
            <el-select v-model="statusFilter" placeholder="筛选状态" clearable style="width: 120px">
              <el-option label="全部" value="" />
              <el-option label="已参与" value="participated" />
              <el-option label="表现优秀" value="excellent" />
              <el-option label="未参与" value="absent" />
            </el-select>
          </div>
          <div class="filter-right">
            <el-input
              v-model="searchKeyword"
              placeholder="搜索学员姓名"
              style="width: 200px"
              clearable
            >
              <template #prefix>
                <el-icon><Search /></el-icon>
              </template>
            </el-input>
          </div>
        </div>

        <!-- 参与情况表格 -->
        <el-card shadow="never" class="table-card">
          <el-table
            :data="filteredStudentList"
            stripe
            border
            style="width: 100%"
          >
            <el-table-column type="index" label="序号" width="60" align="center" />
            <el-table-column prop="name" label="姓名" width="100" />
            <el-table-column prop="studentId" label="学号" width="120" />
            <el-table-column prop="department" label="所在部门" width="150" />
            <el-table-column prop="position" label="职位" width="120" />
            <el-table-column label="参与状态" width="120" align="center">
              <template #default="{ row }">
                <el-tag :type="getStatusTagType(row.participationStatus)">
                  {{ getStatusText(row.participationStatus) }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="表现评价" width="120" align="center">
              <template #default="{ row }">
                <el-rate 
                  v-model="row.performance" 
                  :max="5" 
                  show-score 
                  text-color="#ff9900"
                  @change="updatePerformance(row)"
                  :disabled="row.participationStatus === 'absent'"
                />
              </template>
            </el-table-column>
            <el-table-column label="活动贡献" min-width="150">
              <template #default="{ row }">
                <span v-if="row.contribution">{{ row.contribution }}</span>
                <span v-else class="text-muted">--</span>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="150" align="center" fixed="right">
              <template #default="{ row }">
                <el-button
                  size="small"
                  type="primary"
                  @click="editParticipation(row)"
                >
                  编辑参与
                </el-button>
                <el-button
                  size="small"
                  type="text"
                  @click="viewDetail(row)"
                >
                  查看详情
                </el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-tab-pane>

      <!-- 活动记录Tab -->
      <el-tab-pane label="活动记录" name="records">
        <div class="records-section">
          <div class="records-list">
            <div 
              v-for="record in activityRecords" 
              :key="record.id"
              class="record-item"
            >
              <div class="record-header">
                <div class="record-info">
                  <h4>{{ record.title }}</h4>
                  <div class="record-meta">
                    <span class="meta-item">
                      <el-icon><Clock /></el-icon>
                      {{ formatDateTime(record.recordTime) }}
                    </span>
                    <span class="meta-item">
                      <el-icon><User /></el-icon>
                      记录人：{{ record.recorder }}
                    </span>
                  </div>
                </div>
                <div class="record-actions">
                  <el-button size="small" type="text" @click="editRecord(record)">编辑</el-button>
                  <el-button size="small" type="text" @click="deleteRecord(record)">删除</el-button>
                </div>
              </div>
              <div class="record-content">
                <p>{{ record.content }}</p>
                <div v-if="record.images?.length" class="record-images">
                  <img 
                    v-for="(image, index) in record.images" 
                    :key="index"
                    :src="image.url" 
                    :alt="image.name"
                    class="record-image"
                    @click="previewImage(image)"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </el-tab-pane>
    </el-tabs>

    <!-- 编辑参与对话框 -->
    <el-dialog
      v-model="showEditParticipation"
      title="编辑参与情况"
      width="500px"
    >
      <el-form :model="participationForm" label-width="100px">
        <el-form-item label="学员姓名">
          <el-input :value="selectedStudent?.name" disabled />
        </el-form-item>
        <el-form-item label="参与状态">
          <el-radio-group v-model="participationForm.status">
            <el-radio label="participated">已参与</el-radio>
            <el-radio label="excellent">表现优秀</el-radio>
            <el-radio label="absent">未参与</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="表现评价">
          <el-rate 
            v-model="participationForm.performance" 
            :max="5" 
            show-score 
            text-color="#ff9900"
          />
        </el-form-item>
        <el-form-item label="活动贡献">
          <el-input
            v-model="participationForm.contribution"
            type="textarea"
            placeholder="请描述该学员在活动中的具体贡献"
            :rows="3"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showEditParticipation = false">取消</el-button>
        <el-button type="primary" @click="confirmEditParticipation">保存</el-button>
      </template>
    </el-dialog>

    <!-- 添加活动记录对话框 -->
    <el-dialog
      v-model="showAddRecord"
      title="添加活动记录"
      width="600px"
    >
      <el-form :model="recordForm" label-width="80px">
        <el-form-item label="记录标题">
          <el-input v-model="recordForm.title" placeholder="请输入记录标题" />
        </el-form-item>
        <el-form-item label="记录内容">
          <el-input
            v-model="recordForm.content"
            type="textarea"
            placeholder="请详细描述活动过程和重要事件"
            :rows="4"
          />
        </el-form-item>
        <el-form-item label="记录时间">
          <el-date-picker
            v-model="recordForm.recordTime"
            type="datetime"
            placeholder="选择记录时间"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="上传图片">
          <el-upload
            v-model:file-list="recordForm.images"
            action="#"
            list-type="picture-card"
            :auto-upload="false"
            :limit="6"
          >
            <el-icon><Plus /></el-icon>
          </el-upload>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showAddRecord = false">取消</el-button>
        <el-button type="primary" @click="confirmAddRecord">保存记录</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Calendar, LocationFilled, UserFilled, Star, Plus, Download, Refresh, 
  Search, Clock, User, ArrowLeft
} from '@element-plus/icons-vue'

interface Props {
  task?: any
  visible?: boolean
}

const props = defineProps<Props>()

// 定义事件
const emit = defineEmits<{
  'back-to-tasks': []
}>()

// 状态管理
const activeTab = ref('participation')
const statusFilter = ref('')
const searchKeyword = ref('')
const showEditParticipation = ref(false)
const showAddRecord = ref(false)
const selectedStudent = ref<any>(null)

// 表单数据
const participationForm = ref({
  status: 'participated',
  performance: 3,
  contribution: ''
})

const recordForm = ref({
  title: '',
  content: '',
  recordTime: new Date(),
  images: []
})

// 模拟学员数据
const studentList = ref([
  {
    id: '1',
    name: '张三',
    studentId: '00242',
    department: 'MBA(31期)>人员赋权管理组>测试1组',
    position: '正式',
    participationStatus: 'excellent',
    performance: 5,
    contribution: '积极组织团队活动，协调团队合作，表现突出'
  },
  {
    id: '2',
    name: '李四',
    studentId: '00243',
    department: 'MBA(31期)>人员赋权管理组>测试2组',
    position: '正式',
    participationStatus: 'participated',
    performance: 4,
    contribution: '参与度高，配合度好'
  },
  {
    id: '3',
    name: '王五',
    studentId: '00244',
    department: 'MBA(31期)>人员赋权管理组>测试1组',
    position: '正式',
    participationStatus: 'absent',
    performance: 0,
    contribution: ''
  },
  {
    id: '4',
    name: '赵六',
    studentId: '00245',
    department: 'MBA(31期)>人员赋权管理组>测试3组',
    position: '正式',
    participationStatus: 'participated',
    performance: 3,
    contribution: '能够按要求完成活动任务'
  },
  {
    id: '5',
    name: '钱七',
    studentId: '00246',
    department: 'MBA(31期)>人员赋权管理组>测试2组',
    position: '正式',
    participationStatus: 'excellent',
    performance: 5,
    contribution: '创意十足，为活动提供了很多有价值的建议'
  }
])

// 模拟活动记录数据
const activityRecords = ref([
  {
    id: '1',
    title: '团队破冰活动',
    content: '活动开始，全体成员进行自我介绍和团队破冰游戏。通过"两个真相一个谎言"游戏，大家迅速熟悉起来，现场气氛活跃。',
    recordTime: '2025-07-18 09:30',
    recorder: '教务管理员',
    images: [
      { name: '破冰游戏1.jpg', url: 'https://via.placeholder.com/150' },
      { name: '团队合影.jpg', url: 'https://via.placeholder.com/150' }
    ]
  },
  {
    id: '2',
    title: '问题解决环节',
    content: '分组讨论实际工作中遇到的挑战，每组派代表分享解决方案。张三和钱七的小组提出了创新的解决思路，获得了大家的认可。',
    recordTime: '2025-07-18 10:45',
    recorder: '教务管理员',
    images: [
      { name: '讨论现场.jpg', url: 'https://via.placeholder.com/150' }
    ]
  }
])

// 计算属性
const participationStats = computed(() => {
  const participated = studentList.value.filter(s => s.participationStatus === 'participated').length
  const excellent = studentList.value.filter(s => s.participationStatus === 'excellent').length
  const absent = studentList.value.filter(s => s.participationStatus === 'absent').length
  
  return { participated, excellent, absent }
})

const participationRate = computed(() => {
  const total = studentList.value.length
  const participated = participationStats.value.participated + participationStats.value.excellent
  return total > 0 ? Math.round((participated / total) * 100) : 0
})

const filteredStudentList = computed(() => {
  let filtered = studentList.value

  // 状态筛选
  if (statusFilter.value) {
    filtered = filtered.filter(student => student.participationStatus === statusFilter.value)
  }

  // 姓名搜索
  if (searchKeyword.value) {
    const keyword = searchKeyword.value.toLowerCase()
    filtered = filtered.filter(student => 
      student.name.toLowerCase().includes(keyword) ||
      student.studentId.includes(keyword)
    )
  }

  return filtered
})

// 工具方法
const getStatusTagType = (status: string) => {
  const types = {
    participated: 'primary',
    excellent: 'success',
    absent: 'danger'
  }
  return types[status] || 'info'
}

const getStatusText = (status: string) => {
  const texts = {
    participated: '已参与',
    excellent: '表现优秀',
    absent: '未参与'
  }
  return texts[status] || status
}

const formatTimeRange = (startTime?: string, endTime?: string) => {
  if (!startTime || !endTime) return '2025-07-18 09:00 至 2025-07-18 12:00'
  
  const start = new Date(startTime)
  const end = new Date(endTime)
  
  return `${start.toLocaleString()} 至 ${end.toLocaleString()}`
}

const formatDateTime = (dateString: string) => {
  if (!dateString) return '--'
  return dateString
}

// 操作方法
const editParticipation = (student: any) => {
  selectedStudent.value = student
  participationForm.value = {
    status: student.participationStatus,
    performance: student.performance,
    contribution: student.contribution || ''
  }
  showEditParticipation.value = true
}

const confirmEditParticipation = () => {
  if (selectedStudent.value) {
    selectedStudent.value.participationStatus = participationForm.value.status
    selectedStudent.value.performance = participationForm.value.performance
    selectedStudent.value.contribution = participationForm.value.contribution
    
    ElMessage.success(`${selectedStudent.value.name} 的参与情况更新成功`)
    showEditParticipation.value = false
  }
}

const updatePerformance = (student: any) => {
  ElMessage.success(`${student.name} 的表现评价已更新`)
}

const viewDetail = (student: any) => {
  ElMessage.info(`查看 ${student.name} 的活动详情`)
}

const addActivityRecord = () => {
  recordForm.value = {
    title: '',
    content: '',
    recordTime: new Date(),
    images: []
  }
  showAddRecord.value = true
}

const confirmAddRecord = () => {
  const newRecord = {
    id: Date.now().toString(),
    title: recordForm.value.title,
    content: recordForm.value.content,
    recordTime: recordForm.value.recordTime.toLocaleString(),
    recorder: '教务管理员',
    images: recordForm.value.images
  }
  
  activityRecords.value.unshift(newRecord)
  ElMessage.success('活动记录添加成功')
  showAddRecord.value = false
}

const editRecord = (record: any) => {
  ElMessage.info(`编辑记录：${record.title}`)
}

const deleteRecord = (record: any) => {
  ElMessageBox.confirm(`确定删除记录"${record.title}"吗？`, '删除确认', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    const index = activityRecords.value.findIndex(r => r.id === record.id)
    if (index > -1) {
      activityRecords.value.splice(index, 1)
      ElMessage.success('记录已删除')
    }
  })
}

const previewImage = (image: any) => {
  ElMessage.info(`预览图片：${image.name}`)
}

const exportData = () => {
  ElMessage.success('正在导出活动数据...')
}

const refreshData = () => {
  ElMessage.success('数据已刷新')
}

// 返回功能
const goBack = () => {
  emit('back-to-tasks')
}

// 生命周期
onMounted(() => {
  console.log('活动任务管理界面已加载，任务信息:', props.task)
})
</script>

<style scoped>
.task-activity-management {
  padding: 16px;
  background: #f5f7fa;
  min-height: calc(100vh - 100px);
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 16px;
  padding: 16px;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.header-title {
  display: flex;
  align-items: center;
  gap: 8px;
}

.back-button {
  font-size: 16px;
  color: #409eff;
  padding: 4px 8px;
}

.back-button:hover {
  background-color: #e6f7ff;
}

.header-left h3 {
  margin: 0 0 8px 0;
  font-size: 18px;
  color: #333;
}

.task-meta {
  display: flex;
  gap: 20px;
  font-size: 14px;
  color: #666;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 4px;
}

.header-actions {
  display: flex;
  gap: 8px;
}

.stats-cards {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  margin-bottom: 16px;
}

.stats-card {
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.stats-content {
  text-align: center;
  padding: 8px 0;
}

.stats-number {
  font-size: 24px;
  font-weight: bold;
  color: #409eff;
  margin-bottom: 4px;
}

.stats-label {
  font-size: 14px;
  color: #666;
}

.activity-tabs {
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  padding: 16px;
}

.filter-section {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding: 12px 16px;
  background: #f8f9fa;
  border-radius: 8px;
}

.table-card {
  box-shadow: none;
  border: 1px solid #eee;
}

.text-muted {
  color: #999;
}

.records-section {
  max-height: 600px;
  overflow-y: auto;
}

.record-item {
  margin-bottom: 16px;
  padding: 16px;
  background: #f8f9fa;
  border-radius: 8px;
  border: 1px solid #eee;
}

.record-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 12px;
}

.record-info h4 {
  margin: 0 0 8px 0;
  font-size: 16px;
  color: #333;
}

.record-meta {
  display: flex;
  gap: 16px;
  font-size: 14px;
  color: #666;
}

.record-actions {
  display: flex;
  gap: 8px;
}

.record-content p {
  margin: 0 0 12px 0;
  line-height: 1.6;
  color: #333;
}

.record-images {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.record-image {
  width: 80px;
  height: 80px;
  object-fit: cover;
  border-radius: 4px;
  cursor: pointer;
  border: 1px solid #ddd;
}

.record-image:hover {
  opacity: 0.8;
}

:deep(.el-table) {
  font-size: 14px;
}

:deep(.el-table th) {
  background-color: #f8f9fa;
  font-weight: 600;
}

:deep(.el-rate) {
  line-height: 1;
}

:deep(.el-upload--picture-card) {
  width: 80px;
  height: 80px;
}
</style> 