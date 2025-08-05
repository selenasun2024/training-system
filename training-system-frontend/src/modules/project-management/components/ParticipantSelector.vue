<template>
  <div class="participant-selector-pro">
    <!-- 成员列表区 -->
    <el-card class="list-card">
      <template #header>
        <div class="card-header">
          <span>推荐学员列表 (共 {{ displayList.length }} 人)</span>
          <el-button type="primary" link @click="openAddDialog">手动新增</el-button>
        </div>
      </template>
      <el-table :data="paginatedDisplayList" style="width: 100%" @selection-change="handleSelectionChange">
        <el-table-column type="selection" width="55" />
        <el-table-column prop="name" label="姓名" sortable />
        <el-table-column prop="department" label="部门" sortable />
        <el-table-column prop="level" label="职级" sortable />
        <el-table-column prop="hireDate" label="入职日期" sortable>
          <template #default="scope">
            {{ formatDate(scope.row.hireDate) }}
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="100" sortable>
          <template #default="scope">
            <el-tag :type="scope.row.status === '已选择' ? 'success' : 'info'">
              {{ scope.row.status }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="80">
          <template #default="scope">
            <el-button type="danger" link @click="handleDelete(scope.row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
      <el-pagination
        v-model:current-page="mainListPage"
        v-model:page-size="mainListPageSize"
        :page-sizes="[10, 20, 50, 100]"
        layout="total, sizes, prev, pager, next, jumper"
        :total="displayList.length"
        @size-change="handleMainSizeChange"
        @current-change="handleMainCurrentChange"
        class="pagination-footer"
      />
      <div class="actions-footer">
        <el-button type="primary" @click="onConfirmSelection">确认选择 ({{ selectedCount }}人)</el-button>
      </div>
    </el-card>

    <!-- 说明 -->
    <el-alert type="info" :closable="false" show-icon style="margin-top: 20px;">
      <p>当前列表是根据"系统配置"中的规则进行智能初筛后的结果。</p>
      <p>您可以在此基础上通过"删除"操作移除个别人员，或通过"手动新增"来增补名单。</p>
    </el-alert>

    <!-- 手动新增学员弹窗 -->
    <el-dialog v-model="addDialogVisible" title="手动新增学员" width="70%">
      <!-- 筛选区 -->
      <el-card class="filter-card" shadow="never">
        <el-form :model="filters" inline>
          <el-form-item label="部门">
            <el-select v-model="filters.department" placeholder="请选择部门" clearable>
              <el-option 
                v-for="dept in departmentOptions" 
                :key="dept" 
                :label="dept" 
                :value="dept" 
              />
            </el-select>
          </el-form-item>
          <el-form-item label="职级">
            <el-select v-model="filters.level" placeholder="请选择职级" clearable>
              <el-option 
                v-for="level in levelOptions" 
                :key="level" 
                :label="level" 
                :value="level" 
              />
            </el-select>
          </el-form-item>
          <el-form-item label="入职日期">
            <el-date-picker v-model="filters.hireDate" type="daterange" range-separator="至" start-placeholder="开始日期" end-placeholder="结束日期" />
          </el-form-item>
          <el-form-item>
            <el-button type="primary" @click="applyDialogFilters">筛选</el-button>
            <el-button @click="resetDialogFilters">重置</el-button>
          </el-form-item>
        </el-form>
      </el-card>
      <!-- 弹窗内的可添加人员列表 -->
      <el-table :data="paginatedFilteredAddableParticipants" style="width: 100%" @selection-change="handleAddSelectionChange">
        <el-table-column type="selection" width="55" />
        <el-table-column prop="name" label="姓名" />
        <el-table-column prop="department" label="部门" />
        <el-table-column prop="level" label="职级" />
      </el-table>
      <el-pagination
        v-model:current-page="dialogListPage"
        v-model:page-size="dialogListPageSize"
        :page-sizes="[10, 20, 50, 100]"
        layout="total, sizes, prev, pager, next, jumper"
        :total="filteredAddableParticipants.length"
        @size-change="handleDialogSizeChange"
        @current-change="handleDialogCurrentChange"
        class="pagination-footer"
      />
      <template #footer>
        <el-button @click="addDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="confirmAddParticipants">确认添加</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { useSystemConfigStore } from '@/stores/systemConfig';
import { searchUsers, getDepartments, getLevels } from '@/api/modules/user';
import { addProjectParticipant, removeProjectParticipant } from '@/api/modules/project';
import type { User } from '@/types/user';

interface Props {
  projectType?: string;
  projectData?: any; // 添加项目数据，用于恢复已保存的参与者
}

const props = defineProps<Props>();

// 系统配置Store
const systemConfigStore = useSystemConfigStore();

// 日期格式化函数
function formatDate(dateString: string | null | undefined): string {
  if (!dateString) return '-';
  try {
    const date = new Date(dateString);
    return date.toISOString().split('T')[0]; // 返回 YYYY-MM-DD 格式
  } catch {
    return '-';
  }
}

console.log('🔍 接收到的项目类型:', props.projectType);

// --- 弹窗内的筛选逻辑 ---
const filters = ref({
  department: '',
  level: '',
  hireDate: null,
});
const applyDialogFilters = () => {
  // 筛选时重置到第一页
  dialogListPage.value = 1;
  ElMessage.success('筛选完成');
};
const resetDialogFilters = () => {
  filters.value = { department: '', level: '', hireDate: null };
  // 重置时也回到第一页
  dialogListPage.value = 1;
};
// --- 结束 ---

// --- 分页状态 ---
// 主列表分页
const mainListPage = ref(1);
const mainListPageSize = ref(10);
// 弹窗列表分页
const dialogListPage = ref(1);
const dialogListPageSize = ref(10);
// --- 结束 ---

// 所有员工数据
const allParticipants = ref<User[]>([]);

// 主界面中用于显示的数据列表 (可被修改)
const displayList = ref<User[]>([]);

// 筛选选项
const departmentOptions = ref<string[]>([]);
const levelOptions = ref<string[]>([]);

// 加载用户数据
const loadUsers = async () => {
  try {
    const users = await searchUsers({ limit: 100 });
    allParticipants.value = users;
    isDataLoaded.value = true;
    console.log('🔍 用户数据加载完成，共', users.length, '名用户');
    
    // 🔧 修复：只在首次加载且未初始化时执行智能筛选
    if (!isInitialized.value) {
      console.log('🔍 用户数据加载完成，执行智能筛选');
      applySmartFilter();
      isInitialized.value = true;
    }
  } catch (error) {
    console.error('加载用户数据失败:', error);
    ElMessage.error('加载用户数据失败');
  }
};

// 加载筛选选项
const loadFilterOptions = async () => {
  try {
    const [departments, levels] = await Promise.all([
      getDepartments(),
      getLevels()
    ]);
    departmentOptions.value = departments;
    levelOptions.value = levels;
  } catch (error) {
    console.error('加载筛选选项失败:', error);
  }
};

// --- 主列表分页逻辑 ---
const paginatedDisplayList = computed(() => {
  const start = (mainListPage.value - 1) * mainListPageSize.value;
  const end = start + mainListPageSize.value;
  return displayList.value.slice(start, end);
});
const handleMainSizeChange = (val: number) => {
  mainListPageSize.value = val;
  mainListPage.value = 1; // 切换每页数量时，重置到第一页
};
const handleMainCurrentChange = (val: number) => {
  mainListPage.value = val;
};
// --- 结束 ---

// --- 手动新增相关 ---
const addDialogVisible = ref(false);
const selectedToAdd = ref([]);

const openAddDialog = () => {
  addDialogVisible.value = true;
  // 每次打开弹窗时，重置弹窗的分页到第一页
  dialogListPage.value = 1;
}

// 可供添加的人员 = 所有人员 - 已在显示列表中的人员
const addableParticipants = computed(() => {
  const displayIds = new Set(displayList.value.map(p => p.id));
  return allParticipants.value.filter(p => !displayIds.has(p.id));
});

// 对可添加人员列表进行筛选
const filteredAddableParticipants = computed(() => {
  let result = addableParticipants.value;
  // 部门筛选
  if (filters.value.department) {
    result = result.filter(p => p.department === filters.value.department);
  }
  // 职级筛选
  if (filters.value.level) {
    result = result.filter(p => p.level === filters.value.level);
  }
  // 日期筛选
  if (filters.value.hireDate && filters.value.hireDate.length === 2) {
    const [startDate, endDate] = filters.value.hireDate;
    result = result.filter(p => {
      if (!p.hireDate) return false;
      const hireDate = new Date(p.hireDate);
      return hireDate >= startDate && hireDate <= endDate;
    });
  }
  return result;
});

// 组件挂载时加载数据
onMounted(() => {
  loadUsers();
  loadFilterOptions();
});

// --- 弹窗列表分页逻辑 ---
const paginatedFilteredAddableParticipants = computed(() => {
  const start = (dialogListPage.value - 1) * dialogListPageSize.value;
  const end = start + dialogListPageSize.value;
  return filteredAddableParticipants.value.slice(start, end);
});
const handleDialogSizeChange = (val: number) => {
  dialogListPageSize.value = val;
  dialogListPage.value = 1;
};
const handleDialogCurrentChange = (val: number) => {
  dialogListPage.value = val;
};
// --- 结束 ---

const handleAddSelectionChange = (selection) => {
  selectedToAdd.value = selection;
};

const confirmAddParticipants = async () => {
  if (selectedToAdd.value.length === 0) {
    ElMessage.warning('您没有选择任何人员');
    return;
  }

  try {
    const addPromises = selectedToAdd.value.map(participant => 
      addProjectParticipant(props.projectData.id, {
        userId: participant.id,
        role: 'STUDENT',
      })
    );
    await Promise.all(addPromises);
    
    ElMessage.success(`${selectedToAdd.value.length} 名学员添加成功`);
    addDialogVisible.value = false;
    
    // 通知父组件刷新数据
    emit('participantsUpdated', []);

  } catch (error) {
    console.error('❌ 添加参与者失败:', error);
    ElMessage.error(`添加失败: ${error.response?.data?.message || error.message}`);
  }
};

// 计算并更新显示列表的函数(用于智能初筛)
const applyInitialFilter = () => {
  let result = allParticipants.value;
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(endDate.getDate() - 90);

  result = result.filter(p => {
    if (!p.hireDate) return false;
    const hireDate = new Date(p.hireDate);
    return hireDate >= startDate && hireDate <= endDate;
  });

  displayList.value = result;
};

const selectedParticipants = ref([]);
const selectedCount = computed(() => selectedParticipants.value.length);

const handleSelectionChange = (selection) => {
  selectedParticipants.value = selection;
};

const handleDelete = async (rowToDelete: any) => {
  try {
    // 如果是新推荐的，直接从列表移除
    if (rowToDelete.status === '待选择') {
      displayList.value = displayList.value.filter(item => item.id !== rowToDelete.id);
      ElMessage.warning(`已将 ${rowToDelete.name} 从推荐列表中移除`);
      return;
    }

    // 如果是已选择的，需要调用API删除
    await ElMessageBox.confirm(
      `确定要从项目中移除学员 "${rowToDelete.name}" 吗？`,
      '确认移除',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning',
      }
    );
    
    await removeProjectParticipant(props.projectData.id, rowToDelete.id);
    ElMessage.success(`学员 "${rowToDelete.name}" 已成功从项目中移除`);
    
    // 通知父组件刷新数据
    emit('participantsUpdated', []);
    
  } catch (error) {
    if (error !== 'cancel') {
      console.error('❌ 移除参与者失败:', error);
      ElMessage.error(`移除失败: ${error.response?.data?.message || error.message}`);
    }
  }
};

