<template>
  <div class="group-chat-container">
    <el-card class="box-card">
      <template #header>
        <div class="card-header">
          <span>核心操作</span>
        </div>
      </template>
      <div class="action-zone">
        <el-button type="primary" size="large" @click="createAllGroups" :loading="isCreatingAll">
          <el-icon><Promotion /></el-icon>
          一键创建所有群聊
        </el-button>
        <el-button size="large" @click="syncAllMembers" :loading="isSyncingAll">
          <el-icon><Refresh /></el-icon>
          同步所有成员变更
        </el-button>
        <div class="status-overview">
          <p>共需创建 <strong>{{ totalGroups }}</strong> 个群聊 (1个大群, {{ totalGroups - 1 }}个小组群)。当前已创建 <strong>{{ createdGroups }}</strong> 个。</p>
        </div>
      </div>
    </el-card>

    <el-card class="box-card">
      <template #header>
        <div class="card-header">
          <span>群组列表与状态</span>
        </div>
      </template>
      <el-table :data="groupList" style="width: 100%">
        <el-table-column prop="name" label="群组名称" width="250" />
        <el-table-column prop="type" label="群组类型" width="120" />
        <el-table-column prop="memberCount" label="成员数量" width="100" />
        <el-table-column label="群状态" width="150">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)">{{ getStatusText(row.status) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="owner" label="群主" width="120" />
        <el-table-column prop="createTime" label="创建时间" width="180" />
        <el-table-column label="操作" fixed="right" width="220">
          <template #default="{ row }">
            <el-button v-if="row.status === 'not_created'" type="text" size="small" @click="createGroup(row)">创建</el-button>
            <el-button v-if="row.status === 'created' || row.status === 'error'" type="text" size="small" @click="showGroupDetail(row)">查看详情</el-button>
            <el-button v-if="row.status === 'created'" type="text" size="small" @click="syncMembers(row)">同步成员</el-button>
            <el-button v-if="row.status === 'created'" type="text" size="small" style="color: #F56C6C;" @click="dissolveGroup(row)">解散</el-button>
            <el-button v-if="row.status === 'error'" type="text" size="small" @click="retryCreate(row)">重试</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-dialog v-model="groupDetailDialogVisible" :title="currentGroup.name" width="500px">
      <div class="group-detail-content">
        <h4>群二维码</h4>
        <div class="qrcode-wrapper">
          <img :src="currentGroup.qrCode" alt="群二维码" />
        </div>
        <h4>群成员 ({{ currentGroup.members.length }})</h4>
        <el-tag v-for="member in currentGroup.members" :key="member.id" style="margin: 4px;">{{ member.name }}</el-tag>
      </div>
      <template #footer>
        <el-button @click="groupDetailDialogVisible = false">关闭</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { Promotion, Refresh } from '@element-plus/icons-vue';
import qrCodeMock from '@/assets/images/qr-code-mock.png'; 

const isCreatingAll = ref(false);
const isSyncingAll = ref(false);
const groupDetailDialogVisible = ref(false);

const groupList = ref([
  { id: 'main-group', name: '干部入模子培训-第1期（项目大群）', type: '项目大群', memberCount: 52, status: 'not_created', owner: '-', createTime: '-', qrCode: qrCodeMock, members: [] },
  { id: 'group-1', name: '第一小组', type: '学员小组', memberCount: 8, status: 'not_created', owner: '-', createTime: '-', qrCode: qrCodeMock, members: [] },
  { id: 'group-2', name: '第二小组', type: '学员小组', memberCount: 9, status: 'created', owner: '张三', createTime: '2024-06-16 11:05:00', qrCode: qrCodeMock, members: [{id: 1, name: '李四'}, {id: 2, name: '王五'}] },
  { id: 'group-3', name: '第三小组', type: '学员小组', memberCount: 8, status: 'error', owner: '-', createTime: '-', qrCode: qrCodeMock, members: [] },
  { id: 'group-4', name: '第四小组', type: '学员小组', memberCount: 9, status: 'not_created', owner: '-', createTime: '-', qrCode: qrCodeMock, members: [] },
  { id: 'group-5', name: '第五小组', type: '学员小组', memberCount: 9, status: 'not_created', owner: '-', createTime: '-', qrCode: qrCodeMock, members: [] },
  { id: 'group-6', name: '第六小组', type: '学员小组', memberCount: 9, status: 'not_created', owner: '-', createTime: '-', qrCode: qrCodeMock, members: [] },
]);

const currentGroup = ref({});

const totalGroups = computed(() => groupList.value.length);
const createdGroups = computed(() => groupList.value.filter(g => g.status === 'created').length);

const getStatusType = (status) => {
  if (status === 'created') return 'success';
  if (status === 'not_created') return 'info';
  if (status === 'error') return 'danger';
  return '';
};

const getStatusText = (status) => {
  const statusMap = {
    not_created: '未创建',
    creating: '创建中...',
    created: '已创建',
    error: '创建失败',
  };
  return statusMap[status] || '未知';
};

const createAllGroups = () => {
  isCreatingAll.value = true;
  ElMessage.info('开始批量创建群聊...');
  setTimeout(() => {
    groupList.value.forEach(group => {
      if (group.status === 'not_created') {
        group.status = 'created';
        group.owner = '系统自动';
        group.createTime = new Date().toLocaleString();
      }
    });
    isCreatingAll.value = false;
    ElMessage.success('所有群聊已创建完毕！');
  }, 2000);
};

const syncAllMembers = () => {
  isSyncingAll.value = true;
  ElMessage.info('正在同步所有群聊成员...');
  setTimeout(() => {
    isSyncingAll.value = false;
    ElMessage.success('成员同步完成！');
  }, 1500);
};

const createGroup = (row) => {
  row.status = 'creating';
  setTimeout(() => {
    row.status = 'created';
    row.owner = '系统自动';
    row.createTime = new Date().toLocaleString();
    ElMessage.success(`群聊"${row.name}"创建成功！`);
  }, 1000);
};

const showGroupDetail = (row) => {
  currentGroup.value = row;
  groupDetailDialogVisible.value = true;
};

const syncMembers = (row) => {
  ElMessage.info(`正在同步"${row.name}"的成员...`);
  setTimeout(() => {
    ElMessage.success(`"${row.name}"成员同步完成！`);
  }, 1000);
};

const dissolveGroup = (row) => {
  ElMessageBox.confirm(`确定要解散群聊"${row.name}"吗？此操作不可逆。`, '警告', {
    confirmButtonText: '确定解散',
    cancelButtonText: '取消',
    type: 'warning',
  }).then(() => {
    row.status = 'not_created';
    row.owner = '-';
    row.createTime = '-';
    ElMessage.success(`群聊"${row.name}"已解散。`);
  });
};

const retryCreate = (row) => {
  createGroup(row);
};

</script>

<style scoped>
.group-chat-container {
  padding: 20px;
}
.box-card {
  margin-bottom: 20px;
}
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.action-zone {
  display: flex;
  align-items: center;
  gap: 16px;
}
.status-overview {
  margin-left: auto;
  color: #606266;
}
.group-detail-content {
  text-align: center;
}
.qrcode-wrapper {
  margin-bottom: 20px;
}
.qrcode-wrapper img {
  width: 150px;
  height: 150px;
  border: 1px solid #dcdfe6;
}
</style> 