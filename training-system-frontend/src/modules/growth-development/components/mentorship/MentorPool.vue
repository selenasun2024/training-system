<template>
  <div class="mentor-pool">
    <!-- 页面头部 -->
    <div class="page-header">
      <div class="header-left">
        <h2>师资池管理</h2>
        <p>构建专业化的导师资源库，优化师徒匹配</p>
      </div>
      <div class="header-right">
        <el-button 
          v-if="canManageMentors" 
          type="primary" 
          :icon="Plus" 
          @click="addMentor"
        >
          新增导师
        </el-button>
      </div>
    </div>

    <!-- 统计概览 -->
    <div class="stats-overview">
      <div class="stat-card">
        <div class="stat-icon">
          <el-icon color="#409EFF"><User /></el-icon>
        </div>
        <div class="stat-content">
          <div class="stat-number">{{ stats.totalMentors }}</div>
          <div class="stat-label">总导师数</div>
        </div>
      </div>
      
      <div class="stat-card">
        <div class="stat-icon">
          <el-icon color="#67C23A"><CircleCheck /></el-icon>
        </div>
        <div class="stat-content">
          <div class="stat-number">{{ stats.activeMentors }}</div>
          <div class="stat-label">活跃导师</div>
        </div>
      </div>
      
      <div class="stat-card">
        <div class="stat-icon">
          <el-icon color="#E6A23C"><Star /></el-icon>
        </div>
        <div class="stat-content">
          <div class="stat-number">{{ stats.goldMentors }}</div>
          <div class="stat-label">金牌导师</div>
        </div>
      </div>
      
      <div class="stat-card">
        <div class="stat-icon">
          <el-icon color="#F56C6C"><Warning /></el-icon>
        </div>
        <div class="stat-content">
          <div class="stat-number">{{ stats.overloadedMentors }}</div>
          <div class="stat-label">负荷过重</div>
        </div>
      </div>
    </div>

    <!-- 筛选区域 -->
    <div class="filter-section">
      <div class="filter-left">
        <el-select 
          v-model="filterDepartment" 
          placeholder="部门" 
          clearable
          style="width: 150px"
        >
          <el-option label="全部" value="" />
          <el-option 
            v-for="dept in departments" 
            :key="dept" 
            :label="dept" 
            :value="dept"
          />
        </el-select>
        
        <el-select 
          v-model="filterStatus" 
          placeholder="状态" 
          clearable
          style="width: 150px"
        >
          <el-option label="全部" value="" />
          <el-option label="活跃" value="active" />
          <el-option label="忙碌" value="busy" />
          <el-option label="不可用" value="unavailable" />
        </el-select>
        
        <el-select 
          v-model="filterCertification" 
          placeholder="认证类型" 
          clearable
          style="width: 150px"
        >
          <el-option label="全部" value="" />
          <el-option label="书院认证" value="academy" />
          <el-option label="内部讲师" value="internal" />
          <el-option label="专业导师" value="professional" />
        </el-select>
        
        <el-select 
          v-model="filterExpertise" 
          placeholder="专业领域" 
          clearable
          style="width: 150px"
        >
          <el-option label="全部" value="" />
          <el-option 
            v-for="skill in expertiseList" 
            :key="skill" 
            :label="skill" 
            :value="skill"
          />
        </el-select>
      </div>
      
      <div class="filter-right">
        <el-input
          v-model="searchKeyword"
          placeholder="搜索导师姓名或技能"
          :prefix-icon="Search"
          style="width: 300px"
          clearable
        />
      </div>
    </div>

    <!-- 导师列表 -->
    <div class="mentor-list">
      <div class="list-header">
        <div class="view-controls">
          <el-radio-group v-model="viewMode" size="small">
            <el-radio-button label="card">卡片视图</el-radio-button>
            <el-radio-button label="table">表格视图</el-radio-button>
          </el-radio-group>
        </div>
        <div class="sort-controls">
          <el-select v-model="sortBy" size="small" style="width: 120px">
            <el-option label="评分" value="rating" />
            <el-option label="经验" value="experience" />
            <el-option label="学员数" value="studentCount" />
            <el-option label="负荷" value="currentLoad" />
          </el-select>
          <el-button 
            :icon="sortOrder === 'asc' ? 'SortUp' : 'SortDown'"
            size="small"
            @click="toggleSortOrder"
          />
        </div>
      </div>

      <!-- 卡片视图 -->
      <div v-if="viewMode === 'card'" class="card-view">
        <div class="mentor-grid">
          <MentorCard
            v-for="mentor in filteredMentors"
            :key="mentor.id"
            :mentor="mentor"
            :user-role="userRole"
            @view-profile="viewMentorProfile"
            @edit-mentor="editMentor"
            @assign-student="assignStudent"
            @view-history="viewHistory"
          />
        </div>
      </div>

      <!-- 表格视图 -->
      <div v-else class="table-view">
        <el-table 
          :data="filteredMentors" 
          style="width: 100%"
          @sort-change="handleSortChange"
        >
          <el-table-column width="80">
            <template #default="{ row }">
              <el-avatar :size="50" :src="row.avatar">
                {{ row.name[0] }}
              </el-avatar>
            </template>
          </el-table-column>
          
          <el-table-column prop="name" label="姓名" width="120">
            <template #default="{ row }">
              <div class="mentor-name">
                <span class="name-text">{{ row.name }}</span>
                <div class="badges">
                  <el-tag 
                    v-for="badge in row.badges" 
                    :key="badge"
                    :type="getBadgeType(badge)"
                    size="small"
                  >
                    {{ badge }}
                  </el-tag>
                </div>
              </div>
            </template>
          </el-table-column>
          
          <el-table-column prop="department" label="部门" width="100" />
          <el-table-column prop="title" label="职位" width="120" />
          
          <el-table-column prop="expertise" label="专业领域" width="200">
            <template #default="{ row }">
              <div class="expertise-tags">
                <el-tag 
                  v-for="skill in row.expertise.slice(0, 3)" 
                  :key="skill"
                  type="info"
                  size="small"
                >
                  {{ skill }}
                </el-tag>
                <span v-if="row.expertise.length > 3" class="more-text">
                  +{{ row.expertise.length - 3 }}
                </span>
              </div>
            </template>
          </el-table-column>
          
          <el-table-column prop="rating" label="评分" width="100" sortable>
            <template #default="{ row }">
              <div class="rating-cell">
                <el-rate 
                  v-model="row.rating" 
                  disabled 
                  show-score
                  text-color="#ff9900"
                  :max="5"
                  :allow-half="true"
                />
              </div>
            </template>
          </el-table-column>
          
          <el-table-column prop="currentLoad" label="当前负荷" width="120" sortable>
            <template #default="{ row }">
              <div class="load-cell">
                <el-progress 
                  :percentage="(row.currentLoad / row.maxLoad) * 100"
                  :stroke-width="6"
                  :show-text="false"
                  :color="getLoadColor(row.currentLoad / row.maxLoad)"
                />
                <span class="load-text">{{ row.currentLoad }}/{{ row.maxLoad }}</span>
              </div>
            </template>
          </el-table-column>
          
          <el-table-column prop="status" label="状态" width="100">
            <template #default="{ row }">
              <el-tag :type="getStatusTagType(row.status)" size="small">
                {{ getStatusText(row.status) }}
              </el-tag>
            </template>
          </el-table-column>
          
          <el-table-column label="操作" width="200" fixed="right">
            <template #default="{ row }">
              <div class="action-buttons">
                <el-button 
                  type="primary" 
                  size="small" 
                  @click="viewMentorProfile(row.id)"
                >
                  档案
                </el-button>
                <el-button 
                  type="success" 
                  size="small" 
                  @click="assignStudent(row.id)"
                  :disabled="row.currentLoad >= row.maxLoad"
                >
                  分配
                </el-button>
                <el-dropdown @command="handleCommand($event, row)" v-if="canManageMentors">
                  <el-button size="small" :icon="More" />
                  <template #dropdown>
                    <el-dropdown-menu>
                      <el-dropdown-item command="edit">编辑</el-dropdown-item>
                      <el-dropdown-item command="history">带教历史</el-dropdown-item>
                      <el-dropdown-item command="certification">认证管理</el-dropdown-item>
                      <el-dropdown-item command="disable" divided>禁用</el-dropdown-item>
                    </el-dropdown-menu>
                  </template>
                </el-dropdown>
              </div>
            </template>
          </el-table-column>
        </el-table>
      </div>
    </div>

    <!-- 分页 -->
    <div class="pagination-container">
      <el-pagination
        v-model:current-page="currentPage"
        v-model:page-size="pageSize"
        :page-sizes="[12, 24, 48, 96]"
        :total="totalCount"
        layout="total, sizes, prev, pager, next, jumper"
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
      />
    </div>

    <!-- 智能匹配对话框 -->
    <el-dialog
      v-model="matchingVisible"
      title="智能匹配"
      width="800px"
    >
      <MentorMatching
        v-if="matchingVisible"
        :student-id="selectedStudentId"
        @match-success="handleMatchSuccess"
        @close="matchingVisible = false"
      />
    </el-dialog>

    <!-- 导师档案抽屉 -->
    <el-drawer
      v-model="profileVisible"
      title="导师档案"
      size="60%"
      direction="rtl"
    >
      <MentorProfile
        v-if="selectedMentor"
        :mentor="selectedMentor"
        :user-role="userRole"
        @update-mentor="updateMentor"
        @close="profileVisible = false"
      />
    </el-drawer>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { 
  Plus, 
  Search, 
  More, 
  User, 
  CircleCheck, 
  Star, 
  Warning,
  SortUp,
  SortDown
} from '@element-plus/icons-vue';
import { ElMessage } from 'element-plus';
import MentorCard from './MentorCard.vue';
import MentorProfile from './MentorProfile.vue';
import MentorMatching from './MentorMatching.vue';

