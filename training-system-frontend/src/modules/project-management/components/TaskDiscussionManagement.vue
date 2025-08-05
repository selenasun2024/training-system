<template>
  <div class="task-discussion-management">
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
          <h3>{{ task?.name || '讨论管理' }}</h3>
        </div>
        <div class="task-meta">
          <span class="meta-item">
            <el-icon><ChatRound /></el-icon>
            讨论主题：{{ task?.config?.topic || '项目管理经验分享' }}
          </span>
          <span class="meta-item">
            <el-icon><Calendar /></el-icon>
            讨论时间：{{ formatTimeRange(task?.config?.startTime, task?.config?.endTime) }}
          </span>
          <span class="meta-item">
            <el-icon><UserFilled /></el-icon>
            参与人数：{{ studentList.length }}人
          </span>
          <span class="meta-item">
            <el-icon><MessageBox /></el-icon>
            讨论模式：{{ task?.config?.mode || '分组讨论' }}
          </span>
        </div>
      </div>
      <div class="header-actions">
        <el-button type="primary" @click="addDiscussionPoint">
          <el-icon><Plus /></el-icon>
          添加讨论要点
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
          <div class="stats-number">{{ discussionStats.participated }}</div>
          <div class="stats-label">已参与</div>
        </div>
      </el-card>
      <el-card class="stats-card">
        <div class="stats-content">
          <div class="stats-number">{{ discussionStats.active }}</div>
          <div class="stats-label">积极发言</div>
        </div>
      </el-card>
      <el-card class="stats-card">
        <div class="stats-content">
          <div class="stats-number">{{ discussionStats.totalMessages }}</div>
          <div class="stats-label">总发言数</div>
        </div>
      </el-card>
      <el-card class="stats-card">
        <div class="stats-content">
          <div class="stats-number">{{ participationRate }}%</div>
          <div class="stats-label">参与率</div>
        </div>
      </el-card>
    </div>

    <!-- Tab切换：参与情况 和 讨论内容 -->
    <el-tabs v-model="activeTab" class="discussion-tabs">
      <!-- 参与情况Tab -->
      <el-tab-pane label="参与情况" name="participation">
        <!-- 筛选控制 -->
        <div class="filter-section">
          <div class="filter-left">
            <el-select v-model="statusFilter" placeholder="筛选状态" clearable style="width: 120px">
              <el-option label="全部" value="" />
              <el-option label="积极参与" value="active" />
              <el-option label="一般参与" value="normal" />
              <el-option label="较少参与" value="inactive" />
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
            <el-table-column label="参与状态" width="120" align="center">
              <template #default="{ row }">
                <el-tag :type="getStatusTagType(row.participationLevel)">
                  {{ getStatusText(row.participationLevel) }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="发言次数" width="100" align="center">
              <template #default="{ row }">
                <span class="message-count">{{ row.messageCount || 0 }}</span>
              </template>
            </el-table-column>
            <el-table-column label="质量评分" width="120" align="center">
              <template #default="{ row }">
                <el-rate 
                  v-model="row.qualityScore" 
                  :max="5" 
                  show-score 
                  text-color="#ff9900"
                  @change="updateQualityScore(row)"
                />
              </template>
            </el-table-column>
            <el-table-column label="主要观点" min-width="200">
              <template #default="{ row }">
                <span v-if="row.keyPoints">{{ row.keyPoints }}</span>
                <span v-else class="text-muted">--</span>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="150" align="center" fixed="right">
              <template #default="{ row }">
                <el-button
                  size="small"
                  type="primary"
                  @click="viewStudentDiscussion(row)"
                >
                  查看发言
                </el-button>
                <el-button
                  size="small"
                  type="text"
                  @click="editParticipation(row)"
                >
                  编辑评价
                </el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-tab-pane>

      <!-- 讨论内容Tab -->
      <el-tab-pane label="讨论内容" name="content">
        <div class="discussion-content">
          <!-- 讨论要点 -->
          <div class="discussion-points">
            <h4>讨论要点</h4>
            <div class="points-list">
              <div 
                v-for="point in discussionPoints" 
                :key="point.id"
                class="point-item"
              >
                <div class="point-header">
                  <h5>{{ point.title }}</h5>
                  <div class="point-actions">
                    <el-button size="small" type="text" @click="editPoint(point)">编辑</el-button>
                    <el-button size="small" type="text" @click="deletePoint(point)">删除</el-button>
                  </div>
                </div>
                <p>{{ point.content }}</p>
                <div class="point-responses">
                  <span class="response-count">{{ point.responseCount || 0 }} 人回应</span>
                </div>
              </div>
            </div>
          </div>

          <!-- 讨论记录 -->
          <div class="discussion-messages">
            <h4>讨论记录</h4>
            <div class="messages-list">
              <div 
                v-for="message in discussionMessages" 
                :key="message.id"
                class="message-item"
              >
                <div class="message-header">
                  <div class="user-info">
                    <span class="user-name">{{ message.userName }}</span>
                    <span class="user-role">{{ message.userRole }}</span>
                  </div>
                  <span class="message-time">{{ formatDateTime(message.time) }}</span>
                </div>
                <div class="message-content">
                  <p>{{ message.content }}</p>
                  <div v-if="message.attachments?.length" class="message-attachments">
                    <div 
                      v-for="(file, index) in message.attachments" 
                      :key="index"
                      class="attachment-item"
                    >
                      <el-icon><Document /></el-icon>
                      <span>{{ file.name }}</span>
                    </div>
                  </div>
                </div>
                <div class="message-actions">
                  <el-button size="small" type="text" @click="replyMessage(message)">回复</el-button>
                  <el-button size="small" type="text" @click="highlightMessage(message)">标记重点</el-button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </el-tab-pane>
    </el-tabs>

    <!-- 编辑参与评价对话框 -->
    <el-dialog
      v-model="showEditParticipation"
      title="编辑参与评价"
      width="500px"
    >
      <el-form :model="participationForm" label-width="100px">
        <el-form-item label="学员姓名">
          <el-input :value="selectedStudent?.name" disabled />
        </el-form-item>
        <el-form-item label="参与程度">
          <el-radio-group v-model="participationForm.level">
            <el-radio label="active">积极参与</el-radio>
            <el-radio label="normal">一般参与</el-radio>
            <el-radio label="inactive">较少参与</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="质量评分">
          <el-rate 
            v-model="participationForm.qualityScore" 
            :max="5" 
            show-score 
            text-color="#ff9900"
          />
        </el-form-item>
        <el-form-item label="主要观点">
          <el-input
            v-model="participationForm.keyPoints"
            type="textarea"
            placeholder="请总结该学员在讨论中提出的主要观点"
            :rows="3"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showEditParticipation = false">取消</el-button>
        <el-button type="primary" @click="confirmEditParticipation">保存</el-button>
      </template>
    </el-dialog>

    <!-- 添加讨论要点对话框 -->
    <el-dialog
      v-model="showAddPoint"
      title="添加讨论要点"
      width="500px"
    >
      <el-form :model="pointForm" label-width="80px">
        <el-form-item label="要点标题">
          <el-input v-model="pointForm.title" placeholder="请输入讨论要点标题" />
        </el-form-item>
        <el-form-item label="详细描述">
          <el-input
            v-model="pointForm.content"
            type="textarea"
            placeholder="请详细描述这个讨论要点"
            :rows="4"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showAddPoint = false">取消</el-button>
        <el-button type="primary" @click="confirmAddPoint">添加要点</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  ChatRound, Calendar, UserFilled, MessageBox, Plus, Download, Refresh, 
  Search, Document, ArrowLeft
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
const showAddPoint = ref(false)
const selectedStudent = ref<any>(null)

// 表单数据
const participationForm = ref({
  level: 'normal',
  qualityScore: 3,
  keyPoints: ''
})

const pointForm = ref({
  title: '',
  content: ''
})

// 模拟学员数据
const studentList = ref([
  {
    id: '1',
    name: '张三',
    studentId: '00242',
    department: 'MBA(31期)>人员赋权管理组>测试1组',
    participationLevel: 'active',
    messageCount: 12,
    qualityScore: 5,
    keyPoints: '提出了创新的项目管理方法，对团队协作有深刻见解'
  },
  {
    id: '2',
    name: '李四',
    studentId: '00243',
    department: 'MBA(31期)>人员赋权管理组>测试2组',
    participationLevel: 'normal',
    messageCount: 6,
    qualityScore: 4,
    keyPoints: '分享了实际工作中的案例，观点中肯'
  },
  {
    id: '3',
    name: '王五',
    studentId: '00244',
    department: 'MBA(31期)>人员赋权管理组>测试1组',
    participationLevel: 'inactive',
    messageCount: 2,
    qualityScore: 2,
    keyPoints: '参与度较低，发言较少'
  },
  {
    id: '4',
    name: '赵六',
    studentId: '00245',
    department: 'MBA(31期)>人员赋权管理组>测试3组',
    participationLevel: 'normal',
    messageCount: 8,
    qualityScore: 3,
    keyPoints: '能够积极回应讨论话题，观点较为中肯'
  },
  {
    id: '5',
    name: '钱七',
    studentId: '00246',
    department: 'MBA(31期)>人员赋权管理组>测试2组',
    participationLevel: 'active',
    messageCount: 15,
    qualityScore: 5,
    keyPoints: '思路清晰，经常提出有建设性的建议和问题'
  }
])

// 模拟讨论要点数据
const discussionPoints = ref([
  {
    id: '1',
    title: '项目管理中的沟通技巧',
    content: '请分享您在项目管理过程中使用的有效沟通技巧，包括与团队成员、上级领导和客户的沟通方式。',
    responseCount: 8
  },
  {
    id: '2',
    title: '如何处理项目风险',
    content: '讨论项目执行过程中可能遇到的风险类型，以及相应的预防和应对策略。',
    responseCount: 6
  },
  {
    id: '3',
    title: '团队激励的最佳实践',
    content: '分享您在团队管理中使用的激励方法，如何提高团队成员的积极性和工作效率。',
    responseCount: 10
  }
])

// 模拟讨论消息数据
const discussionMessages = ref([
  {
    id: '1',
    userName: '张三',
    userRole: '学员',
    content: '我认为项目管理中最重要的是建立清晰的沟通渠道。在我的经验中，定期的团队会议和状态更新非常关键。',
    time: '2025-07-18 09:15',
    attachments: []
  },
  {
    id: '2',
    userName: '教务管理员',
    userRole: '导师',
    content: '张三提到的观点很好。除了定期会议，我想补充一点：建立多层次的沟通机制也很重要，包括正式和非正式的沟通渠道。',
    time: '2025-07-18 09:18',
    attachments: []
  },
  {
    id: '3',
    userName: '钱七',
    userRole: '学员',
    content: '我想分享一个具体的案例。在上一个项目中，我们使用了敏捷开发的日站会模式，每天15分钟的快速同步，效果非常好。',
    time: '2025-07-18 09:22',
    attachments: [
      { name: '敏捷开发实践案例.pdf', url: '#' }
    ]
  }
])

// 计算属性
const discussionStats = computed(() => {
  const participated = studentList.value.filter(s => s.messageCount > 0).length
  const active = studentList.value.filter(s => s.participationLevel === 'active').length
  const totalMessages = studentList.value.reduce((sum, s) => sum + (s.messageCount || 0), 0)
  
  return { participated, active, totalMessages }
})

const participationRate = computed(() => {
  const total = studentList.value.length
  const participated = discussionStats.value.participated
  return total > 0 ? Math.round((participated / total) * 100) : 0
})

const filteredStudentList = computed(() => {
  let filtered = studentList.value

  // 状态筛选
  if (statusFilter.value) {
    filtered = filtered.filter(student => student.participationLevel === statusFilter.value)
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
const getStatusTagType = (level: string) => {
  const types = {
    active: 'success',
    normal: 'primary',
    inactive: 'warning'
  }
  return types[level] || 'info'
}

const getStatusText = (level: string) => {
  const texts = {
    active: '积极参与',
    normal: '一般参与',
    inactive: '较少参与'
  }
  return texts[level] || level
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
    level: student.participationLevel,
    qualityScore: student.qualityScore,
    keyPoints: student.keyPoints || ''
  }
  showEditParticipation.value = true
}

const confirmEditParticipation = () => {
  if (selectedStudent.value) {
    selectedStudent.value.participationLevel = participationForm.value.level
    selectedStudent.value.qualityScore = participationForm.value.qualityScore
    selectedStudent.value.keyPoints = participationForm.value.keyPoints
    
    ElMessage.success(`${selectedStudent.value.name} 的参与评价更新成功`)
    showEditParticipation.value = false
  }
}

const updateQualityScore = (student: any) => {
  ElMessage.success(`${student.name} 的质量评分已更新`)
}

const viewStudentDiscussion = (student: any) => {
  ElMessage.info(`查看 ${student.name} 的所有发言记录`)
}

const addDiscussionPoint = () => {
  pointForm.value = {
    title: '',
    content: ''
  }
  showAddPoint.value = true
}

const confirmAddPoint = () => {
  const newPoint = {
    id: Date.now().toString(),
    title: pointForm.value.title,
    content: pointForm.value.content,
    responseCount: 0
  }
  
  discussionPoints.value.push(newPoint)
  ElMessage.success('讨论要点添加成功')
  showAddPoint.value = false
}

const editPoint = (point: any) => {
  ElMessage.info(`编辑要点：${point.title}`)
}

const deletePoint = (point: any) => {
  ElMessageBox.confirm(`确定删除要点"${point.title}"吗？`, '删除确认', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    const index = discussionPoints.value.findIndex(p => p.id === point.id)
    if (index > -1) {
      discussionPoints.value.splice(index, 1)
      ElMessage.success('要点已删除')
    }
  })
}

const replyMessage = (message: any) => {
  ElMessage.info(`回复 ${message.userName} 的发言`)
}

const highlightMessage = (message: any) => {
  ElMessage.success(`已标记 ${message.userName} 的发言为重点`)
}

const exportData = () => {
  ElMessage.success('正在导出讨论数据...')
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
  console.log('讨论任务管理界面已加载，任务信息:', props.task)
})
</script>

<style scoped>
.task-discussion-management {
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

.discussion-tabs {
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

.message-count {
  font-weight: 600;
  color: #409eff;
}

.discussion-content {
  max-height: 600px;
  overflow-y: auto;
}

.discussion-points,
.discussion-messages {
  margin-bottom: 24px;
}

.discussion-points h4,
.discussion-messages h4 {
  margin: 0 0 16px 0;
  font-size: 16px;
  color: #333;
  border-bottom: 1px solid #eee;
  padding-bottom: 8px;
}

.point-item {
  margin-bottom: 16px;
  padding: 16px;
  background: #f8f9fa;
  border-radius: 8px;
  border: 1px solid #eee;
}

.point-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.point-header h5 {
  margin: 0;
  font-size: 14px;
  color: #333;
}

.point-actions {
  display: flex;
  gap: 8px;
}

.point-item p {
  margin: 0 0 8px 0;
  line-height: 1.6;
  color: #666;
}

.point-responses {
  font-size: 12px;
  color: #999;
}

.response-count {
  background: #e7f4ff;
  color: #409eff;
  padding: 2px 6px;
  border-radius: 10px;
}

.message-item {
  margin-bottom: 16px;
  padding: 16px;
  background: #fff;
  border-radius: 8px;
  border: 1px solid #eee;
}

.message-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 8px;
}

.user-name {
  font-weight: 600;
  color: #333;
}

.user-role {
  font-size: 12px;
  color: #999;
  background: #f0f0f0;
  padding: 2px 6px;
  border-radius: 10px;
}

.message-time {
  font-size: 12px;
  color: #999;
}

.message-content p {
  margin: 0 0 12px 0;
  line-height: 1.6;
  color: #333;
}

.message-attachments {
  display: flex;
  gap: 8px;
  margin-bottom: 12px;
}

.attachment-item {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 8px;
  background: #f8f9fa;
  border-radius: 4px;
  font-size: 12px;
  color: #666;
}

.message-actions {
  display: flex;
  gap: 8px;
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
</style> 