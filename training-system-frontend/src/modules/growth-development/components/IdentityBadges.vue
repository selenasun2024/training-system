<template>
  <div class="identity-badges">
    <div class="badges-header">
      <h3>🏆 身份标识</h3>
      <el-button size="small" @click="showBadgeDetail = true">
        查看详情
      </el-button>
    </div>

    <div class="badges-container">
      <div 
        v-for="badge in userBadges" 
        :key="badge.id"
        class="badge-item"
        :class="badge.type"
        @click="selectBadge(badge)"
      >
        <div class="badge-icon">
          <el-icon :size="32">
            <component :is="badge.icon" />
          </el-icon>
        </div>
        <div class="badge-info">
          <div class="badge-title">{{ badge.title }}</div>
          <div class="badge-description">{{ badge.description }}</div>
          <div class="badge-date">{{ formatDate(badge.obtainedDate) }}</div>
        </div>
        <div class="badge-status" v-if="badge.isActive">
          <el-tag type="success" size="small">激活中</el-tag>
        </div>
      </div>

      <!-- 空状态 -->
      <div v-if="userBadges.length === 0" class="empty-state">
        <el-icon size="48" color="#c0c4cc">
          <Trophy />
        </el-icon>
        <p>暂无身份标识</p>
        <el-button type="primary" @click="showApplicationDialog = true">
          申请身份认证
        </el-button>
      </div>
    </div>

    <!-- 可申请的身份 -->
    <div class="available-applications" v-if="availableApplications.length > 0">
      <h4>可申请的身份</h4>
      <div class="application-list">
        <div 
          v-for="app in availableApplications" 
          :key="app.id"
          class="application-item"
          @click="applyForBadge(app)"
        >
          <div class="app-icon">
            <el-icon :size="24">
              <component :is="app.icon" />
            </el-icon>
          </div>
          <div class="app-info">
            <div class="app-title">{{ app.title }}</div>
            <div class="app-requirements">{{ app.requirements }}</div>
          </div>
          <div class="app-action">
            <el-button size="small" type="primary">申请</el-button>
          </div>
        </div>
      </div>
    </div>

    <!-- 徽章详情对话框 -->
    <el-dialog
      v-model="showBadgeDetail"
      title="身份标识详情"
      width="700px"
    >
      <div class="badge-detail-content">
        <div v-for="badge in allBadges" :key="badge.id" class="detail-badge">
          <div class="detail-header">
            <div class="detail-icon" :class="badge.type">
              <el-icon :size="40">
                <component :is="badge.icon" />
              </el-icon>
            </div>
            <div class="detail-info">
              <h4>{{ badge.title }}</h4>
              <p>{{ badge.fullDescription }}</p>
            </div>
            <div class="detail-status">
              <el-tag 
                :type="badge.isObtained ? 'success' : 'info'"
                size="large"
              >
                {{ badge.isObtained ? '已获得' : '未获得' }}
              </el-tag>
            </div>
          </div>
          
          <div class="detail-benefits" v-if="badge.benefits">
            <h5>获得权益：</h5>
            <ul>
              <li v-for="benefit in badge.benefits" :key="benefit">
                {{ benefit }}
              </li>
            </ul>
          </div>
          
          <div class="detail-requirements" v-if="!badge.isObtained">
            <h5>获得条件：</h5>
            <ul>
              <li v-for="requirement in badge.detailRequirements" :key="requirement">
                {{ requirement }}
              </li>
            </ul>
          </div>
        </div>
      </div>
    </el-dialog>

    <!-- 申请身份对话框 -->
    <el-dialog
      v-model="showApplicationDialog"
      title="申请身份认证"
      width="600px"
    >
      <div class="application-form">
        <el-form :model="applicationForm" label-width="120px">
          <el-form-item label="申请身份">
            <el-select v-model="applicationForm.badgeId" placeholder="请选择要申请的身份">
              <el-option 
                v-for="app in availableApplications" 
                :key="app.id"
                :label="app.title" 
                :value="app.id"
              />
            </el-select>
          </el-form-item>
          <el-form-item label="申请理由">
            <el-input 
              v-model="applicationForm.reason" 
              type="textarea" 
              :rows="4"
              placeholder="请说明您申请该身份的理由和具备的条件"
            />
          </el-form-item>
          <el-form-item label="支撑材料">
            <el-upload
              class="upload-demo"
              drag
              multiple
              :file-list="applicationForm.files"
            >
              <el-icon class="el-icon--upload"><Upload /></el-icon>
              <div class="el-upload__text">
                将文件拖到此处，或<em>点击上传</em>
              </div>
              <template #tip>
                <div class="el-upload__tip">
                  支持上传证书、工作成果等支撑材料
                </div>
              </template>
            </el-upload>
          </el-form-item>
        </el-form>
      </div>
      <template #footer>
        <el-button @click="showApplicationDialog = false">取消</el-button>
        <el-button type="primary" @click="submitApplication">提交申请</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { 
  Trophy, 
  Crown, 
  Star, 
  Medal,
  Upload 
} from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'

