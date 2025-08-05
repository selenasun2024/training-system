<template>
  <el-card shadow="never" class="observe-page" v-loading="store.loading">
    <template #header>
      <span>观察名单</span>
      <el-button size="small" @click="store.fetchTargets()">刷新</el-button>
    </template>

    <el-tabs v-model="activeTab" type="card" style="margin-top: 16px">
      <el-tab-pane
        v-for="project in grouped"
        :key="project.projectId"
        :name="project.projectId"
      >
        <template #label>
          <span>{{ project.projectName }}</span>
          <el-tag type="danger" size="small" style="margin-left:8px">待观察 {{ project.pending.length }}</el-tag>
        </template>

        <!-- 待观察列表 -->
        <h4>待观察</h4>
        <el-table :data="project.pending" size="small" style="width:100%">
          <el-table-column prop="traineeName" label="学员" width="120" />
          <el-table-column prop="groupName" label="小组组号" width="120" />
          <el-table-column prop="traineeDepartment" label="部门" width="120" />
          <el-table-column prop="draftContent" label="草稿" min-width="200" />
          <el-table-column label="操作" width="120">
            <template #default="{ row }">
              <el-button size="small" type="primary" @click="openEditor(row)">记录</el-button>
            </template>
          </el-table-column>
        </el-table>

        <el-button
          v-if="project.draftsCount > 0"
          size="small"
          type="primary"
          style="margin-top:8px"
          @click="submitProject(project.projectId)"
        >提交本项目</el-button>

        <el-divider />
        <!-- 已提交列表 -->
        <h4>已提交</h4>
        <el-table :data="project.submitted" size="small" style="width:100%">
          <el-table-column prop="traineeName" label="学员" width="120" />
          <el-table-column prop="groupName" label="小组组号" width="120" />
          <el-table-column prop="traineeDepartment" label="部门" width="120" />
          <el-table-column prop="record.content" label="内容" min-width="250" />
          <el-table-column label="操作" width="120">
            <template #default="{ row }">
              <el-button size="small" link type="primary" @click="openEditor(row)">查看 / 编辑</el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-tab-pane>
    </el-tabs>

    <ObservationEditorDialog v-model="editorVisible" :target="editingTarget" @saved="handleSave" />
  </el-card>
</template>

<script setup lang="ts">
import { computed, ref, onMounted, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { useCounselorObservationStore } from '@/stores/counselorObservations'
import type { ObservationTarget } from '@/types/observation'
import ObservationEditorDialog from './ObservationEditorDialog.vue'

const store = useCounselorObservationStore()

const activeTab = ref<string>('')

const grouped = computed(() => {
  const map: Record<string, { projectId: string; projectName: string; pending: ObservationTarget[]; submitted: ObservationTarget[]; draftsCount:number }> = {}
  store.targets.forEach(t => {
    if (!map[t.projectId]) {
      map[t.projectId] = { projectId: t.projectId, projectName: t.projectName, pending: [], submitted: [], draftsCount:0 }
    }
    if (t.status === 'pending' || t.status==='draft') map[t.projectId].pending.push(t)
    if (t.status === 'submitted') map[t.projectId].submitted.push(t)
    if (t.status==='draft') map[t.projectId].draftsCount++
  })
  return Object.values(map)
})

onMounted(async () => {
  await store.fetchTargets()
})

// 监听数据变化，设置默认选中的tab
watch(grouped, (newGrouped) => {
  if (newGrouped.length > 0 && !activeTab.value) {
    activeTab.value = newGrouped[0].projectId
  }
}, { immediate: true })

const editorVisible = ref(false)
const editingTarget = ref<ObservationTarget | undefined>()

function openEditor(target: ObservationTarget) {
  editingTarget.value = target
  editorVisible.value = true
}

async function handleSave(data: { content: string; tags: string[] }) {
  if (!editingTarget.value) return
  if (editingTarget.value.status==='pending' || editingTarget.value.status==='draft') {
    store.saveDraft(editingTarget.value, data.content, data.tags)
    ElMessage.success('已保存草稿')
  } else {
    await store.submit(editingTarget.value, data.content, data.tags)
    ElMessage.success('已更新观察记录')
  }
}

async function submitProject(pid:string){
  await store.submitProject(pid)
  ElMessage.success('该项目观察已提交')
}
</script>

<style scoped>
.observe-page h4 {
  margin: 12px 0 8px;
}
</style> 