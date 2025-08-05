<template>
  <div class="object-rule-config">
    <el-row gutter="16">
      <el-col :span="6">
        <el-card shadow="never" class="type-list">
          <div class="header">
            <span>项目类型</span>
          </div>
          <el-menu :default-active="activeTypeId" @select="selectType">
            <el-menu-item v-for="type in list" :key="type.id" :index="type.id" class="type-item">
              <span>{{ type.name }}</span>
              <el-dropdown trigger="click" class="type-actions">
                <span class="el-dropdown-link" @click.stop>
                  <i class="el-icon-more"></i>
                </span>
                <template #dropdown>
                  <el-dropdown-menu>
                    <el-dropdown-item @click="editType(type)">编辑名称</el-dropdown-item>
                    <el-dropdown-item divided @click="deleteType(type.id)">删除</el-dropdown-item>
                  </el-dropdown-menu>
                </template>
              </el-dropdown>
            </el-menu-item>
          </el-menu>
        </el-card>
      </el-col>
      <el-col :span="18">
        <el-card shadow="never">
          <template #header>
            <span>学员筛选规则</span>
          </template>
          <el-table :data="currentRules" border v-if="activeTypeId">
            <el-table-column prop="description" label="规则说明" />
            <el-table-column prop="conditions" label="筛选条件">
              <template #default="{ row }">
                <span v-for="(cond, idx) in row.conditions" :key="idx">
                  <el-tag size="small" class="mr-1">{{ renderCond(cond) }}</el-tag>
                </span>
              </template>
            </el-table-column>
            <el-table-column prop="allowManualAdd" label="允许手动补充">
              <template #default="{ row }">
                <el-switch v-model="row.allowManualAdd" disabled />
              </template>
            </el-table-column>
            <el-table-column label="操作" width="160">
              <template #default="{ row, $index }">
                <div class="op-cell">
                  <el-button type="text" size="small" @click="addRule">新增</el-button>
                  <el-dropdown trigger="click" @command="handleOpCommand($index, $event)" class="op-more">
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
                </div>
              </template>
            </el-table-column>
          </el-table>
          <div v-else class="empty-tip">请选择左侧项目类型</div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 项目类型新增/编辑对话框 -->
    <el-dialog v-model="typeDialogVisible" title="项目类型" width="360px">
      <el-form :model="typeForm" label-width="80px">
        <el-form-item label="类型名称">
          <el-input v-model="typeForm.name" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="typeDialogVisible=false">取消</el-button>
        <el-button type="primary" @click="saveType">保存</el-button>
      </template>
    </el-dialog>

    <!-- 规则新增/编辑对话框 -->
    <el-dialog v-model="ruleDialogVisible" :title="ruleEditingIdx===-1?'新增规则':'编辑规则'" width="520px">
      <el-form :model="ruleForm" label-width="100px">
        <el-form-item label="规则说明">
          <el-input v-model="ruleForm.description" />
        </el-form-item>
        <el-form-item label="筛选条件">
          <div v-for="(cond, idx) in ruleForm.conditions" :key="idx" class="cond-row">
            <el-select v-model="cond.field" placeholder="字段" style="width:110px">
              <el-option v-for="f in fields" :key="f.value" :label="f.label" :value="f.value" />
            </el-select>
            <el-select v-model="cond.operator" placeholder="操作符" style="width:80px">
              <el-option v-for="op in operators" :key="op" :label="op" :value="op" />
            </el-select>
            <el-input v-model="cond.value" placeholder="值" style="width:120px" />
            <el-button icon="el-icon-minus" @click="removeCond(idx)" circle size="small" />
          </div>
          <el-button icon="el-icon-plus" @click="addCond" size="small">添加条件</el-button>
        </el-form-item>
        <el-form-item label="允许手动补充">
          <el-switch v-model="ruleForm.allowManualAdd" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="ruleDialogVisible=false">取消</el-button>
        <el-button type="primary" @click="saveRule">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch } from 'vue'
import type { Ref } from 'vue'
import { More } from '@element-plus/icons-vue'

import { useSystemConfigStore } from '@/stores/systemConfig'

// const props = defineProps<{ projectTypes: Ref<any[]>, onUpdate: (types: any[]) => void }>()

const systemConfigStore = useSystemConfigStore()
const list = computed(() => systemConfigStore.projectTypes)

// 字段与操作符配置
const fields = [
  { label: '部门', value: 'department' },
  { label: '岗位', value: 'position' },
  { label: '职级', value: 'level' },
  { label: '入职日期', value: 'hireDate' },
  { label: '状态', value: 'status' },
]
const operators = ['=', '!=', 'in', 'not in', '>', '<', 'between']

