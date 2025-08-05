<template>
  <el-dialog
    v-model="innerVisible"
    title="作业批改"
    width="90%"
    top="5vh"
    :close-on-click-modal="false"
    @close="handleClose"
  >
    <div class="review-container">
      <!-- 左侧作业内容 -->
      <div class="submission-content">
        <div class="content-header">
          <h3>{{ submission?.studentName }} 的作业</h3>
          <div class="submission-info">
            <span>提交时间：{{ formatDateTime(submission?.submitTime) }}</span>
            <span>作业总分：{{ homework?.totalScore }}分</span>
          </div>
        </div>

        <!-- 作业要求 -->
        <div class="requirement-section">
          <h4>作业要求</h4>
          <div class="requirement-content">
            {{ homework?.description }}
          </div>
        </div>

        <!-- 学员提交内容 -->
        <div class="submission-section">
          <h4>提交内容</h4>
          <div class="submission-text" v-if="submission?.content">
            {{ submission.content }}
          </div>
          <div v-else class="no-text-content">
            学员未提交文字内容
          </div>

          <!-- 提交附件 -->
          <div class="submission-attachments" v-if="submission?.attachments?.length">
            <h5>提交附件</h5>
            <div class="attachments-list">
              <div
                v-for="attachment in submission.attachments"
                :key="attachment.id"
                class="attachment-item"
              >
                <div class="attachment-info">
                  <el-icon><Document /></el-icon>
                  <span class="filename">{{ attachment.name }}</span>
                  <span class="filesize">{{ attachment.size }}</span>
                </div>
                <div class="attachment-actions">
                  <el-button size="small" type="primary" @click="previewFile(attachment)">
                    预览
                  </el-button>
                  <el-button size="small" @click="downloadFile(attachment)">
                    下载
                  </el-button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 文件预览区域 -->
        <div class="preview-section" v-if="previewFile">
          <h4>文件预览</h4>
          <div class="preview-container">
            <!-- 图片预览 -->
            <img
              v-if="isImageFile(currentPreviewFile)"
              :src="currentPreviewFile.url"
              :alt="currentPreviewFile.name"
              class="preview-image"
            />
            <!-- PDF预览 -->
            <iframe
              v-else-if="isPdfFile(currentPreviewFile)"
              :src="currentPreviewFile.url"
              class="preview-pdf"
            ></iframe>
            <!-- 文档预览 -->
            <div v-else class="preview-placeholder">
              <el-icon><Document /></el-icon>
              <p>{{ currentPreviewFile.name }}</p>
              <p>此文件类型不支持在线预览，请下载查看</p>
            </div>
          </div>
        </div>
      </div>

      <!-- 右侧批改区域 -->
      <div class="review-panel">
        <div class="panel-header">
          <h3>批改评分</h3>
          <div class="review-progress">
            已批改：{{ reviewedCount }}/{{ totalSubmissions }}
          </div>
        </div>

        <!-- 评分区域 -->
        <div class="scoring-section">
          <div class="score-input">
            <label>得分：</label>
            <el-input-number
              v-model="reviewForm.score"
              :min="0"
              :max="homework?.totalScore || 100"
              :precision="1"
              style="width: 120px"
            />
            <span class="score-hint">/ {{ homework?.totalScore }}分</span>
          </div>

          <div class="quick-scores">
            <span class="quick-label">快速评分：</span>
            <el-button
              v-for="(score, index) in quickScores"
              :key="index"
              size="small"
              @click="setQuickScore(score.value)"
              :type="reviewForm.score === score.value ? 'primary' : ''"
            >
              {{ score.label }}
            </el-button>
          </div>
        </div>

        <!-- 评价标准 -->
        <div class="criteria-section">
          <h4>评价标准</h4>
          <div class="criteria-list">
            <div
              v-for="criterion in evaluationCriteria"
              :key="criterion.id"
              class="criterion-item"
            >
              <div class="criterion-header">
                <span class="criterion-name">{{ criterion.name }}</span>
                <span class="criterion-weight">{{ criterion.weight }}%</span>
              </div>
              <el-rate
                v-model="criterion.rating"
                :max="5"
                @change="updateCriterionScore"
              />
              <span class="criterion-score">{{ criterion.score }}分</span>
            </div>
          </div>
        </div>

        <!-- 批改意见 -->
        <div class="feedback-section">
          <h4>批改意见</h4>
          <el-input
            v-model="reviewForm.feedback"
            type="textarea"
            :autosize="{ minRows: 6, maxRows: 12 }"
            placeholder="请输入详细的批改意见和建议..."
          />
          
          <!-- 快速评语 -->
          <div class="quick-feedback">
            <span class="quick-label">常用评语：</span>
            <div class="feedback-tags">
              <el-tag
                v-for="tag in quickFeedbackTags"
                :key="tag"
                @click="addQuickFeedback(tag)"
                style="cursor: pointer; margin: 4px;"
              >
                {{ tag }}
              </el-tag>
            </div>
          </div>
        </div>

        <!-- 批改工具 -->
        <div class="tools-section">
          <h4>批改工具</h4>
          <div class="tools-list">
            <el-button
              size="small"
              @click="addComment"
              :disabled="!selectedText"
            >
              <el-icon><ChatLineRound /></el-icon>
              添加批注
            </el-button>
            <el-button size="small" @click="highlightText">
              <el-icon><Promotion /></el-icon>
              高亮标记
            </el-button>
            <el-button size="small" @click="insertCorrection">
              <el-icon><EditPen /></el-icon>
              插入修改
            </el-button>
          </div>
        </div>

        <!-- 历史记录 -->
        <div class="history-section" v-if="reviewHistory.length > 0">
          <h4>批改历史</h4>
          <div class="history-list">
            <div
              v-for="record in reviewHistory"
              :key="record.id"
              class="history-item"
            >
              <div class="history-header">
                <span class="reviewer">{{ record.reviewer }}</span>
                <span class="review-time">{{ formatDateTime(record.time) }}</span>
              </div>
              <div class="history-content">
                <div class="history-score">得分：{{ record.score }}分</div>
                <div class="history-feedback">{{ record.feedback }}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <template #footer>
      <div class="dialog-footer">
        <div class="footer-left">
          <el-button @click="saveDraft">保存草稿</el-button>
          <el-button @click="resetReview">重置</el-button>
        </div>
        <div class="footer-right">
          <el-button @click="handleClose">取消</el-button>
          <el-button
            type="primary"
            @click="submitReview"
            :disabled="!canSubmitReview"
          >
            提交批改
          </el-button>
          <el-button
            v-if="hasMoreSubmissions"
            type="success"
            @click="submitAndNext"
            :disabled="!canSubmitReview"
          >
            批改并下一个
          </el-button>
        </div>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch, reactive } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Document, ChatLineRound, Promotion, EditPen
} from '@element-plus/icons-vue'

