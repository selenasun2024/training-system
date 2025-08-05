<template>
  <div class="plan-management-container">
    <el-card shadow="never">
      <!-- Header with Search and Actions -->
      <div class="header-container">
        <el-input
          v-model="filters.keyword"
          placeholder="输入计划名称或负责人搜索"
          clearable
          class="search-input"
          @keyup.enter="applyFilters"
        >
          <template #append>
            <el-button :icon="Search" @click="applyFilters" />
          </template>
        </el-input>
        <el-button type="primary" :icon="Plus" @click="handleCreate">新建计划</el-button>
      </div>

      <!-- Plan List Table -->
      <el-table :data="filteredPlans" stripe style="width: 100%" class="mt-4">
        <el-table-column prop="name" label="计划名称" min-width="250">
           <template #default="{ row }">
            <el-button type="primary" link @click="handleViewDetails(row)">{{ row.name }}</el-button>
          </template>
        </el-table-column>
        <el-table-column prop="type" label="培训类型" width="150" />
        <el-table-column prop="owner" label="负责人" width="120" />
        <el-table-column label="计划周期" width="220">
          <template #default="{ row }">
            {{ row.startDate }} ~ {{ row.endDate }}
          </template>
        </el-table-column>
        <el-table-column label="状态" width="120" align="center">
          <template #default="{ row }">
            <el-tag :type="statusTagType(row.status)">{{ statusText(row.status) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="关联项目" width="150">
          <template #default="{ row }">
            <el-link v-if="row.linkedProject" type="primary">{{ row.linkedProject }}</el-link>
            <span v-else>未关联</span>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="150" align="center">
          <template #default="{ row }">
            <el-button type="primary" link @click="handleViewDetails(row)">详情</el-button>
            <el-button type="danger" link>删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed } from 'vue';
import { useRouter } from 'vue-router';
import { Plus, Search } from '@element-plus/icons-vue';
import { ElMessage } from 'element-plus';
import { statusText, statusTagType } from './planUtils';
import type { PlanStatus } from './planUtils';


const router = useRouter();

interface Plan {
  id: string;
  name: string;
  type: string;
  owner: string;
  startDate: string;
  endDate: string;
  status: PlanStatus;
  linkedProject: string | null;
}

const filters = reactive({
  keyword: '',
});

const allPlans = reactive<Plan[]>([
  { id: 'plan001', name: '2024年度新员工入职培训计划', type: '新员工培训', owner: '张三', startDate: '2024-03-01', endDate: '2024-12-31', status: 'in-progress', linkedProject: 'Q1新员工训项目' },
  { id: 'plan002', name: '2024年度领导力提升系列计划', type: '领导力', owner: '李四', startDate: '2024-04-15', endDate: '2024-10-31', status: 'not-started', linkedProject: null },
  { id: 'plan003', name: '2024年度技术人员技能提升计划', type: '专业技能', owner: '王五', startDate: '2024-02-01', endDate: '2024-08-30', status: 'completed', linkedProject: '技术雷达项目' },
  { id: 'plan004', name: '2024年度合规与风险管理培训计划', type: '合规风控', owner: '赵六', startDate: '2024-05-01', endDate: '2024-07-31', status: 'reviewing', linkedProject: null },
  { id: 'plan005', name: '2024年度项目管理认证计划', type: '专业认证', owner: '孙七', startDate: '2024-06-01', endDate: '2024-11-30', status: 'approved', linkedProject: null },
]);

const filteredPlans = computed(() => {
  if (!filters.keyword) {
    return allPlans;
  }
  return allPlans.filter(plan =>
    plan.name.includes(filters.keyword) || plan.owner.includes(filters.keyword)
  );
});

const applyFilters = () => {
  // This function is implicitly used by the computed property `filteredPlans`.
  // A search button is provided for user experience.
  ElMessage.success('搜索结果已更新');
};

const handleCreate = () => {
  router.push({ name: 'PlanCreate' });
};

const handleViewDetails = (row: Plan) => {
  router.push({ name: 'PlanDetail', params: { id: row.id } });
};

</script>

<style scoped>
.plan-management-container {
  padding: 20px;
}
.header-container {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.search-input {
  max-width: 300px;
}
.mt-4 {
  margin-top: 16px;
}
</style> 