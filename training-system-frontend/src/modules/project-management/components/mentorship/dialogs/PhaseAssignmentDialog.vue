<template>
  <div class="phase-assignment-dialog">
    <div class="phase-info">
      <h3>{{ phase?.name }}</h3>
      <p>{{ phase?.description || phase?.objectives }}</p>
    </div>
    
    <!-- 指派方式选择 -->
    <div class="assignment-mode">
      <el-radio-group v-model="assignmentMode">
        <el-radio value="individual">逐一指派（支持一对一配对）</el-radio>
        <el-radio value="batch">批量指派（一个导师负责多个学员）</el-radio>
      </el-radio-group>
    </div>
    
    <!-- 逐一指派模式 -->
    <div v-if="assignmentMode === 'individual'" class="individual-assignment">
      <div class="assignment-list">
        <div class="list-header">
          <h4>师徒配对列表</h4>
          <el-button size="small" @click="addPairing">
            <el-icon><Plus /></el-icon>
            添加配对
          </el-button>
        </div>
        
        <div 
          v-for="(pairing, index) in individualPairings" 
          :key="index"
          class="pairing-item"
        >
          <div class="pairing-content">
            <div class="mentor-selection">
              <label>导师：</label>
              <el-select v-model="pairing.mentorId" placeholder="选择导师" style="width: 200px" @change="(value) => handleMentorChange(index, value)">
                <el-option
                  v-for="mentor in availableMentors"
                  :key="mentor.id"
                  :label="mentor.name"
                  :value="mentor.id"
                />
              </el-select>
            </div>
            
            <div class="student-selection">
              <label>学员：</label>
              <!-- 支持单选和多选两种模式 -->
              <el-select 
                v-model="pairing.studentIds" 
                multiple
                collapse-tags
                collapse-tags-tooltip
                :max-collapse-tags="1"
                placeholder="选择学员" 
                style="width: 300px"
                @change="(value) => handleStudentChange(index, value)"
              >
                <el-option
                  v-for="student in getAvailableStudentsForPairing(index)"
                  :key="student.id"
                  :label="student.name"
                  :value="student.id"
                />
              </el-select>
            </div>
            
            <div class="pairing-actions">
              <el-button 
                size="small" 
                type="danger" 
                @click="removePairing(index)"
                :disabled="individualPairings.length === 1"
              >
                删除
              </el-button>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- 批量指派模式 -->
    <div v-else class="batch-assignment">
      <el-form :model="batchForm" label-width="120px">
        <el-form-item label="选择导师">
          <el-select v-model="batchForm.mentorId" placeholder="请选择导师" style="width: 100%">
            <el-option
              v-for="mentor in availableMentors"
              :key="mentor.id"
              :label="`${mentor.name} (${mentor.department})`"
              :value="mentor.id"
            />
          </el-select>
        </el-form-item>
        
        <el-form-item label="负责学员">
          <div class="students-selection">
            <div class="selection-header">
              <el-checkbox 
                v-model="selectAll" 
                :indeterminate="isIndeterminate"
                @change="handleSelectAll"
              >
                全选 ({{ availableStudents.length }}名学员)
              </el-checkbox>
            </div>
            <el-checkbox-group v-model="batchForm.studentIds" class="students-list">
              <el-checkbox
                v-for="student in availableStudents"
                :key="student.id"
                :value="student.id"
                class="student-checkbox"
              >
                <div class="student-item">
                  <div class="student-name">{{ student.name }}</div>
                  <div class="student-dept">{{ student.department }}</div>
                </div>
              </el-checkbox>
            </el-checkbox-group>
          </div>
        </el-form-item>
      </el-form>
    </div>
    
    <div class="dialog-footer">
      <el-button @click="$emit('cancel')">取消</el-button>
      <el-button type="primary" @click="handleSubmit" :disabled="!canSubmit">确定</el-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { Plus } from '@element-plus/icons-vue'

interface Props {
  phase: any
  students: any[]
  mentors: any[]
}

