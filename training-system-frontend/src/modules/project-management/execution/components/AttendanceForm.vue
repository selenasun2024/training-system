<template>
  <el-dialog :model-value="visible" title="考勤设置" width="500px" @close="$emit('update:visible', false)">
    <el-form :model="form" label-width="100px">
      <el-form-item label="标题">
        <el-input v-model="form.title" />
      </el-form-item>

      <template v-for="(w, idx) in form.windows" :key="idx">
        <el-form-item :label="`考勤时段${idx+1}`">
          <el-date-picker v-model="wRange[idx]" type="datetimerange" start-placeholder="开始" end-placeholder="结束" style="width: 260px" />
          <el-button v-if="form.windows.length>1" icon="Delete" type="danger" size="small" @click="removeWindow(idx)" />
        </el-form-item>
        <el-form-item label="二维码">
          <el-input :value="w.qrCode" disabled />
        </el-form-item>
        <el-divider v-if="idx < form.windows.length-1" />
      </template>

      <el-button type="primary" link @click="addWindow">新增考勤时段</el-button>
    </el-form>
    <template #footer>
      <el-button @click="$emit('update:visible', false)">取消</el-button>
      <el-button type="primary" @click="save">保存</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { reactive, ref, watch } from 'vue';
import { useAttendanceStore } from '../../stores/attendance';

const props = defineProps<{ visible: boolean; attendanceId: string; stageId?: string }>();
const emit = defineEmits(['update:visible']);

const store = useAttendanceStore();
const att = store.attendances.find(a => a.id === props.attendanceId) || {
  id: props.attendanceId,
  stageId: props.stageId || '',
  title: '新建考勤',
  status: 'draft' as const,
  records: [],
  config: {
    windows: [{ start: '', end: '', qrCode: `QR-${Date.now()}` }]
  }
};

const form = reactive({
  title: att.title,
  windows: att.config.windows.map(w => ({ ...w })),
});

const wRange = ref<any[]>(form.windows.map(w=>[w.start,w.end]));

// sync ranges
watch(wRange, (newVal) => {
  newVal.forEach((range, i) => {
    form.windows[i].start = range[0];
    form.windows[i].end = range[1];
  });
});

function addWindow() {
  form.windows.push({ start: '', end: '', qrCode: `QR-${Date.now()}` });
}

function removeWindow(idx: number) {
  if (form.windows.length > 1) form.windows.splice(idx, 1);
}

function save() {
  const attendanceData = {
    title: form.title,
    config: { 
      windows: form.windows
    },
    status: 'ready' as const,
  };
  
  if (store.attendances.find(a => a.id === props.attendanceId)) {
    store.updateAttendance(att.id, attendanceData);
  } else {
    store.addAttendance({
      id: props.attendanceId,
      stageId: props.stageId || '',
      records: [],
      ...attendanceData
    });
  }
  emit('update:visible', false);
}
</script> 