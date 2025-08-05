<template>
  <div class="project-list-page">
    <FilterSection @search="onSearch" @reset="onReset" @create-project="handleCreateProject" />
    <ListSection 
      :projects="paginatedProjects"
      :total="filteredProjects.length"
      :current-page="pagination.currentPage"
      :page-size="pagination.pageSize"
      @page-change="handlePageChange"
      @size-change="handleSizeChange"
      @view-project="handleViewProject"
      @delete-project="handleDeleteProject"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { useRouter } from 'vue-router';
import FilterSection from '@/components/sections/FilterSection.vue';
import ListSection from '@/components/sections/ListSection.vue';
import { getProjects, deleteProject } from '@/api/modules/project';

// --- 类型定义 ---
type ProjectStatus = 'planning' | 'active' | 'completed' | 'archived';

interface Project {
  id: string;
  title: string;
  manager: string;
  projectType: string;
  status: ProjectStatus;
  startDate: string;
  updatedAt: string;
  progress: number;
}

interface ProjectFilters {
  status: string;
  projectType: string;
  dateRange: [Date, Date] | null;
}

// --- 项目数据 ---
const projects = ref<Project[]>([]);
const loading = ref(false);

// --- 响应式状态 ---
const filters = reactive<ProjectFilters>({
  status: '',
  projectType: '',
  dateRange: null,
});

const pagination = reactive({
  currentPage: 1,
  pageSize: 9,
});

// --- 计算属性 (核心逻辑) ---
const filteredProjects = computed(() => {
  let projectList = projects.value;

  // 状态筛选
  if (filters.status) {
    projectList = projectList.filter(p => p.status === filters.status);
  }

  // 项目类型筛选
  if (filters.projectType) {
    projectList = projectList.filter(p => p.projectType === filters.projectType);
  }

  // 日期范围筛选 (简化版，实际项目需更精确的日期比较)
  if (filters.dateRange) {
    const [start, end] = filters.dateRange;
    projectList = projectList.filter(p => {
      const pDate = new Date(p.startDate);
      return pDate >= start && pDate <= end;
    });
  }

  return projectList;
});

const paginatedProjects = computed(() => {
  const start = (pagination.currentPage - 1) * pagination.pageSize;
  const end = start + pagination.pageSize;
  return filteredProjects.value.slice(start, end);
});

// --- 事件处理 ---
const onSearch = (searchFilters: ProjectFilters) => {
  console.log('Searching with filters:', searchFilters);
  Object.assign(filters, searchFilters);
  pagination.currentPage = 1; // 搜索后重置到第一页
  ElMessage.success('搜索完成！');
};

const onReset = () => {
  console.log('Resetting filters');
  filters.status = '';
  filters.projectType = '';
  filters.dateRange = null;
  pagination.currentPage = 1;
  ElMessage.info('筛选条件已重置。');
};

const handlePageChange = (page: number) => {
  console.log('Page changed to:', page);
  pagination.currentPage = page;
};

const handleSizeChange = (size: number) => {
  console.log('Page size changed to:', size);
  pagination.pageSize = size;
  pagination.currentPage = 1; // 切换每页数量后重置到第一页
};

const handleViewProject = (projectId: string) => {
  router.push({ name: 'ProjectDetail', params: { id: projectId } });
};

const handleDeleteProject = async (projectId: string) => {
  try {
    // 找到要删除的项目信息
    const project = projects.value.find(p => p.id === projectId);
    const projectTitle = project?.title || projectId;
    
    // 显示确认对话框
    await ElMessageBox.confirm(
      `确定要删除项目 "${projectTitle}" 吗？此操作不可撤销。`,
      '删除确认',
      {
        confirmButtonText: '确定删除',
        cancelButtonText: '取消',
        type: 'warning',
        confirmButtonClass: 'el-button--danger'
      }
    );
    
    // 调用删除API
    await deleteProject(projectId);
    
    // 从本地列表中移除项目
    projects.value = projects.value.filter(p => p.id !== projectId);
    
    // 如果当前页没有数据且不是第一页，回到上一页
    if (paginatedProjects.value.length === 0 && pagination.currentPage > 1) {
      pagination.currentPage = pagination.currentPage - 1;
    }
    
    ElMessage.success('项目删除成功！');
  } catch (error) {
    if (error !== 'cancel') {
      console.error('删除项目失败:', error);
      ElMessage.error('删除项目失败，请稍后重试。');
    }
  }
};

const handleCreateProject = () => {
  console.log('创建新项目');
  router.push({ name: 'ProjectCreate' });
};

const router = useRouter();

// --- 数据获取 ---
const fetchProjects = async () => {
  loading.value = true;
  try {
    const result = await getProjects();
    // 转换数据格式以匹配组件期望的字段结构
    projects.value = result.projects.map(project => {
      // 状态映射：后端大写状态 -> 前端小写状态
      let status = 'planning';
      switch (project.status) {
        case 'DRAFT':
        case 'PLANNING':
          status = 'planning';
          break;
        case 'APPROVED':
        case 'ACTIVE':
          status = 'active';
          break;
        case 'COMPLETED':
          status = 'completed';
          break;
        case 'CANCELLED':
          status = 'archived';
          break;
        default:
          status = 'planning';
      }
      
      return {
        id: project.id,
        title: project.name, // 后端的name字段映射到前端的title字段
        manager: project.owner?.name || '未指定', // 后端的owner.name字段映射到前端的manager字段
        projectType: project.config?.type || '', // 从配置中获取项目类型，空字符串表示未设置
        status: status,
        startDate: project.startDate || '',
        updatedAt: project.updatedAt || '',
        progress: status === 'completed' ? 100 : (status === 'active' ? 50 : 0) // 根据状态设置进度
      };
    });
  } catch (error) {
    console.error('Failed to fetch projects:', error);
    ElMessage.error('获取项目列表失败');
  } finally {
    loading.value = false;
  }
};

// 初始化数据
onMounted(() => {
  fetchProjects();
});
</script>

<style scoped>
.project-list-page {
  padding: 0;
  margin: 0;
}
</style> 