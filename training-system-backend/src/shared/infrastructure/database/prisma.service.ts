import { Injectable, OnModuleInit, OnModuleDestroy, Inject, forwardRef } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { LoggerService } from '../logger/logger.service';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  constructor(
    @Inject(forwardRef(() => LoggerService))
    private readonly logger: LoggerService
  ) {
    super({
      log: ['query', 'info', 'warn', 'error'],
    });
  }

  async onModuleInit() {
    try {
      this.logger.info('正在连接数据库...');
      await this.$connect();
      this.logger.info('数据库连接成功');
    } catch (error) {
      this.logger.error('数据库连接失败', error.stack);
      throw error;
    }
  }

  async onModuleDestroy() {
    try {
      this.logger.info('正在断开数据库连接...');
      await this.$disconnect();
      this.logger.info('数据库连接已断开');
    } catch (error) {
      this.logger.error('数据库断开连接失败', error.stack);
    }
  }

  // 清理方法，用于测试 - 仅开发环境
  async cleanDatabase() {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('不允许在生产环境中清理数据库');
    }

    try {
      this.logger.warn('开始清理数据库 (仅测试环境)', { operation: 'cleanDatabase' });
      
      // MySQL 语法
      const tables = await this.$queryRaw<Array<{ table_name: string }>>`
        SELECT table_name FROM information_schema.tables 
        WHERE table_schema = DATABASE() AND table_name != '_prisma_migrations'
      `;

      // 禁用外键检查
      await this.$executeRaw`SET FOREIGN_KEY_CHECKS = 0`;

      for (const { table_name } of tables) {
        try {
          await this.$executeRawUnsafe(`TRUNCATE TABLE \`${table_name}\``);
          this.logger.debug(`已清理表: ${table_name}`);
        } catch (error) {
          this.logger.error(`清理表失败: ${table_name}`, error.stack);
        }
      }

      // 重新启用外键检查
      await this.$executeRaw`SET FOREIGN_KEY_CHECKS = 1`;
      
      this.logger.info('数据库清理完成');
    } catch (error) {
      this.logger.error('数据库清理失败', error.stack);
      throw error;
    }
  }
} 