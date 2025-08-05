import request from '@/utils/request';

export interface LoginDto {
  username: string;
  password: string;
}

export interface RegisterDto {
  username: string;
  password: string;
  email: string;
  realName: string;
}

export interface AuthResult {
  token: string;
  user: {
    id: string;
    username: string;
    email: string;
    realName: string;
    roles: string[];
    status: string;
  };
}

export interface UserProfile {
  id: string;
  username: string;
  email: string;
  realName: string;
  roles: string[];
  status: string;
  createdAt: string;
  lastLoginAt?: string;
}

// 登录
export const login = (data: LoginDto): Promise<AuthResult> => {
  return request.post('/api/auth/login', data);
};

// 注册
export const register = (data: RegisterDto): Promise<AuthResult> => {
  return request.post('/api/auth/register', data);
};

// 获取用户信息
export const getUserProfile = (): Promise<UserProfile> => {
  return request.get('/api/auth/profile');
};

// 修改密码
export const changePassword = (data: { currentPassword: string; newPassword: string }) => {
  return request.put('/api/auth/password', data);
};

// 登出
export const logout = () => {
  return request.post('/api/auth/logout');
}; 