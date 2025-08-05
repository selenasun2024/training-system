<template>
  <el-dialog
    v-model="visible"
    title="参与者管理"
    width="70%"
    :before-close="handleClose"
    class="participant-manager-dialog"
  >
    <div class="manager-content">
      <!-- 操作栏 -->
      <div class="action-bar">
        <div class="left-actions">
          <el-button type="primary" @click="showAddDialog = true">
            <el-icon><Plus /></el-icon>
            添加参与者
          </el-button>
          <el-button @click="importParticipants">
            <el-icon><Upload /></el-icon>
            批量导入
          </el-button>
          <el-button @click="exportParticipants">
            <el-icon><Download /></el-icon>
            导出名单
          </el-button>
        </div>
        <div class="right-actions">
          <el-input
            v-model="searchKeyword"
            placeholder="搜索参与者"
            style="width: 250px;"
            clearable
          >
            <template #prefix>
              <el-icon><Search /></el-icon>
            </template>
          </el-input>
        </div>
      </div>

      <!-- 统计信息 -->
      <div class="stats-bar">
        <el-card class="stat-item">
          <div class="stat-number">{{ totalParticipants }}</div>
          <div class="stat-label">总参与者</div>
        </el-card>
        <el-card class="stat-item">
          <div class="stat-number">{{ checkedInCount }}</div>
          <div class="stat-label">已签到</div>
        </el-card>
        <el-card class="stat-item">
          <div class="stat-number">{{ uncheckedCount }}</div>
          <div class="stat-label">未签到</div>
        </el-card>
        <el-card class="stat-item">
          <div class="stat-number">{{ checkinRate }}%</div>
          <div class="stat-label">签到率</div>
        </el-card>
      </div>

      <!-- 筛选栏 -->
      <div class="filter-bar">
        <el-select v-model="statusFilter" placeholder="签到状态" style="width: 120px;">
          <el-option label="全部" value="" />
          <el-option label="已签到" value="checked" />
          <el-option label="未签到" value="unchecked" />
          <el-option label="迟到" value="late" />
        </el-select>
        <el-select v-model="departmentFilter" placeholder="部门" style="width: 150px;">
          <el-option label="全部部门" value="" />
          <el-option label="技术部" value="技术部" />
          <el-option label="产品部" value="产品部" />
          <el-option label="设计部" value="设计部" />
          <el-option label="运营部" value="运营部" />
        </el-select>
        <el-button @click="resetFilters">重置筛选</el-button>
      </div>

      <!-- 参与者列表 -->
      <div class="participant-list">
        <el-table
          :data="filteredParticipants"
          style="width: 100%"
          @selection-change="handleSelectionChange"
        >
          <el-table-column type="selection" width="55" />
          <el-table-column label="头像" width="80">
            <template #default="{ row }">
              <el-avatar :src="row.avatar" :icon="UserFilled" />
            </template>
          </el-table-column>
          <el-table-column prop="name" label="姓名" width="120" />
          <el-table-column prop="department" label="部门" width="120" />
          <el-table-column prop="position" label="职位" width="150" />
          <el-table-column prop="phone" label="手机号" width="130" />
          <el-table-column prop="email" label="邮箱" width="180" show-overflow-tooltip />
          <el-table-column label="状态" width="100">
            <template #default="{ row }">
              <el-tag :type="getStatusType(row.status)">
                {{ getStatusText(row.status) }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="签到时间" width="160">
            <template #default="{ row }">
              <span v-if="row.checkinTime">{{ formatTime(row.checkinTime) }}</span>
              <span v-else class="text-muted">-</span>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="150" fixed="right">
            <template #default="{ row }">
              <el-button size="small" @click="editParticipant(row)">编辑</el-button>
              <el-button
                size="small"
                type="danger"
                @click="removeParticipant(row)"
              >
                移除
              </el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>

      <!-- 批量操作 -->
      <div class="batch-actions" v-if="selectedParticipants.length > 0">
        <span>已选择 {{ selectedParticipants.length }} 个参与者</span>
        <el-button type="danger" @click="batchRemove">批量移除</el-button>
        <el-button @click="batchNotify">批量通知</el-button>
      </div>
    </div>

    <!-- 添加参与者对话框 -->
    <el-dialog
      v-model="showAddDialog"
      title="添加参与者"
      width="500px"
      append-to-body
    >
      <el-form :model="newParticipant" label-width="80px">
        <el-form-item label="姓名" required>
          <el-input v-model="newParticipant.name" placeholder="请输入姓名" />
        </el-form-item>
        <el-form-item label="部门" required>
          <el-select v-model="newParticipant.department" placeholder="请选择部门" style="width: 100%;">
            <el-option label="技术部" value="技术部" />
            <el-option label="产品部" value="产品部" />
            <el-option label="设计部" value="设计部" />
            <el-option label="运营部" value="运营部" />
          </el-select>
        </el-form-item>
        <el-form-item label="职位">
          <el-input v-model="newParticipant.position" placeholder="请输入职位" />
        </el-form-item>
        <el-form-item label="手机号">
          <el-input v-model="newParticipant.phone" placeholder="请输入手机号" />
        </el-form-item>
        <el-form-item label="邮箱">
          <el-input v-model="newParticipant.email" placeholder="请输入邮箱" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showAddDialog = false">取消</el-button>
        <el-button type="primary" @click="addParticipant">确定</el-button>
      </template>
    </el-dialog>

    <template #footer>
      <div class="dialog-footer">
        <el-button @click="handleClose">关闭</el-button>
        <el-button type="primary" @click="saveChanges">保存更改</el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Upload, Download, Search, UserFilled } from '@element-plus/icons-vue'

