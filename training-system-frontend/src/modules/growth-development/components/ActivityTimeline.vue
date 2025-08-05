<template>
  <div class="activity-timeline">
    <!-- 活动类型筛选 -->
    <div class="timeline-filters">
      <el-radio-group v-model="activeFilter" @change="filterActivities">
        <el-radio-button label="all">全部活动</el-radio-button>
        <el-radio-button label="learning">学习记录</el-radio-button>
        <el-radio-button label="todo">待办提醒</el-radio-button>
        <el-radio-button label="achievement">成长动态</el-radio-button>
      </el-radio-group>
      
      <div class="timeline-actions">
        <el-button size="small" @click="showAddActivityDialog = true">
          <el-icon><Plus /></el-icon>
          添加学习记录
        </el-button>
        <el-button size="small" @click="refreshActivities">
          <el-icon><Refresh /></el-icon>
          刷新
        </el-button>
      </div>
    </div>

    <!-- 时间轴内容 -->
    <div class="timeline-content">
      <el-timeline>
        <el-timeline-item
          v-for="activity in filteredActivities"
          :key="activity.id"
          :timestamp="formatTimestamp(activity.timestamp)"
          :type="getTimelineType(activity.type)"
          :icon="getTimelineIcon(activity.type)"
          :size="activity.important ? 'large' : 'normal'"
        >
          <div class="activity-card" :class="activity.type">
            <div class="activity-header">
              <div class="activity-title">
                <h4>{{ activity.title }}</h4>
                <div class="activity-badges">
                  <el-tag 
                    :type="getActivityTagType(activity.type)" 
                    size="small"
                  >
                    {{ getActivityTypeText(activity.type) }}
                  </el-tag>
                  <el-tag 
                    v-if="activity.important" 
                    type="danger" 
                    size="small"
                  >
                    重要
                  </el-tag>
                </div>
              </div>
              <div class="activity-actions">
                <el-dropdown @command="(command) => handleActivityAction(command, activity)">
                  <el-button size="small" text>
                    <el-icon><More /></el-icon>
                  </el-button>
                  <template #dropdown>
                    <el-dropdown-menu>
                      <el-dropdown-item command="view">查看详情</el-dropdown-item>
                      <el-dropdown-item command="edit" v-if="activity.type === 'learning'">编辑</el-dropdown-item>
                      <el-dropdown-item command="complete" v-if="activity.type === 'todo'">标记完成</el-dropdown-item>
                      <el-dropdown-item command="share">分享</el-dropdown-item>
                      <el-dropdown-item command="delete" divided>删除</el-dropdown-item>
                    </el-dropdown-menu>
                  </template>
                </el-dropdown>
              </div>
            </div>
            
            <div class="activity-content">
              <p>{{ activity.description }}</p>
              
              <!-- 学习记录特殊内容 -->
              <div v-if="activity.type === 'learning'" class="learning-details">
                <div class="learning-stats">
                  <div class="stat-item">
                    <el-icon><Clock /></el-icon>
                    <span>{{ activity.duration }}小时</span>
                  </div>
                  <div class="stat-item" v-if="activity.rating">
                    <el-icon><Star /></el-icon>
                    <el-rate 
                      v-model="activity.rating" 
                      :max="5" 
                      size="small"
                      disabled
                    />
                  </div>
                </div>
                <div v-if="activity.tags" class="learning-tags">
                  <el-tag 
                    v-for="tag in activity.tags" 
                    :key="tag"
                    size="small"
                    class="tag-item"
                  >
                    {{ tag }}
                  </el-tag>
                </div>
              </div>
              
              <!-- 待办提醒特殊内容 -->
              <div v-if="activity.type === 'todo'" class="todo-details">
                <div class="todo-progress">
                  <span class="progress-label">完成进度：</span>
                  <el-progress 
                    :percentage="activity.progress || 0" 
                    :stroke-width="6"
                    :show-text="false"
                  />
                  <span class="progress-text">{{ activity.progress || 0 }}%</span>
                </div>
                <div class="todo-deadline">
                  <el-icon><Calendar /></el-icon>
                  <span :class="{ 'overdue': isOverdue(activity.deadline) }">
                    截止日期：{{ formatDate(activity.deadline) }}
                  </span>
                </div>
              </div>
              
              <!-- 成长动态特殊内容 -->
              <div v-if="activity.type === 'achievement'" class="achievement-details">
                <div class="achievement-impact">
                  <el-icon><TrendCharts /></el-icon>
                  <span>影响力：{{ activity.impact }}</span>
                </div>
                <div v-if="activity.relatedGoals" class="related-goals">
                  <span class="goals-label">相关目标：</span>
                  <div class="goals-list">
                    <el-tag 
                      v-for="goal in activity.relatedGoals" 
                      :key="goal"
                      type="success"
                      size="small"
                    >
                      {{ goal }}
                    </el-tag>
                  </div>
                </div>
              </div>
            </div>
            
            <!-- 互动区域 -->
            <div class="activity-interactions">
              <div class="interaction-stats">
                <el-button size="small" text @click="toggleLike(activity)">
                  <el-icon :color="activity.liked ? '#f56c6c' : '#909399'">
                    <StarFilled v-if="activity.liked" />
                    <Star v-else />
                  </el-icon>
                  {{ activity.likes || 0 }}
                </el-button>
                <el-button size="small" text @click="showComments(activity)">
                  <el-icon><ChatDotSquare /></el-icon>
                  {{ activity.comments || 0 }}
                </el-button>
              </div>
              <div class="interaction-actions">
                <el-button size="small" text @click="shareActivity(activity)">
                  <el-icon><Share /></el-icon>
                  分享
                </el-button>
              </div>
            </div>
          </div>
        </el-timeline-item>
      </el-timeline>
      
      <!-- 加载更多 -->
      <div class="load-more" v-if="hasMore">
        <el-button @click="loadMore" :loading="loading">
          加载更多
        </el-button>
      </div>
      
      <!-- 空状态 -->
      <div v-if="filteredActivities.length === 0" class="empty-state">
        <el-empty description="暂无活动记录">
          <el-button type="primary" @click="showAddActivityDialog = true">
            添加第一个学习记录
          </el-button>
        </el-empty>
      </div>
    </div>

    <!-- 添加学习记录对话框 -->
    <el-dialog
      v-model="showAddActivityDialog"
      title="添加学习记录"
      width="600px"
    >
      <el-form :model="newActivity" :rules="activityRules" ref="activityFormRef" label-width="120px">
        <el-form-item label="学习标题" prop="title">
          <el-input v-model="newActivity.title" placeholder="请输入学习内容标题" />
        </el-form-item>
        
        <el-form-item label="学习描述" prop="description">
          <el-input 
            v-model="newActivity.description" 
            type="textarea" 
            :rows="3"
            placeholder="详细描述你的学习内容和收获"
          />
        </el-form-item>
        
        <el-form-item label="学习时长" prop="duration">
          <el-input-number 
            v-model="newActivity.duration" 
            :min="0.5" 
            :max="24" 
            :step="0.5"
            :precision="1"
          />
          <span style="margin-left: 8px;">小时</span>
        </el-form-item>
        
        <el-form-item label="学习评价">
          <el-rate v-model="newActivity.rating" :max="5" show-text />
        </el-form-item>
        
        <el-form-item label="学习标签">
          <el-select 
            v-model="newActivity.tags" 
            multiple 
            filterable 
            allow-create
            placeholder="选择或输入学习标签"
          >
            <el-option 
              v-for="tag in commonTags" 
              :key="tag"
              :label="tag" 
              :value="tag"
            />
          </el-select>
        </el-form-item>
        
        <el-form-item label="相关目标">
          <el-select 
            v-model="newActivity.relatedGoals" 
            multiple 
            placeholder="选择相关的成长目标"
          >
            <el-option 
              v-for="goal in availableGoals" 
              :key="goal.id"
              :label="goal.title" 
              :value="goal.title"
            />
          </el-select>
        </el-form-item>
        
        <el-form-item label="学习证明">
          <el-upload
            class="upload-demo"
            drag
            multiple
            :file-list="newActivity.attachments"
          >
            <el-icon class="el-icon--upload"><Upload /></el-icon>
            <div class="el-upload__text">
              将文件拖到此处，或<em>点击上传</em>
            </div>
            <template #tip>
              <div class="el-upload__tip">
                支持上传学习笔记、证书、作业等文件
              </div>
            </template>
          </el-upload>
        </el-form-item>
      </el-form>
      
      <template #footer>
        <el-button @click="showAddActivityDialog = false">取消</el-button>
        <el-button type="primary" @click="addActivity">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { 
  Plus, 
  Refresh, 
  More, 
  Clock, 
  Star, 
  Calendar,
  TrendCharts,
  StarFilled,
  ChatDotSquare,
  Share,
  Upload
} from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'

