<template>
  <div class="mentor-matching">
    <div class="matching-header">
      <el-form ref="formRef" :model="formData" :rules="rules" label-width="120px" inline>
        <el-form-item label="学员姓名" prop="studentName">
          <el-input v-model="formData.studentName" placeholder="请输入学员姓名" />
        </el-form-item>
        
        <el-form-item label="所需技能" prop="requiredSkills">
          <el-select 
            v-model="formData.requiredSkills" 
            multiple 
            filterable 
            allow-create 
            placeholder="选择或输入技能"
            style="width: 200px"
          >
            <el-option value="JavaScript" />
            <el-option value="TypeScript" />
            <el-option value="Vue.js" />
            <el-option value="React" />
            <el-option value="Node.js" />
            <el-option value="Python" />
            <el-option value="Java" />
            <el-option value="Leadership" />
            <el-option value="ProjectManagement" />
          </el-select>
        </el-form-item>
        
        <el-form-item label="部门">
          <el-select v-model="formData.department" placeholder="选择部门">
            <el-option label="技术部" value="tech" />
            <el-option label="产品部" value="product" />
            <el-option label="运营部" value="operation" />
            <el-option label="市场部" value="marketing" />
          </el-select>
        </el-form-item>
        
        <el-form-item>
          <el-button type="primary" @click="handleMatch">开始匹配</el-button>
          <el-button @click="resetForm">重置</el-button>
        </el-form-item>
      </el-form>
    </div>
    
    <el-divider />
    
    <div class="matching-results" v-if="matchingResults.length > 0">
      <h4>匹配结果</h4>
      <el-table :data="matchingResults" style="width: 100%" max-height="400">
        <el-table-column prop="mentor.name" label="导师姓名" width="120" />
        <el-table-column prop="mentor.department" label="部门" width="100" />
        <el-table-column prop="mentor.position" label="职位" width="120" />
        <el-table-column label="匹配度" width="120">
          <template #default="{ row }">
            <el-progress 
              :percentage="Math.round(row.score * 100)" 
              :color="getScoreColor(row.score)"
              :stroke-width="8"
            />
          </template>
        </el-table-column>
        <el-table-column label="技能匹配" width="150">
          <template #default="{ row }">
            <el-tag 
              v-for="skill in row.mentor.expertise.slice(0, 3)" 
              :key="skill" 
              size="small" 
              style="margin-right: 4px"
            >
              {{ skill }}
            </el-tag>
            <span v-if="row.mentor.expertise.length > 3">...</span>
          </template>
        </el-table-column>
        <el-table-column prop="mentor.rating" label="评分" width="80">
          <template #default="{ row }">
            <el-rate 
              :value="row.mentor.rating" 
              disabled 
              show-score 
              text-color="#ff9900"
              size="small"
            />
          </template>
        </el-table-column>
        <el-table-column label="工作负载" width="120">
          <template #default="{ row }">
            <span>{{ row.mentor.currentLoad || 0 }}/{{ row.mentor.maxLoad || 5 }}</span>
            <el-progress 
              :percentage="Math.round(((row.mentor.currentLoad || 0) / (row.mentor.maxLoad || 5)) * 100)" 
              :stroke-width="6"
              :show-text="false"
            />
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200">
          <template #default="{ row }">
            <el-button size="small" @click="viewDetails(row)">查看详情</el-button>
            <el-button size="small" type="primary" @click="selectMentor(row)">选择</el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>
    
    <div class="matching-statistics" v-if="statistics">
      <h4>匹配统计</h4>
      <el-row :gutter="20">
        <el-col :span="6">
          <el-statistic title="总导师数" :value="statistics.totalMentors" />
        </el-col>
        <el-col :span="6">
          <el-statistic title="可用导师数" :value="statistics.availableMentors" />
        </el-col>
        <el-col :span="6">
          <el-statistic title="平均工作负载" :value="statistics.averageWorkload" suffix="%" />
        </el-col>
        <el-col :span="6">
          <el-statistic title="技能覆盖率" :value="statistics.skillCoverage" suffix="%" />
        </el-col>
      </el-row>
    </div>
    
    <!-- 导师详情对话框 -->
    <el-dialog v-model="showDetailsDialog" title="导师详情" width="600px">
      <div v-if="selectedMentor" class="mentor-details">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="姓名">{{ selectedMentor.mentor.name }}</el-descriptions-item>
          <el-descriptions-item label="部门">{{ selectedMentor.mentor.department }}</el-descriptions-item>
          <el-descriptions-item label="职位">{{ selectedMentor.mentor.position }}</el-descriptions-item>
          <el-descriptions-item label="评分">{{ selectedMentor.mentor.rating }}</el-descriptions-item>
          <el-descriptions-item label="经验年限">{{ selectedMentor.mentor.experience?.totalYears || 0 }}年</el-descriptions-item>
          <el-descriptions-item label="带教经验">{{ selectedMentor.mentor.experience?.mentorshipYears || 0 }}年</el-descriptions-item>
          <el-descriptions-item label="成功案例">{{ selectedMentor.mentor.experience?.successfulMentorships || 0 }}个</el-descriptions-item>
          <el-descriptions-item label="带教风格">{{ selectedMentor.mentor.style }}</el-descriptions-item>
        </el-descriptions>
        
        <el-divider />
        
        <h5>技能专长</h5>
        <el-tag 
          v-for="skill in selectedMentor.mentor.expertise" 
          :key="skill" 
          style="margin-right: 8px; margin-bottom: 4px"
        >
          {{ skill }}
        </el-tag>
        
        <el-divider />
        
        <h5>匹配度分析</h5>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-progress 
              type="circle" 
              :percentage="Math.round(selectedMentor.score * 100)"
              :color="getScoreColor(selectedMentor.score)"
            />
          </el-col>
          <el-col :span="12">
            <div class="match-breakdown">
              <div v-for="(value, key) in selectedMentor.breakdown" :key="key" class="breakdown-item">
                <span class="breakdown-label">{{ getBreakdownLabel(key) }}:</span>
                <el-progress 
                  :percentage="Math.round(value * 100)" 
                  :stroke-width="8"
                  :show-text="false"
                />
                <span class="breakdown-value">{{ Math.round(value * 100) }}%</span>
              </div>
            </div>
          </el-col>
        </el-row>
        
        <el-divider />
        
        <h5>匹配原因</h5>
        <ul>
          <li v-for="reason in selectedMentor.reasons" :key="reason">{{ reason }}</li>
        </ul>
        
        <div v-if="selectedMentor.warnings.length > 0">
          <h5>注意事项</h5>
          <el-alert 
            v-for="warning in selectedMentor.warnings" 
            :key="warning" 
            :title="warning" 
            type="warning" 
            show-icon 
            :closable="false"
            style="margin-bottom: 8px"
          />
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed } from 'vue';
import { ElMessage } from 'element-plus';
import type { MatchingResult } from '../services';

