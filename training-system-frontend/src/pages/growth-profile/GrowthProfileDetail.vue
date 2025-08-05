<template>
  <div class="growth-profile-detail-page">
    <!-- Header -->
    <el-card shadow="never" class="profile-header">
      <div class="header-content">
        <el-avatar :size="80" :src="profile.avatar" />
        <div class="info">
          <h1>{{ profile.name }}</h1>
          <p>{{ profile.department }} / {{ profile.position }}</p>
          <div>
            <el-tag v-for="tag in profile.keyIdentities" :key="tag" :type="tagColors[tag]" class="identity-tag">{{ tag }}</el-tag>
          </div>
        </div>
        <div class="actions">
          <el-button :icon="Download">导出PDF</el-button>
          <el-button type="primary" :icon="ChatDotRound">发起发展沟通</el-button>
        </div>
      </div>
    </el-card>

    <!-- Tabs -->
    <el-tabs v-model="activeTab" class="profile-tabs">
      <el-tab-pane label="成长概览" name="overview">
        <div v-if="activeTab === 'overview'" class="tab-content">
          <el-row :gutter="20">
            <el-col :span="12">
              <el-card shadow="never">
                <template #header>能力雷达图</template>
                <div>这里将放置 ECharts 雷达图。</div>
              </el-card>
            </el-col>
            <el-col :span="12">
              <el-card shadow="never">
                <template #header>成就陈列室</template>
                <div>
                  <el-tag type="success" class="achievement-tag">子衿培训结业证书</el-tag>
                  <el-tag type="warning" class="achievement-tag">金牌带教老师</el-tag>
                  <el-tag type="danger" class="achievement-tag">年度优秀员工</el-tag>
                </div>
              </el-card>
            </el-col>
          </el-row>
          <el-card shadow="never" style="margin-top: 20px;">
            <template #header>成长时间轴</template>
            <el-timeline>
              <el-timeline-item timestamp="2024/01/15" placement="top">
                <h4>进入 '研发总监' 继任者计划</h4>
                <p>被选为关键岗位后备人才</p>
              </el-timeline-item>
              <el-timeline-item timestamp="2023/07/01" placement="top">
                <h4>晋升高级工程师</h4>
              </el-timeline-item>
               <el-timeline-item timestamp="2022/11/20" placement="top">
                <h4>评为 '金牌带教老师'</h4>
                <p>成功带教3名新员工</p>
              </el-timeline-item>
            </el-timeline>
          </el-card>
        </div>
      </el-tab-pane>

      <el-tab-pane label="详细履历" name="history">
        <div v-if="activeTab === 'history'" class="tab-content">
          <!-- 培训项目经历 -->
          <el-card shadow="never" class="mb-2">
            <template #header>培训项目经历</template>
            <el-table :data="trainingHistory" size="small">
              <el-table-column prop="project" label="项目" />
              <el-table-column prop="role" label="角色" width="120" />
              <el-table-column prop="start" label="开始" width="100" />
              <el-table-column prop="end" label="结束" width="100" />
              <el-table-column prop="result" label="结果/成绩" />
            </el-table>
          </el-card>

          <!-- 观察记录 -->
          <el-card shadow="never" class="mb-2">
            <template #header>观察记录</template>
            <el-timeline>
              <el-timeline-item v-for="(obs, idx) in observations" :key="idx" :timestamp="obs.date" placement="top">
                <p>{{ obs.content }}</p>
              </el-timeline-item>
            </el-timeline>
          </el-card>

          <!-- 申请记录 -->
          <el-card shadow="never" class="mb-2">
            <template #header>申请记录</template>
            <el-table :data="applications" size="small">
              <el-table-column prop="type" label="申请类型" width="120" />
              <el-table-column prop="target" label="目标/岗位" />
              <el-table-column prop="date" label="日期" width="100" />
              <el-table-column prop="status" label="状态" width="100" />
            </el-table>
          </el-card>
        </div>
      </el-tab-pane>

      <el-tab-pane label="综合评估" name="assessment">
        <div v-if="activeTab === 'assessment'" class="tab-content">
          <!-- 九宫格历史轨迹 -->
          <el-card shadow="never" class="mb-2">
            <template #header>九宫格历史轨迹</template>
            <el-table :data="nineBoxHistory" size="small">
              <el-table-column prop="year" label="年度" width="80" />
              <el-table-column prop="position" label="方格位置" />
              <el-table-column prop="comment" label="评语" />
            </el-table>
          </el-card>

          <!-- 360 反馈概览 -->
          <el-card shadow="never" class="mb-2">
            <template #header>360° 反馈概览</template>
            <el-row :gutter="20">
              <el-col :span="12">
                <el-table :data="feedbackSummary" size="small">
                  <el-table-column prop="dimension" label="维度" />
                  <el-table-column prop="score" label="平均分" width="100" />
                </el-table>
              </el-col>
              <el-col :span="12">
                <div style="text-align:center; padding-top:20px; color:#909399">雷达图占位</div>
              </el-col>
            </el-row>
          </el-card>
        </div>
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue';
import { useRoute } from 'vue-router';
import { Download, ChatDotRound } from '@element-plus/icons-vue';

