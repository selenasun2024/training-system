<template>
  <div class="group-chat-template-manager">
    <div class="template-header">
      <h3>群聊模板管理</h3>
      <p>管理培训群聊的各种模板设置，包括群公告、群规则、欢迎词等</p>
    </div>

    <div class="template-toolbar">
      <el-input
        v-model="searchKeyword"
        placeholder="搜索群聊模板"
        style="width: 300px"
        clearable
      >
        <template #prefix>
          <el-icon><Search /></el-icon>
        </template>
      </el-input>
      <el-button type="primary" @click="createTemplate">
        <el-icon><Plus /></el-icon>
        新建群聊模板
      </el-button>
    </div>

    <div class="template-list">
      <div class="template-grid">
        <div
          v-for="template in filteredTemplates"
          :key="template.id"
          class="template-card"
          @click="selectTemplate(template)"
        >
          <div class="template-header-card">
            <div class="template-icon">
              <el-icon><ChatDotRound /></el-icon>
            </div>
            <div class="template-actions">
              <el-button size="small" type="text" @click.stop="editTemplate(template)">
                编辑
              </el-button>
              <el-button size="small" type="text" @click.stop="duplicateTemplate(template)">
                复制
              </el-button>
              <el-button size="small" type="text" danger @click.stop="deleteTemplate(template)">
                删除
              </el-button>
            </div>
          </div>
          <div class="template-content">
            <h4>{{ template.name }}</h4>
            <p class="template-description">{{ template.description }}</p>
            <div class="template-features">
              <el-tag v-if="template.settings.announcement" size="small" type="info">
                群公告
              </el-tag>
              <el-tag v-if="template.settings.rules" size="small" type="success">
                群规则
              </el-tag>
              <el-tag v-if="template.settings.welcome" size="small" type="warning">
                欢迎词
              </el-tag>
            </div>
            <div class="template-meta">
              <span class="usage-count">使用 {{ template.usageCount }} 次</span>
              <span class="update-time">{{ formatDate(template.updatedAt) }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 群聊模板编辑对话框 -->
    <el-dialog
      v-model="showEditDialog"
      :title="editingTemplate ? '编辑群聊模板' : '新建群聊模板'"
      width="900px"
      top="5vh"
    >
      <el-form :model="templateForm" :rules="templateRules" ref="templateFormRef" label-width="100px">
        <el-form-item label="模板名称" prop="name">
          <el-input v-model="templateForm.name" placeholder="请输入模板名称" />
        </el-form-item>
        <el-form-item label="模板描述" prop="description">
          <el-input v-model="templateForm.description" placeholder="请输入模板描述" />
        </el-form-item>
        
        <el-divider>群设置</el-divider>
        
        <el-form-item label="群公告">
          <el-switch v-model="templateForm.settings.announcement" />
          <el-input
            v-if="templateForm.settings.announcement"
            v-model="templateForm.settings.announcementText"
            type="textarea"
            :rows="3"
            placeholder="请输入群公告内容"
            style="margin-top: 8px;"
          />
        </el-form-item>
        
        <el-form-item label="群规则">
          <el-switch v-model="templateForm.settings.rules" />
          <el-input
            v-if="templateForm.settings.rules"
            v-model="templateForm.settings.rulesText"
            type="textarea"
            :rows="4"
            placeholder="请输入群规则内容"
            style="margin-top: 8px;"
          />
        </el-form-item>
        
        <el-form-item label="欢迎词">
          <el-switch v-model="templateForm.settings.welcome" />
          <el-input
            v-if="templateForm.settings.welcome"
            v-model="templateForm.settings.welcomeText"
            type="textarea"
            :rows="2"
            placeholder="请输入新成员加入时的欢迎词"
            style="margin-top: 8px;"
          />
        </el-form-item>
        
        <el-divider>群管理设置</el-divider>
        
        <el-form-item label="群成员数量">
          <el-input-number
            v-model="templateForm.settings.maxMembers"
            :min="10"
            :max="500"
            placeholder="最大成员数"
          />
        </el-form-item>
        
        <el-form-item label="群权限">
          <el-checkbox-group v-model="templateForm.settings.permissions">
            <el-checkbox label="allowInvite">允许成员邀请</el-checkbox>
            <el-checkbox label="allowShare">允许分享群聊</el-checkbox>
            <el-checkbox label="allowFileUpload">允许文件上传</el-checkbox>
            <el-checkbox label="allowAtAll">允许@所有人</el-checkbox>
          </el-checkbox-group>
        </el-form-item>
        
        <el-form-item label="消息审核">
          <el-switch v-model="templateForm.settings.messageReview" />
          <span style="margin-left: 8px; color: #666; font-size: 12px;">
            开启后，新成员的消息需要管理员审核
          </span>
        </el-form-item>
      </el-form>
      
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="showEditDialog = false">取消</el-button>
          <el-button type="primary" @click="saveTemplate">保存</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Search, Plus, ChatDotRound } from '@element-plus/icons-vue'

