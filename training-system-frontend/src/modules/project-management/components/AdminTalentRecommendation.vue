<template>
  <div class="admin-talent-recommendation">
          <!-- 当没有上级 projectId 时，提供项目选择器 -->
      <div v-if="!projectId" style="margin-bottom: 12px;">
         <el-select 
           v-model="localProjectId" 
           placeholder="选择项目" 
           size="small" 
           style="width: 300px"
           :loading="loadingProjects"
           @change="loadRecommendations"
         >
           <el-option
             v-for="project in displayProjects"
             :key="project.id"
             :label="`${project.name} ${project.recommendationCount ? `(${project.recommendationCount}条推荐)` : ''}`"
             :value="project.id"
           />
         </el-select>
      
      <!-- 手动输入项目ID -->
      <el-input 
        v-if="localProjectId === 'manual-input'"
        v-model="manualProjectId"
        placeholder="请输入项目ID"
        size="small"
        style="width: 200px;"
        @blur="handleManualInput"
        @keyup.enter="handleManualInput"
      />
      
      <el-button 
        v-if="localProjectId === 'manual-input' && manualProjectId"
        type="primary" 
        size="small"
        @click="handleManualInput"
      >
        确认
      </el-button>
      
      <!-- 显示当前选择状态 -->
      <el-tag v-if="localProjectId === 'all'" type="info" size="small">
        显示所有项目的推荐记录
      </el-tag>
      <el-tag v-else-if="currentProject" type="success" size="small">
        {{ currentProject.name }}
      </el-tag>
    </div>

    <!-- 推荐概览 -->
    <el-row :gutter="20" class="mb-4">
      <el-col :span="8">
        <el-card shadow="hover" class="overview-card">
          <template #header>
            <div class="card-header">
              <span>羽林卫推荐</span>
              <el-tag type="success" size="small">{{ recommendationStats.yulin.total }}人</el-tag>
            </div>
          </template>
          <div class="card-content">
            <div class="stat-item">
              <span>待审核</span>
              <el-tag type="warning" size="small">{{ recommendationStats.yulin.pending }}人</el-tag>
            </div>
            <div class="stat-item">
              <span>已通过</span>
              <el-tag type="success" size="small">{{ recommendationStats.yulin.approved }}人</el-tag>
            </div>
            <div class="stat-item">
              <span>已驳回</span>
              <el-tag type="danger" size="small">{{ recommendationStats.yulin.rejected }}人</el-tag>
            </div>
          </div>
        </el-card>
      </el-col>
      
      <el-col :span="8">
        <el-card shadow="hover" class="overview-card">
          <template #header>
            <div class="card-header">
              <span>锦衣卫推荐</span>
              <el-tag type="success" size="small">{{ recommendationStats.jinyi.total }}人</el-tag>
            </div>
          </template>
          <div class="card-content">
            <div class="stat-item">
              <span>待审核</span>
              <el-tag type="warning" size="small">{{ recommendationStats.jinyi.pending }}人</el-tag>
            </div>
            <div class="stat-item">
              <span>已通过</span>
              <el-tag type="success" size="small">{{ recommendationStats.jinyi.approved }}人</el-tag>
            </div>
            <div class="stat-item">
              <span>已驳回</span>
              <el-tag type="danger" size="small">{{ recommendationStats.jinyi.rejected }}人</el-tag>
            </div>
          </div>
        </el-card>
      </el-col>

      <el-col :span="8">
        <el-card shadow="hover" class="overview-card">
          <template #header>
            <div class="card-header">
              <span>推荐进度</span>
              <el-progress 
                :percentage="recommendationStats.progress" 
                :status="recommendationStats.progress === 100 ? 'success' : ''"
                class="progress"
              />
            </div>
          </template>
          <div class="card-content">
            <div class="stat-item">
              <span>已提交辅导员</span>
              <el-tag type="info" size="small">{{ recommendationStats.counselors.submitted }}人</el-tag>
            </div>
            <div class="stat-item">
              <span>待提交辅导员</span>
              <el-tag type="warning" size="small">{{ recommendationStats.counselors.pending }}人</el-tag>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 推荐列表 -->
    <el-card shadow="never" class="recommendation-list">
      <template #header>
        <div class="list-header">
          <div class="header-left">
            <span class="title">推荐列表</span>
            <el-radio-group v-model="listType" size="small" class="ml-4">
              <el-radio-button label="all">全部</el-radio-button>
              <el-radio-button label="yulin">羽林卫</el-radio-button>
              <el-radio-button label="jinyi">锦衣卫</el-radio-button>
            </el-radio-group>
            <el-select v-model="statusFilter" size="small" class="ml-4" placeholder="状态筛选">
              <el-option label="全部状态" value="" />
              <el-option label="待审核" value="pending" />
              <el-option label="已通过" value="approved" />
              <el-option label="已驳回" value="rejected" />
            </el-select>
          </div>
          <div class="header-right">
            <el-button type="primary" @click="submitFinalList" :disabled="!hasApprovedRecommendations">
              确认最终名单
            </el-button>
            <el-button @click="exportRecommendations">导出推荐记录</el-button>
          </div>
        </div>
      </template>

      <el-table :data="filteredRecommendations" style="width: 100%" v-loading="loading">
        <el-table-column label="项目名称" width="200" show-overflow-tooltip>
            <template #default="{ row }">
              <span>{{ getProjectName(row.projectId) }}</span>
            </template>
          </el-table-column>
          <el-table-column prop="studentId" label="员工ID" width="120" />
          <el-table-column prop="studentName" label="姓名" width="100" />
          <el-table-column prop="department" label="部门" width="120" show-overflow-tooltip />
          <el-table-column prop="position" label="职位" width="120" show-overflow-tooltip />
          <el-table-column prop="counselor" label="推荐人" width="100" />
          <el-table-column prop="reason" label="推荐理由" min-width="200" show-overflow-tooltip />
          <el-table-column prop="tags" label="标签" width="150">
            <template #default="{ row }">
              <el-tag 
                v-for="tag in (row.tags || [])" 
                :key="tag" 
                size="small" 
                style="margin-right: 4px;"
              >
                {{ tag }}
              </el-tag>
            </template>
          </el-table-column>
        <el-table-column prop="type" label="推荐类型" width="100">
          <template #default="{ row }">
            <el-tag :type="row.type === 'yulin' ? 'success' : 'warning'">
              {{ row.type === 'yulin' ? '羽林卫' : '锦衣卫' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="counselor" label="推荐人" width="120" />
        <el-table-column prop="department" label="所属部门" width="150" />
        <el-table-column label="评分" width="180">
          <template #default="{ row }">
            <div class="score-display-compact">
              <el-tooltip 
                v-for="(score, key) in row.scores" 
                :key="key"
                :content="`${getScoreLabel(key)}: ${row.scores[key]}/5`"
                placement="top"
              >
                <div class="score-item-compact">
                  <span class="score-label">{{ getScoreShortLabel(key) }}</span>
                  <span class="score-value" :class="getScoreClass(row.scores[key])">
                    {{ row.scores[key] }}
                  </span>
                </div>
              </el-tooltip>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="130" align="center">
            <template #default="{ row }">
              <template v-if="row.status === 'pending'">
                <div class="action-buttons">
                  <el-button 
                    size="small" 
                    type="success" 
                    @click="handleApprove(row)"
                    :loading="loading"
                    plain
                  >
                    通过
                  </el-button>
                  <el-button 
                    size="small" 
                    type="danger" 
                    @click="handleReject(row)"
                    :loading="loading"
                    plain
                  >
                    驳回
                  </el-button>
                </div>
              </template>
              <template v-else>
                <el-tag 
                  :type="getStatusType(row.status)" 
                  size="small"
                >
                  {{ getStatusLabel(row.status) }}
                </el-tag>
              </template>
            </template>
          </el-table-column>
      </el-table>

      <div class="pagination-container">
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :total="total"
          :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next"
        />
      </div>
    </el-card>

    <!-- 详情对话框 -->
    <el-dialog
      v-model="detailDialogVisible"
      title="推荐详情"
      width="60%"
    >
      <template v-if="selectedRecommendation">
        <div class="detail-content">
          <el-descriptions :column="2" border>
            <el-descriptions-item label="学员姓名">
              {{ selectedRecommendation.studentName }}
            </el-descriptions-item>
            <el-descriptions-item label="推荐类型">
              {{ selectedRecommendation.type === 'yulin' ? '羽林卫' : '锦衣卫' }}
            </el-descriptions-item>
            <el-descriptions-item label="推荐人">
              {{ selectedRecommendation.counselor }}
            </el-descriptions-item>
            <el-descriptions-item label="所属部门">
              {{ selectedRecommendation.department }}
            </el-descriptions-item>
            <el-descriptions-item label="当前状态">
              <el-tag :type="getStatusType(selectedRecommendation.status)">
                {{ getStatusLabel(selectedRecommendation.status) }}
              </el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="推荐时间">
              {{ selectedRecommendation.recommendTime }}
            </el-descriptions-item>
          </el-descriptions>

          <el-divider>评分详情</el-divider>
          <div class="score-detail">
            <div v-for="(score, key) in selectedRecommendation.scores" :key="key" class="score-item">
              <span class="score-label">{{ getScoreLabel(key) }}</span>
              <el-rate v-model="selectedRecommendation.scores[key]" disabled />
            </div>
          </div>

          <el-divider>推荐理由</el-divider>
          <p class="reason-text">{{ selectedRecommendation.reason }}</p>

          <template v-if="selectedRecommendation.status !== 'pending'">
            <el-divider>审核记录</el-divider>
            <div class="review-record">
              <p><strong>审核人：</strong>{{ selectedRecommendation.reviewer }}</p>
              <p><strong>审核时间：</strong>{{ selectedRecommendation.reviewTime }}</p>
              <p><strong>审核意见：</strong>{{ selectedRecommendation.reviewComment }}</p>
            </div>
          </template>
        </div>
      </template>
    </el-dialog>

    <!-- 审核对话框 -->
    <el-dialog
      v-model="reviewDialogVisible"
      :title="reviewType === 'approve' ? '通过推荐' : '驳回推荐'"
      width="50%"
    >
      <el-form ref="reviewFormRef" :model="reviewForm" label-width="100px">
        <el-form-item label="审核意见" prop="comment" :rules="[{ required: true, message: '请填写审核意见', trigger: 'blur' }]">
          <el-input
            v-model="reviewForm.comment"
            type="textarea"
            :rows="4"
            :placeholder="reviewType === 'approve' ? '请填写通过意见...' : '请填写驳回原因...'"
            maxlength="500"
            show-word-limit
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="cancelReview">取消</el-button>
        <el-button 
          :type="reviewType === 'approve' ? 'success' : 'danger'"
          @click="submitReview"
          :loading="loading"
        >
          确认
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { ElMessage, ElMessageBox, ElCard, ElRow, ElCol, ElProgress, ElTag, ElSelect, ElOption, ElRadioGroup, ElRadioButton, ElButton, ElTable, ElTableColumn, ElPagination, ElDialog, ElForm, ElFormItem, ElInput, ElRate, ElTooltip } from 'element-plus'
import { useAdminRecommendationStore } from '@/stores/adminRecommendation'
import type { AdminRecommendation, RecommendationStatus, ReviewPayload } from '@/types/recommendation'
import { getProjects } from '@/api/modules/project'
import { getProjectsWithRecommendations } from '@/api/modules/recommendation';

type ReviewType = 'approve' | 'reject'

interface Props {
  projectId?: string
}

const props = defineProps<Props>()

// 项目数据状态
const projects = ref<Array<{ id: string; name: string }>>([])
const projectsLoading = ref(false)

// 本地选择的项目（当 props 未提供）
const localProjectId = ref(props.projectId ?? '')
const manualProjectId = ref('') // 手动输入的项目ID

const effectiveProjectId = computed(() => props.projectId || localProjectId.value)

const store = useAdminRecommendationStore()

// 状态
const loading = ref(false)
const listType = ref('all')
const statusFilter = ref('')
const currentPage = ref(1)
const pageSize = ref(20)
const total = ref(100)
const detailDialogVisible = ref(false)
const reviewDialogVisible = ref(false)
const reviewFormRef = ref()
const selectedRecommendation = ref(null)
const reviewType = ref<ReviewType>('approve')
const reviewForm = ref({
  comment: ''
})

// 动态项目列表（替换hardcoded fallback）
const projectsWithRecommendations = ref<any[]>([]);
const loadingProjects = ref(false);

// 加载有推荐记录的项目列表
async function loadProjectsWithRecommendations() {
  try {
    loadingProjects.value = true;
    console.log('🔄 加载有推荐记录的项目列表');
    
    const res = await getProjectsWithRecommendations();
    console.log('🔍 API响应数据:', res);
    
    // 处理后端返回的数据格式：{ success: true, data: [...], message: "..." }
    const projects = res.data || []; // 后端直接在data字段返回项目数组
    
    // 添加"所有推荐"选项
    projectsWithRecommendations.value = [
      { 
        id: '', 
        name: '所有推荐', 
        recommendationCount: projects.reduce((sum, p) => sum + (p.recommendationCount || 0), 0)
      },
      ...projects
    ];
    
    console.log('✅ 获取到有推荐记录的项目:', projectsWithRecommendations.value);
    
    // 默认选择第一个项目（所有推荐）
    if (!localProjectId.value && projectsWithRecommendations.value.length > 0) {
      localProjectId.value = '';
    }
    
  } catch (error) {
    console.error('❌ 加载有推荐记录的项目失败:', error);
    // 降级到基础项目列表
    projectsWithRecommendations.value = [
      { id: '', name: '所有推荐', recommendationCount: 0 }
    ];
  } finally {
    loadingProjects.value = false;
  }
}

// 加载推荐数据
const loadRecommendations = async () => {
  try {
    loading.value = true;
    console.log('🔄 开始加载推荐数据，当前项目ID:', localProjectId.value);
    
    // 处理项目ID
    if (localProjectId.value === '') {
      // 选择了"所有推荐"，需要加载所有项目的推荐数据
      console.log('🔄 加载所有项目的推荐数据');
      
      // 获取所有有推荐的项目ID
      const projectIds = projectsWithRecommendations.value
        .filter(p => p.id !== '') // 排除"所有推荐"选项
        .map(p => p.id);
      
      if (projectIds.length > 0) {
        // 清空当前推荐数据
        store.recommendations.splice(0);
        
        // 逐个累积加载每个项目的推荐数据
        for (const projectId of projectIds) {
          console.log(`🔄 累积加载项目 ${projectId} 的推荐数据`);
          try {
            await store.appendRecommendations(projectId);
            console.log(`✅ 项目 ${projectId} 推荐数据累积完成，当前总数: ${store.recommendations.length}`);
          } catch (error) {
            console.warn(`⚠️ 项目 ${projectId} 推荐数据加载失败:`, error);
          }
        }
        console.log(`🎊 所有项目推荐数据累积完成，总计: ${store.recommendations.length} 条`);
      } else {
        console.warn('⚠️ 没有找到任何有推荐记录的项目');
        ElMessage.info('暂无推荐数据');
      }
    } else {
      // 加载特定项目的推荐数据
      const projectIdToLoad = localProjectId.value || props.projectId;
      
      if (!projectIdToLoad) {
        console.warn('⚠️ 项目ID为空，无法加载推荐数据');
        ElMessage.warning('请先选择项目');
        return;
      }
      
      // 使用store中现有的fetchRecommendations方法
      await store.fetchRecommendations(projectIdToLoad);
    }
    
    console.log('✅ 推荐数据加载完成，数量:', store.recommendations.length);
  } catch (error) {
    console.error('❌ 加载推荐数据失败:', error);
    ElMessage.error('加载推荐数据失败');
  } finally {
    loading.value = false;
  }
};

// 修改computed，使用动态项目列表
const displayProjects = computed(() => {
  return projectsWithRecommendations.value;
});

// 组件挂载时加载项目列表
onMounted(async () => {
  await loadProjectsWithRecommendations();
  await loadRecommendations();
});

// 统计数据计算
const recommendationStats = computed(() => {
  const stats = {
    total: store.recommendations.length,
    yulin: { pending: 0, approved: 0, rejected: 0 },
    jinyi: { pending: 0, approved: 0, rejected: 0 },
    counselors: { submitted: 0, pending: 0 }
  }
  
  store.recommendations.forEach(rec => {
    const type = rec.type || 'general'
    if (stats[type]) {
      stats[type][rec.status]++
    }
    if (type === 'counselor') {
      stats.counselors[rec.status]++
    }
  })
  
  return stats
})

// 获取项目名称
const getProjectName = (projectId: string) => {
  const project = projectsWithRecommendations.value.find(p => p.id === projectId);
  return project ? project.name : `项目ID: ${projectId}`;
};

// 是否有已通过的推荐
const hasApprovedRecommendations = computed(() => {
  return store.recommendations.some(item => item.status === 'approved');
});

// 获取评分标签
const getScoreLabel = (key: string) => {
  const labels = {
    leadership: '领导力',
    innovation: '创新能力', 
    execution: '执行力',
    teamwork: '团队协作'
  };
  return labels[key] || key;
};

// 获取评分简短标签
const getScoreShortLabel = (key: string) => {
  const labels = {
    leadership: '领导',
    innovation: '创新',
    execution: '执行', 
    teamwork: '协作'
  };
  return labels[key] || key;
};

// 获取状态标签
const getStatusLabel = (status: RecommendationStatus) => {
  const labels = {
    pending: '待审核',
    approved: '已通过',
    rejected: '已驳回'
  };
  return labels[status];
};

// 根据筛选条件过滤推荐列表
const filteredRecommendations = computed(() => {
  let result = store.recommendations;

  // 类型筛选
  if (listType.value !== 'all') {
    result = result.filter(item => item.type === listType.value);
  }

  // 状态筛选
  if (statusFilter.value) {
    result = result.filter(item => item.status === statusFilter.value);
  }

  // 项目筛选
  if (localProjectId.value && localProjectId.value !== '') {
    result = result.filter(item => item.projectId === localProjectId.value);
  }

  return result;
});

// 获取状态类型
const getStatusType = (status: RecommendationStatus) => {
  const types = {
    pending: 'warning',
    approved: 'success',
    rejected: 'danger'
  };
  return types[status];
};

// 查看详情
const showDetail = (row: AdminRecommendation) => {
  console.log('查看推荐详情:', row);
  // TODO: 实现详情查看逻辑
};

// 审核操作
const handleReview = async (recommendation: AdminRecommendation, action: 'approve' | 'reject') => {
  try {
    console.log(`${action === 'approve' ? '批准' : '驳回'}推荐:`, recommendation);
    // TODO: 调用审核API
    ElMessage.success(`已${action === 'approve' ? '批准' : '驳回'}推荐`);
  } catch (error) {
    console.error('审核失败:', error);
    ElMessage.error('审核操作失败');
  }
};

// 通过推荐
const handleApprove = (row: any) => {
  console.log('🔄 准备通过推荐:', row)
  reviewType.value = 'approve'
  selectedRecommendation.value = row
  reviewForm.value.comment = ''
  reviewDialogVisible.value = true
}

// 驳回推荐
const handleReject = (row: any) => {
  console.log('🔄 准备驳回推荐:', row)
  reviewType.value = 'reject'
  selectedRecommendation.value = row
  reviewForm.value.comment = ''
  reviewDialogVisible.value = true
}

// 取消审核
const cancelReview = () => {
  reviewDialogVisible.value = false
  selectedRecommendation.value = null
  reviewForm.value.comment = ''
  if (reviewFormRef.value) {
    reviewFormRef.value.resetFields()
  }
}

// 提交审核
const submitReview = async () => {
  // 表单验证
  if (!reviewFormRef.value) {
    ElMessage.warning('表单组件未初始化')
    return
  }

  try {
    // 触发表单验证
    const valid = await reviewFormRef.value.validate()
    if (!valid) {
      return
    }
  } catch (error) {
    console.log('表单验证失败:', error)
    return
  }

  if (!selectedRecommendation.value?.id) {
    ElMessage.warning('未选择推荐记录')
    return
  }

  try {
    console.log('🔄 开始提交审核:', {
      id: selectedRecommendation.value.id,
      type: reviewType.value,
      comment: reviewForm.value.comment
    })
    
    await store.reviewRecommendation({
      id: selectedRecommendation.value.id,
      type: reviewType.value,
      comment: reviewForm.value.comment
    })
    
    console.log('✅ 审核提交成功')
    ElMessage.success(`推荐已${reviewType.value === 'approve' ? '通过' : '驳回'}`)
    
    // 刷新推荐列表
    if (effectiveProjectId.value) {
      await loadRecommendations()
    }
    
    // 关闭对话框并重置表单
    reviewDialogVisible.value = false
    reviewFormRef.value.resetFields()
    selectedRecommendation.value = null
    
  } catch (error) {
    console.error('❌ 审核失败:', error)
    ElMessage.error(`审核${reviewType.value === 'approve' ? '通过' : '驳回'}失败: ${error.message || '未知错误'}`)
  }
}

// 确认最终名单
const submitFinalList = async () => {
  try {
    await ElMessageBox.confirm(
      '确认提交最终推荐名单？提交后将自动同步到人事系统。',
      '确认提交',
      {
        confirmButtonText: '确认',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )

    await store.submitFinalList()
    ElMessage.success('最终名单已提交')
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('提交失败')
    }
  }
}

// 导出推荐记录
const exportRecommendations = () => {
  // TODO: 实现导出功能
  ElMessage.success('导出成功')
}

// 获取评分样式类
const getScoreClass = (score: number): string => {
  if (score >= 4) return 'score-excellent'
  if (score >= 3) return 'score-good'
  if (score >= 2) return 'score-fair'
  return 'score-poor'
}

// 当项目确定/变化时重新拉取
watch(effectiveProjectId, (pid) => {
  if (pid) {
    store.fetchRecommendations(pid)
  }
}, { immediate: true })
</script>

<style scoped>
.admin-talent-recommendation {
  padding: 20px;
}

.mb-4 {
  margin-bottom: 16px;
}

.ml-4 {
  margin-left: 16px;
}

.overview-card {
  height: 100%;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.card-content {
  padding: 8px 0;
}

.stat-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.stat-item:last-child {
  margin-bottom: 0;
}

.progress {
  width: 120px;
}

.list-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-left {
  display: flex;
  align-items: center;
}

.title {
  font-size: 16px;
  font-weight: bold;
}

/* 原有评分显示样式 - 保留以防其他地方使用 */
.score-display {
  display: flex;
  gap: 8px;
}

.score-item {
  display: flex;
  flex-direction: column;
  align-items: center;
}

/* 新的紧凑评分显示样式 */
.score-display-compact {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}

.score-item-compact {
  display: flex;
  flex-direction: column;
  align-items: center;
  min-width: 35px;
}

.score-label {
  font-size: 11px;
  color: #666;
  margin-bottom: 2px;
}

.score-value {
  font-size: 14px;
  font-weight: bold;
  padding: 2px 6px;
  border-radius: 4px;
  min-width: 20px;
  text-align: center;
}

.score-excellent {
  background-color: #f0f9ff;
  color: #1e40af;
  border: 1px solid #3b82f6;
}

.score-good {
  background-color: #f0fdf4;
  color: #166534;
  border: 1px solid #22c55e;
}

.score-fair {
  background-color: #fffbeb;
  color: #92400e;
  border: 1px solid #f59e0b;
}

.score-poor {
  background-color: #fef2f2;
  color: #dc2626;
  border: 1px solid #ef4444;
}

/* 操作按钮样式 */
.action-buttons {
  display: flex;
  gap: 4px;
  justify-content: center;
}

.pagination-container {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}

.detail-content {
  padding: 20px;
}

.score-detail {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
  margin: 20px 0;
}

.score-label {
  display: inline-block;
  width: 80px;
}

.reason-text {
  line-height: 1.6;
  color: #606266;
}

.review-record {
  background-color: #f8f9fa;
  padding: 16px;
  border-radius: 4px;
}

.review-record p {
  margin: 8px 0;
}

.header-left .el-radio-group{ display:inline-flex; white-space:nowrap; }
</style> 