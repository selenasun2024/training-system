<template>
  <div class="basic-info-container">
    <el-card shadow="never">
      <template #header>
        <div class="card-header">
          <span>基本信息</span>
          <el-button @click="onBaseInfoSave">保存基本信息</el-button>
        </div>
      </template>
      <el-form ref="baseInfoFormRef" :model="baseInfoForm" :rules="baseInfoRules" label-width="100px" style="max-width: 800px; margin: 0 auto;">
        <el-row :gutter="24">
          <el-col :span="12">
            <el-form-item label="项目类型" prop="type">
              <el-select v-model="baseInfoForm.type" placeholder="请选择项目类型" style="width: 100%">
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
              <el-input v-model="baseInfoForm.title" placeholder="请输入项目名称" />
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
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="项目编号">
              <el-input v-model="baseInfoForm.id" disabled />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="组织单位">
              <el-input v-model="baseInfoForm.org" placeholder="请输入组织单位" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="项目负责人">
              <el-input v-model="baseInfoForm.owner" placeholder="请输入项目负责人" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="培训对象">
              <el-input v-model="baseInfoForm.target" placeholder="请输入培训对象" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="培训地点">
              <el-input v-model="baseInfoForm.location" placeholder="请输入培训地点" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="项目目标">
              <el-input v-model="baseInfoForm.goal" placeholder="请输入项目目标" />
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="项目简介">
              <el-input v-model="baseInfoForm.intro" type="textarea" :rows="2" placeholder="请输入项目简介" />
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="备注">
              <el-input v-model="baseInfoForm.remark" type="textarea" :rows="2" placeholder="请输入备注" />
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
       <el-divider />
      <!-- 功能模块配置 -->
      <el-card class="box-card" shadow="never">
        <template #header>
          <div class="card-header">
            <span>功能模块配置</span>
          </div>
        </template>
        <el-form label-width="120px" style="max-width: 800px; margin: 0 auto;">
          <el-form-item label="启用群聊">
            <el-switch :model-value="config.enableGroupChat" @update:model-value="updateConfig('enableGroupChat', $event)" />
          </el-form-item>
          <el-divider />
          <el-form-item label="启用完整方案">
            <el-switch :model-value="config.enableFullPlan" @update:model-value="updateConfig('enableFullPlan', $event)" />
            <span class="form-item-tip">适用于需要详细规划的复杂项目，开启后可配置议程、预算等模块。</span>
          </el-form-item>
          <div v-if="config.enableFullPlan" class="plan-options">
            <!-- 审批人配置 -->
            <el-form-item label="审批人">
              <el-select 
                :model-value="config.approver" 
                @update:model-value="updateConfig('approver', $event)"
                placeholder="请选择审批人"
                clearable
                filterable
                style="width: 200px;"
              >
                <el-option-group label="指定用户">
                  <el-option 
                    v-for="user in availableUsers" 
                    :key="user.id" 
                    :label="user.name" 
                    :value="user.id" 
                  />
                </el-option-group>
                <el-option-group label="按岗位">
                  <el-option label="部门主管" value="role:department_manager" />
                  <el-option label="项目总监" value="role:project_director" />
                  <el-option label="培训主管" value="role:training_manager" />
                  <el-option label="人事主管" value="role:hr_manager" />
                </el-option-group>
              </el-select>
              <span class="form-item-tip">选择方案提交后的审批人，可选择具体用户或岗位角色</span>
            </el-form-item>
            
            <el-divider />
            
            <el-form-item label="启用议程">
              <el-switch :model-value="config.enableAgenda" @update:model-value="updateConfig('enableAgenda', $event)" />
            </el-form-item>
            <el-form-item label="启用资源">
              <el-switch :model-value="config.enableResource" @update:model-value="updateConfig('enableResource', $event)" />
            </el-form-item>
            <el-form-item label="启用预算">
              <el-switch :model-value="config.enableBudget" @update:model-value="updateConfig('enableBudget', $event)" />
            </el-form-item>
            <el-form-item label="启用分工">
              <el-switch :model-value="config.enableDivision" @update:model-value="updateConfig('enableDivision', $event)" />
            </el-form-item>
          </div>
        </el-form>
      </el-card>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, watch, computed, onMounted } from 'vue';
import { ElMessage } from 'element-plus';
import { useSystemConfigStore } from '@/stores/systemConfig';

const props = defineProps<{
  config: {
    enableGroupChat: boolean;
    enableFullPlan: boolean;
    enableAgenda: boolean;
    enableResource: boolean;
    enableBudget: boolean;
    enableDivision: boolean;
    approver?: string;
  };
  projectData?: any;
  isNewProject?: boolean;
  availableUsers?: { id: string; name: string }[];
}>();

const emit = defineEmits(['update:config', 'form-data-updated', 'project-type-changed']);

// 系统配置Store
const systemConfigStore = useSystemConfigStore();
const projectTypes = computed(() => systemConfigStore.projectTypes);

