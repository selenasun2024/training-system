<template>
  <div class="growth-profile-list-page">
    <el-card shadow="never">
      <template #header>
        <div class="page-header">
          <h2>个人成长档案</h2>
          <el-input v-model="search" placeholder="按姓名/工号搜索" clearable style="width: 240px;"/>
        </div>
      </template>

      <div class="page-body">
        <!-- Filters -->
        <div class="filters">
          <h4>筛选条件</h4>
          <el-form label-position="top">
            <el-form-item label="部门">
              <el-select v-model="filters.department" placeholder="所有部门" clearable>
                <el-option label="创新赋能部" value="创新赋能部"></el-option>
                <el-option label="零元素集采部" value="零元素集采部"></el-option>
                <el-option label="市场营销部" value="市场营销部"></el-option>
              </el-select>
            </el-form-item>
            <el-form-item label="关键身份">
              <el-select v-model="filters.keyIdentity" placeholder="所有身份" clearable>
                <el-option label="羽林卫" value="羽林卫"></el-option>
                <el-option label="锦衣卫" value="锦衣卫"></el-option>
                <el-option label="CEO计划" value="CEO计划"></el-option>
                <el-option label="继任者" value="继任者"></el-option>
                <el-option label="金牌带教老师" value="金牌带教老师"></el-option>
              </el-select>
            </el-form-item>
             <el-form-item label="参加过的项目">
              <el-select v-model="filters.project" placeholder="所有项目" clearable>
                <el-option label="子衿培训" value="子衿培训"></el-option>
                <el-option label="新员工入职" value="新员工入职"></el-option>
                <el-option label="干部入模子培训" value="干部入模子培训"></el-option>
              </el-select>
            </el-form-item>
            <el-form-item label="担任过的角色">
               <el-select v-model="filters.role" placeholder="所有角色" clearable>
                <el-option label="组长" value="组长"></el-option>
                <el-option label="学习委员" value="学习委员"></el-option>
                <el-option label="纪律委员" value="纪律委员"></el-option>
              </el-select>
            </el-form-item>
          </el-form>
        </div>

        <!-- Table -->
        <div class="table-container">
          <el-table :data="filteredData" stripe>
            <el-table-column prop="name" label="姓名/工号" width="140">
              <template #default="{ row }">
                <div>{{ row.name }}</div>
                <div class="sub-text">{{ row.id }}</div>
              </template>
            </el-table-column>
            <el-table-column prop="department" label="部门" width="120" />
            <el-table-column prop="position" label="岗位" width="150" />
            <el-table-column prop="keyIdentities" label="关键身份标签">
              <template #default="{ row }">
                <el-tag v-for="tag in row.keyIdentities" :key="tag" :type="tagColors[tag]" size="small" class="identity-tag">{{ tag }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="growthTarget" label="成长目标" />
            <el-table-column label="操作" width="100" fixed="right">
              <template #default="{ row }">
                <el-button type="primary" link @click="viewProfile(row.id)">查看档案</el-button>
              </template>
            </el-table-column>
          </el-table>
        </div>
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed } from 'vue';
import { useRouter } from 'vue-router';

const router = useRouter();

// Filters
const search = ref('');
const filters = reactive({
  department: '',
  keyIdentity: '',
  project: '',
  role: '',
});

// Mock Data
const mockData = ref([
  { id: '1001', name: '张三', department: '创新赋能部', position: '高级软件工程师', keyIdentities: ['羽林卫', '继任者'], growthTarget: '研发总监', projects: ['子衿培训', '新员工入职'], roles: ['组长'] },
  { id: '1002', name: '李四', department: '零元素集采部', position: '产品经理', keyIdentities: ['金牌带教老师'], growthTarget: '产品专家', projects: ['新员工入职'], roles: [] },
  { id: '1003', name: '王五', department: '创新赋能部', position: '前端工程师', keyIdentities: [], growthTarget: '高级前端工程师', projects: ['子衿培训'], roles: ['学习委员'] },
  { id: '1004', name: '赵六', department: '市场营销部', position: '市场专员', keyIdentities: [], growthTarget: '市场经理', projects: ['干部入模子培训'], roles: ['纪律委员'] },
  { id: '1005', name: '孙七', department: '创新赋能部', position: 'Java后端工程师', keyIdentities: ['羽林卫'], growthTarget: '架构师', projects: ['子衿培训'], roles: ['组长'] },
]);

const tagColors = {
  '羽林卫': 'warning',
  '锦衣卫': 'danger',
  'CEO计划': 'success',
  '继任者': 'info',
  '金牌带教老师': 'success',
};

const filteredData = computed(() => {
  return mockData.value.filter(item => {
    const searchMatch = search.value ? (item.name.includes(search.value) || item.id.includes(search.value)) : true;
    const departmentMatch = filters.department ? item.department === filters.department : true;
    const keyIdentityMatch = filters.keyIdentity ? item.keyIdentities.includes(filters.keyIdentity) : true;
    const projectMatch = filters.project ? item.projects.includes(filters.project) : true;
    const roleMatch = filters.role ? item.roles.includes(filters.role) : true;
    return searchMatch && departmentMatch && keyIdentityMatch && projectMatch && roleMatch;
  });
});

function viewProfile(id: string) {
  router.push({ name: 'GrowthProfileDetail', params: { id } });
}

</script>

<style scoped>
.growth-profile-list-page {
  padding: 20px;
}
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.page-body {
  display: flex;
  gap: 20px;
}
.filters {
  width: 220px;
  border-right: 1px solid #e4e7ed;
  padding-right: 20px;
}
.filters h4 {
  margin-top: 0;
  margin-bottom: 16px;
}
.table-container {
  flex: 1;
}
.sub-text {
  font-size: 12px;
  color: #909399;
}
.identity-tag {
  margin-right: 5px;
}
</style> 