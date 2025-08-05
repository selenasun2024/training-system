<template>
  <div class="mentorship-dashboard">
    <!-- 学员工作台 -->
    <div v-if="userRole === 'student'" class="student-dashboard">
      <div class="dashboard-header">
        <h2>我的学习工作台</h2>
        <p>与导师携手成长，让每一步都更有方向</p>
      </div>
      
      <div class="dashboard-grid">
        <!-- 我的导师 -->
        <div class="dashboard-card mentor-card">
          <div class="card-header">
            <h3>我的导师</h3>
            <el-tag v-if="currentMentor" type="success">活跃</el-tag>
          </div>
          <div v-if="currentMentor" class="mentor-info">
            <div class="mentor-avatar">
              <el-avatar :size="60" :src="currentMentor.avatar">
                {{ currentMentor.name[0] }}
              </el-avatar>
            </div>
            <div class="mentor-details">
              <h4>{{ currentMentor.name }}</h4>
              <p class="mentor-title">{{ currentMentor.title }}</p>
              <p class="mentor-expertise">专长：{{ currentMentor.expertise.join('、') }}</p>
              <div class="mentor-stats">
                <span>带教经验：{{ currentMentor.experience }}年</span>
                <span>满意度：{{ currentMentor.rating }}分</span>
              </div>
            </div>
          </div>
          <div v-else class="no-mentor">
            <el-empty description="暂无导师">
              <el-button type="primary" @click="requestMentor">申请导师</el-button>
            </el-empty>
          </div>
        </div>

        <!-- 学习进度 -->
        <div class="dashboard-card progress-card">
          <div class="card-header">
            <h3>学习进度</h3>
            <el-progress :percentage="learningProgress" :stroke-width="8" />
          </div>
          <div class="progress-details">
            <div class="progress-item">
              <span class="label">总任务：</span>
              <span class="value">{{ totalTasks }}个</span>
            </div>
            <div class="progress-item">
              <span class="label">已完成：</span>
              <span class="value">{{ completedTasks }}个</span>
            </div>
            <div class="progress-item">
              <span class="label">进行中：</span>
              <span class="value">{{ activeTasks }}个</span>
            </div>
            <div class="progress-item">
              <span class="label">下次里程碑：</span>
              <span class="value">{{ nextMilestone }}</span>
            </div>
          </div>
          <!-- 新增：学习进度图表 -->
          <div class="progress-chart-container">
            <canvas ref="progressChart" width="300" height="200"></canvas>
          </div>
        </div>

        <!-- 最新消息 -->
        <div class="dashboard-card messages-card">
          <div class="card-header">
            <h3>最新消息</h3>
            <el-badge :value="unreadCount" class="message-badge">
              <el-icon><ChatDotRound /></el-icon>
            </el-badge>
          </div>
          <div class="message-list">
            <div 
              v-for="message in recentMessages" 
              :key="message.id"
              class="message-item"
              :class="{ 'unread': !message.read }"
            >
              <div class="message-content">
                <p class="message-text">{{ message.content }}</p>
                <span class="message-time">{{ formatTime(message.time) }}</span>
              </div>
              <div class="message-type">
                <el-tag :type="getMessageTypeColor(message.type)" size="small">
                  {{ message.type }}
                </el-tag>
              </div>
            </div>
          </div>
        </div>

        <!-- 快捷操作 -->
        <div class="dashboard-card actions-card">
          <div class="card-header">
            <h3>快捷操作</h3>
          </div>
          <div class="action-buttons">
            <el-button type="primary" :icon="Edit" @click="submitAssignment">
              提交作业
            </el-button>
            <el-button type="success" :icon="Phone" @click="requestGuidance">
              申请辅导
            </el-button>
            <el-button type="info" :icon="Document" @click="writeReflection">
              记录心得
            </el-button>
            <el-button type="warning" :icon="Calendar" @click="scheduleSession">
              预约面谈
            </el-button>
          </div>
        </div>
      </div>
    </div>

    <!-- 导师工作台 -->
    <div v-else-if="userRole === 'mentor'" class="mentor-dashboard">
      <div class="dashboard-header">
        <h2>导师工作台</h2>
        <p>用心培养每一位学员，传承知识与经验</p>
      </div>
      
      <div class="dashboard-grid">
        <!-- 我的学员 -->
        <div class="dashboard-card students-card">
          <div class="card-header">
            <h3>我的学员</h3>
            <el-tag type="primary">{{ studentList.length }}人</el-tag>
          </div>
          <div class="student-list">
            <div 
              v-for="student in studentList" 
              :key="student.id"
              class="student-item"
              @click="viewStudentDetails(student.id)"
            >
              <el-avatar :size="40" :src="student.avatar">
                {{ student.name[0] }}
              </el-avatar>
              <div class="student-info">
                <h4>{{ student.name }}</h4>
                <p>{{ student.department }}</p>
                <div class="student-progress">
                  <el-progress :percentage="student.progress" :show-text="false" />
                  <span class="progress-text">{{ student.progress }}%</span>
                </div>
              </div>
              <div class="student-status">
                <el-icon 
                  :color="getStatusColor(student.status)" 
                  :class="getStatusIcon(student.status)"
                />
              </div>
            </div>
          </div>
        </div>

        <!-- 待办任务 -->
        <div class="dashboard-card todos-card">
          <div class="card-header">
            <h3>待办任务</h3>
            <el-badge :value="todoCount" class="todo-badge">
              <el-icon><List /></el-icon>
            </el-badge>
          </div>
          <div class="todo-list">
            <div 
              v-for="todo in todoList" 
              :key="todo.id"
              class="todo-item"
              :class="{ 'urgent': todo.urgent }"
            >
              <div class="todo-content">
                <p class="todo-title">{{ todo.title }}</p>
                <p class="todo-description">{{ todo.description }}</p>
                <span class="todo-deadline">截止：{{ formatDate(todo.deadline) }}</span>
              </div>
              <div class="todo-actions">
                <el-button type="primary" size="small" @click="handleTodo(todo.id)">
                  处理
                </el-button>
              </div>
            </div>
          </div>
        </div>

        <!-- 成就展示 -->
        <div class="dashboard-card achievements-card">
          <div class="card-header">
            <h3>我的成就</h3>
            <el-icon class="achievement-icon"><Trophy /></el-icon>
          </div>
          <div class="achievement-stats">
            <div class="stat-item">
              <div class="stat-number">{{ mentorStats.totalStudents }}</div>
              <div class="stat-label">累计学员</div>
            </div>
            <div class="stat-item">
              <div class="stat-number">{{ mentorStats.totalHours }}</div>
              <div class="stat-label">带教时长</div>
            </div>
            <div class="stat-item">
              <div class="stat-number">{{ mentorStats.rating }}</div>
              <div class="stat-label">满意度</div>
            </div>
            <div class="stat-item">
              <div class="stat-number">{{ mentorStats.completionRate }}%</div>
              <div class="stat-label">完成率</div>
            </div>
          </div>
          <div class="achievement-badges">
            <el-tag 
              v-for="badge in mentorBadges" 
              :key="badge.id"
              :type="badge.type"
              class="badge-item"
            >
              {{ badge.name }}
            </el-tag>
          </div>
          <!-- 新增：导师满意度分析雷达图 -->
          <div class="satisfaction-chart-container">
            <h4>能力评估</h4>
            <canvas ref="satisfactionChart" width="300" height="200"></canvas>
          </div>
        </div>

        <!-- 资源推荐 -->
        <div class="dashboard-card resources-card">
          <div class="card-header">
            <h3>资源推荐</h3>
          </div>
          <div class="resource-list">
            <div 
              v-for="resource in resourceList" 
              :key="resource.id"
              class="resource-item"
            >
              <div class="resource-icon">
                <el-icon :color="resource.color">
                  <component :is="resource.icon" />
                </el-icon>
              </div>
              <div class="resource-content">
                <h4>{{ resource.title }}</h4>
                <p>{{ resource.description }}</p>
              </div>
              <div class="resource-action">
                <el-button type="text" @click="viewResource(resource.id)">
                  查看
                </el-button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 管理者工作台 -->
    <div v-else-if="['manager', 'hr', 'academic'].includes(userRole)" class="manager-dashboard">
      <div class="dashboard-header">
        <h2>{{ getDashboardTitle() }}</h2>
        <p>统筹师徒关系，优化带教效果</p>
      </div>
      
      <div class="dashboard-grid">
        <!-- 部门概览 -->
        <div class="dashboard-card overview-card">
          <div class="card-header">
            <h3>部门概览</h3>
            <el-button type="text" @click="viewFullReport">详细报告</el-button>
          </div>
          <div class="overview-stats">
            <div class="overview-chart">
              <canvas ref="overviewChart" width="300" height="200"></canvas>
            </div>
            <div class="overview-numbers">
              <div class="number-item">
                <div class="number">{{ departmentStats.totalProjects }}</div>
                <div class="label">进行中项目</div>
              </div>
              <div class="number-item">
                <div class="number">{{ departmentStats.totalMentors }}</div>
                <div class="label">活跃导师</div>
              </div>
              <div class="number-item">
                <div class="number">{{ departmentStats.totalStudents }}</div>
                <div class="label">学员总数</div>
              </div>
              <div class="number-item">
                <div class="number">{{ departmentStats.averageProgress }}%</div>
                <div class="label">平均进度</div>
              </div>
            </div>
          </div>
        </div>

        <!-- 待处理事项 -->
        <div class="dashboard-card pending-card">
          <div class="card-header">
            <h3>待处理事项</h3>
            <el-badge :value="pendingCount" class="pending-badge">
              <el-icon><Bell /></el-icon>
            </el-badge>
          </div>
          <div class="pending-list">
            <div 
              v-for="item in pendingItems" 
              :key="item.id"
              class="pending-item"
              :class="{ 'high-priority': item.priority === 'high' }"
            >
              <div class="pending-content">
                <p class="pending-title">{{ item.title }}</p>
                <p class="pending-description">{{ item.description }}</p>
                <span class="pending-time">{{ formatTime(item.time) }}</span>
              </div>
              <div class="pending-actions">
                <el-button type="primary" size="small" @click="handlePending(item.id)">
                  处理
                </el-button>
              </div>
            </div>
          </div>
        </div>

        <!-- 绩效数据 -->
        <div class="dashboard-card performance-card">
          <div class="card-header">
            <h3>绩效数据</h3>
            <el-select v-model="selectedPeriod" size="small">
              <el-option label="本月" value="month" />
              <el-option label="本季度" value="quarter" />
              <el-option label="本年度" value="year" />
            </el-select>
          </div>
          <div class="performance-charts">
            <div class="chart-container">
              <canvas ref="performanceChart" width="250" height="150"></canvas>
            </div>
            <div class="performance-indicators">
              <div class="indicator-item">
                <div class="indicator-value">{{ performanceData.completionRate }}%</div>
                <div class="indicator-label">完成率</div>
                <div class="indicator-trend up">↑ 5%</div>
              </div>
              <div class="indicator-item">
                <div class="indicator-value">{{ performanceData.satisfaction }}</div>
                <div class="indicator-label">满意度</div>
                <div class="indicator-trend up">↑ 0.2</div>
              </div>
            </div>
          </div>
        </div>

        <!-- 决策支持 -->
        <div class="dashboard-card insights-card">
          <div class="card-header">
            <h3>决策支持</h3>
          </div>
          <div class="insights-list">
            <div 
              v-for="insight in insightsList" 
              :key="insight.id"
              class="insight-item"
            >
              <div class="insight-icon">
                <el-icon :color="insight.color">
                  <component :is="insight.icon" />
                </el-icon>
              </div>
              <div class="insight-content">
                <h4>{{ insight.title }}</h4>
                <p>{{ insight.description }}</p>
                <div class="insight-actions">
                  <el-button type="text" @click="viewInsight(insight.id)">
                    查看详情
                  </el-button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount } from 'vue';