// 项目类型管理
const activeTypeId = ref('')
watch(() => systemConfigStore.projectTypes, (val) => {
  if (!val.length) activeTypeId.value = ''
  else if (!val.find(t => t.id === activeTypeId.value)) activeTypeId.value = val[0].id
}, { immediate: true })

const typeDialogVisible = ref(false)
const typeForm = reactive({ id: '', name: '' })
async function saveType() {
  if (!typeForm.name) return
  if (typeForm.id) {
    // 这里只更新名称，更完整的编辑在 ProjectTypeConfig 组件中
    await systemConfigStore.editProjectType({ id: typeForm.id, name: typeForm.name });
  }
  typeDialogVisible.value = false
}
function selectType(id: string) { activeTypeId.value = id }

// 规则管理 - 使用系统配置Store
const currentRules = computed(() => systemConfigStore.getFilterRulesByTypeId(activeTypeId.value))

const ruleDialogVisible = ref(false)
const ruleEditingIdx = ref(-1)
const ruleForm = reactive({
  description: '',
  conditions: [] as any[],
  allowManualAdd: true,
})
function addRule() {
  ruleEditingIdx.value = -1
  ruleForm.description = ''
  ruleForm.conditions = []
  ruleForm.allowManualAdd = true
  ruleDialogVisible.value = true
}
function editRule(row: any, idx: number) {
  ruleEditingIdx.value = idx
  ruleForm.description = row.description
  ruleForm.conditions = row.conditions.map((c: any) => ({ ...c }))
  ruleForm.allowManualAdd = row.allowManualAdd
  ruleDialogVisible.value = true
}
function saveRule() {
  if (!ruleForm.description) return
  const arr = [...systemConfigStore.getFilterRulesByTypeId(activeTypeId.value)]
  if (ruleEditingIdx.value === -1) {
    arr.push({
      description: ruleForm.description,
      conditions: ruleForm.conditions.map((c: any) => ({ ...c })),
      allowManualAdd: ruleForm.allowManualAdd,
    })
  } else {
    arr[ruleEditingIdx.value] = {
      description: ruleForm.description,
      conditions: ruleForm.conditions.map((c: any) => ({ ...c })),
      allowManualAdd: ruleForm.allowManualAdd,
    }
  }
  systemConfigStore.updateFilterRules(activeTypeId.value, arr)
  ruleDialogVisible.value = false
}
function removeRule(idx: number) {
  const arr = [...systemConfigStore.getFilterRulesByTypeId(activeTypeId.value)]
  arr.splice(idx, 1)
  systemConfigStore.updateFilterRules(activeTypeId.value, arr)
}
function addCond() {
  ruleForm.conditions.push({ field: '', operator: '=', value: '' })
}
function removeCond(idx: number) {
  ruleForm.conditions.splice(idx, 1)
}
function renderCond(cond: any) {
  const f = fields.find(f => f.value === cond.field)
  return `${f ? f.label : cond.field} ${cond.operator} ${cond.value}`
}
function editType(type: any) {
  typeForm.id = type.id
  typeForm.name = type.name
  typeDialogVisible.value = true
}
async function deleteType(id: string) {
  await systemConfigStore.removeProjectType(id);
  // 同时删除对应的筛选规则
  systemConfigStore.updateFilterRules(id, [])
  
  if (activeTypeId.value === id) {
    const remainingTypes = systemConfigStore.projectTypes;
    activeTypeId.value = remainingTypes.length > 0 ? remainingTypes[0].id : '';
  }
}

// Add default rule example
watch(activeTypeId, () => {
  if (!activeTypeId.value) return
  const currentRules = systemConfigStore.getFilterRulesByTypeId(activeTypeId.value)
  if (!currentRules || !currentRules.length) {
    // 只有在没有规则时才添加默认规则
    systemConfigStore.updateFilterRules(activeTypeId.value, [
      {
        description: '默认规则',
        conditions: [
          { field: 'department', operator: '=', value: 'Development' },
          { field: 'level', operator: 'in', value: 'P4,P5,P6' },
        ],
        allowManualAdd: true,
      },
    ])
  }
}, { immediate: true })

function handleOpCommand(idx:number, cmd:string){
  if(cmd==='edit') editRule(currentRules.value[idx], idx)
  else if(cmd==='delete') removeRule(idx)
}
</script>

<style scoped>
.object-rule-config {
  padding: 8px 0;
}
.type-list .header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}
.cond-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 4px;
}
.empty-tip {
  color: #aaa;
  padding: 32px 0;
  text-align: center;
}
.mr-1 {
  margin-right: 6px;
}
.type-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.type-actions {
  visibility: hidden;
}
.type-item:hover .type-actions {
  visibility: visible;
}
/* 操作列样式 */
.op-cell {
  position: relative;
  display: flex;
  align-items: flex-start;
}
.op-more {
  position: absolute;
  right: 0;
  bottom: 4px;
  cursor: pointer;
}
</style> 