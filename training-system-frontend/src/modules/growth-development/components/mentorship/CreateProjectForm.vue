<template>
  <div class="create-project-form">
    <el-form 
      ref="formRef" 
      :model="form" 
      :rules="rules" 
      label-width="100px"
      @submit.prevent="handleSubmit"
    >
      <el-form-item label="项目名称" prop="name">
        <el-input 
          v-model="form.name" 
          placeholder="请输入项目名称"
          maxlength="50"
          show-word-limit
        />
      </el-form-item>

      <el-form-item label="项目描述" prop="description">
        <el-input 
          v-model="form.description" 
          type="textarea" 
          placeholder="请输入项目描述"
          :rows="3"
          maxlength="200"
          show-word-limit
        />
      </el-form-item>

      <el-form-item label="选择学员" prop="studentId">
        <el-select 
          v-model="form.studentId" 
          placeholder="请选择学员"
          filterable
          style="width: 100%"
        >
          <el-option
            v-for="student in students"
            :key="student.id"
            :label="student.name"
            :value="student.id"
          >
            <div class="option-content">
              <span class="name">{{ student.name }}</span>
              <span class="department">{{ student.department }}</span>
            </div>
          </el-option>
        </el-select>
      </el-form-item>

      <el-form-item label="选择导师" prop="mentorId">
        <el-select 
          v-model="form.mentorId" 
          placeholder="请选择导师"
          filterable
          style="width: 100%"
        >
          <el-option
            v-for="mentor in mentors"
            :key="mentor.id"
            :label="mentor.name"
            :value="mentor.id"
          >
            <div class="option-content">
              <span class="name">{{ mentor.name }}</span>
              <span class="speciality">{{ mentor.speciality }}</span>
            </div>
          </el-option>
        </el-select>
      </el-form-item>

      <el-form-item label="培训模板" prop="templateId">
        <el-select 
          v-model="form.templateId" 
          placeholder="请选择培训模板"
          style="width: 100%"
        >
          <el-option
            v-for="template in templates"
            :key="template.id"
            :label="template.name"
            :value="template.id"
          >
            <div class="option-content">
              <span class="name">{{ template.name }}</span>
              <span class="duration">{{ template.duration }}</span>
            </div>
          </el-option>
        </el-select>
      </el-form-item>

      <el-form-item label="计划开始时间" prop="startDate">
        <el-date-picker
          v-model="form.startDate"
          type="date"
          placeholder="请选择开始时间"
          style="width: 100%"
          :disabled-date="disabledDate"
        />
      </el-form-item>

      <el-form-item label="计划结束时间" prop="endDate">
        <el-date-picker
          v-model="form.endDate"
          type="date"
          placeholder="请选择结束时间"
          style="width: 100%"
          :disabled-date="disabledEndDate"
        />
      </el-form-item>

      <el-form-item label="优先级" prop="priority">
        <el-radio-group v-model="form.priority">
          <el-radio label="high">高</el-radio>
          <el-radio label="medium">中</el-radio>
          <el-radio label="low">低</el-radio>
        </el-radio-group>
      </el-form-item>

      <el-form-item label="备注" prop="notes">
        <el-input 
          v-model="form.notes" 
          type="textarea" 
          placeholder="请输入备注信息"
          :rows="2"
          maxlength="100"
          show-word-limit
        />
      </el-form-item>
    </el-form>

    <div class="form-actions">
      <el-button @click="handleCancel">取消</el-button>
      <el-button type="primary" @click="handleSubmit" :loading="submitting">
        创建项目
      </el-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import { ElMessage } from 'element-plus';
import type { FormInstance, FormRules } from 'element-plus';

// 定义事件
const emit = defineEmits<{
  success: [];
  cancel: [];
}>();

// 表单引用
const formRef = ref<FormInstance>();
const submitting = ref(false);

// 表单数据
const form = reactive({
  name: '',
  description: '',
  studentId: '',
  mentorId: '',
  templateId: '',
  startDate: '',
  endDate: '',
  priority: 'medium',
  notes: ''
});

// 表单验证规则
const rules: FormRules = {
  name: [
    { required: true, message: '请输入项目名称', trigger: 'blur' },
    { min: 2, max: 50, message: '项目名称长度在 2 到 50 个字符', trigger: 'blur' }
  ],
  description: [
    { required: true, message: '请输入项目描述', trigger: 'blur' },
    { min: 10, max: 200, message: '项目描述长度在 10 到 200 个字符', trigger: 'blur' }
  ],
  studentId: [
    { required: true, message: '请选择学员', trigger: 'change' }
  ],
  mentorId: [
    { required: true, message: '请选择导师', trigger: 'change' }
  ],
  templateId: [
    { required: true, message: '请选择培训模板', trigger: 'change' }
  ],
  startDate: [
    { required: true, message: '请选择开始时间', trigger: 'change' }
  ],
  endDate: [
    { required: true, message: '请选择结束时间', trigger: 'change' }
  ]
};

// 模拟数据
const students = ref([
  { id: '1', name: '张三', department: '前端开发部' },
  { id: '2', name: '李四', department: '后端开发部' },
  { id: '3', name: '王五', department: '产品设计部' },
  { id: '4', name: '赵六', department: '测试部' }
]);

const mentors = ref([
  { id: '1', name: '导师A', speciality: '前端技术' },
  { id: '2', name: '导师B', speciality: '后端架构' },
  { id: '3', name: '导师C', speciality: '产品设计' },
  { id: '4', name: '导师D', speciality: '项目管理' }
]);

const templates = ref([
  { id: '1', name: '前端开发入门', duration: '3个月' },
  { id: '2', name: '后端架构进阶', duration: '6个月' },
  { id: '3', name: '产品设计实战', duration: '4个月' },
  { id: '4', name: '项目管理基础', duration: '2个月' }
]);

// 日期禁用函数
const disabledDate = (time: Date) => {
  return time.getTime() < Date.now() - 8.64e7; // 不能选择今天之前的日期
};

const disabledEndDate = (time: Date) => {
  if (!form.startDate) return false;
  return time.getTime() <= new Date(form.startDate).getTime();
};

// 事件处理
const handleSubmit = async () => {
  if (!formRef.value) return;
  
  try {
    await formRef.value.validate();
    submitting.value = true;
    
    // 模拟API调用
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    ElMessage.success('创建项目成功');
    emit('success');
  } catch (error) {
    console.error('表单验证失败:', error);
  } finally {
    submitting.value = false;
  }
};

const handleCancel = () => {
  emit('cancel');
};

// 组件挂载时加载数据
onMounted(() => {
  // 这里可以加载学员、导师、模板数据
  console.log('创建项目表单已加载');
});
</script>

<style scoped>
.create-project-form {
  padding: 20px;
}

.option-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.name {
  font-weight: 500;
}

.department,
.speciality,
.duration {
  color: #999;
  font-size: 12px;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 24px;
  padding-top: 20px;
  border-top: 1px solid #eee;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .create-project-form {
    padding: 16px;
  }
  
  .option-content {
    flex-direction: column;
    align-items: flex-start;
    gap: 2px;
  }
}
</style> 