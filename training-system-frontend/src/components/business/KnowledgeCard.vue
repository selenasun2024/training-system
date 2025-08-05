<template>
  <div class="knowledge-card" @click="handleCardClick">
    <!-- 卡片头部 -->
    <div class="card-header">
      <div class="author-info">
        <el-avatar
          :src="asset.author.avatar"
          :alt="asset.author.name"
          size="small"
          class="author-avatar"
        >
          {{ asset.author.name.charAt(0) }}
        </el-avatar>
        <div class="author-details">
          <div class="author-name">{{ asset.author.name }}</div>
          <div class="author-department">{{ asset.author.department }}</div>
        </div>
      </div>
      <div class="card-actions">
        <el-dropdown @command="handleMenuCommand">
          <el-button text size="small">
            <el-icon><MoreFilled /></el-icon>
          </el-button>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item command="share">分享</el-dropdown-item>
              <el-dropdown-item command="report">举报</el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </div>
    </div>

    <!-- 卡片内容 -->
    <div class="card-content">
      <!-- 封面图片 -->
      <div v-if="asset.coverImage" class="cover-image">
        <el-image
          :src="asset.coverImage"
          :alt="asset.title"
          fit="cover"
          lazy
        />
      </div>
      
      <!-- 知识类型标识 -->
      <div class="type-badge">
        <el-tag :type="getTypeTagType(asset.type)" size="small">
          <el-icon><component :is="getTypeIcon(asset.type)" /></el-icon>
          {{ getTypeLabel(asset.type) }}
        </el-tag>
      </div>

      <!-- 标题和摘要 -->
      <h3 class="title" :title="asset.title">{{ asset.title }}</h3>
      <p class="summary" :title="asset.summary">{{ asset.summary }}</p>

      <!-- 标签 -->
      <div v-if="asset.tags.length > 0" class="tags">
        <el-tag
          v-for="tag in visibleTags"
          :key="tag"
          size="small"
          class="tag"
          effect="plain"
        >
          {{ tag }}
        </el-tag>
        <el-tag
          v-if="asset.tags.length > maxVisibleTags"
          size="small"
          class="tag-more"
          effect="plain"
        >
          +{{ asset.tags.length - maxVisibleTags }}
        </el-tag>
      </div>
    </div>

    <!-- 卡片底部 -->
    <div class="card-footer">
      <!-- 统计数据 -->
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

      <!-- 交互按钮 -->
      <div class="interactions">
        <el-button
          text
          size="small"
          :class="{ 'is-liked': isLiked }"
          @click.stop="handleLike"
        >
          <el-icon><component :is="isLiked ? 'HeartFilled' : 'Heart'" /></el-icon>
          {{ formatCount(asset.likeCount) }}
        </el-button>
        
        <el-button
          text
          size="small"
          :class="{ 'is-collected': isCollected }"
          @click.stop="handleCollect"
        >
          <el-icon><component :is="isCollected ? 'StarFilled' : 'Star'" /></el-icon>
        </el-button>
      </div>

      <!-- 发布时间 -->
      <div class="meta">
        <span class="publish-time">{{ formatTime(asset.publishedAt) }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import {
  MoreFilled,
  View,
  ChatDotRound,
  Share,
  Heart,
  HeartFilled,
  Star,
  StarFilled,
  Document,
  VideoPlay,
  Files,
  DataAnalysis
} from '@element-plus/icons-vue';
import type { KnowledgeAsset, KnowledgeType } from '@/types/knowledge';
import { useKnowledgeStore } from '@/stores/knowledge';

interface Props {
  asset: KnowledgeAsset;
  maxVisibleTags?: number;
  showActions?: boolean;
}

interface Emits {
  (e: 'click', asset: KnowledgeAsset): void;
  (e: 'like', asset: KnowledgeAsset): void;
  (e: 'collect', asset: KnowledgeAsset): void;
  (e: 'share', asset: KnowledgeAsset): void;
}

const props = withDefaults(defineProps<Props>(), {
  maxVisibleTags: 3,
  showActions: true
});

const emit = defineEmits<Emits>();

const router = useRouter();
const knowledgeStore = useKnowledgeStore();

// 状态
const isLiked = ref(false);
const isCollected = ref(false);

// 计算属性
const visibleTags = computed(() => {
  return props.asset.tags.slice(0, props.maxVisibleTags);
});

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
  
  const date = new Date(time);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  
  const minute = 60 * 1000;
  const hour = 60 * minute;
  const day = 24 * hour;
  const month = 30 * day;
  
  if (diff < hour) {
    return `${Math.floor(diff / minute)}分钟前`;
  } else if (diff < day) {
    return `${Math.floor(diff / hour)}小时前`;
  } else if (diff < month) {
    return `${Math.floor(diff / day)}天前`;
  } else {
    return date.toLocaleDateString();
  }
};

// 事件处理
const handleCardClick = () => {
  emit('click', props.asset);
  router.push(`/knowledge/detail/${props.asset.id}`);
};

