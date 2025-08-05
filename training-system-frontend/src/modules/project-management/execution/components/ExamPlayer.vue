<template>
  <div class="exam-player">
    <el-card shadow="never">
      <template #header>
        <span>{{ exam.title }}</span>
        <el-tag v-if="started" type="info" style="margin-left:8px">{{ remainingTimeStr }}</el-tag>
      </template>

      <el-descriptions :column="1" style="margin-bottom:16px">
        <el-descriptions-item label="考试说明">{{ examDescription }}</el-descriptions-item>
        <el-descriptions-item label="总分">{{ exam.totalScore }}</el-descriptions-item>
        <el-descriptions-item label="及格分">{{ exam.passScore }}</el-descriptions-item>
      </el-descriptions>

      <el-divider />

      <div v-if="!started">
        <el-button type="primary" @click="startExam">开始答题</el-button>
      </div>

      <div v-else>
        <div v-for="(q, index) in questions" :key="q.id" class="question-block">
          <p>{{ index + 1 }}. {{ q.text }}</p>
          <el-input v-model="q.answer" placeholder="请输入答案" />
        </div>
        <el-button type="primary" @click="submitExam" :disabled="submitted">提交考试</el-button>
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onUnmounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useExamStore } from '@/modules/project-management/stores/exam';

const route = useRoute();
const router = useRouter();
const store = useExamStore();

const projectId = route.params.projectId as string;
const examId = route.params.examId as string;

// 找到考试，如果不存在则返回上一页
const exam = store.exams.find(e => e.id === examId);
if (!exam) {
  router.back();
  throw new Error('无效的考试');
}

const started = ref(false);
const submitted = ref(false);
const remainingSeconds = ref(exam.duration * 60);
let timer: number | undefined;

function startExam() {
  started.value = true;
  timer = window.setInterval(() => {
    remainingSeconds.value--;
    if (remainingSeconds.value <= 0) {
      clearInterval(timer);
      submitExam();
    }
  }, 1000);
}

function submitExam() {
  if (submitted.value) return;
  submitted.value = true;
  clearInterval(timer);
  store.updateExam(exam.id, { status: 'closed' });
  // TODO: 计算得分并同步成绩模块
  router.back();
}

onUnmounted(() => {
  clearInterval(timer);
});

const remainingTimeStr = computed(() => {
  const m = Math.floor(remainingSeconds.value / 60);
  const s = remainingSeconds.value % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
});

// 简易示例题目
interface Question { id: string; text: string; answer: string }
const questions = ref<Question[]>([
  { id: 'q1', text: '示例题目 1：请简述Vue的响应式原理。', answer: '' },
  { id: 'q2', text: '示例题目 2：说说你对Pinia的理解。', answer: '' },
]);

const examDescription = computed(() => exam.description || '暂无说明');
</script>

<style scoped>
.exam-player {
  padding: 24px;
}
.question-block {
  margin-bottom: 16px;
}
</style> 