<template>
  <div class="project-management">
    <!-- 页面头部 -->
    <div class="page-header">
      <div class="header-left">
        <h2>{{ getPageTitle() }}</h2>
        <p>{{ getPageDescription() }}</p>
      </div>
      <div class="header-right">
        <el-button 
          v-if="canCreateProject" 
          type="primary" 
          :icon="Plus" 
          @click="createProject"
        >
          创建项目
        </el-button>
      </div>
    </div>

    <!-- 筛选和搜索 -->
    <div class="filter-section">
      <div class="filter-left">
        <el-select 
          v-model="filterStatus" 
          placeholder="项目状态" 
          clearable
          style="width: 150px"
        >
          <el-option label="全部" value="" />
          <el-option label="进行中" value="active" />
          <el-option label="已完成" value="completed" />
          <el-option label="已暂停" value="paused" />
        </el-select>
        
        <el-select 
          v-model="filterPhase" 
          placeholder="项目阶段" 
          clearable
          style="width: 150px"
        >
          <el-option label="全部" value="" />
          <el-option label="启动阶段" value="startup" />
          <el-option label="执行阶段" value="execution" />
          <el-option label="评估阶段" value="evaluation" />
          <el-option label="结束阶段" value="completion" />
        </el-select>

        <el-date-picker
          v-model="dateRange"
          type="daterange"
          range-separator="至"
          start-placeholder="开始日期"
          end-placeholder="结束日期"
          format="YYYY-MM-DD"
          value-format="YYYY-MM-DD"
          style="width: 240px"
        />
      </div>
      
      <div class="filter-right">
        <el-input
          v-model="searchKeyword"
          placeholder="搜索项目名称、学员或导师"
          :prefix-icon="Search"
          style="width: 300px"
          clearable
        />
      </div>
    </div>

    <!-- 项目列表 -->
    <div class="project-list">
      <div class="list-header">
        <div class="view-controls">
          <el-radio-group v-model="viewMode" size="small">
            <el-radio-button label="card">卡片视图</el-radio-button>
            <el-radio-button label="table">表格视图</el-radio-button>
          </el-radio-group>
        </div>
        <div class="sort-controls">
          <el-select v-model="sortBy" size="small" style="width: 120px">
            <el-option label="创建时间" value="createTime" />
            <el-option label="更新时间" value="updateTime" />
            <el-option label="进度" value="progress" />
            <el-option label="优先级" value="priority" />
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
        <div class="project-grid">
          <ProjectCard
            v-for="project in filteredProjects"
            :key="project.id"
            :project="project"
            :user-role="userRole"
            @view-details="viewProjectDetails"
            @edit-project="editProject"
            @pause-project="pauseProject"
            @resume-project="resumeProject"
            @complete-project="completeProject"
          />
        </div>
      </div>

      <!-- 表格视图 -->
      <div v-else class="table-view">
        <el-table 
          :data="filteredProjects" 
          style="width: 100%"
          @sort-change="handleSortChange"
        >
          <el-table-column prop="title" label="项目名称" width="200">
            <template #default="{ row }">
              <div class="project-title">
                <span class="title-text">{{ row.title }}</span>
                <el-tag 
                  :type="getStatusTagType(row.status)" 
                  size="small"
                  class="status-tag"
                >
                  {{ getStatusText(row.status) }}
                </el-tag>
              </div>
            </template>
          </el-table-column>
          
          <el-table-column prop="mentor" label="导师" width="120">
            <template #default="{ row }">
              <div class="user-info">
                <el-avatar :size="24" :src="row.mentor.avatar">
                  {{ row.mentor.name[0] }}
                </el-avatar>
                <span>{{ row.mentor.name }}</span>
              </div>
            </template>
          </el-table-column>
          
          <el-table-column prop="student" label="学员" width="120">
            <template #default="{ row }">
              <div class="user-info">
                <el-avatar :size="24" :src="row.student.avatar">
                  {{ row.student.name[0] }}
                </el-avatar>
                <span>{{ row.student.name }}</span>
              </div>
            </template>
          </el-table-column>
          
          <el-table-column prop="progress" label="进度" width="150" sortable>
            <template #default="{ row }">
              <div class="progress-cell">
                <el-progress 
                  :percentage="row.progress" 
                  :stroke-width="6"
                  :show-text="false"
                />
                <span class="progress-text">{{ row.progress }}%</span>
              </div>
            </template>
          </el-table-column>
          
          <el-table-column prop="startDate" label="开始时间" width="110" sortable>
            <template #default="{ row }">
              {{ formatDate(row.startDate) }}
            </template>
          </el-table-column>
          
          <el-table-column prop="expectedEndDate" label="预计结束" width="110" sortable>
            <template #default="{ row }">
              {{ formatDate(row.expectedEndDate) }}
            </template>
          </el-table-column>
          
          <el-table-column prop="phase" label="当前阶段" width="100">
            <template #default="{ row }">
              <el-tag :type="getPhaseTagType(row.phase)" size="small">
                {{ getPhaseText(row.phase) }}
              </el-tag>
            </template>
          </el-table-column>
          
          <el-table-column label="操作" width="180" fixed="right">
            <template #default="{ row }">
              <div class="action-buttons">
                <el-button 
                  type="primary" 
                  size="small" 
                  @click="viewProjectDetails(row.id)"
                >
                  详情
                </el-button>
                <el-dropdown @command="handleCommand($event, row)">
                  <el-button size="small" :icon="More" />
                  <template #dropdown>
                    <el-dropdown-menu>
                      <el-dropdown-item command="edit" v-if="canEditProject(row)">
                        编辑
                      </el-dropdown-item>
                      <el-dropdown-item command="pause" v-if="row.status === 'active'">
                        暂停
                      </el-dropdown-item>
                      <el-dropdown-item command="resume" v-if="row.status === 'paused'">
                        恢复
                      </el-dropdown-item>
                      <el-dropdown-item command="complete" v-if="canCompleteProject(row)">
                        完成
                      </el-dropdown-item>
                      <el-dropdown-item command="archive" divided>
                        归档
                      </el-dropdown-item>
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
        :page-sizes="[10, 20, 50, 100]"
        :total="totalCount"
        layout="total, sizes, prev, pager, next, jumper"
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
      />
    </div>

    <!-- 项目详情抽屉 -->
    <el-drawer
      v-model="detailsVisible"
      title="项目详情"
      size="60%"
      direction="rtl"
    >
      <ProjectDetails
        v-if="selectedProject"
        :project="selectedProject"
        :user-role="userRole"
        @update-project="updateProject"
        @close="detailsVisible = false"
      />
    </el-drawer>

    <!-- 创建/编辑项目对话框 -->
    <el-dialog
      v-model="editDialogVisible"
      :title="isEditMode ? '编辑项目' : '创建项目'"
      width="800px"
      :before-close="handleCloseEdit"
    >
      <ProjectForm
        v-if="editDialogVisible"
        :project="isEditMode ? selectedProject : null"
        :mode="isEditMode ? 'edit' : 'create'"
        @success="handleProjectSaved"
        @cancel="handleCloseEdit"
      />
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { 
  Plus, 
  Search, 
  More,
  SortUp,
  SortDown
} from '@element-plus/icons-vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import ProjectCard from './ProjectCard.vue';
import ProjectDetails from './ProjectDetails.vue';
import ProjectForm from './ProjectForm.vue';