const props = defineProps<{
  visible: boolean
  homework: any
  submission: any
}>()

const emit = defineEmits<{
  (e: 'update:visible', value: boolean): void
  (e: 'save', reviewData: any): void
  (e: 'next'): void
}>()

// 内部可见性状态
const innerVisible = ref(props.visible)
watch(() => props.visible, (val) => {
  innerVisible.value = val
  if (val) {
    initializeReview()
  }
})
watch(innerVisible, (val) => {
  emit('update:visible', val)
})

// 批改表单
const reviewForm = reactive({
  score: 0,
  feedback: '',
  criteria: [] as any[]
})

// 文件预览
const currentPreviewFile = ref<any>(null)
const selectedText = ref('')

// 评价标准
const evaluationCriteria = ref([
  { id: 'content', name: '内容完整性', weight: 40, rating: 0, score: 0 },
  { id: 'quality', name: '质量水平', weight: 30, rating: 0, score: 0 },
  { id: 'format', name: '格式规范', weight: 20, rating: 0, score: 0 },
  { id: 'innovation', name: '创新性', weight: 10, rating: 0, score: 0 }
])

// 快速评分
const quickScores = computed(() => {
  const total = props.homework?.totalScore || 100
  return [
    { label: '优秀', value: Math.round(total * 0.9) },
    { label: '良好', value: Math.round(total * 0.8) },
    { label: '中等', value: Math.round(total * 0.7) },
    { label: '及格', value: Math.round(total * 0.6) }
  ]
})

