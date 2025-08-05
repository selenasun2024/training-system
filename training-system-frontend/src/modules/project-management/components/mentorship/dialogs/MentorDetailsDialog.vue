<template>
  <div class="mentor-details-dialog">
    <!-- 导师基本信息 -->
    <div class="mentor-overview">
      <div class="mentor-profile">
        <el-avatar :src="mentor.avatar" :size="80">
          {{ mentor.name.charAt(0) }}
        </el-avatar>
        <div class="profile-info">
          <h3 class="mentor-name">{{ mentor.name }}</h3>
          <div class="mentor-meta">
            <span class="department">{{ mentor.department }}</span>
            <span class="position">{{ mentor.position }}</span>
            <el-tag :type="getMentorTypeTag()" size="small">
              {{ getMentorTypeText() }}
            </el-tag>
          </div>
          <div class="contact-info">
            <span class="email">{{ mentor.email }}</span>
            <span class="entry-date">入职时间：{{ formatDate(mentor.entryDate) }}</span>
          </div>
        </div>
      </div>
      
      <div class="mentor-stats">
        <div class="stat-item">
          <span class="label">总评分</span>
          <el-rate
            :model-value="mentor.rating"
            disabled
            show-score
            text-color="#ff9900"
            score-template="{value} 分"
          />
        </div>
        <div class="stat-item">
          <span class="label">当前负载</span>
          <el-progress
            :percentage="getLoadPercentage()"
            :color="getLoadColor()"
            :format="() => `${workloadData?.currentLoad || 0}/${mentor.maxLoad}`"
          />
        </div>
        <div class="stat-item">
          <span class="label">成功率</span>
          <span class="value">{{ workloadData?.successRate || 0 }}%</span>
        </div>
        <div class="stat-item">
          <span class="label">平均分</span>
          <span class="value">{{ workloadData?.averageScore || 0 }}分</span>
        </div>
      </div>
    </div>

    <!-- Tab切换内容 -->
    <el-tabs v-model="activeTab" type="border-card" class="details-tabs">
      <!-- 认证与技能 -->
      <el-tab-pane label="认证与技能" name="certifications">
        <div class="tab-content">
          <div class="content-section">
            <h4>认证资质</h4>
            <!-- 认证资质表格 -->
            <el-table
              v-if="mentor.certifications.length > 0"
              :data="mentor.certifications"
              style="width: 100%"
              border
              size="small"
            >
              <el-table-column label="认证名称" min-width="180">
                <template #default="{ row }">
                  <div class="cert-name">{{ row.name }}</div>
                </template>
              </el-table-column>

              <el-table-column label="认证类型" width="120">
                <template #default="{ row }">
                  <span class="cert-type">{{ getCertTypeText(row.type) }}</span>
                </template>
              </el-table-column>

              <el-table-column label="状态" width="100">
                <template #default="{ row }">
                  <el-tag :type="getCertStatusType(row)" size="small">
                    {{ getCertStatusText(row) }}
                  </el-tag>
                </template>
              </el-table-column>

              <el-table-column label="颁发日期" width="120">
                <template #default="{ row }">
                  {{ formatDate(row.issueDate) }}
                </template>
              </el-table-column>

              <el-table-column label="过期日期" width="120">
                <template #default="{ row }">
                  <span v-if="row.expiryDate">{{ formatDate(row.expiryDate) }}</span>
                  <span v-else class="no-expiry">永久有效</span>
                </template>
              </el-table-column>

              <el-table-column label="颁发机构" min-width="150">
                <template #default="{ row }">
                  <span>{{ row.issuer || '未记录' }}</span>
                </template>
              </el-table-column>
            </el-table>
            
            <!-- 空状态 -->
            <div v-else class="no-data">
              <el-empty description="暂无认证资质" :image-size="60" />
            </div>
          </div>

          <div class="content-section">
            <h4>专业技能</h4>
            <div class="skills-content">
              <div class="skill-tags">
                <el-tag
                  v-for="skill in mentor.expertise"
                  :key="skill"
                  type="info"
                  size="large"
                  class="skill-tag"
                >
                  {{ skill }}
                </el-tag>
              </div>
              <div v-if="mentor.expertise.length === 0" class="no-data">
                <span>暂未设置专业技能</span>
              </div>
            </div>
          </div>

          <div class="content-section">
            <h4>带教风格</h4>
            <div class="mentor-style">
              <el-tag
                :type="getStyleType(mentor.mentorStyle)"
                size="large"
              >
                {{ getStyleText(mentor.mentorStyle) }}
              </el-tag>
              <span class="style-description">
                {{ getStyleDescription(mentor.mentorStyle) }}
              </span>
            </div>
          </div>
        </div>
      </el-tab-pane>

      <!-- 师徒关系 -->
      <el-tab-pane label="师徒关系" name="relationships">
        <div class="tab-content">
          <div class="relationships-summary">
            <div class="summary-cards">
              <el-card class="summary-card">
                <div class="card-content">
                  <div class="number">{{ activeRelationships.length }}</div>
                  <div class="label">活跃关系</div>
                </div>
              </el-card>
              <el-card class="summary-card">
                <div class="card-content">
                  <div class="number">{{ completedRelationships.length }}</div>
                  <div class="label">已完成</div>
                </div>
              </el-card>
              <el-card class="summary-card">
                <div class="card-content">
                  <div class="number">{{ totalRelationships.length }}</div>
                  <div class="label">总计</div>
                </div>
              </el-card>
            </div>
          </div>

          <div class="relationships-table">
            <el-table :data="relationships" style="width: 100%">
              <el-table-column label="学员姓名" min-width="120">
                <template #default="{ row }">
                  <div class="student-cell">
                    <span class="name">学员姓名</span>
                    <span class="id">ID: {{ row.studentId }}</span>
                  </div>
                </template>
              </el-table-column>
              
              <el-table-column label="关系类型" width="100">
                <template #default="{ row }">
                  <el-tag
                    :type="row.type === 'academy_certified' ? 'success' : 'info'"
                    size="small"
                  >
                    {{ row.type === 'academy_certified' ? '书院认证' : '部门指定' }}
                  </el-tag>
                </template>
              </el-table-column>
              
              <el-table-column label="带教范围" width="100">
                <template #default="{ row }">
                  {{ row.scope === 'full_project' ? '全项目' : '特定阶段' }}
                </template>
              </el-table-column>
              
              <el-table-column label="建立时间" width="120">
                <template #default="{ row }">
                  {{ formatDate(row.establishedDate) }}
                </template>
              </el-table-column>
              
              <el-table-column label="预期时长" width="100">
                <template #default="{ row }">
                  {{ row.expectedDuration }}个月
                </template>
              </el-table-column>
              
              <el-table-column label="状态" width="100">
                <template #default="{ row }">
                  <el-tag
                    :type="getRelationStatusType(row.status)"
                    size="small"
                  >
                    {{ getRelationStatusText(row.status) }}
                  </el-tag>
                </template>
              </el-table-column>
              
              <el-table-column label="操作" width="120">
                <template #default="{ row }">
                  <el-button
                    type="primary"
                    size="small"
                    @click="viewRelationshipDetails(row)"
                  >
                    查看详情
                  </el-button>
                </template>
              </el-table-column>
            </el-table>
          </div>
        </div>
      </el-tab-pane>

      <!-- 可用性设置 -->
      <el-tab-pane label="可用性设置" name="availability">
        <div class="tab-content">
          <div class="availability-settings">
            <div class="content-section">
              <h4>工作日安排</h4>
              <div class="weekdays-settings">
                <el-checkbox-group v-model="availabilityForm.weekdays">
                  <el-checkbox label="周一">周一</el-checkbox>
                  <el-checkbox label="周二">周二</el-checkbox>
                  <el-checkbox label="周三">周三</el-checkbox>
                  <el-checkbox label="周四">周四</el-checkbox>
                  <el-checkbox label="周五">周五</el-checkbox>
                  <el-checkbox label="周六">周六</el-checkbox>
                  <el-checkbox label="周日">周日</el-checkbox>
                </el-checkbox-group>
              </div>
            </div>

            <div class="content-section">
              <h4>时间段</h4>
              <div class="time-slots-settings">
                <el-checkbox-group v-model="availabilityForm.timeSlots">
                  <el-checkbox label="上午 9:00-12:00">上午 9:00-12:00</el-checkbox>
                  <el-checkbox label="下午 14:00-17:00">下午 14:00-17:00</el-checkbox>
                  <el-checkbox label="晚上 19:00-21:00">晚上 19:00-21:00</el-checkbox>
                </el-checkbox-group>
              </div>
            </div>

            <div class="content-section">
              <h4>负载限制</h4>
              <div class="load-settings">
                <el-form :model="availabilityForm" label-width="120px">
                  <el-form-item label="最大负载">
                    <el-input-number
                      v-model="availabilityForm.maxLoad"
                      :min="1"
                      :max="20"
                    />
                    <span style="margin-left: 8px; color: #909399;">人</span>
                  </el-form-item>
                  <el-form-item label="当前状态">
                    <el-switch
                      v-model="availabilityForm.isActive"
                      active-text="接收新学员"
                      inactive-text="暂停接收"
                    />
                  </el-form-item>
                </el-form>
              </div>
            </div>

            <div class="form-actions">
              <el-button type="primary" @click="saveAvailabilitySettings">
                保存设置
              </el-button>
              <el-button @click="resetAvailabilitySettings">
                重置
              </el-button>
            </div>
          </div>
        </div>
      </el-tab-pane>

      <!-- 绩效分析 -->
      <el-tab-pane label="绩效分析" name="performance">
        <div class="tab-content">
          <div class="performance-metrics">
            <div class="metrics-grid">
              <el-card class="metric-card">
                <div class="metric-header">
                  <h4>带教成功率</h4>
                  <el-icon><TrendCharts /></el-icon>
                </div>
                <div class="metric-content">
                  <div class="percentage">{{ workloadData?.successRate || 0 }}%</div>
                  <div class="description">学员成功完成带教比例</div>
                </div>
              </el-card>

              <el-card class="metric-card">
                <div class="metric-header">
                  <h4>平均评分</h4>
                  <el-icon><Star /></el-icon>
                </div>
                <div class="metric-content">
                  <div class="percentage">{{ workloadData?.averageScore || 0 }}分</div>
                  <div class="description">学员对导师的平均评分</div>
                </div>
              </el-card>

              <el-card class="metric-card">
                <div class="metric-header">
                  <h4>活跃度</h4>
                  <el-icon><Connection /></el-icon>
                </div>
                <div class="metric-content">
                  <div class="percentage">{{ getActivityPercentage() }}%</div>
                  <div class="description">相对于其他导师的活跃度</div>
                </div>
              </el-card>

              <el-card class="metric-card">
                <div class="metric-header">
                  <h4>效率指数</h4>
                  <el-icon><Timer /></el-icon>
                </div>
                <div class="metric-content">
                  <div class="percentage">{{ getEfficiencyIndex() }}</div>
                  <div class="description">带教效率综合指数</div>
                </div>
              </el-card>
            </div>
          </div>

          <div class="performance-trends">
            <h4>趋势分析</h4>
            <div class="trend-placeholder">
              <el-empty description="趋势图表开发中..." :image-size="80" />
            </div>
          </div>
        </div>
      </el-tab-pane>
    </el-tabs>

    <!-- 对话框底部 -->
    <template #footer>
      <div class="dialog-footer">
        <el-button @click="handleClose">关闭</el-button>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { TrendCharts, Star, Connection, Timer } from '@element-plus/icons-vue'
