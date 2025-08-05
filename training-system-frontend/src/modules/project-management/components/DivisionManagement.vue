<template>
  <div class="division-management">
    <!-- 操作栏 -->
    <div class="division-header">
      <div class="header-info">
        <h3>任务分工</h3>
        <span class="subtitle">项目角色定义与任务分配</span>
      </div>
      <div class="header-actions">
        <el-button 
          type="primary" 
          :icon="Plus"
          @click="addRole"
          size="default"
        >
          添加角色
        </el-button>
        <el-button 
          type="primary" 
          :icon="Plus"
          @click="addTask"
          size="default"
        >
          添加任务
        </el-button>
        <el-button 
          :icon="Refresh"
          @click="refreshData"
          size="default"
        >
          刷新
        </el-button>
      </div>
    </div>

    <!-- 项目角色定义表格 -->
    <el-card shadow="never" class="roles-section">
      <template #header>
        <div class="section-header">
          <span class="section-title">项目角色定义</span>
          <el-tag type="info" size="small">{{ roles.length }} 个角色</el-tag>
        </div>
      </template>
      
      <el-table 
        :data="roles" 
        stripe 
        border 
        class="roles-table compact-table"
        :show-header="true"
        empty-text="暂无角色定义"
        size="small"
        :cell-style="{ padding: '8px 12px' }"
        :header-cell-style="{ padding: '8px 12px', backgroundColor: '#fafafa' }"
      >
        <el-table-column prop="name" label="角色名称" width="150">
          <template #default="{ row, $index }">
            <el-input 
              v-model="row.name"
              placeholder="输入角色名称"
              @change="onRoleChange"
              size="small"
            />
          </template>
        </el-table-column>
        
        <el-table-column prop="description" label="角色描述" min-width="250">
          <template #default="{ row }">
            <el-input 
              v-model="row.description"
              placeholder="描述该角色的职责和要求"
              @change="onRoleChange"
              size="small"
            />
          </template>
        </el-table-column>
        
        <el-table-column prop="assignedUserId" label="分配人员" width="150">
          <template #default="{ row }">
            <el-select 
              v-model="row.assignedUserId"
              placeholder="选择人员"
              clearable
              @change="onRoleChange"
              size="small"
              style="width: 100%"
            >
              <el-option 
                v-for="member in members"
                :key="member.userId"
                :value="member.userId"
                :label="member.user?.name || member.userId"
              />
            </el-select>
          </template>
        </el-table-column>
        
        <el-table-column label="操作" width="80" fixed="right">
          <template #default="{ row, $index }">
            <el-button 
              text 
              type="danger" 
              :icon="Delete"
              @click="removeRole($index)"
              size="small"
            >
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 任务分配表格 -->
    <el-card shadow="never" class="tasks-section">
      <template #header>
        <div class="section-header">
          <span class="section-title">任务分配</span>
          <el-tag type="primary" size="small">{{ tasks.length }} 个任务</el-tag>
        </div>
      </template>
      
      <el-table 
        :data="tasks" 
        stripe 
        border 
        class="tasks-table compact-table"
        :show-header="true"
        empty-text="暂无任务分配"
        :expand-row-keys="expandedTasks"
        row-key="id"
        size="small"
        :cell-style="{ padding: '8px 12px' }"
        :header-cell-style="{ padding: '8px 12px', backgroundColor: '#fafafa' }"
      >
        <el-table-column type="expand" width="40">
          <template #default="{ row }">
            <div class="task-expand-content">
              <!-- 任务描述 -->
              <div class="expand-section">
                <h4>任务描述</h4>
                <el-input 
                  v-model="row.description"
                  type="textarea"
                  :rows="3"
                  placeholder="详细描述该任务的内容、要求和注意事项"
                  @change="onTaskChange"
                />
              </div>
              
              <!-- 任务清单 -->
              <div class="expand-section">
                <div class="checklist-header">
                  <h4>任务清单</h4>
                  <el-button 
                    text 
                    type="primary" 
                    :icon="Plus"
                    @click="addChecklistItem(row, tasks.indexOf(row))"
                    size="small"
                  >
                    添加清单项
                  </el-button>
                </div>
                
                <div class="checklist-grid">
                  <div 
                    v-for="(item, itemIndex) in row.checklist"
                    :key="itemIndex"
                    class="checklist-item"
                  >
                    <el-checkbox 
                      v-model="item.completed"
                      @change="onTaskChange"
                      :disabled="false"
                    />
                    <el-input 
                      v-model="item.text"
                      placeholder="清单项内容"
                      @change="onTaskChange"
                      size="small"
                    />
                    <el-button 
                      text 
                      type="danger" 
                      :icon="Delete"
                      @click="removeChecklistItem(tasks.indexOf(row), itemIndex)"
                      size="small"
                    />
                  </div>
                </div>
              </div>
            </div>
          </template>
        </el-table-column>
        
        <el-table-column prop="name" label="任务名称" width="200">
          <template #default="{ row }">
            <el-input 
              v-model="row.name"
              placeholder="输入任务名称"
              @change="onTaskChange"
              size="small"
            />
          </template>
        </el-table-column>
        
        <el-table-column prop="assignedRoleId" label="负责角色" width="120">
          <template #default="{ row }">
            <el-select 
              v-model="row.assignedRoleId"
              placeholder="选择角色"
              clearable
              @change="onTaskChange"
              size="small"
              style="width: 100%"
            >
              <el-option 
                v-for="role in roles"
                :key="role.id"
                :value="role.id"
                :label="role.name"
              />
            </el-select>
          </template>
        </el-table-column>
        
        <el-table-column prop="priority" label="优先级" width="80">
          <template #default="{ row }">
            <el-select 
              v-model="row.priority"
              placeholder="优先级"
              @change="onTaskChange"
              size="small"
              style="width: 100%"
            >
              <el-option label="高" value="high" />
              <el-option label="中" value="medium" />
              <el-option label="低" value="low" />
            </el-select>
          </template>
        </el-table-column>
        
        <el-table-column prop="status" label="状态" width="80">
          <template #default="{ row }">
            <el-tag 
              :type="getStatusType(row.status)"
              size="small"
            >
              {{ getStatusText(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        
        <el-table-column prop="progress" label="进度" width="80">
          <template #default="{ row }">
            <div class="progress-cell">
              <span class="progress-text">{{ row.progress || 0 }}%</span>
            </div>
          </template>
        </el-table-column>
        
        <el-table-column label="操作" width="100" fixed="right">
          <template #default="{ row, $index }">
            <el-button 
              text 
              type="primary" 
              :icon="View"
              @click="toggleTaskExpand(row)"
              size="small"
            >
              详情
            </el-button>
            <el-button 
              text 
              type="danger" 
              :icon="Delete"
              @click="removeTask($index)"
              size="small"
            >
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 统计信息 -->
    <el-card shadow="never" class="stats-section">
      <template #header>
        <span class="section-title">分工统计</span>
      </template>
      
      <el-row :gutter="20">
        <el-col :span="6">
          <div class="stat-item">
            <div class="stat-value">{{ roles.length }}</div>
            <div class="stat-label">项目角色</div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="stat-item">
            <div class="stat-value">{{ tasks.length }}</div>
            <div class="stat-label">任务总数</div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="stat-item">
            <div class="stat-value">{{ assignedTasksCount }}</div>
            <div class="stat-label">已分配任务</div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="stat-item">
            <div class="stat-value">{{ Math.round(overallProgress) }}%</div>
            <div class="stat-label">整体进度</div>
          </div>
        </el-col>
      </el-row>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, watch } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { Plus, Edit, Delete, Check, Close, Search, MagicStick, CaretRight, Refresh, View } from '@element-plus/icons-vue';
import { useDivisionStore, type ProjectRole, type DivisionTask, type ProjectMember } from '../stores/division';
import { storeToRefs } from 'pinia';
import { useRoute } from 'vue-router';
import { updateProject } from '@/api/modules/project';

// Props - 移除readonly限制，允许编辑
const props = defineProps<{
  projectId?: string;
  projectData?: any;
}>();

// Store
const divisionStore = useDivisionStore();
const { loading } = storeToRefs(divisionStore);

// 🔧 关键修复：使用本地响应式数据，避免与预览功能共享store状态
const roles = ref<ProjectRole[]>([]);
const tasks = ref<DivisionTask[]>([]);
const members = ref<ProjectMember[]>([]);
const route = useRoute();

// 展开的任务行
const expandedTasks = ref<string[]>([]);

// 获取项目ID，用于自动保存
const currentProjectId = props.projectId || (route.params.id as string);
const isNewProject = currentProjectId === 'new';

// 统计数据
const assignedTasksCount = computed(() => {
  return tasks.value.filter(task => task.assignedRoleId).length;
});

// 获取角色名称的辅助方法
const getRoleName = (roleId: string) => {
  const role = roles.value.find(r => r.id === roleId);
  return role?.name || '未分配';
};

const overallProgress = computed(() => {
  if (tasks.value.length === 0) return 0;
  const totalProgress = tasks.value.reduce((sum, task) => sum + (task.progress || 0), 0);
  return totalProgress / tasks.value.length;
});

// 状态相关方法
const getStatusType = (status: string) => {
  const typeMap = {
    'pending': '',
    'in_progress': 'warning',
    'completed': 'success',
    'paused': 'info',
    'cancelled': 'danger'
  };
  return typeMap[status] || '';
};

const getStatusText = (status: string) => {
  const textMap = {
    'pending': '待开始',
    'in_progress': '进行中',
    'completed': '已完成',
    'paused': '已暂停',
    'cancelled': '已取消'
  };
  return textMap[status] || '待开始';
};

// 切换任务展开状态
const toggleTaskExpand = (task: any) => {
  const index = expandedTasks.value.indexOf(task.id);
  if (index > -1) {
    expandedTasks.value.splice(index, 1);
  } else {
    expandedTasks.value.push(task.id);
  }
};

// 监听分工数据变化，触发自动保存
let saveTimer: NodeJS.Timeout;

watch([roles, tasks], () => {
  console.log('📝 分工数据变化 - 角色:', roles.value.length, '个, 任务:', tasks.value.length, '个');
  
  // 防抖保存：避免频繁保存
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    if (roles.value.length > 0 || tasks.value.length > 0) {
      autoSaveDivision();
    }
  }, 1000); // 1秒后保存
}, { deep: true });

