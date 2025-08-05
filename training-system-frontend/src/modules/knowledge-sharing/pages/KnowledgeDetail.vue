<template>
  <div class="knowledge-detail">
    <div v-if="loading" class="loading-container">
      <el-skeleton :rows="8" animated />
    </div>

    <div v-else-if="asset" class="detail-content">
      <!-- 页面头部 -->
      <div class="detail-header">
        <div class="header-nav">
          <el-button text @click="handleBack">
            <el-icon><ArrowLeft /></el-icon>
            返回
          </el-button>
        </div>
        
        <div class="header-content">
          <!-- 知识类型标识 -->
          <div class="type-badge">
            <el-tag :type="getTypeTagType(asset.type)" size="large">
              <el-icon><component :is="getTypeIcon(asset.type)" /></el-icon>
              {{ getTypeLabel(asset.type) }}
            </el-tag>
          </div>

          <!-- 标题 -->
          <h1 class="title">{{ asset.title }}</h1>

          <!-- 摘要 -->
          <p class="summary">{{ asset.summary }}</p>

          <!-- 元信息 -->
          <div class="meta-info">
            <div class="author-info">
              <el-avatar
                :src="asset.author.avatar"
                :alt="asset.author.name"
                size="default"
              >
                {{ asset.author.name.charAt(0) }}
              </el-avatar>
              <div class="author-details">
                <div class="author-name">{{ asset.author.name }}</div>
                <div class="author-meta">
                  {{ asset.author.department }} · {{ formatTime(asset.publishedAt) }}
                </div>
              </div>
            </div>

            <div class="stats">
              <span class="stat-item">
                <el-icon><View /></el-icon>
                {{ formatCount(asset.viewCount) }}
              </span>
              <span class="stat-item">
                <el-icon><ChatDotRound /></el-icon>
                {{ formatCount(asset.commentCount) }}
              </span>
              <span class="stat-item">
                <el-icon><Share /></el-icon>
                {{ formatCount(asset.shareCount) }}
              </span>
            </div>
          </div>

          <!-- 标签 -->
          <div v-if="asset.tags.length > 0" class="tags">
            <el-tag
              v-for="tag in asset.tags"
              :key="tag"
              size="small"
              effect="plain"
            >
              {{ tag }}
            </el-tag>
          </div>
        </div>
      </div>

      <!-- 主要内容区域 -->
      <div class="main-content">
        <!-- 内容正文 -->
        <div class="content-body">
          <!-- 封面图片 -->
          <div v-if="asset.coverImage" class="cover-image">
            <el-image
              :src="asset.coverImage"
              :alt="asset.title"
              fit="cover"
              :preview-src-list="[asset.coverImage]"
            />
          </div>

          <!-- 正文内容 -->
          <div class="content-text" v-html="asset.content"></div>

          <!-- 附件列表 -->
          <div v-if="asset.attachments && asset.attachments.length > 0" class="attachments">
            <h3 class="attachments-title">相关附件</h3>
            <div class="attachment-list">
              <div
                v-for="attachment in asset.attachments"
                :key="attachment.id"
                class="attachment-item"
                @click="handleDownloadAttachment(attachment)"
              >
                <div class="attachment-icon">
                  <el-icon><Document /></el-icon>
                </div>
                <div class="attachment-info">
                  <div class="attachment-name">{{ attachment.name }}</div>
                  <div class="attachment-meta">
                    {{ formatFileSize(attachment.size) }} · {{ attachment.type }}
                  </div>
                </div>
                <div class="attachment-action">
                  <el-icon><Download /></el-icon>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 侧边栏 -->
        <div class="sidebar">
          <!-- 操作按钮 -->
          <div class="action-panel">
            <el-button
              type="primary"
              :class="{ 'is-liked': isLiked }"
              @click="handleLike"
            >
              <el-icon><component :is="isLiked ? 'HeartFilled' : 'Heart'" /></el-icon>
              点赞 ({{ formatCount(asset.likeCount) }})
            </el-button>
            
            <el-button
              :class="{ 'is-collected': isCollected }"
              @click="handleCollect"
            >
              <el-icon><component :is="isCollected ? 'StarFilled' : 'Star'" /></el-icon>
              收藏 ({{ formatCount(asset.collectCount) }})
            </el-button>
            
            <el-button @click="handleShare">
              <el-icon><Share /></el-icon>
              分享
            </el-button>
          </div>

          <!-- 目录 -->
          <div v-if="tableOfContents.length > 0" class="toc-panel">
            <h3 class="panel-title">目录</h3>
            <div class="toc-list">
              <div
                v-for="item in tableOfContents"
                :key="item.id"
                :class="['toc-item', `toc-level-${item.level}`]"
                @click="scrollToSection(item.id)"
              >
                {{ item.title }}
              </div>
            </div>
          </div>

          <!-- 相关知识 -->
          <div v-if="relatedAssets.length > 0" class="related-panel">
            <h3 class="panel-title">相关知识</h3>
            <div class="related-list">
              <div
                v-for="related in relatedAssets"
                :key="related.id"
                class="related-item"
                @click="handleRelatedClick(related)"
              >
                <div class="related-title">{{ related.title }}</div>
                <div class="related-meta">
                  {{ related.author.name }} · {{ formatTime(related.publishedAt) }}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 评论区域 -->
      <div class="comment-section">
        <h3 class="section-title">评论 ({{ asset.commentCount }})</h3>
        <!-- TODO: 实现评论功能 -->
        <div class="comment-placeholder">
          <el-empty description="评论功能开发中..." />
        </div>
      </div>
    </div>

    <!-- 错误状态 -->
    <div v-else class="error-container">
      <el-result
        icon="warning"
        title="内容不存在"
        sub-title="您访问的知识内容不存在或已被删除"
      >
        <template #extra>
          <el-button type="primary" @click="handleBack">返回</el-button>
        </template>
      </el-result>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import {
  ArrowLeft,
  Share,
  User,
  Calendar,
  View,
  ChatDotRound,
  Document,
  Download,
  Heart,
  HeartFilled,
  Star,
  StarFilled,
  VideoPlay,
  Files,
  DataAnalysis
} from '@element-plus/icons-vue';
import type { KnowledgeAsset, KnowledgeType } from '@/types/knowledge';
import { useKnowledgeStore } from '@/stores/knowledge';

