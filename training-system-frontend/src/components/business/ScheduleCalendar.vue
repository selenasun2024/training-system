<template>
  <div>
    <FullCalendar ref="fullCalendar" :options="calendarOptions" />
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted } from 'vue';
import FullCalendar from '@fullcalendar/vue3';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import type { CalendarOptions, EventApi } from '@fullcalendar/core';

interface Props {
  events: any[];
}
const props = defineProps<Props>();
const emit = defineEmits(['date-click', 'event-click', 'event-drop']);

const fullCalendar = ref(null);

const calendarOptions = ref<CalendarOptions>({
  plugins: [dayGridPlugin, interactionPlugin],
  initialView: 'dayGridMonth',
  headerToolbar: {
    left: 'prev,next today',
    center: 'title',
    right: 'dayGridMonth,dayGridWeek,dayGridDay'
  },
  events: props.events,
  editable: true,
  selectable: true,
  droppable: true,
  dateClick: (arg) => emit('date-click', arg),
  eventClick: (arg) => emit('event-click', arg),
  eventDrop: (arg) => emit('event-drop', arg),
  drop: (info) => {
    const template = JSON.parse(info.draggedEl.dataset.template || '{}');
    const newEvent = {
      title: template.title,
      start: info.date,
      allDay: info.allDay
    };
    // 在这里你可以发出一个事件，让父组件来添加这个新事件
    // 例如：emit('event-add-from-template', newEvent);
    // 为了简单起见，我们直接操作日历
    (fullCalendar.value as any)?.getApi().addEvent(newEvent);
    info.draggedEl.parentNode.removeChild(info.draggedEl);
  },
});

watch(() => props.events, (newEvents) => {
  (fullCalendar.value as any)?.getApi().removeAllEvents();
  (fullCalendar.value as any)?.getApi().addEventSource(newEvents);
}, { deep: true });

onMounted(() => {
  // 确保日历API可用
});
</script> 