<template>
  <div class="type-management">
    <!-- 项目类型 -->
    <el-card shadow="never" class="mb-3">
      <template #header>
        <span>项目类型管理</span>
        <el-button type="primary" size="small" @click="openAdd('project')" style="float:right">新增类型</el-button>
      </template>
      <el-table :data="projectList" border height="240px">
        <el-table-column prop="name" label="类型名称" width="240" />
        <el-table-column prop="remindDays" label="提前提醒时间(天)" width="180" />
        <el-table-column label="操作" width="140">
          <template #default="{ row }">
            <el-button type="text" size="small" @click="() => edit('project', row)">编辑</el-button>
            <el-button type="text" size="small" @click="() => confirmDelete('project', row.id)" style="color:#f56c6c">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 议程类型 -->
    <el-card shadow="never">
      <template #header>
        <span>议程类型管理</span>
        <el-button type="primary" size="small" @click="openAdd('agenda')" style="float:right">新增类型</el-button>
      </template>
      <el-table :data="agendaList" border height="240px">
        <el-table-column prop="name" label="类型名称" width="240" />
        <el-table-column label="操作" width="140">
          <template #default="{ row }">
            <el-button type="text" size="small" @click="() => edit('agenda', row)">编辑</el-button>
            <el-button type="text" size="small" @click="() => confirmDelete('agenda', row.id)" style="color:#f56c6c">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 对话框 -->
    <el-dialog v-model="dialogVisible" :title="dialogTitle" width="360px">
      <el-form :model="form" label-width="80px">
        <el-form-item label="名称">
          <el-input v-model="form.name" />
        </el-form-item>
        <el-form-item v-if="currentCategory==='project'" label="提醒天数">
          <el-input-number v-model="form.remindDays" :min="0" :max="365" />
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
import { ref, reactive, computed } from 'vue'
import type { Ref } from 'vue'
import { ElMessageBox } from 'element-plus'

const props = defineProps<{ 
  projectTypes: Ref<any[]>, 
  agendaTypes: Ref<any[]>, 
  onUpdateProject: (types:any[])=>void,
  onUpdateAgenda: (types:any[])=>void,
}>()

const projectList = computed(()=>props.projectTypes.value)
const agendaList  = computed(()=>props.agendaTypes.value)

const dialogVisible = ref(false)
const dialogTitle   = ref('')
const currentCategory = ref<'project'|'agenda'>('project')
const editingIdx = ref(-1)
const form = reactive({ id:'', name:'', remindDays:7 })

function openAdd(cat:'project'|'agenda'){
  currentCategory.value = cat
  editingIdx.value = -1
  dialogTitle.value = cat==='project' ? '新增项目类型' : '新增议程类型'
  Object.assign(form,{id:'',name:'',remindDays:7})
  dialogVisible.value = true
}
function edit(cat:'project'|'agenda', row:any){
  currentCategory.value = cat
  dialogTitle.value = cat==='project' ? '编辑项目类型' : '编辑议程类型'
  editingIdx.value = (cat==='project'?projectList.value:agendaList.value).findIndex(t=>t.id===row.id)
  Object.assign(form,{id:row.id,name:row.name,remindDays:row.remindDays??7})
  dialogVisible.value = true
}
function save(){
  if(!form.name) return
  const list = currentCategory.value==='project'? [...projectList.value]:[...agendaList.value]
  if(editingIdx.value===-1){
    list.push({id:Date.now().toString(),name:form.name,remindDays:form.remindDays})
  }else{
    list[editingIdx.value] = { ...list[editingIdx.value], name: form.name, remindDays: form.remindDays }
  }
  if(currentCategory.value==='project') props.onUpdateProject(list)
  else props.onUpdateAgenda(list)
  dialogVisible.value = false
}
function confirmDelete(cat:'project'|'agenda', id:string){
  ElMessageBox.confirm('确认删除此类型？','删除确认',{confirmButtonText:'删除',cancelButtonText:'取消',type:'warning',center:true}).then(()=>{
    deleteType(cat,id)
  }).catch(()=>{})
}
function deleteType(cat:'project'|'agenda',id:string){
  const list = (cat==='project'?projectList.value:agendaList.value).filter(t=>t.id!==id)
  cat==='project'? props.onUpdateProject(list): props.onUpdateAgenda(list)
}
</script>

<style scoped>
.mb-3{margin-bottom:16px;}
.type-management .el-card{margin-bottom:16px;}
</style> 