// 模拟数据
const templates = ref([
  {
    id: 'gt1',
    name: '标准培训群模板',
    description: '适用于一般培训项目的群聊设置',
    settings: {
      announcement: true,
      announcementText: '欢迎大家加入本次培训群！请大家积极参与讨论，共同进步。',
      rules: true,
      rulesText: '1. 请保持友好交流\n2. 禁止发布无关内容\n3. 遵守培训纪律\n4. 积极参与讨论',
      welcome: true,
      welcomeText: '欢迎 {新成员} 加入我们的培训群！',
      maxMembers: 200,
      permissions: ['allowInvite', 'allowFileUpload'],
      messageReview: false
    },
    usageCount: 32,
    updatedAt: '2024-01-15T10:30:00Z'
  },
  {
    id: 'gt2',
    name: '高级培训群模板',
    description: '适用于重要培训项目的严格群聊设置',
    settings: {
      announcement: true,
      announcementText: '本群为高级培训专用群，请严格遵守群规则。',
      rules: true,
      rulesText: '1. 仅限培训相关讨论\n2. 所有文件需管理员审核\n3. 禁止私聊打扰\n4. 按时完成作业',
      welcome: true,
      welcomeText: '欢迎 {新成员} 加入高级培训群！',
      maxMembers: 50,
      permissions: ['allowFileUpload'],
      messageReview: true
    },
    usageCount: 15,
    updatedAt: '2024-01-14T14:20:00Z'
  },
  {
    id: 'gt3',
    name: '轻松培训群模板',
    description: '适用于轻松氛围的培训群聊设置',
    settings: {
      announcement: true,
      announcementText: '大家好！让我们在轻松愉快的氛围中学习成长！',
      rules: false,
      rulesText: '',
      welcome: true,
      welcomeText: '欢迎 {新成员} 加入我们的大家庭！🎉',
      maxMembers: 300,
      permissions: ['allowInvite', 'allowShare', 'allowFileUpload', 'allowAtAll'],
      messageReview: false
    },
    usageCount: 28,
    updatedAt: '2024-01-13T16:45:00Z'
  }
])

// 搜索和筛选
const searchKeyword = ref('')
const filteredTemplates = computed(() => {
  if (!searchKeyword.value) return templates.value
  return templates.value.filter(template => 
    template.name.includes(searchKeyword.value) ||
    template.description.includes(searchKeyword.value)
  )
})

// 编辑状态
const showEditDialog = ref(false)
const editingTemplate = ref<any>(null)

const templateForm = ref({
  name: '',
  description: '',
  settings: {
    announcement: false,
    announcementText: '',
    rules: false,
    rulesText: '',
    welcome: false,
    welcomeText: '',
    maxMembers: 200,
    permissions: [],
    messageReview: false
  }
})