// Props
interface Props {
  userRole: string;
  userId: string;
}

const props = defineProps<Props>();

// Emits
const emit = defineEmits<{
  viewProfile: [id: string];
}>();

// 响应式数据
const viewMode = ref('card');
const filterDepartment = ref('');
const filterStatus = ref('');
const filterCertification = ref('');
const filterExpertise = ref('');
const searchKeyword = ref('');
const sortBy = ref('rating');
const sortOrder = ref('desc');
const currentPage = ref(1);
const pageSize = ref(12);
const totalCount = ref(0);

// 对话框状态
const profileVisible = ref(false);
const matchingVisible = ref(false);
const selectedMentor = ref(null);
const selectedStudentId = ref('');

// 统计数据
const stats = ref({
  totalMentors: 45,
  activeMentors: 38,
  goldMentors: 12,
  overloadedMentors: 3
});

// 基础数据
const departments = ref(['技术部', '产品部', '设计部', '运营部', '市场部']);
const expertiseList = ref([
  'Vue.js', 'React', 'Java', 'Python', 'UI设计', 
  '产品规划', '数据分析', '项目管理', 'DevOps'
]);

// 导师数据
const mentorList = ref([
  {
    id: 'm1',
    name: '张导师',
    avatar: '',
    department: '技术部',
    title: '高级技术专家',
    expertise: ['Vue.js', 'Node.js', '前端架构', '团队管理'],
    rating: 4.8,
    experience: 5,
    currentLoad: 2,
    maxLoad: 3,
    status: 'active',
    badges: ['金牌导师', '专业标杆'],
    certifications: ['书院认证', '内部讲师'],
    studentCount: 15,
    completedProjects: 12,
    averageRating: 4.7,
    joinDate: new Date('2020-01-15'),
    lastActive: new Date('2024-01-10')
  },
  {
    id: 'm2',
    name: '李导师',
    avatar: '',
    department: '产品部',
    title: '产品总监',
    expertise: ['产品规划', '用户体验', '市场分析'],
    rating: 4.6,
    experience: 7,
    currentLoad: 1,
    maxLoad: 2,
    status: 'active',
    badges: ['传承达人'],
    certifications: ['专业导师'],
    studentCount: 8,
    completedProjects: 7,
    averageRating: 4.5,
    joinDate: new Date('2019-03-20'),
    lastActive: new Date('2024-01-09')
  },
  {
    id: 'm3',
    name: '王导师',
    avatar: '',
    department: '设计部',
    title: '设计主管',
    expertise: ['UI设计', '交互设计', '设计规范'],
    rating: 4.9,
    experience: 4,
    currentLoad: 3,
    maxLoad: 3,
    status: 'busy',
    badges: ['金牌导师', '设计达人'],
    certifications: ['书院认证'],
    studentCount: 20,
    completedProjects: 18,
    averageRating: 4.8,
    joinDate: new Date('2021-06-10'),
    lastActive: new Date('2024-01-10')
  }
]);

