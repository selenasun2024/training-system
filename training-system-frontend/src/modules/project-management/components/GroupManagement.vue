<template>
  <div class="group-management">
    <!-- 操作栏 -->
    <div class="actions-bar">
      <el-button type="primary" @click="handleAutoGroup">
        <el-icon><MagicStick /></el-icon>
        自动分组
      </el-button>
      <el-button type="success" @click="addGroup">
        <el-icon><Plus /></el-icon>
        增加小组
      </el-button>
      <el-button type="info" @click="resetGroups">
        <el-icon><Refresh /></el-icon>
        重置
      </el-button>
    </div>

    <!-- 全新布局: 左侧未分配区，右侧小组网格区 -->
    <div class="group-layout">
      <!-- 左侧: 未分配学员 -->
      <div class="kanban-column unassigned-panel">
        <div class="column-header">
          <h3>未分配 ({{ filteredUnassignedStudents.length }})</h3>
        </div>
        <div class="unassigned-toolbar">
          <el-input
            v-model="searchQuery"
            placeholder="按姓名或部门搜索"
            clearable
            :prefix-icon="Search"
          />
        </div>
        <draggable
          class="kanban-list unassigned-list"
          :list="paginatedUnassignedStudents"
          group="students"
          item-key="id"
          @change="onDragChange($event, null)"
        >
          <template #item="{ element }">
            <div class="student-card">
              <div class="student-info">
                <span class="student-name">{{ element.name }}</span>
                <span class="student-dept">({{ element.department }})</span>
              </div>
            </div>
          </template>
        </draggable>
        <el-pagination
          small
          layout="prev, pager, next"
          :total="filteredUnassignedStudents.length"
          :page-size="pageSize"
          v-model:current-page="currentPage"
          class="pagination"
        />
        <div class="pagination-controls">
          <span>每页显示：</span>
          <el-select v-model="pageSize" size="small" style="width: 80px">
            <el-option label="5" :value="5" />
            <el-option label="10" :value="10" />
            <el-option label="15" :value="15" />
            <el-option label="20" :value="20" />
            <el-option label="全部" :value="filteredUnassignedStudents.length" />
          </el-select>
          <span>人</span>
        </div>
      </div>

      <!-- 右侧: 小组网格 -->
      <div class="groups-grid">
        <div v-for="(group, index) in groups" :key="group.id" class="kanban-column">
          <div class="column-header">
            <el-input v-model="group.name" class="group-name-input" placeholder="小组名称" />
            <el-select
              v-model="group.counselorId"
              :placeholder="counselorsLoading ? '加载中...' : '辅导员'"
              size="small"
              class="counselor-selector"
              clearable
              :loading="counselorsLoading"
              :disabled="counselorsLoading || availableCounselors.length === 0"
              @change="handleCounselorChange(group, $event)"

            >
              <el-option
                v-for="counselor in availableCounselors"
                :key="counselor.id"
                :label="counselor.name"
                :value="counselor.id"
              />
            </el-select>
            <!-- 辅导员加载状态显示 -->
            <small style="display:block;color:#999;margin-top:2px;" v-if="counselorsLoading">
              加载辅导员中...
            </small>
            <small style="display:block;color:#999;margin-top:2px;" v-else-if="availableCounselors.length === 0">
              暂无可选辅导员
            </small>
            <el-button
              type="danger"
              :icon="Delete"
              circle
              size="small"
              @click="removeGroup(group)"
            />
          </div>
          <draggable
            class="kanban-list"
            :list="group.students"
            group="students"
            item-key="id"
            @change="onDragChange($event, group.id)"
          >
            <template #item="{ element }">
              <div class="student-list-item">
                <div class="student-info">
                  <span class="student-name">{{ element.name }}</span>
                  <span class="student-dept">({{ element.department }})</span>
                </div>
                <el-select
                  v-model="element.role"
                  placeholder="分配角色"
                  size="small"
                  class="role-selector"
                >
                  <el-option
                    v-for="role in availableRoles"
                    :key="role.value"
                    :label="role.label"
                    :value="role.value"
                  />
                </el-select>
              </div>
            </template>
          </draggable>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, watchEffect, onMounted } from 'vue';
import draggable from 'vuedraggable';
import { Plus, Delete, MagicStick, Refresh, Search } from '@element-plus/icons-vue';
import { useGroupStore } from '../stores/group';
import { useSystemConfigStore } from '@/stores/systemConfig';
import { getCounselors } from '@/api/modules/user'; // 导入获取辅导员API
import { ElMessage, ElMessageBox } from 'element-plus'; // Added ElMessage and ElMessageBox import

