<template>
  <div class="plan-create-page">
    <el-card shadow="never">
      <template #header>
        <div class="page-header">
          <el-button :icon="ArrowLeft" circle @click="goBack" />
          <h2 class="ml-2">新建培训计划</h2>
        </div>
      </template>

      <!-- Steps -->
      <el-steps :active="activeStep" finish-status="success">
        <el-step title="基本信息" />
        <el-step title="协作人" />
        <el-step title="确认提交" />
      </el-steps>

      <div class="step-content mt-4">
        <!-- Step 1: Basic Info -->
        <template v-if="activeStep === 0">
          <el-form ref="basicForm" :model="plan" :rules="rules" label-width="120px">
            <el-form-item label="计划名称" prop="name">
              <el-input v-model="plan.name" placeholder="请输入计划名称" />
            </el-form-item>

            <el-form-item label="培训类型" prop="type">
              <el-select v-model="plan.type" placeholder="请选择培训类型" style="width: 100%">
                <el-option v-for="type in projectTypes" :key="type.code" :label="type.name" :value="type.code" />
              </el-select>
            </el-form-item>

            <el-form-item label="计划周期" prop="dateRange">
              <el-date-picker
                v-model="plan.dateRange"
                type="daterange"
                range-separator="~"
                start-placeholder="开始日期"
                end-placeholder="结束日期"
                style="width: 100%"
              />
            </el-form-item>

            <el-form-item label="计划描述" prop="description">
              <el-input
                v-model="plan.description"
                type="textarea"
                rows="4"
                placeholder="请输入计划描述"
              />
            </el-form-item>
          </el-form>
        </template>

        <!-- Step 2: Collaborators -->
        <template v-else-if="activeStep === 1">
          <div>
            <el-button type="primary" :icon="Plus" @click="openUserPicker">添加协作人</el-button>
            <el-table :data="plan.collaborators" stripe class="mt-2" v-if="plan.collaborators.length">
              <el-table-column prop="name" label="姓名" width="120" />
              <el-table-column prop="role" label="协作角色" width="160" />
              <el-table-column label="操作" width="100">
                <template #default="{ row }">
                  <el-button type="danger" link @click="removeCollaborator(row)">移除</el-button>
                </template>
              </el-table-column>
            </el-table>
            <el-empty v-else description="暂未添加协作人" />
          </div>
        </template>

        <!-- Step 3: Confirm -->
        <template v-else>
          <el-descriptions :column="2" border>
            <el-descriptions-item label="计划名称">{{ plan.name }}</el-descriptions-item>
            <el-descriptions-item label="培训类型">{{ plan.type }}</el-descriptions-item>
            <el-descriptions-item label="计划周期">
              {{ plan.dateRange && plan.dateRange[0] }} ~ {{ plan.dateRange && plan.dateRange[1] }}
            </el-descriptions-item>
            <el-descriptions-item label="协作人" :span="2">
              <span v-if="plan.collaborators.length">
                {{ plan.collaborators.map(c => c.name).join('，') }}
              </span>
              <span v-else>无</span>
            </el-descriptions-item>
            <el-descriptions-item label="计划描述" :span="2">{{ plan.description }}</el-descriptions-item>
          </el-descriptions>
        </template>
      </div>

      <!-- Actions -->
      <div class="step-actions mt-4">
        <el-button v-if="activeStep > 0" @click="prevStep">上一步</el-button>
        <el-button v-if="activeStep < 2" type="primary" @click="nextStep">下一步</el-button>
        <el-button v-if="activeStep === 2" type="success" @click="submitPlan">创建计划</el-button>
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ArrowLeft, Plus } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { useDictStore } from '@/stores/dict'

interface Collaborator {
  id: string
  name: string
  role: string
}

const router = useRouter()

const activeStep = ref(0)

const plan = reactive({
  name: '',
  type: '',
  dateRange: [] as string[],
  description: '',
  collaborators: [] as Collaborator[],
})

const dictStore = useDictStore()
onMounted(() => dictStore.loadProjectTypes())
const projectTypes = computed(() => dictStore.projectTypes)

const rules = {
  name: [{ required: true, message: '请输入计划名称', trigger: 'blur' }],
  type: [{ required: true, message: '请选择培训类型', trigger: 'change' }],
  dateRange: [{ type: 'array', required: true, message: '请选择计划周期', trigger: 'change' }],
}

const goBack = () => {
  router.back()
}

const nextStep = () => {
  if (activeStep.value === 0) {
    // 校验基本信息表单
    const form = (refs.basicForm as any)
    form.validate((valid: boolean) => {
      if (valid) activeStep.value += 1
    })
  } else {
    activeStep.value += 1
  }
}

const prevStep = () => {
  activeStep.value -= 1
}

const submitPlan = () => {
  // 这里应该调用后端 API 保存计划
  ElMessage.success('新计划已创建！')
  router.push({ name: 'PlanManagement' })
}

// Mock: 打开用户选择器（可用弹窗）
const openUserPicker = () => {
  // This is just a mock implementation; in real app you'd open a dialog
  plan.collaborators.push({ id: Date.now() + '', name: '示例用户', role: '内容协作人' })
}

const removeCollaborator = (row: Collaborator) => {
  const idx = plan.collaborators.indexOf(row)
  if (idx !== -1) plan.collaborators.splice(idx, 1)
}
</script>

<style scoped>
.plan-create-page {
  padding: 20px;
}
.page-header {
  display: flex;
  align-items: center;
}
.ml-2 {
  margin-left: 8px;
}
.mt-2 {
  margin-top: 8px;
}
.mt-4 {
  margin-top: 16px;
}
.step-content {
  min-height: 300px;
}
.step-actions {
  text-align: right;
}
</style> 