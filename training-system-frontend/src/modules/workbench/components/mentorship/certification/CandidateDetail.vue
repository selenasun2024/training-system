<template>
  <div class="candidate-detail">
    <!-- 基本信息 -->
    <div class="detail-section">
      <h4>基本信息</h4>
      <div class="info-grid">
        <div class="info-item">
          <span class="label">姓名：</span>
          <span class="value">{{ candidate.name }}</span>
        </div>
        <div class="info-item">
          <span class="label">部门：</span>
          <span class="value">{{ candidate.department }}</span>
        </div>
        <div class="info-item">
          <span class="label">入职时间：</span>
          <span class="value">{{ formatDate(candidate.hireDate) }}</span>
        </div>
        <div class="info-item">
          <span class="label">工作年限：</span>
          <span class="value">{{ getWorkYears(candidate.hireDate) }}年</span>
        </div>
        <div class="info-item">
          <span class="label">认证年数：</span>
          <span class="value">{{ candidate.certificationYears }}年</span>
        </div>
        <div class="info-item">
          <span class="label">当前状态：</span>
          <el-tag :type="getStatusColor(candidate.status)">
            {{ getStatusText(candidate.status) }}
          </el-tag>
        </div>
      </div>
    </div>

    <!-- 认证条件检查 -->
    <div class="detail-section">
      <h4>认证条件检查</h4>
      <div class="criteria-checks">
        <div class="criteria-item">
          <div class="criteria-header">
            <el-icon :class="candidate.criteria.tenure ? 'check-pass' : 'check-fail'">
              <component :is="candidate.criteria.tenure ? 'CircleCheckFilled' : 'CircleCloseFilled'" />
            </el-icon>
            <span class="criteria-title">入职时间要求</span>
          </div>
          <div class="criteria-detail">
            <span>要求：入职满2年</span>
            <span>实际：{{ getWorkYears(candidate.hireDate) }}年</span>
            <span :class="candidate.criteria.tenure ? 'status-pass' : 'status-fail'">
              {{ candidate.criteria.tenure ? '符合要求' : '不符合要求' }}
            </span>
          </div>
        </div>

        <div class="criteria-item">
          <div class="criteria-header">
            <el-icon :class="candidate.criteria.mentoringCount ? 'check-pass' : 'check-fail'">
              <component :is="candidate.criteria.mentoringCount ? 'CircleCheckFilled' : 'CircleCloseFilled'" />
            </el-icon>
            <span class="criteria-title">带教数量要求</span>
          </div>
          <div class="criteria-detail">
            <span>要求：带教学员≥3人</span>
            <span>实际：{{ candidate.mentoringCount }}人</span>
            <span :class="candidate.criteria.mentoringCount ? 'status-pass' : 'status-fail'">
              {{ candidate.criteria.mentoringCount ? '符合要求' : '不符合要求' }}
            </span>
          </div>
        </div>

        <div class="criteria-item">
          <div class="criteria-header">
            <el-icon :class="candidate.criteria.teachingPlan ? 'check-pass' : 'check-fail'">
              <component :is="candidate.criteria.teachingPlan ? 'CircleCheckFilled' : 'CircleCloseFilled'" />
            </el-icon>
            <span class="criteria-title">教案要求</span>
          </div>
          <div class="criteria-detail">
            <span>要求：具备完整教案</span>
            <span>实际：{{ candidate.hasTeachingPlan ? '已提交' : '未提交' }}</span>
            <span :class="candidate.criteria.teachingPlan ? 'status-pass' : 'status-fail'">
              {{ candidate.criteria.teachingPlan ? '符合要求' : '不符合要求' }}
            </span>
          </div>
        </div>

        <div class="criteria-item">
          <div class="criteria-header">
            <el-icon :class="candidate.criteria.legacyCard ? 'check-pass' : 'check-fail'">
              <component :is="candidate.criteria.legacyCard ? 'CircleCheckFilled' : 'CircleCloseFilled'" />
            </el-icon>
            <span class="criteria-title">传承卡要求</span>
          </div>
          <div class="criteria-detail">
            <span>要求：具有传承卡</span>
            <span>实际：{{ candidate.hasLegacyCard ? '已获得' : '未获得' }}</span>
            <span :class="candidate.criteria.legacyCard ? 'status-pass' : 'status-fail'">
              {{ candidate.criteria.legacyCard ? '符合要求' : '不符合要求' }}
            </span>
          </div>
        </div>
      </div>
    </div>

    <!-- 带教历史 -->
    <div class="detail-section">
      <h4>带教历史</h4>
      <div class="mentoring-history">
        <div v-for="record in mockMentoringHistory" :key="record.id" class="history-item">
          <div class="history-header">
            <span class="student-name">{{ record.studentName }}</span>
            <el-tag :type="record.status === 'completed' ? 'success' : 'warning'" size="small">
              {{ record.status === 'completed' ? '已完成' : '进行中' }}
            </el-tag>
          </div>
          <div class="history-detail">
            <span>项目：{{ record.projectName }}</span>
            <span>时期：{{ formatDate(record.startDate) }} - {{ record.endDate ? formatDate(record.endDate) : '进行中' }}</span>
            <span>评分：{{ record.score || '-' }}分</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 认证建议 -->
    <div class="detail-section">
      <h4>认证建议</h4>
      <div class="recommendation">
        <div v-if="candidate.status === 'qualified'" class="recommendation-pass">
          <el-icon><CircleCheckFilled /></el-icon>
          <span>该候选人满足所有认证条件，建议通过认证。</span>
        </div>
        <div v-else-if="candidate.status === 'partial'" class="recommendation-partial">
          <el-icon><WarningFilled /></el-icon>
          <span>该候选人部分满足认证条件，建议关注缺项并在满足后重新评估。</span>
        </div>
        <div v-else class="recommendation-fail">
          <el-icon><CircleCloseFilled /></el-icon>
          <span>该候选人不满足认证条件，建议继续培养后再申请认证。</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { 
  CircleCheckFilled,
  CircleCloseFilled,
  WarningFilled
} from '@element-plus/icons-vue'

