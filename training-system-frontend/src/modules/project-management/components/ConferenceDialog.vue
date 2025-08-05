<template>
  <el-dialog v-model:visible="visible" title="会务申请" width="500px">
    <el-form label-width="90px">
      <el-form-item label="项目编号">
        <el-input v-model="projectNo" disabled />
      </el-form-item>
      <el-form-item label="项目名称">
        <el-input v-model="projectName" disabled />
      </el-form-item>
      <el-form-item label="补充说明">
        <el-input v-model="remark" type="textarea" placeholder="可填写会务需求说明" />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="visible = false">取消</el-button>
      <el-button type="primary" @click="handleSubmit">提交申请</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, watch, defineProps, defineEmits } from 'vue';
const props = defineProps<{ visible: boolean; projectNo: string; projectName: string }>();
const emit = defineEmits(['update:visible', 'submit']);
const visible = ref(props.visible);
const remark = ref('');
watch(() => props.visible, v => visible.value = v);
watch(visible, v => emit('update:visible', v));
const projectNo = ref(props.projectNo);
const projectName = ref(props.projectName);
watch(() => props.projectNo, v => projectNo.value = v);
watch(() => props.projectName, v => projectName.value = v);
const handleSubmit = () => {
  // 这里可调用API，将数据传递到会务系统
  emit('submit', { projectNo: projectNo.value, projectName: projectName.value, remark: remark.value });
  visible.value = false;
};
</script> 