// 响应式数据
const activeFilter = ref('all')
const showAddActivityDialog = ref(false)
const loading = ref(false)
const hasMore = ref(true)
const activityFormRef = ref()

// 新活动表单数据
const newActivity = ref({
  title: '',
  description: '',
  duration: 1,
  rating: 5,
  tags: [],
  relatedGoals: [],
  attachments: []
})

// 表单验证规则
const activityRules = {
  title: [{ required: true, message: '请输入学习标题', trigger: 'blur' }],
  description: [{ required: true, message: '请输入学习描述', trigger: 'blur' }],
  duration: [{ required: true, message: '请输入学习时长', trigger: 'blur' }]
}

// 常用标签
const commonTags = ref([
  '技术学习', '管理培训', '软技能', '行业知识', '工具使用',
  '项目经验', '团队协作', '创新思维', '问题解决', '沟通技巧'
])

// 可用目标
const availableGoals = ref([
  { id: 'goal-1', title: '晋升为技术负责人' },
  { id: 'goal-2', title: '掌握AI工具应用' },
  { id: 'goal-3', title: '改善时间管理' },
  { id: 'goal-4', title: '完成架构师认证' }
])

// 活动数据
const activities = ref([
  {
    id: 'activity-1',
    type: 'learning',
    title: '完成Vue 3深度学习',
    description: '系统学习了Vue 3的组合式API、响应式原理和性能优化技巧，通过实际项目练习加深理解。',
    timestamp: new Date('2024-01-20T14:30:00'),
    duration: 8,
    rating: 5,
    tags: ['技术学习', 'Vue.js', '前端开发'],
    relatedGoals: ['掌握AI工具应用'],
    likes: 12,
    comments: 3,
    liked: false,
    important: true
  },
  {
    id: 'activity-2',
    type: 'todo',
    title: '准备技术分享演讲',
    description: '为下周的技术分享会准备关于微服务架构的演讲内容，包括PPT制作和演示Demo。',
    timestamp: new Date('2024-01-19T09:00:00'),
    deadline: new Date('2024-01-25T18:00:00'),
    progress: 75,
    relatedGoals: ['晋升为技术负责人'],
    likes: 5,
    comments: 1,
    liked: true,
    important: false
  },
  {
    id: 'activity-3',
    type: 'achievement',
    title: '获得AWS认证',
    description: '成功通过AWS Solutions Architect认证考试，提升了云架构设计能力。',
    timestamp: new Date('2024-01-18T16:45:00'),
    impact: '高',
    relatedGoals: ['完成架构师认证'],
    likes: 25,
    comments: 8,
    liked: true,
    important: true
  },
  {
    id: 'activity-4',
    type: 'learning',
    title: '参加敏捷开发培训',
    description: '参加了为期两天的敏捷开发培训，学习了Scrum框架和敏捷实践方法。',
    timestamp: new Date('2024-01-17T10:00:00'),
    duration: 16,
    rating: 4,
    tags: ['管理培训', '敏捷开发', '团队协作'],
    relatedGoals: ['晋升为技术负责人'],
    likes: 8,
    comments: 2,
    liked: false,
    important: false
  },
  {
    id: 'activity-5',
    type: 'todo',
    title: '制定个人OKR',
    description: '根据公司战略目标，制定个人的OKR，明确本季度的关键结果。',
    timestamp: new Date('2024-01-16T13:20:00'),
    deadline: new Date('2024-01-22T17:00:00'),
    progress: 30,
    relatedGoals: ['改善时间管理'],
    likes: 3,
    comments: 0,
    liked: false,
    important: true
  }
])

