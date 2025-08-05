<template>
  <div class="admin-recommendation-page">
    <el-page-header content="人才推荐管理" @back="$router.back()" />
    <div class="page-content">
      <admin-talent-recommendation :project-id="projectId" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRoute } from 'vue-router'
import AdminTalentRecommendation from '../components/AdminTalentRecommendation.vue'

interface Props { projectId?: string }
const props = defineProps<Props>()

const route = useRoute()
const projectId = props.projectId ?? (route.params.projectId as string | undefined)
</script>

<style scoped>
.admin-recommendation-page {
  padding: 20px;
}

.page-content {
  margin-top: 20px;
}
</style> 