const templateRules = {
  name: [{ required: true, message: '请输入模板名称', trigger: 'blur' }],
  description: [{ required: true, message: '请输入模板描述', trigger: 'blur' }]
}

const templateFormRef = ref()

// 工具方法
const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('zh-CN')
}

// 操作方法
const createTemplate = () => {
  editingTemplate.value = null
  templateForm.value = {
    name: '',
    description: '',
    settings: {
      announcement: false,
      announcementText: '',
      rules: false,
      rulesText: '',
      welcome: false,
      welcomeText: '',
      maxMembers: 200,
      permissions: [],
      messageReview: false
    }
  }
  showEditDialog.value = true
}

const selectTemplate = (template: any) => {
  ElMessage.info(`选择了模板: ${template.name}`)
}

const editTemplate = (template: any) => {
  editingTemplate.value = template
  templateForm.value = {
    name: template.name,
    description: template.description,
    settings: { ...template.settings }
  }
  showEditDialog.value = true
}

const duplicateTemplate = (template: any) => {
  const newTemplate = {
    ...template,
    id: 'gt' + (templates.value.length + 1),
    name: template.name + ' (副本)',
    usageCount: 0,
    updatedAt: new Date().toISOString()
  }
  templates.value.push(newTemplate)
  ElMessage.success('模板复制成功')
}

const deleteTemplate = (template: any) => {
  ElMessageBox.confirm('确定要删除这个群聊模板吗？', '删除确认', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    const index = templates.value.findIndex(t => t.id === template.id)
    if (index > -1) {
      templates.value.splice(index, 1)
      ElMessage.success('模板删除成功')
    }
  })
}

const saveTemplate = async () => {
  try {
    await templateFormRef.value.validate()
    
    if (editingTemplate.value) {
      // 更新模板
      const index = templates.value.findIndex(t => t.id === editingTemplate.value.id)
      if (index > -1) {
        templates.value[index] = {
          ...templates.value[index],
          ...templateForm.value,
          updatedAt: new Date().toISOString()
        }
      }
      ElMessage.success('模板更新成功')
    } else {
      // 创建新模板
      const newTemplate = {
        id: 'gt' + (templates.value.length + 1),
        ...templateForm.value,
        usageCount: 0,
        updatedAt: new Date().toISOString()
      }
      templates.value.push(newTemplate)
      ElMessage.success('模板创建成功')
    }
    
    showEditDialog.value = false
  } catch (error) {
    console.error('保存模板失败:', error)
  }
}
</script>

<style scoped>
.group-chat-template-manager {
  padding: 20px;
}

.template-header {
  margin-bottom: 20px;
}

.template-header h3 {
  margin: 0 0 8px 0;
  font-size: 18px;
  color: #333;
}

.template-header p {
  margin: 0;
  color: #666;
  font-size: 14px;
}

.template-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.template-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 16px;
}

.template-card {
  border: 1px solid #e8e8e8;
  border-radius: 8px;
  padding: 16px;
  background: #fff;
  cursor: pointer;
  transition: all 0.3s;
}

.template-card:hover {
  border-color: #409eff;
  box-shadow: 0 4px 12px rgba(64, 158, 255, 0.2);
}

.template-header-card {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.template-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  background: #f0f9ff;
  border-radius: 50%;
  color: #409eff;
  font-size: 20px;
}

.template-actions {
  display: flex;
  gap: 8px;
}

.template-content h4 {
  margin: 0 0 8px 0;
  font-size: 16px;
  color: #333;
}

.template-description {
  margin: 0 0 12px 0;
  color: #666;
  font-size: 14px;
  line-height: 1.4;
}

.template-features {
  margin-bottom: 12px;
}

.template-features .el-tag {
  margin-right: 8px;
  margin-bottom: 4px;
}

.template-meta {
  display: flex;
  gap: 12px;
  font-size: 12px;
  color: #999;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

:deep(.el-checkbox-group) {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

:deep(.el-divider) {
  margin: 16px 0;
}
</style> 