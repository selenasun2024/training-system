<template>
  <div class="requirements-list">
    <div class="candidate-info">
      <h4>候选人信息</h4>
      <div class="info-summary">
        <span><strong>姓名：</strong>{{ candidate.name }}</span>
        <span><strong>部门：</strong>{{ candidate.department }}</span>
        <span><strong>当前状态：</strong>
          <el-tag :type="getStatusColor(candidate.status)">
            {{ getStatusText(candidate.status) }}
          </el-tag>
        </span>
      </div>
    </div>

    <div class="requirements-section">
      <h4>认证条件对比</h4>
      <div class="requirements-grid">
        <!-- 入职时间要求 -->
        <div class="requirement-item" :class="candidate.criteria.tenure ? 'requirement-pass' : 'requirement-fail'">
          <div class="requirement-header">
            <el-icon class="status-icon">
              <component :is="candidate.criteria.tenure ? 'CircleCheckFilled' : 'CircleCloseFilled'" />
            </el-icon>
            <span class="requirement-title">入职时间要求</span>
          </div>
          <div class="requirement-content">
            <div class="requirement-standard">
              <span class="label">标准要求：</span>
              <span class="value">入职满2年</span>
            </div>
            <div class="requirement-actual">
              <span class="label">实际情况：</span>
              <span class="value">{{ getWorkYears(candidate.hireDate) }}年</span>
            </div>
            <div class="requirement-gap" v-if="!candidate.criteria.tenure">
              <span class="label">缺项说明：</span>
              <span class="gap-text">还需 {{ 2 - getWorkYears(candidate.hireDate) }}年 才能满足入职时间要求</span>
            </div>
          </div>
        </div>

        <!-- 带教数量要求 -->
        <div class="requirement-item" :class="candidate.criteria.mentoringCount ? 'requirement-pass' : 'requirement-fail'">
          <div class="requirement-header">
            <el-icon class="status-icon">
              <component :is="candidate.criteria.mentoringCount ? 'CircleCheckFilled' : 'CircleCloseFilled'" />
            </el-icon>
            <span class="requirement-title">带教数量要求</span>
          </div>
          <div class="requirement-content">
            <div class="requirement-standard">
              <span class="label">标准要求：</span>
              <span class="value">带教学员≥3人</span>
            </div>
            <div class="requirement-actual">
              <span class="label">实际情况：</span>
              <span class="value">{{ candidate.mentoringCount }}人</span>
            </div>
            <div class="requirement-gap" v-if="!candidate.criteria.mentoringCount">
              <span class="label">缺项说明：</span>
              <span class="gap-text">还需带教 {{ 3 - candidate.mentoringCount }}人 才能满足数量要求</span>
            </div>
          </div>
        </div>

        <!-- 教案要求 -->
        <div class="requirement-item" :class="candidate.criteria.teachingPlan ? 'requirement-pass' : 'requirement-fail'">
          <div class="requirement-header">
            <el-icon class="status-icon">
              <component :is="candidate.criteria.teachingPlan ? 'CircleCheckFilled' : 'CircleCloseFilled'" />
            </el-icon>
            <span class="requirement-title">教案要求</span>
          </div>
          <div class="requirement-content">
            <div class="requirement-standard">
              <span class="label">标准要求：</span>
              <span class="value">具备完整教案</span>
            </div>
            <div class="requirement-actual">
              <span class="label">实际情况：</span>
              <span class="value">{{ candidate.hasTeachingPlan ? '已提交' : '未提交' }}</span>
            </div>
            <div class="requirement-gap" v-if="!candidate.criteria.teachingPlan">
              <span class="label">缺项说明：</span>
              <span class="gap-text">需要提交完整的教学计划和教案</span>
            </div>
          </div>
        </div>

        <!-- 传承卡要求 -->
        <div class="requirement-item" :class="candidate.criteria.legacyCard ? 'requirement-pass' : 'requirement-fail'">
          <div class="requirement-header">
            <el-icon class="status-icon">
              <component :is="candidate.criteria.legacyCard ? 'CircleCheckFilled' : 'CircleCloseFilled'" />
            </el-icon>
            <span class="requirement-title">传承卡要求</span>
          </div>
          <div class="requirement-content">
            <div class="requirement-standard">
              <span class="label">标准要求：</span>
              <span class="value">具有传承卡</span>
            </div>
            <div class="requirement-actual">
              <span class="label">实际情况：</span>
              <span class="value">{{ candidate.hasLegacyCard ? '已获得' : '未获得' }}</span>
            </div>
            <div class="requirement-gap" v-if="!candidate.criteria.legacyCard">
              <span class="label">缺项说明：</span>
              <span class="gap-text">需要获得传承卡认定</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 改进建议 -->
    <div class="improvement-section">
      <h4>改进建议</h4>
      <div class="suggestions-list">
        <div v-if="!candidate.criteria.tenure" class="suggestion-item">
          <el-icon class="suggestion-icon"><Clock /></el-icon>
          <div class="suggestion-content">
            <div class="suggestion-title">入职时间要求</div>
            <div class="suggestion-text">建议继续在当前岗位积累经验，等满足入职时间要求后再申请认证。</div>
          </div>
        </div>

        <div v-if="!candidate.criteria.mentoringCount" class="suggestion-item">
          <el-icon class="suggestion-icon"><User /></el-icon>
          <div class="suggestion-content">
            <div class="suggestion-title">增加带教经验</div>
            <div class="suggestion-text">主动申请带教机会，积累更多带教经验和学员反馈。</div>
          </div>
        </div>

        <div v-if="!candidate.criteria.teachingPlan" class="suggestion-item">
          <el-icon class="suggestion-icon"><Document /></el-icon>
          <div class="suggestion-content">
            <div class="suggestion-title">完善教案材料</div>
            <div class="suggestion-text">制作完整的教学计划，包括课程大纲、教学目标、教学方法等。</div>
          </div>
        </div>

        <div v-if="!candidate.criteria.legacyCard" class="suggestion-item">
          <el-icon class="suggestion-icon"><Medal /></el-icon>
          <div class="suggestion-content">
            <div class="suggestion-title">申请传承卡</div>
            <div class="suggestion-text">通过优秀的带教表现和专业技能展示来获得传承卡认定。</div>
          </div>
        </div>

        <div v-if="isAllQualified" class="suggestion-item qualified">
          <el-icon class="suggestion-icon"><CircleCheckFilled /></el-icon>
          <div class="suggestion-content">
            <div class="suggestion-title">满足所有条件</div>
            <div class="suggestion-text">恭喜！该候选人已满足所有认证条件，建议立即进行认证。</div>
          </div>
        </div>
      </div>
    </div>

    <!-- 认证路径 -->
    <div class="pathway-section">
      <h4>认证路径</h4>
      <div class="pathway-timeline">
        <div class="timeline-item" :class="candidate.criteria.tenure ? 'completed' : 'pending'">
          <div class="timeline-dot"></div>
          <div class="timeline-content">
            <div class="timeline-title">入职时间满足</div>
            <div class="timeline-desc">入职满2年</div>
          </div>
        </div>

        <div class="timeline-item" :class="candidate.criteria.mentoringCount ? 'completed' : 'pending'">
          <div class="timeline-dot"></div>
          <div class="timeline-content">
            <div class="timeline-title">带教经验积累</div>
            <div class="timeline-desc">带教学员≥3人</div>
          </div>
        </div>

        <div class="timeline-item" :class="candidate.criteria.teachingPlan ? 'completed' : 'pending'">
          <div class="timeline-dot"></div>
          <div class="timeline-content">
            <div class="timeline-title">教案材料准备</div>
            <div class="timeline-desc">提交完整教案</div>
          </div>
        </div>

        <div class="timeline-item" :class="candidate.criteria.legacyCard ? 'completed' : 'pending'">
          <div class="timeline-dot"></div>
          <div class="timeline-content">
            <div class="timeline-title">传承卡获得</div>
            <div class="timeline-desc">获得传承卡认定</div>
          </div>
        </div>

        <div class="timeline-item" :class="isAllQualified ? 'completed' : 'pending'">
          <div class="timeline-dot"></div>
          <div class="timeline-content">
            <div class="timeline-title">认证通过</div>
            <div class="timeline-desc">成为书院认证导师</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { 
  CircleCheckFilled,
  CircleCloseFilled,
  Clock,
  User,
  Document,
  Medal
} from '@element-plus/icons-vue'

