<template>
  <div class="face-to-face-management">
    <!-- 页面头部 -->
    <div class="page-header">
      <div class="header-content">
        <h1>面授教学管理</h1>
        <p>管理面授课程的排课、授课、学员互动和教学评估</p>
      </div>
      <div class="header-actions">
        <el-button type="primary" @click="createCourse">
          <el-icon><Plus /></el-icon>
          新建面授课程
        </el-button>
      </div>
    </div>

    <!-- 筛选和搜索 -->
    <div class="filter-section">
      <div class="filter-left">
        <el-select v-model="filterStatus" placeholder="课程状态" clearable style="width: 150px">
          <el-option label="全部" value="" />
          <el-option label="待开始" value="pending" />
          <el-option label="进行中" value="ongoing" />
          <el-option label="已结束" value="completed" />
          <el-option label="已取消" value="cancelled" />
        </el-select>
        <el-select v-model="filterCategory" placeholder="课程类别" clearable style="width: 150px">
          <el-option label="全部" value="" />
          <el-option label="通用课程" value="general" />
          <el-option label="专业课程" value="professional" />
          <el-option label="技能培训" value="skill" />
          <el-option label="管理培训" value="management" />
        </el-select>
        <el-date-picker
          v-model="filterDate"
          type="daterange"
          range-separator="至"
          start-placeholder="开始日期"
          end-placeholder="结束日期"
          style="width: 240px"
        />
      </div>
      <div class="filter-right">
        <el-input
          v-model="searchKeyword"
          placeholder="搜索课程名称或讲师"
          style="width: 300px"
          clearable
        >
          <template #prefix>
            <el-icon><Search /></el-icon>
          </template>
        </el-input>
      </div>
    </div>

    <!-- 课程统计 -->
    <div class="stats-cards">
      <el-card class="stats-card">
        <el-statistic title="总课程数" :value="courseStats.total" />
      </el-card>
      <el-card class="stats-card">
        <el-statistic title="今日课程" :value="courseStats.today" />
      </el-card>
      <el-card class="stats-card">
        <el-statistic title="进行中" :value="courseStats.ongoing" />
      </el-card>
      <el-card class="stats-card">
        <el-statistic title="平均评分" :value="courseStats.averageRating" :precision="1" />
      </el-card>
    </div>

    <!-- 课程列表 -->
    <div class="course-list">
      <div class="list-header">
        <h3>课程列表</h3>
        <div class="view-controls">
          <el-radio-group v-model="viewMode" size="small">
            <el-radio-button label="card">卡片视图</el-radio-button>
            <el-radio-button label="table">表格视图</el-radio-button>
          </el-radio-group>
        </div>
      </div>

      <!-- 卡片视图 -->
      <div v-if="viewMode === 'card'" class="course-cards">
        <div
          v-for="course in filteredCourses"
          :key="course.id"
          class="course-card"
          :class="{ 'ongoing': course.status === 'ongoing' }"
        >
          <div class="course-header">
            <div class="course-status">
              <el-tag :type="getStatusColor(course.status)">
                {{ getStatusText(course.status) }}
              </el-tag>
            </div>
            <div class="course-actions">
              <el-button size="small" type="text" @click="viewCourse(course)">
                查看
              </el-button>
              <el-dropdown @command="(action) => handleCourseAction(action, course)">
                <el-button size="small" type="text">
                  更多 <el-icon><ArrowDown /></el-icon>
                </el-button>
                <template #dropdown>
                  <el-dropdown-menu>
                    <el-dropdown-item command="edit">编辑</el-dropdown-item>
                    <el-dropdown-item command="start" v-if="course.status === 'pending'">
                      开始授课
                    </el-dropdown-item>
                    <el-dropdown-item command="end" v-if="course.status === 'ongoing'">
                      结束课程
                    </el-dropdown-item>
                    <el-dropdown-item command="cancel" divided>取消</el-dropdown-item>
                  </el-dropdown-menu>
                </template>
              </el-dropdown>
            </div>
          </div>
          
          <div class="course-content">
            <h4>{{ course.courseName }}</h4>
            <div class="course-meta">
              <div class="meta-item">
                <el-icon><User /></el-icon>
                <span>{{ course.lecturer }}</span>
              </div>
              <div class="meta-item">
                <el-icon><Clock /></el-icon>
                <span>{{ formatDuration(course.duration) }}</span>
              </div>
              <div class="meta-item">
                <el-icon><Calendar /></el-icon>
                <span>{{ formatDate(course.startTime) }}</span>
              </div>
              <div class="meta-item">
                <el-icon><LocationFilled /></el-icon>
                <span>{{ course.location || '线上授课' }}</span>
              </div>
            </div>
            <div class="course-participants">
              <span>参与人数：{{ course.participants?.length || 0 }}人</span>
              <span class="rating" v-if="course.rating">
                评分：{{ course.rating }}/5.0
              </span>
            </div>
          </div>

          <!-- 实时状态 -->
          <div v-if="course.status === 'ongoing'" class="live-status">
            <div class="live-indicator">
              <span class="live-dot"></span>
              <span>正在授课</span>
            </div>
            <div class="live-stats">
              <span>在线：{{ course.onlineCount || 0 }}人</span>
              <span>互动：{{ course.interactionCount || 0 }}次</span>
            </div>
          </div>

          <div class="course-footer">
            <el-button
              v-if="course.status === 'ongoing'"
              type="primary"
              size="small"
              @click="enterLiveMode(course)"
            >
              进入授课
            </el-button>
            <el-button
              v-else-if="course.status === 'pending'"
              type="success"
              size="small"
              @click="startCourse(course)"
            >
              开始授课
            </el-button>
            <el-button
              v-else
              size="small"
              @click="viewCourseReport(course)"
            >
              查看报告
            </el-button>
          </div>
        </div>
      </div>

      <!-- 表格视图 -->
      <el-table
        v-else
        :data="filteredCourses"
        stripe
        style="width: 100%"
      >
        <el-table-column prop="courseName" label="课程名称" min-width="180" />
        <el-table-column prop="lecturer" label="讲师" width="120" />
        <el-table-column prop="category" label="类别" width="100">
          <template #default="{ row }">
            <el-tag size="small">{{ getCategoryText(row.category) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="startTime" label="开始时间" width="160">
          <template #default="{ row }">
            {{ formatDateTime(row.startTime) }}
          </template>
        </el-table-column>
        <el-table-column prop="duration" label="时长" width="80">
          <template #default="{ row }">
            {{ row.duration }}分钟
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="getStatusColor(row.status)">
              {{ getStatusText(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="participants" label="参与人数" width="100">
          <template #default="{ row }">
            {{ row.participants?.length || 0 }}人
          </template>
        </el-table-column>
        <el-table-column label="操作" width="180" fixed="right">
          <template #default="{ row }">
            <el-button size="small" type="primary" @click="viewCourse(row)">
              查看
            </el-button>
            <el-button
              v-if="row.status === 'ongoing'"
              size="small"
              type="success"
              @click="enterLiveMode(row)"
            >
              进入授课
            </el-button>
            <el-button
              v-else-if="row.status === 'pending'"
              size="small"
              type="warning"
              @click="startCourse(row)"
            >
              开始
            </el-button>
            <el-button size="small" type="text" @click="editCourse(row)">
              编辑
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <!-- 面授课程表单对话框 -->
    <FaceToFaceForm
      v-model:visible="showCourseForm"
      @save="handleCourseSave"
    />

    <!-- 授课详情对话框 -->
    <LiveTeachingDialog
      v-model:visible="showLiveDialog"
      :course="selectedCourse"
      @end="handleCourseEnd"
    />

    <!-- 课程详情对话框 -->
    <CourseDetailDialog
      v-model:visible="showDetailDialog"
      :course="selectedCourse"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Plus, Search, User, Clock, Calendar, LocationFilled, ArrowDown
} from '@element-plus/icons-vue'

// 导入子组件
import FaceToFaceForm from '../execution/components/FaceToFaceForm.vue'
import LiveTeachingDialog from '../components/LiveTeachingDialog.vue'
import CourseDetailDialog from '../components/CourseDetailDialog.vue'

// 页面状态
const viewMode = ref('card')
const showCourseForm = ref(false)
const showLiveDialog = ref(false)
const showDetailDialog = ref(false)
const selectedCourse = ref<any>(null)

// 筛选状态
const filterStatus = ref('')
const filterCategory = ref('')
const filterDate = ref<[Date, Date] | null>(null)
const searchKeyword = ref('')

// 模拟课程数据
const courses = ref([
  {
    id: 'course-1',
    courseName: '项目管理基础培训',
    lecturer: '张老师',
    category: 'management',
    startTime: '2024-01-20T09:00:00',
    endTime: '2024-01-20T12:00:00',
    duration: 180,
    status: 'ongoing',
    location: '培训中心A201',
    participants: [
      { id: '1', name: '学员1' },
      { id: '2', name: '学员2' }
    ],
    rating: 4.5,
    onlineCount: 15,
    interactionCount: 8
  },
  {
    id: 'course-2',
    courseName: 'Vue 3开发实战',
    lecturer: '李老师',
    category: 'professional',
    startTime: '2024-01-21T14:00:00',
    endTime: '2024-01-21T17:00:00',
    duration: 180,
    status: 'pending',
    location: '线上授课',
    participants: [
      { id: '3', name: '学员3' },
      { id: '4', name: '学员4' },
      { id: '5', name: '学员5' }
    ]
  },
  {
    id: 'course-3',
    courseName: '团队沟通技巧',
    lecturer: '王老师',
    category: 'general',
    startTime: '2024-01-18T10:00:00',
    endTime: '2024-01-18T12:00:00',
    duration: 120,
    status: 'completed',
    location: '培训中心B302',
    participants: [
      { id: '6', name: '学员6' },
      { id: '7', name: '学员7' }
    ],
    rating: 4.8
  }
])

// 统计数据
const courseStats = computed(() => ({
  total: courses.value.length,
  today: courses.value.filter(c => 
    new Date(c.startTime).toDateString() === new Date().toDateString()
  ).length,
  ongoing: courses.value.filter(c => c.status === 'ongoing').length,
  averageRating: courses.value
    .filter(c => c.rating)
    .reduce((sum, c) => sum + c.rating!, 0) / 
    courses.value.filter(c => c.rating).length || 0
}))

// 筛选后的课程
const filteredCourses = computed(() => {
  let filtered = courses.value

  if (filterStatus.value) {
    filtered = filtered.filter(c => c.status === filterStatus.value)
  }

  if (filterCategory.value) {
    filtered = filtered.filter(c => c.category === filterCategory.value)
  }

  if (filterDate.value) {
    const [start, end] = filterDate.value
    filtered = filtered.filter(c => {
      const courseDate = new Date(c.startTime)
      return courseDate >= start && courseDate <= end
    })
  }

  if (searchKeyword.value) {
    const keyword = searchKeyword.value.toLowerCase()
    filtered = filtered.filter(c => 
      c.courseName.toLowerCase().includes(keyword) ||
      c.lecturer.toLowerCase().includes(keyword)
    )
  }

  return filtered
})

// 工具方法
const getStatusColor = (status: string) => {
  const colors = {
    pending: 'warning',
    ongoing: 'success',
    completed: 'info',
    cancelled: 'danger'
  }
  return colors[status] || 'info'
}

const getStatusText = (status: string) => {
  const texts = {
    pending: '待开始',
    ongoing: '进行中',
    completed: '已结束',
    cancelled: '已取消'
  }
  return texts[status] || status
}

const getCategoryText = (category: string) => {
  const texts = {
    general: '通用',
    professional: '专业',
    skill: '技能',
    management: '管理'
  }
  return texts[category] || category
}

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('zh-CN')
}

const formatDateTime = (dateString: string) => {
  return new Date(dateString).toLocaleString('zh-CN')
}

const formatDuration = (minutes: number) => {
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  return hours > 0 ? `${hours}h${mins}m` : `${mins}m`
}

// 操作方法
const createCourse = () => {
  showCourseForm.value = true
}

const viewCourse = (course: any) => {
  selectedCourse.value = course
  showDetailDialog.value = true
}

const editCourse = (course: any) => {
  selectedCourse.value = course
  showCourseForm.value = true
}

const startCourse = (course: any) => {
  ElMessageBox.confirm('确定开始这门课程吗？', '开始授课', {
    confirmButtonText: '开始',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    course.status = 'ongoing'
    course.onlineCount = course.participants?.length || 0
    course.interactionCount = 0
    ElMessage.success('课程已开始')
  })
}

const enterLiveMode = (course: any) => {
  selectedCourse.value = course
  showLiveDialog.value = true
}

const viewCourseReport = (course: any) => {
  ElMessage.info(`查看课程"${course.courseName}"的教学报告`)
}

const handleCourseAction = (action: string, course: any) => {
  switch (action) {
    case 'edit':
      editCourse(course)
      break
    case 'start':
      startCourse(course)
      break
    case 'end':
      handleCourseEnd(course)
      break
    case 'cancel':
      handleCourseCancel(course)
      break
  }
}

const handleCourseSave = (courseData: any) => {
  if (selectedCourse.value) {
    // 编辑现有课程
    selectedCourse.value.courseName = courseData.courseName
    selectedCourse.value.category = courseData.category
    selectedCourse.value.startTime = courseData.startTime
    selectedCourse.value.endTime = courseData.endTime
    selectedCourse.value.credit = courseData.credit
    selectedCourse.value.duration = courseData.duration
    selectedCourse.value.lecturer = courseData.lecturer
    selectedCourse.value.needSign = courseData.needSign
    selectedCourse.value.courseDesc = courseData.courseDesc
    selectedCourse.value.lecturerDesc = courseData.lecturerDesc
    ElMessage.success('课程更新成功')
  } else {
    // 新建课程
    const newCourse = {
      id: `course-${Date.now()}`,
      ...courseData,
      status: 'pending',
      participants: [],
      rating: 0
    }
    courses.value.push(newCourse)
    ElMessage.success('课程创建成功')
  }
  selectedCourse.value = null
}

const handleCourseEnd = (course: any) => {
  course.status = 'completed'
  showLiveDialog.value = false
  ElMessage.success('课程已结束')
}

const handleCourseCancel = (course: any) => {
  ElMessageBox.confirm('确定取消这门课程吗？', '取消课程', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    course.status = 'cancelled'
    ElMessage.success('课程已取消')
  })
}

// 生命周期
onMounted(() => {
  // 初始化数据
})
</script>

<style scoped>
.face-to-face-management {
  padding: 20px;
  background: #f5f7fa;
  min-height: 100vh;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 20px;
  padding: 20px;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.header-content h1 {
  margin: 0 0 8px 0;
  font-size: 24px;
  color: #333;
}

.header-content p {
  margin: 0;
  color: #666;
  font-size: 14px;
}

.filter-section {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding: 16px 20px;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.filter-left {
  display: flex;
  gap: 12px;
  align-items: center;
}

.stats-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
  margin-bottom: 20px;
}

.stats-card {
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.course-list {
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  padding: 20px;
}

.list-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.list-header h3 {
  margin: 0;
  font-size: 18px;
  color: #333;
}

.course-cards {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
  gap: 20px;
}

.course-card {
  border: 1px solid #e8e8e8;
  border-radius: 8px;
  padding: 20px;
  background: #fff;
  transition: all 0.3s;
}

.course-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.course-card.ongoing {
  border-color: #67c23a;
  background: linear-gradient(135deg, #fff 0%, #f0f9ff 100%);
}

.course-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.course-content h4 {
  margin: 0 0 12px 0;
  font-size: 16px;
  color: #333;
  font-weight: 600;
}

.course-meta {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
  margin-bottom: 12px;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
  color: #666;
}

.course-participants {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  font-size: 14px;
  color: #666;
}

.rating {
  color: #f56c6c;
  font-weight: 500;
}

.live-status {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  background: #f0f9ff;
  border: 1px solid #b3d8ff;
  border-radius: 6px;
  margin-bottom: 12px;
}

.live-indicator {
  display: flex;
  align-items: center;
  gap: 6px;
  color: #409eff;
  font-weight: 500;
}

.live-dot {
  width: 8px;
  height: 8px;
  background: #67c23a;
  border-radius: 50%;
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0% { opacity: 1; }
  50% { opacity: 0.5; }
  100% { opacity: 1; }
}

.live-stats {
  display: flex;
  gap: 12px;
  font-size: 12px;
  color: #666;
}

.course-footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}
</style> 