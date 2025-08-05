<template>
  <div class="questionnaire-template">
    <!-- 头部操作区 -->
    <div class="header-section">
      <div class="title-area">
        <h3>问卷模板管理</h3>
        <p class="subtitle">管理评价模板和问卷调查模板，支持自定义问卷内容和结构</p>
      </div>
      <div class="action-area">
        <el-button type="primary" @click="showCreateDialog = true">
          <el-icon><Plus /></el-icon>
          新建模板
        </el-button>
        <el-button type="success" @click="handleImport">
          <el-icon><Upload /></el-icon>
          导入模板
        </el-button>
      </div>
    </div>

    <!-- 筛选器 -->
    <div class="filter-section">
      <el-form :model="filterForm" :inline="true">
        <el-form-item label="模板类型">
          <el-select v-model="filterForm.type" placeholder="全部类型" clearable>
            <el-option label="评价模板" value="evaluation" />
            <el-option label="问卷调查" value="survey" />
          </el-select>
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="filterForm.status" placeholder="全部状态" clearable>
            <el-option label="草稿" value="draft" />
            <el-option label="已发布" value="published" />
            <el-option label="已归档" value="archived" />
          </el-select>
        </el-form-item>
        <el-form-item label="搜索">
          <el-input 
            v-model="filterForm.keyword" 
            placeholder="搜索模板名称或描述"
            style="width: 200px"
            clearable
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleFilter">查询</el-button>
          <el-button @click="resetFilter">重置</el-button>
        </el-form-item>
      </el-form>
    </div>

    <!-- 数据统计 -->
    <div class="stats-container">
      <el-row :gutter="16">
        <el-col :span="6">
          <el-statistic title="总模板数" :value="templates.length" />
        </el-col>
        <el-col :span="6">
          <el-statistic title="评价模板" :value="evaluationTemplates" />
        </el-col>
        <el-col :span="6">
          <el-statistic title="问卷调查" :value="surveyTemplates" />
        </el-col>
        <el-col :span="6">
          <el-statistic title="使用次数" :value="totalUsage" />
        </el-col>
      </el-row>
    </div>

    <!-- 模板列表 -->
    <div class="template-list">
      <el-table
        :data="filteredTemplates"
        v-loading="loading"
        style="width: 100%"
        border
      >
        <el-table-column label="模板信息" min-width="300">
          <template #default="{ row }">
            <div class="template-info">
              <div class="template-header">
                <h4 class="template-title">{{ row.title }}</h4>
                <el-tag :type="getTypeTagType(row.type)" size="small">
                  {{ getTypeText(row.type) }}
                </el-tag>
              </div>
              <div class="template-description">{{ row.description || '暂无描述' }}</div>
              <div class="template-meta">
                <span class="meta-item">{{ row.questionCount }}道题</span>
                <span class="meta-item">预计{{ row.estimatedTime }}分钟</span>
                <span class="meta-item">{{ formatDate(row.createdAt) }}创建</span>
              </div>
            </div>
          </template>
        </el-table-column>

        <el-table-column label="创建者" width="120">
          <template #default="{ row }">
            <div class="creator-info">
              <span>{{ row.creatorName || '系统' }}</span>
            </div>
          </template>
        </el-table-column>

        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="getStatusTagType(row.status)" size="small">
              {{ getStatusText(row.status) }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column label="使用次数" width="100">
          <template #default="{ row }">
            <span>{{ row.usageCount || 0 }}次</span>
          </template>
        </el-table-column>

        <el-table-column label="更新时间" width="140">
          <template #default="{ row }">
            <span>{{ formatDate(row.updatedAt) }}</span>
          </template>
        </el-table-column>

        <el-table-column label="操作" width="250" fixed="right">
          <template #default="{ row }">
            <div class="table-actions">
              <el-button 
                type="primary" 
                size="small"
                @click="previewTemplate(row)"
              >
                预览
              </el-button>
              <el-button 
                type="warning" 
                size="small"
                @click="editTemplate(row)"
              >
                编辑
              </el-button>
              <el-button 
                type="success" 
                size="small"
                @click="copyTemplate(row)"
              >
                复制
              </el-button>
              <el-dropdown @command="(cmd) => handleTemplateAction(cmd, row)">
                <el-button size="small">
                  更多<el-icon class="el-icon--right"><ArrowDown /></el-icon>
                </el-button>
                <template #dropdown>
                  <el-dropdown-menu>
                    <el-dropdown-item command="export">导出模板</el-dropdown-item>
                    <el-dropdown-item command="usage">使用记录</el-dropdown-item>
                    <el-dropdown-item command="delete" divided>删除模板</el-dropdown-item>
                  </el-dropdown-menu>
                </template>
              </el-dropdown>
            </div>
          </template>
        </el-table-column>
      </el-table>

      <!-- 空状态 -->
      <div v-if="filteredTemplates.length === 0" class="empty-state">
        <el-empty description="暂无问卷模板">
          <el-button type="primary" @click="showCreateDialog = true">新建模板</el-button>
        </el-empty>
      </div>
    </div>

    <!-- 分页 -->
    <div class="pagination-container">
      <el-pagination
        v-model:current-page="pagination.page"
        v-model:page-size="pagination.size"
        :total="pagination.total"
        :page-sizes="[10, 20, 50, 100]"
        layout="total, sizes, prev, pager, next, jumper"
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
      />
    </div>

    <!-- 新建模板对话框 -->
    <el-dialog
      v-model="showCreateDialog"
      title="新建问卷模板"
      width="600px"
      :close-on-click-modal="false"
    >
      <el-form :model="createForm" :rules="createRules" ref="createFormRef" label-width="120px">
        <el-form-item label="模板类型" prop="type" required>
          <el-radio-group v-model="createForm.type">
            <el-radio value="evaluation">评价模板</el-radio>
            <el-radio value="survey">问卷调查</el-radio>
          </el-radio-group>
          <div class="form-tip">
            <p><strong>评价模板：</strong>用于师徒评价、员工考核等评价场景</p>
            <p><strong>问卷调查：</strong>用于意见收集、满意度调查等调研场景</p>
          </div>
        </el-form-item>

        <el-form-item label="模板名称" prop="title" required>
          <el-input 
            v-model="createForm.title" 
            placeholder="请输入模板名称"
            maxlength="50"
            show-word-limit
          />
        </el-form-item>

        <el-form-item label="模板描述" prop="description">
          <el-input 
            v-model="createForm.description" 
            type="textarea"
            placeholder="请输入模板描述"
            :rows="3"
            maxlength="200"
            show-word-limit
          />
        </el-form-item>

        <el-form-item label="预设模板" v-if="createForm.type">
          <el-select 
            v-model="createForm.presetTemplate" 
            placeholder="选择预设模板（可选）"
            clearable
          >
            <template v-if="createForm.type === 'evaluation'">
              <el-option label="导师评价学员-转正模板" value="mentor_probation_evaluation" />
              <el-option label="导师评价学员-一年期模板" value="mentor_annual_evaluation" />
              <el-option label="学员评价导师-转正模板" value="student_probation_evaluation" />
              <el-option label="学员评价导师-一年期模板" value="student_annual_evaluation" />
              <el-option label="自定义评价模板" value="custom_evaluation" />
            </template>
            <template v-if="createForm.type === 'survey'">
              <el-option label="培训满意度调查" value="training_satisfaction" />
              <el-option label="学习需求调研" value="learning_needs" />
              <el-option label="课程反馈调查" value="course_feedback" />
              <el-option label="工作环境调研" value="work_environment" />
            </template>
          </el-select>
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="showCreateDialog = false">取消</el-button>
        <el-button type="primary" @click="handleCreate" :loading="creating">
          创建并进入编辑
        </el-button>
      </template>
    </el-dialog>

    <!-- 模板预览对话框 -->
    <el-dialog
      v-model="showPreviewDialog"
      :title="`预览模板 - ${selectedTemplate?.title}`"
      width="800px"
      top="5vh"
    >
      <div v-if="selectedTemplate" class="template-preview">
        <div class="preview-header">
          <h3>{{ selectedTemplate.title }}</h3>
          <p class="preview-description">{{ selectedTemplate.description }}</p>
          <div class="preview-meta">
            <el-tag :type="getTypeTagType(selectedTemplate.type)">
              {{ getTypeText(selectedTemplate.type) }}
            </el-tag>
            <span class="meta-info">{{ selectedTemplate.questionCount }}道题 · 预计{{ selectedTemplate.estimatedTime }}分钟</span>
          </div>
        </div>
        
        <div class="preview-content">
          <div class="question-list">
            <div 
              v-for="(question, index) in selectedTemplate.questions || []" 
              :key="index"
              class="question-item"
            >
              <div class="question-header">
                <span class="question-number">{{ index + 1 }}.</span>
                <span class="question-title">{{ question.title }}</span>
                <el-tag size="small" type="info">{{ getQuestionTypeText(question.type) }}</el-tag>
              </div>
              <div class="question-options" v-if="question.options && question.options.length > 0">
                <div 
                  v-for="(option, optionIndex) in question.options" 
                  :key="optionIndex"
                  class="option-item"
                >
                  <span class="option-label">{{ String.fromCharCode(65 + optionIndex) }}.</span>
                  <span class="option-text">{{ option.text }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <template #footer>
        <el-button @click="showPreviewDialog = false">关闭</el-button>
        <el-button type="primary" @click="editTemplate(selectedTemplate)">编辑模板</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Upload, ArrowDown } from '@element-plus/icons-vue'

// 响应式数据
const loading = ref(false)
const showCreateDialog = ref(false)
const showPreviewDialog = ref(false)
const creating = ref(false)
const selectedTemplate = ref<any>(null)

// 筛选表单
const filterForm = ref({
  type: '',
  status: '',
  keyword: ''
})

// 创建表单
const createForm = ref({
  type: 'evaluation',
  title: '',
  description: '',
  presetTemplate: ''
})

const createRules = {
  type: [{ required: true, message: '请选择模板类型', trigger: 'change' }],
  title: [{ required: true, message: '请输入模板名称', trigger: 'blur' }]
}

// 分页
const pagination = ref({
  page: 1,
  size: 20,
  total: 0
})

// 模板数据
const templates = ref<any[]>([])

// 计算属性
const filteredTemplates = computed(() => {
  let result = templates.value
  
  if (filterForm.value.type) {
    result = result.filter(t => t.type === filterForm.value.type)
  }
  
  if (filterForm.value.status) {
    result = result.filter(t => t.status === filterForm.value.status)
  }
  
  if (filterForm.value.keyword) {
    const keyword = filterForm.value.keyword.toLowerCase()
    result = result.filter(t => 
      t.title.toLowerCase().includes(keyword) || 
      (t.description && t.description.toLowerCase().includes(keyword))
    )
  }
  
  return result
})

const evaluationTemplates = computed(() => 
  templates.value.filter(t => t.type === 'evaluation').length
)

const surveyTemplates = computed(() => 
  templates.value.filter(t => t.type === 'survey').length
)

const totalUsage = computed(() => 
  templates.value.reduce((sum, t) => sum + (t.usageCount || 0), 0)
)

// 辅助函数
const getTypeText = (type: string): string => {
  const typeMap = {
    evaluation: '评价模板',
    survey: '问卷调查'
  }
  return typeMap[type as keyof typeof typeMap] || type
}

const getTypeTagType = (type: string): string => {
  const typeMap = {
    evaluation: 'warning',
    survey: 'primary'
  }
  return typeMap[type as keyof typeof typeMap] || 'default'
}

const getStatusText = (status: string): string => {
  const statusMap = {
    draft: '草稿',
    published: '已发布',
    archived: '已归档'
  }
  return statusMap[status as keyof typeof statusMap] || status
}

const getStatusTagType = (status: string): string => {
  const typeMap = {
    draft: 'info',
    published: 'success',
    archived: 'warning'
  }
  return typeMap[status as keyof typeof typeMap] || 'default'
}

const getQuestionTypeText = (type: string): string => {
  const typeMap = {
    single_choice: '单选题',
    multiple_choice: '多选题',
    text: '填空题',
    rating: '评分题',
    matrix: '矩阵题'
  }
  return typeMap[type as keyof typeof typeMap] || type
}

const formatDate = (date: string | Date): string => {
  if (!date) return '-'
  return new Date(date).toLocaleDateString('zh-CN')
}

// 方法
const handleFilter = () => {
  console.log('筛选条件:', filterForm.value)
  // 实际开发中调用API
}

const resetFilter = () => {
  filterForm.value = {
    type: '',
    status: '',
    keyword: ''
  }
  handleFilter()
}

const handleCreate = async () => {
  creating.value = true
  try {
    console.log('创建模板:', createForm.value)
    // 实际开发中调用API创建模板
    ElMessage.success('模板创建成功！正在进入编辑器...')
    
    // 模拟创建成功后跳转到编辑器
    setTimeout(() => {
      showCreateDialog.value = false
      creating.value = false
      // 这里应该跳转到模板编辑器页面
      ElMessage.info('模板编辑器功能开发中...')
    }, 1000)
    
  } catch (error) {
    console.error('创建模板失败:', error)
    ElMessage.error('创建失败，请稍后重试')
    creating.value = false
  }
}

const previewTemplate = (template: any) => {
  selectedTemplate.value = template
  showPreviewDialog.value = true
}

const editTemplate = (template: any) => {
  console.log('编辑模板:', template)
  ElMessage.info('模板编辑器功能开发中...')
  // 实际开发中跳转到编辑器页面
}

const copyTemplate = (template: any) => {
  console.log('复制模板:', template)
  ElMessage.success(`已复制模板"${template.title}"`)
  // 实际开发中调用API复制模板
}

const handleTemplateAction = async (command: string, template: any) => {
  switch (command) {
    case 'export':
      ElMessage.info('导出功能开发中...')
      break
    case 'usage':
      ElMessage.info('使用记录功能开发中...')
      break
    case 'delete':
      try {
        await ElMessageBox.confirm(
          `确定要删除模板"${template.title}"吗？此操作不可恢复。`,
          '删除确认',
          { type: 'warning' }
        )
        ElMessage.success('删除成功')
        // 实际开发中调用API删除
      } catch {
        // 用户取消删除
      }
      break
  }
}

const handleImport = () => {
  ElMessage.info('导入功能开发中...')
}

const handleSizeChange = (size: number) => {
  pagination.value.size = size
  loadTemplates()
}

const handleCurrentChange = (page: number) => {
  pagination.value.page = page
  loadTemplates()
}

// 数据加载
const loadTemplates = async () => {
  loading.value = true
  try {
    // 模拟API调用
    await new Promise(resolve => setTimeout(resolve, 500))
    
    // 模拟数据
    templates.value = [
      {
        id: 1,
        title: '导师评价学员-转正模板',
        type: 'evaluation',
        description: '用于导师对学员进行转正期全面评价的标准模板',
        status: 'published',
        creatorName: '系统管理员',
        questionCount: 15,
        estimatedTime: 10,
        usageCount: 28,
        createdAt: '2024-01-15',
        updatedAt: '2024-01-20',
        questions: [
          {
            title: '学员的学习态度如何？',
            type: 'rating',
            options: []
          },
          {
            title: '学员的专业技能掌握程度？',
            type: 'single_choice',
            options: [
              { text: '优秀' },
              { text: '良好' },
              { text: '一般' },
              { text: '需要提升' }
            ]
          }
        ]
      },
      {
        id: 2,
        title: '学员评价导师-转正模板',
        type: 'evaluation',
        description: '用于学员对导师转正期带教质量进行反馈的模板',
        status: 'published',
        creatorName: '张老师',
        questionCount: 12,
        estimatedTime: 8,
        usageCount: 35,
        createdAt: '2024-01-10',
        updatedAt: '2024-01-18',
        questions: [
          {
            title: '导师的指导是否及时有效？',
            type: 'rating',
            options: []
          },
          {
            title: '导师的专业能力如何？',
            type: 'single_choice',
            options: [
              { text: '非常专业' },
              { text: '比较专业' },
              { text: '一般' },
              { text: '需要提升' }
            ]
          }
        ]
      },
      {
        id: 3,
        title: '学员评价导师-一年期模板',
        type: 'evaluation',
        description: '用于学员对导师一年期带教质量进行全面评价的模板',
        status: 'published',
        creatorName: '李老师',
        questionCount: 18,
        estimatedTime: 12,
        usageCount: 22,
        createdAt: '2024-01-08',
        updatedAt: '2024-01-25',
        questions: [
          {
            title: '导师在一年期内的整体带教质量？',
            type: 'rating',
            options: []
          },
          {
            title: '导师是否帮助您建立了职业发展规划？',
            type: 'single_choice',
            options: [
              { text: '非常有帮助' },
              { text: '有一定帮助' },
              { text: '帮助不大' },
              { text: '没有帮助' }
            ]
          }
        ]
      },
      {
        id: 4,
        title: '培训满意度调查',
        type: 'survey',
        description: '用于收集学员对培训课程的满意度和建议',
        status: 'draft',
        creatorName: '王老师',
        questionCount: 20,
        estimatedTime: 15,
        usageCount: 12,
        createdAt: '2024-01-12',
        updatedAt: '2024-01-22',
        questions: [
          {
            title: '您对本次培训的整体满意度？',
            type: 'rating',
            options: []
          }
        ]
      }
    ]
    
    pagination.value.total = templates.value.length
    console.log('✅ 加载模板数据成功')
  } catch (error) {
    console.error('❌ 加载模板数据失败:', error)
    ElMessage.error('加载数据失败')
  } finally {
    loading.value = false
  }
}

// 生命周期
onMounted(() => {
  loadTemplates()
})
</script>

<style scoped>
.questionnaire-template {
  padding: 20px;
}

.header-section {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 15px;
  border-bottom: 1px solid #ebeef5;
}

.title-area h3 {
  margin: 0 0 8px 0;
  color: #303133;
  font-size: 20px;
}

.subtitle {
  font-size: 14px;
  color: #909399;
  margin-bottom: 0;
}

.action-area {
  display: flex;
  gap: 12px;
}

.filter-section {
  margin-bottom: 20px;
  padding: 16px;
  background: #f8f9fa;
  border-radius: 8px;
}

.stats-container {
  margin-bottom: 20px;
}

.template-list {
  background: white;
  border-radius: 8px;
}

.template-info {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.template-header {
  display: flex;
  align-items: center;
  gap: 12px;
}

.template-title {
  margin: 0;
  font-size: 16px;
  color: #303133;
  font-weight: 500;
}

.template-description {
  font-size: 14px;
  color: #606266;
  line-height: 1.4;
}

.template-meta {
  display: flex;
  gap: 16px;
  font-size: 12px;
  color: #909399;
}

.meta-item {
  display: flex;
  align-items: center;
}

.creator-info {
  display: flex;
  align-items: center;
  gap: 8px;
}

.table-actions {
  display: flex;
  gap: 8px;
  justify-content: center;
}

.empty-state {
  text-align: center;
  padding: 40px 20px;
}

.pagination-container {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}

.form-tip {
  margin-top: 8px;
  font-size: 12px;
  color: #909399;
  line-height: 1.4;
}

.form-tip p {
  margin: 4px 0;
}

.template-preview {
  max-height: 600px;
  overflow-y: auto;
}

.preview-header {
  padding-bottom: 16px;
  border-bottom: 1px solid #ebeef5;
  margin-bottom: 20px;
}

.preview-header h3 {
  margin: 0 0 8px 0;
  color: #303133;
}

.preview-description {
  margin: 0 0 12px 0;
  color: #606266;
  font-size: 14px;
}

.preview-meta {
  display: flex;
  align-items: center;
  gap: 12px;
}

.meta-info {
  font-size: 14px;
  color: #909399;
}

.question-list {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.question-item {
  padding: 16px;
  border: 1px solid #ebeef5;
  border-radius: 6px;
  background: #fafafa;
}

.question-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
}

.question-number {
  font-weight: 500;
  color: #409eff;
}

.question-title {
  flex: 1;
  font-size: 14px;
  color: #303133;
}

.question-options {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-left: 20px;
}

.option-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: #606266;
}

.option-label {
  font-weight: 500;
  color: #909399;
}
</style> 