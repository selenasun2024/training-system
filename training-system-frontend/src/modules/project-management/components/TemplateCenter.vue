<template>
  <div class="template-center">
    <!-- 模板中心头部 -->
    <div class="center-header">
      <div class="header-title">
        <el-icon><FolderOpened /></el-icon>
        <span>模板中心</span>
      </div>
      <div class="header-actions">
        <el-button-group>
          <el-button
            :type="activeTab === 'task' ? 'primary' : ''"
            size="small"
            @click="activeTab = 'task'"
          >
            <el-icon><Document /></el-icon>
            任务模板
          </el-button>
          <el-button
            :type="activeTab === 'stage' ? 'primary' : ''"
            size="small"
            @click="activeTab = 'stage'"
          >
            <el-icon><Files /></el-icon>
            阶段模板
          </el-button>
        </el-button-group>
      </div>
    </div>

    <!-- 模板统计信息 -->
    <div class="template-stats">
      <div class="stats-card">
        <div class="stats-icon task-icon">
          <el-icon><Document /></el-icon>
        </div>
        <div class="stats-content">
          <div class="stats-number">{{ taskTemplateCount }}</div>
          <div class="stats-label">任务模板</div>
        </div>
      </div>
      <div class="stats-card">
        <div class="stats-icon stage-icon">
          <el-icon><Files /></el-icon>
        </div>
        <div class="stats-content">
          <div class="stats-number">{{ stageTemplateCount }}</div>
          <div class="stats-label">阶段模板</div>
        </div>
      </div>
      <div class="stats-card">
        <div class="stats-icon usage-icon">
          <el-icon><TrendCharts /></el-icon>
        </div>
        <div class="stats-content">
          <div class="stats-number">{{ totalUsageCount }}</div>
          <div class="stats-label">总使用次数</div>
        </div>
      </div>
    </div>

    <!-- 快速操作区域 -->
    <div class="quick-actions">
      <div class="action-section">
        <h3>快速创建</h3>
        <div class="action-buttons">
          <el-button type="primary" @click="createTaskTemplate">
            <el-icon><Plus /></el-icon>
            新建任务模板
          </el-button>
          <el-button type="success" @click="createStageTemplate">
            <el-icon><Plus /></el-icon>
            新建阶段模板
          </el-button>
          <el-button type="info" @click="createFromCurrentStage">
            <el-icon><CopyDocument /></el-icon>
            从当前阶段创建
          </el-button>
        </div>
      </div>
      
      <div class="action-section">
        <h3>批量操作</h3>
        <div class="action-buttons">
          <el-button @click="batchImport">
            <el-icon><Upload /></el-icon>
            批量导入
          </el-button>
          <el-button @click="batchExport">
            <el-icon><Download /></el-icon>
            批量导出
          </el-button>
          <el-button @click="showTemplateLibrary">
            <el-icon><Connection /></el-icon>
            模板库
          </el-button>
        </div>
      </div>
    </div>

    <!-- 模板内容区域 -->
    <div class="template-content">
      <!-- 任务模板管理 -->
      <div v-show="activeTab === 'task'" class="template-tab-content">
        <TaskTemplateManager ref="taskTemplateManager" />
      </div>
      
      <!-- 阶段模板管理 -->
      <div v-show="activeTab === 'stage'" class="template-tab-content">
        <StageTemplateManager ref="stageTemplateManager" />
      </div>
    </div>

    <!-- 模板库对话框 -->
    <el-dialog
      v-model="templateLibraryVisible"
      title="模板库"
      width="900px"
      :before-close="handleTemplateLibraryClose"
    >
      <div class="template-library">
        <div class="library-header">
          <el-tabs v-model="libraryActiveTab">
            <el-tab-pane label="官方模板" name="official">
              <div class="official-templates">
                <div class="template-category" v-for="category in officialTemplates" :key="category.name">
                  <h4>{{ category.name }}</h4>
                  <div class="category-templates">
                    <div 
                      v-for="template in category.templates" 
                      :key="template.id"
                      class="library-template-card"
                      @click="previewLibraryTemplate(template)"
                    >
                      <div class="template-header">
                        <h5>{{ template.name }}</h5>
                        <el-tag size="small" :type="template.type === 'task' ? 'primary' : 'success'">
                          {{ template.type === 'task' ? '任务模板' : '阶段模板' }}
                        </el-tag>
                      </div>
                      <p class="template-desc">{{ template.description }}</p>
                      <div class="template-actions">
                        <el-button size="small" type="primary" @click.stop="downloadTemplate(template)">
                          下载使用
                        </el-button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </el-tab-pane>
            <el-tab-pane label="社区分享" name="community">
              <div class="community-templates">
                <el-empty description="社区模板功能开发中..." />
              </div>
            </el-tab-pane>
          </el-tabs>
        </div>
      </div>
    </el-dialog>

    <!-- 批量导入对话框 -->
    <el-dialog
      v-model="batchImportVisible"
      title="批量导入模板"
      width="600px"
    >
      <div class="batch-import">
        <el-alert
          title="导入说明"
          type="info"
          :closable="false"
          show-icon
        >
          <template #default>
            <p>支持同时导入多个JSON格式的模板文件，系统会自动识别任务模板和阶段模板。</p>
          </template>
        </el-alert>
        
        <el-upload
          class="upload-area"
          drag
          multiple
          :auto-upload="false"
          :on-change="handleBatchImport"
          accept=".json"
        >
          <el-icon class="el-icon--upload"><UploadFilled /></el-icon>
          <div class="el-upload__text">
            将模板文件拖拽到此处，或<em>点击上传</em>
          </div>
          <template #tip>
            <div class="el-upload__tip">
              支持多选，只能上传JSON格式的模板文件
            </div>
          </template>
        </el-upload>
      </div>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="batchImportVisible = false">取消</el-button>
          <el-button type="primary" @click="confirmBatchImport">确定导入</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { ElMessage } from 'element-plus';
