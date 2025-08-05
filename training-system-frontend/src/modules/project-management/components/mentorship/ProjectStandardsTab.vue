<template>
  <div class="project-standards-tab">
    <!-- 项目信息和标准匹配 -->
    <div class="project-info-section">
      <el-card class="info-card">
        <div class="project-info">
          <div class="info-item">
            <span class="label">项目类型：</span>
            <el-tag :type="getProjectTypeColor(currentProjectType)" size="large">
              {{ getProjectTypeName(currentProjectType) }}
            </el-tag>
          </div>
          <div class="info-item">
            <span class="label">适用标准：</span>
            <span class="value">{{ getCurrentStandardName() }}</span>
          </div>
          <div class="info-item">
            <span class="label">标准说明：</span>
            <span class="description">{{ getCurrentStandardDescription() }}</span>
          </div>
        </div>
      </el-card>
    </div>

    <!-- 带教标准内容 -->
    <div class="standards-content">
      <div class="content-header">
        <h4>{{ getCurrentStandardName() }}</h4>
        <el-select 
          v-model="currentProjectType" 
          placeholder="选择项目类型"
          style="width: 200px;"
          @change="handleProjectTypeChange"
        >
          <el-option label="新员工带教" value="new_employee" />
          <el-option label="管培生项目" value="management_trainee" />
          <el-option label="三卫项目" value="sanwei" />
        </el-select>
      </div>

      <!-- 标准表格 -->
      <el-table 
        :data="currentStandards" 
        style="width: 100%" 
        border
        v-loading="loading"
        :span-method="spanMethod"
        class="standards-table"
      >
        <el-table-column label="时间节点" width="150" align="center">
          <template #default="{ row }">
            <div class="time-point">{{ row.timePoint }}</div>
          </template>
        </el-table-column>

        <el-table-column label="维度" width="120" align="center">
          <template #default="{ row }">
            <div class="dimension">{{ row.dimension }}</div>
          </template>
        </el-table-column>

        <el-table-column label="项目" min-width="400">
          <template #default="{ row }">
            <div class="project-content">{{ row.project }}</div>
          </template>
        </el-table-column>

        <el-table-column label="要求" width="150" align="center">
          <template #default="{ row }">
            <div class="requirement">{{ row.requirement }}</div>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <!-- 标准说明 -->
    <div class="standards-notes">
      <el-card>
        <template #header>
          <span class="notes-title">📋 标准说明</span>
        </template>
        <div class="notes-content">
          <div v-for="note in getCurrentNotes()" :key="note.title" class="note-item">
            <h6>{{ note.title }}</h6>
            <p>{{ note.content }}</p>
          </div>
        </div>
      </el-card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'

// Props
interface Props {
  projectId?: string
}

const props = defineProps<Props>()

// 响应式数据
const loading = ref(false)
const currentProjectType = ref('new_employee') // 默认为新员工带教

