// 集成相关类型定义

// 集成规则
export interface IntegrationRule {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  priority: number;
  direction: 'unidirectional' | 'bidirectional';
  sourceType: 'training' | 'mentorship';
  targetType: 'training' | 'mentorship';
  triggers: IntegrationTrigger[];
  conditions: IntegrationCondition[];
  actions: IntegrationAction[];
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  metadata?: Record<string, any>;
}

// 集成触发器
export interface IntegrationTrigger {
  event: string;
  conditions?: Record<string, any>;
  schedule?: string;
  enabled: boolean;
}

// 集成条件
export interface IntegrationCondition {
  field: string;
  operator: 'equals' | 'not_equals' | 'contains' | 'greater_than' | 'less_than' | 'in' | 'not_in';
  value: any;
  required: boolean;
}

// 集成动作
export interface IntegrationAction {
  type: 'create' | 'update' | 'delete' | 'notify' | 'sync';
  target: string;
  config: Record<string, any>;
  order: number;
}

// 集成上下文
export interface IntegrationContext {
  trainingProject?: any;
  mentorshipProject?: any;
  student?: any;
  mentor?: any;
  department?: string;
  metadata?: Record<string, any>;
}

// 集成结果
export interface IntegrationResult {
  success: boolean;
  message?: string;
  data?: any;
  errors?: string[];
  warnings?: string[];
  executionTime?: number;
  affectedRecords?: number;
}

// 同步任务
export interface SyncTask {
  id: string;
  type: 'training_to_mentorship' | 'mentorship_to_training' | 'bidirectional';
  source: 'training' | 'mentorship';
  sourceId: string;
  targetId?: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  progress: number;
  scheduledAt?: Date;
  startedAt?: Date;
  completedAt?: Date;
  errors: string[];
  warnings: string[];
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

// 导师匹配结果
export interface MatchingResult {
  id: string;
  studentId: string;
  studentName: string;
  studentDepartment: string;
  requiredSkills: string[];
  mentor?: {
    id: string;
    name: string;
    department: string;
    position: string;
    expertise: string[];
    currentLoad: number;
    maxLoad: number;
    rating: number;
  };
  score: number;
  status: 'pending' | 'approved' | 'rejected' | 'no_match';
  breakdown?: {
    skillsMatch: number;
    departmentMatch: number;
    workloadScore: number;
    ratingScore: number;
    experienceScore: number;
    styleMatch: number;
    overallFit: number;
  };
  reasons?: string[];
  warnings?: string[];
  createdAt: Date;
  updatedAt: Date;
}

// 导师匹配条件
export interface MatchingCriteria {
  studentId: string;
  requiredSkills: string[];
  criteria: string[];
  minRating: number;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  preferences?: {
    department?: string;
    maxLoad?: number;
    experienceLevel?: string;
    teachingStyle?: string;
  };
}

// 通知模板
export interface NotificationTemplate {
  id: string;
  name: string;
  type: string;
  subject: string;
  content: string;
  channels: string[];
  enabled: boolean;
  variables?: string[];
  createdAt: Date;
  updatedAt: Date;
}

// 通知历史
export interface NotificationHistory {
  id: string;
  templateId: string;
  recipientId: string;
  recipientName: string;
  title: string;
  content: string;
  channel: string;
  status: 'sent' | 'delivered' | 'read' | 'failed';
  sentAt: Date;
  deliveredAt?: Date;
  readAt?: Date;
  error?: string;
  retryCount?: number;
  metadata?: Record<string, any>;
}

// 通知统计
export interface NotificationStatistics {
  total: number;
  sent: number;
  delivered: number;
  read: number;
  failed: number;
  pending: number;
  readRate: number;
  channelStats: Record<string, number>;
}

// 日志条目
export interface LogEntry {
  id: string;
  timestamp: Date;
  level: 'debug' | 'info' | 'warn' | 'error';
  module: string;
  message: string;
  traceId?: string;
  requestId?: string;
  userId?: string;
  ip?: string;
  userAgent?: string;
  stack?: string;
  context?: Record<string, any>;
  relatedLogs?: LogEntry[];
}

// 集成工作流
export interface IntegrationWorkflow {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  steps: IntegrationStep[];
  createdAt: Date;
  updatedAt: Date;
}

// 集成步骤
export interface IntegrationStep {
  id: string;
  name: string;
  type: 'condition' | 'action' | 'parallel' | 'loop';
  config: Record<string, any>;
  order: number;
  dependencies?: string[];
  onSuccess?: string;
  onFailure?: string;
  timeout?: number;
  retryCount?: number;
}

// 集成配置
export interface IntegrationConfig {
  id: string;
  category: string;
  key: string;
  value: any;
  description?: string;
  type: 'string' | 'number' | 'boolean' | 'object' | 'array';
  validation?: {
    required?: boolean;
    min?: number;
    max?: number;
    pattern?: string;
    options?: any[];
  };
  updatedAt: Date;
  updatedBy: string;
}

// 集成事件
export interface IntegrationEvent {
  id: string;
  type: string;
  source: string;
  sourceId: string;
  data: any;
  timestamp: Date;
  processed: boolean;
  result?: IntegrationResult;
  retryCount?: number;
  nextRetry?: Date;
} 