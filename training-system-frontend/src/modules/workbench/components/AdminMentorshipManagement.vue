<template>
  <div class="admin-mentorship-management">
    <!-- 数据加载中 -->
    <div v-if="loading" class="loading-container">
      <el-skeleton :rows="5" animated />
    </div>

    <!-- Tab布局 -->
    <div v-else class="tabs-container">
      <el-tabs v-model="activeTab" class="task-tabs">
        <!-- Tab1: 师徒关系 -->
        <el-tab-pane label="师徒关系" name="relationships">
          <MentorshipRelationshipOverview />
        </el-tab-pane>

        <!-- Tab2: 评价管理 -->
        <el-tab-pane label="评价管理" name="evaluations">
          <EvaluationManagement />
        </el-tab-pane>

        <!-- Tab3: 补贴管理 -->
        <el-tab-pane label="补贴管理" name="subsidies">
          <SubsidyManagement />
        </el-tab-pane>

        <!-- Tab4: 师资管理 -->
        <el-tab-pane label="师资管理" name="mentors">
          <MentorResourceManagement />
        </el-tab-pane>

        <!-- Tab5: 认证管理 -->
        <el-tab-pane label="认证管理" name="certifications">
          <CertificationManagement />
        </el-tab-pane>
      </el-tabs>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import MentorshipRelationshipOverview from './mentorship/MentorshipRelationshipOverview.vue'
import MentorResourceManagement from './mentorship/MentorResourceManagement.vue'
import EvaluationManagement from './mentorship/EvaluationManagement.vue'
import SubsidyManagement from './mentorship/SubsidyManagement.vue'
import CertificationManagement from './mentorship/CertificationManagement.vue'

// 状态管理
const activeTab = ref('relationships')
const loading = ref(true)

// 方法
const loadData = async () => {
  loading.value = true
  try {
    // 模拟加载数据
    await new Promise(resolve => setTimeout(resolve, 500))
  } catch (error) {
    console.error('加载数据失败:', error)
    ElMessage.error('加载数据失败，请稍后重试')
  } finally {
    loading.value = false
  }
}

// 生命周期
onMounted(() => {
  loadData()
})
</script>

<style scoped>
.admin-mentorship-management {
  padding: 20px;
  background: #fff;
  height: 100%;
}

.tabs-container {
  position: relative;
  height: 100%;
}

.loading-container {
  padding: 40px;
}

:deep(.el-tabs__content) {
  overflow: visible;
  height: calc(100% - 40px);
}

:deep(.el-tab-pane) {
  padding: 0;
  height: 100%;
}

:deep(.el-tabs__nav-wrap) {
  margin-bottom: 20px;
}
</style> 