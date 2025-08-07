<template>
  <el-dialog
    v-model="visible"
    :title="title"
    :width="width"
    :custom-class="customClass"
    :show-close="showClose"
    :close-on-click-modal="closeOnClickModal"
    :close-on-press-escape="closeOnPressEscape"
    @close="handleClose"
  >
    <div class="safe-dialog-content">
      <slot name="content">
        <div v-html="sanitizedContent"></div>
      </slot>
    </div>
    
    <template #footer>
      <div class="dialog-footer">
        <el-button @click="handleCancel" v-if="showCancelButton">
          {{ cancelButtonText }}
        </el-button>
        <el-button 
          type="primary" 
          @click="handleConfirm"
          :loading="confirmLoading"
          v-if="showConfirmButton"
        >
          {{ confirmButtonText }}
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import DOMPurify from 'dompurify'

interface Props {
  modelValue: boolean
  title: string
  content?: string
  width?: string
  customClass?: string
  showClose?: boolean
  closeOnClickModal?: boolean
  closeOnPressEscape?: boolean
  showCancelButton?: boolean
  showConfirmButton?: boolean
  cancelButtonText?: string
  confirmButtonText?: string
  confirmLoading?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  width: '50%',
  showClose: true,
  closeOnClickModal: true,
  closeOnPressEscape: true,
  showCancelButton: true,
  showConfirmButton: true,
  cancelButtonText: '取消',
  confirmButtonText: '确定',
  confirmLoading: false
})

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  'confirm': []
  'cancel': []
  'close': []
}>()

const visible = ref(props.modelValue)

// 监听外部modelValue变化
watch(() => props.modelValue, (newVal) => {
  visible.value = newVal
})

// 监听内部visible变化
watch(visible, (newVal) => {
  emit('update:modelValue', newVal)
})

// 安全的HTML内容（防XSS）
const sanitizedContent = computed(() => {
  if (!props.content) return ''
  
  // 使用DOMPurify清理HTML，防止XSS攻击
  return DOMPurify.sanitize(props.content, {
    ALLOWED_TAGS: ['div', 'span', 'p', 'br', 'strong', 'em', 'ul', 'ol', 'li', 'input', 'select', 'option', 'label'],
    ALLOWED_ATTR: ['class', 'id', 'type', 'value', 'name', 'placeholder', 'required'],
    FORBID_TAGS: ['script', 'object', 'embed', 'iframe', 'form', 'button'],
    FORBID_ATTR: ['onclick', 'onload', 'onerror', 'onmouseover', 'onfocus', 'onblur']
  })
})

const handleConfirm = () => {
  emit('confirm')
}

const handleCancel = () => {
  visible.value = false
  emit('cancel')
}

const handleClose = () => {
  visible.value = false
  emit('close')
}
</script>

<style scoped>
.safe-dialog-content {
  max-height: 60vh;
  overflow-y: auto;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

/* 安全样式：防止CSS注入 */
.safe-dialog-content :deep(*) {
  max-width: 100% !important;
  position: static !important;
}

.safe-dialog-content :deep(input) {
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  padding: 8px 12px;
  font-size: 14px;
  outline: none;
  transition: border-color 0.2s;
}

.safe-dialog-content :deep(input:focus) {
  border-color: #409eff;
}

.safe-dialog-content :deep(select) {
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  padding: 8px 12px;
  font-size: 14px;
  outline: none;
  background-color: white;
}

.safe-dialog-content :deep(label) {
  display: inline-block;
  margin-bottom: 4px;
  font-weight: 500;
  color: #606266;
}
</style>