import type { 
  Mentor, 
  ProjectMentorRelationship, 
  MentorWorkload,
  Certification 
} from '../../types/mentorship'
import { formatDate } from '@/utils/dateUtils'

// Props
interface Props {
  mentor: Mentor
  relationships: ProjectMentorRelationship[]
  workloadData?: MentorWorkload
}

const props = defineProps<Props>()

// 响应式数据
const activeTab = ref('certifications')

// 可用性设置表单
const availabilityForm = reactive({
  weekdays: [...props.mentor.availability.weekdays],
  timeSlots: [...props.mentor.availability.timeSlots],
  maxLoad: props.mentor.maxLoad,
  isActive: props.mentor.status === 'active'
})

// 计算属性
const activeRelationships = computed(() => 
  props.relationships.filter(rel => rel.status === 'active')
)

const completedRelationships = computed(() => 
  props.relationships.filter(rel => rel.status === 'completed')
)

const totalRelationships = computed(() => props.relationships)

// 方法
const getMentorTypeTag = (): string => {
  const hasAcademyCert = props.mentor.certifications.some(c => c.type === 'academy')
  return hasAcademyCert ? 'success' : 'info'
}

const getMentorTypeText = (): string => {
  const hasAcademyCert = props.mentor.certifications.some(c => c.type === 'academy')
  return hasAcademyCert ? '书院认证导师' : '部门指定导师'
}