const props = defineProps<Props>()

const emit = defineEmits<{
  submit: [data: any]
  cancel: []
}>()

// 指派模式
const assignmentMode = ref<'batch' | 'individual'>('individual')

// 批量指派表单
const batchForm = ref({
  mentorId: '',
  studentIds: []
})

// 逐一指派配对
const individualPairings = ref([
  {
    mentorId: '',
    studentIds: []
  }
])

// 可用导师和学员（排除已指派的）
const availableMentors = computed(() => {
  // 这里可以过滤掉已经在该阶段有指派的导师
  return props.mentors
})

const availableStudents = computed(() => {
  // 这里可以过滤掉已经在该阶段有指派的学员
  return props.students
})

// 重置表单数据
const resetFormData = () => {
  // 重置批量指派表单
  batchForm.value.mentorId = ''
  batchForm.value.studentIds = []
  selectAll.value = false
  
  // 重置逐一指派配对
  individualPairings.value = [{
    mentorId: '',
    studentIds: []
  }]
  
  console.log('🔍 表单数据已重置')
}

// 组件挂载时重置数据
onMounted(() => {
  resetFormData()
})

// 监听阶段变化，重置数据
watch(() => props.phase?.id, () => {
  resetFormData()
})

// 全选逻辑
const selectAll = ref(false)
const isIndeterminate = computed(() => {
  const checkedCount = batchForm.value.studentIds.length
  return checkedCount > 0 && checkedCount < availableStudents.value.length
})

const handleSelectAll = (checked: boolean) => {
  if (checked) {
    batchForm.value.studentIds = availableStudents.value.map(s => s.id)
  } else {
    batchForm.value.studentIds = []
  }
  // 更新全选状态
  selectAll.value = checked
}

// 监听学员选择变化，更新全选状态
watch(() => batchForm.value.studentIds, (newIds) => {
  const allIds = availableStudents.value.map(s => s.id)
  if (newIds.length === allIds.length && allIds.every(id => newIds.includes(id))) {
    selectAll.value = true
  } else {
    selectAll.value = false
  }
}, { deep: true })

// 逐一指派相关方法
const addPairing = () => {
  individualPairings.value.push({
    mentorId: '',
    studentIds: []
  })
}

const removePairing = (index: number) => {
  if (individualPairings.value.length > 1) {
    individualPairings.value.splice(index, 1)
  }
}

const getAvailableStudentsForPairing = (currentIndex: number) => {
  // 获取其他配对中已选的学员
  const usedStudentIds = new Set()
  individualPairings.value.forEach((pairing, index) => {
    if (index !== currentIndex) {
      pairing.studentIds.forEach(id => usedStudentIds.add(id))
    }
  })
  
  // 返回未被其他配对使用的学员
  return availableStudents.value.filter(student => !usedStudentIds.has(student.id))
}

// 添加学员选择变化处理
const handleStudentChange = (pairingIndex: number, studentIds: string[]) => {
  console.log('🔍 学员选择变化:', { pairingIndex, studentIds })
  individualPairings.value[pairingIndex].studentIds = studentIds
  console.log('🔍 更新后的配对数据:', individualPairings.value[pairingIndex])
}

// 添加导师选择变化处理
const handleMentorChange = (pairingIndex: number, mentorId: string) => {
  console.log('🔍 导师选择变化:', { pairingIndex, mentorId })
  individualPairings.value[pairingIndex].mentorId = mentorId
  console.log('🔍 更新后的配对数据:', individualPairings.value[pairingIndex])
}

// 提交验证
const canSubmit = computed(() => {
  if (assignmentMode.value === 'batch') {
    const isValid = batchForm.value.mentorId && batchForm.value.studentIds.length > 0
    console.log('🔍 批量指派验证:', { 
      mentorId: batchForm.value.mentorId, 
      studentCount: batchForm.value.studentIds.length,
      isValid 
    })
    return isValid
  } else {
    const validPairings = individualPairings.value.filter(pairing => 
      pairing.mentorId && pairing.studentIds && pairing.studentIds.length > 0
    )
    console.log('🔍 逐一指派验证:', { 
      totalPairings: individualPairings.value.length,
      validPairings: validPairings.length,
      pairings: individualPairings.value
    })
    return validPairings.length > 0
  }
})

