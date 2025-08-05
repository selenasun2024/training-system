<template>
  <div class="plan-detail-page">
    <el-card shadow="never">
      <!-- Header -->
      <template #header>
        <div class="page-header">
          <div class="header-left">
            <el-button :icon="ArrowLeft" circle @click="goBack" />
            <h2 class="ml-2">{{ plan.name }}</h2>
            <el-tag :type="statusTagType(plan.status)" class="ml-2">{{ statusText(plan.status) }}</el-tag>
          </div>
          <div class="actions">
            <!-- 根据状态和角色权限显示 -->
            <el-button type="primary" @click="submitForApproval">提交审批</el-button>
          </div>
        </div>
      </template>

      <!-- Tabs -->
      <el-tabs v-model="activeTab">
        <!-- Tab 1: 协作与内容 -->
        <el-tab-pane label="协作与内容" name="collaboration">
          <div class="tab-content">
            <h3 class="section-title">协作人管理</h3>
            <el-button :icon="Plus" size="small" @click="inviteCollaborator">邀请协作人</el-button>
            <el-table :data="plan.collaborators" stripe class="mt-2">
              <el-table-column prop="name" label="姓名" width="120" />
              <el-table-column prop="role" label="角色" width="150" />
              <el-table-column prop="status" label="填写状态" width="120">
                 <template #default="{ row }">
                  <el-tag :type="row.status === '已提交' ? 'success' : 'warning'">{{ row.status }}</el-tag>
                </template>
              </el-table-column>
              <el-table-column prop="lastUpdate" label="最后更新" />
              <el-table-column label="操作" width="100">
                <template #default>
                  <el-button type="primary" link>提醒</el-button>
                  <el-button type="danger" link>移除</el-button>
                </template>
              </el-table-column>
            </el-table>

            <h3 class="section-title mt-4">计划内容</h3>
            <!-- 内容区：汇总 + 各协作人提交 -->
            <el-tabs v-model="activeContentTab">
              <el-tab-pane label="汇总内容" name="summary">
                <div class="editor-placeholder">
                  这里将放置富文本编辑器，用于负责人整合所有协作人提交的内容。
                </div>
              </el-tab-pane>
              <el-tab-pane
                v-for="collab in plan.collaborators"
                :key="collab.id"
                :label="collab.name"
                :name="collab.id"
              >
                <el-card shadow="never">
                  <template #header>
                    <span>{{ collab.role }} 提交的内容</span>
                  </template>
                  <div style="white-space: pre-line">{{ collab.content || '（暂无内容）' }}</div>
                </el-card>
              </el-tab-pane>
            </el-tabs>
          </div>
        </el-tab-pane>

        <!-- Tab 2: 审批与执行 -->
        <el-tab-pane label="审批与执行" name="approval">
          <div class="tab-content">
            <h3 class="section-title">审批历史</h3>
            <el-timeline>
              <el-timeline-item
                v-for="(item, index) in plan.approvalHistory"
                :key="index"
                :timestamp="item.timestamp"
                :type="item.type"
              >
                <h4>{{ item.title }}</h4>
                <p>{{ item.content }}</p>
              </el-timeline-item>
            </el-timeline>
            
            <div v-if="plan.status === 'approved'" class="mt-4">
              <h3 class="section-title">执行跟踪</h3>
              <el-button type="success" :icon="DocumentAdd" @click="createProjectFromPlan">
                根据此计划创建培训项目
              </el-button>
            </div>
          </div>
        </el-tab-pane>

        <!-- Tab 3: 基本信息 -->
        <el-tab-pane label="基本信息" name="info">
           <div class="tab-content">
             <el-descriptions :column="2" border>
                <el-descriptions-item label="计划名称">{{ plan.name }}</el-descriptions-item>
                <el-descriptions-item label="培训类型">{{ plan.type }}</el-descriptions-item>
                <el-descriptions-item label="负责人">{{ plan.owner }}</el-descriptions-item>
                <el-descriptions-item label="计划周期">{{ plan.startDate }} ~ {{ plan.endDate }}</el-descriptions-item>
                <el-descriptions-item label="计划描述" :span="2">{{ plan.description }}</el-descriptions-item>
             </el-descriptions>
           </div>
        </el-tab-pane>
      </el-tabs>
    </el-card>

    <el-dialog v-model="employeeDialogVisible" title="邀请协作人" width="600px">
      <el-input
        v-model="employeeSearch"
        placeholder="搜索姓名或部门"
        clearable
        :prefix-icon="Search"
        class="mb-2"
      />
      <el-table
        :data="filteredEmployees"
        style="width: 100%"
        @selection-change="handleEmployeeSelection"
      >
        <el-table-column type="selection" width="55" />
        <el-table-column prop="name" label="姓名" width="120" />
        <el-table-column prop="dept" label="部门" />
      </el-table>
      <template #footer>
        <el-button @click="employeeDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="confirmAddCollaborators">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { ArrowLeft, Plus, DocumentAdd, Search } from '@element-plus/icons-vue';