// 自动保存分工数据到后端
const autoSaveDivision = async () => {
  if (isNewProject) {
    console.log('⚠️ 新项目无法自动保存分工');
    return;
  }
  
  try {
    console.log('💾 自动保存分工数据...');
    const divisionData = {
      roles: roles.value,
      tasks: tasks.value
    };
    
    console.log('📤 准备保存的分工数据:', {
      rolesCount: roles.value.length,
      tasksCount: tasks.value.length,
      roles: roles.value.map(r => ({ id: r.id, name: r.name, assignee: r.assignee })),
      tasks: tasks.value.map(t => ({ id: t.id, name: t.name, assignedRoleId: t.assignedRoleId }))
    });
    
    const updateData = {
      config: {
        division: divisionData
      }
    };
    
    console.log('📤 完整的更新数据:', updateData);
    
    const result = await updateProject(currentProjectId, updateData);
    console.log('✅ 分工数据自动保存成功，返回结果:', result);
  } catch (error) {
    console.error('❌ 自动保存分工数据失败:', error);
    console.error('❌ 错误详情:', error.response?.data || error.message);
  }
};

// 角色管理方法
const addRole = () => {
  const newRole = {
    id: Date.now().toString(),
    name: '',
    description: '',
    assignedUserId: null
  };
  roles.value.push(newRole);
  console.log('➕ 添加新角色:', newRole);
};

