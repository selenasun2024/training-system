<template>
  <div class="assignment-relation-tab">
    <!-- 首次选择模式页面 -->
    <div v-if="isFirstTimeSetup" class="mode-selection">
      <div class="selection-header">
        <h3>选择带教指派模式</h3>
        <div class="project-info">
          <div class="info-item">
            <span class="label">📋 项目信息：</span>
            <span class="value">{{ projectInfo.name || '带教项目' }}</span>
          </div>
          <div class="info-item">
            <span class="label">👥 参与学员：</span>
            <span class="value">{{ students.length }}名</span>
          </div>
          <div class="info-item">
            <span class="label">📅 项目周期：</span>
            <span class="value">{{ projectInfo.duration || '12个月' }}</span>
          </div>
        </div>
        <div class="selection-tip">
          <el-alert
            title="请选择带教指派模式（一旦选择不可更改）"
            type="warning"
            :closable="false"
            show-icon
          />
        </div>
      </div>

      <div class="mode-options">
        <!-- 项目指派模式 -->
        <div 
          class="mode-card" 
          :class="{ 'selected': selectedMode === 'project' }"
          @click="selectedMode = 'project'"
        >
          <div class="mode-header">
            <div class="mode-icon">🎯</div>
            <div class="mode-title">项目指派模式</div>
          </div>
          <div class="mode-subtitle">固定导师全程负责</div>
          <div class="mode-features">
            <div class="feature">✓ 一对一深度培养</div>
            <div class="feature">✓ 师徒关系稳定</div>
            <div class="feature">✓ 适合技能单一的培养目标</div>
            <div class="feature">✓ 适合新员工入职带教</div>
          </div>
          <div class="mode-example">
            <strong>典型场景：</strong>张三入职Java开发岗位，李老师全程带教1年
          </div>
          <el-button 
            type="primary" 
            :disabled="selectedMode !== 'project'"
            @click="confirmSelection('project')"
          >
            选择项目指派
          </el-button>
        </div>

        <!-- 阶段指派模式 -->
        <div 
          class="mode-card" 
          :class="{ 'selected': selectedMode === 'phase' }"
          @click="selectedMode = 'phase'"
        >
          <div class="mode-header">
            <div class="mode-icon">🔄</div>
            <div class="mode-title">阶段指派模式</div>
          </div>
          <div class="mode-subtitle">分阶段专业导师配置</div>
          <div class="mode-features">
            <div class="feature">✓ 多专业领域覆盖</div>
            <div class="feature">✓ 阶段性深度培养</div>
            <div class="feature">✓ 适合复杂培养体系</div>
            <div class="feature">✓ 适合管培生、三卫项目</div>
          </div>
          <div class="mode-example">
            <strong>典型场景：</strong>管培生项目，10名学员，第一阶段技术专家带教，第二阶段业务专家带教
          </div>
          <el-button 
            type="primary" 
            :disabled="selectedMode !== 'phase'"
            @click="confirmSelection('phase')"
          >
            选择阶段指派
          </el-button>
        </div>
      </div>
    </div>

    <!-- 项目指派管理界面 -->
    <div v-else-if="mentorshipConfig?.assignmentMode === 'project'" class="project-assignment">
      <ProjectAssignmentManagement 
        :project-id="currentProjectId"
        :students="students"
        :mentors="mentors"
        :relationships="relationships"
        :config="mentorshipConfig"
        @assignment-created="handleAssignmentCreated"
        @relationship-removed="handleRelationshipDeleted"
        @mentor-changed="handleMentorChanged"
      />
    </div>

    <!-- 阶段指派管理界面 -->
    <div v-else-if="mentorshipConfig?.assignmentMode === 'phase'" class="phase-assignment">
      <PhaseAssignmentManagement 
        :project-id="currentProjectId"
        :students="students"
        :mentors="mentors"
        :relationships="relationships"
        :phases="projectPhases"
        :config="mentorshipConfig"
        @assignment-created="handleAssignmentCreated"
        @relationship-removed="handleRelationshipDeleted"
      />
    </div>

    <!-- 模式确认对话框 -->
    <el-dialog
      v-model="showConfirmDialog"
      title="确认选择"
      width="500px"
      :close-on-click-modal="false"
    >
      <div class="confirm-content">
        <el-icon class="warning-icon" size="48"><WarningFilled /></el-icon>
        <div class="confirm-text">
          <p>您即将选择 <strong>{{ getModeText(pendingMode) }}</strong>，该选择一旦确认将无法更改。</p>
          <p>请确认这是您需要的指派方式？</p>
        </div>
      </div>
      <template #footer>
        <el-button @click="showConfirmDialog = false">取消</el-button>
        <el-button type="primary" @click="finalizeSelection">确认选择</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, inject } from 'vue'
