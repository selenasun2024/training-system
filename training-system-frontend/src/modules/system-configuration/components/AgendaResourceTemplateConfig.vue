<template>
  <div class="agenda-resource-template-config">
    <el-button type="primary" size="small" @click="openAdd">新增模板</el-button>

    <el-table :data="templates" class="mt-2" border>
      <el-table-column prop="agendaType" label="议程类型" />
      <el-table-column prop="resources" label="资源项" :formatter="fmtResources" />
      <el-table-column label="操作" width="100">
        <template #default="{ row }">
          <el-button size="small" type="text" @click="edit(row)">配置</el-button>
        </template>
      </el-table-column>
    </el-table>

    <el-dialog v-model="dialogVisible" title="模板配置" width="600px">
      <p>此处为简化示例，后续可替换为动态资源列表编辑器。</p>
      <p>议程类型：{{ current?.agendaType }}</p>
      <el-input type="textarea" v-model="resourceInput" placeholder="逗号分隔资源" rows="3" />
      <template #footer>
        <el-button @click="dialogVisible=false">取消</el-button>
        <el-button type="primary" @click="save">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

interface Template {
  id: string
  agendaType: string
  resources: string[]
}

const templates = ref<Template[]>([
  { id: '1', agendaType: '面授课程', resources: ['课程PPT', '满意度问卷', '授课场地'] },
])

const dialogVisible = ref(false)
const current = ref<Template | null>(null)
const resourceInput = ref('')

function fmtResources(_: any, __: any, value: string[]) {
  return value.join('、')
}

function openAdd() {
  current.value = { id: Date.now().toString(), agendaType: '', resources: [] }
  resourceInput.value = ''
  dialogVisible.value = true
}
function edit(t: Template) {
  current.value = { ...t }
  resourceInput.value = t.resources.join(',')
  dialogVisible.value = true
}
function save() {
  if (!current.value) return
  current.value.resources = resourceInput.value.split(',').map((s) => s.trim()).filter(Boolean)
  const idx = templates.value.findIndex((t) => t.id === current.value?.id)
  if (idx >= 0) templates.value[idx] = { ...current.value }
  else templates.value.push({ ...current.value })
  dialogVisible.value = false
}
</script>

<style scoped>
.mt-2 {
  margin-top: 12px;
}
</style> 