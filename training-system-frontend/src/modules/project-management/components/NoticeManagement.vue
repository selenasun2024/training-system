<template>
  <div class="notice-management-container">
    <el-card class="box-card">
      <template #header>
        <div class="card-header">
          <span>创建与发送通知</span>
        </div>
      </template>
      <el-form :model="noticeForm" label-width="100px">
        <el-form-item label="通知模板">
          <el-select v-model="noticeForm.templateId" placeholder="可选择一个消息模板" clearable style="width: 100%;">
            <el-option label="通用开班通知" value="tpl-001" />
            <el-option label="会前提醒（含议程）" value="tpl-002" />
            <el-option label="结业通知" value="tpl-003" />
          </el-select>
        </el-form-item>
        <el-form-item label="通知标题">
          <el-input v-model="noticeForm.title" placeholder="请输入通知标题" />
        </el-form-item>
        <el-form-item label="通知内容">
          <el-input
            v-model="noticeForm.content"
            type="textarea"
            :rows="5"
            placeholder="请输入通知内容，可使用占位符，如{{学员姓名}}、{{项目名称}}等。"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="sendNotice">立即发送</el-button>
          <el-button @click="saveDraft">存为草稿</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card class="box-card" style="margin-top: 20px;">
      <template #header>
        <div class="card-header">
          <span>通知历史与回执状态</span>
        </div>
      </template>
      <el-table :data="noticeHistory" style="width: 100%">
        <el-table-column prop="sendTime" label="发送时间" width="180" />
        <el-table-column prop="title" label="通知标题" />
        <el-table-column prop="sender" label="发送人" width="120" />
        <el-table-column label="送达回执状态" width="250">
          <template #default="{ row }">
            <el-progress :percentage="row.receipt.percentage" :text-inside="true" :stroke-width="20" :color="row.receipt.color">
              <span>{{ row.receipt.text }}</span>
            </el-progress>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200">
          <template #default>
            <el-button type="text" size="small">查看详情</el-button>
            <el-button type="text" size="small">再次发送</el-button>
            <el-button type="text" size="small">导出回执</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue';
import { ElMessage } from 'element-plus';

const noticeForm = reactive({
  templateId: '',
  title: '',
  content: '',
});

const noticeHistory = ref([
  {
    sendTime: '2024-06-15 10:30:00',
    title: '关于"干部入模子培训 - 第1期"的开班通知',
    sender: '张三',
    receipt: {
      total: 52,
      sent: 50,
      read: 45,
      confirmed: 40,
      rejected: 2,
      get percentage() {
        return this.total > 0 ? Math.round(((this.confirmed + this.rejected) / this.total) * 100) : 0;
      },
      get text() {
        return `确认/总数: ${this.confirmed + this.rejected}/${this.total}`;
      },
      get color() {
        if (this.percentage < 50) return '#f56c6c';
        if (this.percentage < 100) return '#e6a23c';
        return '#67c23a';
      }
    },
  },
  {
    sendTime: '2024-06-10 09:00:00',
    title: '【草稿】培训项目启动会通知',
    sender: '李四',
    receipt: {
      total: 52,
      sent: 0,
      read: 0,
      confirmed: 0,
      rejected: 0,
      get percentage() { return 0; },
      get text() { return `草稿`; },
      get color() { return '#909399'; }
    },
  },
]);

const sendNotice = () => {
  ElMessage.success('通知发送成功！');
};

const saveDraft = () => {
  ElMessage.info('通知已保存为草稿');
};
</script>

<style scoped>
.notice-management-container {
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
</style> 