const props = defineProps<{
  projectId: string;
  participants: any[];
  projectType: string;
  projectData?: any; // 添加项目数据属性
}>();

// --- Mock Data ---
const mockStudents = [
  { id: 1, name: '张三', department: '研发部', role: null },
  { id: 2, name: '李四', department: '产品部', role: null },
  { id: 3, name: '王五', department: '研发部', role: null },
  { id: 4, name: '赵六', department: '设计部', role: null },
  { id: 5, name: '孙七', department: '市场部', role: null },
  { id: 6, name: '周八', department: '产品部', role: null },
  { id: 7, name: '吴九', department: '研发部', role: null },
  { id: 8, name: '郑十', department: '市场部', role: null },
  { id: 9, name: '陈十一', department: '测试部', role: null },
  { id: 10, name: '杨十二', department: '运维部', role: null },
];

const initialGroups = [
  { id: 1, name: '第一组', students: [], counselorId: null },
  { id: 2, name: '第二组', students: [], counselorId: null },
  { id: 3, name: '第三组', students: [], counselorId: null },
  { id: 4, name: '第四组', students: [], counselorId: null },
  { id: 5, name: '第五组', students: [], counselorId: null },
  { id: 6, name: '第六组', students: [], counselorId: null },
];

const availableRoles = ref([
  { label: '组长', value: 'LEADER' },
  { label: '成员', value: 'MEMBER' },
  { label: '学习委员', value: 'STUDY_COMMITTEE' },
  { label: '纪律委员', value: 'DISCIPLINE_COMMITTEE' },
]);

// 将原来的硬编码辅导员数据改为响应式数据，后续从API加载
const availableCounselors = ref([]);
const counselorsLoading = ref(false);

// --- Component State ---
const unassignedStudents = ref<any[]>([]);
const groups = ref<any[]>([]);
let nextGroupId = 1; // 用于本地临时ID
const searchQuery = ref('');

// --- Store and Data Sync ---
const groupStore = useGroupStore();
const systemConfigStore = useSystemConfigStore();

// 加载辅导员数据
const loadCounselors = async () => {
  counselorsLoading.value = true;
  try {
    console.log('🔍 开始加载辅导员数据...');
    const counselors = await getCounselors();
    console.log('🔍 原始辅导员数据:', counselors);
    console.log('🔍 数据类型:', typeof counselors, '是否为数组:', Array.isArray(counselors));
    
    if (!Array.isArray(counselors)) {
      console.error('❌ 辅导员数据格式错误，期望数组但得到:', typeof counselors);
      throw new Error('辅导员数据格式错误');
    }
    
    // 转换格式以匹配组件期望的结构
    availableCounselors.value = counselors.map(counselor => {
      if (!counselor.id || !counselor.name) {
        console.warn('⚠️ 辅导员数据不完整:', counselor);
      }
      return {
        id: counselor.id,
        name: counselor.name,
        department: counselor.department,
        position: counselor.position
      };
    });
    
    console.log('✅ 辅导员数据加载完成，共', availableCounselors.value.length, '名辅导员');
    console.log('✅ 转换后的数据:', availableCounselors.value.slice(0, 3));
    
    if (availableCounselors.value.length === 0) {
      console.warn('⚠️ 没有找到任何符合条件的辅导员');
      ElMessage({
        type: 'warning',
        message: '没有找到符合条件的辅导员，请联系管理员添加相关角色用户'
      });
    } else {
      console.log(`✅ 成功加载 ${availableCounselors.value.length} 名可选辅导员`);
    }
    
  } catch (error) {
    console.error('❌ 加载辅导员数据失败:', error);
    
    // 详细错误信息
    if (error.response) {
      console.error('❌ HTTP错误:', error.response.status, error.response.data);
    } else if (error.request) {
      console.error('❌ 网络错误:', error.request);
    } else {
      console.error('❌ 其他错误:', error.message);
    }
    
    // 设置为空数组，避免页面出错
    availableCounselors.value = [];
    
    ElMessage({
      type: 'error',
      message: `加载辅导员数据失败: ${error.message || '未知错误'}。请检查网络连接或联系管理员。`
    });
    
  } finally {
    counselorsLoading.value = false;
  }
};

