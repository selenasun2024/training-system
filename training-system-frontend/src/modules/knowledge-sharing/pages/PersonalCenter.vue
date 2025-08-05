<template>
  <div class="personal-center">
    <!-- 个人统计概览 -->
    <div class="stats-overview">
      <div class="stats-header">
        <h2>我的知识中心</h2>
        <el-button type="primary" @click="goToCreate">
          <el-icon><Plus /></el-icon>
          创建知识
        </el-button>
      </div>
      
      <div class="stats-cards">
        <div class="stat-card">
          <div class="stat-icon contribution">
            <el-icon><Document /></el-icon>
          </div>
          <div class="stat-content">
            <div class="stat-number">{{ personalStats.totalContributions }}</div>
            <div class="stat-label">总贡献</div>
            <div class="stat-detail">
              发布 {{ personalStats.publishedAssets }} · 草稿 {{ personalStats.draftAssets }}
            </div>
          </div>
        </div>
        
        <div class="stat-card">
          <div class="stat-icon influence">
            <el-icon><View /></el-icon>
          </div>
          <div class="stat-content">
            <div class="stat-number">{{ formatNumber(personalStats.totalViews) }}</div>
            <div class="stat-label">总浏览量</div>
            <div class="stat-detail">
              点赞 {{ personalStats.totalLikes }} · 收藏 {{ personalStats.totalCollects }}
            </div>
          </div>
        </div>
        
        <div class="stat-card">
          <div class="stat-icon rating">
            <el-icon><Star /></el-icon>
          </div>
          <div class="stat-content">
            <div class="stat-number">{{ personalStats.averageRating.toFixed(1) }}</div>
            <div class="stat-label">平均评分</div>
            <div class="stat-detail">
              基于 {{ personalStats.totalComments }} 条评价
            </div>
          </div>
        </div>
        
        <div class="stat-card">
          <div class="stat-icon rank">
            <el-icon><Trophy /></el-icon>
          </div>
          <div class="stat-content">
            <div class="stat-number">#{{ personalStats.contributionRank }}</div>
            <div class="stat-label">贡献排名</div>
            <div class="stat-detail">
              影响力 {{ personalStats.influenceScore }}
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 趋势图表 -->
    <div class="trend-section">
      <div class="section-header">
        <h3>贡献趋势</h3>
        <el-radio-group v-model="trendPeriod" size="small">
          <el-radio-button label="month">近一个月</el-radio-button>
          <el-radio-button label="quarter">近三个月</el-radio-button>
          <el-radio-button label="year">近一年</el-radio-button>
        </el-radio-group>
      </div>
      
      <div class="trend-chart">
        <!-- 这里可以集成图表库，比如ECharts -->
        <div class="chart-placeholder">
          <el-icon><TrendCharts /></el-icon>
          <p>贡献趋势图表</p>
        </div>
      </div>
    </div>

    <!-- 标签页内容 -->
    <div class="content-tabs">
      <el-tabs v-model="activeTab" @tab-change="handleTabChange">
        <!-- 我的知识 -->
        <el-tab-pane label="我的知识" name="knowledge">
          <template #label>
            <span class="tab-label">
              <el-icon><Document /></el-icon>
              我的知识 ({{ myKnowledgeStats.total }})
            </span>
          </template>
          
          <div class="knowledge-section">
            <div class="section-toolbar">
              <div class="toolbar-left">
                <el-radio-group v-model="knowledgeFilter" size="small">
                  <el-radio-button label="all">
                    全部 ({{ myKnowledgeStats.total }})
                  </el-radio-button>
                  <el-radio-button label="published">
                    已发布 ({{ myKnowledgeStats.published }})
                  </el-radio-button>
                  <el-radio-button label="draft">
                    草稿 ({{ myKnowledgeStats.draft }})
                  </el-radio-button>
                  <el-radio-button label="review">
                    审核中 ({{ myKnowledgeStats.underReview }})
                  </el-radio-button>
                </el-radio-group>
              </div>
              
              <div class="toolbar-right">
                <el-input
                  v-model="knowledgeSearchQuery"
                  placeholder="搜索我的知识..."
                  clearable
                  style="width: 240px"
                >
                  <template #prefix>
                    <el-icon><Search /></el-icon>
                  </template>
                </el-input>
                
                <el-select
                  v-model="knowledgeSortBy"
                  placeholder="排序"
                  style="width: 120px"
                >
                  <el-option label="最新" value="createdAt" />
                  <el-option label="最多浏览" value="viewCount" />
                  <el-option label="最多点赞" value="likeCount" />
                  <el-option label="评分最高" value="rating" />
                </el-select>
              </div>
            </div>
            
            <div class="knowledge-list">
              <div 
                v-for="item in filteredMyKnowledge"
                :key="item.id"
                class="knowledge-item"
              >
                <div class="item-cover">
                  <img 
                    v-if="item.coverImage"
                    :src="item.coverImage"
                    :alt="item.title"
                  />
                  <div v-else class="cover-placeholder">
                    <el-icon><Document /></el-icon>
                  </div>
                </div>
                
                <div class="item-content">
                  <div class="item-header">
                    <h4 class="item-title" @click="goToDetail(item.id)">
                      {{ item.title }}
                    </h4>
                    <div class="item-status">
                      <el-tag
                        :type="getStatusTagType(item.status)"
                        size="small"
                      >
                        {{ getStatusLabel(item.status) }}
                      </el-tag>
                      <el-tag
                        v-if="item.reviewStatus && item.reviewStatus !== 'approved'"
                        :type="getReviewStatusTagType(item.reviewStatus)"
                        size="small"
                      >
                        {{ getReviewStatusLabel(item.reviewStatus) }}
                      </el-tag>
                    </div>
                  </div>
                  
                  <p class="item-summary">{{ item.summary }}</p>
                  
                  <div class="item-meta">
                    <span class="meta-item">
                      <el-icon><View /></el-icon>
                      {{ item.viewCount }}
                    </span>
                    <span class="meta-item">
                      <el-icon><Star /></el-icon>
                      {{ item.likeCount }}
                    </span>
                    <span class="meta-item">
                      <el-icon><Collection /></el-icon>
                      {{ item.collectCount }}
                    </span>
                    <span v-if="item.qualityScore" class="meta-item">
                      <el-icon><Medal /></el-icon>
                      {{ item.qualityScore.toFixed(1) }}
                    </span>
                    <span class="meta-item meta-date">
                      {{ formatDate(item.updatedAt) }}
                    </span>
                  </div>
                </div>
                
                <div class="item-actions">
                  <el-dropdown trigger="click">
                    <el-button text>
                      <el-icon><More /></el-icon>
                    </el-button>
                    <template #dropdown>
                      <el-dropdown-menu>
                        <el-dropdown-item @click="editKnowledge(item.id)">
                          <el-icon><Edit /></el-icon>
                          编辑
                        </el-dropdown-item>
                        <el-dropdown-item 
                          v-if="item.status === 'draft'"
                          @click="publishKnowledge(item.id)"
                        >
                          <el-icon><Upload /></el-icon>
                          发布
                        </el-dropdown-item>
                        <el-dropdown-item @click="shareKnowledge(item.id)">
                          <el-icon><Share /></el-icon>
                          分享
                        </el-dropdown-item>
                        <el-dropdown-item 
                          v-if="item.canDelete"
                          divided
                          @click="deleteKnowledge(item.id)"
                        >
                          <el-icon><Delete /></el-icon>
                          删除
                        </el-dropdown-item>
                      </el-dropdown-menu>
                    </template>
                  </el-dropdown>
                </div>
              </div>
              
              <!-- 空状态 -->
              <div v-if="filteredMyKnowledge.length === 0" class="empty-state">
                <el-empty description="暂无知识">
                  <el-button type="primary" @click="goToCreate">
                    创建第一个知识
                  </el-button>
                </el-empty>
              </div>
            </div>
          </div>
        </el-tab-pane>

        <!-- 我的收藏 -->
        <el-tab-pane label="我的收藏" name="collections">
          <template #label>
            <span class="tab-label">
              <el-icon><Collection /></el-icon>
              我的收藏 ({{ collectionStats.total }})
            </span>
          </template>
          
          <div class="collections-section">
            <div class="section-toolbar">
              <div class="toolbar-left">
                <el-select
                  v-model="selectedFolder"
                  placeholder="选择收藏夹"
                  clearable
                  style="width: 160px"
                >
                  <el-option label="全部收藏" value="" />
                  <el-option
                    v-for="folder in collectionFolders"
                    :key="folder.id"
                    :label="`${folder.name} (${folder.itemCount})`"
                    :value="folder.id"
                  />
                </el-select>
                
                <el-button @click="showCreateFolderDialog = true">
                  <el-icon><Plus /></el-icon>
                  新建收藏夹
                </el-button>
              </div>
              
              <div class="toolbar-right">
                <el-input
                  v-model="collectionSearchQuery"
                  placeholder="搜索收藏..."
                  clearable
                  style="width: 240px"
                >
                  <template #prefix>
                    <el-icon><Search /></el-icon>
                  </template>
                </el-input>
              </div>
            </div>
            
            <div class="collections-list">
              <div 
                v-for="item in filteredCollections"
                :key="item.id"
                class="collection-item"
              >
                <div class="item-cover">
                  <img 
                    v-if="item.asset.coverImage"
                    :src="item.asset.coverImage"
                    :alt="item.asset.title"
                  />
                  <div v-else class="cover-placeholder">
                    <el-icon><Document /></el-icon>
                  </div>
                </div>
                
                <div class="item-content">
                  <h4 class="item-title" @click="goToDetail(item.asset.id)">
                    {{ item.asset.title }}
                  </h4>
                  <p class="item-summary">{{ item.asset.summary }}</p>
                  <div v-if="item.notes" class="item-notes">
                    <el-icon><EditPen /></el-icon>
                    {{ item.notes }}
                  </div>
                  <div class="item-meta">
                    <span class="meta-item">
                      <el-icon><User /></el-icon>
                      {{ item.asset.author.name }}
                    </span>
                    <span class="meta-item">
                      <el-icon><Calendar /></el-icon>
                      收藏于 {{ formatDate(item.collectedAt) }}
                    </span>
                  </div>
                </div>
                
                <div class="item-actions">
                  <el-button text @click="removeFromCollection(item.id)">
                    <el-icon><Delete /></el-icon>
                    取消收藏
                  </el-button>
                </div>
              </div>
              
              <!-- 空状态 -->
              <div v-if="filteredCollections.length === 0" class="empty-state">
                <el-empty description="暂无收藏">
                  <el-button type="primary" @click="goToSquare">
                    去知识广场看看
                  </el-button>
                </el-empty>
              </div>
            </div>
          </div>
        </el-tab-pane>

        <!-- 我的评价 -->
        <el-tab-pane label="我的评价" name="evaluations">
          <template #label>
            <span class="tab-label">
              <el-icon><ChatLineSquare /></el-icon>
              我的评价 ({{ personalStats.totalComments }})
            </span>
          </template>
          
          <div class="evaluations-section">
            <!-- 评价列表 -->
            <div class="evaluations-list">
              <div 
                v-for="evaluation in myEvaluations"
                :key="evaluation.id"
                class="evaluation-item"
              >
                <div class="evaluation-header">
                  <div class="knowledge-info">
                    <h4 @click="goToDetail(evaluation.asset.id)">
                      {{ evaluation.asset.title }}
                    </h4>
                    <div class="evaluation-meta">
                      <el-rate
                        v-model="evaluation.rating"
                        disabled
                        size="small"
                        text-color="#ff9900"
                      />
                      <span class="evaluation-date">
                        {{ formatDate(evaluation.createdAt) }}
                      </span>
                    </div>
                  </div>
                  
                  <div class="evaluation-stats">
                    <span class="stat-item">
                      <el-icon><Star /></el-icon>
                      {{ evaluation.likeCount }}
                    </span>
                  </div>
                </div>
                
                <div class="evaluation-content">
                  <p>{{ evaluation.comment }}</p>
                  
                  <div v-if="evaluation.pros && evaluation.pros.length" class="evaluation-tags">
                    <span class="tag-label">优点：</span>
                    <el-tag
                      v-for="pro in evaluation.pros"
                      :key="pro"
                      type="success"
                      size="small"
                      class="tag-item"
                    >
                      {{ pro }}
                    </el-tag>
                  </div>
                  
                  <div v-if="evaluation.suggestions" class="evaluation-suggestions">
                    <span class="tag-label">建议：</span>
                    <span>{{ evaluation.suggestions }}</span>
                  </div>
                </div>
              </div>
              
              <!-- 空状态 -->
              <div v-if="myEvaluations.length === 0" class="empty-state">
                <el-empty description="暂无评价记录">
                  <el-button type="primary" @click="goToSquare">
                    去评价知识
                  </el-button>
                </el-empty>
              </div>
            </div>
          </div>
        </el-tab-pane>
      </el-tabs>
    </div>

    <!-- 创建收藏夹对话框 -->
    <el-dialog
      v-model="showCreateFolderDialog"
      title="创建收藏夹"
      width="500px"
    >
      <el-form
        ref="folderFormRef"
        :model="folderForm"
        :rules="folderRules"
        label-width="80px"
      >
        <el-form-item label="名称" prop="name">
          <el-input
            v-model="folderForm.name"
            placeholder="请输入收藏夹名称"
            maxlength="50"
          />
        </el-form-item>
        
        <el-form-item label="描述">
          <el-input
            v-model="folderForm.description"
            type="textarea"
            placeholder="请输入收藏夹描述"
            :rows="3"
            maxlength="200"
          />
        </el-form-item>
        
        <el-form-item>
          <el-checkbox v-model="folderForm.isPrivate">
            设为私有收藏夹
          </el-checkbox>
        </el-form-item>
      </el-form>
      
      <template #footer>
        <el-button @click="showCreateFolderDialog = false">取消</el-button>
        <el-button type="primary" @click="createFolder">创建</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage, ElMessageBox } from 'element-plus';
