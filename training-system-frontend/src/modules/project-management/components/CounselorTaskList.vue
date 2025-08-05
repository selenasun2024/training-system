<template>
  <div class="counselor-task-list">
    <el-card shadow="never">
      <template #header>
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <h3>辅导员工作台</h3>
          <el-button @click="refreshAllTasks" :loading="store.loading || store.reviewedLoading">
            刷新
          </el-button>
        </div>
      </template>

      <!-- Tab切换 -->
      <el-tabs v-model="activeTab" @tab-change="handleTabChange">
        <!-- 待批阅 Tab -->
        <el-tab-pane name="pending" :label="`待批阅 (${store.pendingTasks.length})`">
          <div v-loading="store.loading">
            <div v-if="store.pendingTasks.length === 0" class="empty-state">
              <el-empty description="暂无待批阅任务" />
            </div>
            <div v-else>
              <!-- 按项目分组显示 -->
              <el-collapse v-model="openedProjects">
                <el-collapse-item
                  v-for="group in groupedPendingTasks"
                  :key="group.projectId"
                  :name="group.projectId"
                >
                  <template #title>
                    <span>{{ group.projectName }}</span>
                    <el-badge :value="group.pendingCount" type="warning" style="margin-left: 8px;">
                      <span>待批阅</span>
                    </el-badge>
                  </template>
                  <el-table
                    :data="group.tasks"
                    style="width: 100%"
                    @row-click="row => goToReview(row)"
                  >
                    <el-table-column prop="title" label="任务名称" min-width="200" />
                    <el-table-column prop="deadline" label="截止时间" width="120" />
                    <el-table-column 
                      label="待批阅数量" 
                      width="120" 
                      align="center"
                      :formatter="(_, row) => row?.submissions?.length || 0"
                    />
                    <el-table-column label="操作" width="100" align="center">
                      <template #default="{ row }">
                        <el-button 
                          type="primary" 
                          size="small" 
                          @click.stop="goToReview(row)"
                        >
                          批阅
                        </el-button>
                      </template>
                    </el-table-column>
                  </el-table>
                </el-collapse-item>
              </el-collapse>
            </div>
          </div>
        </el-tab-pane>

        <!-- 已批阅 Tab -->
        <el-tab-pane name="reviewed" :label="`已批阅 (${store.reviewedTasks.length})`">
          <div v-loading="store.reviewedLoading">
            <div v-if="store.reviewedTasks.length === 0" class="empty-state">
              <el-empty description="暂无已批阅任务" />
            </div>
            <div v-else>
              <!-- 按项目分组显示 -->
              <el-collapse v-model="openedReviewedProjects">
                <el-collapse-item
                  v-for="group in groupedReviewedTasks"
                  :key="group.projectId"
                  :name="group.projectId"
                >
                  <template #title>
                    <span>{{ group.projectName }}</span>
                    <el-badge :value="group.reviewedCount" type="success" style="margin-left: 8px;">
                      <span>已批阅</span>
                    </el-badge>
                  </template>
                  <el-table
                    :data="group.tasks"
                    style="width: 100%"
                  >
                    <el-table-column prop="title" label="任务名称" min-width="200" />
                    <el-table-column prop="deadline" label="截止时间" width="120" />
                    <el-table-column 
                      label="已批阅数量" 
                      width="120" 
                      align="center"
                      :formatter="(_, row) => row?.submissions?.length || 0"
                    />
                    <el-table-column label="平均分" width="100" align="center">
                      <template #default="{ row }">
                        <span v-if="row.submissions.length > 0">
                          {{ getAverageScore(row.submissions) }}
                        </span>
                        <span v-else>-</span>
                      </template>
                    </el-table-column>
                    <el-table-column label="操作" width="100" align="center">
                      <template #default="{ row }">
                        <el-button 
                          size="small" 
                          @click="handleViewReviewed(row)"
                        >
                          查看
                        </el-button>
                      </template>
                    </el-table-column>
                  </el-table>
                </el-collapse-item>
              </el-collapse>
            </div>
          </div>
        </el-tab-pane>
      </el-tabs>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, onMounted, onActivated } from 'vue'
import { useRouter } from 'vue-router'
import { useCounselorTaskStore } from '@/stores/counselorTasks'
import type { TaskForReview } from '@/types/task'

const store = useCounselorTaskStore()
const router = useRouter()

const activeTab = ref('pending')
const openedProjects = ref<string[]>([])
const openedReviewedProjects = ref<string[]>([])

interface Props {
  projectId?: string
}

defineProps<Props>()

async function load() {
  // 初始化时获取待批阅任务
  if (!store.loading && store.pendingTasks.length === 0) {
    await store.fetchTasks()
    openedProjects.value = store.pendingTasks.map(t => t.projectId) // 默认全部展开
  }
}

onMounted(load)
onActivated(load)

const handleTabChange = async (tabName: string) => {
  if (tabName === 'reviewed' && store.reviewedTasks.length === 0) {
    // 第一次切换到已批阅tab时才加载数据
    await store.fetchReviewedTasks()
    openedReviewedProjects.value = store.reviewedTasks.map(t => t.projectId) // 默认全部展开
  }
}

const refreshAllTasks = async () => {
  await store.refreshAllTasks()
  // 刷新后重新展开所有项目
  openedProjects.value = store.pendingTasks.map(t => t.projectId)
  openedReviewedProjects.value = store.reviewedTasks.map(t => t.projectId)
}

// 分组显示待批阅任务
const groupedPendingTasks = computed(() => {
  const map: Record<string, { projectId: string; projectName: string; tasks: any[]; pendingCount: number }> = {}
  store.pendingTasks.forEach(t => {
    if (!map[t.projectId]) {
      map[t.projectId] = {
        projectId: t.projectId,
        projectName: t.projectName,
        tasks: [],
        pendingCount: 0,
      }
    }
    map[t.projectId].tasks.push(t)
    map[t.projectId].pendingCount += t.submissions.length
  })
  return Object.values(map)
})

// 分组显示已批阅任务
const groupedReviewedTasks = computed(() => {
  const map: Record<string, { projectId: string; projectName: string; tasks: any[]; reviewedCount: number }> = {}
  store.reviewedTasks.forEach(t => {
    if (!map[t.projectId]) {
      map[t.projectId] = {
        projectId: t.projectId,
        projectName: t.projectName,
        tasks: [],
        reviewedCount: 0,
      }
    }
    map[t.projectId].tasks.push(t)
    map[t.projectId].reviewedCount += t.submissions.length
  })
  return Object.values(map)
})

function goToReview(row: TaskForReview) {
  router.push({ name: 'CounselorTaskReview', params: { projectId: row.projectId, taskId: row.id } })
}

const handleViewReviewed = (task: TaskForReview) => {
  // 暂时也用同一个批阅界面查看已批阅任务，后续可以创建专门的查看页面
  router.push({ name: 'CounselorTaskReview', params: { projectId: task.projectId, taskId: task.id } })
}

const getAverageScore = (submissions: any[]) => {
  const scores = submissions.filter(sub => sub.score !== undefined).map(sub => sub.score)
  if (scores.length === 0) return '-'
  const average = scores.reduce((sum, score) => sum + score, 0) / scores.length
  return average.toFixed(1)
}
</script>

<style scoped>
.counselor-task-list {
  padding: 20px;
}

.empty-state {
  padding: 40px 0;
}

.el-badge {
  line-height: 1;
}

/* 确保折叠面板标题中的徽章显示正确 */
:deep(.el-collapse-item__header) {
  display: flex;
  align-items: center;
}
</style> 