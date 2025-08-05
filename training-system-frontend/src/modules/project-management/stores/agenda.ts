import { ref } from 'vue';
import { defineStore } from 'pinia';
import dayjs from 'dayjs';
import type { AgendaDay, AgendaItem } from '../types/agenda';

export const useAgendaStore = defineStore('agenda', () => {
  const days = ref<AgendaDay[]>([]);
  const defaultInterval = ref(0); // 分钟 - 流水式时间，无间隔

  /**
   * 初始化议程天数
   */
  function initializeDays(startDateStr: string, daysCount: number, startTime: string, endTime: string) {
    const startDate = dayjs(startDateStr);
    days.value = [];
    for (let i = 0; i < daysCount; i++) {
      const current = startDate.add(i, 'day').format('YYYY-MM-DD');
      days.value.push({
        date: current,
        startTime,
        endTime,
        items: [createSigninItem(current, startTime)],
      });
    }
  }

  /** 创建默认签到条目 */
  function createSigninItem(date: string, start: string): AgendaItem {
    const end = dayjs(start, 'HH:mm').add(30, 'minute').format('HH:mm');
    return {
      id: `signin-${date}`,
      type: 'signin',
      title: '签到',
      duration: 30,
      speaker: '',
      location: '签到处',
      start,
      end,
      fixed: true,
    };
  }

  /** 计算下一时间段 */
  function calcNextStart(prevEnd: string): string {
    // 流水式时间：直接使用上一个议程项的结束时间，无间隔
    return prevEnd;
  }

  /** 向指定天添加议程项 */
  function addItem(dayIndex: number, payload: Omit<AgendaItem, 'id' | 'start' | 'end' | 'fixed'>) {
    const day = days.value[dayIndex];
    
    // 安全检查：确保day和day.items存在
    if (!day || !day.items || day.items.length === 0) {
      console.error('❌ 无法添加议程项：天数据不存在或items为空', { dayIndex, day });
      return;
    }
    
    const last = day.items[day.items.length - 1];
    const start = calcNextStart(last.end);
    const end = dayjs(start, 'HH:mm')
      .add(payload.duration, 'minute')
      .format('HH:mm');
    if (end > day.endTime) {
      // 超出工作时间，直接返回，不添加
      console.warn('⚠️ 议程项超出工作时间，无法添加', { start, end, endTime: day.endTime });
      return;
    }
    const newItem: AgendaItem = {
      id: `${Date.now()}`,
      ...payload,
      start,
      end,
      fixed: false,
    };
    day.items.push(newItem);
    console.log('✅ 议程项添加成功:', newItem);
  }

  /** 重新计算指定天时间段 */
  function recalc(dayIndex: number) {
    const day = days.value[dayIndex];
    // 更新签到起止时间为新的 startTime
    const signin = day.items[0];
    signin.start = day.startTime;
    signin.end = dayjs(day.startTime, 'HH:mm').add(30, 'minute').format('HH:mm');

    let cursor = signin.end;
    for (let i = 1; i < day.items.length; i++) {
      const item = day.items[i];
      item.start = cursor;
      item.end = dayjs(cursor, 'HH:mm')
        .add(item.duration, 'minute')
        .format('HH:mm');
      // 流水式时间：下一个议程项直接从当前项结束时间开始，无间隔
      cursor = item.end;
    }
  }

  /** 更新时长 */
  function updateDuration(dayIndex: number, id: string, duration: number) {
    const day = days.value[dayIndex];
    const item = day.items.find((i) => i.id === id && !i.fixed);
    if (!item) return;
    item.duration = duration;
    recalc(dayIndex);
  }

  /** 拖拽排序完成 */
  function reorder(dayIndex: number, newOrder: AgendaItem[]) {
    const day = days.value[dayIndex];
    // 保证签到项仍在首位
    day.items = [day.items[0], ...newOrder.filter((i) => !i.fixed)];
    recalc(dayIndex);
  }

  /** 更新某天的开始/结束时间 */
  function updateDayTime(dayIndex: number, startTime: string, endTime: string) {
    const day = days.value[dayIndex];
    day.startTime = startTime;
    day.endTime = endTime;
    recalc(dayIndex);
  }

  /** 获取议程数据用于保存 */
  function getAgendaData() {
    const result = {
      days: days.value,
      defaultInterval: defaultInterval.value,
    };
    console.log('📊 Store getAgendaData - 天数:', result.days.length);
    console.log('📊 Store getAgendaData - 详细数据:', result.days.map(d => ({ 
      date: d.date, 
      itemCount: d.items.length, 
      items: d.items.map(i => i.title) 
    })));
    return result;
  }

  /** 从保存的数据恢复议程 */
  function loadAgendaData(data: any) {
    console.log('📥 Store loadAgendaData - 输入数据:', data);
    if (data?.days && Array.isArray(data.days)) {
      console.log('📥 Store loadAgendaData - 恢复天数:', data.days.length);
      console.log('📥 Store loadAgendaData - 详细数据:', data.days.map((d: any) => ({ 
        date: d.date, 
        itemCount: d.items?.length || 0, 
        items: d.items?.map((i: any) => i.title) || []
      })));
      days.value = data.days;
      console.log('📥 Store loadAgendaData - 设置后当前天数:', days.value.length);
    }
    if (data?.defaultInterval) {
      defaultInterval.value = data.defaultInterval;
    }
  }

  /** 清空议程数据 */
  function clearAgenda() {
    days.value = [];
  }

  return {
    days,
    defaultInterval,
    initializeDays,
    addItem,
    updateDuration,
    reorder,
    updateDayTime,
    getAgendaData,
    loadAgendaData,
    clearAgenda,
    createSigninItem, // 导出创建签到项函数
    recalc, // 导出重新计算函数，用于删除议程项后重新计算时间
  };
}); 