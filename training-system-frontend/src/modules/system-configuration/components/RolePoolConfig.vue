<template>
  <div class="role-pool-config">
    <el-table :data="roles" size="small" border>
      <el-table-column prop="name" label="角色名称" width="120" />
      <el-table-column prop="category" label="类别" width="80" :formatter="fmtCategory" />
      <el-table-column prop="description" label="说明" min-width="120" class-name="desc-col" />
      <el-table-column label="操作" width="160">
        <template #default="{ row, $index }">
          <el-button type="text" size="small" @click="openAdd">新增</el-button>
          <el-dropdown trigger="click" @command="cmd => handleCmd($index, cmd)">
            <span class="el-dropdown-link" @click.stop>
              <el-icon><More /></el-icon>
            </span>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="edit">编辑</el-dropdown-item>
                <el-dropdown-item command="delete" divided>删除</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </template>
      </el-table-column>
    </el-table>

    <!-- 角色表单对话框 -->
    <el-dialog v-model="dialogVisible" :title="editing ? '编辑角色' : '新增角色'" width="480px">
      <el-form ref="formRef" :model="form" :rules="rules" label-width="80px">
        <el-form-item label="名称" prop="name">
          <el-input v-model="form.name" placeholder="如：组长" />
        </el-form-item>
        <el-form-item label="类别" prop="category">
          <el-select v-model="form.category" placeholder="请选择">
            <el-option label="学员" value="student" />
            <el-option label="辅导员" value="tutor" />
            <el-option label="讲师" value="teacher" />
            <el-option label="管理员" value="admin" />
          </el-select>
        </el-form-item>
        <el-form-item label="说明">
          <el-input type="textarea" v-model="form.description" rows="2" maxlength="100" show-word-limit />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="save">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { More } from '@element-plus/icons-vue'
import type { FormInstance } from 'element-plus'

interface Role {
  id: string
  name: string
  category: 'student' | 'tutor' | 'teacher' | 'admin'
  description?: string
}

/* 临时使用本地状态，后续可接入 Pinia / API */
const roles = ref<Role[]>([
  { id: '1', name: '组长', category: 'student', description: '小组负责人' },
  { id: '2', name: '学习委员', category: 'student', description: '' },
  { id: '3', name: '纪律委员', category: 'student', description: '' },
])

const dialogVisible = ref(false)
const editing = ref(false)
const form = reactive<Role>({ id: '', name: '', category: 'student', description: '' })
const formRef = ref<FormInstance>()

const rules = {
  name: [{ required: true, message: '请输入角色名称', trigger: 'blur' }],
}

function fmtCategory(_: any, __: any, value: Role['category']) {
  const m: Record<Role['category'], string> = {
    student: '学员',
    tutor: '辅导员',
    teacher: '讲师',
    admin: '管理员',
  }
  return m[value]
}

function openAdd() {
  editing.value = false
  Object.assign(form, { id: '', name: '', category: 'student', description: '' })
  dialogVisible.value = true
}

function edit(role: Role) {
  editing.value = true
  Object.assign(form, { ...role })
  dialogVisible.value = true
}

function save() {
  formRef.value?.validate((ok) => {
    if (!ok) return
    if (editing.value) {
      const idx = roles.value.findIndex((r) => r.id === form.id)
      if (idx >= 0) roles.value[idx] = { ...form }
    } else {
      roles.value.push({ ...form, id: Date.now().toString() })
    }
    dialogVisible.value = false
  })
}

function remove(id: string) {
  roles.value = roles.value.filter((r) => r.id !== id)
}

function handleCmd(idx: number, cmd: string) {
  if (cmd === 'edit') edit(roles.value[idx])
  else if (cmd === 'delete') remove(roles.value[idx].id)
}
</script>

<style scoped>
.role-pool-config {
  margin-top: 8px;
}

.desc-col .cell {
  white-space: normal !important;
  word-break: break-all;
}
</style> 