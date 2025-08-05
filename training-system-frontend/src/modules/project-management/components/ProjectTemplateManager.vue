<template>
  <div class="project-template-manager">
    <div class="template-header">
      <h3>项目模板管理</h3>
      <p>管理完整的培训项目模板，包含多个培训阶段和任务配置</p>
    </div>

    <div class="template-toolbar">
      <el-input
        v-model="searchKeyword"
        placeholder="搜索项目模板"
        style="width: 300px"
        clearable
      >
        <template #prefix>
          <el-icon><Search /></el-icon>
        </template>
      </el-input>
      <el-button type="primary" @click="createTemplate">
        <el-icon><Plus /></el-icon>
        新建项目模板
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
          <div class="template-icon">
            <el-icon><Folder /></el-icon>
          </div>
          <div class="template-content">
            <h4>{{ template.name }}</h4>
            <p>{{ template.description }}</p>
            <div class="template-meta">
              <span class="stages-count">{{ template.stageCount }}个阶段</span>
              <span class="usage-count">使用 {{ template.usageCount }} 次</span>
            </div>
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
      </div>
    </div>

    <!-- 项目模板编辑对话框 -->
    <el-dialog
      v-model="showEditDialog"
      :title="editingTemplate ? '编辑项目模板' : '新建项目模板'"
      width="800px"
    >
      <el-form :model="templateForm" :rules="templateRules" ref="templateFormRef" label-width="100px">
        <el-form-item label="模板名称" prop="name">
          <el-input v-model="templateForm.name" placeholder="请输入模板名称" />
        </el-form-item>
        <el-form-item label="模板描述" prop="description">
          <el-input
            v-model="templateForm.description"
            type="textarea"
            :rows="3"
            placeholder="请输入模板描述"
          />
        </el-form-item>
        <el-form-item label="适用场景" prop="category">
          <el-select v-model="templateForm.category" placeholder="请选择适用场景">
            <el-option label="新员工培训" value="newEmployee" />
            <el-option label="技能提升" value="skillUpgrade" />
            <el-option label="管理培训" value="management" />
            <el-option label="专业培训" value="professional" />
            <el-option label="其他" value="other" />
          </el-select>
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
import { Search, Plus, Folder } from '@element-plus/icons-vue'

// 模拟数据
const templates = ref([
  {
    id: 'pt1',
    name: '新员工入职培训项目',
    description: '包含企业文化、基础技能、岗位培训等完整流程',
    stageCount: 4,
    usageCount: 15,
    category: 'newEmployee'
  },
  {
    id: 'pt2',
    name: '技术技能提升培训',
    description: '专业技能培训项目模板，包含理论学习、实践操作、考核评估',
    stageCount: 3,
    usageCount: 8,
    category: 'skillUpgrade'
  },
  {
    id: 'pt3',
    name: '管理能力培训项目',
    description: '针对管理层的培训项目，包含领导力、团队管理、决策能力等',
    stageCount: 5,
    usageCount: 12,
    category: 'management'
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
  category: ''
})

const templateRules = {
  name: [{ required: true, message: '请输入模板名称', trigger: 'blur' }],
  description: [{ required: true, message: '请输入模板描述', trigger: 'blur' }],
  category: [{ required: true, message: '请选择适用场景', trigger: 'change' }]
}

const templateFormRef = ref()

// 操作方法
const createTemplate = () => {
  editingTemplate.value = null
  templateForm.value = {
    name: '',
    description: '',
    category: ''
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
    category: template.category
  }
  showEditDialog.value = true
}

const duplicateTemplate = (template: any) => {
  const newTemplate = {
    ...template,
    id: 'pt' + (templates.value.length + 1),
    name: template.name + ' (副本)',
    usageCount: 0
  }
  templates.value.push(newTemplate)
  ElMessage.success('模板复制成功')
}

const deleteTemplate = (template: any) => {
  ElMessageBox.confirm('确定要删除这个项目模板吗？', '删除确认', {
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
          ...templateForm.value
        }
      }
      ElMessage.success('模板更新成功')
    } else {
      // 创建新模板
      const newTemplate = {
        id: 'pt' + (templates.value.length + 1),
        ...templateForm.value,
        stageCount: 1,
        usageCount: 0
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
.project-template-manager {
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
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
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

.template-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
  background: #f0f9ff;
  border-radius: 8px;
  margin-bottom: 12px;
}

.template-icon .el-icon {
  font-size: 24px;
  color: #409eff;
}

.template-content h4 {
  margin: 0 0 8px 0;
  font-size: 16px;
  color: #333;
}

.template-content p {
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
  margin-bottom: 12px;
}

.template-actions {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}
</style> 