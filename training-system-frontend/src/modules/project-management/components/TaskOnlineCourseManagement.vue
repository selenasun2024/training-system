<template>
  <div class="task-online-course-management">
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
          <h3>{{ task?.name || '在线课程管理' }}</h3>
        </div>
        <div class="task-meta">
          <span class="meta-item">
            <el-icon><VideoCamera /></el-icon>
            课程类型：{{ task?.config?.courseType || '视频课程' }}
          </span>
          <span class="meta-item">
            <el-icon><Clock /></el-icon>
            学习期限：{{ formatTimeRange(task?.config?.startTime, task?.config?.endTime) }}
          </span>
          <span class="meta-item">
            <el-icon><UserFilled /></el-icon>
            学员人数：{{ studentList.length }}人
          </span>
          <span class="meta-item">
            <el-icon><Timer /></el-icon>
            课程时长：{{ task?.config?.duration || '120分钟' }}
          </span>
        </div>
      </div>
      <div class="header-actions">
        <el-button type="primary" @click="publishCourse">
          <el-icon><Promotion /></el-icon>
          发布课程
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
          <div class="stats-number">{{ learningStats.completed }}</div>
          <div class="stats-label">已完成</div>
        </div>
      </el-card>
      <el-card class="stats-card">
        <div class="stats-content">
          <div class="stats-number">{{ learningStats.inProgress }}</div>
          <div class="stats-label">学习中</div>
        </div>
      </el-card>
      <el-card class="stats-card">
        <div class="stats-content">
          <div class="stats-number">{{ learningStats.notStarted }}</div>
          <div class="stats-label">未开始</div>
        </div>
      </el-card>
      <el-card class="stats-card">
        <div class="stats-content">
          <div class="stats-number">{{ completionRate }}%</div>
          <div class="stats-label">完成率</div>
        </div>
      </el-card>
    </div>

    <!-- Tab切换：学习进度、课程内容、学习数据 -->
    <el-tabs v-model="activeTab" class="course-tabs">
      <!-- 学习进度Tab -->
      <el-tab-pane label="学习进度" name="progress">
        <!-- 筛选控制 -->
        <div class="filter-section">
          <div class="filter-left">
            <el-select v-model="statusFilter" placeholder="筛选状态" clearable style="width: 120px">
              <el-option label="全部" value="" />
              <el-option label="已完成" value="completed" />
              <el-option label="学习中" value="in-progress" />
              <el-option label="未开始" value="not-started" />
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

        <!-- 学习进度表格 -->
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
            <el-table-column label="学习状态" width="120" align="center">
              <template #default="{ row }">
                <el-tag :type="getLearningTagType(row.learningStatus)">
                  {{ getLearningText(row.learningStatus) }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="学习进度" width="150" align="center">
              <template #default="{ row }">
                <div class="progress-container">
                  <el-progress :percentage="row.progress" :status="getProgressStatus(row.progress)" />
                  <span class="progress-text">{{ row.progress }}%</span>
                </div>
              </template>
            </el-table-column>
            <el-table-column label="学习时长" width="120" align="center">
              <template #default="{ row }">
                <span>{{ formatDuration(row.studyTime) }}</span>
              </template>
            </el-table-column>
            <el-table-column label="最后学习" width="150" align="center">
              <template #default="{ row }">
                <span v-if="row.lastStudyTime">{{ formatDateTime(row.lastStudyTime) }}</span>
                <span v-else class="text-muted">--</span>
              </template>
            </el-table-column>
            <el-table-column label="完成时间" width="150" align="center">
              <template #default="{ row }">
                <span v-if="row.completionTime">{{ formatDateTime(row.completionTime) }}</span>
                <span v-else class="text-muted">--</span>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="150" align="center" fixed="right">
              <template #default="{ row }">
                <el-button
                  size="small"
                  type="primary"
                  @click="viewLearningDetail(row)"
                >
                  学习详情
                </el-button>
                <el-button
                  size="small"
                  type="text"
                  @click="sendReminder(row)"
                  :disabled="row.learningStatus === 'completed'"
                >
                  发送提醒
                </el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-tab-pane>

      <!-- 课程内容Tab -->
      <el-tab-pane label="课程内容" name="content">
        <div class="course-content">
          <!-- 课程章节列表 -->
          <div class="chapters-section">
            <div class="section-header">
              <h4>课程章节</h4>
              <el-button type="primary" @click="addChapter">
                <el-icon><Plus /></el-icon>
                添加章节
              </el-button>
            </div>
            <div class="chapters-list">
              <div 
                v-for="(chapter, index) in courseChapters" 
                :key="chapter.id"
                class="chapter-item"
                :class="{ expanded: chapter.expanded }"
              >
                <div class="chapter-header" @click="toggleChapter(chapter)">
                  <div class="chapter-info">
                    <span class="chapter-number">第{{ index + 1 }}章</span>
                    <span class="chapter-title">{{ chapter.title }}</span>
                    <span class="chapter-duration">{{ chapter.duration }}</span>
                  </div>
                  <div class="chapter-actions">
                    <span class="completion-stats">{{ chapter.completionCount }}/{{ studentList.length }} 已完成</span>
                    <el-icon :class="['expand-icon', { expanded: chapter.expanded }]">
                      <ArrowDown />
                    </el-icon>
                  </div>
                </div>
                <div v-show="chapter.expanded" class="chapter-content">
                  <p>{{ chapter.description }}</p>
                  <div class="chapter-resources">
                    <div class="resource-item" v-for="resource in chapter.resources" :key="resource.id">
                      <el-icon><VideoPlay /></el-icon>
                      <span>{{ resource.name }}</span>
                      <span class="resource-duration">{{ resource.duration }}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- 课程资源 -->
          <div class="resources-section">
            <h4>课程资源</h4>
            <div class="resources-grid">
              <div 
                v-for="resource in courseResources" 
                :key="resource.id"
                class="resource-card"
              >
                <div class="resource-icon">
                  <el-icon v-if="resource.type === 'video'"><VideoPlay /></el-icon>
                  <el-icon v-else-if="resource.type === 'document'"><Document /></el-icon>
                  <el-icon v-else><Files /></el-icon>
                </div>
                <div class="resource-info">
                  <h5>{{ resource.name }}</h5>
                  <p>{{ resource.description }}</p>
                  <div class="resource-meta">
                    <span>{{ resource.type === 'video' ? '视频' : '文档' }}</span>
                    <span>{{ resource.size }}</span>
                  </div>
                </div>
                <div class="resource-actions">
                  <el-button size="small" type="primary">预览</el-button>
                  <el-button size="small" type="text">下载</el-button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </el-tab-pane>

      <!-- 学习数据Tab -->
      <el-tab-pane label="学习数据" name="analytics">
        <div class="analytics-section">
          <!-- 学习时间分析 -->
          <div class="time-analysis">
            <h4>学习时间分析</h4>
            <div class="analysis-cards">
              <el-card class="analysis-card">
                <div class="analysis-content">
                  <div class="analysis-number">{{ analyticsData.totalStudyTime }}</div>
                  <div class="analysis-label">总学习时长</div>
                </div>
              </el-card>
              <el-card class="analysis-card">
                <div class="analysis-content">
                  <div class="analysis-number">{{ analyticsData.avgStudyTime }}</div>
                  <div class="analysis-label">平均学习时长</div>
                </div>
              </el-card>
              <el-card class="analysis-card">
                <div class="analysis-content">
                  <div class="analysis-number">{{ analyticsData.avgDailyTime }}</div>
                  <div class="analysis-label">日均学习时长</div>
                </div>
              </el-card>
            </div>
          </div>

          <!-- 学习行为分析 -->
          <div class="behavior-analysis">
            <h4>学习行为分析</h4>
            <div class="behavior-list">
              <div 
                v-for="behavior in learningBehaviors" 
                :key="behavior.id"
                class="behavior-item"
              >
                <div class="behavior-header">
                  <span class="student-name">{{ behavior.studentName }}</span>
                  <span class="behavior-time">{{ formatDateTime(behavior.time) }}</span>
                </div>
                <div class="behavior-content">
                  <span class="behavior-action">{{ behavior.action }}</span>
                  <span class="behavior-detail">{{ behavior.detail }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </el-tab-pane>
    </el-tabs>

    <!-- 学习详情对话框 -->
    <el-dialog
      v-model="showLearningDetail"
      title="学习详情"
      width="600px"
    >
      <div v-if="selectedStudent" class="learning-detail">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="学员姓名">{{ selectedStudent.name }}</el-descriptions-item>
          <el-descriptions-item label="学号">{{ selectedStudent.studentId }}</el-descriptions-item>
          <el-descriptions-item label="学习状态">
            <el-tag :type="getLearningTagType(selectedStudent.learningStatus)">
              {{ getLearningText(selectedStudent.learningStatus) }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="学习进度">{{ selectedStudent.progress }}%</el-descriptions-item>
          <el-descriptions-item label="学习时长">{{ formatDuration(selectedStudent.studyTime) }}</el-descriptions-item>
          <el-descriptions-item label="最后学习">{{ formatDateTime(selectedStudent.lastStudyTime) }}</el-descriptions-item>
        </el-descriptions>
        
        <h4 style="margin: 20px 0 10px 0;">章节完成情况</h4>
        <div class="chapter-progress">
          <div 
            v-for="(chapter, index) in courseChapters" 
            :key="chapter.id"
            class="chapter-progress-item"
          >
            <span class="chapter-name">第{{ index + 1 }}章：{{ chapter.title }}</span>
            <el-progress :percentage="getChapterProgress(selectedStudent.id, chapter.id)" />
          </div>
        </div>
      </div>
      <template #footer>
        <el-button @click="showLearningDetail = false">关闭</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  VideoCamera, Clock, UserFilled, Timer, Promotion, Download, Refresh,
  Search, Plus, ArrowDown, VideoPlay, Document, Files, ArrowLeft
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
const activeTab = ref('progress')
const statusFilter = ref('')
const searchKeyword = ref('')
const showLearningDetail = ref(false)
const selectedStudent = ref<any>(null)

// 模拟学员数据
const studentList = ref([
  {
    id: '1',
    name: '张三',
    studentId: '00242',
    department: 'MBA(31期)>人员赋权管理组>测试1组',
    learningStatus: 'completed',
    progress: 100,
    studyTime: 7200, // 秒
    lastStudyTime: '2025-07-18 16:30',
    completionTime: '2025-07-18 16:30'
  },
  {
    id: '2',
    name: '李四',
    studentId: '00243',
    department: 'MBA(31期)>人员赋权管理组>测试2组',
    learningStatus: 'in-progress',
    progress: 65,
    studyTime: 4680,
    lastStudyTime: '2025-07-18 15:45',
    completionTime: null
  },
  {
    id: '3',
    name: '王五',
    studentId: '00244',
    department: 'MBA(31期)>人员赋权管理组>测试1组',
    learningStatus: 'not-started',
    progress: 0,
    studyTime: 0,
    lastStudyTime: null,
    completionTime: null
  },
  {
    id: '4',
    name: '赵六',
    studentId: '00245',
    department: 'MBA(31期)>人员赋权管理组>测试3组',
    learningStatus: 'in-progress',
    progress: 85,
    studyTime: 6120,
    lastStudyTime: '2025-07-18 17:20',
    completionTime: null
  },
  {
    id: '5',
    name: '钱七',
    studentId: '00246',
    department: 'MBA(31期)>人员赋权管理组>测试2组',
    learningStatus: 'completed',
    progress: 100,
    studyTime: 7800,
    lastStudyTime: '2025-07-18 18:00',
    completionTime: '2025-07-18 18:00'
  }
])

// 模拟课程章节数据
const courseChapters = ref([
  {
    id: '1',
    title: '项目管理概述',
    description: '介绍项目管理的基本概念、发展历程和重要性',
    duration: '30分钟',
    completionCount: 4,
    expanded: false,
    resources: [
      { id: '1-1', name: '项目管理概述.mp4', duration: '25分钟' },
      { id: '1-2', name: '课后练习.pdf', duration: '5分钟' }
    ]
  },
  {
    id: '2',
    title: '项目生命周期',
    description: '学习项目从启动到收尾的完整生命周期',
    duration: '45分钟',
    completionCount: 3,
    expanded: false,
    resources: [
      { id: '2-1', name: '项目生命周期详解.mp4', duration: '35分钟' },
      { id: '2-2', name: '生命周期案例分析.mp4', duration: '10分钟' }
    ]
  },
  {
    id: '3',
    title: '项目团队管理',
    description: '掌握项目团队的组建、管理和激励方法',
    duration: '40分钟',
    completionCount: 2,
    expanded: false,
    resources: [
      { id: '3-1', name: '团队管理理论.mp4', duration: '20分钟' },
      { id: '3-2', name: '团队建设实践.mp4', duration: '15分钟' },
      { id: '3-3', name: '团队管理工具.pdf', duration: '5分钟' }
    ]
  }
])

// 模拟课程资源数据
const courseResources = ref([
  {
    id: '1',
    name: '项目管理工具箱',
    description: '包含各种项目管理模板和工具',
    type: 'document',
    size: '15.2MB'
  },
  {
    id: '2',
    name: '案例分析视频',
    description: '真实项目案例的深度分析',
    type: 'video',
    size: '245MB'
  },
  {
    id: '3',
    name: '延伸阅读材料',
    description: '项目管理相关的推荐阅读',
    type: 'document',
    size: '8.5MB'
  }
])

// 模拟学习行为数据
const learningBehaviors = ref([
  {
    id: '1',
    studentName: '钱七',
    action: '完成学习',
    detail: '完成了"项目团队管理"章节的学习',
    time: '2025-07-18 18:00'
  },
  {
    id: '2',
    studentName: '赵六',
    action: '暂停学习',
    detail: '在"项目生命周期"章节暂停学习',
    time: '2025-07-18 17:20'
  },
  {
    id: '3',
    studentName: '张三',
    action: '重复学习',
    detail: '重新观看"项目管理概述"章节',
    time: '2025-07-18 16:45'
  }
])

// 模拟分析数据
const analyticsData = ref({
  totalStudyTime: '134小时',
  avgStudyTime: '26.8小时',
  avgDailyTime: '3.2小时'
})

// 计算属性
const learningStats = computed(() => {
  const completed = studentList.value.filter(s => s.learningStatus === 'completed').length
  const inProgress = studentList.value.filter(s => s.learningStatus === 'in-progress').length
  const notStarted = studentList.value.filter(s => s.learningStatus === 'not-started').length
  
  return { completed, inProgress, notStarted }
})

const completionRate = computed(() => {
  const total = studentList.value.length
  const completed = learningStats.value.completed
  return total > 0 ? Math.round((completed / total) * 100) : 0
})

const filteredStudentList = computed(() => {
  let filtered = studentList.value

  // 状态筛选
  if (statusFilter.value) {
    filtered = filtered.filter(student => student.learningStatus === statusFilter.value)
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
const getLearningTagType = (status: string) => {
  const types = {
    completed: 'success',
    'in-progress': 'primary',
    'not-started': 'info'
  }
  return types[status] || 'info'
}

const getLearningText = (status: string) => {
  const texts = {
    completed: '已完成',
    'in-progress': '学习中',
    'not-started': '未开始'
  }
  return texts[status] || status
}

const getProgressStatus = (progress: number) => {
  if (progress === 100) return 'success'
  if (progress >= 60) return undefined
  if (progress > 0) return 'warning'
  return 'exception'
}

const formatTimeRange = (startTime?: string, endTime?: string) => {
  if (!startTime || !endTime) return '2025-07-15 至 2025-07-25'
  
  const start = new Date(startTime)
  const end = new Date(endTime)
  
  return `${start.toLocaleDateString()} 至 ${end.toLocaleDateString()}`
}

const formatDateTime = (dateString: string) => {
  if (!dateString) return '--'
  return dateString
}

const formatDuration = (seconds: number) => {
  if (!seconds) return '0分钟'
  
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  
  if (hours > 0) {
    return `${hours}小时${minutes}分钟`
  } else {
    return `${minutes}分钟`
  }
}

const getChapterProgress = (studentId: string, chapterId: string) => {
  // 模拟获取学员章节进度
  const progressMap = {
    '1': { '1': 100, '2': 100, '3': 80 },
    '2': { '1': 100, '2': 85, '3': 0 },
    '3': { '1': 0, '2': 0, '3': 0 },
    '4': { '1': 100, '2': 100, '3': 60 },
    '5': { '1': 100, '2': 100, '3': 100 }
  }
  
  return progressMap[studentId]?.[chapterId] || 0
}

// 操作方法
const publishCourse = () => {
  ElMessage.success('课程发布成功')
}

const viewLearningDetail = (student: any) => {
  selectedStudent.value = student
  showLearningDetail.value = true
}

const sendReminder = (student: any) => {
  ElMessage.success(`已向 ${student.name} 发送学习提醒`)
}

const toggleChapter = (chapter: any) => {
  chapter.expanded = !chapter.expanded
}

const addChapter = () => {
  ElMessage.info('添加课程章节功能')
}

const exportData = () => {
  ElMessage.success('正在导出在线课程数据...')
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
  console.log('在线课程管理界面已加载，任务信息:', props.task)
})
</script>

<style scoped>
.task-online-course-management {
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

.course-tabs {
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

.progress-container {
  display: flex;
  align-items: center;
  gap: 8px;
}

.progress-text {
  font-size: 12px;
  color: #666;
  min-width: 35px;
}

.text-muted {
  color: #999;
}

.course-content {
  max-height: 600px;
  overflow-y: auto;
}

.chapters-section,
.resources-section {
  margin-bottom: 24px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding-bottom: 8px;
  border-bottom: 1px solid #eee;
}

.section-header h4 {
  margin: 0;
  font-size: 16px;
  color: #333;
}

.chapter-item {
  margin-bottom: 8px;
  border: 1px solid #eee;
  border-radius: 8px;
  overflow: hidden;
}

.chapter-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  background: #f8f9fa;
  cursor: pointer;
  transition: background-color 0.3s;
}

.chapter-header:hover {
  background: #e9ecef;
}

.chapter-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.chapter-number {
  font-weight: 600;
  color: #409eff;
}

.chapter-title {
  font-size: 16px;
  color: #333;
}

.chapter-duration {
  font-size: 12px;
  color: #666;
  background: #e7f4ff;
  padding: 2px 6px;
  border-radius: 10px;
}

.chapter-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.completion-stats {
  font-size: 12px;
  color: #666;
}

.expand-icon {
  transition: transform 0.3s;
}

.expand-icon.expanded {
  transform: rotate(180deg);
}

.chapter-content {
  padding: 16px;
  background: #fff;
  border-top: 1px solid #eee;
}

.chapter-content p {
  margin: 0 0 16px 0;
  color: #666;
  line-height: 1.6;
}

.chapter-resources {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.resource-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: #f8f9fa;
  border-radius: 6px;
  font-size: 14px;
}

.resource-duration {
  margin-left: auto;
  font-size: 12px;
  color: #666;
}

.resources-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 16px;
}

.resource-card {
  display: flex;
  gap: 12px;
  padding: 16px;
  background: #fff;
  border: 1px solid #eee;
  border-radius: 8px;
}

.resource-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  background: #e7f4ff;
  border-radius: 6px;
  color: #409eff;
}

.resource-info {
  flex: 1;
}

.resource-info h5 {
  margin: 0 0 4px 0;
  font-size: 14px;
  color: #333;
}

.resource-info p {
  margin: 0 0 8px 0;
  font-size: 12px;
  color: #666;
  line-height: 1.4;
}

.resource-meta {
  display: flex;
  gap: 8px;
  font-size: 12px;
  color: #999;
}

.resource-actions {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.analytics-section {
  max-height: 600px;
  overflow-y: auto;
}

.time-analysis,
.behavior-analysis {
  margin-bottom: 24px;
}

.time-analysis h4,
.behavior-analysis h4 {
  margin: 0 0 16px 0;
  font-size: 16px;
  color: #333;
  border-bottom: 1px solid #eee;
  padding-bottom: 8px;
}

.analysis-cards {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
}

.analysis-card {
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.analysis-content {
  text-align: center;
  padding: 16px 0;
}

.analysis-number {
  font-size: 20px;
  font-weight: bold;
  color: #409eff;
  margin-bottom: 4px;
}

.analysis-label {
  font-size: 14px;
  color: #666;
}

.behavior-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.behavior-item {
  padding: 16px;
  background: #f8f9fa;
  border-radius: 8px;
  border: 1px solid #eee;
}

.behavior-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.student-name {
  font-weight: 600;
  color: #333;
}

.behavior-time {
  font-size: 12px;
  color: #999;
}

.behavior-content {
  display: flex;
  gap: 8px;
  align-items: center;
}

.behavior-action {
  font-size: 12px;
  color: #666;
  background: #e7f4ff;
  padding: 2px 6px;
  border-radius: 10px;
}

.behavior-detail {
  font-size: 14px;
  color: #333;
}

.learning-detail {
  max-height: 400px;
  overflow-y: auto;
}

.chapter-progress {
  margin-top: 16px;
}

.chapter-progress-item {
  margin-bottom: 12px;
}

.chapter-name {
  display: block;
  margin-bottom: 4px;
  font-size: 14px;
  color: #333;
}

:deep(.el-table) {
  font-size: 14px;
}

:deep(.el-table th) {
  background-color: #f8f9fa;
  font-weight: 600;
}

:deep(.el-progress) {
  line-height: 1;
}

:deep(.el-progress-bar__outer) {
  height: 8px;
}
</style> 