import { 
  Edit, 
  Phone, 
  Document, 
  Calendar,
  ChatDotRound,
  List,
  Trophy,
  Bell,
  TrendCharts,
  Warning,
  CircleCheck
} from '@element-plus/icons-vue';
import { ElMessage } from 'element-plus';

// 新增：图表功能
import { Chart, registerables } from 'chart.js';
Chart.register(...registerables);

// Props
interface Props {
  userRole: string;
  userId: string;
}

const props = defineProps<Props>();

// Emits
const emit = defineEmits<{
  createProject: [];
}>();

// 图表引用
const overviewChart = ref<HTMLCanvasElement>();
const performanceChart = ref<HTMLCanvasElement>();
const progressChart = ref<HTMLCanvasElement>();
const satisfactionChart = ref<HTMLCanvasElement>();

// 图表实例
let overviewChartInstance: Chart | null = null;
let performanceChartInstance: Chart | null = null;
let progressChartInstance: Chart | null = null;
let satisfactionChartInstance: Chart | null = null;

// 响应式数据
const selectedPeriod = ref('month');
const unreadCount = ref(5);
const todoCount = ref(3);
const pendingCount = ref(8);

// 学员相关数据
const currentMentor = ref({
  id: '1',
  name: '张导师',
  title: '高级技术专家',
  expertise: ['前端开发', '项目管理', '团队建设'],
  experience: 5,
  rating: 4.8,
  avatar: ''
});

