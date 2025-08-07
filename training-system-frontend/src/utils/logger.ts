/**
 * 前端统一日志管理工具
 * 提供开发环境调试和生产环境日志收集功能
 */

export interface LogContext {
  userId?: string
  module?: string
  action?: string
  component?: string
  extra?: Record<string, any>
}

export type LogLevel = 'debug' | 'info' | 'warn' | 'error'

export interface LogEntry {
  timestamp: string
  level: LogLevel
  message: string
  context?: LogContext
  stack?: string
}

class Logger {
  private isDevelopment: boolean
  private maxLocalLogs: number = 1000
  private logs: LogEntry[] = []

  constructor() {
    this.isDevelopment = import.meta.env.DEV
  }

  /**
   * 调试信息 - 仅开发环境输出
   */
  debug(message: string, context?: LogContext): void {
    if (this.isDevelopment) {
      console.log(`🐛 [DEBUG] ${message}`, context)
    }
    this.addLog('debug', message, context)
  }

  /**
   * 一般信息
   */
  info(message: string, context?: LogContext): void {
    if (this.isDevelopment) {
      console.log(`ℹ️ [INFO] ${message}`, context)
    }
    this.addLog('info', message, context)
  }

  /**
   * 警告信息
   */
  warn(message: string, context?: LogContext): void {
    if (this.isDevelopment) {
      console.warn(`⚠️ [WARN] ${message}`, context)
    }
    this.addLog('warn', message, context)
  }

  /**
   * 错误信息
   */
  error(message: string, error?: Error | any, context?: LogContext): void {
    const errorContext = {
      ...context,
      error: error?.message || String(error),
      stack: error?.stack
    }

    if (this.isDevelopment) {
      console.error(`❌ [ERROR] ${message}`, error, context)
    }

    this.addLog('error', message, errorContext, error?.stack)

    // 生产环境发送到日志服务
    if (!this.isDevelopment) {
      this.sendToLogService('error', message, errorContext)
    }
  }

  /**
   * API 请求日志
   */
  api(method: string, url: string, status?: number, context?: LogContext): void {
    const apiContext = {
      ...context,
      method,
      url,
      status
    }

    const message = `API ${method} ${url}${status ? ` - ${status}` : ''}`
    
    if (status && status >= 400) {
      this.warn(message, apiContext)
    } else {
      this.debug(message, apiContext)
    }
  }

  /**
   * 用户行为日志
   */
  userAction(action: string, component: string, context?: LogContext): void {
    const actionContext = {
      ...context,
      action,
      component,
      timestamp: new Date().toISOString()
    }

    this.info(`用户操作: ${action} in ${component}`, actionContext)

    // 生产环境可以发送用户行为分析
    if (!this.isDevelopment) {
      this.sendToAnalytics(action, component, actionContext)
    }
  }

  /**
   * 性能监控日志
   */
  performance(operation: string, duration: number, context?: LogContext): void {
    const perfContext = {
      ...context,
      operation,
      duration,
      unit: 'ms'
    }

    if (duration > 1000) {
      this.warn(`性能警告: ${operation} 耗时 ${duration}ms`, perfContext)
    } else {
      this.debug(`性能监控: ${operation} 耗时 ${duration}ms`, perfContext)
    }
  }

  /**
   * 安全相关日志
   */
  security(event: string, context?: LogContext): void {
    const securityContext = {
      ...context,
      event,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href
    }

    this.warn(`安全事件: ${event}`, securityContext)

    // 安全事件立即发送到服务器
    this.sendToLogService('security', event, securityContext)
  }

  /**
   * 添加日志到本地存储
   */
  private addLog(level: LogLevel, message: string, context?: LogContext, stack?: string): void {
    const logEntry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      context,
      stack
    }

    this.logs.push(logEntry)

    // 限制本地日志数量
    if (this.logs.length > this.maxLocalLogs) {
      this.logs = this.logs.slice(-this.maxLocalLogs)
    }

    // 存储到 localStorage (仅保留最近的日志)
    try {
      const recentLogs = this.logs.slice(-100) // 只保留最近100条
      localStorage.setItem('app_logs', JSON.stringify(recentLogs))
    } catch (error) {
      // localStorage 可能已满，忽略错误
    }
  }

  /**
   * 发送日志到远程服务
   */
  private async sendToLogService(level: string, message: string, context?: any): Promise<void> {
    try {
      // 这里可以集成实际的日志服务 (如 Sentry, LogRocket 等)
      // 当前仅在开发环境模拟
      if (this.isDevelopment) {
        console.log(`📤 发送日志到服务器:`, { level, message, context })
        return
      }

      // 生产环境实际发送逻辑
      // await fetch('/api/logs', {
      //   method: 'POST',
      //   headers: {
      //     'Content-Type': 'application/json',
      //   },
      //   body: JSON.stringify({
      //     level,
      //     message,
      //     context,
      //     timestamp: new Date().toISOString(),
      //     url: window.location.href,
      //     userAgent: navigator.userAgent
      //   })
      // })
    } catch (error) {
      // 发送失败时不应该影响应用运行
      console.error('发送日志失败:', error)
    }
  }

  /**
   * 发送用户行为分析数据
   */
  private async sendToAnalytics(action: string, component: string, context?: any): Promise<void> {
    try {
      // 这里可以集成分析服务 (如 Google Analytics, 百度统计等)
      if (this.isDevelopment) {
        console.log(`📊 发送分析数据:`, { action, component, context })
      }
    } catch (error) {
      console.error('发送分析数据失败:', error)
    }
  }

  /**
   * 获取本地日志
   */
  getLogs(level?: LogLevel): LogEntry[] {
    if (level) {
      return this.logs.filter(log => log.level === level)
    }
    return [...this.logs]
  }

  /**
   * 清除本地日志
   */
  clearLogs(): void {
    this.logs = []
    localStorage.removeItem('app_logs')
  }

  /**
   * 导出日志为JSON
   */
  exportLogs(): string {
    return JSON.stringify(this.logs, null, 2)
  }

  /**
   * 从localStorage恢复日志
   */
  restoreLogs(): void {
    try {
      const storedLogs = localStorage.getItem('app_logs')
      if (storedLogs) {
        this.logs = JSON.parse(storedLogs)
      }
    } catch (error) {
      console.error('恢复日志失败:', error)
    }
  }
}

// 创建全局日志实例
const logger = new Logger()

// 恢复之前的日志
logger.restoreLogs()

// 监听未捕获的错误
window.addEventListener('error', (event) => {
  logger.error('未捕获的错误', event.error, {
    filename: event.filename,
    lineno: event.lineno,
    colno: event.colno
  })
})

// 监听未处理的Promise拒绝
window.addEventListener('unhandledrejection', (event) => {
  logger.error('未处理的Promise拒绝', event.reason, {
    type: 'unhandledrejection'
  })
})

export default logger

// 导出便捷方法
export const logUserAction = (action: string, component: string, context?: LogContext) => {
  logger.userAction(action, component, context)
}

export const logApi = (method: string, url: string, status?: number, context?: LogContext) => {
  logger.api(method, url, status, context)
}

export const logPerformance = (operation: string, duration: number, context?: LogContext) => {
  logger.performance(operation, duration, context)
}

export const logSecurity = (event: string, context?: LogContext) => {
  logger.security(event, context)
}
