<template>
  <div class="task-type-selector">
    <!-- 任务类型选择头部 -->
    <div class="selector-header">
      <div class="header-title">
        <el-icon><Plus /></el-icon>
        <span>添加任务</span>
      </div>
      <div class="header-actions">
        <el-button
          v-if="hasSelectedTasks"
          type="primary"
          size="small"
          @click="batchCreateTasks"
        >
          批量创建 ({{ selectedTasks.length }})
        </el-button>
      </div>
    </div>

    <!-- 任务类型选择器 -->
    <div class="types-container compact-mode">
      <el-checkbox-group v-model="selectedTasks">
        <div
          v-for="category in enabledCategories"
          :key="category.key"
          class="task-category"
        >
          <div class="category-header">
            <div class="category-title">
              <el-icon v-if="category.icon"><component :is="category.icon" /></el-icon>
              <span>{{ category.title }}</span>
            </div>
            <el-tooltip
              v-if="category.description"
              :content="category.description"
              placement="top"
            >
              <el-icon class="category-help"><InfoFilled /></el-icon>
            </el-tooltip>
          </div>
          
          <!-- 任务类型图标网格 -->
          <div class="category-types-grid" style="display: flex !important; flex-direction: row !important; flex-wrap: wrap !important; gap: 8px; padding: 6px 0; justify-content: flex-start; align-items: flex-start;">
            <div
              v-for="type in getTypesByCategory(category.key)"
              :key="type.type"
              class="task-type-icon-item"
              :class="{ 'is-selected': isTypeSelected(type.type) }"
              @click="onTypeClick(type)"
              style="display: flex !important; flex-direction: column !important; align-items: center !important; justify-content: center !important; text-align: center !important;"
            >
              <!-- 任务类型图标 -->
              <div class="task-type-icon-wrapper" :class="`task-type-${type.type}`">
                <el-icon class="task-type-icon" :size="20">
                  <component :is="getIconComponent(type.icon)" />
                </el-icon>
                <!-- 批量选择复选框 -->
                <el-checkbox
                  v-if="type.supportsBatch"
                  :value="type.type"
                  class="type-selection-checkbox"
                  @click.stop
                />
              </div>
              
              <!-- 任务类型标签 -->
              <div class="task-type-label" style="font-size: 12px !important; text-align: center !important; margin-top: 4px !important; width: 100% !important; display: block !important; margin-left: 0 !important; margin-right: 0 !important; padding: 0 !important;">
                {{ type.label }}
              </div>
            </div>
          </div>
        </div>
      </el-checkbox-group>
    </div>

    <!-- 快速创建模式 -->
    <div v-if="quickCreateMode" class="quick-create-panel">
      <div class="quick-create-header">
        <span>快速创建：{{ currentType?.label }}</span>
        <el-button type="text" @click="quickCreateMode = false">
          <el-icon><Close /></el-icon>
        </el-button>
      </div>
      <el-form ref="quickFormRef" :model="quickForm" label-width="80px" size="small">
        <el-form-item label="任务名称" prop="name" required>
          <el-input v-model="quickForm.name" placeholder="请输入任务名称" />
        </el-form-item>
        <el-form-item label="截止时间" prop="deadline">
          <el-date-picker
            v-model="quickForm.deadline"
            type="datetime"
            placeholder="选择截止时间"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="quickCreateTask">快速创建</el-button>
          <el-button @click="openDetailForm">详细设置</el-button>
        </el-form-item>
      </el-form>
    </div>

    <!-- 面授任务表单对话框 -->
    <FaceToFaceForm v-model:visible="faceToFaceDialogVisible" @save="handleFaceToFaceSave" />

    <!-- 作业任务表单对话框 -->
    <HomeworkForm v-model:visible="homeworkDialogVisible" @save="handleHomeworkSave" />

    <!-- 考试任务表单对话框 -->
    <ExamForm v-if="examDialogVisible" v-model:visible="examDialogVisible" :exam-id="currentExamId" />



    <!-- 课程选择对话框 -->
    <OnlineCourseSelector v-if="courseSelectorVisible" v-model:visible="courseSelectorVisible" @add="handleAddCourses" />

    <!-- 讨论任务表单对话框 -->
    <DiscussionForm v-if="discussionDialogVisible" v-model:visible="discussionDialogVisible" @save="handleDiscussionSave" />

    <!-- 活动任务表单对话框 -->
    <ActivityForm v-if="activityDialogVisible" v-model:visible="activityDialogVisible" @save="handleActivitySave" />

    <!-- 问卷任务表单对话框 -->
    <QuestionnaireForm v-if="questionnaireDialogVisible" v-model:visible="questionnaireDialogVisible" @save="handleQuestionnaireSave" />

    <!-- 合作任务表单对话框 -->


    <!-- 开会按钮已移除 -->
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';

