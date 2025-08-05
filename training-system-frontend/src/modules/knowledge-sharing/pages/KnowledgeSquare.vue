<template>
  <div class="knowledge-square">
    <!-- 页面头部 -->
    <div class="page-header">
      <div class="header-content">
        <h1 class="page-title">知识广场</h1>
        <p class="page-description">发现和分享有价值的知识内容</p>
      </div>
      <div class="header-actions">
        <el-button type="primary" @click="handleCreateKnowledge">
          <el-icon><Plus /></el-icon>
          发布知识
        </el-button>
      </div>
    </div>

    <!-- 搜索区域 -->
    <div class="search-section">
      <KnowledgeSearch
        :loading="loading"
        :total-results="totalResults"
        :show-filters="showMobileFilters"
        :show-result-bar="hasSearched"
        @search="handleSearch"
        @filter="handleFilter"
        @sort-change="handleSortChange"
        @view-mode-change="handleViewModeChange"
      />
    </div>

    <!-- 主要内容区域 -->
    <div class="main-content">
      <!-- 侧边栏筛选 -->
      <div class="sidebar" v-if="!isMobile">
        <KnowledgeFilter
          :total-results="totalResults"
          @filter-change="handleFilterChange"
        />
      </div>

      <!-- 知识内容区域 -->
      <div class="content-area">
        <!-- 推荐内容 -->
        <div v-if="!hasSearched && !loading" class="recommended-section">
          <!-- 热门知识 -->
          <div class="section-block">
            <div class="section-header">
              <h2 class="section-title">
                <el-icon><TrendCharts /></el-icon>
                热门知识
              </h2>
              <el-button text @click="viewAllPopular">查看全部</el-button>
            </div>
            <div class="knowledge-grid">
              <KnowledgeCard
                v-for="asset in popularAssets"
                :key="asset.id"
                :asset="asset"
                @click="handleCardClick"
                @like="handleCardLike"
                @collect="handleCardCollect"
                @share="handleCardShare"
              />
            </div>
          </div>

          <!-- 最新知识 -->
          <div class="section-block">
            <div class="section-header">
              <h2 class="section-title">
                <el-icon><Clock /></el-icon>
                最新发布
              </h2>
              <el-button text @click="viewAllLatest">查看全部</el-button>
            </div>
            <div class="knowledge-grid">
              <KnowledgeCard
                v-for="asset in latestAssets"
                :key="asset.id"
                :asset="asset"
                @click="handleCardClick"
                @like="handleCardLike"
                @collect="handleCardCollect"
                @share="handleCardShare"
              />
            </div>
          </div>

          <!-- 推荐知识 -->
          <div v-if="recommendedAssets.length > 0" class="section-block">
            <div class="section-header">
              <h2 class="section-title">
                <el-icon><Star /></el-icon>
                为你推荐
              </h2>
            </div>
            <div class="knowledge-grid">
              <KnowledgeCard
                v-for="asset in recommendedAssets"
                :key="asset.id"
                :asset="asset"
                @click="handleCardClick"
                @like="handleCardLike"
                @collect="handleCardCollect"
                @share="handleCardShare"
              />
            </div>
          </div>
        </div>

        <!-- 搜索结果 -->
        <div v-if="hasSearched" class="search-results">
          <!-- 无结果提示 -->
          <div v-if="!loading && filteredAssets.length === 0" class="no-results">
            <el-empty description="没有找到相关知识内容">
              <el-button type="primary" @click="handleClearSearch">
                清空搜索条件
              </el-button>
            </el-empty>
          </div>

          <!-- 知识列表 -->
          <div v-else class="knowledge-list">
            <div
              :class="[
                'knowledge-container',
                viewMode === 'grid' ? 'grid-view' : 'list-view'
              ]"
            >
              <KnowledgeCard
                v-for="asset in filteredAssets"
                :key="asset.id"
                :asset="asset"
                @click="handleCardClick"
                @like="handleCardLike"
                @collect="handleCardCollect"
                @share="handleCardShare"
              />
            </div>

            <!-- 加载更多 -->
            <div v-if="hasMore && !loading" class="load-more">
              <el-button @click="handleLoadMore" :loading="loadingMore">
                加载更多
              </el-button>
            </div>
          </div>
        </div>

        <!-- 加载状态 -->
        <div v-if="loading" class="loading-container">
          <el-skeleton :rows="6" animated />
        </div>
      </div>
    </div>

    <!-- 移动端筛选抽屉 -->
    <el-drawer
      v-model="showMobileFilters"
      title="筛选条件"
      direction="rtl"
      size="300px"
      v-if="isMobile"
    >
      <KnowledgeFilter
        :total-results="totalResults"
        @filter-change="handleFilterChange"
      />
    </el-drawer>

    <!-- 回到顶部 -->
    <el-backtop :right="50" :bottom="50" />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import {
  Plus,
  TrendCharts,
  Clock,
  Star
} from '@element-plus/icons-vue';
import KnowledgeSearch from '@/components/business/KnowledgeSearch.vue';
import KnowledgeFilter from '@/components/business/KnowledgeFilter.vue';
import KnowledgeCard from '@/components/business/KnowledgeCard.vue';
import { useKnowledgeStore } from '@/stores/knowledge';
import type { KnowledgeAsset, KnowledgeSearchParams } from '@/types/knowledge';

