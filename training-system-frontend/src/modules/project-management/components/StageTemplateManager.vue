<template>
  <div class="stage-template-manager">
    <!-- 阶段模板管理头部 -->
    <div class="template-header">
      <div class="header-title">
        <el-icon><Files /></el-icon>
        <span>阶段模板管理</span>
      </div>
      <div class="header-actions">
        <el-button type="primary" size="small" @click="showCreateStageTemplate">
          <el-icon><Plus /></el-icon>
          创建阶段模板
        </el-button>
        <el-button size="small" @click="showImportStageTemplate">
          <el-icon><Upload /></el-icon>
          导入模板
        </el-button>
      </div>
    </div>

    <!-- 模板搜索和筛选 -->
    <div class="template-filters">
      <el-input
        v-model="searchKeyword"
        placeholder="搜索阶段模板..."
        prefix-icon="Search"
        size="small"
        clearable
        style="width: 200px"
      />
      <el-select v-model="filterType" placeholder="按类型筛选" size="small" clearable>
        <el-option label="全部类型" value="" />
        <el-option label="培训前" value="pre-training" />
        <el-option label="培训中" value="training" />
        <el-option label="培训后" value="post-training" />
      </el-select>
      <el-select v-model="sortBy" placeholder="排序方式" size="small">
        <el-option label="创建时间" value="createdAt" />
        <el-option label="使用次数" value="usageCount" />
        <el-option label="模板名称" value="name" />
      </el-select>
    </div>

    <!-- 阶段模板列表 -->
    <div class="template-list">
      <div v-if="filteredStageTemplates.length === 0" class="empty-state">
        <el-empty description="暂无阶段模板，快来创建第一个吧！" />
      </div>
      <div
        v-for="template in filteredStageTemplates"
        :key="template.id"
        class="stage-template-card"
        @click="previewStageTemplate(template)"
      >
        <div class="template-card-header">
          <div class="template-info">
            <h4 class="template-name">{{ template.name }}</h4>
            <p class="template-description">{{ template.description || '暂无描述' }}</p>
          </div>
          <el-dropdown trigger="click" @command="cmd => handleStageTemplateCommand(template, cmd)">
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
            <span>{{ template.estimatedDuration }}h</span>
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
            v-if="template.type"
            size="small"
            :type="getTypeColor(template.type)"
          >
            {{ getTypeName(template.type) }}
          </el-tag>
        </div>

        <div class="template-footer">
          <span class="template-date">{{ formatDate(template.createdAt) }}</span>
          <el-button
            type="primary"
            size="small"
            @click.stop="applyStageTemplate(template)"
          >
            应用模板
          </el-button>
        </div>
      </div>
    </div>

    <!-- 创建/编辑阶段模板对话框 -->
    <el-dialog
      v-model="stageTemplateDialogVisible"
      :title="editingStageTemplate.id ? '编辑阶段模板' : '创建阶段模板'"
      width="800px"
      :before-close="handleStageTemplateDialogClose"
    >
      <el-form
        ref="stageTemplateFormRef"
        :model="editingStageTemplate"
        :rules="stageTemplateFormRules"
        label-width="100px"
      >
        <el-form-item label="模板名称" prop="name">
          <el-input
            v-model="editingStageTemplate.name"
            placeholder="请输入阶段模板名称"
          />
        </el-form-item>
        <el-form-item label="模板描述" prop="description">
          <el-input
            v-model="editingStageTemplate.description"
            type="textarea"
            :rows="3"
            placeholder="请输入阶段模板描述（可选）"
          />
        </el-form-item>
        <el-form-item label="阶段类型" prop="type">
          <el-select v-model="editingStageTemplate.type" placeholder="请选择阶段类型">
            <el-option label="培训前" value="pre-training" />
            <el-option label="培训中" value="training" />
            <el-option label="培训后" value="post-training" />
          </el-select>
        </el-form-item>
        <el-form-item label="标签">
          <el-tag
            v-for="tag in editingStageTemplate.tags"
            :key="tag"
            closable
            @close="removeStageTag(tag)"
            style="margin-right: 8px"
          >
            {{ tag }}
          </el-tag>
          <el-input
            v-if="stageInputVisible"
            ref="stageInputRef"
            v-model="stageInputValue"
            size="small"
            style="width: 80px"
            @keyup.enter="handleStageInputConfirm"
            @blur="handleStageInputConfirm"
          />
          <el-button v-else size="small" @click="showStageInput">
            + 添加标签
          </el-button>
        </el-form-item>
        <el-form-item label="任务列表">
          <div class="stage-task-template-list">
            <div
              v-for="(task, index) in editingStageTemplate.tasks"
              :key="index"
              class="stage-task-template-item"
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
                <el-switch
                  v-model="task.required"
                  size="small"
                  active-text="必修"
                  inactive-text="选修"
                />
                <el-button
                  type="danger"
                  size="small"
                  circle
                  @click="removeTaskFromStageTemplate(index)"
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
              <div class="task-config" v-if="task.type">
                <el-row :gutter="12">
                  <el-col :span="8">
                    <el-input
                      v-model="task.config.date"
                      placeholder="日期"
                      size="small"
                    />
                  </el-col>
                  <el-col :span="8">
                    <el-input
                      v-model="task.config.time"
                      placeholder="时间"
                      size="small"
                    />
                  </el-col>
                  <el-col :span="8">
                    <el-input
                      v-model="task.config.duration"
                      placeholder="时长(分钟)"
                      size="small"
                    />
                  </el-col>
                </el-row>
              </div>
            </div>
            <el-button
              type="dashed"
              size="small"
              @click="addTaskToStageTemplate"
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
          <el-button @click="stageTemplateDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="saveStageTemplate">保存模板</el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 阶段模板预览对话框 -->
    <el-dialog
      v-model="stagePreviewDialogVisible"
      title="阶段模板预览"
      width="700px"
    >
      <div v-if="previewingStageTemplate" class="stage-template-preview">
        <div class="preview-header">
          <h3>{{ previewingStageTemplate.name }}</h3>
          <p>{{ previewingStageTemplate.description }}</p>
          <el-tag :type="getTypeColor(previewingStageTemplate.type)">
            {{ getTypeName(previewingStageTemplate.type) }}
          </el-tag>
        </div>
        <div class="preview-tasks">
          <h4>包含任务 ({{ previewingStageTemplate.tasks.length }}个)</h4>
          <el-table :data="previewingStageTemplate.tasks" size="small">
            <el-table-column prop="type" label="类型" width="100">
              <template #default="scope">
                <el-tag size="small">{{ getTaskTypeLabel(scope.row.type) }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="name" label="任务名称" />
            <el-table-column prop="required" label="必修" width="80">
              <template #default="scope">
                <el-tag :type="scope.row.required ? 'success' : 'info'" size="small">
                  {{ scope.row.required ? '必修' : '选修' }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="description" label="描述" />
          </el-table>
        </div>
        <div class="preview-stats">
          <el-statistic title="预计时长" :value="previewingStageTemplate.estimatedDuration" suffix="小时" />
          <el-statistic title="必修任务" :value="getRequiredTasksCount(previewingStageTemplate)" />
          <el-statistic title="选修任务" :value="getOptionalTasksCount(previewingStageTemplate)" />
        </div>
      </div>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="stagePreviewDialogVisible = false">关闭</el-button>
          <el-button
            type="primary"
            @click="applyStageTemplate(previewingStageTemplate)"
          >
            应用此模板
          </el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 从现有阶段创建模板对话框 -->
    <el-dialog
      v-model="createFromStageDialogVisible"
      title="从现有阶段创建模板"
      width="500px"
    >
      <el-form label-width="100px">
        <el-form-item label="选择阶段">
          <el-select v-model="selectedStageId" placeholder="请选择要转换为模板的阶段">
            <el-option
              v-for="stage in stages"
              :key="stage.id"
              :label="stage.name"
              :value="stage.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="模板名称">
          <el-input v-model="templateNameFromStage" placeholder="请输入模板名称" />
        </el-form-item>
        <el-form-item label="模板描述">
          <el-input
            v-model="templateDescFromStage"
            type="textarea"
            :rows="3"
            placeholder="请输入模板描述（可选）"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="createFromStageDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="confirmCreateFromStage">创建模板</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { 
  Files, Plus, Upload, MoreFilled, Document, Clock, View, Close 
} from '@element-plus/icons-vue';
import { getEnabledTaskTypes, getTaskTypeConfig } from '../constants/taskTypeCategories';
import { useTrainingStageStore } from '../stores/trainingStage';
import { storeToRefs } from 'pinia';
import { useRoute } from 'vue-router';

// 阶段模板接口
interface StageTemplate {
  id: string;
  name: string;
  description: string;
  type: 'pre-training' | 'training' | 'post-training';
  tags: string[];
  tasks: Array<{
    type: string;
    name: string;
    description: string;
    required: boolean;
    config: Record<string, any>;
  }>;
  estimatedDuration: number;
  usageCount: number;
  createdAt: string;
  updatedAt: string;
}

const store = useTrainingStageStore();
const { stages } = storeToRefs(store);

// 响应式数据
const searchKeyword = ref('');
const filterType = ref('');
const sortBy = ref('createdAt');

const stageTemplateDialogVisible = ref(false);
const stagePreviewDialogVisible = ref(false);
const createFromStageDialogVisible = ref(false);

const stageTemplates = ref<StageTemplate[]>([
  // 示例阶段模板数据
  {
    id: '1',
    name: '标准培训前准备阶段',
    description: '包含学员注册、资料发放、预习任务等标准流程',
    type: 'pre-training',
    tags: ['培训前', '准备工作'],
    tasks: [
      { type: 'registration', name: '学员注册', description: '完成培训班报名注册', required: true, config: {} },
      { type: 'material', name: '资料发放', description: '分发培训材料', required: true, config: {} },
      { type: 'homework', name: '预习作业', description: '完成课前预习', required: false, config: {} },
    ],
    estimatedDuration: 8,
    usageCount: 12,
    createdAt: '2024-01-20T08:00:00.000Z',
    updatedAt: '2024-01-20T08:00:00.000Z',
  },
  {
    id: '2',
    name: '线下培训标准流程',
    description: '面授培训的标准阶段模板，包含签到、授课、讨论等环节',
    type: 'training',
    tags: ['线下培训', '面授'],
    tasks: [
      { type: 'attendance', name: '签到考勤', description: '学员签到', required: true, config: {} },
      { type: 'face-to-face', name: '专题讲座', description: '专家授课', required: true, config: {} },
      { type: 'discussion', name: '分组讨论', description: '小组研讨', required: true, config: {} },
      { type: 'activity', name: '课间活动', description: '休息互动', required: false, config: {} },
    ],
    estimatedDuration: 24,
    usageCount: 8,
    createdAt: '2024-01-18T08:00:00.000Z',
    updatedAt: '2024-01-18T08:00:00.000Z',
  },
]);

const editingStageTemplate = ref<Partial<StageTemplate>>({
  name: '',
  description: '',
  type: 'training',
  tags: [],
  tasks: [],
});

const previewingStageTemplate = ref<StageTemplate | null>(null);

// 从现有阶段创建模板
const selectedStageId = ref('');
const templateNameFromStage = ref('');
const templateDescFromStage = ref('');

// 标签输入
const stageInputVisible = ref(false);
const stageInputValue = ref('');
const stageInputRef = ref();

// 表单验证
const stageTemplateFormRef = ref();
const stageTemplateFormRules = {
  name: [
    { required: true, message: '请输入阶段模板名称', trigger: 'blur' },
    { min: 2, max: 50, message: '长度在 2 到 50 个字符', trigger: 'blur' }
  ],
  type: [
    { required: true, message: '请选择阶段类型', trigger: 'change' }
  ],
};

// 计算属性
const enabledTaskTypes = computed(() => getEnabledTaskTypes());

const filteredStageTemplates = computed(() => {
  let result = [...stageTemplates.value];
  
  // 搜索过滤
  if (searchKeyword.value) {
    const keyword = searchKeyword.value.toLowerCase();
    result = result.filter(template => 
      template.name.toLowerCase().includes(keyword) ||
      template.description.toLowerCase().includes(keyword) ||
      template.tags.some(tag => tag.toLowerCase().includes(keyword))
    );
  }
  
  // 类型过滤
  if (filterType.value) {
    result = result.filter(template => template.type === filterType.value);
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
function showCreateStageTemplate() {
  editingStageTemplate.value = {
    name: '',
    description: '',
    type: 'training',
    tags: [],
    tasks: [],
  };
  stageTemplateDialogVisible.value = true;
}

function showImportStageTemplate() {
  // TODO: 实现导入功能
  ElMessage.info('导入功能开发中...');
}

function previewStageTemplate(template: StageTemplate) {
  previewingStageTemplate.value = template;
  stagePreviewDialogVisible.value = true;
}

async function applyStageTemplate(template: StageTemplate) {
  ElMessageBox.confirm(
    `确定要应用阶段模板"${template.name}"吗？这将创建一个新的阶段，包含 ${template.tasks.length} 个任务。`,
    '应用阶段模板确认',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'info',
    }
  ).then(async () => {
    try {
      // 获取当前项目ID（需要从路由中获取）
      const route = useRoute();
      const projectId = route.params.id as string;
      
    // 创建新阶段
      const newStage = await store.addStage(template.name, template.description, projectId);
      
      if (!newStage) {
        ElMessage.error('创建阶段失败');
        return;
      }
    
    // 添加模板中的任务
      for (const taskTemplate of template.tasks) {
        try {
          await store.addTaskToStage(
        newStage.id,
        taskTemplate.type,
        taskTemplate.name,
        {
          description: taskTemplate.description,
          required: taskTemplate.required,
          ...taskTemplate.config
            },
            projectId
      );
        } catch (error) {
          console.error('❌ 应用模板任务失败:', taskTemplate.name, error);
        }
      }
    
    // 更新使用次数
    const targetTemplate = stageTemplates.value.find(t => t.id === template.id);
    if (targetTemplate) {
      targetTemplate.usageCount = (targetTemplate.usageCount || 0) + 1;
      targetTemplate.updatedAt = new Date().toISOString();
    }
    
    ElMessage.success(`已应用阶段模板"${template.name}"，创建了新阶段并添加了 ${template.tasks.length} 个任务`);
    stagePreviewDialogVisible.value = false;
    } catch (error) {
      console.error('❌ 应用阶段模板失败:', error);
      ElMessage.error('应用阶段模板失败');
    }
  }).catch(() => {
    // 用户取消
  });
}

function handleStageTemplateCommand(template: StageTemplate, command: string) {
  switch (command) {
    case 'apply':
      applyStageTemplate(template);
      break;
    case 'edit':
      editStageTemplate(template);
      break;
    case 'duplicate':
      duplicateStageTemplate(template);
      break;
    case 'export':
      exportStageTemplate(template);
      break;
    case 'delete':
      deleteStageTemplate(template);
      break;
  }
}

function editStageTemplate(template: StageTemplate) {
  editingStageTemplate.value = { ...template };
  stageTemplateDialogVisible.value = true;
}

function duplicateStageTemplate(template: StageTemplate) {
  const newTemplate: StageTemplate = {
    ...template,
    id: Date.now().toString(),
    name: `${template.name} (副本)`,
    usageCount: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  stageTemplates.value.unshift(newTemplate);
  ElMessage.success('阶段模板已复制');
}

function exportStageTemplate(template: StageTemplate) {
  const dataStr = JSON.stringify(template, null, 2);
  const dataBlob = new Blob([dataStr], { type: 'application/json' });
  const url = URL.createObjectURL(dataBlob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${template.name}-stage-template.json`;
  link.click();
  URL.revokeObjectURL(url);
  ElMessage.success('阶段模板已导出');
}

function deleteStageTemplate(template: StageTemplate) {
  ElMessageBox.confirm(
    `确定要删除阶段模板"${template.name}"吗？此操作不可恢复。`,
    '删除确认',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    }
  ).then(() => {
    const index = stageTemplates.value.findIndex(t => t.id === template.id);
    if (index > -1) {
      stageTemplates.value.splice(index, 1);
      ElMessage.success('阶段模板已删除');
    }
  }).catch(() => {
    // 用户取消
  });
}

function saveStageTemplate() {
  stageTemplateFormRef.value?.validate((valid: boolean) => {
    if (valid) {
      const template = editingStageTemplate.value as StageTemplate;
      
      // 计算预计时长
      const estimatedDuration = template.tasks.reduce((total, task) => {
        const config = getTaskTypeConfig(task.type);
        return total + (config?.estimatedHours || 0);
      }, 0);
      
      if (template.id) {
        // 编辑现有模板
        const index = stageTemplates.value.findIndex(t => t.id === template.id);
        if (index > -1) {
          stageTemplates.value[index] = {
            ...template,
            estimatedDuration,
            updatedAt: new Date().toISOString(),
          };
          ElMessage.success('阶段模板已更新');
        }
      } else {
        // 创建新模板
        const newTemplate: StageTemplate = {
          ...template,
          id: Date.now().toString(),
          estimatedDuration,
          usageCount: 0,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        } as StageTemplate;
        stageTemplates.value.unshift(newTemplate);
        ElMessage.success('阶段模板已创建');
      }
      
      stageTemplateDialogVisible.value = false;
    }
  });
}

function handleStageTemplateDialogClose() {
  stageTemplateDialogVisible.value = false;
}

function addTaskToStageTemplate() {
  editingStageTemplate.value.tasks!.push({
    type: '',
    name: '',
    description: '',
    required: true,
    config: {},
  });
}

function removeTaskFromStageTemplate(index: number) {
  editingStageTemplate.value.tasks!.splice(index, 1);
}

function showStageInput() {
  stageInputVisible.value = true;
  // nextTick(() => {
  //   stageInputRef.value?.focus();
  // });
}

function handleStageInputConfirm() {
  if (stageInputValue.value && !editingStageTemplate.value.tags!.includes(stageInputValue.value)) {
    editingStageTemplate.value.tags!.push(stageInputValue.value);
  }
  stageInputVisible.value = false;
  stageInputValue.value = '';
}

function removeStageTag(tag: string) {
  const index = editingStageTemplate.value.tags!.indexOf(tag);
  if (index > -1) {
    editingStageTemplate.value.tags!.splice(index, 1);
  }
}

function confirmCreateFromStage() {
  if (!selectedStageId.value || !templateNameFromStage.value) {
    ElMessage.warning('请选择阶段并输入模板名称');
    return;
  }
  
  const stage = stages.value.find(s => s.id === selectedStageId.value);
  if (!stage) {
    ElMessage.error('选择的阶段不存在');
    return;
  }
  
  const newTemplate: StageTemplate = {
    id: Date.now().toString(),
    name: templateNameFromStage.value,
    description: templateDescFromStage.value || stage.description || '',
    type: 'training',
    tags: [],
    tasks: stage.tasks.map(task => ({
      type: task.type,
      name: task.name,
      description: task.description || '',
      required: task.required,
      config: task.config || {},
    })),
    estimatedDuration: stage.estimatedDuration || 0,
    usageCount: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  
  stageTemplates.value.unshift(newTemplate);
  ElMessage.success('阶段模板已创建');
  createFromStageDialogVisible.value = false;
  
  // 重置表单
  selectedStageId.value = '';
  templateNameFromStage.value = '';
  templateDescFromStage.value = '';
}

function getTypeColor(type: string) {
  const colors: Record<string, string> = {
    'pre-training': 'info',
    'training': 'primary',
    'post-training': 'success',
  };
  return colors[type] || 'info';
}

function getTypeName(type: string) {
  const names: Record<string, string> = {
    'pre-training': '培训前',
    'training': '培训中',
    'post-training': '培训后',
  };
  return names[type] || type;
}

function getTaskTypeLabel(type: string) {
  const config = getTaskTypeConfig(type);
  return config?.label || type;
}

function getRequiredTasksCount(template: StageTemplate) {
  return template.tasks.filter(task => task.required).length;
}

function getOptionalTasksCount(template: StageTemplate) {
  return template.tasks.filter(task => !task.required).length;
}

function formatDate(dateString: string) {
  const date = new Date(dateString);
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
}

// 暴露方法供外部调用
defineExpose({
  showCreateFromStage: () => {
    createFromStageDialogVisible.value = true;
  },
});
</script>

<style scoped>
.stage-template-manager {
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
  grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
  gap: 16px;
}

.empty-state {
  grid-column: 1 / -1;
  text-align: center;
  padding: 60px 20px;
}

.stage-template-card {
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

.stage-template-card:hover {
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

.stage-task-template-list {
  border: 1px solid #e8e8e8;
  border-radius: 6px;
  padding: 12px;
  background: #f8f9fa;
  max-height: 400px;
  overflow-y: auto;
}

.stage-task-template-item {
  margin-bottom: 12px;
  padding: 12px;
  border: 1px solid #e0e0e0;
  border-radius: 6px;
  background: #fff;
}

.stage-task-template-item:last-child {
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

.task-config {
  margin-top: 8px;
}

.stage-template-preview {
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
  margin: 0 0 12px 0;
  color: #666;
}

.preview-tasks {
  margin-bottom: 20px;
}

.preview-tasks h4 {
  margin: 0 0 12px 0;
  color: #333;
}

.preview-stats {
  display: flex;
  gap: 24px;
  justify-content: space-around;
  padding: 16px;
  background: #f8f9fa;
  border-radius: 6px;
}
</style> 