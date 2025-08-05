// 自动集成服务 - 培训项目与带教项目的自动关联

import { ElMessage, ElNotification } from 'element-plus';
import type { 
  TrainingProject, 
  MentorshipProject, 
  Student, 
  Mentor,
  AutoIntegrationRule,
  IntegrationContext
} from '@/types';

// 集成规则类型
export interface IntegrationRule {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  conditions: IntegrationCondition[];
  actions: IntegrationAction[];
  priority: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface IntegrationCondition {
  type: 'training_status' | 'score_threshold' | 'skill_level' | 'department' | 'custom';
  field: string;
  operator: 'equals' | 'greater_than' | 'less_than' | 'contains' | 'in';
  value: any;
  required: boolean;
}

export interface IntegrationAction {
  type: 'create_mentorship' | 'notify_manager' | 'update_profile' | 'assign_mentor' | 'send_invitation';
  config: Record<string, any>;
  retryCount?: number;
  timeout?: number;
}

// 集成上下文
export interface IntegrationContext {
  trainingProject: TrainingProject;
  student: Student;
  mentor?: Mentor;
  department: string;
  metadata: Record<string, any>;
}

// 集成结果
export interface IntegrationResult {
  success: boolean;
  mentorshipProjectId?: string;
  errors: string[];
  warnings: string[];
  executedActions: string[];
  executionTime: number;
}

export class AutoIntegrationService {
  private rules: IntegrationRule[] = [];
  private executionQueue: IntegrationContext[] = [];
  private isProcessing = false;

  constructor() {
    this.loadDefaultRules();
  }

