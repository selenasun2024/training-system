<template>
  <el-upload
    class="uploader"
    action="#"        
    :file-list="fileList"
    :auto-upload="false"
    :before-upload="beforeUpload"
    list-type="text"
    drag
  >
    <i class="el-icon-upload"></i>
    <div class="el-upload__text">将文件拖到此处，或<em>点击上传</em></div>
  </el-upload>
</template>

<script setup lang="ts">
import { ref, watchEffect } from 'vue'

const props = defineProps<{ modelValue: any[] }>()
const emits = defineEmits(['update:modelValue'])

const fileList = ref<any[]>(props.modelValue || [])

watchEffect(() => {
  emits('update:modelValue', fileList.value)
})

function beforeUpload() {
  // 留空，不上传，交由父级统一处理
  return false
}
</script> 