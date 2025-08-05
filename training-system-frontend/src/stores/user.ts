import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { getUserProfile, logout as logoutApi } from '@/api/modules/auth';

export const useUserStore = defineStore('user', () => {
  // 用户信息
  const userInfo = ref({
    id: '',
    name: '',
    role: 'student',
    department: '',
    email: '',
    avatar: '',
    permissions: [] as string[]
  });

  // 是否已登录
  const isLoggedIn = ref(false);

  // 计算属性
  const userId = computed(() => userInfo.value.id);
  const userName = computed(() => userInfo.value.name);
  const userRole = computed(() => userInfo.value.role);
  const userDepartment = computed(() => userInfo.value.department);
  
  // 权限检查
  const hasPermission = computed(() => (permission: string) => {
    return userInfo.value.permissions.includes(permission);
  });

  // 是否为管理员
  const isAdmin = computed(() => {
    return ['admin', 'manager', 'hr', 'academic'].includes(userInfo.value.role);
  });

  // 是否为导师
  const isMentor = computed(() => {
    return ['mentor', 'manager', 'hr', 'academic'].includes(userInfo.value.role);
  });

  // 方法
  const setUserInfo = (info: Partial<typeof userInfo.value>) => {
    userInfo.value = { ...userInfo.value, ...info };
  };

  const setUserRole = (role: string) => {
    userInfo.value.role = role;
  };

  const login = (info: any) => {
    setUserInfo(info);
    isLoggedIn.value = true;
  };

  const logout = async () => {
    try {
      await logoutApi();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      userInfo.value = {
        id: '',
        name: '',
        role: 'student',
        department: '',
        email: '',
        avatar: '',
        permissions: []
      };
      isLoggedIn.value = false;
      localStorage.removeItem('token');
    }
  };

  // 初始化用户信息
  const initUser = async () => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const profile = await getUserProfile();
        userInfo.value = {
          id: profile.id,
          name: profile.realName,
          role: profile.roles[0] || 'student',
          department: '默认部门',
          email: profile.email,
          avatar: '',
          permissions: profile.roles
        };
        isLoggedIn.value = true;
      } catch (error) {
        console.error('Get user profile error:', error);
        
        // Fallback: 从localStorage获取用户信息
        const userId = localStorage.getItem('userId');
        const username = localStorage.getItem('username');
        const userRole = localStorage.getItem('userRole');
        
        if (userId && username) {
          console.log('🔄 使用localStorage的用户信息作为fallback');
          userInfo.value = {
            id: userId,
            name: username,
            role: userRole || 'student',
            department: '默认部门',
            email: `${username}@training.com`,
            avatar: '',
            permissions: userRole ? [userRole] : []
          };
          isLoggedIn.value = true;
        } else {
          localStorage.removeItem('token');
        }
      }
    }
  };

  return {
    userInfo,
    isLoggedIn,
    userId,
    userName,
    userRole,
    userDepartment,
    hasPermission,
    isAdmin,
    isMentor,
    setUserInfo,
    setUserRole,
    login,
    logout,
    initUser
  };
}); 