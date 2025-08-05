export type TaskCategory = {
  /** 分组唯一标识 */
  key: string;
  /** 分组显示名称 */
  title: string;
  /** 分组描述 */
  description?: string;
  /** 分组排序权重 */
  order: number;
  /** 是否启用该分组 */
  enabled: boolean;
  /** 该分组包含的任务类型 code 列表 */
  types: string[];
  /** 分组图标（Element Plus 图标名称） */
  icon?: string;
};

export type TaskTypeConfig = {
  /** 任务类型唯一标识 */
  type: string;
  /** 显示名称 */
  label: string;
  /** 任务类型描述 */
  description: string;
  /** 排序权重 */
  order: number;
  /** 是否启用 */
  enabled: boolean;
  /** 图标（Element Plus 图标） */
  icon: string;
  /** 所属分组 */
  category: string;
  /** 是否需要额外配置 */
  requiresConfig: boolean;
  /** 是否支持批量创建 */
  supportsBatch: boolean;
  /** 任务类型颜色主题 */
  color: 'primary' | 'success' | 'warning' | 'info' | 'danger';
  /** 任务预计完成时间（小时） */
  estimatedHours?: number;
  /** 任务标签 */
  tags?: string[];
};

/**
 * 任务类型完整配置
 */
export const TASK_TYPE_CONFIGS: TaskTypeConfig[] = [
  // 在线任务
  {
    type: 'online-course',
    label: '在线课程',
    description: '在线学习课程内容，支持视频、文档等多种形式',
    order: 1,
    enabled: true,
    icon: 'Reading',
    category: 'online',
    requiresConfig: true,
    supportsBatch: true,
    color: 'primary',
    estimatedHours: 2,
    tags: ['学习', '自主'],
  },
  {
    type: 'homework',
    label: '作业',
    description: '完成指定的作业任务，可包含文档、代码等',
    order: 2,
    enabled: true,
    icon: 'Edit',
    category: 'online',
    requiresConfig: true,
    supportsBatch: false,
    color: 'warning',
    estimatedHours: 3,
    tags: ['实践', '提交'],
  },
  {
    type: 'exam',
    label: '考试',
    description: '在线考试或测验，支持多种题型',
    order: 3,
    enabled: true,
    icon: 'EditPen',
    category: 'online',
    requiresConfig: true,
    supportsBatch: false,
    color: 'danger',
    estimatedHours: 1,
    tags: ['考核', '评估'],
  },
  // 线下任务
  {
    type: 'face-to-face',
    label: '面授',
    description: '线下面对面授课，支持现场互动',
    order: 4,
    enabled: true,
    icon: 'User',
    category: 'offline',
    requiresConfig: true,
    supportsBatch: false,
    color: 'success',
    estimatedHours: 4,
    tags: ['面授', '互动'],
  },
  {
    type: 'activity',
    label: '活动',
    description: '各类培训活动，如团建、研讨等',
    order: 5,
    enabled: true,
    icon: 'Medal',
    category: 'offline',
    requiresConfig: true,
    supportsBatch: false,
    color: 'warning',
    estimatedHours: 6,
    tags: ['活动', '团队'],
  },
  {
    type: 'discussion',
    label: '讨论',
    description: '小组讨论或主题研讨',
    order: 6,
    enabled: true,
    icon: 'ChatLineRound',
    category: 'offline',
    requiresConfig: true,
    supportsBatch: false,
    color: 'info',
    estimatedHours: 2,
    tags: ['讨论', '交流'],
  },
  // 工具任务
  {
    type: 'attendance',
    label: '考勤',
    description: '签到打卡管理，支持多种签到方式',
    order: 7,
    enabled: true,
    icon: 'Timer',
    category: 'tool',
    requiresConfig: true,
    supportsBatch: true,
    color: 'info',
    estimatedHours: 0.1,
    tags: ['考勤', '签到'],
  },
  {
    type: 'questionnaire',
    label: '问卷',
    description: '问卷调研或反馈收集',
    order: 8,
    enabled: true,
    icon: 'Edit',
    category: 'tool',
    requiresConfig: true,
    supportsBatch: false,
    color: 'primary',
    estimatedHours: 0.5,
    tags: ['调研', '反馈'],
  },

];

/**
 * 项目详情「培训中」阶段任务类型分组配置。
 * 注意：如需调整菜单结构，仅需修改本配置文件，视图层自动渲染。
 */
export const TASK_TYPE_CATEGORIES: TaskCategory[] = [
  {
    key: 'online',
    title: '在线任务',
    description: '支持远程学习的在线任务类型',
    order: 1,
    enabled: true,
    types: ['online-course', 'homework', 'exam'],
    icon: 'Monitor',
  },
  {
    key: 'offline',
    title: '线下任务',
    description: '需要现场参与的线下任务类型',
    order: 2,
    enabled: true,
    types: ['face-to-face', 'activity', 'discussion'],
    icon: 'OfficeBuilding',
  },
  {
    key: 'tool',
    title: '工具任务',
    description: '辅助管理和数据收集的工具类任务',
    order: 3,
    enabled: true,
    types: ['attendance', 'questionnaire'],
    icon: 'Tools',
  },
];

/**
 * 根据类型代码获取任务类型配置
 */
export function getTaskTypeConfig(type: string): TaskTypeConfig | undefined {
  return TASK_TYPE_CONFIGS.find(config => config.type === type);
}

/**
 * 获取启用的任务类型配置
 */
export function getEnabledTaskTypes(): TaskTypeConfig[] {
  return TASK_TYPE_CONFIGS.filter(config => config.enabled).sort((a, b) => a.order - b.order);
}

/**
 * 根据分组获取任务类型配置
 */
export function getTaskTypesByCategory(category: string): TaskTypeConfig[] {
  return TASK_TYPE_CONFIGS
    .filter(config => config.category === category && config.enabled)
    .sort((a, b) => a.order - b.order);
}

/**
 * 获取启用的任务类型分组
 */
export function getEnabledCategories(): TaskCategory[] {
  return TASK_TYPE_CATEGORIES.filter(category => category.enabled).sort((a, b) => a.order - b.order);
} 