const removeRole = async (index: number) => {
  try {
    const role = roles.value[index];
    await ElMessageBox.confirm(
      `确定要删除角色 "${role.name || '未命名角色'}" 吗？`,
      '删除确认',
      {
        confirmButtonText: '删除',
        cancelButtonText: '取消',
        type: 'warning',
      }
    );
    
    roles.value.splice(index, 1);
    ElMessage.success('角色删除成功');
    console.log('🗑️ 删除角色:', role);
  } catch (error) {
    // 用户取消删除
  }
};

const onRoleChange = async () => {
  console.log('🔄 角色数据变化');
  // 🔧 修复：手动触发自动保存
  if (!isNewProject) {
    try {
      await autoSaveDivision();
    } catch (error) {
      console.error('❌ 保存角色变化失败:', error);
    }
  }
};

// 任务管理方法
const addTask = () => {
  const newTask = {
    id: Date.now().toString(),
    name: '',
    description: '',
    assignedRoleId: null,
    priority: 'medium',
    status: 'pending',
    progress: 0,
    checklist: [],
    expanded: false
  };
  tasks.value.push(newTask);
  console.log('➕ 添加新任务:', newTask);
};

const removeTask = async (index: number) => {
  try {
    const task = tasks.value[index];
    await ElMessageBox.confirm(
      `确定要删除任务 "${task.name || '未命名任务'}" 吗？`,
      '删除确认',
      {
        confirmButtonText: '删除',
        cancelButtonText: '取消',
        type: 'warning',
      }
    );
    
    tasks.value.splice(index, 1);
    ElMessage.success('任务删除成功');
    console.log('🗑️ 删除任务:', task);
  } catch (error) {
    // 用户取消删除
  }
};

