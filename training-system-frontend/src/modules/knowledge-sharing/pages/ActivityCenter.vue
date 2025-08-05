<template>
  <div class="activity-center">
    <!-- 页面头部 -->
    <div class="page-header">
      <div class="header-content">
        <div class="header-left">
          <h1 class="page-title">活动中心</h1>
          <p class="page-description">发现和参与各种知识分享活动，与同事一起学习成长</p>
        </div>
        <div class="header-right">
          <el-button type="primary" :icon="Plus" @click="handleCreateActivity">
            创建活动
          </el-button>
        </div>
      </div>
    </div>

    <!-- 搜索区域 -->
    <ActivitySearch
      @search="handleSearch"
      @view-mode-change="handleViewModeChange"
      @create-activity="handleCreateActivity"
      @view-calendar="handleViewCalendar"
    />

    <!-- 快速导航 -->
    <div class="quick-nav">
      <div class="nav-tabs">
        <div
          v-for="tab in quickTabs"
          :key="tab.key"
          :class="['nav-tab', { active: activeTab === tab.key }]"
          @click="setActiveTab(tab.key)"
        >
          <el-icon :size="18">
            <component :is="tab.icon" />
          </el-icon>
          <span>{{ tab.label }}</span>
          <el-badge
            v-if="tab.count > 0"
            :value="tab.count"
            type="primary"
            class="tab-badge"
          />
        </div>
      </div>
    </div>

    <!-- 推荐活动 -->
    <div class="recommended-section" v-if="activeTab === 'all' && recommendations.length > 0">
      <div class="section-header">
        <h2 class="section-title">
          <el-icon><Star /></el-icon>
          推荐活动
        </h2>
        <el-button text @click="refreshRecommendations">
          <el-icon><Refresh /></el-icon>
          换一批
        </el-button>
      </div>
      <div class="recommendations-grid">
        <ActivityCard
          v-for="rec in recommendations"
          :key="rec.activityId"
          :activity="rec.activity"
          class="recommendation-card"
        >
          <template #extra>
            <div class="recommendation-reasons">
              <el-tag
                v-for="reason in rec.reasons.slice(0, 2)"
                :key="reason"
                size="small"
                type="success"
                effect="plain"
              >
                {{ reason }}
              </el-tag>
            </div>
          </template>
        </ActivityCard>
      </div>
    </div>

    <!-- 活动列表 -->
    <div class="activities-section">
      <div class="section-header">
        <h2 class="section-title">
          {{ getSectionTitle() }}
        </h2>
        <div class="section-actions">
          <el-button-group>
            <el-button
              :type="viewMode === 'grid' ? 'primary' : 'default'"
              :icon="Grid"
              @click="setViewMode('grid')"
            />
            <el-button
              :type="viewMode === 'list' ? 'primary' : 'default'"
              :icon="List"
              @click="setViewMode('list')"
            />
          </el-button-group>
        </div>
      </div>

      <!-- 加载状态 -->
      <div v-if="loading" class="loading-container">
        <el-skeleton :rows="3" animated />
      </div>

      <!-- 空状态 -->
      <div v-else-if="currentActivities.length === 0" class="empty-state">
        <el-empty description="暂无活动">
          <el-button type="primary" @click="handleCreateActivity">
            创建第一个活动
          </el-button>
        </el-empty>
      </div>

      <!-- 活动网格视图 -->
      <div
        v-else-if="viewMode === 'grid'"
        class="activities-grid"
      >
        <ActivityCard
          v-for="activity in currentActivities"
          :key="activity.id"
          :activity="activity"
          @click="handleActivityClick(activity)"
        />
      </div>

      <!-- 活动列表视图 -->
      <div
        v-else
        class="activities-list"
      >
        <ActivityCard
          v-for="activity in currentActivities"
          :key="activity.id"
          :activity="activity"
          :class="'list-item'"
          @click="handleActivityClick(activity)"
        />
      </div>

      <!-- 分页 -->
      <div class="pagination-container" v-if="totalPages > 1">
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :page-sizes="[12, 24, 36, 48]"
          :total="totalResults"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </div>

    <!-- 浮动操作按钮 -->
    <div class="floating-actions">
      <el-button
        type="primary"
        :icon="Plus"
        size="large"
        circle
        @click="handleCreateActivity"
        class="fab-create"
      />
      <el-button
        :icon="ArrowUp"
        size="large"
        circle
        @click="scrollToTop"
        class="fab-top"
        v-show="showBackToTop"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import {
  Plus,
  Star,
  Refresh,
  Grid,
  List,
  ArrowUp,
  Calendar,
  Clock,
  User,
  Trophy
} from '@element-plus/icons-vue'
import type { KnowledgeActivity, ActivitySearchParams } from '@/types/activity'
import { useActivitiesStore } from '@/stores/activities'
import ActivitySearch from '@/components/business/ActivitySearch.vue'
import ActivityCard from '@/components/business/ActivityCard.vue'

