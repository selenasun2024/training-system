export interface BudgetItem {
  id: string
  name: string       // 项目名称，如租金、材料费
  unit: string       // 单位，如 元/天、元/本
  price: number      // 单价
  defaultQty?: number // 默认数量，可选
}
export interface ResourceBudget { id: string; resource: string; items: BudgetItem[] }

// 全局类型定义文件 - 统一导出所有类型

// 现有类型
export * from './observation';
export * from './task';
export * from './recommendation';
export * from './finance';

// 新增类型 - 带教管理
export * from './mentorship';

// 新增类型 - 培训项目
export * from './training';

// 新增类型 - 成长档案
export * from './growth-profile';

// 新增类型 - 集成管理
export * from './integration';

// 新增类型 - 用户管理
export type {
  User,
  UserRole,
  UserWithRoles,
  ProjectParticipant,
  UserQuery,
  CreateUserDto,
  UpdateUserDto,
  UserListResponse
} from './user';

// 通用类型定义
export interface ApiResponse<T = any> {
  code: number;
  message: string;
  data: T;
  timestamp: Date;
}

export interface PaginationParams {
  page: number;
  size: number;
}

export interface PaginationResult<T = any> {
  items: T[];
  total: number;
  page: number;
  size: number;
  totalPages: number;
}

export interface SortParams {
  field: string;
  order: 'asc' | 'desc';
}

export interface FilterParams {
  [key: string]: any;
}

export interface SearchParams {
  keyword?: string;
  filters?: FilterParams;
  sort?: SortParams;
  pagination?: PaginationParams;
}

// 用户相关类型已迁移到 ./user.ts 文件中

// 文件上传
export interface FileUploadResult {
  id: string;
  filename: string;
  originalName: string;
  size: number;
  mimeType: string;
  url: string;
  uploadedAt: Date;
}

// 通知
export interface Notification {
  id: string;
  type: 'info' | 'warning' | 'error' | 'success';
  title: string;
  message: string;
  read: boolean;
  createdAt: Date;
  expiresAt?: Date;
  actionUrl?: string;
  actionText?: string;
}

// 系统配置
export interface SystemConfig {
  key: string;
  value: any;
  type: 'string' | 'number' | 'boolean' | 'object' | 'array';
  description?: string;
  category: string;
  updatedAt: Date;
  updatedBy: string;
}

// 操作日志
export interface OperationLog {
  id: string;
  userId: string;
  userName: string;
  action: string;
  resource: string;
  resourceId?: string;
  details?: any;
  ip: string;
  userAgent: string;
  createdAt: Date;
}

// 权限相关
export interface Permission {
  id: string;
  name: string;
  code: string;
  description?: string;
  category: string;
  resources: string[];
  actions: string[];
}

// 部门组织
export interface Department {
  id: string;
  name: string;
  code: string;
  description?: string;
  parentId?: string;
  level: number;
  path: string;
  sort: number;
  status: 'active' | 'inactive';
  managerId?: string;
  managerName?: string;
  createdAt: Date;
}

// 统计相关
export interface StatisticCard {
  title: string;
  value: number;
  unit?: string;
  trend?: {
    value: number;
    isIncrease: boolean;
    period: string;
  };
  color?: string;
  icon?: string;
}

export interface ChartData {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    backgroundColor?: string | string[];
    borderColor?: string | string[];
    borderWidth?: number;
  }[];
}

// 表单相关
export interface FormRule {
  required?: boolean;
  message?: string;
  trigger?: string | string[];
  validator?: (rule: any, value: any, callback: Function) => void;
  min?: number;
  max?: number;
  pattern?: RegExp;
}

export interface FormRules {
  [key: string]: FormRule | FormRule[];
}

// 选项
export interface Option {
  label: string;
  value: any;
  disabled?: boolean;
  children?: Option[];
}

// 树形结构
export interface TreeNode {
  id: string;
  label: string;
  children?: TreeNode[];
  disabled?: boolean;
  isLeaf?: boolean;
  [key: string]: any;
} 