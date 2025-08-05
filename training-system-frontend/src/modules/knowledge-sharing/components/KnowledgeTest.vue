<template>
  <div class="knowledge-test">
    <h2>知识分享模块测试</h2>
    
    <!-- 基础组件测试 -->
    <div class="test-section">
      <h3>基础组件测试</h3>
      
      <!-- 知识卡片测试 -->
      <div class="test-item">
        <h4>知识卡片组件</h4>
        <div class="card-test">
          <KnowledgeCard
            v-for="asset in mockAssets"
            :key="asset.id"
            :asset="asset"
            @click="handleCardClick"
            @like="handleCardLike"
            @collect="handleCardCollect"
            @share="handleCardShare"
          />
        </div>
      </div>
      
      <!-- 搜索组件测试 -->
      <div class="test-item">
        <h4>搜索组件</h4>
        <KnowledgeSearch
          :loading="searchLoading"
          :total-results="100"
          :show-filters="true"
          @search="handleSearch"
          @filter="handleFilter"
        />
      </div>
      
      <!-- 筛选组件测试 -->
      <div class="test-item">
        <h4>筛选组件</h4>
        <div style="width: 300px;">
          <KnowledgeFilter
            :total-results="100"
            @filter-change="handleFilterChange"
          />
        </div>
      </div>
    </div>
    
    <!-- Store 测试 -->
    <div class="test-section">
      <h3>Store 状态测试</h3>
      <div class="store-info">
        <p><strong>资产列表数量:</strong> {{ assetList.length }}</p>
        <p><strong>当前资产:</strong> {{ currentAsset?.title || '无' }}</p>
        <p><strong>搜索结果:</strong> {{ searchResult?.total || 0 }}</p>
        <p><strong>加载状态:</strong> {{ loading ? '加载中' : '空闲' }}</p>
        <p><strong>错误信息:</strong> {{ error || '无' }}</p>
      </div>
      
      <div class="store-actions">
        <el-button @click="testFetchAssets">测试获取资产列表</el-button>
        <el-button @click="testSearchAssets">测试搜索资产</el-button>
        <el-button @click="testClearData">清空数据</el-button>
      </div>
    </div>
    
    <!-- API 测试 -->
    <div class="test-section">
      <h3>API 接口测试</h3>
      <div class="api-test">
        <el-button @click="testKnowledgeApi" :loading="apiTesting">测试知识API</el-button>
        <div v-if="apiResult" class="api-result">
          <h4>API 测试结果:</h4>
          <pre>{{ JSON.stringify(apiResult, null, 2) }}</pre>
        </div>
      </div>
    </div>
    
    <!-- Composables 测试 -->
    <div class="test-section">
      <h3>Composables 测试</h3>
      <div class="composables-test">
        <div class="test-group">
          <h4>useKnowledgeList</h4>
          <p>列表加载状态: {{ listLoading ? '加载中' : '空闲' }}</p>
          <p>列表数量: {{ listAssets.length }}</p>
          <el-button @click="testLoadList">加载列表</el-button>
        </div>
        
        <div class="test-group">
          <h4>useKnowledgeSearch</h4>
          <p>搜索状态: {{ searching ? '搜索中' : '空闲' }}</p>
          <p>是否有搜索结果: {{ hasSearched ? '是' : '否' }}</p>
          <el-button @click="testSearch">测试搜索</el-button>
        </div>
        
        <div class="test-group">
          <h4>useKnowledgeUtils</h4>
          <p>格式化数量 (1234): {{ formatCount(1234) }}</p>
          <p>格式化时间: {{ formatTime(new Date()) }}</p>
          <p>文章类型标签: {{ getTypeLabel('article') }}</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { ElMessage } from 'element-plus';
