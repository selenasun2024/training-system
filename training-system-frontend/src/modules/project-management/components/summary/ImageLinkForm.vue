<template>
  <el-form :model="form" inline @submit.prevent>
    <el-form-item label="图片链接">
      <el-input v-model="form.url" placeholder="http(s)://" style="width:300px" />
    </el-form-item>
    <el-form-item label="描述">
      <el-input v-model="form.desc" placeholder="可选" style="width:200px" />
    </el-form-item>
    <el-button type="primary" @click="insert" :disabled="!validUrl">插入</el-button>
  </el-form>
</template>

<script setup lang="ts">
import { reactive, computed } from 'vue'

const emits = defineEmits(['insert'])

const form = reactive({ url: '', desc: '' })

const validUrl = computed(() => /^https?:\/\//.test(form.url))

function insert() {
  if (!validUrl.value) return
  emits('insert', { url: form.url, desc: form.desc })
  form.url = ''
  form.desc = ''
}
</script> 