const emit = defineEmits<{
  participantsUpdated: [participants: any[]]
}>();

const onConfirmSelection = async () => {
  if(selectedCount.value === 0) {
    ElMessage.warning('请至少选择一名学员');
    return;
  }

  // 检查是否为新项目
  if (!props.projectData?.id || props.projectData?.id === 'new') {
    ElMessage.warning('请先保存项目，然后再确认选择参与者');
    
    // 通知父组件参与者已选择（用于新项目的临时存储）
    emit('participantsUpdated', selectedParticipants.value);
    return;
  }

  try {
    console.log('🔄 开始保存参与者到数据库...');
    
    // 为现有项目保存参与者到后端（循环添加每个参与者）
    const addPromises = selectedParticipants.value.map(participant => {
      console.log('🔄 添加参与者:', participant.name, participant.id);
      return addProjectParticipant(props.projectData.id, {
        userId: participant.id,
        role: 'STUDENT', // 默认角色
        notes: `通过对象选择添加于 ${new Date().toLocaleString()}`
      });
    });

    await Promise.all(addPromises);
    
    const selectedNames = selectedParticipants.value.map(p => p.name).join(', ');
    ElMessage.success(`已成功保存参与者到数据库: ${selectedNames}`);
    
    // 通知父组件参与者已更新
    emit('participantsUpdated', selectedParticipants.value);
    
    // 清空选择，因为已经保存了
    selectedParticipants.value = [];
    
    console.log('✅ 参与者保存完成');
    
  } catch (error) {
    console.error('❌ 保存参与者失败:', error);
    if (error.response?.status === 409) {
      ElMessage.warning('部分参与者已经在项目中，只添加了新的参与者');
    } else {
      ElMessage.error(`保存参与者失败: ${error.response?.data?.message || error.message}`);
    }
  }
};