// 从Store同步分组数据到本地
watch(() => groupStore.groups, (storeGroups) => {
  console.log('🔄 groupStore.groups 变化:', storeGroups);
  console.log('🔄 storeGroups 长度:', storeGroups?.length || 0);
  
  if (storeGroups && storeGroups.length > 0) {
    // 转换store格式到本地格式
    const convertedGroups = storeGroups.map(group => {
      // 从分组成员中找出辅导员（LEADER角色）
      const counselor = group.members?.find(member => member.role === 'LEADER');
      
      return {
        id: group.id,
        name: group.name,
        description: group.description,
        realGroupId: group.id, // 确保设置 realGroupId
        students: group.members?.filter(member => member.role === 'MEMBER').map(member => ({
          id: member.user.id,
          name: member.user.name,
          department: member.user.department,
          position: member.user.position,
          role: member.role
        })) || [],
        counselorId: counselor?.user.id || null // 从分组成员中获取辅导员ID
      };
    });
    
          console.log('🔄 转换后的小组数据:', convertedGroups.length, '个小组');
      console.log('🔄 辅导员分配情况:', convertedGroups.filter(g => g.counselorId).length, '个小组已分配辅导员');
      groups.value = convertedGroups;
  }
}, { deep: true, immediate: true });

// 监听参与者数据变化
watch(() => props.participants, (newParticipants) => {
  console.log('🔍 参与者数据发生变化:', newParticipants);
  console.log('🔍 新参与者数量:', newParticipants?.length || 0);
}, { deep: true, immediate: true });

// 🔧 新增：监听项目数据变化，重新初始化分组
watch(() => props.projectData, (newProjectData, oldProjectData) => {
  console.log('🔍 项目数据发生变化');
  console.log('🔍 新项目数据:', newProjectData?.config?.groups?.length || 0, '个小组');
  console.log('🔍 旧项目数据:', oldProjectData?.config?.groups?.length || 0, '个小组');
  
  // 🔧 修复：只有在项目数据真正变化且包含分组配置时才重新初始化
  if (newProjectData?.config?.groups && 
      newProjectData.config.groups.length > 0 &&
      // 防止重复初始化：检查分组数据是否真的变化了
      (!oldProjectData?.config?.groups || 
       JSON.stringify(newProjectData.config.groups) !== JSON.stringify(oldProjectData.config.groups))) {
    console.log('🔍 项目分组配置有实质性变化，重新初始化分组');
    
    // 直接恢复分组数据，不需要重新调用initializeGroups
    groups.value = newProjectData.config.groups.map(group => ({
      ...group,
      students: group.students || []
    }));
    
    console.log('🔍 直接恢复了', groups.value.length, '个小组');
  }
}, { deep: true });

// 根据传入的参与者和已分组的学员/辅导员，计算出未分配的学员
const allAssignedUserIds = computed(() => {
  const userIds = new Set<string>();
  groups.value.forEach(group => {
    // 添加分组中的学员
    group.students?.forEach((student: any) => {
      userIds.add(student.id);
    });
    // 添加分组中的辅导员
    if (group.counselorId) {
      userIds.add(group.counselorId);
    }
  });
  return userIds;
});

watchEffect(() => {
  // 将参与者数据转换为正确的格式，提取user信息到顶层
  const convertedParticipants = props.participants.map(participant => {
    // 如果participant已经是用户格式（直接有name字段），直接使用
    if (participant.name) {
      return participant;
    }
    // 如果是ProjectParticipant格式（有user字段），提取用户信息
    if (participant.user) {
      return {
        id: participant.user.id,
        name: participant.user.name || participant.user.username,
        department: participant.user.department,
        email: participant.user.email,
        level: participant.user.level,
        role: null, // 初始化角色为null
        // 保留原始参与者信息
        originalParticipant: participant
      };
    }
    // 兜底：如果都没有，返回原数据
    return participant;
  });

  console.log('🔍 转换后的参与者数据:', convertedParticipants);
  
  unassignedStudents.value = convertedParticipants.filter(p => !allAssignedUserIds.value.has(p.id));
});