// Props定义
const props = defineProps<{
  filterTypes?: string[]; // 过滤特定的任务类型
  cooperationMode?: boolean; // 协同模式，只显示协同相关任务
}>();
import { useTrainingStageStore } from '../stores/trainingStage';
import { storeToRefs } from 'pinia';
import { useRoute } from 'vue-router';
import { 
  TASK_TYPE_CATEGORIES, 
  TASK_TYPE_CONFIGS, 
  getEnabledCategories, 
  getTaskTypesByCategory, 
  getTaskTypeConfig,
  type TaskTypeConfig
} from '../constants/taskTypeCategories';

// 组件导入
import FaceToFaceForm from '@/modules/project-management/execution/components/FaceToFaceForm.vue';
import HomeworkForm from '@/modules/project-management/execution/components/HomeworkForm.vue';
import ExamForm from '@/modules/project-management/components/ExamForm.vue';

import OnlineCourseSelector from '@/modules/project-management/execution/components/OnlineCourseSelector.vue';
import DiscussionForm from '@/modules/project-management/components/DiscussionForm.vue';
import ActivityForm from '@/modules/project-management/components/ActivityForm.vue';
import QuestionnaireForm from '@/modules/project-management/components/QuestionnaireForm.vue';


// 图标导入
import { 
  Plus, Close, InfoFilled, 
  User, Edit, Reading, OfficeBuilding, EditPen, Timer, 
  ChatLineRound, Medal, View, Monitor, Tools
} from '@element-plus/icons-vue';

import { useExamStore } from '../stores/exam';

import { ElMessage } from 'element-plus';
import { createTaskSimple } from '@/api/modules/task';
import type { CreateTaskRequest } from '@/api/modules/task';

const store = useTrainingStageStore();
const { addTaskToActiveStage } = store;
const route = useRoute();

// 获取当前项目ID
const currentProjectId = computed(() => {
  const projectId = route.params.id as string;
  return projectId && projectId !== 'new' ? projectId : null;
});

// 视图状态
const quickCreateMode = ref(false);
const currentType = ref<TaskTypeConfig | null>(null);

// 批量选择
const selectedTasks = ref<string[]>([]);
const hasSelectedTasks = computed(() => selectedTasks.value.length > 0);

// 快速创建表单
const quickForm = ref({
  name: '',
  deadline: null as Date | null,
});

// 对话框状态
const faceToFaceDialogVisible = ref(false);
const homeworkDialogVisible = ref(false);
const examDialogVisible = ref(false);

const courseSelectorVisible = ref(false);
const discussionDialogVisible = ref(false);
const activityDialogVisible = ref(false);
const questionnaireDialogVisible = ref(false);

const currentExamId = ref('');


// 启用的分组
const enabledCategories = computed(() => getEnabledCategories());

// 图标映射
const iconMap = {
  User, Edit, Reading, OfficeBuilding, EditPen, Timer,
  ChatLineRound, Medal, View, Monitor, Tools
};

function getIconComponent(iconName: string) {
  return iconMap[iconName as keyof typeof iconMap];
}

function getTypesByCategory(categoryKey: string) {
  let types = getTaskTypesByCategory(categoryKey);
  
  // 如果设置了filterTypes，只显示指定的任务类型
  if (props.filterTypes && props.filterTypes.length > 0) {
    types = types.filter(type => props.filterTypes!.includes(type.type));
  }
  
  // 如果是协同模式，只显示协同相关的任务类型
  if (props.cooperationMode) {
    types = types.filter(type => 
      type.type === 'cooperation' || 
      type.tags?.includes('协同') ||
      type.category === 'collaboration'
    );
  }
  
  return types;
}

function isTypeSelected(type: string) {
  return selectedTasks.value.includes(type);
}

function onTypeClick(type: TaskTypeConfig) {
  currentType.value = type;
  
  // 原有的创建逻辑
  if (type.type === 'activity') {
    activityDialogVisible.value = true;
  } else if (type.type === 'face-to-face') {
    faceToFaceDialogVisible.value = true;
  } else if (type.type === 'homework') {
    homeworkDialogVisible.value = true;
  } else if (type.type === 'exam') {
    const ex = addExamTask();
    currentExamId.value = ex.id;
    examDialogVisible.value = true;
  } else if (type.type === 'attendance') {
    // 直接创建考勤任务，无需打开对话框
    addTaskToActiveStage('attendance', '考勤任务', {}, currentProjectId.value);
    ElMessage.success('考勤任务创建成功');
  } else if (type.type === 'online-course') {
    courseSelectorVisible.value = true;
  } else if (type.type === 'discussion') {
    discussionDialogVisible.value = true;
  } else if (type.type === 'questionnaire') {
    questionnaireDialogVisible.value = true;

  } else {
    addTaskToActiveStage(type.type, `${type.label}任务`, {}, currentProjectId.value);
  }
}