import KnowledgeCard from '@/components/business/KnowledgeCard.vue';
import KnowledgeSearch from '@/components/business/KnowledgeSearch.vue';
import KnowledgeFilter from '@/components/business/KnowledgeFilter.vue';
import { useKnowledgeStore } from '@/stores/knowledge';
import {
  useKnowledgeList,
  useKnowledgeSearch,
  useKnowledgeUtils
} from '@/modules/knowledge-sharing/composables/useKnowledge';
import type { KnowledgeAsset, KnowledgeSearchParams } from '@/types/knowledge';

// Store
const knowledgeStore = useKnowledgeStore();

// Composables
const {
  loading: listLoading,
  assetList: listAssets,
  loadAssetList
} = useKnowledgeList();

const {
  searching,
  hasSearched,
  search
} = useKnowledgeSearch();

const {
  formatCount,
  formatTime,
  getTypeLabel
} = useKnowledgeUtils();

// 状态
const searchLoading = ref(false);
const apiTesting = ref(false);
const apiResult = ref<any>(null);

// 计算属性
const assetList = computed(() => knowledgeStore.assetList);
const currentAsset = computed(() => knowledgeStore.currentAsset);
const searchResult = computed(() => knowledgeStore.searchResult);
const loading = computed(() => knowledgeStore.loading);
const error = computed(() => knowledgeStore.error);

// 模拟数据
const mockAssets: KnowledgeAsset[] = [
  {
    id: '1',
    title: '前端架构设计最佳实践',
    summary: '本文介绍了现代前端架构设计的核心原则和最佳实践，包括组件化、模块化、状态管理等方面的内容。',
    content: '<p>详细内容...</p>',
    type: 'article',
    status: 'published',
    visibility: 'public',
    author: {
      id: '1',
      name: '张三',
      avatar: '',
      department: '技术部',
      position: '前端架构师'
    },
    category: {
      id: '1',
      name: '前端开发',
      path: 'frontend'
    },
    tags: ['前端', '架构', '最佳实践'],
    viewCount: 1234,
    likeCount: 89,
    collectCount: 45,
    commentCount: 23,
    shareCount: 12,
    publishedAt: '2024-01-15T10:00:00Z',
    updatedAt: '2024-01-15T10:00:00Z'
  },
  {
    id: '2',
    title: 'Vue 3 组合式API深度解析',
    summary: '深入探讨Vue 3组合式API的设计思想、使用场景和高级技巧，帮助开发者更好地理解和应用这一新特性。',
    content: '<p>详细内容...</p>',
    type: 'video',
    status: 'published',
    visibility: 'public',
    author: {
      id: '2',
      name: '李四',
      avatar: '',
      department: '技术部',
      position: '高级前端工程师'
    },
    category: {
      id: '1',
      name: '前端开发',
      path: 'frontend'
    },
    tags: ['Vue', 'JavaScript', '组合式API'],
    viewCount: 2567,
    likeCount: 156,
    collectCount: 78,
    commentCount: 34,
    shareCount: 23,
    publishedAt: '2024-01-10T14:30:00Z',
    updatedAt: '2024-01-10T14:30:00Z'
  }
];

// 事件处理
const handleCardClick = (asset: KnowledgeAsset) => {
  ElMessage.info(`点击了知识卡片: ${asset.title}`);
  knowledgeStore.currentAsset = asset;
};

const handleCardLike = (asset: KnowledgeAsset) => {
  ElMessage.success(`点赞了: ${asset.title}`);
};

const handleCardCollect = (asset: KnowledgeAsset) => {
  ElMessage.success(`收藏了: ${asset.title}`);
};

const handleCardShare = (asset: KnowledgeAsset) => {
  ElMessage.info(`分享了: ${asset.title}`);
};

const handleSearch = (params: KnowledgeSearchParams) => {
  ElMessage.info(`搜索参数: ${JSON.stringify(params)}`);
};

const handleFilter = (params: KnowledgeSearchParams) => {
  ElMessage.info(`筛选参数: ${JSON.stringify(params)}`);
};