const learningProgress = ref(65);
const totalTasks = ref(20);
const completedTasks = ref(13);
const activeTasks = ref(3);
const nextMilestone = ref('2024-01-15');

const recentMessages = ref([
  {
    id: 1,
    content: '您提交的周报已审核通过',
    time: new Date('2024-01-10 14:30'),
    type: '反馈',
    read: false
  },
  {
    id: 2,
    content: '新的学习任务已发布',
    time: new Date('2024-01-10 10:00'),
    type: '任务',
    read: false
  },
  {
    id: 3,
    content: '面谈预约确认',
    time: new Date('2024-01-09 16:45'),
    type: '预约',
    read: true
  }
]);

// 导师相关数据
const studentList = ref([
  {
    id: '1',
    name: '小李',
    department: '技术部',
    progress: 75,
    status: 'active',
    avatar: ''
  },
  {
    id: '2',
    name: '小王',
    department: '产品部',
    progress: 45,
    status: 'warning',
    avatar: ''
  },
  {
    id: '3',
    name: '小张',
    department: '设计部',
    progress: 90,
    status: 'completed',
    avatar: ''
  }
]);

const todoList = ref([
  {
    id: 1,
    title: '审核小李的周报',
    description: '需要对本周学习情况进行评估',
    deadline: new Date('2024-01-12'),
    urgent: false
  },
  {
    id: 2,
    title: '准备面谈材料',
    description: '为小王的月度面谈准备相关材料',
    deadline: new Date('2024-01-11'),
    urgent: true
  }
]);

