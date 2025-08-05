<template>
  <div class="project-news-page">
    <div class="news-header">
      <h2>项目新闻</h2>
      <p class="news-description">发布项目相关的新闻资讯，分享培训成果和重要动态</p>
    </div>
    
    <div class="news-container">
      <ProjectNews :edit-mode="editMode" :project-id="projectId" :project-data="projectData" />
    </div>
  </div>
</template>

<script setup lang="ts">
import ProjectNews from './ProjectNews.vue'

// Props
const props = defineProps<{
  editMode?: boolean
  projectId?: string
  projectData?: any
}>()
</script>

<style scoped>
.project-news-page {
  padding: 20px;
}

.news-header {
  margin-bottom: 24px;
  padding: 20px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 8px;
  color: white;
}

.news-header h2 {
  margin: 0 0 8px 0;
  font-size: 24px;
  font-weight: 600;
}

.news-description {
  margin: 0;
  font-size: 14px;
  opacity: 0.9;
  line-height: 1.5;
}

.news-container {
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .project-news-page {
    padding: 12px;
  }
  
  .news-header {
    padding: 16px;
    margin-bottom: 16px;
  }
  
  .news-header h2 {
    font-size: 20px;
  }
}
</style>