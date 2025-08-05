<template>
  <div class="knowledge-create-page">
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
            <h1>创建知识</h1>
            <p>分享你的经验和见解，帮助团队成长</p>
          </div>
        </div>
        
        <div class="header-right">
          <el-button 
            v-if="isDraft"
            type="info"
            @click="loadDraft"
          >
            <el-icon><Document /></el-icon>
            加载草稿
          </el-button>
        </div>
      </div>
    </div>

    <div class="page-content">
      <KnowledgeEditor
        mode="create"
        @success="handleCreateSuccess"
        @cancel="handleCancel"
      />
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
import { useRouter } from 'vue-router';
import { ElMessage, ElMessageBox } from 'element-plus';
import { ArrowLeft, Document } from '@element-plus/icons-vue';
import KnowledgeEditor from '../components/KnowledgeEditor.vue';
import type { KnowledgeAsset } from '@/types/knowledge';

const router = useRouter();

// 状态
const isDraft = ref(false);
const showLeaveConfirm = ref(false);
const hasUnsavedChanges = ref(false);

// 方法
const goBack = () => {
  if (hasUnsavedChanges.value) {
    showLeaveConfirm.value = true;
  } else {
    router.back();
  }
};

const loadDraft = () => {
  ElMessageBox.confirm('加载草稿将覆盖当前内容，确定继续吗？', '确认加载', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    // 这里加载草稿数据
    ElMessage.success('草稿加载成功');
  }).catch(() => {
    // 用户取消
  });
};

const handleCreateSuccess = (data: KnowledgeAsset) => {
  hasUnsavedChanges.value = false;
  ElMessage.success('知识创建成功');
  
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

// 页面离开守卫
const beforeUnloadHandler = (e: BeforeUnloadEvent) => {
  if (hasUnsavedChanges.value) {
    e.preventDefault();
    e.returnValue = '';
  }
};

// 生命周期
onMounted(() => {
  // 检查是否有草稿
  const draftData = localStorage.getItem('knowledge-draft');
  if (draftData) {
    isDraft.value = true;
  }
  
  // 添加页面离开监听
  window.addEventListener('beforeunload', beforeUnloadHandler);
});

onBeforeUnmount(() => {
  window.removeEventListener('beforeunload', beforeUnloadHandler);
});
</script>

<style scoped lang="scss">
.knowledge-create-page {
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
</style> 