const route = useRoute();
const router = useRouter();
const knowledgeStore = useKnowledgeStore();

// 状态
const loading = ref(false);
const isLiked = ref(false);
const isCollected = ref(false);
const relatedAssets = ref<KnowledgeAsset[]>([]);
const tableOfContents = ref<any[]>([]);

// 计算属性
const asset = computed(() => knowledgeStore.currentAsset);
const assetId = computed(() => route.params.id as string);

// 获取知识类型的标签类型
const getTypeTagType = (type: KnowledgeType) => {
  const typeMap: Record<KnowledgeType, string> = {
    article: 'primary',
    video: 'success',
    document: 'info',
    presentation: 'warning',
    case_study: 'danger',
    best_practice: ''
  };
  return typeMap[type] || '';
};

// 获取知识类型的图标
const getTypeIcon = (type: KnowledgeType) => {
  const iconMap: Record<KnowledgeType, any> = {
    article: Document,
    video: VideoPlay,
    document: Files,
    presentation: Document,
    case_study: DataAnalysis,
    best_practice: Star
  };
  return iconMap[type] || Document;
};

// 获取知识类型的标签
const getTypeLabel = (type: KnowledgeType) => {
  const labelMap: Record<KnowledgeType, string> = {
    article: '文章',
    video: '视频',
    document: '文档',
    presentation: '演示',
    case_study: '案例',
    best_practice: '实践'
  };
  return labelMap[type] || '未知';
};

// 格式化数量
const formatCount = (count: number) => {
  if (count < 1000) return count.toString();
  if (count < 10000) return (count / 1000).toFixed(1) + 'k';
  return (count / 10000).toFixed(1) + 'w';
};

// 格式化时间
const formatTime = (time?: string) => {
  if (!time) return '';
  return new Date(time).toLocaleDateString();
};

// 格式化文件大小
const formatFileSize = (size: number) => {
  if (size < 1024) return size + 'B';
  if (size < 1024 * 1024) return (size / 1024).toFixed(1) + 'KB';
  return (size / (1024 * 1024)).toFixed(1) + 'MB';
};

// 事件处理
const handleBack = () => {
  router.back();
};

const handleLike = async () => {
  if (!asset.value) return;
  
  try {
    if (isLiked.value) {
      await knowledgeStore.unlikeAsset(asset.value.id);
      isLiked.value = false;
      ElMessage.success('已取消点赞');
    } else {
      await knowledgeStore.likeAsset(asset.value.id);
      isLiked.value = true;
      ElMessage.success('点赞成功');
    }
  } catch (error) {
    ElMessage.error('操作失败，请重试');
  }
};

const handleCollect = async () => {
  if (!asset.value) return;
  
  try {
    if (isCollected.value) {
      await knowledgeStore.uncollectAsset(asset.value.id);
      isCollected.value = false;
      ElMessage.success('已取消收藏');
    } else {
      await knowledgeStore.collectAsset(asset.value.id);
      isCollected.value = true;
      ElMessage.success('收藏成功');
    }
  } catch (error) {
    ElMessage.error('操作失败，请重试');
  }
};

const handleShare = () => {
  // TODO: 实现分享功能
  ElMessage.info('分享功能开发中...');
};