const onTaskChange = async () => {
  console.log('🔄 任务数据变化');
  // 🔧 修复：手动触发自动保存
  if (!isNewProject) {
    try {
      await autoSaveDivision();
    } catch (error) {
      console.error('❌ 保存任务变化失败:', error);
    }
  }
};

// 任务清单管理方法
const addChecklistItem = (task: any, taskIndex: number) => {
  if (!task.checklist) {
    task.checklist = [];
  }
  task.checklist.push({
    text: '',
    completed: false
  });
  console.log('➕ 添加清单项到任务:', task.name);
};

const removeChecklistItem = (taskIndex: number, itemIndex: number) => {
  const task = tasks.value[taskIndex];
  if (task.checklist) {
    task.checklist.splice(itemIndex, 1);
    console.log('🗑️ 删除清单项');
  }
};

// 刷新数据
const refreshData = async () => {
  try {
    if (!isNewProject) {
      // 🔧 修复：从后端重新加载数据到本地状态
      await divisionStore.initProject(currentProjectId);
      
      // 将store数据复制到本地状态
      roles.value = [...divisionStore.roles];
      tasks.value = [...divisionStore.tasks];
      members.value = [...divisionStore.members];
      
      console.log('✅ 刷新完成 - 角色:', roles.value.length, '任务:', tasks.value.length, '成员:', members.value.length);
      ElMessage.success('数据刷新成功');
    }
  } catch (error) {
    console.error('刷新数据失败:', error);
    ElMessage.error('刷新数据失败');
  }
};

// 初始化
onMounted(async () => {
  console.log('🔍 分工管理组件初始化');
  console.log('🔍 项目ID:', currentProjectId);
  console.log('🔍 项目数据:', props.projectData);
  
  if (!isNewProject) {
    // 🔧 修复：从store加载数据到本地状态，避免共享store状态
    await divisionStore.initProject(currentProjectId);
    
    // 将store数据复制到本地状态
    roles.value = [...divisionStore.roles];
    tasks.value = [...divisionStore.tasks];
    members.value = [...divisionStore.members];
    
    console.log('✅ 初始化完成 - 角色:', roles.value.length, '任务:', tasks.value.length, '成员:', members.value.length);
  }
});

// 暴露方法给父组件
const getDivisionData = () => {
  return {
    roles: roles.value,
    tasks: tasks.value,
    members: members.value
  };
};