const getLoadPercentage = (): number => {
  if (!props.workloadData || props.mentor.maxLoad === 0) return 0
  return Math.round((props.workloadData.currentLoad / props.mentor.maxLoad) * 100)
}

const getLoadColor = (): string => {
  const percentage = getLoadPercentage()
  if (percentage >= 90) return '#f56c6c'
  if (percentage >= 75) return '#e6a23c'
  return '#67c23a'
}

const isCertExpired = (cert: Certification): boolean => {
  return cert.status === 'expired' || 
    (cert.expiryDate && new Date(cert.expiryDate) < new Date())
}

const getCertStatusType = (cert: Certification): string => {
  if (cert.status === 'expired' || isCertExpired(cert)) return 'danger'
  if (cert.status === 'revoked') return 'danger'
  return 'success'
}

const getCertStatusText = (cert: Certification): string => {
  if (cert.status === 'expired' || isCertExpired(cert)) return '已过期'
  if (cert.status === 'revoked') return '已撤销'
  return '有效'
}

const getCertTypeText = (type: string): string => {
  const typeMap: Record<string, string> = {
    academy: '书院认证',
    internal: '内部认证',
    professional: '专业认证'
  }
  return typeMap[type] || type
}

const getStyleType = (style: string): string => {
  const typeMap: Record<string, string> = {
    strict: 'warning',
    gentle: 'success',
    balanced: 'info'
  }
  return typeMap[style] || 'info'
}

