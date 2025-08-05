<template>
  <div class="template-library">
    <!-- 页面头部 -->
    <div class="page-header">
      <div class="header-left">
        <h2>模板库管理</h2>
        <p>标准化的带教流程，确保培养质量</p>
      </div>
      <div class="header-right">
        <el-button 
          v-if="canManageTemplates" 
          type="primary" 
          :icon="Plus" 
          @click="createTemplate"
        >
          新建模板
        </el-button>
      </div>
    </div>

    <!-- 模板分类 -->
    <div class="template-categories">
      <div class="category-tabs">
        <div 
          v-for="category in categories" 
          :key="category.id"
          class="category-tab"
          :class="{ active: activeCategory === category.id }"
          @click="activeCategory = category.id"
        >
          <div class="category-icon">
            <el-icon :color="category.color">
              <component :is="category.icon" />
            </el-icon>
          </div>
          <div class="category-info">
            <div class="category-name">{{ category.name }}</div>
            <div class="category-count">{{ category.count }}个模板</div>
          </div>
        </div>
      </div>
    </div>

    <!-- 筛选和搜索 -->
    <div class="filter-section">
      <div class="filter-left">
        <el-select 
          v-model="filterDepartment" 
          placeholder="适用部门" 
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
          v-model="filterLevel" 
          placeholder="难度等级" 
          clearable
          style="width: 150px"
        >
          <el-option label="全部" value="" />
          <el-option label="入门" value="beginner" />
          <el-option label="中级" value="intermediate" />
          <el-option label="高级" value="advanced" />
        </el-select>
        
        <el-select 
          v-model="filterStatus" 
          placeholder="状态" 
          clearable
          style="width: 150px"
        >
          <el-option label="全部" value="" />
          <el-option label="已发布" value="published" />
          <el-option label="草稿" value="draft" />
          <el-option label="已停用" value="disabled" />
        </el-select>
      </div>
      
      <div class="filter-right">
        <el-input
          v-model="searchKeyword"
          placeholder="搜索模板名称或标签"
          :prefix-icon="Search"
          style="width: 300px"
          clearable
        />
      </div>
    </div>

    <!-- 模板列表 -->
    <div class="template-list">
      <div class="template-grid">
        <div 
          v-for="template in filteredTemplates" 
          :key="template.id"
          class="template-card"
          @click="viewTemplate(template.id)"
        >
          <!-- 卡片头部 -->
          <div class="card-header">
            <div class="template-info">
              <h3 class="template-title">{{ template.name }}</h3>
              <div class="template-meta">
                <el-tag 
                  :type="getStatusTagType(template.status)" 
                  size="small"
                >
                  {{ getStatusText(template.status) }}
                </el-tag>
                <el-tag 
                  :type="getLevelTagType(template.level)" 
                  size="small"
                >
                  {{ getLevelText(template.level) }}
                </el-tag>
              </div>
            </div>
            <div class="card-actions">
              <el-dropdown @command="handleCommand($event, template)">
                <el-button type="text" :icon="More" />
                <template #dropdown>
                  <el-dropdown-menu>
                    <el-dropdown-item command="view">查看详情</el-dropdown-item>
                    <el-dropdown-item command="edit" v-if="canEditTemplate(template)">编辑</el-dropdown-item>
                    <el-dropdown-item command="copy">复制模板</el-dropdown-item>
                    <el-dropdown-item command="export">导出</el-dropdown-item>
                    <el-dropdown-item command="history">版本历史</el-dropdown-item>
                    <el-dropdown-item command="disable" divided v-if="template.status === 'published'">停用</el-dropdown-item>
                    <el-dropdown-item command="enable" divided v-if="template.status === 'disabled'">启用</el-dropdown-item>
                  </el-dropdown-menu>
                </template>
              </el-dropdown>
            </div>
          </div>

          <!-- 模板描述 -->
          <div class="template-description">
            <p>{{ template.description }}</p>
          </div>

          <!-- 统计信息 -->
          <div class="template-stats">
            <div class="stat-item">
              <el-icon class="stat-icon"><Document /></el-icon>
              <span class="stat-value">{{ template.taskCount }}</span>
              <span class="stat-label">任务</span>
            </div>
            <div class="stat-item">
              <el-icon class="stat-icon"><Flag /></el-icon>
              <span class="stat-value">{{ template.milestoneCount }}</span>
              <span class="stat-label">里程碑</span>
            </div>
            <div class="stat-item">
              <el-icon class="stat-icon"><Clock /></el-icon>
              <span class="stat-value">{{ template.duration }}</span>
              <span class="stat-label">天</span>
            </div>
            <div class="stat-item">
              <el-icon class="stat-icon"><User /></el-icon>
              <span class="stat-value">{{ template.usageCount }}</span>
              <span class="stat-label">使用</span>
            </div>
          </div>

          <!-- 适用范围 -->
          <div class="template-scope">
            <div class="scope-item">
              <span class="scope-label">适用岗位：</span>
              <span class="scope-value">{{ template.positions.join('、') }}</span>
            </div>
            <div class="scope-item">
              <span class="scope-label">适用部门：</span>
              <span class="scope-value">{{ template.departments.join('、') }}</span>
            </div>
          </div>

          <!-- 标签 -->
          <div class="template-tags">
            <el-tag 
              v-for="tag in template.tags" 
              :key="tag"
              size="small"
              type="info"
            >
              {{ tag }}
            </el-tag>
          </div>

          <!-- 卡片底部 -->
          <div class="card-footer">
            <div class="footer-left">
              <div class="author-info">
                <el-avatar :size="24" :src="template.author.avatar">
                  {{ template.author.name[0] }}
                </el-avatar>
                <span class="author-name">{{ template.author.name }}</span>
              </div>
              <div class="version-info">
                <span class="version-label">版本：</span>
                <span class="version-value">{{ template.version }}</span>
              </div>
            </div>
            <div class="footer-right">
              <div class="update-time">
                <span class="time-label">更新时间：</span>
                <span class="time-value">{{ formatDate(template.updateTime) }}</span>
              </div>
              <div class="rating-info">
                <el-rate 
                  v-model="template.rating" 
                  disabled 
                  :max="5"
                  :allow-half="true"
                  size="small"
                />
                <span class="rating-text">({{ template.reviewCount }})</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 分页 -->
    <div class="pagination-container">
      <el-pagination
        v-model:current-page="currentPage"
        v-model:page-size="pageSize"
        :page-sizes="[12, 24, 48]"
        :total="totalCount"
        layout="total, sizes, prev, pager, next, jumper"
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
      />
    </div>

    <!-- 模板详情抽屉 -->
    <el-drawer
      v-model="detailsVisible"
      title="模板详情"
      size="60%"
      direction="rtl"
    >
      <TemplateDetails
        v-if="selectedTemplate"
        :template="selectedTemplate"
        :user-role="userRole"
        @edit-template="editTemplate"
        @close="detailsVisible = false"
      />
    </el-drawer>

    <!-- 创建/编辑模板对话框 -->
    <el-dialog
      v-model="editDialogVisible"
      :title="isEditMode ? '编辑模板' : '新建模板'"
      width="80%"
      top="5vh"
      :before-close="handleCloseEdit"
    >
      <TemplateForm
        v-if="editDialogVisible"
        :template="isEditMode ? selectedTemplate : null"
        :mode="isEditMode ? 'edit' : 'create'"
        @success="handleTemplateSaved"
        @cancel="handleCloseEdit"
      />
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { 
  Plus, 
  Search, 
  More, 
  Document, 
  Flag, 
  Clock, 
  User,
  Briefcase,
  Monitor,
  PaintBrush,
  TrendCharts,
  Setting
} from '@element-plus/icons-vue';
import { ElMessage } from 'element-plus';
import TemplateDetails from './TemplateDetails.vue';
import TemplateForm from './TemplateForm.vue';