import { ElMessage } from 'element-plus'
import { WarningFilled } from '@element-plus/icons-vue'
import ProjectAssignmentManagement from './ProjectAssignmentManagement.vue'
import PhaseAssignmentManagement from './PhaseAssignmentManagement.vue'
import { 
  getProjectRelationships,
  createMentorshipRelationship 
} from '@/api/modules/project-mentorship'

// Props
interface Props {
  projectId: string
  students: any[]
  mentors: any[]
  relationships: any[]
  projectPhases?: any[]
}

const props = defineProps<Props>()

// 获取项目ID（从父组件注入或props）
const injectedProjectId = inject<string>('projectId')
const currentProjectId = computed(() => props.projectId || injectedProjectId || '')

// Emits
const emit = defineEmits<{
  assignmentCreated: [data: any]
  relationshipRemoved: [id: string]
}>()

// 响应式数据
const mentorshipConfig = ref<any>(null)
const selectedMode = ref<'project' | 'phase' | null>(null)
const showConfirmDialog = ref(false)
const pendingMode = ref<'project' | 'phase' | null>(null)
const loading = ref(false)

// 项目信息
const projectInfo = ref({
  name: '',
  duration: '12个月'
})

// 使用传入的relationships数据，不再需要本地变量

// 计算属性
const isFirstTimeSetup = computed(() => !mentorshipConfig.value)

// 方法
const getModeText = (mode: 'project' | 'phase' | null) => {
  if (mode === 'project') return '项目指派模式'
  if (mode === 'phase') return '阶段指派模式'
  return ''
}

const confirmSelection = (mode: 'project' | 'phase') => {
  pendingMode.value = mode
  showConfirmDialog.value = true
}

const finalizeSelection = async () => {
  if (!pendingMode.value || !currentProjectId.value) return
  
  loading.value = true
  try {
    console.log('📝 保存带教配置 - 模式:', pendingMode.value, '项目ID:', currentProjectId.value)
    
    // 保存配置到后端
    const configData = {
      projectId: currentProjectId.value,
      assignmentMode: pendingMode.value,
      configuredAt: new Date(),
      configuredBy: 'current-user', // 实际应该从用户信息获取
      isLocked: true
    }
    
    // TODO: 调用保存配置的API
    // await saveMentorshipConfig(configData)
    
    // 模拟API调用
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    mentorshipConfig.value = configData
    showConfirmDialog.value = false
    selectedMode.value = null
    pendingMode.value = null
    
    console.log('✅ 带教配置保存成功')
    ElMessage.success(`已成功设置为${getModeText(configData.assignmentMode)}`)
  } catch (error) {
    console.error('❌ 保存配置失败:', error)
    ElMessage.error('保存配置失败，请重试')
  } finally {
    loading.value = false
  }
}

const handleAssignmentCreated = async (data: any) => {
  console.log('📝 处理师徒关系创建:', data)
  
  try {
    // 调用创建师徒关系API
    if (currentProjectId.value) {
      const response = await createMentorshipRelationship(currentProjectId.value, data)
      console.log('✅ 师徒关系创建成功:', response)
      
      // 重新加载关系数据
      await loadRelationships()
    }
    
    emit('assignmentCreated', data)
  } catch (error) {
    console.error('❌ 创建师徒关系失败:', error)
    ElMessage.error('创建师徒关系失败，请稍后重试')
  }
}

const handleRelationshipDeleted = (id: string) => {
  console.log('🗑️ 处理师徒关系删除:', id)
  emit('relationshipRemoved', id)
}

const handleMentorChanged = (data: any) => {
  console.log('👨‍🏫 处理导师变更:', data)
  // 根据需要更新mentorshipConfig或重新加载配置
  // 例如，如果需要保存导师变更，可以调用一个API
  // await saveMentorshipConfig({ projectId: currentProjectId.value, mentors: data })
  // 然后重新加载配置
  loadMentorshipConfig()
}

// 加载师徒关系数据
const loadRelationships = async () => {
  if (!currentProjectId.value) {
    console.warn('⚠️ 项目ID为空，无法加载师徒关系')
    return
  }
  
  try {
    console.log('🔍 加载项目师徒关系 - 项目ID:', currentProjectId.value)
    const response = await getProjectRelationships(currentProjectId.value)
    // relationships.value = response || [] // This line is removed
    console.log(`✅ 加载师徒关系成功，共${props.relationships.length}条记录`)
  } catch (error) {
    console.error('❌ 加载师徒关系失败:', error)
    // relationships.value = [] // This line is removed
  }
}