import type { FormInstance, FormRules } from 'element-plus';
import {
  Plus, Document, View, Star, Trophy, TrendCharts,
  Search, Edit, Upload, Share, Delete, More,
  Collection, User, Calendar, EditPen, ChatLineSquare,
  Medal
} from '@element-plus/icons-vue';
import type { 
  KnowledgeStatus, 
  KnowledgeReviewStatus,
  MyKnowledgeItem,
  MyCollectionItem,
  KnowledgeEvaluation,
  KnowledgeAsset
} from '@/types/knowledge';
import { useKnowledgeStore } from '@/stores/knowledge';

const router = useRouter();
const knowledgeStore = useKnowledgeStore();

// 状态
const activeTab = ref('knowledge');
const trendPeriod = ref('month');
const knowledgeFilter = ref('all');
const knowledgeSearchQuery = ref('');
const knowledgeSortBy = ref('createdAt');
const selectedFolder = ref('');
const collectionSearchQuery = ref('');
const showCreateFolderDialog = ref(false);

// 表单
const folderFormRef = ref<FormInstance>();
const folderForm = ref({
  name: '',
  description: '',
  isPrivate: false
});

const folderRules: FormRules = {
  name: [
    { required: true, message: '请输入收藏夹名称', trigger: 'blur' }
  ]
};

