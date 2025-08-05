<template>
  <el-dialog v-model="innerVisible" title="添加面授" width="600px" @close="handleClose">
    <el-form :model="form" :rules="rules" ref="formRef" label-width="110px">
      <el-form-item label="课程名称" prop="courseName">
        <el-input v-model="form.courseName" placeholder="请输入课程名称" />
      </el-form-item>
      <el-form-item label="课程类别" prop="category">
        <el-select v-model="form.category" placeholder="请选择" style="width: 200px">
          <el-option label="通用" value="general" />
          <el-option label="专业" value="professional" />
        </el-select>
      </el-form-item>
      <el-form-item label="面授时间" prop="time">
        <el-date-picker v-model="form.time" type="datetimerange" range-separator="~" start-placeholder="开始时间" end-placeholder="结束时间" style="width: 100%" />
      </el-form-item>
      <el-form-item label="学分" prop="credit">
        <el-input-number v-model="form.credit" :min="0" />
      </el-form-item>
      <el-form-item label="培训时长" prop="duration">
        <el-input-number v-model="form.duration" :min="0" />
        <span style="margin-left:4px">分钟</span>
      </el-form-item>
      <el-form-item label="授课讲师" prop="lecturer">
        <el-input v-model="form.lecturer" placeholder="请输入讲师姓名" />
      </el-form-item>
      <el-form-item label="是否签到" prop="needSign">
        <el-radio-group v-model="form.needSign">
          <el-radio :label="true">是</el-radio>
          <el-radio :label="false">否</el-radio>
        </el-radio-group>
      </el-form-item>
      <el-form-item label="参考资料">
        <el-upload drag :auto-upload="false">
          <i class="el-icon-upload"></i>
          <div class="el-upload__text">拖拽文件或点击上传</div>
        </el-upload>
      </el-form-item>
      <el-form-item label="课程简介">
        <el-input type="textarea" v-model="form.courseDesc" rows="2" />
      </el-form-item>
      <el-form-item label="讲师简介">
        <el-input type="textarea" v-model="form.lecturerDesc" rows="2" />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="handleClose">取消</el-button>
      <el-button type="primary" @click="handleSubmit">保存</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { reactive, ref, watch } from 'vue';

const props = defineProps<{ visible: boolean }>();
const emit = defineEmits(['update:visible', 'save']);

// 内部可控 visible
const innerVisible = ref(props.visible);

watch(() => props.visible, (val) => {
  innerVisible.value = val;
});

watch(innerVisible, (val) => {
  emit('update:visible', val);
});

const formRef = ref();

const form = reactive({
  courseName: '',
  category: '',
  time: [],
  credit: 0,
  duration: 60,
  lecturer: '',
  needSign: true,
  courseDesc: '',
  lecturerDesc: '',
});

const rules = {
  courseName: [{ required: true, message: '请输入课程名称', trigger: 'blur' }],
  time: [{ required: true, message: '请选择面授时间', trigger: 'change' }],
  lecturer: [{ required: true, message: '请输入讲师姓名', trigger: 'blur' }],
};

function handleSubmit() {
  formRef.value.validate((valid: boolean) => {
    if (valid) {
      const payload = {
        courseName: form.courseName,
        category: form.category,
        startTime: form.time[0],
        endTime: form.time[1],
        credit: form.credit,
        duration: form.duration,
        lecturer: form.lecturer,
        needSign: form.needSign,
        courseDesc: form.courseDesc,
        lecturerDesc: form.lecturerDesc,
      };
      emit('save', payload);
      handleClose();
    }
  });
}

function handleClose() {
  innerVisible.value = false;
  // 重置表单
  form.courseName = ''
  form.category = ''
  form.time = []
  form.credit = 0
  form.duration = 60
  form.lecturer = ''
  form.needSign = true
  form.courseDesc = ''
  form.lecturerDesc = ''
}
</script>

<style scoped>
</style> 