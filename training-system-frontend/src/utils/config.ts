/**
 * 前端配置管理
 * 统一管理所有配置项，避免硬编码
 */

interface ApiConfig {
  baseURL: string;
  timeout: number;
}

interface AuthConfig {
  tokenKey: string;
  userIdKey: string;
  usernameKey: string;
  userRoleKey: string;
}

interface DevConfig {
  enableMock: boolean;
  defaultUser: {
    userId: string;
    username: string;
    name: string;
    userRole: string;
  };
}

interface AppConfig {
  api: ApiConfig;
  auth: AuthConfig;
  dev: DevConfig;
}

// 环境变量获取函数
const getEnvVar = (key: string, defaultValue?: string): string => {
  const value = import.meta.env[key];
  if (value === undefined || value === '') {
    if (defaultValue !== undefined) {
      return defaultValue;
    }
    throw new Error(`环境变量 ${key} 未设置`);
  }
  return value;
};

// 配置对象
export const config: AppConfig = {
  api: {
    baseURL: getEnvVar('VITE_API_BASE_URL', 'http://localhost:3000'),
    timeout: parseInt(getEnvVar('VITE_API_TIMEOUT', '15000'), 10),
  },
  
  auth: {
    tokenKey: 'token',
    userIdKey: 'userId', 
    usernameKey: 'username',
    userRoleKey: 'userRole',
  },
  
  dev: {
    enableMock: getEnvVar('VITE_ENABLE_MOCK', 'false') === 'true',
    defaultUser: {
      userId: getEnvVar('VITE_DEV_USER_ID', 'user-hr-001'),
      username: getEnvVar('VITE_DEV_USERNAME', 'feng-qin'),
      name: getEnvVar('VITE_DEV_NAME', '冯芹'),
      userRole: getEnvVar('VITE_DEV_ROLE', 'counselor'),
    },
  },
};

// 配置验证
export const validateConfig = (): void => {
  const errors: string[] = [];
  
  // 验证API配置
  if (!config.api.baseURL) {
    errors.push('API基础URL未配置');
  }
  
  if (config.api.timeout < 1000) {
    errors.push('API超时时间过短，最少1秒');
  }
  
  // 验证开发环境配置
  if (import.meta.env.DEV) {
    if (!config.dev.defaultUser.userId) {
      errors.push('开发环境默认用户ID未配置');
    }
  }
  
  if (errors.length > 0) {
    throw new Error(`配置验证失败: ${errors.join(', ')}`);
  }
};

// 安全获取配置（隐藏敏感信息）
export const getSafeConfig = () => {
  return {
    api: {
      baseURL: config.api.baseURL,
      timeout: config.api.timeout,
    },
    auth: {
      tokenKey: config.auth.tokenKey,
      // 不暴露具体的存储键名
    },
    dev: {
      enableMock: config.dev.enableMock,
      // 不暴露默认用户信息
    },
  };
};

// 导出常用配置
export const API_BASE_URL = config.api.baseURL;
export const API_TIMEOUT = config.api.timeout;
export const TOKEN_KEY = config.auth.tokenKey;
export const USER_ID_KEY = config.auth.userIdKey;
export const USERNAME_KEY = config.auth.usernameKey;
export const USER_ROLE_KEY = config.auth.userRoleKey;

// 开发环境配置
export const DEV_CONFIG = config.dev;

// 初始化配置
export const initConfig = (): void => {
  try {
    validateConfig();
    console.log('✅ 配置初始化成功');
    
    if (import.meta.env.DEV) {
      console.log('🔧 开发环境配置:', getSafeConfig());
    }
  } catch (error) {
    console.error('❌ 配置初始化失败:', error);
    throw error;
  }
};
