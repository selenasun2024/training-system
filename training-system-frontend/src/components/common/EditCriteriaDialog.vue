<template>
  <el-dialog
    v-model="visible"
    :title="title"
    width="700px"
    :close-on-click-modal="false"
    :close-on-press-escape="false"
    custom-class="edit-criteria-dialog"
  >
    <div class="edit-criteria-content">
      <el-form
        ref="formRef"
        :model="formData"
        :rules="formRules"
        label-width="120px"
        label-position="left"
      >
        <!-- 导师考核指标 -->
        <div class="section mentor-section">
          <h4 class="section-title">👤 导师考核指标</h4>
          <div class="form-grid">
            <el-form-item label="带教成功率" prop="mentorSuccessRate">
              <el-input-number
                v-model="formData.mentorSuccessRate"
                :min="0"
                :max="100"
                :precision="0"
                controls-position="right"
                style="width: 100%"
              />
              <span class="form-help">%</span>
            </el-form-item>
            
            <el-form-item label="教案记录" prop="mentorHasTeachingMaterials">
              <el-select v-model="formData.mentorHasTeachingMaterials" style="width: 100%">
                <el-option label="完整" :value="true" />
                <el-option label="不完整" :value="false" />
              </el-select>
            </el-form-item>
            
            <el-form-item label="投诉事故" prop="mentorHasComplaints">
              <el-select v-model="formData.mentorHasComplaints" style="width: 100%">
                <el-option label="无投诉" :value="false" />
                <el-option label="有投诉" :value="true" />
              </el-select>
            </el-form-item>
          </div>
        </div>

        <!-- 学员考核指标 -->
        <div class="section students-section">
          <h4 class="section-title">👨‍🎓 学员考核指标</h4>
          <div class="students-list">
            <div
              v-for="(student, index) in formData.students"
              :key="index"
              class="student-form-card"
            >
              <div class="student-header">
                <strong>{{ student.name }}</strong>
                <span class="student-dept">({{ student.department }})</span>
              </div>
              
              <div class="student-form-grid">
                <el-form-item 
                  :label="`学员${index + 1}就业状态`" 
                  :prop="`students.${index}.employment`"
                  class="grid-item"
                >
                  <el-select v-model="student.employment" style="width: 100%">
                    <el-option label="在职" :value="true" />
                    <el-option label="离职" :value="false" />
                  </el-select>
                </el-form-item>
                
                <el-form-item 
                  :label="`学员${index + 1}评价分数`" 
                  :prop="`students.${index}.evaluationScore`"
                  class="grid-item"
                >
                  <el-input-number
                    v-model="student.evaluationScore"
                    :min="0"
                    :max="100"
                    :precision="0"
                    controls-position="right"
                    style="width: 100%"
                  />
                </el-form-item>
                
                <el-form-item 
                  :label="`学员${index + 1}投诉情况`" 
                  :prop="`students.${index}.hasComplaints`"
                  class="grid-item"
                >
                  <el-select v-model="student.hasComplaints" style="width: 100%">
                    <el-option label="无投诉" :value="false" />
                    <el-option label="有投诉" :value="true" />
                  </el-select>
                </el-form-item>
                
                <el-form-item 
                  :label="`学员${index + 1}带教时长`" 
                  :prop="`students.${index}.duration`"
                  class="grid-item"
                >
                  <el-input-number
                    v-model="student.duration"
                    :min="1"
                    :max="12"
                    :precision="0"
                    controls-position="right"
                    style="width: 100%"
                  />
                  <span class="form-help">个月</span>
                </el-form-item>
              </div>
            </div>
          </div>
        </div>
      </el-form>
    </div>

    <template #footer>
      <div class="dialog-footer">
        <el-button @click="handleCancel">取消</el-button>
        <el-button type="primary" @click="handleConfirm" :loading="saving">
          保存
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, reactive, watch, nextTick } from 'vue'
import type { FormInstance, FormRules } from 'element-plus'
import { ElMessage } from 'element-plus'

interface StudentCriteria {
  name: string
  department: string
  employment: boolean
  evaluationScore: number
  hasComplaints: boolean
  duration: number
}

interface CriteriaFormData {
  mentorSuccessRate: number
  mentorHasTeachingMaterials: boolean
  mentorHasComplaints: boolean
  students: StudentCriteria[]
}

interface Props {
  modelValue: boolean
  title: string
  initialData: CriteriaFormData
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: false,
  title: '编辑考核指标'
})

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  'confirm': [data: CriteriaFormData]
  'cancel': []
}>()

const visible = ref(props.modelValue)
const saving = ref(false)
const formRef = ref<FormInstance>()

// 表单数据 - 深拷贝初始数据
const formData = reactive<CriteriaFormData>({
  mentorSuccessRate: 0,
  mentorHasTeachingMaterials: false,
  mentorHasComplaints: false,
  students: []
})