const route = useRoute();
const userId = route.params.id;

// Mock Data
const profile = reactive({
  id: userId,
  name: '张三',
  avatar: 'https://cube.elemecdn.com/0/88/03b0d39583f48206768a7534e55bcpng.png',
  department: '研发部',
  position: '高级软件工程师',
  keyIdentities: ['羽林卫', '继任者'],
  abilities: ['Java', '架构', '沟通', '项目管理', '团队协作'],
});

const tagColors = {
  '羽林卫': 'warning',
  '锦衣卫': 'danger',
  'CEO计划': 'success',
  '继任者': 'info',
  '金牌带教老师': 'success',
};

const activeTab = ref('overview');

// Mock detailed history data
const trainingHistory = ref([
  { project: '子衿培训', role: '组长', start: '2023-03', end: '2023-05', result: '结业证书 优' },
  { project: '干部入模子培训', role: '纪律委员', start: '2024-02', end: '2024-04', result: '优秀' },
]);

const observations = ref([
  { date: '2024/04/15', content: '在小组讨论中展现出优秀的领导力' },
  { date: '2023/08/01', content: '对新员工进行一对一指导，反馈良好' },
]);

const applications = ref([
  { type: '三卫申请', target: '羽林卫', date: '2023/06/10', status: '通过' },
  { type: '内部竞聘', target: '项目经理', date: '2022/12/05', status: '未通过' },
]);

// Comprehensive assessment mock data
const nineBoxHistory = ref([
  { year: '2024', position: '高潜力 / 高绩效', comment: '保持卓越表现' },
  { year: '2023', position: '高潜力 / 中绩效', comment: '需继续提升业务成果' },
  { year: '2022', position: '中潜力 / 中绩效', comment: '稳步发展' },
]);

const feedbackSummary = ref([
  { dimension: '领导力', score: 4.6 },
  { dimension: '协作', score: 4.4 },
  { dimension: '创新', score: 4.2 },
  { dimension: '执行力', score: 4.5 },
]);
</script>

<style scoped>
.growth-profile-detail-page {
  padding: 20px;
}
.profile-header {
  margin-bottom: 20px;
}
.header-content {
  display: flex;
  align-items: center;
}
.header-content .info {
  margin-left: 20px;
  flex-grow: 1;
}
.header-content .info h1 {
  margin: 0;
  font-size: 24px;
}
.header-content .info p {
  margin: 5px 0;
  color: #606266;
}
.identity-tag {
  margin-right: 5px;
}
.profile-tabs {
  background: #fff;
  padding: 0 20px;
}
.tab-content {
  padding: 20px 0;
}
.achievement-tag {
    margin: 5px;
}
</style> 