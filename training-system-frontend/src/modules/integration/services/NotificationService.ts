// 通知服务 - 处理集成相关的通知和提醒

import { ElNotification, ElMessage } from 'element-plus';
import type { 
  Student, 
  Mentor, 
  TrainingProject, 
  MentorshipProject,
  IntegrationContext,
  IntegrationResult
} from '@/types';

// 通知类型
export interface NotificationConfig {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  recipients: NotificationRecipient[];
  priority: 'low' | 'medium' | 'high' | 'urgent';
  channels: NotificationChannel[];
  template?: string;
  data?: Record<string, any>;
  scheduled?: Date;
  expires?: Date;
  retryCount?: number;
  status: 'pending' | 'sent' | 'failed' | 'expired';
  sentAt?: Date;
  createdAt: Date;
}

export type NotificationType = 
  | 'mentorship_created'
  | 'mentor_assigned'
  | 'integration_success'
  | 'integration_failed'
  | 'manual_review_required'
  | 'sync_completed'
  | 'sync_failed'
  | 'mentor_invitation'
  | 'task_reminder'
  | 'system_alert';

export interface NotificationRecipient {
  id: string;
  type: 'user' | 'role' | 'department' | 'group';
  name: string;
  email?: string;
  phone?: string;
  preferences?: NotificationPreferences;
}

export interface NotificationPreferences {
  enableEmail: boolean;
  enableSMS: boolean;
  enableInApp: boolean;
  enableDesktop: boolean;
  quietHours?: {
    start: string;
    end: string;
  };
  frequency?: 'immediate' | 'hourly' | 'daily' | 'weekly';
}

export type NotificationChannel = 'email' | 'sms' | 'in_app' | 'desktop' | 'webhook';

// 通知模板
export interface NotificationTemplate {
  id: string;
  name: string;
  type: NotificationType;
  subject: string;
  content: string;
  variables: string[];
  channels: NotificationChannel[];
  enabled: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// 通知历史
export interface NotificationHistory {
  id: string;
  configId: string;
  recipientId: string;
  channel: NotificationChannel;
  status: 'sent' | 'failed' | 'delivered' | 'read';
  sentAt: Date;
  deliveredAt?: Date;
  readAt?: Date;
  error?: string;
  retryCount: number;
}

export class NotificationService {
  private notifications: NotificationConfig[] = [];
  private templates: NotificationTemplate[] = [];
  private history: NotificationHistory[] = [];
  private sendQueue: string[] = [];
  private isSending = false;

  constructor() {
    this.loadDefaultTemplates();
    this.startNotificationProcessor();
  }

