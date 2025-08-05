<template>
  <div class="my-growth">
    <!-- 顶部个人概览区 -->
    <div class="personal-overview">
      <div class="overview-cards">
        <PersonalInfoCard />
        <AbilityRadar />
        <IdentityBadges />
      </div>
    </div>

    <!-- 主体内容区 -->
    <div class="main-content">
      <!-- 左侧：成长路径图 -->
      <div class="growth-path-section">
        <div class="section-header">
          <h2>🗺️ 我的成长路径</h2>
          <p>点击任意职位设为发展目标</p>
        </div>
        <GrowthPathMap />
      </div>

      <!-- 右侧：目标管理面板 -->
      <div class="goal-management-section">
        <div class="section-header">
          <h2>📋 目标管理</h2>
          <el-button type="primary" @click="showAddGoalDialog = true">
            <el-icon><Plus /></el-icon>
            添加目标
          </el-button>
        </div>
        <GoalManagement />
      </div>
    </div>

    <!-- 底部活动区 -->
    <div class="activity-section">
      <div class="section-header">
        <h2>📈 最近活动</h2>
      </div>
      <ActivityTimeline />
    </div>

    <!-- 添加目标对话框 -->
    <el-dialog
      v-model="showAddGoalDialog"
      title="添加成长目标"
      width="600px"
    >
      <AddGoalForm @success="handleAddGoalSuccess" />
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { Plus } from '@element-plus/icons-vue'
import PersonalInfoCard from '../components/PersonalInfoCard.vue'
import AbilityRadar from '../components/AbilityRadar.vue'
import IdentityBadges from '../components/IdentityBadges.vue'
import GrowthPathMap from '../components/GrowthPathMap.vue'
import GoalManagement from '../components/GoalManagement.vue'
import ActivityTimeline from '../components/ActivityTimeline.vue'
import AddGoalForm from '../components/AddGoalForm.vue'

// 响应式数据
const showAddGoalDialog = ref(false)

// 方法
const handleAddGoalSuccess = () => {
  showAddGoalDialog.value = false
  // 刷新目标列表
  // TODO: 实现目标列表刷新逻辑
}
</script>

<style scoped>
.my-growth {
  padding: 24px;
  background-color: #f5f7fa;
  min-height: 100vh;
}

/* 顶部个人概览区 */
.personal-overview {
  margin-bottom: 24px;
}

.overview-cards {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 24px;
  margin-bottom: 24px;
}

/* 主体内容区 */
.main-content {
  display: grid;
  grid-template-columns: 1fr 400px;
  gap: 24px;
  margin-bottom: 24px;
}

.growth-path-section,
.goal-management-section {
  background: white;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.growth-path-section {
  min-height: 600px;
}

.goal-management-section {
  min-height: 600px;
}

/* 底部活动区 */
.activity-section {
  background: white;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

/* 区域标题 */
.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 12px;
  border-bottom: 2px solid #e4e7ed;
}

.section-header h2 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #303133;
}

.section-header p {
  margin: 4px 0 0 0;
  font-size: 14px;
  color: #909399;
}

/* 响应式设计 */
@media (max-width: 1200px) {
  .main-content {
    grid-template-columns: 1fr;
  }
  
  .goal-management-section {
    order: -1;
  }
}

@media (max-width: 768px) {
  .my-growth {
    padding: 16px;
  }
  
  .overview-cards {
    grid-template-columns: 1fr;
    gap: 16px;
  }
  
  .main-content {
    gap: 16px;
  }
  
  .growth-path-section,
  .goal-management-section,
  .activity-section {
    padding: 16px;
  }
}
</style> 