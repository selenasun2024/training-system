<template>
  <div class="student-management">
    <!-- TAB导航 -->
    <el-tabs v-model="activeTab" class="student-tabs">
      <el-tab-pane label="学员" name="audience" />
      <el-tab-pane label="分组" name="grouping" />
      <el-tab-pane label="通知" name="notice" />
    </el-tabs>

    <!-- TAB内容区域 -->
    <div class="student-content">
      <!-- 对象管理 -->
      <div v-show="activeTab === 'audience'" class="tab-content">
        <ParticipantSelector 
          :project-type="projectType"
          :project-data="projectData"
          @participants-updated="handleParticipantsUpdated"
        />
      </div>
      
      <!-- 分组管理 -->
      <div v-show="activeTab === 'grouping'" class="tab-content">
        <GroupManagement 
          :project-id="projectId"
          :participants="participants"
          :project-type="projectType"
          :project-data="projectData"
        />
      </div>
      
      <!-- 通知管理 -->
      <div v-show="activeTab === 'notice'" class="tab-content">
        <NoticeManagement 
          :project-id="projectId"
          :project-data="projectData"
          :is-new-project="isNewProject"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue';

// 导入子组件
import ParticipantSelector from './ParticipantSelector.vue';
import GroupManagement from './GroupManagement.vue';
import NoticeManagement from './NoticeManagement.vue';

// Props
const props = defineProps<{
  projectId?: string;
  projectData?: any;
  projectType?: string;
  participants?: any[];
  isNewProject: boolean;
}>();

// Emits
const emit = defineEmits<{
  'participants-updated': [participants: any[]];
}>();

// 状态
const activeTab = ref('audience');

// 事件处理
const handleParticipantsUpdated = (participants: any[]) => {
  emit('participants-updated', participants);
};

// 生命周期
onMounted(() => {
  // 组件挂载时的初始化逻辑
});
</script>

<style scoped>
.student-management {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.student-tabs {
  flex-shrink: 0;
}

.student-content {
  flex: 1;
  min-height: 0;
  overflow: hidden;
}

.tab-content {
  height: 100%;
  overflow-y: auto;
  padding: 20px 0;
}

/* TAB样式优化 */
:deep(.el-tabs__header) {
  margin: 0 0 20px 0;
}

:deep(.el-tabs__content) {
  height: 100%;
  overflow: hidden;
}

:deep(.el-tab-pane) {
  height: 100%;
}
</style> 