// --- Init Logic ---
onMounted(async () => {
  console.log('🔍 GroupManagement mounted - 传入的参与者数据:', props.participants);
  console.log('🔍 参与者数据长度:', props.participants?.length || 0);
  console.log('🔍 初始 projectId 验证:', props.projectId, typeof props.projectId);
  
  // 测试后端连接
  try {
    console.log('🔍 测试后端连接...');
    const testResponse = await fetch('http://localhost:3000/api/users/search?limit=1');
    console.log('🔍 后端连接测试:', testResponse.status, testResponse.statusText);
    
    if (testResponse.ok) {
      const testData = await testResponse.json();
      console.log('🔍 后端响应数据结构:', testData);
    } else {
      console.warn('⚠️ 后端服务器响应异常:', testResponse.status);
    }
  } catch (error) {
    console.error('❌ 后端连接测试失败:', error);
    ElMessage.error('无法连接到后端服务器，请检查后端是否运行');
  }
  
  // 放宽 projectId 验证（允许非UUID格式）
  if (!props.projectId || props.projectId === 'new') {
    console.warn('⚠️ 项目ID无效或为新项目，跳过初始化:', props.projectId);
    return;
  }
  
  if (props.participants?.length > 0) {
    console.log('🔍 第一个参与者数据结构:', props.participants[0]);
  }

  // 异步加载辅导员数据
  await loadCounselors();

  // 直接初始化小组，不依赖外部配置
  await initializeGroups();
  // 加载辅导员数据
  await loadCounselors();
});

// 初始化小组
const initializeGroups = async () => {
  console.log('🔍 开始初始化小组...');
  
  // 🔄 修复：使用独立的分组配置，而不是项目类型配置
  // TODO: 将来可以从 systemConfigStore 中获取分组配置
  const defaultGroupCount = 6; // 暂时硬编码，与系统配置中的默认值保持一致
  
  console.log('🔍 使用独立的分组配置');
  console.log('🔍 默认小组数量:', defaultGroupCount);

  if (props.projectId && props.projectId !== 'new') {
    // 现有项目：优先检查项目配置中的分组数据
    const savedGroupData = props.projectData?.config?.groups;
    if (savedGroupData && savedGroupData.length > 0) {
      console.log('🔍 从项目配置恢复分组数据:', savedGroupData);
      groups.value = savedGroupData.map(group => ({
        ...group,
        students: group.students || []
      }));
      console.log('🔍 恢复了', groups.value.length, '个小组');
      return; // 🔧 关键修复：找到保存数据后直接返回，不再执行后续逻辑
    }
    
    // 如果项目配置没有分组数据，再尝试获取后端小组数据
    await groupStore.fetchGroups(props.projectId);
    
    // 如果后端也没有小组数据，则创建默认数量的小组
    if (!groupStore.groups || groupStore.groups.length === 0) {
      console.log('🔍 现有项目没有任何小组数据，创建默认小组');
      const defaultGroups = [];
      for (let i = 0; i < defaultGroupCount; i++) {
        defaultGroups.push({
          id: `temp-${i + 1}`,
          name: `第${i + 1}组`,
          students: [],
          counselorId: null,
        });
      }
      groups.value = defaultGroups;
    }
    // 🔧 关键修复：如果后端有数据，会通过watch监听groupStore.groups自动更新groups.value
  } else {
    // 新项目：直接创建默认数量的分组
    console.log('🔍 新项目，创建默认小组');
    const defaultGroups = [];
    for (let i = 0; i < defaultGroupCount; i++) {
      defaultGroups.push({
        id: `temp-${i + 1}`,
        name: `第${i + 1}组`,
        students: [],
        counselorId: null,
      });
    }
    groups.value = defaultGroups;
  }
  
  console.log('🔍 最终创建的小组数量:', groups.value.length);
};

// 监听项目类型变化已经不需要了，因为我们不再依赖项目类型
// watch(() => props.projectType, async (newProjectType) => {
//   console.log('🔄 项目类型发生变化:', newProjectType);
//   if (newProjectType) {
//     await initializeGroups();
//   }
// }, { immediate: false });

// 🔧 新增：向父组件暴露的方法
const getGroupData = () => {
  console.log('📝 获取分组数据，当前小组:', groups.value);
  
  // 将分组数据转换为可序列化的格式
  const groupData = groups.value.map(group => ({
    id: group.id,
    name: group.name,
    counselorId: group.counselorId,
    students: group.students?.map(student => ({
      id: student.id,
      name: student.name,
      department: student.department,
      role: student.role
    })) || []
  }));
  
  console.log('📝 转换后的分组数据:', groupData);
  return groupData;
};

// 向父组件暴露方法
defineExpose({
  getGroupData
});


// --- Pagination State ---
const currentPage = ref(1);
const pageSize = ref(10); // 增加每页显示人数从5改为10