const loadMentorshipConfig = async () => {
  if (!currentProjectId.value) {
    console.warn('⚠️ 项目ID为空，无法加载配置')
    return
  }
  
  try {
    console.log('🔍 加载带教配置 - 项目ID:', currentProjectId.value)
    
    // TODO: 调用获取配置的API
    // const config = await getMentorshipConfig(currentProjectId.value)
    
    // 检查是否已有师徒关系来推断配置模式
    await loadRelationships()
    
    if (props.relationships.length > 0) {
      // 检查是否有阶段指派（通过检查是否有phaseId或其他阶段相关字段）
      const hasPhaseAssignments = props.relationships.some(rel => 
        rel.phaseId || rel.scope === 'SPECIFIC_PHASE' || rel.type === 'phase'
      )
      
      const assignmentMode = hasPhaseAssignments ? 'phase' : 'project'
      
      mentorshipConfig.value = {
        projectId: currentProjectId.value,
        assignmentMode: assignmentMode,
        configuredAt: new Date(),
        isLocked: true
      }
      console.log('✅ 从现有关系推断配置模式:', assignmentMode)
    } else {
      // 首次设置
      mentorshipConfig.value = null
      console.log('🔄 首次设置，显示模式选择')
    }
  } catch (error) {
    console.error('❌ 加载配置失败:', error)
    mentorshipConfig.value = null
  }
}

const loadProjectInfo = async () => {
  try {
    // TODO: 从项目API获取项目信息
    // const project = await getProjectInfo(currentProjectId.value)
    
    // 临时Mock数据
    projectInfo.value = {
      name: 'Java开发工程师培养项目',
      duration: '12个月'
    }
    
    console.log('✅ 项目信息加载成功')
  } catch (error) {
    console.error('❌ 加载项目信息失败:', error)
  }
}

// 生命周期
onMounted(async () => {
  console.log('🚀 AssignmentRelationTab 组件挂载，项目ID:', currentProjectId.value)
  if (currentProjectId.value) {
    await Promise.all([
      loadMentorshipConfig(),
      loadProjectInfo()
    ])
  } else {
    console.warn('⚠️ 项目ID为空，无法加载数据')
  }
})

// 为了便于调试，暴露数据到控制台
if (import.meta.env.DEV) {
  ;(window as any).assignmentDebug = {
    projectId: currentProjectId,
    mentorshipConfig,
    // relationships, // This line is removed
    loadRelationships,
    loadMentorshipConfig
  }
}
</script>

<style scoped>
.assignment-relation-tab {
  padding: 20px;
  min-height: 600px;
}

/* 模式选择页面样式 */
.mode-selection {
  max-width: 1000px;
  margin: 0 auto;
}

.selection-header {
  text-align: center;
  margin-bottom: 40px;
}

.selection-header h3 {
  font-size: 24px;
  color: #303133;
  margin-bottom: 20px;
}

.project-info {
  display: flex;
  justify-content: center;
  gap: 40px;
  margin-bottom: 20px;
  flex-wrap: wrap;
}

.info-item {
  display: flex;
  align-items: center;
  gap: 8px;
}

.info-item .label {
  font-weight: 500;
  color: #606266;
}

.info-item .value {
  color: #303133;
  font-weight: 600;
}

.selection-tip {
  max-width: 600px;
  margin: 0 auto;
}

.mode-options {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 30px;
  margin-top: 40px;
}

.mode-card {
  border: 2px solid #e4e7ed;
  border-radius: 12px;
  padding: 30px;
  cursor: pointer;
  transition: all 0.3s ease;
  background: #ffffff;
}

.mode-card:hover {
  border-color: #409eff;
  box-shadow: 0 4px 12px rgba(64, 158, 255, 0.15);
}

.mode-card.selected {
  border-color: #409eff;
  background: #f0f9ff;
  box-shadow: 0 4px 12px rgba(64, 158, 255, 0.2);
}

.mode-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}

.mode-icon {
  font-size: 32px;
  line-height: 1;
}

.mode-title {
  font-size: 20px;
  font-weight: 600;
  color: #303133;
}

.mode-subtitle {
  font-size: 14px;
  color: #606266;
  margin-bottom: 20px;
  font-style: italic;
}

.mode-features {
  margin-bottom: 20px;
}

.feature {
  padding: 4px 0;
  color: #67c23a;
  font-size: 14px;
}

.mode-example {
  background: #f5f7fa;
  padding: 15px;
  border-radius: 6px;
  margin-bottom: 25px;
  font-size: 13px;
  line-height: 1.5;
  color: #606266;
}

.mode-card .el-button {
  width: 100%;
}

/* 确认对话框样式 */
.confirm-content {
  display: flex;
  align-items: flex-start;
  gap: 16px;
  padding: 20px 0;
}

.warning-icon {
  color: #e6a23c;
  flex-shrink: 0;
  margin-top: 4px;
}

.confirm-text {
  flex: 1;
}

.confirm-text p {
  margin: 0 0 12px 0;
  line-height: 1.6;
}

.confirm-text strong {
  color: #409eff;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .mode-options {
    grid-template-columns: 1fr;
    gap: 20px;
  }
  
  .project-info {
    flex-direction: column;
    gap: 16px;
  }
  
  .mode-card {
    padding: 20px;
  }
}
</style> 