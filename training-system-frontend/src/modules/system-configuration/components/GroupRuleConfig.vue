<template>
  <div class="group-rule-config">
    <h3 class="page-title"><el-icon><Setting /></el-icon><span>小组设置</span></h3>
    <el-form :model="form" label-width="120px" class="rule-form">
      <el-form-item label="默认小组数量">
        <el-input-number v-model="form.defaultCount" :min="1" />
      </el-form-item>
      <el-form-item label="命名模式" class="naming-row">
        <el-select v-model="form.namingType" style="width: 160px; margin-right: 8px">
          <el-option label="第N组" value="number" />
          <el-option label="字母组" value="alpha" />
          <el-option label="自定义前缀" value="custom" />
        </el-select>
        <el-tag type="info">{{ genName(1) }}</el-tag>
      </el-form-item>
      <el-form-item v-if="form.namingType==='custom'" label="自定义前缀">
        <el-input v-model="form.customPrefix" placeholder="例如 雏鹰队" />
      </el-form-item>
      <el-form-item label="允许增删小组">
        <el-switch v-model="form.allowAddRemove" />
      </el-form-item>
      <el-form-item label="允许重命名">
        <el-switch v-model="form.allowRename" />
      </el-form-item>
    </el-form>

    <div class="section-header"><el-icon><UserFilled /></el-icon><span>角色池</span></div>
    <RolePoolConfig />

    <div class="section-header" style="margin-top:16px"><el-icon><Tickets /></el-icon><span>分组规则</span></div>
    <el-table :data="rules" border style="margin-bottom: 16px">
      <el-table-column prop="description" label="规则说明" />
      <el-table-column label="约束条件">
        <template #default="{ row }">
          <span v-for="(cond, idx) in row.conditions" :key="idx">
            <el-tag size="small" class="mr-1">{{ renderCond(cond) }}</el-tag>
          </span>
        </template>
      </el-table-column>
      <el-table-column prop="enabled" label="启用" width="80">
        <template #default="{ row }">
          <el-switch v-model="row.enabled" />
        </template>
      </el-table-column>
      <el-table-column label="操作" width="160">
        <template #default="{ row, $index }">
          <el-button type="text" size="small" @click="addRule">新增</el-button>
          <el-dropdown trigger="click" @command="handleCommand($index, $event)">
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

    <!-- 规则新增/编辑对话框 -->
    <el-dialog v-model="ruleDialogVisible" :title="editingIdx===-1?'新增分组规则':'编辑分组规则'" width="520px">
      <el-form :model="ruleForm" label-width="100px">
        <el-form-item label="规则说明">
          <el-input v-model="ruleForm.description" />
        </el-form-item>
        <el-form-item label="约束条件">
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
        <el-form-item label="启用">
          <el-switch v-model="ruleForm.enabled" />
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
import { ref, reactive, watch } from 'vue'
import RolePoolConfig from './RolePoolConfig.vue'
import { More, UserFilled, Tickets, Setting } from '@element-plus/icons-vue'

interface GroupRule {
  defaultCount: number
  namingType: 'number' | 'alpha' | 'custom'
  customPrefix?: string
  allowAddRemove: boolean
  allowRename: boolean
}

const form = reactive<GroupRule>({
  defaultCount: 6,
  namingType: 'number',
  customPrefix: '',
  allowAddRemove: true,
  allowRename: true,
})

function genName(n: number) {
  switch (form.namingType) {
    case 'number':
      return `第${n}组`
    case 'alpha':
      return String.fromCharCode(64 + n) + '组'
    case 'custom':
      return `${form.customPrefix || '小组'}${n}`
  }
}

/** -------- 分组规则数据 -------- */
interface Cond { field: string; operator: string; value: string }
interface GroupRuleItem { description: string; conditions: Cond[]; enabled: boolean }

const rules = ref<GroupRuleItem[]>([])

// 字段与操作符
const fields = [
  { label: '性别', value: 'gender' },
  { label: '岗位', value: 'position' },
  { label: '工龄', value: 'seniority' },
  { label: '部门', value: 'department' },
  { label: '工作地', value: 'location' },
]
const operators = ['=', '!=', 'in', 'not in', '>', '<', 'between']

// 默认示例规则
watch(rules, () => {}, { immediate: true })
if (!rules.value.length) {
  rules.value.push({
    description: '按性别均衡',
    conditions: [ { field: 'gender', operator: '=', value: '男' }, { field: 'gender', operator: '=', value: '女' } ],
    enabled: true,
  })
}

// 规则表单
const ruleDialogVisible = ref(false)
const editingIdx = ref(-1)
const ruleForm = reactive<GroupRuleItem>({ description: '', conditions: [], enabled: true })

function addRule() {
  editingIdx.value = -1
  Object.assign(ruleForm, { description: '', conditions: [], enabled: true })
  ruleDialogVisible.value = true
}

function editRule(row: GroupRuleItem, idx: number) {
  editingIdx.value = idx
  ruleForm.description = row.description
  ruleForm.conditions = row.conditions.map(c=>({ ...c }))
  ruleForm.enabled = row.enabled
  ruleDialogVisible.value = true
}

function saveRule() {
  if (!ruleForm.description) return
  const newItem: GroupRuleItem = {
    description: ruleForm.description,
    conditions: ruleForm.conditions.map(c=>({ ...c })),
    enabled: ruleForm.enabled,
  }
  if (editingIdx.value === -1) {
    rules.value.push(newItem)
  } else {
    rules.value[editingIdx.value] = newItem
  }
  ruleDialogVisible.value = false
}

function removeRule(idx: number) {
  rules.value.splice(idx, 1)
}

function handleCommand(idx:number, cmd:string) {
  if (cmd==='edit') editRule(rules.value[idx], idx)
  else if (cmd==='delete') removeRule(idx)
}

function addCond() { ruleForm.conditions.push({ field: '', operator: '=', value: '' }) }
function removeCond(idx:number) { ruleForm.conditions.splice(idx,1) }
function renderCond(cond: Cond) {
  const f = fields.find(f=>f.value===cond.field)
  return `${f?f.label:cond.field} ${cond.operator} ${cond.value}`
}
</script>

<style scoped>
.page-title {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 12px;
}
.section-header {
  display: flex;
  align-items: center;
  gap: 6px;
  font-weight: 600;
  margin: 12px 0 8px;
}
.rule-form {
  max-width: 480px;
}
.naming-row {
  display: flex;
  align-items: center;
}
.mr-1 {
  margin-right: 6px;
}
.cond-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 4px;
}
</style> 