const router = useRouter();
const knowledgeStore = useKnowledgeStore();

// 响应式状态
const isMobile = ref(false);
const showMobileFilters = ref(false);
const loading = ref(false);
const loadingMore = ref(false);
const hasSearched = ref(false);
const viewMode = ref<'grid' | 'list'>('grid');

// 计算属性
const filteredAssets = computed(() => knowledgeStore.filteredAssets);
const popularAssets = computed(() => knowledgeStore.popularAssets.slice(0, 8));
const latestAssets = computed(() => knowledgeStore.latestAssets.slice(0, 8));
const recommendedAssets = computed(() => knowledgeStore.recommendedAssets.slice(0, 8));
const totalResults = computed(() => knowledgeStore.totalAssets);
const hasMore = computed(() => knowledgeStore.hasMore);

// 检查屏幕大小
const checkScreenSize = () => {
  isMobile.value = window.innerWidth < 768;
};

// 事件处理
const handleSearch = async (params: KnowledgeSearchParams) => {
  try {
    loading.value = true;
    hasSearched.value = true;
    await knowledgeStore.searchAssets(params);
  } catch (error) {
    ElMessage.error('搜索失败，请重试');
  } finally {
    loading.value = false;
  }
};

const handleFilter = async (params: KnowledgeSearchParams) => {
  try {
    loading.value = true;
    hasSearched.value = true;
    await knowledgeStore.searchAssets(params);
  } catch (error) {
    ElMessage.error('筛选失败，请重试');
  } finally {
    loading.value = false;
  }
};

const handleFilterChange = async (params: KnowledgeSearchParams) => {
  try {
    loading.value = true;
    hasSearched.value = true;
    await knowledgeStore.searchAssets(params);
    showMobileFilters.value = false; // 关闭移动端筛选抽屉
  } catch (error) {
    ElMessage.error('筛选失败，请重试');
  } finally {
    loading.value = false;
  }
};

const handleSortChange = async (sortBy: string) => {
  try {
    loading.value = true;
    const params = {
      ...knowledgeStore.searchParams,
      sortBy: sortBy as any,
      page: 1
    };
    await knowledgeStore.searchAssets(params);
  } catch (error) {
    ElMessage.error('排序失败，请重试');
  } finally {
    loading.value = false;
  }
};

const handleViewModeChange = (mode: 'grid' | 'list') => {
  viewMode.value = mode;
  knowledgeStore.setViewMode(mode);
};

const handleLoadMore = async () => {
  try {
    loadingMore.value = true;
    const params = {
      ...knowledgeStore.searchParams,
      page: (knowledgeStore.searchParams.page || 1) + 1
    };
    await knowledgeStore.searchAssets(params);
  } catch (error) {
    ElMessage.error('加载失败，请重试');
  } finally {
    loadingMore.value = false;
  }
};

const handleClearSearch = () => {
  knowledgeStore.clearSearchResult();
  hasSearched.value = false;
  loadInitialData();
};

const handleCardClick = (asset: KnowledgeAsset) => {
  router.push(`/knowledge/detail/${asset.id}`);
};

const handleCardLike = (asset: KnowledgeAsset) => {
  // 点赞逻辑已在KnowledgeCard组件中处理
};

const handleCardCollect = (asset: KnowledgeAsset) => {
  // 收藏逻辑已在KnowledgeCard组件中处理
};

const handleCardShare = (asset: KnowledgeAsset) => {
  // TODO: 实现分享功能
  ElMessage.info('分享功能开发中...');
};

const handleCreateKnowledge = () => {
  router.push('/knowledge/create');
};