// Props
interface Props {
  userRole: string;
  userId: string;
}

const props = defineProps<Props>();

// Emits
const emit = defineEmits<{
  editTemplate: [id: string];
}>();

// 响应式数据
const activeCategory = ref('all');
const filterDepartment = ref('');
const filterLevel = ref('');
const filterStatus = ref('');
const searchKeyword = ref('');
const currentPage = ref(1);
const pageSize = ref(12);
const totalCount = ref(0);

// 对话框状态
const detailsVisible = ref(false);
const editDialogVisible = ref(false);
const isEditMode = ref(false);
const selectedTemplate = ref(null);

// 模板分类
const categories = ref([
  {
    id: 'all',
    name: '全部模板',
    count: 28,
    icon: 'Document',
    color: '#409EFF'
  },
  {
    id: 'technical',
    name: '技术开发',
    count: 12,
    icon: 'Monitor',
    color: '#67C23A'
  },
  {
    id: 'product',
    name: '产品管理',
    count: 6,
    icon: 'Briefcase',
    color: '#E6A23C'
  },
  {
    id: 'design',
    name: '设计创意',
    count: 5,
    icon: 'PaintBrush',
    color: '#F56C6C'
  },
  {
    id: 'business',
    name: '商务运营',
    count: 3,
    icon: 'TrendCharts',
    color: '#909399'
  },
  {
    id: 'management',
    name: '管理职能',
    count: 2,
    icon: 'Setting',
    color: '#9C27B0'
  }
]);