function quickCreateTask() {
  if (!currentType.value || !quickForm.value.name) {
    ElMessage.warning('请填写任务名称');
    return;
  }
  
  const config = quickForm.value.deadline ? { deadline: quickForm.value.deadline } : {};
  addTaskToActiveStage(currentType.value.type, quickForm.value.name, config, currentProjectId.value);
  
  ElMessage.success('任务创建成功');
  quickCreateMode.value = false;
  quickForm.value.name = '';
  quickForm.value.deadline = null;
}

function openDetailForm() {
  quickCreateMode.value = false;
  if (currentType.value) {
    // 触发详细表单
    onTypeClick(currentType.value);
  }
}

function batchCreateTasks() {
  const tasks = selectedTasks.value.map(type => {
    const config = getTaskTypeConfig(type);
    return {
      type,
      name: `${config?.label || type}任务`,
      config: {}
    };
  });
  
  tasks.forEach(task => {
    addTaskToActiveStage(task.type, task.name, task.config, currentProjectId.value);
  });
  
  ElMessage.success(`批量创建了 ${tasks.length} 个任务`);
  selectedTasks.value = [];
}

// 原有的保存处理函数保持不变
function handleFaceToFaceSave(data: any) {
  addTaskToActiveStage('face-to-face', data.courseName, data, currentProjectId.value);
}

function handleHomeworkSave(data: { title: string; description: string; attachments: any[]; onsiteDisplay: boolean; totalScore?: number }) {
  addTaskToActiveStage('homework', data.title, {
    description: data.description,
    attachments: data.attachments,
    onsiteDisplay: data.onsiteDisplay,
    totalScore: data.totalScore,
  }, currentProjectId.value);
}

function handleAddCourses(courses: any[]) {
  if (!courses || courses.length === 0) return;
  const first = courses[0];
  addTaskToActiveStage('online-course', first.name, {
    courses,
    lecturer: first.lecturer,
    date: first.shareDate,
  }, currentProjectId.value);
}

function handleDiscussionSave(data: any) {
  addTaskToActiveStage('discussion', data.title, data, currentProjectId.value);
}

function handleActivitySave(data: any) {
  addTaskToActiveStage('activity', data.title, data, currentProjectId.value);
}

function handleQuestionnaireSave(data: any) {
  addTaskToActiveStage('questionnaire', data.title, data, currentProjectId.value);
}



// 考试和考勤相关
const examStore = useExamStore();


function addExamTask() {
  const exam = examStore.createExam('');
  addTaskToActiveStage('exam', exam.title, { examId: exam.id }, currentProjectId.value);
  return exam;
}


</script>

<style scoped>
.task-type-selector {
  padding: 12px;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

/* 调试用：添加边框来查看布局 */
/* .types-container.compact-mode { border: 2px solid red; }
.types-container.compact-mode .el-checkbox-group { border: 2px solid blue; }
.types-container.compact-mode .task-category { border: 1px solid green; }
.category-types-grid { border: 1px solid orange; } */

.selector-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  padding-bottom: 8px;
  border-bottom: 1px solid #eee;
}

.header-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  font-weight: 600;
  color: #333;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.types-container {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 16px;
}

.types-container.compact-mode {
  display: flex !important;
  flex-direction: row !important;
  gap: 16px;
  max-width: 100%;
  min-height: auto;
  justify-content: flex-start;
  align-items: flex-start;
  flex-wrap: nowrap;
}

.types-container.compact-mode .el-checkbox-group {
  display: grid !important;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
  width: 100%;
  /* 覆盖Element Plus默认样式 */
  flex-direction: unset !important;
}

/* 备选方案：如果grid不工作，使用flexbox */
.types-container.compact-mode .el-checkbox-group {
  display: flex !important;
  flex-direction: row !important;
  justify-content: space-between;
  align-items: flex-start;
  width: 100%;
  gap: 12px;
}

.types-container.compact-mode .task-category {
  flex: 1;
  min-width: 0; /* 允许收缩 */
}

/* 如果支持grid，则优先使用grid */
@supports (display: grid) {
  .types-container.compact-mode .el-checkbox-group {
    display: grid !important;
    grid-template-columns: repeat(3, 1fr);
    flex-direction: unset !important;
  }
  
  .types-container.compact-mode .task-category {
    flex: unset;
  }
}

/* 删除所有复杂的响应式设置，专注桌面体验 */

.task-category {
  border: none;
  border-radius: 6px;
  padding: 4px;
  background: transparent;
  min-height: auto;
}

.compact-mode .task-category {
  padding: 4px;
  border: none;
  border-radius: 8px;
  background: transparent;
  min-height: auto;
  /* 调整为更紧凑的布局 */
  flex: 0 1 auto;
  min-width: 180px;
  max-width: 300px;
}

