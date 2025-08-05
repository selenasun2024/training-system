<template>
  <el-dialog :model-value="visible" @update:model-value="$emit('update:visible', $event)" title="阶段评估" width="700px">
    <div v-if="mentoringPair">
      <h4>{{ mentoringPair.mentor?.name }} → {{ mentoringPair.mentee?.name }}</h4>
      <el-form label-width="100px">
        <el-form-item label="评估类型">
          <el-select v-model="evaluationType">
            <el-option label="月度评估" value="monthly" />
            <el-option label="季度评估" value="quarterly" />
            <el-option label="阶段评估" value="stage" />
          </el-select>
        </el-form-item>
        <el-form-item label="综合评分">
          <el-rate v-model="overallRating" :max="5" show-text />
        </el-form-item>
        <el-form-item label="评估内容">
          <el-input v-model="evaluationContent" type="textarea" :rows="4" placeholder="请输入评估内容" />
        </el-form-item>
        <el-form-item label="改进建议">
          <el-input v-model="improvements" type="textarea" :rows="3" placeholder="请输入改进建议" />
        </el-form-item>
      </el-form>
    </div>
    
    <template #footer>
      <el-button @click="$emit('update:visible', false)">取消</el-button>
      <el-button type="primary" @click="handleEvaluate">提交评估</el-button>
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
  (e: 'evaluate', data: any): void
}>()

const evaluationType = ref('monthly')
const overallRating = ref(4)
const evaluationContent = ref('')
const improvements = ref('')

const handleEvaluate = () => {
  const data = {
    type: evaluationType.value,
    rating: overallRating.value,
    content: evaluationContent.value,
    improvements: improvements.value
  }
  
  emit('evaluate', data)
  emit('update:visible', false)
  ElMessage.success('评估已提交')
}
</script> 