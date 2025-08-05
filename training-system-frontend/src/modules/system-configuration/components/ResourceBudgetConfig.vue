<template>
  <div class="resource-budget-config">
    <el-row gutter="16">
      <el-col :span="6">
        <el-card shadow="never" class="resource-list">
          <template #header>
            <span>资源列表</span>
            <el-button type="primary" size="small" @click="openAddResource" style="float:right">新增资源</el-button>
          </template>
          <el-menu :default-active="activeId" @select="handleResSelect" :key="budgets.length">
            <el-menu-item v-for="r in budgets" :key="r.id" :index="r.id" class="res-item">
              <span>{{ r.resource }}</span>
              <el-dropdown trigger="click" class="actions">
                <span class="el-dropdown-link" @click.stop><i class="el-icon-more"/></span>
                <template #dropdown>
                  <el-dropdown-menu>
                    <el-dropdown-item @click="openEditResource(r)">编辑名称</el-dropdown-item>
                    <el-dropdown-item divided @click="deleteResource(r.id)">删除</el-dropdown-item>
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
            <span>预算项目 - {{ currentResource?.resource || '未选择' }}</span>
            <el-button v-if="currentResource" type="primary" size="small" @click="openAddItem" style="float:right">新增项目</el-button>
          </template>
          <el-table :data="currentResource?.items || []" border height="360px">
            <el-table-column prop="name" label="项目名称" width="180" />
            <el-table-column prop="unit" label="单位" width="100" />
            <el-table-column prop="price" label="单价" width="100" />
            <el-table-column prop="defaultQty" label="默认数量" width="100" />
            <el-table-column label="操作" width="120">
              <template #default="{ row, $index }">
                <el-button type="text" size="small" @click="openEditItem(row, $index)">编辑</el-button>
                <el-button type="text" size="small" style="color:#f56c6c" @click="deleteItem($index)">删除</el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-col>
    </el-row>

    <!-- 资源对话框 -->
    <el-dialog v-model="resDialogVisible" :title="resEditing ? '编辑资源' : '新增资源'" width="360px">
      <el-input v-model="resName" placeholder="资源名称" />
      <template #footer>
        <el-button @click="resDialogVisible=false">取消</el-button>
        <el-button type="primary" @click="saveResource">保存</el-button>
      </template>
    </el-dialog>

    <!-- 项目对话框 -->
    <el-dialog v-model="itemDialogVisible" :title="itemEditing ? '编辑预算项目' : '新增预算项目'" width="480px">
      <el-form :model="itemForm" label-width="90px">
        <el-form-item label="项目名称"><el-input v-model="itemForm.name" /></el-form-item>
        <el-form-item label="单位"><el-input v-model="itemForm.unit" placeholder="如 元/天" /></el-form-item>
        <el-form-item label="单价"><el-input-number v-model="itemForm.price" :min="0" /></el-form-item>
        <el-form-item label="默认数量"><el-input-number v-model="itemForm.defaultQty" :min="0" /></el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="itemDialogVisible=false">取消</el-button>
        <el-button type="primary" @click="saveItem">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { ElMessageBox } from 'element-plus'
import type { Ref } from 'vue'
import type { ResourceBudget, BudgetItem } from '@/types'

const props = defineProps<{ budgets: Ref<ResourceBudget[]>, onUpdate: (list: ResourceBudget[])=>void }>()
const budgets = props.budgets

const activeId = ref('')
const currentResource = computed(() => budgets.value.find(b => b.id === activeId.value))

/* ---------------- 资源管理 ---------------- */
const resDialogVisible = ref(false)
const resEditing = ref(false)
const resName = ref('')
function openAddResource(){ resEditing.value=false; resName.value=''; resDialogVisible.value=true }
function openEditResource(r:ResourceBudget){ resEditing.value=true; resName.value=r.resource; activeId.value=r.id; resDialogVisible.value=true }
function saveResource(){ if(!resName.value) return
  if(resEditing.value){ const r= budgets.value.find(b=>b.id===activeId.value); if(r) r.resource=resName.value }
  else budgets.value.push({ id: Date.now().toString(), resource: resName.value, items: [] })
  props.onUpdate(budgets.value); resDialogVisible.value=false }
function deleteResource(id:string){ ElMessageBox.confirm('确认删除此资源？','删除确认',{confirmButtonText:'删除',cancelButtonText:'取消',type:'warning',center:true}).then(()=>{
  const idx = budgets.value.findIndex(b=>b.id===id); if(idx>=0) budgets.value.splice(idx,1); if(activeId.value===id) activeId.value=budgets.value[0]?.id||''; props.onUpdate(budgets.value)}).catch(()=>{}) }

/* ---------------- 项目管理 ---------------- */
const itemDialogVisible = ref(false)
const itemEditing = ref(false)
const editingIdx = ref(-1)
const itemForm = ref<BudgetItem>({ id:'', name:'', unit:'', price:0, defaultQty:0 })
function openAddItem(){ if(!currentResource.value) return; itemEditing.value=false; editingIdx.value=-1; itemForm.value={ id:'', name:'', unit:'', price:0, defaultQty:0 }; itemDialogVisible.value=true }
function openEditItem(row:BudgetItem, idx:number){ itemEditing.value=true; editingIdx.value=idx; itemForm.value={...row}; itemDialogVisible.value=true }
function saveItem(){ if(!currentResource.value || !itemForm.value.name) return
  const list = currentResource.value.items
  if(itemEditing.value && editingIdx.value>-1){ list[editingIdx.value]={...itemForm.value} }
  else { list.push({ ...itemForm.value, id: Date.now().toString() }) }
  props.onUpdate(budgets.value); itemDialogVisible.value=false }
function deleteItem(idx:number){ if(!currentResource.value) return; currentResource.value.items.splice(idx,1); props.onUpdate(budgets.value) }

function handleResSelect(id:string){ activeId.value = id }
</script>

<style scoped>
.resource-list .res-item{display:flex;justify-content:space-between;align-items:center;}
.actions{visibility:hidden;}
.res-item:hover .actions{visibility:visible;}
.mb-1{margin-bottom:6px;}
</style> 