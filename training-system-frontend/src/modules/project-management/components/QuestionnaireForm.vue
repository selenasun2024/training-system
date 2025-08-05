<template>
  <el-dialog :model-value="visible" title="创建问卷" width="700px" @close="$emit('update:visible', false)">
    <el-form :model="form" label-width="100px" :rules="rules" ref="formRef">
      <!-- 问卷模板选择 -->
      <el-form-item label="问卷模板" prop="templateId" required>
        <el-select v-model="form.templateId" placeholder="请选择">
          <el-option v-for="tpl in templateOptions" :key="tpl.value" :label="tpl.label" :value="tpl.value" />
        </el-select>
      </el-form-item>

      <!-- 名称 -->
      <el-form-item label="问卷名称" prop="title" required>
        <el-input v-model="form.title" maxlength="200" show-word-limit />
      </el-form-item>

      <!-- 介绍 -->
      <el-form-item label="简介" prop="intro">
        <el-input type="textarea" v-model="form.intro" :rows="4" maxlength="10000" show-word-limit />
      </el-form-item>

      <!-- 分类信息 -->
      <el-divider>分类信息</el-divider>
      <el-form-item label="类别" prop="category">
        <el-input v-model="form.category" placeholder="请输入类别" />
      </el-form-item>
      <el-form-item label="类型" prop="type">
        <el-input v-model="form.type" placeholder="请输入类型" />
      </el-form-item>
      <el-form-item label="部门" prop="department">
        <el-select v-model="form.department" placeholder="请选择部门" style="width: 100%">
          <el-option label="人力资源部" value="人力资源部" />
          <el-option label="消费者服务" value="消费者服务" />
          <el-option label="技术部" value="技术部" />
        </el-select>
      </el-form-item>
      <el-form-item label="所在地址" prop="location">
        <el-input v-model="form.location" placeholder="请输入所在地址" />
      </el-form-item>

      <!-- 时间设置 -->
      <el-divider>时间设置</el-divider>
      <el-form-item prop="dateRange">
        <el-date-picker v-model="form.dateRange" type="daterange" range-separator="~" start-placeholder="开始日期" end-placeholder="结束日期" style="width: 100%;" />
      </el-form-item>
    </el-form>

    <template #footer>
      <el-button @click="$emit('update:visible', false)">取消</el-button>
      <el-button type="primary" @click="save">确定</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue';
import type { FormInstance, FormRules } from 'element-plus';

const props = defineProps<{ visible: boolean }>();
const emit = defineEmits(['update:visible', 'save']);

// 模板示例，可后期改为接口获取
const templateOptions = [
  { value: 'tpl1', label: '通用满意度调研' },
  { value: 'tpl2', label: '课程反馈调研' },
];

const form = reactive({
  templateId: '',
  title: '',
  intro: '',
  category: '',
  type: '',
  department: '',
  location: '',
  dateRange: [] as [string, string] | [],
});

const rules: FormRules = {
  templateId: [{ required: true, message: '请选择模板', trigger: 'change' }],
  title: [{ required: true, message: '请输入名称', trigger: 'blur' }],
};

const formRef = ref<FormInstance>();

function save() {
  formRef.value?.validate((valid) => {
    if (!valid) return;
    emit('save', JSON.parse(JSON.stringify(form)));
    emit('update:visible', false);
  });
}
</script> 