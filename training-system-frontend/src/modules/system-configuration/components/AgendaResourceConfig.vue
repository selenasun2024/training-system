<template>
  <div class="agenda-resource-config">
    <el-row gutter="16">
      <el-col :span="4">
        <el-card shadow="never" class="agenda-list">
          <div class="header">议程类型</div>
          <el-menu :default-active="activeAgenda" @select="handleSelect" :key="agendaTypesList.length">
            <el-menu-item v-for="t in agendaTypesList" :key="t.id" :index="t.id">{{ t.name }}</el-menu-item>
          </el-menu>
        </el-card>
      </el-col>
      <el-col :span="20">
        <el-card shadow="never">
          <template #header>
            <span>所需资源清单 - {{ currentAgendaName }}</span>
            <el-button type="primary" size="small" @click="openAdd" style="float:right">新增资源</el-button>
          </template>
          <el-table :data="currentList" border height="360px">
            <el-table-column prop="resource" label="资源名称" width="200" />
            <el-table-column prop="defaultQty" label="默认数量" width="120" />
            <el-table-column prop="remark" label="备注" />
            <el-table-column label="操作" width="120">
              <template #default="{ row, $index }">
                <el-button type="text" size="small" @click="edit(row, $index)">编辑</el-button>
                <el-button type="text" size="small" @click="confirmDelete($index)" style="color:#f56c6c">删除</el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-col>
    </el-row>

    <!-- 弹窗 -->
    <el-dialog v-model="dialogVisible" :title="editingIdx===-1?'新增资源':'编辑资源'" width="480px">
      <el-form :model="form" label-width="100px">
        <el-form-item label="资源名称">
          <el-select v-model="form.resource" filterable allow-create default-first-option style="width:260px">
            <el-option v-for="o in resourceOptions" :key="o" :label="o" :value="o" />
          </el-select>
        </el-form-item>
        <el-form-item label="默认数量">
          <el-input-number v-model="form.defaultQty" :min="0" />
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="form.remark" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible=false">取消</el-button>
        <el-button type="primary" @click="save">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, reactive, watch } from 'vue'
import { ElMessageBox } from 'element-plus'
import type { Ref } from 'vue'
import type { ResourceBudget } from '@/types'

interface AgendaType { id: string; name: string }
interface AgendaResItem { id: string; resource: string; defaultQty?: number; remark?: string }

const props = defineProps<{ 
  agendaTypes: Ref<AgendaType[]>,
  resourceBudgets: Ref<ResourceBudget[]>,
  resourceMap: Ref<Record<string, AgendaResItem[]>>, // key: agendaTypeId
  onUpdate: (map: Record<string, AgendaResItem[]>)=>void,
}>()

const activeAgenda = ref('')
const agendaTypesList = computed(() => props.agendaTypes.value)

watch(agendaTypesList, (val) => {
  if (!val.length) return
  if (!val.find(a => a.id === activeAgenda.value)) activeAgenda.value = val[0].id
}, { immediate: true })

const resourceOptions = computed(() => props.resourceBudgets.value.map(b => b.resource))

const currentList = computed(() => props.resourceMap.value[activeAgenda.value] || [])
const currentAgendaName = computed(() => agendaTypesList.value.find(a => a.id === activeAgenda.value)?.name || '')

function handleSelect(id: string) { activeAgenda.value = id }

const dialogVisible = ref(false)
const editingIdx = ref(-1)
const form = reactive<AgendaResItem>({ id:'', resource:'', defaultQty:0, remark:'' })

function openAdd() {
  editingIdx.value = -1
  Object.assign(form, { id:'', resource:'', defaultQty:0, remark:'' })
  dialogVisible.value = true
}
function edit(row: AgendaResItem, idx:number){
  editingIdx.value = idx
  Object.assign(form, JSON.parse(JSON.stringify(row)))
  dialogVisible.value = true
}
function save(){
  if(!form.resource) return
  const list = [...currentList.value]
  if(editingIdx.value===-1){
    list.push({ id: Date.now().toString(), resource: form.resource, defaultQty: form.defaultQty, remark: form.remark })
  }else{
    list[editingIdx.value] = { ...form }
  }
  const newMap = { ...props.resourceMap.value, [activeAgenda.value]: list }
  props.onUpdate(newMap)
  dialogVisible.value = false
}
function confirmDelete(idx:number){
  ElMessageBox.confirm('确认删除此资源？','删除确认',{confirmButtonText:'删除',cancelButtonText:'取消',type:'warning',center:true}).then(()=>{
    const list = [...currentList.value]
    list.splice(idx,1)
    const newMap = { ...props.resourceMap.value, [activeAgenda.value]: list }
    props.onUpdate(newMap)
  }).catch(()=>{})
}
</script>

<style scoped>
.agenda-list .header{font-weight:600;margin-bottom:8px;}
.mr-1{margin-right:6px;}
</style> 