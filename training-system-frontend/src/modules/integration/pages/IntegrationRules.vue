<template>
  <div class="integration-rules">
    <div class="page-header">
      <h2>集成规则管理</h2>
      <p>配置和管理培训项目与带教项目的自动集成规则</p>
    </div>

    <!-- 操作栏 -->
    <div class="action-bar">
      <el-button type="primary" @click="showCreateDialog = true">
        <el-icon><Plus /></el-icon>
        新建规则
      </el-button>
      <el-button @click="importRules">
        <el-icon><Upload /></el-icon>
        导入规则
      </el-button>
      <el-button @click="exportRules">
        <el-icon><Download /></el-icon>
        导出规则
      </el-button>
    </div>

    <!-- 规则列表 -->
    <el-table :data="rules" border stripe>
      <el-table-column prop="name" label="规则名称" min-width="200" />
      <el-table-column prop="description" label="描述" min-width="300" />
      <el-table-column prop="enabled" label="状态" width="100">
        <template #default="{ row }">
          <el-switch
            v-model="row.enabled"
            @change="toggleRuleEnabled(row)"
          />
        </template>
      </el-table-column>
      <el-table-column prop="priority" label="优先级" width="100">
        <template #default="{ row }">
          <el-tag :type="getPriorityType(row.priority)">
            {{ row.priority }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="direction" label="方向" width="120">
        <template #default="{ row }">
          <el-tag :type="row.direction === 'bidirectional' ? 'success' : 'info'">
            {{ row.direction === 'bidirectional' ? '双向' : '单向' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="triggers" label="触发器" width="150">
        <template #default="{ row }">
          <el-tag
            v-for="trigger in row.triggers"
            :key="trigger.event"
            size="small"
            class="trigger-tag"
          >
            {{ getTriggerLabel(trigger.event) }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="updatedAt" label="更新时间" width="180">
        <template #default="{ row }">
          {{ formatDate(row.updatedAt) }}
        </template>
      </el-table-column>
      <el-table-column label="操作" width="200" fixed="right">
        <template #default="{ row }">
          <el-button size="small" @click="editRule(row)">编辑</el-button>
          <el-button size="small" type="warning" @click="testRule(row)">测试</el-button>
          <el-button size="small" type="danger" @click="deleteRule(row)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <!-- 创建/编辑规则对话框 -->
    <el-dialog
      v-model="showCreateDialog"
      :title="editingRule ? '编辑规则' : '新建规则'"
      width="800px"
    >
      <el-form :model="ruleForm" :rules="ruleFormRules" ref="ruleFormRef" label-width="120px">
        <el-form-item label="规则名称" prop="name">
          <el-input v-model="ruleForm.name" placeholder="请输入规则名称" />
        </el-form-item>
        <el-form-item label="描述" prop="description">
          <el-input
            v-model="ruleForm.description"
            type="textarea"
            :rows="3"
            placeholder="请输入规则描述"
          />
        </el-form-item>
        <el-form-item label="规则状态" prop="enabled">
          <el-switch v-model="ruleForm.enabled" />
        </el-form-item>
        <el-form-item label="优先级" prop="priority">
          <el-select v-model="ruleForm.priority" placeholder="选择优先级">
            <el-option label="低" value="1" />
            <el-option label="中" value="2" />
            <el-option label="高" value="3" />
            <el-option label="紧急" value="4" />
          </el-select>
        </el-form-item>
        <el-form-item label="同步方向" prop="direction">
          <el-radio-group v-model="ruleForm.direction">
            <el-radio value="unidirectional">单向</el-radio>
            <el-radio value="bidirectional">双向</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="源类型" prop="sourceType">
          <el-select v-model="ruleForm.sourceType" placeholder="选择源类型">
            <el-option label="培训项目" value="training" />
            <el-option label="带教项目" value="mentorship" />
          </el-select>
        </el-form-item>
        <el-form-item label="目标类型" prop="targetType">
          <el-select v-model="ruleForm.targetType" placeholder="选择目标类型">
            <el-option label="培训项目" value="training" />
            <el-option label="带教项目" value="mentorship" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showCreateDialog = false">取消</el-button>
        <el-button type="primary" @click="saveRule">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { Plus, Upload, Download } from '@element-plus/icons-vue';
import { autoIntegrationService } from '../services/AutoIntegrationService';
import type { IntegrationRule } from '@/types';

// 响应式数据
const rules = ref<IntegrationRule[]>([]);
const showCreateDialog = ref(false);
const editingRule = ref<IntegrationRule | null>(null);
const ruleFormRef = ref();

const ruleForm = ref({
  name: '',
  description: '',
  enabled: true,
  priority: 2,
  direction: 'unidirectional',
  sourceType: 'training',
  targetType: 'mentorship'
});

const ruleFormRules = {
  name: [
    { required: true, message: '请输入规则名称', trigger: 'blur' }
  ],
  description: [
    { required: true, message: '请输入规则描述', trigger: 'blur' }
  ]
};

// 生命周期
onMounted(() => {
  loadRules();
});

// 方法
const loadRules = () => {
  rules.value = autoIntegrationService.getRules();
};

const editRule = (rule: IntegrationRule) => {
  editingRule.value = rule;
  ruleForm.value = { ...rule };
  showCreateDialog.value = true;
};

const saveRule = async () => {
  if (!ruleFormRef.value) return;
  
  const valid = await ruleFormRef.value.validate();
  if (!valid) return;

  try {
    if (editingRule.value) {
      autoIntegrationService.updateRule(editingRule.value.id, ruleForm.value);
      ElMessage.success('规则更新成功');
    } else {
      autoIntegrationService.addRule(ruleForm.value);
      ElMessage.success('规则创建成功');
    }
    
    showCreateDialog.value = false;
    editingRule.value = null;
    resetForm();
    loadRules();
  } catch (error) {
    ElMessage.error('保存失败');
  }
};

const deleteRule = async (rule: IntegrationRule) => {
  try {
    await ElMessageBox.confirm('确定要删除这个规则吗？', '确认删除', {
      type: 'warning'
    });
    
    autoIntegrationService.deleteRule(rule.id);
    ElMessage.success('规则删除成功');
    loadRules();
  } catch {
    // 用户取消删除
  }
};

const toggleRuleEnabled = (rule: IntegrationRule) => {
  autoIntegrationService.updateRule(rule.id, { enabled: rule.enabled });
  ElMessage.success(`规则已${rule.enabled ? '启用' : '禁用'}`);
};

const testRule = async (rule: IntegrationRule) => {
  try {
    // 创建测试上下文
    const testContext = {
      trainingProject: {
        id: 'test-project',
        name: '测试项目',
        status: 'completed',
        participants: [{ userId: 'test-user', finalScore: 85 }]
      },
      student: {
        id: 'test-student',
        name: '测试学员',
        department: '技术部'
      },
      department: '技术部',
      metadata: {}
    };

    const result = await autoIntegrationService.testRule(rule.id, testContext);
    
    if (result.success) {
      ElMessage.success('规则测试通过');
    } else {
      ElMessage.warning(`规则测试失败：${result.errors.join(', ')}`);
    }
  } catch (error) {
    ElMessage.error('规则测试失败');
  }
};

const importRules = () => {
  ElMessage.info('导入功能开发中...');
};

const exportRules = () => {
  ElMessage.info('导出功能开发中...');
};

const resetForm = () => {
  ruleForm.value = {
    name: '',
    description: '',
    enabled: true,
    priority: 2,
    direction: 'unidirectional',
    sourceType: 'training',
    targetType: 'mentorship'
  };
};

// 工具方法
const getPriorityType = (priority: number) => {
  if (priority === 4) return 'danger';
  if (priority === 3) return 'warning';
  if (priority === 2) return 'primary';
  return 'info';
};

const getTriggerLabel = (event: string) => {
  const labels = {
    create: '创建',
    update: '更新',
    delete: '删除',
    status_change: '状态变更',
    schedule: '定时'
  };
  return labels[event] || event;
};

const formatDate = (date: Date) => {
  return new Intl.DateTimeFormat('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date);
};
</script>

<style scoped>
.integration-rules {
  padding: 20px;
}

.page-header {
  margin-bottom: 24px;
}

.page-header h2 {
  margin: 0 0 8px 0;
  font-size: 24px;
  color: #303133;
}

.page-header p {
  margin: 0;
  color: #606266;
}

.action-bar {
  margin-bottom: 16px;
  display: flex;
  gap: 12px;
}

.trigger-tag {
  margin-right: 4px;
  margin-bottom: 4px;
}
</style> 