interface Props {
  candidate: any
}

const props = defineProps<Props>()

// 模拟带教历史数据
const mockMentoringHistory = [
  {
    id: 'history1',
    studentName: '张三',
    projectName: 'Java开发工程师培养',
    startDate: new Date('2023-01-15'),
    endDate: new Date('2023-12-15'),
    status: 'completed',
    score: 92
  },
  {
    id: 'history2',
    studentName: '李四',
    projectName: '前端开发培训',
    startDate: new Date('2023-06-01'),
    endDate: new Date('2024-01-01'),
    status: 'completed',
    score: 88
  },
  {
    id: 'history3',
    studentName: '王五',
    projectName: 'Spring Boot进阶',
    startDate: new Date('2024-01-10'),
    endDate: null,
    status: 'ongoing',
    score: null
  }
]

// 方法
const getStatusColor = (status: string) => {
  const colorMap: Record<string, string> = {
    qualified: 'success',
    partial: 'warning',
    unqualified: 'danger',
    certified: 'primary'
  }
  return colorMap[status] || 'info'
}

const getStatusText = (status: string) => {
  const textMap: Record<string, string> = {
    qualified: '满足条件',
    partial: '部分满足',
    unqualified: '不满足条件',
    certified: '已认证'
  }
  return textMap[status] || status
}

const formatDate = (date: Date) => {
  return date.toLocaleDateString('zh-CN')
}

const getWorkYears = (hireDate: Date) => {
  const now = new Date()
  const diffTime = Math.abs(now.getTime() - hireDate.getTime())
  const diffYears = Math.floor(diffTime / (1000 * 60 * 60 * 24 * 365))
  return diffYears
}
</script>

<style scoped>
.candidate-detail {
  padding: 20px;
  max-height: 70vh;
  overflow-y: auto;
}

.detail-section {
  margin-bottom: 30px;
  padding: 20px;
  background: #fafafa;
  border-radius: 8px;
  border: 1px solid #e4e7ed;
}

.detail-section h4 {
  margin: 0 0 16px 0;
  color: #303133;
  font-size: 16px;
  font-weight: 600;
  border-bottom: 2px solid #409eff;
  padding-bottom: 8px;
}

.info-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.info-item {
  display: flex;
  align-items: center;
}

.info-item .label {
  font-weight: 500;
  color: #606266;
  margin-right: 8px;
  min-width: 80px;
}

.info-item .value {
  color: #303133;
  flex: 1;
}

.criteria-checks {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.criteria-item {
  padding: 16px;
  background: #fff;
  border-radius: 8px;
  border: 1px solid #e4e7ed;
}

.criteria-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
}

.criteria-title {
  font-weight: 500;
  color: #303133;
  font-size: 14px;
}

.check-pass {
  color: #67c23a;
  font-size: 18px;
}

.check-fail {
  color: #f56c6c;
  font-size: 18px;
}

.criteria-detail {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-left: 26px;
  font-size: 13px;
}

.status-pass {
  color: #67c23a;
  font-weight: 500;
}

.status-fail {
  color: #f56c6c;
  font-weight: 500;
}

.mentoring-history {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.history-item {
  padding: 16px;
  background: #fff;
  border-radius: 8px;
  border: 1px solid #e4e7ed;
}

.history-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.student-name {
  font-weight: 500;
  color: #303133;
}

.history-detail {
  display: flex;
  justify-content: space-between;
  font-size: 13px;
  color: #606266;
}

.recommendation {
  padding: 16px;
  border-radius: 8px;
}

.recommendation-pass {
  display: flex;
  align-items: center;
  gap: 8px;
  background: #f0f9ff;
  border: 1px solid #b3d8ff;
  color: #1890ff;
  padding: 16px;
  border-radius: 8px;
}

.recommendation-partial {
  display: flex;
  align-items: center;
  gap: 8px;
  background: #fffbf0;
  border: 1px solid #ffe58f;
  color: #fa8c16;
  padding: 16px;
  border-radius: 8px;
}

.recommendation-fail {
  display: flex;
  align-items: center;
  gap: 8px;
  background: #fff2f0;
  border: 1px solid #ffccc7;
  color: #ff4d4f;
  padding: 16px;
  border-radius: 8px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .info-grid {
    grid-template-columns: 1fr;
  }
  
  .criteria-detail {
    flex-direction: column;
    align-items: flex-start;
    gap: 4px;
  }
  
  .history-detail {
    flex-direction: column;
    gap: 4px;
  }
}
</style> 