// Props
interface Props {
  userRole: string;
  userId: string;
}

const props = defineProps<Props>();

// Emits
const emit = defineEmits<{
  viewDetails: [id: string];
}>();

// 响应式数据
const viewMode = ref('card');
const filterStatus = ref('');
const filterPhase = ref('');
const dateRange = ref<[string, string] | null>(null);
const searchKeyword = ref('');
const sortBy = ref('createTime');
const sortOrder = ref('desc');
const currentPage = ref(1);
const pageSize = ref(20);
const totalCount = ref(0);

// 对话框和抽屉状态
const detailsVisible = ref(false);
const editDialogVisible = ref(false);
const isEditMode = ref(false);
const selectedProject = ref(null);

// 在数据定义部分添加
const relatedTrainingProjects = ref([]);
const sourceTrainingProject = ref(null);

// 项目数据
const projectList = ref([
  {
    id: '1',
    title: '前端开发技能提升',
    status: 'active',
    phase: 'execution',
    progress: 65,
    mentor: {
      id: 'm1',
      name: '张导师',
      avatar: '',
      department: '技术部'
    },
    student: {
      id: 's1',
      name: '李小明',
      avatar: '',
      department: '产品部'
    },
    startDate: new Date('2024-01-01'),
    expectedEndDate: new Date('2024-03-01'),
    actualEndDate: null,
    template: {
      id: 't1',
      name: '前端开发标准模板'
    },
    priority: 'high',
    createTime: new Date('2023-12-28'),
    updateTime: new Date('2024-01-10'),
    milestones: [
      { name: '基础技能掌握', completed: true, date: new Date('2024-01-15') },
      { name: '项目实践', completed: false, date: new Date('2024-02-15') },
      { name: '技能评估', completed: false, date: new Date('2024-02-28') }
    ],
    tags: ['Vue3', 'TypeScript', '前端'],
    description: '帮助学员掌握现代前端开发技能，包括Vue3、TypeScript等技术栈',
    // 新增：关联培训项目
    sourceTrainingProject: {
      id: 'TP001',
      name: '2024年春季新员工培训',
      type: 'training-project',
      status: 'completed'
    },
    relatedTrainingProjects: [
      {
        id: 'TP002',
        name: '前端技术进阶培训',
        type: 'training-project',
        status: 'active'
      }
    ]
  },
  {
    id: '2',
    title: '项目管理实践',
    status: 'completed',
    phase: 'completion',
    progress: 100,
    mentor: {
      id: 'm2',
      name: '王经理',
      avatar: '',
      department: '项目部'
    },
    student: {
      id: 's2',
      name: '陈小华',
      avatar: '',
      department: '技术部'
    },
    startDate: new Date('2023-10-01'),
    expectedEndDate: new Date('2023-12-31'),
    actualEndDate: new Date('2023-12-28'),
    template: {
      id: 't2',
      name: '项目管理模板'
    },
    priority: 'medium',
    createTime: new Date('2023-09-25'),
    updateTime: new Date('2023-12-28'),
    milestones: [
      { name: '理论学习', completed: true, date: new Date('2023-11-01') },
      { name: '实践操作', completed: true, date: new Date('2023-12-01') },
      { name: '成果评估', completed: true, date: new Date('2023-12-28') }
    ],
    tags: ['PMP', '敏捷开发', '团队管理'],
    description: '通过实际项目练习，提升项目管理能力和团队协作技能'
  },
  {
    id: '3',
    title: '数据分析技能培养',
    status: 'paused',
    phase: 'execution',
    progress: 30,
    mentor: {
      id: 'm3',
      name: '刘专家',
      avatar: '',
      department: '数据部'
    },
    student: {
      id: 's3',
      name: '赵小红',
      avatar: '',
      department: '运营部'
    },
    startDate: new Date('2024-01-05'),
    expectedEndDate: new Date('2024-04-05'),
    actualEndDate: null,
    template: {
      id: 't3',
      name: '数据分析模板'
    },
    priority: 'low',
    createTime: new Date('2024-01-01'),
    updateTime: new Date('2024-01-08'),
    milestones: [
      { name: 'Excel技能', completed: true, date: new Date('2024-01-20') },
      { name: 'SQL学习', completed: false, date: new Date('2024-02-20') },
      { name: 'Python分析', completed: false, date: new Date('2024-03-20') }
    ],
    tags: ['Excel', 'SQL', 'Python'],
    description: '帮助运营人员掌握数据分析技能，提升数据驱动决策能力'
  }
]);