// 计算属性
const personalStats = computed(() => knowledgeStore.personalStats);
const myKnowledgeStats = computed(() => knowledgeStore.myKnowledgeStats);
const collectionStats = computed(() => knowledgeStore.collectionStats);
const myKnowledge = computed(() => knowledgeStore.myKnowledge);
const myCollections = computed(() => knowledgeStore.myCollections);
const collectionFolders = computed(() => knowledgeStore.collectionFolders);
const myEvaluations = computed(() => knowledgeStore.myEvaluations);

const filteredMyKnowledge = computed(() => {
  let filtered = [...myKnowledge.value];
  
  // 状态筛选
  if (knowledgeFilter.value !== 'all') {
    if (knowledgeFilter.value === 'review') {
      filtered = filtered.filter(item => item.reviewStatus === 'pending');
    } else {
      filtered = filtered.filter(item => item.status === knowledgeFilter.value);
    }
  }
  
  // 搜索筛选
  if (knowledgeSearchQuery.value) {
    const query = knowledgeSearchQuery.value.toLowerCase();
    filtered = filtered.filter(item =>
      item.title.toLowerCase().includes(query) ||
      item.summary.toLowerCase().includes(query)
    );
  }
  
  // 排序
  filtered.sort((a, b) => {
    switch (knowledgeSortBy.value) {
      case 'viewCount':
        return b.viewCount - a.viewCount;
      case 'likeCount':
        return b.likeCount - a.likeCount;
      case 'rating':
        return (b.qualityScore || 0) - (a.qualityScore || 0);
      case 'createdAt':
      default:
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    }
  });
  
  return filtered;
});

