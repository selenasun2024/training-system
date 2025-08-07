import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Injectable,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { LoggerService } from '../infrastructure/logger/logger.service';

@Injectable()
@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  constructor(private readonly logger: LoggerService) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    // 确定HTTP状态码
    const status = exception instanceof HttpException 
      ? exception.getStatus() 
      : HttpStatus.INTERNAL_SERVER_ERROR;

    // 获取错误信息
    let message: string;
    let errorCode: string;

    if (exception instanceof HttpException) {
      const errorResponse = exception.getResponse();
      if (typeof errorResponse === 'string') {
        message = errorResponse;
        errorCode = 'HTTP_EXCEPTION';
      } else if (typeof errorResponse === 'object' && errorResponse !== null) {
        const errorObj = errorResponse as any;
        message = errorObj.message || errorObj.error || '请求处理失败';
        errorCode = errorObj.code || 'HTTP_EXCEPTION';
      } else {
        message = '请求处理失败';
        errorCode = 'HTTP_EXCEPTION';
      }
    } else if (exception instanceof Error) {
      message = status === HttpStatus.INTERNAL_SERVER_ERROR 
        ? '服务器内部错误' 
        : exception.message;
      errorCode = 'INTERNAL_ERROR';
    } else {
      message = '未知错误';
      errorCode = 'UNKNOWN_ERROR';
    }

    // 记录日志
    const logContext = {
      requestId: (request as any).id || this.generateRequestId(),
      userId: (request as any).user?.userId,
      ip: this.getClientIp(request),
      userAgent: request.get('User-Agent'),
      method: request.method,
      url: request.url,
      statusCode: status,
      errorCode,
    };

    if (status >= 500) {
      // 服务器错误 - 记录详细错误信息
      this.logger.error(
        `服务器错误: ${message}`,
        exception instanceof Error ? exception.stack : undefined,
        logContext
      );
    } else if (status === 401 || status === 403) {
      // 认证授权失败 - 记录安全日志
      this.logger.security(`认证授权失败: ${message}`, logContext);
    } else {
      // 客户端错误
      this.logger.warn(`客户端错误: ${message}`, logContext);
    }

    // 构造响应
    const errorResponse = {
      code: status,
      message: this.getSafeErrorMessage(message, status),
      timestamp: new Date().toISOString(),
      path: request.url,
      ...(process.env.NODE_ENV !== 'production' && {
        errorCode,
        requestId: logContext.requestId,
      }),
    };

    response.status(status).json(errorResponse);
  }

  /**
   * 获取安全的错误信息（避免敏感信息泄露）
   */
  private getSafeErrorMessage(message: string, status: number): string {
    // 生产环境下隐藏敏感错误信息
    if (process.env.NODE_ENV === 'production') {
      if (status >= 500) {
        return '服务器内部错误，请稍后重试';
      }
      
      // 避免暴露技术细节
      const sanitizedMessage = message
        .replace(/database|sql|query|prisma/gi, '数据')
        .replace(/server|internal|stack/gi, '系统')
        .replace(/error|exception|failed/gi, '异常');
        
      return sanitizedMessage;
    }
    
    return message;
  }

  /**
   * 获取客户端真实IP
   */
  private getClientIp(request: Request): string {
    const forwarded = request.get('X-Forwarded-For');
    if (forwarded) {
      return forwarded.split(',')[0].trim();
    }
    
    return request.get('X-Real-IP') || 
           request.get('X-Client-IP') || 
           request.connection.remoteAddress || 
           request.ip || 
           'unknown';
  }

  /**
   * 生成请求ID
   */
  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}
