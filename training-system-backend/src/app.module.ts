import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD, APP_FILTER } from '@nestjs/core';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { EventEmitterModule } from '@nestjs/event-emitter';

// 共享模块
import { DatabaseModule } from './shared/infrastructure/database/database.module';
import { LoggerModule } from './shared/infrastructure/logger/logger.module';
import { AuthModule } from './shared/auth/auth.module';

// 业务模块
import { ProjectManagementModule } from './modules/project-management/project-management.module';
import { UserModule } from './modules/user/user.module';
import { WorkbenchModule } from './modules/workbench/workbench.module';
import { MentorshipModule } from './modules/mentorship/mentorship.module';
import { ObservationModule } from './modules/observation/observation.module';
import { RecommendationModule } from './modules/recommendation/recommendation.module';
import { GrowthDevelopmentModule } from './modules/growth-development/growth-development.module';

// 应用控制器和服务
import { AppController } from './app.controller';
import { AppService } from './app.service';

// 全局过滤器
import { GlobalExceptionFilter } from './shared/filters/global-exception.filter';

@Module({
  imports: [
    // 配置模块
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', 'config/development.env', '.env.development', '.env'],
    }),

    // 限流模块
    ThrottlerModule.forRoot([
      {
        ttl: 60000,
        limit: 100,
      },
    ]),

    // 事件模块
    EventEmitterModule.forRoot(),

    // 基础设施模块
    LoggerModule,
    DatabaseModule,
    AuthModule,

    // 业务模块
    UserModule,
    ProjectManagementModule,
    WorkbenchModule,
    MentorshipModule,
    ObservationModule,
    RecommendationModule,
    GrowthDevelopmentModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    // 全局异常过滤器
    {
      provide: APP_FILTER,
      useClass: GlobalExceptionFilter,
    },
  ],
})
export class AppModule {} 