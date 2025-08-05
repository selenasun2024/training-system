<template>
  <el-dialog :model-value="visible" title="创建讨论" width="600px" @close="$emit('update:visible', false)">
    <el-form :model="form" label-width="100px">
      <el-form-item label="讨论名称" prop="title">
        <el-input v-model="form.title" maxlength="200" show-word-limit />
      </el-form-item>
      <el-form-item label="讨论说明" prop="desc">
        <el-input v-model="form.desc" maxlength="200" show-word-limit />
      </el-form-item>

      <template v-for="(q, idx) in form.questions" :key="idx">
        <el-form-item :label="`Q${idx+1}`">
          <el-input type="textarea" v-model="q.content" :rows="3" style="width:70%" />
          <el-input-number v-model="q.score" :min="0" style="width:100px;margin-left:8px" placeholder="分值" />
          <el-button v-if="form.questions.length>1" icon="Delete" @click="removeQ(idx)" plain type="danger" size="small" style="margin-left:8px" />
        </el-form-item>
      </template>
      <el-button type="primary" link @click="addQ" :disabled="form.questions.length>=5">+ 添加问题 ({{form.questions.length}}/5)</el-button>
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
  visible:boolean;
  initialData?: any;
}>();
const emit = defineEmits(['update:visible','save']);

const form = reactive({
  title:'',
  desc:'',
  questions:[{content:'', score: undefined as number|undefined}],
});

// 加载初始数据的函数
function loadInitialData() {
  if (props.initialData) {
    const taskConfig = props.initialData.config || {};
    form.title = props.initialData.name || '';
    form.desc = props.initialData.description || taskConfig.description || '';
    form.questions = taskConfig.questions || [{content:'', score: undefined}];
  } else {
    // 重置表单
    form.title = '';
    form.desc = '';
    form.questions = [{content:'', score: undefined}];
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

function addQ(){ if(form.questions.length<5) form.questions.push({content:'', score: undefined}); }
function removeQ(i:number){ form.questions.splice(i,1); }

function save(){
  const totalScore = form.questions.reduce((s:any,q:any)=>s+Number(q.score||0),0);
  const payload = { ...JSON.parse(JSON.stringify(form)), totalScore };
  emit('save', payload);
  emit('update:visible', false);
}

// 组件挂载时加载初始数据
onMounted(() => {
  if (props.visible && props.initialData) {
    loadInitialData();
  }
});
</script> 