const mentorStats = ref({
  totalStudents: 12,
  totalHours: 150,
  rating: 4.7,
  completionRate: 85
});

const mentorBadges = ref([
  { id: 1, name: '金牌导师', type: 'warning' },
  { id: 2, name: '专业标杆', type: 'success' },
  { id: 3, name: '传承达人', type: 'primary' }
]);

const resourceList = ref([
  {
    id: 1,
    title: '最新培训资料',
    description: '2024年度技能提升课程',
    icon: 'Document',
    color: '#409EFF'
  },
  {
    id: 2,
    title: '最佳实践案例',
    description: '成功带教经验分享',
    icon: 'Trophy',
    color: '#67C23A'
  }
]);

// 管理者相关数据
const departmentStats = ref({
  totalProjects: 45,
  totalMentors: 18,
  totalStudents: 67,
  averageProgress: 72
});

const pendingItems = ref([
  {
    id: 1,
    title: '师徒匹配申请',
    description: '3位新员工需要分配导师',
    time: new Date('2024-01-10 09:00'),
    priority: 'high'
  },
  {
    id: 2,
    title: '带教效果评估',
    description: '技术部12月份带教效果需要评估',
    time: new Date('2024-01-09 15:30'),
    priority: 'medium'
  }
]);

const performanceData = ref({
  completionRate: 85,
  satisfaction: 4.6
});

