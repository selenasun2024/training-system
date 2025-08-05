<template>
  <div class="resource-management">
    <el-tabs v-model="activeTab" type="border-card" class="resource-tabs">
      <!-- 数字资料 Tab -->
      <el-tab-pane label="数字资料" name="digital">
        <div class="toolbar">
          <el-button 
            type="primary" 
            size="small" 
            :icon="Plus" 
            @click="openDigitalAssetDialog"
            :disabled="isNewProject"
          >
            添加资料
          </el-button>

          <el-text v-if="isNewProject" size="small" type="info" style="margin-left: 8px;">
            请先保存项目基本信息
          </el-text>
        </div>
        <el-table :data="digitalAssets" stripe>
          <el-table-column label="类型" width="100">
            <template #default="{ row }">
              <div v-if="row._editing">
                <el-select v-model="row.type" size="small" style="width:90px">
                  <el-option label="PPT" value="ppt"/><el-option label="PDF" value="pdf"/><el-option label="Word" value="word"/><el-option label="视频" value="video"/><el-option label="链接" value="link"/>
                </el-select>
              </div>
              <el-icon v-else><component :is="getTypeIcon(row.type)" /></el-icon>
            </template>
          </el-table-column>
          <el-table-column prop="name" label="资源名称">
            <template #default="{ row }">
              <el-input v-if="row._editing" v-model="row.name" size="small" />
              <span v-else>{{ row.name }}</span>
            </template>
          </el-table-column>
          <el-table-column prop="agendaItem" label="关联议程">
            <template #default="{ row }">
              <el-input v-if="row._editing" v-model="row.agendaItem" size="small" />
              <span v-else>{{ row.agendaItem }}</span>
            </template>
          </el-table-column>
          <el-table-column prop="uploader" label="负责人/讲师" width="140">
            <template #default="{ row }">
              <el-input v-if="row._editing" v-model="row.uploader" size="small" />
              <span v-else>{{ row.uploader }}</span>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="180" align="center">
            <template #default="{ row }">
              <template v-if="row._editing">
                <el-button link type="success" :icon="Check" size="small" @click="saveDigitalRow(row)" />
                <el-button link type="info" :icon="Close" size="small" @click="cancelDigitalRow(row)" />
              </template>
              <template v-else>
                <el-button v-if="row.status === 'pending'" link type="warning" size="small" :icon="Bell" @click="handleFollowUp(row)" />
                <el-button link type="primary" size="small" :icon="Edit" @click="row._editing=true" />
                <el-button link type="danger" size="small" :icon="Delete" @click="deleteDigitalRow(row)" />
              </template>
            </template>
          </el-table-column>
        </el-table>
      </el-tab-pane>

      <!-- 服务预定 Tab -->
      <el-tab-pane label="服务预定" name="services">
        <div class="toolbar">
          <el-button 
            type="primary" 
            size="small" 
            @click="openServiceDialog()"
            :disabled="isNewProject"
          >
            添加服务项
          </el-button>
          <el-button 
            type="success" 
            size="small" 
            :disabled="selectedServices.length === 0 || isNewProject" 
            @click="handleBatchCreateWorkOrder('service')"
          >
            批量生成工单
          </el-button>
          <el-text v-if="isNewProject" size="small" type="info" style="margin-left: 8px;">
            请先保存项目基本信息
          </el-text>
        </div>
        <el-table :data="serviceBookings" stripe @selection-change="handleServiceSelectionChange">
          <el-table-column type="selection" width="55" :selectable="isServiceSelectable" />
          <el-table-column prop="item" label="服务项" />
          <el-table-column prop="type" label="类型" width="120" />
          <el-table-column label="状态" width="120">
             <template #default="{ row }">
                <el-tag :type="getStatusTagType(row.status)">{{ row.status }}</el-tag>
             </template>
          </el-table-column>
          <el-table-column prop="responsible" label="负责人" width="120" />
          <el-table-column prop="supplier" label="供应商/联系方式" />
          <el-table-column label="操作" width="150">
            <template #default="{ row }">
                <el-button v-if="row.type === 'internal-venue'" link type="primary" size="small" @click="handleReserve">预定日程</el-button>
                <el-button link type="primary" size="small" :icon="Edit">编辑</el-button>
                <el-button link type="danger" size="small" :icon="Delete">删除</el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-tab-pane>

      <!-- 物料清单 Tab -->
      <el-tab-pane label="物料清单" name="supplies">
        <div class="toolbar" data-html2canvas-ignore="true">
          <el-button 
            type="primary" 
            size="small" 
            @click="openSupplyDialog()"
            :disabled="isNewProject"
          >
            添加物料
          </el-button>
          <el-button 
            type="success" 
            size="small" 
            :disabled="selectedSupplies.length === 0 || isNewProject" 
            @click="handleBatchCreateWorkOrder('supply')"
          >
            批量生成工单
          </el-button>
          <el-button type="info" size="small" :icon="Printer" @click="printChecklist">打印清单</el-button>
          <el-text v-if="isNewProject" size="small" type="info" style="margin-left: 8px;">
            请先保存项目基本信息
          </el-text>
        </div>
        <el-table :data="supplyChecklist" stripe id="supply-checklist-table" @selection-change="handleSupplySelectionChange">
          <el-table-column type="selection" width="55" :selectable="isSupplySelectable" />
          <el-table-column prop="name" label="物料名称" />
          <el-table-column prop="spec" label="规格/型号" width="150" />
          <el-table-column prop="quantity" label="数量/单位" width="120" />
          <el-table-column label="状态" width="120">
            <template #default="{ row }">
              <el-tag :type="getStatusTagType(row.status)">{{ row.status }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="responsible" label="负责人" width="120" />
          <el-table-column prop="notes" label="备注" />
          <el-table-column label="操作" width="150" data-html2canvas-ignore="true">
            <template #default="{ row }">
                <el-button link type="primary" size="small" :icon="Edit">编辑</el-button>
                <el-button link type="danger" size="small" :icon="Delete">删除</el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-tab-pane>
    </el-tabs>

    <!-- Dialogs -->
    <el-dialog v-model="digitalAssetDialogVisible" title="添加数字资料" width="500px">
      <el-form :model="digitalForm" label-width="90px" ref="digitalFormRef" :rules="digitalRules">
        <el-form-item label="资源名称" prop="name"><el-input v-model="digitalForm.name"/></el-form-item>
        <el-form-item label="类型" prop="type">
          <el-select v-model="digitalForm.type" style="width:100%">
            <el-option label="PPT" value="ppt"/><el-option label="PDF" value="pdf"/><el-option label="Word" value="word"/><el-option label="视频" value="video"/><el-option label="链接" value="link"/>
          </el-select>
        </el-form-item>
        <el-form-item label="讲师/负责人" prop="uploader"><el-input v-model="digitalForm.uploader"/></el-form-item>
        <el-form-item label="关联议程"><el-input v-model="digitalForm.agendaItem"/></el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="digitalAssetDialogVisible=false">取消</el-button>
        <el-button type="primary" @click="handleSaveDigital">保存</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="serviceDialogVisible" title="添加服务项" width="500px">
      <el-form :model="serviceForm" label-width="90px" ref="serviceFormRef" :rules="serviceRules">
        <el-form-item label="服务项" prop="item"><el-input v-model="serviceForm.item"/></el-form-item>
        <el-form-item label="类型" prop="type">
          <el-select v-model="serviceForm.type" style="width:100%">
            <el-option label="内部场地" value="internal-venue"/><el-option label="外部场地" value="external-venue"/><el-option label="餐饮" value="catering"/><el-option label="住宿" value="accommodation"/><el-option label="交通" value="transport"/>
          </el-select>
        </el-form-item>
        <el-form-item label="负责人" prop="responsible"><el-input v-model="serviceForm.responsible"/></el-form-item>
        <el-form-item label="供应商"><el-input v-model="serviceForm.supplier"/></el-form-item>
        <el-form-item label="预算(元)"><el-input-number v-model="serviceForm.budgetAmountDisplay" :min="0"/></el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="serviceDialogVisible=false">取消</el-button>
        <el-button type="primary" @click="handleSaveService">保存</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="supplyDialogVisible" title="添加物料" width="500px">
      <el-form :model="supplyForm" label-width="90px" ref="supplyFormRef" :rules="supplyRules">
        <el-form-item label="物料名称" prop="name"><el-input v-model="supplyForm.name"/></el-form-item>
        <el-form-item label="规格"><el-input v-model="supplyForm.spec"/></el-form-item>
        <el-form-item label="数量/单位" prop="quantity"><el-input v-model="supplyForm.quantity"/></el-form-item>
        <el-form-item label="负责人" prop="responsible"><el-input v-model="supplyForm.responsible"/></el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="supplyDialogVisible=false">取消</el-button>
        <el-button type="primary" @click="handleSaveSupply">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { ElMessage, ElTag, ElMessageBox } from 'element-plus'
import { Document, VideoPlay, Link as IconLink, Download, View, Edit, Delete, Printer, Bell, Plus, Check, Close } from '@element-plus/icons-vue'
import { useResourceStore } from '@/stores/resources'
import { useRoute } from 'vue-router'
import type { ResourceItem, ServiceBooking, SupplyItem } from '@/types/finance'

// --- Types ---
type DigitalAsset = ResourceItem & { type: 'pdf' | 'video' | 'link' | 'word' | 'ppt' }

const activeTab = ref('digital');

// --- Dialogs State ---
const digitalAssetDialogVisible = ref(false);
const serviceDialogVisible = ref(false);
const supplyDialogVisible = ref(false);

function resetDigitalForm(){ digitalForm.value = { name:'', type:'ppt', uploader:'', agendaItem:'' } }
function resetServiceForm(){ serviceForm.value = { item:'', type:'internal-venue', responsible:'', supplier:'', budgetAmountDisplay:0 } }
function resetSupplyForm(){ supplyForm.value = { name:'', spec:'', quantity:'', responsible:'' } }

const openDigitalAssetDialog = () => { resetDigitalForm(); digitalAssetDialogVisible.value = true }
const openServiceDialog = () => { resetServiceForm(); serviceDialogVisible.value = true }
const openSupplyDialog = () => { resetSupplyForm(); supplyDialogVisible.value = true }

// === Store ===
const route = useRoute()
const projectId = (route.params.id as string) || 'mock'
const resourceStore = useResourceStore()

// 检查是否为新项目
const isNewProject = computed(() => projectId === 'new')

// Fetch data
onMounted(async () => {
  if (!isNewProject.value) {
    try {
      console.log('正在获取项目资源，项目ID:', projectId)
      await resourceStore.fetchResources(projectId)
      console.log('资源数据获取完成:', resourceStore.resources)
    } catch (error) {
      console.error('获取资源数据失败:', error)
      ElMessage.error('获取资源数据失败')
    }
  }
})

// 数据源按类型拆分 - 修复数据不显示问题
const digitalAssets = resourceStore.byType('digital')
const serviceBookings = resourceStore.byType('service')  
const supplyChecklist = resourceStore.byType('supply')



// --- Selection State ---
const selectedServices = ref<ServiceBooking[]>([])
const selectedSupplies = ref<SupplyItem[]>([])

const handleServiceSelectionChange = (val: ServiceBooking[]) => {
  selectedServices.value = val;
};
const handleSupplySelectionChange = (val: SupplyItem[]) => {
  selectedSupplies.value = val;
};

// --- Selectable Logic ---
const isServiceSelectable = (row: ServiceBooking) => {
  return row.type !== 'internal-venue' && row.status === 'pending';
};
const isSupplySelectable = (row: SupplyItem) => {
  return row.status === 'pending';
};

// --- Methods ---
const getTypeIcon = (type: DigitalAsset['type']) => {
  switch (type) {
    case 'pdf': case 'word': case 'ppt': return Document;
    case 'video': return VideoPlay;
    case 'link': return IconLink;
    default: return Document;
  }
};

const getStatusTagType = (status: ServiceBooking['status']) => {
  if (status === 'confirmed') return 'success';
  if (status === 'requested') return 'warning';
  if (status === 'cancelled') return 'info';
  if (status === 'pending') return 'primary';
  if (status === 'uploaded') return 'success';
  if (status === 'ordered') return 'warning';
  if (status === 'stocked') return 'success';
  if (status === 'distributed') return 'info';
  // 默认返回primary而不是空字符串
  return 'primary';
};

const handleReserve = () => ElMessage.success('已向日程系统发送预定请求！');
const handleCreateWorkOrder = () => ElMessage.success('工单已生成，请前往工单系统查看！');

const printChecklist = () => {
  window.print();
};

const handleFollowUp = (asset: DigitalAsset) => {
  ElMessageBox.confirm(
    `您确定要向【${asset.uploader}】发送一条提醒，请其提供【${asset.agendaItem}】的资料吗？`,
    '催办提醒',
    {
      confirmButtonText: '确定发送',
      cancelButtonText: '取消',
      type: 'warning',
    }
  ).then(() => {
    // Here you would typically call an API to send the notification
    // e.g., sendReminderApi(asset.uploader, asset.agendaItem)
    ElMessage({
      type: 'success',
      message: `提醒已发送给 ${asset.uploader}！`,
    });
  }).catch(() => {
    // User clicked cancel
  });
};

const handleBatchCreateWorkOrder = (type: 'service' | 'supply') => {
  const count = type === 'service' ? selectedServices.value.length : selectedSupplies.value.length;
  const items = type === 'service' ? selectedServices.value : selectedSupplies.value;
  
  ElMessageBox.confirm(
    `您已选择 ${count} 项内容，确定要为它们批量生成工单吗？`,
    '批量生成工单确认',
    {
      confirmButtonText: '确定生成',
      cancelButtonText: '取消',
      type: 'info',
    }
  ).then(() => {
    // Simulate API call and update status
    items.forEach(item => {
        if ('status' in item) {
            (item as any).status = type === 'service' ? 'requested' : 'ordered';
        }
    });
    ElMessage.success('批量工单已生成！');
    // Clear selection after action
    if (type === 'service') selectedServices.value = [];
    if (type === 'supply') selectedSupplies.value = [];
    // Note: In a real app, you might need to manually clear table selection state here if it doesn't auto-update.
  });
};

// ==== Forms & Rules ====
const digitalFormRef = ref()
const digitalForm = ref({ name:'', type:'ppt', uploader:'', agendaItem:'' })
const digitalRules = { name:[{required:true,message:'必填',trigger:'blur'}], uploader:[{required:true,message:'必填',trigger:'blur'}] }

const serviceFormRef = ref()
const serviceForm = ref({ item:'', type:'internal-venue', responsible:'', supplier:'', budgetAmountDisplay:0 })
const serviceRules = { item:[{required:true,message:'必填',trigger:'blur'}], type:[{required:true,message:'必填',trigger:'change'}], responsible:[{required:true,message:'必填',trigger:'blur'}] }

const supplyFormRef = ref()
const supplyForm = ref({ name:'', spec:'', quantity:'', responsible:'' })
const supplyRules = { name:[{required:true,message:'必填',trigger:'blur'}], quantity:[{required:true,message:'必填',trigger:'blur'}], responsible:[{required:true,message:'必填',trigger:'blur'}] }

// ==== Save handlers ====
async function handleSaveDigital(){
  digitalFormRef.value?.validate(async (valid:boolean)=>{
    if(!valid) return
    
    // 检查项目ID是否有效
    if (projectId === 'new') {
      ElMessage.warning('请先保存项目基本信息再添加数字资料')
      return
    }
    
    try {
      await resourceStore.createResource(projectId, {
        type:'digital',
        name:digitalForm.value.name,
        responsible:digitalForm.value.uploader, // 修复字段映射：uploader -> responsible
        agendaItem:digitalForm.value.agendaItem,
        status:'pending',
      })
      ElMessage.success('数字资料添加成功')
      digitalAssetDialogVisible.value=false
      // 延迟后重新加载数据，确保后端处理完成
      await new Promise(resolve => setTimeout(resolve, 500))
      await resourceStore.fetchResources(projectId)
    } catch (error) {
      console.error('数字资料保存失败:', error)
      ElMessage.error(`保存失败: ${error.message || '未知错误'}`)
    }
  })
}

async function handleSaveService(){
  serviceFormRef.value?.validate(async (v:boolean)=>{
    if(!v) return
    
    // 检查项目ID是否有效
    if (projectId === 'new') {
      ElMessage.warning('请先保存项目基本信息再添加服务项目')
      return
    }
    
    try {
      await resourceStore.createResource(projectId, {
        type:'service',
        name:serviceForm.value.item, // 修复字段映射：item -> name
        responsible:serviceForm.value.responsible,
        supplier:serviceForm.value.supplier,
        budgetAmount: serviceForm.value.budgetAmountDisplay > 0 ? Math.round(serviceForm.value.budgetAmountDisplay*100) : undefined,
        status:'pending',
      })
      ElMessage.success('服务项目添加成功')
      serviceDialogVisible.value=false
      // 延迟后重新加载数据，确保后端处理完成
      await new Promise(resolve => setTimeout(resolve, 500))
      await resourceStore.fetchResources(projectId)
    } catch (error) {
      console.error('服务项目保存失败:', error)
      ElMessage.error(`保存失败: ${error.message || '未知错误'}`)
    }
  })
}

async function handleSaveSupply(){
  supplyFormRef.value?.validate(async (v:boolean)=>{
    if(!v) return
    
    // 检查项目ID是否有效
    if (projectId === 'new') {
      ElMessage.warning('请先保存项目基本信息再添加物料')
      return
    }
    
    try {
      await resourceStore.createResource(projectId, {
        type:'supply',
        name:supplyForm.value.name,
        spec:supplyForm.value.spec,
        quantity:supplyForm.value.quantity,
        responsible:supplyForm.value.responsible,
        status:'pending',
      })
      ElMessage.success('物料添加成功')
      supplyDialogVisible.value=false
      // 延迟后重新加载数据，确保后端处理完成
      await new Promise(resolve => setTimeout(resolve, 500))
      await resourceStore.fetchResources(projectId)
    } catch (error) {
      console.error('物料保存失败:', error)
      ElMessage.error(`保存失败: ${error.message || '未知错误'}`)
    }
  })
}

// ==== 数字资料行编辑功能 ====
async function saveDigitalRow(row: DigitalAsset) {
  if (!row.name || !row.uploader) {
    ElMessage.warning('请填写必填字段')
    return
  }
  
  try {
    await resourceStore.updateResource(projectId, row.id, {
      name: row.name,
      responsible: row.uploader, // 修复字段映射：uploader -> responsible
      agendaItem: row.agendaItem,
    })
    row._editing = false
    ElMessage.success('数字资料更新成功')
  } catch (error) {
    console.error('数字资料更新失败:', error)
    ElMessage.error(`更新失败: ${error.message || '未知错误'}`)
  }
}

function cancelDigitalRow(row: DigitalAsset) {
  // 重新获取数据恢复原状态，或者保存原始数据来恢复
  row._editing = false
  // 这里应该恢复row的原始数据，但为了简化先直接关闭编辑
  ElMessage.info('已取消编辑')
}

async function deleteDigitalRow(row: DigitalAsset) {
  try {
    await ElMessageBox.confirm('确定删除该数字资料？', '提示', { type: 'warning' })
    await resourceStore.deleteResource(projectId, row.id)
    ElMessage.success('数字资料删除成功')
  } catch (error) {
    if (error !== 'cancel') {
      console.error('数字资料删除失败:', error)
      ElMessage.error(`删除失败: ${error.message || '未知错误'}`)
    }
  }
}



</script>

<style scoped>
.resource-management {
  width: 100%;
}
.toolbar {
  margin-bottom: 16px;
  display: flex;
  gap: 8px;
}
.resource-tabs {
  border: none;
  box-shadow: none;
}
.el-icon {
    font-size: 16px;
    vertical-align: middle;
}



@media print {
  /* Hide everything except the printable area */
  body * {
    visibility: hidden;
  }
  .resource-management, .resource-management * {
    visibility: visible;
  }
  .resource-management {
    position: absolute;
    left: 0;
    top: 0;
    width: 100%;
  }

  /* Hide non-essential parts within the component */
  .resource-tabs .el-tabs__header,
  .toolbar,
  .el-table__header-wrapper .el-table-column--selection,
  .el-table__body-wrapper .el-table-column--selection,
  .el-table .el-table__header-wrapper th:last-child,
  .el-table .el-table__body-wrapper td:last-child {
    display: none;
  }
  
  /* Ensure only the correct tab is visible */
  .el-tab-pane {
    display: none !important;
  }
  .el-tab-pane:has(#supply-checklist-table) {
    display: block !important;
  }
}
</style> 