const router = useRouter()
const activitiesStore = useActivitiesStore()

// 响应式状态
const loading = ref(false)
const viewMode = ref<'grid' | 'list'>('grid')
const activeTab = ref('all')
const currentPage = ref(1)
const pageSize = ref(12)
const showBackToTop = ref(false)

// 快速导航标签
const quickTabs = ref([
  {
    key: 'all',
    label: '全部活动',
    icon: Calendar,
    count: 0
  },
  {
    key: 'upcoming',
    label: '即将开始',
    icon: Clock,
    count: 0
  },
  {
    key: 'registered',
    label: '我的报名',
    icon: User,
    count: 0
  },
  {
    key: 'popular',
    label: '热门活动',
    icon: Trophy,
    count: 0
  }
])

// 计算属性
const currentActivities = computed(() => {
  let activities: KnowledgeActivity[] = []
  
  switch (activeTab.value) {
    case 'all':
      activities = activitiesStore.searchResults.length > 0 
        ? activitiesStore.searchResults 
        : activitiesStore.activities
      break
    case 'upcoming':
      activities = activitiesStore.upcomingActivities
      break
    case 'registered':
      activities = activitiesStore.registeredActivities
      break
    case 'popular':
      activities = activitiesStore.popularActivities
      break
    default:
      activities = activitiesStore.activities
  }
  
  // 分页
  const start = (currentPage.value - 1) * pageSize.value
  const end = start + pageSize.value
  return activities.slice(start, end)
})

const totalResults = computed(() => {
  switch (activeTab.value) {
    case 'all':
      return activitiesStore.searchResults.length > 0 
        ? activitiesStore.searchResults.length 
        : activitiesStore.activities.length
    case 'upcoming':
      return activitiesStore.upcomingActivities.length
    case 'registered':
      return activitiesStore.registeredActivities.length
    case 'popular':
      return activitiesStore.popularActivities.length
    default:
      return activitiesStore.activities.length
  }
})

const totalPages = computed(() => Math.ceil(totalResults.value / pageSize.value))

const recommendations = computed(() => activitiesStore.recommendations)

// 方法
const handleSearch = async (params: ActivitySearchParams) => {
  loading.value = true
  try {
    await activitiesStore.searchActivities(params.query || '', params)
    currentPage.value = 1
  } finally {
    loading.value = false
  }
}

const handleViewModeChange = (mode: 'grid' | 'list') => {
  viewMode.value = mode
}

const setViewMode = (mode: 'grid' | 'list') => {
  viewMode.value = mode
}

const setActiveTab = (tab: string) => {
  activeTab.value = tab
  currentPage.value = 1
}

const getSectionTitle = () => {
  const tab = quickTabs.value.find(t => t.key === activeTab.value)
  return tab ? tab.label : '全部活动'
}

const handleCreateActivity = () => {
  router.push('/training-management/knowledge-sharing/activities/create')
}

const handleViewCalendar = () => {
  router.push('/training-management/knowledge-sharing/activities/calendar')
}

const handleActivityClick = (activity: KnowledgeActivity) => {
  router.push(`/training-management/knowledge-sharing/activities/${activity.id}`)
}

const refreshRecommendations = async () => {
  await activitiesStore.fetchRecommendations()
}

const handleSizeChange = (size: number) => {
  pageSize.value = size
  currentPage.value = 1
}

const handleCurrentChange = (page: number) => {
  currentPage.value = page
  scrollToTop()
}

const scrollToTop = () => {
  window.scrollTo({
    top: 0,
    behavior: 'smooth'
  })
}