const insightsList = ref([
  {
    id: 1,
    title: '导师负荷分析',
    description: '发现3位导师负荷过重，建议重新分配',
    icon: 'Warning',
    color: '#E6A23C'
  },
  {
    id: 2,
    title: '优秀实践推广',
    description: '张导师的带教方法值得在全部门推广',
    icon: 'CircleCheck',
    color: '#67C23A'
  }
]);

// 计算属性
const dashboardClass = computed(() => {
  return `${props.userRole}-dashboard`;
});

// 方法
const formatTime = (time: Date) => {
  const now = new Date();
  const diff = now.getTime() - time.getTime();
  const minutes = Math.floor(diff / (1000 * 60));
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  
  if (minutes < 60) {
    return `${minutes}分钟前`;
  } else if (hours < 24) {
    return `${hours}小时前`;
  } else {
    return `${days}天前`;
  }
};

const formatDate = (date: Date) => {
  return date.toLocaleDateString('zh-CN');
};

const getMessageTypeColor = (type: string) => {
  const colors = {
    '反馈': 'success',
    '任务': 'warning',
    '预约': 'info'
  };
  return colors[type] || 'primary';
};

const getStatusColor = (status: string) => {
  const colors = {
    'active': '#67C23A',
    'warning': '#E6A23C',
    'completed': '#409EFF'
  };
  return colors[status] || '#909399';
};

const getStatusIcon = (status: string) => {
  const icons = {
    'active': 'CircleCheck',
    'warning': 'Warning',
    'completed': 'Select'
  };
  return icons[status] || 'InfoFilled';
};

const getDashboardTitle = () => {
  const titles = {
    'hr': 'HR管理工作台',
    'manager': '管理者工作台',
    'academic': '教务管理工作台'
  };
  return titles[props.userRole] || '管理工作台';
};

// 学员操作
const requestMentor = () => {
  ElMessage.info('导师申请已提交');
};

const submitAssignment = () => {
  ElMessage.success('作业提交成功');
};

const requestGuidance = () => {
  ElMessage.info('辅导申请已发送');
};

const writeReflection = () => {
  ElMessage.success('心得记录已保存');
};

const scheduleSession = () => {
  ElMessage.info('面谈预约已提交');
};

// 导师操作
const viewStudentDetails = (studentId: string) => {
  console.log('查看学员详情:', studentId);
};

const handleTodo = (todoId: number) => {
  console.log('处理待办:', todoId);
};

const viewResource = (resourceId: number) => {
  console.log('查看资源:', resourceId);
};

// 管理者操作
const viewFullReport = () => {
  console.log('查看完整报告');
};

const handlePending = (itemId: number) => {
  console.log('处理待办事项:', itemId);
};

const viewInsight = (insightId: number) => {
  console.log('查看洞察详情:', insightId);
};

// 新增：图表初始化函数
const initOverviewChart = () => {
  if (!overviewChart.value) return;
  
  const ctx = overviewChart.value.getContext('2d');
  if (!ctx) return;
  
  overviewChartInstance = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: ['进行中', '已完成', '已暂停'],
      datasets: [{
        data: [departmentStats.value.totalProjects, 28, 5],
        backgroundColor: [
          '#4F46E5', '#10B981', '#F59E0B'
        ],
        borderWidth: 0
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            usePointStyle: true,
            padding: 20,
            font: {
              size: 12
            }
          }
        }
      }
    }
  });
};