const handleLike = async () => {
  try {
    if (isLiked.value) {
      await knowledgeStore.unlikeAsset(props.asset.id);
      isLiked.value = false;
      ElMessage.success('已取消点赞');
    } else {
      await knowledgeStore.likeAsset(props.asset.id);
      isLiked.value = true;
      ElMessage.success('点赞成功');
    }
    emit('like', props.asset);
  } catch (error) {
    ElMessage.error('操作失败，请重试');
  }
};

const handleCollect = async () => {
  try {
    if (isCollected.value) {
      await knowledgeStore.uncollectAsset(props.asset.id);
      isCollected.value = false;
      ElMessage.success('已取消收藏');
    } else {
      await knowledgeStore.collectAsset(props.asset.id);
      isCollected.value = true;
      ElMessage.success('收藏成功');
    }
    emit('collect', props.asset);
  } catch (error) {
    ElMessage.error('操作失败，请重试');
  }
};

const handleMenuCommand = (command: string) => {
  switch (command) {
    case 'share':
      handleShare();
      break;
    case 'report':
      handleReport();
      break;
  }
};

const handleShare = () => {
  // TODO: 实现分享功能
  ElMessage.info('分享功能开发中...');
  emit('share', props.asset);
};

const handleReport = () => {
  // TODO: 实现举报功能
  ElMessage.info('举报功能开发中...');
};
</script>

<style scoped lang="scss">
.knowledge-card {
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
  cursor: pointer;
  overflow: hidden;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
  }

  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 16px 16px 0;

    .author-info {
      display: flex;
      align-items: center;
      gap: 8px;

      .author-avatar {
        flex-shrink: 0;
      }

      .author-details {
        min-width: 0;

        .author-name {
          font-size: 14px;
          font-weight: 500;
          color: #303133;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .author-department {
          font-size: 12px;
          color: #909399;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
      }
    }

    .card-actions {
      flex-shrink: 0;
    }
  }

  .card-content {
    padding: 12px 16px;
    position: relative;

    .cover-image {
      width: 100%;
      height: 120px;
      margin-bottom: 12px;
      border-radius: 6px;
      overflow: hidden;

      .el-image {
        width: 100%;
        height: 100%;
      }
    }

    .type-badge {
      position: absolute;
      top: 12px;
      right: 16px;
      z-index: 1;

      .el-tag {
        display: flex;
        align-items: center;
        gap: 4px;
      }
    }

    .title {
      font-size: 16px;
      font-weight: 600;
      color: #303133;
      margin: 0 0 8px 0;
      line-height: 1.4;
      display: -webkit-box;
      -webkit-box-orient: vertical;
      -webkit-line-clamp: 2;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .summary {
      font-size: 14px;
      color: #606266;
      margin: 0 0 12px 0;
      line-height: 1.5;
      display: -webkit-box;
      -webkit-box-orient: vertical;
      -webkit-line-clamp: 3;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .tags {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;

      .tag,
      .tag-more {
        font-size: 12px;
      }
    }
  }

  .card-footer {
    padding: 0 16px 16px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex-wrap: wrap;
    gap: 8px;

    .stats {
      display: flex;
      align-items: center;
      gap: 16px;

      .stat-item {
        display: flex;
        align-items: center;
        gap: 4px;
        font-size: 12px;
        color: #909399;

        .el-icon {
          font-size: 14px;
        }
      }
    }

    .interactions {
      display: flex;
      align-items: center;
      gap: 8px;

      .el-button {
        padding: 4px 8px;
        
        &.is-liked {
          color: #f56c6c;
        }

        &.is-collected {
          color: #e6a23c;
        }

        .el-icon {
          margin-right: 4px;
        }
      }
    }

    .meta {
      font-size: 12px;
      color: #c0c4cc;
      white-space: nowrap;
    }
  }
}

// 响应式设计
@media (max-width: 768px) {
  .knowledge-card {
    .card-header {
      padding: 12px 12px 0;

      .author-info {
        gap: 6px;

        .author-details {
          .author-name {
            font-size: 13px;
          }

          .author-department {
            font-size: 11px;
          }
        }
      }
    }

    .card-content {
      padding: 8px 12px;

      .cover-image {
        height: 100px;
        margin-bottom: 8px;
      }

      .title {
        font-size: 15px;
        margin-bottom: 6px;
      }

      .summary {
        font-size: 13px;
        margin-bottom: 8px;
        -webkit-line-clamp: 2;
      }
    }

    .card-footer {
      padding: 0 12px 12px;

      .stats {
        gap: 12px;

        .stat-item {
          font-size: 11px;

          .el-icon {
            font-size: 12px;
          }
        }
      }

      .interactions {
        .el-button {
          padding: 2px 6px;
          font-size: 12px;
        }
      }

      .meta {
        font-size: 11px;
      }
    }
  }
}
</style> 