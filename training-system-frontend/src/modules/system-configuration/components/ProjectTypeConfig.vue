<template>
  <div class="project-type-config">
    <el-card shadow="never">
      <template #header>
        <span>项目类型管理</span>
        <el-button type="primary" size="small" @click="openTypeDialog" style="float:right">新增类型</el-button>
      </template>
      <el-table :data="projectTypes" border>
        <el-table-column prop="name" label="类型名称" width="240" />
        <el-table-column prop="remindDays" label="提前提醒时间(天)" width="180" />
        <el-table-column label="操作" width="140">
          <template #default="{ row }">
            <el-button type="text" size="small" @click="editType(row)">编辑</el-button>
            <el-button type="text" size="small" @click="confirmDelete(row.id)" style="color:#f56c6c">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
    <el-dialog v-model="typeDialogVisible" title="项目类型" width="360px">
      <el-form :model="typeForm" label-width="100px">
        <el-form-item label="类型名称">
          <el-input v-model="typeForm.name" />
        </el-form-item>
        <el-form-item label="提醒天数">
          <el-input-number v-model="typeForm.remindDays" :min="0" :max="365" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="typeDialogVisible=false">取消</el-button>
        <el-button type="primary" @click="saveType">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>
<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessageBox, ElMessage } from 'element-plus'
import { useSystemConfigStore } from '@/stores/systemConfig';

const store = useSystemConfigStore();
const projectTypes = computed(() => store.projectTypes);

const typeDialogVisible = ref(false)
const typeForm = reactive({ 
  id: '', 
  name: '', 
  remindDays: 7,
})

onMounted(() => {
  store.loadProjectTypes();
});

function openTypeDialog() {
  typeForm.id = ''
  typeForm.name = ''
  typeForm.remindDays = 7
  typeDialogVisible.value = true
}

function editType(row: any) {
  typeForm.id = row.id
  typeForm.name = row.name
  typeForm.remindDays = row.remindDays ?? 7
  typeDialogVisible.value = true
}

async function saveType() {
  if (!typeForm.name) {
    ElMessage.warning('请填写类型名称');
    return;
  }

  let success = false;
  if (typeForm.id) {
    // 编辑
    success = await store.editProjectType({ ...typeForm });
  } else {
    // 新增
    const { id, ...newTypeData } = typeForm;
    success = await store.addProjectType(newTypeData);
  }

  if (success) {
    ElMessage.success('保存成功！');
    typeDialogVisible.value = false;
  } else {
    ElMessage.error('保存失败，请检查控制台输出');
  }
}

function confirmDelete(id: string) {
  const target = projectTypes.value.find(t => t.id === id)
  const msg = target ? `确认删除项目类型「${target.name}」？` : '确认删除此项目类型？'
  ElMessageBox.confirm(msg, '删除确认', {
    confirmButtonText: '删除',
    cancelButtonText: '取消',
    type: 'warning',
    center: true,
  }).then(() => {
    deleteType(id)
  }).catch(() => {})
}
async function deleteType(id: string) {
  const success = await store.removeProjectType(id);
  if (success) {
    ElMessage.success('删除成功！');
  } else {
    ElMessage.error('删除失败，可能该类型已被项目使用');
  }
}
</script>
<style scoped>
.project-type-config {
  padding: 8px 0;
}
</style> 