const handleDownloadAttachment = (attachment: any) => {
  // TODO: 实现附件下载功能
  ElMessage.info('下载功能开发中...');
};

const handleRelatedClick = (related: KnowledgeAsset) => {
  router.push(`/knowledge/detail/${related.id}`);
};

const scrollToSection = (sectionId: string) => {
  const element = document.getElementById(sectionId);
  if (element) {
    element.scrollIntoView({ behavior: 'smooth' });
  }
};

// 生成目录
const generateTableOfContents = () => {
  if (!asset.value?.content) return;
  
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = asset.value.content;
  
  const headings = tempDiv.querySelectorAll('h1, h2, h3, h4, h5, h6');
  tableOfContents.value = Array.from(headings).map((heading, index) => ({
    id: `heading-${index}`,
    title: heading.textContent,
    level: parseInt(heading.tagName.charAt(1))
  }));
};

// 加载相关知识
const loadRelatedAssets = async () => {
  if (!asset.value) return;
  
  try {
    const related = await knowledgeStore.getRelatedAssets(asset.value.id, { limit: 5 });
    relatedAssets.value = related;
  } catch (error) {
    console.error('加载相关知识失败:', error);
  }
};

// 初始化
const loadAssetDetail = async () => {
  try {
    loading.value = true;
    await knowledgeStore.fetchAssetDetail(assetId.value);
    
    // 生成目录
    generateTableOfContents();
    
    // 加载相关知识
    await loadRelatedAssets();
    
    // TODO: 检查用户是否已点赞/收藏
    // const [likedStatus, collectedStatus] = await Promise.all([
    //   knowledgeStore.checkUserLiked(assetId.value, userId),
    //   knowledgeStore.checkUserCollected(assetId.value, userId)
    // ]);
    // isLiked.value = likedStatus.liked;
    // isCollected.value = collectedStatus.collected;
    
  } catch (error) {
    ElMessage.error('加载内容失败');
  } finally {
    loading.value = false;
  }
};

// 监听路由变化
const handleRouteChange = () => {
  if (route.params.id !== assetId.value) {
    loadAssetDetail();
  }
};

// 生命周期
onMounted(() => {
  loadAssetDetail();
  window.addEventListener('popstate', handleRouteChange);
});

onUnmounted(() => {
  window.removeEventListener('popstate', handleRouteChange);
  knowledgeStore.clearCurrentAsset();
});
</script>