import { ElMessage } from 'element-plus';
import { statusText, statusTagType } from './planUtils'; // Assuming you create a utils file

const router = useRouter();
const route = useRoute();
const planId = route.params.id;

// Mock Data for a single plan
const plan = reactive({
  id: planId,
  name: '2024年度新员工入职培训计划',
  type: '新员工培训',
  owner: '张三',
  startDate: '2024-03-01',
  endDate: '2024-12-31',
  status: 'in-progress',
  description: '本计划旨在帮助新员工快速融入公司，掌握基本工作技能和了解企业文化。',
  collaborators: [
    { id: 'user01', name: '李四', role: '课程内容协作人', status: '已提交', lastUpdate: '2024-05-10', content: '新员工手册编写完成，包含公司文化、规章制度、福利介绍等。' },
    { id: 'user02', name: '王五', role: '讲师资源协作人', status: '进行中', lastUpdate: '2024-05-12', content: '' },
  ],
  approvalHistory: [
    { timestamp: '2024-02-20 10:00', title: '创建计划', content: '由 张三 创建', type: 'primary' },
    { timestamp: '2024-02-25 14:30', title: '提交审批', content: '由 张三 提交', type: 'primary' },
    { timestamp: '2024-02-26 09:00', title: '部门负责人审批通过', content: '审批人：王经理', type: 'success' },
  ],
});

const activeTab = ref('collaboration');

// 内容标签
const activeContentTab = ref('summary');

// ===== 协作人邀请逻辑 =====
const employeeDialogVisible = ref(false);
const employeeSearch = ref('');

interface Employee {
  id: string;
  name: string;
  dept: string;
}

const allEmployees: Employee[] = [
  { id: 'user03', name: '赵六', dept: '人力资源' },
  { id: 'user04', name: '钱七', dept: '运营管理' },
  { id: 'user05', name: '周八', dept: '技术中心' },
  { id: 'user06', name: '吴九', dept: '市场部' },
];

const selectedEmployeeIds = ref<string[]>([]);

const goBack = () => {
  router.back();
};

const inviteCollaborator = () => {
  employeeDialogVisible.value = true;
};

const submitForApproval = () => {
  ElMessage.success('计划已成功提交审批！');
  plan.status = 'reviewing'; // Mock status change
};

const createProjectFromPlan = () => {
  ElMessage.info(`正在基于计划 ${plan.id} 创建项目...`);
};

const filteredEmployees = computed(() => {
  if (!employeeSearch.value) return allEmployees;
  return allEmployees.filter(e =>
    e.name.includes(employeeSearch.value) || e.dept.includes(employeeSearch.value)
  );
});

const confirmAddCollaborators = () => {
  selectedEmployeeIds.value.forEach(id => {
    const emp = allEmployees.find(e => e.id === id);
    if (emp && !plan.collaborators.some(c => c.id === id)) {
      plan.collaborators.push({
        id: emp.id,
        name: emp.name,
        role: '协作人',
        status: '未开始',
        lastUpdate: '-',
        content: '',
      } as any);
    }
  });
  ElMessage.success('已添加协作人');
  employeeDialogVisible.value = false;
  selectedEmployeeIds.value = [];
};

const handleEmployeeSelection = (selection: Employee[]) => {
  selectedEmployeeIds.value = selection.map(s => s.id);
};

// This part should be extracted to a shared util file if it grows
// For now, it's duplicated from the list page for simplicity
// const statusText = ...
// const statusTagType = ...

</script>

<style scoped>
.plan-detail-page {
  padding: 20px;
}
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.header-left {
  display: flex;
  align-items: center;
  gap: 8px; /* For spacing between button, title, and tag */
}
.ml-2 {
  margin-left: 8px;
}
.mt-2 {
  margin-top: 8px;
}
.mt-4 {
  margin-top: 16px;
}
.section-title {
  font-size: 16px;
  margin-bottom: 12px;
}
.tab-content {
  padding: 8px;
}
.editor-placeholder {
  border: 1px dashed #dcdfe6;
  border-radius: 4px;
  padding: 20px;
  color: #909399;
  text-align: center;
  min-height: 200px;
  display: flex;
  align-items: center;
  justify-content: center;
}
.mb-2 {
  margin-bottom: 8px;
}
</style> 