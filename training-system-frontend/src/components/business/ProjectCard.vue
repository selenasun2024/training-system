<template>
  <div class="project-card">
    <el-card shadow="hover">
      <template #header>
        <div class="card-header">
          <div class="project-title">{{ project.title }}</div>
          <el-tag :type="statusMap[project.status].type" effect="light">
            {{ statusMap[project.status].text }}
          </el-tag>
        </div>
      </template>

      <div class="card-content">
        <div class="info-row">
          <el-icon><User /></el-icon>
          <span>负责人：{{ project.manager }}</span>
        </div>
        <div class="info-row">
          <el-icon><Calendar /></el-icon>
          <span>开始日期：{{ project.startDate }}</span>
        </div>
        <div class="progress-row">
          <span>项目进度：</span>
          <el-progress :percentage="project.progress" :color="statusMap[project.status].color" />
        </div>
      </div>

      <template #footer>
        <div class="card-footer">
          <el-button type="primary" plain @click="handleView">查看详情</el-button>
          <el-button @click="handleEdit">编辑项目</el-button>
        </div>
      </template>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { User, Calendar } from '@element-plus/icons-vue';
import type { PropType } from 'vue';

// 定义项目状态类型
type ProjectStatus = 'planning' | 'active' | 'completed' | 'archived';

// 定义项目数据接口
interface Project {
  id: string;
  title: string;
  manager: string;
  status: ProjectStatus;
  startDate: string;
  progress: number;
}

// 状态映射，用于显示不同状态的样式和文本
const statusMap = {
  planning: { text: '计划中', type: 'info', color: '#909399' },
  active: { text: '进行中', type: 'primary', color: '#409eff' },
  completed: { text: '已完成', type: 'success', color: '#67c23a' },
  archived: { text: '已归档', type: 'warning', color: '#e6a23c' },
};

// 模拟数据
const mockProject: Project = {
  id: 'mock-001',
  title: '新员工入职培训项目（第一期）',
  manager: '王经理',
  status: 'active',
  startDate: '2024-08-01',
  progress: 68,
};

// Props定义
const props = defineProps({
  projectData: {
    type: Object as PropType<Project>,
    required: true
  },
  mockMode: {
    type: Boolean,
    default: true
  }
});

// 根据是否是mockMode来决定使用的数据
const project = computed(() => {
  return props.mockMode ? mockProject : props.projectData;
});

// 事件定义
const emit = defineEmits<{
  (e: 'view', projectId: string): void;
  (e: 'edit', projectId: string): void;
}>();

// 事件处理
const handleView = () => {
  emit('view', project.value.id);
};

const handleEdit = () => {
  emit('edit', project.value.id);
};
</script>

<style scoped>
.project-card {
  margin-bottom: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.project-title {
  font-weight: bold;
  font-size: 16px;
}

.card-content .info-row {
  display: flex;
  align-items: center;
  color: #606266;
  margin-bottom: 12px;
  font-size: 14px;
}

.card-content .info-row .el-icon {
  margin-right: 8px;
}

.card-content .progress-row {
  display: flex;
  align-items: center;
  font-size: 14px;
  color: #606266;
}

.card-content .el-progress {
  width: 70%;
  margin-left: 10px;
}

.card-footer {
  display: flex;
  justify-content: flex-end;
}
</style> 