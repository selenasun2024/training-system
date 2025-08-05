<template>
  <el-dialog
    :model-value="visible"
    title="编辑作业"
    width="600px"
  >
    <el-form :model="form" label-width="100px" @submit.prevent>
      <el-form-item label="作业名称" prop="title">
        <el-input v-model="form.title" placeholder="请输入作业名称" />
      </el-form-item>

      <el-form-item label="作业要求" prop="description">
        <el-input
          v-model="form.description"
          type="textarea"
          :autosize="{ minRows: 4, maxRows: 4 }"
          placeholder="请输入作业要求"
        />
      </el-form-item>

      <el-form-item label="附件上传">
        <el-upload
          v-model:file-list="form.attachments"
          drag
          :auto-upload="false"
          action=""
          :on-remove="handleRemove"
          :on-change="handleChange"
        >
                      <el-icon class="el-icon--upload"><Upload /></el-icon>
          <div class="el-upload__text">将文件拖到此处，或<em>点击上传</em></div>
        </el-upload>
      </el-form-item>

      <el-form-item label="分值">
        <el-input-number v-model="form.totalScore" :min="0" placeholder="请输入分值" />
      </el-form-item>

      <el-form-item label="关联课程名称">
        <el-input v-model="form.linkCourse" placeholder="请选择或输入" />
      </el-form-item>

      <el-form-item label="批阅类型" prop="reviewType">
        <el-radio-group v-model="form.reviewType">
          <el-radio label="mentor">导师批阅</el-radio>
          <el-radio label="assistant">辅导师批阅</el-radio>
          <el-radio label="deptManager">部门经理批阅</el-radio>
          <el-radio label="directManager">直属经理批阅</el-radio>
          <el-radio label="custom">指定人批阅</el-radio>
        </el-radio-group>
      </el-form-item>

      <el-form-item label="提交时间" prop="timeRange">
        <el-date-picker v-model="form.timeRange" type="datetimerange" start-placeholder="开始时间" end-placeholder="结束时间" style="width: 100%" />
      </el-form-item>

      <el-form-item>
        <el-checkbox v-model="form.onsiteDisplay">现场展示</el-checkbox>
      </el-form-item>
    </el-form>

    <template #footer>
      <span class="dialog-footer">
        <el-button @click="handleClose">取消</el-button>
        <el-button type="primary" @click="handleSave">保存</el-button>
      </span>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { reactive, watch, onMounted } from 'vue';
import { Upload } from '@element-plus/icons-vue';

const props = defineProps<{ 
  visible: boolean;
  initialData?: any;
}>();
const emits = defineEmits<{
  (e: 'update:visible', value: boolean): void;
  (e: 'save', value: {
    title: string;
    description: string;
    attachments: any[];
    onsiteDisplay: boolean;
  }): void;
}>();

const form = reactive({
  title: '',
  description: '',
  attachments: [] as any[],
  totalScore: undefined as number | undefined,
  linkCourse: '',
  reviewType: 'mentor',
  timeRange: [],
  onsiteDisplay: false,
});

// 加载初始数据的函数
function loadInitialData() {
  if (props.initialData) {
    const taskConfig = props.initialData.config || {};
    form.title = props.initialData.name || '';
    form.description = props.initialData.description || taskConfig.description || '';
    form.attachments = taskConfig.attachments || [];
    form.totalScore = taskConfig.totalScore || taskConfig.score;
    form.linkCourse = taskConfig.linkCourse || '';
    form.reviewType = taskConfig.reviewType || 'mentor';
    form.timeRange = taskConfig.timeRange || [];
    form.onsiteDisplay = taskConfig.onsiteDisplay || false;
  } else {
    // 重置表单
    form.title = ''
    form.description = ''
    form.attachments = []
    form.totalScore = undefined
    form.linkCourse = ''
    form.reviewType = 'mentor'
    form.timeRange = []
    form.onsiteDisplay = false
  }
}

watch(
  () => props.visible,
  (val) => {
    if (val) {
      // 对话框打开时加载数据
      loadInitialData();
    }
  }
);

// 监听初始数据变化
watch(
  () => props.initialData,
  () => {
    if (props.visible) {
      loadInitialData();
    }
  },
  { deep: true }
);

function handleClose() {
  emits('update:visible', false);
}

function handleSave() {
  emits('save', { ...form });
  emits('update:visible', false);
}

function handleRemove() {
  // no special handling for now
}
function handleChange() {}

// 组件挂载时加载初始数据
onMounted(() => {
  if (props.visible && props.initialData) {
    loadInitialData();
  }
});
</script> 