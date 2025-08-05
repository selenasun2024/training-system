<template>
  <div class="message-template-manager">
    <div class="template-header">
      <h3>消息模板管理</h3>
      <p>管理培训过程中的各种消息模板，包括通知、提醒、反馈等</p>
    </div>

    <div class="template-toolbar">
      <el-input
        v-model="searchKeyword"
        placeholder="搜索消息模板"
        style="width: 300px"
        clearable
      >
        <template #prefix>
          <el-icon><Search /></el-icon>
        </template>
      </el-input>
      <el-button type="primary" @click="createTemplate">
        <el-icon><Plus /></el-icon>
        新建消息模板
      </el-button>
    </div>

    <div class="template-categories">
      <el-radio-group v-model="selectedCategory" @change="handleCategoryChange">
        <el-radio-button label="all">全部</el-radio-button>
        <el-radio-button label="notification">通知类</el-radio-button>
        <el-radio-button label="reminder">提醒类</el-radio-button>
        <el-radio-button label="feedback">反馈类</el-radio-button>
        <el-radio-button label="greeting">问候类</el-radio-button>
      </el-radio-group>
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
            <el-tag :type="getCategoryColor(template.category)">
              {{ getCategoryLabel(template.category) }}
            </el-tag>
            <div class="template-actions">
              <el-button size="small" type="text" @click.stop="editTemplate(template)">
                编辑
              </el-button>
              <el-button size="small" type="text" @click.stop="previewTemplate(template)">
                预览
              </el-button>
              <el-button size="small" type="text" danger @click.stop="deleteTemplate(template)">
                删除
              </el-button>
            </div>
          </div>
          <div class="template-content">
            <h4>{{ template.name }}</h4>
            <p class="template-preview">{{ template.content.substring(0, 100) }}...</p>
            <div class="template-meta">
              <span class="usage-count">使用 {{ template.usageCount }} 次</span>
              <span class="update-time">{{ formatDate(template.updatedAt) }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 消息模板编辑对话框 -->
    <el-dialog
      v-model="showEditDialog"
      :title="editingTemplate ? '编辑消息模板' : '新建消息模板'"
      width="800px"
    >
      <el-form :model="templateForm" :rules="templateRules" ref="templateFormRef" label-width="100px">
        <el-form-item label="模板名称" prop="name">
          <el-input v-model="templateForm.name" placeholder="请输入模板名称" />
        </el-form-item>
        <el-form-item label="模板分类" prop="category">
          <el-select v-model="templateForm.category" placeholder="请选择模板分类">
            <el-option label="通知类" value="notification" />
            <el-option label="提醒类" value="reminder" />
            <el-option label="反馈类" value="feedback" />
            <el-option label="问候类" value="greeting" />
          </el-select>
        </el-form-item>
        <el-form-item label="模板内容" prop="content">
          <el-input
            v-model="templateForm.content"
            type="textarea"
            :rows="6"
            placeholder="请输入模板内容，支持变量如 {学员姓名}、{培训项目}等"
          />
        </el-form-item>
        <el-form-item label="可用变量">
          <div class="variable-tags">
            <el-tag
              v-for="variable in availableVariables"
              :key="variable"
              @click="insertVariable(variable)"
              style="cursor: pointer; margin-right: 8px; margin-bottom: 8px;"
            >
              {{ variable }}
            </el-tag>
          </div>
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="showEditDialog = false">取消</el-button>
          <el-button type="primary" @click="saveTemplate">保存</el-button>
        </div>
      </template>
    </el-dialog>

    <!-- 消息预览对话框 -->
    <el-dialog
      v-model="showPreviewDialog"
      title="消息预览"
      width="600px"
    >
      <div class="preview-content">
        <div class="preview-message">
          {{ previewContent }}
        </div>
      </div>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="showPreviewDialog = false">关闭</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Search, Plus } from '@element-plus/icons-vue'