interface Props {
  candidate: any
}

const props = defineProps<Props>()

// 计算属性
const isAllQualified = computed(() => {
  return props.candidate.status === 'qualified' || props.candidate.status === 'certified'
})

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

const getWorkYears = (hireDate: Date) => {
  const now = new Date()
  const diffTime = Math.abs(now.getTime() - hireDate.getTime())
  const diffYears = Math.floor(diffTime / (1000 * 60 * 60 * 24 * 365))
  return diffYears
}
</script>

<style scoped>
.requirements-list {
  padding: 20px;
  max-height: 70vh;
  overflow-y: auto;
}

.candidate-info {
  margin-bottom: 30px;
  padding: 20px;
  background: #f0f9ff;
  border-radius: 8px;
  border-left: 4px solid #409eff;
}

.candidate-info h4 {
  margin: 0 0 12px 0;
  color: #303133;
  font-size: 16px;
}

.info-summary {
  display: flex;
  gap: 20px;
  flex-wrap: wrap;
  font-size: 14px;
}

.requirements-section {
  margin-bottom: 30px;
}

.requirements-section h4 {
  margin: 0 0 20px 0;
  color: #303133;
  font-size: 16px;
  font-weight: 600;
}

.requirements-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
}

.requirement-item {
  padding: 20px;
  border-radius: 8px;
  border: 2px solid #e4e7ed;
}

