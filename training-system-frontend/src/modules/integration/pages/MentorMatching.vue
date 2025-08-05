<template>
  <div class="mentor-matching">
    <div class="page-header">
      <h2>导师匹配管理</h2>
      <p>智能导师匹配算法和匹配结果管理</p>
    </div>

    <!-- 操作栏 -->
    <div class="action-bar">
      <el-button type="primary" @click="showMatchingDialog = true">
        <el-icon><Search /></el-icon>
        新建匹配
      </el-button>
      <el-button @click="batchMatch">
        <el-icon><Operation /></el-icon>
        批量匹配
      </el-button>
      <el-button @click="exportResults">
        <el-icon><Download /></el-icon>
        导出结果
      </el-button>
    </div>

    <!-- 匹配结果列表 -->
    <el-table :data="matchingResults" border stripe v-loading="loading">
      <el-table-column prop="studentName" label="学员姓名" width="120" />
      <el-table-column prop="studentDepartment" label="学员部门" width="120" />
      <el-table-column prop="requiredSkills" label="需求技能" min-width="200">
        <template #default="{ row }">
          <el-tag
            v-for="skill in row.requiredSkills"
            :key="skill"
            size="small"
            class="skill-tag"
          >
            {{ skill }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="mentorName" label="匹配导师" width="120">
        <template #default="{ row }">
          <div v-if="row.mentor">
            <div>{{ row.mentor.name }}</div>
            <div class="mentor-info">{{ row.mentor.department }} | {{ row.mentor.position }}</div>
          </div>
          <span v-else class="no-match">未匹配</span>
        </template>
      </el-table-column>
      <el-table-column prop="matchScore" label="匹配度" width="150">
        <template #default="{ row }">
          <div v-if="row.score > 0" class="match-score">
            <el-progress
              :percentage="Math.round(row.score * 100)"
              :color="getMatchScoreColor(row.score)"
              :stroke-width="8"
            />
            <span class="score-text">{{ (row.score * 100).toFixed(1) }}%</span>
          </div>
          <span v-else class="no-score">-</span>
        </template>
      </el-table-column>
      <el-table-column prop="status" label="状态" width="100">
        <template #default="{ row }">
          <el-tag :type="getStatusType(row.status)">
            {{ getStatusLabel(row.status) }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="createdAt" label="匹配时间" width="180">
        <template #default="{ row }">
          {{ formatDate(row.createdAt || new Date()) }}
        </template>
      </el-table-column>
      <el-table-column label="操作" width="250" fixed="right">
        <template #default="{ row }">
          <el-button size="small" @click="viewMatchDetails(row)">详情</el-button>
          <el-button 
            v-if="row.status === 'pending'"
            size="small" 
            type="success" 
            @click="approveMatch(row)"
          >
            批准
          </el-button>
          <el-button 
            v-if="row.status === 'pending'"
            size="small" 
            type="warning" 
            @click="rejectMatch(row)"
          >
            拒绝
          </el-button>
          <el-button 
            v-if="row.status === 'rejected'"
            size="small" 
            @click="rematch(row)"
          >
            重新匹配
          </el-button>
        </template>
      </el-table-column>
    </el-table>

    <!-- 新建匹配对话框 -->
    <el-dialog
      v-model="showMatchingDialog"
      title="新建导师匹配"
      width="700px"
    >
      <el-form :model="matchingForm" :rules="matchingFormRules" ref="matchingFormRef" label-width="120px">
        <el-form-item label="学员" prop="studentId">
          <el-select v-model="matchingForm.studentId" placeholder="选择学员" filterable>
            <el-option
              v-for="student in students"
              :key="student.id"
              :label="`${student.name} (${student.department})`"
              :value="student.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="需求技能" prop="requiredSkills">
          <el-select
            v-model="matchingForm.requiredSkills"
            multiple
            filterable
            allow-create
            placeholder="选择或输入需求技能"
          >
            <el-option
              v-for="skill in availableSkills"
              :key="skill"
              :label="skill"
              :value="skill"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="匹配标准" prop="criteria">
          <el-checkbox-group v-model="matchingForm.criteria">
            <el-checkbox value="skills">技能匹配</el-checkbox>
            <el-checkbox value="department">部门匹配</el-checkbox>
            <el-checkbox value="workload">工作负载</el-checkbox>
            <el-checkbox value="rating">导师评分</el-checkbox>
            <el-checkbox value="experience">经验水平</el-checkbox>
            <el-checkbox value="style">指导风格</el-checkbox>
          </el-checkbox-group>
        </el-form-item>
        <el-form-item label="最低评分" prop="minRating">
          <el-slider v-model="matchingForm.minRating" :min="1" :max="5" :step="0.1" show-input />
        </el-form-item>
        <el-form-item label="优先级" prop="priority">
          <el-radio-group v-model="matchingForm.priority">
            <el-radio value="low">低</el-radio>
            <el-radio value="medium">中</el-radio>
            <el-radio value="high">高</el-radio>
            <el-radio value="urgent">紧急</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showMatchingDialog = false">取消</el-button>
        <el-button type="primary" @click="startMatching">开始匹配</el-button>
      </template>
    </el-dialog>

    <!-- 匹配详情对话框 -->
    <el-dialog
      v-model="showDetailsDialog"
      title="匹配详情"
      width="900px"
    >
      <div v-if="selectedMatch" class="match-details">
        <!-- 基本信息 -->
        <el-row :gutter="20">
          <el-col :span="12">
            <el-card>
              <template #header>
                <h4>学员信息</h4>
              </template>
              <el-descriptions :column="1">
                <el-descriptions-item label="姓名">{{ selectedMatch.studentName }}</el-descriptions-item>
                <el-descriptions-item label="部门">{{ selectedMatch.studentDepartment }}</el-descriptions-item>
                <el-descriptions-item label="需求技能">
                  <el-tag
                    v-for="skill in selectedMatch.requiredSkills"
                    :key="skill"
                    size="small"
                    class="skill-tag"
                  >
                    {{ skill }}
                  </el-tag>
                </el-descriptions-item>
              </el-descriptions>
            </el-card>
          </el-col>
          <el-col :span="12">
            <el-card>
              <template #header>
                <h4>导师信息</h4>
              </template>
              <div v-if="selectedMatch.mentor">
                <el-descriptions :column="1">
                  <el-descriptions-item label="姓名">{{ selectedMatch.mentor.name }}</el-descriptions-item>
                  <el-descriptions-item label="部门">{{ selectedMatch.mentor.department }}</el-descriptions-item>
                  <el-descriptions-item label="职位">{{ selectedMatch.mentor.position }}</el-descriptions-item>
                  <el-descriptions-item label="专业技能">
                    <el-tag
                      v-for="skill in selectedMatch.mentor.expertise"
                      :key="skill"
                      size="small"
                      type="success"
                      class="skill-tag"
                    >
                      {{ skill }}
                    </el-tag>
                  </el-descriptions-item>
                  <el-descriptions-item label="当前负载">
                    {{ selectedMatch.mentor.currentLoad }}/{{ selectedMatch.mentor.maxLoad }}
                  </el-descriptions-item>
                  <el-descriptions-item label="评分">
                    <el-rate 
                      v-model="selectedMatch.mentor.rating" 
                      disabled 
                      show-score 
                      text-color="#ff9900"
                    />
                  </el-descriptions-item>
                </el-descriptions>
              </div>
              <div v-else class="no-match-info">
                <el-empty description="未找到合适的导师" />
              </div>
            </el-card>
          </el-col>
        </el-row>

        <!-- 匹配分析 -->
        <el-card v-if="selectedMatch.breakdown" class="match-analysis">
          <template #header>
            <h4>匹配分析</h4>
          </template>
          <el-row :gutter="20">
            <el-col :span="12">
              <div class="score-breakdown">
                <div class="score-item">
                  <span class="score-label">技能匹配</span>
                  <el-progress 
                    :percentage="Math.round(selectedMatch.breakdown.skillsMatch * 100)"
                    color="#409EFF"
                  />
                </div>
                <div class="score-item">
                  <span class="score-label">部门匹配</span>
                  <el-progress 
                    :percentage="Math.round(selectedMatch.breakdown.departmentMatch * 100)"
                    color="#67C23A"
                  />
                </div>
                <div class="score-item">
                  <span class="score-label">工作负载</span>
                  <el-progress 
                    :percentage="Math.round(selectedMatch.breakdown.workloadScore * 100)"
                    color="#E6A23C"
                  />
                </div>
                <div class="score-item">
                  <span class="score-label">导师评分</span>
                  <el-progress 
                    :percentage="Math.round(selectedMatch.breakdown.ratingScore * 100)"
                    color="#F56C6C"
                  />
                </div>
                <div class="score-item">
                  <span class="score-label">经验评分</span>
                  <el-progress 
                    :percentage="Math.round(selectedMatch.breakdown.experienceScore * 100)"
                    color="#909399"
                  />
                </div>
                <div class="score-item">
                  <span class="score-label">风格匹配</span>
                  <el-progress 
                    :percentage="Math.round(selectedMatch.breakdown.styleMatch * 100)"
                    color="#9C27B0"
                  />
                </div>
              </div>
            </el-col>
            <el-col :span="12">
              <div class="overall-score">
                <h3>综合匹配度</h3>
                <div class="score-circle">
                  <el-progress
                    type="circle"
                    :percentage="Math.round(selectedMatch.breakdown.overallFit * 100)"
                    :width="120"
                    :stroke-width="8"
                    :color="getMatchScoreColor(selectedMatch.breakdown.overallFit)"
                  />
                </div>
              </div>
            </el-col>
          </el-row>
        </el-card>

        <!-- 匹配原因和警告 -->
        <el-row :gutter="20">
          <el-col :span="12">
            <el-card v-if="selectedMatch.reasons && selectedMatch.reasons.length > 0">
              <template #header>
                <h4>匹配原因</h4>
              </template>
              <div class="reason-list">
                <div v-for="reason in selectedMatch.reasons" :key="reason" class="reason-item">
                  <el-icon color="#67C23A"><Check /></el-icon>
                  <span>{{ reason }}</span>
                </div>
              </div>
            </el-card>
          </el-col>
          <el-col :span="12">
            <el-card v-if="selectedMatch.warnings && selectedMatch.warnings.length > 0">
              <template #header>
                <h4>注意事项</h4>
              </template>
              <div class="warning-list">
                <div v-for="warning in selectedMatch.warnings" :key="warning" class="warning-item">
                  <el-icon color="#E6A23C"><Warning /></el-icon>
                  <span>{{ warning }}</span>
                </div>
              </div>
            </el-card>
          </el-col>
        </el-row>
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, reactive } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { Search, Operation, Download, Check, Warning } from '@element-plus/icons-vue';
import { mentorMatchingService } from '../services/MentorMatchingService';
import type { MatchingResult, MatchingCriteria } from '@/types';

// 响应式数据
const matchingResults = ref<any[]>([]);
const loading = ref(false);
const showMatchingDialog = ref(false);
const showDetailsDialog = ref(false);
const selectedMatch = ref<any>(null);
const matchingFormRef = ref();

const students = ref([
  { id: 'student-1', name: '张三', department: '技术部' },
  { id: 'student-2', name: '李四', department: '产品部' },
  { id: 'student-3', name: '王五', department: '技术部' }
]);

const availableSkills = ref([
  'JavaScript', 'TypeScript', 'Vue.js', 'React', 'Node.js', 'Python', 'Java',
  'Database', 'Leadership', 'Communication', 'ProjectManagement'
]);

const matchingForm = reactive({
  studentId: '',
  requiredSkills: [],
  criteria: ['skills', 'department', 'workload', 'rating'],
  minRating: 4.0,
  priority: 'medium'
});

const matchingFormRules = {
  studentId: [
    { required: true, message: '请选择学员', trigger: 'change' }
  ],
  requiredSkills: [
    { required: true, message: '请选择需求技能', trigger: 'change' }
  ],
  criteria: [
    { required: true, message: '请选择匹配标准', trigger: 'change' }
  ]
};

// 生命周期
onMounted(() => {
  loadMatchingResults();
});

// 方法
const loadMatchingResults = async () => {
  loading.value = true;
  try {
    // 模拟匹配结果数据
    matchingResults.value = [
      {
        id: 'match-1',
        studentName: '张三',
        studentDepartment: '技术部',
        requiredSkills: ['JavaScript', 'Vue.js'],
        mentor: {
          id: 'mentor-1',
          name: '李高级',
          department: '技术部',
          position: '高级工程师',
          expertise: ['JavaScript', 'Vue.js', 'Node.js'],
          currentLoad: 2,
          maxLoad: 5,
          rating: 4.8
        },
        score: 0.92,
        status: 'approved',
        breakdown: {
          skillsMatch: 0.95,
          departmentMatch: 1.0,
          workloadScore: 0.8,
          ratingScore: 0.96,
          experienceScore: 0.9,
          styleMatch: 0.8,
          overallFit: 0.92
        },
        reasons: ['技能匹配度高达95%', '同部门协作便利', '导师评分优秀', '工作负载适中'],
        warnings: [],
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2)
      },
      {
        id: 'match-2',
        studentName: '李四',
        studentDepartment: '产品部',
        requiredSkills: ['ProductManagement', 'DataAnalysis'],
        mentor: {
          id: 'mentor-2',
          name: '王产品',
          department: '产品部',
          position: '产品总监',
          expertise: ['ProductManagement', 'UserExperience', 'DataAnalysis'],
          currentLoad: 1,
          maxLoad: 3,
          rating: 4.7
        },
        score: 0.88,
        status: 'pending',
        breakdown: {
          skillsMatch: 0.9,
          departmentMatch: 1.0,
          workloadScore: 1.0,
          ratingScore: 0.94,
          experienceScore: 0.85,
          styleMatch: 0.7,
          overallFit: 0.88
        },
        reasons: ['产品技能完全匹配', '同部门协作', '导师负载较轻'],
        warnings: ['指导风格偏好可能不完全匹配'],
        createdAt: new Date(Date.now() - 1000 * 60 * 30)
      },
      {
        id: 'match-3',
        studentName: '王五',
        studentDepartment: '技术部',
        requiredSkills: ['Python', 'AI', 'MachineLearning'],
        mentor: null,
        score: 0,
        status: 'no_match',
        reasons: [],
        warnings: ['未找到匹配的导师技能'],
        createdAt: new Date(Date.now() - 1000 * 60 * 15)
      }
    ];
  } catch (error) {
    ElMessage.error('加载匹配结果失败');
  } finally {
    loading.value = false;
  }
};

