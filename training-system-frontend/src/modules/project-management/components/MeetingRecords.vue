<template>
  <div class="meeting-management">
    <!-- 页面标题和操作区 -->
    <div class="header-section">
      <div class="header-left">
        <h3>会议任务管理</h3>
        <p class="header-desc">管理需要在会议中展示的面授课程和作业，整理后推送到会议系统</p>
      </div>
      <div class="header-actions">
        <el-button type="primary" @click="showAddDialog = true" :icon="Plus">添加任务到会议</el-button>
        <el-button type="success" @click="handlePushToMeeting" :disabled="meetingTasks.length === 0">
          推送到会议系统 ({{ meetingTasks.length }})
        </el-button>
      </div>
    </div>

    <!-- 统计信息卡片 -->
    <div class="stats-section">
      <el-row :gutter="16">
        <el-col :span="6">
          <el-card shadow="hover" class="stats-card">
            <div class="stats-content">
              <div class="stats-number">{{ meetingTasks.length }}</div>
              <div class="stats-label">会议任务</div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card shadow="hover" class="stats-card">
            <div class="stats-content">
              <div class="stats-number">{{ faceToFaceCount }}</div>
              <div class="stats-label">面授课程</div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card shadow="hover" class="stats-card">
            <div class="stats-content">
              <div class="stats-number">{{ displayTaskCount }}</div>
              <div class="stats-label">展示作业</div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card shadow="hover" class="stats-card">
            <div class="stats-content">
              <div class="stats-number">{{ pushedCount }}</div>
              <div class="stats-label">已推送</div>
            </div>
          </el-card>
        </el-col>
      </el-row>
    </div>

    <!-- 会议任务列表 -->
    <el-card shadow="never" class="task-list-card">
      <template #header>
        <div class="card-header">
          <span>会议任务清单</span>
          <el-text type="info" size="small">以下任务将推送到会议系统</el-text>
        </div>
      </template>
      
      <el-table :data="meetingTasks" stripe v-if="meetingTasks.length > 0">
        <el-table-column type="index" label="序号" width="60" />
        <el-table-column label="任务类型" width="100">
          <template #default="scope">
            <el-tag 
              :type="getTaskTypeColor(scope.row.type)"
              size="small"
            >
              {{ getTaskTypeLabel(scope.row.type) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="name" label="任务名称" min-width="200" />
        <el-table-column prop="stageName" label="所属阶段" width="120" />
        <el-table-column label="推送状态" width="100">
          <template #default="scope">
            <el-tag type="success" size="small" v-if="scope.row.pushed">
              已推送
            </el-tag>
            <el-tag type="warning" size="small" v-else>
              待推送
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="100" fixed="right">
          <template #default="scope">
            <el-button 
              link 
              size="small" 
              @click="handleRemoveTask(scope.row)"
              :disabled="scope.row.pushed"
            >
              移除
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <el-empty v-else description="暂无会议任务，请点击上方按钮添加">
        <el-button type="primary" @click="showAddDialog = true">添加任务</el-button>
      </el-empty>
    </el-card>

    <!-- 添加任务到会议对话框 -->
    <el-dialog 
      v-model="showAddDialog" 
      title="添加任务到会议" 
      width="800px"
    >
      <div class="add-task-dialog">
        <div class="task-filter">
          <el-input
            v-model="taskSearchKeyword"
            placeholder="搜索任务名称"
            prefix-icon="Search"
            clearable
          />
        </div>
        
        <el-table 
          :data="availableTasks"
          @selection-change="handleTaskSelection"
          max-height="400"
        >
          <el-table-column type="selection" width="55" />
          <el-table-column label="任务类型" width="100">
            <template #default="scope">
              <el-tag 
                :type="getTaskTypeColor(scope.row.type)"
                size="small"
              >
                {{ getTaskTypeLabel(scope.row.type) }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="name" label="任务名称" min-width="200" />
          <el-table-column prop="stageName" label="所属阶段" width="120" />
        </el-table>
      </div>
      
      <template #footer>
        <el-button @click="showAddDialog = false">取消</el-button>
        <el-button type="primary" @click="addTasksToMeeting">
          添加选中任务 ({{ selectedTasks.length }})
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { Plus } from '@element-plus/icons-vue';
import { useTrainingStageStore } from '../stores/trainingStage';
import { storeToRefs } from 'pinia';
import { ElMessage, ElMessageBox } from 'element-plus';

const props = defineProps<{
  projectId?: string;
}>();

// Store
const stageStore = useTrainingStageStore();
const { stages } = storeToRefs(stageStore);

// 状态管理
const meetingTasks = ref<any[]>([]); // 已添加到会议的任务列表
const showAddDialog = ref(false);
const taskSearchKeyword = ref('');
const selectedTasks = ref<any[]>([]);

// 计算属性
const allTasks = computed(() => {
  return stages.value.flatMap(stage => 
    stage.tasks.map(task => ({
      ...task,
      stageName: stage.name,
      stageId: stage.id
    }))
  );
});

// 可添加到会议的任务：面授课程和需要展示的作业
const availableTasks = computed(() => {
  const filtered = allTasks.value.filter(task => {
    // 筛选面授课程或需要展示的作业
    const isFaceToFace = task.type === 'face-to-face';
    const needDisplay = task.config?.onsiteDisplay === true;
    
    // 排除已经添加到会议的任务
    const notInMeeting = !meetingTasks.value.some(mt => mt.id === task.id);
    
    // 搜索关键词过滤
    const matchSearch = !taskSearchKeyword.value || 
      task.name.toLowerCase().includes(taskSearchKeyword.value.toLowerCase());
    
    return (isFaceToFace || needDisplay) && notInMeeting && matchSearch;
  });
  
  return filtered;
});

// 统计信息
const faceToFaceCount = computed(() => 
  meetingTasks.value.filter(task => task.type === 'face-to-face').length
);

const displayTaskCount = computed(() => 
  meetingTasks.value.filter(task => task.config?.onsiteDisplay === true).length
);

const pushedCount = computed(() => 
  meetingTasks.value.filter(task => task.pushed === true).length
);

// 方法
const handleTaskSelection = (selection: any[]) => {
  selectedTasks.value = selection;
};

// 会议任务相关方法
const addTasksToMeeting = () => {
  if (selectedTasks.value.length === 0) {
    ElMessage.warning('请选择要添加的任务');
    return;
  }
  
  const newTasks = selectedTasks.value.map(task => ({
    id: task.id,
    name: task.name,
    type: task.type,
    stageId: task.stageId,
    stageName: task.stageName,
    config: task.config,
    addedAt: new Date().toISOString(),
    pushed: false
  }));

  meetingTasks.value.push(...newTasks);
  saveMeetingTasks(); // 保存到localStorage
  
  // 重置表单状态
  selectedTasks.value = [];
  showAddDialog.value = false;
  taskSearchKeyword.value = '';
  
  ElMessage.success(`已添加 ${newTasks.length} 个任务到会议清单`);
};

const handleRemoveTask = (task: any) => {
  ElMessageBox.confirm(
    `确定要从会议清单中移除"${task.name}"吗？`,
    '确认删除',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    }
  ).then(() => {
    const index = meetingTasks.value.findIndex(t => t.id === task.id);
    if (index > -1) {
      meetingTasks.value.splice(index, 1);
      saveMeetingTasks(); // 保存到localStorage
      ElMessage.success('任务已从会议清单中移除');
    }
  }).catch(() => {
    // 用户取消删除
  });
};

const handlePushToMeeting = () => {
  const unpushedTasks = meetingTasks.value.filter(task => !task.pushed);
  
  if (unpushedTasks.length === 0) {
    ElMessage.warning('没有未推送的任务');
    return;
  }
  
  ElMessageBox.confirm(
    `确定要推送 ${unpushedTasks.length} 个任务到会议系统吗？推送后将无法修改。`,
    '确认推送',
    {
      confirmButtonText: '推送',
      cancelButtonText: '取消',
      type: 'info',
    }
  ).then(() => {
    // 标记为已推送
    unpushedTasks.forEach(task => {
      task.pushed = true;
      task.pushedAt = new Date().toISOString();
    });
    
    saveMeetingTasks(); // 保存到localStorage
    ElMessage.success(`已成功推送 ${unpushedTasks.length} 个任务到会议系统`);
    
    // TODO: 这里应该调用实际的API推送到外部会议系统
    console.log('推送到会议系统的任务:', unpushedTasks);
  }).catch(() => {
    // 用户取消推送
  });
};

// 获取任务类型标签
const getTaskTypeLabel = (type: string) => {
  const typeMap = {
    'face-to-face': '面授',
    'homework': '作业',
    'discussion': '讨论',
    'activity': '活动',
    'attendance': '考勤',
    'assessment': '考核'
  };
  return typeMap[type] || type;
};

// 获取任务类型颜色
const getTaskTypeColor = (type: string) => {
  const colorMap = {
    'face-to-face': 'primary',
    'homework': 'success',
    'discussion': 'warning',
    'activity': 'info',
    'attendance': 'danger',
    'assessment': 'primary'
  };
  return colorMap[type] || 'info';
};

// 数据持久化方法
const getMeetingTasksStorageKey = () => {
  const key = `meeting-tasks-${props.projectId}`;
  console.log('🔑 localStorage key:', key, 'projectId:', props.projectId);
  return key;
};

const saveMeetingTasks = () => {
  if (props.projectId) {
    const storageKey = getMeetingTasksStorageKey();
    const dataToSave = JSON.stringify(meetingTasks.value);
    localStorage.setItem(storageKey, dataToSave);
    console.log('💾 会议任务已保存到localStorage:', {
      key: storageKey,
      data: meetingTasks.value,
      serialized: dataToSave.substring(0, 100) + '...'
    });
  } else {
    console.warn('⚠️ projectId为空，无法保存会议任务');
  }
};

const loadMeetingTasks = () => {
  if (props.projectId) {
    const storageKey = getMeetingTasksStorageKey();
    const savedTasks = localStorage.getItem(storageKey);
    
    console.log('📋 尝试从localStorage加载会议任务:', {
      key: storageKey,
      hasData: !!savedTasks,
      dataLength: savedTasks?.length || 0
    });
    
    if (savedTasks) {
      try {
        const parsedTasks = JSON.parse(savedTasks);
        meetingTasks.value = parsedTasks;
        console.log('✅ 成功从localStorage加载会议任务:', parsedTasks);
      } catch (error) {
        console.error('❌ 解析会议任务数据失败:', error, savedTasks);
        meetingTasks.value = [];
      }
    } else {
      console.log('📭 localStorage中无会议任务数据');
      meetingTasks.value = [];
    }
  } else {
    console.warn('⚠️ projectId为空，无法加载会议任务');
  }
};

// 初始化
onMounted(() => {
  if (props.projectId) {
    console.log('🔄 会议管理初始化，项目ID:', props.projectId);
    loadMeetingTasks();
  }
});
</script>

<style scoped>
.meeting-management {
  padding: 20px;
}

.header-section {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 20px;
}

.header-left h3 {
  margin: 0 0 8px 0;
  color: #303133;
}

.header-desc {
  margin: 0;
  color: #909399;
  font-size: 14px;
}

.header-actions {
  display: flex;
  gap: 12px;
}

.stats-section {
  margin-bottom: 20px;
}

.stats-card {
  text-align: center;
}

.stats-content {
  padding: 10px 0;
}

.stats-number {
  font-size: 28px;
  font-weight: bold;
  color: #409EFF;
  margin-bottom: 8px;
}

.stats-label {
  color: #606266;
  font-size: 14px;
}

.task-list-card {
  margin-bottom: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.add-task-dialog {
  margin-bottom: 20px;
}

.task-filter {
  margin-bottom: 16px;
}
</style> 