// 基础数据
const departments = ref(['技术部', '产品部', '设计部', '运营部', '市场部', '销售部']);

// 模板数据
const templateList = ref([
  {
    id: 't1',
    name: '前端开发入门模板',
    description: '面向前端开发新手的系统性培训模板，涵盖HTML、CSS、JavaScript基础知识',
    category: 'technical',
    level: 'beginner',
    status: 'published',
    version: 'v2.1',
    author: {
      id: 'a1',
      name: '张技术',
      avatar: ''
    },
    positions: ['前端开发工程师', '全栈开发工程师'],
    departments: ['技术部', '产品部'],
    taskCount: 15,
    milestoneCount: 4,
    duration: 60,
    usageCount: 25,
    rating: 4.5,
    reviewCount: 12,
    tags: ['Vue.js', 'JavaScript', 'HTML', 'CSS'],
    createTime: new Date('2023-06-15'),
    updateTime: new Date('2024-01-08'),
    tasks: [
      { name: 'HTML基础学习', type: 'study', duration: 5, required: true },
      { name: 'CSS样式设计', type: 'study', duration: 7, required: true },
      { name: 'JavaScript基础', type: 'study', duration: 10, required: true }
    ],
    milestones: [
      { name: '基础知识掌握', day: 20, description: '完成HTML、CSS、JS基础学习' },
      { name: '实战项目', day: 40, description: '完成一个小型项目' }
    ]
  },
  {
    id: 't2',
    name: '产品经理进阶模板',
    description: '帮助初级产品经理快速成长为优秀产品经理的系统性培训模板',
    category: 'product',
    level: 'intermediate',
    status: 'published',
    version: 'v1.3',
    author: {
      id: 'a2',
      name: '李产品',
      avatar: ''
    },
    positions: ['产品经理', '产品专员'],
    departments: ['产品部'],
    taskCount: 12,
    milestoneCount: 3,
    duration: 90,
    usageCount: 18,
    rating: 4.8,
    reviewCount: 8,
    tags: ['产品规划', '用户体验', '数据分析'],
    createTime: new Date('2023-08-20'),
    updateTime: new Date('2024-01-05'),
    tasks: [
      { name: '用户需求分析', type: 'practice', duration: 10, required: true },
      { name: '产品原型设计', type: 'practice', duration: 15, required: true }
    ],
    milestones: [
      { name: '需求分析能力', day: 30, description: '掌握用户需求分析方法' },
      { name: '产品设计能力', day: 60, description: '能够独立设计产品功能' }
    ]
  },
  {
    id: 't3',
    name: 'UI设计师培养模板',
    description: '针对UI设计师的专业技能培养模板，注重设计思维和工具使用',
    category: 'design',
    level: 'intermediate',
    status: 'draft',
    version: 'v1.0',
    author: {
      id: 'a3',
      name: '王设计',
      avatar: ''
    },
    positions: ['UI设计师', '视觉设计师'],
    departments: ['设计部'],
    taskCount: 10,
    milestoneCount: 3,
    duration: 45,
    usageCount: 0,
    rating: 0,
    reviewCount: 0,
    tags: ['UI设计', 'Figma', '设计规范'],
    createTime: new Date('2024-01-01'),
    updateTime: new Date('2024-01-10'),
    tasks: [
      { name: '设计基础理论', type: 'study', duration: 5, required: true },
      { name: 'Figma工具使用', type: 'study', duration: 8, required: true }
    ],
    milestones: [
      { name: '工具熟练度', day: 15, description: '熟练使用设计工具' },
      { name: '设计思维', day: 30, description: '建立设计思维体系' }
    ]
  }
]);