const filteredCollections = computed(() => {
  let filtered = [...myCollections.value];
  
  // 收藏夹筛选
  if (selectedFolder.value) {
    filtered = filtered.filter(item => item.folder === selectedFolder.value);
  }
  
  // 搜索筛选
  if (collectionSearchQuery.value) {
    const query = collectionSearchQuery.value.toLowerCase();
    filtered = filtered.filter(item =>
      item.asset.title.toLowerCase().includes(query) ||
      item.asset.summary.toLowerCase().includes(query) ||
      (item.notes && item.notes.toLowerCase().includes(query))
    );
  }
  
  return filtered;
});

// 方法
const formatNumber = (num: number) => {
  if (num >= 10000) {
    return (num / 10000).toFixed(1) + 'w';
  } else if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'k';
  }
  return num.toString();
};

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString();
};

const getStatusLabel = (status: KnowledgeStatus) => {
  const statusMap = {
    draft: '草稿',
    published: '已发布',
    archived: '已归档'
  };
  return statusMap[status] || status;
};

const getStatusTagType = (status: KnowledgeStatus) => {
  const typeMap = {
    draft: 'info',
    published: 'success',
    archived: 'warning'
  };
  return typeMap[status] || 'default';
};

const getReviewStatusLabel = (status: KnowledgeReviewStatus) => {
  const statusMap = {
    pending: '待审核',
    approved: '已通过',
    rejected: '已拒绝',
    revision: '需修改'
  };
  return statusMap[status] || status;
};

