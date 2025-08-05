<template>
  <el-dialog :model-value="visible" @update:model-value="$emit('update:visible', $event)" title="进度跟踪" width="600px">
    <div v-if="mentoringPair">
      <h4>{{ mentoringPair.mentor?.name }} → {{ mentoringPair.mentee?.name }}</h4>
      <div class="progress-content">
        <el-form label-width="100px">
          <el-form-item label="当前进度">
            <el-slider v-model="currentProgress" :max="100" show-input />
          </el-form-item>
          <el-form-item label="完成任务">
            <el-input-number v-model="completedTasks" :min="0" />
          </el-form-item>
          <el-form-item label="进度说明">
            <el-input v-model="progressNote" type="textarea" :rows="3" />
          </el-form-item>
        </el-form>
      </div>
    </div>
    
    <template #footer>
      <el-button @click="$emit('update:visible', false)">取消</el-button>
      <el-button type="primary" @click="handleUpdate">更新进度</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { ElMessage } from 'element-plus'

const props = defineProps<{
  visible: boolean
  mentoringPair: any
}>()

const emit = defineEmits<{
  (e: 'update:visible', value: boolean): void
}>()

const currentProgress = ref(50)
const completedTasks = ref(0)
const progressNote = ref('')

const handleUpdate = () => {
  ElMessage.success('进度已更新')
  emit('update:visible', false)
}
</script> 