// 模拟数据
const templates = ref([
  {
    id: 'mt1',
    name: '开班通知',
    category: 'notification',
    content: '亲爱的{学员姓名}，您好！\n\n您报名的{培训项目}即将开班，开班时间为{开班日期}。请您提前做好准备，按时参加培训。\n\n培训地点：{培训地点}\n培训时间：{培训时间}\n\n如有疑问，请联系我们。',
    usageCount: 25,
    updatedAt: '2024-01-15T10:30:00Z'
  },
  {
    id: 'mt2',
    name: '作业提醒',
    category: 'reminder',
    content: '尊敬的{学员姓名}，\n\n您有一个{作业名称}尚未完成，截止时间为{截止时间}。请您及时完成并提交作业。\n\n作业要求：{作业要求}\n\n感谢您的配合！',
    usageCount: 18,
    updatedAt: '2024-01-14T14:20:00Z'
  },
  {
    id: 'mt3',
    name: '培训反馈',
    category: 'feedback',
    content: '感谢{学员姓名}参加{培训项目}！\n\n您的培训表现优秀，特别是在{表现亮点}方面。希望您能将所学知识应用到实际工作中。\n\n如有任何疑问或建议，欢迎随时与我们联系。',
    usageCount: 12,
    updatedAt: '2024-01-13T16:45:00Z'
  }
])

// 可用变量
const availableVariables = [
  '{学员姓名}', '{培训项目}', '{开班日期}', '{培训地点}', '{培训时间}',
  '{作业名称}', '{截止时间}', '{作业要求}', '{表现亮点}', '{讲师姓名}',
  '{联系方式}', '{培训编号}', '{培训进度}'
]

// 搜索和筛选
const searchKeyword = ref('')
const selectedCategory = ref('all')

const filteredTemplates = computed(() => {
  let filtered = templates.value

  if (selectedCategory.value !== 'all') {
    filtered = filtered.filter(template => template.category === selectedCategory.value)
  }

  if (searchKeyword.value) {
    filtered = filtered.filter(template => 
      template.name.includes(searchKeyword.value) ||
      template.content.includes(searchKeyword.value)
    )
  }

  return filtered
})

// 编辑状态
const showEditDialog = ref(false)
const showPreviewDialog = ref(false)
const editingTemplate = ref<any>(null)
const previewContent = ref('')

const templateForm = ref({
  name: '',
  category: '',
  content: ''
})

const templateRules = {
  name: [{ required: true, message: '请输入模板名称', trigger: 'blur' }],
  category: [{ required: true, message: '请选择模板分类', trigger: 'change' }],
  content: [{ required: true, message: '请输入模板内容', trigger: 'blur' }]
}

const templateFormRef = ref()

// 工具方法
const getCategoryColor = (category: string) => {
  const colors = {
    notification: 'primary',
    reminder: 'warning',
    feedback: 'success',
    greeting: 'info'
  }
  return colors[category] || 'info'
}

const getCategoryLabel = (category: string) => {
  const labels = {
    notification: '通知类',
    reminder: '提醒类',
    feedback: '反馈类',
    greeting: '问候类'
  }
  return labels[category] || category
}

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('zh-CN')
}

// 操作方法
const createTemplate = () => {
  editingTemplate.value = null
  templateForm.value = {
    name: '',
    category: '',
    content: ''
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
    category: template.category,
    content: template.content
  }
  showEditDialog.value = true
}

const previewTemplate = (template: any) => {
  previewContent.value = template.content
  showPreviewDialog.value = true
}

const deleteTemplate = (template: any) => {
  ElMessageBox.confirm('确定要删除这个消息模板吗？', '删除确认', {
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

const insertVariable = (variable: string) => {
  const textarea = document.querySelector('textarea[placeholder*="模板内容"]') as HTMLTextAreaElement
  if (textarea) {
    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const text = templateForm.value.content
    templateForm.value.content = text.substring(0, start) + variable + text.substring(end)
    
    // 设置光标位置
    setTimeout(() => {
      textarea.focus()
      textarea.setSelectionRange(start + variable.length, start + variable.length)
    }, 0)
  }
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
        id: 'mt' + (templates.value.length + 1),
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

const handleCategoryChange = (category: string) => {
  selectedCategory.value = category
}
</script>

<style scoped>
.message-template-manager {
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
  margin-bottom: 16px;
}

.template-categories {
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

.template-actions {
  display: flex;
  gap: 8px;
}

.template-content h4 {
  margin: 0 0 8px 0;
  font-size: 16px;
  color: #333;
}

.template-preview {
  margin: 0 0 12px 0;
  color: #666;
  font-size: 14px;
  line-height: 1.4;
}

.template-meta {
  display: flex;
  gap: 12px;
  font-size: 12px;
  color: #999;
}

.variable-tags {
  display: flex;
  flex-wrap: wrap;
}

.preview-content {
  padding: 16px;
  background: #f8f9fa;
  border-radius: 6px;
}

.preview-message {
  white-space: pre-wrap;
  line-height: 1.6;
  color: #333;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}
</style> 