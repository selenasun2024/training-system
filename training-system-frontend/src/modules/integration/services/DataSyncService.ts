// 数据同步服务 - 培训数据与带教数据的自动同步

import { ElMessage } from 'element-plus';
import type { 
  TrainingProject, 
  MentorshipProject, 
  Student, 
  GrowthProfile,
  SyncRule,
  SyncResult,
  SyncStatus
} from '@/types';

// 同步任务类型
export interface SyncTask {
  id: string;
  type: 'training_to_mentorship' | 'mentorship_to_training' | 'bidirectional';
  source: 'training' | 'mentorship';
  sourceId: string;
  targetId?: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  scheduledAt?: Date;
  startedAt?: Date;
  completedAt?: Date;
  progress: number;
  errors: string[];
  warnings: string[];
  metadata: Record<string, any>;
}

// 同步规则
export interface SyncRule {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  direction: 'unidirectional' | 'bidirectional';
  sourceType: 'training' | 'mentorship';
  targetType: 'mentorship' | 'training';
  triggers: SyncTrigger[];
  mappings: FieldMapping[];
  conditions: SyncCondition[];
  transformations: DataTransformation[];
  schedule?: SyncSchedule;
  priority: number;
  createdAt: Date;
  updatedAt: Date;
}

// 同步触发器
export interface SyncTrigger {
  event: 'create' | 'update' | 'delete' | 'status_change' | 'schedule';
  conditions?: Record<string, any>;
  delay?: number; // 延迟同步（秒）
}

// 字段映射
export interface FieldMapping {
  sourceField: string;
  targetField: string;
  transformation?: string;
  required: boolean;
  defaultValue?: any;
}

// 同步条件
export interface SyncCondition {
  field: string;
  operator: 'equals' | 'not_equals' | 'greater_than' | 'less_than' | 'exists' | 'not_exists';
  value: any;
  required: boolean;
}

// 数据转换
export interface DataTransformation {
  field: string;
  type: 'format' | 'calculate' | 'lookup' | 'aggregate' | 'custom';
  config: Record<string, any>;
}

// 同步调度
export interface SyncSchedule {
  type: 'immediate' | 'delayed' | 'scheduled' | 'recurring';
  interval?: number; // 间隔时间（分钟）
  cron?: string; // cron表达式
  timezone?: string;
}

// 同步结果
export interface SyncResult {
  taskId: string;
  success: boolean;
  syncedRecords: number;
  failedRecords: number;
  warnings: string[];
  errors: string[];
  details: SyncDetail[];
  executionTime: number;
  timestamp: Date;
}

// 同步详情
export interface SyncDetail {
  recordId: string;
  action: 'create' | 'update' | 'delete' | 'skip';
  success: boolean;
  error?: string;
  changes?: Record<string, any>;
}

export class DataSyncService {
  private syncTasks: Map<string, SyncTask> = new Map();
  private syncRules: SyncRule[] = [];
  private isProcessing = false;
  private processingQueue: string[] = [];

  constructor() {
    this.loadDefaultSyncRules();
    this.startSyncProcessor();
  }

