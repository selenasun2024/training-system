<template>
  <el-dialog v-model="visible" title="AI 生成新闻稿" width="700px">
    <el-input
      type="textarea"
      :rows="10"
      v-model="draftContent"
      placeholder="AI 生成的新闻稿内容..."
    />
    <template #footer>
      <span class="dialog-footer">
        <el-button @click="visible=false">取 消</el-button>
        <el-button type="primary" @click="confirm">插 入</el-button>
      </span>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'

const props = defineProps<{ modelValue: boolean }>()
const emits = defineEmits(['update:modelValue', 'confirm'])

const visible = ref(props.modelValue)
watch(()=>props.modelValue, v=> visible.value = v)
watch(visible, v=> emits('update:modelValue', v))

const draftContent = ref('【AI 初稿示例】\n\n标题：培训结业典礼圆满落幕\n\n导语：在为期三天的干部入模子培训后...')

function confirm(){
  emits('confirm', draftContent.value)
  visible.value=false
}
</script> 