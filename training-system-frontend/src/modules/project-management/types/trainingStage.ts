// 培训中阶段任务流类型定义

export interface TaskType {
  type: string;      // 任务类型标识，如 'face-to-face', 'homework' 等
  label: string;     // 中文名称，如 '面授'
  description?: string; // 任务类型描述
  icon?: any;        // 图标组件（可选）
  color?: string;    // 主题色（可选）
  category?: string; // 所属分组
  requiresConfig?: boolean; // 是否需要额外配置
  supportsBatch?: boolean; // 是否支持批量创建
  estimatedHours?: number; // 预计完成时间
  tags?: string[];   // 标签
  enabled?: boolean; // 是否启用
}

export interface Task {
  id: string;
  type: string;      // 任务类型
  name: string;      // 任务名称
  description?: string; // 任务描述
  required: boolean; // 是否必修
  config: Record<string, any>; // 类型专属配置
  status: string;    // 状态（未开始/进行中/已完成等）
  order: number;     // 排序
  createdAt?: string; // 创建时间
  updatedAt?: string; // 更新时间
}

export interface Stage {
  id: string;
  name: string;      // 阶段名称
  description?: string; // 阶段描述
  tasks: Task[];     // 该阶段下的任务列表
  order: number;     // 阶段排序
  status?: 'pending' | 'active' | 'completed'; // 阶段状态
  estimatedDuration?: number; // 预计时长（小时）
} 