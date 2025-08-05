<template>
  <div class="project-evaluation-tab">
    <!-- 头部操作区 -->
    <div class="header-section">
      <div class="title-area">
        <h3>带教评价管理</h3>
        <p class="subtitle">管理师徒关系的评价任务，支持多种评价类型和模板</p>
      </div>
      <div class="action-area">
        <el-button type="primary" @click="showAddEvaluationDialog = true">
          <el-icon><Plus /></el-icon>
          添加评价
        </el-button>
      </div>
    </div>

    <!-- 数据统计 -->
    <div class="stats-container">
      <el-row :gutter="16">
        <el-col :span="6">
          <el-statistic title="师徒关系" :value="activeRelationships.length" />
        </el-col>
        <el-col :span="6">
          <el-statistic title="评价任务" :value="evaluationTasks.length" />
        </el-col>
        <el-col :span="6">
          <el-statistic title="待完成" :value="pendingEvaluations" />
        </el-col>
        <el-col :span="6">
          <el-statistic title="已完成" :value="completedEvaluations" />
        </el-col>
      </el-row>
    </div>

    <!-- 🔧 优化：评价任务列表 - 统一显示表格 -->
    <div class="evaluation-list">
      <el-table
        :data="evaluationTasks"
        v-loading="loading"
        style="width: 100%"
        border
        :default-sort="{ prop: 'evaluationDirection', order: 'ascending' }"
      >
        <el-table-column label="评价维度" width="120" prop="evaluationDirection" sortable>
          <template #default="{ row }">
            <span>{{ getEvaluationDirection(row.evaluatorType) }}</span>
          </template>
        </el-table-column>

        <el-table-column label="模板名称" width="200" prop="evaluationTypeText" sortable show-overflow-tooltip>
          <template #default="{ row }">
            <el-tag type="info">
              {{ getCleanTemplateName(row.evaluationTypeText) }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column label="师徒关系" min-width="200" prop="mentorName" sortable>
          <template #default="{ row }">
            <div class="relationship-info">
              <div class="participants">
                <span class="mentor">{{ getMentorName(row.mentorId) }}</span>
                <el-icon class="arrow"><Right /></el-icon>
                <span class="student">{{ getStudentName(row.studentId) }}</span>
              </div>
              <div class="meta">
                <el-tag size="small" type="info">
                  {{ getRelationshipType(row.relationshipId) }}
                </el-tag>
              </div>
            </div>
          </template>
        </el-table-column>

        <el-table-column label="状态" width="100" prop="status" sortable>
          <template #default="{ row }">
            <el-tag :type="getEvaluationStatusTagType(row.status)" size="small">
              {{ getEvaluationStatusText(row.status) }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column label="得分" width="80" prop="overallScore" sortable>
          <template #default="{ row }">
            <span v-if="row.status === 'completed'">{{ row.overallScore || row.score || 0 }}分</span>
            <span v-else class="pending">-</span>
          </template>
        </el-table-column>

        <el-table-column label="操作" width="240" fixed="right">
          <template #default="{ row }">
            <div class="table-actions">
              <el-button 
                type="info" 
                size="small"
                @click="viewEvaluationDetail(row)"
              >
                详情
              </el-button>
              <el-button 
                v-if="row.status === 'completed'"
                type="primary" 
                size="small"
                @click="viewEvaluationResult(row)"
              >
                查看结果
              </el-button>
              <el-button 
                type="danger" 
                size="small"
                @click="deleteEvaluation(row)"
              >
                删除
              </el-button>
            </div>
          </template>
        </el-table-column>

        <!-- 简化的空状态提示 -->
        <template #empty>
          <div class="empty-evaluation-compact">
            <span class="empty-text">暂无评价任务</span>
          </div>
        </template>
      </el-table>
    </div>

    <!-- 添加评价对话框 -->
    <el-dialog
      v-model="showAddEvaluationDialog"
      title="添加评价任务"
      width="500px"
      :close-on-click-modal="false"
    >
      <div class="batch-info">
        <el-alert 
          type="info" 
          :closable="false"
          title="任务生成说明"
          description="选择评价模板后，将为所有师徒关系生成相应的评价任务并推送到工作台"
          show-icon
        />
      </div>

      <el-form :model="addEvaluationForm" label-width="120px">
        <el-form-item label="评价方向" required>
          <el-radio-group v-model="addEvaluationForm.evaluatorType">
            <el-radio value="MENTOR">带教老师评价学员</el-radio>
            <el-radio value="STUDENT">学员评价带教老师</el-radio>
          </el-radio-group>
        </el-form-item>

        <el-form-item label="评价模板" required>
          <el-select v-model="addEvaluationForm.templateId" placeholder="选择评价模板" @change="onTemplateChange">
            <el-option
              v-for="template in availableTemplates"
              :key="template.id"
              :label="template.title"
              :value="template.id"
            />
          </el-select>
        </el-form-item>

        <el-form-item label="预览">
          <div v-if="addEvaluationForm.evaluatorType && addEvaluationForm.templateId" class="preview-section">
            <p class="preview-title">将创建以下评价任务：</p>
            <div class="preview-item">
              <el-tag type="primary">{{ getEvaluationDirection(addEvaluationForm.evaluatorType) }}</el-tag>
              <span class="preview-arrow">→</span>
              <el-tag type="success">
                {{ addEvaluationForm.templateTitle || '请选择模板' }}
              </el-tag>
            </div>
            
            <!-- 🔧 修改：简化显示选择信息 -->
            <div v-if="addEvaluationForm.templateTitle" class="selection-summary">
              <div class="summary-item">
                <span class="label">选中模板：</span>
                <span class="value">{{ addEvaluationForm.templateTitle }}</span>
              </div>
              <div class="summary-item">
                <span class="label">评价类型：</span>
                <span class="value">{{ getEvaluationDirection(addEvaluationForm.evaluatorType) }}</span>
              </div>
            </div>
            
            <p class="preview-note">自动覆盖所有 {{ activeRelationships.length }} 对师徒关系</p>
          </div>
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="showAddEvaluationDialog = false">取消</el-button>
        <el-button type="primary" @click="handleAddEvaluation" :loading="addingEvaluation">
          创建评价任务
        </el-button>
      </template>
    </el-dialog>

    <!-- 评价结果查看对话框 -->
    <el-dialog v-model="showResultDialog" title="评价详情" width="600px">
      <div v-if="selectedResult" class="evaluation-result-detail">
        <div class="result-header">
          <h4>{{ selectedResult.evaluatorRole }}</h4>
          <p class="relationship-info">
            {{ selectedResult.mentorName }} ↔ {{ selectedResult.studentName }}
          </p>
        </div>
        <div class="result-content">
          <div class="score-section">
            <div class="score-display">
              <span class="score-label">评价得分</span>
              <span class="score-value">{{ selectedResult.score }}分</span>
            </div>
          </div>
          <div class="meta-section">
            <p><strong>模板名称：</strong>{{ getCleanTemplateName(selectedResult.evaluationTypeText) }}</p>
            <p><strong>评价维度：</strong>{{ selectedResult.evaluationDirection }}</p>
            <p><strong>完成时间：</strong>{{ formatDate(selectedResult.evaluatedAt) }}</p>
          </div>
        </div>
      </div>
    </el-dialog>

    <!-- 评价详情对话框 -->
    <el-dialog v-model="showDetailDialog" title="评价任务详情" width="700px">
      <div v-if="selectedDetail" class="evaluation-detail">
        <!-- 基本信息 -->
        <el-card shadow="never" class="detail-card">
          <template #header>
            <div class="card-header">
              <span class="header-title">基本信息</span>
            </div>
          </template>
          <el-descriptions :column="2" border>
            <el-descriptions-item label="师徒关系">
              <div class="relationship-info">
                <span class="mentor">{{ selectedDetail.mentorName }}</span>
                <el-icon class="arrow" style="margin: 0 8px;"><Right /></el-icon>
                <span class="student">{{ selectedDetail.studentName }}</span>
              </div>
            </el-descriptions-item>
            <el-descriptions-item label="模板名称">
              <el-tag type="info">{{ getCleanTemplateName(selectedDetail.evaluationTypeText) }}</el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="评价维度">
              {{ selectedDetail.evaluationDirection }}
            </el-descriptions-item>
            <el-descriptions-item label="评价状态">
              <el-tag :type="selectedDetail.statusTagType" size="small">
                {{ selectedDetail.statusText }}
              </el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="创建时间">
              {{ formatDate(selectedDetail.createdAt) }}
            </el-descriptions-item>
            <el-descriptions-item label="截止时间">
              {{ formatDate(selectedDetail.dueDate) }}
            </el-descriptions-item>
          </el-descriptions>
        </el-card>

        <!-- 评价内容 -->
        <el-card shadow="never" class="detail-card" style="margin-top: 16px;">
          <template #header>
            <div class="card-header">
              <span class="header-title">评价内容</span>
            </div>
          </template>
          
          <!-- 如果评价未完成 -->
          <div v-if="selectedDetail.status !== 'completed'" class="pending-evaluation">
            <el-empty description="评价任务尚未完成" :image-size="60">
              <div class="evaluation-info">
                <p><strong>评价模板：</strong>{{ getCleanTemplateName(selectedDetail.evaluationTypeText) }}</p>
                <p><strong>评价说明：</strong>{{ selectedDetail.specificFeedback || '使用指定模板进行评价' }}</p>
                <p v-if="selectedDetail.recommendations && selectedDetail.recommendations.length > 0">
                  <strong>模板信息：</strong>
                  <el-tag v-for="(rec, index) in selectedDetail.recommendations" :key="index" size="small" style="margin-left: 4px;">
                    {{ rec }}
                  </el-tag>
                </p>
              </div>
            </el-empty>
          </div>

          <!-- 如果评价已完成 -->
          <div v-else class="completed-evaluation">
            <el-descriptions :column="1" border>
              <el-descriptions-item label="综合评分">
                <div class="score-display">
                  <span class="score-value">{{ selectedDetail.overallScore || 0 }}分</span>
                </div>
              </el-descriptions-item>
              
              <!-- 各项评分 -->
              <el-descriptions-item label="技能评分" v-if="selectedDetail.technicalSkillsScore !== undefined">
                {{ selectedDetail.technicalSkillsScore }}分
              </el-descriptions-item>
              <el-descriptions-item label="沟通评分" v-if="selectedDetail.communicationScore !== undefined">
                {{ selectedDetail.communicationScore }}分
              </el-descriptions-item>
              <el-descriptions-item label="学习态度" v-if="selectedDetail.learningAttitudeScore !== undefined">
                {{ selectedDetail.learningAttitudeScore }}分
              </el-descriptions-item>
              <el-descriptions-item label="问题解决" v-if="selectedDetail.problemSolvingScore !== undefined">
                {{ selectedDetail.problemSolvingScore }}分
              </el-descriptions-item>
              <el-descriptions-item label="协作能力" v-if="selectedDetail.collaborationScore !== undefined">
                {{ selectedDetail.collaborationScore }}分
              </el-descriptions-item>

              <!-- 反馈内容 -->
              <el-descriptions-item label="具体反馈" v-if="selectedDetail.specificFeedback">
                <div class="feedback-content">{{ selectedDetail.specificFeedback }}</div>
              </el-descriptions-item>
              <el-descriptions-item label="优势表现" v-if="selectedDetail.strengths">
                <div class="feedback-content">{{ selectedDetail.strengths }}</div>
              </el-descriptions-item>
              <el-descriptions-item label="改进建议" v-if="selectedDetail.improvementAreas">
                <div class="feedback-content">{{ selectedDetail.improvementAreas }}</div>
              </el-descriptions-item>
              <el-descriptions-item label="推荐行动" v-if="selectedDetail.suggestions">
                <div class="feedback-content">{{ selectedDetail.suggestions }}</div>
              </el-descriptions-item>
            </el-descriptions>
          </div>
        </el-card>
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Right, ArrowDown, Plus, Refresh } from '@element-plus/icons-vue'
import type { ProjectMentorRelationship, Student, Mentor } from '../types/mentorship'
import { formatDate } from '@/utils/dateUtils'
import { getProjectEvaluations, deleteProjectEvaluation, submitMentorshipEvaluation } from '@/api/modules/project-mentorship'
import { getTemplateList } from '@/api/modules/assessment-center'

// Props
interface Props {
  projectId: string
  relationships: ProjectMentorRelationship[]
  students?: Student[]
  mentors?: Mentor[]
}

const props = defineProps<Props>()

// 响应式数据
const filterStatus = ref('')
const showResultDialog = ref(false)
const selectedResult = ref<any>(null)
const showDetailDialog = ref(false)
const selectedDetail = ref<any>(null)
const loading = ref(false)

// 评价数据
const evaluations = ref<any[]>([])

// 模板数据
const availableTemplates = ref<any[]>([])

// 添加评价对话框
const showAddEvaluationDialog = ref(false)
const addEvaluationForm = ref({
  evaluatorType: 'MENTOR',
  templateId: '',
  templateTitle: ''
})
const addingEvaluation = ref(false)

// 计算属性
const activeRelationships = computed(() => {
  console.log('🔍 计算activeRelationships - 所有关系:', props.relationships)
  // 返回所有的师徒关系，不做状态过滤
  const activeRels = props.relationships || []
  console.log('🔍 activeRelationships计算结果:', activeRels)
  return activeRels
})

// 临时：暂时默认为新员工培训，后续优化
const isNewEmployeeTraining = computed(() => {
  console.log('🔍 临时设置为新员工培训模式')
  return true // 临时固定为true，测试功能
})

// 评价类型配置
const evaluationConfig = computed(() => {
  if (isNewEmployeeTraining.value) {
    return {
      types: ['probation', 'annual'],
      labels: {
        probation: '转正评价',
        annual: '一年期评价'
      }
    }
  } else {
    return {
      types: ['phase'],
      labels: {
        phase: '阶段评价'
      }
    }
  }
})

// 加载评价数据
const loadEvaluations = async () => {
  if (!props.projectId) {
    console.warn('⚠️ 项目ID为空，无法加载评价数据')
    return
  }

  // 🔧 修复：获取师徒关系实际所属的项目ID
  const actualProjectIds = new Set<string>()
  
  // 从师徒关系中收集实际的项目ID
  props.relationships.forEach(rel => {
    if (rel.projectId) {
      actualProjectIds.add(rel.projectId)
    }
  })
  
  // 如果没有找到师徒关系的项目ID，使用当前项目ID
  if (actualProjectIds.size === 0) {
    actualProjectIds.add(props.projectId)
  }

  console.log('🔍 收集到的项目ID:', Array.from(actualProjectIds))
  console.log('🔍 当前页面项目ID:', props.projectId)

  loading.value = true
  const allEvaluations: any[] = []
  
  try {
    // 🔧 修复：对每个实际的项目ID都加载评价数据
    for (const projectId of actualProjectIds) {
      console.log('🔄 加载评价数据 - 项目ID:', projectId)
      
      try {
        const response = await getProjectEvaluations(projectId)
        console.log(`🔍 项目${projectId} API原始返回数据:`, response)
        
        // 处理不同的API返回格式
        let evaluationData = []
        if (Array.isArray(response)) {
          evaluationData = response
        } else if (response?.data && Array.isArray(response.data)) {
          evaluationData = response.data
        } else if (response?.code === 200 && Array.isArray(response?.data)) {
          evaluationData = response.data
        }
        
        // 添加到总列表
        allEvaluations.push(...evaluationData)
        console.log(`✅ 项目${projectId}加载评价数据成功，共${evaluationData.length}条`)
        
      } catch (error) {
        console.error(`❌ 项目${projectId}加载评价数据失败:`, error)
        // 继续加载其他项目的数据，不中断整个流程
      }
    }
    
    evaluations.value = allEvaluations
    console.log('🔍 合并后的所有evaluations:', evaluations.value)
    console.log('🔍 合并后的evaluations详细内容:', JSON.stringify(evaluations.value, null, 2))
    console.log(`✅ 总共加载评价数据成功，共${evaluations.value.length}条`)
    
  } catch (error) {
    console.error('❌ 加载评价数据失败:', error)
    ElMessage.error('加载评价数据失败')
    // 失败时使用空数组
    evaluations.value = []
  } finally {
    loading.value = false
  }
}

// 加载可用模板
const loadAvailableTemplates = async () => {
  try {
    console.log('🔄 加载评价模板...')
    const response = await getTemplateList({ type: 'evaluation', status: 'published' })
    availableTemplates.value = response?.data || []
    console.log(`✅ 加载评价模板成功，共${availableTemplates.value.length}个`)
  } catch (error) {
    console.error('❌ 加载评价模板失败:', error)
    // 如果API失败，使用模拟数据
    availableTemplates.value = [
      { id: 'template_1', title: '带教老师评价学员-转正模板', type: 'evaluation' },
      { id: 'template_2', title: '学员评价带教老师-转正模板', type: 'evaluation' },
      { id: 'template_3', title: '学员评价带教老师-一年期模板', type: 'evaluation' },
    ]
    console.log('🔄 使用模拟模板数据')
  }
}

// 🔧 简化：监听模板选择变化，只保存模板标题
const onTemplateChange = (templateId: string) => {
  const selectedTemplate = availableTemplates.value.find(t => t.id === templateId)
  if (selectedTemplate) {
    addEvaluationForm.value.templateTitle = selectedTemplate.title
    console.log('✅ 模板选择成功:', selectedTemplate.title)
  }
}

// 根据师徒关系和评价数据计算状态
const getMentorToProbationStatus = (relationshipId: string): 'pending' | 'completed' => {
  const evaluation = evaluations.value.find(evaluation => 
    evaluation.relationshipId === relationshipId && 
    evaluation.evaluatorType === 'MENTOR' && 
    evaluation.evaluationType === 'PROBATION'
  )
  return evaluation?.status || 'pending'
}

const getStudentToProbationStatus = (relationshipId: string): 'pending' | 'completed' => {
  const evaluation = evaluations.value.find(evaluation => 
    evaluation.relationshipId === relationshipId && 
    evaluation.evaluatorType === 'STUDENT' && 
    evaluation.evaluationType === 'PROBATION'
  )
  return evaluation?.status || 'pending'
}

const getMentorToAnnualStatus = (relationshipId: string): 'pending' | 'completed' => {
  const evaluation = evaluations.value.find(evaluation => 
    evaluation.relationshipId === relationshipId && 
    evaluation.evaluatorType === 'MENTOR' && 
    evaluation.evaluationType === 'ANNUAL'
  )
  return evaluation?.status || 'pending'
}

const getStudentToAnnualStatus = (relationshipId: string): 'pending' | 'completed' => {
  const evaluation = evaluations.value.find(evaluation => 
    evaluation.relationshipId === relationshipId && 
    evaluation.evaluatorType === 'STUDENT' && 
    evaluation.evaluationType === 'ANNUAL'
  )
  return evaluation?.status || 'pending'
}

// 阶段评价相关函数（用于非新员工培训项目）
const getMentorToPhaseStatus = (relationshipId: string): 'pending' | 'completed' => {
  const evaluation = evaluations.value.find(evaluation => 
    evaluation.relationshipId === relationshipId && 
    evaluation.evaluatorType === 'MENTOR' && 
    evaluation.evaluationType === 'PHASE'
  )
  return evaluation?.status || 'pending'
}

const getMentorToPhaseText = (relationshipId: string): string => {
  const status = getMentorToPhaseStatus(relationshipId)
  return status === 'completed' ? '已完成' : '待完成'
}

const getMentorToPhaseScore = (relationshipId: string): number => {
  const evaluation = evaluations.value.find(evaluation => 
    evaluation.relationshipId === relationshipId && 
    evaluation.evaluatorType === 'MENTOR' && 
    evaluation.evaluationType === 'PHASE'
  )
  return evaluation?.score || Math.floor(Math.random() * 30) + 70
}

const getStudentToPhaseStatus = (relationshipId: string): 'pending' | 'completed' => {
  const evaluation = evaluations.value.find(evaluation => 
    evaluation.relationshipId === relationshipId && 
    evaluation.evaluatorType === 'STUDENT' && 
    evaluation.evaluationType === 'PHASE'
  )
  return evaluation?.status || 'pending'
}

const getStudentToPhaseText = (relationshipId: string): string => {
  const status = getStudentToPhaseStatus(relationshipId)
  return status === 'completed' ? '已完成' : '待完成'
}

const getStudentToPhaseScore = (relationshipId: string): number => {
  const evaluation = evaluations.value.find(evaluation => 
    evaluation.relationshipId === relationshipId && 
    evaluation.evaluatorType === 'STUDENT' && 
    evaluation.evaluationType === 'PHASE'
  )
  return evaluation?.score || Math.floor(Math.random() * 30) + 70
}

// 新增的辅助函数
const getEvaluationTypeText = (type: string): string => {
  const typeMap = {
    probation: '转正评价',
    annual: '一年期评价',
    phase: '阶段评价',
    custom: '自定义评价'
  }
  return typeMap[type as keyof typeof typeMap] || type
}

const getEvaluationTypeColor = (type: string): string => {
  const colorMap = {
    probation: 'warning',
    annual: 'success',
    phase: 'primary',
    custom: 'info'
  }
  return colorMap[type as keyof typeof colorMap] || 'info' // 使用'info'替代'default'
}

const getEvaluationDirection = (evaluatorType: string): string => {
  return evaluatorType === 'MENTOR' ? '带教老师评价学员' : '学员评价带教老师'
}

const getStatusText = (status: string): string => {
  const statusMap = {
    pending: '待完成',
    in_progress: '进行中',
    completed: '已完成',
    overdue: '已逾期'
  }
  return statusMap[status as keyof typeof statusMap] || status
}

const getStatusTagType = (status: string): string => {
  const typeMap = {
    pending: 'warning',
    in_progress: 'primary',
    completed: 'success',
    overdue: 'danger'
  }
  return typeMap[status as keyof typeof typeMap] || 'info' // 使用'info'替代'default'
}

const getRelationshipType = (relationshipId: string): string => {
  const relationship = props.relationships.find(rel => rel.id === relationshipId)
  if (!relationship) return '未知类型'
  
  return relationship.type === 'academy_certified' ? '书院认证' : '部门指定'
}

// 🔧 新增：评价状态显示函数 - 显示"已评价"或"未评价"
const getEvaluationStatusText = (status: string): string => {
  return status === 'completed' ? '已评价' : '未评价'
}

const getEvaluationStatusTagType = (status: string): string => {
  return status === 'completed' ? 'success' : 'warning'
}

// 🔧 新增：清理模板名称，去掉各种前缀和状态信息
const getCleanTemplateName = (templateName: string): string => {
  if (!templateName) return '未知模板'
  
  let cleanName = templateName
  
  // 去掉各种可能的前缀：
  // "模板：" "评价模板：" 等
  cleanName = cleanName.replace(/^(模板|评价模板)[:：]\s*/, '')
  
  // 去掉状态信息：
  // "| 状态：待完成" 等
  cleanName = cleanName.replace(/\s*[|\|]\s*状态[:：][^|]*/, '')
  
  // 去掉其他可能的状态标识
  cleanName = cleanName.replace(/\s*[|\|]\s*(待完成|已完成|进行中|已逾期).*/, '')
  
  return cleanName.trim() || templateName
}

// 添加评价任务的处理函数
const handleAddEvaluation = async () => {
  if (!addEvaluationForm.value.evaluatorType || 
      !addEvaluationForm.value.templateId) {
    ElMessage.warning('请选择评价方向和评价模板')
    return
  }

  console.log('🔍 检查activeRelationships:', activeRelationships.value)
  console.log('🔍 检查所有relationships:', props.relationships)
  console.log('🔍 检查students:', props.students)
  console.log('🔍 检查mentors:', props.mentors)

  addingEvaluation.value = true
  
  try {
    // 批量创建评价任务 - 循环调用单个API
    const createdEvaluations = []
    const totalCount = activeRelationships.value.length
    
    console.log(`🔄 开始批量创建，共${totalCount}对师徒关系`)
    
    for (let i = 0; i < activeRelationships.value.length; i++) {
      const rel = activeRelationships.value[i]
      
      // 🔧 修复：使用师徒关系实际的项目ID，而不是当前页面的项目ID
      const actualProjectId = rel.projectId || props.projectId
      console.log(`🔍 师徒关系${i+1} - 关系ID: ${rel.id}, 实际项目ID: ${actualProjectId}, 页面项目ID: ${props.projectId}`)
      
      const evaluationData = {
        projectId: actualProjectId,  // 🔧 修复：使用实际的项目ID
        relationshipId: rel.id,
        evaluateeId: addEvaluationForm.value.evaluatorType === 'MENTOR' ? rel.studentId : rel.mentorId,
        evaluatorType: addEvaluationForm.value.evaluatorType,
        evaluationPeriod: 'PHASE_END', // 默认为阶段结束评价
        performanceRating: 0, // 待评价，设为0
        communicationRating: 0,
        guidanceEffectivenessRating: 0,
        progressRating: 0,
        overallRating: 0,
        feedback: `评价模板：${addEvaluationForm.value.templateTitle}`,
        strengths: [],
        areasForImprovement: [],
        recommendations: [`使用模板ID: ${addEvaluationForm.value.templateId}`]
      }
      
      try {
        // 🔧 修复：API调用也使用实际的项目ID
        const result = await submitMentorshipEvaluation(actualProjectId, evaluationData)
        createdEvaluations.push(result)
        console.log(`✅ 创建评价任务 ${i+1}/${totalCount}:`, result)
      } catch (error) {
        console.error(`❌ 创建评价任务 ${i+1}/${totalCount} 失败:`, error)
        // 继续创建其他任务，不中断整个流程
      }
    }

    ElMessage.success(`成功创建 ${createdEvaluations.length}/${totalCount} 个评价任务！`)
    
    // 重新加载数据
    await loadEvaluations()
    
    // 重置表单
    addEvaluationForm.value = {
      evaluatorType: 'MENTOR',
      templateId: '',
      templateTitle: ''
    }
    
    showAddEvaluationDialog.value = false
    
    console.log('✅ 批量创建评价任务完成，成功:', createdEvaluations.length, '失败:', totalCount - createdEvaluations.length)
    
  } catch (error) {
    console.error('❌ 批量创建评价任务失败:', error)
    ElMessage.error('创建失败，请稍后重试')
  } finally {
    addingEvaluation.value = false
  }
}

const viewEvaluationResult = (row: any) => {
  // 使用API返回的真实数据
  selectedResult.value = {
    relationshipId: row.relationshipId,
    type: row.evaluationType,
    score: row.score || 0,
    evaluatedAt: row.evaluatedAt || new Date(),
    evaluator: row.evaluatorType === 'MENTOR' ? '带教老师' : '学员',
    evaluatorRole: `${getEvaluationDirection(row.evaluatorType)}-${row.templateTitle}`,
    mentorName: getMentorName(row.mentorId),
    studentName: getStudentName(row.studentId),
    evaluationTypeText: row.templateTitle,
    evaluationDirection: getEvaluationDirection(row.evaluatorType)
  }
  showResultDialog.value = true
}

const viewEvaluationDetail = (row: any) => {
  console.log('🔍 查看评价详情:', row)
  
  // 设置详情数据
  selectedDetail.value = {
    ...row,
    mentorName: getMentorName(row.mentorId),
    studentName: getStudentName(row.studentId),
    evaluationTypeText: row.evaluationTypeText || '未知类型',
    evaluationDirection: getEvaluationDirection(row.evaluatorType),
    statusText: getStatusText(row.status),
    statusTagType: getStatusTagType(row.status),
    // 确保有默认值
    overallScore: row.overallScore || 0,
    technicalSkillsScore: row.technicalSkillsScore,
    communicationScore: row.communicationScore,
    learningAttitudeScore: row.learningAttitudeScore,
    problemSolvingScore: row.problemSolvingScore,
    collaborationScore: row.collaborationScore,
    specificFeedback: row.specificFeedback || row.feedback,
    strengths: row.strengths,
    improvementAreas: row.improvementAreas,
    suggestions: row.suggestions,
    recommendations: row.recommendations || [],
    createdAt: row.createdAt || row.evaluationDate,
    dueDate: row.dueDate
  }
  
  showDetailDialog.value = true
}

const deleteEvaluation = async (row: any) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除这个评价任务吗？`,
      '删除确认',
      {
        type: 'warning',
        confirmButtonText: '确定删除',
        cancelButtonText: '取消'
      }
    )
    
    // 🔧 修复：调用真实API删除，需要传递项目ID
    // 获取评价所属的实际项目ID
    const relationship = props.relationships.find(rel => rel.id === row.relationshipId)
    const actualProjectId = relationship?.projectId || props.projectId
    
    console.log('🔍 删除评价 - 评价ID:', row.id, '实际项目ID:', actualProjectId, '关系ID:', row.relationshipId)
    
    await deleteProjectEvaluation(actualProjectId, row.id)
    
    ElMessage.success('评价任务删除成功')
    console.log('✅ 删除评价任务:', row.id)
    
    // 重新加载数据
    await loadEvaluations()
    
  } catch (error) {
    if (error !== 'cancel') {
      console.error('❌ 删除评价任务失败:', error)
      ElMessage.error('删除失败，请稍后重试')
    }
  }
}

// 🔧 新增：师徒关系与评价联动功能
const syncEvaluationsWithRelationships = async () => {
  console.log('🔄 同步师徒关系与评价任务...')
  ElMessage.info('正在同步师徒关系与评价任务...')
  
  try {
    // 获取当前所有评价任务
    const currentEvaluations = evaluations.value || []
    
    // 获取当前所有有效的师徒关系（排除已解除/终止的关系）
    const activeRelationships = props.relationships.filter(rel => 
      rel.status !== 'terminated' && 
      rel.status !== 'TERMINATED' && 
      rel.status !== 'cancelled' && 
      rel.status !== 'CANCELLED' &&
      rel.status !== 'inactive' &&
      rel.status !== 'INACTIVE'
    )
    
    // 打印详细的师徒关系状态信息
    console.log('🔍 所有师徒关系状态分析:')
    props.relationships.forEach((rel, index) => {
      console.log(`  ${index + 1}. ID: ${rel.id}, 状态: ${rel.status}, 带教老师: ${rel.mentorName}, 学员: ${rel.studentName}`)
    })
    
    console.log('🔍 当前有效师徒关系:', activeRelationships.length, '个')
    console.log('🔍 当前评价任务:', currentEvaluations.length, '个')
    
    // 打印评价任务与关系的对应情况
    currentEvaluations.forEach((evaluation, index) => {
      const relExists = activeRelationships.some(rel => rel.id === evaluation.relationshipId)
      console.log(`  评价${index + 1}: 关系ID=${evaluation.relationshipId}, 关系存在=${relExists}`)
    })
    
    // 1. 删除无效关系的评价任务
    const invalidEvaluations = currentEvaluations.filter(evaluation => {
      const relExists = activeRelationships.some(rel => rel.id === evaluation.relationshipId)
      return !relExists
    })
    
    if (invalidEvaluations.length > 0) {
      console.log('🗑️ 发现', invalidEvaluations.length, '个无效评价任务，准备删除...')
      
      for (const invalidEval of invalidEvaluations) {
        try {
          const relationship = props.relationships.find(rel => rel.id === invalidEval.relationshipId)
          const actualProjectId = relationship?.projectId || props.projectId
          
          await deleteProjectEvaluation(actualProjectId, invalidEval.id)
          console.log('✅ 删除无效评价任务:', invalidEval.id)
        } catch (error) {
          console.error('❌ 删除无效评价任务失败:', invalidEval.id, error)
        }
      }
    }
    
    // 2. 为新关系创建评价任务
    const newRelationships = activeRelationships.filter(rel => {
      const hasEvaluation = currentEvaluations.some(evaluation => evaluation.relationshipId === rel.id)
      return !hasEvaluation
    })
    
    if (newRelationships.length > 0 && availableTemplates.value.length > 0) {
      console.log('🆕 发现', newRelationships.length, '个新师徒关系，准备创建评价任务...')
      
      // 为每个新关系创建评价任务（使用所有可用模板）
      for (const newRel of newRelationships) {
        try {
                // 为带教老师评价学员创建任务
      if (availableTemplates.value.some(t => t.title.includes('带教老师评价学员'))) {
        const mentorTemplate = availableTemplates.value.find(t => t.title.includes('带教老师评价学员'))
            if (mentorTemplate) {
              const mentorEvalData = {
                projectId: newRel.projectId || props.projectId,
                relationshipId: newRel.id,
                evaluateeId: newRel.studentId,
                evaluatorType: 'MENTOR',
                evaluationPeriod: 'PHASE_END',
                performanceRating: 0,
                communicationRating: 0,
                guidanceEffectivenessRating: 0,
                progressRating: 0,
                overallRating: 0,
                feedback: `评价模板：${mentorTemplate.title}`,
                strengths: [],
                areasForImprovement: [],
                recommendations: [`使用模板ID: ${mentorTemplate.id}`]
              }
              
              await submitMentorshipEvaluation(newRel.projectId || props.projectId, mentorEvalData)
              console.log('✅ 为新关系创建带教老师评价任务:', newRel.id)
            }
          }
          
          // 为学员评价带教老师创建任务
          if (availableTemplates.value.some(t => t.title.includes('学员评价带教老师'))) {
            const studentTemplate = availableTemplates.value.find(t => t.title.includes('学员评价带教老师'))
            if (studentTemplate) {
              const studentEvalData = {
                projectId: newRel.projectId || props.projectId,
                relationshipId: newRel.id,
                evaluateeId: newRel.mentorId,
                evaluatorType: 'STUDENT',
                evaluationPeriod: 'PHASE_END',
                performanceRating: 0,
                communicationRating: 0,
                guidanceEffectivenessRating: 0,
                progressRating: 0,
                overallRating: 0,
                feedback: `评价模板：${studentTemplate.title}`,
                strengths: [],
                areasForImprovement: [],
                recommendations: [`使用模板ID: ${studentTemplate.id}`]
              }
              
              await submitMentorshipEvaluation(newRel.projectId || props.projectId, studentEvalData)
              console.log('✅ 为新关系创建学员评价任务:', newRel.id)
            }
          }
        } catch (error) {
          console.error('❌ 为新关系创建评价任务失败:', newRel.id, error)
        }
      }
    }
    
    // 3. 重新加载评价数据
    await loadEvaluations()
    
    console.log('✅ 师徒关系与评价任务同步完成')
    
    // 给出用户反馈
    const deletedCount = invalidEvaluations.length
    const createdCount = newRelationships.length * 2 // 每个关系创建2个评价（双向）
    
    if (deletedCount > 0 || createdCount > 0) {
      ElMessage.success(`同步完成！删除${deletedCount}个无效评价，创建${createdCount}个新评价`)
    } else {
      ElMessage.success('同步完成！师徒关系与评价任务已保持一致')
    }
    
  } catch (error) {
    console.error('❌ 师徒关系与评价任务同步失败:', error)
    ElMessage.error('同步失败，请查看控制台了解详情')
  }
}

// 生命周期
onMounted(() => {
  loadEvaluations()
  loadAvailableTemplates() // 在组件挂载时加载模板
})

// 监听师徒关系变化，自动同步评价任务
watch(() => props.relationships, async (newRelationships, oldRelationships) => {
  if (!newRelationships || !oldRelationships) return
  
  console.log('🔍 师徒关系发生变化，触发自动同步...')
  console.log('  - 旧关系数量:', oldRelationships.length)
  console.log('  - 新关系数量:', newRelationships.length)
  
  // 延迟一点执行，确保模板数据已加载
  setTimeout(() => {
    syncEvaluationsWithRelationships()
  }, 500)
}, { deep: true })

const evaluationTasks = computed(() => {
  console.log('🔍 计算evaluationTasks - 评价数据:', evaluations.value)
  return evaluations.value.map(evaluation => {
    console.log('🔍 处理单个评价:', evaluation)
    
    // 从评价数据中获取师徒ID
    let mentorId = evaluation.mentorId
    let studentId = evaluation.studentId
    
    // 如果评价数据中没有直接的mentorId/studentId，从关系中查找
    if (!mentorId || !studentId) {
      const relationship = props.relationships.find(rel => rel.id === evaluation.relationshipId)
      if (relationship) {
        mentorId = relationship.mentorId
        studentId = relationship.studentId
        console.log('🔍 从关系中获取ID - 导师:', mentorId, '学员:', studentId)
      }
    }
    
    // 如果还是没有，根据evaluatorType和evaluateeId推断
    if (!mentorId || !studentId) {
      if (evaluation.evaluatorType === 'MENTOR') {
        // 导师评价学员：evaluateeId是学员ID
        studentId = evaluation.evaluateeId
        // 需要找到评价者（导师）ID，但API没有返回evaluatorId
        mentorId = 'unknown'
      } else {
        // 学员评价导师：evaluateeId是导师ID
        mentorId = evaluation.evaluateeId
        // 需要找到评价者（学员）ID
        studentId = 'unknown'
      }
      console.log('🔍 根据evaluatorType推断 - 导师:', mentorId, '学员:', studentId)
    }

    const mentorName = getMentorName(mentorId)
    const studentName = getStudentName(studentId)

    return {
      ...evaluation,
      mentorId,
      studentId,
      mentorName,
      studentName,
      evaluationTypeText: evaluation.templateTitle || getEvaluationTypeText(evaluation.evaluationType || 'unknown'),
      evaluationDirection: getEvaluationDirection(evaluation.evaluatorType),
      statusText: getStatusText(evaluation.status),
      statusTagType: getStatusTagType(evaluation.status)
    }
  })
})

const pendingEvaluations = computed(() => {
  return evaluationTasks.value.filter(task => task.status === 'pending').length
})

const completedEvaluations = computed(() => {
  return evaluationTasks.value.filter(task => task.status === 'completed').length
})

// 方法
const getMentorName = (mentorId: string): string => {
  console.log('🔍 查找导师名称 - ID:', mentorId, '导师列表:', props.mentors)
  const mentor = props.mentors?.find(m => m.id === mentorId)
  const mentorName = mentor?.name || `导师${mentorId}`
  console.log('🔍 找到导师名称:', mentorName)
  return mentorName
}

const getStudentName = (studentId: string): string => {
  console.log('🔍 查找学员名称 - ID:', studentId, '学员列表:', props.students)
  const student = props.students?.find(s => s.id === studentId)  
  const studentName = student?.name || `学员${studentId}`
  console.log('🔍 找到学员名称:', studentName)
  return studentName
}

const getStudentDepartment = (studentId: string): string => {
  const student = props.students?.find(s => s.id === studentId)
  return student?.department || '未知部门'
}

// 生命周期
onMounted(() => {
  loadEvaluations()
})

// 事件定义
const emits = defineEmits<{
  'switch-tab': [tabName: string]
}>()
</script>

<style scoped>
.project-evaluation-tab {
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
  align-items: center;
}

.stats-container {
  margin-bottom: 20px;
}

.evaluation-list {
  background: white;
  border-radius: 8px;
}

.relationship-info {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.participants {
  display: flex;
  align-items: center;
  gap: 8px;
}

.mentor {
  font-weight: 500;
  color: #409eff;
}

.student {
  font-weight: 500;
  color: #67c23a;
}

.arrow {
  color: #c0c4cc;
}

.meta {
  display: flex;
  align-items: center;
}

.table-actions {
  display: flex;
  justify-content: center;
  gap: 8px;
}

.pending {
  color: #c0c4cc;
  font-style: italic;
}

.empty-state {
  text-align: center;
  padding: 40px 20px;
}

.evaluation-result-detail {
  padding: 20px;
}

.result-header {
  text-align: center;
  margin-bottom: 20px;
}

.result-header h4 {
  margin-bottom: 8px;
  color: #303133;
}

.result-content {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.score-section {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 10px;
}

.score-display {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.score-label {
  font-size: 14px;
  color: #909399;
}

.score-value {
  font-size: 28px;
  font-weight: bold;
  color: #303133;
}

.meta-section p {
  margin: 5px 0;
  font-size: 13px;
  color: #606266;
}

.meta-section p strong {
  color: #303133;
}

.batch-info {
  margin-bottom: 20px;
}

.preview-section {
  background-color: #f4f4f4;
  padding: 15px;
  border-radius: 4px;
  border: 1px solid #ebeef5;
}

.preview-title {
  font-size: 14px;
  color: #606266;
  margin-bottom: 10px;
  text-align: center;
}

.preview-item {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  margin-bottom: 10px;
}

.preview-item .el-tag {
  flex-shrink: 0;
}

.preview-arrow {
  color: #c0c4cc;
  font-size: 16px;
}

.preview-note {
  font-size: 12px;
  color: #909399;
  text-align: center;
  margin-top: 10px;
}

/* 🔧 新增：紧凑的空状态显示 */
.empty-evaluation-compact {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 30px 20px;
  color: #909399;
  background-color: #fafafa;
  border-radius: 4px;
  min-height: 120px;
}

.empty-evaluation-compact .empty-text {
  font-size: 14px;
  line-height: 1.5;
  margin-bottom: 8px;
}

/* 评价详情对话框样式 */
.evaluation-detail {
  margin: 0;
}

.detail-card {
  margin-bottom: 0;
}

.detail-card .card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.detail-card .header-title {
  font-weight: 600;
  color: #303133;
}

.relationship-info {
  display: flex;
  align-items: center;
  gap: 8px;
}

.relationship-info .mentor {
  color: #409eff;
  font-weight: 500;
}

.relationship-info .student {
  color: #67c23a;
  font-weight: 500;
}

.score-display {
  display: flex;
  align-items: center;
  gap: 8px;
}

.score-display .score-value {
  font-size: 18px;
  font-weight: 600;
  color: #409eff;
}

.feedback-content {
  padding: 8px 12px;
  background-color: #f8f9fa;
  border-radius: 4px;
  border-left: 3px solid #409eff;
  line-height: 1.6;
  word-break: break-word;
}

.pending-evaluation {
  text-align: center;
  padding: 20px;
}

.evaluation-info {
  text-align: left;
  margin-top: 16px;
}

.evaluation-info p {
  margin: 8px 0;
  line-height: 1.6;
}

.completed-evaluation {
  margin: 0;
}

/* 🔧 简化：选择信息摘要样式 */
.selection-summary {
  margin-top: 12px;
  padding: 12px;
  border: 1px solid #e4e7ed;
  border-radius: 4px;
  background-color: #f8f9fa;
}

.summary-item {
  display: flex;
  margin-bottom: 8px;
}

.summary-item:last-child {
  margin-bottom: 0;
}

.summary-item .label {
  font-weight: 500;
  min-width: 80px;
  color: #606266;
  font-size: 14px;
}

.summary-item .value {
  color: #303133;
  font-size: 14px;
}
</style>