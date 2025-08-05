// 集成服务统一导出

import { AutoIntegrationService } from './AutoIntegrationService';
import { DataSyncService } from './DataSyncService';
import { MentorMatchingService } from './MentorMatchingService';
import { NotificationService } from './NotificationService';

// 创建服务实例
export const autoIntegrationService = new AutoIntegrationService();
export const dataSyncService = new DataSyncService();
export const mentorMatchingService = new MentorMatchingService();
export const notificationService = new NotificationService();

// 导出服务类（用于类型推断）
export { AutoIntegrationService, DataSyncService, MentorMatchingService, NotificationService };

// 导出相关类型（重新导出）
export type { 
  IntegrationRule, 
  IntegrationCondition, 
  IntegrationAction, 
  IntegrationContext, 
  IntegrationResult 
} from './AutoIntegrationService';

export type { 
  SyncTask, 
  SyncRule, 
  SyncResult, 
  SyncDetail 
} from './DataSyncService';

export type { 
  MatchingCriteria, 
  MatchingResult, 
  SkillMatchDetail 
} from './MentorMatchingService';

export type { 
  NotificationConfig, 
  NotificationTemplate, 
  NotificationHistory, 
  NotificationType, 
  NotificationChannel,
  NotificationRecipient,
  NotificationPreferences
} from './NotificationService'; 