import { 
  FolderOpened, Document, Files, TrendCharts, Plus, CopyDocument,
  Upload, Download, Connection, UploadFilled
} from '@element-plus/icons-vue';
import TaskTemplateManager from './TaskTemplateManager.vue';
import StageTemplateManager from './StageTemplateManager.vue';
import { useTrainingStageStore } from '../stores/trainingStage';
import { storeToRefs } from 'pinia';

const store = useTrainingStageStore();
const { activeStage } = storeToRefs(store);

// 响应式数据
const activeTab = ref<'task' | 'stage'>('task');
const templateLibraryVisible = ref(false);
const batchImportVisible = ref(false);
const libraryActiveTab = ref('official');

// 模板管理器引用
const taskTemplateManager = ref();
const stageTemplateManager = ref();

// 模拟数据
const taskTemplateCount = ref(15);
const stageTemplateCount = ref(8);
const totalUsageCount = ref(156);

// 官方模板库数据
const officialTemplates = ref([
  {
    name: '基础培训模板',
    templates: [
      {
        id: 'official-1',
        name: '新员工入职培训',
        description: '包含企业文化、规章制度、岗位技能等完整培训流程',
        type: 'stage',
        category: 'onboarding',
      },
      {
        id: 'official-2',
        name: '在线考试任务',
        description: '标准化的在线考试任务模板，支持多种题型',
        type: 'task',
        category: 'assessment',
      },
    ],
  },
  {
    name: '专业技能培训',
    templates: [
      {
        id: 'official-3',
        name: '技术技能提升',
        description: '针对技术岗位的专业技能培训阶段模板',
        type: 'stage',
        category: 'technical',
      },
      {
        id: 'official-4',
        name: '实操练习任务',
        description: '动手实践类任务模板，适用于技能训练',
        type: 'task',
        category: 'practice',
      },
    ],
  },
]);

// 计算属性
const currentStageAvailable = computed(() => {
  return activeStage.value && activeStage.value.tasks.length > 0;
});

// 方法
function createTaskTemplate() {
  taskTemplateManager.value?.showCreateTemplate();
  activeTab.value = 'task';
}

function createStageTemplate() {
  stageTemplateManager.value?.showCreateStageTemplate();
  activeTab.value = 'stage';
}

