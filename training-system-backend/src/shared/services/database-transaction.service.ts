import { Injectable } from '@nestjs/common';
import { PrismaService } from '../infrastructure/database/prisma.service';
import { LoggerService } from '../infrastructure/logger/logger.service';

export interface TransactionOptions {
  /** 事务名称，用于日志记录 */
  name: string;
  /** 超时时间（毫秒），默认30秒 */
  timeout?: number;
  /** 最大重试次数，默认3次 */
  maxRetries?: number;
  /** 重试间隔（毫秒），默认1秒 */
  retryDelay?: number;
  /** 是否记录详细日志 */
  verbose?: boolean;
}

@Injectable()
export class DatabaseTransactionService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly logger: LoggerService,
  ) {}

  /**
   * 执行事务操作
   */
  async executeTransaction<T>(
    operation: (tx: any) => Promise<T>,
    options: TransactionOptions,
  ): Promise<T> {
    const {
      name,
      timeout = 30000,
      maxRetries = 3,
      retryDelay = 1000,
      verbose = false,
    } = options;

    const startTime = Date.now();
    const transactionId = this.generateTransactionId();

    if (verbose) {
      this.logger.info(`事务开始: ${name}`, {
        transactionId,
        timeout,
        maxRetries,
      });
    }

    let lastError: Error;
    let attempt = 0;

    while (attempt <= maxRetries) {
      attempt++;
      
      try {
        if (verbose && attempt > 1) {
          this.logger.info(`事务重试: ${name} (第${attempt}次尝试)`, {
            transactionId,
            attempt,
            previousError: lastError?.message,
          });
        }

        const result = await this.prisma.$transaction(
          async (tx) => {
            try {
              return await operation(tx);
            } catch (error) {
              if (verbose) {
                this.logger.error(`事务操作失败: ${name}`, error, {
                  transactionId,
                  attempt,
                });
              }
              throw error;
            }
          },
          {
            timeout,
            maxWait: timeout,
          },
        );

        const duration = Date.now() - startTime;
        
        if (verbose) {
          this.logger.info(`事务成功: ${name}`, {
            transactionId,
            duration,
            attempts: attempt,
          });
        }

        return result;

      } catch (error) {
        lastError = error as Error;
        const duration = Date.now() - startTime;

        // 记录错误
        this.logger.error(`事务失败: ${name} (第${attempt}次尝试)`, error, {
          transactionId,
          attempt,
          duration,
          willRetry: attempt <= maxRetries,
        });

        // 如果是最后一次尝试，抛出异常
        if (attempt > maxRetries) {
          this.logger.error(`事务最终失败: ${name}`, lastError, {
            transactionId,
            totalAttempts: attempt,
            totalDuration: duration,
          });
          
          throw this.wrapTransactionError(lastError, name, attempt);
        }

        // 等待后重试
        if (retryDelay > 0) {
          await this.sleep(retryDelay);
        }
      }
    }

    // 这里不应该到达，但为了类型安全
    throw lastError;
  }

  /**
   * 批量操作事务
   */
  async executeBatchTransaction<T>(
    operations: Array<{
      name: string;
      operation: (tx: any) => Promise<T>;
    }>,
    options: Omit<TransactionOptions, 'name'> & { name: string },
  ): Promise<T[]> {
    const { name } = options;
    
    return this.executeTransaction(
      async (tx) => {
        const results: T[] = [];
        
        for (const { name: opName, operation } of operations) {
          this.logger.debug(`执行批量操作: ${opName}`, {
            transactionName: name,
          });
          
          const result = await operation(tx);
          results.push(result);
        }
        
        return results;
      },
      options,
    );
  }

  /**
   * 读写分离事务（先读后写）
   */
  async executeReadWriteTransaction<R, W>(
    readOperation: (tx: any) => Promise<R>,
    writeOperation: (tx: any, readResult: R) => Promise<W>,
    options: TransactionOptions,
  ): Promise<{ readResult: R; writeResult: W }> {
    return this.executeTransaction(
      async (tx) => {
        // 先执行读操作
        const readResult = await readOperation(tx);
        
        // 基于读结果执行写操作
        const writeResult = await writeOperation(tx, readResult);
        
        return { readResult, writeResult };
      },
      options,
    );
  }

  /**
   * 条件事务（基于条件决定是否执行）
   */
  async executeConditionalTransaction<T>(
    condition: (tx: any) => Promise<boolean>,
    operation: (tx: any) => Promise<T>,
    options: TransactionOptions,
  ): Promise<T | null> {
    return this.executeTransaction(
      async (tx) => {
        const shouldExecute = await condition(tx);
        
        if (!shouldExecute) {
          this.logger.debug(`条件不满足，跳过事务: ${options.name}`);
          return null;
        }
        
        return await operation(tx);
      },
      options,
    );
  }

  /**
   * 安全删除事务（检查关联后删除）
   */
  async executeSafeDeleteTransaction(
    tableName: string,
    id: string,
    checkAssociations: (tx: any) => Promise<boolean>,
    deleteOperation: (tx: any) => Promise<any>,
    options: TransactionOptions,
  ): Promise<any> {
    return this.executeTransaction(
      async (tx) => {
        // 检查是否有关联数据
        const hasAssociations = await checkAssociations(tx);
        
        if (hasAssociations) {
          throw new Error(`无法删除 ${tableName} 记录 ${id}，存在关联数据`);
        }
        
        // 执行删除
        return await deleteOperation(tx);
      },
      {
        ...options,
        name: `${options.name}_safe_delete`,
      },
    );
  }

  /**
   * 包装事务错误
   */
  private wrapTransactionError(error: Error, transactionName: string, attempts: number): Error {
    const message = `事务 ${transactionName} 执行失败 (尝试${attempts}次): ${error.message}`;
    
    // 保持原始错误类型
    if (error.constructor !== Error) {
      const wrappedError = Object.create(error.constructor.prototype);
      Object.assign(wrappedError, error);
      wrappedError.message = message;
      return wrappedError;
    }
    
    const wrappedError = new Error(message);
    wrappedError.stack = error.stack;
    return wrappedError;
  }

  /**
   * 生成事务ID
   */
  private generateTransactionId(): string {
    return `tx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * 延迟函数
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