defineExpose({
  getDivisionData
});
</script>

<style lang="scss" scoped>
.division-management {
  .division-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;
    
    .header-info {
      h3 {
        margin: 0;
        font-size: 18px;
        color: #303133;
      }
      
      .subtitle {
        color: #909399;
        font-size: 14px;
      }
    }
    
    .header-actions {
      display: flex;
      gap: 8px;
    }
  }
  
  .roles-section,
  .tasks-section {
    margin-bottom: 16px;
    
    :deep(.el-card__header) {
      padding: 12px 16px;
      border-bottom: 1px solid #ebeef5;
    }
    
    :deep(.el-card__body) {
      padding: 0;
    }
    
    .section-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      
      .section-title {
        font-weight: 600;
        color: #303133;
        font-size: 14px;
      }
    }
  }
  
  .stats-section {
    margin-bottom: 0;
    
    :deep(.el-card__header) {
      padding: 12px 16px;
    }
    
    :deep(.el-card__body) {
      padding: 16px;
    }
  }
  
  .compact-table {
    :deep(.el-table__header-wrapper) {
      .el-table__header {
        .el-table__cell {
          padding: 8px 12px;
          height: 36px;
          font-size: 13px;
          font-weight: 600;
        }
      }
    }
    
    :deep(.el-table__body-wrapper) {
      .el-table__body {
        .el-table__row {
          .el-table__cell {
            padding: 6px 12px;
            height: 40px;
            
            .el-input {
              .el-input__wrapper {
                padding: 4px 8px;
                
                .el-input__inner {
                  height: 24px;
                  line-height: 24px;
                  font-size: 13px;
                }
              }
            }
            
            .el-select {
              .el-select__wrapper {
                padding: 4px 8px;
                
                .el-select__placeholder {
                  line-height: 24px;
                  font-size: 13px;
                }
                
                .el-select__selected-item {
                  line-height: 24px;
                  font-size: 13px;
                }
              }
            }
            
            .el-tag {
              height: 20px;
              line-height: 18px;
              padding: 0 6px;
              font-size: 12px;
            }
            
            .el-button {
              padding: 4px 8px;
              font-size: 12px;
              height: 24px;
            }
          }
        }
      }
    }
    
    // 斑马纹颜色调整
    :deep(.el-table__row--striped) {
      background-color: #fafbfc;
    }
    
    // hover效果
    :deep(.el-table__body tr:hover > td) {
      background-color: #f5f7fa !important;
    }
  }
  
  .progress-cell {
    display: flex;
    align-items: center;
    justify-content: center;
    
    .progress-text {
      font-size: 12px;
      color: #606266;
      font-weight: 500;
    }
  }
  
  .task-expand-content {
    padding: 16px 20px;
    background-color: #fafbfc;
    border: 1px solid #e4e7ed;
    border-radius: 4px;
    margin: 8px 16px;
    
    .expand-section {
      margin-bottom: 16px;
      
      h4 {
        margin: 0 0 8px 0;
        font-size: 13px;
        color: #606266;
        font-weight: 600;
      }
      
      &:last-child {
        margin-bottom: 0;
      }
    }
    
    .checklist-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 8px;
    }
    
    .checklist-grid {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }
    
    .checklist-item {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 6px 8px;
      background-color: white;
      border: 1px solid #e4e7ed;
      border-radius: 4px;
      
      .el-checkbox {
        flex-shrink: 0;
      }
      
      .el-input {
        flex: 1;
      }
      
      .el-button {
        flex-shrink: 0;
      }
    }
  }
  
  .stats-section {
    .stat-item {
      text-align: center;
      padding: 12px;
      background-color: #f8f9fa;
      border-radius: 6px;
      border: 1px solid #e9ecef;
      
      .stat-value {
        font-size: 20px;
        font-weight: 600;
        color: #409eff;
        margin-bottom: 2px;
      }
      
      .stat-label {
        font-size: 12px;
        color: #909399;
      }
    }
  }
}
</style> 