// 计算属性
const filteredTemplates = computed(() => {
  let result = [...templateList.value];
  
  // 分类筛选
  if (activeCategory.value !== 'all') {
    result = result.filter(t => t.category === activeCategory.value);
  }
  
  // 部门筛选
  if (filterDepartment.value) {
    result = result.filter(t => t.departments.includes(filterDepartment.value));
  }
  
  // 等级筛选
  if (filterLevel.value) {
    result = result.filter(t => t.level === filterLevel.value);
  }
  
  // 状态筛选
  if (filterStatus.value) {
    result = result.filter(t => t.status === filterStatus.value);
  }
  
  // 关键词搜索
  if (searchKeyword.value) {
    const keyword = searchKeyword.value.toLowerCase();
    result = result.filter(t => 
      t.name.toLowerCase().includes(keyword) ||
      t.tags.some(tag => tag.toLowerCase().includes(keyword))
    );
  }
  
  // 分页
  const start = (currentPage.value - 1) * pageSize.value;
  const end = start + pageSize.value;
  totalCount.value = result.length;
  
  return result.slice(start, end);
});

const canManageTemplates = computed(() => {
  return ['mentor', 'manager', 'hr', 'academic'].includes(props.userRole);
});

// 方法
const formatDate = (date: Date) => {
  return date.toLocaleDateString('zh-CN');
};

const getStatusTagType = (status: string) => {
  const types = {
    'published': 'success',
    'draft': 'warning',
    'disabled': 'info'
  };
  return types[status] || 'default';
};

const getStatusText = (status: string) => {
  const texts = {
    'published': '已发布',
    'draft': '草稿',
    'disabled': '已停用'
  };
  return texts[status] || status;
};

const getLevelTagType = (level: string) => {
  const types = {
    'beginner': 'success',
    'intermediate': 'warning',
    'advanced': 'danger'
  };
  return types[level] || 'default';
};

const getLevelText = (level: string) => {
  const texts = {
    'beginner': '入门',
    'intermediate': '中级',
    'advanced': '高级'
  };
  return texts[level] || level;
};

const canEditTemplate = (template: any) => {
  if (['manager', 'hr'].includes(props.userRole)) return true;
  if (props.userRole === 'mentor' && template.author.id === props.userId) return true;
  return false;
};

const handleSizeChange = (size: number) => {
  pageSize.value = size;
  currentPage.value = 1;
};

const handleCurrentChange = (page: number) => {
  currentPage.value = page;
};

// 操作方法
const createTemplate = () => {
  isEditMode.value = false;
  selectedTemplate.value = null;
  editDialogVisible.value = true;
};

const viewTemplate = (templateId: string) => {
  const template = templateList.value.find(t => t.id === templateId);
  if (template) {
    selectedTemplate.value = template;
    detailsVisible.value = true;
  }
};

const editTemplate = (templateId: string) => {
  const template = templateList.value.find(t => t.id === templateId);
  if (template) {
    selectedTemplate.value = template;
    isEditMode.value = true;
    editDialogVisible.value = true;
    emit('editTemplate', templateId);
  }
};

