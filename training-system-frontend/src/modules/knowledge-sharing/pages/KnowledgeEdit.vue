<template>
  <div class="knowledge-edit-page">
    <div class="page-header">
      <div class="header-content">
        <div class="header-left">
          <el-button 
            text
            @click="goBack"
          >
            <el-icon><ArrowLeft /></el-icon>
            返回
          </el-button>
          <div class="header-title">
            <h1>编辑知识</h1>
            <p>完善你的知识内容，让分享更有价值</p>
          </div>
        </div>
        
        <div class="header-right">
          <el-tag 
            v-if="knowledgeData"
            :type="getStatusTagType(knowledgeData.status)"
          >
            {{ getStatusLabel(knowledgeData.status) }}
          </el-tag>
        </div>
      </div>
    </div>

    <div class="page-content">
      <div v-if="loading" class="loading-container">
        <el-skeleton :rows="10" animated />
      </div>
      
      <KnowledgeEditor
        v-else-if="knowledgeData"
        mode="edit"
        :initial-data="knowledgeData"
        :knowledge-id="knowledgeId"
        @success="handleUpdateSuccess"
        @cancel="handleCancel"
      />
      
      <div v-else class="error-container">
        <el-result
          icon="warning"
          title="知识不存在"
          sub-title="您要编辑的知识可能已被删除或您没有编辑权限"
        >
          <template #extra>
            <el-button type="primary" @click="goToSquare">
              返回知识广场
            </el-button>
          </template>
        </el-result>
      </div>
    </div>

    <!-- 离开确认对话框 -->
    <el-dialog
      v-model="showLeaveConfirm"
      title="确认离开"
      width="400px"
      :close-on-click-modal="false"
    >
      <p>您有未保存的内容，确定要离开吗？</p>
      <template #footer>
        <el-button @click="showLeaveConfirm = false">取消</el-button>
        <el-button @click="saveAndLeave">保存并离开</el-button>
        <el-button type="danger" @click="forceLeave">不保存离开</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { ElMessage } from 'element-plus';
import { ArrowLeft } from '@element-plus/icons-vue';
import KnowledgeEditor from '../components/KnowledgeEditor.vue';
import type { KnowledgeAsset, KnowledgeStatus } from '@/types/knowledge';
import { useKnowledgeStore } from '@/stores/knowledge';

const router = useRouter();
const route = useRoute();
const knowledgeStore = useKnowledgeStore();

// 状态
const loading = ref(true);
const knowledgeData = ref<KnowledgeAsset | null>(null);
const showLeaveConfirm = ref(false);
const hasUnsavedChanges = ref(false);

// 计算属性
const knowledgeId = route.params.id as string;

// 方法
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

const goBack = () => {
  if (hasUnsavedChanges.value) {
    showLeaveConfirm.value = true;
  } else {
    router.back();
  }
};

const goToSquare = () => {
  router.push({ name: 'KnowledgeSquare' });
};

const handleUpdateSuccess = (data: KnowledgeAsset) => {
  hasUnsavedChanges.value = false;
  ElMessage.success('知识更新成功');
  
  // 跳转到知识详情页
  router.push({
    name: 'KnowledgeDetail',
    params: { id: data.id }
  });
};

const handleCancel = () => {
  goBack();
};

const saveAndLeave = () => {
  // 这里保存草稿
  ElMessage.success('草稿保存成功');
  showLeaveConfirm.value = false;
  router.back();
};

const forceLeave = () => {
  hasUnsavedChanges.value = false;
  showLeaveConfirm.value = false;
  router.back();
};

// 加载知识数据
const loadKnowledgeData = async () => {
  try {
    loading.value = true;
    await knowledgeStore.fetchAssetDetail(knowledgeId);
    knowledgeData.value = knowledgeStore.currentAsset;
    
    if (!knowledgeData.value) {
      ElMessage.error('知识不存在或您没有编辑权限');
    }
  } catch (error) {
    ElMessage.error('加载知识数据失败');
  } finally {
    loading.value = false;
  }
};

// 页面离开守卫
const beforeUnloadHandler = (e: BeforeUnloadEvent) => {
  if (hasUnsavedChanges.value) {
    e.preventDefault();
    e.returnValue = '';
  }
};

// 生命周期
onMounted(() => {
  loadKnowledgeData();
  
  // 添加页面离开监听
  window.addEventListener('beforeunload', beforeUnloadHandler);
});

onBeforeUnmount(() => {
  window.removeEventListener('beforeunload', beforeUnloadHandler);
});
</script>

<style scoped lang="scss">
.knowledge-edit-page {
  min-height: 100vh;
  background: #f5f7fa;
}

.page-header {
  background: #fff;
  border-bottom: 1px solid #e4e7ed;
  padding: 0;
  
  .header-content {
    max-width: 1200px;
    margin: 0 auto;
    padding: 20px 24px;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  
  .header-left {
    display: flex;
    align-items: center;
    gap: 16px;
    
    .header-title {
      h1 {
        margin: 0 0 4px 0;
        font-size: 24px;
        font-weight: 600;
        color: #303133;
      }
      
      p {
        margin: 0;
        color: #909399;
        font-size: 14px;
      }
    }
  }
  
  .header-right {
    display: flex;
    gap: 12px;
  }
}

.page-content {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 24px 40px;
}

.loading-container,
.error-container {
  padding: 40px 20px;
}

.loading-container {
  background: #fff;
  border-radius: 8px;
  margin-top: 20px;
}
</style> 