const handleSubmit = () => {
  let assignmentData
  
  console.log('🔍 提交指派数据 - 当前模式:', assignmentMode.value)
  console.log('🔍 批量指派表单:', batchForm.value)
  console.log('🔍 逐一指派配对:', individualPairings.value)
  
  if (assignmentMode.value === 'batch') {
    assignmentData = {
      phaseId: props.phase.id,
      mode: 'batch',
      assignments: [{
        mentorId: batchForm.value.mentorId,
        studentIds: batchForm.value.studentIds
      }]
    }
  } else {
    // 过滤有效的配对
    const validPairings = individualPairings.value.filter(pairing => {
      const isValid = pairing.mentorId && pairing.studentIds && pairing.studentIds.length > 0
      console.log('🔍 配对验证:', { pairing, isValid })
      return isValid
    })
    
    if (validPairings.length === 0) {
      console.error('❌ 没有有效的师徒配对')
      return
    }
    
    assignmentData = {
      phaseId: props.phase.id,
      mode: 'individual',
      assignments: validPairings
    }
  }
  
  console.log('🔍 最终提交数据:', assignmentData)
  emit('submit', assignmentData)
}
</script>

<style scoped>
.phase-assignment-dialog {
  padding: 20px;
  max-height: 70vh;
  overflow-y: auto;
}

.phase-info {
  margin-bottom: 20px;
  padding: 16px;
  background: #f8f9fa;
  border-radius: 8px;
}

.phase-info h3 {
  margin: 0 0 8px 0;
  color: #303133;
}

.phase-info p {
  margin: 0;
  color: #606266;
}

.assignment-mode {
  margin-bottom: 24px;
  padding: 16px;
  background: #fff7e6;
  border-radius: 8px;
  border-left: 4px solid #ff9800;
}

.batch-assignment, .individual-assignment {
  margin-bottom: 20px;
}

/* 批量指派样式 */
.students-selection {
  border: 1px solid #e4e7ed;
  border-radius: 8px;
  overflow: hidden;
}

.selection-header {
  padding: 12px 16px;
  background: #f8f9fa;
  border-bottom: 1px solid #e4e7ed;
}

.students-list {
  padding: 16px;
  max-height: 200px;
  overflow-y: auto;
}

.student-checkbox {
  display: block;
  margin-bottom: 12px;
  width: 100%;
}

.student-item {
  margin-left: 8px;
}

.student-name {
  font-weight: 500;
  color: #303133;
}

.student-dept {
  font-size: 12px;
  color: #909399;
}

/* 逐一指派样式 */
.assignment-list {
  border: 1px solid #e4e7ed;
  border-radius: 8px;
  overflow: hidden;
}

.list-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  background: #f8f9fa;
  border-bottom: 1px solid #e4e7ed;
}

.list-header h4 {
  margin: 0;
  color: #303133;
  font-size: 16px;
}

.pairing-item {
  border-bottom: 1px solid #f0f0f0;
}

.pairing-item:last-child {
  border-bottom: none;
}

.pairing-content {
  display: flex;
  align-items: center;
  gap: 20px;
  padding: 16px;
}

.mentor-selection, .student-selection {
  display: flex;
  align-items: center;
  gap: 8px;
}

.mentor-selection label, .student-selection label {
  font-weight: 500;
  color: #606266;
  min-width: 40px;
}

.pairing-actions {
  margin-left: auto;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 20px;
  padding-top: 16px;
  border-top: 1px solid #e4e7ed;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .pairing-content {
    flex-direction: column;
    align-items: stretch;
    gap: 12px;
  }
  
  .mentor-selection, .student-selection {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .mentor-selection label, .student-selection label {
    min-width: auto;
  }
}
</style> 