const getStyleText = (style: string): string => {
  const textMap: Record<string, string> = {
    strict: '严格型',
    gentle: '温和型',
    balanced: '平衡型'
  }
  return textMap[style] || style
}

const getStyleDescription = (style: string): string => {
  const descMap: Record<string, string> = {
    strict: '注重纪律和标准，严格要求学员按计划执行',
    gentle: '温和耐心，注重情感沟通和个性化指导',
    balanced: '严慈相济，根据情况灵活调整带教方式'
  }
  return descMap[style] || ''
}

const getRelationStatusType = (status: string): string => {
  const typeMap: Record<string, string> = {
    active: 'success',
    paused: 'warning',
    completed: 'info',
    terminated: 'danger'
  }
  return typeMap[status] || 'info'
}

const getRelationStatusText = (status: string): string => {
  const textMap: Record<string, string> = {
    active: '进行中',
    paused: '暂停',
    completed: '已完成',
    terminated: '已终止'
  }
  return textMap[status] || status
}

const getActivityPercentage = (): number => {
  // 模拟计算活跃度
  const baseActivity = activeRelationships.value.length * 20
  const ratingBonus = props.mentor.rating * 5
  return Math.min(Math.round(baseActivity + ratingBonus), 100)
}

const getEfficiencyIndex = (): string => {
  // 模拟计算效率指数
  const successRate = props.workloadData?.successRate || 0
  const avgScore = props.workloadData?.averageScore || 0
  const efficiency = (successRate + avgScore) / 20
  return efficiency.toFixed(1)
}

// 事件处理
const viewRelationshipDetails = (relationship: ProjectMentorRelationship) => {
  ElMessage.info(`查看师徒关系详情: ${relationship.id}`)
}

const saveAvailabilitySettings = () => {
  // 保存可用性设置
  console.log('保存可用性设置:', availabilityForm)
  ElMessage.success('可用性设置已保存')
  emits('update-availability', availabilityForm)
}