// 计算属性
const filteredMentors = computed(() => {
  let result = [...mentorList.value];
  
  // 部门筛选
  if (filterDepartment.value) {
    result = result.filter(m => m.department === filterDepartment.value);
  }
  
  // 状态筛选
  if (filterStatus.value) {
    result = result.filter(m => m.status === filterStatus.value);
  }
  
  // 认证筛选
  if (filterCertification.value) {
    result = result.filter(m => m.certifications.includes(filterCertification.value));
  }
  
  // 专业领域筛选
  if (filterExpertise.value) {
    result = result.filter(m => m.expertise.includes(filterExpertise.value));
  }
  
  // 关键词搜索
  if (searchKeyword.value) {
    const keyword = searchKeyword.value.toLowerCase();
    result = result.filter(m => 
      m.name.toLowerCase().includes(keyword) ||
      m.expertise.some(skill => skill.toLowerCase().includes(keyword))
    );
  }
  
  // 排序
  result.sort((a, b) => {
    let aValue = a[sortBy.value];
    let bValue = b[sortBy.value];
    
    if (sortOrder.value === 'asc') {
      return aValue > bValue ? 1 : -1;
    } else {
      return aValue < bValue ? 1 : -1;
    }
  });
  
  // 分页
  const start = (currentPage.value - 1) * pageSize.value;
  const end = start + pageSize.value;
  totalCount.value = result.length;
  
  return result.slice(start, end);
});