  /**
   * 加载默认同步规则
   */
  private loadDefaultSyncRules() {
    this.syncRules = [
      {
        id: 'training-completion-to-mentorship',
        name: '培训完成自动同步带教',
        description: '培训项目完成后，自动同步学员信息到带教项目',
        enabled: true,
        direction: 'unidirectional',
        sourceType: 'training',
        targetType: 'mentorship',
        triggers: [
          {
            event: 'status_change',
            conditions: { status: 'completed' }
          }
        ],
        mappings: [
          {
            sourceField: 'participants',
            targetField: 'students',
            transformation: 'participant_to_student',
            required: true
          },
          {
            sourceField: 'curriculum',
            targetField: 'skillTargets',
            transformation: 'curriculum_to_skills',
            required: true
          },
          {
            sourceField: 'duration',
            targetField: 'estimatedDuration',
            required: false
          }
        ],
        conditions: [
          {
            field: 'finalScore',
            operator: 'greater_than',
            value: 70,
            required: true
          }
        ],
        transformations: [
          {
            field: 'participants',
            type: 'custom',
            config: {
              function: 'filterHighPerformers',
              threshold: 80
            }
          }
        ],
        priority: 1,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'mentorship-progress-to-profile',
        name: '带教进度同步成长档案',
        description: '带教项目进度自动同步到学员成长档案',
        enabled: true,
        direction: 'unidirectional',
        sourceType: 'mentorship',
        targetType: 'training',
        triggers: [
          {
            event: 'update',
            conditions: { field: 'progress' }
          }
        ],
        mappings: [
          {
            sourceField: 'progress',
            targetField: 'mentorshipProgress',
            required: true
          },
          {
            sourceField: 'achievements',
            targetField: 'recentAchievements',
            required: false
          },
          {
            sourceField: 'feedback',
            targetField: 'mentorFeedback',
            required: false
          }
        ],
        conditions: [],
        transformations: [
          {
            field: 'progress',
            type: 'calculate',
            config: {
              formula: 'progress * 100'
            }
          }
        ],
        schedule: {
          type: 'recurring',
          interval: 60 // 每小时同步一次
        },
        priority: 2,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'skill-development-bidirectional',
        name: '技能发展双向同步',
        description: '培训和带教的技能发展数据双向同步',
        enabled: true,
        direction: 'bidirectional',
        sourceType: 'training',
        targetType: 'mentorship',
        triggers: [
          {
            event: 'update',
            conditions: { field: 'skillAssessments' }
          }
        ],
        mappings: [
          {
            sourceField: 'skillAssessments',
            targetField: 'skillProgress',
            transformation: 'assessment_to_progress',
            required: true
          }
        ],
        conditions: [],
        transformations: [
          {
            field: 'skillAssessments',
            type: 'aggregate',
            config: {
              groupBy: 'skill',
              aggregation: 'latest'
            }
          }
        ],
        priority: 3,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];
  }

  /**
   * 启动同步处理器
   */
  private startSyncProcessor() {
    setInterval(() => {
      if (!this.isProcessing && this.processingQueue.length > 0) {
        this.processNextTask();
      }
    }, 5000); // 每5秒检查一次
  }

  /**
   * 处理下一个同步任务
   */
  private async processNextTask() {
    if (this.processingQueue.length === 0) return;

    this.isProcessing = true;
    const taskId = this.processingQueue.shift()!;
    const task = this.syncTasks.get(taskId);

    if (!task) {
      this.isProcessing = false;
      return;
    }

    try {
      task.status = 'running';
      task.startedAt = new Date();
      task.progress = 0;

      const result = await this.executeSync(task);
      
      task.status = result.success ? 'completed' : 'failed';
      task.completedAt = new Date();
      task.progress = 100;
      
      if (!result.success) {
        task.errors.push(...result.errors);
      }
      
      task.warnings.push(...result.warnings);

      // 发送完成通知
      this.notifyTaskCompletion(task, result);

    } catch (error) {
      task.status = 'failed';
      task.errors.push(error.message);
      task.completedAt = new Date();
      task.progress = 0;

      console.error('同步任务执行失败:', error);
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * 执行同步任务
   */
  private async executeSync(task: SyncTask): Promise<SyncResult> {
    const startTime = Date.now();
    const result: SyncResult = {
      taskId: task.id,
      success: false,
      syncedRecords: 0,
      failedRecords: 0,
      warnings: [],
      errors: [],
      details: [],
      executionTime: 0,
      timestamp: new Date()
    };

    try {
      // 获取同步规则
      const rule = this.syncRules.find(r => r.id === task.metadata.ruleId);
      if (!rule) {
        throw new Error('同步规则不存在');
      }

      // 获取源数据
      const sourceData = await this.getSourceData(task.source, task.sourceId);
      if (!sourceData) {
        throw new Error('源数据不存在');
      }

      // 验证同步条件
      const conditionsPassed = this.validateConditions(sourceData, rule.conditions);
      if (!conditionsPassed) {
        result.warnings.push('同步条件不满足，跳过同步');
        result.success = true;
        return result;
      }

      // 数据转换
      const transformedData = await this.transformData(sourceData, rule);
      
      // 执行同步
      const syncDetails = await this.performSync(transformedData, rule, task);
      result.details = syncDetails;

      // 统计结果
      result.syncedRecords = syncDetails.filter(d => d.success).length;
      result.failedRecords = syncDetails.filter(d => !d.success).length;
      result.errors = syncDetails.filter(d => !d.success).map(d => d.error || '未知错误');

      result.success = result.failedRecords === 0;
      
      // 更新任务进度
      task.progress = 100;

    } catch (error) {
      result.errors.push(error.message);
      result.success = false;
    } finally {
      result.executionTime = Date.now() - startTime;
    }

    return result;
  }

  /**
   * 获取源数据
   */
  private async getSourceData(source: string, sourceId: string): Promise<any> {
    // 这里应该调用相应的API获取数据
    if (source === 'training') {
      // return await trainingApi.getProject(sourceId);
      // 模拟培训项目数据
      return {
        id: sourceId,
        name: '前端技能培训',
        status: 'completed',
        participants: [
          {
            userId: 'user-1',
            name: '张三',
            department: '技术部',
            finalScore: 85,
            skillAssessments: [
              { skill: 'JavaScript', level: 'intermediate', score: 85 },
              { skill: 'Vue.js', level: 'beginner', score: 80 }
            ]
          }
        ],
        curriculum: [
          { skill: 'JavaScript', targetLevel: 'intermediate' },
          { skill: 'Vue.js', targetLevel: 'intermediate' }
        ],
        duration: 30
      };
    } else if (source === 'mentorship') {
      // return await mentorshipApi.getProject(sourceId);
      // 模拟带教项目数据
      return {
        id: sourceId,
        name: '高级前端带教',
        progress: 65,
        achievements: ['完成第一个项目模块'],
        feedback: [
          { date: new Date(), content: '学习进度良好', rating: 4 }
        ],
        skillProgress: [
          { skill: 'JavaScript', progress: 70 },
          { skill: 'Vue.js', progress: 60 }
        ]
      };
    }

    return null;
  }

  /**
   * 验证同步条件
   */
  private validateConditions(data: any, conditions: SyncCondition[]): boolean {
    return conditions.every(condition => {
      const fieldValue = this.getFieldValue(data, condition.field);
      
      switch (condition.operator) {
        case 'equals':
          return fieldValue === condition.value;
        case 'not_equals':
          return fieldValue !== condition.value;
        case 'greater_than':
          return Number(fieldValue) > Number(condition.value);
        case 'less_than':
          return Number(fieldValue) < Number(condition.value);
        case 'exists':
          return fieldValue !== undefined && fieldValue !== null;
        case 'not_exists':
          return fieldValue === undefined || fieldValue === null;
        default:
          return true;
      }
    });
  }

  /**
   * 数据转换
   */
  private async transformData(data: any, rule: SyncRule): Promise<any> {
    const transformed: any = {};

    // 应用字段映射
    for (const mapping of rule.mappings) {
      const sourceValue = this.getFieldValue(data, mapping.sourceField);
      
      if (sourceValue !== undefined || mapping.required) {
        let targetValue = sourceValue;
        
        // 应用转换
        if (mapping.transformation) {
          targetValue = await this.applyTransformation(
            sourceValue, 
            mapping.transformation, 
            data
          );
        }
        
        // 使用默认值
        if (targetValue === undefined && mapping.defaultValue !== undefined) {
          targetValue = mapping.defaultValue;
        }
        
        this.setFieldValue(transformed, mapping.targetField, targetValue);
      }
    }

    // 应用数据转换
    for (const transformation of rule.transformations) {
      const currentValue = this.getFieldValue(transformed, transformation.field);
      const newValue = await this.applyDataTransformation(
        currentValue, 
        transformation, 
        data
      );
      this.setFieldValue(transformed, transformation.field, newValue);
    }

    return transformed;
  }

  /**
   * 应用转换规则
   */
  private async applyTransformation(
    value: any, 
    transformation: string, 
    sourceData: any
  ): Promise<any> {
    switch (transformation) {
      case 'participant_to_student':
        return Array.isArray(value) ? value.map(p => ({
          studentId: p.userId,
          name: p.name,
          department: p.department,
          initialScore: p.finalScore
        })) : [];
        
      case 'curriculum_to_skills':
        return Array.isArray(value) ? value.map(c => ({
          skill: c.skill,
          targetLevel: c.targetLevel,
          currentLevel: 'beginner'
        })) : [];
        
      case 'assessment_to_progress':
        return Array.isArray(value) ? value.map(a => ({
          skill: a.skill,
          progress: a.score,
          level: a.level
        })) : [];
        
      default:
        return value;
    }
  }

  /**
   * 应用数据转换
   */
  private async applyDataTransformation(
    value: any, 
    transformation: DataTransformation, 
    sourceData: any
  ): Promise<any> {
    switch (transformation.type) {
      case 'format':
        return this.formatValue(value, transformation.config);
        
      case 'calculate':
        return this.calculateValue(value, transformation.config);
        
      case 'lookup':
        return await this.lookupValue(value, transformation.config);
        
      case 'aggregate':
        return this.aggregateValue(value, transformation.config);
        
      case 'custom':
        return await this.customTransformation(value, transformation.config);
        
      default:
        return value;
    }
  }

  /**
   * 执行同步操作
   */
  private async performSync(
    data: any, 
    rule: SyncRule, 
    task: SyncTask
  ): Promise<SyncDetail[]> {
    const details: SyncDetail[] = [];

    try {
      // 根据规则类型执行不同的同步操作
      if (rule.sourceType === 'training' && rule.targetType === 'mentorship') {
        // 培训到带教的同步
        const detail = await this.syncTrainingToMentorship(data, task);
        details.push(detail);
      } else if (rule.sourceType === 'mentorship' && rule.targetType === 'training') {
        // 带教到培训的同步
        const detail = await this.syncMentorshipToTraining(data, task);
        details.push(detail);
      }

      // 更新成长档案
      await this.updateGrowthProfile(data, task);

    } catch (error) {
      details.push({
        recordId: task.sourceId,
        action: 'skip',
        success: false,
        error: error.message
      });
    }

    return details;
  }

  /**
   * 培训到带教的同步
   */
  private async syncTrainingToMentorship(data: any, task: SyncTask): Promise<SyncDetail> {
    try {
      // 创建或更新带教项目
      const mentorshipData = {
        name: data.name + ' - 后续带教',
        students: data.students,
        skillTargets: data.skillTargets,
        sourceTrainingId: task.sourceId
      };

      // 调用API创建带教项目
      // const response = await mentorshipApi.createProject(mentorshipData);
      
      return {
        recordId: task.sourceId,
        action: 'create',
        success: true,
        changes: mentorshipData
      };
    } catch (error) {
      return {
        recordId: task.sourceId,
        action: 'create',
        success: false,
        error: error.message
      };
    }
  }

  /**
   * 带教到培训的同步
   */
  private async syncMentorshipToTraining(data: any, task: SyncTask): Promise<SyncDetail> {
    try {
      // 更新培训记录
      const updates = {
        mentorshipProgress: data.progress,
        recentAchievements: data.achievements,
        mentorFeedback: data.feedback
      };

      // 调用API更新培训记录
      // const response = await trainingApi.updateProject(task.targetId, updates);
      
      return {
        recordId: task.sourceId,
        action: 'update',
        success: true,
        changes: updates
      };
    } catch (error) {
      return {
        recordId: task.sourceId,
        action: 'update',
        success: false,
        error: error.message
      };
    }
  }

  /**
   * 更新成长档案
   */
  private async updateGrowthProfile(data: any, task: SyncTask): Promise<void> {
    try {
      // 生成成长记录
      const timelineEvent = {
        type: 'sync_update',
        title: '数据同步更新',
        description: `从${task.source}同步数据到成长档案`,
        date: new Date(),
        metadata: {
          sourceType: task.source,
          sourceId: task.sourceId,
          syncRuleId: task.metadata.ruleId
        }
      };

      // 调用API更新成长档案
      // await growthProfileApi.addTimelineEvent(studentId, timelineEvent);
      
      console.log('成长档案更新:', timelineEvent);
    } catch (error) {
      console.error('更新成长档案失败:', error);
    }
  }

  /**
   * 工具方法
   */
  private getFieldValue(obj: any, field: string): any {
    const fields = field.split('.');
    let value = obj;
    
    for (const f of fields) {
      if (value && typeof value === 'object') {
        value = value[f];
      } else {
        return undefined;
      }
    }
    
    return value;
  }

  private setFieldValue(obj: any, field: string, value: any): void {
    const fields = field.split('.');
    let current = obj;
    
    for (let i = 0; i < fields.length - 1; i++) {
      const f = fields[i];
      if (!(f in current)) {
        current[f] = {};
      }
      current = current[f];
    }
    
    current[fields[fields.length - 1]] = value;
  }

  private formatValue(value: any, config: any): any {
    // 实现格式化逻辑
    return value;
  }

  private calculateValue(value: any, config: any): any {
    if (config.formula) {
      // 简单的计算逻辑
      return eval(config.formula.replace('progress', value));
    }
    return value;
  }

  private async lookupValue(value: any, config: any): Promise<any> {
    // 实现查找逻辑
    return value;
  }

  private aggregateValue(value: any, config: any): any {
    if (Array.isArray(value) && config.groupBy) {
      const grouped = value.reduce((acc, item) => {
        const key = item[config.groupBy];
        if (!acc[key]) acc[key] = [];
        acc[key].push(item);
        return acc;
      }, {});

      if (config.aggregation === 'latest') {
        return Object.values(grouped).map((items: any[]) => 
          items.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0]
        );
      }
    }
    return value;
  }

  private async customTransformation(value: any, config: any): Promise<any> {
    if (config.function === 'filterHighPerformers') {
      return Array.isArray(value) ? 
        value.filter(item => item.finalScore >= (config.threshold || 80)) : 
        value;
    }
    return value;
  }

  private notifyTaskCompletion(task: SyncTask, result: SyncResult): void {
    if (result.success) {
      ElMessage.success(`同步任务完成: ${result.syncedRecords} 条记录已同步`);
    } else {
      ElMessage.error(`同步任务失败: ${result.errors.join(', ')}`);
    }
  }

  /**
   * 公共API方法
   */

  // 创建同步任务
  createSyncTask(options: {
    type: SyncTask['type'];
    source: 'training' | 'mentorship';
    sourceId: string;
    targetId?: string;
    priority?: SyncTask['priority'];
    scheduledAt?: Date;
    metadata?: Record<string, any>;
  }): string {
    const task: SyncTask = {
      id: `sync-${Date.now()}`,
      type: options.type,
      source: options.source,
      sourceId: options.sourceId,
      targetId: options.targetId,
      status: 'pending',
      priority: options.priority || 'medium',
      scheduledAt: options.scheduledAt,
      progress: 0,
      errors: [],
      warnings: [],
      metadata: options.metadata || {}
    };

    this.syncTasks.set(task.id, task);
    this.processingQueue.push(task.id);

    return task.id;
  }

  // 获取同步任务状态
  getSyncTaskStatus(taskId: string): SyncTask | null {
    return this.syncTasks.get(taskId) || null;
  }

  // 取消同步任务
  cancelSyncTask(taskId: string): boolean {
    const task = this.syncTasks.get(taskId);
    if (task && task.status === 'pending') {
      task.status = 'cancelled';
      const index = this.processingQueue.indexOf(taskId);
      if (index > -1) {
        this.processingQueue.splice(index, 1);
      }
      return true;
    }
    return false;
  }

  // 获取同步规则
  getSyncRules(): SyncRule[] {
    return [...this.syncRules];
  }

  // 添加同步规则
  addSyncRule(rule: Omit<SyncRule, 'id' | 'createdAt' | 'updatedAt'>): string {
    const newRule: SyncRule = {
      ...rule,
      id: `rule-${Date.now()}`,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    this.syncRules.push(newRule);
    return newRule.id;
  }

  // 更新同步规则
  updateSyncRule(id: string, updates: Partial<SyncRule>): boolean {
    const index = this.syncRules.findIndex(r => r.id === id);
    if (index === -1) return false;

    this.syncRules[index] = {
      ...this.syncRules[index],
      ...updates,
      updatedAt: new Date()
    };

    return true;
  }

  // 删除同步规则
  deleteSyncRule(id: string): boolean {
    const index = this.syncRules.findIndex(r => r.id === id);
    if (index === -1) return false;

    this.syncRules.splice(index, 1);
    return true;
  }

  // 手动触发同步
  triggerSync(sourceType: 'training' | 'mentorship', sourceId: string): string {
    return this.createSyncTask({
      type: 'training_to_mentorship',
      source: sourceType,
      sourceId,
      priority: 'high',
      metadata: { manual: true }
    });
  }

  // 获取同步统计
  getSyncStatistics(): {
    totalTasks: number;
    completedTasks: number;
    failedTasks: number;
    pendingTasks: number;
    averageExecutionTime: number;
  } {
    const tasks = Array.from(this.syncTasks.values());
    const completed = tasks.filter(t => t.status === 'completed');
    const failed = tasks.filter(t => t.status === 'failed');
    const pending = tasks.filter(t => t.status === 'pending');

    const avgTime = completed.length > 0 ? 
      completed.reduce((sum, t) => {
        return sum + (t.completedAt!.getTime() - t.startedAt!.getTime());
      }, 0) / completed.length : 0;

    return {
      totalTasks: tasks.length,
      completedTasks: completed.length,
      failedTasks: failed.length,
      pendingTasks: pending.length,
      averageExecutionTime: avgTime
    };
  }
}

// 导出服务实例
export const dataSyncService = new DataSyncService(); 