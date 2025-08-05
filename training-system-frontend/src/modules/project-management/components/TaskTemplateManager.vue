<template>
  <div class="task-template-manager">
    <!-- 模板管理头部 -->
    <div class="template-header">
      <div class="header-title">
        <el-icon><Collection /></el-icon>
        <span>任务模板管理</span>
      </div>
      <div class="header-actions">
        <el-button type="primary" size="small" @click="showCreateTemplate">
          <el-icon><Plus /></el-icon>
          创建模板
        </el-button>
        <el-button size="small" @click="showImportTemplate">
          <el-icon><Upload /></el-icon>
          导入模板
        </el-button>
      </div>
    </div>

    <!-- 模板搜索和筛选 -->
    <div class="template-filters">
      <el-input
        v-model="searchKeyword"
        placeholder="搜索模板..."
        prefix-icon="Search"
        size="small"
        clearable
        style="width: 200px"
      />
      <el-select v-model="filterCategory" placeholder="按分类筛选" size="small" clearable>
        <el-option label="全部分类" value="" />
        <el-option label="在线任务" value="online" />
        <el-option label="线下任务" value="offline" />
        <el-option label="工具任务" value="tool" />
      </el-select>
      <el-select v-model="sortBy" placeholder="排序方式" size="small">
        <el-option label="创建时间" value="createdAt" />
        <el-option label="使用次数" value="usageCount" />
        <el-option label="模板名称" value="name" />
      </el-select>
    </div>

    <!-- 模板列表 -->
    <div class="template-list">
      <div v-if="filteredTemplates.length === 0" class="empty-state">
        <el-empty description="暂无模板，快来创建第一个吧！" />
      </div>
      <div
        v-for="template in filteredTemplates"
        :key="template.id"
        class="template-card"
        @click="previewTemplate(template)"
      >
        <div class="template-card-header">
          <div class="template-info">
            <h4 class="template-name">{{ template.name }}</h4>
            <p class="template-description">{{ template.description || '暂无描述' }}</p>
          </div>
          <el-dropdown trigger="click" @command="cmd => handleTemplateCommand(template, cmd)">
            <span class="template-actions">
              <el-icon><MoreFilled /></el-icon>
            </span>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="apply">应用模板</el-dropdown-item>
                <el-dropdown-item command="edit">编辑模板</el-dropdown-item>
                <el-dropdown-item command="duplicate">复制模板</el-dropdown-item>
                <el-dropdown-item command="export" divided>导出模板</el-dropdown-item>
                <el-dropdown-item command="delete" style="color: #f56c6c">删除模板</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>

        <div class="template-meta">
          <div class="meta-item">
            <el-icon><Document /></el-icon>
            <span>{{ template.tasks.length }}个任务</span>
          </div>
          <div class="meta-item">
            <el-icon><Clock /></el-icon>
            <span>{{ getTotalHours(template) }}h</span>
          </div>
          <div class="meta-item">
            <el-icon><View /></el-icon>
            <span>使用{{ template.usageCount || 0 }}次</span>
          </div>
        </div>

        <div class="template-tags">
          <el-tag
            v-for="tag in template.tags"
            :key="tag"
            size="small"
            type="info"
          >
            {{ tag }}
          </el-tag>
          <el-tag
            v-if="template.category"
            size="small"
            :type="getCategoryColor(template.category)"
          >
            {{ getCategoryName(template.category) }}
          </el-tag>
        </div>

        <div class="template-footer">
          <span class="template-date">{{ formatDate(template.createdAt) }}</span>
          <el-button
            type="primary"
            size="small"
            @click.stop="applyTemplate(template)"
          >
            应用模板
          </el-button>
        </div>
      </div>
    </div>

    <!-- 创建/编辑模板对话框 -->
    <el-dialog
      v-model="templateDialogVisible"
      :title="editingTemplate.id ? '编辑模板' : '创建模板'"
      width="700px"
      :before-close="handleTemplateDialogClose"
    >
      <el-form
        ref="templateFormRef"
        :model="editingTemplate"
        :rules="templateFormRules"
        label-width="100px"
      >
        <el-form-item label="模板名称" prop="name">
          <el-input
            v-model="editingTemplate.name"
            placeholder="请输入模板名称"
          />
        </el-form-item>
        <el-form-item label="模板描述" prop="description">
          <el-input
            v-model="editingTemplate.description"
            type="textarea"
            :rows="3"
            placeholder="请输入模板描述（可选）"
          />
        </el-form-item>
        <el-form-item label="分类" prop="category">
          <el-select v-model="editingTemplate.category" placeholder="请选择分类">
            <el-option label="在线任务" value="online" />
            <el-option label="线下任务" value="offline" />
            <el-option label="工具任务" value="tool" />
          </el-select>
        </el-form-item>
        <el-form-item label="标签">
          <el-tag
            v-for="tag in editingTemplate.tags"
            :key="tag"
            closable
            @close="removeTag(tag)"
            style="margin-right: 8px"
          >
            {{ tag }}
          </el-tag>
          <el-input
            v-if="inputVisible"
            ref="inputRef"
            v-model="inputValue"
            size="small"
            style="width: 80px"
            @keyup.enter="handleInputConfirm"
            @blur="handleInputConfirm"
          />
          <el-button v-else size="small" @click="showInput">
            + 添加标签
          </el-button>
        </el-form-item>
        <el-form-item label="任务列表">
          <div class="task-template-list">
            <div
              v-for="(task, index) in editingTemplate.tasks"
              :key="index"
              class="task-template-item"
            >
              <div class="task-basic-info">
                <el-select v-model="task.type" placeholder="任务类型" size="small">
                  <el-option
                    v-for="type in enabledTaskTypes"
                    :key="type.type"
                    :label="type.label"
                    :value="type.type"
                  />
                </el-select>
                <el-input
                  v-model="task.name"
                  placeholder="任务名称"
                  size="small"
                />
                <el-button
                  type="danger"
                  size="small"
                  circle
                  @click="removeTaskFromTemplate(index)"
                >
                  <el-icon><Close /></el-icon>
                </el-button>
              </div>
              <el-input
                v-model="task.description"
                placeholder="任务描述（可选）"
                size="small"
                style="margin-top: 8px"
              />
            </div>
            <el-button
              type="dashed"
              size="small"
              @click="addTaskToTemplate"
              style="width: 100%"
            >
              <el-icon><Plus /></el-icon>
              添加任务
            </el-button>
          </div>
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="templateDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="saveTemplate">保存模板</el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 模板预览对话框 -->
    <el-dialog
      v-model="previewDialogVisible"
      title="模板预览"
      width="600px"
    >
      <div v-if="previewingTemplate" class="template-preview">
        <div class="preview-header">
          <h3>{{ previewingTemplate.name }}</h3>
          <p>{{ previewingTemplate.description }}</p>
        </div>
        <div class="preview-tasks">
          <h4>包含任务 ({{ previewingTemplate.tasks.length }}个)</h4>
          <el-table :data="previewingTemplate.tasks" size="small">
            <el-table-column prop="type" label="类型" width="100">
              <template #default="scope">
                <el-tag size="small">{{ getTaskTypeLabel(scope.row.type) }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="name" label="任务名称" />
            <el-table-column prop="description" label="描述" />
          </el-table>
        </div>
      </div>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="previewDialogVisible = false">关闭</el-button>
          <el-button
            type="primary"
            @click="applyTemplate(previewingTemplate)"
          >
            应用此模板
          </el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 导入模板对话框 -->
    <el-dialog
      v-model="importDialogVisible"
      title="导入模板"
      width="500px"
    >
      <el-upload
        class="upload-demo"
        drag
        :auto-upload="false"
        :on-change="handleFileChange"
        accept=".json"
      >
        <el-icon class="el-icon--upload"><UploadFilled /></el-icon>
        <div class="el-upload__text">
          将JSON文件拖拽到此处，或<em>点击上传</em>
        </div>
        <template #tip>
          <div class="el-upload__tip">
            只能上传JSON格式的模板文件
          </div>
        </template>
      </el-upload>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="importDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="confirmImport">确定导入</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, nextTick } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { 
  Collection, Plus, Upload, Search, MoreFilled, Document, 
  Clock, View, Close, UploadFilled 
} from '@element-plus/icons-vue';
import { getEnabledTaskTypes, getTaskTypeConfig } from '../constants/taskTypeCategories';
import { useTrainingStageStore } from '../stores/trainingStage';