const startMatching = async () => {
  if (!matchingFormRef.value) return;
  
  const valid = await matchingFormRef.value.validate();
  if (!valid) return;

  try {
    const criteria: MatchingCriteria = {
      studentId: matchingForm.studentId,
      requiredSkills: matchingForm.requiredSkills,
      criteria: matchingForm.criteria,
      minRating: matchingForm.minRating,
      priority: matchingForm.priority
    };

    const results = await mentorMatchingService.findBestMatches(criteria);
    
    if (results.length > 0) {
      // 将新的匹配结果添加到列表中
      const student = students.value.find(s => s.id === matchingForm.studentId);
      const newMatch = {
        id: `match-${Date.now()}`,
        studentName: student?.name || '',
        studentDepartment: student?.department || '',
        requiredSkills: matchingForm.requiredSkills,
        mentor: results[0].mentor,
        score: results[0].score,
        status: 'pending',
        breakdown: results[0].breakdown,
        reasons: results[0].reasons,
        warnings: results[0].warnings,
        createdAt: new Date()
      };
      
      matchingResults.value.unshift(newMatch);
      ElMessage.success('匹配完成，找到候选导师');
    } else {
      ElMessage.warning('未找到合适的导师');
    }
    
    showMatchingDialog.value = false;
    resetMatchingForm();
  } catch (error) {
    ElMessage.error('匹配失败');
  }
};