// 带教标准数据配置
const standardsConfig = {
  new_employee: {
    name: '新员工带教标准',
    description: '适用于新入职员工的带教标准，涵盖认识、技能、文化和人文四个维度',
    color: 'success',
    standards: [
      { timePoint: '入职当日', dimension: '认识', project: '带教老师明确表达：我是你的带教老师，接下来一年时间我会对你的成长负责任。', requirement: '' },
      { timePoint: '入职一周内', dimension: '认识', project: '带领老师带领熟悉工作环境，并共同就餐一次。', requirement: '' },
      { timePoint: '入职3个月之内', dimension: '技能', project: '一对一带教时长', requirement: '>=4小时/周' },
      { timePoint: '入职4-12月', dimension: '文化和人文', project: '面对面沟通：带教老师主动正式谈心，关心工作生活情况，情绪', requirement: '>=3次/月' },
      { timePoint: '入职4-12月', dimension: '文化和人文', project: '和带教老师共餐次数', requirement: '>=5次' }
    ],
    notes: [
      {
        title: '带教周期',
        content: '新员工带教周期为12个月，从入职当日开始计算，至入职满一年结束。'
      },
      {
        title: '评价节点',
        content: '转正评价（3个月）和年度评价（12个月）两个关键节点进行全面评估。'
      },
      {
        title: '带教要求',
        content: '带教老师需要在技能传授、工作适应、文化融入等方面给予全方位指导。'
      }
    ]
  },
  management_trainee: {
    name: '管培生带教标准',
    description: '适用于管理培训生的多维度、多阶段带教标准',
    color: 'warning',
    standards: [
      { timePoint: '第一阶段（1-3月）', dimension: '认识', project: '企业文化和价值观深度学习，公司战略和组织架构了解', requirement: '完成度100%' },
      { timePoint: '第一阶段（1-3月）', dimension: '技能', project: '基础业务技能培养，岗位核心能力建设', requirement: '>=8小时/周' },
      { timePoint: '第二阶段（4-8月）', dimension: '技能', project: '跨部门轮岗实践，多业务领域接触', requirement: '>=2个部门' },
      { timePoint: '第二阶段（4-8月）', dimension: '文化和人文', project: '带教老师深度辅导，定期反馈和指导', requirement: '>=2次/月' },
      { timePoint: '第三阶段（9-12月）', dimension: '技能', project: '独立项目承担，管理能力锻炼', requirement: '>=1个项目' },
      { timePoint: '第三阶段（9-12月）', dimension: '文化和人文', project: '领导力培养，团队协作能力提升', requirement: '通过评估' }
    ],
    notes: [
      {
        title: '培养目标',
        content: '培养具备管理潜力的复合型人才，为公司储备管理梯队。'
      },
      {
        title: '轮岗机制',
        content: '通过多部门轮岗，全面了解公司业务，培养全局视野。'
      },
      {
        title: '评价标准',
        content: '综合考核业务能力、管理潜力、文化认同和团队协作等维度。'
      }
    ]
  },
  sanwei: {
    name: '三卫项目带教标准',
    description: '适用于"三卫"（卫生、卫安、卫康）项目的专业化带教标准',
    color: 'danger',
    standards: [
      { timePoint: '第一月', dimension: '认识', project: '三卫理念深度学习，安全意识和责任意识建立', requirement: '100%掌握' },
      { timePoint: '第一月', dimension: '技能', project: '专业技能基础培训，操作规范学习', requirement: '>=10小时/周' },
      { timePoint: '第2-3月', dimension: '技能', project: '实地操作训练，安全流程熟练掌握', requirement: '>=15小时/周' },
      { timePoint: '第2-3月', dimension: '文化和人文', project: '师傅带徒实践，一对一指导', requirement: '>=5次/月' },
      { timePoint: '第4-6月', dimension: '技能', project: '独立值班能力，应急处理能力培养', requirement: '通过考核' },
      { timePoint: '第4-6月', dimension: '文化和人文', project: '团队协作精神，责任担当意识强化', requirement: '>=3次/月' }
    ],
    notes: [
      {
        title: '安全第一',
        content: '三卫项目以安全为核心，所有培训和实践都要以安全为前提。'
      },
      {
        title: '实践导向',
        content: '注重实际操作能力培养，理论与实践相结合。'
      },
      {
        title: '责任意识',
        content: '培养强烈的责任感和使命感，确保各项安全保障工作到位。'
      }
    ]
  }
}

// 计算属性
const currentStandards = computed(() => {
  return standardsConfig[currentProjectType.value]?.standards || []
})

// 方法
const getProjectTypeColor = (type: string) => {
  return standardsConfig[type]?.color || 'info'
}

const getProjectTypeName = (type: string) => {
  return standardsConfig[type]?.name || '未知类型'
}

const getCurrentStandardName = () => {
  return standardsConfig[currentProjectType.value]?.name || ''
}

const getCurrentStandardDescription = () => {
  return standardsConfig[currentProjectType.value]?.description || ''
}

const getCurrentNotes = () => {
  return standardsConfig[currentProjectType.value]?.notes || []
}

const handleProjectTypeChange = (newType: string) => {
  console.log('切换项目类型:', newType)
  ElMessage.success(`已切换到 ${getProjectTypeName(newType)} 标准`)
}

// 表格合并单元格方法
const spanMethod = ({ row, column, rowIndex, columnIndex }) => {
  if (columnIndex === 0) { // 时间节点列
    const timePoint = row.timePoint
    const standards = currentStandards.value
    
    // 找到相同时间节点的第一行索引
    const firstIndex = standards.findIndex(item => item.timePoint === timePoint)
    if (firstIndex === rowIndex) {
      // 计算相同时间节点的行数
      const count = standards.filter(item => item.timePoint === timePoint).length
      return {
        rowspan: count,
        colspan: 1
      }
    } else {
      return {
        rowspan: 0,
        colspan: 0
      }
    }
  }
  
  if (columnIndex === 1) { // 维度列
    const timePoint = row.timePoint
    const dimension = row.dimension
    const standards = currentStandards.value
    
    // 在相同时间节点内，找到相同维度的第一行
    const sameTimeStandards = standards.filter(item => item.timePoint === timePoint)
    const firstDimensionIndex = standards.findIndex(item => 
      item.timePoint === timePoint && item.dimension === dimension
    )
    
    if (firstDimensionIndex === rowIndex) {
      const count = sameTimeStandards.filter(item => item.dimension === dimension).length
      return {
        rowspan: count,
        colspan: 1
      }
    } else {
      return {
        rowspan: 0,
        colspan: 0
      }
    }
  }
}