function createFromCurrentStage() {
  if (!currentStageAvailable.value) {
    ElMessage.warning('当前阶段没有任务，无法创建模板');
    return;
  }
  
  stageTemplateManager.value?.showCreateFromStage();
  activeTab.value = 'stage';
}

function batchImport() {
  batchImportVisible.value = true;
}

function batchExport() {
  ElMessage.info('批量导出功能开发中...');
}

function showTemplateLibrary() {
  templateLibraryVisible.value = true;
}

function handleTemplateLibraryClose() {
  templateLibraryVisible.value = false;
}

function previewLibraryTemplate(template: any) {
  ElMessage.info(`预览模板：${template.name}`);
}

function downloadTemplate(template: any) {
  ElMessage.success(`已下载模板：${template.name}`);
  // 这里应该实现实际的下载逻辑
}

function handleBatchImport(file: any) {
  console.log('Batch import file:', file);
}

function confirmBatchImport() {
  ElMessage.success('批量导入成功');
  batchImportVisible.value = false;
}

// 暴露给父组件的方法
defineExpose({
  showTaskTemplates: () => {
    activeTab.value = 'task';
  },
  showStageTemplates: () => {
    activeTab.value = 'stage';
  },
});
</script>

<style scoped>
.template-center {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: #f8f9fa;
}

.center-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  background: #fff;
  border-bottom: 1px solid #e8e8e8;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.04);
}

.header-title {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 20px;
  font-weight: 600;
  color: #333;
}

.template-stats {
  display: flex;
  gap: 20px;
  padding: 20px 24px;
  background: #fff;
  margin: 16px 24px;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.stats-card {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
  padding: 16px;
  background: linear-gradient(135deg, #f8f9fa 0%, #fff 100%);
  border-radius: 8px;
  border: 1px solid #e8e8e8;
  transition: all 0.3s;
}

.stats-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.stats-icon {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  color: #fff;
}

.task-icon {
  background: linear-gradient(135deg, #409eff, #66b1ff);
}

.stage-icon {
  background: linear-gradient(135deg, #67c23a, #85ce61);
}

.usage-icon {
  background: linear-gradient(135deg, #e6a23c, #ebb563);
}

.stats-content {
  display: flex;
  flex-direction: column;
}

.stats-number {
  font-size: 24px;
  font-weight: 600;
  color: #333;
  line-height: 1;
}

.stats-label {
  font-size: 14px;
  color: #666;
  margin-top: 4px;
}

.quick-actions {
  display: flex;
  gap: 24px;
  padding: 0 24px;
  margin-bottom: 16px;
}

.action-section {
  flex: 1;
  background: #fff;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.action-section h3 {
  margin: 0 0 16px 0;
  font-size: 16px;
  font-weight: 600;
  color: #333;
}

.action-buttons {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.template-content {
  flex: 1;
  margin: 0 24px 24px 24px;
  background: #fff;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.template-tab-content {
  height: 100%;
}

.template-library {
  max-height: 600px;
  overflow-y: auto;
}

.template-category {
  margin-bottom: 24px;
}

.template-category h4 {
  margin: 0 0 12px 0;
  color: #333;
  font-weight: 600;
  padding-bottom: 8px;
  border-bottom: 1px solid #e8e8e8;
}

.category-templates {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 16px;
}

.library-template-card {
  border: 1px solid #e8e8e8;
  border-radius: 6px;
  padding: 16px;
  cursor: pointer;
  transition: all 0.3s;
}

.library-template-card:hover {
  border-color: #409eff;
  box-shadow: 0 4px 12px rgba(64, 158, 255, 0.2);
}

.template-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.template-header h5 {
  margin: 0;
  font-size: 14px;
  font-weight: 600;
  color: #333;
}

.template-desc {
  margin: 0 0 12px 0;
  font-size: 12px;
  color: #666;
  line-height: 1.4;
}

.template-actions {
  display: flex;
  justify-content: flex-end;
}

.batch-import {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.upload-area {
  margin-top: 16px;
}

.community-templates {
  padding: 40px 20px;
  text-align: center;
}
</style> 