.category-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 4px;
}

.compact-mode .category-header {
  margin-bottom: 4px;
}

.category-title {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  font-weight: 600;
  color: #333;
}

.category-help {
  color: #999;
  cursor: help;
}

/* 图标网格视图样式 - 桌面横向布局 */
.category-types-grid {
  display: flex !important;
  flex-direction: row !important;
  flex-wrap: wrap !important;
  gap: 6px;
  padding: 4px 0;
  justify-content: flex-start;
  align-items: flex-start;
}

/* 更强的选择器确保按钮横向排列 */
.task-category .category-types-grid {
  display: flex !important;
  flex-direction: row !important;
  flex-wrap: wrap !important;
}

.compact-mode .task-category .category-types-grid {
  display: flex !important;
  flex-direction: row !important;
  flex-wrap: wrap !important;
}

.types-container .task-category .category-types-grid {
  display: flex !important;
  flex-direction: row !important;
  flex-wrap: wrap !important;
}

/* 终极解决方案：覆盖所有可能的样式冲突 */
div.category-types-grid,
.category-types-grid div,
.task-category > .category-types-grid,
.el-checkbox-group .category-types-grid,
.types-container .category-types-grid,
.task-type-selector .category-types-grid {
  display: flex !important;
  flex-direction: row !important;
  flex-wrap: wrap !important;
  flex-flow: row wrap !important;
  /* 覆盖任何可能的grid设置 */
  grid-template-columns: unset !important;
  grid-auto-flow: unset !important;
}

/* 超级强力覆盖：使用CSS优先级 */
.task-type-selector .types-container.compact-mode .el-checkbox-group .task-category .category-types-grid {
  display: flex !important;
  flex-direction: row !important;
  flex-wrap: wrap !important;
  justify-content: flex-start !important;
  align-items: flex-start !important;
}

/* 使用属性选择器进一步确保 */
div[class*="category-types-grid"] {
  display: flex !important;
  flex-direction: row !important;
  flex-wrap: wrap !important;
}

.task-type-icon-item {
  position: relative;
  display: flex !important;
  flex-direction: column !important;
  align-items: center !important;
  padding: 8px 6px;
  border-radius: 8px;
  background: #fff;
  border: 2px solid transparent;
  cursor: pointer;
  transition: all 0.3s ease;
  min-height: 70px;
  width: 70px;
  justify-content: center !important;
  flex-shrink: 0;
  /* 确保内部元素按列排列：图标在上，文字在下 */
}

.task-type-icon-item:hover {
  border-color: #409eff;
  box-shadow: 0 4px 12px rgba(64, 158, 255, 0.15);
  transform: translateY(-2px);
}

.task-type-icon-item.is-selected {
  border-color: #409eff;
  background: #f0f9ff;
  box-shadow: 0 2px 8px rgba(64, 158, 255, 0.2);
}

.task-type-icon-wrapper {
  position: relative;
  width: 36px;
  height: 36px;
  border-radius: 8px;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  margin-bottom: 4px;
  margin-left: auto !important;
  margin-right: auto !important;
  transition: all 0.3s ease;
}

/* 任务类型颜色样式 */
.task-type-icon-wrapper.task-type-online-course { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); }
.task-type-icon-wrapper.task-type-homework { background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); }
.task-type-icon-wrapper.task-type-exam { background: linear-gradient(135deg, #ffeaa7 0%, #fab1a0 100%); }
.task-type-icon-wrapper.task-type-face-to-face { background: linear-gradient(135deg, #74b9ff 0%, #0984e3 100%); }
.task-type-icon-wrapper.task-type-activity { background: linear-gradient(135deg, #fd79a8 0%, #e84393 100%); }
.task-type-icon-wrapper.task-type-discussion { background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%); }
.task-type-icon-wrapper.task-type-attendance { background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%); }
.task-type-icon-wrapper.task-type-questionnaire { background: linear-gradient(135deg, #fa709a 0%, #fee140 100%); }


.task-type-icon {
  color: white;
  filter: drop-shadow(0 1px 2px rgba(0,0,0,0.1));
}

.task-type-label {
  font-size: 12px !important;
  font-weight: 500;
  color: #333;
  text-align: center !important;
  line-height: 1.2;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  margin-top: 4px !important;
}



.type-selection-checkbox {
  position: absolute;
  top: -2px;
  right: -2px;
  z-index: 10;
}

.type-selection-checkbox :deep(.el-checkbox__input) {
  transform: scale(0.8);
}

/* 已移除详情列表视图的相关样式，只保留图标网格视图 */

.quick-create-panel {
  margin-top: 16px;
  padding: 16px;
  background: #f8f9fa;
  border-radius: 8px;
  border: 1px solid #e8e8e8;
}

.quick-create-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  font-weight: 600;
  color: #333;
}
</style> 