const initPerformanceChart = () => {
  if (!performanceChart.value) return;
  
  const ctx = performanceChart.value.getContext('2d');
  if (!ctx) return;
  
  performanceChartInstance = new Chart(ctx, {
    type: 'line',
    data: {
      labels: ['1月', '2月', '3月', '4月', '5月', '6月'],
      datasets: [{
        label: '完成率',
        data: [75, 78, 82, 85, 88, 85],
        borderColor: '#4F46E5',
        backgroundColor: 'rgba(79, 70, 229, 0.1)',
        fill: true,
        tension: 0.4
      }, {
        label: '满意度',
        data: [4.2, 4.3, 4.4, 4.6, 4.8, 4.6],
        borderColor: '#10B981',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        fill: true,
        tension: 0.4,
        yAxisID: 'y1'
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: {
          type: 'linear',
          display: true,
          position: 'left',
          max: 100,
          min: 0
        },
        y1: {
          type: 'linear',
          display: true,
          position: 'right',
          max: 5,
          min: 0,
          grid: {
            drawOnChartArea: false
          }
        }
      },
      plugins: {
        legend: {
          position: 'top',
          labels: {
            usePointStyle: true,
            padding: 20,
            font: {
              size: 12
            }
          }
        }
      }
    }
  });
};

const initProgressChart = () => {
  if (!progressChart.value) return;
  
  const ctx = progressChart.value.getContext('2d');
  if (!ctx) return;
  
  progressChartInstance = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: ['新员工', '技能提升', '管理培训', '专业认证', '跨部门'],
      datasets: [{
        label: '项目数量',
        data: [12, 8, 6, 4, 3],
        backgroundColor: '#4F46E5',
        borderRadius: 4
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false
        }
      },
      scales: {
        y: {
          beginAtZero: true
        }
      }
    }
  });
};

const initSatisfactionChart = () => {
  if (!satisfactionChart.value) return;
  
  const ctx = satisfactionChart.value.getContext('2d');
  if (!ctx) return;
  
  satisfactionChartInstance = new Chart(ctx, {
    type: 'radar',
    data: {
      labels: ['专业能力', '沟通技巧', '耐心程度', '响应速度', '指导效果'],
      datasets: [{
        label: '平均评分',
        data: [4.6, 4.8, 4.7, 4.5, 4.9],
        borderColor: '#4F46E5',
        backgroundColor: 'rgba(79, 70, 229, 0.2)',
        borderWidth: 2
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        r: {
          angleLines: {
            display: true
          },
          suggestedMin: 0,
          suggestedMax: 5
        }
      },
      plugins: {
        legend: {
          display: false
        }
      }
    }
  });
};

// 清理图表实例
const cleanupCharts = () => {
  if (overviewChartInstance) {
    overviewChartInstance.destroy();
    overviewChartInstance = null;
  }
  if (performanceChartInstance) {
    performanceChartInstance.destroy();
    performanceChartInstance = null;
  }
  if (progressChartInstance) {
    progressChartInstance.destroy();
    progressChartInstance = null;
  }
  if (satisfactionChartInstance) {
    satisfactionChartInstance.destroy();
    satisfactionChartInstance = null;
  }
};

// 页面初始化
onMounted(() => {
  // 这里可以加载相关数据
  console.log('Dashboard mounted for role:', props.userRole);
  
  // 初始化图表
  setTimeout(() => {
    initOverviewChart();
    initPerformanceChart();
    initProgressChart();
    initSatisfactionChart();
  }, 100);
});

// 组件卸载时清理
onBeforeUnmount(() => {
  cleanupCharts();
});
</script>

<style scoped>
.mentorship-dashboard {
  padding: 24px;
}

.dashboard-header {
  margin-bottom: 24px;
  text-align: center;
}

.dashboard-header h2 {
  font-size: 24px;
  color: #1f2937;
  margin: 0 0 8px 0;
}

.dashboard-header p {
  color: #6b7280;
  font-size: 14px;
  margin: 0;
}

.dashboard-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 24px;
  max-width: 1200px;
  margin: 0 auto;
}

.dashboard-card {
  background: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.dashboard-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid #e5e7eb;
}

.card-header h3 {
  font-size: 18px;
  color: #1f2937;
  margin: 0;
}

/* 学员工作台样式 */
.mentor-info {
  display: flex;
  gap: 16px;
  align-items: center;
}

.mentor-avatar {
  flex-shrink: 0;
}

.mentor-details h4 {
  margin: 0 0 4px 0;
  color: #1f2937;
}

.mentor-title {
  color: #6b7280;
  font-size: 14px;
  margin: 0 0 8px 0;
}

.mentor-expertise {
  color: #374151;
  font-size: 13px;
  margin: 0 0 8px 0;
}

.mentor-stats {
  display: flex;
  gap: 16px;
  font-size: 12px;
  color: #6b7280;
}

.progress-details {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.progress-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 14px;
}

.progress-item .label {
  color: #6b7280;
}

.progress-item .value {
  color: #1f2937;
  font-weight: 500;
}