// 智能筛选逻辑
const applySmartFilter = () => {
  console.log('🔍 开始智能筛选，项目数据:', props.projectData);
  console.log('🔍 项目ID:', props.projectData?.id);
  console.log('🔍 项目参与者原始数据:', props.projectData?.participants);
  console.log('🔍 参与者数组长度:', props.projectData?.participants?.length || 0);

  // 🔧 关键修改：合并“已保存”和“新推荐”的参与者
  
  // 第一步：获取已保存的参与者
  const savedParticipants = (props.projectData?.participants || [])
    .filter((p: any) => p.user)
    .map((p: any) => ({
      id: p.user.id || p.userId,
      name: p.user.name || p.user.username,
      email: p.user.email,
      department: p.user.department,
      level: p.user.level,
      hireDate: p.user.hireDate,
      status: '已选择' // 标记为已选择
    }));
  
  const savedParticipantIds = new Set(savedParticipants.map(p => p.id));
  console.log('🔍 已保存的参与者:', savedParticipants.length, '人');

  // 第二步：获取新推荐的参与者（排除已保存的）
  let recommendedParticipants: User[] = [];
  if (!props.projectType) {
    console.log('🔍 未指定项目类型，推荐所有其他员工');
    recommendedParticipants = allParticipants.value
      .filter(user => !savedParticipantIds.has(user.id));
  } else {
    const projectTypeName = systemConfigStore.getProjectTypeById(props.projectType)?.name;
    console.log('🔍 项目类型:', projectTypeName, '(ID:', props.projectType, ')');
    
    if (systemConfigStore.hasFilterRules(props.projectType)) {
      console.log('🔍 应用系统配置的筛选规则');
      recommendedParticipants = systemConfigStore.filterUsersByType(props.projectType, allParticipants.value)
        .filter(user => !savedParticipantIds.has(user.id)); // 排除已保存的
    } else {
      console.log('🔍 项目类型未配置筛选规则，推荐所有其他员工');
      recommendedParticipants = allParticipants.value
        .filter(user => !savedParticipantIds.has(user.id));
    }
  }
  
  // 给新推荐的参与者打上“待选择”标记
  const newRecommended = recommendedParticipants.map(user => ({...user, status: '待选择'}));
  console.log('🔍 新推荐的参与者:', newRecommended.length, '人');

  // 第三步：合并两个列表，已选择的排在前面
  displayList.value = [...savedParticipants, ...newRecommended];
  console.log('🔍 最终显示列表:', displayList.value.length, '人');
};

