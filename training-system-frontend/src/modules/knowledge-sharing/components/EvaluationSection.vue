<template>
  <div class="evaluation-section">
    <!-- 评价统计 -->
    <div class="evaluation-stats">
      <div class="stats-header">
        <h3>用户评价</h3>
        <el-button 
          type="primary" 
          size="small"
          @click="showEvaluationForm = true"
        >
          写评价
        </el-button>
      </div>
      
      <div class="stats-content">
        <div class="overall-rating">
          <div class="rating-score">
            <span class="score">{{ overallRating.toFixed(1) }}</span>
            <el-rate
              v-model="overallRating"
              disabled
              show-score
              text-color="#ff9900"
              score-template="{value} 分"
            />
          </div>
          <div class="rating-count">
            基于 {{ totalEvaluations }} 条评价
          </div>
        </div>
        
        <div class="rating-distribution">
          <div 
            v-for="(count, rating) in ratingDistribution" 
            :key="rating"
            class="rating-bar"
          >
            <span class="rating-label">{{ rating }}星</span>
            <div class="bar-container">
              <div 
                class="bar-fill" 
                :style="{ width: getPercentage(count) + '%' }"
              ></div>
            </div>
            <span class="rating-count">{{ count }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 评价筛选 -->
    <div class="evaluation-filters">
      <el-radio-group v-model="currentFilter" @change="handleFilterChange">
        <el-radio-button label="all">全部 ({{ totalEvaluations }})</el-radio-button>
        <el-radio-button label="5">5星 ({{ ratingDistribution[5] || 0 }})</el-radio-button>
        <el-radio-button label="4">4星 ({{ ratingDistribution[4] || 0 }})</el-radio-button>
        <el-radio-button label="3">3星 ({{ ratingDistribution[3] || 0 }})</el-radio-button>
        <el-radio-button label="2">2星 ({{ ratingDistribution[2] || 0 }})</el-radio-button>
        <el-radio-button label="1">1星 ({{ ratingDistribution[1] || 0 }})</el-radio-button>
        <el-radio-button label="helpful">有帮助</el-radio-button>
      </el-radio-group>
      
      <el-select
        v-model="sortBy"
        placeholder="排序方式"
        style="width: 150px; margin-left: 12px"
        @change="handleSortChange"
      >
        <el-option label="最新" value="createdAt" />
        <el-option label="最有用" value="likeCount" />
        <el-option label="评分最高" value="rating" />
      </el-select>
    </div>

    <!-- 评价列表 -->
    <div class="evaluation-list">
      <div 
        v-for="evaluation in filteredEvaluations" 
        :key="evaluation.id"
        class="evaluation-item"
      >
        <div class="evaluation-header">
          <div class="user-info">
            <el-avatar 
              :size="40" 
              :src="evaluation.userAvatar"
              :alt="evaluation.userName"
            >
              {{ evaluation.userName.charAt(0) }}
            </el-avatar>
            <div class="user-details">
              <div class="user-name">
                {{ evaluation.isAnonymous ? '匿名用户' : evaluation.userName }}
              </div>
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
          </div>
          
          <div class="evaluation-actions">
            <el-button
              text
              :type="evaluation.isLiked ? 'primary' : 'default'"
              @click="toggleEvaluationLike(evaluation.id)"
            >
              <el-icon>
                <StarFilled v-if="evaluation.isLiked" />
                <Star v-else />
              </el-icon>
              {{ evaluation.likeCount }}
            </el-button>
            
            <el-button
              text
              @click="toggleReplyForm(evaluation.id)"
            >
              <el-icon><ChatLineSquare /></el-icon>
              回复
            </el-button>
          </div>
        </div>
        
        <div class="evaluation-content">
          <div class="evaluation-comment">
            {{ evaluation.comment }}
          </div>
          
          <div v-if="evaluation.pros && evaluation.pros.length" class="evaluation-pros">
            <span class="label">优点：</span>
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
          
          <div v-if="evaluation.cons && evaluation.cons.length" class="evaluation-cons">
            <span class="label">缺点：</span>
            <el-tag
              v-for="con in evaluation.cons"
              :key="con"
              type="warning"
              size="small"
              class="tag-item"
            >
              {{ con }}
            </el-tag>
          </div>
          
          <div v-if="evaluation.suggestions" class="evaluation-suggestions">
            <span class="label">建议：</span>
            <span class="suggestion-text">{{ evaluation.suggestions }}</span>
          </div>
        </div>
        
        <!-- 回复表单 -->
        <div v-if="activeReplyForm === evaluation.id" class="reply-form">
          <el-input
            v-model="replyContent"
            type="textarea"
            placeholder="写下你的回复..."
            :rows="3"
            maxlength="500"
            show-word-limit
          />
          <div class="reply-actions">
            <el-button size="small" @click="cancelReply">取消</el-button>
            <el-button 
              type="primary" 
              size="small"
              :loading="replyLoading"
              @click="submitReply(evaluation.id)"
            >
              发布回复
            </el-button>
          </div>
        </div>
        
        <!-- 回复列表 -->
        <div v-if="evaluation.replyCount > 0" class="replies-section">
          <div class="replies-header">
            <span class="replies-count">{{ evaluation.replyCount }} 条回复</span>
            <el-button 
              text 
              size="small"
              @click="toggleReplies(evaluation.id)"
            >
              {{ showReplies[evaluation.id] ? '收起' : '展开' }}
            </el-button>
          </div>
          
          <div v-if="showReplies[evaluation.id]" class="replies-list">
            <div 
              v-for="reply in getReplies(evaluation.id)"
              :key="reply.id"
              class="reply-item"
            >
              <el-avatar :size="32" :src="reply.userAvatar">
                {{ reply.userName.charAt(0) }}
              </el-avatar>
              <div class="reply-content">
                <div class="reply-header">
                  <span class="reply-user">{{ reply.userName }}</span>
                  <span class="reply-date">{{ formatDate(reply.createdAt) }}</span>
                </div>
                <div class="reply-text">{{ reply.content }}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <!-- 加载更多 -->
      <div v-if="hasMore" class="load-more">
        <el-button 
          :loading="loading"
          @click="loadMore"
        >
          加载更多评价
        </el-button>
      </div>
      
      <!-- 空状态 -->
      <div v-if="filteredEvaluations.length === 0" class="empty-state">
        <el-empty description="暂无评价">
          <el-button type="primary" @click="showEvaluationForm = true">
            写第一条评价
          </el-button>
        </el-empty>
      </div>
    </div>

    <!-- 评价表单对话框 -->
    <el-dialog
      v-model="showEvaluationForm"
      title="写评价"
      width="600px"
      :close-on-click-modal="false"
    >
      <el-form
        ref="evaluationFormRef"
        :model="evaluationForm"
        :rules="evaluationRules"
        label-width="80px"
      >
        <el-form-item label="评分" prop="rating">
          <el-rate
            v-model="evaluationForm.rating"
            :texts="ratingTexts"
            show-text
            text-color="#ff9900"
          />
        </el-form-item>
        
        <el-form-item label="评论" prop="comment">
          <el-input
            v-model="evaluationForm.comment"
            type="textarea"
            placeholder="分享你的使用体验..."
            :rows="4"
            maxlength="1000"
            show-word-limit
          />
        </el-form-item>
        
        <el-form-item label="优点">
          <el-select
            v-model="evaluationForm.pros"
            placeholder="选择优点标签"
            multiple
            filterable
            allow-create
            style="width: 100%"
          >
            <el-option
              v-for="pro in prosOptions"
              :key="pro"
              :label="pro"
              :value="pro"
            />
          </el-select>
        </el-form-item>
        
        <el-form-item label="缺点">
          <el-select
            v-model="evaluationForm.cons"
            placeholder="选择缺点标签"
            multiple
            filterable
            allow-create
            style="width: 100%"
          >
            <el-option
              v-for="con in consOptions"
              :key="con"
              :label="con"
              :value="con"
            />
          </el-select>
        </el-form-item>
        
        <el-form-item label="改进建议">
          <el-input
            v-model="evaluationForm.suggestions"
            type="textarea"
            placeholder="提出你的改进建议..."
            :rows="3"
            maxlength="500"
            show-word-limit
          />
        </el-form-item>
        
        <el-form-item>
          <el-checkbox v-model="evaluationForm.isAnonymous">
            匿名评价
          </el-checkbox>
        </el-form-item>
      </el-form>
      
      <template #footer>
        <el-button @click="showEvaluationForm = false">取消</el-button>
        <el-button 
          type="primary"
          :loading="submitLoading"
          @click="submitEvaluation"
        >
          发布评价
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { ElMessage } from 'element-plus';
import type { FormInstance, FormRules } from 'element-plus';
import { Star, StarFilled, ChatLineSquare } from '@element-plus/icons-vue';
import type { KnowledgeEvaluation, EvaluationReply } from '@/types/knowledge';
import { useKnowledgeStore } from '@/stores/knowledge';

interface Props {
  assetId: string;
}

const props = defineProps<Props>();

const knowledgeStore = useKnowledgeStore();

// 表单引用
const evaluationFormRef = ref<FormInstance>();

// 状态
const loading = ref(false);
const submitLoading = ref(false);
const replyLoading = ref(false);
const showEvaluationForm = ref(false);
const currentFilter = ref('all');
const sortBy = ref('createdAt');
const activeReplyForm = ref<string | null>(null);
const replyContent = ref('');
const showReplies = ref<Record<string, boolean>>({});
const hasMore = ref(false);

// 评价表单
const evaluationForm = ref({
  rating: 5,
  comment: '',
  pros: [] as string[],
  cons: [] as string[],
  suggestions: '',
  isAnonymous: false
});

const evaluationRules: FormRules = {
  rating: [
    { required: true, message: '请选择评分', trigger: 'change' }
  ],
  comment: [
    { required: true, message: '请输入评论内容', trigger: 'blur' },
    { min: 10, message: '评论不能少于10个字符', trigger: 'blur' }
  ]
};

// 选项数据
const ratingTexts = ['极差', '较差', '一般', '良好', '优秀'];
const prosOptions = [
  '内容详细', '结构清晰', '实用性强', '易于理解', 
  '示例丰富', '更新及时', '质量很高', '覆盖全面'
];
const consOptions = [
  '内容过时', '深度不够', '示例较少', '结构混乱',
  '错误较多', '更新滞后', '难以理解', '实用性差'
];

// 计算属性
const evaluations = computed(() => knowledgeStore.currentEvaluations);

const overallRating = computed(() => {
  if (evaluations.value.length === 0) return 0;
  const total = evaluations.value.reduce((sum, item) => sum + item.rating, 0);
  return total / evaluations.value.length;
});

const totalEvaluations = computed(() => evaluations.value.length);

const ratingDistribution = computed(() => {
  const distribution: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  evaluations.value.forEach(evaluation => {
    distribution[evaluation.rating] = (distribution[evaluation.rating] || 0) + 1;
  });
  return distribution;
});

const filteredEvaluations = computed(() => {
  let filtered = [...evaluations.value];
  
  // 筛选
  if (currentFilter.value !== 'all') {
    if (currentFilter.value === 'helpful') {
      filtered = filtered.filter(item => item.isHelpful);
    } else {
      const rating = parseInt(currentFilter.value);
      filtered = filtered.filter(item => item.rating === rating);
    }
  }
  
  // 排序
  filtered.sort((a, b) => {
    switch (sortBy.value) {
      case 'likeCount':
        return b.likeCount - a.likeCount;
      case 'rating':
        return b.rating - a.rating;
      case 'createdAt':
      default:
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    }
  });
  
  return filtered;
});

// 方法
const getPercentage = (count: number) => {
  return totalEvaluations.value > 0 ? (count / totalEvaluations.value) * 100 : 0;
};

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffTime = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) {
    return '今天';
  } else if (diffDays === 1) {
    return '昨天';
  } else if (diffDays < 30) {
    return `${diffDays}天前`;
  } else {
    return date.toLocaleDateString();
  }
};