  /**
   * 加载默认集成规则
   */
  private loadDefaultRules() {
    this.rules = [
      {
        id: 'auto-create-mentorship-high-score',
        name: '高分学员自动创建带教',
        description: '培训成绩优秀的学员自动创建后续带教项目',
        enabled: true,
        priority: 1,
        conditions: [
          {
            type: 'training_status',
            field: 'status',
            operator: 'equals',
            value: 'completed',
            required: true
          },
          {
            type: 'score_threshold',
            field: 'finalScore',
            operator: 'greater_than',
            value: 85,
            required: true
          }
        ],
        actions: [
          {
            type: 'assign_mentor',
            config: {
              autoMatch: true,
              matchCriteria: ['skills', 'department', 'workload']
            }
          },
          {
            type: 'create_mentorship',
            config: {
              templateId: 'advanced-development',
              duration: 90,
              autoStart: true
            }
          },
          {
            type: 'notify_manager',
            config: {
              template: 'mentorship-created',
              includeStudentManager: true,
              includeMentor: true
            }
          }
        ],
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'manual-review-low-score',
        name: '低分学员手动审核',
        description: '培训成绩较低的学员需要手动决定是否创建带教',
        enabled: true,
        priority: 2,
        conditions: [
          {
            type: 'training_status',
            field: 'status',
            operator: 'equals',
            value: 'completed',
            required: true
          },
          {
            type: 'score_threshold',
            field: 'finalScore',
            operator: 'less_than',
            value: 70,
            required: true
          }
        ],
        actions: [
          {
            type: 'notify_manager',
            config: {
              template: 'manual-review-required',
              urgent: true,
              includeRecommendations: true
            }
          }
        ],
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];
  }

  /**
   * 处理培训项目完成事件
   */
  async handleTrainingCompletion(trainingProject: TrainingProject): Promise<IntegrationResult[]> {
    const results: IntegrationResult[] = [];
    
    try {
      // 获取培训项目的所有参与者
      const students = await this.getTrainingStudents(trainingProject.id);
      
      for (const student of students) {
        const context: IntegrationContext = {
          trainingProject,
          student,
          department: student.department,
          metadata: {
            completionDate: new Date(),
            source: 'auto-integration'
          }
        };
        
        const result = await this.processIntegration(context);
        results.push(result);
      }
      
      return results;
    } catch (error) {
      console.error('Error handling training completion:', error);
      throw error;
    }
  }

  /**
   * 处理单个学员的集成
   */
  async processIntegration(context: IntegrationContext): Promise<IntegrationResult> {
    const startTime = Date.now();
    const result: IntegrationResult = {
      success: false,
      errors: [],
      warnings: [],
      executedActions: [],
      executionTime: 0
    };

    try {
      // 查找匹配的规则
      const matchedRules = this.findMatchingRules(context);
      
      if (matchedRules.length === 0) {
        result.warnings.push('没有找到匹配的集成规则');
        result.success = true;
        return result;
      }

      // 按优先级排序
      matchedRules.sort((a, b) => a.priority - b.priority);

      // 执行匹配的规则
      for (const rule of matchedRules) {
        try {
          await this.executeRule(rule, context, result);
        } catch (error) {
          result.errors.push(`执行规则 ${rule.name} 失败: ${error.message}`);
        }
      }

      result.success = result.errors.length === 0;
    } catch (error) {
      result.errors.push(`集成处理失败: ${error.message}`);
    } finally {
      result.executionTime = Date.now() - startTime;
    }

    return result;
  }

  /**
   * 查找匹配的规则
   */
  private findMatchingRules(context: IntegrationContext): IntegrationRule[] {
    return this.rules.filter(rule => {
      if (!rule.enabled) return false;
      
      return rule.conditions.every(condition => {
        return this.evaluateCondition(condition, context);
      });
    });
  }

  /**
   * 评估条件
   */
  private evaluateCondition(condition: IntegrationCondition, context: IntegrationContext): boolean {
    let value: any;
    
    // 获取字段值
    switch (condition.type) {
      case 'training_status':
        value = context.trainingProject.status;
        break;
      case 'score_threshold':
        // 从培训记录中获取学员的最终成绩
        const studentRecord = context.trainingProject.participants
          .find(p => p.userId === context.student.id);
        value = studentRecord?.finalScore || 0;
        break;
      case 'skill_level':
        value = context.student.level;
        break;
      case 'department':
        value = context.student.department;
        break;
      default:
        value = context.metadata[condition.field];
    }

    // 评估条件
    switch (condition.operator) {
      case 'equals':
        return value === condition.value;
      case 'greater_than':
        return Number(value) > Number(condition.value);
      case 'less_than':
        return Number(value) < Number(condition.value);
      case 'contains':
        return String(value).includes(String(condition.value));
      case 'in':
        return Array.isArray(condition.value) && condition.value.includes(value);
      default:
        return false;
    }
  }

  /**
   * 执行规则
   */
  private async executeRule(
    rule: IntegrationRule, 
    context: IntegrationContext, 
    result: IntegrationResult
  ): Promise<void> {
    for (const action of rule.actions) {
      try {
        await this.executeAction(action, context, result);
        result.executedActions.push(`${rule.name}: ${action.type}`);
      } catch (error) {
        throw new Error(`执行动作 ${action.type} 失败: ${error.message}`);
      }
    }
  }

  /**
   * 执行具体动作
   */
  private async executeAction(
    action: IntegrationAction, 
    context: IntegrationContext,
    result: IntegrationResult
  ): Promise<void> {
    switch (action.type) {
      case 'assign_mentor':
        context.mentor = await this.assignMentor(context, action.config);
        break;
        
      case 'create_mentorship':
        const mentorshipId = await this.createMentorshipProject(context, action.config);
        result.mentorshipProjectId = mentorshipId;
        break;
        
      case 'notify_manager':
        await this.sendNotification(context, action.config);
        break;
        
      case 'update_profile':
        await this.updateStudentProfile(context, action.config);
        break;
        
      case 'send_invitation':
        await this.sendMentorshipInvitation(context, action.config);
        break;
        
      default:
        throw new Error(`未知的动作类型: ${action.type}`);
    }
  }

  /**
   * 自动分配导师
   */
  private async assignMentor(context: IntegrationContext, config: any): Promise<Mentor> {
    if (!config.autoMatch) {
      throw new Error('自动匹配导师功能未启用');
    }

    // 获取学员需要的技能
    const requiredSkills = this.extractRequiredSkills(context);
    
    // 调用导师匹配算法
    const mentorMatchingService = new MentorMatchingService();
    const candidates = await mentorMatchingService.findBestMatches({
      studentId: context.student.id,
      requiredSkills,
      department: context.student.department,
      criteria: config.matchCriteria || ['skills', 'workload']
    });

    if (candidates.length === 0) {
      throw new Error('未找到合适的导师');
    }

    return candidates[0].mentor;
  }

  /**
   * 创建带教项目
   */
  private async createMentorshipProject(context: IntegrationContext, config: any): Promise<string> {
    if (!context.mentor) {
      throw new Error('未分配导师，无法创建带教项目');
    }

    const mentorshipData = {
      name: `${context.trainingProject.name} - 后续带教`,
      description: `基于培训项目"${context.trainingProject.name}"自动创建的带教项目`,
      mentorId: context.mentor.mentorId,
      studentId: context.student.studentId,
      templateId: config.templateId,
      duration: config.duration || 60,
      sourceType: 'training_project',
      sourceProjectId: context.trainingProject.id,
      autoStart: config.autoStart || false,
      goals: this.generateMentorshipGoals(context),
      metadata: {
        autoCreated: true,
        createdBy: 'auto-integration-service',
        sourceTrainingScore: this.getStudentScore(context)
      }
    };

    // 调用API创建带教项目
    // const response = await mentorshipApi.createProject(mentorshipData);
    // return response.data.id;
    
    // 模拟返回
    const projectId = `mentorship-${Date.now()}`;
    
    ElNotification({
      title: '带教项目创建成功',
      message: `已为学员 ${context.student.name} 自动创建带教项目`,
      type: 'success'
    });
    
    return projectId;
  }

  /**
   * 发送通知
   */
  private async sendNotification(context: IntegrationContext, config: any): Promise<void> {
    const notifications = [];
    
    if (config.includeStudentManager) {
      notifications.push({
        userId: context.student.managerId,
        type: 'mentorship_created',
        title: '带教项目已创建',
        content: `学员 ${context.student.name} 的带教项目已自动创建`
      });
    }
    
    if (config.includeMentor && context.mentor) {
      notifications.push({
        userId: context.mentor.mentorId,
        type: 'mentorship_assigned',
        title: '新的带教任务',
        content: `您被分配为学员 ${context.student.name} 的导师`
      });
    }

    // 发送通知
    for (const notification of notifications) {
      // await notificationService.send(notification);
      console.log('发送通知:', notification);
    }
  }

  /**
   * 更新学员档案
   */
  private async updateStudentProfile(context: IntegrationContext, config: any): Promise<void> {
    const updates = {
      lastTrainingProject: context.trainingProject.id,
      currentMentorshipStatus: 'assigned',
      updatedAt: new Date()
    };

    // await growthProfileApi.updateProfile(context.student.id, updates);
    console.log('更新学员档案:', updates);
  }

  /**
   * 发送带教邀请
   */
  private async sendMentorshipInvitation(context: IntegrationContext, config: any): Promise<void> {
    if (!context.mentor) {
      throw new Error('未分配导师，无法发送邀请');
    }

    const invitation = {
      mentorId: context.mentor.mentorId,
      studentId: context.student.studentId,
      projectId: context.metadata.mentorshipProjectId,
      message: config.message || '邀请您参与带教项目',
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7天后过期
    };

    // await invitationService.send(invitation);
    console.log('发送带教邀请:', invitation);
  }

  /**
   * 辅助方法
   */
  private async getTrainingStudents(trainingProjectId: string): Promise<Student[]> {
    // 模拟数据
    return [
      {
        id: 'student-1',
        studentId: 'student-1',
        name: '张三',
        email: 'zhangsan@example.com',
        department: '技术部',
        position: '初级工程师',
        level: 'junior',
        skills: ['JavaScript', 'Vue.js'],
        learningGoals: ['提升前端技能'],
        trainingProjects: [trainingProjectId],
        mentorshipProjects: [],
        growthProfileId: 'profile-1',
        entryDate: new Date(),
        status: 'active',
        managerId: 'manager-1'
      } as Student
    ];
  }

  private extractRequiredSkills(context: IntegrationContext): string[] {
    // 从培训项目中提取所需技能
    return context.trainingProject.curriculum
      ?.map(c => c.skills || [])
      .flat() || [];
  }

  private generateMentorshipGoals(context: IntegrationContext): any[] {
    return [
      {
        title: '深化培训技能',
        description: `基于培训项目"${context.trainingProject.name}"的内容，进一步提升相关技能`,
        priority: 'high',
        targetDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000)
      }
    ];
  }