<style scoped lang="scss">
.knowledge-detail {
  min-height: 100vh;
  background: #f5f7fa;

  .loading-container {
    padding: 40px;
  }

  .detail-content {
    .detail-header {
      background: white;
      border-bottom: 1px solid #ebeef5;

      .header-nav {
        padding: 16px 24px;
        border-bottom: 1px solid #f0f2f5;
      }

      .header-content {
        padding: 32px 24px;

        .type-badge {
          margin-bottom: 16px;

          .el-tag {
            display: inline-flex;
            align-items: center;
            gap: 6px;
          }
        }

        .title {
          margin: 0 0 16px 0;
          font-size: 28px;
          font-weight: 600;
          color: #303133;
          line-height: 1.4;
        }

        .summary {
          margin: 0 0 24px 0;
          font-size: 16px;
          color: #606266;
          line-height: 1.6;
        }

        .meta-info {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;

          .author-info {
            display: flex;
            align-items: center;
            gap: 12px;

            .author-details {
              .author-name {
                font-size: 16px;
                font-weight: 500;
                color: #303133;
                margin-bottom: 4px;
              }

              .author-meta {
                font-size: 14px;
                color: #909399;
              }
            }
          }

          .stats {
            display: flex;
            align-items: center;
            gap: 24px;

            .stat-item {
              display: flex;
              align-items: center;
              gap: 6px;
              font-size: 14px;
              color: #606266;

              .el-icon {
                font-size: 16px;
              }
            }
          }
        }

        .tags {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }
      }
    }

    .main-content {
      display: flex;
      gap: 32px;
      padding: 32px 24px;

      .content-body {
        flex: 1;
        min-width: 0;
        background: white;
        border-radius: 8px;
        padding: 32px;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);

        .cover-image {
          margin-bottom: 24px;
          border-radius: 8px;
          overflow: hidden;

          .el-image {
            width: 100%;
            max-height: 400px;
          }
        }

        .content-text {
          font-size: 16px;
          line-height: 1.8;
          color: #303133;

          // 内容样式
          :deep(h1), :deep(h2), :deep(h3), :deep(h4), :deep(h5), :deep(h6) {
            margin: 24px 0 16px 0;
            font-weight: 600;
            color: #303133;
          }

          :deep(p) {
            margin: 16px 0;
          }

          :deep(ul), :deep(ol) {
            margin: 16px 0;
            padding-left: 24px;
          }

          :deep(blockquote) {
            margin: 16px 0;
            padding: 16px;
            background: #f8f9fa;
            border-left: 4px solid #409eff;
            border-radius: 4px;
          }

          :deep(code) {
            background: #f1f2f3;
            padding: 2px 4px;
            border-radius: 3px;
            font-family: 'Courier New', monospace;
          }

          :deep(pre) {
            background: #f8f9fa;
            padding: 16px;
            border-radius: 6px;
            overflow-x: auto;
            margin: 16px 0;
          }
        }

        .attachments {
          margin-top: 32px;
          padding-top: 24px;
          border-top: 1px solid #ebeef5;

          .attachments-title {
            margin: 0 0 16px 0;
            font-size: 18px;
            font-weight: 600;
            color: #303133;
          }

          .attachment-list {
            display: flex;
            flex-direction: column;
            gap: 8px;

            .attachment-item {
              display: flex;
              align-items: center;
              gap: 12px;
              padding: 12px;
              border: 1px solid #ebeef5;
              border-radius: 6px;
              cursor: pointer;
              transition: all 0.2s;

              &:hover {
                background: #f5f7fa;
                border-color: #409eff;
              }

              .attachment-icon {
                color: #409eff;
                font-size: 20px;
              }

              .attachment-info {
                flex: 1;

                .attachment-name {
                  font-size: 14px;
                  color: #303133;
                  margin-bottom: 4px;
                }

                .attachment-meta {
                  font-size: 12px;
                  color: #909399;
                }
              }

              .attachment-action {
                color: #606266;
                font-size: 16px;
              }
            }
          }
        }
      }

      .sidebar {
        width: 280px;
        flex-shrink: 0;
        display: flex;
        flex-direction: column;
        gap: 24px;

        .action-panel {
          background: white;
          border-radius: 8px;
          padding: 20px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
          display: flex;
          flex-direction: column;
          gap: 12px;

          .el-button {
            justify-content: flex-start;

            &.is-liked {
              color: #f56c6c;
            }

            &.is-collected {
              color: #e6a23c;
            }
          }
        }

        .toc-panel,
        .related-panel {
          background: white;
          border-radius: 8px;
          padding: 20px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);

          .panel-title {
            margin: 0 0 16px 0;
            font-size: 16px;
            font-weight: 600;
            color: #303133;
          }

          .toc-list {
            .toc-item {
              padding: 6px 0;
              cursor: pointer;
              color: #606266;
              font-size: 14px;
              transition: color 0.2s;

              &:hover {
                color: #409eff;
              }

              &.toc-level-1 {
                font-weight: 500;
              }

              &.toc-level-2 {
                padding-left: 12px;
              }

              &.toc-level-3 {
                padding-left: 24px;
              }
            }
          }

          .related-list {
            .related-item {
              padding: 12px 0;
              border-bottom: 1px solid #f0f2f5;
              cursor: pointer;
              transition: all 0.2s;

              &:last-child {
                border-bottom: none;
              }

              &:hover {
                background: #f5f7fa;
                margin: 0 -12px;
                padding: 12px;
                border-radius: 6px;
              }

              .related-title {
                font-size: 14px;
                color: #303133;
                margin-bottom: 4px;
                display: -webkit-box;
                -webkit-box-orient: vertical;
                -webkit-line-clamp: 2;
                overflow: hidden;
              }

              .related-meta {
                font-size: 12px;
                color: #909399;
              }
            }
          }
        }
      }
    }

    .comment-section {
      background: white;
      margin: 0 24px 24px;
      border-radius: 8px;
      padding: 24px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);

      .section-title {
        margin: 0 0 20px 0;
        font-size: 18px;
        font-weight: 600;
        color: #303133;
      }

      .comment-placeholder {
        text-align: center;
        padding: 40px;
      }
    }
  }

  .error-container {
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 60vh;
  }
}

// 响应式设计
@media (max-width: 1024px) {
  .knowledge-detail {
    .detail-content {
      .main-content {
        flex-direction: column;

        .sidebar {
          width: 100%;
          order: -1;

          .action-panel {
            flex-direction: row;
            justify-content: center;
          }
        }
      }
    }
  }
}

@media (max-width: 768px) {
  .knowledge-detail {
    .detail-content {
      .detail-header {
        .header-nav {
          padding: 12px 16px;
        }

        .header-content {
          padding: 24px 16px;

          .title {
            font-size: 24px;
          }

          .summary {
            font-size: 15px;
          }

          .meta-info {
            flex-direction: column;
            align-items: flex-start;
            gap: 12px;
          }
        }
      }

      .main-content {
        padding: 16px;

        .content-body {
          padding: 20px;
        }
      }

      .comment-section {
        margin: 0 16px 16px;
        padding: 16px;
      }
    }
  }
}
</style> 