const handleFilterChange = (params: KnowledgeSearchParams) => {
  ElMessage.info(`筛选变更: ${JSON.stringify(params)}`);
};

// 测试方法
const testFetchAssets = async () => {
  try {
    // 模拟API调用
    knowledgeStore.assetList = mockAssets;
    ElMessage.success('获取资产列表成功');
  } catch (error) {
    ElMessage.error('获取资产列表失败');
  }
};

const testSearchAssets = async () => {
  try {
    // 模拟搜索
    knowledgeStore.searchResult = {
      items: mockAssets,
      total: mockAssets.length,
      page: 1,
      pageSize: 20,
      totalPages: 1,
      hasNext: false,
      hasPrev: false
    };
    ElMessage.success('搜索成功');
  } catch (error) {
    ElMessage.error('搜索失败');
  }
};

const testClearData = () => {
  knowledgeStore.resetState();
  ElMessage.info('数据已清空');
};

const testKnowledgeApi = async () => {
  try {
    apiTesting.value = true;
    
    // 模拟API测试
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    apiResult.value = {
      success: true,
      message: 'API测试成功',
      data: {
        totalAssets: 100,
        categories: 5,
        tags: 20,
        users: 50
      }
    };
    
    ElMessage.success('API测试完成');
  } catch (error) {
    ElMessage.error('API测试失败');
  } finally {
    apiTesting.value = false;
  }
};

const testLoadList = async () => {
  try {
    await loadAssetList();
    ElMessage.success('列表加载测试完成');
  } catch (error) {
    ElMessage.error('列表加载测试失败');
  }
};

const testSearch = async () => {
  try {
    await search({
      query: '测试搜索',
      page: 1,
      pageSize: 20
    });
    ElMessage.success('搜索测试完成');
  } catch (error) {
    ElMessage.error('搜索测试失败');
  }
};
</script>

<style scoped lang="scss">
.knowledge-test {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;

  h2 {
    color: #303133;
    margin-bottom: 24px;
    text-align: center;
  }

  .test-section {
    margin-bottom: 40px;
    padding: 20px;
    background: white;
    border-radius: 8px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);

    h3 {
      color: #409eff;
      margin-bottom: 20px;
      border-bottom: 2px solid #409eff;
      padding-bottom: 8px;
    }

    .test-item {
      margin-bottom: 24px;

      h4 {
        color: #606266;
        margin-bottom: 12px;
      }

      .card-test {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
        gap: 16px;
        margin-bottom: 16px;
      }
    }

    .store-info {
      background: #f8f9fa;
      padding: 16px;
      border-radius: 6px;
      margin-bottom: 16px;

      p {
        margin: 8px 0;
        font-size: 14px;
      }
    }

    .store-actions {
      display: flex;
      gap: 12px;
      flex-wrap: wrap;
    }

    .api-test {
      .api-result {
        margin-top: 16px;
        padding: 16px;
        background: #f8f9fa;
        border-radius: 6px;

        h4 {
          margin-bottom: 8px;
        }

        pre {
          background: #2d3748;
          color: #e2e8f0;
          padding: 12px;
          border-radius: 4px;
          overflow-x: auto;
          font-size: 12px;
        }
      }
    }

    .composables-test {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 20px;

      .test-group {
        padding: 16px;
        background: #f8f9fa;
        border-radius: 6px;

        h4 {
          color: #409eff;
          margin-bottom: 12px;
        }

        p {
          margin: 6px 0;
          font-size: 14px;
        }

        .el-button {
          margin-top: 8px;
        }
      }
    }
  }
}

// 响应式设计
@media (max-width: 768px) {
  .knowledge-test {
    padding: 12px;

    .test-section {
      padding: 16px;

      .test-item {
        .card-test {
          grid-template-columns: 1fr;
        }
      }

      .composables-test {
        grid-template-columns: 1fr;
      }
    }
  }
}
</style> 