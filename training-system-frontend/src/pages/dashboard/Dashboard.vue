<template>
  <div class="dashboard-page">
    <!-- 顶部统计卡片 -->
    <el-row :gutter="20" class="statistic-row">
      <el-col :span="6" v-for="item in statistics" :key="item.label">
        <StatisticCard 
          :icon="item.icon" 
          :icon-bg-color="item.color" 
          :label="item.label" 
          :value="item.value" 
        />
      </el-col>
    </el-row>

    <!-- 快捷入口 -->
    <el-card class="box-card" shadow="never">
       <template #header>
        <div class="card-header">
          <span>快捷入口</span>
        </div>
      </template>
      <el-row :gutter="20">
        <el-col :span="4" v-for="link in quickLinks" :key="link.label">
          <QuickLink 
            :icon="link.icon"
            :icon-color="link.color"
            :label="link.label"
            :to="link.to"
          />
        </el-col>
      </el-row>
    </el-card>

    <!-- 图表区域 -->
    <el-card class="box-card" shadow="never" style="margin-top: 20px;">
       <template #header>
        <div class="card-header">
          <span>项目状态分布</span>
        </div>
      </template>
      <MyProjectReminderList />
    </el-card>

    <!-- 培训日程 -->
    <el-card class="box-card" shadow="never" style="margin-top: 20px;">
      <template #header>
        <div class="card-header">
          <span>培训日程</span>
        </div>
      </template>
      <TrainingSchedule :events="scheduleEvents" />
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { shallowRef, ref, onMounted } from 'vue';
import {
  Folder,
  User,
  Clock,
  CircleCheck,
  Plus,
  List,
  Setting
} from '@element-plus/icons-vue';
import StatisticCard from '@/components/business/StatisticCard.vue';
import QuickLink from '@/components/business/QuickLink.vue';
import TrainingSchedule from '@/components/business/TrainingSchedule.vue';
import MyProjectReminderList from '@/components/business/MyProjectReminderList.vue';
import dayjs from 'dayjs';
import { useDictStore } from '@/stores/dict';

// 顶部统计数据
const statistics = shallowRef([
  { icon: Folder, label: '进行中的项目', value: 12, color: '#409eff' },
  { icon: User, label: '本月新增学员', value: 85, color: '#67c23a' },
  { icon: Clock, label: '待处理任务', value: 8, color: '#e6a23c' },
  { icon: CircleCheck, label: '本周完成课程', value: 126, color: '#f56c6c' },
]);

// 快捷入口数据
const quickLinks = shallowRef([
  { icon: Plus, label: '新建项目', to: '/training-management/project-management/detail/new', color: '#409eff'},
  { icon: List, label: '项目列表', to: '/training-management/project-management/list', color: '#67c23a'},
  { icon: User, label: '个人成长档案', to: '/training-management/growth-profile', color: '#e6a23c'},
  { icon: Setting, label: '系统配置', to: '/training-management/system-configuration', color: '#f56c6c'},
]);

// 培训日程事件数据（根据项目类型动态 mock）
const scheduleEvents = ref([] as any[]);

const dictStore = useDictStore();

function generateMockSchedule() {
  const today = dayjs();
  const colors = ['#409eff', '#67c23a', '#e6a23c', '#f56c6c', '#909399'];
  scheduleEvents.value = dictStore.projectTypes.flatMap((t, idx) => {
    const base = today.add(idx, 'day');
    return [
      {
        title: `${t.name} - 启动会`,
        start: base.format('YYYY-MM-DD'),
        color: colors[idx % colors.length],
        typeCode: t.code,
        typeName: t.name,
      },
      {
        title: `${t.name} - 结业典礼`,
        start: base.add(15, 'day').format('YYYY-MM-DD'),
        color: colors[idx % colors.length],
        typeCode: t.code,
        typeName: t.name,
      }
    ];
  });
}

onMounted(async () => {
  await dictStore.loadProjectTypes();
  generateMockSchedule();
});
</script>

<style scoped>
.dashboard-page {
  padding: 0; /* 移除外边距，让卡片自己控制 */
}
.statistic-row {
  margin-bottom: 20px;
}
.box-card {
  border: none;
}
.card-header {
  font-weight: bold;
}
.chart-placeholder {
  height: 300px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #909399;
  background-color: #f9f9f9;
  border-radius: 4px;
}
</style> 