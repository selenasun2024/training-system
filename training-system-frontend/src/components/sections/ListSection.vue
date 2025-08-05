<template>
  <div class="list-section">
    <el-card shadow="never" :body-style="{padding: '0'}" style="box-shadow:none;margin:0;padding:0;">
      <el-table :data="projects" style="width: 100%">
        <el-table-column prop="title" label="项目名称" width="150" />
        <el-table-column prop="manager" label="负责人" width="100" />
        <el-table-column prop="projectType" label="项目类型" width="120">
          <template #default="{ row }">
            <el-tag :type="getProjectTypeStyle(row.projectType)">
              {{ getProjectTypeName(row.projectType) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="startDate" label="开始日期" width="110">
          <template #default="{ row }">
            {{ formatDate(row.startDate) }}
          </template>
        </el-table-column>
        <el-table-column prop="updatedAt" label="更新日期" width="110">
          <template #default="{ row }">
            {{ formatDate(row.updatedAt) }}
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="statusMap[row.status]?.type || 'info'">
              {{ statusMap[row.status]?.text || row.status }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="progress" label="进度" width="150">
          <template #default="{ row }">
            <el-progress :percentage="row.progress" :color="statusMap[row.status]?.color" :show-text="true" />
          </template>
        </el-table-column>
        <el-table-column label="操作" width="180" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" size="small" @click="handleView(row.id)">查看详情</el-button>
            <el-button type="danger" size="small" @click="handleDelete(row.id)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
      <div class="pagination-container">
        <el-pagination
          background
          layout="total, sizes, prev, pager, next, jumper"
          :total="total"
          :current-page="currentPage"
          :page-size="pageSize"
          @current-change="handlePageChange"
          @size-change="handleSizeChange"
        />
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import type { PropType } from 'vue';
import { useSystemConfigStore } from '@/stores/systemConfig';

// 定义项目数据接口
interface Project {
  id: string;
  title: string;
  manager: string;
  projectType: string;
  status: 'planning' | 'active' | 'completed' | 'archived';
  startDate: string;
  progress: number;
}

// 🔧 使用系统配置
const systemConfigStore = useSystemConfigStore();

const statusMap = {
  planning: { text: '计划中', type: 'info', color: '#909399' },
  active: { text: '进行中', type: 'primary', color: '#409eff' },
  completed: { text: '已完成', type: 'success', color: '#67c23a' },
  archived: { text: '已归档', type: 'warning', color: '#e6a23c' },
};

// 🔧 获取项目类型名称
const getProjectTypeName = (typeId: string): string => {
  if (!typeId) return '未设置类型';
  const projectType = systemConfigStore.projectTypes.find(type => type.id === typeId);
  return projectType?.name || '未知类型';
};

// 🔧 获取项目类型样式
const getProjectTypeStyle = (typeId: string): string => {
  // 根据项目类型ID分配不同的样式
  const styleMap: Record<string, string> = {
    '1': 'primary',  // 领导力培训
    '2': 'success',  // 干部入线子培训
    '3': 'warning',  // 胜任素质培训
    '4': 'info',     // 专业技能培训
    '5': 'danger',   // 行业类培训
  };
  return styleMap[typeId] || 'info';
};

// 日期格式化
const formatDate = (dateString: string): string => {
  if (!dateString) return '';
  const date = new Date(dateString);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Props定义
const props = defineProps({
  projects: {
    type: Array as PropType<Project[]>,
    required: true,
  },
  total: {
    type: Number,
    default: 0,
  },
  currentPage: {
    type: Number,
    default: 1,
  },
  pageSize: {
    type: Number,
    default: 9,
  },
});

// Emits定义
const emit = defineEmits<{
  (e: 'page-change', page: number): void;
  (e: 'size-change', size: number): void;
  (e: 'view-project', projectId: string): void;
  (e: 'delete-project', projectId: string): void;
}>();

// 事件处理
const handlePageChange = (page: number) => {
  emit('page-change', page);
};

const handleSizeChange = (size: number) => {
  emit('size-change', size);
};

const handleView = (projectId: string) => {
  emit('view-project', projectId);
};

const handleDelete = (projectId: string) => {
  emit('delete-project', projectId);
};
</script>

<style scoped>
.list-section {
  padding: 0;
  margin: 0;
}
.pagination-container {
  display: flex;
  justify-content: flex-end;
  margin-top: 20px;
}
</style> 