import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  BadRequestException,
  InternalServerErrorException,
  RequestTimeoutException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable, throwError, TimeoutError } from 'rxjs';
import { catchError, tap, timeout } from 'rxjs/operators';
import { PrismaService } from '../infrastructure/database/prisma.service';
import { LoggerService } from '../infrastructure/logger/logger.service';
import {
  DATABASE_OPERATION_METADATA,
  DatabaseOperationMetadata,
} from '../decorators/database-operation.decorator';
import { PrismaClientKnownRequestError, PrismaClientValidationError } from '@prisma/client/runtime/library';

@Injectable()
export class DatabaseOperationInterceptor implements NestInterceptor {
  constructor(
    private readonly reflector: Reflector,
    private readonly prisma: PrismaService,
    private readonly logger: LoggerService,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const metadata = this.reflector.get<DatabaseOperationMetadata>(
      DATABASE_OPERATION_METADATA,
      context.getHandler(),
    );

    if (!metadata) {
      return next.handle();
    }

    const request = context.switchToHttp().getRequest();
    const startTime = Date.now();
    const operationId = this.generateOperationId();

    // 记录操作开始
    this.logger.info(`数据库操作开始: ${metadata.operation}`, {
      operationId,
      operation: metadata.operation,
      tables: metadata.tables,
      type: metadata.type,
      userId: request.user?.userId,
      ip: request.ip,
    });

    // 应用超时设置
    let stream = next.handle();
    if (metadata.timeout) {
      stream = stream.pipe(
        timeout(metadata.timeout),
        catchError((error) => {
          if (error instanceof TimeoutError) {
            this.logger.error(`数据库操作超时: ${metadata.operation}`, error, {
              operationId,
              duration: Date.now() - startTime,
              timeout: metadata.timeout,
            });
            return throwError(() => new RequestTimeoutException('数据库操作超时'));
          }
          return throwError(() => error);
        }),
      );
    }

    return stream.pipe(
      tap((result) => {
        const duration = Date.now() - startTime;
        
        // 记录操作成功
        this.logger.info(`数据库操作成功: ${metadata.operation}`, {
          operationId,
          duration,
          resultSize: this.getResultSize(result),
        });

        // 性能监控
        if (metadata.logPerformance) {
          this.logPerformanceMetrics(metadata, duration, true);
        }
      }),
      catchError((error) => {
        const duration = Date.now() - startTime;
        
        // 记录操作失败
        this.logger.error(`数据库操作失败: ${metadata.operation}`, error, {
          operationId,
          duration,
          errorType: error.constructor.name,
        });

        // 性能监控（失败情况）
        if (metadata.logPerformance) {
          this.logPerformanceMetrics(metadata, duration, false);
        }

        // 转换和处理数据库异常
        const handledException = this.handleDatabaseException(error, metadata);
        return throwError(() => handledException);
      }),
    );
  }

  /**
   * 处理数据库异常
   */
  private handleDatabaseException(
    error: any,
    metadata: DatabaseOperationMetadata,
  ): Error {
    // Prisma 已知错误
    if (error instanceof PrismaClientKnownRequestError) {
      return this.handlePrismaKnownError(error, metadata);
    }

    // Prisma 验证错误
    if (error instanceof PrismaClientValidationError) {
      this.logger.error('数据库验证错误', error, {
        operation: metadata.operation,
        tables: metadata.tables,
      });
      return new BadRequestException('数据验证失败，请检查输入参数');
    }

    // 超时错误
    if (error instanceof RequestTimeoutException) {
      return error;
    }

    // 业务异常直接传递
    if (error instanceof BadRequestException || 
        error.status >= 400 && error.status < 500) {
      return error;
    }

    // 其他未知错误
    this.logger.error('未知数据库错误', error, {
      operation: metadata.operation,
      tables: metadata.tables,
      errorMessage: error.message,
      errorStack: error.stack,
    });

    return new InternalServerErrorException('数据库操作失败，请稍后重试');
  }

  /**
   * 处理 Prisma 已知错误
   */
  private handlePrismaKnownError(
    error: PrismaClientKnownRequestError,
    metadata: DatabaseOperationMetadata,
  ): Error {
    const { code, meta } = error;

    switch (code) {
      case 'P2002':
        // 唯一约束冲突
        const target = (meta?.target as string[])?.join(', ') || '字段';
        this.logger.warn('数据库唯一约束冲突', {
          operation: metadata.operation,
          code,
          target,
        });
        return new BadRequestException(`${target} 已存在，请使用不同的值`);

      case 'P2025':
        // 记录不存在
        this.logger.warn('数据库记录不存在', {
          operation: metadata.operation,
          code,
          cause: meta?.cause,
        });
        return new BadRequestException('请求的记录不存在');

      case 'P2003':
        // 外键约束失败
        this.logger.warn('数据库外键约束失败', {
          operation: metadata.operation,
          code,
          field: meta?.field_name,
        });
        return new BadRequestException('关联数据不存在，请检查关联关系');

      case 'P2014':
        // 关联记录删除冲突
        this.logger.warn('数据库关联记录删除冲突', {
          operation: metadata.operation,
          code,
          relation: meta?.relation_name,
        });
        return new BadRequestException('无法删除，存在关联数据');

      case 'P2034':
        // 事务冲突
        this.logger.warn('数据库事务冲突', {
          operation: metadata.operation,
          code,
        });
        return new BadRequestException('数据冲突，请重试');

      default:
        this.logger.error('Prisma未处理错误', error, {
          operation: metadata.operation,
          code,
          meta,
        });
        return new InternalServerErrorException('数据库操作失败');
    }
  }

  /**
   * 记录性能指标
   */
  private logPerformanceMetrics(
    metadata: DatabaseOperationMetadata,
    duration: number,
    success: boolean,
  ): void {
    const performanceData = {
      operation: metadata.operation,
      tables: metadata.tables,
      type: metadata.type,
      duration,
      success,
      timestamp: new Date().toISOString(),
    };

    // 性能警告阈值
    const warningThresholds = {
      read: 1000,    // 1秒
      write: 2000,   // 2秒
      delete: 3000,  // 3秒
      batch: 5000,   // 5秒
    };

    const threshold = warningThresholds[metadata.type];
    if (duration > threshold) {
      this.logger.warn(`数据库操作性能警告: ${metadata.operation}`, performanceData);
    } else {
      this.logger.debug('数据库操作性能', performanceData);
    }
  }

  /**
   * 获取结果大小（用于性能监控）
   */
  private getResultSize(result: any): number {
    if (!result) return 0;
    if (Array.isArray(result)) return result.length;
    if (typeof result === 'object') return Object.keys(result).length;
    return 1;
  }

  /**
   * 生成操作ID
   */
  private generateOperationId(): string {
    return `db_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}
