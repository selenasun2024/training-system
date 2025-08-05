<template>
  <el-row :gutter="20" class="schedule-wrapper">
    <!-- 左侧：迷你月历 + 筛选 -->
    <el-col :span="5" class="left-pane">
      <!-- 迷你日历（ElementPlus）-->
      <el-calendar v-model="selectedDate" class="mini-calendar" :range="calendarRange" />

      <!-- 筛选复选框 -->
      <div class="filters">
        <h4>项目类型</h4>
        <el-checkbox-group v-model="activeTypes">
          <el-checkbox
            v-for="t in types"
            :key="t.code"
            :label="t.code"
            :style="{ display: 'block', margin: '4px 0' }"
          >{{ t.name }}</el-checkbox>
        </el-checkbox-group>
      </div>
    </el-col>

    <!-- 右侧：FullCalendar 月视图 -->
    <el-col :span="19" class="right-pane">
      <FullCalendar ref="fullCalendar" :options="fcOptions" />
    </el-col>
  </el-row>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import FullCalendar from '@fullcalendar/vue3'
import dayGridPlugin from '@fullcalendar/daygrid'
import interactionPlugin from '@fullcalendar/interaction'
import type { CalendarOptions } from '@fullcalendar/core'
import { useDictStore } from '@/stores/dict'

interface TrainingEvent {
  title: string
  start: string | Date
  end?: string | Date
  color?: string
  // 额外信息
  typeCode?: string
  typeName?: string
  id?: string
}

interface Props {
  events: TrainingEvent[]
}

const props = defineProps<Props>()

const dictStore = useDictStore()

/* 左侧迷你日历 */
const selectedDate = ref<Date>(new Date())
// 仅限制显示当前月（简化版本）
const calendarRange = computed<[Date, Date]>(() => {
  const first = new Date(selectedDate.value.getFullYear(), selectedDate.value.getMonth(), 1)
  const last = new Date(selectedDate.value.getFullYear(), selectedDate.value.getMonth() + 1, 0)
  return [first, last]
})

/* 项目类型列表 */
const types = computed(() => dictStore.projectTypes.map(t => ({ code: t.code, name: t.name })))
const activeTypes = ref<string[]>([])
watch(types, (list) => {
  // 默认全选
  if (!activeTypes.value.length && list.length) {
    activeTypes.value = list.map(t => t.code)
  }
}, { immediate: true })

/* 根据筛选生成 events */
const filteredEvents = computed(() => {
  if (!activeTypes.value.length) return []
  return props.events.filter(e => !e.typeCode || activeTypes.value.includes(e.typeCode))
})

/* FullCalendar 配置 */
const fullCalendar = ref()
const fcOptions = ref<CalendarOptions>({
  plugins: [dayGridPlugin, interactionPlugin],
  initialView: 'dayGridMonth',
  headerToolbar: {
    left: 'prev,next today',
    center: 'title',
    right: ''
  },
  events: filteredEvents.value as any,
  selectable: false,
  editable: false,
  datesSet(info) {
    // 与左侧日历联动
    selectedDate.value = info.start
  }
})

watch(filteredEvents, (evts) => {
  const api = (fullCalendar.value as any)?.getApi()
  if (api) {
    api.removeAllEvents()
    api.addEventSource(evts)
  }
})

/* 当左侧日期改变时，切换 FullCalendar 视图 */
watch(selectedDate, (date) => {
  const api = (fullCalendar.value as any)?.getApi()
  if (api) {
    api.gotoDate(date)
  }
})

onMounted(() => {
  dictStore.loadProjectTypes()
})
</script>

<style scoped>
.schedule-wrapper {
  min-height: 500px;
}
.left-pane {
  border-right: 1px solid #ebeef5;
  padding-right: 10px;
}
.mini-calendar {
  --el-calendar-cell-width: 30px;
  --el-calendar-date-height: 24px;
  font-size: 12px;
}
.filters {
  margin-top: 16px;
}
.filters h4 {
  margin: 0 0 8px 0;
  font-size: 14px;
  font-weight: 600;
}
.right-pane {
  /* 提供滚动空间 */
  overflow-x: auto;
}
</style> 