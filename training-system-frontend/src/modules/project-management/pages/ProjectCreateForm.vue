<template>
  <div class="project-create-page">
    <!-- 页面标题 -->
    <div class="page-header">
      <div class="header-content">
        <h1>创建新项目</h1>
        <p>请填写项目的基本信息，完成后将创建项目并跳转到详细配置页面</p>
      </div>
    </div>

    <!-- 基本信息表单区域 -->
    <div class="form-container">
      <el-card shadow="hover" class="form-card">
        <template #header>
          <div class="card-header">
            <span class="header-title">项目基本信息</span>
            <el-tag type="info">必填信息</el-tag>
          </div>
        </template>
        
        <!-- 基本信息表单 -->
        <el-form 
          ref="formRef" 
          :model="formData" 
          :rules="formRules" 
          label-width="120px" 
          class="create-form"
        >
          <el-row :gutter="24">
            <el-col :span="12">
              <el-form-item label="项目类型" prop="type">
                <el-select 
                  v-model="formData.type" 
                  placeholder="请选择项目类型" 
                  style="width: 100%"
                  @change="handleTypeChange"
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
              <el-form-item label="项目名称" prop="name">
                <el-input v-model="formData.name" placeholder="请输入项目名称" />
              </el-form-item>
            </el-col>
            <el-col :span="24">
              <el-form-item label="项目时间" prop="dateRange">
                <el-date-picker
                  v-model="formData.dateRange"
                  type="daterange"
                  range-separator="至"
                  start-placeholder="开始日期"
                  end-placeholder="结束日期"
                  format="YYYY-MM-DD"
                  value-format="YYYY-MM-DD"
                  style="width: 100%"
                />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="组织单位" prop="org">
                <el-input v-model="formData.org" placeholder="请输入组织单位" />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="项目负责人" prop="owner">
                <el-input v-model="formData.owner" placeholder="请输入项目负责人" />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="培训对象" prop="target">
                <el-input v-model="formData.target" placeholder="请输入培训对象" />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="培训地点" prop="location">
                <el-input v-model="formData.location" placeholder="请输入培训地点" />
              </el-form-item>
            </el-col>
            <el-col :span="24">
              <el-form-item label="项目目标" prop="goal">
                <el-input v-model="formData.goal" placeholder="请输入项目目标" />
              </el-form-item>
            </el-col>
            <el-col :span="24">
              <el-form-item label="项目简介" prop="description">
                <el-input 
                  v-model="formData.description" 
                  type="textarea" 
                  :rows="3" 
                  placeholder="请输入项目简介" 
                />
              </el-form-item>
            </el-col>
            <el-col :span="24">
              <el-form-item label="备注">
                <el-input 
                  v-model="formData.remark" 
                  type="textarea" 
                  :rows="2" 
                  placeholder="请输入备注（可选）" 
                />
              </el-form-item>
            </el-col>
          </el-row>
        </el-form>
      </el-card>
    </div>

    <!-- 操作按钮 -->
    <div class="action-buttons">
      <el-button @click="handleCancel" size="large">
        取消
      </el-button>
      <el-button 
        type="primary" 
        @click="handleCreateProject" 
        :loading="creating"
        size="large"
      >
        创建项目
      </el-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage, ElMessageBox } from 'element-plus';
import { useSystemConfigStore } from '@/stores/systemConfig';
import { createProject } from '@/api/modules/project';
import type { ProjectCreateDto } from '@/api/modules/project';

const router = useRouter();
const systemConfigStore = useSystemConfigStore();
const projectTypes = computed(() => systemConfigStore.projectTypes);

// 表单引用和创建状态
const formRef = ref();
const creating = ref(false);

// 表单数据
const formData = reactive({
  type: '',
  name: '',
  dateRange: [],
  org: '',
  owner: '',
  target: '',
  location: '',
  goal: '',
  description: '',
  remark: ''
});

// 表单验证规则
const formRules = {
  type: [{ required: true, message: '请选择项目类型', trigger: 'change' }],
  name: [{ required: true, message: '请输入项目名称', trigger: 'blur' }],
  dateRange: [{ required: true, message: '请选择项目时间', trigger: 'change' }],
  // org 和 owner 改为选填项，不再是必填
};

// 处理项目类型变化
const handleTypeChange = (value: string) => {
  console.log('项目类型变化:', value);
};

// 处理取消操作
const handleCancel = async () => {
  // 检查是否有未保存的内容
  const hasContent = Object.values(formData).some(value => 
    Array.isArray(value) ? value.length > 0 : value
  );
  
  if (hasContent) {
    try {
      await ElMessageBox.confirm(
        '您填写的信息将会丢失，确定要取消吗？',
        '确认取消',
        {
          confirmButtonText: '确定取消',
          cancelButtonText: '继续编辑',
          type: 'warning'
        }
      );
    } catch {
      return; // 用户选择继续编辑
    }
  }
  
  router.push({ name: 'ProjectList' });
};

// 处理创建项目
const handleCreateProject = async () => {
  try {
    // 表单验证
    const valid = await formRef.value?.validate();
    if (!valid) {
      return;
    }

    creating.value = true;

    // 准备项目数据
    const projectData: ProjectCreateDto = {
      name: formData.name,
      description: formData.description,
      type: formData.type,
      startDate: formData.dateRange[0],
      endDate: formData.dateRange[1],
      estimatedDuration: formData.dateRange.length === 2 ? 
        Math.ceil((new Date(formData.dateRange[1]).getTime() - new Date(formData.dateRange[0]).getTime()) / (1000 * 60 * 60 * 24)) : undefined,
      config: {
        type: formData.type,
        org: formData.org,
        owner: formData.owner,
        target: formData.target,
        location: formData.location,
        goal: formData.goal,
        remark: formData.remark,
      }
    };

    console.log('创建项目数据:', projectData);

    // 调用API创建项目
    const result = await createProject(projectData);
    
    ElMessage.success('项目创建成功！');
    
    // 跳转到项目详情页面
    router.push({ name: 'ProjectDetail', params: { id: result.id } });
    
  } catch (error) {
    console.error('创建项目失败:', error);
    ElMessage.error('创建项目失败，请稍后重试');
  } finally {
    creating.value = false;
  }
};

// 页面初始化
onMounted(async () => {
  await systemConfigStore.loadProjectTypes();
});
</script>

<style scoped>
.project-create-page {
  min-height: 100vh;
  background-color: #f5f7fa;
  padding: 20px;
}

.page-header {
  text-align: center;
  margin-bottom: 30px;
}

.header-content h1 {
  color: #2c3e50;
  margin-bottom: 8px;
  font-size: 28px;
  font-weight: 600;
}

.header-content p {
  color: #7f8c8d;
  font-size: 16px;
  margin: 0;
}

.form-container {
  max-width: 900px;
  margin: 0 auto;
  margin-bottom: 30px;
}

.form-card {
  border-radius: 12px;
  border: 1px solid #e4e7ed;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-title {
  font-size: 18px;
  font-weight: 600;
  color: #2c3e50;
}

.create-form {
  padding: 20px 0;
}

.action-buttons {
  text-align: center;
  max-width: 900px;
  margin: 0 auto;
  padding: 20px 0;
}

.action-buttons .el-button {
  margin: 0 10px;
  min-width: 120px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .project-create-page {
    padding: 15px;
  }
  
  .form-container {
    max-width: 100%;
  }
  
  .header-content h1 {
    font-size: 24px;
  }
  
  .header-content p {
    font-size: 14px;
  }
}
</style> 