.requirement-item.requirement-pass {
  background: #f6ffed;
  border-color: #b7eb8f;
}

.requirement-item.requirement-fail {
  background: #fff2f0;
  border-color: #ffccc7;
}

.requirement-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 16px;
}

.status-icon {
  font-size: 18px;
}

.requirement-pass .status-icon {
  color: #52c41a;
}

.requirement-fail .status-icon {
  color: #ff4d4f;
}

.requirement-title {
  font-weight: 600;
  color: #303133;
  font-size: 14px;
}

.requirement-content {
  display: flex;
  flex-direction: column;
  gap: 8px;
  font-size: 13px;
}

.requirement-standard,
.requirement-actual,
.requirement-gap {
  display: flex;
  align-items: center;
}

.label {
  font-weight: 500;
  color: #606266;
  margin-right: 8px;
  min-width: 70px;
}

.value {
  color: #303133;
}

.gap-text {
  color: #ff4d4f;
  font-weight: 500;
}

.improvement-section,
.pathway-section {
  margin-bottom: 30px;
}

.improvement-section h4,
.pathway-section h4 {
  margin: 0 0 20px 0;
  color: #303133;
  font-size: 16px;
  font-weight: 600;
}

.suggestions-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.suggestion-item {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 16px;
  background: #fafafa;
  border-radius: 8px;
  border-left: 4px solid #409eff;
}

.suggestion-item.qualified {
  background: #f6ffed;
  border-left-color: #52c41a;
}

.suggestion-icon {
  color: #409eff;
  font-size: 16px;
  margin-top: 2px;
  flex-shrink: 0;
}

.suggestion-item.qualified .suggestion-icon {
  color: #52c41a;
}

.suggestion-content {
  flex: 1;
}

.suggestion-title {
  font-weight: 500;
  color: #303133;
  margin-bottom: 4px;
  font-size: 14px;
}

.suggestion-text {
  color: #606266;
  line-height: 1.5;
  font-size: 13px;
}

.pathway-timeline {
  position: relative;
  padding-left: 30px;
}

.pathway-timeline::before {
  content: '';
  position: absolute;
  left: 15px;
  top: 0;
  bottom: 0;
  width: 2px;
  background: #e4e7ed;
}

.timeline-item {
  position: relative;
  padding-bottom: 30px;
}

.timeline-item:last-child {
  padding-bottom: 0;
}

.timeline-dot {
  position: absolute;
  left: -23px;
  top: 2px;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: #e4e7ed;
  border: 2px solid #fff;
}

.timeline-item.completed .timeline-dot {
  background: #52c41a;
}

.timeline-item.pending .timeline-dot {
  background: #d9d9d9;
}

.timeline-content {
  padding-left: 16px;
}

.timeline-title {
  font-weight: 500;
  color: #303133;
  margin-bottom: 4px;
  font-size: 14px;
}

.timeline-item.completed .timeline-title {
  color: #52c41a;
}

.timeline-desc {
  color: #606266;
  font-size: 13px;
}

/* 响应式设计 */
@media (max-width: 1024px) {
  .requirements-grid {
    grid-template-columns: 1fr;
  }
  
  .info-summary {
    flex-direction: column;
    gap: 8px;
  }
}
</style> 