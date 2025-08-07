import { Injectable, LoggerService as NestLoggerService } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as winston from 'winston';
import { createLogger, format, transports } from 'winston';

export enum LogLevel {
  SECURITY = 'security',
  ERROR = 'error', 
  WARN = 'warn',
  INFO = 'info',
  DEBUG = 'debug'
}

export interface LogContext {
  userId?: string;
  requestId?: string;
  ip?: string;
  userAgent?: string;
  action?: string;
  resource?: string;
  [key: string]: any;
}

@Injectable()
export class LoggerService {
  private logger: winston.Logger;
  private readonly isProduction: boolean;

  constructor(private readonly configService: ConfigService) {
    this.isProduction = this.configService.get('NODE_ENV') === 'production';
    this.initializeLogger();
  }

  private initializeLogger() {
    // 自定义日志级别
    const customLevels = {
      levels: {
        security: 0,
        error: 1,
        warn: 2,
        info: 3,
        debug: 4
      },
      colors: {
        security: 'red',
        error: 'red',
        warn: 'yellow',
        info: 'cyan',
        debug: 'green'
      }
    };

    // 日志格式化
    const logFormat = format.combine(
      format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
      format.errors({ stack: true }),
      format.json(),
      format.printf(({ timestamp, level, message, stack, context }) => {
        const logObject = {
          timestamp,
          level: level.toUpperCase(),
          message,
          ...(context && { context }),
          ...(stack && { stack })
        };
        return JSON.stringify(logObject);
      })
    );

    // 配置传输器
    const logTransports: winston.transport[] = [
      // 安全日志 - 单独文件
      new transports.File({
        filename: 'logs/security.log',
        level: 'security',
        maxsize: 10 * 1024 * 1024, // 10MB
        maxFiles: 10,
        format: logFormat
      }),
      // 错误日志
      new transports.File({
        filename: 'logs/error.log',
        level: 'error',
        maxsize: 10 * 1024 * 1024,
        maxFiles: 10,
        format: logFormat
      }),
      // 综合日志
      new transports.File({
        filename: 'logs/combined.log',
        maxsize: 10 * 1024 * 1024,
        maxFiles: 15,
        format: logFormat
      })
    ];

    // 开发环境添加控制台输出
    if (!this.isProduction) {
      logTransports.push(
        new transports.Console({
          format: format.combine(
            format.colorize(),
            format.simple(),
            format.printf(({ timestamp, level, message, context }) => {
              const contextStr = context ? ` [Context: ${JSON.stringify(context)}]` : '';
              return `${timestamp} [${level}] ${message}${contextStr}`;
            })
          )
        })
      );
    }

    this.logger = createLogger({
      levels: customLevels.levels,
      level: this.isProduction ? 'info' : 'debug',
      format: logFormat,
      transports: logTransports,
      // 防止未捕获异常导致进程退出
      exitOnError: false
    });

    winston.addColors(customLevels.colors);
  }

  /**
   * 安全相关日志 - 最高优先级
   */
  security(message: string, context?: LogContext): void {
    this.logger.log('security', message, { context });
  }

  /**
   * 错误日志
   */
  error(message: string, stack?: string, context?: LogContext): void {
    this.logger.error(message, { stack, context });
  }

  /**
   * 警告日志
   */
  warn(message: string, context?: LogContext): void {
    this.logger.warn(message, { context });
  }

  /**
   * 信息日志
   */
  info(message: string, context?: LogContext): void {
    this.logger.info(message, { context });
  }

  /**
   * 调试日志 - 仅开发环境
   */
  debug(message: string, context?: LogContext): void {
    if (!this.isProduction) {
      this.logger.debug(message, { context });
    }
  }

  /**
   * 记录API请求
   */
  logApiRequest(method: string, url: string, context: LogContext): void {
    this.info(`API请求: ${method} ${url}`, context);
  }

  /**
   * 记录API响应
   */
  logApiResponse(method: string, url: string, statusCode: number, duration: number, context?: LogContext): void {
    const level = statusCode >= 400 ? 'warn' : 'info';
    this[level](`API响应: ${method} ${url} - ${statusCode} (${duration}ms)`, context);
  }

  /**
   * 记录认证事件
   */
  logAuthEvent(event: 'login_success' | 'login_failure' | 'logout' | 'token_refresh' | 'unauthorized_access', context: LogContext): void {
    this.security(`认证事件: ${event}`, context);
  }

  /**
   * 记录数据库操作
   */
  logDatabaseOperation(operation: string, table: string, context?: LogContext): void {
    this.info(`数据库操作: ${operation} on ${table}`, context);
  }

  /**
   * 记录业务异常
   */
  logBusinessException(operation: string, error: Error, context?: LogContext): void {
    this.error(`业务异常 in ${operation}: ${error.message}`, error.stack, context);
  }

  /**
   * 获取logger实例 (仅特殊情况使用)
   */
  getLogger(): winston.Logger {
    return this.logger;
  }
}