// Props & Emits
interface TaskTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  tags: string[];
  tasks: Array<{
    type: string;
    name: string;
    description: string;
    config?: Record<string, any>;
  }>;
  usageCount: number;
  createdAt: string;
  updatedAt: string;
}

const store = useTrainingStageStore();

// 响应式数据
const searchKeyword = ref('');
const filterCategory = ref('');
const sortBy = ref('createdAt');

const templateDialogVisible = ref(false);
const previewDialogVisible = ref(false);
const importDialogVisible = ref(false);

const templates = ref<TaskTemplate[]>([
  // 示例模板数据
  {
    id: '1',
    name: '标准在线培训流程',
    description: '包含课程学习、作业提交、在线考试的完整流程',
    category: 'online',
    tags: ['基础培训', '在线学习'],
    tasks: [
      { type: 'online-course', name: '课程学习', description: '观看培训课程视频' },
      { type: 'homework', name: '课后作业', description: '完成课程相关作业' },
      { type: 'exam', name: '结业考试', description: '检验学习成果' },
    ],
    usageCount: 15,
    createdAt: '2024-01-15T08:00:00.000Z',
    updatedAt: '2024-01-15T08:00:00.000Z',
  },
  {
    id: '2',
    name: '线下培训完整流程',
    description: '面授+讨论+活动的线下培训组合',
    category: 'offline',
    tags: ['线下培训', '互动学习'],
    tasks: [
      { type: 'face-to-face', name: '开班仪式', description: '培训班开班介绍' },
      { type: 'face-to-face', name: '专题讲座', description: '专家主题分享' },
      { type: 'discussion', name: '小组讨论', description: '分组研讨学习内容' },
      { type: 'activity', name: '团建活动', description: '增进学员感情' },
    ],
    usageCount: 8,
    createdAt: '2024-01-10T08:00:00.000Z',
    updatedAt: '2024-01-10T08:00:00.000Z',
  },
]);

