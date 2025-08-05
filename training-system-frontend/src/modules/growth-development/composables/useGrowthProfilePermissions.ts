// 成长档案权限控制 Composable

import { ref, computed, watch, type Ref } from 'vue';
import { ElMessage } from 'element-plus';
import type { GrowthProfile, GrowthProfilePermission, UserProfile } from '@/types';

export interface PermissionConfig {
  // 基础权限
  canView: boolean;
  canEdit: boolean;
  canComment: boolean;
  canShare: boolean;
  canDownload: boolean;
  
  // 详细权限
  sections: {
    basicInfo: boolean;
    timeline: boolean;
    skills: boolean;
    achievements: boolean;
    feedback: boolean;
    goals: boolean;
    statistics: boolean;
  };
}

export function useGrowthProfilePermissions(
  profile: Ref<GrowthProfile | null>,
  currentUser: Ref<UserProfile | null>
) {
  const permissions = ref<GrowthProfilePermission[]>([]);
  const loading = ref(false);
  const error = ref<string | null>(null);

  // 当前用户的权限配置
  const currentUserPermission = computed(() => {
    if (!profile.value || !currentUser.value) return null;
    
    // 如果是档案所有者，拥有所有权限
    if (profile.value.userId === currentUser.value.id) {
      return {
        role: 'owner',
        permissions: {
          view: true,
          edit: true,
          comment: true,
          share: true,
          download: true
        }
      } as GrowthProfilePermission;
    }
    
    // 查找当前用户的权限记录
    return permissions.value.find(p => p.userId === currentUser.value!.id) || null;
  });

  // 权限配置
  const permissionConfig = computed((): PermissionConfig => {
    const defaultConfig: PermissionConfig = {
      canView: false,
      canEdit: false,
      canComment: false,
      canShare: false,
      canDownload: false,
      sections: {
        basicInfo: false,
        timeline: false,
        skills: false,
        achievements: false,
        feedback: false,
        goals: false,
        statistics: false
      }
    };

    if (!currentUserPermission.value || !currentUser.value) {
      return defaultConfig;
    }

    const permission = currentUserPermission.value;
    const userRole = currentUser.value.roles?.[0]?.name;

    // 基础权限
    const config: PermissionConfig = {
      canView: permission.permissions.view,
      canEdit: permission.permissions.edit,
      canComment: permission.permissions.comment,
      canShare: permission.permissions.share,
      canDownload: permission.permissions.download,
      sections: {
        basicInfo: permission.permissions.view,
        timeline: permission.permissions.view,
        skills: permission.permissions.view,
        achievements: permission.permissions.view,
        feedback: false,
        goals: false,
        statistics: false
      }
    };

    // 根据角色细化权限
    switch (permission.role) {
      case 'owner':
        // 档案所有者：全部权限
        Object.keys(config.sections).forEach(key => {
          config.sections[key as keyof typeof config.sections] = true;
        });
        config.canEdit = true;
        config.canComment = true;
        config.canShare = true;
        config.canDownload = true;
        break;

      case 'mentor':
        // 导师：可查看和评论，部分编辑权限
        config.sections.feedback = true;
        config.sections.goals = true;
        config.sections.statistics = permission.permissions.view;
        config.canComment = true;
        break;

      case 'manager':
        // 管理者：可查看统计，添加反馈
        config.sections.feedback = true;
        config.sections.statistics = true;
        config.canComment = true;
        config.canDownload = userRole === 'manager' || userRole === 'hr';
        break;

      case 'hr':
        // HR：可查看全部，导出数据
        Object.keys(config.sections).forEach(key => {
          config.sections[key as keyof typeof config.sections] = true;
        });
        config.canDownload = true;
        config.canShare = true;
        break;

      case 'viewer':
        // 查看者：只能查看基础信息
        config.sections.feedback = false;
        config.sections.goals = false;
        break;
    }

    return config;
  });

  // 检查特定权限
  const hasPermission = (action: string, section?: string): boolean => {
    const config = permissionConfig.value;
    
    switch (action) {
      case 'view':
        return section ? config.sections[section as keyof typeof config.sections] : config.canView;
      case 'edit':
        return config.canEdit;
      case 'comment':
        return config.canComment;
      case 'share':
        return config.canShare;
      case 'download':
        return config.canDownload;
      default:
        return false;
    }
  };

  // 检查是否可以查看敏感信息
  const canViewSensitiveInfo = computed(() => {
    if (!currentUserPermission.value) return false;
    
    const role = currentUserPermission.value.role;
    return ['owner', 'manager', 'hr'].includes(role);
  });

  // 检查是否可以修改权限
  const canManagePermissions = computed(() => {
    if (!currentUserPermission.value) return false;
    
    const role = currentUserPermission.value.role;
    return ['owner', 'hr'].includes(role);
  });

  // 加载权限列表
  const loadPermissions = async (profileId: string) => {
    loading.value = true;
    error.value = null;
    
    try {
      // 这里应该调用API加载权限
      // const response = await growthProfileApi.getProfilePermissions(profileId);
      // permissions.value = response.data;
      
      // 模拟数据
      permissions.value = [
        {
          userId: 'mentor-1',
          profileId: profileId,
          role: 'mentor',
          permissions: {
            view: true,
            edit: false,
            comment: true,
            share: false,
            download: false
          },
          grantedAt: new Date(),
          grantedBy: 'system'
        }
      ];
    } catch (err) {
      error.value = '加载权限失败';
      console.error('Error loading permissions:', err);
    } finally {
      loading.value = false;
    }
  };

  // 授权权限
  const grantPermission = async (data: {
    userId: string;
    role: string;
    permissions: string[];
    expiresAt?: Date;
  }) => {
    try {
      // 这里应该调用API授权
      // await growthProfileApi.grantPermission(profile.value!.id, data);
      
      ElMessage.success('权限授权成功');
      
      // 重新加载权限
      if (profile.value) {
        await loadPermissions(profile.value.id);
      }
    } catch (err) {
      ElMessage.error('权限授权失败');
      console.error('Error granting permission:', err);
    }
  };

  // 撤销权限
  const revokePermission = async (userId: string) => {
    try {
      // 这里应该调用API撤销权限
      // await growthProfileApi.revokePermission(profile.value!.id, userId);
      
      ElMessage.success('权限撤销成功');
      
      // 重新加载权限
      if (profile.value) {
        await loadPermissions(profile.value.id);
      }
    } catch (err) {
      ElMessage.error('权限撤销失败');
      console.error('Error revoking permission:', err);
    }
  };

  // 检查数据脱敏
  const shouldMaskData = (dataType: string): boolean => {
    if (canViewSensitiveInfo.value) return false;
    
    // 定义需要脱敏的数据类型
    const sensitiveTypes = ['personal_feedback', 'salary_info', 'performance_score'];
    return sensitiveTypes.includes(dataType);
  };

  // 脱敏处理
  const maskSensitiveData = (data: any, type: string): any => {
    if (!shouldMaskData(type)) return data;
    
    switch (type) {
      case 'personal_feedback':
        return '***敏感信息已隐藏***';
      case 'performance_score':
        return '**';
      default:
        return data;
    }
  };

  // 权限检查装饰器
  const withPermissionCheck = (action: string, section?: string) => {
    return (fn: Function) => {
      return (...args: any[]) => {
        if (!hasPermission(action, section)) {
          ElMessage.warning('您没有执行此操作的权限');
          return;
        }
        return fn(...args);
      };
    };
  };

  // 监听档案变化，重新加载权限
  watch(
    () => profile.value?.id,
    (newProfileId) => {
      if (newProfileId) {
        loadPermissions(newProfileId);
      }
    },
    { immediate: true }
  );

  return {
    // 状态
    permissions,
    loading,
    error,
    
    // 计算属性
    currentUserPermission,
    permissionConfig,
    canViewSensitiveInfo,
    canManagePermissions,
    
    // 方法
    hasPermission,
    loadPermissions,
    grantPermission,
    revokePermission,
    shouldMaskData,
    maskSensitiveData,
    withPermissionCheck
  };
} 