// 添加状态控制，防止重复执行智能筛选
const isInitialized = ref(false);
const isDataLoaded = ref(false);

// 监听项目类型变化
watch(() => props.projectType, () => {
  if (allParticipants.value.length > 0 && !isInitialized.value) {
    console.log('🔍 项目类型变化，执行智能筛选');
    applySmartFilter();
    isInitialized.value = true;
  }
}, { immediate: true });

// 🔧 监听项目数据变化
watch(() => props.projectData, () => {
  console.log('🔍 项目数据变化，检查是否需要重新执行智能筛选');
  console.log('🔍 项目参与者数量:', props.projectData?.participants?.length || 0);
  console.log('🔍 isInitialized:', isInitialized.value, 'isDataLoaded:', isDataLoaded.value);
  
  // 🔧 关键修复：无论isInitialized状态如何，都要重新执行智能筛选
  // 因为applySmartFilter内部会判断是否有保存的参与者数据
  if (allParticipants.value.length > 0) {
    console.log('🔍 项目数据加载完成，执行智能筛选逻辑');
    applySmartFilter();
    isInitialized.value = true;
  }
}, { deep: true, immediate: true });

// onMounted生命周期钩子中执行智能初筛
onMounted(() => {
  console.log('🔍 ParticipantSelector组件挂载');
  
  // 延迟执行，确保用户数据已加载
  setTimeout(() => {
    if (allParticipants.value.length > 0 && !isInitialized.value) {
      console.log('🔍 onMounted延迟执行智能筛选');
      applySmartFilter();
      isInitialized.value = true;
    } else {
      console.log('🔍 智能筛选已初始化或用户数据未加载，跳过');
    }
  }, 100);
});
</script>

<style scoped>
.participant-selector-pro {
  padding: 0;
}
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.pagination-footer {
  margin-top: 15px;
  display: flex;
  justify-content: flex-end;
}
.list-card .actions-footer {
  margin-top: 20px;
  text-align: right;
}
.filter-card {
  border: none;
  margin-bottom: 0;
}
</style>