const editingTemplate = ref<Partial<TaskTemplate>>({
  name: '',
  description: '',
  category: '',
  tags: [],
  tasks: [],
});

const previewingTemplate = ref<TaskTemplate | null>(null);

// 标签输入
const inputVisible = ref(false);
const inputValue = ref('');
const inputRef = ref();

// 表单验证
const templateFormRef = ref();
const templateFormRules = {
  name: [
    { required: true, message: '请输入模板名称', trigger: 'blur' },
    { min: 2, max: 50, message: '长度在 2 到 50 个字符', trigger: 'blur' }
  ],
  category: [
    { required: true, message: '请选择分类', trigger: 'change' }
  ],
};

// 计算属性
const enabledTaskTypes = computed(() => getEnabledTaskTypes());

const filteredTemplates = computed(() => {
  let result = [...templates.value];
  
  // 搜索过滤
  if (searchKeyword.value) {
    const keyword = searchKeyword.value.toLowerCase();
    result = result.filter(template => 
      template.name.toLowerCase().includes(keyword) ||
      template.description.toLowerCase().includes(keyword) ||
      template.tags.some(tag => tag.toLowerCase().includes(keyword))
    );
  }
  
  // 分类过滤
  if (filterCategory.value) {
    result = result.filter(template => template.category === filterCategory.value);
  }
  
  // 排序
  result.sort((a, b) => {
    switch (sortBy.value) {
      case 'usageCount':
        return (b.usageCount || 0) - (a.usageCount || 0);
      case 'name':
        return a.name.localeCompare(b.name);
      case 'createdAt':
      default:
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    }
  });
  
  return result;
});

// 方法
function showCreateTemplate() {
  editingTemplate.value = {
    name: '',
    description: '',
    category: '',
    tags: [],
    tasks: [],
  };
  templateDialogVisible.value = true;
}