const updateConfig = (key: keyof typeof props.config, value: boolean | string) => {
  const newConfig = { ...props.config, [key]: value };
  
  // 若关闭完整方案，则级联关闭其子模块
  if (key === 'enableFullPlan' && !value) {
    newConfig.enableAgenda = false;
    newConfig.enableResource = false;
    newConfig.enableBudget = false;
    newConfig.enableDivision = false;
    newConfig.approver = undefined;
  }
  
  // 若开启完整方案，则自动启用其子模块
  if (key === 'enableFullPlan' && value) {
    newConfig.enableAgenda = true;
    newConfig.enableResource = true;
    newConfig.enableBudget = true;
    newConfig.enableDivision = true;
  }
  
  emit('update:config', newConfig);
};

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
    // 现有项目：从props获取数据，修复数据映射路径
    const project = props.projectData;
    console.log('🔧 initFormData - 原始项目数据:', project);
    console.log('🔧 initFormData - config数据:', project?.config);
    console.log('🔧 initFormData - config.type:', project?.config?.type);
    console.log('🔧 initFormData - config.target:', project?.config?.target);
    
    // 🔍 详细调试：逐一检查config中的所有字段
    if (project?.config) {
      console.log('🔍 config对象存在，检查所有字段:');
      console.log('  - type:', project.config.type, '(类型:', typeof project.config.type, ')');
      console.log('  - target:', project.config.target, '(类型:', typeof project.config.target, ')');
      console.log('  - org:', project.config.org, '(类型:', typeof project.config.org, ')');
      console.log('  - location:', project.config.location, '(类型:', typeof project.config.location, ')');
      console.log('  - goal:', project.config.goal, '(类型:', typeof project.config.goal, ')');
      console.log('🔍 config对象的所有键:', Object.keys(project.config));
    } else {
      console.log('❌ config对象不存在或为空');
    }
    
    const formData = {
      id: project?.projectNo || '',
      templateId: '',
      title: project?.name || '',
      // 修复：优先从根级别获取type，再从config获取，以兼容后端数据结构
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
    
    console.log('🔧 生成的表单数据:', formData);
    console.log('🔧 表单中的type值:', formData.type, '(类型:', typeof formData.type, ')');
    
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
  console.log('🔧 监听到projectData变化，重新初始化表单数据');
  console.log('🔧 新数据:', newData);
  if (newData) {
    // 🔧 关键修复：强制重新赋值整个表单对象，确保Vue响应式系统正确更新
    const newFormData = initFormData();
    console.log('🔧 新表单数据:', newFormData);
    console.log('🔧 新表单数据.target:', newFormData.target);
    
    // 逐个字段更新，确保响应式
    Object.keys(newFormData).forEach(key => {
      baseInfoForm.value[key] = newFormData[key];
    });
    
    console.log('🔧 更新后的baseInfoForm.value:', baseInfoForm.value);
    console.log('🔧 更新后的baseInfoForm.value.target:', baseInfoForm.value.target);
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
    type: baseInfoForm.value.type, // 项目类型移到根级别，后端需要
    estimatedDuration: baseInfoForm.value.date.length === 2 ? 
      Math.ceil((baseInfoForm.value.date[1].getTime() - baseInfoForm.value.date[0].getTime()) / (1000 * 60 * 60 * 24)) : undefined,
    startDate: baseInfoForm.value.date[0] ? baseInfoForm.value.date[0].toISOString().split('T')[0] : undefined,
    endDate: baseInfoForm.value.date[1] ? baseInfoForm.value.date[1].toISOString().split('T')[0] : undefined,
    config: {
      // 基本信息配置（保留一份在config中用于前端显示）
      type: baseInfoForm.value.type,
      org: baseInfoForm.value.org,
      owner: baseInfoForm.value.owner,
      target: baseInfoForm.value.target,
      location: baseInfoForm.value.location,
      goal: baseInfoForm.value.goal,
      remark: baseInfoForm.value.remark,
      // 功能模块配置
      enableGroupChat: props.config.enableGroupChat,
      enableFullPlan: props.config.enableFullPlan,
      enableAgenda: props.config.enableAgenda,
      enableResource: props.config.enableResource,
      enableBudget: props.config.enableBudget,
      enableDivision: props.config.enableDivision,
      approver: props.config.approver,
    }
  };
};

const onBaseInfoSave = () => {
  baseInfoFormRef.value.validate((valid: boolean) => {
    if (valid) {
      const formData = getFormData();
      emit('form-data-updated', formData);
      ElMessage.success('表单数据已更新！');
    }
  });
};

// 页面初始化时加载项目类型数据
onMounted(async () => {
  console.log('🔧 BasicInfoManagement mounted, 加载项目类型数据...');
  await systemConfigStore.loadProjectTypes();
  console.log('🔧 项目类型数据加载完成:', projectTypes.value);
});

// 暴露给父组件使用
defineExpose({
  getFormData,
  validate: () => baseInfoFormRef.value?.validate()
});
</script>

<style scoped>
.basic-info-container {
  /* 移除不必要的padding，使内容更紧凑 */
}
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.form-item-tip {
  color: #909399;
  font-size: 12px;
  margin-left: 12px;
}
.plan-options {
  padding-left: 20px;
  border-left: 2px solid #e4e7ed;
  margin-left: 10px;
}
</style> 