interface Props {
  modelValue: boolean
  attendanceId?: string
}

interface Emits {
  (e: 'update:modelValue', value: boolean): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const visible = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

const searchKeyword = ref('')
const statusFilter = ref('')
const departmentFilter = ref('')
const selectedParticipants = ref<any[]>([])
const showAddDialog = ref(false)

// 新参与者表单
const newParticipant = ref({
  name: '',
  department: '',
  position: '',
  phone: '',
  email: ''
})

// 参与者列表
const participants = ref([
  {
    id: '1',
    name: '张三',
    avatar: '',
    department: '技术部',
    position: '高级工程师',
    phone: '13800138001',
    email: 'zhang.san@example.com',
    status: 'checked',
    checkinTime: '2024-01-20T09:05:00'
  },
  {
    id: '2',
    name: '李四',
    avatar: '',
    department: '产品部',
    position: '产品经理',
    phone: '13800138002',
    email: 'li.si@example.com',
    status: 'late',
    checkinTime: '2024-01-20T09:15:00'
  },
  {
    id: '3',
    name: '王五',
    avatar: '',
    department: '设计部',
    position: 'UI设计师',
    phone: '13800138003',
    email: 'wang.wu@example.com',
    status: 'unchecked',
    checkinTime: null
  },
  {
    id: '4',
    name: '赵六',
    avatar: '',
    department: '运营部',
    position: '运营专员',
    phone: '13800138004',
    email: 'zhao.liu@example.com',
    status: 'unchecked',
    checkinTime: null
  }
])

// 计算属性
const totalParticipants = computed(() => participants.value.length)

const checkedInCount = computed(() => 
  participants.value.filter(p => p.status === 'checked' || p.status === 'late').length
)

const uncheckedCount = computed(() => 
  participants.value.filter(p => p.status === 'unchecked').length
)

const checkinRate = computed(() => 
  totalParticipants.value > 0 ? Math.round((checkedInCount.value / totalParticipants.value) * 100) : 0
)

const filteredParticipants = computed(() => {
  let filtered = participants.value

  // 搜索过滤
  if (searchKeyword.value) {
    const keyword = searchKeyword.value.toLowerCase()
    filtered = filtered.filter(p => 
      p.name.toLowerCase().includes(keyword) ||
      p.department.toLowerCase().includes(keyword) ||
      p.position.toLowerCase().includes(keyword) ||
      p.phone.includes(keyword) ||
      p.email.toLowerCase().includes(keyword)
    )
  }

  // 状态过滤
  if (statusFilter.value) {
    filtered = filtered.filter(p => p.status === statusFilter.value)
  }

  // 部门过滤
  if (departmentFilter.value) {
    filtered = filtered.filter(p => p.department === departmentFilter.value)
  }

  return filtered
})

// 方法
const getStatusType = (status: string) => {
  const types = {
    checked: 'success',
    unchecked: 'info',
    late: 'warning',
    absent: 'danger'
  }
  return types[status] || 'info'
}

const getStatusText = (status: string) => {
  const texts = {
    checked: '已签到',
    unchecked: '未签到',
    late: '迟到',
    absent: '缺勤'
  }
  return texts[status] || status
}

const formatTime = (timeStr: string) => {
  return new Date(timeStr).toLocaleString('zh-CN')
}

const handleSelectionChange = (selection: any[]) => {
  selectedParticipants.value = selection
}

const resetFilters = () => {
  searchKeyword.value = ''
  statusFilter.value = ''
  departmentFilter.value = ''
}

const addParticipant = () => {
  if (!newParticipant.value.name || !newParticipant.value.department) {
    ElMessage.warning('请填写必填字段')
    return
  }

  const participant = {
    id: Date.now().toString(),
    ...newParticipant.value,
    avatar: '',
    status: 'unchecked',
    checkinTime: null
  }

  participants.value.push(participant)
  
  // 重置表单
  newParticipant.value = {
    name: '',
    department: '',
    position: '',
    phone: '',
    email: ''
  }
  
  showAddDialog.value = false
  ElMessage.success('添加成功')
}

const editParticipant = (participant: any) => {
  ElMessage.info('编辑功能开发中')
}

const removeParticipant = async (participant: any) => {
  try {
    await ElMessageBox.confirm(`确定要移除 ${participant.name} 吗？`, '确认移除', {
      type: 'warning'
    })
    
    const index = participants.value.findIndex(p => p.id === participant.id)
    if (index > -1) {
      participants.value.splice(index, 1)
      ElMessage.success('移除成功')
    }
  } catch {
    // 用户取消
  }
}

const batchRemove = async () => {
  try {
    await ElMessageBox.confirm(`确定要移除选中的 ${selectedParticipants.value.length} 个参与者吗？`, '批量移除', {
      type: 'warning'
    })
    
    const idsToRemove = selectedParticipants.value.map(p => p.id)
    participants.value = participants.value.filter(p => !idsToRemove.includes(p.id))
    selectedParticipants.value = []
    ElMessage.success('批量移除成功')
  } catch {
    // 用户取消
  }
}

const batchNotify = () => {
  ElMessage.success(`已向 ${selectedParticipants.value.length} 个参与者发送通知`)
}

const importParticipants = () => {
  ElMessage.info('批量导入功能开发中')
}

const exportParticipants = () => {
  ElMessage.info('导出功能开发中')
}

const saveChanges = () => {
  ElMessage.success('保存成功')
  emit('update:modelValue', false)
}

const handleClose = () => {
  emit('update:modelValue', false)
}
</script>

<style scoped>
.participant-manager-dialog :deep(.el-dialog__body) {
  padding: 0 20px 20px;
}

.manager-content {
  space-y: 20px;
}

.action-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.left-actions {
  display: flex;
  gap: 12px;
}

.stats-bar {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  margin-bottom: 20px;
}

.stat-item {
  text-align: center;
  padding: 16px;
}

.stat-number {
  font-size: 24px;
  font-weight: bold;
  color: #409eff;
  margin-bottom: 4px;
}

.stat-label {
  font-size: 12px;
  color: #666;
}

.filter-bar {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 20px;
}

.participant-list {
  margin-bottom: 20px;
}

.batch-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background: #f5f7fa;
  border-radius: 4px;
  margin-top: 12px;
}

.text-muted {
  color: #999;
}

.dialog-footer {
  text-align: right;
}
</style> 