  private getStudentScore(context: IntegrationContext): number {
    const studentRecord = context.trainingProject.participants
      .find(p => p.userId === context.student.id);
    return studentRecord?.finalScore || 0;
  }

  /**
   * 公共API方法
   */
  
  // 获取集成规则
  getRules(): IntegrationRule[] {
    return [...this.rules];
  }

  // 添加规则
  addRule(rule: Omit<IntegrationRule, 'id' | 'createdAt' | 'updatedAt'>): string {
    const newRule: IntegrationRule = {
      ...rule,
      id: `rule-${Date.now()}`,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    this.rules.push(newRule);
    return newRule.id;
  }

  // 更新规则
  updateRule(id: string, updates: Partial<IntegrationRule>): boolean {
    const index = this.rules.findIndex(r => r.id === id);
    if (index === -1) return false;
    
    this.rules[index] = {
      ...this.rules[index],
      ...updates,
      updatedAt: new Date()
    };
    
    return true;
  }

  // 删除规则
  deleteRule(id: string): boolean {
    const index = this.rules.findIndex(r => r.id === id);
    if (index === -1) return false;
    
    this.rules.splice(index, 1);
    return true;
  }

  // 测试规则
  async testRule(ruleId: string, context: IntegrationContext): Promise<IntegrationResult> {
    const rule = this.rules.find(r => r.id === ruleId);
    if (!rule) {
      throw new Error('规则不存在');
    }

    const result: IntegrationResult = {
      success: false,
      errors: [],
      warnings: [],
      executedActions: [],
      executionTime: 0
    };

    const startTime = Date.now();
    
    try {
      if (this.findMatchingRules(context).includes(rule)) {
        await this.executeRule(rule, context, result);
        result.success = true;
      } else {
        result.warnings.push('规则条件不匹配');
        result.success = true;
      }
    } catch (error) {
      result.errors.push(error.message);
    } finally {
      result.executionTime = Date.now() - startTime;
    }

    return result;
  }
}

// 导师匹配服务（简化版）
class MentorMatchingService {
  async findBestMatches(requirements: {
    studentId: string;
    requiredSkills: string[];
    department: string;
    criteria: string[];
  }): Promise<{ mentor: Mentor; score: number }[]> {
    // 模拟导师匹配逻辑
    const mockMentor: Mentor = {
      id: 'mentor-1',
      mentorId: 'mentor-1',
      name: '李导师',
      email: 'li@example.com',
      department: requirements.department,
      position: '高级工程师',
      expertise: requirements.requiredSkills,
      certifications: [],
      currentLoad: 2,
      maxLoad: 5,
      rating: 4.8,
      trainingMentorships: [],
      mentorshipProjects: [],
      entryDate: new Date(),
      status: 'active'
    };

    return [{ mentor: mockMentor, score: 0.95 }];
  }
}

// 导出服务实例
export const autoIntegrationService = new AutoIntegrationService(); 