interface Props {
  visible?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  visible: false
});

const emit = defineEmits<{
  select: [mentor: MatchingResult];
  match: [criteria: any];
}>();

const formRef = ref();
const formData = reactive({
  studentName: '',
  requiredSkills: [] as string[],
  department: '',
  priority: 'medium',
  maxWorkload: 5,
  minRating: 4.0
});

const matchingResults = ref<MatchingResult[]>([]);
const statistics = ref<{
  totalMentors: number;
  availableMentors: number;
  averageWorkload: number;
  skillCoverage: number;
} | null>(null);

const showDetailsDialog = ref(false);
const selectedMentor = ref<MatchingResult | null>(null);

const rules = {
  studentName: [
    { required: true, message: '请输入学员姓名', trigger: 'blur' }
  ],
  requiredSkills: [
    { required: true, message: '请选择所需技能', trigger: 'change' }
  ]
};

const getScoreColor = (score: number) => {
  if (score >= 0.8) return '#67C23A';
  if (score >= 0.6) return '#E6A23C';
  return '#F56C6C';
};

const getBreakdownLabel = (key: string) => {
  const labels: Record<string, string> = {
    skillsMatch: '技能匹配',
    departmentMatch: '部门匹配',
    workloadScore: '工作负载',
    ratingScore: '评分',
    experienceScore: '经验',
    styleMatch: '风格匹配',
    overallFit: '整体适配'
  };
  return labels[key] || key;
};

