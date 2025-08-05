<template>
  <div class="event-agenda-container">
    <!-- 设置面板 -->
    <el-card class="setup-card" shadow="never">
      <el-form :inline="true" label-width="90px" :model="settings">
        <el-form-item label="开始日期">
          <el-date-picker v-model="settings.startDate" type="date" />
        </el-form-item>
        <el-form-item label="天数">
          <el-input-number v-model="settings.days" :min="1" @change="onDaysChange" />
        </el-form-item>
        <el-form-item label="每日开始">
          <el-time-select v-model="settings.dayStart" :start="'06:00'" :end="'12:00'" step="00:05" />
        </el-form-item>
        <el-form-item label="每日结束">
          <el-time-select v-model="settings.dayEnd" :start="'12:05'" :end="'23:55'" step="00:05" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="generateAgenda">生成议程</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card shadow="never">
      <template #header>
        <div class="card-header">
          <span>项目议程</span>
          <el-space>
            <el-button type="primary" :icon="Plus" @click="openAddDialog">新增议程项</el-button>
          </el-space>
        </div>
      </template>
      <!-- 日期 Tabs -->
      <el-tabs v-model="activeDayIndex" type="border-card">
        <el-tab-pane
          v-for="(day, idx) in agendaStore.days"
          :key="day.date"
          :label="formatTabLabel(day.date)"
          :name="idx"
        >
          <!-- 列表表格视图 -->
          <div class="day-time-setting">
            <el-space size="small">
              <span>开始:</span>
              <el-time-select v-model="day.startTime" :start="'06:00'" :end="'12:00'" step="00:05" @change="(v)=>onDayTimeChange(idx, v, day.endTime)" />
              <span>结束:</span>
              <el-time-select v-model="day.endTime" :start="'12:05'" :end="'23:55'" step="00:05" @change="(v)=>onDayTimeChange(idx, day.startTime, v)" />
            </el-space>
          </div>
          <table class="agenda-table">
            <thead>
              <tr>
                <th style="width: 32px"></th>
                <th style="width: 120px">开始</th>
                <th style="width: 120px">结束</th>
                <th>事项标题</th>
                <th style="width: 80px">时长</th>
                <th style="width: 120px">讲师/负责人</th>
                <th style="width: 120px">地点</th>
                <th style="width: 80px">操作</th>
              </tr>
            </thead>
            <!-- 拖拽 tbody -->
            <draggable
              v-model="day.items"
              item-key="id"
              tag="tbody"
              handle=".drag-handle"
              @end="onDragEnd(idx, $event)"
            >
              <template #item="{ element }">
                <tr :class="{ fixed: element.fixed }">
                  <td class="handle-cell" v-if="!element.fixed">
                    <el-icon class="drag-handle"><Menu /></el-icon>
                  </td>
                  <td v-else></td>
                  <!-- 开始时间 -->
                  <td>{{ element.start }}</td>
                  <!-- 结束时间 -->
                  <td>{{ element.end }}</td>
                  <td>{{ element.title }}</td>
                  <td>
                    <el-input-number
                      v-model="element.duration"
                      :min="5"
                      :step="5"
                      :disabled="element.fixed"
                      @change="onDurationChange(idx, element)"
                    />
                  </td>
                  <td>{{ element.speaker }}</td>
                  <td>{{ element.location }}</td>
                  <td>
                    <el-button type="danger" link :icon="Delete" @click="removeItem(idx, element.id)" v-if="!element.fixed" />
                  </td>
                </tr>
              </template>
            </draggable>
          </table>
        </el-tab-pane>
      </el-tabs>
    </el-card>

    <!-- 新增议程项弹窗 -->
    <el-dialog v-model="addDialogVisible" title="新增议程项" width="400px">
      <el-form :model="form" label-width="80px">
        <el-form-item label="事项类型">
          <el-select v-model="form.type" placeholder="请选择类型">
            <el-option label="面授" value="lecture" />
            <el-option label="讨论" value="discussion" />
            <el-option label="考试" value="exam" />
            <el-option label="线上课程" value="online" />
          </el-select>
        </el-form-item>
        <el-form-item label="标题">
          <el-input v-model="form.title" />
        </el-form-item>
        <el-form-item label="讲师/负责人">
          <el-input v-model="form.speaker" />
        </el-form-item>
        <el-form-item label="地点">
          <el-input v-model="form.location" />
        </el-form-item>
        <el-form-item label="时长(分)">
          <el-input-number v-model="form.duration" :min="5" :step="5" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="addDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleAdd">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue';
import { Plus, Menu, User, Location, Clock, Delete } from '@element-plus/icons-vue';
import { ElMessageBox, ElMessage } from 'element-plus';
import draggable from 'vuedraggable';
import { useAgendaStore } from '../stores/agenda';
import { useRoute } from 'vue-router';
import { updateProject } from '@/api/modules/project';
import dayjs from 'dayjs';