const getReviewStatusTagType = (status: KnowledgeReviewStatus) => {
  const typeMap = {
    pending: 'warning',
    approved: 'success',
    rejected: 'danger',
    revision: 'info'
  };
  return typeMap[status] || 'default';
};

const goToCreate = () => {
  router.push({ name: 'KnowledgeCreate' });
};

const goToDetail = (id: string) => {
  router.push({ name: 'KnowledgeDetail', params: { id } });
};

const goToSquare = () => {
  router.push({ name: 'KnowledgeSquare' });
};

const handleTabChange = (tabName: string) => {
  // 标签页切换时的处理
};

const editKnowledge = (id: string) => {
  router.push({ name: 'KnowledgeEdit', params: { id } });
};

const publishKnowledge = async (id: string) => {
  try {
    await knowledgeStore.publishKnowledge(id);
    ElMessage.success('发布成功');
  } catch (error) {
    ElMessage.error('发布失败');
  }
};

const shareKnowledge = (id: string) => {
  // 分享知识
  const url = `${window.location.origin}/knowledge/${id}`;
  navigator.clipboard.writeText(url).then(() => {
    ElMessage.success('链接已复制到剪贴板');
  });
};

const deleteKnowledge = (id: string) => {
  ElMessageBox.confirm('删除后无法恢复，确定要删除这个知识吗？', '确认删除', {
    confirmButtonText: '确定删除',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(async () => {
    try {
      await knowledgeStore.deleteKnowledge(id);
      ElMessage.success('删除成功');
    } catch (error) {
      ElMessage.error('删除失败');
    }
  });
};

const removeFromCollection = (id: string) => {
  ElMessageBox.confirm('确定要取消收藏吗？', '确认操作', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    // 取消收藏
    ElMessage.success('已取消收藏');
  });
};

const createFolder = async () => {
  if (!folderFormRef.value) return;
  
  try {
    const valid = await folderFormRef.value.validate();
    if (!valid) return;
    
    // 创建收藏夹
    ElMessage.success('收藏夹创建成功');
    showCreateFolderDialog.value = false;
    
    // 重置表单
    folderForm.value = {
      name: '',
      description: '',
      isPrivate: false
    };
  } catch (error) {
    ElMessage.error('创建失败');
  }
};

// 初始化
onMounted(() => {
  knowledgeStore.fetchPersonalStats();
  knowledgeStore.fetchMyKnowledge();
  knowledgeStore.fetchMyCollections();
});
</script>

<style scoped lang="scss">
.personal-center {
  padding: 24px;
  background: #f5f7fa;
  min-height: 100vh;
}

.stats-overview {
  background: #fff;
  border-radius: 12px;
  padding: 24px;
  margin-bottom: 24px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  
  .stats-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 24px;
    
    h2 {
      margin: 0;
      font-size: 24px;
      font-weight: 600;
      color: #303133;
    }
  }
  
  .stats-cards {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
    gap: 20px;
    
    .stat-card {
      display: flex;
      align-items: center;
      gap: 16px;
      padding: 20px;
      background: #f8f9fa;
      border-radius: 8px;
      transition: all 0.3s ease;
      
      &:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
      }
      
      .stat-icon {
        width: 48px;
        height: 48px;
        border-radius: 8px;
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-size: 24px;
        
        &.contribution {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        }
        
        &.influence {
          background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
        }
        
        &.rating {
          background: linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%);
          color: #d17f00;
        }
        
        &.rank {
          background: linear-gradient(135deg, #a8edea 0%, #fed6e3 100%);
          color: #2d3748;
        }
      }
      
      .stat-content {
        flex: 1;
        
        .stat-number {
          font-size: 28px;
          font-weight: 700;
          color: #303133;
          line-height: 1;
          margin-bottom: 4px;
        }
        
        .stat-label {
          font-size: 14px;
          color: #606266;
          margin-bottom: 4px;
        }
        
        .stat-detail {
          font-size: 12px;
          color: #909399;
        }
      }
    }
  }
}