// 快速评语
const quickFeedbackTags = ref([
  '内容完整，思路清晰',
  '分析深入，见解独到',
  '格式规范，表述清楚',
  '需要加强理论结合实际',
  '部分内容需要进一步完善',
  '整体表现良好，继续努力'
])

// 模拟数据
const reviewHistory = ref([])
const reviewedCount = ref(1)
const totalSubmissions = ref(5)
const hasMoreSubmissions = ref(true)

// 计算属性
const canSubmitReview = computed(() => {
  return reviewForm.score >= 0 && reviewForm.feedback.trim().length > 0
})

// 工具方法
const formatDateTime = (dateString: string) => {
  if (!dateString) return ''
  return new Date(dateString).toLocaleString('zh-CN')
}

const isImageFile = (file: any) => {
  return /\.(jpg|jpeg|png|gif|bmp)$/i.test(file.name)
}

const isPdfFile = (file: any) => {
  return /\.pdf$/i.test(file.name)
}

// 初始化批改
const initializeReview = () => {
  if (props.submission) {
    // 如果已经有批改记录，加载之前的批改内容
    if (props.submission.reviewed) {
      reviewForm.score = props.submission.score || 0
      reviewForm.feedback = props.submission.feedback || ''
    } else {
      // 重置表单
      reviewForm.score = 0
      reviewForm.feedback = ''
    }
  }
}

// 评分操作
const setQuickScore = (score: number) => {
  reviewForm.score = score
}

const updateCriterionScore = () => {
  // 根据各项评价计算总分
  const totalScore = props.homework?.totalScore || 100
  let weightedScore = 0
  
  evaluationCriteria.value.forEach(criterion => {
    const score = (criterion.rating / 5) * (totalScore * criterion.weight / 100)
    criterion.score = Math.round(score)
    weightedScore += score
  })
  
  reviewForm.score = Math.round(weightedScore)
}

// 文件操作
const previewFile = (file: any) => {
  currentPreviewFile.value = file
}

const downloadFile = (file: any) => {
  ElMessage.success(`正在下载 ${file.name}`)
}

// 批改工具
const addComment = () => {
  if (!selectedText.value) {
    ElMessage.warning('请先选择要批注的文字')
    return
  }
  ElMessage.info('批注功能开发中...')
}

const highlightText = () => {
  ElMessage.info('高亮功能开发中...')
}

const insertCorrection = () => {
  ElMessage.info('修改建议功能开发中...')
}

// 快速评语
const addQuickFeedback = (tag: string) => {
  if (reviewForm.feedback) {
    reviewForm.feedback += '；' + tag
  } else {
    reviewForm.feedback = tag
  }
}

// 提交操作
const submitReview = () => {
  if (!canSubmitReview.value) {
    ElMessage.warning('请完善评分和批改意见')
    return
  }

  const reviewData = {
    score: reviewForm.score,
    feedback: reviewForm.feedback,
    criteria: evaluationCriteria.value,
    reviewTime: new Date().toISOString()
  }

  emit('save', reviewData)
  ElMessage.success('批改提交成功')
  handleClose()
}

const submitAndNext = () => {
  submitReview()
  emit('next')
}

const saveDraft = () => {
  ElMessage.success('草稿已保存')
}

const resetReview = () => {
  ElMessageBox.confirm('确定重置批改内容吗？', '重置确认', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    reviewForm.score = 0
    reviewForm.feedback = ''
    evaluationCriteria.value.forEach(criterion => {
      criterion.rating = 0
      criterion.score = 0
    })
    ElMessage.info('批改内容已重置')
  })
}

const handleClose = () => {
  // 检查是否有未保存的内容
  if ((reviewForm.score > 0 || reviewForm.feedback.trim()) && !props.submission?.reviewed) {
    ElMessageBox.confirm('有未保存的批改内容，确定关闭吗？', '关闭确认', {
      confirmButtonText: '保存草稿',
      cancelButtonText: '直接关闭',
      distinguishCancelAndClose: true,
      type: 'warning'
    }).then(() => {
      saveDraft()
      innerVisible.value = false
    }).catch((action) => {
      if (action === 'cancel') {
        innerVisible.value = false
      }
    })
  } else {
    innerVisible.value = false
  }
}
</script>

<style scoped>
.review-container {
  display: flex;
  height: 70vh;
  gap: 20px;
}