interface AddForm {
  type: string;
  title: string;
  speaker: string;
  location: string;
  duration: number;
}

interface Settings {
  startDate: string | null;
  days: number;
  dayStart: string;
  dayEnd: string;
}

const agendaStore = useAgendaStore();
const route = useRoute();

// 获取项目ID，用于自动保存
const projectId = route.params.id as string;
const isNewProject = projectId === 'new';

// 自动保存议程数据到后端
const autoSaveAgenda = async () => {
  if (isNewProject) {
    console.log('⚠️ 新项目无法自动保存议程');
    return;
  }
  
  try {
    console.log('💾 自动保存议程数据...');
    const agendaData = agendaStore.getAgendaData();
    console.log('💾 保存的议程数据:', agendaData);
    
    // 只更新config.agenda部分
    await updateProject(projectId, {
      config: {
        agenda: agendaData
      }
    });
    
    console.log('✅ 议程数据自动保存成功');
    ElMessage.success('议程已自动保存');
  } catch (error) {
    console.error('❌ 议程自动保存失败:', error);
    ElMessage.error('议程保存失败，请稍后重试');
  }
};

const settings = ref<Settings>({
  startDate: dayjs().format('YYYY-MM-DD'),
  days: 1,
  dayStart: '08:30',
  dayEnd: '18:00',
});

async function generateAgenda() {
  if (!settings.value.startDate) return;
  
  console.log('⚠️ generateAgenda 被调用');
  console.log('⚠️ 当前议程天数:', agendaStore.days.length);
  console.log('⚠️ settings:', settings.value);
  
  // 如果已有议程数据，提示用户确认
  if (agendaStore.days.length > 0) {
    const hasCustomItems = agendaStore.days.some(day => 
      day.items.some(item => !item.fixed)
    );
    
    if (hasCustomItems) {
      try {
        await ElMessageBox.confirm(
          '生成新议程将会清空当前的议程数据，确定要继续吗？',
          '确认操作',
          {
            confirmButtonText: '确定',
            cancelButtonText: '取消',
            type: 'warning'
          }
        );
      } catch {
        console.log('⚠️ 用户取消生成新议程');
        return; // 用户取消
      }
    }
  }
  
  console.log('🔄 生成新议程，天数:', settings.value.days);
  agendaStore.initializeDays(
    settings.value.startDate as string,
    settings.value.days,
    settings.value.dayStart,
    settings.value.dayEnd,
  );
  activeDayIndex.value = 0;
  console.log('🔄 生成完成，最终天数:', agendaStore.days.length);
}

onMounted(() => {
  console.log('🔄 EventAgenda onMounted - 当前议程天数:', agendaStore.days.length);
  console.log('🔄 EventAgenda onMounted - 议程详情:', agendaStore.days.map(d => ({ 
    date: d.date, 
    itemCount: d.items.length 
  })));
  console.log('🔄 EventAgenda onMounted - 完整议程数据:', JSON.stringify(agendaStore.days, null, 2));
  
  // 只有在没有议程数据时才初始化
  if (agendaStore.days.length === 0) {
    console.log('🆕 没有议程数据，需要初始化');
    generateAgenda();
  } else {
    console.log('📋 使用现有议程数据，天数:', agendaStore.days.length);
    
    // 从现有数据恢复设置信息 - 但保持天数可修改
    const firstDay = agendaStore.days[0];
    if (firstDay) {
      settings.value.startDate = firstDay.date;
      // 🔧 修复：不强制设置天数，让用户可以修改
      // settings.value.days = agendaStore.days.length; // 注释掉这行
      settings.value.dayStart = firstDay.startTime;
      settings.value.dayEnd = firstDay.endTime;
      console.log('📋 恢复设置（保持天数可修改）:', settings.value);
      console.log('📋 当前议程天数:', agendaStore.days.length);
    }
  }
});

// 监听议程数据变化，用于调试和自动保存
watch(() => agendaStore.days, (newDays) => {
  console.log('📅 议程数据变化:', newDays.length, '天');
  
  // 防抖保存：避免频繁保存
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    if (newDays.length > 0) {
      autoSaveAgenda();
    }
  }, 1000); // 1秒后保存
}, { deep: true });

// 保存定时器
let saveTimer: NodeJS.Timeout;

const activeDayIndex = ref(0);
const addDialogVisible = ref(false);

const form = ref<AddForm>({
  type: 'lecture',
  title: '',
  speaker: '',
  location: '',
  duration: 60,
});

function openAddDialog() {
  form.value = { type: 'lecture', title: '', speaker: '', location: '', duration: 60 };
  addDialogVisible.value = true;
}

function handleAdd() {
  console.log('添加议程项:', form.value);
  agendaStore.addItem(activeDayIndex.value, { ...form.value });
  console.log('当前议程数据:', agendaStore.getAgendaData());
  addDialogVisible.value = false;
  
  // 立即保存新添加的议程项
  autoSaveAgenda();
}