function showImportTemplate() {
  importDialogVisible.value = true;
}

function previewTemplate(template: TaskTemplate) {
  previewingTemplate.value = template;
  previewDialogVisible.value = true;
}

function applyTemplate(template: TaskTemplate) {
  ElMessageBox.confirm(
    `确定要应用模板"${template.name}"吗？这将在当前阶段添加 ${template.tasks.length} 个任务。`,
    '应用模板确认',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'info',
    }
  ).then(() => {
    // 将模板任务添加到当前阶段
    template.tasks.forEach(taskTemplate => {
      store.addTaskToActiveStage(
        taskTemplate.type,
        taskTemplate.name,
        {
          description: taskTemplate.description,
          ...taskTemplate.config
        }
      );
    });
    
    // 更新使用次数
    const targetTemplate = templates.value.find(t => t.id === template.id);
    if (targetTemplate) {
      targetTemplate.usageCount = (targetTemplate.usageCount || 0) + 1;
      targetTemplate.updatedAt = new Date().toISOString();
    }
    
    ElMessage.success(`已应用模板"${template.name}"，添加了 ${template.tasks.length} 个任务`);
    previewDialogVisible.value = false;
  }).catch(() => {
    // 用户取消
  });
}

function handleTemplateCommand(template: TaskTemplate, command: string) {
  switch (command) {
    case 'apply':
      applyTemplate(template);
      break;
    case 'edit':
      editTemplate(template);
      break;
    case 'duplicate':
      duplicateTemplate(template);
      break;
    case 'export':
      exportTemplate(template);
      break;
    case 'delete':
      deleteTemplate(template);
      break;
  }
}

function editTemplate(template: TaskTemplate) {
  editingTemplate.value = { ...template };
  templateDialogVisible.value = true;
}