const handleFilterChange = () => {
  // 筛选变化时的处理
};

const handleSortChange = () => {
  // 排序变化时的处理
};

const toggleEvaluationLike = async (evaluationId: string) => {
  try {
    await knowledgeStore.toggleEvaluationLike(props.assetId, evaluationId);
  } catch (error) {
    ElMessage.error('操作失败');
  }
};

const toggleReplyForm = (evaluationId: string) => {
  if (activeReplyForm.value === evaluationId) {
    activeReplyForm.value = null;
    replyContent.value = '';
  } else {
    activeReplyForm.value = evaluationId;
    replyContent.value = '';
  }
};

const cancelReply = () => {
  activeReplyForm.value = null;
  replyContent.value = '';
};

const submitReply = async (evaluationId: string) => {
  if (!replyContent.value.trim()) {
    ElMessage.warning('请输入回复内容');
    return;
  }
  
  try {
    replyLoading.value = true;
    // 这里调用回复API
    ElMessage.success('回复成功');
    replyContent.value = '';
    activeReplyForm.value = null;
  } catch (error) {
    ElMessage.error('回复失败');
  } finally {
    replyLoading.value = false;
  }
};

const toggleReplies = (evaluationId: string) => {
  showReplies.value[evaluationId] = !showReplies.value[evaluationId];
};