function onDurationChange(dayIdx: number, item: any) {
  agendaStore.updateDuration(dayIdx, item.id, item.duration);
}

function onDragEnd(dayIdx: number, evt: any) {
  if (evt && evt.to) {
    agendaStore.reorder(dayIdx, agendaStore.days[dayIdx].items);
  }
}

function removeItem(dayIdx: number, id: string) {
  console.log('🗑️ 删除议程项:', id);
  const day = agendaStore.days[dayIdx];
  
  // 确保安全地过滤议程项，只保留存在且不是要删除的项
  const filteredItems = day.items.filter((i) => i && (i.id !== id || i.fixed));
  
  // 更新议程项数组
  day.items = filteredItems;
  
  // 重新计算时间（不需要调用reorder，因为我们只是删除，不是重新排序）
  agendaStore.recalc(dayIdx);
  
  console.log('当前议程数据:', agendaStore.getAgendaData());
  
  // 立即保存删除操作
  autoSaveAgenda();
}

function formatTabLabel(date: string) {
  const idx = dayjs(date).diff(dayjs(settings.value.startDate), 'day') + 1;
  return `Day ${idx}（${date}）`;
}

function onDayTimeChange(dayIdx: number, startTime: string, endTime: string) {
  agendaStore.updateDayTime(dayIdx, startTime, endTime);
}

/** 处理天数变化 */
async function onDaysChange(newDays: number) {
  console.log('🔄 天数变化:', agendaStore.days.length, '->', newDays);
  
  const currentDays = agendaStore.days.length;
  
  // 安全检查：如果当前没有议程数据，先初始化
  if (currentDays === 0) {
    console.log('⚠️ 当前没有议程数据，先生成基础议程');
    generateAgenda();
    return;
  }
  
  if (newDays > currentDays) {
    // 增加天数
    console.log('➕ 增加天数:', newDays - currentDays);
    const lastDay = agendaStore.days[currentDays - 1];
    
    // 安全检查：确保lastDay存在
    if (!lastDay || !lastDay.date) {
      console.error('❌ 无法获取最后一天的数据，重新生成议程');
      generateAgenda();
      return;
    }
    
    const lastDate = dayjs(lastDay.date);
    
    for (let i = currentDays; i < newDays; i++) {
      const newDate = lastDate.add(i - currentDays + 1, 'day').format('YYYY-MM-DD');
      agendaStore.days.push({
        date: newDate,
        startTime: settings.value.dayStart,
        endTime: settings.value.dayEnd,
        items: [agendaStore.createSigninItem(newDate, settings.value.dayStart)],
      });
    }
  } else if (newDays < currentDays) {
    // 减少天数
    console.log('➖ 减少天数:', currentDays - newDays);
    
    // 检查被删除的天数是否有自定义议程项
    const daysToRemove = agendaStore.days.slice(newDays);
    const hasCustomItems = daysToRemove.some(day => 
      day.items.some(item => !item.fixed)
    );
    
    if (hasCustomItems) {
      try {
        await ElMessageBox.confirm(
          `减少天数将删除第${newDays + 1}天到第${currentDays}天的议程数据，确定要继续吗？`,
          '确认操作',
          {
            confirmButtonText: '确定',
            cancelButtonText: '取消',
            type: 'warning'
          }
        );
      } catch {
        // 用户取消，恢复原来的天数
        console.log('⚠️ 用户取消减少天数');
        settings.value.days = currentDays;
        return;
      }
    }
    
    // 删除多余的天数
    agendaStore.days.splice(newDays);
  }
  
  console.log('✅ 天数调整完成，当前天数:', agendaStore.days.length);
  
  // 确保激活的天数在范围内
  if (activeDayIndex.value >= newDays) {
    activeDayIndex.value = Math.max(0, newDays - 1);
  }
}
</script>

<style scoped>
.event-agenda-container {
  padding-top: 20px;
}
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.agenda-card {
  margin-left: 10px;
  position: relative;
}
.agenda-card.fixed {
  background: #f5f7fa;
}
.agenda-card-header {
  display: flex;
  align-items: center;
  gap: 6px;
}
.drag-handle {
  cursor: move;
  color: #909399;
}
.agenda-actions {
  margin-top: 10px;
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}
.agenda-table {
  width: 100%;
  border-collapse: collapse;
}
.agenda-table th,
.agenda-table td {
  border: 1px solid #ebeef5;
  padding: 6px 8px;
  font-size: 14px;
  text-align: left;
}
.agenda-table tr.fixed {
  background: #f5f7fa;
}
.handle-cell {
  text-align: center;
  width: 32px;
}
.setup-card {
  margin-bottom: 16px;
}
.day-time-setting {
  margin-bottom: 10px;
}
</style> 