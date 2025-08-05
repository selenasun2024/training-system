import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export interface CurrentUser {
  userId: string;
  username: string;
  email: string;
  name: string;
  department: string | null;
  position: string | null;
  roles: Array<{
    name: string;
    projectId: string | null;
  }>;
}

export const GetCurrentUser = createParamDecorator(
  (data: keyof CurrentUser | undefined, ctx: ExecutionContext): CurrentUser | any => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user as CurrentUser;

    // 如果指定了特定字段，返回该字段的值
    if (data) {
      return user?.[data];
    }

    // 否则返回完整的用户对象
    return user;
  },
);

// 便捷装饰器：只获取用户ID
export const GetCurrentUserId = createParamDecorator(
  (_: unknown, ctx: ExecutionContext): string => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user as CurrentUser;
    return user?.userId;
  },
);

// 便捷装饰器：获取用户角色
export const GetCurrentUserRoles = createParamDecorator(
  (_: unknown, ctx: ExecutionContext): CurrentUser['roles'] => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user as CurrentUser;
    return user?.roles || [];
  },
); 