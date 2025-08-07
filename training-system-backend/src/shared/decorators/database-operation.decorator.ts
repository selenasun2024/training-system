import { applyDecorators, SetMetadata } from '@nestjs/common';

/**
 * 数据库操作元数据
 */
export interface DatabaseOperationMetadata {
  /** 操作名称 */
  operation: string;
  /** 涉及的表名 */
  tables: string[];
  /** 是否需要事务 */
  transaction?: boolean;
  /** 操作类型 */
  type: 'read' | 'write' | 'delete' | 'batch';
  /** 是否记录性能日志 */
  logPerformance?: boolean;
  /** 超时时间（毫秒） */
  timeout?: number;
}

export const DATABASE_OPERATION_METADATA = 'database_operation_metadata';

/**
 * 数据库操作装饰器
 * 用于标记需要事务管理和异常处理的数据库操作
 */
export function DatabaseOperation(metadata: DatabaseOperationMetadata) {
  return applyDecorators(
    SetMetadata(DATABASE_OPERATION_METADATA, metadata)
  );
}

// 便捷装饰器
export const ReadOperation = (operation: string, tables: string[]) =>
  DatabaseOperation({
    operation,
    tables,
    type: 'read',
    logPerformance: true
  });

export const WriteOperation = (operation: string, tables: string[], useTransaction = true) =>
  DatabaseOperation({
    operation,
    tables,
    type: 'write',
    transaction: useTransaction,
    logPerformance: true
  });

export const BatchOperation = (operation: string, tables: string[]) =>
  DatabaseOperation({
    operation,
    tables,
    type: 'batch',
    transaction: true,
    logPerformance: true,
    timeout: 30000 // 30秒超时
  });

export const DeleteOperation = (operation: string, tables: string[]) =>
  DatabaseOperation({
    operation,
    tables,
    type: 'delete',
    transaction: true,
    logPerformance: true
  });
