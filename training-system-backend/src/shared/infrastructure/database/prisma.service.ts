import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  constructor() {
    super({
      log: ['query', 'info', 'warn', 'error'],
    });
  }

  async onModuleInit() {
    console.log('🔌 正在连接数据库...');
    await this.$connect();
    console.log('✅ 数据库连接成功');
  }

  async onModuleDestroy() {
    console.log('🔌 正在断开数据库连接...');
    await this.$disconnect();
    console.log('✅ 数据库连接已断开');
  }

  // 清理方法，用于测试
  async cleanDatabase() {
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
      } catch (error) {
        console.log({ error });
      }
    }

    // 重新启用外键检查
    await this.$executeRaw`SET FOREIGN_KEY_CHECKS = 1`;
  }
} 