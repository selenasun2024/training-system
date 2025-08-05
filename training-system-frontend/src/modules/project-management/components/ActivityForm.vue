<template>
  <el-dialog :model-value="visible" title="创建活动" width="600px" @close="$emit('update:visible', false)">
    <el-form :model="form" label-width="100px">
      <!-- 基本信息 -->
      <el-form-item label="活动名称" prop="title">
        <el-input v-model="form.title" maxlength="200" show-word-limit />
      </el-form-item>
      <el-form-item label="活动说明" prop="desc">
        <el-input type="textarea" v-model="form.desc" rows="3" maxlength="400" show-word-limit />
      </el-form-item>

      <!-- 活动内容（可类比讨论问题） -->
      <template v-for="(step, idx) in form.steps" :key="idx">
        <el-form-item :label="`步骤${idx + 1}`">
          <el-input type="textarea" v-model="step.content" :rows="3" placeholder="请输入活动步骤/要求" />
          <el-button v-if="form.steps.length > 1" icon="Delete" @click="removeStep(idx)" plain type="danger" size="small" />
        </el-form-item>
      </template>
      <el-button type="primary" link @click="addStep" :disabled="form.steps.length >= 5">+ 添加步骤 ({{ form.steps.length }}/5)</el-button>

      <!-- 设置 -->
      <el-divider>活动设置</el-divider>
      <el-checkbox v-model="form.allowComment">允许学员匿名评论</el-checkbox>
    </el-form>

    <template #footer>
      <el-button @click="$emit('update:visible', false)">取消</el-button>
      <el-button type="primary" @click="save">确定</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { reactive, watch, onMounted } from 'vue';

const props = defineProps<{ 
  visible: boolean;
  initialData?: any;
}>();
const emit = defineEmits(['update:visible', 'save']);

const form = reactive({
  title: '',
  desc: '',
  steps: [{ content: '' }],
  allowComment: true,
});

// 加载初始数据的函数
function loadInitialData() {
  if (props.initialData) {
    const taskConfig = props.initialData.config || {};
    form.title = props.initialData.name || '';
    form.desc = props.initialData.description || taskConfig.description || '';
    form.steps = taskConfig.steps || [{ content: '' }];
    form.allowComment = taskConfig.allowComment !== false;
  } else {
    // 重置表单
    form.title = '';
    form.desc = '';
    form.steps = [{ content: '' }];
    form.allowComment = true;
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

function addStep() {
  if (form.steps.length < 5) form.steps.push({ content: '' });
}
function removeStep(i: number) {
  form.steps.splice(i, 1);
}

function save() {
  emit('save', JSON.parse(JSON.stringify(form)));
  emit('update:visible', false);
}

// 组件挂载时加载初始数据
onMounted(() => {
  if (props.visible && props.initialData) {
    loadInitialData();
  }
});
</script> 