.submission-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 16px;
  overflow-y: auto;
  padding-right: 12px;
}

.content-header h3 {
  margin: 0 0 8px 0;
  color: #333;
  font-size: 18px;
}

.submission-info {
  display: flex;
  gap: 16px;
  font-size: 14px;
  color: #666;
}

.requirement-section,
.submission-section {
  border: 1px solid #e8e8e8;
  border-radius: 8px;
  padding: 16px;
  background: #fff;
}

.requirement-section h4,
.submission-section h4,
.preview-section h4 {
  margin: 0 0 12px 0;
  color: #333;
  font-size: 16px;
}

.requirement-content,
.submission-text {
  font-size: 14px;
  line-height: 1.6;
  color: #333;
  background: #f8f9fa;
  padding: 12px;
  border-radius: 6px;
  white-space: pre-wrap;
}

.no-text-content {
  font-size: 14px;
  color: #999;
  font-style: italic;
  text-align: center;
  padding: 20px;
}

.submission-attachments h5 {
  margin: 16px 0 8px 0;
  color: #333;
  font-size: 14px;
}

.attachments-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.attachment-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  background: #f8f9fa;
  border-radius: 6px;
  border: 1px solid #e8e8e8;
}

.attachment-info {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
}

.filename {
  font-size: 14px;
  color: #333;
  font-weight: 500;
}

.filesize {
  font-size: 12px;
  color: #999;
}

.attachment-actions {
  display: flex;
  gap: 8px;
}

.preview-section {
  border: 1px solid #e8e8e8;
  border-radius: 8px;
  padding: 16px;
  background: #fff;
}

.preview-container {
  min-height: 300px;
  border: 1px solid #e8e8e8;
  border-radius: 6px;
  padding: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.preview-image {
  max-width: 100%;
  max-height: 400px;
  object-fit: contain;
}

.preview-pdf {
  width: 100%;
  height: 400px;
  border: none;
}

.preview-placeholder {
  text-align: center;
  color: #999;
}

.preview-placeholder .el-icon {
  font-size: 48px;
  margin-bottom: 12px;
}

.review-panel {
  width: 400px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  overflow-y: auto;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-bottom: 12px;
  border-bottom: 1px solid #e8e8e8;
}

.panel-header h3 {
  margin: 0;
  color: #333;
  font-size: 16px;
}

.review-progress {
  font-size: 14px;
  color: #666;
}

.scoring-section {
  padding: 16px;
  background: #f8f9fa;
  border-radius: 8px;
}

.score-input {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
}

.score-input label {
  font-weight: 500;
  color: #333;
}

.score-hint {
  font-size: 14px;
  color: #666;
}

.quick-scores {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.quick-label {
  font-size: 14px;
  color: #666;
  margin-right: 4px;
}

.criteria-section,
.feedback-section,
.tools-section,
.history-section {
  padding: 16px;
  border: 1px solid #e8e8e8;
  border-radius: 8px;
  background: #fff;
}

.criteria-section h4,
.feedback-section h4,
.tools-section h4,
.history-section h4 {
  margin: 0 0 12px 0;
  color: #333;
  font-size: 14px;
  font-weight: 600;
}

.criteria-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.criterion-item {
  padding: 8px;
  background: #f8f9fa;
  border-radius: 6px;
}

.criterion-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 6px;
}

.criterion-name {
  font-size: 14px;
  color: #333;
  font-weight: 500;
}

.criterion-weight {
  font-size: 12px;
  color: #999;
}

.criterion-score {
  font-size: 12px;
  color: #666;
  margin-left: 8px;
}

.quick-feedback {
  margin-top: 12px;
}

.feedback-tags {
  margin-top: 8px;
}

.tools-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.history-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.history-item {
  padding: 12px;
  background: #f8f9fa;
  border-radius: 6px;
}

.history-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.reviewer {
  font-weight: 500;
  color: #333;
}

.review-time {
  font-size: 12px;
  color: #999;
}

.history-content {
  font-size: 14px;
  color: #666;
}

.history-score {
  font-weight: 500;
  color: #67c23a;
  margin-bottom: 4px;
}

.dialog-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.footer-left,
.footer-right {
  display: flex;
  gap: 12px;
}
</style> 