const getReplies = (evaluationId: string): EvaluationReply[] => {
  // 这里应该从store或API获取回复数据
  return [];
};

const submitEvaluation = async () => {
  if (!evaluationFormRef.value) return;
  
  try {
    const valid = await evaluationFormRef.value.validate();
    if (!valid) return;
    
    submitLoading.value = true;
    
    await knowledgeStore.createEvaluation(props.assetId, evaluationForm.value);
    
    ElMessage.success('评价发布成功');
    showEvaluationForm.value = false;
    
    // 重置表单
    evaluationForm.value = {
      rating: 5,
      comment: '',
      pros: [],
      cons: [],
      suggestions: '',
      isAnonymous: false
    };
  } catch (error) {
    ElMessage.error('发布评价失败');
  } finally {
    submitLoading.value = false;
  }
};

const loadMore = async () => {
  try {
    loading.value = true;
    // 这里调用加载更多的API
  } catch (error) {
    ElMessage.error('加载失败');
  } finally {
    loading.value = false;
  }
};

// 初始化
onMounted(() => {
  knowledgeStore.fetchKnowledgeEvaluations(props.assetId);
});
</script>

<style scoped lang="scss">
.evaluation-section {
  margin-top: 32px;
}

.evaluation-stats {
  background: #fff;
  border-radius: 8px;
  padding: 24px;
  margin-bottom: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  
  .stats-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
    
    h3 {
      margin: 0;
      font-size: 18px;
      font-weight: 600;
    }
  }
  
  .stats-content {
    display: flex;
    gap: 40px;
    
    .overall-rating {
      flex-shrink: 0;
      
      .rating-score {
        display: flex;
        align-items: center;
        gap: 12px;
        margin-bottom: 8px;
        
        .score {
          font-size: 36px;
          font-weight: 600;
          color: #ff9900;
        }
      }
      
      .rating-count {
        color: #909399;
        font-size: 14px;
      }
    }
    
    .rating-distribution {
      flex: 1;
      
      .rating-bar {
        display: flex;
        align-items: center;
        gap: 12px;
        margin-bottom: 8px;
        
        .rating-label {
          width: 40px;
          font-size: 14px;
          color: #606266;
        }
        
        .bar-container {
          flex: 1;
          height: 8px;
          background: #f0f2f5;
          border-radius: 4px;
          overflow: hidden;
          
          .bar-fill {
            height: 100%;
            background: #ff9900;
            transition: width 0.3s ease;
          }
        }
        
        .rating-count {
          width: 30px;
          text-align: right;
          font-size: 14px;
          color: #909399;
        }
      }
    }
  }
}

