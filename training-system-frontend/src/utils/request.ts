import axios from 'axios'
import type { AxiosInstance, InternalAxiosRequestConfig, AxiosResponse, AxiosError } from 'axios'
import { ElMessage } from 'element-plus'

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
    let token = localStorage.getItem('token')
    
    // 临时解决方案：使用数据库中真实存在的辅导员身份用于测试
    if (!token) {
      localStorage.setItem('token', 'temp-test-token')
      token = 'temp-test-token'
    }
    
    // 【开发环境配置】设置为辅导员身份，用于辅导员工作台、批阅功能等
    // 注意：学习中心会使用自己的用户配置（PersonalCenter.vue中的DEV_USER_CONFIG）
    if (!localStorage.getItem('userId')) {
      localStorage.setItem('userId', 'user-hr-001') // 冯芹辅导员
      localStorage.setItem('username', 'feng-qin')
      localStorage.setItem('name', '冯芹')
      localStorage.setItem('userRole', 'counselor') // 辅导员角色
    }
    
    // 临时关闭认证：注释掉Authorization头的添加
    // if (token && config.headers) {
    //   config.headers['Authorization'] = `Bearer ${token}`
    // }
    
    console.log('🔍 请求配置:', {
      url: config.url,
      method: config.method,
      headers: config.headers
    })
    
    return config
  },
  (error: AxiosError) => {
    console.error('Request error:', error)
    return Promise.reject(error)
  }
)

// 响应拦截器
service.interceptors.response.use(
  (response: AxiosResponse) => {
    const res = response.data

    // 处理两种响应格式：
    // 1. 标准格式: {code: 200, message: 'xx', data: {...}}
    // 2. 直接数据: [...] 或 {...}
    
    // 如果响应有code字段，说明是标准格式
    if (res && typeof res === 'object' && 'code' in res) {
      // 检查业务状态码
      if (res.code !== 200 && res.code !== 201) {
        const errorMessage = res.message || '请求失败';
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
    console.error('Response error:', error)
    
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