const resetAvailabilitySettings = () => {
  // 重置为原始设置
  availabilityForm.weekdays = [...props.mentor.availability.weekdays]
  availabilityForm.timeSlots = [...props.mentor.availability.timeSlots]
  availabilityForm.maxLoad = props.mentor.maxLoad
  availabilityForm.isActive = props.mentor.status === 'active'
  ElMessage.info('已重置为原始设置')
}

const handleClose = () => {
  emits('close')
}

// 事件定义
const emits = defineEmits<{
  close: []
  'update-availability': [data: any]
}>()

// 生命周期
onMounted(() => {
  console.log('导师详情对话框已加载:', props.mentor.name)
})
</script>

<style scoped>
.mentor-details-dialog {
  padding: 20px;
}

.mentor-overview {
  display: flex;
  gap: 20px;
  margin-bottom: 20px;
  padding: 20px;
  background: #f8f9fa;
  border-radius: 8px;
}

.mentor-profile {
  display: flex;
  gap: 16px;
  flex: 1;
}

.profile-info {
  flex: 1;
}

.mentor-name {
  margin: 0 0 8px 0;
  color: #303133;
}

.mentor-meta {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 8px;
}

.department {
  font-weight: 500;
  color: #606266;
}

.position {
  color: #909399;
  font-size: 14px;
}

.contact-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
  font-size: 13px;
  color: #909399;
}

.mentor-stats {
  display: flex;
  flex-direction: column;
  gap: 16px;
  min-width: 240px;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 12px;
}

.stat-item .label {
  min-width: 60px;
  font-size: 12px;
  color: #606266;
}

.stat-item .value {
  font-weight: 600;
  color: #303133;
}

.details-tabs {
  border-radius: 8px;
}

.tab-content {
  padding: 20px;
}

.content-section {
  margin-bottom: 24px;
}

.content-section h4 {
  margin: 0 0 12px 0;
  color: #303133;
  font-size: 14px;
  font-weight: 600;
}

.cert-name {
  font-size: 14px;
  font-weight: 600;
  color: #303133;
}

.cert-type {
  font-size: 12px;
  color: #606266;
}

.no-expiry {
  font-size: 12px;
  color: #909399;
  font-style: italic;
}

.cert-type {
  font-size: 12px;
  color: #909399;
}

.cert-dates {
  display: flex;
  flex-direction: column;
  gap: 2px;
  font-size: 12px;
  color: #909399;
}

.skills-content {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.skill-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.skill-tag {
  font-size: 13px;
  padding: 4px 12px;
}

.mentor-style {
  display: flex;
  align-items: center;
  gap: 12px;
}

.style-description {
  color: #606266;
  font-size: 13px;
}

.relationships-summary {
  margin-bottom: 20px;
}

.summary-cards {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
}

.summary-card :deep(.el-card__body) {
  padding: 16px;
  text-align: center;
}

.card-content .number {
  font-size: 24px;
  font-weight: bold;
  color: #409eff;
  margin-bottom: 4px;
}

.card-content .label {
  font-size: 12px;
  color: #909399;
}

.student-cell {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.student-cell .name {
  color: #303133;
}

.student-cell .id {
  font-size: 12px;
  color: #909399;
}

.availability-settings {
  max-width: 600px;
}

.weekdays-settings,
.time-slots-settings {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.load-settings {
  max-width: 400px;
}

.form-actions {
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px solid #f0f0f0;
  display: flex;
  gap: 12px;
}

.performance-metrics {
  margin-bottom: 24px;
}

.metrics-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
}

.metric-card :deep(.el-card__body) {
  padding: 20px;
}

.metric-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.metric-header h4 {
  margin: 0;
  font-size: 14px;
  color: #303133;
}

.metric-content .percentage {
  font-size: 24px;
  font-weight: bold;
  color: #409eff;
  margin-bottom: 4px;
}

.metric-content .description {
  font-size: 12px;
  color: #909399;
}

.performance-trends h4 {
  margin: 0 0 16px 0;
  color: #303133;
}

.trend-placeholder {
  height: 200px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #fafafa;
  border-radius: 8px;
}

.no-data {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 20px;
  color: #909399;
  font-style: italic;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
}

:deep(.el-tabs__content) {
  overflow: visible;
}
</style> 