<template>
  <div class="project-config-form">
    <el-card shadow="never">
      <template #header>
        <div class="card-header">
          <h3>功能配置</h3>
        </div>
      </template>
      
      <el-form :model="config" label-width="140px">
        <!-- 带教功能 -->
        <el-form-item label="启用带教">
          <el-switch :model-value="config.enableMentorship" @update:model-value="updateConfig('enableMentorship', $event)" />
        </el-form-item>
        
        <!-- 群聊功能 -->
        <el-form-item label="启用群聊">
          <el-switch :model-value="config.enableGroupChat" @update:model-value="updateConfig('enableGroupChat', $event)" />
        </el-form-item>
        
        <!-- 新闻功能 -->
        <el-form-item label="启用新闻">
          <el-switch :model-value="config.enableNews" @update:model-value="updateConfig('enableNews', $event)" />
        </el-form-item>
        
        <!-- 完整方案功能 -->
        <el-form-item label="启用完整方案">
          <el-switch :model-value="config.enableFullPlan" @update:model-value="updateConfig('enableFullPlan', $event)" />
        </el-form-item>
        
        <!-- 完整方案子模块 -->
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
          <el-form-item label="启用预算决算">
            <el-switch :model-value="config.enableBudget" @update:model-value="updateConfig('enableBudget', $event)" />
          </el-form-item>
          <el-form-item label="启用分工">
            <el-switch :model-value="config.enableDivision" @update:model-value="updateConfig('enableDivision', $event)" />
          </el-form-item>
          
          <!-- 审批启用状态说明 -->
          <el-form-item label="审批状态">
            <div class="approval-status">
              <el-tag :type="isApprovalEnabled ? 'success' : 'info'">
                {{ isApprovalEnabled ? '已自动启用' : '未启用' }}
              </el-tag>
              <span class="form-item-tip">
                启用议程、资源、预算决算、分工中任意一个功能时，审批功能将自动启用
              </span>
            </div>
          </el-form-item>
        </div>
      </el-form>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps<{
  config: {
    enableGroupChat: boolean;
    enableNews: boolean;
    enableFullPlan: boolean;
    enableMentorship: boolean;
    enableAgenda: boolean;
    enableResource: boolean;
    enableBudget: boolean;
    enableDivision: boolean;
    approver?: string;
  };
  availableUsers?: { id: string; name: string }[];
}>();

const emit = defineEmits(['update:config']);

// 计算审批是否应该启用
const isApprovalEnabled = computed(() => {
  if (!props.config.enableFullPlan) return false;
  return props.config.enableAgenda || 
         props.config.enableResource || 
         props.config.enableBudget || 
         props.config.enableDivision;
});

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
</script>

<style scoped>
.project-config-form {
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
.approval-status {
  display: flex;
  align-items: center;
  gap: 8px;
}
</style> 