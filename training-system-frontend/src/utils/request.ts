import axios from 'axios'
import type { AxiosInstance, InternalAxiosRequestConfig, AxiosResponse, AxiosError } from 'axios'
import { ElMessage } from 'element-plus'
import logger, { logApi } from './logger'

interface ApiResponse<T = any> {
  code: number
  message?: string
  data: T
}

interface ErrorResponse {
  message?: string
  [key: string]: any
}

// 创建axios实例
const service: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000',
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json'
  }
})

// 请求拦截器
service.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // 从localStorage获取token
    const token = localStorage.getItem('token')
    
    // 开发环境：如果没有token则设置开发用户身份
    if (!token && import.meta.env.DEV) {
      // 开发环境默认用户配置
      if (!localStorage.getItem('userId')) {
        const devUserConfig = {
          userId: 'user-hr-001',
          username: 'feng-qin', 
          name: '冯芹',
          userRole: 'counselor'
        }
        
        Object.entries(devUserConfig).forEach(([key, value]) => {
          localStorage.setItem(key, value)
        })
        
        localStorage.setItem('token', 'dev-test-token')
      }
    }
    
    // 添加认证头
    const authToken = localStorage.getItem('token')
    if (authToken && config.headers) {
      config.headers['Authorization'] = `Bearer ${authToken}`
    }
    
          // 记录API请求日志
      logger.debug('API请求发送', {
        url: config.url,
        method: config.method?.toUpperCase(),
        hasAuth: !!authToken,
        baseURL: config.baseURL
      })
    
    return config
  },
  (error: AxiosError) => {
    logger.error('请求拦截器错误', error, {
      url: error.config?.url,
      method: error.config?.method?.toUpperCase()
    })
    return Promise.reject(error)
  }
)

// 响应拦截器
service.interceptors.response.use(
  (response: AxiosResponse) => {
    const res = response.data
    const { status, config } = response

    // 记录API响应日志
    logApi(
      config.method?.toUpperCase() || 'UNKNOWN',
      config.url || 'unknown',
      status,
      {
        responseSize: JSON.stringify(res).length,
        hasBusinessCode: res && typeof res === 'object' && 'code' in res
      }
    )

    // 处理两种响应格式：
    // 1. 标准格式: {code: 200, message: 'xx', data: {...}}
    // 2. 直接数据: [...] 或 {...}
    
    // 如果响应有code字段，说明是标准格式
    if (res && typeof res === 'object' && 'code' in res) {
      // 检查业务状态码
      if (res.code !== 200 && res.code !== 201) {
        const errorMessage = res.message || '请求失败';
        
        // 记录业务错误
        logger.warn('API业务错误', {
          url: config.url,
          method: config.method?.toUpperCase(),
          businessCode: res.code,
          message: errorMessage
        })
        
        ElMessage({
          type: 'error',
          message: errorMessage
        });
        return Promise.reject(new Error(errorMessage))
      }
      // 返回data字段的内容
      return res.data
    }
    
    // 否则直接返回响应数据（如数组或对象）
    return res
  },
  (error: AxiosError<ErrorResponse>) => {
    // 记录HTTP错误
    logger.error('HTTP响应错误', error, {
      url: error.config?.url,
      method: error.config?.method?.toUpperCase(),
      status: error.response?.status,
      statusText: error.response?.statusText
    })
    
    let message = '请求失败';
    
    // 处理不同格式的错误响应
    if (error.response?.data) {
      const errorData = error.response.data;
      
      if (typeof errorData === 'string') {
        message = errorData;
      } else if (errorData.message) {
        message = errorData.message;
      } else if (Array.isArray(errorData)) {
        // 处理验证错误数组
        message = errorData.join(', ');
      }
    } else if (error.message) {
      message = error.message;
    }
    
    // 确保消息是字符串类型
    if (typeof message !== 'string') {
      message = '请求失败';
    }
    
    ElMessage({
      type: 'error',
      message: message
    });
    
    return Promise.reject(error)
  }
)

const request = {
  get<T = any>(url: string, config?: InternalAxiosRequestConfig): Promise<T> {
    return service.get(url, config)
  },

  post<T = any>(url: string, data?: any, config?: InternalAxiosRequestConfig): Promise<T> {
    return service.post(url, data, config)
  },

  put<T = any>(url: string, data?: any, config?: InternalAxiosRequestConfig): Promise<T> {
    return service.put(url, data, config)
  },

  patch<T = any>(url: string, data?: any, config?: InternalAxiosRequestConfig): Promise<T> {
    return service.patch(url, data, config)
  },

  delete<T = any>(url: string, config?: InternalAxiosRequestConfig): Promise<T> {
    return service.delete(url, config)
  }
}

export default request 