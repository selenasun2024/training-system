export interface AgendaItem {
  id: string;
  type: string;
  title: string;
  duration: number; // 分钟
  speaker: string;
  location: string;
  start: string; // HH:mm
  end: string;   // HH:mm
  fixed: boolean;
}

export interface AgendaDay {
  date: string;            // YYYY-MM-DD
  startTime: string;      // HH:mm
  endTime: string;        // HH:mm
  items: AgendaItem[];
} 