const viewAllPopular = () => {
  handleFilter({
    sortBy: 'viewCount',
    sortOrder: 'desc',
    page: 1,
    pageSize: 20
  });
};

const viewAllLatest = () => {
  handleFilter({
    sortBy: 'publishedAt',
    sortOrder: 'desc',
    page: 1,
    pageSize: 20
  });
};

// 初始化数据
const loadInitialData = async () => {
  try {
    loading.value = true;
    await Promise.all([
      knowledgeStore.fetchPopularAssets({ limit: 8 }),
      knowledgeStore.fetchLatestAssets({ limit: 8 }),
      // 如果有用户信息，获取推荐内容
      // knowledgeStore.fetchRecommendations(userId, { limit: 8 })
    ]);
  } catch (error) {
    ElMessage.error('加载数据失败，请刷新页面');
  } finally {
    loading.value = false;
  }
};

// 生命周期
onMounted(() => {
  checkScreenSize();
  window.addEventListener('resize', checkScreenSize);
  loadInitialData();
});

onUnmounted(() => {
  window.removeEventListener('resize', checkScreenSize);
});
</script>

<style scoped lang="scss">
.knowledge-square {
  min-height: 100vh;
  background: #f5f7fa;

  .page-header {
    background: white;
    padding: 24px;
    border-bottom: 1px solid #ebeef5;
    display: flex;
    justify-content: space-between;
    align-items: center;

    .header-content {
      .page-title {
        margin: 0 0 8px 0;
        font-size: 24px;
        font-weight: 600;
        color: #303133;
      }

      .page-description {
        margin: 0;
        color: #606266;
        font-size: 14px;
      }
    }

    .header-actions {
      flex-shrink: 0;
    }
  }

  .search-section {
    background: white;
    padding: 16px 24px;
    border-bottom: 1px solid #ebeef5;
  }

  .main-content {
    display: flex;
    gap: 24px;
    padding: 24px;
    align-items: flex-start;

    .sidebar {
      width: 280px;
      flex-shrink: 0;
      position: sticky;
      top: 24px;
    }

    .content-area {
      flex: 1;
      min-width: 0;
    }
  }

  .recommended-section {
    .section-block {
      margin-bottom: 48px;

      &:last-child {
        margin-bottom: 0;
      }

      .section-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 20px;

        .section-title {
          margin: 0;
          font-size: 18px;
          font-weight: 600;
          color: #303133;
          display: flex;
          align-items: center;
          gap: 8px;

          .el-icon {
            color: #409eff;
          }
        }
      }

      .knowledge-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
        gap: 20px;
      }
    }
  }

  .search-results {
    .no-results {
      text-align: center;
      padding: 60px 20px;
    }

    .knowledge-list {
      .knowledge-container {
        &.grid-view {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
          gap: 20px;
        }

        &.list-view {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
      }

      .load-more {
        text-align: center;
        margin-top: 32px;
      }
    }
  }

  .loading-container {
    padding: 20px;
  }
}

// 响应式设计
@media (max-width: 1200px) {
  .knowledge-square {
    .recommended-section {
      .section-block {
        .knowledge-grid {
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
        }
      }
    }

    .search-results {
      .knowledge-list {
        .knowledge-container {
          &.grid-view {
            grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          }
        }
      }
    }
  }
}

@media (max-width: 768px) {
  .knowledge-square {
    .page-header {
      flex-direction: column;
      align-items: stretch;
      gap: 16px;
      padding: 16px;

      .header-content {
        text-align: center;

        .page-title {
          font-size: 20px;
        }
      }
    }

    .search-section {
      padding: 12px 16px;
    }

    .main-content {
      flex-direction: column;
      padding: 16px;
      gap: 16px;

      .sidebar {
        width: 100%;
        position: static;
      }
    }

    .recommended-section {
      .section-block {
        margin-bottom: 32px;

        .section-header {
          .section-title {
            font-size: 16px;
          }
        }

        .knowledge-grid {
          grid-template-columns: 1fr;
          gap: 16px;
        }
      }
    }

    .search-results {
      .knowledge-list {
        .knowledge-container {
          &.grid-view {
            grid-template-columns: 1fr;
            gap: 16px;
          }
        }
      }
    }
  }
}

@media (max-width: 480px) {
  .knowledge-square {
    .page-header {
      padding: 12px;

      .page-title {
        font-size: 18px;
      }

      .page-description {
        font-size: 13px;
      }
    }

    .search-section {
      padding: 8px 12px;
    }

    .main-content {
      padding: 12px;
    }
  }
}
</style> 