const filteredUnassignedStudents = computed(() => {
  if (!searchQuery.value) {
    return unassignedStudents.value;
  }
  return unassignedStudents.value.filter(
    student =>
      student.name.includes(searchQuery.value) ||
      student.department.includes(searchQuery.value)
  );
});

const paginatedUnassignedStudents = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value;
  const end = start + pageSize.value;
  return filteredUnassignedStudents.value.slice(start, end);
});

/*
// === sync to global store ===
const groupStore = useGroupStore();
function syncStore() {
  const mapped = groups.value.map((g:any) => ({
    id: String(g.id),
    groupName: g.name,
    memberCount: g.students.length,
    tutor: availableCounselors.value.find(c=>c.id===g.counselorId)?.name || '',
    leader: g.students.find((s:any)=>s.role==='leader')?.name || '',
    progress: 0,
    status: '未开始',
  }));
  groupStore.setGroups(mapped);
}

// initial sync
syncStore();
watch(groups, syncStore, { deep: true });
*/

// --- Methods ---
const addGroup = () => {
  const newGroupName = `第${groups.value.length + 1}组`;
  const newGroup = {
    id: `temp-${Date.now()}`, // 使用时间戳确保ID唯一
    name: newGroupName,
    students: [],
    counselorId: null,
  };
  
  groups.value.push(newGroup);
  console.log('🔍 添加新小组:', newGroup);
  console.log('🔍 当前小组总数:', groups.value.length);
  
  // 如果是现有项目，同步到后端store
  if (props.projectId && props.projectId !== 'new') {
    groupStore.addGroup(props.projectId, { name: newGroupName });
  }
};

const removeGroup = async (group: any) => {
  try {
    // 确认删除对话框
    await ElMessageBox.confirm(
      `确定要删除"${group.name}"吗？删除后该小组的所有成员将返回到未分配列表。`,
      '删除小组',
      {
        confirmButtonText: '删除',
        cancelButtonText: '取消',
        type: 'warning',
        confirmButtonClass: 'el-button--danger'
      }
    );

    console.log('🔄 开始删除小组:', group);

    // 如果是真实小组，调用后端API删除
    if (!group.id.startsWith('temp-') && props.projectId && props.projectId !== 'new') {
      console.log('🔄 删除真实小组:', group.id);
      await groupStore.removeGroup(group.id, props.projectId);
      console.log('✅ 真实小组删除成功');
    } else {
      console.log('🔄 删除临时小组:', group.id);
    }

    // 将小组中的成员返回到未分配列表
    if (group.students && group.students.length > 0) {
      console.log('🔄 将', group.students.length, '名成员返回未分配列表');
      // 这些成员会自动返回到未分配列表，因为我们删除了小组
    }

    // 从本地列表中移除小组
    const groupIndex = groups.value.findIndex(g => g.id === group.id);
    if (groupIndex !== -1) {
      groups.value.splice(groupIndex, 1);
      console.log('✅ 小组已从本地列表移除');
    }

    ElMessage.success(`小组"${group.name}"已删除`);

  } catch (error) {
    if (error === 'cancel') {
      console.log('🔄 用户取消删除操作');
      return;
    }
    console.error('❌ 删除小组失败:', error);
    ElMessage.error(`删除小组失败: ${error.message || '未知错误'}`);
  }
};

const resetGroups = () => {
  // 重置逻辑需要重新设计，暂时只清空分组
  unassignedStudents.value = [...props.participants];
  groups.value = [];
};

