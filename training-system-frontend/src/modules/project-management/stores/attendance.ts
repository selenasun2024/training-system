import { defineStore } from 'pinia';
import { ref } from 'vue';
import { nanoid } from 'nanoid';

export interface AttendanceRecord {
  userId: string;
  userName: string;
  signTime?: string;
  status: 'absent' | 'present' | 'late';
  latitude?: number;
  longitude?: number;
}

export interface AttendanceWindow {
  start: string;
  end: string;
  qrCode: string;
}

export interface AttendanceTaskConfig {
  windows: AttendanceWindow[];
  location?: { lat: number; lng: number; radius: number };
}

export interface AttendanceTask {
  id: string;
  stageId: string;
  title: string;
  config: AttendanceTaskConfig;
  status: 'draft' | 'ready' | 'ongoing' | 'finished';
  records: AttendanceRecord[];
}

export const useAttendanceStore = defineStore('attendance', () => {
  const attendances = ref<AttendanceTask[]>([]);

  function createAttendance(stageId: string): AttendanceTask {
    const task: AttendanceTask = {
      id: nanoid(),
      stageId,
      title: '签到',
      status: 'draft',
      config: {
        windows: [
          { start: '', end: '', qrCode: `QR-${Date.now()}` },
        ],
      },
      records: [],
    };
    attendances.value.push(task);
    return task;
  }

  function addAttendance(task: AttendanceTask) {
    attendances.value.push(task);
  }

  function updateAttendance(id: string, patch: Partial<AttendanceTask>) {
    const t = attendances.value.find((a) => a.id === id);
    if (t) Object.assign(t, patch);
  }

  function signUser(id: string, record: AttendanceRecord) {
    const att = attendances.value.find((a) => a.id === id);
    if (!att) return;
    const existing = att.records.find((r) => r.userId === record.userId);
    if (existing) Object.assign(existing, record);
    else att.records.push(record);
  }

  return { attendances, createAttendance, addAttendance, updateAttendance, signUser };
}); 