.message-list {
  max-height: 200px;
  overflow-y: auto;
}

.message-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 0;
  border-bottom: 1px solid #f3f4f6;
}

.message-item:last-child {
  border-bottom: none;
}

.message-item.unread {
  background: #f8fafc;
  border-radius: 8px;
  padding: 12px;
  margin: 4px 0;
}

.message-content {
  flex: 1;
}

.message-text {
  margin: 0 0 4px 0;
  color: #1f2937;
  font-size: 14px;
}

.message-time {
  color: #6b7280;
  font-size: 12px;
}

.action-buttons {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

/* 导师工作台样式 */
.student-list {
  max-height: 300px;
  overflow-y: auto;
}

.student-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  border-radius: 8px;
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.student-item:hover {
  background: #f8fafc;
}

.student-info {
  flex: 1;
}

.student-info h4 {
  margin: 0 0 4px 0;
  color: #1f2937;
}

.student-info p {
  margin: 0 0 8px 0;
  color: #6b7280;
  font-size: 13px;
}

.student-progress {
  display: flex;
  align-items: center;
  gap: 8px;
}

.progress-text {
  font-size: 12px;
  color: #6b7280;
}

.achievement-stats {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
  margin-bottom: 16px;
}

.stat-item {
  text-align: center;
}

.stat-number {
  font-size: 24px;
  font-weight: 600;
  color: #1f2937;
}

.stat-label {
  font-size: 12px;
  color: #6b7280;
  margin-top: 4px;
}

.achievement-badges {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 16px;
}

.badge-item {
  border-radius: 16px;
}

.resource-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
  margin-bottom: 8px;
}

.resource-content {
  flex: 1;
}

.resource-content h4 {
  margin: 0 0 4px 0;
  color: #1f2937;
}

.resource-content p {
  margin: 0;
  color: #6b7280;
  font-size: 13px;
}

/* 管理者工作台样式 */
.overview-stats {
  display: flex;
  gap: 20px;
  align-items: center;
}

.overview-numbers {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
}

.number-item {
  text-align: center;
}

.number-item .number {
  font-size: 20px;
  font-weight: 600;
  color: #1f2937;
}

.number-item .label {
  font-size: 12px;
  color: #6b7280;
  margin-top: 4px;
}

.performance-charts {
  display: flex;
  gap: 20px;
  align-items: center;
}

.performance-indicators {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.indicator-item {
  text-align: center;
}

.indicator-value {
  font-size: 18px;
  font-weight: 600;
  color: #1f2937;
}

.indicator-label {
  font-size: 12px;
  color: #6b7280;
  margin: 4px 0;
}

.indicator-trend {
  font-size: 12px;
  font-weight: 500;
}

.indicator-trend.up {
  color: #10b981;
}

.insight-item {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 16px;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
  margin-bottom: 12px;
}

.insight-content {
  flex: 1;
}

.insight-content h4 {
  margin: 0 0 8px 0;
  color: #1f2937;
}

.insight-content p {
  margin: 0 0 8px 0;
  color: #6b7280;
  font-size: 14px;
}

/* 新增：图表容器样式 */
.progress-chart-container {
  margin-top: 20px;
  padding: 16px;
  background-color: #f8fafc;
  border-radius: 8px;
  height: 200px;
  position: relative;
}

.satisfaction-chart-container {
  margin-top: 20px;
  padding: 16px;
  background-color: #f8fafc;
  border-radius: 8px;
  height: 220px;
  position: relative;
}

.satisfaction-chart-container h4 {
  margin: 0 0 12px 0;
  font-size: 14px;
  color: #374151;
  text-align: center;
}

.overview-chart {
  height: 200px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.chart-container {
  height: 200px;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* 资源推荐 */
.resource-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .dashboard-grid {
    grid-template-columns: 1fr;
  }
  
  .action-buttons {
    grid-template-columns: 1fr;
  }
  
  .achievement-stats {
    grid-template-columns: 1fr;
  }
  
  .overview-stats {
    flex-direction: column;
    gap: 16px;
  }
  
  .performance-charts {
    flex-direction: column;
    gap: 16px;
  }
}
</style> 