// 根据项目ID自动识别项目类型（模拟实现）
const detectProjectType = () => {
  // 实际开发中应该从项目信息中获取
  // 默认显示新员工带教标准，因为这是最常用的标准
  currentProjectType.value = 'new_employee'
  
  // 如果有具体的项目信息，可以根据项目类型进行自动匹配
  // 例如：
  // if (projectInfo.type === 'management_trainee') {
  //   currentProjectType.value = 'management_trainee'
  // } else if (projectInfo.type === 'sanwei') {
  //   currentProjectType.value = 'sanwei'
  // }
}

// 生命周期
onMounted(() => {
  // 加载项目信息并自动匹配带教标准
  detectProjectType()
  console.log('加载项目带教标准:', props.projectId, currentProjectType.value)
})
</script>

<style scoped>
.project-standards-tab {
  padding: 20px;
}

/* 项目信息区域 */
.project-info-section {
  margin-bottom: 24px;
}

.info-card {
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.project-info {
  display: flex;
  gap: 32px;
  align-items: center;
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
  font-size: 14px;
}

.info-item .value {
  font-weight: 600;
  color: #303133;
  font-size: 14px;
}

.info-item .description {
  color: #909399;
  font-size: 13px;
  max-width: 300px;
}

/* 标准内容区域 */
.standards-content {
  margin-bottom: 24px;
}

.content-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.content-header h4 {
  margin: 0;
  color: #303133;
  font-size: 18px;
  font-weight: 600;
}

/* 标准表格 */
.standards-table {
  border-radius: 8px;
  overflow: hidden;
}

:deep(.standards-table .el-table__header) {
  background-color: #fafafa;
}

:deep(.standards-table .el-table__row) {
  transition: background-color 0.2s;
}

:deep(.standards-table .el-table__row:hover) {
  background-color: #f5f7fa;
}

.time-point {
  font-weight: 600;
  color: #409eff;
  font-size: 14px;
  text-align: center;
  padding: 8px;
  background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
  border-radius: 6px;
  border: 1px solid #b3e5fc;
}

.dimension {
  font-weight: 500;
  color: #606266;
  text-align: center;
  padding: 6px 12px;
  background: #f8f9fa;
  border-radius: 4px;
  border: 1px solid #e9ecef;
}

.project-content {
  line-height: 1.6;
  color: #303133;
  padding: 8px 12px;
  font-size: 14px;
}

.requirement {
  font-weight: 600;
  color: #e6a23c;
  text-align: center;
  padding: 6px 8px;
  background: #fdf6ec;
  border-radius: 4px;
  border: 1px solid #f5dab1;
  font-size: 13px;
}

/* 标准说明区域 */
.standards-notes {
  margin-top: 24px;
}

.notes-title {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
  display: flex;
  align-items: center;
  gap: 8px;
}

.notes-content {
  padding: 16px 0;
}

.note-item {
  margin-bottom: 16px;
  padding: 12px;
  background: #f8f9fa;
  border-radius: 6px;
  border-left: 4px solid #409eff;
}

.note-item:last-child {
  margin-bottom: 0;
}

.note-item h6 {
  margin: 0 0 8px 0;
  font-size: 14px;
  font-weight: 600;
  color: #303133;
}

.note-item p {
  margin: 0;
  font-size: 13px;
  line-height: 1.5;
  color: #606266;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .project-info {
    flex-direction: column;
    gap: 16px;
    align-items: flex-start;
  }
  
  .content-header {
    flex-direction: column;
    gap: 12px;
    align-items: flex-start;
  }
  
  .info-item .description {
    max-width: none;
  }
}

/* 表格单元格边框优化 */
:deep(.standards-table .el-table td) {
  border-color: #f0f0f0;
}

:deep(.standards-table .el-table th) {
  border-color: #f0f0f0;
  background-color: #fafafa;
  font-weight: 600;
  color: #303133;
}

/* 合并单元格的样式调整 */
:deep(.standards-table .el-table__row .time-point) {
  margin: 0;
}

:deep(.standards-table .el-table__row .dimension) {
  margin: 0;
}
</style> 