const onDragChange = async (change: any, groupId: string | null) => {
  console.log('🔄 拖拽变化:', change, '目标小组:', groupId);

  try {
    // 学员被添加到一个新分组
    if (change.added) {
      const student = change.added.element;
      const studentId = student.id;
      
      console.log('➕ 添加学员到小组:', { studentId, groupId, student });
      
      // 🔧 获取正确的UUID格式用户ID
      let realUserId = student.id;
      if (student.user && student.user.id) {
        realUserId = student.user.id;
      } else if (student.userId) {
        realUserId = student.userId;
      }
      console.log('🔧 最终使用的用户ID:', realUserId);
      
      if (groupId) {
        let realGroupId = groupId;
        
        // 如果是临时小组ID，先创建真实小组
        if (groupId.startsWith('temp-')) {
          console.log('🔧 临时小组，需要先创建真实小组');
          
          if (props.projectId && props.projectId !== 'new') {
            try {
              const tempGroup = groups.value.find(g => g.id === groupId);
              if (tempGroup) {
                const createdGroup = await groupStore.addGroup(props.projectId, { 
                  name: tempGroup.name,
                  description: tempGroup.description || '' 
                });
                
                const groupIndex = groups.value.findIndex(g => g.id === groupId);
                if (groupIndex !== -1) {
                  groups.value[groupIndex].id = createdGroup.id;
                  realGroupId = createdGroup.id;
                  console.log('🔧 小组ID已更新:', groupId, '->', realGroupId);
                }
              }
            } catch (error) {
              console.error('❌ 创建真实小组失败:', error);
              ElMessage.error('创建小组失败');
              return;
            }
          } else {
            console.log('🔧 新项目，暂时使用本地更新');
            return;
          }
        }
        
        // 添加成员到小组 - 使用正确的角色名称
        if (realGroupId && !realGroupId.startsWith('temp-')) {
          console.log('🔧 添加成员到真实小组:', realGroupId);
          
          try {
            // 🔧 修复：使用 'MEMBER' 而不是 'STUDENT' 作为默认角色
            await groupStore.addMember(realGroupId, { userId: realUserId, role: 'MEMBER' }, props.projectId);
            console.log('✅ 学员添加成功，角色：MEMBER');
          } catch (error) {
            if (error.response?.status === 409) {
              console.log('ℹ️ 学员已在该小组中，继续执行');
            } else {
              console.error('❌ 添加成员失败:', error);
              throw error;
            }
          }
        }
      }
    }

    // 🔧 优化：学员从分组中被移除时，只处理真实分组
    if (change.removed) {
      const student = change.removed.element;
      
      // 获取正确的用户ID
      let realUserId = student.id;
      if (student.user && student.user.id) {
        realUserId = student.user.id;
      } else if (student.userId) {
        realUserId = student.userId;
      }
      
      console.log('➖ 从小组移除学员:', realUserId);
      
      // 🔧 关键修复：安全地查找学员所在的真实小组
      try {
        // 确保 groupStore.groups 存在且是数组
        if (!groupStore.groups || !Array.isArray(groupStore.groups)) {
          console.log('ℹ️ 分组数据为空，刷新数据后重试');
          await refreshGroupData();
        }

        const realSourceGroup = groupStore.groups?.find(group => 
          group.members?.some(member => 
            member.user.id === realUserId && (member.role === 'MEMBER' || member.role === 'STUDENT')
          )
        );

        if (realSourceGroup) {
          console.log('🔧 从真实小组移除成员:', realSourceGroup.id);
          
          try {
            await groupStore.removeMember(realSourceGroup.id, realUserId, props.projectId);
            console.log('✅ 学员移除成功');
          } catch (error) {
            if (error.response?.status === 404) {
              console.log('ℹ️ 学员不在该小组中（404），跳过移除操作');
            } else {
              console.error('❌ 移除失败:', error);
              // 非404错误才抛出，避免影响后续操作
              if (error.response?.status !== 404) {
                throw error;
              }
            }
          }
        } else {
          console.log('ℹ️ 学员不在任何真实小组中，无需后端移除操作');
        }
      } catch (error) {
        console.error('❌ 处理移除操作时出错:', error);
        // 不阻止拖拽操作继续进行
      }
    }

    // 🔧 操作完成后刷新数据，确保界面同步
    console.log('🔄 拖拽操作完成，刷新分组数据...');
    await refreshGroupData();
    
  } catch (error) {
    console.error('❌ 拖拽操作失败:', error);
    
    let errorMessage = '操作失败';
    if (error.response) {
      const status = error.response.status;
      const responseData = error.response.data;
      
      switch (status) {
        case 400:
          errorMessage = responseData?.message || '请求参数错误';
          break;
        case 409:
          errorMessage = '用户已在该小组中';
          break;
        case 404:
          errorMessage = '小组或用户不存在';
          break;
        default:
          errorMessage = `服务器错误: ${responseData?.message || error.message}`;
      }
    } else {
      errorMessage = error.message || '网络连接错误';
    }
    
    ElMessage.error(errorMessage);
    
    // 发生错误时重新加载分组数据
    await refreshGroupData();
  }
};

const findStudentGroupId = (studentId: string): string | null => {
  for (const group of groups.value) {
    if (group.students?.some((s: any) => s.id === studentId)) {
      return group.id;
    }
  }
  return null;
}



