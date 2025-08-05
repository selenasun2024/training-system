<template>
  <el-dialog :model-value="visible" @update:model-value="$emit('update:visible', $event)" title="建立师徒关系" width="600px">
    <el-form :model="form" label-width="100px">
      <el-form-item label="师傅" required>
        <el-select v-model="form.mentorId" placeholder="请选择师傅">
          <el-option label="张资深 - 高级架构师" value="mentor-1" />
          <el-option label="李专家 - 产品总监" value="mentor-2" />
        </el-select>
      </el-form-item>
      <el-form-item label="徒弟" required>
        <el-select v-model="form.menteeId" placeholder="请选择徒弟">
          <el-option label="王新人 - 初级工程师" value="mentee-1" />
          <el-option label="陈学员 - 产品助理" value="mentee-2" />
        </el-select>
      </el-form-item>
      <el-form-item label="带教类型">
        <el-select v-model="form.type" placeholder="请选择类型">
          <el-option label="新员工培养" value="newcomer" />
          <el-option label="转岗培训" value="transfer" />
          <el-option label="技能提升" value="skill" />
        </el-select>
      </el-form-item>
      <el-form-item label="计划周期">
        <el-input-number v-model="form.duration" :min="1" :max="24" />
        <span style="margin-left: 8px">个月</span>
      </el-form-item>
    </el-form>
    
    <template #footer>
      <el-button @click="$emit('update:visible', false)">取消</el-button>
      <el-button type="primary" @click="handleCreate">确定</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { reactive } from 'vue'
import { ElMessage } from 'element-plus'

const props = defineProps<{
  visible: boolean
}>()

const emit = defineEmits<{
  (e: 'update:visible', value: boolean): void
  (e: 'create', data: any): void
}>()

const form = reactive({
  mentorId: '',
  menteeId: '',
  type: '',
  duration: 6
})

const handleCreate = () => {
  if (!form.mentorId || !form.menteeId) {
    ElMessage.error('请选择师傅和徒弟')
    return
  }
  
  emit('create', { ...form })
  emit('update:visible', false)
  
  // 重置表单
  Object.assign(form, {
    mentorId: '',
    menteeId: '',
    type: '',
    duration: 6
  })
}
</script> 