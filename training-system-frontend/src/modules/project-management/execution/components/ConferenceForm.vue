<template>
  <el-dialog :model-value="visible" title="会议编辑" width="700px" @close="handleClose">
    <el-tabs v-model="activeTab">
      <!-- 基本信息 -->
      <el-tab-pane label="基本信息" name="info">
        <el-form :model="draft" label-width="100px">
          <el-form-item label="会议标题">
            <el-input v-model="draft.title" placeholder="请输入会议标题" />
          </el-form-item>
          <el-form-item label="会议时间">
            <el-date-picker
              v-model="dateRange"
              type="datetimerange"
              start-placeholder="开始时间"
              end-placeholder="结束时间"
              :default-time="[new Date(), new Date()]"
              style="width: 100%;"
            />
          </el-form-item>
          <el-form-item label="地点/链接">
            <el-input v-model="draft.location" placeholder="线上会议可填写链接" />
          </el-form-item>
        </el-form>
      </el-tab-pane>

      <!-- 关联任务 -->
      <el-tab-pane label="关联任务" name="tasks">
        <el-table :data="taskRows" style="width: 100%">
          <el-table-column prop="title" label="任务标题" />
          <el-table-column prop="type" label="类型" width="80" />
          <el-table-column prop="onsiteDisplay" label="现场展示" width="80">
            <template #default="{ row }">
              <el-tag v-if="row.onsiteDisplay" size="small">是</el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="pushed" label="已推送" width="80">
            <template #default="{ row }">
              <el-tag v-if="row.pushed" type="success" size="small">已推送</el-tag>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="80">
            <template #default="{ row }">
              <el-button type="text" size="small" @click="removeTask(row.taskId)">删除</el-button>
            </template>
          </el-table-column>
        </el-table>
        <el-divider />
        <el-space>
          <el-select
            v-model="selectedTaskIds"
            multiple
            placeholder="选择其他任务"
            :disabled="selectableTasks.length === 0"
            style="min-width:260px"
          >
            <el-option
              v-for="t in selectableTasks"
              :key="t.id"
              :label="t.name"
              :value="t.id"
            />
          </el-select>
          <el-button type="primary" size="small" @click="addSelectedTasks" :disabled="selectedTaskIds.length===0">添加</el-button>
        </el-space>
      </el-tab-pane>
    </el-tabs>

    <template #footer>
      <span class="dialog-footer">
        <el-button @click="handleClose">取消</el-button>
        <el-button @click="handleSave">保存草稿</el-button>
        <el-button type="primary" @click="handlePush">推送至会议系统</el-button>
      </span>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, watch, computed, reactive } from 'vue';
import { useMeetingStore } from '../../stores/meeting';
import type { TaskLink, MeetingDraft } from '../../stores/meeting';
import { useRoute } from 'vue-router';
import { useTrainingStageStore } from '../../stores/trainingStage';
import { storeToRefs } from 'pinia';

interface TaskItem { id: string; name: string; type: string; onsiteDisplay?: boolean; }

const props = defineProps<{ visible: boolean; stageId: string; draftId?: string; availableTasks?: TaskItem[] }>();
const emit = defineEmits(['update:visible']);

const meetingStore = useMeetingStore();
const route = useRoute();

let draftStore: MeetingDraft;

if (props.draftId) {
  const existing = meetingStore.getDraft(props.draftId);
  if (!existing) throw new Error('draft not found');
  draftStore = existing;
} else {
  const initTasks: TaskLink[] = (props.availableTasks || []).map((t) => ({
    taskId: t.id,
    type: t.type as any,
    title: t.name,
    onsiteDisplay: t.onsiteDisplay === true,
    pushed: false,
  }));
  draftStore = meetingStore.createDraft(String(route.params.id || ''), props.stageId, initTasks);
}

const draft = reactive({ ...draftStore });

// 当本地 draft.tasks 变化时，可选任务列表也会随之更新
watch(
  () => draft.tasks.length,
  () => {
    /* trigger recompute */
  },
);

// 双向绑定 Dialog 可见性
const visible = ref(props.visible);
watch(() => props.visible, (v) => (visible.value = v));
watch(visible, (v) => emit('update:visible', v));

const activeTab = ref('info');

// 日期选择器绑定
const dateRange = ref<[Date, Date] | string[]>(['', '']);
watch(dateRange, (val) => {
  if (Array.isArray(val) && val.length === 2) {
    draft.startTime = String(val[0]);
    draft.endTime = String(val[1]);
  }
});

// 任务操作
const taskRows = computed(() => draft.tasks);

// 当对话框打开时，刷新关联任务列表
watch(
  () => visible.value,
  (val) => {
    if (val) {
      const defaultTasks: TaskLink[] = (props.availableTasks || []).map((t) => ({
        taskId: t.id,
        type: t.type as any,
        title: t.name,
        onsiteDisplay: t.onsiteDisplay === true,
        pushed: draft.tasks.find((d) => d.taskId === t.id)?.pushed || false,
      }));
      // 合并，避免丢失已有任务
      defaultTasks.forEach((t) => {
        if (!draft.tasks.some((d) => d.taskId === t.taskId)) {
          draft.tasks.push(t);
        }
      });
    }
  },
  { immediate: true }
);

// Footer 按钮
function handleSave() {
  meetingStore.updateDraft(draftStore.id, draft);
  visible.value = false;
}
async function handlePush() {
  await meetingStore.updateDraft(draftStore.id, draft);
  await meetingStore.pushMeeting(draftStore.id);
  visible.value = false;
}
function handleClose() {
  visible.value = false;
}

function removeTask(taskId: string) {
  const idx = draft.tasks.findIndex((t) => t.taskId === taskId);
  if (idx !== -1) draft.tasks.splice(idx, 1);
}

// ===== 可手动添加任务 =====
const stageStore = useTrainingStageStore();
const { stages, activeStageId } = storeToRefs(stageStore);
const stage = computed(() => stages.value.find((s) => s.id === props.stageId) || stages.value.find((s) => s.id === activeStageId.value));
const selectableTasks = computed(() => {
  if (!stage.value) return [];
  return stage.value.tasks
    .filter((t) => !draft.tasks.some((d) => d.taskId === t.id))
    .map((t) => ({
      id: t.id,
      name: t.name,
      type: t.type,
      onsiteDisplay: t.config?.onsiteDisplay === true,
    }));
});

const selectedTaskIds = ref<string[]>([]);
function addSelectedTasks() {
  selectedTaskIds.value.forEach((id) => {
    const t = selectableTasks.value.find((x) => x.id === id);
    if (t) {
      draft.tasks.push({
        taskId: t.id,
        type: t.type as any,
        title: t.name,
        onsiteDisplay: t.onsiteDisplay,
        pushed: false,
      });
    }
  });
  selectedTaskIds.value = [];
}
</script>

<style scoped>
</style> 