const handleAutoGroup = () => {
  resetGroups();
  const allStudents = [...unassignedStudents.value];
  let currentGroupIndex = 0;
  while (allStudents.length > 0) {
    const randomIndex = Math.floor(Math.random() * allStudents.length);
    const student = allStudents.splice(randomIndex, 1)[0];
    if (groups.value[currentGroupIndex]) {
      groups.value[currentGroupIndex].students.push(student);
    }
    currentGroupIndex++;
    if (currentGroupIndex >= groups.value.length) {
      currentGroupIndex = 0;
    }
  }
  unassignedStudents.value = [];
};

// 处理辅导员选择变化
const handleCounselorChange = async (group: any, newCounselorId: string | null) => {
  try {
    console.log('🔄 辅导员选择变化:', { groupId: group.id, newCounselorId });
    console.log('🔍 当前 projectId:', props.projectId, typeof props.projectId);
    console.log('🔍 projectId 长度:', props.projectId?.length);
    console.log('🔍 是否为UUID格式:', /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(props.projectId || ''));
    
    // 验证 projectId
    if (!props.projectId || typeof props.projectId !== 'string' || props.projectId === 'new') {
      console.warn('⚠️ 项目ID无效或为新项目，跳过辅导员更新:', props.projectId);
      return;
    }
    
    // 验证 UUID 格式（放宽验证，允许其他格式的项目ID）
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(props.projectId)) {
      console.warn('⚠️ 项目ID不是标准UUID格式，但继续处理:', props.projectId);
      // 不再抛出错误，允许非UUID格式的项目ID
    }
    
    // 🔧 关键修复：先确保辅导员是项目参与者
    if (newCounselorId) {
      console.log('🔧 第1步：确保辅导员是项目参与者');
      try {
        // 导入项目参与者API
        const { addProjectParticipant } = await import('@/api/modules/user');
        
        // 添加为项目参与者（COUNSELOR角色）
        await addProjectParticipant(props.projectId, {
          userId: newCounselorId,
          role: 'counselor', // 使用小写，与API期望的格式一致
          notes: `通过分组管理添加的辅导员`
        });
        console.log('✅ 辅导员已添加为项目参与者');
        
      } catch (error) {
        if (error.response?.status === 409) {
          console.log('ℹ️ 辅导员已经是项目参与者，继续执行');
        } else {
          console.error('❌ 添加辅导员为项目参与者失败:', error);
          // 这里不抛出错误，继续执行分组分配
        }
      }
    }
    
    // 🔧 第2步：处理分组中的辅导员分配
    console.log('🔧 第2步：处理分组中的辅导员分配');
    
    // 如果这是一个临时分组（没有realGroupId），先创建真实的分组
    if (!group.realGroupId) {
      const createdGroup = await groupStore.addGroup(props.projectId, {
        name: group.name,
        description: ''
      });
      group.realGroupId = createdGroup.id;
      console.log('✅ 创建真实分组:', createdGroup.id);
    }
    
    // 获取当前分组的所有成员，找出现有的辅导员
    const currentGroup = groupStore.groups.find(g => g.id === group.realGroupId);
    const currentCounselor = currentGroup?.members?.find(m => m.role === 'LEADER' || m.role === 'COUNSELOR');
    
    // 如果有现有的辅导员且不是新选择的辅导员，先移除
    if (currentCounselor && currentCounselor.user.id !== newCounselorId) {
      console.log('🔄 移除现有辅导员:', currentCounselor.user.id);
      try {
        await groupStore.removeMember(group.realGroupId, currentCounselor.user.id, props.projectId);
      } catch (error) {
        if (error.response?.status === 404) {
          console.log('ℹ️ 辅导员不在分组中（404），继续执行');
        } else {
          throw error;
        }
      }
    }
    
    // 如果选择了新的辅导员，添加为LEADER角色
    if (newCounselorId && (!currentCounselor || currentCounselor.user.id !== newCounselorId)) {
      console.log('🔄 添加新辅导员到分组:', newCounselorId, '角色：LEADER');
      try {
        await groupStore.addMember(group.realGroupId, { 
          userId: newCounselorId, 
          role: 'LEADER' 
        }, props.projectId);
        console.log('✅ 辅导员添加到分组成功');
      } catch (error) {
        if (error.response?.status === 409) {
          console.log('ℹ️ 辅导员已在分组中，尝试更新角色');
          // 如果用户已在分组中，可能需要更新角色（这里暂时忽略）
        } else {
          throw error;
        }
      }
    }
    
    console.log('✅ 辅导员更新完成（包括项目参与者和分组分配）');
    
    // 🔧 新增：刷新分组数据以确保UI同步
    await refreshGroupData();
    
    // 🔧 新增：通知父组件参与者数据已更新
    // 这样可以触发项目参与者列表的刷新
    console.log('🔧 通知父组件参与者数据已更新');
    
  } catch (error) {
    console.error('❌ 辅导员更新失败:', error);
    
    let errorMessage = '更新辅导员失败';
    
    // 处理不同类型的错误
    if (error && typeof error === 'object') {
      if (error.response?.data?.message) {
        // 后端返回的标准错误格式
        errorMessage = error.response.data.message;
      } else if (Array.isArray(error.response?.data)) {
        // 验证错误数组格式
        errorMessage = error.response.data.join(', ');
      } else if (error.message) {
        // 标准 Error 对象
        errorMessage = error.message;
      }
    }
    
    ElMessage({
      type: 'error',
      message: errorMessage
    });
    
    // 回滚选择
    group.counselorId = null;
    
    // 错误时也刷新数据，确保状态一致
    await refreshGroupData();
  }
};