  /**
   * 加载默认通知模板
   */
  private loadDefaultTemplates() {
    this.templates = [
      {
        id: 'mentorship-created',
        name: '带教项目创建通知',
        type: 'mentorship_created',
        subject: '新的带教项目已创建',
        content: `
尊敬的{{recipientName}}，

系统已为学员{{studentName}}自动创建了带教项目"{{projectName}}"。

项目详情：
- 学员：{{studentName}}（{{studentDepartment}}）
- 导师：{{mentorName}}
- 培训来源：{{sourceTraining}}
- 创建时间：{{createdAt}}

请及时查看项目详情并开始带教工作。

访问链接：{{projectUrl}}

此致，
培训系统
        `,
        variables: ['recipientName', 'studentName', 'studentDepartment', 'projectName', 'mentorName', 'sourceTraining', 'createdAt', 'projectUrl'],
        channels: ['email', 'in_app'],
        enabled: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'mentor-assigned',
        name: '导师分配通知',
        type: 'mentor_assigned',
        subject: '您被指派为新的导师',
        content: `
尊敬的{{mentorName}}，

您已被指派为学员{{studentName}}的导师。

学员信息：
- 姓名：{{studentName}}
- 部门：{{studentDepartment}}
- 职位：{{studentPosition}}
- 技能需求：{{requiredSkills}}

匹配原因：
{{matchingReasons}}

请尽快与学员建立联系，制定详细的带教计划。

联系方式：{{studentContact}}

此致，
培训系统
        `,
        variables: ['mentorName', 'studentName', 'studentDepartment', 'studentPosition', 'requiredSkills', 'matchingReasons', 'studentContact'],
        channels: ['email', 'in_app', 'desktop'],
        enabled: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'integration-success',
        name: '集成成功通知',
        type: 'integration_success',
        subject: '培训项目集成成功',
        content: `
培训项目"{{trainingProject}}"已成功完成集成。

集成结果：
- 自动创建带教项目：{{mentorshipCount}}个
- 成功分配导师：{{mentorAssignedCount}}个
- 处理学员：{{studentCount}}名
- 执行时间：{{executionTime}}

详细报告请查看系统日志。

此致，
培训系统
        `,
        variables: ['trainingProject', 'mentorshipCount', 'mentorAssignedCount', 'studentCount', 'executionTime'],
        channels: ['email', 'in_app'],
        enabled: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'manual-review-required',
        name: '需要人工审核',
        type: 'manual_review_required',
        subject: '需要人工审核的培训结果',
        content: `
以下培训结果需要您的人工审核：

培训项目：{{trainingProject}}
学员：{{studentName}}（{{studentDepartment}}）
培训成绩：{{trainingScore}}
问题描述：{{reviewReason}}

建议操作：
{{recommendations}}

请及时处理以确保学员的后续发展。

审核链接：{{reviewUrl}}

此致，
培训系统
        `,
        variables: ['trainingProject', 'studentName', 'studentDepartment', 'trainingScore', 'reviewReason', 'recommendations', 'reviewUrl'],
        channels: ['email', 'in_app', 'desktop'],
        enabled: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'sync-failed',
        name: '数据同步失败',
        type: 'sync_failed',
        subject: '数据同步失败警告',
        content: `
数据同步任务执行失败，请检查系统状态。

失败详情：
- 任务ID：{{taskId}}
- 源系统：{{sourceSystem}}
- 目标系统：{{targetSystem}}
- 失败原因：{{failureReason}}
- 失败时间：{{failureTime}}

请及时处理以确保数据一致性。

查看详情：{{taskUrl}}

此致，
培训系统
        `,
        variables: ['taskId', 'sourceSystem', 'targetSystem', 'failureReason', 'failureTime', 'taskUrl'],
        channels: ['email', 'in_app', 'desktop'],
        enabled: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'mentor-invitation',
        name: '导师邀请',
        type: 'mentor_invitation',
        subject: '带教项目邀请',
        content: `
尊敬的{{mentorName}}，

您收到了一个新的带教项目邀请。

项目信息：
- 项目名称：{{projectName}}
- 学员：{{studentName}}（{{studentDepartment}}）
- 预计时长：{{estimatedDuration}}天
- 技能要求：{{skillRequirements}}

邀请原因：
{{invitationReason}}

请在7天内回复此邀请。

接受邀请：{{acceptUrl}}
拒绝邀请：{{declineUrl}}

此致，
培训系统
        `,
        variables: ['mentorName', 'projectName', 'studentName', 'studentDepartment', 'estimatedDuration', 'skillRequirements', 'invitationReason', 'acceptUrl', 'declineUrl'],
        channels: ['email', 'in_app'],
        enabled: true,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];
  }

  /**
   * 启动通知处理器
   */
  private startNotificationProcessor() {
    setInterval(() => {
      if (!this.isSending && this.sendQueue.length > 0) {
        this.processNextNotification();
      }
      this.checkScheduledNotifications();
    }, 10000); // 每10秒检查一次
  }

  /**
   * 处理下一个通知
   */
  private async processNextNotification() {
    if (this.sendQueue.length === 0) return;

    this.isSending = true;
    const notificationId = this.sendQueue.shift()!;
    const notification = this.notifications.find(n => n.id === notificationId);

    if (!notification) {
      this.isSending = false;
      return;
    }

    try {
      await this.sendNotification(notification);
      notification.status = 'sent';
      notification.sentAt = new Date();
    } catch (error) {
      notification.status = 'failed';
      notification.retryCount = (notification.retryCount || 0) + 1;
      
      // 如果重试次数未达到上限，重新加入队列
      if (notification.retryCount < 3) {
        this.sendQueue.push(notificationId);
      }
      
      console.error('发送通知失败:', error);
    } finally {
      this.isSending = false;
    }
  }

  /**
   * 检查定时通知
   */
  private checkScheduledNotifications() {
    const now = new Date();
    
    this.notifications.forEach(notification => {
      if (
        notification.status === 'pending' &&
        notification.scheduled &&
        notification.scheduled <= now &&
        !this.sendQueue.includes(notification.id)
      ) {
        this.sendQueue.push(notification.id);
      }
    });
  }

  /**
   * 发送通知
   */
  private async sendNotification(notification: NotificationConfig) {
    for (const recipient of notification.recipients) {
      for (const channel of notification.channels) {
        try {
          await this.sendToChannel(notification, recipient, channel);
          
          this.history.push({
            id: `history-${Date.now()}-${Math.random()}`,
            configId: notification.id,
            recipientId: recipient.id,
            channel,
            status: 'sent',
            sentAt: new Date(),
            retryCount: 0
          });
        } catch (error) {
          this.history.push({
            id: `history-${Date.now()}-${Math.random()}`,
            configId: notification.id,
            recipientId: recipient.id,
            channel,
            status: 'failed',
            sentAt: new Date(),
            error: error.message,
            retryCount: 0
          });
        }
      }
    }
  }

  /**
   * 发送到指定渠道
   */
  private async sendToChannel(
    notification: NotificationConfig,
    recipient: NotificationRecipient,
    channel: NotificationChannel
  ) {
    // 检查用户偏好
    if (!this.shouldSendToChannel(recipient, channel)) {
      return;
    }

    switch (channel) {
      case 'email':
        await this.sendEmail(notification, recipient);
        break;
      case 'sms':
        await this.sendSMS(notification, recipient);
        break;
      case 'in_app':
        await this.sendInApp(notification, recipient);
        break;
      case 'desktop':
        await this.sendDesktop(notification, recipient);
        break;
      case 'webhook':
        await this.sendWebhook(notification, recipient);
        break;
    }
  }

  /**
   * 检查是否应该发送到指定渠道
   */
  private shouldSendToChannel(recipient: NotificationRecipient, channel: NotificationChannel): boolean {
    const prefs = recipient.preferences;
    if (!prefs) return true;

    // 检查渠道是否启用
    switch (channel) {
      case 'email':
        return prefs.enableEmail;
      case 'sms':
        return prefs.enableSMS;
      case 'in_app':
        return prefs.enableInApp;
      case 'desktop':
        return prefs.enableDesktop;
      default:
        return true;
    }
  }

  /**
   * 发送邮件
   */
  private async sendEmail(notification: NotificationConfig, recipient: NotificationRecipient) {
    if (!recipient.email) {
      throw new Error('收件人邮箱地址不存在');
    }

    // 这里应该集成实际的邮件发送服务
    console.log(`发送邮件给 ${recipient.email}:`, {
      subject: notification.title,
      content: notification.message
    });

    // 模拟发送延迟
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  /**
   * 发送短信
   */
  private async sendSMS(notification: NotificationConfig, recipient: NotificationRecipient) {
    if (!recipient.phone) {
      throw new Error('收件人手机号码不存在');
    }

    // 这里应该集成实际的短信发送服务
    console.log(`发送短信给 ${recipient.phone}:`, notification.message);

    // 模拟发送延迟
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  /**
   * 发送应用内通知
   */
  private async sendInApp(notification: NotificationConfig, recipient: NotificationRecipient) {
    // 使用Element Plus的通知组件
    ElNotification({
      title: notification.title,
      message: notification.message,
      type: this.getNotificationTypeForElNotification(notification.type),
      duration: this.getNotificationDuration(notification.priority),
      onClick: () => {
        // 标记为已读
        this.markAsRead(notification.id, recipient.id, 'in_app');
      }
    });
  }

  /**
   * 发送桌面通知
   */
  private async sendDesktop(notification: NotificationConfig, recipient: NotificationRecipient) {
    if (!('Notification' in window)) {
      throw new Error('浏览器不支持桌面通知');
    }

    if (Notification.permission === 'granted') {
      const desktopNotification = new Notification(notification.title, {
        body: notification.message,
        icon: '/favicon.ico',
        tag: notification.id
      });

      desktopNotification.onclick = () => {
        // 标记为已读
        this.markAsRead(notification.id, recipient.id, 'desktop');
        desktopNotification.close();
      };
    } else if (Notification.permission !== 'denied') {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        await this.sendDesktop(notification, recipient);
      }
    }
  }

  /**
   * 发送Webhook通知
   */
  private async sendWebhook(notification: NotificationConfig, recipient: NotificationRecipient) {
    // 这里应该发送到配置的webhook地址
    console.log('发送Webhook通知:', {
      recipient: recipient.id,
      notification: notification.id,
      data: notification.data
    });
  }

  /**
   * 标记为已读
   */
  private markAsRead(notificationId: string, recipientId: string, channel: NotificationChannel) {
    const historyItem = this.history.find(
      h => h.configId === notificationId && h.recipientId === recipientId && h.channel === channel
    );
    
    if (historyItem) {
      historyItem.status = 'read';
      historyItem.readAt = new Date();
    }
  }

  /**
   * 渲染通知内容
   */
  private renderNotificationContent(template: NotificationTemplate, data: Record<string, any>): {
    title: string;
    message: string;
  } {
    let title = template.subject;
    let message = template.content;

    // 替换变量
    template.variables.forEach(variable => {
      const value = data[variable] || '';
      const regex = new RegExp(`{{${variable}}}`, 'g');
      title = title.replace(regex, value);
      message = message.replace(regex, value);
    });

    return { title, message };
  }

  /**
   * 获取Element Plus通知类型
   */
  private getNotificationTypeForElNotification(type: NotificationType): 'success' | 'warning' | 'info' | 'error' {
    switch (type) {
      case 'integration_success':
      case 'sync_completed':
        return 'success';
      case 'integration_failed':
      case 'sync_failed':
        return 'error';
      case 'manual_review_required':
        return 'warning';
      default:
        return 'info';
    }
  }

  /**
   * 获取通知持续时间
   */
  private getNotificationDuration(priority: string): number {
    switch (priority) {
      case 'urgent':
        return 0; // 不自动关闭
      case 'high':
        return 8000;
      case 'medium':
        return 4500;
      case 'low':
        return 3000;
      default:
        return 4500;
    }
  }

  /**
   * 公共API方法
   */

  /**
   * 发送培训项目完成通知
   */
  async notifyTrainingCompletion(
    trainingProject: TrainingProject,
    results: IntegrationResult[]
  ) {
    const template = this.templates.find(t => t.id === 'integration-success');
    if (!template) return;

    const successCount = results.filter(r => r.success).length;
    const failureCount = results.filter(r => !r.success).length;

    const data = {
      trainingProject: trainingProject.name,
      mentorshipCount: successCount,
      mentorAssignedCount: successCount,
      studentCount: results.length,
      executionTime: `${Math.round(results.reduce((sum, r) => sum + r.executionTime, 0) / results.length)}ms`
    };

    const { title, message } = this.renderNotificationContent(template, data);

    // 发送给相关管理员
    const notification: NotificationConfig = {
      id: `notify-${Date.now()}`,
      type: 'integration_success',
      title,
      message,
      recipients: [
        {
          id: 'admin-1',
          type: 'role',
          name: '培训管理员',
          email: 'admin@example.com'
        }
      ],
      priority: 'medium',
      channels: ['email', 'in_app'],
      data,
      status: 'pending',
      createdAt: new Date()
    };

    return this.queueNotification(notification);
  }

  /**
   * 发送导师分配通知
   */
  async notifyMentorAssignment(
    mentor: Mentor,
    student: Student,
    matchingReasons: string[]
  ) {
    const template = this.templates.find(t => t.id === 'mentor-assigned');
    if (!template) return;

    const data = {
      mentorName: mentor.name,
      studentName: student.name,
      studentDepartment: student.department,
      studentPosition: student.position,
      requiredSkills: student.skills.join(', '),
      matchingReasons: matchingReasons.join('\n• '),
      studentContact: student.email
    };

    const { title, message } = this.renderNotificationContent(template, data);

    const notification: NotificationConfig = {
      id: `notify-${Date.now()}`,
      type: 'mentor_assigned',
      title,
      message,
      recipients: [
        {
          id: mentor.mentorId,
          type: 'user',
          name: mentor.name,
          email: mentor.email
        }
      ],
      priority: 'high',
      channels: ['email', 'in_app', 'desktop'],
      data,
      status: 'pending',
      createdAt: new Date()
    };

    return this.queueNotification(notification);
  }

  /**
   * 发送人工审核通知
   */
  async notifyManualReviewRequired(
    trainingProject: TrainingProject,
    student: Student,
    reviewReason: string,
    recommendations: string[]
  ) {
    const template = this.templates.find(t => t.id === 'manual-review-required');
    if (!template) return;

    const data = {
      trainingProject: trainingProject.name,
      studentName: student.name,
      studentDepartment: student.department,
      trainingScore: '65', // 从培训记录获取
      reviewReason,
      recommendations: recommendations.join('\n• '),
      reviewUrl: `/review/${student.id}`
    };

    const { title, message } = this.renderNotificationContent(template, data);

    const notification: NotificationConfig = {
      id: `notify-${Date.now()}`,
      type: 'manual_review_required',
      title,
      message,
      recipients: [
        {
          id: student.managerId || 'manager-1',
          type: 'user',
          name: '部门经理',
          email: 'manager@example.com'
        }
      ],
      priority: 'urgent',
      channels: ['email', 'in_app', 'desktop'],
      data,
      status: 'pending',
      createdAt: new Date()
    };

    return this.queueNotification(notification);
  }

  /**
   * 发送同步失败通知
   */
  async notifySyncFailure(
    taskId: string,
    sourceSystem: string,
    targetSystem: string,
    error: string
  ) {
    const template = this.templates.find(t => t.id === 'sync-failed');
    if (!template) return;

    const data = {
      taskId,
      sourceSystem,
      targetSystem,
      failureReason: error,
      failureTime: new Date().toLocaleString('zh-CN'),
      taskUrl: `/integration/tasks/${taskId}`
    };

    const { title, message } = this.renderNotificationContent(template, data);

    const notification: NotificationConfig = {
      id: `notify-${Date.now()}`,
      type: 'sync_failed',
      title,
      message,
      recipients: [
        {
          id: 'system-admin',
          type: 'role',
          name: '系统管理员',
          email: 'sysadmin@example.com'
        }
      ],
      priority: 'urgent',
      channels: ['email', 'in_app', 'desktop'],
      data,
      status: 'pending',
      createdAt: new Date()
    };

    return this.queueNotification(notification);
  }

  /**
   * 发送导师邀请
   */
  async sendMentorInvitation(
    mentor: Mentor,
    student: Student,
    project: MentorshipProject,
    invitationReason: string
  ) {
    const template = this.templates.find(t => t.id === 'mentor-invitation');
    if (!template) return;

    const data = {
      mentorName: mentor.name,
      projectName: project.name,
      studentName: student.name,
      studentDepartment: student.department,
      estimatedDuration: project.estimatedDuration?.toString() || '60',
      skillRequirements: project.skillTargets?.map(s => s.skill).join(', ') || '',
      invitationReason,
      acceptUrl: `/invitation/accept/${project.id}`,
      declineUrl: `/invitation/decline/${project.id}`
    };

    const { title, message } = this.renderNotificationContent(template, data);

    const notification: NotificationConfig = {
      id: `notify-${Date.now()}`,
      type: 'mentor_invitation',
      title,
      message,
      recipients: [
        {
          id: mentor.mentorId,
          type: 'user',
          name: mentor.name,
          email: mentor.email
        }
      ],
      priority: 'high',
      channels: ['email', 'in_app'],
      data,
      expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7天后过期
      status: 'pending',
      createdAt: new Date()
    };

    return this.queueNotification(notification);
  }

  /**
   * 将通知加入队列
   */
  private queueNotification(notification: NotificationConfig): string {
    this.notifications.push(notification);
    this.sendQueue.push(notification.id);
    return notification.id;
  }

  /**
   * 创建自定义通知
   */
  createCustomNotification(config: Omit<NotificationConfig, 'id' | 'status' | 'createdAt'>): string {
    const notification: NotificationConfig = {
      ...config,
      id: `custom-${Date.now()}`,
      status: 'pending',
      createdAt: new Date()
    };

    return this.queueNotification(notification);
  }

  /**
   * 获取通知历史
   */
  getNotificationHistory(recipientId?: string, limit?: number): NotificationHistory[] {
    let history = this.history;
    
    if (recipientId) {
      history = history.filter(h => h.recipientId === recipientId);
    }
    
    history.sort((a, b) => b.sentAt.getTime() - a.sentAt.getTime());
    
    if (limit) {
      history = history.slice(0, limit);
    }
    
    return history;
  }

  /**
   * 获取通知统计
   */
  getNotificationStatistics(): {
    total: number;
    sent: number;
    failed: number;
    pending: number;
    readRate: number;
    channelStats: Record<NotificationChannel, number>;
  } {
    const total = this.notifications.length;
    const sent = this.notifications.filter(n => n.status === 'sent').length;
    const failed = this.notifications.filter(n => n.status === 'failed').length;
    const pending = this.notifications.filter(n => n.status === 'pending').length;
    
    const readCount = this.history.filter(h => h.status === 'read').length;
    const sentCount = this.history.filter(h => h.status === 'sent').length;
    const readRate = sentCount > 0 ? readCount / sentCount : 0;
    
    const channelStats: Record<NotificationChannel, number> = {
      email: 0,
      sms: 0,
      in_app: 0,
      desktop: 0,
      webhook: 0
    };
    
    this.history.forEach(h => {
      channelStats[h.channel]++;
    });
    
    return {
      total,
      sent,
      failed,
      pending,
      readRate,
      channelStats
    };
  }

  /**
   * 取消通知
   */
  cancelNotification(notificationId: string): boolean {
    const notification = this.notifications.find(n => n.id === notificationId);
    if (notification && notification.status === 'pending') {
      notification.status = 'expired';
      const index = this.sendQueue.indexOf(notificationId);
      if (index > -1) {
        this.sendQueue.splice(index, 1);
      }
      return true;
    }
    return false;
  }

  /**
   * 更新用户通知偏好
   */
  updateUserPreferences(userId: string, preferences: NotificationPreferences): void {
    // 更新所有相关的收件人偏好
    this.notifications.forEach(notification => {
      notification.recipients.forEach(recipient => {
        if (recipient.id === userId) {
          recipient.preferences = preferences;
        }
      });
    });
  }

  /**
   * 获取通知模板
   */
  getTemplates(): NotificationTemplate[] {
    return [...this.templates];
  }

  /**
   * 添加通知模板
   */
  addTemplate(template: Omit<NotificationTemplate, 'id' | 'createdAt' | 'updatedAt'>): string {
    const newTemplate: NotificationTemplate = {
      ...template,
      id: `template-${Date.now()}`,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    this.templates.push(newTemplate);
    return newTemplate.id;
  }

  /**
   * 更新通知模板
   */
  updateTemplate(id: string, updates: Partial<NotificationTemplate>): boolean {
    const index = this.templates.findIndex(t => t.id === id);
    if (index === -1) return false;
    
    this.templates[index] = {
      ...this.templates[index],
      ...updates,
      updatedAt: new Date()
    };
    
    return true;
  }

  /**
   * 删除通知模板
   */
  deleteTemplate(id: string): boolean {
    const index = this.templates.findIndex(t => t.id === id);
    if (index === -1) return false;
    
    this.templates.splice(index, 1);
    return true;
  }
}

// 导出服务实例
export const notificationService = new NotificationService(); 