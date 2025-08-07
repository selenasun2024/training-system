import { Global, Module } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { PrismaService } from './prisma.service';
import { DatabaseTransactionService } from '../../services/database-transaction.service';
import { DatabaseOperationInterceptor } from '../../interceptors/database-operation.interceptor';
import { LoggerModule } from '../logger/logger.module';

@Global()
@Module({
  imports: [LoggerModule],
  providers: [
    PrismaService,
    DatabaseTransactionService,
    {
      provide: APP_INTERCEPTOR,
      useClass: DatabaseOperationInterceptor,
    },
  ],
  exports: [PrismaService, DatabaseTransactionService],
})
export class DatabaseModule {} 