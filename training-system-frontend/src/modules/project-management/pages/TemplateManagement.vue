<template>
  <div class="template-management-page">
    <!-- 页面头部 -->
    <div class="page-header">
      <div class="header-content">
        <h1>模板管理</h1>
        <p>统一管理培训项目中的各类模板，提高培训效率</p>
      </div>
      <div class="header-actions">
        <el-button type="primary" @click="showCreateDialog = true">
          <el-icon><Plus /></el-icon>
          新建模板
        </el-button>
      </div>
    </div>

    <!-- 模板分类标签 -->
    <el-tabs v-model="activeTab" type="border-card" class="template-tabs">
      <el-tab-pane label="任务模板" name="task">
        <TaskTemplateManager />
      </el-tab-pane>
      <el-tab-pane label="阶段模板" name="stage">
        <StageTemplateManager />
      </el-tab-pane>
      <el-tab-pane label="项目模板" name="project">
        <ProjectTemplateManager />
      </el-tab-pane>
      <el-tab-pane label="消息模板" name="message">
        <MessageTemplateManager />
      </el-tab-pane>
      <el-tab-pane label="群聊模板" name="group">
        <GroupChatTemplateManager />
      </el-tab-pane>
      <el-tab-pane label="模板中心" name="center">
        <TemplateCenter />
      </el-tab-pane>
    </el-tabs>

    <!-- 新建模板对话框 -->
    <el-dialog
      v-model="showCreateDialog"
      title="新建模板"
      width="600px"
      align-center
    >
      <el-form :model="createForm" :rules="createRules" ref="createFormRef" label-width="100px">
        <el-form-item label="模板类型" prop="type">
          <el-select v-model="createForm.type" placeholder="请选择模板类型" style="width: 100%">
            <el-option label="任务模板" value="task" />
            <el-option label="阶段模板" value="stage" />
            <el-option label="项目模板" value="project" />
            <el-option label="消息模板" value="message" />
            <el-option label="群聊模板" value="group" />
          </el-select>
        </el-form-item>
        <el-form-item label="模板名称" prop="name">
          <el-input v-model="createForm.name" placeholder="请输入模板名称" />
        </el-form-item>
        <el-form-item label="模板描述" prop="description">
          <el-input
            v-model="createForm.description"
            type="textarea"
            :rows="3"
            placeholder="请输入模板描述"
          />
        </el-form-item>
        <el-form-item label="模板分类" prop="category">
          <el-select v-model="createForm.category" placeholder="请选择分类" style="width: 100%">
            <el-option label="官方模板" value="official" />
            <el-option label="自定义模板" value="custom" />
            <el-option label="团队模板" value="team" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="showCreateDialog = false">取消</el-button>
          <el-button type="primary" @click="handleCreateTemplate">确定</el-button>
        </div>
      </template>
    </el-dialog>

    <!-- 统计面板 -->
    <div class="stats-panel">
      <el-card class="stats-card">
        <el-statistic title="模板总数" :value="templateStats.total" />
      </el-card>
      <el-card class="stats-card">
        <el-statistic title="今日使用" :value="templateStats.todayUsage" />
      </el-card>
      <el-card class="stats-card">
        <el-statistic title="本月创建" :value="templateStats.monthlyCreated" />
      </el-card>
      <el-card class="stats-card">
        <el-statistic title="我的模板" :value="templateStats.myTemplates" />
      </el-card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'

// 导入模板管理组件
import TaskTemplateManager from '../components/TaskTemplateManager.vue'
import StageTemplateManager from '../components/StageTemplateManager.vue'
import TemplateCenter from '../components/TemplateCenter.vue'

// 临时组件导入（这些组件可能需要创建）
import ProjectTemplateManager from '../components/ProjectTemplateManager.vue'
import MessageTemplateManager from '../components/MessageTemplateManager.vue'
import GroupChatTemplateManager from '../components/GroupChatTemplateManager.vue'

// 页面状态
const activeTab = ref('task')
const showCreateDialog = ref(false)

// 新建模板表单
const createForm = ref({
  type: '',
  name: '',
  description: '',
  category: 'custom'
})

const createRules = {
  type: [{ required: true, message: '请选择模板类型', trigger: 'change' }],
  name: [{ required: true, message: '请输入模板名称', trigger: 'blur' }],
  description: [{ required: true, message: '请输入模板描述', trigger: 'blur' }],
  category: [{ required: true, message: '请选择分类', trigger: 'change' }]
}

const createFormRef = ref()

// 统计数据
const templateStats = ref({
  total: 0,
  todayUsage: 0,
  monthlyCreated: 0,
  myTemplates: 0
})

// 处理创建模板
const handleCreateTemplate = async () => {
  try {
    await createFormRef.value.validate()
    
    // 根据类型切换到对应的标签页
    activeTab.value = createForm.value.type
    
    // 重置表单
    createForm.value = {
      type: '',
      name: '',
      description: '',
      category: 'custom'
    }
    
    showCreateDialog.value = false
    ElMessage.success('模板创建成功')
    
    // 刷新统计数据
    loadStats()
  } catch (error) {
    console.error('创建模板失败:', error)
  }
}

// 加载统计数据
const loadStats = async () => {
  try {
    // 模拟API调用
    templateStats.value = {
      total: 125,
      todayUsage: 32,
      monthlyCreated: 15,
      myTemplates: 8
    }
  } catch (error) {
    console.error('加载统计数据失败:', error)
  }
}

// 组件挂载时加载数据
onMounted(() => {
  loadStats()
})
</script>

<style scoped>
.template-management-page {
  padding: 20px;
  background: #f5f7fa;
  min-height: 100vh;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 20px;
  padding: 20px;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.header-content h1 {
  margin: 0 0 8px 0;
  font-size: 24px;
  color: #333;
}

.header-content p {
  margin: 0;
  color: #666;
  font-size: 14px;
}

.header-actions {
  display: flex;
  gap: 12px;
}

.template-tabs {
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.stats-panel {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
  margin-top: 20px;
}

.stats-card {
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

:deep(.el-tabs__content) {
  padding: 20px;
}

:deep(.el-tabs__nav-scroll) {
  padding: 0 20px;
}
</style> 