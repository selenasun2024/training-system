<template>
  <div class="filter-section">
    <BaseCard class="filter-card" :body-style="{padding: '0'}" style="margin:0;padding:0;">
      <el-form 
        ref="formRef"
        :model="filterData"
        :inline="true"
        class="filter-form"
      >
        <el-form-item label="项目状态">
          <el-select v-model="filterData.status" placeholder="请选择状态" clearable style="width: 180px">
            <el-option label="全部" value="" />
            <el-option label="计划中" value="planning" />
            <el-option label="进行中" value="active" />
            <el-option label="已完成" value="completed" />
            <el-option label="已归档" value="archived" />
          </el-select>
        </el-form-item>
        <el-form-item label="项目类型">
          <el-select v-model="filterData.projectType" placeholder="请选择项目类型" clearable style="width: 180px">
            <el-option label="全部" value="" />
            <el-option 
              v-for="projectType in systemConfigStore.projectTypes" 
              :key="projectType.id"
              :label="projectType.name" 
              :value="projectType.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="时间范围">
          <el-date-picker
            v-model="filterData.dateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :icon="Search" @click="handleSearch">搜索</el-button>
          <el-button type="primary" :icon="Plus" @click="handleCreateProject">创建项目</el-button>
        </el-form-item>
      </el-form>
    </BaseCard>
  </div>
</template>

<script setup lang="ts">
import { reactive } from 'vue';
import { Search, Refresh, Plus } from '@element-plus/icons-vue';
import { useSystemConfigStore } from '@/stores/systemConfig';

// 🔧 使用系统配置
const systemConfigStore = useSystemConfigStore();

// 定义筛选数据的接口
interface ProjectFilters {
  status: string;
  projectType: string;
  dateRange: [Date, Date] | null;
}

// 使用reactive创建响应式筛选数据对象
const filterData = reactive<ProjectFilters>({
  status: '',
  projectType: '',
  dateRange: null,
});

// 定义组件的emits
const emit = defineEmits<{
  (e: 'search', filters: ProjectFilters): void;
  (e: 'reset'): void;
  (e: 'create-project'): void;
}>();

// 搜索事件处理
const handleSearch = () => {
  emit('search', { ...filterData });
};

// 重置事件处理
const handleReset = () => {
  filterData.status = '';
  filterData.projectType = '';
  filterData.dateRange = null;
  emit('reset');
};

// 创建项目事件处理
const handleCreateProject = () => {
  emit('create-project');
};
</script>

<style scoped>
.filter-section {
  margin-bottom: 0;
  padding: 0;
}
.el-form-item {
  margin-bottom: 0; /* 在inline模式下，移除默认的下边距以保持对齐 */
}
</style> 