// 响应式数据
const showBadgeDetail = ref(false)
const showApplicationDialog = ref(false)
const selectedBadge = ref(null)

// 申请表单
const applicationForm = ref({
  badgeId: '',
  reason: '',
  files: []
})

// 用户已获得的徽章
const userBadges = ref([
  {
    id: 'elite',
    title: '精英通道成员',
    description: '高潜力人才',
    type: 'elite',
    icon: 'Crown',
    isActive: true,
    obtainedDate: new Date('2023-06-15'),
    fullDescription: '通过严格选拔进入精英通道，享受快速发展机会',
    benefits: ['优先参与重要项目', '专属导师指导', '加速晋升通道', '高级培训机会'],
    detailRequirements: []
  },
  {
    id: 'mentor',
    title: '内部导师',
    description: '认证导师',
    type: 'mentor',
    icon: 'Star',
    isActive: true,
    obtainedDate: new Date('2023-03-20'),
    fullDescription: '通过导师认证，具备指导新员工的专业能力',
    benefits: ['导师津贴', '优先晋升考虑', '专业声誉提升', '跨部门影响力'],
    detailRequirements: []
  }
])

// 可申请的身份
const availableApplications = ref([
  {
    id: 'successor',
    title: '继任者候选人',
    description: '关键岗位继任者',
    type: 'successor',
    icon: 'Medal',
    requirements: '需具备3年以上管理经验',
    fullDescription: '被选定为关键岗位的继任者候选人，接受专项培养',
    benefits: ['继任者专项培训', '轮岗机会', '高层导师', '优先晋升'],
    detailRequirements: [
      '3年以上管理经验',
      '优秀的领导力评估结果',
      '所在部门推荐',
      '通过继任者评估中心'
    ]
  }
])

// 所有徽章（包括已获得和未获得）
const allBadges = ref([
  ...userBadges.value.map(badge => ({ ...badge, isObtained: true })),
  ...availableApplications.value.map(app => ({ ...app, isObtained: false }))
])

// 格式化日期
const formatDate = (date: Date) => {
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

// 选择徽章
const selectBadge = (badge: any) => {
  selectedBadge.value = badge
  console.log('Selected badge:', badge)
}

// 申请徽章
const applyForBadge = (app: any) => {
  applicationForm.value.badgeId = app.id
  showApplicationDialog.value = true
}

// 提交申请
const submitApplication = () => {
  if (!applicationForm.value.badgeId || !applicationForm.value.reason) {
    ElMessage.warning('请填写完整的申请信息')
    return
  }

  // 这里应该调用API提交申请
  console.log('Submitting application:', applicationForm.value)
  
  ElMessage.success('申请已提交，请等待审核')
  showApplicationDialog.value = false
  
  // 重置表单
  applicationForm.value = {
    badgeId: '',
    reason: '',
    files: []
  }
}
</script>

<style scoped>
.identity-badges {
  background: white;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  height: 100%;
}

.badges-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.badges-header h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #303133;
}

.badges-container {
  margin-bottom: 24px;
}

