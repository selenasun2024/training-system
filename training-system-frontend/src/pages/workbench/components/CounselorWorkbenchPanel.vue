<template>
  <div class="counselor-workbench-panel">
    <div class="left-menu">
      <el-menu :default-active="activeMenu" @select="handleMenuSelect">
        <el-menu-item index="score">批阅</el-menu-item>
        <el-menu-item index="observe">观察</el-menu-item>
        <el-menu-item index="recommend">推荐</el-menu-item>
      </el-menu>
    </div>
    <div class="main-content">
      <component :is="currentComponent" :project-id="projectId" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, defineComponent } from 'vue'
import { ElEmpty } from 'element-plus'

import CounselorTaskList from '@/modules/project-management/components/CounselorTaskList.vue'
import CounselorObserve from '@/modules/project-management/components/CounselorObserve.vue'
import CounselorRecommendationTabs from '@/modules/project-management/components/CounselorRecommendationTabs.vue'

interface Props {
  projectId?: string
}

defineProps<Props>()

const activeMenu = ref('score')

function handleMenuSelect(index: string) {
  activeMenu.value = index
}

const currentComponent = computed(() => {
  switch (activeMenu.value) {
    case 'score':
      return CounselorTaskList
    case 'observe':
      return CounselorObserve
    case 'recommend':
      return CounselorRecommendationTabs
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
.counselor-workbench-panel {
  display: flex;
  gap: 20px;
  height: 100%;
}
.left-menu {
  width: 200px;
  border-right: 1px solid #dcdfe6;
}
.main-content {
  flex: 1;
  overflow-y: auto;
}
</style> 