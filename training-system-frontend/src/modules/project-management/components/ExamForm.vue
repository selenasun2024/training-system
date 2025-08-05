<template>
  <el-dialog :model-value="visible" title="考试编辑" width="600px" @close="$emit('update:visible', false)">
    <el-form :model="exam" label-width="100px">
      <el-form-item label="标题">
        <el-input v-model="exam.title" />
      </el-form-item>
      <!-- 选择试卷 (标题下方) -->
      <el-form-item label="选择试卷">
        <el-select
          v-model="exam.paperId"
          filterable
          remote
          placeholder="请选择试卷"
          :remote-method="fetchPapers"
          style="width: 300px"
        >
          <el-option v-for="p in papers" :key="p.id" :label="p.name" :value="p.id" />
        </el-select>
      </el-form-item>
      <el-form-item label="考试说明">
        <el-input v-model="exam.description" type="textarea" :rows="3" placeholder="请输入考试说明" />
      </el-form-item>
      <el-form-item label="总分">
        <el-input-number v-model="exam.totalScore" :min="1" />
      </el-form-item>
      <el-form-item label="及格分">
        <el-input-number v-model="exam.passScore" :min="0" :max="exam.totalScore" />
      </el-form-item>
      <!-- 考试 & 答卷设置 -->
      <el-divider>考试设置</el-divider>
      <el-checkbox v-model="settings.unifyDuration">统一考试时长</el-checkbox>
      <el-input-number v-if="settings.unifyDuration" v-model="settings.duration" :min="1" style="margin-left:12px" /> 分钟
      <br />
      <el-checkbox v-model="settings.unifyAnswerWindow">统一答卷时间</el-checkbox>
      <el-date-picker v-if="settings.unifyAnswerWindow" v-model="settings.answerWindow" type="datetimerange" start-placeholder="开始" end-placeholder="结束" style="margin-left:12px"/>
      <br />
      <el-checkbox v-model="settings.minAnswerDurationEnable">最短答题时长</el-checkbox>
      <el-input-number v-if="settings.minAnswerDurationEnable" v-model="settings.minAnswerDuration" :min="1" style="margin-left:12px" /> 分钟
      <br />
      <el-checkbox v-model="settings.repeatEnable">允许重复考试次数</el-checkbox>
      <el-input-number v-if="settings.repeatEnable" v-model="settings.repeatTimes" :min="1" style="margin-left:12px" /> 次

      <el-divider>答卷设置</el-divider>
      <el-checkbox v-model="showScore">允许学员查看考试成绩</el-checkbox>
      <el-checkbox-group v-if="showScore" v-model="scoreDetails" style="margin-left:24px">
        <el-checkbox label="查看考试总分数">允许查看考试总分数</el-checkbox>
        <el-checkbox label="是否通过标识">允许查看是否通过标识</el-checkbox>
        <el-checkbox label="查看各题得分情况">允许查看各题得分情况</el-checkbox>
      </el-checkbox-group>

      <el-divider>防作弊设置</el-divider>
      <el-checkbox-group v-model="antiCheat">
        <el-checkbox label="打乱试题顺序">打乱试题顺序</el-checkbox>
        <el-checkbox label="打乱选项顺序">打乱选项顺序</el-checkbox>
      </el-checkbox-group>

      <el-divider>通知设置</el-divider>
      <el-checkbox v-model="notifyScore">发送考试成绩通知</el-checkbox>
    </el-form>
    <template #footer>
      <el-button @click="$emit('update:visible', false)">关闭</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { toRefs, ref, reactive } from 'vue';
import { useExamStore } from '../stores/exam';

const props = defineProps<{ 
  visible: boolean; 
  examId?: string;
  initialData?: any;
}>();
const emit = defineEmits(['update:visible']);

const store = useExamStore();

// 优先从initialData获取数据，其次从store获取，最后使用默认值
let examData;
if (props.initialData) {
  const taskConfig = props.initialData.config || {};
  examData = {
    id: props.initialData.id || '',
    title: props.initialData.name || '新建考试',
    description: props.initialData.description || taskConfig.description || '',
    totalScore: taskConfig.totalScore || 100,
    passScore: taskConfig.passScore || 60,
    paperId: taskConfig.paperId || ''
  };
} else if (props.examId) {
  examData = store.exams.find((e) => e.id === props.examId) || {
    id: props.examId,
    title: '新建考试',
    description: '',
    totalScore: 100,
    passScore: 60,
    paperId: ''
  };
} else {
  examData = {
    id: '',
    title: '新建考试',
    description: '',
    totalScore: 100,
    passScore: 60,
    paperId: ''
  };
}

const exam = reactive(examData);
const { title } = toRefs(exam);

// 远程搜索mock
interface Paper { id: string; name: string }
const papers = ref<Paper[]>([]);

function fetchPapers(query: string) {
  if (!query) {
    papers.value = [];
    return;
  }
  // 模拟远程查询，返回包含关键字的mock试卷列表
  papers.value = Array.from({ length: 5 }).map((_, idx) => ({
    id: `mock-${idx}`,
    name: `${query} 模拟试卷 ${idx + 1}`,
  }));
}

const showScore = ref(true);
const scoreDetails = ref<string[]>(['查看考试总分数', '是否通过标识', '查看各题得分情况']);

const antiCheat = ref<string[]>([]);
const notifyScore = ref(true);

const settings = reactive({
  unifyDuration: false,
  duration: 60,
  unifyAnswerWindow: false,
  answerWindow: [],
  minAnswerDurationEnable: false,
  minAnswerDuration: 1,
  repeatEnable: false,
  repeatTimes: 1,
});
</script> 