const canManageMentors = computed(() => {
  return ['manager', 'hr', 'academic'].includes(props.userRole);
});

// 方法
const getBadgeType = (badge: string) => {
  const types = {
    '金牌导师': 'warning',
    '专业标杆': 'success',
    '传承达人': 'primary',
    '设计达人': 'info'
  };
  return types[badge] || 'default';
};

const getStatusTagType = (status: string) => {
  const types = {
    'active': 'success',
    'busy': 'warning',
    'unavailable': 'info'
  };
  return types[status] || 'default';
};

const getStatusText = (status: string) => {
  const texts = {
    'active': '活跃',
    'busy': '忙碌',
    'unavailable': '不可用'
  };
  return texts[status] || status;
};

const getLoadColor = (ratio: number) => {
  if (ratio >= 0.9) return '#F56C6C';
  if (ratio >= 0.7) return '#E6A23C';
  return '#67C23A';
};

const toggleSortOrder = () => {
  sortOrder.value = sortOrder.value === 'asc' ? 'desc' : 'asc';
};

const handleSortChange = ({ prop, order }: any) => {
  if (prop) {
    sortBy.value = prop;
    sortOrder.value = order === 'ascending' ? 'asc' : 'desc';
  }
};

const handleSizeChange = (size: number) => {
  pageSize.value = size;
  currentPage.value = 1;
};

