<template>
  <div class="rule-editor">
    <el-form ref="formRef" :model="formData" :rules="rules" label-width="120px">
      <el-form-item label="规则名称" prop="name">
        <el-input v-model="formData.name" placeholder="请输入规则名称" />
      </el-form-item>
      
      <el-form-item label="规则描述" prop="description">
        <el-input 
          v-model="formData.description" 
          type="textarea" 
          :rows="3"
          placeholder="请输入规则描述"
        />
      </el-form-item>
      
      <el-form-item label="启用状态">
        <el-switch v-model="formData.enabled" />
      </el-form-item>
      
      <el-form-item label="优先级" prop="priority">
        <el-select v-model="formData.priority" placeholder="选择优先级">
          <el-option label="高" :value="1" />
          <el-option label="中" :value="2" />
          <el-option label="低" :value="3" />
        </el-select>
      </el-form-item>
      
      <el-form-item label="触发条件">
        <div class="conditions-editor">
          <div v-for="(condition, index) in formData.conditions" :key="index" class="condition-item">
            <el-row :gutter="10">
              <el-col :span="6">
                <el-select v-model="condition.type" placeholder="条件类型">
                  <el-option label="培训状态" value="training_status" />
                  <el-option label="分数阈值" value="score_threshold" />
                  <el-option label="技能等级" value="skill_level" />
                  <el-option label="部门" value="department" />
                  <el-option label="自定义" value="custom" />
                </el-select>
              </el-col>
              <el-col :span="5">
                <el-input v-model="condition.field" placeholder="字段名" />
              </el-col>
              <el-col :span="4">
                <el-select v-model="condition.operator" placeholder="操作符">
                  <el-option label="等于" value="equals" />
                  <el-option label="大于" value="greater_than" />
                  <el-option label="小于" value="less_than" />
                  <el-option label="包含" value="contains" />
                  <el-option label="属于" value="in" />
                </el-select>
              </el-col>
              <el-col :span="5">
                <el-input v-model="condition.value" placeholder="值" />
              </el-col>
              <el-col :span="2">
                <el-switch v-model="condition.required" size="small" />
              </el-col>
              <el-col :span="2">
                <el-button @click="removeCondition(index)" type="danger" size="small" plain>
                  <el-icon><Delete /></el-icon>
                </el-button>
              </el-col>
            </el-row>
          </div>
          <el-button @click="addCondition" type="primary" plain size="small">
            <el-icon><Plus /></el-icon>
            添加条件
          </el-button>
        </div>
      </el-form-item>
      
      <el-form-item label="执行动作">
        <div class="actions-editor">
          <div v-for="(action, index) in formData.actions" :key="index" class="action-item">
            <el-row :gutter="10">
              <el-col :span="8">
                <el-select v-model="action.type" placeholder="动作类型">
                  <el-option label="创建带教项目" value="create_mentorship" />
                  <el-option label="通知管理员" value="notify_manager" />
                  <el-option label="更新档案" value="update_profile" />
                  <el-option label="分配导师" value="assign_mentor" />
                  <el-option label="发送邀请" value="send_invitation" />
                </el-select>
              </el-col>
              <el-col :span="12">
                <el-input 
                  v-model="action.configText" 
                  type="textarea" 
                  :rows="2"
                  placeholder="配置参数（JSON格式）"
                />
              </el-col>
              <el-col :span="2">
                <el-button @click="removeAction(index)" type="danger" size="small" plain>
                  <el-icon><Delete /></el-icon>
                </el-button>
              </el-col>
            </el-row>
          </div>
          <el-button @click="addAction" type="primary" plain size="small">
            <el-icon><Plus /></el-icon>
            添加动作
          </el-button>
        </div>
      </el-form-item>
    </el-form>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, reactive } from 'vue';
import { ElMessage } from 'element-plus';
import { Plus, Delete } from '@element-plus/icons-vue';
import type { IntegrationRule, IntegrationCondition, IntegrationAction } from '../services';

interface Props {
  rule?: IntegrationRule | null;
}

const props = withDefaults(defineProps<Props>(), {
  rule: null
});

const emit = defineEmits<{
  save: [rule: IntegrationRule];
  cancel: [];
}>();

const formRef = ref();
const formData = reactive({
  id: '',
  name: '',
  description: '',
  enabled: true,
  priority: 1,
  conditions: [] as (IntegrationCondition & { configText?: string })[],
  actions: [] as (IntegrationAction & { configText?: string })[],
  createdAt: new Date(),
  updatedAt: new Date()
});

const rules = {
  name: [
    { required: true, message: '请输入规则名称', trigger: 'blur' }
  ],
  description: [
    { required: true, message: '请输入规则描述', trigger: 'blur' }
  ],
  priority: [
    { required: true, message: '请选择优先级', trigger: 'change' }
  ]
};

// 监听 props 变化
watch(() => props.rule, (newRule) => {
  if (newRule) {
    Object.assign(formData, {
      ...newRule,
      conditions: newRule.conditions.map(c => ({ ...c, configText: JSON.stringify(c.value, null, 2) })),
      actions: newRule.actions.map(a => ({ ...a, configText: JSON.stringify(a.config, null, 2) }))
    });
  } else {
    // 重置表单
    Object.assign(formData, {
      id: '',
      name: '',
      description: '',
      enabled: true,
      priority: 1,
      conditions: [],
      actions: [],
      createdAt: new Date(),
      updatedAt: new Date()
    });
  }
}, { immediate: true });

const addCondition = () => {
  formData.conditions.push({
    type: 'training_status',
    field: 'status',
    operator: 'equals',
    value: '',
    required: true
  });
};

const removeCondition = (index: number) => {
  formData.conditions.splice(index, 1);
};

const addAction = () => {
  formData.actions.push({
    type: 'create_mentorship',
    config: {},
    configText: '{}'
  });
};

const removeAction = (index: number) => {
  formData.actions.splice(index, 1);
};

const handleSave = async () => {
  try {
    const valid = await formRef.value.validate();
    if (!valid) return;
    
    // 处理配置文本
    const processedRule: IntegrationRule = {
      ...formData,
      conditions: formData.conditions.map(c => ({
        ...c,
        value: c.configText ? JSON.parse(c.configText) : c.value
      })),
      actions: formData.actions.map(a => ({
        ...a,
        config: a.configText ? JSON.parse(a.configText) : a.config
      })),
      updatedAt: new Date()
    };
    
    emit('save', processedRule);
  } catch (error) {
    console.error('保存规则失败:', error);
    ElMessage.error('保存规则失败，请检查配置格式');
  }
};

const handleCancel = () => {
  emit('cancel');
};

defineExpose({
  handleSave,
  handleCancel
});
</script>

<style scoped>
.rule-editor {
  padding: 16px;
}

.conditions-editor,
.actions-editor {
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  padding: 12px;
}

.condition-item,
.action-item {
  margin-bottom: 10px;
}

.condition-item:last-child,
.action-item:last-child {
  margin-bottom: 0;
}
</style> 