const viewMatchDetails = (match: any) => {
  selectedMatch.value = match;
  showDetailsDialog.value = true;
};

const approveMatch = async (match: any) => {
  try {
    await ElMessageBox.confirm('确定要批准这个匹配吗？', '确认批准', {
      type: 'success'
    });
    
    match.status = 'approved';
    ElMessage.success('匹配已批准');
  } catch {
    // 用户取消
  }
};

const rejectMatch = async (match: any) => {
  try {
    await ElMessageBox.confirm('确定要拒绝这个匹配吗？', '确认拒绝', {
      type: 'warning'
    });
    
    match.status = 'rejected';
    ElMessage.success('匹配已拒绝');
  } catch {
    // 用户取消
  }
};

const rematch = (match: any) => {
  // 重新匹配逻辑
  ElMessage.info('正在重新匹配...');
  setTimeout(() => {
    match.status = 'pending';
    ElMessage.success('重新匹配完成');
  }, 2000);
};

const batchMatch = () => {
  ElMessage.info('批量匹配功能开发中...');
};

const exportResults = () => {
  ElMessage.info('导出功能开发中...');
};

const resetMatchingForm = () => {
  matchingForm.studentId = '';
  matchingForm.requiredSkills = [];
  matchingForm.criteria = ['skills', 'department', 'workload', 'rating'];
  matchingForm.minRating = 4.0;
  matchingForm.priority = 'medium';
};