const handleMatch = async () => {
  try {
    const valid = await formRef.value.validate();
    if (!valid) return;
    
    // 模拟匹配结果
    matchingResults.value = [
      {
        mentor: {
          id: 'mentor-1',
          mentorId: 'mentor-1',
          name: '李高级',
          email: 'li@example.com',
          department: '技术部',
          position: '高级工程师',
          expertise: ['JavaScript', 'Vue.js', 'Node.js', 'Leadership'],
          certifications: [
            { name: 'Vue.js认证', level: 'advanced', issuer: 'Vue.js官方' }
          ],
          currentLoad: 2,
          maxLoad: 5,
          rating: 4.8,
          trainingMentorships: ['training-1', 'training-2'],
          mentorshipProjects: ['project-1', 'project-2'],
          style: 'hands-on',
          timezone: 'Asia/Shanghai',
          experience: {
            totalYears: 8,
            mentorshipYears: 3,
            successfulMentorships: 15
          },
          entryDate: new Date('2015-01-01'),
          status: 'active'
        },
        score: 0.92,
        breakdown: {
          skillsMatch: 0.95,
          departmentMatch: 1.0,
          workloadScore: 0.8,
          ratingScore: 0.96,
          experienceScore: 0.9,
          styleMatch: 0.85,
          overallFit: 0.92
        },
        reasons: ['技能匹配度高', '同部门协作', '导师评分优秀', '工作负载适中'],
        warnings: []
      },
      {
        mentor: {
          id: 'mentor-2',
          mentorId: 'mentor-2',
          name: '王架构师',
          email: 'wang@example.com',
          department: '技术部',
          position: '架构师',
          expertise: ['Java', 'Python', 'SystemDesign', 'Leadership'],
          certifications: [
            { name: 'Java架构师认证', level: 'expert', issuer: 'Oracle' }
          ],
          currentLoad: 3,
          maxLoad: 4,
          rating: 4.9,
          trainingMentorships: ['training-3'],
          mentorshipProjects: ['project-3', 'project-4'],
          style: 'structured',
          timezone: 'Asia/Shanghai',
          experience: {
            totalYears: 12,
            mentorshipYears: 5,
            successfulMentorships: 28
          },
          entryDate: new Date('2011-03-01'),
          status: 'active'
        },
        score: 0.78,
        breakdown: {
          skillsMatch: 0.6,
          departmentMatch: 1.0,
          workloadScore: 0.75,
          ratingScore: 0.98,
          experienceScore: 0.95,
          styleMatch: 0.7,
          overallFit: 0.78
        },
        reasons: ['丰富的带教经验', '高评分导师', '技术能力强'],
        warnings: ['技能匹配度一般', '工作负载较高']
      }
    ];
    
    statistics.value = {
      totalMentors: 15,
      availableMentors: 8,
      averageWorkload: 65,
      skillCoverage: 85
    };
    
    emit('match', formData);
    ElMessage.success('匹配完成');
  } catch (error) {
    console.error('匹配失败:', error);
    ElMessage.error('匹配失败');
  }
};

const viewDetails = (mentor: MatchingResult) => {
  selectedMentor.value = mentor;
  showDetailsDialog.value = true;
};

const selectMentor = (mentor: MatchingResult) => {
  emit('select', mentor);
  ElMessage.success(`已选择导师：${mentor.mentor.name}`);
};

const resetForm = () => {
  formRef.value?.resetFields();
  matchingResults.value = [];
  statistics.value = null;
};

defineExpose({
  handleMatch,
  resetForm
});
</script>

<style scoped>
.mentor-matching {
  padding: 16px;
}

.matching-header {
  background-color: #f5f7fa;
  padding: 16px;
  border-radius: 4px;
  margin-bottom: 16px;
}

.matching-results {
  margin-bottom: 24px;
}

.matching-statistics {
  background-color: #f9f9f9;
  padding: 16px;
  border-radius: 4px;
}

.mentor-details h5 {
  margin-top: 16px;
  margin-bottom: 8px;
  color: #606266;
}

.match-breakdown {
  padding-left: 16px;
}

.breakdown-item {
  display: flex;
  align-items: center;
  margin-bottom: 8px;
}

.breakdown-label {
  min-width: 80px;
  font-size: 12px;
  color: #666;
}

.breakdown-value {
  margin-left: 8px;
  font-size: 12px;
  color: #333;
}

.breakdown-item .el-progress {
  flex: 1;
  margin: 0 8px;
}
</style> 