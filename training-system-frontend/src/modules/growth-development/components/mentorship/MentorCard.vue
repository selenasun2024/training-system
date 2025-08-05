<template>
  <div class="mentor-card">
    <el-card shadow="hover" class="mentor-item">
      <template #header>
        <div class="mentor-header">
          <el-avatar :size="50" :src="mentor.avatar">
            {{ mentor.name[0] }}
          </el-avatar>
          <div class="mentor-info">
            <h3>{{ mentor.name }}</h3>
            <p>{{ mentor.department }}</p>
          </div>
        </div>
      </template>
      <div class="mentor-content">
        <p>{{ mentor.title }}</p>
        <div class="mentor-tags">
          <el-tag v-for="skill in mentor.expertise" :key="skill" size="small">
            {{ skill }}
          </el-tag>
        </div>
        <div class="mentor-stats">
          <span>评分: {{ mentor.rating }}</span>
          <span>经验: {{ mentor.experience }}年</span>
          <span>负荷: {{ mentor.currentLoad }}/{{ mentor.maxLoad }}</span>
        </div>
      </div>
      <template #footer>
        <div class="mentor-actions">
          <el-button size="small" @click="$emit('view-profile', mentor.id)">
            查看档案
          </el-button>
          <el-button size="small" type="primary" @click="$emit('assign-student', mentor.id)">
            分配学员
          </el-button>
        </div>
      </template>
    </el-card>
  </div>
</template>

<script setup lang="ts">
interface Props {
  mentor: any;
  userRole: string;
}

defineProps<Props>();
defineEmits<{
  'view-profile': [id: string];
  'assign-student': [id: string];
  'edit-mentor': [id: string];
  'view-history': [id: string];
}>();
</script>

<style scoped>
.mentor-card {
  margin-bottom: 16px;
}

.mentor-header {
  display: flex;
  align-items: center;
  gap: 12px;
}

.mentor-info h3 {
  margin: 0;
  font-size: 16px;
}

.mentor-info p {
  margin: 4px 0 0 0;
  color: #666;
  font-size: 14px;
}

.mentor-content {
  margin-bottom: 16px;
}

.mentor-tags {
  margin: 8px 0;
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.mentor-stats {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  color: #666;
}

.mentor-actions {
  display: flex;
  gap: 8px;
}
</style> 