.badge-item {
  display: flex;
  align-items: center;
  padding: 16px;
  border-radius: 8px;
  margin-bottom: 12px;
  cursor: pointer;
  transition: all 0.3s;
  border: 2px solid transparent;
}

.badge-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.badge-item.elite {
  background: linear-gradient(135deg, #ffd700, #ffed4e);
  border-color: #ffd700;
}

.badge-item.mentor {
  background: linear-gradient(135deg, #409eff, #66b3ff);
  border-color: #409eff;
}

.badge-item.successor {
  background: linear-gradient(135deg, #f56c6c, #ff8a8a);
  border-color: #f56c6c;
}

.badge-icon {
  margin-right: 16px;
  color: white;
}

.badge-info {
  flex: 1;
}

.badge-title {
  font-size: 16px;
  font-weight: 600;
  color: white;
  margin-bottom: 4px;
}

.badge-description {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.9);
  margin-bottom: 4px;
}

.badge-date {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.8);
}

.badge-status {
  margin-left: 16px;
}

/* 空状态 */
.empty-state {
  text-align: center;
  padding: 40px;
  color: #909399;
}

.empty-state p {
  margin: 16px 0;
  font-size: 16px;
}

/* 可申请的身份 */
.available-applications h4 {
  margin: 0 0 16px 0;
  font-size: 16px;
  color: #303133;
}

.application-list {
  display: grid;
  gap: 12px;
}

.application-item {
  display: flex;
  align-items: center;
  padding: 16px;
  border: 1px solid #e4e7ed;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s;
}

.application-item:hover {
  border-color: #409eff;
  box-shadow: 0 2px 8px rgba(64, 158, 255, 0.1);
}

.app-icon {
  margin-right: 16px;
  color: #409eff;
}

.app-info {
  flex: 1;
}

.app-title {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 4px;
}

.app-requirements {
  font-size: 14px;
  color: #909399;
}

.app-action {
  margin-left: 16px;
}

/* 详情对话框 */
.badge-detail-content {
  max-height: 600px;
  overflow-y: auto;
}

.detail-badge {
  margin-bottom: 24px;
  padding-bottom: 20px;
  border-bottom: 1px solid #e4e7ed;
}

.detail-badge:last-child {
  border-bottom: none;
}

.detail-header {
  display: flex;
  align-items: center;
  margin-bottom: 16px;
}

.detail-icon {
  margin-right: 16px;
  padding: 12px;
  border-radius: 8px;
}

.detail-icon.elite {
  background: linear-gradient(135deg, #ffd700, #ffed4e);
  color: white;
}

.detail-icon.mentor {
  background: linear-gradient(135deg, #409eff, #66b3ff);
  color: white;
}

.detail-icon.successor {
  background: linear-gradient(135deg, #f56c6c, #ff8a8a);
  color: white;
}

.detail-info {
  flex: 1;
}

.detail-info h4 {
  margin: 0 0 8px 0;
  font-size: 18px;
  color: #303133;
}

.detail-info p {
  margin: 0;
  font-size: 14px;
  color: #606266;
}

.detail-status {
  margin-left: 16px;
}

.detail-benefits,
.detail-requirements {
  margin-top: 16px;
}

.detail-benefits h5,
.detail-requirements h5 {
  margin: 0 0 8px 0;
  font-size: 14px;
  color: #303133;
}

.detail-benefits ul,
.detail-requirements ul {
  margin: 0;
  padding-left: 20px;
}

.detail-benefits li,
.detail-requirements li {
  font-size: 13px;
  color: #606266;
  margin-bottom: 4px;
}

/* 申请表单 */
.application-form {
  padding: 20px 0;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .badges-header {
    flex-direction: column;
    gap: 12px;
  }
  
  .badge-item {
    flex-direction: column;
    text-align: center;
  }
  
  .badge-icon {
    margin-right: 0;
    margin-bottom: 12px;
  }
  
  .detail-header {
    flex-direction: column;
    text-align: center;
  }
  
  .detail-icon {
    margin-right: 0;
    margin-bottom: 12px;
  }
}
</style> 