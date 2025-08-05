<template>
  <el-card shadow="never" class="observe-admin-page">
    <template #header>
      <div class="header-wrap">
        <span>观察记录管理</span>
        <el-dropdown @command="exportData">
          <span class="el-dropdown-link">
            导出 <el-icon><ArrowDown /></el-icon>
          </span>
          <el-dropdown-menu>
            <el-dropdown-item command="current">当前筛选结果</el-dropdown-item>
            <el-dropdown-item command="student">学员个人报告</el-dropdown-item>
            <el-dropdown-item command="group">小组报告</el-dropdown-item>
          </el-dropdown-menu>
        </el-dropdown>
      </div>
    </template>

    <!-- 筛选区 -->
    <el-form :inline="true" :model="query" class="filter-form" @submit.prevent>
      <!-- 若未从父组件传入 projectId，则提供项目选择 -->
      <el-form-item v-if="!projectId" label="项目">
        <el-select v-model="query.projectId" placeholder="请选择项目" size="small" style="width:200px">
          <el-option v-for="p in projectOptions" :key="p.id" :label="p.name" :value="p.id" />
        </el-select>
      </el-form-item>
      <el-form-item label="日期">
        <el-date-picker v-model="query.dateRange" type="daterange" size="small" />
      </el-form-item>
      <el-form-item label="辅导员">
        <UserSelector v-model="query.counselorIds" size="small" />
      </el-form-item>
      <el-form-item label="学员">
        <UserSelector v-model="query.studentIds" size="small" />
      </el-form-item>
      <el-form-item label="小组">
        <GroupSelector v-model="query.groupIds" :options="groupOptions" size="small" />
      </el-form-item>
      <el-form-item label="类型">
        <el-select v-model="query.type" placeholder="全部" size="small" style="width:120px">
          <el-option label="闪光点" value="highlight" />
          <el-option label="待改进" value="improve" />
        </el-select>
      </el-form-item>
      <el-form-item>
        <el-button type="primary" size="small" @click="fetch">查询</el-button>
        <el-button size="small" @click="reset">重置</el-button>
      </el-form-item>
    </el-form>

    <!-- 统计信息 -->
    <el-collapse v-model="statCollapse" class="mb-2">
      <el-collapse-item title="统计概览" name="stat">
        <el-space wrap>
          <el-tag>总记录：{{ stats.total }}</el-tag>
          <el-tag type="success">闪光点占比：{{ stats.highlightRate }}%</el-tag>
          <el-tag type="warning">待改进占比：{{ stats.improveRate }}%</el-tag>
        </el-space>
      </el-collapse-item>
    </el-collapse>

    <!-- 表格 -->
    <el-table :data="records" border v-loading="loading" style="width: 100%">
      <el-table-column type="index" width="50" />
      <el-table-column prop="date" label="日期" width="100" />
      <el-table-column prop="counselorName" label="辅导员" width="100" />
      <el-table-column prop="projectName" label="项目名称" width="140" />
      <el-table-column prop="studentName" label="学员" width="100">
        <template #default="{ row }">
          <el-link @click="gotoProfile(row.studentId)">{{ row.studentName }}</el-link>
        </template>
      </el-table-column>
      <el-table-column prop="groupName" label="小组" width="80" />
      <el-table-column prop="type" label="类型" width="90">
        <template #default="{ row }">
          <el-tag :type="row.type==='highlight'?'success':'warning'" size="small">{{ row.type==='highlight'?'闪光点':'待改进' }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="content" label="内容" min-width="200" show-overflow-tooltip />
    </el-table>

    <!-- 分页 -->
    <el-pagination v-model:current-page="query.page" v-model:page-size="query.pageSize"
                   :total="total" layout="total, prev, pager, next"
                   @current-change="fetch" @size-change="fetch" class="mt-3" />
  </el-card>
</template>

<script setup lang="ts">
import { ref, reactive, watch, onMounted, computed } from 'vue';
import { ElMessage } from 'element-plus';
import { ArrowDown } from '@element-plus/icons-vue';
import { useRouter } from 'vue-router';
import { useAdminObservationStore } from '@/stores/adminObservations';
import { useGroupStore } from '@/modules/project-management/stores/group';
import request from '@/utils/request';

interface Props { projectId?: string }
const props = defineProps<Props>()

const store = useAdminObservationStore()
const groupStore = useGroupStore()

const router = useRouter();
const statCollapse = ref(['stat']);

// 项目列表（从API获取）
const projectOptions = ref([])

// 获取项目列表
async function loadProjects() {
  try {
    const response = await request.get('/api/projects', {
      params: { page: 1, pageSize: 100 }
    })
    projectOptions.value = response.projects.map(p => ({
      id: p.id,
      name: p.name
    }))
  } catch (error) {
    console.error('获取项目列表失败:', error)
    ElMessage.error('获取项目列表失败')
  }
}

const query = reactive({
  projectId: props.projectId || null,
  dateRange: [] as any,
  counselorIds: [] as any,
  studentIds: [] as any,
  groupIds: [] as any,
  type: '' as '' | 'highlight' | 'improve',
  page: 1,
  pageSize: 10,
})

watch(() => props.projectId, (val) => {
  if (val) {
    query.projectId = val;
    fetch();
    groupStore.fetchGroups(val); // 获取小组数据
  }
})

// 监听项目选择变化，自动触发查询
watch(() => query.projectId, (val) => {
  fetch();
  if (val) {
    groupStore.fetchGroups(val); // 获取小组数据
  }
})

function fetch() {
  if (query.projectId && query.projectId.trim() !== '') {
    // 查询特定项目的观察记录
    store.fetch(query.projectId, query)
  } else {
    // 查询所有项目的观察记录
    store.fetchAllProjects(query)
  }
}

function reset() {
  Object.assign(query, { dateRange: [], counselorIds: [], studentIds: [], groupIds: [], type: '', page: 1, pageSize: 10 })
  fetch();
}

function gotoProfile(id: string) {
  router.push(`/student-management/profile/${id}`);
}

function exportData(cmd: string) {
  ElMessage.success(`已导出（${cmd}） Mock`);
}

onMounted(() => {
  loadProjects(); // 加载项目列表
  fetch(); // 默认加载所有项目的观察记录
  if (query.projectId) {
    groupStore.fetchGroups(query.projectId);
  }
})

// store 映射
const loading = computed(() => store.loading || groupStore.loading)
const records = computed(() => store.records)
const total = computed(() => store.total)
const stats = computed(() => store.stats)
const groupOptions = computed(() => groupStore.groups.map(g => ({ id: g.id, name: g.name })))

</script>

<style scoped>
.observe-admin-page .el-dropdown-link{ cursor:pointer; color:#409EFF; }
.filter-form{ margin-bottom:8px; }
.header-wrap{ display:flex; justify-content:space-between; align-items:center; }
</style> 