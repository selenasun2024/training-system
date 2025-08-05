<template>
  <el-dialog :model-value="visible" title="编辑协作作业" width="600px" @close="$emit('update:visible', false)">
    <el-form :model="form" label-width="100px" :rules="rules" ref="formRef" class="cooperation-form">
      <!-- 基本信息 -->
      <el-form-item label="作业名称" prop="title" required>
        <el-input v-model="form.title" maxlength="50" show-word-limit />
      </el-form-item>
      <el-form-item label="作业介绍" prop="desc">
        <el-input type="textarea" v-model="form.desc" :rows="3" maxlength="200" show-word-limit />
      </el-form-item>

      <!-- 选择作业 -->
      <el-form-item label="协作作业" prop="assignmentId" required>
        <el-select v-model="selectedId" placeholder="选择作业" style="width: 300px">
          <el-option
            v-for="task in availableHomeworks"
            :key="task.id"
            :label="task.name"
            :value="task.id"
          />
        </el-select>
      </el-form-item>

      <!-- 分值继承 -->
      <el-form-item label="分值" prop="totalScore">
        <el-input-number v-model="form.totalScore" :min="0" style="width:120px" />
      </el-form-item>

      <el-divider />
    </el-form>
    <template #footer>
      <el-button @click="$emit('update:visible', false)">取消</el-button>
      <el-button type="primary" @click="save">确定</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { reactive, ref, computed, watch } from 'vue';
import type { FormInstance, FormRules } from 'element-plus';
import { useTrainingStageStore } from '../stores/trainingStage';
import { storeToRefs } from 'pinia';

const props = defineProps<{ visible: boolean }>();
const emit = defineEmits(['update:visible', 'save']);

// 获取当前阶段中的作业任务供选择
const store = useTrainingStageStore();
const { stages, activeStageId } = storeToRefs(store);

const availableHomeworks = computed(() => {
  const stage = stages.value.find((s) => s.id === activeStageId.value);
  if (!stage) return [] as any[];
  return stage.tasks.filter((t) => t.type === 'homework');
});

const form = reactive({
  title: '',
  desc: '',
  assignmentId: '',
  totalScore: undefined as number|undefined,
});

const formRef = ref<FormInstance>();
const rules: FormRules = {
  title: [{ required: true, message: '请输入作业名称', trigger: 'blur' }],
  assignmentId: [{ required: true, message: '请选择作业', trigger: 'change' }],
};

const selectedId = ref<string>('');

watch(selectedId, (id) => {
  if (!id) return;
  form.assignmentId = id;
  const task = availableHomeworks.value.find((t:any)=>t.id===id);
  if (task) {
    form.totalScore = task.config?.totalScore ?? undefined;
  }
});

function save() {
  formRef.value?.validate((valid) => {
    if (!valid) return;
    emit('save', JSON.parse(JSON.stringify(form)));
    emit('update:visible', false);
  });
}
</script>

<style scoped>
.cooperation-form {
  max-height: 70vh;
  overflow: auto;
}
</style> 