const handleCommand = (command: string, template: any) => {
  switch (command) {
    case 'view':
      viewTemplate(template.id);
      break;
    case 'edit':
      editTemplate(template.id);
      break;
    case 'copy':
      ElMessage.success('模板已复制');
      break;
    case 'export':
      ElMessage.info('导出功能开发中');
      break;
    case 'history':
      ElMessage.info('版本历史功能开发中');
      break;
    case 'disable':
      template.status = 'disabled';
      ElMessage.success('模板已停用');
      break;
    case 'enable':
      template.status = 'published';
      ElMessage.success('模板已启用');
      break;
  }
};

const handleCloseEdit = () => {
  editDialogVisible.value = false;
  selectedTemplate.value = null;
  isEditMode.value = false;
};

const handleTemplateSaved = () => {
  editDialogVisible.value = false;
  selectedTemplate.value = null;
  isEditMode.value = false;
  ElMessage.success(isEditMode.value ? '模板更新成功' : '模板创建成功');
};

// 页面初始化
onMounted(() => {
  console.log('TemplateLibrary mounted');
});
</script>

<style scoped>
.template-library {
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

.template-categories {
  margin-bottom: 24px;
}

.category-tabs {
  display: flex;
  gap: 16px;
  overflow-x: auto;
  padding-bottom: 8px;
}

.category-tab {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px 20px;
  background: white;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
  border: 2px solid transparent;
  min-width: 160px;
}

.category-tab:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.category-tab.active {
  border-color: #409EFF;
  background: #f0f9ff;
}

.category-icon {
  font-size: 24px;
}

.category-name {
  font-size: 16px;
  font-weight: 500;
  color: #1f2937;
}

.category-count {
  font-size: 12px;
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

.template-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
  gap: 20px;
}

.template-card {
  background: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
  cursor: pointer;
  border: 1px solid #e5e7eb;
}

.template-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 12px;
}

.template-title {
  margin: 0 0 8px 0;
  font-size: 18px;
  color: #1f2937;
  font-weight: 600;
}

.template-meta {
  display: flex;
  gap: 8px;
}

.template-description {
  margin-bottom: 16px;
}

.template-description p {
  margin: 0;
  color: #6b7280;
  font-size: 14px;
  line-height: 1.5;
}

.template-stats {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  margin-bottom: 16px;
  padding: 12px;
  background: #f8fafc;
  border-radius: 8px;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.stat-icon {
  font-size: 16px;
  color: #6b7280;
}

.stat-value {
  font-size: 16px;
  font-weight: 600;
  color: #1f2937;
}

.stat-label {
  font-size: 12px;
  color: #6b7280;
}

.template-scope {
  margin-bottom: 16px;
}

.scope-item {
  display: flex;
  align-items: center;
  margin-bottom: 4px;
  font-size: 13px;
}

.scope-label {
  color: #6b7280;
  min-width: 80px;
}

.scope-value {
  color: #1f2937;
}

.template-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 16px;
}

.card-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 16px;
  border-top: 1px solid #e5e7eb;
}

.footer-left {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.author-info {
  display: flex;
  align-items: center;
  gap: 8px;
}

.author-name {
  font-size: 12px;
  color: #6b7280;
}

.version-info {
  font-size: 12px;
}

.version-label {
  color: #6b7280;
}

.version-value {
  color: #1f2937;
  font-weight: 500;
}

.footer-right {
  display: flex;
  flex-direction: column;
  gap: 4px;
  align-items: flex-end;
}

.update-time {
  font-size: 12px;
}

.time-label {
  color: #6b7280;
}

.time-value {
  color: #1f2937;
}

.rating-info {
  display: flex;
  align-items: center;
  gap: 4px;
}

.rating-text {
  font-size: 12px;
  color: #6b7280;
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
  
  .category-tabs {
    flex-direction: column;
  }
  
  .category-tab {
    min-width: auto;
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
  
  .template-grid {
    grid-template-columns: 1fr;
  }
  
  .template-stats {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .card-footer {
    flex-direction: column;
    gap: 12px;
    align-items: stretch;
  }
}
</style> 