// 计算属性
const filteredProjects = computed(() => {
  let result = [...projectList.value];
  
  // 状态筛选
  if (filterStatus.value) {
    result = result.filter(p => p.status === filterStatus.value);
  }
  
  // 阶段筛选
  if (filterPhase.value) {
    result = result.filter(p => p.phase === filterPhase.value);
  }
  
  // 日期范围筛选
  if (dateRange.value && dateRange.value.length === 2) {
    const [start, end] = dateRange.value;
    result = result.filter(p => {
      const createDate = p.createTime.toISOString().split('T')[0];
      return createDate >= start && createDate <= end;
    });
  }
  
  // 关键词搜索
  if (searchKeyword.value) {
    const keyword = searchKeyword.value.toLowerCase();
    result = result.filter(p => 
      p.title.toLowerCase().includes(keyword) ||
      p.mentor.name.toLowerCase().includes(keyword) ||
      p.student.name.toLowerCase().includes(keyword)
    );
  }
  
  // 排序
  result.sort((a, b) => {
    let aValue = a[sortBy.value];
    let bValue = b[sortBy.value];
    
    if (aValue instanceof Date && bValue instanceof Date) {
      aValue = aValue.getTime();
      bValue = bValue.getTime();
    }
    
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

const canCreateProject = computed(() => {
  return ['manager', 'hr', 'academic'].includes(props.userRole);
});

// 方法
const getPageTitle = () => {
  const titles = {
    'student': '我的学习项目',
    'mentor': '我的带教项目', 
    'manager': '部门带教项目',
    'hr': '全部带教项目',
    'academic': '教务项目管理'
  };
  return titles[props.userRole] || '项目管理';
};

const getPageDescription = () => {
  const descriptions = {
    'student': '查看和管理您的学习进度',
    'mentor': '管理您负责的带教项目',
    'manager': '监控和管理部门的带教活动',
    'hr': '全公司带教项目的统一管理',
    'academic': '教务全流程项目监管和质量控制'
  };
  return descriptions[props.userRole] || '项目管理和跟踪';
};

const formatDate = (date: Date) => {
  return date.toLocaleDateString('zh-CN');
};

const getStatusTagType = (status: string) => {
  const types = {
    'active': 'success',
    'completed': 'info',
    'paused': 'warning'
  };
  return types[status] || 'default';
};

const getStatusText = (status: string) => {
  const texts = {
    'active': '进行中',
    'completed': '已完成',
    'paused': '已暂停'
  };
  return texts[status] || status;
};

const getPhaseTagType = (phase: string) => {
  const types = {
    'startup': 'primary',
    'execution': 'success',
    'evaluation': 'warning',
    'completion': 'info'
  };
  return types[phase] || 'default';
};

const getPhaseText = (phase: string) => {
  const texts = {
    'startup': '启动',
    'execution': '执行',
    'evaluation': '评估',
    'completion': '完成'
  };
  return texts[phase] || phase;
};

const canEditProject = (project: any) => {
  if (['manager', 'hr', 'academic'].includes(props.userRole)) return true;
  if (props.userRole === 'mentor' && project.mentor.id === props.userId) return true;
  return false;
};

const canCompleteProject = (project: any) => {
  return project.status === 'active' && project.progress >= 90;
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

// 项目操作
const createProject = () => {
  isEditMode.value = false;
  selectedProject.value = null;
  editDialogVisible.value = true;
};

const viewProjectDetails = (projectId: string) => {
  const project = projectList.value.find(p => p.id === projectId);
  if (project) {
    selectedProject.value = project;
    detailsVisible.value = true;
    emit('viewDetails', projectId);
  }
};

const editProject = (projectId: string) => {
  const project = projectList.value.find(p => p.id === projectId);
  if (project) {
    selectedProject.value = project;
    isEditMode.value = true;
    editDialogVisible.value = true;
  }
};

const pauseProject = async (projectId: string) => {
  try {
    await ElMessageBox.confirm('确定要暂停这个项目吗？', '确认暂停', {
      type: 'warning'
    });
    
    const project = projectList.value.find(p => p.id === projectId);
    if (project) {
      project.status = 'paused';
      project.updateTime = new Date();
      ElMessage.success('项目已暂停');
    }
  } catch {
    // 用户取消操作
  }
};

const resumeProject = (projectId: string) => {
  const project = projectList.value.find(p => p.id === projectId);
  if (project) {
    project.status = 'active';
    project.updateTime = new Date();
    ElMessage.success('项目已恢复');
  }
};

const completeProject = async (projectId: string) => {
  try {
    await ElMessageBox.confirm('确定要完成这个项目吗？', '确认完成', {
      type: 'info'
    });
    
    const project = projectList.value.find(p => p.id === projectId);
    if (project) {
      project.status = 'completed';
      project.progress = 100;
      project.actualEndDate = new Date();
      project.updateTime = new Date();
      ElMessage.success('项目已完成');
    }
  } catch {
    // 用户取消操作
  }
};

const handleCommand = (command: string, project: any) => {
  switch (command) {
    case 'edit':
      editProject(project.id);
      break;
    case 'pause':
      pauseProject(project.id);
      break;
    case 'resume':
      resumeProject(project.id);
      break;
    case 'complete':
      completeProject(project.id);
      break;
    case 'archive':
      ElMessage.info('归档功能开发中');
      break;
  }
};

const handleCloseEdit = () => {
  editDialogVisible.value = false;
  selectedProject.value = null;
  isEditMode.value = false;
};

const handleProjectSaved = () => {
  editDialogVisible.value = false;
  selectedProject.value = null;
  isEditMode.value = false;
  ElMessage.success(isEditMode.value ? '项目更新成功' : '项目创建成功');
  // 刷新项目列表
};

const updateProject = (project: any) => {
  const index = projectList.value.findIndex(p => p.id === project.id);
  if (index !== -1) {
    projectList.value[index] = { ...project };
  }
};

// 页面初始化
onMounted(() => {
  // 根据用户角色筛选项目
  if (props.userRole === 'student') {
    // 只显示学员自己的项目
  } else if (props.userRole === 'mentor') {
    // 只显示导师负责的项目
  }
});

// 监听筛选条件变化
watch([filterStatus, filterPhase, dateRange, searchKeyword], () => {
  currentPage.value = 1;
});
</script>

<style scoped>
.project-management {
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

.project-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 20px;
}

.project-title {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.title-text {
  font-weight: 500;
  color: #1f2937;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 8px;
}

.progress-cell {
  display: flex;
  align-items: center;
  gap: 8px;
}

.progress-text {
  font-size: 12px;
  color: #6b7280;
  min-width: 35px;
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
  
  .project-grid {
    grid-template-columns: 1fr;
  }
}
</style> 