// 表单验证规则
const formRules: FormRules = {
  mentorSuccessRate: [
    { required: true, message: '请输入带教成功率', trigger: 'blur' },
    { type: 'number', min: 0, max: 100, message: '带教成功率必须在0-100之间', trigger: 'blur' }
  ],
  mentorHasTeachingMaterials: [
    { required: true, message: '请选择教案记录状态', trigger: 'change' }
  ],
  mentorHasComplaints: [
    { required: true, message: '请选择投诉事故状态', trigger: 'change' }
  ]
}

// 监听props变化
watch(() => props.modelValue, (newVal) => {
  visible.value = newVal
  if (newVal) {
    // 对话框打开时，重置表单数据
    resetFormData()
  }
})

watch(visible, (newVal) => {
  emit('update:modelValue', newVal)
})

// 重置表单数据
const resetFormData = () => {
  formData.mentorSuccessRate = props.initialData.mentorSuccessRate || 0
  formData.mentorHasTeachingMaterials = props.initialData.mentorHasTeachingMaterials || false
  formData.mentorHasComplaints = props.initialData.mentorHasComplaints || false
  formData.students = props.initialData.students.map(student => ({ ...student })) || []
  
  // 动态添加学员验证规则
  nextTick(() => {
    addStudentValidationRules()
  })
}

// 动态添加学员验证规则
const addStudentValidationRules = () => {
  formData.students.forEach((_, index) => {
    formRules[`students.${index}.employment`] = [
      { required: true, message: '请选择就业状态', trigger: 'change' }
    ]
    formRules[`students.${index}.evaluationScore`] = [
      { required: true, message: '请输入评价分数', trigger: 'blur' },
      { type: 'number', min: 0, max: 100, message: '评价分数必须在0-100之间', trigger: 'blur' }
    ]
    formRules[`students.${index}.hasComplaints`] = [
      { required: true, message: '请选择投诉情况', trigger: 'change' }
    ]
    formRules[`students.${index}.duration`] = [
      { required: true, message: '请输入带教时长', trigger: 'blur' },
      { type: 'number', min: 1, max: 12, message: '带教时长必须在1-12个月之间', trigger: 'blur' }
    ]
  })
}

// 表单验证
const validateForm = async (): Promise<boolean> => {
  if (!formRef.value) return false
  
  try {
    await formRef.value.validate()
    return true
  } catch (error) {
    ElMessage.error('请检查表单填写是否完整')
    return false
  }
}

// 确认保存
const handleConfirm = async () => {
  const isValid = await validateForm()
  if (!isValid) return
  
  saving.value = true
  
  try {
    // 这里可以添加保存逻辑，比如API调用
    await new Promise(resolve => setTimeout(resolve, 500)) // 模拟保存延迟
    
    emit('confirm', { ...formData })
    visible.value = false
    ElMessage.success('保存成功')
  } catch (error) {
    ElMessage.error('保存失败，请重试')
  } finally {
    saving.value = false
  }
}

// 取消
const handleCancel = () => {
  visible.value = false
  emit('cancel')
}

// 初始化
resetFormData()
</script>

<style scoped>
.edit-criteria-content {
  font-family: 'Microsoft YaHei', Arial, sans-serif;
}

.section {
  margin-bottom: 24px;
  padding: 16px;
  background: #fafafa;
  border-radius: 8px;
  border-left: 4px solid;
}

.mentor-section {
  border-left-color: #409eff;
}

.students-section {
  border-left-color: #67c23a;
}

.section-title {
  margin: 0 0 16px 0;
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
}

.form-help {
  margin-left: 8px;
  color: #909399;
  font-size: 12px;
}

.students-list {
  max-height: 400px;
  overflow-y: auto;
}

.student-form-card {
  margin-bottom: 16px;
  padding: 16px;
  background: white;
  border-radius: 6px;
  border: 1px solid #e4e7ed;
}

.student-header {
  margin-bottom: 12px;
  padding-bottom: 8px;
  border-bottom: 1px solid #ebeef5;
  font-size: 14px;
}

.student-dept {
  color: #909399;
  font-weight: normal;
  margin-left: 8px;
}

.student-form-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}

.grid-item {
  margin-bottom: 0 !important;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

/* 滚动条样式 */
.students-list::-webkit-scrollbar {
  width: 6px;
}

.students-list::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 3px;
}

.students-list::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 3px;
}

.students-list::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}
</style>

<style>
.edit-criteria-dialog {
  --el-dialog-padding-primary: 20px;
}

.edit-criteria-dialog .el-dialog__body {
  padding: 20px;
  max-height: 70vh;
  overflow-y: auto;
}

.edit-criteria-dialog .el-form-item__label {
  font-size: 13px;
  color: #606266;
}

.edit-criteria-dialog .el-input-number {
  width: 100%;
}
</style>
