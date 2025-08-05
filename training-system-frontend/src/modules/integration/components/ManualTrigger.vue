<template>
  <div class="manual-trigger">
    <el-form ref="formRef" :model="formData" :rules="rules" label-width="120px">
      <el-form-item label="触发类型" prop="type">
        <el-select v-model="formData.type" placeholder="选择触发类型">
          <el-option label="手动同步" value="manual_sync" />
          <el-option label="批量匹配" value="batch_matching" />
          <el-option label="规则测试" value="rule_test" />
          <el-option label="数据修复" value="data_repair" />
        </el-select>
      </el-form-item>
      
      <el-form-item label="源系统" prop="sourceSystem">
        <el-select v-model="formData.sourceSystem" placeholder="选择源系统">
          <el-option label="培训系统" value="training" />
          <el-option label="带教系统" value="mentorship" />
          <el-option label="成长档案" value="growth" />
        </el-select>
      </el-form-item>
      
      <el-form-item label="目标系统" prop="targetSystem">
        <el-select v-model="formData.targetSystem" placeholder="选择目标系统">
          <el-option label="培训系统" value="training" />
          <el-option label="带教系统" value="mentorship" />
          <el-option label="成长档案" value="growth" />
        </el-select>
      </el-form-item>
      
      <el-form-item label="数据范围" prop="dataScope">
        <el-radio-group v-model="formData.dataScope">
          <el-radio value="all">全部数据</el-radio>
          <el-radio value="specific">指定数据</el-radio>
          <el-radio value="filtered">条件筛选</el-radio>
        </el-radio-group>
      </el-form-item>
      
      <el-form-item v-if="formData.dataScope === 'specific'" label="数据ID" prop="dataIds">
        <el-input 
          v-model="formData.dataIds" 
          type="textarea" 
          :rows="3"
          placeholder="请输入数据ID，多个ID用逗号分隔"
        />
      </el-form-item>
      
      <el-form-item v-if="formData.dataScope === 'filtered'" label="筛选条件" prop="filterConditions">
        <el-input 
          v-model="formData.filterConditions" 
          type="textarea" 
          :rows="4"
          placeholder="请输入筛选条件（JSON格式）"
        />
      </el-form-item>
      
      <el-form-item label="执行选项">
        <el-checkbox-group v-model="formData.options">
          <el-checkbox value="dryRun">仅预览（不执行）</el-checkbox>
          <el-checkbox value="forceSync">强制同步</el-checkbox>
          <el-checkbox value="skipValidation">跳过验证</el-checkbox>
          <el-checkbox value="notifyCompletion">完成通知</el-checkbox>
        </el-checkbox-group>
      </el-form-item>
      
      <el-form-item label="优先级" prop="priority">
        <el-select v-model="formData.priority" placeholder="选择优先级">
          <el-option label="紧急" value="urgent" />
          <el-option label="高" value="high" />
          <el-option label="中" value="medium" />
          <el-option label="低" value="low" />
        </el-select>
      </el-form-item>
      
      <el-form-item label="备注">
        <el-input 
          v-model="formData.notes" 
          type="textarea" 
          :rows="3"
          placeholder="请输入备注信息"
        />
      </el-form-item>
    </el-form>
    
    <el-divider />
    
    <div class="execution-preview" v-if="previewData">
      <h4>执行预览</h4>
      <el-descriptions :column="2" border>
        <el-descriptions-item label="影响记录数">{{ previewData.affectedRecords }}</el-descriptions-item>
        <el-descriptions-item label="预计耗时">{{ previewData.estimatedTime }}</el-descriptions-item>
        <el-descriptions-item label="风险评估">
          <el-tag :type="previewData.risk === 'high' ? 'danger' : previewData.risk === 'medium' ? 'warning' : 'success'">
            {{ previewData.risk === 'high' ? '高风险' : previewData.risk === 'medium' ? '中风险' : '低风险' }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="建议">{{ previewData.recommendation }}</el-descriptions-item>
      </el-descriptions>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed } from 'vue';
import { ElMessage } from 'element-plus';

interface Props {
  visible?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  visible: false
});

const emit = defineEmits<{
  execute: [config: any];
  cancel: [];
  preview: [config: any];
}>();

const formRef = ref();
const formData = reactive({
  type: 'manual_sync',
  sourceSystem: 'training',
  targetSystem: 'mentorship',
  dataScope: 'all',
  dataIds: '',
  filterConditions: '',
  options: [] as string[],
  priority: 'medium',
  notes: ''
});

const previewData = ref<{
  affectedRecords: number;
  estimatedTime: string;
  risk: 'low' | 'medium' | 'high';
  recommendation: string;
} | null>(null);

const rules = {
  type: [
    { required: true, message: '请选择触发类型', trigger: 'change' }
  ],
  sourceSystem: [
    { required: true, message: '请选择源系统', trigger: 'change' }
  ],
  targetSystem: [
    { required: true, message: '请选择目标系统', trigger: 'change' }
  ],
  dataScope: [
    { required: true, message: '请选择数据范围', trigger: 'change' }
  ],
  dataIds: [
    { required: true, message: '请输入数据ID', trigger: 'blur' }
  ],
  filterConditions: [
    { required: true, message: '请输入筛选条件', trigger: 'blur' }
  ],
  priority: [
    { required: true, message: '请选择优先级', trigger: 'change' }
  ]
};

const handlePreview = async () => {
  try {
    const valid = await formRef.value.validate();
    if (!valid) return;
    
    // 模拟预览数据
    previewData.value = {
      affectedRecords: Math.floor(Math.random() * 100) + 1,
      estimatedTime: `${Math.floor(Math.random() * 30) + 1}分钟`,
      risk: ['low', 'medium', 'high'][Math.floor(Math.random() * 3)] as 'low' | 'medium' | 'high',
      recommendation: '建议在业务低峰期执行，确保数据备份完成'
    };
    
    emit('preview', formData);
  } catch (error) {
    console.error('预览失败:', error);
    ElMessage.error('预览失败');
  }
};

const handleExecute = async () => {
  try {
    const valid = await formRef.value.validate();
    if (!valid) return;
    
    emit('execute', formData);
  } catch (error) {
    console.error('执行失败:', error);
    ElMessage.error('执行失败');
  }
};

const handleCancel = () => {
  emit('cancel');
};

const resetForm = () => {
  formRef.value?.resetFields();
  previewData.value = null;
};

defineExpose({
  handlePreview,
  handleExecute,
  handleCancel,
  resetForm
});
</script>

<style scoped>
.manual-trigger {
  padding: 16px;
}

.execution-preview {
  margin-top: 16px;
  padding: 16px;
  background-color: #f5f7fa;
  border-radius: 4px;
}

.execution-preview h4 {
  margin-top: 0;
  margin-bottom: 16px;
  color: #606266;
}
</style> 