.trend-section {
  background: #fff;
  border-radius: 12px;
  padding: 24px;
  margin-bottom: 24px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  
  .section-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
    
    h3 {
      margin: 0;
      font-size: 18px;
      font-weight: 600;
      color: #303133;
    }
  }
  
  .trend-chart {
    height: 300px;
    
    .chart-placeholder {
      height: 100%;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      color: #909399;
      background: #f5f7fa;
      border-radius: 8px;
      
      .el-icon {
        font-size: 48px;
        margin-bottom: 12px;
      }
    }
  }
}

.content-tabs {
  background: #fff;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  
  .tab-label {
    display: flex;
    align-items: center;
    gap: 8px;
  }
  
  .section-toolbar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
    padding-bottom: 16px;
    border-bottom: 1px solid #e4e7ed;
    
    .toolbar-left,
    .toolbar-right {
      display: flex;
      align-items: center;
      gap: 12px;
    }
  }
}

.knowledge-list,
.collections-list,
.evaluations-list {
  .knowledge-item,
  .collection-item,
  .evaluation-item {
    display: flex;
    gap: 16px;
    padding: 20px;
    border: 1px solid #e4e7ed;
    border-radius: 8px;
    margin-bottom: 16px;
    transition: all 0.3s ease;
    
    &:hover {
      border-color: #409eff;
      box-shadow: 0 2px 8px rgba(64, 158, 255, 0.1);
    }
    
    .item-cover {
      width: 120px;
      height: 80px;
      border-radius: 6px;
      overflow: hidden;
      flex-shrink: 0;
      
      img {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }
      
      .cover-placeholder {
        width: 100%;
        height: 100%;
        background: #f5f7fa;
        display: flex;
        align-items: center;
        justify-content: center;
        color: #c0c4cc;
        font-size: 24px;
      }
    }
    
    .item-content {
      flex: 1;
      
      .item-header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        margin-bottom: 8px;
        
        .item-title {
          margin: 0;
          font-size: 16px;
          font-weight: 600;
          color: #303133;
          cursor: pointer;
          transition: color 0.3s ease;
          
          &:hover {
            color: #409eff;
          }
        }
        
        .item-status {
          display: flex;
          gap: 8px;
        }
      }
      
      .item-summary {
        margin: 0 0 12px 0;
        color: #606266;
        font-size: 14px;
        line-height: 1.5;
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
        overflow: hidden;
      }
      
      .item-notes {
        margin-bottom: 12px;
        padding: 8px 12px;
        background: #f5f7fa;
        border-radius: 4px;
        font-size: 14px;
        color: #606266;
        display: flex;
        align-items: center;
        gap: 6px;
      }
      
      .item-meta {
        display: flex;
        align-items: center;
        gap: 16px;
        font-size: 12px;
        color: #909399;
        
        .meta-item {
          display: flex;
          align-items: center;
          gap: 4px;
        }
        
        .meta-date {
          margin-left: auto;
        }
      }
    }
    
    .item-actions {
      flex-shrink: 0;
      display: flex;
      align-items: flex-start;
    }
  }
}

