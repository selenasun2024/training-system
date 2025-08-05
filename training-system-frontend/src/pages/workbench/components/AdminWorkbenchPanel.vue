<template>
  <div class="admin-workbench-panel">
    <div class="left-menu">
      <el-menu :default-active="activeMenu" @select="handleMenuSelect">
        <el-menu-item index="mentorship-management">带教管理</el-menu-item>
        <el-menu-item index="observation-records">观察记录</el-menu-item>
        <el-menu-item index="talent-recommend">人才推荐</el-menu-item>
        <el-menu-item index="face-to-face">面授管理</el-menu-item>
      </el-menu>
    </div>
    <div class="main-content">
      <component :is="currentComponent" :project-id="projectId" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, defineComponent } from 'vue'
import { ElCard, ElTabs, ElTabPane, ElIcon, ElButton, ElDivider, ElEmpty } from 'element-plus'
import {
  Reading
} from '@element-plus/icons-vue'

// 项目管理组件
import ProjectList from '@/modules/project-management/components/ProjectList.vue'
import TaskBoard from '@/modules/project-management/components/TaskBoard.vue'
import ProjectCard from '@/components/business/ProjectCard.vue'
import ChartCard from '@/components/business/ChartCard.vue'
import MyProjectReminderList from '@/components/business/MyProjectReminderList.vue'

// 培训执行功能组件
import FaceToFaceManagement from '@/modules/project-management/pages/FaceToFaceManagement.vue'

// 管理功能组件
import AdminRecommendation from '@/modules/project-management/pages/AdminRecommendation.vue'
import AdminObserveRecords from '@/modules/project-management/components/AdminObserveRecords.vue'
import AdminMentorshipManagement from '@/modules/workbench/components/AdminMentorshipManagement.vue'


interface Props {
  projectId?: string
}

defineProps<Props>()

const activeMenu = ref('mentorship-management')

function handleMenuSelect(index: string) {
  activeMenu.value = index
}

const currentComponent = computed(() => {
  switch (activeMenu.value) {
    case 'face-to-face':
      return FaceToFaceManagement
    case 'talent-recommend':
      return AdminRecommendation
    case 'observation-records':
      return AdminObserveRecords
    case 'mentorship-management':
      return AdminMentorshipManagement
    default:
      return Placeholder
  }
})

const Placeholder = defineComponent({
  components: { ElEmpty },
  template: `<el-empty description="功能正在开发中..." />`,
})
</script>

<style scoped>
.admin-workbench-panel {
  display: flex;
  gap: 20px;
  height: 100%;
}
.left-menu {
  width: 250px;
  border-right: 1px solid #dcdfe6;
}
.main-content {
  flex: 1;
  overflow-y: auto;
}
</style> 