// 🔧 新增：重新加载分组数据，确保前后端状态同步
const refreshGroupData = async () => {
  try {
    if (props.projectId && props.projectId !== 'new') {
      console.log('🔄 重新加载分组数据...');
      await groupStore.fetchGroups(props.projectId);
      console.log('✅ 分组数据重新加载成功');
    }
  } catch (error) {
    console.error('❌ 重新加载分组数据失败:', error);
  }
};
</script>

<style lang="scss" scoped>
.group-management {
  padding: 20px;
}

.actions-bar {
  margin-bottom: 20px;
}

.group-layout {
  display: flex;
  gap: 20px;
  align-items: flex-start;
}

.unassigned-panel {
  flex: 0 0 300px;
  display: flex;
  flex-direction: column;
  height: 580px; /* 调整固定高度以更好地匹配右侧两排小组 */
}

.groups-grid {
  flex-grow: 1;
  display: flex;
  flex-wrap: wrap;
  gap: 20px;
  align-content: flex-start;
}

.kanban-column {
  flex: 0 0 280px; /* 固定宽度，不再拉伸 */
  background-color: #f4f5f7;
  border-radius: 8px;
  display: flex;
  flex-direction: column;
}

.unassigned-panel.kanban-column {
  background-color: #fef0f0;
}

.column-header {
  padding: 10px 15px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;

  h3 {
    margin: 0;
    font-size: 16px;
  }
  
  .group-name-input {
    flex-grow: 1;
  }

  .counselor-selector {
    width: 110px;
    margin: 0 8px;
    flex-shrink: 0;
  }
}

.column-footer {
  padding: 0 15px 10px;
  flex-shrink: 0;
  border-top: 1px solid #e0e0e0;

  .counselor-selector {
    width: 100%;
  }
}

.kanban-list {
  min-height: 220px;
  padding: 10px;
  flex-grow: 1;
  border-radius: 0 0 8px 8px;
  background-color: #f4f5f7;
  transition: background-color 0.2s;
  overflow-y: auto;
}

.unassigned-list {
  background-color: #fef0f0;
}

.unassigned-toolbar {
  padding: 0 15px 10px;
  flex-shrink: 0;
}

.pagination {
  padding: 8px;
  justify-content: center;
  flex-shrink: 0;
  background-color: #fef0f0;
  border-radius: 0 0 8px 8px;
}

.pagination-controls {
  padding: 8px 15px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  gap: 8px;
  background-color: #f5f7fa;
  border-top: 1px solid #e4e7ed;
  border-radius: 0 0 8px 8px;
  font-size: 12px;
  color: #606266;
}

.student-list-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 4px;
  border-bottom: 1px solid #e9e9eb;
  cursor: grab;
  transition: background-color 0.2s ease;

  &:last-child {
    border-bottom: none;
  }

  &:hover {
    background-color: #ecf5ff;
  }

  .student-info {
    flex-grow: 1;
    display: flex;
    align-items: center;
    gap: 6px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .student-name {
    font-weight: 500;
  }

  .student-dept {
    font-size: 12px;
    color: #909399;
  }
  
  .role-selector {
    max-width: 100px;
    flex-shrink: 0;
  }
}

.sortable-ghost {
  opacity: 0.5;
  background: #c8ebfb;
}
</style> 