function duplicateTemplate(template: TaskTemplate) {
  const newTemplate: TaskTemplate = {
    ...template,
    id: Date.now().toString(),
    name: `${template.name} (副本)`,
    usageCount: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  templates.value.unshift(newTemplate);
  ElMessage.success('模板已复制');
}

function exportTemplate(template: TaskTemplate) {
  const dataStr = JSON.stringify(template, null, 2);
  const dataBlob = new Blob([dataStr], { type: 'application/json' });
  const url = URL.createObjectURL(dataBlob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${template.name}.json`;
  link.click();
  URL.revokeObjectURL(url);
  ElMessage.success('模板已导出');
}

function deleteTemplate(template: TaskTemplate) {
  ElMessageBox.confirm(
    `确定要删除模板"${template.name}"吗？此操作不可恢复。`,
    '删除确认',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    }
  ).then(() => {
    const index = templates.value.findIndex(t => t.id === template.id);
    if (index > -1) {
      templates.value.splice(index, 1);
      ElMessage.success('模板已删除');
    }
  }).catch(() => {
    // 用户取消
  });
}

function saveTemplate() {
  templateFormRef.value?.validate((valid: boolean) => {
    if (valid) {
      const template = editingTemplate.value as TaskTemplate;
      
      if (template.id) {
        // 编辑现有模板
        const index = templates.value.findIndex(t => t.id === template.id);
        if (index > -1) {
          templates.value[index] = {
            ...template,
            updatedAt: new Date().toISOString(),
          };
          ElMessage.success('模板已更新');
        }
      } else {
        // 创建新模板
        const newTemplate: TaskTemplate = {
          ...template,
          id: Date.now().toString(),
          usageCount: 0,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        } as TaskTemplate;
        templates.value.unshift(newTemplate);
        ElMessage.success('模板已创建');
      }
      
      templateDialogVisible.value = false;
    }
  });
}

function handleTemplateDialogClose() {
  templateDialogVisible.value = false;
}

function addTaskToTemplate() {
  editingTemplate.value.tasks!.push({
    type: '',
    name: '',
    description: '',
  });
}

function removeTaskFromTemplate(index: number) {
  editingTemplate.value.tasks!.splice(index, 1);
}

function showInput() {
  inputVisible.value = true;
  nextTick(() => {
    inputRef.value?.focus();
  });
}

function handleInputConfirm() {
  if (inputValue.value && !editingTemplate.value.tags!.includes(inputValue.value)) {
    editingTemplate.value.tags!.push(inputValue.value);
  }
  inputVisible.value = false;
  inputValue.value = '';
}

function removeTag(tag: string) {
  const index = editingTemplate.value.tags!.indexOf(tag);
  if (index > -1) {
    editingTemplate.value.tags!.splice(index, 1);
  }
}

function handleFileChange(file: any) {
  // 处理文件导入逻辑
  console.log('File selected:', file);
}

function confirmImport() {
  // 确认导入逻辑
  ElMessage.success('模板导入成功');
  importDialogVisible.value = false;
}

function getTotalHours(template: TaskTemplate) {
  return template.tasks.reduce((total, task) => {
    const config = getTaskTypeConfig(task.type);
    return total + (config?.estimatedHours || 0);
  }, 0);
}

function getCategoryColor(category: string) {
  const colors: Record<string, string> = {
    'online': 'primary',
    'offline': 'success',
    'tool': 'warning',
  };
  return colors[category] || 'info';
}

function getCategoryName(category: string) {
  const names: Record<string, string> = {
    'online': '在线任务',
    'offline': '线下任务',
    'tool': '工具任务',
  };
  return names[category] || category;
}

function getTaskTypeLabel(type: string) {
  const config = getTaskTypeConfig(type);
  return config?.label || type;
}

function formatDate(dateString: string) {
  const date = new Date(dateString);
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
}
</script>

<style scoped>
.task-template-manager {
  padding: 20px;
  background: #fff;
  border-radius: 8px;
  height: 100%;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.template-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 16px;
  border-bottom: 1px solid #e8e8e8;
}

.header-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 18px;
  font-weight: 600;
  color: #333;
}

.header-actions {
  display: flex;
  gap: 12px;
}

.template-filters {
  display: flex;
  gap: 12px;
  margin-bottom: 20px;
  align-items: center;
}

.template-list {
  flex: 1;
  overflow-y: auto;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 16px;
}

.empty-state {
  grid-column: 1 / -1;
  text-align: center;
  padding: 60px 20px;
}

.template-card {
  border: 1px solid #e8e8e8;
  border-radius: 8px;
  padding: 16px;
  background: #fff;
  transition: all 0.3s;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.template-card:hover {
  border-color: #409eff;
  box-shadow: 0 4px 12px rgba(64, 158, 255, 0.2);
}

.template-card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

.template-info {
  flex: 1;
}

.template-name {
  margin: 0 0 4px 0;
  font-size: 16px;
  font-weight: 600;
  color: #333;
}

.template-description {
  margin: 0;
  font-size: 14px;
  color: #666;
  line-height: 1.4;
}

.template-actions {
  padding: 4px;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.3s;
}

.template-actions:hover {
  background-color: #f0f0f0;
}

.template-meta {
  display: flex;
  gap: 16px;
  font-size: 12px;
  color: #999;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 4px;
}

.template-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.template-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 8px;
  border-top: 1px solid #f0f0f0;
}

.template-date {
  font-size: 12px;
  color: #999;
}

.task-template-list {
  border: 1px solid #e8e8e8;
  border-radius: 6px;
  padding: 12px;
  background: #f8f9fa;
}

.task-template-item {
  margin-bottom: 12px;
}

.task-template-item:last-child {
  margin-bottom: 0;
}

.task-basic-info {
  display: flex;
  gap: 8px;
  align-items: center;
}

.task-basic-info .el-select {
  width: 120px;
}

.task-basic-info .el-input {
  flex: 1;
}

.template-preview {
  max-height: 500px;
  overflow-y: auto;
}

.preview-header {
  margin-bottom: 20px;
  padding-bottom: 16px;
  border-bottom: 1px solid #e8e8e8;
}

.preview-header h3 {
  margin: 0 0 8px 0;
  color: #333;
}

.preview-header p {
  margin: 0;
  color: #666;
}

.preview-tasks h4 {
  margin: 0 0 12px 0;
  color: #333;
}
</style> 