// 工具方法
const getMatchScoreColor = (score: number) => {
  if (score >= 0.8) return '#67C23A';
  if (score >= 0.6) return '#E6A23C';
  return '#F56C6C';
};

const getStatusType = (status: string) => {
  const types = {
    pending: 'warning',
    approved: 'success',
    rejected: 'danger',
    no_match: 'info'
  };
  return types[status] || 'info';
};

const getStatusLabel = (status: string) => {
  const labels = {
    pending: '待审核',
    approved: '已批准',
    rejected: '已拒绝',
    no_match: '无匹配'
  };
  return labels[status] || status;
};

const formatDate = (date: Date) => {
  return new Intl.DateTimeFormat('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date);
};
</script>

<style scoped>
.mentor-matching {
  padding: 20px;
}

.page-header {
  margin-bottom: 24px;
}

.page-header h2 {
  margin: 0 0 8px 0;
  font-size: 24px;
  color: #303133;
}

.page-header p {
  margin: 0;
  color: #606266;
}

.action-bar {
  margin-bottom: 16px;
  display: flex;
  gap: 12px;
}

.skill-tag {
  margin-right: 4px;
  margin-bottom: 4px;
}

.mentor-info {
  font-size: 12px;
  color: #909399;
}

.no-match {
  color: #909399;
}

.match-score {
  display: flex;
  align-items: center;
  gap: 8px;
}

.score-text {
  font-weight: bold;
  color: #303133;
}

.no-score {
  color: #909399;
}

.match-details {
  max-height: 600px;
  overflow-y: auto;
}

.match-analysis {
  margin: 20px 0;
}

.score-breakdown {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.score-item {
  display: flex;
  align-items: center;
  gap: 12px;
}

.score-label {
  width: 80px;
  font-size: 14px;
  color: #606266;
}

.overall-score {
  text-align: center;
}

.overall-score h3 {
  margin: 0 0 20px 0;
  color: #303133;
}

.score-circle {
  display: flex;
  justify-content: center;
}

.reason-list,
.warning-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.reason-item,
.warning-item {
  display: flex;
  align-items: center;
  gap: 8px;
}

.reason-item span,
.warning-item span {
  font-size: 14px;
  color: #606266;
}

.no-match-info {
  text-align: center;
  padding: 40px 0;
}
</style> 