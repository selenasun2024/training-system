<template>
  <div class="counselor-recommendation">
    <!-- 学员表现仪表盘 -->
    <el-card class="dashboard-card" shadow="never" v-loading="store.loading">
      <template #header>
        <div class="card-header">
          <span>学员表现仪表盘</span>
          <el-button type="primary" size="small" @click="refreshDashboard">手动刷新</el-button>
        </div>
      </template>
      
      <!-- 添加数据状态显示 -->
      <div v-if="store.loading && store.studentPerformance.length === 0" class="loading-tip">
        <el-alert
          title="正在加载学员数据..."
          type="info"
          show-icon
          :closable="false"
        />
      </div>
      
      <div v-else-if="!store.loading && store.studentPerformance.length === 0" class="empty-tip">
        <el-alert
          title="暂无学员数据"
          description="当前项目中没有学员数据，或您还没有为学员创建观察记录"
          type="warning"
          show-icon
          :closable="false"
        />
      </div>
      
      <el-table 
        v-else
        :data="store.studentPerformance" 
        style="width: 100%" 
        @row-click="handleStudentSelect"
        :highlight-current-row="true"
      >
        <el-table-column prop="name" label="学员姓名" width="120" />
        <el-table-column prop="rank" label="成绩排名" width="100" sortable />
        <el-table-column prop="attendance" label="考勤率" width="100" sortable>
          <template #default="{ row }">
            {{ row.attendance }}%
          </template>
        </el-table-column>
        <el-table-column prop="role" label="担任角色" width="120" />
        <el-table-column prop="taskCompletion" label="作业完成率" width="120" sortable>
          <template #default="{ row }">
            {{ row.taskCompletion }}%
          </template>
        </el-table-column>
        <el-table-column prop="observationTags" label="关键评语">
          <template #default="{ row }">
            <el-tag 
              v-for="tag in row.observationTags" 
              :key="tag"
              size="small"
              class="mx-1"
            >
              {{ tag }}
            </el-tag>
          </template>
        </el-table-column>
      </el-table>
    </el-card>



    <!-- 推荐历史 -->
    <el-card class="dashboard-card" shadow="never" v-show="recommendationCount > 0">
      <template #header>
        <div class="card-header">
          <span>推荐历史</span>
          <div>
            <el-tag type="info">已推荐 {{ recommendationCount }} 人</el-tag>
            <el-button type="primary" size="small" @click="forceRefreshRecommendations" style="margin-left: 10px;">
              刷新推荐记录
            </el-button>
          </div>
        </div>
      </template>
      
      <el-table :data="recommendationData" style="width: 100%" max-height="300">
        <el-table-column prop="studentName" label="学员姓名" width="120" />
        <el-table-column prop="type" label="推荐类型" width="100">
          <template #default="{ row }">
            <el-tag :type="row.type === 'YULIN' ? 'success' : 'warning'">
              {{ row.type === 'YULIN' ? '羽林卫' : '锦衣卫' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag 
              :type="row.status === 'PENDING' ? 'info' : row.status === 'APPROVED' ? 'success' : 'danger'"
            >
              {{ 
                row.status === 'PENDING' ? '待审核' : 
                row.status === 'APPROVED' ? '已通过' : '已驳回' 
              }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="评分" width="200">
          <template #default="{ row }">
            <div class="evaluation-scores">
              <span>领导力: {{ row.evaluation.leadership }}/5</span>
              <span>创新: {{ row.evaluation.innovation }}/5</span>
              <span>执行: {{ row.evaluation.execution }}/5</span>
              <span>团队: {{ row.evaluation.teamwork }}/5</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="createdAt" label="推荐时间" width="180">
          <template #default="{ row }">
            {{ new Date(row.createdAt).toLocaleString() }}
          </template>
        </el-table-column>
        <el-table-column label="推荐理由" min-width="200">
          <template #default="{ row }">
            <el-tooltip :content="row.evaluation.reason" placement="top" :disabled="!row.evaluation.reason">
              <span class="reason-text">{{ row.evaluation.reason || '无' }}</span>
            </el-tooltip>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 推荐表单 -->
    <el-card class="recommendation-card" shadow="never" v-loading="store.loading">
      <template #header>
        <div class="card-header">
          <span>人才推荐</span>
          <el-button-group>
            <el-button type="success" @click="submitRecommendations" :disabled="!hasSelectedStudents">提交推荐</el-button>
            <el-button @click="clearSelection">清空选择</el-button>
          </el-button-group>
        </div>
      </template>



              <el-form ref="formRef" :model="recommendForm" label-width="120px">


        <el-tabs v-model="activeRecommendType">
          <el-tab-pane label="羽林卫" name="yulin">
            <el-form-item label="推荐名单">
              <el-select
                v-model="recommendForm.yulinList"
                multiple
                placeholder="请选择羽林卫推荐人选"
                style="width: 100%"
                clearable
                filterable
                @change="handleSelectionChange"
              >
                <el-option
                  v-for="student in store.availableStudents"
                  :key="student.id"
                  :label="`${student.name} (排名:${student.rank})`"
                  :value="student.id"
                >
                  {{ student.name }} (排名:{{ student.rank }})
                </el-option>
              </el-select>
            </el-form-item>
          </el-tab-pane>
          
          <el-tab-pane label="锦衣卫" name="jinyi">
            <el-form-item label="推荐名单">
              <el-select
                v-model="recommendForm.jinyiList"
                multiple
                placeholder="请选择锦衣卫推荐人选"
                style="width: 100%"
                clearable
                filterable
                @change="handleSelectionChange"
              >
                <el-option
                  v-for="student in store.availableStudents"
                  :key="student.id"
                  :label="`${student.name} (排名:${student.rank})`"
                  :value="student.id"
                >
                  {{ student.name }} (排名:{{ student.rank }})
                </el-option>
              </el-select>
            </el-form-item>
          </el-tab-pane>
        </el-tabs>

        <!-- 结构化推荐评语 -->
        <template v-if="selectedStudents.length > 0">
          <el-divider>推荐评语</el-divider>
          <div v-for="studentId in selectedStudents" :key="studentId" class="recommendation-reason">
            <h4>{{ getStudentName(studentId) }}</h4>
            <template v-if="recommendForm.evaluations[studentId]">
              <el-form-item label="领导力">
                <el-rate v-model="recommendForm.evaluations[studentId].leadership" />
              </el-form-item>
              <el-form-item label="创新能力">
                <el-rate v-model="recommendForm.evaluations[studentId].innovation" />
              </el-form-item>
              <el-form-item label="执行力">
                <el-rate v-model="recommendForm.evaluations[studentId].execution" />
              </el-form-item>
              <el-form-item label="团队协作">
                <el-rate v-model="recommendForm.evaluations[studentId].teamwork" />
              </el-form-item>
              <el-form-item label="推荐理由">
                <el-input
                  v-model="recommendForm.evaluations[studentId].reason"
                  type="textarea"
                  :rows="3"
                  placeholder="请详细描述推荐该学员的原因..."
                />
              </el-form-item>
            </template>
            <div v-else style="color: #999; font-style: italic;">
              正在初始化评价表单...
            </div>
          </div>
        </template>
      </el-form>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch, reactive, nextTick } from 'vue'
import { ElMessage } from 'element-plus'
import { useRecommendationStore } from '@/stores/recommendation'
import type { RecommendationForm } from '@/types/recommendation'

const props = defineProps<{ projectId: string; active?: boolean }>()
const store = useRecommendationStore()

const activeRecommendType = ref('yulin')
const formRef = ref()


// 添加计算属性确保响应性
const recommendationCount = computed(() => {
  const count = store.recommendationRecords.length
  return count
})
const recommendationData = computed(() => {
  const data = store.recommendationRecords
  return data
})

const recommendForm = reactive<RecommendationForm>({
  yulinList: [],
  jinyiList: [],
  evaluations: {}
})

// 计算当前选中的所有学员
const selectedStudents = computed(() => {
  const yulin = recommendForm.yulinList || []
  const jinyi = recommendForm.jinyiList || []
  return [...new Set([...yulin, ...jinyi])]
})

// 计算是否有选中的学员
const hasSelectedStudents = computed(() => {
  return selectedStudents.value.length > 0
})

// 获取当前用户ID用于调试
const currentUserId = computed(() => {
  return localStorage.getItem('userId') || 'not-found'
})

// 初始化评价表单
const initEvaluation = (studentId: string) => {
  if (!recommendForm.evaluations[studentId]) {
    recommendForm.evaluations[studentId] = {
      leadership: 0,
      innovation: 0,
      execution: 0,
      teamwork: 0,
      reason: ''
    }
  }
}

// 处理选择变化
const handleSelectionChange = async () => {
  // 使用nextTick确保响应式数据更新完成
  await nextTick()
  
  // 为新选中的学员初始化评价表单
  selectedStudents.value.forEach(studentId => {
    initEvaluation(studentId)
  })
  
  // 清理已取消选择的学员评价数据
  Object.keys(recommendForm.evaluations).forEach(studentId => {
    if (!selectedStudents.value.includes(studentId)) {
      delete recommendForm.evaluations[studentId]
    }
  })
}

// 监听选择变化
const handleStudentSelect = (row: any) => {
  initEvaluation(row.id)
}

// 获取学员姓名
const getStudentName = (studentId: string) => {
  const student = store.studentPerformance.find(s => s.id === studentId)
  return student ? student.name : '未知学员'
}

// 刷新仪表盘数据
const refreshDashboard = async () => {
  if (!props.projectId) {
    ElMessage.warning('项目ID无效')
    return
  }
  
  if (!props.active) {
    ElMessage.warning('请切换到当前项目tab后再刷新')
    return
  }
  
  try {
    await store.fetchStudentPerformance(props.projectId)
    // 强制重新渲染
    await nextTick()
    ElMessage.success('数据已更新')
  } catch (error) {
    console.error('刷新数据失败:', error)
    ElMessage.error('更新数据失败')
  }
}

// 初始化数据
const initializeData = async () => {
  if (!props.projectId) {
    return
  }
  
  // 只有当前组件是活跃状态时才获取数据
  if (!props.active) {
    return
  }
  
  try {
    // 首先清空之前的数据，确保状态一致
    store.resetData()
    
    // 串行加载，确保推荐记录能够正确获取
    await store.fetchStudentPerformance(props.projectId)
    
    // 再次检查组件是否仍然活跃（防止异步过程中tab切换）
    if (!props.active) {
      return
    }
    
    await store.fetchRecommendationRecords(props.projectId)
    
    // 最后一次检查组件是否仍然活跃
    if (!props.active) {
      return
    }
    
    // 使用nextTick确保数据更新后UI也更新
    await nextTick()
    
  } catch (error) {
    console.error('🔍 初始化数据失败:', error)
    if (props.active) {
      ElMessage.error('加载数据失败: ' + error.message)
    }
  }
}

// 强制刷新推荐记录
const forceRefreshRecommendations = async () => {
  if (!props.projectId) {
    ElMessage.warning('项目ID无效')
    return
  }
  
  if (!props.active) {

    ElMessage.warning('请切换到当前项目tab后再刷新')
    return
  }
  
  try {
    await store.fetchRecommendationRecords(props.projectId)
    await nextTick() // 确保UI更新
    ElMessage.success(`推荐记录已刷新，共${recommendationCount.value}条`)
  } catch (error) {
    console.error('强制刷新失败:', error)
    ElMessage.error('刷新推荐记录失败')
  }
}

// 清空选择
const clearSelection = () => {
  recommendForm.yulinList = []
  recommendForm.jinyiList = []
  recommendForm.evaluations = {}
}



// 提交推荐
const submitRecommendations = async () => {
  if (!props.projectId) {
    ElMessage.warning('项目ID无效')
    return
  }
  
  if (!props.active) {
    ElMessage.warning('请在当前项目tab下进行操作')
    return
  }
  
  if (!hasSelectedStudents.value) {
    ElMessage.warning('请先选择推荐学员')
    return
  }
  
  try {
    await store.submitRecommendations(props.projectId, recommendForm)
    ElMessage.success('推荐已提交')
    
    // 清空表单
    clearSelection()
  } catch (error) {
    console.error('提交推荐失败:', error)
    ElMessage.error('提交推荐失败')
  }
}

// 监听推荐记录的变化
watch(
  () => store.recommendationRecords,
  (newRecords, oldRecords) => {
    // 推荐记录变化时的处理逻辑
  },
  { deep: true, immediate: true }
)

// 组件挂载时获取数据
onMounted(async () => {
  // 等待DOM完全挂载
  await nextTick()
  
  // 只有在组件活跃且有项目ID时才初始化数据
  if (props.projectId && props.active) {
    await initializeData()
  }
})

// 监听项目ID变化
watch(() => props.projectId, async (newProjectId, oldProjectId) => {
  if (newProjectId && newProjectId !== oldProjectId) {
    await initializeData()
  } else if (newProjectId && !oldProjectId) {
    // 处理初始项目ID设置的情况（组件挂载后才传入projectId）
    await initializeData()
  } else if (!newProjectId && oldProjectId) {
    // 项目ID被清空
    store.resetData()
  }
}, { immediate: true }) // 立即执行以处理初始值

// 监听active状态变化，当tab激活时重新加载数据
watch(() => props.active, async (newActive, oldActive) => {
  if (newActive && !oldActive && props.projectId) {
    await initializeData()
  }
}, { immediate: false })

// 监听学员数据变化
watch(() => store.studentPerformance, (newData) => {
  // 学员数据变化时的处理逻辑
}, { deep: true, immediate: true })

// 监听羽林卫列表变化
watch(() => recommendForm.yulinList, (newList) => {
  // 羽林卫列表变化时的处理逻辑
}, { deep: true })

// 监听锦衣卫列表变化  
watch(() => recommendForm.jinyiList, (newList) => {
  // 锦衣卫列表变化时的处理逻辑
}, { deep: true })

// 生命周期：组件卸载时清理
onUnmounted(() => {
  // 组件卸载时的清理逻辑
})

// 监听评价数据变化
watch(() => recommendForm.evaluations, (newEvaluations) => {
  // 评价数据变化时的处理逻辑
}, { deep: true })
</script>

<style scoped>
.counselor-recommendation {
  padding: 20px;
}

.dashboard-card {
  margin-bottom: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.recommendation-card {
  margin-top: 20px;
}

.recommendation-reason {
  padding: 16px;
  margin: 16px 0;
  background-color: #f8f9fa;
  border-radius: 4px;
}

.recommendation-reason h4 {
  margin-top: 0;
  margin-bottom: 16px;
  color: #409EFF;
}

.option-rank {
  float: right;
  color: #909399;
  font-size: 13px;
}

:deep(.el-tag) {
  margin-right: 4px;
}

.evaluation-scores {
  display: flex;
  flex-direction: column;
  gap: 2px;
  font-size: 12px;
}

.evaluation-scores span {
  color: #666;
}

.reason-text {
  max-width: 200px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  display: inline-block;
}
</style> 