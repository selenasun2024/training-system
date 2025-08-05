<template>
  <div class="basic-info-form">
    <el-card shadow="never">
      <template #header>
        <div class="card-header">
          <span>基本信息</span>
        </div>
      </template>
      <el-form ref="baseInfoFormRef" :model="baseInfoForm" :rules="baseInfoRules" label-width="100px" style="max-width: 800px; margin: 0 auto;">
        <el-row :gutter="24">
          <el-col :span="12">
            <el-form-item label="项目类型" prop="type">
              <el-select 
                v-model="baseInfoForm.type" 
                placeholder="请选择项目类型" 
                style="width: 100%"
                :disabled="!editMode"
              >
                <el-option
                  v-for="projectType in projectTypes"
                  :key="projectType.id"
                  :label="projectType.name"
                  :value="projectType.id"
                />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="项目名称" prop="title">
              <el-input 
                v-model="baseInfoForm.title" 
                placeholder="请输入项目名称" 
                :disabled="!editMode" 
              />
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="项目时间" prop="date">
              <el-date-picker
                v-model="baseInfoForm.date"
                type="daterange"
                range-separator="至"
                start-placeholder="开始日期"
                end-placeholder="结束日期"
                style="width: 100%"
                :disabled="!editMode"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="项目编号">
              <el-input v-model="baseInfoForm.id" disabled />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="培训机构">
              <el-input 
                v-model="baseInfoForm.org" 
                placeholder="请输入培训机构" 
                :disabled="!editMode" 
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="主办方">
              <el-input 
                v-model="baseInfoForm.owner" 
                placeholder="请输入主办方" 
                :disabled="!editMode" 
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="培训对象">
              <el-input 
                v-model="baseInfoForm.target" 
                placeholder="请输入培训对象" 
                :disabled="!editMode" 
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="培训地点">
              <el-input 
                v-model="baseInfoForm.location" 
                placeholder="请输入培训地点" 
                :disabled="!editMode" 
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="培训目标">
              <el-input 
                v-model="baseInfoForm.goal" 
                placeholder="请输入培训目标" 
                :disabled="!editMode" 
              />
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="项目介绍">
              <el-input 
                v-model="baseInfoForm.intro" 
                type="textarea" 
                :rows="4" 
                placeholder="请输入项目介绍" 
                :disabled="!editMode" 
              />
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="备注">
              <el-input 
                v-model="baseInfoForm.remark" 
                type="textarea" 
                :rows="3" 
                placeholder="请输入备注信息" 
                :disabled="!editMode" 
              />
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, watch, computed, onMounted } from 'vue';
import { ElMessage } from 'element-plus';
import { useSystemConfigStore } from '@/stores/systemConfig';

const props = defineProps<{
  projectData?: any; // 项目数据
  isNewProject?: boolean; // 是否是新项目
  editMode?: boolean; // 编辑模式
}>();

const emit = defineEmits(['form-data-updated', 'project-type-changed']);

// 系统配置Store
const systemConfigStore = useSystemConfigStore();
const projectTypes = computed(() => systemConfigStore.projectTypes);

const baseInfoFormRef = ref();

const initFormData = () => {
  if (props.isNewProject) {
    // 新项目：空表单
    return {
      id: '(创建后生成)',
      templateId: '',
      title: '',
      type: '',
      org: '',
      owner: '',
      target: '',
      date: [],
      location: '',
      goal: '',
      intro: '',
      remark: '',
    };
  } else {
    // 现有项目：从props获取数据
    const project = props.projectData;
    
    const formData = {
      id: project?.projectNo || '',
      templateId: '',
      title: project?.name || '',
      type: project?.type || project?.config?.type || '',
      org: project?.config?.org || '',
      owner: project?.config?.owner || project?.owner?.name || '',
      target: project?.config?.target || '',
      date: project?.startDate && project?.endDate ? [new Date(project.startDate), new Date(project.endDate)] : [],
      location: project?.config?.location || '',
      goal: project?.config?.goal || '',
      intro: project?.description || '',
      remark: project?.config?.remark || '',
    };
    
    return formData;
  }
};

const baseInfoForm = ref(initFormData());

// 更新验证规则：只保留必填项
const baseInfoRules = {
  type: [{ required: true, message: '请选择项目类型', trigger: 'change' }],
  title: [{ required: true, message: '请输入项目名称', trigger: 'blur' }],
  date: [{ required: true, message: '请选择项目时间', trigger: 'change' }],
};

// 监听projectData变化，更新表单数据
watch(() => props.projectData, (newData) => {
  if (newData) {
    const newFormData = initFormData();
    Object.keys(newFormData).forEach(key => {
      baseInfoForm.value[key] = newFormData[key];
    });
  }
}, { deep: true, immediate: true });

// 监听项目类型变化，通知父组件
watch(() => baseInfoForm.value.type, (newType) => {
  if (newType) {
    emit('project-type-changed', newType);
  }
}, { immediate: true });

const getFormData = () => {
  return {
    name: baseInfoForm.value.title,
    description: baseInfoForm.value.intro,
    type: baseInfoForm.value.type,
    estimatedDuration: baseInfoForm.value.date.length === 2 ? 
      Math.ceil((baseInfoForm.value.date[1].getTime() - baseInfoForm.value.date[0].getTime()) / (1000 * 60 * 60 * 24)) : undefined,
    startDate: baseInfoForm.value.date[0] ? baseInfoForm.value.date[0].toISOString().split('T')[0] : undefined,
    endDate: baseInfoForm.value.date[1] ? baseInfoForm.value.date[1].toISOString().split('T')[0] : undefined,
    config: {
      type: baseInfoForm.value.type,
      org: baseInfoForm.value.org,
      owner: baseInfoForm.value.owner,
      target: baseInfoForm.value.target,
      location: baseInfoForm.value.location,
      goal: baseInfoForm.value.goal,
      remark: baseInfoForm.value.remark,
    }
  };
};

// 页面初始化时加载项目类型数据
onMounted(async () => {
  await systemConfigStore.loadProjectTypes();
});

// 暴露给父组件使用
defineExpose({
  getFormData,
  validate: () => baseInfoFormRef.value?.validate()
});
</script>

<style scoped>
.basic-info-form {
  /* 移除不必要的padding，使内容更紧凑 */
}
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
</style> 