.evaluation-item {
  .evaluation-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 12px;
    
    .knowledge-info {
      flex: 1;
      
      h4 {
        margin: 0 0 8px 0;
        font-size: 16px;
        font-weight: 600;
        color: #303133;
        cursor: pointer;
        
        &:hover {
          color: #409eff;
        }
      }
      
      .evaluation-meta {
        display: flex;
        align-items: center;
        gap: 12px;
        
        .evaluation-date {
          color: #909399;
          font-size: 12px;
        }
      }
    }
    
    .evaluation-stats {
      display: flex;
      gap: 12px;
      
      .stat-item {
        display: flex;
        align-items: center;
        gap: 4px;
        color: #909399;
        font-size: 12px;
      }
    }
  }
  
  .evaluation-content {
    p {
      margin: 0 0 12px 0;
      color: #606266;
      line-height: 1.6;
    }
    
    .evaluation-tags,
    .evaluation-suggestions {
      margin-bottom: 8px;
      
      .tag-label {
        font-weight: 600;
        margin-right: 8px;
        color: #606266;
      }
      
      .tag-item {
        margin-right: 4px;
      }
    }
  }
}

.empty-state {
  text-align: center;
  padding: 60px 20px;
  color: #909399;
}

:deep(.el-tabs__header) {
  margin-bottom: 20px;
}

:deep(.el-tabs__nav-wrap::after) {
  display: none;
}
</style> 