const handleScroll = () => {
  showBackToTop.value = window.scrollY > 300
}

const updateTabCounts = () => {
  quickTabs.value.forEach(tab => {
    switch (tab.key) {
      case 'all':
        tab.count = activitiesStore.activities.length
        break
      case 'upcoming':
        tab.count = activitiesStore.upcomingActivities.length
        break
      case 'registered':
        tab.count = activitiesStore.registeredActivities.length
        break
      case 'popular':
        tab.count = activitiesStore.popularActivities.length
        break
    }
  })
}

// 生命周期
onMounted(async () => {
  loading.value = true
  
  try {
    // 并行加载数据
    await Promise.all([
      activitiesStore.fetchActivities(),
      activitiesStore.fetchRecommendations(),
      activitiesStore.fetchFilterOptions()
    ])
    
    updateTabCounts()
    window.addEventListener('scroll', handleScroll)
  } finally {
    loading.value = false
  }
})

onUnmounted(() => {
  window.removeEventListener('scroll', handleScroll)
})
</script>

<style scoped>
.activity-center {
  min-height: 100vh;
  background: #f8f9fa;
}

.page-header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 40px 0;
  margin-bottom: 24px;
}

.header-content {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 24px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.page-title {
  font-size: 32px;
  font-weight: 700;
  margin: 0 0 8px 0;
}

.page-description {
  font-size: 16px;
  opacity: 0.9;
  margin: 0;
}

.header-right {
  display: flex;
  gap: 12px;
}

.quick-nav {
  max-width: 1200px;
  margin: 0 auto 24px;
  padding: 0 24px;
}

.nav-tabs {
  display: flex;
  gap: 8px;
  background: white;
  border-radius: 12px;
  padding: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
}

.nav-tab {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
  color: #606266;
  font-weight: 500;
  position: relative;
}

.nav-tab:hover {
  background: #f0f2f5;
  color: #409eff;
}

.nav-tab.active {
  background: #409eff;
  color: white;
}

.tab-badge {
  position: absolute;
  top: -4px;
  right: -4px;
}

.recommended-section,
.activities-section {
  max-width: 1200px;
  margin: 0 auto 32px;
  padding: 0 24px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.section-title {
  font-size: 20px;
  font-weight: 600;
  color: #303133;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 8px;
}

.section-actions {
  display: flex;
  gap: 12px;
  align-items: center;
}

.recommendations-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;
  margin-bottom: 32px;
}

.recommendation-card {
  position: relative;
  overflow: visible;
}

.recommendation-reasons {
  position: absolute;
  top: -8px;
  right: -8px;
  display: flex;
  gap: 4px;
  flex-direction: column;
  align-items: flex-end;
}

.activities-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 24px;
}

.activities-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.activities-list .list-item {
  border-radius: 8px;
}

.loading-container {
  padding: 40px 0;
}

.empty-state {
  text-align: center;
  padding: 60px 0;
}

.pagination-container {
  display: flex;
  justify-content: center;
  margin-top: 32px;
  padding: 20px 0;
}

.floating-actions {
  position: fixed;
  bottom: 24px;
  right: 24px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  z-index: 1000;
}

.fab-create,
.fab-top {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  transition: all 0.3s ease;
}

.fab-create:hover,
.fab-top:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.2);
}

/* 响应式设计 */
@media (max-width: 768px) {
  .header-content {
    flex-direction: column;
    text-align: center;
    gap: 20px;
  }
  
  .page-title {
    font-size: 24px;
  }
  
  .nav-tabs {
    flex-wrap: wrap;
    gap: 4px;
  }
  
  .nav-tab {
    padding: 8px 12px;
    font-size: 14px;
  }
  
  .activities-grid {
    grid-template-columns: 1fr;
    gap: 16px;
  }
  
  .recommendations-grid {
    grid-template-columns: 1fr;
    gap: 16px;
  }
  
  .section-header {
    flex-direction: column;
    gap: 12px;
    align-items: stretch;
  }
  
  .floating-actions {
    bottom: 16px;
    right: 16px;
  }
}

@media (max-width: 480px) {
  .recommended-section,
  .activities-section {
    padding: 0 16px;
  }
  
  .page-header {
    padding: 24px 0;
  }
  
  .header-content {
    padding: 0 16px;
  }
}
</style> 