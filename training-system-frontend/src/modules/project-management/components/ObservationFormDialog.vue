<template>
  <el-dialog :model-value="visible" :title="record ? '编辑观察记录' : '新增观察记录'" @close="emit('update:visible', false)">
    <el-form :model="form" label-width="80px">
      <el-form-item label="日期">
        <el-date-picker v-model="form.date" type="date" style="width: 100%;" />
      </el-form-item>
      <el-form-item label="学员">
        <!-- 假设已有 UserSelector 组件 -->
        <UserSelector v-model="form.student" />
      </el-form-item>
      <el-form-item label="类型">
        <el-radio-group v-model="form.type">
          <el-radio-button label="highlight">闪光点</el-radio-button>
          <el-radio-button label="improve">待改进</el-radio-button>
        </el-radio-group>
      </el-form-item>
      <el-form-item label="内容">
        <el-input type="textarea" v-model="form.content" maxlength="500" show-word-limit rows="4" />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="emit('update:visible', false)">取消</el-button>
      <el-button type="primary" @click="handleSave">保存</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, watch, reactive } from 'vue';
import { ElMessage } from 'element-plus';
const props = defineProps<{
  visible: boolean;
  record?: any;
}>();
const emit = defineEmits<{
  (e: 'update:visible', val: boolean): void;
  (e: 'save', val: any): void;
}>();

const form = reactive({
  date: '',
  student: null as any,
  type: 'highlight',
  content: '',
});

watch(() => props.record, (val) => {
  if (val) Object.assign(form, val);
});

const handleSave = () => {
  // 简单验证
  if (!form.student || !form.content) {
    ElMessage.warning('请完整填写表单');
    return;
  }
  emit('save', { ...form, id: props.record?.id || Date.now() });
  emit('update:visible', false);
};
</script>

<style scoped>
</style> 