.evaluation-filters {
  display: flex;
  align-items: center;
  margin-bottom: 20px;
  padding: 16px 24px;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.evaluation-list {
  .evaluation-item {
    background: #fff;
    border-radius: 8px;
    padding: 24px;
    margin-bottom: 16px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    
    .evaluation-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 16px;
      
      .user-info {
        display: flex;
        gap: 12px;
        
        .user-details {
          .user-name {
            font-weight: 600;
            margin-bottom: 4px;
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
      }
      
      .evaluation-actions {
        display: flex;
        gap: 8px;
      }
    }
    
    .evaluation-content {
      .evaluation-comment {
        line-height: 1.6;
        margin-bottom: 12px;
        color: #303133;
      }
      
      .evaluation-pros,
      .evaluation-cons,
      .evaluation-suggestions {
        margin-bottom: 8px;
        
        .label {
          font-weight: 600;
          margin-right: 8px;
        }
        
        .tag-item {
          margin-right: 4px;
        }
        
        .suggestion-text {
          color: #606266;
        }
      }
    }
    
    .reply-form {
      margin-top: 16px;
      padding-top: 16px;
      border-top: 1px solid #e4e7ed;
      
      .reply-actions {
        margin-top: 12px;
        display: flex;
        justify-content: flex-end;
        gap: 8px;
      }
    }
    
    .replies-section {
      margin-top: 16px;
      padding-top: 16px;
      border-top: 1px solid #e4e7ed;
      
      .replies-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 12px;
        
        .replies-count {
          font-size: 14px;
          color: #606266;
        }
      }
      
      .replies-list {
        .reply-item {
          display: flex;
          gap: 12px;
          margin-bottom: 12px;
          
          .reply-content {
            flex: 1;
            
            .reply-header {
              display: flex;
              gap: 12px;
              margin-bottom: 4px;
              
              .reply-user {
                font-weight: 600;
                font-size: 14px;
              }
              
              .reply-date {
                color: #909399;
                font-size: 12px;
              }
            }
            
            .reply-text {
              color: #606266;
              font-size: 14px;
              line-height: 1.5;
            }
          }
        }
      }
    }
  }
}

.load-more {
  text-align: center;
  padding: 20px;
}

.empty-state {
  text-align: center;
  padding: 40px;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}
</style> 