const handleCurrentChange = (page: number) => {
  currentPage.value = page;
};

// 操作方法
const addMentor = () => {
  ElMessage.info('新增导师功能开发中');
};

const viewMentorProfile = (mentorId: string) => {
  const mentor = mentorList.value.find(m => m.id === mentorId);
  if (mentor) {
    selectedMentor.value = mentor;
    profileVisible.value = true;
    emit('viewProfile', mentorId);
  }
};

const editMentor = (mentorId: string) => {
  ElMessage.info('编辑导师功能开发中');
};

const assignStudent = (mentorId: string) => {
  selectedStudentId.value = 'temp_student_id';
  matchingVisible.value = true;
};

const viewHistory = (mentorId: string) => {
  ElMessage.info('查看带教历史功能开发中');
};

const handleCommand = (command: string, mentor: any) => {
  switch (command) {
    case 'edit':
      editMentor(mentor.id);
      break;
    case 'history':
      viewHistory(mentor.id);
      break;
    case 'certification':
      ElMessage.info('认证管理功能开发中');
      break;
    case 'disable':
      ElMessage.info('禁用导师功能开发中');
      break;
  }
};

const handleMatchSuccess = () => {
  matchingVisible.value = false;
  ElMessage.success('师徒匹配成功');
};

const updateMentor = (mentor: any) => {
  const index = mentorList.value.findIndex(m => m.id === mentor.id);
  if (index !== -1) {
    mentorList.value[index] = { ...mentor };
  }
};

// 页面初始化
onMounted(() => {
  // 加载导师数据
  console.log('MentorPool mounted');
});
</script>

<style scoped>
.mentor-pool {
  padding: 24px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.header-left h2 {
  margin: 0 0 8px 0;
  color: #1f2937;
  font-size: 24px;
}

.header-left p {
  margin: 0;
  color: #6b7280;
  font-size: 14px;
}

.stats-overview {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
  margin-bottom: 24px;
}

.stat-card {
  background: white;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  display: flex;
  align-items: center;
  gap: 16px;
}

.stat-icon {
  font-size: 32px;
}

.stat-number {
  font-size: 24px;
  font-weight: 600;
  color: #1f2937;
}

.stat-label {
  font-size: 14px;
  color: #6b7280;
}

.filter-section {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  padding: 16px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.filter-left {
  display: flex;
  gap: 16px;
  align-items: center;
}

.list-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.sort-controls {
  display: flex;
  gap: 8px;
  align-items: center;
}

.mentor-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;
}

.mentor-name {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.name-text {
  font-weight: 500;
  color: #1f2937;
}

.badges {
  display: flex;
  gap: 4px;
  flex-wrap: wrap;
}

.expertise-tags {
  display: flex;
  gap: 4px;
  flex-wrap: wrap;
  align-items: center;
}

.more-text {
  font-size: 12px;
  color: #6b7280;
}

.rating-cell {
  display: flex;
  align-items: center;
}

.load-cell {
  display: flex;
  align-items: center;
  gap: 8px;
}

.load-text {
  font-size: 12px;
  color: #6b7280;
  min-width: 40px;
}

.action-buttons {
  display: flex;
  gap: 8px;
}

.pagination-container {
  margin-top: 24px;
  display: flex;
  justify-content: center;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .page-header {
    flex-direction: column;
    gap: 16px;
    align-items: flex-start;
  }
  
  .stats-overview {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .filter-section {
    flex-direction: column;
    gap: 16px;
    align-items: stretch;
  }
  
  .filter-left {
    flex-direction: column;
    align-items: stretch;
  }
  
  .filter-right {
    width: 100%;
  }
  
  .filter-right .el-input {
    width: 100% !important;
  }
  
  .list-header {
    flex-direction: column;
    gap: 12px;
    align-items: stretch;
  }
  
  .mentor-grid {
    grid-template-columns: 1fr;
  }
}
</style> 