// 计算属性
const filteredActivities = computed(() => {
  if (activeFilter.value === 'all') {
    return activities.value
  }
  return activities.value.filter(activity => activity.type === activeFilter.value)
})

// 方法
const formatTimestamp = (timestamp: Date) => {
  return timestamp.toLocaleString('zh-CN', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const formatDate = (date: Date) => {
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

const isOverdue = (deadline: Date) => {
  return new Date() > deadline
}

const getTimelineType = (type: string) => {
  const typeMap = {
    learning: 'primary',
    todo: 'warning',
    achievement: 'success'
  }
  return typeMap[type] || 'info'
}

const getTimelineIcon = (type: string) => {
  const iconMap = {
    learning: 'Reading',
    todo: 'Clock',
    achievement: 'Trophy'
  }
  return iconMap[type] || 'InfoFilled'
}

const getActivityTagType = (type: string) => {
  const tagMap = {
    learning: 'primary',
    todo: 'warning',
    achievement: 'success'
  }
  return tagMap[type] || 'info'
}

const getActivityTypeText = (type: string) => {
  const textMap = {
    learning: '学习记录',
    todo: '待办事项',
    achievement: '成长动态'
  }
  return textMap[type] || type
}

const filterActivities = () => {
  console.log('Filter changed to:', activeFilter.value)
}

const refreshActivities = () => {
  loading.value = true
  setTimeout(() => {
    loading.value = false
    ElMessage.success('活动列表已刷新')
  }, 1000)
}

const loadMore = () => {
  loading.value = true
  setTimeout(() => {
    loading.value = false
    hasMore.value = false
    ElMessage.info('没有更多活动了')
  }, 1000)
}

const handleActivityAction = (command: string, activity: any) => {
  console.log('Action:', command, 'Activity:', activity)
  
  switch (command) {
    case 'view':
      ElMessage.info('查看详情功能开发中...')
      break
    case 'edit':
      ElMessage.info('编辑功能开发中...')
      break
    case 'complete':
      activity.progress = 100
      ElMessage.success('任务已标记为完成')
      break
    case 'share':
      shareActivity(activity)
      break
    case 'delete':
      deleteActivity(activity)
      break
  }
}

const toggleLike = (activity: any) => {
  activity.liked = !activity.liked
  if (activity.liked) {
    activity.likes = (activity.likes || 0) + 1
  } else {
    activity.likes = Math.max(0, (activity.likes || 0) - 1)
  }
}

const showComments = (activity: any) => {
  ElMessage.info('评论功能开发中...')
}

const shareActivity = (activity: any) => {
  ElMessage.success('活动分享链接已复制到剪贴板')
}

const deleteActivity = (activity: any) => {
  const index = activities.value.findIndex(a => a.id === activity.id)
  if (index !== -1) {
    activities.value.splice(index, 1)
    ElMessage.success('活动已删除')
  }
}

const addActivity = async () => {
  if (!activityFormRef.value) return
  
  try {
    await activityFormRef.value.validate()
    
    const activityData = {
      ...newActivity.value,
      id: `activity-${Date.now()}`,
      type: 'learning',
      timestamp: new Date(),
      likes: 0,
      comments: 0,
      liked: false,
      important: false
    }
    
    activities.value.unshift(activityData)
    
    ElMessage.success('学习记录添加成功！')
    showAddActivityDialog.value = false
    
    // 重置表单
    resetForm()
    
  } catch (error) {
    console.error('Form validation failed:', error)
  }
}

const resetForm = () => {
  newActivity.value = {
    title: '',
    description: '',
    duration: 1,
    rating: 5,
    tags: [],
    relatedGoals: [],
    attachments: []
  }
}

// 组件挂载
onMounted(() => {
  console.log('ActivityTimeline mounted')
})
</script>

<style scoped>
.activity-timeline {
  height: 100%;
}

.timeline-filters {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  padding: 16px;
  background: #f8f9fa;
  border-radius: 8px;
}

.timeline-actions {
  display: flex;
  gap: 8px;
}

.timeline-content {
  max-height: 600px;
  overflow-y: auto;
}

.activity-card {
  background: white;
  border: 1px solid #e4e7ed;
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 16px;
  transition: all 0.3s;
}

.activity-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.activity-card.learning {
  border-left: 4px solid #409eff;
}

.activity-card.todo {
  border-left: 4px solid #e6a23c;
}

.activity-card.achievement {
  border-left: 4px solid #67c23a;
}

.activity-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 12px;
}

.activity-title h4 {
  margin: 0 0 8px 0;
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}

.activity-badges {
  display: flex;
  gap: 8px;
}

.activity-content {
  margin-bottom: 16px;
}

.activity-content p {
  margin: 0 0 12px 0;
  font-size: 14px;
  color: #606266;
  line-height: 1.6;
}

/* 学习记录特殊样式 */
.learning-details {
  padding: 12px;
  background: #f0f9ff;
  border-radius: 6px;
  margin-top: 12px;
}

.learning-stats {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 8px;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 14px;
  color: #606266;
}

.learning-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.tag-item {
  font-size: 12px;
}

/* 待办事项特殊样式 */
.todo-details {
  padding: 12px;
  background: #fdf6ec;
  border-radius: 6px;
  margin-top: 12px;
}

.todo-progress {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.progress-label {
  font-size: 14px;
  color: #606266;
  width: 80px;
}

.progress-text {
  font-size: 14px;
  color: #303133;
  font-weight: 500;
}

.todo-deadline {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 14px;
  color: #606266;
}

.todo-deadline .overdue {
  color: #f56c6c;
  font-weight: 500;
}

/* 成长动态特殊样式 */
.achievement-details {
  padding: 12px;
  background: #f0f9ff;
  border-radius: 6px;
  margin-top: 12px;
}

.achievement-impact {
  display: flex;
  align-items: center;
  gap: 4px;
  margin-bottom: 8px;
  font-size: 14px;
  color: #606266;
}

.related-goals {
  display: flex;
  align-items: center;
  gap: 8px;
}

.goals-label {
  font-size: 14px;
  color: #606266;
}

.goals-list {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

/* 互动区域 */
.activity-interactions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 12px;
  border-top: 1px solid #f0f2f5;
}

.interaction-stats {
  display: flex;
  gap: 16px;
}

.interaction-actions {
  display: flex;
  gap: 8px;
}

/* 加载更多 */
.load-more {
  text-align: center;
  padding: 20px;
}

.empty-state {
  text-align: center;
  padding: 40px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .timeline-filters {
    flex-direction: column;
    gap: 12px;
  }
  
  .activity-header {
    flex-direction: column;
    gap: 12px;
  }
  
  .learning-stats {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }
  
  .todo-progress {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }
  
  .activity-interactions {
    flex-direction: column;
    gap: 12px;
  }
  
  .related-goals {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }
}
</style> 